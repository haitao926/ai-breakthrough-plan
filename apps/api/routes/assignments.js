const { createAssignmentRepository } = require('../repositories/assignments');

const assignmentParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'integer', minimum: 1 }
  }
};

const submissionParamsSchema = {
  type: 'object',
  required: ['id', 'submissionId'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    submissionId: { type: 'integer', minimum: 1 }
  }
};

const assignmentBodySchema = {
  type: 'object',
  required: ['courseId', 'title'],
  properties: {
    courseId: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$' },
    lessonId: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$' },
    title: { type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string', maxLength: 4000 },
    requirements: { type: 'string', maxLength: 8000 },
    dueAt: { type: 'string', maxLength: 80 },
    submitType: { type: 'string', maxLength: 80 },
    rubric: { type: 'array' },
    status: { type: 'string', maxLength: 40 }
  },
  additionalProperties: true
};

const assignmentQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    courseId: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$' },
    lessonId: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$' },
    status: { type: 'string', maxLength: 40 }
  }
};

const assignmentReviewBodySchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['reviewed', 'needs_changes'] },
    score: {
      anyOf: [
        { type: 'number', minimum: 0, maximum: 100 },
        { type: 'integer', minimum: 0, maximum: 100 },
        { type: 'string', maxLength: 8 },
        { type: 'null' }
      ]
    },
    feedback: { type: 'string', maxLength: 8000 }
  },
  additionalProperties: true
};

function registerAssignmentRoutes(fastify, deps) {
  const {
    API_PREFIX,
    db,
    fs,
    path,
    UPLOAD_DIR,
    now,
    requireRole,
    parseProjectId,
    normalizeAssignmentPayload,
    mapAssignment,
    mapAssignmentSubmission,
    loadCourseDetail,
    listCourseLessons,
    canReadCourse,
    canEditCourse,
    canReadAssignmentSubmission,
    getAttachmentById,
    getCompetitionRegistrationStats,
    requestAiChat,
    safeParseJson,
    logAudit,
    ASSIGNMENT_SUBMISSION_STATUSES,
    collectMultipart,
    cleanupTempFiles,
    moveTempFiles,
    resolveUnder
  } = deps;
  const assignmentRepository = createAssignmentRepository({ db, now });

  function normalizeAttachments(value) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const name = String(item.name || '').trim();
        const relativePath = String(item.path || '').trim().replace(/\\/g, '/');
        if (!relativePath
          || relativePath.startsWith('/')
          || /^[A-Za-z]:\//.test(relativePath)
          || relativePath.split('/').some(part => !part || part === '.' || part === '..' || part.includes('\0'))) return null;
        const size = Number(item.size);
        return {
          name: name || relativePath.split('/').pop() || '附件',
          path: relativePath,
          size: Number.isFinite(size) && size >= 0 ? size : 0
        };
      })
      .filter(Boolean);
  }

  function parseRetainedAttachmentPaths(rawValue, existingAttachments) {
    if (rawValue === undefined) {
      return existingAttachments.map(item => item.path);
    }
    const parsed = Array.isArray(rawValue) ? rawValue : safeParseJson(rawValue);
    if (!Array.isArray(parsed)) return [];
    const allowed = new Set(existingAttachments.map(item => item.path));
    return parsed
      .map(item => String(item || '').trim().replace(/\\/g, '/'))
      .filter(item => item && allowed.has(item))
      .filter((item, index, list) => list.indexOf(item) === index);
  }

  function removeStoredAttachment(relativePath) {
    const normalized = String(relativePath || '').trim().replace(/\\/g, '/');
    if (!normalized) return;
    const absolutePath = typeof resolveUnder === 'function'
      ? resolveUnder(UPLOAD_DIR, normalized)
      : path.resolve(UPLOAD_DIR, normalized);
    if (!absolutePath) {
      return;
    }
    try {
      fs.unlinkSync(absolutePath);
    } catch (err) {
      if (err.code !== 'ENOENT') fastify.log.debug({ err }, 'attachment cleanup failed');
    }
  }

  function removeDiscardedAttachments(existingAttachments, retainedPaths) {
    const retainedSet = new Set(retainedPaths);
    existingAttachments.forEach((attachment) => {
      if (!retainedSet.has(attachment.path)) {
        removeStoredAttachment(attachment.path);
      }
    });
  }

  function toTextList(value) {
    return Array.isArray(value) ? value.map(item => String(item || '').trim()).filter(Boolean) : [];
  }

  function buildLessonAssignmentPayload(courseId, lessonId) {
    if (!courseId || !lessonId || !loadCourseDetail || !listCourseLessons) return null;
    const course = loadCourseDetail(courseId);
    if (!course) return null;
    const lesson = listCourseLessons(course).find(item => String(item.id || '') === lessonId);
    if (!lesson) return null;

    const requirements = [
      ...toTextList(lesson.homework),
      ...toTextList(lesson.deliverables)
    ];
    if (!requirements.length && Array.isArray(lesson.units)) {
      lesson.units.forEach(unit => {
        if (unit?.deliverable) requirements.push(String(unit.deliverable).trim());
        if (Array.isArray(unit?.pages)) {
          unit.pages.forEach(page => {
            if (page?.deliverable) requirements.push(String(page.deliverable).trim());
          });
        }
      });
    }
    if (!requirements.length && Array.isArray(lesson.phases)) {
      lesson.phases.forEach(phase => {
        const tasks = Array.isArray(phase?.student?.tasks) ? phase.student.tasks : [];
        tasks.forEach(task => {
          const text = String(task || '').replace(/<[^>]+>/g, '').trim();
          if (text) {
            requirements.push(text);
          }
        });
      });
    }
    if (!requirements.length) return null;

    return {
      courseId,
      lessonId,
      title: `${lesson.title || lessonId} 成果提交`,
      description: lesson.description || '提交本课实践成果、作品链接或完成说明。',
      requirements: Array.from(new Set(requirements.filter(Boolean))).join('\n'),
      dueAt: '',
      submitType: 'mixed',
      rubric: [],
      status: 'published'
    };
  }

  function ensureLessonAssignment(courseId, lessonId, user) {
    if (!courseId || !lessonId) return [];
    const existing = assignmentRepository.list({ courseId, lessonId, user });
    if (existing.length) return existing;
    const payload = buildLessonAssignmentPayload(courseId, lessonId);
    if (!payload) return existing;
    assignmentRepository.create(payload, null);
    return assignmentRepository.list({ courseId, lessonId, user });
  }

  function requireCourseRead(request, reply, courseId) {
    if (!courseId || typeof canReadCourse !== 'function') return true;
    const course = loadCourseDetail(courseId);
    if (!course) return true;
    if (canReadCourse(request.user, course)) return true;
    reply.code(404);
    reply.send({ error: '作业不存在' });
    return false;
  }

  function requireCourseEdit(request, reply, courseId) {
    const course = loadCourseDetail(courseId);
    if (!course || typeof canEditCourse !== 'function' || canEditCourse(request.user, course)) return true;
    reply.code(403);
    reply.send({ error: '无权限编辑该课程作业' });
    return false;
  }

  function filterAssignmentsByCourseAccess(assignments, user) {
    if (typeof canReadCourse !== 'function') return assignments;
    const cache = new Map();
    return assignments.filter((assignment) => {
      const courseId = String(assignment.course_id || assignment.courseId || '').trim();
      if (!courseId) return true;
      if (!cache.has(courseId)) cache.set(courseId, loadCourseDetail(courseId));
      const course = cache.get(courseId);
      return !course || canReadCourse(user, course);
    });
  }

  fastify.get(`${API_PREFIX}/assignments`, {
    schema: { querystring: assignmentQuerySchema }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const courseId = String(request.query?.courseId || '').trim();
    const lessonId = String(request.query?.lessonId || '').trim();
    const status = String(request.query?.status || '').trim();
    if (courseId && !requireCourseRead(request, reply, courseId)) return;
    const assignments = (!status && courseId && lessonId)
      ? ensureLessonAssignment(courseId, lessonId, request.user)
      : assignmentRepository.list({ courseId, lessonId, status, user: request.user });
    return {
      assignments: filterAssignmentsByCourseAccess(assignments, request.user).map((row) => mapAssignment(row))
    };
  });

  fastify.post(`${API_PREFIX}/assignments`, {
    schema: {
      body: assignmentBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const payload = normalizeAssignmentPayload(request.body || {});
    if (!payload.courseId || !payload.title) {
      reply.code(400);
      return { error: '课程与作业标题必填' };
    }
    if (!requireCourseEdit(request, reply, payload.courseId)) return;
    const assignment = assignmentRepository.create(payload, request.user.id);
    logAudit('assignment.create', request, { assignmentId: assignment.id });
    reply.code(201);
    return { assignment: mapAssignment(assignment) };
  });

  fastify.patch(`${API_PREFIX}/assignments/:id`, {
    schema: {
      params: assignmentParamsSchema,
      body: assignmentBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const assignmentId = parseProjectId(request.params.id);
    if (!assignmentId) {
      reply.code(400);
      return { error: '作业ID无效' };
    }
    const existing = assignmentRepository.getById(assignmentId);
    if (!existing) {
      reply.code(404);
      return { error: '作业不存在' };
    }
    if (!requireCourseEdit(request, reply, existing.course_id)) return;
    const payload = normalizeAssignmentPayload(request.body || {}, existing);
    if (!payload.courseId || !payload.title) {
      reply.code(400);
      return { error: '课程与作业标题必填' };
    }
    if (!requireCourseEdit(request, reply, payload.courseId)) return;
    const assignment = assignmentRepository.update(assignmentId, payload);
    logAudit('assignment.update', request, { assignmentId });
    return { assignment: mapAssignment(assignment) };
  });

  fastify.get(`${API_PREFIX}/assignments/:id/submissions`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const assignmentId = parseProjectId(request.params.id);
    if (!assignmentId) {
      reply.code(400);
      return { error: '作业ID无效' };
    }
    const assignment = assignmentRepository.getById(assignmentId);
    if (!assignment) {
      reply.code(404);
      return { error: '作业不存在' };
    }
    if (!requireCourseRead(request, reply, assignment.course_id)) return;
    const submissions = assignmentRepository.listSubmissions(assignmentId, request.user)
      .filter((submission) => typeof canReadAssignmentSubmission !== 'function'
        || canReadAssignmentSubmission(request.user, {
          ...submission,
          course_id: assignment.course_id,
          assignment_created_by: assignment.created_by
        }));
    return {
      assignment: mapAssignment(assignment),
      submissions: submissions.map(mapAssignmentSubmission)
    };
  });

  fastify.get(`${API_PREFIX}/assignment-attachments/:id/download`, {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer', minimum: 1 } }
      }
    }
  }, async (request, reply) => {
    // Do not reveal whether an attachment exists to anonymous callers or
    // users outside the student/teacher resource boundary.
    if (!request.user || !['student', 'teacher', 'admin'].includes(String(request.user.role || '').toLowerCase())) {
      reply.code(404);
      return { error: '文件不存在' };
    }
    const attachment = typeof getAttachmentById === 'function'
      ? getAttachmentById(parseProjectId(request.params.id))
      : null;
    const course = attachment && typeof loadCourseDetail === 'function'
      ? loadCourseDetail(attachment.course_id)
      : null;
    if (!attachment
      || (typeof canReadCourse === 'function' && (!course || !canReadCourse(request.user, course)))
      || typeof canReadAssignmentSubmission !== 'function'
      || !canReadAssignmentSubmission(request.user, attachment)) {
      reply.code(404);
      return { error: '文件不存在' };
    }
    const relativePath = String(attachment.storage_key || '').trim().replace(/\\/g, '/');
    const uploadRoot = path.resolve(UPLOAD_DIR);
    const absolutePath = typeof resolveUnder === 'function'
      ? resolveUnder(uploadRoot, relativePath)
      : path.resolve(uploadRoot, relativePath);
    const relative = absolutePath ? path.relative(uploadRoot, absolutePath) : '';
    if (!absolutePath || !relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      reply.code(404);
      return { error: '文件不存在' };
    }
    if (path.extname(attachment.original_name || relativePath).toLowerCase() === '.svg' || !fs.existsSync(absolutePath)) {
      reply.code(404);
      return { error: '文件不存在' };
    }
    reply
      .header('Content-Type', 'application/octet-stream')
      .header('Content-Disposition', `attachment; filename="${encodeURIComponent(path.basename(attachment.original_name || relativePath))}"`)
      .header('X-Content-Type-Options', 'nosniff')
      .header('Cache-Control', 'private, no-store');
    return reply.send(fs.createReadStream(absolutePath));
  });

  fastify.post(`${API_PREFIX}/assignments/:id/submissions`, {
    schema: {
      params: assignmentParamsSchema
    },
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 hour',
        keyGenerator: request => request.user?.id ? `user:${request.user.id}` : request.ip
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const assignmentId = parseProjectId(request.params.id);
    if (!assignmentId) {
      reply.code(400);
      return { error: '作业ID无效' };
    }
    const assignment = assignmentRepository.getById(assignmentId);
    if (!assignment || (request.user.role === 'student' && assignment.status !== 'published')) {
      reply.code(404);
      return { error: '作业不存在或未发布' };
    }
    if (!requireCourseRead(request, reply, assignment.course_id)) return;
    if (request.user.role !== 'student') {
      reply.code(403);
      return { error: '只有学生可以提交作业' };
    }

    const existingSubmission = assignmentRepository.getSubmissionByAssignmentAndStudent(assignmentId, request.user.id);
    const existingAttachments = normalizeAttachments(safeParseJson(existingSubmission?.attachments) || []);

    let payload = request.body || {};
    let tempFiles = [];
    let movedAttachments = [];

    try {
      if (typeof request.isMultipart === 'function' && request.isMultipart()) {
        const collected = await collectMultipart(request);
        payload = collected.fields || {};
        tempFiles = collected.tempFiles || [];
      }

      const content = String(payload.content || '').trim();
      const link = String(payload.link || '').trim();
      const attachmentNote = String(payload.attachmentNote || payload.attachment_note || '').trim();
      const retainedPaths = parseRetainedAttachmentPaths(payload.retainedAttachmentPaths, existingAttachments);
      const retainedAttachments = existingAttachments.filter(item => retainedPaths.includes(item.path));
      const newAttachments = tempFiles.length
        ? moveTempFiles(tempFiles, `assignment-${assignmentId}`, `student-${request.user.id}`)
        : [];
      movedAttachments = newAttachments;
      const attachments = [...retainedAttachments, ...newAttachments];

      if (!content && !link && !attachmentNote && !attachments.length) {
        movedAttachments.forEach(item => removeStoredAttachment(item.path));
        reply.code(400);
        return { error: '提交内容、链接、附件说明或上传文件至少填写一项' };
      }

      if (link && !/^https?:\/\//i.test(link)) {
        movedAttachments.forEach(item => removeStoredAttachment(item.path));
        reply.code(400);
        return { error: '链接必须以 http(s) 开头' };
      }

      const submittedAt = now();
      const headerKey = request.headers['x-model-key'];
      const apiKey = String(headerKey || process.env.AI_API_KEY || '').trim();

      let aiFeedback = '';
      let status = 'submitted';
      let reviewedBy = null;
      let reviewedAt = null;
      let score = null;

      if (apiKey) {
        try {
          const attachmentSummary = attachments.length
            ? attachments.map(item => item.name).join('、')
            : '(未上传)';
          const messages = [
            {
              role: 'system',
              content: `你是一名温暖、亲切的初中（七年级）人工智能与科创课程的“AI助教小破”。
你的任务是对学生的作业提交进行【即时评测与启发式反馈】。
请用极其鼓励、通俗易懂且简短的语言（150字以内）进行评价：
1. 肯定学生付出的努力（给出正面情感回馈，比如“哇！你已经迈出了关键的一步！”）。
2. 用生活中的生动比喻或浅显逻辑点评他们的提交内容，指出亮点。
3. 给出1个非常具体、有趣的下一步改进建议或思考题，引导他们继续探索。
注意：保持亲和力，适合12岁左右的孩子，排版要清晰美观。`
            },
            {
              role: 'user',
              content: `【作业标题】：${assignment.title}
【作业要求】：${assignment.requirements || assignment.description || '无具体要求'}
【学生提交内容】：
- 作业文本/代码：${content || '(未填写)'}
- 补充链接：${link || '(未提供)'}
- 已上传附件：${attachmentSummary}
- 附件说明：${attachmentNote || '(无)'}`.trim()
            }
          ];

          const result = await requestAiChat(messages, apiKey);
          if (result && result.content) {
            aiFeedback = result.content;
            status = 'reviewed';
            reviewedBy = 'AI_Assistant';
            reviewedAt = submittedAt;
            score = 100;
          }
        } catch (err) {
          fastify.log.warn({ err }, 'AI assignment auto-review failed');
        }
      }

      const row = assignmentRepository.upsertSubmission({
        assignmentId,
        studentId: request.user.id,
        content,
        link,
        attachmentNote,
        attachments,
        status,
        score,
        feedback: aiFeedback,
        reviewedBy,
        reviewedAt
      });
      removeDiscardedAttachments(existingAttachments, retainedPaths);
      logAudit('assignment.submit', request, { assignmentId, attachmentCount: attachments.length });
      return { submission: mapAssignmentSubmission(row) };
    } catch (err) {
      cleanupTempFiles(tempFiles || []);
      movedAttachments.forEach(item => removeStoredAttachment(item.path));
      reply.code(400);
      return { error: err.message || '提交失败' };
    }
  });

  fastify.patch(`${API_PREFIX}/assignments/:id/submissions/:submissionId`, {
    schema: {
      params: submissionParamsSchema,
      body: assignmentReviewBodySchema
    }
  }, async (request, reply) => {
    return fastify.inject({
      method: 'POST',
      url: `${API_PREFIX}/assignments/${request.params.id}/submissions/${request.params.submissionId}/review`,
      headers: request.headers,
      payload: request.body
    }).then((response) => {
      reply.code(response.statusCode);
      Object.entries(response.headers).forEach(([key, value]) => reply.header(key, value));
      return JSON.parse(response.body || '{}');
    });
  });

  fastify.post(`${API_PREFIX}/assignments/:id/submissions/:submissionId/review`, {
    schema: {
      params: submissionParamsSchema,
      body: assignmentReviewBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const assignmentId = parseProjectId(request.params.id);
    const submissionId = parseProjectId(request.params.submissionId);
    if (!assignmentId || !submissionId) {
      reply.code(400);
      return { error: '作业或提交ID无效' };
    }
    const status = String(request.body?.status || 'reviewed').trim();
    const score = request.body?.score === '' || request.body?.score === null || request.body?.score === undefined
      ? null
      : Number(request.body.score);
    const feedback = String(request.body?.feedback || '').trim();
    if (!ASSIGNMENT_SUBMISSION_STATUSES.has(status) || status === 'submitted') {
      reply.code(400);
      return { error: '批改状态无效' };
    }
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) {
      reply.code(400);
      return { error: '分数必须在 0-100 之间' };
    }
    if (status === 'needs_changes' && !feedback) {
      reply.code(400);
      return { error: '退回修改必须填写反馈' };
    }
    const assignment = assignmentRepository.getById(assignmentId);
    if (!assignment) {
      reply.code(404);
      return { error: '作业不存在' };
    }
    if (!requireCourseRead(request, reply, assignment.course_id)) return;
    const submission = assignmentRepository.getSubmissionById(submissionId);
    if (!submission || (typeof canReadAssignmentSubmission === 'function' && !canReadAssignmentSubmission(request.user, {
      ...submission,
      course_id: assignment.course_id,
      assignment_created_by: assignment.created_by
    }))) {
      reply.code(404);
      return { error: '提交不存在' };
    }
    const row = assignmentRepository.reviewSubmission({
      assignmentId,
      submissionId,
      status,
      score,
      feedback,
      reviewedBy: request.user.id,
      reviewerRole: request.user.role
    });
    if (!row) {
      reply.code(404);
      return { error: '提交不存在' };
    }
    logAudit('assignment.review', request, { assignmentId, submissionId, status });
    return { submission: mapAssignmentSubmission(row) };
  });
}

module.exports = {
  registerAssignmentRoutes
};

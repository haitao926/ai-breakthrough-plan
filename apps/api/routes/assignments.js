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
    courseId: { type: 'string', minLength: 1, maxLength: 120 },
    lessonId: { type: 'string', maxLength: 120 },
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

const assignmentSubmissionBodySchema = {
  type: 'object',
  properties: {
    content: { type: 'string', maxLength: 20000 },
    link: { type: 'string', maxLength: 1000 },
    attachmentNote: { type: 'string', maxLength: 4000 },
    attachment_note: { type: 'string', maxLength: 4000 }
  },
  additionalProperties: true
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
    now,
    requireRole,
    parseProjectId,
    normalizeAssignmentPayload,
    mapAssignment,
    mapAssignmentSubmission,
    loadCourseDetail,
    listCourseLessons,
    getCompetitionRegistrationStats,
    requestAiChat,
    logAudit,
    ASSIGNMENT_SUBMISSION_STATUSES
  } = deps;
  const assignmentRepository = createAssignmentRepository({ db, now });

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

  fastify.get(`${API_PREFIX}/assignments`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const courseId = String(request.query?.courseId || '').trim();
    const lessonId = String(request.query?.lessonId || '').trim();
    const status = String(request.query?.status || '').trim();
    const assignments = (!status && courseId && lessonId)
      ? ensureLessonAssignment(courseId, lessonId, request.user)
      : assignmentRepository.list({ courseId, lessonId, status, user: request.user });
    return {
      assignments: assignments.map((row) => mapAssignment(row))
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
    const payload = normalizeAssignmentPayload(request.body || {}, existing);
    if (!payload.courseId || !payload.title) {
      reply.code(400);
      return { error: '课程与作业标题必填' };
    }
    const assignment = assignmentRepository.update(assignmentId, payload);
    logAudit('assignment.update', request, { assignmentId });
    return { assignment: mapAssignment(assignment) };
  });

  fastify.get(`${API_PREFIX}/assignments/:id/submissions`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
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
    return {
      assignment: mapAssignment(assignment),
      submissions: assignmentRepository.listSubmissions(assignmentId, request.user).map(mapAssignmentSubmission)
    };
  });

  fastify.post(`${API_PREFIX}/assignments/:id/submissions`, {
    schema: {
      params: assignmentParamsSchema,
      body: assignmentSubmissionBodySchema
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
    const payload = request.body || {};
    const content = String(payload.content || '').trim();
    const link = String(payload.link || '').trim();
    const attachmentNote = String(payload.attachmentNote || payload.attachment_note || '').trim();
    if (!content && !link && !attachmentNote) {
      reply.code(400);
      return { error: '提交内容、链接或附件说明至少填写一项' };
    }
    if (link && !/^https?:\/\//i.test(link)) {
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
- 作品/项目链接：${link || '(未提供)'}
- 附件说明：${attachmentNote || '(无)'}`
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
        console.error('AI Assignment Auto-Review failed:', err.message);
      }
    }

    const row = assignmentRepository.upsertSubmission({
      assignmentId,
      studentId: request.user.id,
      content,
      link,
      attachmentNote,
      status,
      score,
      feedback: aiFeedback,
      reviewedBy,
      reviewedAt
    });
    logAudit('assignment.submit', request, { assignmentId });
    return { submission: mapAssignmentSubmission(row) };
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
    const row = assignmentRepository.reviewSubmission({
      assignmentId,
      submissionId,
      status,
      score,
      feedback,
      reviewedBy: request.user.id
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

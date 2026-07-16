function registerCollaborationRoutes(fastify, deps) {
  const {
    API_PREFIX,
    db,
    fs,
    path,
    ASSESSMENT_DIR,
    EXTENSION_MIME_MAP,
    now,
    SUBMISSION_TYPES,
    SUBMISSION_STATUSES,
    requireRole,
    requireProjectAccess,
    parseProjectId,
    getProject,
    validateGiteaRepo,
    validateSubmissionDetails,
    validateStatusTransition,
    safeParseJson,
    normalizeScoreTemplateCriteria,
    logAudit,
    collectMultipart,
    cleanupTempFiles,
    moveTempFiles,
    resolveUnder
  } = deps;

  const idParamsSchema = {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 }
    }
  };

  const projectUpdateSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      giteaRepoUrl: { type: 'string', maxLength: 500 }
    }
  };

  const submissionFeedbackSchema = {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: {
      status: { type: 'string', enum: Array.from(SUBMISSION_STATUSES) },
      feedback: { type: 'string', maxLength: 5000 }
    }
  };

  const submissionScoreSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      scores: {
        type: 'object',
        additionalProperties: { type: 'number' }
      },
      totalScore: { type: 'number' },
      comment: { type: 'string', maxLength: 5000 }
    }
  };

  const scoreTemplateSchema = {
    type: 'object',
    required: ['type', 'criteria'],
    additionalProperties: false,
    properties: {
      type: { type: 'string', enum: Array.from(SUBMISSION_TYPES) },
      criteria: {
        type: 'array',
        minItems: 1,
        maxItems: 20,
        items: {
          type: 'object',
          required: ['label', 'max'],
          additionalProperties: true,
          properties: {
            label: { type: 'string', minLength: 1, maxLength: 120 },
            key: { type: 'string', maxLength: 120 },
            max: { type: 'number', exclusiveMinimum: 0 }
          }
        }
      }
    }
  };

  const commentSchema = {
    type: 'object',
    required: ['content'],
    additionalProperties: false,
    properties: {
      content: { type: 'string', minLength: 1, maxLength: 5000 }
    }
  };

  const announcementSchema = {
    type: 'object',
    required: ['title'],
    additionalProperties: false,
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200 },
      body: { type: 'string', maxLength: 5000 }
    }
  };

  const multipartHeadersSchema = {
    type: 'object',
    required: ['content-type'],
    properties: {
      'content-type': {
        type: 'string',
        pattern: '^multipart/form-data(?:;.*)?$'
      }
    },
    additionalProperties: true
  };

  const assessmentUploadResponseSchema = {
    type: 'object',
    required: ['success', 'file'],
    properties: {
      success: { type: 'boolean' },
      file: {
        type: 'object',
        required: ['id', 'title', 'original_name', 'file_path', 'file_size', 'created_at'],
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          original_name: { type: 'string' },
          file_path: { type: 'string' },
          file_size: { type: 'integer' },
          created_at: { type: 'string' }
        }
      }
    }
  };

  fastify.patch(`${API_PREFIX}/projects/:id`, {
    schema: {
      params: idParamsSchema,
      body: projectUpdateSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const projectId = parseProjectId(request.params.id);
    if (!projectId) {
      reply.code(400);
      return { error: '项目ID无效' };
    }

    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }

    if (!requireProjectAccess(request, reply, project, 'write')) return;

    const payload = request.body || {};
    const giteaRepoUrl = String(payload.giteaRepoUrl || '').trim();
    if (giteaRepoUrl && !/^https?:\/\//i.test(giteaRepoUrl)) {
      reply.code(400);
      return { error: 'Gitea 仓库地址格式无效' };
    }
    if (giteaRepoUrl) {
      const validation = await validateGiteaRepo(giteaRepoUrl);
      if (!validation.ok) {
        reply.code(validation.status || 400);
        return { error: validation.error };
      }
    }

    db.run(
      'UPDATE projects SET gitea_repo_url = ?, updated_at = ? WHERE id = ?',
      [giteaRepoUrl, now(), projectId]
    );
    logAudit('project.update', request, { projectId, giteaRepoUrl });
    return { success: true };
  });

  fastify.post(`${API_PREFIX}/projects/:id/submissions`, {
    schema: {
      params: idParamsSchema
    },
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 hour',
        keyGenerator: request => request.user?.id ? `user:${request.user.id}` : request.ip
      }
    }
  }, async (request, reply) => {
    const projectId = parseProjectId(request.params.id);
    if (!projectId) {
      reply.code(400);
      return { error: '项目ID无效' };
    }
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (project.status === 'archived') {
      reply.code(400);
      return { error: '项目已归档，无法提交' };
    }
    if (!request.user) {
      reply.code(401);
      return { error: '未登录' };
    }
    if (!['student', 'teacher'].includes(request.user.role) && request.user.role !== 'admin') {
      reply.code(403);
      return { error: '权限不足' };
    }
    if (!requireProjectAccess(request, reply, project, 'write')) return;

    let fields;
    let tempFiles;
    try {
      const collected = await collectMultipart(request);
      fields = collected.fields;
      tempFiles = collected.tempFiles;
    } catch (err) {
      cleanupTempFiles(tempFiles || []);
      reply.code(400);
      return { error: err.message || '提交失败' };
    }

    const type = String(fields.type || '').trim();
    if (!SUBMISSION_TYPES.has(type)) {
      cleanupTempFiles(tempFiles);
      reply.code(400);
      return { error: '提交类型无效' };
    }

    const title = String(fields.title || '').trim();
    const content = String(fields.content || '').trim();
    let details = safeParseJson(fields.details) || {};

    const detailError = validateSubmissionDetails(type, details);
    if (detailError) {
      cleanupTempFiles(tempFiles);
      reply.code(400);
      return { error: detailError };
    }

    const repoUrl = String(details.codeRepo || '').trim();
    if (repoUrl) {
      const validation = await validateGiteaRepo(repoUrl);
      if (!validation.ok) {
        cleanupTempFiles(tempFiles);
        reply.code(validation.status || 400);
        return { error: validation.error };
      }
    }

    let autoStatus = null;
    if (type === 'proposal') autoStatus = 'reviewing';
    if (type === 'midterm') autoStatus = 'midterm_review';
    if (type === 'final') autoStatus = 'final_review';

    if (autoStatus) {
      const transitionError = validateStatusTransition(project.status, autoStatus);
      if (transitionError) {
        cleanupTempFiles(tempFiles);
        reply.code(400);
        return { error: transitionError };
      }
    }

    const attachments = moveTempFiles(tempFiles, projectId, type);
    const submittedBy = request.user ? request.user.id : 0;
    const createdAt = now();
    const submissionId = db.transaction((trx) => {
      const info = trx.run(
        `INSERT INTO submissions (project_id, submitted_by, type, title, content, details, attachments, status, feedback, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          projectId,
          submittedBy,
          type,
          title,
          content,
          JSON.stringify(details),
          JSON.stringify(attachments),
          'submitted',
          '',
          createdAt
        ]
      );

      const nextSubmissionId = info.lastInsertRowid;
      attachments.forEach((att) => {
        trx.run(
          'INSERT INTO attachments (submission_id, file_name, file_path, file_size, created_at) VALUES (?, ?, ?, ?, ?)',
          [nextSubmissionId, att.name || '', att.path || '', att.size || 0, createdAt]
        );
      });

      if (autoStatus) {
        trx.run('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?', [autoStatus, createdAt, projectId]);
        trx.run(
          'INSERT INTO project_logs (project_id, status, note, created_at) VALUES (?, ?, ?, ?)',
          [projectId, autoStatus, `提交${type}`, createdAt]
        );
      } else {
        trx.run('UPDATE projects SET updated_at = ? WHERE id = ?', [createdAt, projectId]);
      }

      return nextSubmissionId;
    });

    logAudit('submission.create', request, { projectId, submissionId, type, userId: submittedBy });
    return { success: true, submissionId };
  });

  fastify.post(`${API_PREFIX}/submissions/:id/feedback`, {
    schema: {
      params: idParamsSchema,
      body: submissionFeedbackSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const submissionId = parseProjectId(request.params.id);
    if (!submissionId) {
      reply.code(400);
      return { error: '提交ID无效' };
    }

    const payload = request.body || {};
    const status = String(payload.status || '').trim();
    const feedback = String(payload.feedback || '').trim();

    if (!SUBMISSION_STATUSES.has(status)) {
      reply.code(400);
      return { error: '反馈状态无效' };
    }

    const submission = db.get(
      `SELECT s.*, p.*
       FROM submissions s
       JOIN projects p ON p.id = s.project_id AND p.deleted_at IS NULL
       WHERE s.id = ?`,
      [submissionId]
    );
    if (!submission) {
      reply.code(404);
      return { error: '提交记录不存在' };
    }
    if (!requireProjectAccess(request, reply, submission, 'supervise')) return;

    const reviewedAt = now();
    db.run(
      'UPDATE submissions SET status = ?, feedback = ?, reviewed_at = ? WHERE id = ?',
      [status, feedback, reviewedAt, submissionId]
    );

    const existingFeedback = db.get('SELECT id FROM feedback WHERE submission_id = ?', [submissionId]);
    if (existingFeedback) {
      db.run(
        'UPDATE feedback SET comment = ?, teacher_id = ?, created_at = ? WHERE id = ?',
        [feedback, request.user.id, reviewedAt, existingFeedback.id]
      );
    } else {
      db.run(
        'INSERT INTO feedback (submission_id, teacher_id, comment, created_at) VALUES (?, ?, ?, ?)',
        [submissionId, request.user.id, feedback, reviewedAt]
      );
    }

    logAudit('submission.feedback', request, { submissionId, status });
    return { success: true };
  });

  fastify.get(`${API_PREFIX}/submissions/:id/scores`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge', 'admin'])) return;
    const submissionId = parseProjectId(request.params.id);
    if (!submissionId) {
      reply.code(400);
      return { error: '提交ID无效' };
    }

    const submission = db.get(
      `SELECT s.id, s.project_id, s.type, p.created_by
       FROM submissions s
       JOIN projects p ON p.id = s.project_id AND p.deleted_at IS NULL
       WHERE s.id = ?`,
      [submissionId]
    );
    if (!submission) {
      reply.code(404);
      return { error: '提交记录不存在' };
    }
    if (request.user.role === 'student' && Number(submission.created_by) !== Number(request.user.id)) {
      reply.code(403);
      return { error: '无权限查看评分' };
    }

    const rows = db.all(
      `SELECT rs.id, rs.submission_id, rs.reviewer_id, rs.role, rs.scores, rs.total_score,
              rs.comment, rs.created_at, rs.updated_at,
              u.name AS reviewer_name, u.email AS reviewer_email, u.avatar_url AS reviewer_avatar
       FROM review_scores rs
       JOIN users u ON u.id = rs.reviewer_id
       WHERE rs.submission_id = ?
       ORDER BY rs.updated_at DESC`,
      [submissionId]
    );
    return { scores: rows };
  });

  fastify.post(`${API_PREFIX}/submissions/:id/scores`, {
    schema: {
      params: idParamsSchema,
      body: submissionScoreSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    const submissionId = parseProjectId(request.params.id);
    if (!submissionId) {
      reply.code(400);
      return { error: '提交ID无效' };
    }

    const submission = db.get(
      `SELECT s.id, s.type, s.project_id, p.*
       FROM submissions s
       JOIN projects p ON p.id = s.project_id AND p.deleted_at IS NULL
       WHERE s.id = ?`,
      [submissionId]
    );
    if (!submission) {
      reply.code(404);
      return { error: '提交记录不存在' };
    }
    if (!requireProjectAccess(request, reply, submission, 'supervise')) return;

    const payload = request.body || {};
    const rawScores = payload.scores && typeof payload.scores === 'object' ? payload.scores : {};
    const comment = String(payload.comment || '').trim();
    const template = db.get('SELECT id, criteria FROM score_templates WHERE type = ?', [submission.type]);
    let scores = {};
    let totalScore = 0;

    if (template) {
      const criteria = safeParseJson(template.criteria) || [];
      if (!Array.isArray(criteria) || !criteria.length) {
        reply.code(400);
        return { error: '评分标准未配置' };
      }
      for (const item of criteria) {
        const value = Number(rawScores[item.key]);
        if (!Number.isFinite(value)) {
          reply.code(400);
          return { error: `评分项缺失：${item.label}` };
        }
        if (value < 0 || value > item.max) {
          reply.code(400);
          return { error: `评分项 ${item.label} 超出范围` };
        }
        scores[item.key] = value;
        totalScore += value;
      }
    } else {
      const fallbackTotal = Number(payload.totalScore);
      if (!Number.isFinite(fallbackTotal)) {
        reply.code(400);
        return { error: '评分标准未配置且总分无效' };
      }
      totalScore = fallbackTotal;
      scores = rawScores;
    }

    const existing = db.get(
      'SELECT id FROM review_scores WHERE submission_id = ? AND reviewer_id = ?',
      [submissionId, request.user.id]
    );
    const nowAt = now();
    if (existing) {
      db.run(
        'UPDATE review_scores SET scores = ?, total_score = ?, comment = ?, updated_at = ? WHERE id = ?',
        [JSON.stringify(scores), totalScore, comment, nowAt, existing.id]
      );
    } else {
      db.run(
        `INSERT INTO review_scores (submission_id, reviewer_id, role, scores, total_score, comment, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          submissionId,
          request.user.id,
          request.user.role,
          JSON.stringify(scores),
          totalScore,
          comment,
          nowAt,
          nowAt
        ]
      );
    }

    logAudit('submission.score', request, { submissionId, totalScore });
    return { success: true, totalScore };
  });

  fastify.get(`${API_PREFIX}/score-templates`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const type = String(request.query?.type || '').trim();
    const params = [];
    let sql = 'SELECT id, type, criteria, updated_at FROM score_templates';
    if (type) {
      sql += ' WHERE type = ?';
      params.push(type);
    }
    sql += ' ORDER BY updated_at DESC';
    const templates = db.all(sql, params);
    return { templates };
  });

  fastify.post(`${API_PREFIX}/score-templates`, {
    schema: {
      body: scoreTemplateSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const payload = request.body || {};
    const type = String(payload.type || '').trim();
    const criteria = normalizeScoreTemplateCriteria(payload.criteria);

    if (!SUBMISSION_TYPES.has(type)) {
      reply.code(400);
      return { error: '阶段类型无效' };
    }
    if (!criteria) {
      reply.code(400);
      return { error: '评分标准无效' };
    }

    const nowAt = now();
    const existing = db.get('SELECT id FROM score_templates WHERE type = ?', [type]);
    if (existing) {
      db.run(
        'UPDATE score_templates SET criteria = ?, updated_at = ? WHERE id = ?',
        [JSON.stringify(criteria), nowAt, existing.id]
      );
    } else {
      db.run(
        'INSERT INTO score_templates (type, criteria, updated_at) VALUES (?, ?, ?)',
        [type, JSON.stringify(criteria), nowAt]
      );
    }

    logAudit('score.template.update', request, { type });
    return { success: true };
  });

  fastify.delete(`${API_PREFIX}/score-templates/:id`, {
    schema: {
      params: idParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const templateId = parseProjectId(request.params.id);
    if (!templateId) {
      reply.code(400);
      return { error: '模板ID无效' };
    }
    db.run('DELETE FROM score_templates WHERE id = ?', [templateId]);
    logAudit('score.template.delete', request, { templateId });
    return { success: true };
  });

  fastify.get(`${API_PREFIX}/projects/:id/comments`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const projectId = parseProjectId(request.params.id);
    if (!projectId) {
      reply.code(400);
      return { error: '项目ID无效' };
    }
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'read')) return;

    const comments = db.all(
      `SELECT c.id, c.project_id, c.user_id, c.content, c.created_at, u.name AS user_name
       FROM comments c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.project_id = ?
       ORDER BY c.created_at ASC`,
      [projectId]
    );
    return { comments };
  });

  fastify.post(`${API_PREFIX}/projects/:id/comments`, {
    schema: {
      params: idParamsSchema,
      body: commentSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'admin'])) return;
    const projectId = parseProjectId(request.params.id);
    if (!projectId) {
      reply.code(400);
      return { error: '项目ID无效' };
    }
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'write')) return;

    const content = String(request.body?.content || '').trim();
    if (!content) {
      reply.code(400);
      return { error: '评论内容不能为空' };
    }
    const createdAt = now();
    db.run(
      'INSERT INTO comments (project_id, user_id, content, created_at) VALUES (?, ?, ?, ?)',
      [projectId, request.user.id, content, createdAt]
    );
    logAudit('comment.create', request, { projectId });
    return { success: true };
  });

  fastify.get(`${API_PREFIX}/announcements`, async () => {
    const announcements = db.all(
      `SELECT a.id, a.title, a.body, a.created_at, u.name AS author_name
       FROM announcements a
       LEFT JOIN users u ON u.id = a.created_by
       ORDER BY a.created_at DESC
       LIMIT 10`
    );
    return { announcements };
  });

  fastify.post(`${API_PREFIX}/announcements`, {
    schema: {
      body: announcementSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const payload = request.body || {};
    const title = String(payload.title || '').trim();
    const body = String(payload.body || '').trim();
    if (!title) {
      reply.code(400);
      return { error: '公告标题必填' };
    }
    const createdAt = now();
    db.run(
      'INSERT INTO announcements (title, body, created_by, created_at) VALUES (?, ?, ?, ?)',
      [title, body, request.user.id, createdAt]
    );
    logAudit('announcement.create', request, { title });
    return { success: true };
  });

  fastify.delete(`${API_PREFIX}/announcements/:id`, {
    schema: {
      params: idParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const announcementId = parseProjectId(request.params.id);
    if (!announcementId) {
      reply.code(400);
      return { error: '公告ID无效' };
    }
    db.run('DELETE FROM announcements WHERE id = ?', [announcementId]);
    logAudit('announcement.delete', request, { announcementId });
    return { success: true };
  });

  fastify.get(`${API_PREFIX}/assessments`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const files = db.all(
      'SELECT id, title, original_name, file_path, file_size, uploaded_by, created_at FROM assessment_files ORDER BY created_at DESC'
    );
    return { files };
  });

  fastify.post(`${API_PREFIX}/assessments`, {
    schema: {
      headers: multipartHeadersSchema,
      response: {
        200: assessmentUploadResponseSchema
      }
    },
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 hour',
        keyGenerator: request => request.user?.id ? `user:${request.user.id}` : request.ip
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    if (!request.isMultipart()) {
      reply.code(400);
      return { error: '请求必须使用 multipart/form-data' };
    }
    let fields;
    let tempFiles;
    try {
      const collected = await collectMultipart(request);
      fields = collected.fields;
      tempFiles = collected.tempFiles;
    } catch (err) {
      cleanupTempFiles(tempFiles || []);
      reply.code(400);
      return { error: err.message || '上传失败' };
    }
    if (!tempFiles || tempFiles.length !== 1) {
      cleanupTempFiles(tempFiles || []);
      reply.code(400);
      return { error: '请上传单个 CSV 文件' };
    }
    const file = tempFiles[0];
    const fileExt = String(path.extname(file.originalName || '') || '').toLowerCase();
    if (fileExt !== '.csv') {
      cleanupTempFiles(tempFiles || []);
      reply.code(400);
      return { error: '请上传 CSV 文件' };
    }
    const safeName = String(file.originalName || '').replace(/[^\w.\-]+/g, '_') || 'assessment.csv';
    const finalName = `${Date.now()}_${safeName}`;
    const finalPath = typeof resolveUnder === 'function'
      ? resolveUnder(ASSESSMENT_DIR, finalName)
      : path.resolve(ASSESSMENT_DIR, finalName);
    if (!finalPath) {
      cleanupTempFiles(tempFiles || []);
      reply.code(400);
      return { error: '保存路径无效' };
    }
    try {
      fs.renameSync(file.tmpPath, finalPath);
    } catch (err) {
      cleanupTempFiles(tempFiles || []);
      reply.code(500);
      return { error: '保存文件失败' };
    }
    const stats = fs.statSync(finalPath);
    const title = String(fields?.title || '').trim();
    if (title.length > 200) {
      cleanupTempFiles(tempFiles || []);
      try {
        fs.unlinkSync(finalPath);
      } catch (err) {
        if (err.code !== 'ENOENT') fastify.log.debug({ err }, 'assessment cleanup failed');
      }
      reply.code(400);
      return { error: '标题长度不能超过 200 个字符' };
    }
    const createdAt = now();
    const info = db.run(
      'INSERT INTO assessment_files (title, original_name, file_path, file_size, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [title, safeName, finalName, stats.size, request.user?.id || null, createdAt]
    );
    logAudit('assessment.upload', request, { fileId: info.lastInsertRowid, fileName: safeName });
    return {
      success: true,
      file: {
        id: info.lastInsertRowid,
        title,
        original_name: safeName,
        file_path: finalName,
        file_size: stats.size,
        created_at: createdAt
      }
    };
  });

  fastify.get(`${API_PREFIX}/assessments/:id/download`, {
    schema: {
      params: idParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const fileId = parseProjectId(request.params.id);
    if (!fileId) {
      reply.code(400);
      return { error: '文件ID无效' };
    }
    const row = db.get('SELECT * FROM assessment_files WHERE id = ?', [fileId]);
    if (!row) {
      reply.code(404);
      return { error: '文件不存在' };
    }
    const absolutePath = typeof resolveUnder === 'function'
      ? resolveUnder(ASSESSMENT_DIR, row.file_path)
      : path.resolve(ASSESSMENT_DIR, row.file_path);
    if (!absolutePath) {
      reply.code(403);
      return { error: 'Access denied' };
    }
    if (!fs.existsSync(absolutePath)) {
      reply.code(404);
      return { error: '文件已丢失' };
    }
    const ext = path.extname(row.original_name || '').toLowerCase();
    const mimeType = (EXTENSION_MIME_MAP[ext] && EXTENSION_MIME_MAP[ext][0]) || 'text/csv';
    reply.header('Content-Type', mimeType);
    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(row.original_name)}"`);
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Cache-Control', 'private, no-store');
    logAudit('assessment.download', request, { fileId });
    return reply.send(fs.createReadStream(absolutePath));
  });

  fastify.delete(`${API_PREFIX}/assessments/:id`, {
    schema: {
      params: idParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const fileId = parseProjectId(request.params.id);
    if (!fileId) {
      reply.code(400);
      return { error: '文件ID无效' };
    }
    const row = db.get('SELECT * FROM assessment_files WHERE id = ?', [fileId]);
    if (!row) {
      reply.code(404);
      return { error: '文件不存在' };
    }
    const absolutePath = typeof resolveUnder === 'function'
      ? resolveUnder(ASSESSMENT_DIR, row.file_path)
      : path.resolve(ASSESSMENT_DIR, row.file_path);
    try {
      if (absolutePath && fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (err) {
      fastify.log.error(err);
    }
    db.run('DELETE FROM assessment_files WHERE id = ?', [fileId]);
    logAudit('assessment.delete', request, { fileId });
    return { success: true };
  });
}

module.exports = { registerCollaborationRoutes };

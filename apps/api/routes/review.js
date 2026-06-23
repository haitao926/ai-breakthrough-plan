function registerReviewRoutes(fastify, deps) {
  const {
    API_PREFIX,
    db,
    path,
    UPLOAD_DIR,
    requireRole,
    parseProjectId,
    buildProjectFilters,
    buildProjectReviewDossier,
    projectReviewRepository,
    showcaseRepository,
    toCsvLine,
    sanitizeName,
    appendFileSafe,
    streamZip,
    logAudit
  } = deps;

  const projectFiltersQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      status: { type: 'string', maxLength: 80 },
      keyword: { type: 'string', maxLength: 200 },
      className: { type: 'string', maxLength: 80 }
    }
  };

  const projectIdParamsSchema = {
    type: 'object',
    required: ['id'],
    additionalProperties: false,
    properties: {
      id: { type: 'integer', minimum: 1 }
    }
  };

  fastify.get(`${API_PREFIX}/admin/project-review-queue`, {
    schema: {
      querystring: projectFiltersQuerySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    return { projects: projectReviewRepository.listQueue(request.query || {}) };
  });

  fastify.get(`${API_PREFIX}/teacher/project-review-queue`, {
    schema: {
      querystring: projectFiltersQuerySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    return { projects: projectReviewRepository.listQueue(request.query || {}) };
  });

  fastify.get(`${API_PREFIX}/admin/projects/:id/review-dossier`, {
    schema: {
      params: projectIdParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    const projectId = parseProjectId(request.params.id);
    if (!projectId) {
      reply.code(400);
      return { error: '项目ID无效' };
    }
    const dossier = buildProjectReviewDossier(projectId);
    if (!dossier) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    return dossier;
  });

  fastify.get(`${API_PREFIX}/teacher/projects/:id/review-dossier`, {
    schema: {
      params: projectIdParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    const projectId = parseProjectId(request.params.id);
    if (!projectId) {
      reply.code(400);
      return { error: '项目ID无效' };
    }
    const dossier = buildProjectReviewDossier(projectId);
    if (!dossier) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    return dossier;
  });

  fastify.get(`${API_PREFIX}/exports/projects.csv`, {
    schema: {
      querystring: projectFiltersQuerySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const { conditions, params } = buildProjectFilters(request.query);
    let sql = 'SELECT id, title, class_name, team_members, summary, status, created_at, updated_at FROM projects';
    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ' ORDER BY updated_at DESC';

    const rows = db.all(sql, params);
    const header = [
      '项目ID',
      '项目名称',
      '班级/组别',
      '团队成员',
      '项目简介',
      '状态',
      '创建时间',
      '更新时间'
    ];
    const lines = [toCsvLine(header)];
    rows.forEach(row => {
      lines.push(toCsvLine([
        row.id,
        row.title,
        row.class_name || '',
        row.team_members || '',
        row.summary || '',
        row.status,
        row.created_at,
        row.updated_at
      ]));
    });

    logAudit('export.projects.csv', request, { total: rows.length, filters: request.query || {} });
    reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="projects.csv"')
      .send(lines.join('\n'));
  });

  fastify.get(`${API_PREFIX}/exports/attachments.zip`, {
    schema: {
      querystring: projectFiltersQuerySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const { conditions, params } = buildProjectFilters(request.query, 'p');
    let sql = `
      SELECT a.file_name, a.file_path, s.type AS submission_type, s.id AS submission_id, s.project_id
      FROM attachments a
      JOIN submissions s ON s.id = a.submission_id
      JOIN projects p ON p.id = s.project_id
    `;
    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ' ORDER BY s.project_id, s.created_at DESC';
    const rows = db.all(sql, params);
    logAudit('export.attachments.zip', request, { total: rows.length, filters: request.query || {} });

    streamZip(reply, 'attachments.zip', (archive) => {
      const missing = [];
      rows.forEach(row => {
        const safeType = sanitizeName(row.submission_type || 'submission');
        const safeName = sanitizeName(row.file_name || 'file');
        const archivePath = `project-${row.project_id}/${safeType}/${row.submission_id}_${safeName}`;
        const absolutePath = path.join(UPLOAD_DIR, row.file_path);
        appendFileSafe(archive, absolutePath, archivePath, missing);
      });
      if (missing.length) {
        archive.append(missing.join('\n'), { name: 'missing_files.txt' });
      }
    });
  });

  fastify.get(`${API_PREFIX}/showcase`, {
    schema: {
      querystring: projectFiltersQuerySchema
    }
  }, async (request) => {
    return { items: showcaseRepository.list(request.query || {}) };
  });
}

module.exports = { registerReviewRoutes };

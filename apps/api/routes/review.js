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
    canReadProject,
    toCsvLine,
    sanitizeName,
    appendFileSafe,
    streamZip,
    logAudit,
    resolveUnder
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

  function filterReadableProjects(projects, user) {
    return typeof canReadProject === 'function'
      ? projects.filter(project => canReadProject(user, project))
      : projects;
  }

  fastify.get(`${API_PREFIX}/admin/project-review-queue`, {
    schema: {
      querystring: projectFiltersQuerySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    return { projects: projectReviewRepository.listQueue(request.query || {}, request.user) };
  });

  fastify.get(`${API_PREFIX}/teacher/project-review-queue`, {
    schema: {
      querystring: projectFiltersQuerySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    return { projects: projectReviewRepository.listQueue(request.query || {}, request.user) };
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
    if (typeof canReadProject === 'function' && !canReadProject(request.user, dossier.project)) {
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
    if (typeof canReadProject === 'function' && !canReadProject(request.user, dossier.project)) {
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
    let sql = 'SELECT * FROM projects WHERE deleted_at IS NULL';
    if (conditions.length) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }
    sql += ' ORDER BY updated_at DESC';

    const rows = filterReadableProjects(db.all(sql, params), request.user);
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
      JOIN projects p ON p.id = s.project_id AND p.deleted_at IS NULL
    `;
    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ' ORDER BY s.project_id, s.created_at DESC';
    const rows = db.all(sql, params);
    const projectRows = filterReadableProjects(
      db.all(
        `SELECT p.* FROM projects p WHERE p.deleted_at IS NULL${conditions.length ? ` AND ${conditions.join(' AND ')}` : ''}`,
        params
      ),
      request.user
    );
    const readableProjectIds = new Set(projectRows.map(project => Number(project.id)));
    const readableRows = rows.filter(row => readableProjectIds.has(Number(row.project_id)));
    logAudit('export.attachments.zip', request, { total: readableRows.length, filters: request.query || {} });

    streamZip(reply, 'attachments.zip', (archive) => {
      const missing = [];
      readableRows.forEach(row => {
        const safeType = sanitizeName(row.submission_type || 'submission');
        const safeName = sanitizeName(row.file_name || 'file');
        const archivePath = `project-${row.project_id}/${safeType}/${row.submission_id}_${safeName}`;
        const absolutePath = typeof resolveUnder === 'function'
          ? resolveUnder(UPLOAD_DIR, row.file_path)
          : path.resolve(UPLOAD_DIR, row.file_path);
        if (!absolutePath) {
          missing.push(archivePath);
          return;
        }
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
    return { items: showcaseRepository.list(request.query || {}, request.user || null) };
  });
}

module.exports = { registerReviewRoutes };

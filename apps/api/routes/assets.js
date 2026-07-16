const fs = require('fs');
const path = require('path');

function registerAssetRoutes(fastify, deps) {
  const {
    API_PREFIX,
    db,
    MATERIALS_DIR,
    UPLOAD_DIR,
    EXTENSION_MIME_MAP,
    requireRole,
    buildProjectFilters,
    canReadProject,
    canReadCourse,
    findCourseByMaterialsRoot,
    logAudit,
    resolveUnder
  } = deps;

  const projectPathParamsSchema = {
    type: 'object',
    required: ['project'],
    additionalProperties: false,
    properties: {
      project: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$' }
    }
  };

  const filesQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      path: { type: 'string', maxLength: 500 }
    }
  };

  const downloadWildcardParamsSchema = {
    type: 'object',
    required: ['*'],
    additionalProperties: false,
    properties: {
      '*': { type: 'string', minLength: 3, maxLength: 600 }
    }
  };

  const downloadQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      inline: { type: 'string', maxLength: 16 }
    }
  };

  function requireCourseAssetAccess(request, reply, materialsRoot) {
    if (typeof findCourseByMaterialsRoot !== 'function' || typeof canReadCourse !== 'function') return true;
    const course = findCourseByMaterialsRoot(materialsRoot);
    if (!course) return true;
    if (canReadCourse(request.user || null, course)) return true;
    reply.code(404);
    reply.send({ error: '资料不存在' });
    return false;
  }

  fastify.get(`${API_PREFIX}/files/*`, async (_request, reply) => {
    reply.code(400);
    return { error: 'Invalid path' };
  });

  fastify.get(`${API_PREFIX}/stats`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const { conditions, params } = buildProjectFilters(request.query);
    conditions.unshift('deleted_at IS NULL');
    const whereSql = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const projects = db.all(`SELECT * FROM projects${whereSql}`, params)
      .filter(project => typeof canReadProject !== 'function' || canReadProject(request.user, project));
    const byStatus = Object.values(projects.reduce((acc, project) => {
      const status = project.status || '';
      if (!acc[status]) acc[status] = { status, count: 0 };
      acc[status].count += 1;
      return acc;
    }, {}));
    logAudit('stats.view', request, { filters: request.query || {} });
    return { total: projects.length, byStatus };
  });

  fastify.get(`${API_PREFIX}/files/:project`, {
    schema: {
      params: projectPathParamsSchema,
      querystring: filesQuerySchema
    }
  }, async (request, reply) => {
    const projectId = String(request.params.project || '');
    const subPath = String(request.query.path || '');

    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(projectId) || subPath.includes('..')) {
      reply.code(400);
      return { error: 'Invalid path' };
    }

    const projectDir = typeof resolveUnder === 'function'
      ? resolveUnder(MATERIALS_DIR, projectId)
      : path.resolve(MATERIALS_DIR, projectId);
    const targetDir = !subPath
      ? projectDir
      : (projectDir && typeof resolveUnder === 'function'
        ? resolveUnder(projectDir, subPath)
        : (projectDir ? path.resolve(projectDir, subPath) : null));

    if (!projectDir || !targetDir) {
      reply.code(403);
      return { error: 'Access denied' };
    }
    if (!requireCourseAssetAccess(request, reply, projectId)) return;

    if (!fs.existsSync(targetDir)) {
      return { files: [] };
    }

    try {
      const dirents = fs.readdirSync(targetDir, { withFileTypes: true });
      const files = dirents.map((dirent) => {
        let size = 0;
        if (dirent.isFile()) {
          try {
            size = fs.statSync(path.join(targetDir, dirent.name)).size;
          } catch (err) {
            if (err.code !== 'ENOENT') fastify.log.debug({ err }, 'asset stat failed');
          }
        }
        return {
          name: dirent.name,
          isDirectory: dirent.isDirectory(),
          size,
          path: subPath ? path.join(subPath, dirent.name) : dirent.name
        };
      });
      files.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
        return a.isDirectory ? -1 : 1;
      });
      return { files };
    } catch (err) {
      fastify.log.error(err);
      return { files: [] };
    }
  });

  fastify.get(`${API_PREFIX}/download/*`, {
    schema: {
      params: downloadWildcardParamsSchema,
      querystring: downloadQuerySchema
    }
  }, async (request, reply) => {
    const wildcard = String(request.params['*'] || '');
    const parts = wildcard.split('/');

    if (parts.length < 2) {
      reply.code(400);
      return { error: 'Invalid path format' };
    }

    const projectId = parts[0];
    const filePath = parts.slice(1).join('/');

    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(projectId) || filePath.includes('..')) {
      reply.code(400);
      return { error: 'Invalid path' };
    }

    const absolutePath = typeof resolveUnder === 'function'
      ? resolveUnder(MATERIALS_DIR, projectId, filePath)
      : path.resolve(MATERIALS_DIR, projectId, filePath);
    if (!absolutePath) {
      reply.code(403);
      return { error: 'Access denied' };
    }
    if (!requireCourseAssetAccess(request, reply, projectId)) return;

    if (!fs.existsSync(absolutePath)) {
      reply.code(404);
      return { error: 'File not found' };
    }

    const filename = path.basename(absolutePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeType = (EXTENSION_MIME_MAP[ext] && EXTENSION_MIME_MAP[ext][0]) || 'application/octet-stream';
    const inlineRequested = ['1', 'true', 'yes'].includes(String(request.query?.inline || '').toLowerCase());
    const isPresentationPreviewAsset = /(^|\/)presentations\/.+\/(Preview\.html|Attachment[^/]+|PreviewProperties\.plist)$/i.test(filePath);
    const disposition = inlineRequested || isPresentationPreviewAsset ? 'inline' : 'attachment';

    reply.header('Content-Type', mimeType);
    reply.header('Content-Disposition', `${disposition}; filename="${encodeURIComponent(filename)}"`);
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Cache-Control', 'private, no-store');
    return reply.send(fs.createReadStream(absolutePath));
  });

  fastify.get(`${API_PREFIX}/project-attachments/:id/download`, {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer', minimum: 1 } }
      }
    }
  }, async (request, reply) => {
    const attachmentId = Number(request.params.id);
    const row = db.get(
      `SELECT a.id, a.file_name, a.file_path, s.type AS submission_type, s.status AS submission_status, p.*
       FROM attachments a
       JOIN submissions s ON s.id = a.submission_id
       JOIN projects p ON p.id = s.project_id
       WHERE a.id = ? AND p.deleted_at IS NULL`,
      [attachmentId]
    );
    const authorized = Boolean(row)
      && request.user
      && typeof canReadProject === 'function'
      && canReadProject(request.user, row);
    if (!authorized) {
      reply.code(404);
      return { error: '文件不存在' };
    }
    const relativePath = String(row.file_path || '').trim().replace(/\\/g, '/');
    const uploadRoot = path.resolve(UPLOAD_DIR);
    const absolutePath = typeof resolveUnder === 'function'
      ? resolveUnder(uploadRoot, relativePath)
      : path.resolve(uploadRoot, relativePath);
    const relative = absolutePath ? path.relative(uploadRoot, absolutePath) : '';
    if (!absolutePath || !relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      reply.code(404);
      return { error: '文件不存在' };
    }
    if (path.extname(row.file_name || relativePath).toLowerCase() === '.svg' || !fs.existsSync(absolutePath)) {
      reply.code(404);
      return { error: '文件不存在' };
    }
    reply
      .header('Content-Type', 'application/octet-stream')
      .header('Content-Disposition', `attachment; filename="${encodeURIComponent(path.basename(row.file_name || relativePath))}"`)
      .header('X-Content-Type-Options', 'nosniff')
      .header('Cache-Control', 'private, no-store');
    return reply.send(fs.createReadStream(absolutePath));
  });

  fastify.get(`${API_PREFIX}/showcase-attachments/:id/download`, {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer', minimum: 1 } }
      }
    }
  }, async (request, reply) => {
    const attachmentId = Number(request.params.id);
    const row = db.get(
      `SELECT a.id, a.file_name, a.file_path, s.type AS submission_type, s.status AS submission_status, p.*
       FROM attachments a
       JOIN submissions s ON s.id = a.submission_id
       JOIN projects p ON p.id = s.project_id
       WHERE a.id = ? AND p.deleted_at IS NULL`,
      [attachmentId]
    );
    if (!row || row.visibility !== 'public' || row.submission_type !== 'showcase' || row.submission_status !== 'approved') {
      reply.code(404);
      return { error: '文件不存在' };
    }
    const uploadRoot = path.resolve(UPLOAD_DIR);
    const relativePath = String(row.file_path || '').trim().replace(/\\/g, '/');
    const absolutePath = typeof resolveUnder === 'function'
      ? resolveUnder(uploadRoot, relativePath)
      : path.resolve(uploadRoot, relativePath);
    const relative = absolutePath ? path.relative(uploadRoot, absolutePath) : '';
    if (!absolutePath || !relative || relative.startsWith('..') || path.isAbsolute(relative)
      || !fs.existsSync(absolutePath) || path.extname(row.file_name || relativePath).toLowerCase() === '.svg') {
      reply.code(404);
      return { error: '文件不存在' };
    }
    reply
      .header('Content-Type', 'application/octet-stream')
      .header('Content-Disposition', `attachment; filename="${encodeURIComponent(path.basename(row.file_name || relativePath))}"`)
      .header('X-Content-Type-Options', 'nosniff')
      .header('Cache-Control', 'private, no-store');
    return reply.send(fs.createReadStream(absolutePath));
  });

  fastify.get(`${API_PREFIX}/mission/projects`, async (request) => {
    const projects = db.all('SELECT * FROM projects WHERE deleted_at IS NULL')
      .filter(project => typeof canReadProject !== 'function' || canReadProject(request.user || null, project));
    const stats = projects.map((project) => {
      const tasks = db.all('SELECT status FROM project_milestones WHERE project_id = ?', [project.id]);
      const total = tasks.length;
      const done = tasks.filter((task) => task.status === 'done' || task.status === 'completed').length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;
      const lastLog = db.get(
        'SELECT created_at FROM dev_logs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
        [project.id]
      );
      const lastActive = lastLog ? lastLog.created_at : project.updated_at;
      return {
        id: project.id,
        name: project.title,
        members: project.team_members,
        lastActive,
        taskStats: { total, done, progress }
      };
    });

    stats.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
    return { projects: stats };
  });
}

module.exports = { registerAssetRoutes };

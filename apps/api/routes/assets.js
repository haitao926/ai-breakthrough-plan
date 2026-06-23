const fs = require('fs');
const path = require('path');

function registerAssetRoutes(fastify, deps) {
  const {
    API_PREFIX,
    db,
    MATERIALS_DIR,
    EXTENSION_MIME_MAP,
    requireRole,
    buildProjectFilters,
    logAudit
  } = deps;

  const projectPathParamsSchema = {
    type: 'object',
    required: ['project'],
    additionalProperties: false,
    properties: {
      project: { type: 'string', minLength: 1, maxLength: 160 }
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

  fastify.get(`${API_PREFIX}/stats`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const { conditions, params } = buildProjectFilters(request.query);
    const whereSql = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const totalRow = db.get(`SELECT COUNT(*) AS count FROM projects${whereSql}`, params);
    const byStatus = db.all(
      `SELECT status, COUNT(*) AS count FROM projects${whereSql} GROUP BY status`,
      params
    );
    logAudit('stats.view', request, { filters: request.query || {} });
    return { total: totalRow ? totalRow.count : 0, byStatus };
  });

  fastify.get(`${API_PREFIX}/files/:project`, {
    schema: {
      params: projectPathParamsSchema,
      querystring: filesQuerySchema
    }
  }, async (request, reply) => {
    const projectId = String(request.params.project || '');
    const subPath = String(request.query.path || '');

    if (subPath.includes('..') || projectId.includes('..')) {
      reply.code(400);
      return { error: 'Invalid path' };
    }

    const projectDir = path.join(MATERIALS_DIR, projectId);
    const targetDir = path.join(projectDir, subPath);

    if (!targetDir.startsWith(MATERIALS_DIR)) {
      reply.code(403);
      return { error: 'Access denied' };
    }

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
          } catch (err) {}
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
      params: downloadWildcardParamsSchema
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

    if (filePath.includes('..') || projectId.includes('..')) {
      reply.code(400);
      return { error: 'Invalid path' };
    }

    const absolutePath = path.join(MATERIALS_DIR, projectId, filePath);
    if (!absolutePath.startsWith(MATERIALS_DIR)) {
      reply.code(403);
      return { error: 'Access denied' };
    }

    if (!fs.existsSync(absolutePath)) {
      reply.code(404);
      return { error: 'File not found' };
    }

    const filename = path.basename(absolutePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeType = (EXTENSION_MIME_MAP[ext] && EXTENSION_MIME_MAP[ext][0]) || 'application/octet-stream';

    reply.header('Content-Type', mimeType);
    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    return reply.send(fs.createReadStream(absolutePath));
  });

  fastify.get(`${API_PREFIX}/mission/projects`, async () => {
    const projects = db.all('SELECT id, title, team_members, updated_at FROM projects');
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

function registerProjectOpsRoutes(fastify, deps) {
  const {
    API_PREFIX,
    db,
    path,
    UPLOAD_DIR,
    requireAuth,
    requireRole,
    requireProjectAccess,
    canReadProject,
    parseProjectId,
    normalizeToolKey,
    now,
    PROJECT_STATUSES,
    safeParseJson,
    buildMilestoneSourceKey,
    getProject,
    getProjectDetail,
    getProjectMilestones,
    getProjectComments,
    getProjectScores,
    loadProjectToolData,
    getProjectToolData,
    upsertProjectToolData,
    updateProjectStatus,
    validateStatusTransition,
    getSubmissionAttachments,
    getProjectResources,
    getProjectDevLogs,
    ensureGiteaRepo,
    logAudit,
    sanitizeName,
    appendFileSafe,
    streamZip,
    fastifyLog,
    resolveUnder
  } = deps;

  const projectIdParamsSchema = {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 }
    }
  };

  const projectToolDataSchema = {
    type: 'object',
    additionalProperties: true,
    properties: {
      data: { type: 'object', additionalProperties: true }
    }
  };

  const syncWbsSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      source: { type: 'string', minLength: 1, maxLength: 50 },
      tasks: {
        type: 'array',
        maxItems: 200,
        items: {
          type: 'object',
          additionalProperties: true,
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            phase: { type: 'string', maxLength: 80 },
            description: { type: 'string', maxLength: 2000 },
            sourceKey: { type: 'string', maxLength: 120 },
            source_key: { type: 'string', maxLength: 120 },
            output: { type: 'string', maxLength: 2000 },
            deliverables: { type: ['object', 'string', 'null'] },
            sort_order: { type: 'integer' },
            sortOrder: { type: 'integer' }
          }
        }
      }
    }
  };

  const projectLogSchema = {
    type: 'object',
    required: ['content'],
    additionalProperties: false,
    properties: {
      content: { type: 'string', minLength: 1, maxLength: 5000 },
      tags: { type: 'string', maxLength: 500 }
    }
  };

  const resourceRequestSchema = {
    type: 'object',
    required: ['item_name'],
    additionalProperties: false,
    properties: {
      type: { type: 'string', maxLength: 50 },
      item_name: { type: 'string', minLength: 1, maxLength: 200 },
      quantity: { type: 'integer', minimum: 1, maximum: 999 },
      reason: { type: 'string', maxLength: 2000 }
    }
  };

  const projectStatusUpdateSchema = {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: {
      status: { type: 'string', maxLength: 80 },
      note: { type: 'string', maxLength: 2000 }
    }
  };

  const resourceStatusUpdateSchema = {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: {
      status: { type: 'string', enum: ['approved', 'rejected'] },
      reply: { type: 'string', maxLength: 2000 }
    }
  };

  const ticketCreateSchema = {
    type: 'object',
    required: ['title'],
    additionalProperties: false,
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200 },
      description: { type: 'string', maxLength: 4000 },
      priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] }
    }
  };

  const ticketUpdateSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'] },
      resolution: { type: 'string', maxLength: 2000 }
    }
  };

  const milestoneSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200 },
      phase: { type: 'string', maxLength: 80 },
      description: { type: 'string', maxLength: 2000 },
      deadline: { type: ['string', 'null'], maxLength: 80 },
      assignee: { type: ['string', 'null'], maxLength: 120 },
      start_date: { type: ['string', 'null'], maxLength: 80 },
      startDate: { type: ['string', 'null'], maxLength: 80 },
      start: { type: ['string', 'null'], maxLength: 80 },
      end_date: { type: ['string', 'null'], maxLength: 80 },
      endDate: { type: ['string', 'null'], maxLength: 80 },
      end: { type: ['string', 'null'], maxLength: 80 },
      output: { type: ['string', 'null'], maxLength: 2000 },
      deliverables: { type: ['object', 'string', 'null'] },
      source: { type: ['string', 'null'], maxLength: 50 },
      sourceKey: { type: ['string', 'null'], maxLength: 120 },
      source_key: { type: ['string', 'null'], maxLength: 120 },
      parent_id: { type: ['integer', 'null'] },
      parentId: { type: ['integer', 'null'] },
      sort_order: { type: ['integer', 'null'] },
      sortOrder: { type: ['integer', 'null'] },
      status: { type: 'string', enum: ['pending', 'todo', 'doing', 'done', 'reviewed', 'needs_changes'] }
    }
  };

  const blueprintSchema = {
    type: 'object',
    required: ['strategy', 'wbs'],
    additionalProperties: true,
    properties: {
      strategy: { type: 'string', minLength: 1, maxLength: 2000 },
      wbs: { type: 'array', minItems: 1, maxItems: 300, items: { type: 'object', additionalProperties: true } }
    }
  };

  fastify.get(`${API_PREFIX}/projects/:id/tool-data`, async (request, reply) => {
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
    const items = loadProjectToolData(projectId);
    const data = items.reduce((acc, item) => {
      acc[item.tool_key] = item.data || {};
      return acc;
    }, {});
    return { items, data };
  });

  fastify.get(`${API_PREFIX}/projects/:id/tool-data/:toolKey`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const projectId = parseProjectId(request.params.id);
    const toolKey = normalizeToolKey(request.params.toolKey);
    if (!projectId || !toolKey) {
      reply.code(400);
      return { error: '项目ID或工具类型无效' };
    }
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'read')) return;
    const row = getProjectToolData(projectId, toolKey);
    return {
      item: row ? { ...row, data: safeParseJson(row.data) || {} } : null,
      data: row ? (safeParseJson(row.data) || {}) : null
    };
  });

  fastify.put(`${API_PREFIX}/projects/:id/tool-data/:toolKey`, {
    schema: {
      params: projectIdParamsSchema,
      body: projectToolDataSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const projectId = parseProjectId(request.params.id);
    const toolKey = normalizeToolKey(request.params.toolKey);
    if (!projectId || !toolKey) {
      reply.code(400);
      return { error: '项目ID或工具类型无效' };
    }
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'write')) return;
    const payload = request.body && Object.prototype.hasOwnProperty.call(request.body, 'data')
      ? request.body.data
      : request.body;
    const item = upsertProjectToolData(projectId, toolKey, payload || {}, request.user.id);
    logAudit('project.tool_data.upsert', request, { projectId, toolKey });
    return { item, data: item.data };
  });

  fastify.post(`${API_PREFIX}/projects/:id/sync-wbs`, {
    schema: {
      params: projectIdParamsSchema,
      body: syncWbsSchema
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

    const tasks = Array.isArray(request.body?.tasks) ? request.body.tasks : [];
    const source = normalizeToolKey(request.body?.source || 'wbs') || 'wbs';
    const synced = [];
    const nowAt = now();
    tasks.forEach((task, index) => {
      const title = String(task?.title || '').trim();
      if (!title) return;
      const phase = String(task?.phase || task?.description || 'm1').trim() || 'm1';
      const sourceKey = String(task?.sourceKey || task?.source_key || buildMilestoneSourceKey(task, index)).trim();
      const output = String(task?.output || task?.deliverables?.output || '').trim();
      const deliverables = {
        ...(typeof task?.deliverables === 'object' && task.deliverables !== null ? task.deliverables : {}),
        output
      };
      const sortOrder = Number.isFinite(Number(task?.sort_order ?? task?.sortOrder))
        ? Number(task?.sort_order ?? task?.sortOrder)
        : index;
      const existing = db.get(
        'SELECT id FROM project_milestones WHERE project_id = ? AND source = ? AND source_key = ?',
        [projectId, source, sourceKey]
      );
      if (existing) {
        db.run(
          `UPDATE project_milestones
           SET title = ?, description = ?, sort_order = ?, deliverables = ?, updated_at = ?
           WHERE id = ?`,
          [title, phase, sortOrder, JSON.stringify(deliverables), nowAt, existing.id]
        );
        synced.push(existing.id);
        return;
      }
      const info = db.run(
        `INSERT INTO project_milestones (project_id, title, description, parent_id, sort_order, assignee, start_date, end_date, deadline, deliverables, source, source_key, status, created_at, updated_at)
         VALUES (?, ?, ?, NULL, ?, NULL, NULL, NULL, NULL, ?, ?, ?, 'pending', ?, ?)`,
        [projectId, title, phase, sortOrder, JSON.stringify(deliverables), source, sourceKey, nowAt, nowAt]
      );
      synced.push(info.lastInsertRowid);
    });
    logAudit('project.wbs.sync', request, { projectId, count: synced.length });
    return { success: true, synced, milestones: getProjectMilestones(projectId) };
  });

  fastify.get(`${API_PREFIX}/projects/:id/attachments.zip`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge', 'admin'])) return;
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

    const rows = db.all(
      `SELECT a.file_name, a.file_path, s.type AS submission_type, s.id AS submission_id
       FROM attachments a
       JOIN submissions s ON s.id = a.submission_id
       JOIN projects p ON p.id = s.project_id AND p.deleted_at IS NULL
       WHERE s.project_id = ?
       ORDER BY s.created_at DESC`,
      [projectId]
    );
    logAudit('project.attachments.zip', request, { projectId, total: rows.length });

    streamZip(reply, `project-${projectId}-attachments.zip`, (archive) => {
      const missing = [];
      rows.forEach(row => {
        const safeType = sanitizeName(row.submission_type || 'submission');
        const safeName = sanitizeName(row.file_name || 'file');
        const archivePath = `project-${projectId}/${safeType}/${row.submission_id}_${safeName}`;
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

  fastify.get(`${API_PREFIX}/projects/:id/archive.zip`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge', 'admin'])) return;
    const projectId = parseProjectId(request.params.id);
    if (!projectId) {
      reply.code(400);
      return { error: '项目ID无效' };
    }
    const detail = getProjectDetail(projectId);
    if (!detail) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, detail.project, 'read')) return;

    const comments = getProjectComments(projectId);
    const scores = getProjectScores(projectId);
    const attachments = db.all(
      `SELECT a.file_name, a.file_path, s.type AS submission_type, s.id AS submission_id
       FROM attachments a
       JOIN submissions s ON s.id = a.submission_id
       JOIN projects p ON p.id = s.project_id AND p.deleted_at IS NULL
       WHERE s.project_id = ?
       ORDER BY s.created_at DESC`,
      [projectId]
    );
    logAudit('project.archive.zip', request, { projectId, total: attachments.length });

    streamZip(reply, `project-${projectId}-archive.zip`, (archive) => {
      const missing = [];
      archive.append(JSON.stringify(detail.project, null, 2), { name: 'project.json' });
      archive.append(JSON.stringify(detail.members || [], null, 2), { name: 'members.json' });
      archive.append(JSON.stringify(detail.submissions || [], null, 2), { name: 'submissions.json' });
      archive.append(JSON.stringify(detail.logs || [], null, 2), { name: 'status_logs.json' });
      archive.append(JSON.stringify(comments || [], null, 2), { name: 'comments.json' });
      archive.append(JSON.stringify(scores || [], null, 2), { name: 'scores.json' });

      attachments.forEach(row => {
        const safeType = sanitizeName(row.submission_type || 'submission');
        const safeName = sanitizeName(row.file_name || 'file');
        const archivePath = `attachments/${safeType}/${row.submission_id}_${safeName}`;
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

  fastify.post(`${API_PREFIX}/projects/:id/status`, {
    schema: {
      params: projectIdParamsSchema,
      body: projectStatusUpdateSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const projectId = parseProjectId(request.params.id);
    if (!projectId) {
      reply.code(400);
      return { error: '项目ID无效' };
    }

    const payload = request.body || {};
    const nextStatus = String(payload.status || '').trim();
    const note = String(payload.note || '').trim();

    if (!PROJECT_STATUSES.has(nextStatus)) {
      reply.code(400);
      return { error: '项目状态无效' };
    }

    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'supervise')) return;
    const transitionError = validateStatusTransition(project.status, nextStatus);
    if (transitionError) {
      reply.code(400);
      return { error: transitionError };
    }

    updateProjectStatus(projectId, nextStatus, note);
    logAudit('project.status.update', request, { projectId, status: nextStatus });
    if (nextStatus === 'approved') {
      try {
        await ensureGiteaRepo(getProject(projectId), request);
      } catch (err) {
        fastifyLog.error(err, 'auto create gitea repo failed');
        logAudit('gitea.repo.error', request, { projectId, message: err.message });
      }
    }
    return { success: true };
  });

  fastify.get(`${API_PREFIX}/projects/:id/logs`, async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const projectId = parseProjectId(request.params.id);
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'read')) return;
    const logs = getProjectDevLogs(projectId);
    return { logs };
  });

  fastify.post(`${API_PREFIX}/projects/:id/logs`, {
    schema: {
      params: projectIdParamsSchema,
      body: projectLogSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const projectId = parseProjectId(request.params.id);
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'write')) return;
    const payload = request.body || {};
    const content = String(payload.content || '').trim();
    const tags = String(payload.tags || '').trim();

    if (!content) {
      reply.code(400);
      return { error: '日志内容必填' };
    }

    db.run(
      'INSERT INTO dev_logs (project_id, author_id, content, tags, created_at) VALUES (?, ?, ?, ?, ?)',
      [projectId, request.user.id, content, tags, now()]
    );
    return { success: true };
  });

  fastify.get(`${API_PREFIX}/projects/:id/resources`, async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const projectId = parseProjectId(request.params.id);
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'read')) return;
    return { requests: getProjectResources(projectId) };
  });

  fastify.post(`${API_PREFIX}/projects/:id/resources`, {
    schema: {
      params: projectIdParamsSchema,
      body: resourceRequestSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student'])) return;
    const projectId = parseProjectId(request.params.id);
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'write')) return;
    const payload = request.body || {};
    const type = String(payload.type || 'hardware');
    const itemName = String(payload.item_name || '').trim();
    const quantity = Number(payload.quantity) || 1;
    const reason = String(payload.reason || '').trim();

    if (!itemName) {
      reply.code(400);
      return { error: '物资名称必填' };
    }

    db.run(
      `INSERT INTO resource_requests (project_id, requester_id, type, item_name, quantity, reason, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [projectId, request.user.id, type, itemName, quantity, reason, now(), now()]
    );
    logAudit('resource.request', request, { projectId, item: itemName });
    return { success: true };
  });

  fastify.patch(`${API_PREFIX}/resources/:id/status`, {
    schema: {
      params: projectIdParamsSchema,
      body: resourceStatusUpdateSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const requestId = parseProjectId(request.params.id);
    const payload = request.body || {};
    const status = String(payload.status || '').trim();
    const replyText = String(payload.reply || '').trim();

    if (!['approved', 'rejected'].includes(status)) {
      reply.code(400);
      return { error: '状态无效' };
    }
    const resource = db.get('SELECT * FROM resource_requests WHERE id = ?', [requestId]);
    if (!resource) {
      reply.code(404);
      return { error: '资源申请不存在' };
    }
    const project = getProject(resource.project_id);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'supervise')) return;

    db.run(
      'UPDATE resource_requests SET status = ?, reply = ?, updated_at = ? WHERE id = ?',
      [status, replyText, now(), requestId]
    );
    return { success: true };
  });

  fastify.get(`${API_PREFIX}/projects/:id/tickets`, async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const projectId = parseProjectId(request.params.id);
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'read')) return;
    const tickets = db.all(
      `SELECT t.*, u.name AS requester_name, u.avatar_url
       FROM help_tickets t
       JOIN users u ON u.id = t.requester_id
       WHERE t.project_id = ?
       ORDER BY t.status ASC, t.priority DESC, t.created_at DESC`,
      [projectId]
    );
    return { tickets };
  });

  fastify.post(`${API_PREFIX}/projects/:id/tickets`, {
    schema: {
      params: projectIdParamsSchema,
      body: ticketCreateSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student'])) return;
    const projectId = parseProjectId(request.params.id);
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'write')) return;
    const payload = request.body || {};
    const title = String(payload.title || '').trim();
    const description = String(payload.description || '').trim();
    const priority = String(payload.priority || 'normal');

    if (!title) {
      reply.code(400);
      return { error: '标题必填' };
    }

    db.run(
      `INSERT INTO help_tickets (project_id, requester_id, title, description, priority, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`,
      [projectId, request.user.id, title, description, priority, now(), now()]
    );
    logAudit('ticket.create', request, { projectId, title });
    return { success: true };
  });

  fastify.patch(`${API_PREFIX}/tickets/:id`, {
    schema: {
      params: projectIdParamsSchema,
      body: ticketUpdateSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const ticketId = parseProjectId(request.params.id);
    const payload = request.body || {};

    const ticket = db.get('SELECT * FROM help_tickets WHERE id = ?', [ticketId]);
    if (!ticket) {
      reply.code(404);
      return { error: '工单不存在' };
    }
    const project = getProject(ticket.project_id);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'write')) return;

    const status = payload.status || ticket.status;
    const resolution = payload.resolution || ticket.resolution;

    db.run(
      'UPDATE help_tickets SET status = ?, resolution = ?, updated_at = ? WHERE id = ?',
      [status, resolution, now(), ticketId]
    );
    return { success: true };
  });

  fastify.get(`${API_PREFIX}/admin/resources`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    const status = request.query.status;
    let sql = `SELECT r.*, u.name AS requester_name, p.title AS project_title
               FROM resource_requests r
               JOIN users u ON u.id = r.requester_id
               JOIN projects p ON p.id = r.project_id AND p.deleted_at IS NULL`;
    const params = [];
    if (status) {
      sql += ' WHERE r.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY r.created_at DESC';
    return {
      requests: db.all(sql, params).filter(row => (
        typeof canReadProject !== 'function' || canReadProject(request.user, getProject(row.project_id))
      ))
    };
  });

  fastify.get(`${API_PREFIX}/teacher/resources`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    const status = request.query.status;
    let sql = `SELECT r.*, u.name AS requester_name, p.title AS project_title
               FROM resource_requests r
               JOIN users u ON u.id = r.requester_id
               JOIN projects p ON p.id = r.project_id AND p.deleted_at IS NULL`;
    const params = [];
    if (status) {
      sql += ' WHERE r.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY r.created_at DESC';
    return {
      requests: db.all(sql, params).filter(row => (
        typeof canReadProject !== 'function' || canReadProject(request.user, getProject(row.project_id))
      ))
    };
  });

  fastify.get(`${API_PREFIX}/projects/:id/milestones`, async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const projectId = parseProjectId(request.params.id);
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'read')) return;
    return { milestones: getProjectMilestones(projectId) };
  });

  fastify.post(`${API_PREFIX}/projects/:id/milestones`, {
    schema: {
      params: projectIdParamsSchema,
      body: {
        ...milestoneSchema,
        required: ['title']
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const projectId = parseProjectId(request.params.id);
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'write')) return;
    const payload = request.body || {};
    const title = String(payload.title || '').trim();
    const rawPhase = payload.phase ?? payload.description ?? 'm1';
    const description = String(rawPhase || 'm1').trim() || 'm1';
    const deadline = payload.deadline ? String(payload.deadline).trim() : null;
    const assignee = payload.assignee ? String(payload.assignee).trim() : null;
    const startDate = payload.start_date ?? payload.startDate ?? payload.start ?? null;
    const endDate = payload.end_date ?? payload.endDate ?? payload.end ?? null;
    const output = payload.output;
    const deliverablesPayload = payload.deliverables;
    const source = payload.source ? normalizeToolKey(payload.source) : null;
    const sourceKey = payload.sourceKey || payload.source_key
      ? String(payload.sourceKey || payload.source_key).trim()
      : null;
    const rawParentId = payload.parent_id ?? payload.parentId ?? null;
    let parentId = rawParentId === '' ? null : rawParentId;
    if (parentId !== null && parentId !== undefined) {
      parentId = Number(parentId);
      if (Number.isNaN(parentId)) parentId = null;
    } else {
      parentId = null;
    }
    const rawSortOrder = payload.sort_order ?? payload.sortOrder ?? null;
    let sortOrder = rawSortOrder === '' ? null : rawSortOrder;
    if (sortOrder !== null && sortOrder !== undefined) {
      sortOrder = Number(sortOrder);
      if (Number.isNaN(sortOrder)) sortOrder = null;
    } else {
      sortOrder = null;
    }

    if (!title) {
      reply.code(400);
      return { error: '任务名称必填' };
    }

    if (sortOrder === null) {
      const row = db.get(
        'SELECT MAX(COALESCE(sort_order, id)) AS max_order FROM project_milestones WHERE project_id = ? AND description = ? AND parent_id IS ?',
        [projectId, description, parentId]
      );
      const maxOrder = row && row.max_order !== null && row.max_order !== undefined ? Number(row.max_order) : null;
      sortOrder = Number.isFinite(maxOrder) ? maxOrder + 1 : 0;
    }

    let deliverables = null;
    if (deliverablesPayload !== undefined) {
      if (typeof deliverablesPayload === 'string') {
        deliverables = deliverablesPayload;
      } else {
        deliverables = JSON.stringify(deliverablesPayload);
      }
    } else if (output !== undefined) {
      deliverables = JSON.stringify({ output: String(output || '').trim() });
    }

    const info = db.run(
      `INSERT INTO project_milestones (project_id, title, description, parent_id, sort_order, assignee, start_date, end_date, deadline, deliverables, source, source_key, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        projectId,
        title,
        description,
        parentId,
        sortOrder,
        assignee,
        startDate ? String(startDate).trim() : null,
        endDate ? String(endDate).trim() : null,
        deadline,
        deliverables,
        source,
        sourceKey,
        now(),
        now()
      ]
    );
    return { success: true, id: info.lastInsertRowid };
  });

  fastify.patch(`${API_PREFIX}/milestones/:id`, {
    schema: {
      params: projectIdParamsSchema,
      body: milestoneSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const id = parseProjectId(request.params.id);
    const milestone = db.get('SELECT * FROM project_milestones WHERE id = ?', [id]);
    if (!milestone) {
      reply.code(404);
      return { error: '任务不存在' };
    }
    const project = getProject(milestone.project_id);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'write')) return;
    const payload = request.body || {};
    const status = payload.status;
    const description = payload.phase ?? payload.description;
    const deadline = payload.deadline;
    const assignee = payload.assignee;
    const title = payload.title;
    const startDate = payload.start_date ?? payload.startDate ?? payload.start;
    const endDate = payload.end_date ?? payload.endDate ?? payload.end;
    const output = payload.output;
    const deliverablesPayload = payload.deliverables;
    const hasParent = Object.prototype.hasOwnProperty.call(payload, 'parent_id') || Object.prototype.hasOwnProperty.call(payload, 'parentId');
    const hasSort = Object.prototype.hasOwnProperty.call(payload, 'sort_order') || Object.prototype.hasOwnProperty.call(payload, 'sortOrder');

    if (title !== undefined) {
      db.run('UPDATE project_milestones SET title = ?, updated_at = ? WHERE id = ?', [String(title || '').trim(), now(), id]);
    }
    if (status) {
      db.run('UPDATE project_milestones SET status = ?, updated_at = ? WHERE id = ?', [status, now(), id]);
    }
    if (description !== undefined) {
      db.run('UPDATE project_milestones SET description = ?, updated_at = ? WHERE id = ?', [description, now(), id]);
    }
    if (deadline !== undefined) {
      db.run('UPDATE project_milestones SET deadline = ?, updated_at = ? WHERE id = ?', [deadline ? String(deadline).trim() : null, now(), id]);
    }
    if (assignee !== undefined) {
      db.run('UPDATE project_milestones SET assignee = ?, updated_at = ? WHERE id = ?', [assignee ? String(assignee).trim() : null, now(), id]);
    }
    if (startDate !== undefined) {
      db.run('UPDATE project_milestones SET start_date = ?, updated_at = ? WHERE id = ?', [startDate ? String(startDate).trim() : null, now(), id]);
    }
    if (endDate !== undefined) {
      db.run('UPDATE project_milestones SET end_date = ?, updated_at = ? WHERE id = ?', [endDate ? String(endDate).trim() : null, now(), id]);
    }
    if (deliverablesPayload !== undefined || output !== undefined) {
      const row = db.get('SELECT deliverables FROM project_milestones WHERE id = ?', [id]);
      let current = safeParseJson(row?.deliverables) || {};
      if (deliverablesPayload !== undefined) {
        if (typeof deliverablesPayload === 'string') {
          const parsed = safeParseJson(deliverablesPayload);
          current = parsed ? { ...current, ...parsed } : current;
        } else if (typeof deliverablesPayload === 'object' && deliverablesPayload !== null) {
          current = { ...current, ...deliverablesPayload };
        }
      }
      if (output !== undefined) {
        current = { ...current, output: String(output || '').trim() };
      }
      db.run('UPDATE project_milestones SET deliverables = ?, updated_at = ? WHERE id = ?', [JSON.stringify(current), now(), id]);
    }
    if (hasParent) {
      const rawParentId = payload.parent_id ?? payload.parentId ?? null;
      let parentId = rawParentId === '' ? null : rawParentId;
      if (parentId !== null && parentId !== undefined) {
        parentId = Number(parentId);
        if (Number.isNaN(parentId)) parentId = null;
      } else {
        parentId = null;
      }
      db.run('UPDATE project_milestones SET parent_id = ?, updated_at = ? WHERE id = ?', [parentId, now(), id]);
    }
    if (hasSort) {
      const rawSortOrder = payload.sort_order ?? payload.sortOrder ?? null;
      let sortOrder = rawSortOrder === '' ? null : rawSortOrder;
      if (sortOrder !== null && sortOrder !== undefined) {
        sortOrder = Number(sortOrder);
        if (Number.isNaN(sortOrder)) sortOrder = null;
      } else {
        sortOrder = null;
      }
      db.run('UPDATE project_milestones SET sort_order = ?, updated_at = ? WHERE id = ?', [sortOrder, now(), id]);
    }
    return { success: true };
  });

  fastify.delete(`${API_PREFIX}/milestones/:id`, {
    schema: {
      params: projectIdParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const id = parseProjectId(request.params.id);
    const milestone = db.get('SELECT * FROM project_milestones WHERE id = ?', [id]);
    if (!milestone) {
      reply.code(404);
      return { error: '任务不存在' };
    }
    const project = getProject(milestone.project_id);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'write')) return;
    db.run('DELETE FROM project_milestones WHERE id = ?', [id]);
    return { success: true };
  });

  fastify.get(`${API_PREFIX}/projects/:id/blueprint`, async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const projectId = parseProjectId(request.params.id);
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'read')) return;
    const row = db.get('SELECT data FROM project_blueprints WHERE project_id = ?', [projectId]);
    return { data: row ? safeParseJson(row.data) : null };
  });

  fastify.post(`${API_PREFIX}/projects/:id/blueprint`, {
    schema: {
      params: projectIdParamsSchema,
      body: blueprintSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const projectId = parseProjectId(request.params.id);
    const project = getProject(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!requireProjectAccess(request, reply, project, 'write')) return;
    const payload = request.body || {};

    if (!payload.strategy || !Array.isArray(payload.wbs)) {
      reply.code(400);
      return { error: 'Invalid blueprint format' };
    }

    const dataJson = JSON.stringify(payload);
    const existing = db.get('SELECT id FROM project_blueprints WHERE project_id = ?', [projectId]);
    const nowAt = now();

    if (existing) {
      db.run(
        'UPDATE project_blueprints SET data = ?, updated_at = ? WHERE id = ?',
        [dataJson, nowAt, existing.id]
      );
    } else {
      db.run(
        'INSERT INTO project_blueprints (project_id, data, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [projectId, dataJson, nowAt, nowAt]
      );
    }

    return { success: true };
  });
}

module.exports = { registerProjectOpsRoutes };

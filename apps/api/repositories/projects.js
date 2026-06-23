function createProjectRepository({
  db,
  now,
  safeParseJson,
  parseAttachmentList,
  toUrlPath,
  buildProjectFilters
}) {
  function getMembership(projectId, userId) {
    return db.get(
      'SELECT id, role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );
  }

  function parseSubmissionAttachments(submissionId, fallback) {
    const rows = db.all(
      'SELECT file_name, file_path, file_size FROM attachments WHERE submission_id = ?',
      [submissionId]
    );
    if (rows.length) {
      return rows.map((row) => ({
        name: row.file_name,
        path: row.file_path,
        size: row.file_size,
        url: `/uploads/${toUrlPath(row.file_path)}`
      }));
    }
    return parseAttachmentList(fallback).map((att) => ({
      ...att,
      url: `/uploads/${toUrlPath(att.path)}`
    }));
  }

  function getById(projectId) {
    return db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
  }

  function addMembersWithExecutor(executor, projectId, memberIds, role = 'member') {
    const normalizedIds = [...new Set((memberIds || [])
      .map((id) => Number.parseInt(String(id), 10))
      .filter((id) => Number.isFinite(id) && id > 0))];
    const createdAt = now();
    normalizedIds.forEach((memberId) => {
      const existing = executor.get(
        'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
        [projectId, memberId]
      );
      if (existing) return;
      executor.run(
        'INSERT INTO project_members (project_id, user_id, role, created_at) VALUES (?, ?, ?, ?)',
        [projectId, memberId, role, createdAt]
      );
    });
  }

  function addMembers(projectId, memberIds, role = 'member') {
    if (!memberIds?.length) return;
    db.transaction((trx) => {
      addMembersWithExecutor(trx, projectId, memberIds, role);
    });
  }

  function createProject({
    title,
    summary,
    teamMembers,
    className,
    giteaRepoUrl,
    memberIds,
    createdBy
  }) {
    const createdAt = now();
    return db.transaction((trx) => {
      const info = trx.run(
        `INSERT INTO projects (title, summary, team_members, class_name, status, created_at, updated_at, created_by, gitea_repo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          summary,
          teamMembers,
          className,
          'submitted',
          createdAt,
          createdAt,
          createdBy,
          giteaRepoUrl
        ]
      );
      const projectId = info.lastInsertRowid;
      trx.run(
        'INSERT INTO project_logs (project_id, status, note, created_at) VALUES (?, ?, ?, ?)',
        [projectId, 'submitted', '立项提交', createdAt]
      );
      addMembersWithExecutor(trx, projectId, [createdBy], 'owner');
      if (memberIds?.length) {
        addMembersWithExecutor(trx, projectId, memberIds, 'member');
      }
      return projectId;
    });
  }

  function listProjects(query = {}, user = null) {
    const { conditions, params } = buildProjectFilters(query);
    if (user?.role === 'student') {
      conditions.push('(created_by = ? OR id IN (SELECT project_id FROM project_members WHERE user_id = ?))');
      params.push(user.id, user.id);
    }

    let sql = 'SELECT * FROM projects';
    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ' ORDER BY updated_at DESC';
    return db.all(sql, params);
  }

  function insertLog(projectId, status, note = '') {
    db.run(
      'INSERT INTO project_logs (project_id, status, note, created_at) VALUES (?, ?, ?, ?)',
      [projectId, status, note, now()]
    );
  }

  function updateStatus(projectId, status, note) {
    db.run('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?', [
      status,
      now(),
      projectId
    ]);
    insertLog(projectId, status, note || '');
  }

  function listToolData(projectId) {
    return db.all(
      `SELECT id, project_id, tool_key, data, created_by, updated_by, created_at, updated_at
       FROM project_tool_data
       WHERE project_id = ?
       ORDER BY updated_at DESC, id DESC`,
      [projectId]
    ).map((row) => ({
      ...row,
      data: safeParseJson(row.data) || {}
    }));
  }

  function getToolData(projectId, toolKey) {
    return db.get(
      `SELECT id, project_id, tool_key, data, created_by, updated_by, created_at, updated_at
       FROM project_tool_data
       WHERE project_id = ? AND tool_key = ?`,
      [projectId, toolKey]
    );
  }

  function upsertToolData(projectId, toolKey, data, userId) {
    const payload = typeof data === 'string' ? safeParseJson(data) : data;
    const dataJson = JSON.stringify(payload && typeof payload === 'object' ? payload : {});
    const existing = db.get(
      'SELECT id, created_by FROM project_tool_data WHERE project_id = ? AND tool_key = ?',
      [projectId, toolKey]
    );
    const nowAt = now();
    if (existing) {
      db.run(
        'UPDATE project_tool_data SET data = ?, updated_by = ?, updated_at = ? WHERE id = ?',
        [dataJson, userId || null, nowAt, existing.id]
      );
      return { id: existing.id, projectId, toolKey, data: payload || {}, updatedAt: nowAt };
    }
    const info = db.run(
      `INSERT INTO project_tool_data (project_id, tool_key, data, created_by, updated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projectId, toolKey, dataJson, userId || null, userId || null, nowAt, nowAt]
    );
    return { id: info.lastInsertRowid, projectId, toolKey, data: payload || {}, updatedAt: nowAt };
  }

  function getDetail(projectId) {
    const project = getById(projectId);
    if (!project) return null;

    const members = db.all(
      `SELECT u.id, u.name, u.email, u.avatar_url, pm.role
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?
       ORDER BY pm.created_at ASC`,
      [projectId]
    );
    const submissions = db.all(
      'SELECT * FROM submissions WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    ).map((row) => ({
      ...row,
      details: safeParseJson(row.details),
      attachments: parseSubmissionAttachments(row.id, row.attachments)
    }));
    const logs = db.all(
      'SELECT * FROM project_logs WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );
    const toolDataRows = listToolData(projectId);
    const toolData = toolDataRows.reduce((acc, item) => {
      acc[item.tool_key] = item.data || {};
      return acc;
    }, {});

    return { project, members, submissions, logs, toolData, toolDataRows };
  }

  function listMilestones(projectId) {
    return db.all(
      `SELECT * FROM project_milestones
       WHERE project_id = ?
       ORDER BY COALESCE(sort_order, id) ASC, id ASC`,
      [projectId]
    ).map((row) => ({
      ...row,
      deliverables: safeParseJson(row.deliverables) || {}
    }));
  }

  function listResources(projectId) {
    return db.all(
      `SELECT r.*, u.name AS requester_name, u.email AS requester_email
       FROM resource_requests r
       JOIN users u ON u.id = r.requester_id
       WHERE r.project_id = ?
       ORDER BY r.created_at DESC`,
      [projectId]
    );
  }

  function listDevLogs(projectId) {
    return db.all(
      `SELECT l.id, l.content, l.tags, l.created_at, u.name AS author_name, u.avatar_url
       FROM dev_logs l
       JOIN users u ON u.id = l.author_id
       WHERE l.project_id = ?
       ORDER BY l.created_at DESC`,
      [projectId]
    );
  }

  return {
    getMembership,
    getById,
    createProject,
    listProjects,
    addMembers,
    addMembersWithExecutor,
    insertLog,
    updateStatus,
    listToolData,
    getToolData,
    upsertToolData,
    getDetail,
    listMilestones,
    listResources,
    listDevLogs
  };
}

module.exports = { createProjectRepository };

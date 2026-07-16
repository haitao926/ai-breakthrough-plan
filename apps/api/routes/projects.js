function registerProjectRoutes(fastify, deps) {
  const {
    API_PREFIX,
    requireRole,
    requireProjectAccess,
    parseProjectId,
    getProject,
    getProjectDetail,
    validateGiteaRepo,
    normalizeMemberIds,
    getProjectRepository,
    logAudit
  } = deps;

  const createProjectSchema = {
    type: 'object',
    required: ['title'],
    additionalProperties: true,
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200 },
      summary: { type: 'string', maxLength: 2000 },
      teamMembers: { type: 'string', maxLength: 1000 },
      className: { type: 'string', maxLength: 80 },
      giteaRepoUrl: { type: 'string', maxLength: 500 },
      memberIds: { type: 'array', items: { type: 'integer' }, maxItems: 20 },
      visibility: { type: 'string', enum: ['public', 'assigned', 'private'] },
      visibleToRoles: { type: 'array', items: { type: 'string', maxLength: 40 }, maxItems: 20 },
      visibleToUserIds: { type: 'array', items: { type: 'integer' }, maxItems: 200 },
      visibleToClassNames: { type: 'array', items: { type: 'string', maxLength: 120 }, maxItems: 100 }
    }
  };

  const projectIdSchema = {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer', minimum: 1 }
    }
  };

  const addMembersSchema = {
    type: 'object',
    required: ['memberIds'],
    additionalProperties: true,
    properties: {
      memberIds: { type: 'array', items: { type: 'integer' }, minItems: 1, maxItems: 20 }
    }
  };

  const deleteProjectSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      reason: { type: 'string', maxLength: 500 }
    }
  };

  fastify.post(`${API_PREFIX}/projects`, {
    schema: {
      body: createProjectSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const projectRepository = getProjectRepository();
    const payload = request.body || {};
    const title = String(payload.title || '').trim();
    if (!title) {
      reply.code(400);
      return { error: '项目名称必填' };
    }

    const summary = String(payload.summary || '').trim();
    const teamMembers = String(payload.teamMembers || '').trim();
    const className = String(payload.className || '').trim();
    const giteaRepoUrl = String(payload.giteaRepoUrl || '').trim();
    const memberIds = normalizeMemberIds(payload.memberIds);
    const createdBy = request.user.id;

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

    const projectId = projectRepository.createProject({
      title,
      summary,
      teamMembers,
      className,
      giteaRepoUrl,
      memberIds,
      createdBy,
      visibility: payload.visibility,
      visibleToRoles: payload.visibleToRoles ?? payload.visible_to_roles,
      visibleToUserIds: payload.visibleToUserIds ?? payload.visible_to_user_ids,
      visibleToClassNames: payload.visibleToClassNames ?? payload.visible_to_class_names
    });

    const project = getProject(projectId);
    logAudit('project.create', request, { projectId });
    return { project };
  });

  fastify.get(`${API_PREFIX}/projects`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const projectRepository = getProjectRepository();
    return { projects: projectRepository.listProjects(request.query, request.user) };
  });

  fastify.get(`${API_PREFIX}/projects/:id`, async (request, reply) => {
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
    return getProjectDetail(projectId);
  });

  fastify.post(`${API_PREFIX}/projects/:id/members`, {
    schema: {
      params: projectIdSchema,
      body: addMembersSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const projectRepository = getProjectRepository();
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
    const memberIds = normalizeMemberIds(payload.memberIds);
    if (!memberIds.length) {
      reply.code(400);
      return { error: '成员列表为空' };
    }

    projectRepository.addMembers(projectId, memberIds, 'member');
    logAudit('project.members.add', request, { projectId, memberIds });
    return { success: true };
  });

  fastify.delete(`${API_PREFIX}/projects/:id`, {
    schema: {
      params: projectIdSchema,
      body: deleteProjectSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const projectRepository = getProjectRepository();
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

    const isAdmin = request.user?.role === 'admin';
    const isOwner = Number(project.created_by) === Number(request.user?.id);
    if (!isAdmin && !isOwner) {
      reply.code(403);
      return { error: '只有项目创建者或管理员可以删除项目' };
    }
    if (!isAdmin && project.status !== 'submitted' && project.status !== 'draft') {
      reply.code(403);
      return { error: '只能删除初始待立项的项目' };
    }

    const deleted = projectRepository.softDeleteProject(
      projectId,
      request.user.id,
      request.body?.reason || ''
    );
    if (!deleted) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    logAudit('project.delete', request, { projectId });
    return { success: true };
  });

  fastify.post(`${API_PREFIX}/admin/projects/:id/restore`, {
    schema: {
      params: projectIdSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    const projectRepository = getProjectRepository();
    const projectId = parseProjectId(request.params.id);
    if (!projectId) {
      reply.code(400);
      return { error: '项目ID无效' };
    }
    const project = projectRepository.getByIdIncludingDeleted(projectId);
    if (!project) {
      reply.code(404);
      return { error: '项目不存在' };
    }
    if (!project.deleted_at) {
      reply.code(409);
      return { error: '项目未删除' };
    }
    projectRepository.restoreProject(projectId);
    logAudit('project.restore', request, { projectId });
    return { success: true, project: getProject(projectId) };
  });
}

module.exports = { registerProjectRoutes };

const numericIdParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'integer', minimum: 1 }
  }
};

const slugParamsSchema = {
  type: 'object',
  required: ['slug'],
  properties: {
    slug: { type: 'string', minLength: 1, maxLength: 160 }
  }
};

const interactionBodySchema = {
  type: 'object',
  required: ['interactionType'],
  properties: {
    interactionType: { type: 'string', minLength: 1, maxLength: 80 },
    interaction_type: { type: 'string', minLength: 1, maxLength: 80 },
    metadata: { type: 'object' }
  },
  additionalProperties: true
};

const reminderBodySchema = {
  type: 'object',
  required: ['body'],
  properties: {
    title: { type: 'string', maxLength: 160 },
    body: { type: 'string', minLength: 1, maxLength: 4000 },
    candidateBucket: { type: 'string', maxLength: 80 },
    candidate_bucket: { type: 'string', maxLength: 80 },
    studentIds: {
      type: 'array',
      items: { type: 'integer', minimum: 1 },
      maxItems: 200
    }
  },
  additionalProperties: true
};

const reminderReadParamsSchema = {
  type: 'object',
  required: ['id', 'reminderId'],
  properties: {
    id: { anyOf: [{ type: 'integer', minimum: 1 }, { type: 'string', minLength: 1, maxLength: 160 }] },
    reminderId: { type: 'integer', minimum: 1 }
  }
};

const overrideBodySchema = {
  type: 'object',
  required: ['overrideType'],
  properties: {
    overrideType: { type: 'string', enum: ['boost', 'suppress', 'force_include', 'force_exclude'] },
    override_type: { type: 'string', enum: ['boost', 'suppress', 'force_include', 'force_exclude'] },
    note: { type: 'string', maxLength: 2000 }
  },
  additionalProperties: true
};

const recomputeBodySchema = {
  type: 'object',
  properties: {
    scope: { type: 'string', maxLength: 40 },
    user_id: { type: 'integer', minimum: 1 },
    userId: { type: 'integer', minimum: 1 },
    competition_slug: { type: 'string', maxLength: 160 },
    competitionSlug: { type: 'string', maxLength: 160 },
    project_topic_id: { type: 'integer', minimum: 1 },
    projectTopicId: { type: 'integer', minimum: 1 },
    course_id: { type: 'string', maxLength: 160 },
    courseId: { type: 'string', maxLength: 160 },
    team_candidate_id: { type: 'integer', minimum: 1 },
    teamCandidateId: { type: 'integer', minimum: 1 }
  },
  additionalProperties: true
};

function registerMatchingRoutes(fastify, deps) {
  const {
    API_PREFIX,
    db,
    now,
    requireAuth,
    requireRole,
    parseProjectId,
    requestAiChat,
    logAudit,
    listPublishedCompetitions,
    loadPortalCompetitions,
    enrichCompetition,
    buildCoursePreviewMap,
    loadCourseCatalog,
    seedStudentProfile,
    getStudentProfile,
    upsertStudentProfile,
    recomputeCompetitionMatches,
    recomputeProjectTopicMatches,
    recomputeCourseMatches,
    recomputeTeamCandidateMatches,
    getCompetitionMatchDetail,
    getProjectTopicMatchDetail,
    getCourseMatchDetail,
    getTeamCandidateMatchDetail,
    listCompetitionCandidates,
    listProjectTopicCandidates,
    listCourseCandidates,
    listTeamCandidateCandidates,
    listAdminMatchCandidates,
    getUserMatchOverview,
    getAdminUserMatchDashboard,
    getMatchAnalytics,
    createMatchReminders,
    listMatchReminders,
    listUserMatchReminders,
    markMatchReminderRead,
    resolveMatchCandidateBucket,
    saveMatchOverride,
    logMatchInteraction,
    logMatchEvent,
    mapStudentProfile,
    normalizeStudentProfilePayload,
    listTaxonomyTerms,
    mapTaxonomyTerm,
    normalizeTaxonomyTermPayload,
    upsertTaxonomyTerm
  } = deps;

  fastify.get(`${API_PREFIX}/match-taxonomy`, async (request) => {
    const termType = String(request.query?.termType || request.query?.term_type || '').trim();
    const status = String(request.query?.status || 'active').trim();
    return {
      items: listTaxonomyTerms({ termType, status })
    };
  });

  fastify.get(`${API_PREFIX}/admin/match-taxonomy`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    const termType = String(request.query?.termType || request.query?.term_type || '').trim();
    const status = String(request.query?.status || '').trim();
    return {
      items: listTaxonomyTerms({ termType, status })
    };
  });

  fastify.post(`${API_PREFIX}/admin/match-taxonomy`, {
    schema: {
      body: {
        type: 'object',
        required: ['termType', 'termKey', 'label'],
        properties: {
          termType: { type: 'string', minLength: 1, maxLength: 80 },
          term_type: { type: 'string', minLength: 1, maxLength: 80 },
          termKey: { type: 'string', minLength: 1, maxLength: 160 },
          term_key: { type: 'string', minLength: 1, maxLength: 160 },
          label: { type: 'string', minLength: 1, maxLength: 160 },
          aliases: { anyOf: [{ type: 'array' }, { type: 'string', maxLength: 2000 }, { type: 'null' }] },
          status: { type: 'string', maxLength: 40 }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const normalized = normalizeTaxonomyTermPayload(request.body || {});
    if (!normalized.term_type || !normalized.term_key || !normalized.label) {
      reply.code(400);
      return { error: 'termType、termKey、label 必填' };
    }
    const row = upsertTaxonomyTerm(request.body || {});
    logAudit('match.taxonomy.upsert', request, {
      termType: normalized.term_type,
      termKey: normalized.term_key
    });
    reply.code(201);
    return { item: mapTaxonomyTerm(row) };
  });

  fastify.get(`${API_PREFIX}/me/profile`, async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const profile = seedStudentProfile(request.user.id);
    return { item: mapStudentProfile(profile) };
  });

  fastify.put(`${API_PREFIX}/me/profile`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          schoolStage: { type: 'string', maxLength: 80 },
          school_stage: { type: 'string', maxLength: 80 },
          gradeLevel: { type: 'string', maxLength: 80 },
          grade_level: { type: 'string', maxLength: 80 },
          className: { type: 'string', maxLength: 120 },
          class_name: { type: 'string', maxLength: 120 },
          interestTags: { anyOf: [{ type: 'array' }, { type: 'string', maxLength: 2000 }, { type: 'null' }] },
          skillTags: { anyOf: [{ type: 'array' }, { type: 'string', maxLength: 2000 }, { type: 'null' }] },
          targetTags: { anyOf: [{ type: 'array' }, { type: 'string', maxLength: 2000 }, { type: 'null' }] },
          weeklyHours: { type: 'integer', minimum: 0, maximum: 168 },
          weekly_hours: { type: 'integer', minimum: 0, maximum: 168 },
          experienceLevel: { type: 'string', maxLength: 80 },
          experience_level: { type: 'string', maxLength: 80 },
          preferredTeamSize: { type: 'string', maxLength: 80 },
          preferred_team_size: { type: 'string', maxLength: 80 },
          deviceAccess: { type: 'string', maxLength: 200 },
          device_access: { type: 'string', maxLength: 200 },
          notes: { type: 'string', maxLength: 4000 }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const payload = normalizeStudentProfilePayload(request.body || {}, seedStudentProfile(request.user.id));
    const profile = upsertStudentProfile(request.user.id, payload);
    logMatchEvent({
      userId: request.user.id,
      eventType: 'profile_updated',
      payload: { source: 'me.profile' }
    });
    await recomputeCompetitionMatches({
      userIds: [request.user.id],
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    await recomputeProjectTopicMatches({
      userIds: [request.user.id],
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    await recomputeCourseMatches({
      userIds: [request.user.id],
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    await recomputeTeamCandidateMatches({
      userIds: [request.user.id],
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    const studentIds = db.all('SELECT id FROM users WHERE role = ?', ['student'])
      .map(row => Number(row.id))
      .filter(id => Number.isFinite(id) && id > 0);
    if (studentIds.length) {
      await recomputeTeamCandidateMatches({
        userIds: studentIds,
        actor: request.user,
        aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
        forceRefresh: true
      });
    }
    logAudit('match.profile.update', request, { userId: request.user.id });
    return { item: mapStudentProfile(profile) };
  });

  fastify.get(`${API_PREFIX}/me/competition-matches`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    seedStudentProfile(request.user.id);
    const items = await recomputeCompetitionMatches({
      userIds: [request.user.id],
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      preferCached: true
    });
    return { items };
  });

  fastify.get(`${API_PREFIX}/me/competition-matches/:slug`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    seedStudentProfile(request.user.id);
    const item = await getCompetitionMatchDetail({
      userId: request.user.id,
      slug: String(request.params.slug || '').trim(),
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    if (!item) {
      reply.code(404);
      return { error: '匹配结果不存在' };
    }
    return { item };
  });

  fastify.get(`${API_PREFIX}/me/project-topic-matches`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    seedStudentProfile(request.user.id);
    const items = await recomputeProjectTopicMatches({
      userIds: [request.user.id],
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      preferCached: true
    });
    return { items };
  });

  fastify.get(`${API_PREFIX}/me/project-topic-matches/:id`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    seedStudentProfile(request.user.id);
    const item = await getProjectTopicMatchDetail({
      userId: request.user.id,
      topicId: Number(request.params.id),
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    if (!item) {
      reply.code(404);
      return { error: '匹配结果不存在' };
    }
    return { item };
  });

  fastify.get(`${API_PREFIX}/me/course-matches`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    seedStudentProfile(request.user.id);
    const items = await recomputeCourseMatches({
      userIds: [request.user.id],
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      preferCached: true
    });
    return { items };
  });

  fastify.get(`${API_PREFIX}/me/course-matches/:id`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    seedStudentProfile(request.user.id);
    const item = await getCourseMatchDetail({
      userId: request.user.id,
      courseId: String(request.params.id),
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    if (!item) {
      reply.code(404);
      return { error: '匹配结果不存在' };
    }
    return { item };
  });

  fastify.get(`${API_PREFIX}/me/team-matches`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    seedStudentProfile(request.user.id);
    const items = await recomputeTeamCandidateMatches({
      userIds: [request.user.id],
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      preferCached: true
    });
    return { items };
  });

  fastify.get(`${API_PREFIX}/me/team-matches/:id`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    seedStudentProfile(request.user.id);
    const item = await getTeamCandidateMatchDetail({
      userId: request.user.id,
      candidateId: Number(request.params.id),
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    if (!item) {
      reply.code(404);
      return { error: '匹配结果不存在' };
    }
    return { item };
  });

  fastify.post(`${API_PREFIX}/me/competition-matches/:slug/interactions`, {
    schema: {
      params: slugParamsSchema,
      body: interactionBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const slug = String(request.params.slug || '').trim();
    const interactionType = String(request.body?.interactionType || request.body?.interaction_type || '').trim();
    if (!slug || !interactionType) {
      reply.code(400);
      return { error: '赛事 slug 和交互类型必填' };
    }
    logMatchInteraction({
      userId: request.user.id,
      targetType: 'competition',
      targetKey: slug,
      interactionType,
      metadata: request.body?.metadata || {}
    });
    logMatchEvent({
      userId: request.user.id,
      targetType: 'competition',
      targetKey: slug,
      eventType: 'interaction_recorded',
      payload: { interactionType, source: 'me.competition.matches.interaction' }
    });
    logAudit('match.interaction.create', request, { targetType: 'competition', targetKey: slug, interactionType });
    return { success: true };
  });

  fastify.post(`${API_PREFIX}/me/project-topic-matches/:id/interactions`, {
    schema: {
      params: numericIdParamsSchema,
      body: interactionBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const topicId = String(request.params.id || '').trim();
    const interactionType = String(request.body?.interactionType || request.body?.interaction_type || '').trim();
    if (!topicId || !interactionType) {
      reply.code(400);
      return { error: '项目题目 ID 和交互类型必填' };
    }
    logMatchInteraction({
      userId: request.user.id,
      targetType: 'project_topic',
      targetKey: topicId,
      interactionType,
      metadata: request.body?.metadata || {}
    });
    logMatchEvent({
      userId: request.user.id,
      targetType: 'project_topic',
      targetKey: topicId,
      eventType: 'interaction_recorded',
      payload: { interactionType, source: 'me.project-topic.matches.interaction' }
    });
    logAudit('match.interaction.create', request, { targetType: 'project_topic', targetKey: topicId, interactionType });
    return { success: true };
  });

  fastify.post(`${API_PREFIX}/me/course-matches/:id/interactions`, {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', minLength: 1, maxLength: 160 }
        }
      },
      body: interactionBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const courseId = String(request.params.id || '').trim();
    const interactionType = String(request.body?.interactionType || request.body?.interaction_type || '').trim();
    if (!courseId || !interactionType) {
      reply.code(400);
      return { error: '课程 ID 和交互类型必填' };
    }
    logMatchInteraction({
      userId: request.user.id,
      targetType: 'course',
      targetKey: courseId,
      interactionType,
      metadata: request.body?.metadata || {}
    });
    logMatchEvent({
      userId: request.user.id,
      targetType: 'course',
      targetKey: courseId,
      eventType: 'interaction_recorded',
      payload: { interactionType, source: 'me.course.matches.interaction' }
    });
    logAudit('match.interaction.create', request, { targetType: 'course', targetKey: courseId, interactionType });
    return { success: true };
  });

  fastify.post(`${API_PREFIX}/me/team-matches/:id/interactions`, {
    schema: {
      params: numericIdParamsSchema,
      body: interactionBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const candidateId = String(request.params.id || '').trim();
    const interactionType = String(request.body?.interactionType || request.body?.interaction_type || '').trim();
    if (!candidateId || !interactionType) {
      reply.code(400);
      return { error: '组队候选人 ID 和交互类型必填' };
    }
    logMatchInteraction({
      userId: request.user.id,
      targetType: 'team_candidate',
      targetKey: candidateId,
      interactionType,
      metadata: request.body?.metadata || {}
    });
    logMatchEvent({
      userId: request.user.id,
      targetType: 'team_candidate',
      targetKey: candidateId,
      eventType: 'interaction_recorded',
      payload: { interactionType, source: 'me.team.matches.interaction' }
    });
    logAudit('match.interaction.create', request, { targetType: 'team_candidate', targetKey: candidateId, interactionType });
    return { success: true };
  });

  fastify.get(`${API_PREFIX}/admin/competitions/:slug/match-candidates`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const slug = String(request.params.slug || '').trim();
    const items = await listCompetitionCandidates({
      slug,
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    return { items };
  });

  fastify.get(`${API_PREFIX}/teacher/competitions/:slug/match-candidates`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const slug = String(request.params.slug || '').trim();
    const items = await listCompetitionCandidates({
      slug,
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    return { items };
  });

  fastify.get(`${API_PREFIX}/admin/project-topics/:id/match-candidates`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const topicId = Number(request.params.id || 0);
    if (!topicId) {
      reply.code(400);
      return { error: '项目题目 ID 无效' };
    }
    const items = await listProjectTopicCandidates({
      topicId,
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    return { items };
  });

  fastify.get(`${API_PREFIX}/admin/courses/:id/match-candidates`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const courseId = String(request.params.id || '').trim();
    if (!courseId) {
      reply.code(400);
      return { error: '课程 ID 无效' };
    }
    const items = await listCourseCandidates({
      courseId,
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    return { items };
  });

  fastify.get(`${API_PREFIX}/admin/users/:id/team-match-candidates`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const userId = Number(request.params.id || 0);
    if (!userId) {
      reply.code(400);
      return { error: '用户 ID 无效' };
    }
    const items = await listTeamCandidateCandidates({
      userId,
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    return { items };
  });

  fastify.get(`${API_PREFIX}/admin/match-candidates`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const targetType = String(request.query?.targetType || request.query?.target_type || '').trim();
    const candidateBucket = String(request.query?.candidateBucket || request.query?.candidate_bucket || '').trim();
    const userId = Number(request.query?.userId || request.query?.user_id || 0);
    const items = await listAdminMatchCandidates({
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      targetType,
      candidateBucket,
      userId
    });
    return { items };
  });

  fastify.post(`${API_PREFIX}/admin/competitions/:slug/match-reminders`, {
    schema: {
      params: slugParamsSchema,
      body: reminderBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const slug = String(request.params.slug || '').trim();
    const title = String(request.body?.title || '').trim() || '竞赛匹配提醒';
    const body = String(request.body?.body || '').trim();
    if (!body) {
      reply.code(400);
      return { error: '提醒内容不能为空' };
    }
    const candidateBucket = String(request.body?.candidateBucket || request.body?.candidate_bucket || '').trim();
    const studentIds = Array.isArray(request.body?.studentIds)
      ? request.body.studentIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)
      : [];
    const result = await createMatchReminders({
      targetType: 'competition',
      targetKey: slug,
      title,
      body,
      candidateBucket,
      studentIds,
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    if (result.error) {
      reply.code(400);
      return { error: result.error };
    }
    logAudit('match.reminder.bulk_create', request, { slug, count: result.count, candidateBucket: candidateBucket || null });
    return result;
  });

  fastify.post(`${API_PREFIX}/teacher/competitions/:slug/match-reminders`, {
    schema: {
      params: slugParamsSchema,
      body: reminderBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const slug = String(request.params.slug || '').trim();
    const title = String(request.body?.title || '').trim() || '竞赛匹配提醒';
    const body = String(request.body?.body || '').trim();
    if (!body) {
      reply.code(400);
      return { error: '提醒内容不能为空' };
    }
    const candidateBucket = String(request.body?.candidateBucket || request.body?.candidate_bucket || '').trim();
    const studentIds = Array.isArray(request.body?.studentIds)
      ? request.body.studentIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)
      : [];
    const result = await createMatchReminders({
      targetType: 'competition',
      targetKey: slug,
      title,
      body,
      candidateBucket,
      studentIds,
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    if (result.error) {
      reply.code(400);
      return { error: result.error };
    }
    logAudit('match.reminder.bulk_create', request, { slug, count: result.count, candidateBucket: candidateBucket || null });
    return result;
  });

  fastify.get(`${API_PREFIX}/me/project-topic-matches/:id/reminders`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const topicId = String(request.params.id || '').trim();
    if (!topicId) {
      reply.code(400);
      return { error: '项目题目 ID 无效' };
    }
    return { items: listMatchReminders({ targetType: 'project_topic', targetKey: topicId, actor: request.user }) };
  });

  fastify.get(`${API_PREFIX}/me/course-matches/:id/reminders`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const courseId = String(request.params.id || '').trim();
    if (!courseId) {
      reply.code(400);
      return { error: '课程 ID 无效' };
    }
    return { items: listMatchReminders({ targetType: 'course', targetKey: courseId, actor: request.user }) };
  });

  fastify.get(`${API_PREFIX}/me/team-matches/:id/reminders`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const candidateId = String(request.params.id || '').trim();
    if (!candidateId) {
      reply.code(400);
      return { error: '组队候选人 ID 无效' };
    }
    return { items: listMatchReminders({ targetType: 'team_candidate', targetKey: candidateId, actor: request.user }) };
  });

  fastify.get(`${API_PREFIX}/me/match-reminders`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const includeRead = String(request.query?.includeRead || request.query?.include_read || 'true').trim() !== 'false';
    return {
      items: listUserMatchReminders({
        userId: request.user.id,
        includeRead
      })
    };
  });

  fastify.post(`${API_PREFIX}/admin/project-topics/:id/match-reminders`, {
    schema: {
      params: numericIdParamsSchema,
      body: reminderBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const topicId = String(request.params.id || '').trim();
    const title = String(request.body?.title || '').trim() || '项目题目匹配提醒';
    const body = String(request.body?.body || '').trim();
    if (!topicId) {
      reply.code(400);
      return { error: '项目题目 ID 无效' };
    }
    if (!body) {
      reply.code(400);
      return { error: '提醒内容不能为空' };
    }
    const studentIds = Array.isArray(request.body?.studentIds)
      ? request.body.studentIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)
      : [];
    const candidateBucket = String(request.body?.candidateBucket || request.body?.candidate_bucket || '').trim();
    const result = await createMatchReminders({
      targetType: 'project_topic',
      targetKey: topicId,
      title,
      body,
      candidateBucket,
      studentIds,
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    if (result.error) {
      reply.code(400);
      return { error: result.error };
    }
    logAudit('match.project_topic.reminder.bulk_create', request, { topicId, count: result.count, candidateBucket: candidateBucket || null });
    return result;
  });

  fastify.post(`${API_PREFIX}/admin/courses/:id/match-reminders`, {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', minLength: 1, maxLength: 160 }
        }
      },
      body: reminderBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const courseId = String(request.params.id || '').trim();
    const title = String(request.body?.title || '').trim() || '课程匹配提醒';
    const body = String(request.body?.body || '').trim();
    if (!courseId) {
      reply.code(400);
      return { error: '课程 ID 无效' };
    }
    if (!body) {
      reply.code(400);
      return { error: '提醒内容不能为空' };
    }
    const studentIds = Array.isArray(request.body?.studentIds)
      ? request.body.studentIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)
      : [];
    const candidateBucket = String(request.body?.candidateBucket || request.body?.candidate_bucket || '').trim();
    const result = await createMatchReminders({
      targetType: 'course',
      targetKey: courseId,
      title,
      body,
      candidateBucket,
      studentIds,
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    if (result.error) {
      reply.code(400);
      return { error: result.error };
    }
    logAudit('match.course.reminder.bulk_create', request, { courseId, count: result.count, candidateBucket: candidateBucket || null });
    return result;
  });

  fastify.post(`${API_PREFIX}/admin/users/:id/team-match-reminders`, {
    schema: {
      params: numericIdParamsSchema,
      body: reminderBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const candidateId = String(request.params.id || '').trim();
    const title = String(request.body?.title || '').trim() || '组队候选提醒';
    const body = String(request.body?.body || '').trim();
    if (!candidateId) {
      reply.code(400);
      return { error: '组队候选人 ID 无效' };
    }
    if (!body) {
      reply.code(400);
      return { error: '提醒内容不能为空' };
    }
    const studentIds = Array.isArray(request.body?.studentIds)
      ? request.body.studentIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)
      : [];
    const candidateBucket = String(request.body?.candidateBucket || request.body?.candidate_bucket || '').trim();
    const result = await createMatchReminders({
      targetType: 'team_candidate',
      targetKey: candidateId,
      title,
      body,
      candidateBucket,
      studentIds,
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    if (result.error) {
      reply.code(400);
      return { error: result.error };
    }
    logAudit('match.team_candidate.reminder.bulk_create', request, { candidateId, count: result.count, candidateBucket: candidateBucket || null });
    return result;
  });

  fastify.patch(`${API_PREFIX}/me/project-topic-matches/:id/reminders/:reminderId/read`, {
    schema: {
      params: reminderReadParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const topicId = String(request.params.id || '').trim();
    const reminderId = parseProjectId(request.params.reminderId);
    if (!topicId || !reminderId) {
      reply.code(400);
      return { error: '提醒参数无效' };
    }
    const result = markMatchReminderRead({
      reminderId,
      targetType: 'project_topic',
      targetKey: topicId,
      actor: request.user
    });
    if (!result.changes) {
      reply.code(404);
      return { error: '提醒不存在' };
    }
    return { success: true };
  });

  fastify.patch(`${API_PREFIX}/me/course-matches/:id/reminders/:reminderId/read`, {
    schema: {
      params: reminderReadParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const courseId = String(request.params.id || '').trim();
    const reminderId = parseProjectId(request.params.reminderId);
    if (!courseId || !reminderId) {
      reply.code(400);
      return { error: '提醒参数无效' };
    }
    const result = markMatchReminderRead({
      reminderId,
      targetType: 'course',
      targetKey: courseId,
      actor: request.user
    });
    if (!result.changes) {
      reply.code(404);
      return { error: '提醒不存在' };
    }
    return { success: true };
  });

  fastify.patch(`${API_PREFIX}/me/team-matches/:id/reminders/:reminderId/read`, {
    schema: {
      params: reminderReadParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const candidateId = String(request.params.id || '').trim();
    const reminderId = parseProjectId(request.params.reminderId);
    if (!candidateId || !reminderId) {
      reply.code(400);
      return { error: '提醒参数无效' };
    }
    const result = markMatchReminderRead({
      reminderId,
      targetType: 'team_candidate',
      targetKey: candidateId,
      actor: request.user
    });
    if (!result.changes) {
      reply.code(404);
      return { error: '提醒不存在' };
    }
    return { success: true };
  });

  fastify.patch(`${API_PREFIX}/admin/matches/:id/override`, {
    schema: {
      params: numericIdParamsSchema,
      body: overrideBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const matchId = parseProjectId(request.params.id);
    if (!matchId) {
      reply.code(400);
      return { error: '匹配记录 ID 无效' };
    }
    const row = db.get('SELECT * FROM match_results WHERE id = ?', [matchId]);
    if (!row) {
      reply.code(404);
      return { error: '匹配结果不存在' };
    }
    const overrideType = String(request.body?.overrideType || request.body?.override_type || '').trim();
    if (!['boost', 'suppress', 'force_include', 'force_exclude'].includes(overrideType)) {
      reply.code(400);
      return { error: 'override 类型无效' };
    }
    const note = String(request.body?.note || '').trim();
    const override = saveMatchOverride({
      userId: row.user_id,
      targetType: row.target_type,
      targetKey: row.target_key,
      overrideType,
      note,
      createdBy: request.user.id
    });
    logMatchEvent({
      userId: Number(row.user_id || 0),
      targetType: row.target_type,
      targetKey: row.target_key,
      eventType: 'override_updated',
      payload: { overrideType, note, source: 'admin.matches.override' }
    });
    logAudit('match.override.upsert', request, { matchId, overrideType });
    return { item: override };
  });

  fastify.patch(`${API_PREFIX}/teacher/matches/:id/override`, {
    schema: {
      params: numericIdParamsSchema,
      body: overrideBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const matchId = parseProjectId(request.params.id);
    if (!matchId) {
      reply.code(400);
      return { error: '匹配记录 ID 无效' };
    }
    const row = db.get('SELECT * FROM match_results WHERE id = ?', [matchId]);
    if (!row) {
      reply.code(404);
      return { error: '匹配结果不存在' };
    }
    const overrideType = String(request.body?.overrideType || request.body?.override_type || '').trim();
    if (!['boost', 'suppress', 'force_include', 'force_exclude'].includes(overrideType)) {
      reply.code(400);
      return { error: 'override 类型无效' };
    }
    const note = String(request.body?.note || '').trim();
    const override = saveMatchOverride({
      userId: row.user_id,
      targetType: row.target_type,
      targetKey: row.target_key,
      overrideType,
      note,
      createdBy: request.user.id
    });
    logMatchEvent({
      userId: Number(row.user_id || 0),
      targetType: row.target_type,
      targetKey: row.target_key,
      eventType: 'override_updated',
      payload: { overrideType, note, source: 'teacher.matches.override' }
    });
    logAudit('match.override.upsert', request, { matchId, overrideType });
    return { item: override };
  });

  fastify.get(`${API_PREFIX}/admin/users/:id/matches`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const userId = parseProjectId(request.params.id);
    if (!userId) {
      reply.code(400);
      return { error: '用户 ID 无效' };
    }
    seedStudentProfile(userId);
    const items = await getUserMatchOverview({
      userId,
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    return { items };
  });

  fastify.get(`${API_PREFIX}/admin/users/:id/match-dashboard`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const userId = parseProjectId(request.params.id);
    if (!userId) {
      reply.code(400);
      return { error: '用户 ID 无效' };
    }
    seedStudentProfile(userId);
    const item = await getAdminUserMatchDashboard({
      userId,
      actor: request.user,
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim()
    });
    return { item };
  });

  fastify.post(`${API_PREFIX}/admin/matches/recompute`, {
    schema: {
      body: recomputeBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const scope = String(request.body?.scope || '').trim();
    const userId = Number(request.body?.user_id || request.body?.userId || 0);
    const competitionSlug = String(request.body?.competition_slug || request.body?.competitionSlug || '').trim();
    const projectTopicId = Number(request.body?.project_topic_id || request.body?.projectTopicId || 0);
    const courseId = String(request.body?.course_id || request.body?.courseId || '').trim();
    const teamCandidateId = Number(request.body?.team_candidate_id || request.body?.teamCandidateId || 0);
    const userIds = [];
    if (scope === 'all') {
      db.all('SELECT id FROM users WHERE role = ?', ['student']).forEach((row) => {
        if (Number(row.id) > 0) userIds.push(Number(row.id));
      });
    } else if (userId > 0) {
      userIds.push(userId);
    } else if (competitionSlug) {
      db.all('SELECT id FROM users WHERE role = ?', ['student']).forEach((row) => {
        if (Number(row.id) > 0) userIds.push(Number(row.id));
      });
    } else if (projectTopicId > 0) {
      db.all('SELECT id FROM users WHERE role = ?', ['student']).forEach((row) => {
        if (Number(row.id) > 0) userIds.push(Number(row.id));
      });
    } else if (courseId) {
      db.all('SELECT id FROM users WHERE role = ?', ['student']).forEach((row) => {
        if (Number(row.id) > 0) userIds.push(Number(row.id));
      });
    } else if (teamCandidateId > 0) {
      db.all('SELECT id FROM users WHERE role = ?', ['student']).forEach((row) => {
        if (Number(row.id) > 0) userIds.push(Number(row.id));
      });
    } else {
      reply.code(400);
      return { error: '缺少重算范围' };
    }
    const aiKey = String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim();
    const items = [];
    if (scope === 'all' || competitionSlug || userId > 0) {
      items.push(...await recomputeCompetitionMatches({
        userIds,
        actor: request.user,
        competitionSlugs: competitionSlug ? [competitionSlug] : [],
        aiKey,
        forceRefresh: true
      }));
    }
    if (scope === 'all' || projectTopicId > 0 || userId > 0) {
      items.push(...await recomputeProjectTopicMatches({
        userIds,
        actor: request.user,
        projectTopicIds: projectTopicId > 0 ? [projectTopicId] : [],
        aiKey,
        forceRefresh: true
      }));
    }
    if (scope === 'all' || courseId || userId > 0) {
      items.push(...await recomputeCourseMatches({
        userIds,
        actor: request.user,
        courseIds: courseId ? [courseId] : [],
        aiKey,
        forceRefresh: true
      }));
    }
    if (scope === 'all' || teamCandidateId > 0 || userId > 0) {
      items.push(...await recomputeTeamCandidateMatches({
        userIds,
        actor: request.user,
        teamCandidateIds: teamCandidateId > 0 ? [teamCandidateId] : [],
        aiKey,
        forceRefresh: true
      }));
    }
    logAudit('match.recompute', request, { scope: scope || 'partial', userId: userId || null, competitionSlug, projectTopicId: projectTopicId || null, courseId: courseId || null, teamCandidateId: teamCandidateId || null });
    return { items, count: items.length };
  });

  fastify.get(`${API_PREFIX}/admin/match-analytics`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    return { item: getMatchAnalytics() };
  });
}

module.exports = {
  registerMatchingRoutes
};

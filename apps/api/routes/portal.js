function registerPortalRoutes(fastify, deps) {
  const {
    API_PREFIX,
    db,
    now,
    requireRole,
    parseProjectId,
    logAudit,
    COMPETITION_REGISTRATION_STATUSES,
    loadPortalBanners,
    savePortalBanners,
    normalizeBannerPayload,
    loadPortalStories,
    savePortalStories,
    normalizeStoryPayload,
    buildStoryResponse,
    buildCoursePreviewMap,
    listPublishedCompetitions,
    enrichCompetition,
    loadPortalCompetitionDetail,
    loadPortalCompetitions,
    savePortalCompetition,
    normalizeCompetitionPayload,
    getCompetitionRegistrationStats,
    mapCompetitionRegistration,
    mapCompetitionReminder,
    mapProjectTopic,
    normalizeProjectTopicPayload,
    canReadProjectTopic,
    logMatchEvent,
    recomputeCompetitionMatches,
    recomputeProjectTopicMatches
  } = deps;

  function canEditProjectTopic(user, topic) {
    if (!user || !topic) return false;
    if (String(user.role || '').toLowerCase() === 'admin') return true;
    return String(user.role || '').toLowerCase() === 'teacher'
      && Number(topic.created_by || topic.createdBy || 0) === Number(user.id || 0);
  }

  const slugParamsSchema = {
    type: 'object',
    required: ['slug'],
    additionalProperties: false,
    properties: {
      slug: { type: 'string', minLength: 1, maxLength: 120 }
    }
  };

  const slugIdParamsSchema = {
    type: 'object',
    required: ['slug', 'id'],
    additionalProperties: false,
    properties: {
      slug: { type: 'string', minLength: 1, maxLength: 120 },
      id: { type: 'integer', minimum: 1 }
    }
  };

  const reminderReadParamsSchema = {
    type: 'object',
    required: ['slug', 'id'],
    additionalProperties: false,
    properties: {
      slug: { type: 'string', minLength: 1, maxLength: 120 },
      id: { type: 'integer', minimum: 1 }
    }
  };

  const registrationReviewSchema = {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: {
      status: { type: 'string', maxLength: 80 },
      teacherFeedback: { type: 'string', maxLength: 4000 },
      teacher_feedback: { type: 'string', maxLength: 4000 }
    }
  };

  const indexParamsSchema = {
    type: 'object',
    required: ['index'],
    additionalProperties: false,
    properties: {
      index: { type: 'integer', minimum: 0 }
    }
  };

  const storySlugParamsSchema = {
    type: 'object',
    required: ['slug'],
    additionalProperties: false,
    properties: {
      slug: { type: 'string', minLength: 1, maxLength: 120 }
    }
  };

  fastify.get(`${API_PREFIX}/public/banners`, async () => {
    return { items: loadPortalBanners().filter(item => item.active !== false) };
  });

  fastify.get(`${API_PREFIX}/public/competitions`, async () => {
    const courseMap = buildCoursePreviewMap();
    return {
      items: listPublishedCompetitions().map((item) => enrichCompetition(item, courseMap))
    };
  });

  fastify.get(`${API_PREFIX}/public/competitions/:slug`, async (request, reply) => {
    const competition = listPublishedCompetitions().find((item) => item.slug === request.params.slug);
    if (!competition) {
      reply.code(404);
      return { error: 'Competition not found' };
    }
    const courseMap = buildCoursePreviewMap();
    return {
      item: {
        ...enrichCompetition(competition, courseMap),
        detail: loadPortalCompetitionDetail(competition.slug)
      }
    };
  });

  fastify.get(`${API_PREFIX}/public/stories`, async () => {
    const competitionMap = listPublishedCompetitions().reduce((acc, item) => {
      acc[item.slug] = item;
      return acc;
    }, {});
    const courseMap = buildCoursePreviewMap();
    return {
      items: loadPortalStories().map((story) => buildStoryResponse(story, competitionMap, courseMap))
    };
  });

  fastify.get(`${API_PREFIX}/public/stories/:slug`, async (request, reply) => {
    const story = loadPortalStories().find((item) => item.slug === request.params.slug);
    if (!story) {
      reply.code(404);
      return { error: 'Story not found' };
    }
    const competitionMap = listPublishedCompetitions().reduce((acc, item) => {
      acc[item.slug] = item;
      return acc;
    }, {});
    const courseMap = buildCoursePreviewMap();
    return { item: buildStoryResponse(story, competitionMap, courseMap) };
  });

  fastify.get(`${API_PREFIX}/public/path-mappings`, async () => {
    const courseMap = buildCoursePreviewMap();
    const competitions = listPublishedCompetitions().map((item) => enrichCompetition(item, courseMap));
    const stories = loadPortalStories();
    return {
      items: Object.values(courseMap).map((course) => ({
        ...course,
        competitions: competitions
          .filter((item) => item.relatedCourseIds.includes(course.id))
          .map((item) => ({
            slug: item.slug,
            title: item.title,
            tier: item.tier,
            status: item.status
          })),
        stories: stories
          .filter((item) => item.relatedCourseIds.includes(course.id))
          .map((item) => ({
            slug: item.slug,
            title: item.title,
            result: item.result,
            cover: item.cover
          }))
      }))
    };
  });

  fastify.get(`${API_PREFIX}/admin/banners`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    return { banners: loadPortalBanners() };
  });

  fastify.get(`${API_PREFIX}/teacher/banners`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    return { banners: loadPortalBanners() };
  });

  fastify.post(`${API_PREFIX}/admin/banners`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 160 },
          pageKey: { type: 'string', maxLength: 40 },
          summary: { type: 'string', maxLength: 240 },
          subtitle: { type: 'string', maxLength: 240 },
          tag: { type: 'string', maxLength: 80 },
          type: { type: 'string', maxLength: 80 },
          image: { type: 'string', maxLength: 500 },
          imageAlt: { type: 'string', maxLength: 200 },
          targetUrl: { type: 'string', minLength: 1, maxLength: 500 },
          buttonText: { type: 'string', maxLength: 80 },
          ctaLabel: { type: 'string', maxLength: 80 },
          layout: { type: 'string', maxLength: 40 },
          priority: { type: 'integer', minimum: 0, maximum: 9999 },
          active: { type: 'boolean' }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const banner = normalizeBannerPayload(request.body || {});
    if (!banner.title || !banner.targetUrl) {
      reply.code(400);
      return { error: 'Banner 标题与目标链接必填' };
    }
    const banners = loadPortalBanners();
    banners.push(banner);
    savePortalBanners(banners);
    logAudit('banner.create', request, { title: banner.title });
    reply.code(201);
    return { banner };
  });

  fastify.post(`${API_PREFIX}/teacher/banners`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 160 },
          pageKey: { type: 'string', maxLength: 40 },
          summary: { type: 'string', maxLength: 240 },
          subtitle: { type: 'string', maxLength: 240 },
          tag: { type: 'string', maxLength: 80 },
          type: { type: 'string', maxLength: 80 },
          image: { type: 'string', maxLength: 500 },
          imageAlt: { type: 'string', maxLength: 200 },
          targetUrl: { type: 'string', minLength: 1, maxLength: 500 },
          buttonText: { type: 'string', maxLength: 80 },
          ctaLabel: { type: 'string', maxLength: 80 },
          layout: { type: 'string', maxLength: 40 },
          priority: { type: 'integer', minimum: 0, maximum: 9999 },
          active: { type: 'boolean' }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const banner = normalizeBannerPayload(request.body || {});
    if (!banner.title || !banner.targetUrl) {
      reply.code(400);
      return { error: 'Banner 标题与目标链接必填' };
    }
    const banners = loadPortalBanners();
    banners.push(banner);
    savePortalBanners(banners);
    logAudit('banner.create', request, { title: banner.title });
    reply.code(201);
    return { banner };
  });

  fastify.patch(`${API_PREFIX}/admin/banners/:index`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 160 },
          pageKey: { type: 'string', maxLength: 40 },
          summary: { type: 'string', maxLength: 240 },
          subtitle: { type: 'string', maxLength: 240 },
          tag: { type: 'string', maxLength: 80 },
          type: { type: 'string', maxLength: 80 },
          image: { type: 'string', maxLength: 500 },
          imageAlt: { type: 'string', maxLength: 200 },
          targetUrl: { type: 'string', minLength: 1, maxLength: 500 },
          buttonText: { type: 'string', maxLength: 80 },
          ctaLabel: { type: 'string', maxLength: 80 },
          layout: { type: 'string', maxLength: 40 },
          priority: { type: 'integer', minimum: 0, maximum: 9999 },
          active: { type: 'boolean' }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const index = Number.parseInt(String(request.params.index || ''), 10);
    const banners = loadPortalBanners();
    if (!Number.isFinite(index) || index < 0 || index >= banners.length) {
      reply.code(404);
      return { error: 'Banner 不存在' };
    }
    banners[index] = normalizeBannerPayload(request.body || {}, banners[index]);
    if (!banners[index].title || !banners[index].targetUrl) {
      reply.code(400);
      return { error: 'Banner 标题与目标链接必填' };
    }
    savePortalBanners(banners);
    logAudit('banner.update', request, { index });
    return { banner: banners[index] };
  });

  fastify.patch(`${API_PREFIX}/teacher/banners/:index`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 160 },
          pageKey: { type: 'string', maxLength: 40 },
          summary: { type: 'string', maxLength: 240 },
          subtitle: { type: 'string', maxLength: 240 },
          tag: { type: 'string', maxLength: 80 },
          type: { type: 'string', maxLength: 80 },
          image: { type: 'string', maxLength: 500 },
          imageAlt: { type: 'string', maxLength: 200 },
          targetUrl: { type: 'string', minLength: 1, maxLength: 500 },
          buttonText: { type: 'string', maxLength: 80 },
          ctaLabel: { type: 'string', maxLength: 80 },
          layout: { type: 'string', maxLength: 40 },
          priority: { type: 'integer', minimum: 0, maximum: 9999 },
          active: { type: 'boolean' }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const index = Number.parseInt(String(request.params.index || ''), 10);
    const banners = loadPortalBanners();
    if (!Number.isFinite(index) || index < 0 || index >= banners.length) {
      reply.code(404);
      return { error: 'Banner 不存在' };
    }
    banners[index] = normalizeBannerPayload(request.body || {}, banners[index]);
    if (!banners[index].title || !banners[index].targetUrl) {
      reply.code(400);
      return { error: 'Banner 标题与目标链接必填' };
    }
    savePortalBanners(banners);
    logAudit('banner.update', request, { index });
    return { banner: banners[index] };
  });

  fastify.delete(`${API_PREFIX}/admin/banners/:index`, {
    schema: {
      params: indexParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const index = Number.parseInt(String(request.params.index || ''), 10);
    const banners = loadPortalBanners();
    if (!Number.isFinite(index) || index < 0 || index >= banners.length) {
      reply.code(404);
      return { error: 'Banner 不存在' };
    }
    const [removed] = banners.splice(index, 1);
    savePortalBanners(banners);
    logAudit('banner.delete', request, { index, title: removed?.title || '' });
    return { success: true };
  });

  fastify.delete(`${API_PREFIX}/teacher/banners/:index`, {
    schema: {
      params: indexParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const index = Number.parseInt(String(request.params.index || ''), 10);
    const banners = loadPortalBanners();
    if (!Number.isFinite(index) || index < 0 || index >= banners.length) {
      reply.code(404);
      return { error: 'Banner 不存在' };
    }
    const [removed] = banners.splice(index, 1);
    savePortalBanners(banners);
    logAudit('banner.delete', request, { index, title: removed?.title || '' });
    return { success: true };
  });

  fastify.get(`${API_PREFIX}/admin/stories`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    const competitionMap = listPublishedCompetitions().reduce((acc, item) => {
      acc[item.slug] = item;
      return acc;
    }, {});
    const courseMap = buildCoursePreviewMap();
    return { stories: loadPortalStories().map((story) => buildStoryResponse(story, competitionMap, courseMap)) };
  });

  fastify.get(`${API_PREFIX}/teacher/stories`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    const competitionMap = listPublishedCompetitions().reduce((acc, item) => {
      acc[item.slug] = item;
      return acc;
    }, {});
    const courseMap = buildCoursePreviewMap();
    return { stories: loadPortalStories().map((story) => buildStoryResponse(story, competitionMap, courseMap)) };
  });

  fastify.post(`${API_PREFIX}/admin/stories`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 180 },
          slug: { type: 'string', minLength: 1, maxLength: 120 },
          summary: { type: 'string', maxLength: 2000 },
          result: { type: 'string', maxLength: 200 },
          studentLabel: { type: 'string', maxLength: 160 },
          cover: { type: 'string', maxLength: 500 },
          relatedCompetitionSlug: { type: 'string', maxLength: 120 },
          relatedCourseIds: {
            type: 'array',
            items: { type: 'string', maxLength: 120 },
            maxItems: 20
          },
          featured: { type: 'boolean' }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const story = normalizeStoryPayload(request.body || {});
    if (!story.title || !story.slug) {
      reply.code(400);
      return { error: '故事标题与 slug 必填' };
    }
    const stories = loadPortalStories();
    if (stories.some((item) => item.slug === story.slug)) {
      reply.code(409);
      return { error: '故事 slug 已存在' };
    }
    stories.unshift(story);
    savePortalStories(stories);
    logAudit('story.create', request, { slug: story.slug });
    reply.code(201);
    return { story };
  });

  fastify.post(`${API_PREFIX}/teacher/stories`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 180 },
          slug: { type: 'string', minLength: 1, maxLength: 120 },
          summary: { type: 'string', maxLength: 2000 },
          result: { type: 'string', maxLength: 200 },
          studentLabel: { type: 'string', maxLength: 160 },
          cover: { type: 'string', maxLength: 500 },
          relatedCompetitionSlug: { type: 'string', maxLength: 120 },
          relatedCourseIds: {
            type: 'array',
            items: { type: 'string', maxLength: 120 },
            maxItems: 20
          },
          featured: { type: 'boolean' }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const story = normalizeStoryPayload(request.body || {});
    if (!story.title || !story.slug) {
      reply.code(400);
      return { error: '故事标题与 slug 必填' };
    }
    const stories = loadPortalStories();
    if (stories.some((item) => item.slug === story.slug)) {
      reply.code(409);
      return { error: '故事 slug 已存在' };
    }
    stories.unshift(story);
    savePortalStories(stories);
    logAudit('story.create', request, { slug: story.slug });
    reply.code(201);
    return { story };
  });

  fastify.patch(`${API_PREFIX}/admin/stories/:slug`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 180 },
          slug: { type: 'string', minLength: 1, maxLength: 120 },
          summary: { type: 'string', maxLength: 2000 },
          result: { type: 'string', maxLength: 200 },
          studentLabel: { type: 'string', maxLength: 160 },
          cover: { type: 'string', maxLength: 500 },
          relatedCompetitionSlug: { type: 'string', maxLength: 120 },
          relatedCourseIds: {
            type: 'array',
            items: { type: 'string', maxLength: 120 },
            maxItems: 20
          },
          featured: { type: 'boolean' }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const stories = loadPortalStories();
    const index = stories.findIndex((item) => item.slug === request.params.slug);
    if (index < 0) {
      reply.code(404);
      return { error: '故事不存在' };
    }
    const story = normalizeStoryPayload(request.body || {}, stories[index]);
    story.slug = stories[index].slug;
    stories[index] = story;
    savePortalStories(stories);
    logAudit('story.update', request, { slug: story.slug });
    return { story };
  });

  fastify.patch(`${API_PREFIX}/teacher/stories/:slug`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 180 },
          slug: { type: 'string', minLength: 1, maxLength: 120 },
          summary: { type: 'string', maxLength: 2000 },
          result: { type: 'string', maxLength: 200 },
          studentLabel: { type: 'string', maxLength: 160 },
          cover: { type: 'string', maxLength: 500 },
          relatedCompetitionSlug: { type: 'string', maxLength: 120 },
          relatedCourseIds: {
            type: 'array',
            items: { type: 'string', maxLength: 120 },
            maxItems: 20
          },
          featured: { type: 'boolean' }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const stories = loadPortalStories();
    const index = stories.findIndex((item) => item.slug === request.params.slug);
    if (index < 0) {
      reply.code(404);
      return { error: '故事不存在' };
    }
    const story = normalizeStoryPayload(request.body || {}, stories[index]);
    story.slug = stories[index].slug;
    stories[index] = story;
    savePortalStories(stories);
    logAudit('story.update', request, { slug: story.slug });
    return { story };
  });

  fastify.delete(`${API_PREFIX}/admin/stories/:slug`, {
    schema: {
      params: storySlugParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const stories = loadPortalStories();
    const index = stories.findIndex((item) => item.slug === request.params.slug);
    if (index < 0) {
      reply.code(404);
      return { error: '故事不存在' };
    }
    const [removed] = stories.splice(index, 1);
    savePortalStories(stories);
    logAudit('story.delete', request, { slug: removed?.slug || request.params.slug });
    return { success: true };
  });

  fastify.delete(`${API_PREFIX}/teacher/stories/:slug`, {
    schema: {
      params: storySlugParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const stories = loadPortalStories();
    const index = stories.findIndex((item) => item.slug === request.params.slug);
    if (index < 0) {
      reply.code(404);
      return { error: '故事不存在' };
    }
    const [removed] = stories.splice(index, 1);
    savePortalStories(stories);
    logAudit('story.delete', request, { slug: removed?.slug || request.params.slug });
    return { success: true };
  });

  fastify.get(`${API_PREFIX}/admin/competitions`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    const courseMap = buildCoursePreviewMap();
    return {
      competitions: loadPortalCompetitions().map((item) => ({
        ...enrichCompetition(item, courseMap),
        detail: loadPortalCompetitionDetail(item.slug)
      }))
    };
  });

  fastify.get(`${API_PREFIX}/teacher/competitions`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    const courseMap = buildCoursePreviewMap();
    return {
      competitions: loadPortalCompetitions().map((item) => ({
        ...enrichCompetition(item, courseMap),
        detail: loadPortalCompetitionDetail(item.slug)
      }))
    };
  });

  fastify.post(`${API_PREFIX}/admin/competitions`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          slug: { type: 'string', minLength: 1, maxLength: 120 },
          tier: { type: 'string', maxLength: 120 },
          status: { type: 'string', maxLength: 80 },
          publishStatus: { type: 'string', maxLength: 80 },
          dateRange: { type: 'string', maxLength: 120 },
          host: { type: 'string', maxLength: 200 },
          location: { type: 'string', maxLength: 200 },
          fitSummary: { type: 'string', maxLength: 2000 },
          tagline: { type: 'string', maxLength: 300 },
          whyJoin: { type: 'string', maxLength: 2000 },
          prepAdvice: { type: 'string', maxLength: 2000 },
          schoolStage: { type: 'array', items: { type: 'string', maxLength: 40 }, maxItems: 20 },
          tags: { type: 'array', items: { type: 'string', maxLength: 60 }, maxItems: 40 },
          discipline: { type: 'array', items: { type: 'string', maxLength: 60 }, maxItems: 20 },
          requiredSkills: { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 },
          recommendedSkills: { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 },
          relatedCourseIds: { type: 'array', items: { type: 'string', maxLength: 120 }, maxItems: 30 },
          estimatedHours: { type: 'integer', minimum: 0, maximum: 10000 },
          difficulty: { type: 'string', maxLength: 80 },
          registrationDeadline: { type: 'string', maxLength: 120 },
          eligibilityNotes: { type: 'string', maxLength: 2000 },
          externalLink: { type: 'string', maxLength: 500 }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const competition = normalizeCompetitionPayload(request.body || {});
    competition.createdBy = request.user.id;
    if (!competition.title || !competition.slug) {
      reply.code(400);
      return { error: '赛事标题与 slug 必填' };
    }
    if (loadPortalCompetitions().some((item) => item.slug === competition.slug)) {
      reply.code(409);
      return { error: '赛事 slug 已存在' };
    }
    savePortalCompetition(competition);
    logMatchEvent({
      targetType: 'competition',
      targetKey: competition.slug,
      eventType: 'competition_published',
      payload: { source: 'admin.competitions.create' }
    });
    await recomputeCompetitionMatches({
      userIds: db.all('SELECT id FROM users WHERE role = ?', ['student']).map((row) => Number(row.id)).filter(Boolean),
      actor: request.user,
      competitionSlugs: [competition.slug],
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      forceRefresh: true
    });
    logAudit('competition.create', request, { slug: competition.slug });
    reply.code(201);
    return { competition: enrichCompetition(competition, buildCoursePreviewMap()) };
  });

  fastify.post(`${API_PREFIX}/teacher/competitions`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          slug: { type: 'string', minLength: 1, maxLength: 120 },
          tier: { type: 'string', maxLength: 120 },
          status: { type: 'string', maxLength: 80 },
          publishStatus: { type: 'string', maxLength: 80 },
          dateRange: { type: 'string', maxLength: 120 },
          host: { type: 'string', maxLength: 200 },
          location: { type: 'string', maxLength: 200 },
          fitSummary: { type: 'string', maxLength: 2000 },
          tagline: { type: 'string', maxLength: 300 },
          whyJoin: { type: 'string', maxLength: 2000 },
          prepAdvice: { type: 'string', maxLength: 2000 },
          schoolStage: { type: 'array', items: { type: 'string', maxLength: 40 }, maxItems: 20 },
          tags: { type: 'array', items: { type: 'string', maxLength: 60 }, maxItems: 40 },
          discipline: { type: 'array', items: { type: 'string', maxLength: 60 }, maxItems: 20 },
          requiredSkills: { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 },
          recommendedSkills: { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 },
          relatedCourseIds: { type: 'array', items: { type: 'string', maxLength: 120 }, maxItems: 30 },
          estimatedHours: { type: 'integer', minimum: 0, maximum: 10000 },
          difficulty: { type: 'string', maxLength: 80 },
          registrationDeadline: { type: 'string', maxLength: 120 },
          eligibilityNotes: { type: 'string', maxLength: 2000 },
          externalLink: { type: 'string', maxLength: 500 }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const competition = normalizeCompetitionPayload(request.body || {});
    competition.createdBy = request.user.id;
    if (!competition.title || !competition.slug) {
      reply.code(400);
      return { error: '赛事标题与 slug 必填' };
    }
    if (loadPortalCompetitions().some((item) => item.slug === competition.slug)) {
      reply.code(409);
      return { error: '赛事 slug 已存在' };
    }
    savePortalCompetition(competition);
    logMatchEvent({
      targetType: 'competition',
      targetKey: competition.slug,
      eventType: 'competition_published',
      payload: { source: 'teacher.competitions.create' }
    });
    await recomputeCompetitionMatches({
      userIds: db.all('SELECT id FROM users WHERE role = ?', ['student']).map((row) => Number(row.id)).filter(Boolean),
      actor: request.user,
      competitionSlugs: [competition.slug],
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      forceRefresh: true
    });
    logAudit('competition.create', request, { slug: competition.slug });
    reply.code(201);
    return { competition: enrichCompetition(competition, buildCoursePreviewMap()) };
  });

  fastify.patch(`${API_PREFIX}/admin/competitions/:slug`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          slug: { type: 'string', minLength: 1, maxLength: 120 },
          tier: { type: 'string', maxLength: 120 },
          status: { type: 'string', maxLength: 80 },
          publishStatus: { type: 'string', maxLength: 80 },
          dateRange: { type: 'string', maxLength: 120 },
          host: { type: 'string', maxLength: 200 },
          location: { type: 'string', maxLength: 200 },
          fitSummary: { type: 'string', maxLength: 2000 },
          tagline: { type: 'string', maxLength: 300 },
          whyJoin: { type: 'string', maxLength: 2000 },
          prepAdvice: { type: 'string', maxLength: 2000 },
          schoolStage: { type: 'array', items: { type: 'string', maxLength: 40 }, maxItems: 20 },
          tags: { type: 'array', items: { type: 'string', maxLength: 60 }, maxItems: 40 },
          discipline: { type: 'array', items: { type: 'string', maxLength: 60 }, maxItems: 20 },
          requiredSkills: { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 },
          recommendedSkills: { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 },
          relatedCourseIds: { type: 'array', items: { type: 'string', maxLength: 120 }, maxItems: 30 },
          estimatedHours: { type: 'integer', minimum: 0, maximum: 10000 },
          difficulty: { type: 'string', maxLength: 80 },
          registrationDeadline: { type: 'string', maxLength: 120 },
          eligibilityNotes: { type: 'string', maxLength: 2000 },
          externalLink: { type: 'string', maxLength: 500 }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const current = loadPortalCompetitions().find((item) => item.slug === request.params.slug);
    if (!current) {
      reply.code(404);
      return { error: '赛事不存在' };
    }
    const competition = normalizeCompetitionPayload(request.body || {}, current);
    competition.slug = current.slug;
    savePortalCompetition(competition);
    logMatchEvent({
      targetType: 'competition',
      targetKey: competition.slug,
      eventType: 'competition_updated',
      payload: { source: 'admin.competitions.update' }
    });
    await recomputeCompetitionMatches({
      userIds: db.all('SELECT id FROM users WHERE role = ?', ['student']).map((row) => Number(row.id)).filter(Boolean),
      actor: request.user,
      competitionSlugs: [competition.slug],
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      forceRefresh: true
    });
    logAudit('competition.update', request, { slug: competition.slug });
    return { competition: enrichCompetition(competition, buildCoursePreviewMap()) };
  });

  fastify.patch(`${API_PREFIX}/teacher/competitions/:slug`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          slug: { type: 'string', minLength: 1, maxLength: 120 },
          tier: { type: 'string', maxLength: 120 },
          status: { type: 'string', maxLength: 80 },
          publishStatus: { type: 'string', maxLength: 80 },
          dateRange: { type: 'string', maxLength: 120 },
          host: { type: 'string', maxLength: 200 },
          location: { type: 'string', maxLength: 200 },
          fitSummary: { type: 'string', maxLength: 2000 },
          tagline: { type: 'string', maxLength: 300 },
          whyJoin: { type: 'string', maxLength: 2000 },
          prepAdvice: { type: 'string', maxLength: 2000 },
          schoolStage: { type: 'array', items: { type: 'string', maxLength: 40 }, maxItems: 20 },
          tags: { type: 'array', items: { type: 'string', maxLength: 60 }, maxItems: 40 },
          discipline: { type: 'array', items: { type: 'string', maxLength: 60 }, maxItems: 20 },
          requiredSkills: { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 },
          recommendedSkills: { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 },
          relatedCourseIds: { type: 'array', items: { type: 'string', maxLength: 120 }, maxItems: 30 },
          estimatedHours: { type: 'integer', minimum: 0, maximum: 10000 },
          difficulty: { type: 'string', maxLength: 80 },
          registrationDeadline: { type: 'string', maxLength: 120 },
          eligibilityNotes: { type: 'string', maxLength: 2000 },
          externalLink: { type: 'string', maxLength: 500 }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const current = loadPortalCompetitions().find((item) => item.slug === request.params.slug);
    if (!current) {
      reply.code(404);
      return { error: '赛事不存在' };
    }
    const competition = normalizeCompetitionPayload(request.body || {}, current);
    competition.slug = current.slug;
    savePortalCompetition(competition);
    logMatchEvent({
      targetType: 'competition',
      targetKey: competition.slug,
      eventType: 'competition_updated',
      payload: { source: 'teacher.competitions.update' }
    });
    await recomputeCompetitionMatches({
      userIds: db.all('SELECT id FROM users WHERE role = ?', ['student']).map((row) => Number(row.id)).filter(Boolean),
      actor: request.user,
      competitionSlugs: [competition.slug],
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      forceRefresh: true
    });
    logAudit('competition.update', request, { slug: competition.slug });
    return { competition: enrichCompetition(competition, buildCoursePreviewMap()) };
  });

  fastify.get(`${API_PREFIX}/competitions/:slug/registrations`, {
    schema: {
      params: slugParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const slug = String(request.params.slug || '').trim();
    const competition = loadPortalCompetitions().find((item) => item.slug === slug);
    if (!competition) {
      reply.code(404);
      return { error: '赛事不存在' };
    }
    const params = [slug];
    let sql = `
      SELECT r.*, u.name AS student_name, u.email AS student_email
      FROM competition_registrations r
      JOIN users u ON u.id = r.student_id
      WHERE r.competition_slug = ?
    `;
    if (request.user.role === 'student') {
      sql += ' AND r.student_id = ?';
      params.push(request.user.id);
    }
    sql += ' ORDER BY r.updated_at DESC';
    return {
      stats: getCompetitionRegistrationStats(slug),
      registrations: db.all(sql, params).map(mapCompetitionRegistration)
    };
  });

  fastify.post(`${API_PREFIX}/competitions/:slug/registrations`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          teamName: { type: 'string', maxLength: 120 },
          team_name: { type: 'string', maxLength: 120 },
          className: { type: 'string', maxLength: 80 },
          class_name: { type: 'string', maxLength: 80 },
          members: { type: 'string', maxLength: 1000 },
          materials: { type: 'string', maxLength: 4000 },
          note: { type: 'string', maxLength: 4000 }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const slug = String(request.params.slug || '').trim();
    if (!loadPortalCompetitions().some((item) => item.slug === slug)) {
      reply.code(404);
      return { error: '赛事不存在' };
    }
    const payload = request.body || {};
    const studentId = request.user.id;
    const teamName = String(payload.teamName || payload.team_name || '').trim();
    const className = String(payload.className || payload.class_name || '').trim();
    const members = String(payload.members || '').trim();
    const materials = String(payload.materials || '').trim();
    const note = String(payload.note || '').trim();
    const createdAt = now();
    const existing = db.get(
      'SELECT id FROM competition_registrations WHERE competition_slug = ? AND student_id = ?',
      [slug, studentId]
    );
    db.transaction((trx) => {
      if (existing) {
        trx.run(
          `UPDATE competition_registrations
           SET team_name = ?, class_name = ?, members = ?, materials = ?, status = ?, note = ?, updated_at = ?
           WHERE id = ?`,
          [teamName, className, members, materials, 'pending', note, createdAt, existing.id]
        );
      } else {
        trx.run(
          `INSERT INTO competition_registrations (competition_slug, student_id, team_name, class_name, members, materials, status, note, teacher_feedback, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?)`,
          [slug, studentId, teamName, className, members, materials, 'pending', note, createdAt, createdAt]
        );
      }
    });
    logAudit('competition.registration.submit', request, { slug });
    logMatchEvent({
      userId: studentId,
      targetType: 'competition',
      targetKey: slug,
      eventType: 'registration_changed',
      payload: { status: 'pending', source: 'competition.registration.submit' }
    });
    await recomputeCompetitionMatches({
      userIds: [studentId],
      actor: request.user,
      competitionSlugs: [slug],
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      forceRefresh: true
    });
    return { success: true, stats: getCompetitionRegistrationStats(slug) };
  });

  fastify.patch(`${API_PREFIX}/competitions/:slug/registrations/:id`, {
    schema: {
      params: slugIdParamsSchema,
      body: registrationReviewSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const registrationId = parseProjectId(request.params.id);
    if (!registrationId) {
      reply.code(400);
      return { error: '报名ID无效' };
    }
    const status = String(request.body?.status || '').trim();
    const teacherFeedback = String(request.body?.teacherFeedback || request.body?.teacher_feedback || '').trim();
    if (!COMPETITION_REGISTRATION_STATUSES.has(status)) {
      reply.code(400);
      return { error: '报名状态无效' };
    }
    const updatedAt = now();
    const result = db.run(
      `UPDATE competition_registrations
       SET status = ?, teacher_feedback = ?, updated_at = ?
       WHERE id = ? AND competition_slug = ?`,
      [status, teacherFeedback, updatedAt, registrationId, request.params.slug]
    );
    if (!result.changes) {
      reply.code(404);
      return { error: '报名记录不存在' };
    }
    const row = db.get(
      `SELECT r.*, u.name AS student_name, u.email AS student_email
       FROM competition_registrations r
       JOIN users u ON u.id = r.student_id
       WHERE r.id = ?`,
      [registrationId]
    );
    logMatchEvent({
      userId: Number(row?.student_id || 0),
      targetType: 'competition',
      targetKey: request.params.slug,
      eventType: 'registration_changed',
      payload: { status, source: 'competition.registration.review' }
    });
    await recomputeCompetitionMatches({
      userIds: row?.student_id ? [Number(row.student_id)] : [],
      actor: request.user,
      competitionSlugs: [request.params.slug],
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      forceRefresh: true
    });
    logAudit('competition.registration.review', request, { registrationId, status });
    return { registration: mapCompetitionRegistration(row), stats: getCompetitionRegistrationStats(request.params.slug) };
  });

  fastify.get(`${API_PREFIX}/competitions/:slug/reminders`, {
    schema: {
      params: slugParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const slug = String(request.params.slug || '').trim();
    const competition = loadPortalCompetitions().find((item) => item.slug === slug);
    if (!competition) {
      reply.code(404);
      return { error: '赛事不存在' };
    }

    const params = [slug];
    let sql = `
      SELECT cr.*, u.name AS student_name, u.email AS student_email, t.name AS teacher_name
      FROM competition_reminders cr
      JOIN users u ON u.id = cr.student_id
      LEFT JOIN users t ON t.id = cr.created_by
      WHERE cr.competition_slug = ?
    `;
    if (request.user.role === 'student') {
      sql += ' AND cr.student_id = ?';
      params.push(request.user.id);
    }
    sql += ' ORDER BY cr.created_at DESC';

    return {
      reminders: db.all(sql, params).map(mapCompetitionReminder)
    };
  });

  fastify.post(`${API_PREFIX}/competitions/:slug/reminders`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', maxLength: 200 },
          body: { type: 'string', minLength: 1, maxLength: 4000 },
          targetGroup: { type: 'string', maxLength: 80 },
          target_group: { type: 'string', maxLength: 80 },
          studentIds: { type: 'array', items: { type: 'integer' }, maxItems: 200 }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const slug = String(request.params.slug || '').trim();
    const competition = loadPortalCompetitions().find((item) => item.slug === slug);
    if (!competition) {
      reply.code(404);
      return { error: '赛事不存在' };
    }

    const payload = request.body || {};
    const title = String(payload.title || '').trim() || `${competition.title} 报名提醒`;
    const body = String(payload.body || '').trim();
    const targetGroup = String(payload.targetGroup || payload.target_group || 'not_registered').trim();
    const requestedStudentIds = Array.isArray(payload.studentIds)
      ? payload.studentIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)
      : [];

    if (!body) {
      reply.code(400);
      return { error: '提醒内容不能为空' };
    }

    const registeredRows = db.all(
      'SELECT student_id, status FROM competition_registrations WHERE competition_slug = ?',
      [slug]
    );
    const registeredIds = new Set(registeredRows.map(row => Number(row.student_id)).filter(Boolean));
    const allStudents = db.all('SELECT id FROM users WHERE role = ? ORDER BY created_at DESC', ['student'])
      .map(row => Number(row.id))
      .filter(Boolean);

    let studentIds;
    if (requestedStudentIds.length) {
      studentIds = requestedStudentIds;
    } else if (targetGroup === 'all_students') {
      studentIds = allStudents;
    } else if (targetGroup === 'registered') {
      studentIds = [...registeredIds];
    } else if (['pending', 'needs_materials', 'approved', 'rejected'].includes(targetGroup)) {
      studentIds = registeredRows
        .filter(row => row.status === targetGroup)
        .map(row => Number(row.student_id))
        .filter(Boolean);
    } else {
      studentIds = allStudents.filter(id => !registeredIds.has(id));
    }

    studentIds = [...new Set(studentIds)];
    if (!studentIds.length) {
      reply.code(400);
      return { error: '没有匹配的学生可提醒' };
    }

    const createdAt = now();
    const reminderIds = [];
    db.transaction((trx) => {
      for (const studentId of studentIds) {
        const info = trx.run(
          `INSERT INTO competition_reminders (competition_slug, student_id, title, body, target_group, created_by, created_at, read_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, '')`,
          [slug, studentId, title, body, targetGroup, request.user.id, createdAt]
        );
        reminderIds.push(info.lastInsertRowid);
      }
    });

    logAudit('competition.reminder.create', request, { slug, targetGroup, count: studentIds.length });
    reply.code(201);
    return {
      success: true,
      count: studentIds.length,
      reminderIds
    };
  });

  fastify.patch(`${API_PREFIX}/competitions/:slug/reminders/:id/read`, {
    schema: {
      params: reminderReadParamsSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher'])) return;
    const reminderId = parseProjectId(request.params.id);
    if (!reminderId) {
      reply.code(400);
      return { error: '提醒ID无效' };
    }
    const params = [now(), reminderId, request.params.slug];
    let sql = 'UPDATE competition_reminders SET read_at = ? WHERE id = ? AND competition_slug = ?';
    if (request.user.role === 'student') {
      sql += ' AND student_id = ?';
      params.push(request.user.id);
    }
    const result = db.run(sql, params);
    if (!result.changes) {
      reply.code(404);
      return { error: '提醒不存在' };
    }
    return { success: true };
  });

  fastify.get(`${API_PREFIX}/admin/project-topics`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    return {
      topics: db.all('SELECT * FROM project_topics ORDER BY updated_at DESC')
        .map(mapProjectTopic)
        .filter(topic => canReadProjectTopic(request.user, topic))
    };
  });

  fastify.get(`${API_PREFIX}/teacher/project-topics`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    return {
      topics: db.all('SELECT * FROM project_topics ORDER BY updated_at DESC')
        .map(mapProjectTopic)
        .filter(topic => canReadProjectTopic(request.user, topic))
    };
  });

  fastify.post(`${API_PREFIX}/admin/project-topics`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 2000 },
          background: { type: 'string', maxLength: 2000 },
          goals: { type: 'string', maxLength: 2000 },
          difficulty: { type: 'string', maxLength: 80 },
          tags: {
            anyOf: [
              { type: 'string', maxLength: 1000 },
              { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 }
            ]
          },
          requiredSkills: {
            anyOf: [
              { type: 'string', maxLength: 1000 },
              { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 }
            ]
          },
          estimatedHours: { type: 'integer', minimum: 0, maximum: 10000 },
          suggestedTeamSize: { type: 'string', maxLength: 80 },
          deliverables: { type: 'string', maxLength: 2000 },
          relatedCourseId: { type: 'string', maxLength: 120 },
          relatedCompetitionSlug: { type: 'string', maxLength: 120 },
          visibility: { type: 'string', maxLength: 40 },
          visibleToRoles: { type: 'array', items: { type: 'string', maxLength: 40 } },
          visibleToUserIds: { type: 'array', items: { type: 'integer' } },
          visibleToClassNames: { type: 'array', items: { type: 'string', maxLength: 120 } },
          status: { type: 'string', maxLength: 80 }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const payload = normalizeProjectTopicPayload(request.body || {});
    if (!payload.title) {
      reply.code(400);
      return { error: '项目题目标题必填' };
    }
    const createdAt = now();
    const info = db.run(
      `INSERT INTO project_topics (title, description, background, goals, difficulty, tags, required_skills, estimated_hours, suggested_team_size, deliverables, related_course_id, related_competition_slug, visibility, visible_to_roles, visible_to_user_ids, visible_to_class_names, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.title,
        payload.description,
        payload.background,
        payload.goals,
        payload.difficulty,
        payload.tags,
        payload.requiredSkills,
        payload.estimatedHours,
        payload.suggestedTeamSize,
        payload.deliverables,
        payload.relatedCourseId,
        payload.relatedCompetitionSlug,
        payload.visibility,
        payload.visibleToRoles,
        payload.visibleToUserIds,
        payload.visibleToClassNames,
        payload.status,
        request.user.id,
        createdAt,
        createdAt
      ]
    );
    const row = db.get('SELECT * FROM project_topics WHERE id = ?', [info.lastInsertRowid]);
    logMatchEvent({
      targetType: 'project_topic',
      targetKey: String(info.lastInsertRowid),
      eventType: 'project_topic_published',
      payload: { source: 'admin.project_topics.create' }
    });
    await recomputeProjectTopicMatches({
      userIds: db.all('SELECT id FROM users WHERE role = ?', ['student']).map((item) => Number(item.id)).filter(Boolean),
      actor: request.user,
      projectTopicIds: [Number(info.lastInsertRowid)],
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      forceRefresh: true
    });
    logAudit('project_topic.create', request, { topicId: info.lastInsertRowid });
    reply.code(201);
    return { topic: mapProjectTopic(row) };
  });

  fastify.post(`${API_PREFIX}/teacher/project-topics`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 2000 },
          background: { type: 'string', maxLength: 2000 },
          goals: { type: 'string', maxLength: 2000 },
          difficulty: { type: 'string', maxLength: 80 },
          tags: {
            anyOf: [
              { type: 'string', maxLength: 1000 },
              { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 }
            ]
          },
          requiredSkills: {
            anyOf: [
              { type: 'string', maxLength: 1000 },
              { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 }
            ]
          },
          estimatedHours: { type: 'integer', minimum: 0, maximum: 10000 },
          suggestedTeamSize: { type: 'string', maxLength: 80 },
          deliverables: { type: 'string', maxLength: 2000 },
          relatedCourseId: { type: 'string', maxLength: 120 },
          relatedCompetitionSlug: { type: 'string', maxLength: 120 },
          visibility: { type: 'string', maxLength: 40 },
          visibleToRoles: { type: 'array', items: { type: 'string', maxLength: 40 } },
          visibleToUserIds: { type: 'array', items: { type: 'integer' } },
          visibleToClassNames: { type: 'array', items: { type: 'string', maxLength: 120 } },
          status: { type: 'string', maxLength: 80 }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const payload = normalizeProjectTopicPayload(request.body || {});
    if (!payload.title) {
      reply.code(400);
      return { error: '项目题目标题必填' };
    }
    const createdAt = now();
    const info = db.run(
      `INSERT INTO project_topics (title, description, background, goals, difficulty, tags, required_skills, estimated_hours, suggested_team_size, deliverables, related_course_id, related_competition_slug, visibility, visible_to_roles, visible_to_user_ids, visible_to_class_names, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.title,
        payload.description,
        payload.background,
        payload.goals,
        payload.difficulty,
        payload.tags,
        payload.requiredSkills,
        payload.estimatedHours,
        payload.suggestedTeamSize,
        payload.deliverables,
        payload.relatedCourseId,
        payload.relatedCompetitionSlug,
        payload.visibility,
        payload.visibleToRoles,
        payload.visibleToUserIds,
        payload.visibleToClassNames,
        payload.status,
        request.user.id,
        createdAt,
        createdAt
      ]
    );
    const row = db.get('SELECT * FROM project_topics WHERE id = ?', [info.lastInsertRowid]);
    logMatchEvent({
      targetType: 'project_topic',
      targetKey: String(info.lastInsertRowid),
      eventType: 'project_topic_published',
      payload: { source: 'teacher.project_topics.create' }
    });
    await recomputeProjectTopicMatches({
      userIds: db.all('SELECT id FROM users WHERE role = ?', ['student']).map((item) => Number(item.id)).filter(Boolean),
      actor: request.user,
      projectTopicIds: [Number(info.lastInsertRowid)],
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      forceRefresh: true
    });
    logAudit('project_topic.create', request, { topicId: info.lastInsertRowid });
    reply.code(201);
    return { topic: mapProjectTopic(row) };
  });

  fastify.patch(`${API_PREFIX}/admin/project-topics/:id`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 2000 },
          background: { type: 'string', maxLength: 2000 },
          goals: { type: 'string', maxLength: 2000 },
          difficulty: { type: 'string', maxLength: 80 },
          tags: {
            anyOf: [
              { type: 'string', maxLength: 1000 },
              { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 }
            ]
          },
          requiredSkills: {
            anyOf: [
              { type: 'string', maxLength: 1000 },
              { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 }
            ]
          },
          estimatedHours: { type: 'integer', minimum: 0, maximum: 10000 },
          suggestedTeamSize: { type: 'string', maxLength: 80 },
          deliverables: { type: 'string', maxLength: 2000 },
          relatedCourseId: { type: 'string', maxLength: 120 },
          relatedCompetitionSlug: { type: 'string', maxLength: 120 },
          visibility: { type: 'string', maxLength: 40 },
          visibleToRoles: { type: 'array', items: { type: 'string', maxLength: 40 } },
          visibleToUserIds: { type: 'array', items: { type: 'integer' } },
          visibleToClassNames: { type: 'array', items: { type: 'string', maxLength: 120 } },
          status: { type: 'string', maxLength: 80 }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const topicId = parseProjectId(request.params.id);
    if (!topicId) {
      reply.code(400);
      return { error: '题目ID无效' };
    }
    const existing = db.get('SELECT * FROM project_topics WHERE id = ?', [topicId]);
    if (!existing) {
      reply.code(404);
      return { error: '项目题目不存在' };
    }
    if (!canEditProjectTopic(request.user, existing)) {
      reply.code(403);
      return { error: '无权限编辑该项目题目' };
    }
    const payload = normalizeProjectTopicPayload(request.body || {}, existing);
    if (!payload.title) {
      reply.code(400);
      return { error: '项目题目标题必填' };
    }
    db.run(
      `UPDATE project_topics
       SET title = ?, description = ?, background = ?, goals = ?, difficulty = ?, tags = ?, required_skills = ?, estimated_hours = ?, suggested_team_size = ?, deliverables = ?, related_course_id = ?, related_competition_slug = ?, visibility = ?, visible_to_roles = ?, visible_to_user_ids = ?, visible_to_class_names = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [
        payload.title,
        payload.description,
        payload.background,
        payload.goals,
        payload.difficulty,
        payload.tags,
        payload.requiredSkills,
        payload.estimatedHours,
        payload.suggestedTeamSize,
        payload.deliverables,
        payload.relatedCourseId,
        payload.relatedCompetitionSlug,
        payload.visibility,
        payload.visibleToRoles,
        payload.visibleToUserIds,
        payload.visibleToClassNames,
        payload.status,
        now(),
        topicId
      ]
    );
    const row = db.get('SELECT * FROM project_topics WHERE id = ?', [topicId]);
    logMatchEvent({
      targetType: 'project_topic',
      targetKey: String(topicId),
      eventType: 'project_topic_updated',
      payload: { source: 'admin.project_topics.update' }
    });
    await recomputeProjectTopicMatches({
      userIds: db.all('SELECT id FROM users WHERE role = ?', ['student']).map((item) => Number(item.id)).filter(Boolean),
      actor: request.user,
      projectTopicIds: [topicId],
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      forceRefresh: true
    });
    logAudit('project_topic.update', request, { topicId });
    return { topic: mapProjectTopic(row) };
  });

  fastify.patch(`${API_PREFIX}/teacher/project-topics/:id`, {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 2000 },
          background: { type: 'string', maxLength: 2000 },
          goals: { type: 'string', maxLength: 2000 },
          difficulty: { type: 'string', maxLength: 80 },
          tags: {
            anyOf: [
              { type: 'string', maxLength: 1000 },
              { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 }
            ]
          },
          requiredSkills: {
            anyOf: [
              { type: 'string', maxLength: 1000 },
              { type: 'array', items: { type: 'string', maxLength: 80 }, maxItems: 40 }
            ]
          },
          estimatedHours: { type: 'integer', minimum: 0, maximum: 10000 },
          suggestedTeamSize: { type: 'string', maxLength: 80 },
          deliverables: { type: 'string', maxLength: 2000 },
          relatedCourseId: { type: 'string', maxLength: 120 },
          relatedCompetitionSlug: { type: 'string', maxLength: 120 },
          visibility: { type: 'string', maxLength: 40 },
          visibleToRoles: { type: 'array', items: { type: 'string', maxLength: 40 } },
          visibleToUserIds: { type: 'array', items: { type: 'integer' } },
          visibleToClassNames: { type: 'array', items: { type: 'string', maxLength: 120 } },
          status: { type: 'string', maxLength: 80 }
        },
        additionalProperties: true
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const topicId = parseProjectId(request.params.id);
    if (!topicId) {
      reply.code(400);
      return { error: '题目ID无效' };
    }
    const existing = db.get('SELECT * FROM project_topics WHERE id = ?', [topicId]);
    if (!existing) {
      reply.code(404);
      return { error: '项目题目不存在' };
    }
    if (!canEditProjectTopic(request.user, existing)) {
      reply.code(403);
      return { error: '无权限编辑该项目题目' };
    }
    const payload = normalizeProjectTopicPayload(request.body || {}, existing);
    if (!payload.title) {
      reply.code(400);
      return { error: '项目题目标题必填' };
    }
    db.run(
      `UPDATE project_topics
       SET title = ?, description = ?, background = ?, goals = ?, difficulty = ?, tags = ?, required_skills = ?, estimated_hours = ?, suggested_team_size = ?, deliverables = ?, related_course_id = ?, related_competition_slug = ?, visibility = ?, visible_to_roles = ?, visible_to_user_ids = ?, visible_to_class_names = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [
        payload.title,
        payload.description,
        payload.background,
        payload.goals,
        payload.difficulty,
        payload.tags,
        payload.requiredSkills,
        payload.estimatedHours,
        payload.suggestedTeamSize,
        payload.deliverables,
        payload.relatedCourseId,
        payload.relatedCompetitionSlug,
        payload.visibility,
        payload.visibleToRoles,
        payload.visibleToUserIds,
        payload.visibleToClassNames,
        payload.status,
        now(),
        topicId
      ]
    );
    const row = db.get('SELECT * FROM project_topics WHERE id = ?', [topicId]);
    logMatchEvent({
      targetType: 'project_topic',
      targetKey: String(topicId),
      eventType: 'project_topic_updated',
      payload: { source: 'teacher.project_topics.update' }
    });
    await recomputeProjectTopicMatches({
      userIds: db.all('SELECT id FROM users WHERE role = ?', ['student']).map((item) => Number(item.id)).filter(Boolean),
      actor: request.user,
      projectTopicIds: [topicId],
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      forceRefresh: true
    });
    logAudit('project_topic.update', request, { topicId });
    return { topic: mapProjectTopic(row) };
  });

  fastify.get(`${API_PREFIX}/project-topics`, async (request) => {
    return {
      topics: db.all('SELECT * FROM project_topics WHERE status = ? ORDER BY updated_at DESC', ['published'])
        .map(mapProjectTopic)
        .filter(topic => canReadProjectTopic(request.user || null, topic))
    };
  });
}

module.exports = {
  registerPortalRoutes
};

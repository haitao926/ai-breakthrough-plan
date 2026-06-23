function registerKnowledgeRoutes(fastify, deps) {
  const {
    API_PREFIX,
    db,
    now,
    requireAuth,
    findKnowledgeDetail,
    loadKnowledgeDisciplinesFromDb,
    loadKnowledgeLearningUnitsFromDb,
    loadAllKnowledgeSeriesFromDb,
    createLearnerToken,
    createViewerToken,
    normalizeKnowledgeAnswers,
    resolveKnowledgeEpisode,
    getKnowledgeIdentityCondition,
    getKnowledgeEpisodeProgress,
    buildKnowledgeOpenPrompts,
    validateKnowledgeAnswersForPrompts,
    scoreKnowledgeResponse,
    mapKnowledgeResponseRow,
    logMatchEvent,
    recomputeCompetitionMatches,
    recomputeProjectTopicMatches,
    recomputeCourseMatches,
    recomputeTeamCandidateMatches
  } = deps;

  const submitKnowledgeResponseSchema = {
    type: 'object',
    required: ['answers'],
    additionalProperties: true,
    properties: {
      episodeKey: { type: 'string', maxLength: 200 },
      focus: { type: 'string', maxLength: 200 },
      learnerToken: { type: 'string', maxLength: 200 },
      summary: { type: 'string', maxLength: 2000 },
      sharePublicly: { type: 'boolean' },
      answers: {
        type: 'array',
        minItems: 1,
        maxItems: 20,
        items: {
          type: 'object',
          required: ['questionId', 'answer'],
          additionalProperties: true,
          properties: {
            questionId: { type: 'string', minLength: 1, maxLength: 120 },
            prompt: { type: 'string', maxLength: 1000 },
            type: { type: 'string', maxLength: 50 },
            answer: { type: 'string', minLength: 1, maxLength: 5000 }
          }
        }
      }
    }
  };

  fastify.get(`${API_PREFIX}/knowledge/disciplines`, async (_request, reply) => {
    try {
      return { disciplines: loadKnowledgeDisciplinesFromDb() };
    } catch (err) {
      fastify.log.error(err);
      reply.code(500);
      return { error: 'Failed to load disciplines' };
    }
  });

  fastify.get(`${API_PREFIX}/knowledge/learning-units`, async (_request, reply) => {
    try {
      return { learningUnits: loadKnowledgeLearningUnitsFromDb() };
    } catch (err) {
      fastify.log.error(err);
      reply.code(500);
      return { error: 'Failed to load knowledge learning units' };
    }
  });

  fastify.get(`${API_PREFIX}/knowledge/crash-course-series`, async (_request, reply) => {
    try {
      return { series: loadAllKnowledgeSeriesFromDb() };
    } catch (err) {
      fastify.log.error(err);
      reply.code(500);
      return { error: 'Failed to load Crash Course series' };
    }
  });

  fastify.get(`${API_PREFIX}/knowledge/disciplines/:id`, async (request, reply) => {
    try {
      const detail = findKnowledgeDetail(request.params.id);
      if (!detail) {
        reply.code(404);
        return { error: 'Knowledge discipline not found' };
      }
      return detail;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500);
      return { error: 'Failed to load knowledge discipline' };
    }
  });

  fastify.get(`${API_PREFIX}/knowledge/disciplines/:id/responses`, async (request, reply) => {
    try {
      const detail = findKnowledgeDetail(request.params.id);
      if (!detail) {
        reply.code(404);
        return { error: 'Knowledge discipline not found' };
      }

      const viewerToken = String(request.query?.viewerToken || '').trim();
      const learnerToken = String(request.query?.learnerToken || '').trim();
      const episode = resolveKnowledgeEpisode(detail, request.query?.episodeKey);
      const progress = getKnowledgeEpisodeProgress(detail, request, learnerToken);
      const tokenRows = viewerToken
        ? db.all(
            `SELECT *
             FROM knowledge_responses
             WHERE discipline_id = ? AND episode_key = ? AND viewer_token = ?
             ORDER BY created_at DESC`,
            [detail.discipline.id, episode.episodeKey, viewerToken]
          )
        : [];
      const identity = getKnowledgeIdentityCondition(request, learnerToken);
      const myRows = identity
        ? db.all(
            `SELECT *
             FROM knowledge_responses
             WHERE discipline_id = ? AND episode_key = ? AND ${identity.sql}
             ORDER BY created_at DESC`,
            [detail.discipline.id, episode.episodeKey, ...identity.params]
          )
        : [];
      const unlocked = tokenRows.length > 0 || myRows.length > 0;
      if (!unlocked) {
        return {
          unlocked: false,
          learnerToken,
          prompts: buildKnowledgeOpenPrompts(detail, episode),
          responses: [],
          myResponse: null,
          courseProgress: progress
        };
      }

      const responseRows = db.all(
        `SELECT *
         FROM knowledge_responses
         WHERE discipline_id = ? AND episode_key = ? AND share_publicly = 1
         ORDER BY created_at DESC
         LIMIT 40`,
        [detail.discipline.id, episode.episodeKey]
      );
      const myResponseRow = myRows[0] || tokenRows[0] || null;
      const myResponseId = myResponseRow?.id || null;
      const responses = responseRows.map(row => mapKnowledgeResponseRow(row, {
        revealIdentity: myResponseId === row.id,
        isMine: myResponseId === row.id
      }));
      return {
        unlocked: true,
        learnerToken: learnerToken || String(myResponseRow?.learner_token || '').trim(),
        prompts: buildKnowledgeOpenPrompts(detail, episode),
        myResponse: myResponseRow ? mapKnowledgeResponseRow(myResponseRow, { revealIdentity: true, isMine: true }) : null,
        responses,
        courseProgress: progress
      };
    } catch (err) {
      fastify.log.error(err);
      reply.code(500);
      return { error: 'Failed to load knowledge responses' };
    }
  });

  fastify.get(`${API_PREFIX}/knowledge/leaderboard`, async (request, reply) => {
    try {
      const scope = String(request.query?.scope || 'all').trim();
      const type = String(request.query?.type || 'personal').trim();
      const timeFilter = scope === 'weekly'
        ? "AND kr.created_at >= datetime('now', '-7 days')"
        : '';

      if (type === 'class') {
        const rows = db.all(`
          SELECT
            t.class_name AS name,
            COUNT(DISTINCT kr.discipline_id || '_' || kr.episode_key) * 10 AS points,
            COUNT(DISTINCT kr.user_id) AS students
          FROM knowledge_responses kr
          JOIN team_members tm ON kr.user_id = tm.user_id
          JOIN teams t ON tm.team_id = t.id
          WHERE kr.passed = 1 AND t.class_name IS NOT NULL AND t.class_name != '' ${timeFilter}
          GROUP BY t.class_name
          ORDER BY points DESC, name ASC
          LIMIT 30
        `);
        const ranking = rows.map((row, index) => ({
          id: `class-${index + 1}`,
          rank: index + 1,
          name: row.name,
          points: Number(row.points || 0),
          students: Number(row.students || 0),
          meta: `全班活跃人数: ${row.students}`
        }));
        return { ranking };
      }

      const rows = db.all(`
        SELECT
          kr.user_id,
          kr.display_name,
          u.avatar_url,
          COUNT(DISTINCT kr.discipline_id || '_' || kr.episode_key) * 10 AS points,
          COUNT(DISTINCT kr.discipline_id) AS completed_units
        FROM knowledge_responses kr
        LEFT JOIN users u ON kr.user_id = u.id
        WHERE kr.passed = 1 ${timeFilter}
        GROUP BY COALESCE(kr.user_id, kr.display_name)
        ORDER BY points DESC, completed_units DESC
        LIMIT 40
      `);
      const ranking = rows.map((row, index) => ({
        id: row.user_id ? `user-${row.user_id}` : `guest-${row.display_name}`,
        rank: index + 1,
        name: row.display_name,
        points: Number(row.points || 0),
        completedUnits: Number(row.completed_units || 0),
        avatarUrl: row.avatar_url || '',
        meta: `完成了 ${row.completed_units} 个知识方向`,
        isCurrentUser: request.user?.id && Number(row.user_id) === Number(request.user.id)
      }));
      return { ranking };
    } catch (err) {
      fastify.log.error(err);
      reply.code(500);
      return { error: 'Failed to load leaderboard' };
    }
  });

  fastify.post(`${API_PREFIX}/knowledge/disciplines/:id/responses`, {
    schema: {
      body: submitKnowledgeResponseSchema
    }
  }, async (request, reply) => {
    try {
      if (!requireAuth(request, reply)) return;
      const detail = findKnowledgeDetail(request.params.id);
      if (!detail) {
        reply.code(404);
        return { error: 'Knowledge discipline not found' };
      }

      const payload = request.body || {};
      const displayName = String(request.user?.name || request.user?.email || '').trim();
      const focus = String(payload.focus || '').trim();
      const learnerToken = String(payload.learnerToken || '').trim() || createLearnerToken();
      const rawAnswers = normalizeKnowledgeAnswers(payload.answers);
      const sharePublicly = payload.sharePublicly === false ? 0 : 1;
      const episode = resolveKnowledgeEpisode(detail, payload.episodeKey);
      const progress = getKnowledgeEpisodeProgress(detail, request, learnerToken);
      const prompts = buildKnowledgeOpenPrompts(detail, episode, { includeAnswers: true });
      const answerValidation = validateKnowledgeAnswersForPrompts(prompts, rawAnswers);
      const answers = answerValidation.answers;

      if (displayName.length < 2) {
        reply.code(400);
        return { error: '请先登录后再提交' };
      }
      if (answerValidation.error) {
        reply.code(400);
        return { error: answerValidation.error };
      }
      if (episode.episodeIndex > progress.unlockedUntil - 1) {
        reply.code(403);
        return { error: '请先完成上一节课，再学习下一节。' };
      }

      const viewerToken = createViewerToken();
      const aiKey = String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim();
      const review = await scoreKnowledgeResponse(detail, answers, aiKey, episode);
      const createdAt = now();
      const summary = String(
        payload.summary
        || answers.find(item => item.type === 'short_answer')?.answer
        || answers[0]?.answerText
        || answers[0]?.answer
        || ''
      ).trim().slice(0, 180);
      const passed = review.score >= 60 ? 1 : 0;
      const result = db.run(
        `INSERT INTO knowledge_responses
         (discipline_id, episode_key, episode_index, user_id, display_name, focus, answers, summary, ai_score, ai_feedback, ai_rubric, score_provider, learner_token, viewer_token, passed, share_publicly, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          detail.discipline.id,
          episode.episodeKey,
          episode.episodeIndex,
          request.user?.id || null,
          displayName,
          focus,
          JSON.stringify(answers),
          summary,
          review.score,
          review.feedback || '',
          JSON.stringify(review.rubric || []),
          review.provider || 'fallback',
          learnerToken,
          viewerToken,
          passed,
          sharePublicly,
          createdAt,
          createdAt
        ]
      );

      const inserted = db.get('SELECT * FROM knowledge_responses WHERE id = ?', [result.lastInsertRowid]);
      const nextProgress = getKnowledgeEpisodeProgress(detail, request, learnerToken);
      logMatchEvent({
        userId: request.user?.id || null,
        targetType: 'course',
        targetKey: detail.discipline.id,
        eventType: 'knowledge_progress_updated',
        payload: {
          disciplineId: detail.discipline.id,
          episodeKey: episode.episodeKey,
          passed,
          score: review.score,
          source: 'knowledge.response.submit'
        }
      });

      if (request.user?.id) {
        await recomputeCompetitionMatches({
          userIds: [Number(request.user.id)],
          actor: request.user,
          aiKey,
          forceRefresh: true
        });
        await recomputeProjectTopicMatches({
          userIds: [Number(request.user.id)],
          actor: request.user,
          aiKey,
          forceRefresh: true
        });
        await recomputeCourseMatches({
          userIds: [Number(request.user.id)],
          actor: request.user,
          aiKey,
          forceRefresh: true
        });
        await recomputeTeamCandidateMatches({
          userIds: [Number(request.user.id)],
          actor: request.user,
          aiKey,
          forceRefresh: true
        });
      }

      const responseRows = db.all(
        `SELECT *
         FROM knowledge_responses
         WHERE discipline_id = ? AND episode_key = ? AND share_publicly = 1
         ORDER BY created_at DESC
         LIMIT 40`,
        [detail.discipline.id, episode.episodeKey]
      );

      return {
        viewerToken,
        learnerToken,
        prompts: buildKnowledgeOpenPrompts(detail, episode),
        myResponse: mapKnowledgeResponseRow(inserted, { revealIdentity: true, isMine: true }),
        responses: responseRows.map(row => mapKnowledgeResponseRow(row, {
          revealIdentity: row.id === inserted.id,
          isMine: row.id === inserted.id
        })),
        courseProgress: nextProgress
      };
    } catch (err) {
      fastify.log.error(err);
      reply.code(500);
      return { error: 'Failed to submit knowledge response' };
    }
  });
}

module.exports = { registerKnowledgeRoutes };

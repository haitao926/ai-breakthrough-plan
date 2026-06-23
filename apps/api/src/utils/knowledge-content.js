function createKnowledgeContentService(options) {
  const {
    getDb,
    now,
    readJsonFile,
    safeParseJson,
    loadCourseCatalog,
    getKnowledgeEpisodePromptPreset,
    normalizeKnowledgePromptType,
    serializeKnowledgePromptOptions,
    disciplineDataPath,
    learningUnitsPath,
    crashCourseSeriesPath,
    crashCourseVideosPath,
    bilibiliSeriesVideosPath
  } = options;

  function loadDisciplines() {
    const data = readJsonFile(disciplineDataPath, []);
    return Array.isArray(data) ? data : [];
  }

  function loadKnowledgeLearningUnits() {
    const data = readJsonFile(learningUnitsPath, []);
    return Array.isArray(data) ? data : [];
  }

  function loadCrashCourseSeries() {
    const data = readJsonFile(crashCourseSeriesPath, []);
    return Array.isArray(data) ? data : [];
  }

  function loadBilibiliSeriesVideos() {
    const data = readJsonFile(bilibiliSeriesVideosPath, {});
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  }

  function loadCrashCourseVideos() {
    const data = readJsonFile(crashCourseVideosPath, {});
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  }

  function dbJson(row) {
    return safeParseJson(row?.data) || {};
  }

  function isKnowledgePreviewVideo(video) {
    return String(video?.episode || '').trim() === '00';
  }

  function filterKnowledgeLearningVideos(videos) {
    return (Array.isArray(videos) ? videos : []).filter(video => !isKnowledgePreviewVideo(video));
  }

  function upsertSeedRow(tableName, keyColumn, keyValue, payload) {
    const db = getDb();
    const key = String(keyValue || '').trim();
    if (!key || !db) return;
    const existing = db.get(`SELECT ${keyColumn} FROM ${tableName} WHERE ${keyColumn} = ?`, [key]);
    if (existing) return;
    db.run(
      `INSERT INTO ${tableName} (${keyColumn}, data, sort_order, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        key,
        JSON.stringify(payload.data || {}),
        Number(payload.sortOrder || 0),
        payload.status || 'published',
        payload.createdAt,
        payload.updatedAt
      ]
    );
  }

  function seedKnowledgeContent() {
    const db = getDb();
    if (!db) return;
    const createdAt = now();
    const disciplines = loadDisciplines();
    disciplines.forEach((discipline, index) => {
      upsertSeedRow('knowledge_disciplines', 'id', discipline.id, {
        data: discipline,
        sortOrder: index,
        createdAt,
        updatedAt: createdAt
      });
    });

    const learningUnits = loadKnowledgeLearningUnits();
    learningUnits.forEach(unit => {
      const disciplineId = String(unit?.disciplineId || '').trim();
      if (!disciplineId) return;
      const existing = db.get('SELECT id FROM knowledge_learning_units WHERE discipline_id = ?', [disciplineId]);
      if (existing) return;
      db.run(
        `INSERT INTO knowledge_learning_units (discipline_id, data, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [disciplineId, JSON.stringify(unit), 'published', createdAt, createdAt]
      );
    });

    const crashCourseSeries = loadCrashCourseSeries();
    const crashCourseSeriesById = new Map(
      crashCourseSeries
        .map(series => [String(series?.id || '').trim(), series])
        .filter(([id]) => id)
    );
    crashCourseSeries.forEach(series => {
      const id = String(series?.id || '').trim();
      if (!id) return;
      const existing = db.get('SELECT id FROM knowledge_series WHERE id = ?', [id]);
      const title = String(series.title || series.englishName || id);
      const sourceUrl = String(series.sourceUrl || '');
      const data = JSON.stringify(series);
      if (existing) {
        db.run(
          `UPDATE knowledge_series
           SET title = ?, source_url = ?, data = ?, updated_at = ?
           WHERE id = ?`,
          [title, sourceUrl, data, createdAt, id]
        );
      } else {
        db.run(
          `INSERT INTO knowledge_series (id, title, source_url, data, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, title, sourceUrl, data, 'published', createdAt, createdAt]
        );
      }
    });

    const crashCourseVideos = loadCrashCourseVideos();
    const legacyBilibiliSeries = loadBilibiliSeriesVideos();
    const videoSeries = {
      ...legacyBilibiliSeries,
      ...crashCourseVideos
    };
    Object.entries(videoSeries).forEach(([seriesId, series]) => {
      const key = String(seriesId || '').trim();
      if (!key) return;
      const videos = Array.isArray(series?.videos) ? series.videos : [];
      const { videos: _videos, ...resourceData } = series && typeof series === 'object' ? series : {};
      const baseData = crashCourseSeriesById.get(key) || {};
      const existing = db.get('SELECT * FROM knowledge_series WHERE id = ?', [key]);
      const existingData = dbJson(existing);
      const mergedData = {
        ...baseData,
        ...existingData,
        ...resourceData,
        id: key,
        videoCount: videos.length,
        learningVideoCount: filterKnowledgeLearningVideos(videos).length
      };
      const title = String(mergedData.title || mergedData.englishName || key);
      const sourceUrl = String(mergedData.sourceUrl || '');
      if (existing) {
        db.run(
          `UPDATE knowledge_series
           SET title = ?,
               source_url = ?,
               data = ?,
               updated_at = ?
           WHERE id = ?`,
          [
            title,
            sourceUrl,
            JSON.stringify(mergedData),
            createdAt,
            key
          ]
        );
      } else {
        db.run(
          `INSERT INTO knowledge_series (id, title, source_url, data, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            key,
            title,
            sourceUrl,
            JSON.stringify(mergedData),
            'published',
            createdAt,
            createdAt
          ]
        );
      }
      videos.forEach((video, index) => {
        const videoId = String(video?.id || video?.bvid || video?.aid || `${key}-${index + 1}`).trim();
        if (!videoId) return;
        const existingVideo = db.get('SELECT id FROM knowledge_series_videos WHERE id = ?', [videoId]);
        const values = [
          key,
          String(video.episode || ''),
          String(video.title || videoId),
          String(video.bvid || ''),
          Number(video.durationMinutes || 0),
          String(video.url || ''),
          String(video.embedUrl || ''),
          index,
          JSON.stringify(video),
          createdAt
        ];
        if (existingVideo) {
          db.run(
            `UPDATE knowledge_series_videos
             SET series_id = ?, episode = ?, title = ?, bvid = ?, duration_minutes = ?, url = ?, embed_url = ?,
                 sort_order = ?, data = ?, updated_at = ?
             WHERE id = ?`,
            [...values, videoId]
          );
        } else {
          db.run(
            `INSERT INTO knowledge_series_videos
             (id, series_id, episode, title, bvid, duration_minutes, url, embed_url, sort_order, data, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              videoId,
              ...values.slice(0, 9),
              'published',
              createdAt,
              createdAt
            ]
          );
        }
      });
    });

    const aiDetail = {
      discipline: disciplines.find(item => String(item.id || '') === 'ai') || null,
      learningUnit: learningUnits.find(item => String(item.disciplineId || '') === 'ai') || null
    };
    const aiVideos = Array.isArray(videoSeries?.artificial_intelligence?.videos)
      ? videoSeries.artificial_intelligence.videos
      : [];
    filterKnowledgeLearningVideos(aiVideos).forEach(video => {
      const episode = { episodeKey: String(video?.id || video?.bvid || '').trim(), video };
      const preset = getKnowledgeEpisodePromptPreset(aiDetail, episode);
      if (!preset?.prompts?.length) return;
      preset.prompts.forEach((prompt, index) => {
        const existing = db.get(
          'SELECT id, prompt_type, options_json, correct_answer FROM knowledge_open_prompts WHERE discipline_id = ? AND episode_key = ? AND prompt_id = ?',
          ['ai', episode.episodeKey, prompt.id]
        );
        const promptType = normalizeKnowledgePromptType(prompt.type);
        const optionsJson = serializeKnowledgePromptOptions(prompt.options);
        const correctAnswer = String(prompt.correctAnswer || '').trim();
        if (existing) {
          const shouldUpgradeSeedPrompt = !existing.prompt_type
            || (promptType === 'single_choice' && (!existing.options_json || !existing.correct_answer));
          if (shouldUpgradeSeedPrompt) {
            db.run(
              `UPDATE knowledge_open_prompts
               SET prompt_type = ?, prompt = ?, options_json = ?, correct_answer = ?, expectation = ?, sort_order = ?, updated_at = ?
               WHERE id = ?`,
              [promptType, prompt.prompt, optionsJson, correctAnswer, prompt.expectation || '', index, createdAt, existing.id]
            );
          }
          return;
        }
        db.run(
          `INSERT INTO knowledge_open_prompts
           (discipline_id, episode_key, prompt_id, prompt_type, prompt, options_json, correct_answer, expectation, sort_order, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'ai',
            episode.episodeKey,
            prompt.id,
            promptType,
            prompt.prompt,
            optionsJson,
            correctAnswer,
            prompt.expectation || '',
            index,
            'published',
            createdAt,
            createdAt
          ]
        );
      });
    });
  }

  function loadKnowledgeSeriesFromDb(seriesId) {
    const db = getDb();
    const id = String(seriesId || '').trim();
    if (!id || !db) return null;
    const row = db.get('SELECT * FROM knowledge_series WHERE id = ? AND status = ?', [id, 'published']);
    if (!row) return null;
    const data = dbJson(row);
    const videos = filterKnowledgeLearningVideos(db.all(
      `SELECT *
       FROM knowledge_series_videos
       WHERE series_id = ? AND status = ?
       ORDER BY sort_order ASC, id ASC`,
      [id, 'published']
    ).map(videoRow => ({
      ...dbJson(videoRow),
      id: videoRow.id,
      episode: videoRow.episode || dbJson(videoRow).episode || '',
      title: videoRow.title || dbJson(videoRow).title || '',
      bvid: videoRow.bvid || dbJson(videoRow).bvid || '',
      durationMinutes: Number(videoRow.duration_minutes || dbJson(videoRow).durationMinutes || 0),
      url: videoRow.url || dbJson(videoRow).url || '',
      embedUrl: videoRow.embed_url || dbJson(videoRow).embedUrl || ''
    })));
    return {
      ...data,
      id: row.id,
      title: row.title || data.title || row.id,
      sourceUrl: row.source_url || data.sourceUrl || '',
      videos
    };
  }

  function loadAllKnowledgeSeriesFromDb() {
    const db = getDb();
    if (!db) return [];
    return db.all(
      `SELECT ks.*,
              COUNT(ksv.id) AS video_count
       FROM knowledge_series ks
       LEFT JOIN knowledge_series_videos ksv ON ksv.series_id = ks.id AND ksv.status = ?
       WHERE ks.status = ?
       GROUP BY ks.id
       ORDER BY id ASC`,
      ['published', 'published']
    ).map(row => {
      const data = dbJson(row);
      const { videos, ...rest } = data;
      return {
        ...rest,
        id: row.id,
        title: row.title || data.title || row.id,
        sourceUrl: row.source_url || data.sourceUrl || '',
        videoCount: Number(row.video_count || 0)
      };
    });
  }

  function loadKnowledgeDisciplinesFromDb() {
    const db = getDb();
    if (!db) return loadDisciplines();
    const rows = db.all(
      `SELECT *
       FROM knowledge_disciplines
       WHERE status = ?
       ORDER BY sort_order ASC, id ASC`,
      ['published']
    );
    if (!rows.length) return loadDisciplines();
    return rows.map(row => ({ ...dbJson(row), id: row.id }));
  }

  function loadKnowledgeLearningUnitsFromDb() {
    const db = getDb();
    if (!db) return loadKnowledgeLearningUnits();
    const rows = db.all(
      `SELECT *
       FROM knowledge_learning_units
       WHERE status = ?
       ORDER BY id ASC`,
      ['published']
    );
    if (!rows.length) return loadKnowledgeLearningUnits();
    return rows.map(row => ({ ...dbJson(row), disciplineId: row.discipline_id }));
  }

  function normalizeKnowledgeDisciplineId(value) {
    const id = String(value || '').trim();
    if (!id) return '';
    if (id === 'anatomy-physiology' || id === 'anatomy_physiology') return 'medicine';
    return id;
  }

  function findKnowledgeDetail(disciplineId) {
    const db = getDb();
    const id = normalizeKnowledgeDisciplineId(disciplineId);
    if (!id) return null;
    const disciplineRow = db?.get('SELECT * FROM knowledge_disciplines WHERE id = ? AND status = ?', [id, 'published']);
    const discipline = disciplineRow ? { ...dbJson(disciplineRow), id: disciplineRow.id } : loadDisciplines().find(item => String(item.id || '') === id);
    if (!discipline) return null;
    const unitRow = db?.get('SELECT * FROM knowledge_learning_units WHERE discipline_id = ? AND status = ?', [id, 'published']);
    const learningUnit = unitRow ? { ...dbJson(unitRow), disciplineId: unitRow.discipline_id } : loadKnowledgeLearningUnits().find(item => String(item.disciplineId || '') === id) || null;
    const courseIds = Array.isArray(learningUnit?.next?.courseIds) ? learningUnit.next.courseIds : [];
    const catalog = loadCourseCatalog();
    const courses = courseIds
      .map(courseId => catalog.find(course => String(course.id || '') === String(courseId)))
      .filter(Boolean);
    const seriesKey = String(learningUnit?.series?.key || '').trim();
    const series = loadKnowledgeSeriesFromDb(seriesKey);
    return { discipline, learningUnit, relatedCourses: courses, series };
  }

  function getKnowledgeSeriesVideos(detail) {
    if (Array.isArray(detail?.series?.videos) && detail.series.videos.length) {
      return filterKnowledgeLearningVideos(detail.series.videos);
    }
    const key = String(detail?.learningUnit?.series?.key || '').trim();
    const seriesCollection = loadCrashCourseSeries();
    const series = Array.isArray(seriesCollection)
      ? seriesCollection.find(item => String(item?.id || item?.key || '') === key)
      : null;
    const videos = filterKnowledgeLearningVideos(series?.videos);
    if (videos.length) return videos;
    const crashCourseVideos = loadCrashCourseVideos()[key];
    const crashCourseVideoList = filterKnowledgeLearningVideos(crashCourseVideos?.videos);
    if (crashCourseVideoList.length) return crashCourseVideoList;
    const bilibiliSeries = loadBilibiliSeriesVideos()[key];
    const bilibiliVideos = filterKnowledgeLearningVideos(bilibiliSeries?.videos);
    if (bilibiliVideos.length) return bilibiliVideos;
    const source = detail?.learningUnit?.source || {};
    if (!source.embedUrl && !source.url) return [];
    return [{
      id: 'source',
      episode: '推荐',
      title: source.title || '推荐视频',
      url: source.url,
      embedUrl: source.embedUrl,
      durationMinutes: detail?.learningUnit?.durationMinutes
    }];
  }

  return {
    dbJson,
    filterKnowledgeLearningVideos,
    findKnowledgeDetail,
    getKnowledgeSeriesVideos,
    loadAllKnowledgeSeriesFromDb,
    loadBilibiliSeriesVideos,
    loadCrashCourseSeries,
    loadCrashCourseVideos,
    loadDisciplines,
    loadKnowledgeDisciplinesFromDb,
    loadKnowledgeLearningUnits,
    loadKnowledgeLearningUnitsFromDb,
    loadKnowledgeSeriesFromDb,
    normalizeKnowledgeDisciplineId,
    seedKnowledgeContent
  };
}

module.exports = {
  createKnowledgeContentService
};

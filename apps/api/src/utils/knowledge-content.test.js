const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createDatabase } = require('../../db');
const { createKnowledgeContentService } = require('./knowledge-content');

test('knowledge content service seeds series content and exposes detail/videos from db', async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'api-knowledge-content-'));
  const dbPath = path.join(tmpRoot, 'db.sqlite');

  const disciplinesPath = path.join(tmpRoot, 'disciplines.json');
  const learningUnitsPath = path.join(tmpRoot, 'learning-units.json');
  const seriesPath = path.join(tmpRoot, 'series.json');
  const crashVideosPath = path.join(tmpRoot, 'crash-videos.json');
  const legacyVideosPath = path.join(tmpRoot, 'legacy-videos.json');
  const catalog = [{ id: 'course-ai', title: 'AI 入门' }];

  fs.writeFileSync(disciplinesPath, JSON.stringify([
    { id: 'ai', name: '人工智能', research_questions: [{ q: 'AI 是什么？', context: '从校园问题开始。' }] }
  ]), 'utf8');
  fs.writeFileSync(learningUnitsPath, JSON.stringify([
    {
      disciplineId: 'ai',
      title: 'AI 初识',
      durationMinutes: 12,
      next: { courseIds: ['course-ai'], projectPrompts: ['做一个校园 AI 观察项目'] },
      series: { key: 'artificial_intelligence', sourceUrl: 'https://example.com/series' },
      source: { title: '单视频兜底', url: 'https://example.com/source', embedUrl: 'https://example.com/embed' }
    }
  ]), 'utf8');
  fs.writeFileSync(seriesPath, JSON.stringify([
    { id: 'artificial_intelligence', title: 'Artificial Intelligence', disciplineId: 'ai', sourceUrl: 'https://example.com/series' }
  ]), 'utf8');
  fs.writeFileSync(crashVideosPath, JSON.stringify({
    artificial_intelligence: {
      videos: [
        { id: 'ai-00', episode: '00', title: '预告' },
        { id: 'ai-01', episode: '01', title: '第一集', bvid: 'BV1', url: 'https://example.com/1', embedUrl: 'https://example.com/embed/1', durationMinutes: 10 },
        { id: 'ai-02', episode: '02', title: '第二集', bvid: 'BV2', url: 'https://example.com/2', embedUrl: 'https://example.com/embed/2', durationMinutes: 11 }
      ]
    }
  }), 'utf8');
  fs.writeFileSync(legacyVideosPath, JSON.stringify({}), 'utf8');

  let db = await createDatabase(dbPath);

  const service = createKnowledgeContentService({
    getDb: () => db,
    now: () => '2026-06-15T00:00:00.000Z',
    readJsonFile(filePath, fallback) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (_err) {
        return fallback;
      }
    },
    safeParseJson(value) {
      try {
        return value ? JSON.parse(value) : null;
      } catch (_err) {
        return null;
      }
    },
    loadCourseCatalog: () => catalog,
    getKnowledgeEpisodePromptPreset: () => ({
      prompts: [
        {
          id: 'concept',
          type: 'single_choice',
          prompt: 'AI 更接近哪种能力？',
          options: [{ id: 'a', text: '模式识别' }],
          correctAnswer: 'a',
          expectation: '选最贴近的一项'
        }
      ]
    }),
    normalizeKnowledgePromptType(value) {
      return String(value || 'short_answer');
    },
    serializeKnowledgePromptOptions(options) {
      return JSON.stringify(Array.isArray(options) ? options : []);
    },
    disciplineDataPath: disciplinesPath,
    learningUnitsPath,
    crashCourseSeriesPath: seriesPath,
    crashCourseVideosPath: crashVideosPath,
    bilibiliSeriesVideosPath: legacyVideosPath
  });

  service.seedKnowledgeContent();

  const allSeries = service.loadAllKnowledgeSeriesFromDb();
  assert.equal(allSeries.length, 1);
  assert.equal(allSeries[0].id, 'artificial_intelligence');
  assert.equal(allSeries[0].videoCount, 3);

  const detail = service.findKnowledgeDetail('ai');
  assert.equal(detail.discipline.id, 'ai');
  assert.equal(detail.learningUnit.disciplineId, 'ai');
  assert.equal(detail.relatedCourses[0].id, 'course-ai');
  assert.equal(detail.series.videos.length, 2);
  assert.equal(detail.series.videos.some(item => item.episode === '00'), false);
  assert.deepEqual(
    service.getKnowledgeSeriesVideos(detail).map(item => item.id),
    ['ai-01', 'ai-02']
  );

  const promptRow = db.get(
    'SELECT prompt_type, correct_answer FROM knowledge_open_prompts WHERE discipline_id = ? AND episode_key = ? AND prompt_id = ?',
    ['ai', 'ai-01', 'concept']
  );
  assert.equal(promptRow.prompt_type, 'single_choice');
  assert.equal(promptRow.correct_answer, 'a');

  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

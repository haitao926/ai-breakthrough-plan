const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createPortalContentService } = require('./portal-content');

test('portal content service normalizes portal content and enriches competition/story responses', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'api-portal-content-'));
  const portalDir = path.join(tmpRoot, 'portal');
  const detailsDir = path.join(portalDir, 'competition-details');
  fs.mkdirSync(detailsDir, { recursive: true });

  const competitionsPath = path.join(portalDir, 'competitions.json');
  const storiesPath = path.join(portalDir, 'stories.json');
  const bannersPath = path.join(portalDir, 'banners.json');

  fs.writeFileSync(competitionsPath, JSON.stringify([{
    title: ' 全国机器人挑战赛 ',
    slug: 'robotics-open',
    discipline: [' 机器人 ', '机器人'],
    schoolStage: ['高中'],
    status: '报名中',
    relatedCourseIds: ['course-1', 'course-1', 'course-2'],
    publishStatus: 'published'
  }], null, 2), 'utf8');
  fs.writeFileSync(path.join(detailsDir, 'robotics-open.json'), JSON.stringify({
    whyJoin: '锻炼实战能力'
  }, null, 2), 'utf8');
  fs.writeFileSync(storiesPath, JSON.stringify([{
    title: ' 机器人战队成长记 ',
    slug: 'robot-team-story',
    relatedCompetitionSlug: 'robotics-open',
    relatedCourseIds: ['course-2', 'course-2'],
    featured: 1
  }], null, 2), 'utf8');
  fs.writeFileSync(bannersPath, JSON.stringify([
    { title: '次级 Banner', targetUrl: '/b', priority: 9 },
    { title: '主 Banner', targetUrl: '/a', priority: 1, page_key: 'competitions', cta_label: '立即查看', active: true }
  ], null, 2), 'utf8');

  const service = createPortalContentService({
    path,
    readJsonFile(filePath, fallback) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (_err) {
        return fallback;
      }
    },
    writeJsonFile(filePath, data) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    },
    normalizeTaxonomyArray(value) {
      if (!Array.isArray(value)) return [];
      return Array.from(new Set(value.map(item => String(item || '').trim()).filter(Boolean)));
    },
    normalizeTaxonomyValue(value) {
      return String(value || '').trim();
    },
    getActiveTaxonomyIndex() {
      return {};
    },
    normalizeJsonArray(value) {
      if (Array.isArray(value)) {
        return Array.from(new Set(value.map(item => String(item || '').trim()).filter(Boolean)));
      }
      return [];
    },
    loadCourseCatalog() {
      return [
        { id: 'course-1', title: '机器人基础', summary: '基础', audience: '初学者', direction: 'robotics' },
        { id: 'course-2', title: '工程挑战', summary: '项目', audience: '进阶', direction: 'engineering' }
      ];
    },
    getCompetitionRegistrationStats(slug) {
      return { slug, total: 7 };
    },
    portalCompetitionsPath: competitionsPath,
    portalCompetitionDetailsDir: detailsDir,
    portalStoriesPath: storiesPath,
    portalBannersPath: bannersPath,
    competitionPublishStatuses: new Set(['draft', 'published', 'archived'])
  });

  const competitions = service.loadPortalCompetitions();
  assert.equal(competitions.length, 1);
  assert.deepEqual(competitions[0].relatedCourseIds, ['course-1', 'course-2']);

  const courseMap = service.buildCoursePreviewMap();
  const enrichedCompetition = service.enrichCompetition(competitions[0], courseMap);
  assert.equal(enrichedCompetition.relatedCourses.length, 2);
  assert.equal(enrichedCompetition.registrationStats.total, 7);

  const detail = service.loadPortalCompetitionDetail('robotics-open');
  assert.equal(detail.whyJoin, '锻炼实战能力');

  const stories = service.loadPortalStories();
  assert.equal(stories[0].featured, true);
  const storyResponse = service.buildStoryResponse(stories[0], { 'robotics-open': enrichedCompetition }, courseMap);
  assert.equal(storyResponse.relatedCompetition.slug, 'robotics-open');
  assert.equal(storyResponse.relatedCourses.length, 1);

  const banners = service.loadPortalBanners();
  assert.deepEqual(banners.map(item => item.title), ['主 Banner', '次级 Banner']);
  assert.equal(banners[0].buttonText, '立即查看');

  const normalizedCompetition = service.normalizeCompetitionPayload({
    title: ' AI 创新挑战 ',
    relatedCourseIds: ['course-1', 'course-1'],
    featuredFlags: ['hot', 'hot'],
    publishStatus: 'invalid'
  });
  assert.equal(normalizedCompetition.slug, 'ai');
  assert.deepEqual(normalizedCompetition.relatedCourseIds, ['course-1']);
  assert.deepEqual(normalizedCompetition.featuredFlags, ['hot']);
  assert.equal(normalizedCompetition.publishStatus, 'draft');

  const normalizedBanner = service.normalizeBannerPayload({
    page_key: 'downloads',
    cta_label: '去看看',
    target_url: '/courses'
  }, { title: '默认标题' });
  assert.equal(normalizedBanner.pageKey, 'courses');
  assert.equal(normalizedBanner.buttonText, '去看看');
  assert.equal(normalizedBanner.targetUrl, '/courses');

  const normalizedStory = service.normalizeStoryPayload({
    title: ' 学生成长记录 ',
    relatedCourseIds: ['course-2', 'course-2']
  });
  assert.equal(normalizedStory.slug, '');
  assert.deepEqual(normalizedStory.relatedCourseIds, ['course-2']);

  service.savePortalCompetition({ ...competitions[0], title: '全国机器人挑战赛 2026' });
  service.savePortalStories([{ ...stories[0], title: '升级版故事' }]);
  service.savePortalBanners([{ title: '新 Banner', targetUrl: '/new', priority: 3 }]);

  const savedCompetitions = JSON.parse(fs.readFileSync(competitionsPath, 'utf8'));
  const savedStories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));
  const savedBanners = JSON.parse(fs.readFileSync(bannersPath, 'utf8'));
  assert.equal(savedCompetitions[0].title, '全国机器人挑战赛 2026');
  assert.equal(savedStories[0].title, '升级版故事');
  assert.equal(savedBanners[0].title, '新 Banner');

  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

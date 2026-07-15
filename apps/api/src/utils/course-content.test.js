const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createCourseContentService } = require('./course-content');
const { sanitizeLessonContent } = require('./html-sanitizer');

test('course content service loads catalog, lessons, materials and normalizes payloads', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'api-course-content-'));
  const coursesDir = path.join(tmpRoot, 'courses');
  const materialsDir = path.join(tmpRoot, 'materials');
  fs.mkdirSync(coursesDir, { recursive: true });
  fs.mkdirSync(materialsDir, { recursive: true });

  const courseId = 'ai-lab';
  const courseDir = path.join(coursesDir, courseId);
  const lessonsDir = path.join(materialsDir, courseId, 'lessons');
  fs.mkdirSync(courseDir, { recursive: true });
  fs.mkdirSync(lessonsDir, { recursive: true });

  const courseCatalogPath = path.join(tmpRoot, 'catalog.json');
  fs.writeFileSync(courseCatalogPath, JSON.stringify([
    { id: courseId, title: '旧标题' },
    { id: 'assignment-test-course-123', title: '作业测试课程', materialsRoot: 'assignment-test-course-123' },
    { id: 'ai-vision-lab-test-123', title: 'AI 视觉实验课', materialsRoot: 'ai-vision-lab-test-123' }
  ]), 'utf8');
  fs.writeFileSync(path.join(courseDir, 'course.json'), JSON.stringify({
    id: courseId,
    title: 'AI 实验课',
    direction: 'ai',
    materialsRoot: courseId,
    materials: [
      { id: 'guide', section: '课程导学', title: '课程导学', path: 'guide.md', kind: 'markdown' }
    ],
    learningObjectives: ['理解 AI 问题'],
    tags: ['人工智能'],
    visibility: 'assigned',
    visibleToRoles: ['teacher'],
    visibleToUserIds: [1, 2],
    visibleToClassNames: ['高一 1 班']
  }), 'utf8');
  fs.writeFileSync(path.join(materialsDir, courseId, 'guide.md'), '# guide', 'utf8');
  fs.writeFileSync(path.join(lessonsDir, 'lesson2.json'), JSON.stringify({ title: '第二课', order: 2, duration: 50 }), 'utf8');
  fs.writeFileSync(path.join(lessonsDir, 'lesson1.json'), JSON.stringify({ title: '第一课', order: 1, duration: 45, lessonResources: [{ title: '讲义', path: 'slides/intro.md' }] }), 'utf8');

  const service = createCourseContentService({
    path,
    fs,
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
      return Array.isArray(value) ? value.map(item => String(item || '').trim()).filter(Boolean) : [];
    },
    normalizeTaxonomyValue(value) {
      return String(value || '').trim();
    },
    getActiveTaxonomyIndex() {
      return {};
    },
    courseCatalogPath,
    coursesDir,
    materialsDir,
    courseDirections: new Set(['foundation', 'ai']),
    courseStatuses: new Set(['draft', 'published']),
    courseMaterialSections: new Set(['课程导学', '学生资料', '教师资料', '补充资料']),
    apiPrefix: '/api/v1',
    toUrlPath(value) {
      return String(value || '')
        .split('/')
        .filter(Boolean)
        .map(part => encodeURIComponent(part))
        .join('/');
    },
    sanitizeLessonContent
  });

  const catalog = service.loadCourseCatalog();
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, courseId);

  const detail = service.loadCourseDetail(courseId);
  assert.equal(detail.title, 'AI 实验课');
  assert.equal(detail.materialsRoot, courseId);
  assert.equal(detail.visibility, 'assigned');
  assert.deepEqual(detail.visibleToRoles, ['teacher']);
  assert.deepEqual(detail.visibleToUserIds, [1, 2]);
  assert.deepEqual(detail.visibleToClassNames, ['高一 1 班']);

  const lessons = service.listCourseLessons(detail);
  assert.deepEqual(lessons.map(item => item.id), ['lesson1', 'lesson2']);
  assert.equal(lessons[0].lessonResources[0].path, 'slides/intro.md');

  const materials = service.listCourseMaterials(detail);
  assert.equal(materials.length, 1);
  assert.equal(materials[0].downloadUrl, '/api/v1/download/ai-lab/guide.md');

  const normalizedCourse = service.normalizeCoursePayload({
    title: 'AI 新课',
    direction: 'ai',
    materialsRoot: '/ai-lab/',
    materials: [{ title: '资料', path: '/docs/one.pdf', section: '学生资料' }],
    learningObjectives: ['目标一', ''],
    visibility: 'private',
    visibleToRoles: ['judge', 'judge'],
    visibleToUserIds: ['3', 'abc', 3],
    visibleToClassNames: '高一 2 班，高一 2 班'
  });
  assert.equal(normalizedCourse.id, 'ai');
  assert.equal(normalizedCourse.materialsRoot, 'ai-lab');
  assert.equal(normalizedCourse.materials[0].path, 'docs/one.pdf');
  assert.equal(normalizedCourse.visibility, 'private');
  assert.deepEqual(normalizedCourse.visibleToRoles, ['judge']);
  assert.deepEqual(normalizedCourse.visibleToUserIds, [3]);
  assert.deepEqual(normalizedCourse.visibleToClassNames, ['高一 2 班']);

  const normalizedLesson = service.normalizeLessonPayload({
    title: '第三课',
    units: [{ pages: [{ content: '<script>alert(1)</script><p>安全段落</p><img src="javascript:alert(1)">' }] }],
    lessonResources: [{ title: '清单', path: '/files/checklist.md' }]
  }, {}, 'lesson3', courseId);
  assert.equal(normalizedLesson.id, `${courseId}-lesson3`);
  assert.equal(normalizedLesson.lessonResources[0].path, 'files/checklist.md');
  assert.match(normalizedLesson.units[0].pages[0].content, /安全段落/);
  assert.doesNotMatch(normalizedLesson.units[0].pages[0].content, /script|javascript:/i);

  service.saveCourseDetail({
    ...detail,
    title: 'AI 实验课升级版'
  });
  const savedCatalog = JSON.parse(fs.readFileSync(courseCatalogPath, 'utf8'));
  assert.equal(savedCatalog[0].title, 'AI 实验课升级版');

  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

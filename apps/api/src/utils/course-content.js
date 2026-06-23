function createCourseContentService(options) {
  const {
    path,
    fs,
    readJsonFile,
    writeJsonFile,
    normalizeTaxonomyArray,
    normalizeTaxonomyValue,
    getActiveTaxonomyIndex,
    courseCatalogPath,
    coursesDir,
    materialsDir,
    courseDirections,
    courseStatuses,
    courseMaterialSections,
    apiPrefix,
    toUrlPath
  } = options;

  function normalizeCourseId(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function normalizeRelativePath(value) {
    return String(value || '')
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .split('/')
      .filter(part => part && part !== '.' && part !== '..')
      .join('/');
  }

  function courseFilePath(courseId) {
    return path.join(coursesDir, courseId, 'course.json');
  }

  function lessonSortValue(value) {
    const match = String(value || '').match(/(\d+)/);
    return match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
  }

  function isPlaceholderCourse(course) {
    const id = String(course?.id || '').trim().toLowerCase();
    const title = String(course?.title || '').trim();
    const materialsRoot = String(course?.materialsRoot || '').trim().toLowerCase();
    return (
      id === 'assignment-test-course'
      || id.startsWith('assignment-test-course-')
      || id.startsWith('ai-vision-lab-test-')
      || materialsRoot === 'assignment-test-course'
      || materialsRoot.startsWith('assignment-test-course-')
      || materialsRoot.startsWith('ai-vision-lab-test-')
      || title === '作业测试课程'
    );
  }

  function loadCourseCatalog() {
    const catalog = readJsonFile(courseCatalogPath, []);
    if (!Array.isArray(catalog)) return [];
    return catalog.filter(course => !isPlaceholderCourse(course));
  }

  function toCatalogEntry(course) {
    return {
      id: course.id,
      title: course.title,
      direction: course.direction,
      teacherName: course.teacherName,
      summary: course.summary,
      description: course.description,
      audience: course.audience,
      pace: course.pace,
      status: course.status,
      materialsRoot: course.materialsRoot,
      relatedProjects: Array.isArray(course.relatedProjects) ? course.relatedProjects : [],
      positioning: course.positioning || '',
      courseType: course.courseType || '',
      tags: Array.isArray(course.tags) ? course.tags : [],
      skillOutcomes: Array.isArray(course.skillOutcomes) ? course.skillOutcomes : [],
      difficultyPath: course.difficultyPath || '',
      createdBy: course.createdBy || course.created_by || null
    };
  }

  function loadCourseDetail(courseId) {
    const safeId = normalizeCourseId(courseId);
    if (!safeId) return null;
    const course = readJsonFile(courseFilePath(safeId), null);
    if (!course || typeof course !== 'object') return null;
    return {
      ...course,
      id: safeId,
      materialsRoot: normalizeRelativePath(course.materialsRoot || safeId) || safeId,
      relatedProjects: Array.isArray(course.relatedProjects) ? course.relatedProjects : [],
      learningObjectives: Array.isArray(course.learningObjectives) ? course.learningObjectives : [],
      tags: Array.isArray(course.tags) ? course.tags : [],
      skillOutcomes: Array.isArray(course.skillOutcomes) ? course.skillOutcomes : [],
      difficultyPath: String(course.difficultyPath || '').trim(),
      materials: Array.isArray(course.materials) ? course.materials : [],
      createdBy: course.createdBy || course.created_by || null
    };
  }

  function listCourseLessons(course) {
    const lessonsDir = path.join(materialsDir, course.materialsRoot, 'lessons');
    if (!lessonsDir.startsWith(materialsDir) || !fs.existsSync(lessonsDir)) {
      return [];
    }

    return fs.readdirSync(lessonsDir)
      .filter(fileName => /\.json$/i.test(fileName))
      .sort((a, b) => lessonSortValue(a) - lessonSortValue(b))
      .map(fileName => {
        const lessonId = fileName.replace(/\.json$/i, '');
        const data = readJsonFile(path.join(lessonsDir, fileName), {});
        return {
          id: lessonId,
          courseId: course.id,
          title: data.title || lessonId,
          description: data.description || '',
          order: Number.isFinite(Number(data.order)) ? Number(data.order) : lessonSortValue(lessonId),
          duration: Number.isFinite(Number(data.duration)) ? Number(data.duration) : 0,
          moduleId: String(data.moduleId || '').trim(),
          essentialQuestion: String(data.essentialQuestion || '').trim(),
          learningObjectives: Array.isArray(data.learningObjectives)
            ? data.learningObjectives.map(item => String(item || '').trim()).filter(Boolean)
            : [],
          knowledgePoints: Array.isArray(data.knowledgePoints)
            ? data.knowledgePoints.map(item => String(item || '').trim()).filter(Boolean)
            : [],
          equipment: Array.isArray(data.equipment)
            ? data.equipment.map(item => String(item || '').trim()).filter(Boolean)
            : [],
          classroomTasks: Array.isArray(data.classroomTasks)
            ? data.classroomTasks.map(item => String(item || '').trim()).filter(Boolean)
            : [],
          deliverables: Array.isArray(data.deliverables)
            ? data.deliverables.map(item => String(item || '').trim()).filter(Boolean)
            : [],
          commonMisconceptions: Array.isArray(data.commonMisconceptions)
            ? data.commonMisconceptions.map(item => String(item || '').trim()).filter(Boolean)
            : [],
          assessmentCriteria: Array.isArray(data.assessmentCriteria)
            ? data.assessmentCriteria.map(item => String(item || '').trim()).filter(Boolean)
            : [],
          homework: Array.isArray(data.homework)
            ? data.homework.map(item => String(item || '').trim()).filter(Boolean)
            : [],
          lessonResources: Array.isArray(data.lessonResources)
            ? data.lessonResources
              .filter(item => item && typeof item === 'object')
              .map(item => ({
                type: String(item.type || '').trim() || 'resource',
                title: String(item.title || '').trim(),
                path: normalizeRelativePath(item.path || '')
              }))
              .filter(item => item.title || item.path)
            : [],
          units: Array.isArray(data.units) ? data.units : [],
          phases: Array.isArray(data.phases) ? data.phases : []
        };
      })
      .sort((a, b) => a.order - b.order);
  }

  function listCourseMaterials(course) {
    return (Array.isArray(course.materials) ? course.materials : [])
      .map((item, index) => {
        const relativePath = normalizeRelativePath(item.path || '');
        const absolutePath = relativePath
          ? path.join(materialsDir, course.materialsRoot, relativePath)
          : '';
        const exists = absolutePath ? fs.existsSync(absolutePath) : false;
        return {
          id: item.id || `${course.id}-material-${index + 1}`,
          courseId: course.id,
          section: courseMaterialSections.has(item.section) ? item.section : '补充资料',
          title: String(item.title || relativePath || `资料 ${index + 1}`).trim(),
          path: relativePath,
          kind: String(item.kind || '').trim() || 'file',
          exists,
          downloadUrl: relativePath
            ? `${apiPrefix}/download/${toUrlPath(course.materialsRoot)}/${toUrlPath(relativePath)}`
            : ''
        };
      })
      .filter(item => item.path);
  }

  function normalizeCourseMaterialList(value, courseId) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const relativePath = normalizeRelativePath(item.path || '');
        const title = String(item.title || '').trim();
        if (!relativePath || !title) return null;
        return {
          id: String(item.id || `${courseId}-material-${index + 1}`).trim(),
          courseId,
          section: courseMaterialSections.has(item.section) ? item.section : '补充资料',
          title,
          path: relativePath,
          kind: String(item.kind || '').trim() || 'file'
        };
      })
      .filter(Boolean);
  }

  function normalizeCoursePayload(input = {}, existingCourse = {}) {
    const fallbackId = normalizeCourseId(existingCourse.id || input.id || input.title);
    const direction = String(input.direction || existingCourse.direction || 'foundation').trim();
    const status = String(input.status || existingCourse.status || 'draft').trim();
    const taxonomyIndex = getActiveTaxonomyIndex();
    const materialsRoot = normalizeRelativePath(input.materialsRoot || existingCourse.materialsRoot || fallbackId) || fallbackId;
    const learningObjectives = Array.isArray(input.learningObjectives)
      ? input.learningObjectives.map(item => String(item || '').trim()).filter(Boolean)
      : (Array.isArray(existingCourse.learningObjectives) ? existingCourse.learningObjectives : []);
    const relatedProjects = Array.isArray(input.relatedProjects)
      ? Array.from(new Set(input.relatedProjects.map(item => String(item || '').trim()).filter(Boolean)))
      : (Array.isArray(existingCourse.relatedProjects) ? existingCourse.relatedProjects : []);
    const materials = Array.isArray(input.materials)
      ? normalizeCourseMaterialList(input.materials, fallbackId)
      : (Array.isArray(existingCourse.materials) ? existingCourse.materials : []);

    return {
      id: fallbackId,
      title: String(input.title || existingCourse.title || '').trim(),
      direction: courseDirections.has(direction) ? direction : 'foundation',
      teacherName: String(input.teacherName || existingCourse.teacherName || '').trim(),
      summary: String(input.summary || existingCourse.summary || '').trim(),
      description: String(input.description || existingCourse.description || '').trim(),
      audience: String(input.audience || existingCourse.audience || '').trim(),
      pace: String(input.pace || existingCourse.pace || '').trim(),
      status: courseStatuses.has(status) ? status : 'draft',
      materialsRoot,
      relatedProjects,
      positioning: String(input.positioning || existingCourse.positioning || '').trim(),
      courseType: String(input.courseType || existingCourse.courseType || '').trim(),
      tags: normalizeTaxonomyArray(input.tags ?? existingCourse.tags, ['discipline', 'skill'], taxonomyIndex),
      skillOutcomes: normalizeTaxonomyArray(input.skillOutcomes ?? input.skill_outcomes ?? existingCourse.skillOutcomes, ['skill'], taxonomyIndex),
      difficultyPath: normalizeTaxonomyValue(input.difficultyPath || input.difficulty_path || existingCourse.difficultyPath, ['difficulty'], taxonomyIndex),
      guidePath: normalizeRelativePath(input.guidePath || existingCourse.guidePath || ''),
      learningObjectives,
      materials,
      createdBy: input.createdBy || input.created_by || existingCourse.createdBy || existingCourse.created_by || null
    };
  }

  function saveCourseDetail(course) {
    writeJsonFile(courseFilePath(course.id), course);
    const catalog = loadCourseCatalog();
    const nextEntry = toCatalogEntry(course);
    const existingIndex = catalog.findIndex(item => item.id === course.id);
    if (existingIndex >= 0) {
      catalog[existingIndex] = nextEntry;
    } else {
      catalog.push(nextEntry);
    }
    writeJsonFile(courseCatalogPath, catalog);
  }

  function normalizeLessonPayload(input = {}, existingLesson = {}, lessonId, courseId) {
    const safeLessonId = normalizeCourseId(lessonId).replace(/-/g, '') || String(lessonId || '').trim() || 'lesson1';
    const normalizedId = safeLessonId.startsWith('lesson') ? safeLessonId : `lesson${safeLessonId.replace(/^lesson/i, '')}`;
    const order = Number.isFinite(Number(input.order)) ? Number(input.order) : (
      Number.isFinite(Number(existingLesson.order)) ? Number(existingLesson.order) : lessonSortValue(normalizedId)
    );
    const normalizeTextList = (value, fallback = []) => {
      if (Array.isArray(value)) {
        return value.map(item => String(item || '').trim()).filter(Boolean);
      }
      if (Array.isArray(fallback)) {
        return fallback.map(item => String(item || '').trim()).filter(Boolean);
      }
      return [];
    };
    const normalizeLessonResourceList = (value, fallback = []) => {
      const source = Array.isArray(value) ? value : (Array.isArray(fallback) ? fallback : []);
      return source
        .filter(item => item && typeof item === 'object')
        .map(item => ({
          type: String(item.type || '').trim() || 'resource',
          title: String(item.title || '').trim(),
          path: normalizeRelativePath(item.path || '')
        }))
        .filter(item => item.title || item.path);
    };
    return {
      id: String(input.id || existingLesson.id || `${courseId}-${normalizedId}`).trim(),
      project: input.project || existingLesson.project || courseId,
      title: String(input.title || existingLesson.title || normalizedId).trim(),
      duration: Number.isFinite(Number(input.duration)) ? Number(input.duration) : (Number.isFinite(Number(existingLesson.duration)) ? Number(existingLesson.duration) : 45),
      description: String(input.description || existingLesson.description || '').trim(),
      moduleId: String(input.moduleId || existingLesson.moduleId || '').trim(),
      essentialQuestion: String(input.essentialQuestion || existingLesson.essentialQuestion || '').trim(),
      learningObjectives: normalizeTextList(input.learningObjectives, existingLesson.learningObjectives),
      knowledgePoints: normalizeTextList(input.knowledgePoints, existingLesson.knowledgePoints),
      equipment: normalizeTextList(input.equipment, existingLesson.equipment),
      classroomTasks: normalizeTextList(input.classroomTasks, existingLesson.classroomTasks),
      deliverables: normalizeTextList(input.deliverables, existingLesson.deliverables),
      commonMisconceptions: normalizeTextList(input.commonMisconceptions, existingLesson.commonMisconceptions),
      assessmentCriteria: normalizeTextList(input.assessmentCriteria, existingLesson.assessmentCriteria),
      homework: normalizeTextList(input.homework, existingLesson.homework),
      lessonResources: normalizeLessonResourceList(input.lessonResources, existingLesson.lessonResources),
      order,
      units: Array.isArray(input.units) ? input.units : (Array.isArray(existingLesson.units) ? existingLesson.units : []),
      phases: Array.isArray(input.phases) ? input.phases : (Array.isArray(existingLesson.phases) ? existingLesson.phases : [])
    };
  }

  return {
    courseFilePath,
    lessonSortValue,
    listCourseLessons,
    listCourseMaterials,
    loadCourseCatalog,
    loadCourseDetail,
    isPlaceholderCourse,
    normalizeCourseId,
    normalizeCoursePayload,
    normalizeLessonPayload,
    normalizeRelativePath,
    saveCourseDetail,
    toCatalogEntry
  };
}

module.exports = {
  createCourseContentService
};

const courseBodySchema = {
  type: 'object',
  required: ['id', 'title'],
  properties: {
    id: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$' },
    title: { type: 'string', minLength: 1, maxLength: 200 },
    direction: { type: 'string', maxLength: 80 },
    teacherName: { type: 'string', maxLength: 120 },
    summary: { type: 'string', maxLength: 4000 },
    description: { type: 'string', maxLength: 8000 },
    audience: { type: 'string', maxLength: 400 },
    pace: { type: 'string', maxLength: 200 },
    status: { type: 'string', maxLength: 40 },
    visibility: { type: 'string', enum: ['public', 'assigned', 'private'] },
    positioning: { type: 'string', maxLength: 400 },
    courseType: { type: 'string', maxLength: 120 },
    difficultyPath: { type: 'string', maxLength: 120 },
    materialsRoot: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$' },
    tags: { type: 'array', items: { type: 'string', maxLength: 80 } },
    skillOutcomes: { type: 'array', items: { type: 'string', maxLength: 120 } },
    learningObjectives: { type: 'array', items: { type: 'string', maxLength: 500 } },
    visibleToRoles: { type: 'array', items: { type: 'string', maxLength: 40 } },
    visibleToUserIds: { type: 'array', items: { type: 'integer' } },
    visibleToClassNames: { type: 'array', items: { type: 'string', maxLength: 120 } },
    relatedProjects: { type: 'array' },
    materials: { type: 'array' }
  },
  additionalProperties: true
};

const lessonBodySchema = {
  type: 'object',
  properties: {
    id: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$' },
    lessonId: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$' },
    title: { type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string', maxLength: 4000 },
    duration: { anyOf: [{ type: 'number' }, { type: 'integer' }, { type: 'string', maxLength: 40 }] },
    order: { anyOf: [{ type: 'number' }, { type: 'integer' }, { type: 'string', maxLength: 40 }] },
    learningObjectives: { type: 'array' },
    knowledgePoints: { type: 'array' },
    homework: { type: 'array' },
    deliverables: { type: 'array' },
    units: { type: 'array' },
    phases: { type: 'array' }
  },
  additionalProperties: true
};

const courseParamsSchema = {
  type: 'object',
  required: ['id'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$' }
  }
};

const lessonParamsSchema = {
  type: 'object',
  required: ['id', 'lessonId'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$' },
    lessonId: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$' }
  }
};

function isCourseLibraryPlaceholder(course) {
  const id = String(course?.id || '').trim().toLowerCase();
  const title = String(course?.title || '').trim();
  const materialsRoot = String(course?.materialsRoot || '').trim().toLowerCase();
  const placeholderPrefixes = [
    'assignment-test-course',
    'ai-vision-lab-test-',
    'ai-vision-lab-live-',
    'course-match-test-'
  ];

  return placeholderPrefixes.some(prefix => id.startsWith(prefix) || materialsRoot.startsWith(prefix))
    || title === '作业测试课程';
}

function registerCourseRoutes(fastify, deps) {
  const {
    API_PREFIX,
    path,
    fs,
    MATERIALS_DIR,
    ensureDir,
    requireRole,
    loadCourseCatalog,
    loadCourseDetail,
    listCourseLessons,
    listCourseMaterials,
    normalizeCoursePayload,
    saveCourseDetail,
    normalizeLessonPayload,
    readJsonFile,
    writeJsonFile,
    logMatchEvent,
    recomputeCourseMatches,
    db,
    now,
    requireAuth,
    canReadCourse,
    canEditCourse
  } = deps;

  function loadAccessibleCourse(courseId, user) {
    const course = loadCourseDetail(courseId);
    if (!course) return { course: null, allowed: false };
    return { course, allowed: canReadCourse(user, course) };
  }

  function filterAccessibleCourses(courses, user) {
    return (courses || [])
      .filter(course => canReadCourse(user, course))
      .filter(course => !isCourseLibraryPlaceholder(course));
  }

  function requireCourseRead(request, reply, course) {
    if (canReadCourse(request.user, course)) return true;
    reply.code(404);
    reply.send({ error: '课程不存在' });
    return false;
  }

  function requireCourseEdit(request, reply, course) {
    if (typeof canEditCourse !== 'function' || canEditCourse(request.user, course)) return true;
    reply.code(403);
    reply.send({ error: '无权限编辑该课程' });
    return false;
  }

  fastify.get(`${API_PREFIX}/courses`, async (request) => {
    return { courses: filterAccessibleCourses(loadCourseCatalog(), request.user || null) };
  });

  fastify.get(`${API_PREFIX}/courses/:id`, { schema: { params: courseParamsSchema } }, async (request, reply) => {
    const { course } = loadAccessibleCourse(request.params.id, request.user || null);
    if (!course) {
      reply.code(404);
      return { error: 'Course not found' };
    }
    if (!requireCourseRead(request, reply, course)) return;
    return { course };
  });

  fastify.get(`${API_PREFIX}/courses/:id/lessons`, { schema: { params: courseParamsSchema } }, async (request, reply) => {
    const { course } = loadAccessibleCourse(request.params.id, request.user || null);
    if (!course) {
      reply.code(404);
      return { error: 'Course not found' };
    }
    if (!requireCourseRead(request, reply, course)) return;
    return { lessons: listCourseLessons(course) };
  });

  fastify.get(`${API_PREFIX}/courses/:id/materials`, { schema: { params: courseParamsSchema } }, async (request, reply) => {
    const { course } = loadAccessibleCourse(request.params.id, request.user || null);
    if (!course) {
      reply.code(404);
      return { error: 'Course not found' };
    }
    if (!requireCourseRead(request, reply, course)) return;
    return { materials: listCourseMaterials(course) };
  });

  fastify.post(`${API_PREFIX}/courses`, {
    schema: {
      body: courseBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const payload = normalizeCoursePayload(request.body || {});
    payload.createdBy = request.user.id;
    if (!payload.id || !payload.title) {
      reply.code(400);
      return { error: 'Course id and title are required' };
    }
    if (loadCourseDetail(payload.id)) {
      reply.code(409);
      return { error: 'Course already exists' };
    }
    saveCourseDetail(payload);
    logMatchEvent({
      targetType: 'course',
      targetKey: payload.id,
      eventType: 'course_published',
      payload: { source: 'courses.create' }
    });
    await recomputeCourseMatches({
      userIds: db.all('SELECT id FROM users WHERE role = ?', ['student']).map((row) => Number(row.id)).filter(Boolean),
      actor: request.user,
      courseIds: [payload.id],
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      forceRefresh: true
    });
    reply.code(201);
    return { course: payload };
  });

  fastify.patch(`${API_PREFIX}/courses/:id`, {
    schema: {
      params: courseParamsSchema,
      body: courseBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const current = loadCourseDetail(request.params.id);
    if (!current) {
      reply.code(404);
      return { error: 'Course not found' };
    }
    if (!requireCourseEdit(request, reply, current)) return;
    const payload = normalizeCoursePayload(request.body || {}, current);
    payload.id = current.id;
    saveCourseDetail(payload);
    logMatchEvent({
      targetType: 'course',
      targetKey: payload.id,
      eventType: 'course_updated',
      payload: { source: 'courses.update' }
    });
    await recomputeCourseMatches({
      userIds: db.all('SELECT id FROM users WHERE role = ?', ['student']).map((row) => Number(row.id)).filter(Boolean),
      actor: request.user,
      courseIds: [payload.id],
      aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
      forceRefresh: true
    });
    return { course: payload };
  });

  fastify.post(`${API_PREFIX}/courses/:id/lessons`, {
    schema: {
      params: courseParamsSchema,
      body: lessonBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const course = loadCourseDetail(request.params.id);
    if (!course) {
      reply.code(404);
      return { error: 'Course not found' };
    }
    if (!requireCourseEdit(request, reply, course)) return;
    const rawLessonId = String(request.body?.lessonId || request.body?.id || '').trim();
    if (rawLessonId && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(rawLessonId)) {
      reply.code(400);
      return { error: '课时ID格式无效' };
    }
    const lessonId = rawLessonId || `lesson${listCourseLessons(course).length + 1}`;
    const materialsRoot = path.resolve(MATERIALS_DIR, course.materialsRoot);
    const materialsRelative = path.relative(path.resolve(MATERIALS_DIR), materialsRoot);
    if (!materialsRelative || materialsRelative.startsWith('..') || path.isAbsolute(materialsRelative)) {
      reply.code(400);
      return { error: '课程资料路径无效' };
    }
    const lessonsDir = path.resolve(materialsRoot, 'lessons');
    ensureDir(lessonsDir);
    const fileName = `${lessonId.replace(/\.json$/i, '')}.json`;
    const targetPath = path.resolve(lessonsDir, fileName);
    const relativeTarget = path.relative(path.resolve(lessonsDir), targetPath);
    if (!relativeTarget || relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
      reply.code(400);
      return { error: '课时路径无效' };
    }
    if (fs.existsSync(targetPath)) {
      reply.code(409);
      return { error: 'Lesson already exists' };
    }
    const lesson = normalizeLessonPayload(request.body || {}, {}, lessonId, course.id);
    writeJsonFile(targetPath, lesson);
    reply.code(201);
    return { lesson };
  });

  fastify.patch(`${API_PREFIX}/courses/:id/lessons/:lessonId`, {
    schema: {
      params: lessonParamsSchema,
      body: lessonBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const course = loadCourseDetail(request.params.id);
    if (!course) {
      reply.code(404);
      return { error: 'Course not found' };
    }
    if (!requireCourseEdit(request, reply, course)) return;
    const lessonId = String(request.params.lessonId || '').trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(lessonId)) {
      reply.code(400);
      return { error: '课时ID格式无效' };
    }
    const lessonsDir = path.resolve(MATERIALS_DIR, course.materialsRoot, 'lessons');
    const targetPath = path.resolve(lessonsDir, `${lessonId}.json`);
    const relativeTarget = path.relative(lessonsDir, targetPath);
    if (!relativeTarget || relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
      reply.code(400);
      return { error: '课时路径无效' };
    }
    const existingLesson = readJsonFile(targetPath, null);
    if (!existingLesson) {
      reply.code(404);
      return { error: 'Lesson not found' };
    }
    const lesson = normalizeLessonPayload(request.body || {}, existingLesson, lessonId, course.id);
    writeJsonFile(targetPath, lesson);
    return { lesson };
  });
}

module.exports = {
  registerCourseRoutes
};

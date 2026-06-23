const courseBodySchema = {
  type: 'object',
  required: ['id', 'title'],
  properties: {
    id: { type: 'string', minLength: 1, maxLength: 120 },
    title: { type: 'string', minLength: 1, maxLength: 200 },
    direction: { type: 'string', maxLength: 80 },
    teacherName: { type: 'string', maxLength: 120 },
    summary: { type: 'string', maxLength: 4000 },
    description: { type: 'string', maxLength: 8000 },
    audience: { type: 'string', maxLength: 400 },
    pace: { type: 'string', maxLength: 200 },
    status: { type: 'string', maxLength: 40 },
    positioning: { type: 'string', maxLength: 400 },
    courseType: { type: 'string', maxLength: 120 },
    difficultyPath: { type: 'string', maxLength: 120 },
    materialsRoot: { type: 'string', maxLength: 200 },
    tags: { type: 'array', items: { type: 'string', maxLength: 80 } },
    skillOutcomes: { type: 'array', items: { type: 'string', maxLength: 120 } },
    learningObjectives: { type: 'array', items: { type: 'string', maxLength: 500 } },
    relatedProjects: { type: 'array' },
    materials: { type: 'array' }
  },
  additionalProperties: true
};

const lessonBodySchema = {
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 120 },
    lessonId: { type: 'string', maxLength: 120 },
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
    now
  } = deps;

  fastify.get(`${API_PREFIX}/courses`, async () => {
    return { courses: loadCourseCatalog() };
  });

  fastify.get(`${API_PREFIX}/courses/:id`, async (request, reply) => {
    const course = loadCourseDetail(request.params.id);
    if (!course) {
      reply.code(404);
      return { error: 'Course not found' };
    }
    return { course };
  });

  fastify.get(`${API_PREFIX}/courses/:id/lessons`, async (request, reply) => {
    const course = loadCourseDetail(request.params.id);
    if (!course) {
      reply.code(404);
      return { error: 'Course not found' };
    }
    return { lessons: listCourseLessons(course) };
  });

  fastify.get(`${API_PREFIX}/courses/:id/materials`, async (request, reply) => {
    const course = loadCourseDetail(request.params.id);
    if (!course) {
      reply.code(404);
      return { error: 'Course not found' };
    }
    return { materials: listCourseMaterials(course) };
  });

  fastify.post(`${API_PREFIX}/courses`, {
    schema: {
      body: courseBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
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
      body: courseBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    const current = loadCourseDetail(request.params.id);
    if (!current) {
      reply.code(404);
      return { error: 'Course not found' };
    }
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
      body: lessonBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    const course = loadCourseDetail(request.params.id);
    if (!course) {
      reply.code(404);
      return { error: 'Course not found' };
    }
    const rawLessonId = String(request.body?.lessonId || request.body?.id || '').trim();
    const lessonId = rawLessonId || `lesson${listCourseLessons(course).length + 1}`;
    const lessonsDir = path.join(MATERIALS_DIR, course.materialsRoot, 'lessons');
    ensureDir(lessonsDir);
    const fileName = `${lessonId.replace(/\.json$/i, '')}.json`;
    const targetPath = path.join(lessonsDir, fileName);
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
      body: lessonBodySchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher', 'judge'])) return;
    const course = loadCourseDetail(request.params.id);
    if (!course) {
      reply.code(404);
      return { error: 'Course not found' };
    }
    const lessonId = String(request.params.lessonId || '').trim();
    const targetPath = path.join(MATERIALS_DIR, course.materialsRoot, 'lessons', `${lessonId.replace(/\.json$/i, '')}.json`);
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

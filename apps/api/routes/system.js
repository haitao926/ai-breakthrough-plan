function registerSystemRoutes(fastify, deps) {
  const {
    API_PREFIX,
    getDb,
    now,
    crypto,
    normalizeEmail,
    hashPassword,
    verifyPassword,
    createToken,
    requireAuth,
    requireRole,
    parseProjectId,
    canRegisterTeacher,
    canRegisterJudge,
    validateGiteaRepo,
    ensureGiteaUser,
    slugifyGiteaUsername,
    requestAiChat,
    logAudit,
    seedStudentProfile,
    logMatchEvent,
    recomputeCompetitionMatches,
    recomputeProjectTopicMatches,
    recomputeCourseMatches,
    recomputeTeamCandidateMatches
  } = deps;

  const authSchema = {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: true,
    properties: {
      name: { type: 'string', maxLength: 80 },
      email: { type: 'string', minLength: 3, maxLength: 160 },
      password: { type: 'string', minLength: 6, maxLength: 160 },
      role: { type: 'string', maxLength: 20 },
      inviteCode: { type: 'string', maxLength: 80 },
      avatarUrl: { type: 'string', maxLength: 500 },
      username: { type: 'string', maxLength: 160 }
    }
  };

  const giteaValidationSchema = {
    type: 'object',
    required: ['repoUrl'],
    additionalProperties: true,
    properties: {
      repoUrl: { type: 'string', minLength: 1, maxLength: 500 },
      repo_url: { type: 'string', maxLength: 500 }
    }
  };

  const aiChatSchema = {
    type: 'object',
    additionalProperties: true,
    properties: {
      prompt: { type: 'string', maxLength: 12000 },
      message: { type: 'string', maxLength: 12000 },
      messages: {
        type: 'array',
        minItems: 1,
        maxItems: 50,
        items: {
          type: 'object',
          required: ['role', 'content'],
          additionalProperties: true,
          properties: {
            role: { type: 'string', minLength: 1, maxLength: 40 },
            content: { type: 'string', minLength: 1, maxLength: 12000 }
          }
        }
      }
    }
  };

  const profilePatchSchema = {
    type: 'object',
    additionalProperties: true,
    properties: {
      name: { type: 'string', maxLength: 80 },
      avatarUrl: { type: 'string', maxLength: 500 }
    }
  };

  const resetPasswordSchema = {
    type: 'object',
    additionalProperties: true,
    properties: {
      password: { type: 'string', minLength: 6, maxLength: 160 }
    }
  };

  const giteaUserSyncSchema = {
    type: 'object',
    additionalProperties: true,
    properties: {
      username: { type: 'string', maxLength: 80 },
      password: { type: 'string', minLength: 6, maxLength: 160 },
      mustChangePassword: { type: 'boolean' },
      must_change_password: { type: 'boolean' }
    }
  };

  const giteaBulkUserSyncSchema = {
    type: 'object',
    additionalProperties: true,
    properties: {
      userIds: {
        type: 'array',
        maxItems: 300,
        items: { type: 'integer', minimum: 1 }
      },
      onlyUnsynced: { type: 'boolean' },
      mustChangePassword: { type: 'boolean' },
      must_change_password: { type: 'boolean' }
    }
  };

  const studentTeacherAssignSchema = {
    type: 'object',
    required: ['teacherIds'],
    additionalProperties: false,
    properties: {
      teacherIds: {
        type: 'array',
        maxItems: 20,
        items: { type: 'integer', minimum: 1 }
      }
    }
  };

  const studentTeacherBatchAssignSchema = {
    type: 'object',
    required: ['studentIds', 'teacherIds'],
    additionalProperties: false,
    properties: {
      studentIds: {
        type: 'array',
        minItems: 1,
        maxItems: 300,
        items: { type: 'integer', minimum: 1 }
      },
      teacherIds: {
        type: 'array',
        minItems: 1,
        maxItems: 20,
        items: { type: 'integer', minimum: 1 }
      }
    }
  };

  function listAssignableTeachers(db) {
    return db.all(
      `SELECT id, name, username, email, role, created_at
       FROM users
       WHERE role IN ('teacher', 'judge')
       ORDER BY created_at DESC, id DESC`
    );
  }

  function listTeacherSummaries(db) {
    return db.all(
      `SELECT u.id,
              u.name,
              u.username,
              u.email,
              u.role,
              u.created_at,
              COUNT(DISTINCT tsl.student_id) AS student_count,
              COUNT(DISTINCT sp.class_name) AS class_count
       FROM users u
       LEFT JOIN teacher_student_links tsl ON tsl.teacher_id = u.id
       LEFT JOIN student_profiles sp ON sp.user_id = tsl.student_id AND sp.class_name IS NOT NULL AND TRIM(sp.class_name) != ''
       WHERE u.role IN ('teacher', 'judge')
       GROUP BY u.id
       ORDER BY student_count DESC, u.created_at DESC, u.id DESC`
    ).map(item => ({
      ...item,
      student_count: Number(item.student_count || 0),
      class_count: Number(item.class_count || 0)
    }));
  }

  function getTeacherLinksForStudents(db, studentIds) {
    const ids = [...new Set((studentIds || []).map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0))];
    if (!ids.length) return new Map();
    const placeholders = ids.map(() => '?').join(',');
    const rows = db.all(
      `SELECT tsl.student_id, tsl.teacher_id, tsl.created_at, tsl.updated_at,
              u.name AS teacher_name, u.username AS teacher_username, u.email AS teacher_email, u.role AS teacher_role
       FROM teacher_student_links tsl
       JOIN users u ON u.id = tsl.teacher_id
       WHERE tsl.student_id IN (${placeholders})
       ORDER BY tsl.updated_at DESC, tsl.id DESC`,
      ids
    );
    const grouped = new Map();
    rows.forEach((row) => {
      const key = Number(row.student_id);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({
        id: Number(row.teacher_id),
        name: row.teacher_name || '',
        username: row.teacher_username || '',
        email: row.teacher_email || '',
        role: row.teacher_role || 'teacher',
        linkedAt: row.created_at || '',
        updatedAt: row.updated_at || ''
      });
    });
    return grouped;
  }

  function getTeacherRosterForTeacher(db, teacherId, filters = {}) {
    const keyword = String(filters.keyword || '').trim();
    const className = String(filters.className || '').trim();
    const conditions = ['tsl.teacher_id = ?'];
    const params = [teacherId];
    if (keyword) {
      conditions.push('(u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR sp.class_name LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (className) {
      conditions.push('sp.class_name = ?');
      params.push(className);
    }
    const students = db.all(
      `SELECT u.id,
              u.name,
              u.username,
              u.email,
              u.avatar_url,
              u.gitea_username,
              u.gitea_synced_at,
              u.created_at,
              sp.class_name
       FROM teacher_student_links tsl
       JOIN users u ON u.id = tsl.student_id
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY u.id
       ORDER BY COALESCE(sp.class_name, ''), u.created_at DESC, u.id DESC`,
      params
    );
    const classRows = db.all(
      `SELECT sp.class_name, COUNT(DISTINCT u.id) AS student_count
       FROM teacher_student_links tsl
       JOIN users u ON u.id = tsl.student_id
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE tsl.teacher_id = ? AND sp.class_name IS NOT NULL AND TRIM(sp.class_name) != ''
       GROUP BY sp.class_name
       ORDER BY student_count DESC, sp.class_name ASC`,
      [teacherId]
    );
    return {
      students,
      classes: classRows.map((item) => ({
        className: item.class_name,
        studentCount: Number(item.student_count || 0)
      }))
    };
  }

  function ensureTeacherIdsValid(db, teacherIds) {
    const ids = [...new Set((teacherIds || []).map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0))];
    if (!ids.length) return [];
    const placeholders = ids.map(() => '?').join(',');
    const rows = db.all(
      `SELECT id
       FROM users
       WHERE id IN (${placeholders}) AND role IN ('teacher', 'judge')`,
      ids
    );
    const validIds = rows.map((row) => Number(row.id)).filter((id) => Number.isInteger(id) && id > 0);
    if (validIds.length !== ids.length) {
      throw new Error('教师账号不存在或角色无效');
    }
    return validIds;
  }

  function replaceStudentTeacherLinks(db, { studentId, teacherIds, nowValue }) {
    const existingRows = db.all(
      'SELECT teacher_id FROM teacher_student_links WHERE student_id = ?',
      [studentId]
    );
    const existingIds = new Set(existingRows.map(row => Number(row.teacher_id)).filter(id => Number.isInteger(id) && id > 0));
    const nextIds = new Set(teacherIds);

    db.run('DELETE FROM teacher_student_links WHERE student_id = ?', [studentId]);
    teacherIds.forEach((teacherId) => {
      db.run(
        'INSERT INTO teacher_student_links (teacher_id, student_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [teacherId, studentId, nowValue, nowValue]
      );
    });

    return {
      addedTeacherIds: teacherIds.filter(id => !existingIds.has(id)),
      removedTeacherIds: [...existingIds].filter(id => !nextIds.has(id))
    };
  }

  fastify.get(`${API_PREFIX}/health`, async () => ({ ok: true }));

  fastify.post(`${API_PREFIX}/auth/register`, {
    schema: { body: authSchema },
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 hour',
        keyGenerator: request => request.ip
      }
    }
  }, async (request, reply) => {
    const payload = request.body || {};
    const name = String(payload.name || '').trim();
    const email = normalizeEmail(payload.email);
    const password = String(payload.password || '');
    const roleInput = String(payload.role || '').trim();
    const inviteCode = String(payload.inviteCode || '').trim();
    const avatarUrl = String(payload.avatarUrl || '').trim();
    const username = String(payload.username || '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      reply.code(400);
      return { error: '邮箱格式无效' };
    }
    if (password.length < 6) {
      reply.code(400);
      return { error: '密码至少 6 位' };
    }

    const db = getDb();
    const existing = db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username || null]);
    if (existing) {
      reply.code(409);
      return { error: '账号已注册' };
    }

    let role = 'student';
    if (roleInput === 'teacher') role = 'teacher';
    if (roleInput === 'judge') role = 'judge';
    if (role === 'teacher' && !canRegisterTeacher(inviteCode)) {
      reply.code(403);
      return { error: '老师邀请码无效' };
    }
    if (role === 'judge' && !canRegisterJudge(inviteCode)) {
      reply.code(403);
      return { error: '评委邀请码无效' };
    }

    const createdAt = now();
    const info = db.run(
      'INSERT INTO users (name, username, email, password_hash, role, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, username || null, email, hashPassword(password), role, avatarUrl, createdAt]
    );

    const user = { id: info.lastInsertRowid, name, username, email, role, avatar_url: avatarUrl };
    if (role === 'student') {
      seedStudentProfile(user.id);
      logMatchEvent({ userId: user.id, eventType: 'profile_initialized', payload: { source: 'auth.register' } });
      await recomputeCompetitionMatches({
        userIds: [user.id],
        actor: user,
        aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
        forceRefresh: true
      });
      await recomputeProjectTopicMatches({
        userIds: [user.id],
        actor: user,
        aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
        forceRefresh: true
      });
      await recomputeCourseMatches({
        userIds: [user.id],
        actor: user,
        aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
        forceRefresh: true
      });
      const studentIds = db.all('SELECT id FROM users WHERE role = ?', ['student'])
        .map((row) => Number(row.id))
        .filter((id) => Number.isFinite(id) && id > 0);
      if (studentIds.length) {
        await recomputeTeamCandidateMatches({
          userIds: studentIds,
          actor: user,
          aiKey: String(request.headers['x-model-key'] || process.env.AI_API_KEY || '').trim(),
          forceRefresh: true
        });
      }
    }
    const { token, exp } = createToken({ sub: user.id, role: user.role, email: user.email });
    logAudit('auth.register', request, { userId: user.id, role: user.role });
    return { user, token, expiresAt: exp };
  });

  fastify.post(`${API_PREFIX}/auth/login`, {
    schema: { body: authSchema },
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes',
        keyGenerator: request => `${request.ip}:${normalizeEmail(request.body?.email || request.body?.username || '')}`
      }
    }
  }, async (request, reply) => {
    const payload = request.body || {};
    const identifier = String(payload.email || payload.username || '').trim();
    const password = String(payload.password || '');

    if (!identifier || !password) {
      reply.code(400);
      return { error: '账号与密码必填' };
    }

    const db = getDb();
    const user = db.get(
      'SELECT id, name, username, email, role, avatar_url, password_hash FROM users WHERE email = ? OR username = ? OR name = ?',
      [identifier, identifier, identifier]
    );

    if (!user || !verifyPassword(password, user.password_hash)) {
      reply.code(401);
      return { error: '账号或密码错误' };
    }

    const { token, exp } = createToken({ sub: user.id, role: user.role, email: user.email });
    logAudit('auth.login', request, { userId: user.id });
    return {
      user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role, avatar_url: user.avatar_url },
      token,
      expiresAt: exp
    };
  });

  fastify.get(`${API_PREFIX}/auth/me`, async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    return { user: request.user };
  });

  fastify.post(`${API_PREFIX}/gitea/validate-repo`, {
    schema: { body: giteaValidationSchema }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const repoUrl = String(request.body?.repoUrl || request.body?.repo_url || '').trim();
    const validation = await validateGiteaRepo(repoUrl);
    if (!validation.ok) {
      reply.code(validation.status || 400);
      return { error: validation.error };
    }
    logAudit('gitea.repo.validate', request, validation.repo);
    return { ok: true, repo: validation.repo };
  });

  fastify.post(`${API_PREFIX}/ai/chat`, {
    schema: { body: aiChatSchema }
  }, async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const payload = request.body || {};
    let messages = payload.messages;
    if (!Array.isArray(messages) || !messages.length) {
      const prompt = String(payload.prompt || payload.message || '').trim();
      if (prompt) {
        messages = [{ role: 'user', content: prompt }];
      }
    }
    if (!Array.isArray(messages) || !messages.length) {
      reply.code(400);
      return { error: '缺少消息内容' };
    }
    const headerKey = request.headers['x-model-key'];
    const apiKey = String(headerKey || process.env.AI_API_KEY || '').trim();
    if (!apiKey) {
      reply.code(400);
      return { error: 'AI Key 未配置' };
    }
    try {
      const result = await requestAiChat(messages, apiKey);
      logAudit('ai.chat', request, { messageCount: messages.length });
      return { reply: result.content };
    } catch (err) {
      reply.code(502);
      return { error: err.message || 'AI 服务不可用' };
    }
  });

  fastify.patch(`${API_PREFIX}/users/me`, {
    schema: { body: profilePatchSchema }
  }, async (request, reply) => {
    if (!requireAuth(request, reply)) return;
    const db = getDb();
    const payload = request.body || {};
    const name = String(payload.name || '').trim();
    const avatarUrl = String(payload.avatarUrl || '').trim();

    if (name && name.length > 80) {
      reply.code(400);
      return { error: '昵称过长' };
    }
    if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
      reply.code(400);
      return { error: '头像地址格式无效' };
    }

    db.run(
      'UPDATE users SET name = ?, avatar_url = ? WHERE id = ?',
      [name || request.user.name, avatarUrl, request.user.id]
    );
    const updated = db.get(
      'SELECT id, name, username, email, role, avatar_url FROM users WHERE id = ?',
      [request.user.id]
    );
    logMatchEvent({ userId: request.user.id, eventType: 'user_profile_updated', payload: { source: 'users.me' } });
    logAudit('user.profile.update', request, { userId: request.user.id });
    return { user: updated };
  });

  fastify.get(`${API_PREFIX}/users/search`, async (request, reply) => {
    if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
    const db = getDb();
    const keyword = String(request.query?.keyword || '').trim();
    if (!keyword) {
      return { users: [] };
    }
    const like = `%${keyword}%`;
    const rows = db.all(
      `SELECT id, name, username, email, role, avatar_url FROM users
       WHERE name LIKE ? OR username LIKE ? OR email LIKE ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [like, like, like]
    );
    return { users: rows };
  });

  fastify.get(`${API_PREFIX}/admin/users`, async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    const db = getDb();
    const keyword = String(request.query?.keyword || '').trim();
    const role = String(request.query?.role || '').trim();
    const className = String(request.query?.className || '').trim();
    const teacherId = Number(request.query?.teacherId || 0);
    const withoutTeacher = String(request.query?.withoutTeacher || '').trim() === 'true';
    const conditions = [];
    const params = [];
    if (keyword) {
      conditions.push('(u.name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR sp.class_name LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (role) {
      conditions.push('u.role = ?');
      params.push(role);
    }
    if (className) {
      conditions.push('sp.class_name = ?');
      params.push(className);
    }
    if (teacherId > 0) {
      conditions.push(`u.id IN (
        SELECT student_id
        FROM teacher_student_links
        WHERE teacher_id = ?
      )`);
      params.push(teacherId);
    }
    if (withoutTeacher) {
      conditions.push(`u.id NOT IN (
        SELECT student_id
        FROM teacher_student_links
      )`);
    }
    let sql = `
      SELECT u.id, u.name, u.username, u.email, u.role, u.avatar_url, u.gitea_username, u.gitea_synced_at, u.created_at,
             sp.class_name
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
    `;
    if (conditions.length) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ' ORDER BY u.created_at DESC';
    const users = db.all(sql, params);

    const classRows = db.all(
      `SELECT class_name, COUNT(user_id) AS student_count
       FROM student_profiles
       WHERE class_name IS NOT NULL AND TRIM(class_name) != ''
       GROUP BY class_name
       ORDER BY student_count DESC, class_name ASC`
    );
    const classes = classRows.map(item => ({
      className: item.class_name,
      studentCount: Number(item.student_count || 0)
    }));

    if (!users.length) {
      return { users, classes, teachers: listAssignableTeachers(db) };
    }
    const links = getTeacherLinksForStudents(db, users.map(user => user.id));
    const enrichedUsers = users.map(user => ({
      ...user,
      teachers: links.get(Number(user.id)) || []
    }));
    return { users: enrichedUsers, classes, teachers: listAssignableTeachers(db) };
  });

  fastify.get(`${API_PREFIX}/admin/overview`, async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    const db = getDb();
    const teacherSummaries = listTeacherSummaries(db);
    const roleRows = db.all(
      `SELECT role, COUNT(*) AS total
       FROM users
       GROUP BY role`
    );
    const roleCounts = roleRows.reduce((acc, row) => {
      acc[row.role] = Number(row.total || 0);
      return acc;
    }, {});
    const linkedStudentCountRow = db.get(
      `SELECT COUNT(DISTINCT student_id) AS total
       FROM teacher_student_links`
    );
    const syncedStudentCountRow = db.get(
      `SELECT COUNT(*) AS total
       FROM users
       WHERE role = 'student' AND gitea_username IS NOT NULL AND TRIM(gitea_username) != ''`
    );
    const classRows = db.all(
      `SELECT sp.class_name, COUNT(*) AS student_count
       FROM student_profiles sp
       JOIN users u ON u.id = sp.user_id
       WHERE u.role = 'student' AND sp.class_name IS NOT NULL AND TRIM(sp.class_name) != ''
       GROUP BY sp.class_name
       ORDER BY student_count DESC, sp.class_name ASC`
    );
    const projectRows = db.all(
      `SELECT status, COUNT(*) AS total
       FROM projects
       WHERE deleted_at IS NULL
       GROUP BY status`
    );
    const projectCounts = projectRows.reduce((acc, row) => {
      acc[row.status] = Number(row.total || 0);
      return acc;
    }, {});
    const studentCount = Number(roleCounts.student || 0);
    const linkedStudentCount = Number(linkedStudentCountRow?.total || 0);
    const unassignedStudentCount = Math.max(0, studentCount - linkedStudentCount);

    return {
      summary: {
        users: Number(
          (roleCounts.student || 0)
          + (roleCounts.teacher || 0)
          + (roleCounts.judge || 0)
          + (roleCounts.admin || 0)
        ),
        students: studentCount,
        teachers: Number(roleCounts.teacher || 0),
        judges: Number(roleCounts.judge || 0),
        admins: Number(roleCounts.admin || 0),
        linkedStudents: linkedStudentCount,
        unassignedStudents: unassignedStudentCount,
        giteaSyncedStudents: Number(syncedStudentCountRow?.total || 0),
        classes: classRows.length,
        draftProjects: Number(projectCounts.draft || 0),
        submittedProjects: Number(projectCounts.submitted || 0),
        reviewingProjects: Number(projectCounts.reviewing || 0),
        approvedProjects: Number(projectCounts.approved || 0),
        rejectedProjects: Number(projectCounts.rejected || 0),
        activeProjects: Number(projectCounts.in_progress || 0),
        midtermReviewProjects: Number(projectCounts.midterm_review || 0),
        finalReviewProjects: Number(projectCounts.final_review || 0),
        archivedProjects: Number(projectCounts.archived || 0)
      },
      classes: classRows.map(item => ({
        className: item.class_name,
        studentCount: Number(item.student_count || 0)
      })),
      teachers: teacherSummaries
    };
  });

  fastify.get(`${API_PREFIX}/admin/teachers`, async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    const db = getDb();
    return { teachers: listTeacherSummaries(db) };
  });

  fastify.get(`${API_PREFIX}/teacher/students`, async (request, reply) => {
    if (!requireRole(request, reply, ['teacher'])) return;
    const db = getDb();
    const keyword = String(request.query?.keyword || '').trim();
    const className = String(request.query?.className || '').trim();
    const roster = getTeacherRosterForTeacher(db, Number(request.user.id), { keyword, className });
    const syncedCount = roster.students.filter((item) => String(item.gitea_username || '').trim()).length;
    return {
      summary: {
        students: roster.students.length,
        classes: roster.classes.length,
        syncedStudents: syncedCount
      },
      classes: roster.classes,
      students: roster.students
    };
  });

  fastify.put(`${API_PREFIX}/admin/students/:id/teachers`, {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', minimum: 1 }
        }
      },
      body: studentTeacherAssignSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    const db = getDb();
    const studentId = parseProjectId(request.params.id);
    if (!studentId) {
      reply.code(400);
      return { error: '学生ID无效' };
    }
    const student = db.get('SELECT id, role FROM users WHERE id = ?', [studentId]);
    if (!student || student.role !== 'student') {
      reply.code(404);
      return { error: '学生不存在' };
    }

    let teacherIds;
    try {
      teacherIds = ensureTeacherIdsValid(db, request.body?.teacherIds || []);
    } catch (err) {
      reply.code(400);
      return { error: err.message || '教师账号校验失败' };
    }

    const changes = replaceStudentTeacherLinks(db, {
      studentId,
      teacherIds,
      nowValue: now()
    });
    const links = getTeacherLinksForStudents(db, [studentId]);
    logAudit('admin.student_teachers.replace', request, {
      studentId,
      teacherIds,
      addedTeacherIds: changes.addedTeacherIds,
      removedTeacherIds: changes.removedTeacherIds
    });
    return {
      success: true,
      studentId,
      teachers: links.get(studentId) || []
    };
  });

  fastify.post(`${API_PREFIX}/admin/student-teacher-links`, {
    schema: {
      body: studentTeacherBatchAssignSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    const db = getDb();
    const studentIds = [...new Set((request.body?.studentIds || []).map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0))];
    if (!studentIds.length) {
      reply.code(400);
      return { error: '请选择学生' };
    }

    let teacherIds;
    try {
      teacherIds = ensureTeacherIdsValid(db, request.body?.teacherIds || []);
    } catch (err) {
      reply.code(400);
      return { error: err.message || '教师账号校验失败' };
    }

    const placeholders = studentIds.map(() => '?').join(',');
    const students = db.all(
      `SELECT id, role
       FROM users
       WHERE id IN (${placeholders})`,
      studentIds
    );
    if (students.length !== studentIds.length || students.some(item => item.role !== 'student')) {
      reply.code(400);
      return { error: '所选用户中包含无效学生账号' };
    }

    const inserted = [];
    const nowValue = now();
    studentIds.forEach((studentId) => {
      teacherIds.forEach((teacherId) => {
        const existing = db.get(
          'SELECT id FROM teacher_student_links WHERE teacher_id = ? AND student_id = ?',
          [teacherId, studentId]
        );
        if (existing) {
          db.run(
            'UPDATE teacher_student_links SET updated_at = ? WHERE id = ?',
            [nowValue, existing.id]
          );
          return;
        }
        db.run(
          'INSERT INTO teacher_student_links (teacher_id, student_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [teacherId, studentId, nowValue, nowValue]
        );
        inserted.push({ studentId, teacherId });
      });
    });

    const links = getTeacherLinksForStudents(db, studentIds);
    logAudit('admin.student_teachers.batch_assign', request, {
      studentIds,
      teacherIds,
      createdCount: inserted.length
    });
    return {
      success: true,
      studentIds,
      teacherIds,
      createdCount: inserted.length,
      links: Object.fromEntries(studentIds.map(id => [id, links.get(id) || []]))
    };
  });

  fastify.delete(`${API_PREFIX}/admin/students/:studentId/teachers/:teacherId`, {
    schema: {
      params: {
        type: 'object',
        required: ['studentId', 'teacherId'],
        properties: {
          studentId: { type: 'integer', minimum: 1 },
          teacherId: { type: 'integer', minimum: 1 }
        }
      }
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    const db = getDb();
    const studentId = parseProjectId(request.params.studentId);
    const teacherId = parseProjectId(request.params.teacherId);
    if (!studentId || !teacherId) {
      reply.code(400);
      return { error: '参数无效' };
    }
    db.run(
      'DELETE FROM teacher_student_links WHERE student_id = ? AND teacher_id = ?',
      [studentId, teacherId]
    );
    logAudit('admin.student_teachers.remove', request, { studentId, teacherId });
    return {
      success: true,
      studentId,
      teacherId,
      teachers: getTeacherLinksForStudents(db, [studentId]).get(studentId) || []
    };
  });

  fastify.post(`${API_PREFIX}/admin/users/:id/reset-password`, {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', minimum: 1 }
        }
      },
      body: resetPasswordSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    const db = getDb();
    const userId = parseProjectId(request.params.id);
    if (!userId) {
      reply.code(400);
      return { error: '用户ID无效' };
    }
    const payload = request.body || {};
    let password = String(payload.password || '').trim();
    if (!password) {
      password = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    }
    if (password.length < 6) {
      reply.code(400);
      return { error: '密码至少 6 位' };
    }
    const existing = db.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existing) {
      reply.code(404);
      return { error: '用户不存在' };
    }
    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hashPassword(password), userId]);
    logAudit('admin.user.reset_password', request, { userId });
    return { success: true, password };
  });

  fastify.post(`${API_PREFIX}/admin/users/:id/sync-gitea`, {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', minimum: 1 }
        }
      },
      body: giteaUserSyncSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    const db = getDb();
    const userId = parseProjectId(request.params.id);
    if (!userId) {
      reply.code(400);
      return { error: '用户ID无效' };
    }
    const user = db.get('SELECT id, name, username, email, role, gitea_username FROM users WHERE id = ?', [userId]);
    if (!user) {
      reply.code(404);
      return { error: '用户不存在' };
    }
    if (user.role !== 'student') {
      reply.code(400);
      return { error: '当前仅同步学生账号到 Gitea' };
    }

    try {
      const result = await ensureGiteaUser({
        user,
        username: request.body?.username,
        password: request.body?.password,
        mustChangePassword: request.body?.mustChangePassword ?? request.body?.must_change_password
      });
      db.run(
        'UPDATE users SET gitea_username = ?, gitea_synced_at = ? WHERE id = ?',
        [result.username, now(), userId]
      );
      logAudit('admin.user.sync_gitea', request, { userId, username: result.username, created: result.created });
      return {
        success: true,
        userId,
        gitea: result
      };
    } catch (err) {
      const message = err.message || 'Gitea 用户同步失败';
      reply.code(/未配置|fetch|Node/.test(message) ? 503 : 502);
      return { error: message };
    }
  });

  fastify.post(`${API_PREFIX}/admin/students/sync-gitea`, {
    schema: {
      body: giteaBulkUserSyncSchema
    }
  }, async (request, reply) => {
    if (!requireRole(request, reply, ['admin'])) return;
    const db = getDb();
    const payload = request.body || {};
    const onlyUnsynced = payload.onlyUnsynced !== false;
    const requestedIds = Array.isArray(payload.userIds)
      ? [...new Set(payload.userIds.map(id => Number(id)).filter(Number.isInteger))]
      : [];
    if (Array.isArray(payload.userIds) && requestedIds.length === 0) {
      reply.code(400);
      return { error: '请选择需要同步的学生' };
    }

    const conditions = ['role = ?'];
    const params = ['student'];
    if (onlyUnsynced) {
      conditions.push('(gitea_username IS NULL OR gitea_username = ?)');
      params.push('');
    }
    if (requestedIds.length) {
      conditions.push(`id IN (${requestedIds.map(() => '?').join(',')})`);
      params.push(...requestedIds);
    }

    const students = db.all(
      `SELECT id, name, username, email, role, gitea_username FROM users WHERE ${conditions.join(' AND ')} ORDER BY id ASC LIMIT 300`,
      params
    );
    if (!students.length) {
      return { success: true, synced: [], failed: [], skipped: 0 };
    }

    const synced = [];
    const failed = [];
    for (const student of students) {
      try {
        const username = slugifyGiteaUsername(
          student.gitea_username || student.username || student.name || student.email,
          `student-${student.id}`
        );
        const result = await ensureGiteaUser({
          user: student,
          username,
          mustChangePassword: payload.mustChangePassword ?? payload.must_change_password
        });
        db.run(
          'UPDATE users SET gitea_username = ?, gitea_synced_at = ? WHERE id = ?',
          [result.username, now(), student.id]
        );
        synced.push({
          userId: student.id,
          name: student.name,
          username: student.username,
          email: student.email,
          giteaUsername: result.username,
          password: result.password,
          created: result.created,
          alreadyExists: result.alreadyExists,
          htmlUrl: result.htmlUrl
        });
      } catch (err) {
        failed.push({
          userId: student.id,
          name: student.name,
          username: student.username,
          email: student.email,
          error: err.message || 'Gitea 用户同步失败'
        });
      }
    }

    logAudit('admin.user.sync_gitea.bulk', request, {
      requested: students.length,
      synced: synced.length,
      failed: failed.length
    });
    if (failed.length && !synced.length) reply.code(502);
    return { success: failed.length === 0, synced, failed, skipped: Math.max(0, requestedIds.length - students.length) };
  });
}

module.exports = { registerSystemRoutes };

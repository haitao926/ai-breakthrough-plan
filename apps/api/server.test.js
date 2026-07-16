const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'innovation-api-'));
const repoRoot = path.join(__dirname, '../..');
const fixtureCourses = path.join(tmpRoot, 'courses');
const fixtureMaterials = path.join(tmpRoot, 'materials');
fs.cpSync(path.join(repoRoot, 'content/courses'), fixtureCourses, { recursive: true });
fs.cpSync(path.join(repoRoot, 'content/materials'), fixtureMaterials, { recursive: true });
process.env.NODE_ENV = 'test';
process.env.TRUST_PROXY = 'true';
process.env.COURSES_DIR = fixtureCourses;
process.env.MATERIALS_DIR = fixtureMaterials;
process.env.PORTAL_DIR = path.join(tmpRoot, 'portal');
process.env.UPLOAD_DIR = path.join(tmpRoot, 'uploads');
process.env.LOG_DIR = path.join(tmpRoot, 'logs');
process.env.ASSESSMENT_DIR = path.join(tmpRoot, 'assessments');
process.env.BILIBILI_SERIES_VIDEOS_PATH = path.join(tmpRoot, 'bilibili.json');
process.env.AUTH_SECRET = 'test-secret';
process.env.TEACHER_INVITE_CODE = 'teacher-test-invite';
process.env.JUDGE_INVITE_CODE = 'judge-test-invite';
process.env.GITEA_BASE_URL = '';
process.env.GITEA_ADMIN_TOKEN = '';

function repositorySnapshot() {
  const status = execFileSync('git', ['-C', repoRoot, 'status', '--porcelain=v1'], { encoding: 'utf8' });
  const files = execFileSync('git', ['-C', repoRoot, 'ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
  const hash = crypto.createHash('sha256');
  files.forEach((file) => {
    hash.update(file);
    const absolute = path.join(repoRoot, file);
    if (fs.existsSync(absolute)) hash.update(fs.readFileSync(absolute));
    else hash.update('<missing>');
  });
  return { status, hash: hash.digest('hex') };
}

const initialRepositorySnapshot = repositorySnapshot();

const { fastify, initDatabase } = require('./server');
const { createAuthHelpers } = require('./src/utils/auth-helpers');

let ownerToken;
let memberToken;
let candidateToken;
let teacherToken;
let judgeToken;
let adminToken;
let projectId;
let dbHandle;
let matchedCourseId;

function jsonHeaders(token) {
  return {
    'content-type': 'application/json',
    ...(token ? { authorization: `Bearer ${token}` } : {})
  };
}

let registrationIpCounter = 10;

async function injectJson(method, url, token, payload) {
  return fastify.inject({
    method,
    url,
    headers: jsonHeaders(token),
    payload: payload === undefined ? undefined : JSON.stringify(payload)
  });
}

async function register(email, role = 'student') {
  const registrationIp = `198.51.100.${registrationIpCounter++}`;
  const res = await fastify.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    headers: { ...jsonHeaders(null), 'x-forwarded-for': registrationIp },
    payload: JSON.stringify({
    name: email.split('@')[0],
    email,
    password: 'secret123',
    role,
    ...(role === 'teacher' ? { inviteCode: process.env.TEACHER_INVITE_CODE } : {}),
    ...(role === 'judge' ? { inviteCode: process.env.JUDGE_INVITE_CODE } : {})
    })
  });
  assert.equal(res.statusCode, 200, res.body);
  return res.json();
}

function createManualUserToken(email, role = 'teacher') {
  const createdAt = new Date().toISOString();
  const username = `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const info = dbHandle.run(
    'INSERT INTO users (name, username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [email.split('@')[0], username, email, 'manual-test-hash', role, createdAt]
  );
  const authHelpers = createAuthHelpers({
    crypto,
    authSecret: process.env.AUTH_SECRET,
    authTokenTtlHours: 168,
    getUserById: (id) => dbHandle.get('SELECT id, name, username, email, role, avatar_url FROM users WHERE id = ?', [id]) || null
  });
  return {
    id: info.lastInsertRowid,
    token: authHelpers.createToken({
      sub: info.lastInsertRowid,
      role,
      email
    }).token
  };
}

function multipartPayload(fields) {
  const boundary = `----test-${Date.now()}`;
  const body = Object.entries(fields)
    .map(([name, value]) => [
      `--${boundary}`,
      `Content-Disposition: form-data; name="${name}"`,
      '',
      String(value)
    ].join('\r\n'))
    .concat(`--${boundary}--`)
    .join('\r\n');
  return {
    body,
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` }
  };
}

function multipartFilePayload(fields, file) {
  const boundary = `----test-file-${Date.now()}`;
  const parts = Object.entries(fields).map(([name, value]) => [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${name}"`,
    '',
    String(value)
  ].join('\r\n'));

  parts.push([
    `--${boundary}`,
    `Content-Disposition: form-data; name="${file.fieldName || 'file'}"; filename="${file.filename}"`,
    `Content-Type: ${file.contentType || 'text/plain'}`,
    '',
    file.content
  ].join('\r\n'));

  parts.push(`--${boundary}--`);

  return {
    body: parts.join('\r\n'),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` }
  };
}

test.before(async () => {
  dbHandle = await initDatabase(path.join(tmpRoot, 'db.sqlite'));
  const migrationTable = dbHandle.get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_migrations'");
  assert.equal(Boolean(migrationTable), true);
  const bootstrapMigration = dbHandle.get('SELECT name FROM _migrations WHERE name = ?', ['001_create_migrations_table.sql']);
  assert.equal(Boolean(bootstrapMigration), true);
  const backfillMigration = dbHandle.get('SELECT name FROM _migrations WHERE name = ?', ['003_backfill_legacy_columns.js']);
  assert.equal(Boolean(backfillMigration), true);
  const teacherStudentMigration = dbHandle.get('SELECT name FROM _migrations WHERE name = ?', ['004_teacher_student_links.sql']);
  assert.equal(Boolean(teacherStudentMigration), true);
  const projectVisibilityMigration = dbHandle.get('SELECT name FROM _migrations WHERE name = ?', ['005_project_visibility.js']);
  assert.equal(Boolean(projectVisibilityMigration), true);
  const projectTopicVisibilityMigration = dbHandle.get('SELECT name FROM _migrations WHERE name = ?', ['006_project_topic_visibility.js']);
  assert.equal(Boolean(projectTopicVisibilityMigration), true);
  const assignmentAttachmentMigration = dbHandle.get('SELECT name FROM _migrations WHERE name = ?', ['007_assignment_submission_attachments.js']);
  assert.equal(Boolean(assignmentAttachmentMigration), true);
  assert.equal(Boolean(dbHandle.get('SELECT name FROM _migrations WHERE name = ?', ['008_project_soft_delete.js'])), true);
  assert.equal(Boolean(dbHandle.get('SELECT name FROM _migrations WHERE name = ?', ['009_assignment_submission_attachments.js'])), true);
  const userColumns = dbHandle.all('PRAGMA table_info(users)');
  assert.equal(userColumns.some(column => column.name === 'avatar_url'), true);
  const projectColumns = dbHandle.all('PRAGMA table_info(projects)');
  assert.equal(projectColumns.some(column => column.name === 'visibility'), true);
  const projectTopicColumns = dbHandle.all('PRAGMA table_info(project_topics)');
  assert.equal(projectTopicColumns.some(column => column.name === 'visibility'), true);
  const owner = await register('owner@example.com');
  const member = await register('member@example.com');
  const candidate = await register('candidate@example.com');
  const teacher = await register('teacher@example.com', 'teacher');
  const judge = await register('judge@example.com', 'judge');
  ownerToken = owner.token;
  memberToken = member.token;
  candidateToken = candidate.token;
  teacherToken = teacher.token;
  judgeToken = judge.token;
  const adminCreatedAt = new Date().toISOString();
  const adminInfo = dbHandle.run(
    'INSERT INTO users (name, username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ['admin', 'admin', 'admin@example.com', 'manual-admin-hash', 'admin', adminCreatedAt]
  );
  const authHelpers = createAuthHelpers({
    crypto,
    authSecret: process.env.AUTH_SECRET,
    authTokenTtlHours: 168,
    getUserById: (id) => dbHandle.get('SELECT id, name, username, email, role, avatar_url FROM users WHERE id = ?', [id]) || null
  });
  adminToken = authHelpers.createToken({
    sub: adminInfo.lastInsertRowid,
    role: 'admin',
    email: 'admin@example.com'
  }).token;

  const createProject = await injectJson('POST', '/api/v1/projects', ownerToken, {
    title: '智能实验台'
  });
  assert.equal(createProject.statusCode, 200, createProject.body);
  projectId = createProject.json().project.id;
});

test.after(async () => {
  await fastify.close();
  assert.deepEqual(repositorySnapshot(), initialRepositorySnapshot);
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

test('health and auth-protected project permissions work', async () => {
  const health = await fastify.inject('/api/v1/health');
  assert.equal(health.statusCode, 200);
  assert.equal(health.json().ok, true);

  const anonymous = await fastify.inject(`/api/v1/projects/${projectId}/tool-data`);
  assert.equal(anonymous.statusCode, 401);

  const forbidden = await injectJson('GET', `/api/v1/projects/${projectId}`, memberToken);
  assert.equal(forbidden.statusCode, 404);

  const addMember = await injectJson('POST', `/api/v1/projects/${projectId}/members`, ownerToken, {
    memberIds: [2]
  });
  assert.equal(addMember.statusCode, 200, addMember.body);

  const allowed = await injectJson('GET', `/api/v1/projects/${projectId}`, memberToken);
  assert.equal(allowed.statusCode, 200, allowed.body);
});

test('judge access requires explicit project assignment and excludes assignments', async () => {
  const publicProject = await injectJson('GET', `/api/v1/projects/${projectId}`, judgeToken);
  assert.equal(publicProject.statusCode, 404, publicProject.body);

  const assigned = await injectJson('POST', '/api/v1/projects', ownerToken, {
    title: '显式分配评审项目',
    visibility: 'assigned',
    visibleToRoles: ['judge']
  });
  assert.equal(assigned.statusCode, 200, assigned.body);
  const assignedProjectId = assigned.json().project.id;
  const judgeProject = await injectJson('GET', `/api/v1/projects/${assignedProjectId}`, judgeToken);
  assert.equal(judgeProject.statusCode, 200, judgeProject.body);
  const judgeAssignments = await injectJson('GET', '/api/v1/assignments', judgeToken);
  assert.equal(judgeAssignments.statusCode, 403, judgeAssignments.body);
});

test('project create and member endpoints reject invalid payloads', async () => {
  const invalidCreate = await injectJson('POST', '/api/v1/projects', ownerToken, {
    title: '',
    memberIds: ['abc']
  });
  assert.equal(invalidCreate.statusCode, 400, invalidCreate.body);

  const invalidMembers = await injectJson('POST', `/api/v1/projects/${projectId}/members`, ownerToken, {
    memberIds: []
  });
  assert.equal(invalidMembers.statusCode, 400, invalidMembers.body);

  const invalidVisibility = await injectJson('POST', '/api/v1/projects', ownerToken, {
    title: '非法可见性项目',
    visibility: 'everyone'
  });
  assert.equal(invalidVisibility.statusCode, 400, invalidVisibility.body);

  const malformedProjectId = await injectJson('GET', `/api/v1/projects/${projectId}abc`, ownerToken);
  assert.equal(malformedProjectId.statusCode, 400, malformedProjectId.body);
});

test('project tool data persists and is readable by project members', async () => {
  const save = await injectJson('PUT', `/api/v1/projects/${projectId}/tool-data/charter`, ownerToken, {
    data: { projName: '智能实验台', projValue: '减少器材借还摩擦' }
  });
  assert.equal(save.statusCode, 200, save.body);
  assert.equal(save.json().data.projName, '智能实验台');

  const read = await injectJson('GET', `/api/v1/projects/${projectId}/tool-data/charter`, memberToken);
  assert.equal(read.statusCode, 200, read.body);
  assert.equal(read.json().data.projValue, '减少器材借还摩擦');
});

test('wbs sync is idempotent and preserves manual milestones', async () => {
  const manual = await injectJson('POST', `/api/v1/projects/${projectId}/milestones`, ownerToken, {
    title: '手动任务',
    phase: 'm1'
  });
  assert.equal(manual.statusCode, 200, manual.body);

  const payload = {
    tasks: [
      { title: '完成需求调研', phase: 'm1', output: '调研记录' },
      { title: '实现核心原型', phase: 'm2', output: 'MVP' }
    ]
  };
  const first = await injectJson('POST', `/api/v1/projects/${projectId}/sync-wbs`, ownerToken, payload);
  assert.equal(first.statusCode, 200, first.body);
  const second = await injectJson('POST', `/api/v1/projects/${projectId}/sync-wbs`, ownerToken, payload);
  assert.equal(second.statusCode, 200, second.body);

  const list = await injectJson('GET', `/api/v1/projects/${projectId}/milestones`, ownerToken);
  assert.equal(list.statusCode, 200, list.body);
  assert.equal(list.json().milestones.length, 3);
});

test('gitea validation reports missing config and accepts mocked real repository', async () => {
  const missing = await injectJson('POST', '/api/v1/gitea/validate-repo', ownerToken, {
    repoUrl: 'http://gitea.local/team/repo'
  });
  assert.equal(missing.statusCode, 503);

  process.env.GITEA_BASE_URL = 'http://gitea.local';
  process.env.GITEA_ADMIN_TOKEN = 'token';
  const originalFetch = global.fetch;
  global.fetch = async (url) => ({
    ok: true,
    status: 200,
    async text() {
      assert.equal(String(url), 'http://gitea.local/api/v1/repos/team/repo');
      return JSON.stringify({ html_url: 'http://gitea.local/team/repo' });
    }
  });
  try {
    const ok = await injectJson('POST', '/api/v1/gitea/validate-repo', ownerToken, {
      repoUrl: 'http://gitea.local/team/repo'
    });
    assert.equal(ok.statusCode, 200, ok.body);
    assert.equal(ok.json().repo.repoUrl, 'http://gitea.local/team/repo');
  } finally {
    global.fetch = originalFetch;
    process.env.GITEA_BASE_URL = '';
    process.env.GITEA_ADMIN_TOKEN = '';
  }
});

test('teacher can sync a platform student to a gitea user', async () => {
  const missing = await injectJson('POST', '/api/v1/admin/users/1/sync-gitea', adminToken, {});
  assert.equal(missing.statusCode, 503);

  process.env.GITEA_BASE_URL = 'http://gitea.local';
  process.env.GITEA_ADMIN_TOKEN = 'token';
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), body: JSON.parse(options.body || '{}') });
    return {
      ok: true,
      status: 201,
      async text() {
        return JSON.stringify({ html_url: 'http://gitea.local/owner' });
      }
    };
  };

  try {
    const ok = await injectJson('POST', '/api/v1/admin/users/1/sync-gitea', adminToken, {
      username: 'Owner Student',
      password: 'secret123'
    });
    assert.equal(ok.statusCode, 200, ok.body);
    assert.equal(calls[0].url, 'http://gitea.local/api/v1/admin/users');
    assert.equal(calls[0].body.username, 'owner-student');
    assert.equal(calls[0].body.email, 'owner@example.com');
    assert.equal(ok.json().gitea.created, true);
    assert.equal(ok.json().gitea.username, 'owner-student');

    const row = dbHandle.get('SELECT gitea_username, gitea_synced_at FROM users WHERE id = ?', [1]);
    assert.equal(row.gitea_username, 'owner-student');
    assert.ok(row.gitea_synced_at);
  } finally {
    global.fetch = originalFetch;
    process.env.GITEA_BASE_URL = '';
    process.env.GITEA_ADMIN_TOKEN = '';
  }
});

test('gitea user sync is idempotent when gitea reports an existing user', async () => {
  process.env.GITEA_BASE_URL = 'http://gitea.local';
  process.env.GITEA_ADMIN_TOKEN = 'token';
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: false,
    status: 409,
    async text() {
      return JSON.stringify({ message: 'user already exists' });
    }
  });

  try {
    const ok = await injectJson('POST', '/api/v1/admin/users/2/sync-gitea', adminToken, {
      username: 'member'
    });
    assert.equal(ok.statusCode, 200, ok.body);
    assert.equal(ok.json().gitea.alreadyExists, true);
    assert.equal(ok.json().gitea.username, 'member');
  } finally {
    global.fetch = originalFetch;
    process.env.GITEA_BASE_URL = '';
    process.env.GITEA_ADMIN_TOKEN = '';
  }
});

test('student can login with short platform username', async () => {
  const registered = await injectJson('POST', '/api/v1/auth/register', null, {
    name: 'short student',
    username: '26-93-99',
    email: 'short-student@example.com',
    password: 'secret123',
    role: 'student'
  });
  assert.equal(registered.statusCode, 200, registered.body);
  assert.equal(registered.json().user.username, '26-93-99');

  const login = await injectJson('POST', '/api/v1/auth/login', null, {
    email: '26-93-99',
    password: 'secret123'
  });
  assert.equal(login.statusCode, 200, login.body);
  assert.equal(login.json().user.username, '26-93-99');
});

test('login rate limit returns 429 with Retry-After', async () => {
  const headers = {
    ...jsonHeaders(null),
    'x-forwarded-for': '203.0.113.201'
  };
  for (let index = 0; index < 10; index += 1) {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers,
      payload: JSON.stringify({ email: 'rate-limit@example.com', password: 'wrong-password' })
    });
    assert.equal(response.statusCode, 401, response.body);
  }
  const limited = await fastify.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    headers,
    payload: JSON.stringify({ email: 'rate-limit@example.com', password: 'wrong-password' })
  });
  assert.equal(limited.statusCode, 429, limited.body);
  assert.ok(Number(limited.headers['retry-after']) > 0);
});

test('teacher can bulk sync unsynced students to gitea users', async () => {
  process.env.GITEA_BASE_URL = 'http://gitea.local';
  process.env.GITEA_ADMIN_TOKEN = 'token';
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options = {}) => {
    const body = JSON.parse(options.body || '{}');
    calls.push({ url: String(url), body });
    return {
      ok: true,
      status: 201,
      async text() {
        return JSON.stringify({ html_url: `http://gitea.local/${body.username}` });
      }
    };
  };

  try {
    const ok = await injectJson('POST', '/api/v1/admin/students/sync-gitea', adminToken, {
      userIds: [3],
      onlyUnsynced: true
    });
    assert.equal(ok.statusCode, 200, ok.body);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'http://gitea.local/api/v1/admin/users');
    assert.equal(calls[0].body.username, 'candidate');
    assert.equal(ok.json().synced.length, 1);
    assert.equal(ok.json().synced[0].giteaUsername, 'candidate');
    assert.ok(ok.json().synced[0].password);
    assert.equal(ok.json().failed.length, 0);

    const row = dbHandle.get('SELECT gitea_username, gitea_synced_at FROM users WHERE id = ?', [3]);
    assert.equal(row.gitea_username, 'candidate');
    assert.ok(row.gitea_synced_at);
  } finally {
    global.fetch = originalFetch;
    process.env.GITEA_BASE_URL = '';
    process.env.GITEA_ADMIN_TOKEN = '';
  }
});

test('admin can manage teacher-student links from admin endpoints', async () => {
  const teacherForbidden = await injectJson('GET', '/api/v1/admin/overview', teacherToken);
  assert.equal(teacherForbidden.statusCode, 403, teacherForbidden.body);

  const teacherSummaries = await injectJson('GET', '/api/v1/admin/teachers', adminToken);
  assert.equal(teacherSummaries.statusCode, 200, teacherSummaries.body);
  assert.equal(teacherSummaries.json().teachers.some(user => user.role === 'admin'), false);

  const studentListBeforeAssign = await injectJson('GET', '/api/v1/admin/users?role=student', adminToken);
  assert.equal(studentListBeforeAssign.statusCode, 200, studentListBeforeAssign.body);
  assert.equal(studentListBeforeAssign.json().teachers.some(user => user.role === 'admin'), false);

  const adminAsTeacher = await injectJson('POST', '/api/v1/admin/student-teacher-links', adminToken, {
    studentIds: [1],
    teacherIds: [5]
  });
  assert.equal(adminAsTeacher.statusCode, 400, adminAsTeacher.body);

  const batchAssign = await injectJson('POST', '/api/v1/admin/student-teacher-links', adminToken, {
    studentIds: [1, 2],
    teacherIds: [4]
  });
  assert.equal(batchAssign.statusCode, 200, batchAssign.body);
  assert.equal(batchAssign.json().createdCount, 2);
  assert.equal(Array.isArray(batchAssign.json().links['1']), true);
  assert.equal(batchAssign.json().links['1'][0].name, 'teacher');

  const assignedStudents = await injectJson('GET', '/api/v1/admin/users?role=student&teacherId=4', adminToken);
  assert.equal(assignedStudents.statusCode, 200, assignedStudents.body);
  assert.equal(assignedStudents.json().users.length >= 2, true);
  assert.equal(assignedStudents.json().users.every(user => Array.isArray(user.teachers)), true);
  assert.equal(assignedStudents.json().users.find(user => user.id === 1).teachers[0].id, 4);

  const unassignedStudents = await injectJson('GET', '/api/v1/admin/users?role=student&withoutTeacher=true', adminToken);
  assert.equal(unassignedStudents.statusCode, 200, unassignedStudents.body);
  assert.equal(unassignedStudents.json().users.some(user => user.id === 3), true);
  assert.equal(unassignedStudents.json().users.some(user => user.id === 1), false);

  const replaceLinks = await injectJson('PUT', '/api/v1/admin/students/1/teachers', adminToken, {
    teacherIds: []
  });
  assert.equal(replaceLinks.statusCode, 200, replaceLinks.body);
  assert.equal(Array.isArray(replaceLinks.json().teachers), true);
  assert.equal(replaceLinks.json().teachers.length, 0);

  const relink = await injectJson('PUT', '/api/v1/admin/students/1/teachers', adminToken, {
    teacherIds: [4]
  });
  assert.equal(relink.statusCode, 200, relink.body);
  assert.equal(relink.json().teachers[0].id, 4);

  const removeLink = await injectJson('DELETE', '/api/v1/admin/students/1/teachers/4', adminToken);
  assert.equal(removeLink.statusCode, 200, removeLink.body);
  assert.equal(removeLink.json().teachers.length, 0);

  const linkRows = dbHandle.all(
    'SELECT teacher_id, student_id FROM teacher_student_links WHERE teacher_id = ? ORDER BY student_id ASC',
    [4]
  );
  assert.deepEqual(linkRows, [{ teacher_id: 4, student_id: 2 }]);
});

test('teacher roster endpoint only returns linked students and admin overview stays admin-only', async () => {
  const now = new Date().toISOString();
  const existingProfile = dbHandle.get('SELECT id FROM student_profiles WHERE user_id = ?', [1]);
  if (existingProfile) {
    dbHandle.run(
      'UPDATE student_profiles SET class_name = ?, updated_at = ? WHERE user_id = ?',
      ['七年级一班', now, 1]
    );
  } else {
    dbHandle.run(
      `INSERT INTO student_profiles (user_id, class_name, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      [1, '七年级一班', now, now]
    );
  }
  dbHandle.run(
    `INSERT OR IGNORE INTO teacher_student_links (teacher_id, student_id, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [4, 1, now, now]
  );
  dbHandle.run(
    `INSERT OR IGNORE INTO teacher_student_links (teacher_id, student_id, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [4, 2, now, now]
  );

  const teacherRoster = await injectJson('GET', '/api/v1/teacher/students?className=%E4%B8%83%E5%B9%B4%E7%BA%A7%E4%B8%80%E7%8F%AD', teacherToken);
  assert.equal(teacherRoster.statusCode, 200, teacherRoster.body);
  assert.equal(teacherRoster.json().summary.students >= 1, true);
  assert.equal(teacherRoster.json().summary.classes >= 1, true);
  assert.equal(Array.isArray(teacherRoster.json().students), true);
  assert.equal(teacherRoster.json().students.every(item => [1, 2].includes(item.id)), true);
  assert.equal(teacherRoster.json().students.some(item => item.id === 1 && item.class_name === '七年级一班'), true);

  const overview = await injectJson('GET', '/api/v1/admin/overview', adminToken);
  assert.equal(overview.statusCode, 200, overview.body);
  assert.equal(overview.json().summary.students >= 3, true);
  assert.equal(overview.json().summary.linkedStudents >= 1, true);
  assert.equal(Array.isArray(overview.json().classes), true);
  assert.equal(overview.json().classes[0].className, '七年级一班');
  assert.equal(Array.isArray(overview.json().teachers), true);
  assert.equal(overview.json().teachers.some(item => item.id === 4 && item.student_count >= 1), true);
});

test('proposal submission and teacher feedback form a review loop', async () => {
  const details = {
    uploadedMaterials: true,
    problem: '器材借还记录分散',
    goals: '自动化登记',
    scope: '实验室',
    approach: '扫码和后台表单',
    plan: '先做 MVP',
    teamMembers: 'owner'
  };
  const form = multipartFilePayload(
    {
      type: 'proposal',
      title: '开题报告',
      details: JSON.stringify(details)
    },
    {
      filename: 'proposal-notes.txt',
      contentType: 'text/plain',
      content: 'proposal attachment'
    }
  );
  const submit = await fastify.inject({
    method: 'POST',
    url: `/api/v1/projects/${projectId}/submissions`,
    headers: { ...form.headers, authorization: `Bearer ${ownerToken}` },
    payload: form.body
  });
  assert.equal(submit.statusCode, 200, submit.body);

  const projectAttachment = dbHandle.get(
    'SELECT id FROM attachments WHERE submission_id = ? ORDER BY id DESC LIMIT 1',
    [submit.json().submissionId]
  );
  assert.ok(projectAttachment?.id);
  assert.equal((await fastify.inject(`/api/v1/project-attachments/${projectAttachment.id}/download`)).statusCode, 404);
  const ownerAttachment = await fastify.inject({
    method: 'GET',
    url: `/api/v1/project-attachments/${projectAttachment.id}/download`,
    headers: { authorization: `Bearer ${ownerToken}` }
  });
  assert.equal(ownerAttachment.statusCode, 200, ownerAttachment.body);
  assert.equal(ownerAttachment.body, 'proposal attachment');
  assert.equal(ownerAttachment.headers['x-content-type-options'], 'nosniff');

  const feedback = await injectJson('POST', `/api/v1/submissions/${submit.json().submissionId}/feedback`, teacherToken, {
    status: 'needs_changes',
    feedback: '补充风险说明'
  });
  assert.equal(feedback.statusCode, 200, feedback.body);

  const showcaseProject = await injectJson('POST', '/api/v1/projects', ownerToken, {
    title: `公开 Showcase 附件项目 ${Date.now()}`,
    visibility: 'public'
  });
  assert.equal(showcaseProject.statusCode, 200, showcaseProject.body);
  const showcaseForm = multipartFilePayload(
    {
      type: 'showcase',
      title: '公开成果',
      details: JSON.stringify({ showcaseSummary: '经审核后公开展示' })
    },
    { filename: 'showcase.txt', contentType: 'text/plain', content: 'public showcase attachment' }
  );
  const showcaseSubmit = await fastify.inject({
    method: 'POST',
    url: `/api/v1/projects/${showcaseProject.json().project.id}/submissions`,
    headers: { ...showcaseForm.headers, authorization: `Bearer ${ownerToken}` },
    payload: showcaseForm.body
  });
  assert.equal(showcaseSubmit.statusCode, 200, showcaseSubmit.body);
  dbHandle.run('UPDATE submissions SET status = ? WHERE id = ?', ['approved', showcaseSubmit.json().submissionId]);
  const showcaseAttachment = dbHandle.get(
    'SELECT id FROM attachments WHERE submission_id = ? ORDER BY id DESC LIMIT 1',
    [showcaseSubmit.json().submissionId]
  );
  assert.ok(showcaseAttachment?.id);
  assert.equal((await fastify.inject(`/api/v1/project-attachments/${showcaseAttachment.id}/download`)).statusCode, 404);
  const publicShowcaseAttachment = await fastify.inject(`/api/v1/showcase-attachments/${showcaseAttachment.id}/download`);
  assert.equal(publicShowcaseAttachment.statusCode, 200, publicShowcaseAttachment.body);
  assert.equal(publicShowcaseAttachment.body, 'public showcase attachment');
  assert.equal(publicShowcaseAttachment.headers['cache-control'], 'private, no-store');
});

test('collaboration write schemas reject malformed payloads', async () => {
  const invalidTemplate = await injectJson('POST', '/api/v1/score-templates', teacherToken, {
    type: 'proposal',
    criteria: []
  });
  assert.equal(invalidTemplate.statusCode, 400, invalidTemplate.body);

  const invalidComment = await injectJson('POST', `/api/v1/projects/${projectId}/comments`, ownerToken, {
    content: ''
  });
  assert.equal(invalidComment.statusCode, 400, invalidComment.body);

  const invalidAnnouncement = await injectJson('POST', '/api/v1/announcements', teacherToken, {
    title: ''
  });
  assert.equal(invalidAnnouncement.statusCode, 400, invalidAnnouncement.body);

  const invalidAssessmentType = await injectJson('POST', '/api/v1/assessments', teacherToken, {
    title: '错误上传'
  });
  assert.equal(invalidAssessmentType.statusCode, 400, invalidAssessmentType.body);
});

test('assessment uploads require multipart csv and persist uploaded file metadata', async () => {
  const invalidFile = multipartFilePayload(
    { title: '无效文件' },
    {
      filename: 'assessment.txt',
      contentType: 'text/plain',
      content: 'name,score\nAlice,95\n'
    }
  );
  const invalidUpload = await fastify.inject({
    method: 'POST',
    url: '/api/v1/assessments',
    headers: { ...invalidFile.headers, authorization: `Bearer ${teacherToken}` },
    payload: invalidFile.body
  });
  assert.equal(invalidUpload.statusCode, 400, invalidUpload.body);

  const validFile = multipartFilePayload(
    { title: '高一测评导入' },
    {
      filename: 'assessment.csv',
      contentType: 'text/csv',
      content: 'name,score\nAlice,95\n'
    }
  );
  const upload = await fastify.inject({
    method: 'POST',
    url: '/api/v1/assessments',
    headers: { ...validFile.headers, authorization: `Bearer ${teacherToken}` },
    payload: validFile.body
  });
  assert.equal(upload.statusCode, 200, upload.body);
  assert.equal(upload.json().success, true);
  assert.equal(upload.json().file.title, '高一测评导入');
  assert.equal(upload.json().file.original_name.endsWith('.csv'), true);

  const list = await injectJson('GET', '/api/v1/assessments', teacherToken);
  assert.equal(list.statusCode, 200, list.body);
  assert.equal(Array.isArray(list.json().files), true);
  assert.equal(list.json().files.some(item => item.title === '高一测评导入'), true);
});

test('admin banner APIs are teacher-only and use temporary portal storage', async () => {
  const denied = await injectJson('GET', '/api/v1/admin/banners', ownerToken);
  assert.equal(denied.statusCode, 403);

  const created = await injectJson('POST', '/api/v1/admin/banners', teacherToken, {
    title: '成果展',
    targetUrl: '/showcase',
    priority: 1
  });
  assert.equal(created.statusCode, 201, created.body);

  const list = await injectJson('GET', '/api/v1/admin/banners', teacherToken);
  assert.equal(list.statusCode, 200, list.body);
  assert.equal(list.json().banners[0].title, '成果展');
});

test('teacher workspace routes expose teacher execution APIs without admin path semantics', async () => {
  const createdBanner = await injectJson('POST', '/api/v1/teacher/banners', teacherToken, {
    title: '教师工作台轮播',
    targetUrl: '/teacher/review',
    priority: 2
  });
  assert.equal(createdBanner.statusCode, 201, createdBanner.body);

  const bannerList = await injectJson('GET', '/api/v1/teacher/banners', teacherToken);
  assert.equal(bannerList.statusCode, 200, bannerList.body);
  assert.equal(bannerList.json().banners.some(item => item.title === '教师工作台轮播'), true);

  const topicCreated = await injectJson('POST', '/api/v1/teacher/project-topics', teacherToken, {
    title: '教师路由测试题目',
    description: '验证 teacher 路由语义',
    difficulty: 'medium',
    status: 'published'
  });
  assert.equal(topicCreated.statusCode, 201, topicCreated.body);

  const topicList = await injectJson('GET', '/api/v1/teacher/project-topics', teacherToken);
  assert.equal(topicList.statusCode, 200, topicList.body);
  assert.equal(topicList.json().topics.some(item => item.title === '教师路由测试题目'), true);

  const competitionCreated = await injectJson('POST', '/api/v1/teacher/competitions', teacherToken, {
    title: '教师路由测试赛',
    slug: 'teacher-route-competition',
    tier: '校内',
    status: '进行中',
    publishStatus: 'published',
    dateRange: '2026.06 - 2026.07'
  });
  assert.equal(competitionCreated.statusCode, 201, competitionCreated.body);

  const competitionList = await injectJson('GET', '/api/v1/teacher/competitions', teacherToken);
  assert.equal(competitionList.statusCode, 200, competitionList.body);
  assert.equal(competitionList.json().competitions.some(item => item.slug === 'teacher-route-competition'), true);

  const queue = await injectJson('GET', '/api/v1/teacher/project-review-queue', teacherToken);
  assert.equal(queue.statusCode, 200, queue.body);
  assert.equal(Array.isArray(queue.json().projects), true);

  const resources = await injectJson('GET', '/api/v1/teacher/resources?status=pending', teacherToken);
  assert.equal(resources.statusCode, 200, resources.body);
  assert.equal(Array.isArray(resources.json().requests), true);
});

test('asset and mission routes expose stats, file listing, downloads, and project activity feed', async () => {
  const stats = await injectJson('GET', '/api/v1/stats', teacherToken);
  assert.equal(stats.statusCode, 200, stats.body);
  assert.equal(typeof stats.json().total, 'number');
  assert.equal(Array.isArray(stats.json().byStatus), true);

  const projectMaterialDir = path.join(process.env.MATERIALS_DIR, 'demo-project');
  fs.mkdirSync(projectMaterialDir, { recursive: true });
  const filePath = path.join(projectMaterialDir, 'brief.txt');
  fs.writeFileSync(filePath, 'demo material');

  const listFiles = await fastify.inject({
    method: 'GET',
    url: '/api/v1/files/demo-project'
  });
  assert.equal(listFiles.statusCode, 200, listFiles.body);
  assert.equal(listFiles.json().files.some(item => item.name === 'brief.txt'), true);

  const download = await fastify.inject({
    method: 'GET',
    url: '/api/v1/download/demo-project/brief.txt'
  });
  assert.equal(download.statusCode, 200, download.body);
  assert.equal(download.headers['content-type'], 'text/plain');
  assert.match(download.headers['content-disposition'] || '', /^attachment;/);

  const inlineDownload = await fastify.inject({
    method: 'GET',
    url: '/api/v1/download/demo-project/brief.txt?inline=1'
  });
  assert.equal(inlineDownload.statusCode, 200, inlineDownload.body);
  assert.match(inlineDownload.headers['content-disposition'] || '', /^inline;/);

  const missionProjects = await fastify.inject({
    method: 'GET',
    url: '/api/v1/mission/projects'
  });
  assert.equal(missionProjects.statusCode, 200, missionProjects.body);
  assert.equal(Array.isArray(missionProjects.json().projects), true);
  assert.equal(missionProjects.json().projects.some(item => item.id === projectId), true);
});

test('assignment routes validate payloads and preserve teacher review flow', async () => {
  const invalidCourseQuery = await injectJson('GET', '/api/v1/assignments?courseId=../storage', ownerToken);
  assert.equal(invalidCourseQuery.statusCode, 400, invalidCourseQuery.body);

  const assignmentCourseId = `assignment-test-course-${Date.now()}`;
  const createCourse = await injectJson('POST', '/api/v1/courses', teacherToken, {
    id: assignmentCourseId,
    title: '作业测试课程',
    teacherName: '测试教师',
    summary: '用于验证作业接口',
    status: 'published'
  });
  assert.equal(createCourse.statusCode, 201, createCourse.body);
  const teacherId = dbHandle.get('SELECT id FROM users WHERE email = ?', ['teacher@example.com']).id;
  const ownerId = dbHandle.get('SELECT id FROM users WHERE email = ?', ['owner@example.com']).id;
  dbHandle.run(
    `INSERT OR IGNORE INTO teacher_student_links (teacher_id, student_id, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [teacherId, ownerId, new Date().toISOString(), new Date().toISOString()]
  );

  const invalidAssignment = await injectJson('POST', '/api/v1/assignments', teacherToken, {
    courseId: assignmentCourseId
  });
  assert.equal(invalidAssignment.statusCode, 400, invalidAssignment.body);

  const createAssignment = await injectJson('POST', '/api/v1/assignments', teacherToken, {
    courseId: assignmentCourseId,
    title: '第一份作业',
    requirements: '提交你的设计草图',
    status: 'published'
  });
  assert.equal(createAssignment.statusCode, 201, createAssignment.body);
  const assignmentId = createAssignment.json().assignment.id;

  const updateAssignment = await injectJson('PATCH', `/api/v1/assignments/${assignmentId}`, teacherToken, {
    courseId: assignmentCourseId,
    title: '第一份作业-修订',
    requirements: '提交你的设计草图和说明',
    status: 'published'
  });
  assert.equal(updateAssignment.statusCode, 200, updateAssignment.body);
  assert.equal(updateAssignment.json().assignment.title, '第一份作业-修订');

  const invalidSubmission = await injectJson('POST', `/api/v1/assignments/${assignmentId}/submissions`, ownerToken, {
    content: '',
    link: '',
    attachmentNote: ''
  });
  assert.equal(invalidSubmission.statusCode, 400, invalidSubmission.body);

  const createSubmission = await injectJson('POST', `/api/v1/assignments/${assignmentId}/submissions`, ownerToken, {
    content: '这是我的作业提交内容'
  });
  assert.equal(createSubmission.statusCode, 200, createSubmission.body);
  assert.equal(createSubmission.json().submission.content, '这是我的作业提交内容');

  const multipartSubmission = multipartFilePayload(
    {
      content: '补交了代码文件与说明',
      attachmentNote: '附上 python 源码'
    },
    {
      fieldName: 'files',
      filename: 'solution.py',
      contentType: 'text/x-python',
      content: 'print(\"hello assignment\")\n'
    }
  );
  const uploadSubmission = await fastify.inject({
    method: 'POST',
    url: `/api/v1/assignments/${assignmentId}/submissions`,
    headers: { ...multipartSubmission.headers, authorization: `Bearer ${ownerToken}` },
    payload: multipartSubmission.body
  });
  assert.equal(uploadSubmission.statusCode, 200, uploadSubmission.body);
  assert.equal(uploadSubmission.json().submission.attachments.length, 1);
  assert.equal(uploadSubmission.json().submission.attachments[0].name, 'solution.py');
  assert.match(uploadSubmission.json().submission.attachments[0].url, /^\/api\/v1\/assignment-attachments\/\d+\/download$/);
  const assignmentAttachmentId = uploadSubmission.json().submission.attachments[0].id;
  assert.equal((await fastify.inject(`/api/v1/assignment-attachments/${assignmentAttachmentId}/download`)).statusCode, 404);
  const ownerDownload = await fastify.inject({
    method: 'GET',
    url: `/api/v1/assignment-attachments/${assignmentAttachmentId}/download`,
    headers: { authorization: `Bearer ${ownerToken}` }
  });
  assert.equal(ownerDownload.statusCode, 200, ownerDownload.body);
  assert.equal(ownerDownload.body, 'print("hello assignment")\n');
  assert.match(ownerDownload.headers['content-disposition'] || '', /^attachment;/);
  assert.equal(ownerDownload.headers['x-content-type-options'], 'nosniff');
  assert.equal((await fastify.inject({
    method: 'GET',
    url: `/api/v1/assignment-attachments/${assignmentAttachmentId}/download`,
    headers: { authorization: `Bearer ${candidateToken}` }
  })).statusCode, 404);

  const svgUpload = multipartFilePayload(
    { content: '拒绝 SVG' },
    { fieldName: 'files', filename: 'payload.svg', contentType: 'image/svg+xml', content: '<svg><script>alert(1)</script></svg>' }
  );
  const rejectedSvg = await fastify.inject({
    method: 'POST',
    url: `/api/v1/assignments/${assignmentId}/submissions`,
    headers: { ...svgUpload.headers, authorization: `Bearer ${ownerToken}` },
    payload: svgUpload.body
  });
  assert.equal(rejectedSvg.statusCode, 400, rejectedSvg.body);

  const invalidReview = await injectJson('POST', `/api/v1/assignments/${assignmentId}/submissions/${createSubmission.json().submission.id}/review`, teacherToken, {
    status: 'needs_changes',
    feedback: ''
  });
  assert.equal(invalidReview.statusCode, 400, invalidReview.body);

  const reviewSubmission = await injectJson('POST', `/api/v1/assignments/${assignmentId}/submissions/${createSubmission.json().submission.id}/review`, teacherToken, {
    status: 'reviewed',
    score: 95,
    feedback: '结构清楚，可以继续完善展示部分。'
  });
  assert.equal(reviewSubmission.statusCode, 200, reviewSubmission.body);
  assert.equal(reviewSubmission.json().submission.score, 95);

  const listSubmissions = await injectJson('GET', `/api/v1/assignments/${assignmentId}/submissions`, teacherToken);
  assert.equal(listSubmissions.statusCode, 200, listSubmissions.body);
  assert.equal(listSubmissions.json().submissions.length, 1);
  assert.equal(listSubmissions.json().submissions[0].status, 'reviewed');
  assert.equal(listSubmissions.json().submissions[0].attachments.length, 1);

  const unrelatedTeacher = createManualUserToken(`unrelated-${Date.now()}@example.com`, 'teacher');
  const forgedReview = await injectJson(
    'POST',
    `/api/v1/assignments/${assignmentId}/submissions/${createSubmission.json().submission.id}/review`,
    unrelatedTeacher.token,
    { status: 'reviewed', score: 1, feedback: '越权批改不应生效' }
  );
  assert.equal(forgedReview.statusCode, 404, forgedReview.body);
  const unchanged = dbHandle.get(
    'SELECT score, feedback FROM assignment_submissions WHERE id = ?',
    [createSubmission.json().submission.id]
  );
  assert.equal(unchanged.score, 95);
  assert.equal(unchanged.feedback, '结构清楚，可以继续完善展示部分。');
});

test('assignment list creates published lesson assignment from course homework', async () => {
  const listAssignments = await injectJson('GET', '/api/v1/assignments?courseId=ai-creator-mlp&lessonId=lesson1', ownerToken);
  assert.equal(listAssignments.statusCode, 200, listAssignments.body);
  assert.equal(listAssignments.json().assignments.length >= 1, true);
  const assignment = listAssignments.json().assignments[0];
  assert.equal(assignment.courseId, 'ai-creator-mlp');
  assert.equal(assignment.lessonId, 'lesson1');
  assert.equal(assignment.status, 'published');
  assert.match(assignment.requirements, /激活函数|实验|提交/);

  const submit = await injectJson('POST', `/api/v1/assignments/${assignment.id}/submissions`, ownerToken, {
    content: '我已经完成最终作品，并记录了挥手重开的测试过程。',
    link: 'https://example.com/final-showcase',
    attachmentNote: '课堂现场演示已完成'
  });
  assert.equal(submit.statusCode, 200, submit.body);
  assert.equal(submit.json().submission.assignmentId, assignment.id);
});

test('competition reminders target matching students and can be marked read', async () => {
  const createCompetition = await injectJson('POST', '/api/v1/admin/competitions', teacherToken, {
    title: '提醒测试赛',
    slug: 'reminder-test-competition',
    tier: '校内测试',
    status: '进行中',
    dateRange: '2026.04 - 2026.07',
    publishStatus: 'published',
    schoolStage: ['high'],
    tags: ['ai', 'robotics'],
    requiredSkills: ['python'],
    estimatedHours: 4
  });
  assert.equal(createCompetition.statusCode, 201, createCompetition.body);

  const ownerRegistration = await injectJson('POST', '/api/v1/competitions/reminder-test-competition/registrations', ownerToken, {
    className: '高一 1 班',
    members: 'owner',
    materials: '已完成官方报名截图'
  });
  assert.equal(ownerRegistration.statusCode, 200, ownerRegistration.body);

  const reminder = await injectJson('POST', '/api/v1/competitions/reminder-test-competition/reminders', teacherToken, {
    targetGroup: 'not_registered',
    body: '请确认是否需要报名或补登记。'
  });
  assert.equal(reminder.statusCode, 201, reminder.body);
  assert.equal(reminder.json().count >= 2, true);

  const ownerList = await injectJson('GET', '/api/v1/competitions/reminder-test-competition/reminders', ownerToken);
  assert.equal(ownerList.statusCode, 200, ownerList.body);
  assert.equal(ownerList.json().reminders.length, 0);

  const memberList = await injectJson('GET', '/api/v1/competitions/reminder-test-competition/reminders', memberToken);
  assert.equal(memberList.statusCode, 200, memberList.body);
  const memberReminders = memberList.json().reminders;
  assert.equal(memberReminders.length, 1);
  assert.equal(memberReminders[0].body, '请确认是否需要报名或补登记。');
  assert.equal(memberReminders[0].readAt, '');

  const ownerMarkRead = await injectJson('PATCH', `/api/v1/competitions/reminder-test-competition/reminders/${memberReminders[0].id}/read`, ownerToken, {});
  assert.equal(ownerMarkRead.statusCode, 404, ownerMarkRead.body);

  const memberMarkRead = await injectJson('PATCH', `/api/v1/competitions/reminder-test-competition/reminders/${memberReminders[0].id}/read`, memberToken, {});
  assert.equal(memberMarkRead.statusCode, 200, memberMarkRead.body);

  const memberReadList = await injectJson('GET', '/api/v1/competitions/reminder-test-competition/reminders', memberToken);
  assert.equal(memberReadList.statusCode, 200, memberReadList.body);
  assert.notEqual(memberReadList.json().reminders[0].readAt, '');
});

test('competition matching profile APIs and teacher candidate ops work', async () => {
  const getProfile = await injectJson('GET', '/api/v1/me/profile', ownerToken);
  assert.equal(getProfile.statusCode, 200, getProfile.body);
  assert.equal(getProfile.json().item.userId > 0, true);

  const updateProfile = await injectJson('PUT', '/api/v1/me/profile', ownerToken, {
    schoolStage: 'high',
    gradeLevel: 'g10',
    className: '高一 1 班',
    interestTags: ['ai', 'robotics'],
    skillTags: ['python'],
    targetTags: ['ai'],
    weeklyHours: 5,
    experienceLevel: 'beginner',
    preferredTeamSize: '2-4',
    deviceAccess: 'pc'
  });
  assert.equal(updateProfile.statusCode, 200, updateProfile.body);
  assert.equal(updateProfile.json().item.schoolStage, 'high');

  const matches = await injectJson('GET', '/api/v1/me/competition-matches', ownerToken);
  assert.equal(matches.statusCode, 200, matches.body);
  assert.equal(Array.isArray(matches.json().items), true);
  assert.equal(matches.json().items.some(item => item.targetKey === 'reminder-test-competition'), true);

  const detail = await injectJson('GET', '/api/v1/me/competition-matches/reminder-test-competition', ownerToken);
  assert.equal(detail.statusCode, 200, detail.body);
  assert.equal(detail.json().item.targetKey, 'reminder-test-competition');

  const interaction = await injectJson('POST', '/api/v1/me/competition-matches/reminder-test-competition/interactions', ownerToken, {
    interactionType: 'view',
    metadata: { source: 'test' }
  });
  assert.equal(interaction.statusCode, 200, interaction.body);

  const candidates = await injectJson('GET', '/api/v1/admin/competitions/reminder-test-competition/match-candidates', teacherToken);
  assert.equal(candidates.statusCode, 200, candidates.body);
  assert.equal(Array.isArray(candidates.json().items), true);
  const ownerCandidate = candidates.json().items.find(item => item.userId === 1);
  assert.equal(Boolean(ownerCandidate), true);
  assert.equal(ownerCandidate.candidateBucket, 'already_registered');
  assert.equal(ownerCandidate.candidateBucketLabel, '已报名待跟进');

  const override = await injectJson('PATCH', `/api/v1/admin/matches/${ownerCandidate.id}/override`, teacherToken, {
    overrideType: 'boost',
    note: '教师重点鼓励'
  });
  assert.equal(override.statusCode, 200, override.body);

  const directReminder = await injectJson('POST', '/api/v1/admin/competitions/reminder-test-competition/match-reminders', teacherToken, {
    title: '重点提醒',
    body: '你和这个赛事很匹配，请优先准备。',
    studentIds: [1]
  });
  assert.equal(directReminder.statusCode, 200, directReminder.body);
  assert.equal(directReminder.json().count, 1);

  const bucketReminder = await injectJson('POST', '/api/v1/admin/competitions/reminder-test-competition/match-reminders', teacherToken, {
    title: '资料补齐提醒',
    body: '你已进入候选池，请继续补全报名材料。',
    candidateBucket: 'already_registered'
  });
  assert.equal(bucketReminder.statusCode, 200, bucketReminder.body);
  assert.equal(bucketReminder.json().count >= 1, true);
  assert.equal(bucketReminder.json().candidateBucket, 'already_registered');

  const userMatches = await injectJson('GET', '/api/v1/admin/users/1/matches', teacherToken);
  assert.equal(userMatches.statusCode, 200, userMatches.body);
  assert.equal(Array.isArray(userMatches.json().items), true);
  const ownerCompetitionMatch = userMatches.json().items.find(item => item.targetType === 'competition' && item.targetKey === 'reminder-test-competition');
  assert.equal(ownerCompetitionMatch.overrideState.overrideType, 'boost');
  assert.equal(ownerCompetitionMatch.interactionState.interactionType, 'view');

  const recompute = await injectJson('POST', '/api/v1/admin/matches/recompute', teacherToken, {
    user_id: 1
  });
  assert.equal(recompute.statusCode, 200, recompute.body);

  const analytics = await injectJson('GET', '/api/v1/admin/match-analytics', teacherToken);
  assert.equal(analytics.statusCode, 200, analytics.body);
  assert.equal(typeof analytics.json().item.coverageRate, 'number');
  assert.equal(typeof analytics.json().item.courseRecommendationCount, 'number');
  assert.equal(typeof analytics.json().item.byTargetType.competition.coverageRate, 'number');
  assert.equal(analytics.json().item.byTargetType.competition.candidateBuckets.already_registered >= 1, true);
});

test('project topic CRUD preserves structured matching fields', async () => {
  const create = await injectJson('POST', '/api/v1/admin/project-topics', teacherToken, {
    title: '智能巡线机器人',
    description: '围绕机器人巡线任务设计项目题目。',
    difficulty: 'intermediate',
    tags: ['robotics', 'embedded'],
    requiredSkills: ['python', 'arduino'],
    estimatedHours: 12,
    suggestedTeamSize: '2-4',
    deliverables: '代码、演示视频、说明文档',
    status: 'draft'
  });
  assert.equal(create.statusCode, 201, create.body);
  const createdTopic = create.json().topic;
  assert.deepEqual(createdTopic.tags, ['robotics', 'embedded']);
  assert.deepEqual(createdTopic.requiredSkills, ['python', 'arduino']);
  assert.equal(createdTopic.estimatedHours, 12);

  const update = await injectJson('PATCH', `/api/v1/admin/project-topics/${createdTopic.id}`, teacherToken, {
    tags: ['robotics', 'vision'],
    requiredSkills: ['python', 'opencv'],
    estimatedHours: 18,
    status: 'published'
  });
  assert.equal(update.statusCode, 200, update.body);
  const updatedTopic = update.json().topic;
  assert.deepEqual(updatedTopic.tags, ['robotics', 'vision']);
  assert.deepEqual(updatedTopic.requiredSkills, ['python', 'opencv']);
  assert.equal(updatedTopic.estimatedHours, 18);

  const list = await injectJson('GET', '/api/v1/admin/project-topics', teacherToken);
  assert.equal(list.statusCode, 200, list.body);
  const listedTopic = list.json().topics.find(item => item.id === createdTopic.id);
  assert.deepEqual(listedTopic.tags, ['robotics', 'vision']);
  assert.deepEqual(listedTopic.requiredSkills, ['python', 'opencv']);
  assert.equal(listedTopic.estimatedHours, 18);
});

test('project topic matches are computed and readable for students', async () => {
  const created = await injectJson('POST', '/api/v1/admin/project-topics', teacherToken, {
    title: 'AI 食堂视觉分析',
    description: '通过摄像头识别人流与餐盘回收情况。',
    difficulty: 'intermediate',
    tags: ['ai', 'vision'],
    requiredSkills: ['python', 'machine-vision'],
    estimatedHours: 6,
    suggestedTeamSize: '2-4',
    relatedCourseId: 'ai',
    status: 'published'
  });
  assert.equal(created.statusCode, 201, created.body);
  const topicId = created.json().topic.id;

  const updateProfile = await injectJson('PUT', '/api/v1/me/profile', ownerToken, {
    schoolStage: 'high',
    interestTags: ['ai'],
    skillTags: ['python', 'machine-vision'],
    targetTags: ['vision'],
    weeklyHours: 8,
    preferredTeamSize: '2-4',
    experienceLevel: 'medium'
  });
  assert.equal(updateProfile.statusCode, 200, updateProfile.body);

  const matches = await injectJson('GET', '/api/v1/me/project-topic-matches', ownerToken);
  assert.equal(matches.statusCode, 200, matches.body);
  assert.equal(Array.isArray(matches.json().items), true);
  const item = matches.json().items.find(entry => String(entry.targetKey) === String(topicId));
  assert.equal(Boolean(item), true);
  assert.equal(item.targetType, 'project_topic');
  assert.equal(item.score >= 60, true);

  const detail = await injectJson('GET', `/api/v1/me/project-topic-matches/${topicId}`, ownerToken);
  assert.equal(detail.statusCode, 200, detail.body);
  assert.equal(String(detail.json().item.targetKey), String(topicId));

  const interaction = await injectJson('POST', `/api/v1/me/project-topic-matches/${topicId}/interactions`, ownerToken, {
    interactionType: 'click',
    metadata: { source: 'test-project-topic' }
  });
  assert.equal(interaction.statusCode, 200, interaction.body);

  const recompute = await injectJson('POST', '/api/v1/admin/matches/recompute', teacherToken, {
    project_topic_id: topicId
  });
  assert.equal(recompute.statusCode, 200, recompute.body);
  assert.equal(recompute.json().items.some(entry => entry.targetType === 'project_topic' && String(entry.targetKey) === String(topicId)), true);
});

test('course matches are computed and readable for students', async () => {
  const courseId = `course-match-test-${Date.now()}`;
  matchedCourseId = courseId;
  const created = await injectJson('POST', '/api/v1/courses', teacherToken, {
    id: courseId,
    title: 'AI 视觉实验课',
    direction: 'science',
    teacherName: '测试教师',
    summary: '围绕机器视觉和 Python 实验展开。',
    description: '帮助学生建立视觉识别、数据理解和模型实验能力。',
    audience: '面向高中学生',
    pace: '4 课时',
    status: 'published',
    positioning: '机器视觉 / 算法实验',
    courseType: '学科专题',
    tags: ['ai', 'vision'],
    skillOutcomes: ['python', 'machine-vision'],
    difficultyPath: 'intermediate',
    learningObjectives: ['理解机器视觉基本流程']
  });
  assert.equal(created.statusCode, 201, created.body);

  const updateProfile = await injectJson('PUT', '/api/v1/me/profile', ownerToken, {
    schoolStage: 'high',
    interestTags: ['ai'],
    skillTags: ['python', 'machine-vision'],
    targetTags: ['vision'],
    experienceLevel: 'medium'
  });
  assert.equal(updateProfile.statusCode, 200, updateProfile.body);

  const matches = await injectJson('GET', '/api/v1/me/course-matches', ownerToken);
  assert.equal(matches.statusCode, 200, matches.body);
  assert.equal(Array.isArray(matches.json().items), true);
  const item = matches.json().items.find(entry => entry.targetKey === courseId);
  assert.equal(Boolean(item), true);
  assert.equal(item.targetType, 'course');
  assert.equal(item.score >= 60, true);

  const detail = await injectJson('GET', `/api/v1/me/course-matches/${courseId}`, ownerToken);
  assert.equal(detail.statusCode, 200, detail.body);
  assert.equal(detail.json().item.targetKey, courseId);

  const interaction = await injectJson('POST', `/api/v1/me/course-matches/${courseId}/interactions`, ownerToken, {
    interactionType: 'view',
    metadata: { source: 'test-course-match' }
  });
  assert.equal(interaction.statusCode, 200, interaction.body);

  const recompute = await injectJson('POST', '/api/v1/admin/matches/recompute', teacherToken, {
    course_id: courseId
  });
  assert.equal(recompute.statusCode, 200, recompute.body);
  assert.equal(recompute.json().items.some(entry => entry.targetType === 'course' && entry.targetKey === courseId), true);
});

test('team candidate matches exclude existing collaborators and support teacher outreach', async () => {
  const ownerProfile = await injectJson('PUT', '/api/v1/me/profile', ownerToken, {
    schoolStage: 'high',
    gradeLevel: 'g10',
    className: '高一 1 班',
    interestTags: ['ai', 'robotics'],
    skillTags: ['python', 'arduino'],
    targetTags: ['vision'],
    weeklyHours: 6,
    preferredTeamSize: '2-4',
    experienceLevel: 'medium'
  });
  assert.equal(ownerProfile.statusCode, 200, ownerProfile.body);

  const memberProfile = await injectJson('PUT', '/api/v1/me/profile', memberToken, {
    schoolStage: 'high',
    gradeLevel: 'g10',
    className: '高一 1 班',
    interestTags: ['robotics'],
    skillTags: ['python'],
    targetTags: ['ai'],
    weeklyHours: 5,
    preferredTeamSize: '2-4',
    experienceLevel: 'medium'
  });
  assert.equal(memberProfile.statusCode, 200, memberProfile.body);

  const candidateProfile = await injectJson('PUT', '/api/v1/me/profile', candidateToken, {
    schoolStage: 'high',
    gradeLevel: 'g10',
    className: '高一 2 班',
    interestTags: ['ai', 'vision'],
    skillTags: ['machine-vision', 'python'],
    targetTags: ['robotics', 'vision'],
    weeklyHours: 7,
    preferredTeamSize: '3-4',
    experienceLevel: 'medium'
  });
  assert.equal(candidateProfile.statusCode, 200, candidateProfile.body);

  const matches = await injectJson('GET', '/api/v1/me/team-matches', ownerToken);
  assert.equal(matches.statusCode, 200, matches.body);
  assert.equal(Array.isArray(matches.json().items), true);

  const memberMatch = matches.json().items.find(item => Number(item.targetKey) === 2);
  assert.equal(Boolean(memberMatch), true);
  assert.equal(memberMatch.eligibilityStatus, 'ineligible');
  assert.equal(memberMatch.gaps.some(text => /已是当前队友|已与当前项目协作/.test(text)), true);

  const candidateMatch = matches.json().items.find(item => Number(item.targetKey) === 3);
  assert.equal(Boolean(candidateMatch), true);
  assert.equal(candidateMatch.targetType, 'team_candidate');
  assert.equal(candidateMatch.eligibilityStatus === 'eligible' || candidateMatch.eligibilityStatus === 'conditional', true);
  assert.equal(candidateMatch.score > 0, true);
  assert.equal(candidateMatch.teamCandidate.name, 'candidate');

  const detail = await injectJson('GET', '/api/v1/me/team-matches/3', ownerToken);
  assert.equal(detail.statusCode, 200, detail.body);
  assert.equal(Number(detail.json().item.targetKey), 3);

  const interaction = await injectJson('POST', '/api/v1/me/team-matches/3/interactions', ownerToken, {
    interactionType: 'click',
    metadata: { source: 'test-team-match' }
  });
  assert.equal(interaction.statusCode, 200, interaction.body);

  const teacherCandidates = await injectJson('GET', '/api/v1/admin/users/1/team-match-candidates', teacherToken);
  assert.equal(teacherCandidates.statusCode, 200, teacherCandidates.body);
  assert.equal(Array.isArray(teacherCandidates.json().items), true);
  assert.equal(teacherCandidates.json().items.some(item => Number(item.targetKey) === 3), true);

  const reminder = await injectJson('POST', '/api/v1/admin/users/3/team-match-reminders', teacherToken, {
    title: '组队建议',
    body: '这位同学的技能和方向比较互补，建议你主动联系。',
    candidateBucket: 'ready_to_nudge'
  });
  assert.equal(reminder.statusCode, 200, reminder.body);
  assert.equal(reminder.json().targetType, 'team_candidate');
  assert.equal(reminder.json().count >= 1, true);

  const reminderList = await injectJson('GET', '/api/v1/me/team-matches/3/reminders', ownerToken);
  assert.equal(reminderList.statusCode, 200, reminderList.body);
  assert.equal(Array.isArray(reminderList.json().items), true);
  assert.equal(reminderList.json().items.some(item => item.targetType === 'team_candidate'), true);
  const latestReminder = reminderList.json().items[0];
  assert.equal(latestReminder.readAt, '');

  const markRead = await injectJson('PATCH', `/api/v1/me/team-matches/3/reminders/${latestReminder.id}/read`, ownerToken, {});
  assert.equal(markRead.statusCode, 200, markRead.body);

  const recompute = await injectJson('POST', '/api/v1/admin/matches/recompute', teacherToken, {
    team_candidate_id: 3
  });
  assert.equal(recompute.statusCode, 200, recompute.body);
  assert.equal(recompute.json().items.some(entry => entry.targetType === 'team_candidate' && Number(entry.targetKey) === 3), true);
});

test('new student registration initializes platform-level matches including course and team candidates', async () => {
  const fresh = await register('fresh@example.com');
  const freshToken = fresh.token;

  const profile = await injectJson('GET', '/api/v1/me/profile', freshToken);
  assert.equal(profile.statusCode, 200, profile.body);
  assert.equal(profile.json().item.userId > 0, true);

  const courseMatches = await injectJson('GET', '/api/v1/me/course-matches', freshToken);
  assert.equal(courseMatches.statusCode, 200, courseMatches.body);
  assert.equal(Array.isArray(courseMatches.json().items), true);
  assert.equal(courseMatches.json().items.some(item => item.targetType === 'course'), true);

  const teamMatches = await injectJson('GET', '/api/v1/me/team-matches', freshToken);
  assert.equal(teamMatches.statusCode, 200, teamMatches.body);
  assert.equal(Array.isArray(teamMatches.json().items), true);
  assert.equal(teamMatches.json().items.some(item => item.targetType === 'team_candidate'), true);
});

test('admin candidate APIs cover project topics and courses, and user overview aggregates target types', async () => {
  const projectTopicCandidates = await injectJson('GET', '/api/v1/admin/project-topics/2/match-candidates', teacherToken);
  assert.equal(projectTopicCandidates.statusCode, 200, projectTopicCandidates.body);
  assert.equal(Array.isArray(projectTopicCandidates.json().items), true);
  assert.equal(projectTopicCandidates.json().items.some(item => item.targetType === 'project_topic'), true);
  assert.equal(projectTopicCandidates.json().items.some(item => item.candidateBucketLabel), true);

  assert.equal(Boolean(matchedCourseId), true);
  const courseCandidates = await injectJson('GET', `/api/v1/admin/courses/${matchedCourseId}/match-candidates`, teacherToken);
  assert.equal(courseCandidates.statusCode, 200, courseCandidates.body);
  assert.equal(Array.isArray(courseCandidates.json().items), true);
  assert.equal(courseCandidates.json().items.some(item => item.targetType === 'course'), true);
  assert.equal(courseCandidates.json().items.some(item => item.candidateBucketLabel), true);

  const overview = await injectJson('GET', '/api/v1/admin/users/1/matches', teacherToken);
  assert.equal(overview.statusCode, 200, overview.body);
  assert.equal(Array.isArray(overview.json().items), true);
  assert.equal(overview.json().items.some(item => item.targetType === 'competition'), true);
  assert.equal(overview.json().items.some(item => item.targetType === 'project_topic'), true);
  assert.equal(overview.json().items.some(item => item.targetType === 'course'), true);
  assert.equal(overview.json().items.some(item => item.targetType === 'team_candidate'), true);
});

test('project topic and course match reminders support teacher outreach and student read flow', async () => {
  const projectReminder = await injectJson('POST', '/api/v1/admin/project-topics/2/match-reminders', teacherToken, {
    title: '项目题目提醒',
    body: '这个题目和你的技能基础很接近，可以优先考虑。',
    candidateBucket: 'ready_to_nudge'
  });
  assert.equal(projectReminder.statusCode, 200, projectReminder.body);
  assert.equal(projectReminder.json().targetType, 'project_topic');
  assert.equal(projectReminder.json().count >= 1, true);

  const projectReminderList = await injectJson('GET', '/api/v1/me/project-topic-matches/2/reminders', ownerToken);
  assert.equal(projectReminderList.statusCode, 200, projectReminderList.body);
  assert.equal(Array.isArray(projectReminderList.json().items), true);
  const latestProjectReminder = projectReminderList.json().items[0];
  assert.equal(latestProjectReminder.targetType, 'project_topic');
  assert.equal(latestProjectReminder.readAt, '');

  const projectRead = await injectJson('PATCH', `/api/v1/me/project-topic-matches/2/reminders/${latestProjectReminder.id}/read`, ownerToken, {});
  assert.equal(projectRead.statusCode, 200, projectRead.body);

  const courseReminder = await injectJson('POST', `/api/v1/admin/courses/${matchedCourseId}/match-reminders`, teacherToken, {
    title: '课程补强提醒',
    body: '这门课能直接补你后续参赛需要的技能。',
    candidateBucket: 'ready_to_nudge'
  });
  assert.equal(courseReminder.statusCode, 200, courseReminder.body);
  assert.equal(courseReminder.json().targetType, 'course');
  assert.equal(courseReminder.json().count >= 1, true);

  const courseReminderList = await injectJson('GET', `/api/v1/me/course-matches/${matchedCourseId}/reminders`, ownerToken);
  assert.equal(courseReminderList.statusCode, 200, courseReminderList.body);
  assert.equal(Array.isArray(courseReminderList.json().items), true);
  const latestCourseReminder = courseReminderList.json().items[0];
  assert.equal(latestCourseReminder.targetType, 'course');
  assert.equal(latestCourseReminder.readAt, '');

  const courseRead = await injectJson('PATCH', `/api/v1/me/course-matches/${matchedCourseId}/reminders/${latestCourseReminder.id}/read`, ownerToken, {});
  assert.equal(courseRead.statusCode, 200, courseRead.body);
});

test('restricted courses are visible only to allowed students and linked teachers', async () => {
  const className = '权限测试班';
  await injectJson('PUT', '/api/v1/me/profile', ownerToken, { className });
  await injectJson('PUT', '/api/v1/me/profile', candidateToken, { className: '未授权班' });

  const courseId = `restricted-course-${Date.now()}`;
  const created = await injectJson('POST', '/api/v1/courses', teacherToken, {
    id: courseId,
    title: '受限课程',
    teacherName: '测试教师',
    summary: '只开放给指定班级。',
    status: 'published',
    visibility: 'assigned',
    visibleToClassNames: [className]
  });
  assert.equal(created.statusCode, 201, created.body);

  const anonymousList = await fastify.inject('/api/v1/courses');
  assert.equal(anonymousList.statusCode, 200, anonymousList.body);
  assert.equal(anonymousList.json().courses.some(item => item.id === courseId), false);

  const ownerList = await injectJson('GET', '/api/v1/courses', ownerToken);
  assert.equal(ownerList.statusCode, 200, ownerList.body);
  assert.equal(ownerList.json().courses.some(item => item.id === courseId), true);

  const candidateList = await injectJson('GET', '/api/v1/courses', candidateToken);
  assert.equal(candidateList.statusCode, 200, candidateList.body);
  assert.equal(candidateList.json().courses.some(item => item.id === courseId), false);

  const anonymousDetail = await fastify.inject(`/api/v1/courses/${courseId}`);
  assert.equal(anonymousDetail.statusCode, 404, anonymousDetail.body);

  const candidateDetail = await injectJson('GET', `/api/v1/courses/${courseId}`, candidateToken);
  assert.equal(candidateDetail.statusCode, 404, candidateDetail.body);

  dbHandle.run(
    `INSERT OR IGNORE INTO teacher_student_links (teacher_id, student_id, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [4, 1, new Date().toISOString(), new Date().toISOString()]
  );
  const teacherDetail = await injectJson('GET', `/api/v1/courses/${courseId}`, teacherToken);
  assert.equal(teacherDetail.statusCode, 200, teacherDetail.body);

  const assignment = await injectJson('POST', '/api/v1/assignments', teacherToken, {
    courseId,
    title: '受限课程作业',
    requirements: '提交课堂记录',
    status: 'published'
  });
  assert.equal(assignment.statusCode, 201, assignment.body);

  const ownerAssignments = await injectJson('GET', `/api/v1/assignments?courseId=${courseId}`, ownerToken);
  assert.equal(ownerAssignments.statusCode, 200, ownerAssignments.body);
  assert.equal(ownerAssignments.json().assignments.some(item => item.title === '受限课程作业'), true);

  const candidateAssignments = await injectJson('GET', `/api/v1/assignments?courseId=${courseId}`, candidateToken);
  assert.equal(candidateAssignments.statusCode, 404, candidateAssignments.body);
});

test('restricted project topics are hidden from public and unassigned teachers', async () => {
  const className = '项目题目权限班';
  await injectJson('PUT', '/api/v1/me/profile', ownerToken, { className });
  await injectJson('PUT', '/api/v1/me/profile', candidateToken, { className: '项目题目未授权班' });
  dbHandle.run(
    `INSERT OR IGNORE INTO teacher_student_links (teacher_id, student_id, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [4, 1, new Date().toISOString(), new Date().toISOString()]
  );
  const otherTeacher = createManualUserToken(`topic-teacher-${Date.now()}@example.com`, 'teacher');

  const created = await injectJson('POST', '/api/v1/teacher/project-topics', teacherToken, {
    title: `受限题目 ${Date.now()}`,
    description: '只开放给指定班级。',
    status: 'published',
    visibility: 'assigned',
    visibleToClassNames: [className]
  });
  assert.equal(created.statusCode, 201, created.body);
  const topicId = created.json().topic.id;

  const publicTopics = await fastify.inject('/api/v1/project-topics');
  assert.equal(publicTopics.statusCode, 200, publicTopics.body);
  assert.equal(publicTopics.json().topics.some(item => item.id === topicId), false);

  const ownerTopics = await injectJson('GET', '/api/v1/project-topics', ownerToken);
  assert.equal(ownerTopics.statusCode, 200, ownerTopics.body);
  assert.equal(ownerTopics.json().topics.some(item => item.id === topicId), true);

  const candidateTopics = await injectJson('GET', '/api/v1/project-topics', candidateToken);
  assert.equal(candidateTopics.statusCode, 200, candidateTopics.body);
  assert.equal(candidateTopics.json().topics.some(item => item.id === topicId), false);

  const teacherTopics = await injectJson('GET', '/api/v1/teacher/project-topics', teacherToken);
  assert.equal(teacherTopics.statusCode, 200, teacherTopics.body);
  assert.equal(teacherTopics.json().topics.some(item => item.id === topicId), true);

  const otherTeacherTopics = await injectJson('GET', '/api/v1/teacher/project-topics', otherTeacher.token);
  assert.equal(otherTeacherTopics.statusCode, 200, otherTeacherTopics.body);
  assert.equal(otherTeacherTopics.json().topics.some(item => item.id === topicId), false);
});

test('draft courses stay hidden from public course library but remain visible to owner and admin', async () => {
  const courseId = `draft-course-${Date.now()}`;
  const created = await injectJson('POST', '/api/v1/courses', teacherToken, {
    id: courseId,
    title: '草稿课程',
    teacherName: '测试教师',
    summary: '不应出现在公开课程页。',
    status: 'draft',
    visibility: 'public'
  });
  assert.equal(created.statusCode, 201, created.body);

  const anonymousList = await fastify.inject('/api/v1/courses');
  assert.equal(anonymousList.statusCode, 200, anonymousList.body);
  assert.equal(anonymousList.json().courses.some(item => item.id === courseId), false);

  const teacherList = await injectJson('GET', '/api/v1/courses', teacherToken);
  assert.equal(teacherList.statusCode, 200, teacherList.body);
  assert.equal(teacherList.json().courses.some(item => item.id === courseId), true);

  const adminList = await injectJson('GET', '/api/v1/courses', adminToken);
  assert.equal(adminList.statusCode, 200, adminList.body);
  assert.equal(adminList.json().courses.some(item => item.id === courseId), true);

  const studentList = await injectJson('GET', '/api/v1/courses', ownerToken);
  assert.equal(studentList.statusCode, 200, studentList.body);
  assert.equal(studentList.json().courses.some(item => item.id === courseId), false);
});

test('restricted projects are removed from unassigned teacher project and review views', async () => {
  const otherTeacher = createManualUserToken(`project-teacher-${Date.now()}@example.com`, 'teacher');
  const created = await injectJson('POST', '/api/v1/projects', ownerToken, {
    title: `受限项目 ${Date.now()}`,
    summary: '只允许项目成员和绑定教师查看。',
    visibility: 'assigned'
  });
  assert.equal(created.statusCode, 200, created.body);
  const restrictedProjectId = created.json().project.id;

  const candidateDetail = await injectJson('GET', `/api/v1/projects/${restrictedProjectId}`, candidateToken);
  assert.equal(candidateDetail.statusCode, 404, candidateDetail.body);

  const otherTeacherDetail = await injectJson('GET', `/api/v1/projects/${restrictedProjectId}`, otherTeacher.token);
  assert.equal(otherTeacherDetail.statusCode, 404, otherTeacherDetail.body);

  const otherTeacherQueue = await injectJson('GET', '/api/v1/teacher/project-review-queue', otherTeacher.token);
  assert.equal(otherTeacherQueue.statusCode, 200, otherTeacherQueue.body);
  assert.equal(otherTeacherQueue.json().projects.some(item => item.id === restrictedProjectId), false);

  dbHandle.run(
    `INSERT OR IGNORE INTO teacher_student_links (teacher_id, student_id, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [4, 1, new Date().toISOString(), new Date().toISOString()]
  );
  const linkedTeacherDetail = await injectJson('GET', `/api/v1/projects/${restrictedProjectId}`, teacherToken);
  assert.equal(linkedTeacherDetail.statusCode, 200, linkedTeacherDetail.body);

  const linkedTeacherQueue = await injectJson('GET', '/api/v1/teacher/project-review-queue', teacherToken);
  assert.equal(linkedTeacherQueue.statusCode, 200, linkedTeacherQueue.body);
  assert.equal(linkedTeacherQueue.json().projects.some(item => item.id === restrictedProjectId), true);

  const adminDetail = await injectJson('GET', `/api/v1/projects/${restrictedProjectId}`, adminToken);
  assert.equal(adminDetail.statusCode, 200, adminDetail.body);
});

test('project permission matrix separates collaboration, supervision, and administration', async () => {
  const privateProjectResponse = await injectJson('POST', '/api/v1/projects', ownerToken, {
    title: `矩阵私有项目 ${Date.now()}`,
    visibility: 'private'
  });
  assert.equal(privateProjectResponse.statusCode, 200, privateProjectResponse.body);
  const privateProjectId = privateProjectResponse.json().project.id;

  assert.equal((await injectJson('POST', `/api/v1/projects/${privateProjectId}/members`, ownerToken, { memberIds: [2] })).statusCode, 200);
  assert.equal((await injectJson('GET', `/api/v1/projects/${privateProjectId}`, memberToken)).statusCode, 200);
  assert.equal((await injectJson('POST', `/api/v1/projects/${privateProjectId}/logs`, memberToken, { content: '成员协作记录' })).statusCode, 200);
  assert.equal((await injectJson('GET', `/api/v1/projects/${privateProjectId}`, teacherToken)).statusCode, 404);
  assert.equal((await injectJson('GET', `/api/v1/projects/${privateProjectId}`, judgeToken)).statusCode, 404);
  assert.equal((await injectJson('GET', `/api/v1/projects/${privateProjectId}`, adminToken)).statusCode, 200);
  assert.equal((await injectJson('DELETE', `/api/v1/projects/${privateProjectId}`, memberToken, {})).statusCode, 403);

  const publicProjectResponse = await injectJson('POST', '/api/v1/projects', ownerToken, {
    title: `矩阵公开项目 ${Date.now()}`,
    visibility: 'public'
  });
  assert.equal(publicProjectResponse.statusCode, 200, publicProjectResponse.body);
  const publicProjectId = publicProjectResponse.json().project.id;
  const teacherSupervision = await injectJson('POST', `/api/v1/projects/${publicProjectId}/status`, teacherToken, {
    status: 'reviewing',
    note: '公开项目监督'
  });
  assert.equal(teacherSupervision.statusCode, 200, teacherSupervision.body);

  const judgeAssignedResponse = await injectJson('POST', '/api/v1/projects', ownerToken, {
    title: `矩阵评审项目 ${Date.now()}`,
    visibility: 'assigned',
    visibleToRoles: ['judge'],
    memberIds: [5]
  });
  assert.equal(judgeAssignedResponse.statusCode, 200, judgeAssignedResponse.body);
  const judgeAssignedId = judgeAssignedResponse.json().project.id;
  assert.equal((await injectJson('GET', `/api/v1/projects/${judgeAssignedId}`, judgeToken)).statusCode, 200);
  assert.equal((await injectJson('POST', `/api/v1/projects/${judgeAssignedId}/status`, judgeToken, { status: 'reviewing' })).statusCode, 403);

  const judgeMemberOnlyResponse = await injectJson('POST', '/api/v1/projects', ownerToken, {
    title: `矩阵非显式评审项目 ${Date.now()}`,
    visibility: 'private',
    memberIds: [5]
  });
  assert.equal(judgeMemberOnlyResponse.statusCode, 200, judgeMemberOnlyResponse.body);
  assert.equal((await injectJson('GET', `/api/v1/projects/${judgeMemberOnlyResponse.json().project.id}`, judgeToken)).statusCode, 404);
});

test('match reminder inbox and admin match dashboard aggregate cross-target data', async () => {
  const inbox = await injectJson('GET', '/api/v1/me/match-reminders?includeRead=true', ownerToken);
  assert.equal(inbox.statusCode, 200, inbox.body);
  assert.equal(Array.isArray(inbox.json().items), true);
  assert.equal(inbox.json().items.some(item => item.targetType === 'project_topic'), true);
  assert.equal(inbox.json().items.some(item => item.targetType === 'course'), true);
  assert.equal(inbox.json().items.some(item => item.targetType === 'team_candidate'), true);

  const unreadOnly = await injectJson('GET', '/api/v1/me/match-reminders?includeRead=false', ownerToken);
  assert.equal(unreadOnly.statusCode, 200, unreadOnly.body);
  assert.equal(Array.isArray(unreadOnly.json().items), true);
  assert.equal(unreadOnly.json().items.every(item => !item.readAt), true);

  const dashboard = await injectJson('GET', '/api/v1/admin/users/1/match-dashboard', teacherToken);
  assert.equal(dashboard.statusCode, 200, dashboard.body);
  assert.equal(Array.isArray(dashboard.json().item.matches), true);
  assert.equal(Array.isArray(dashboard.json().item.reminders), true);
  assert.equal(dashboard.json().item.matches.some(item => item.targetType === 'competition'), true);
  assert.equal(dashboard.json().item.reminders.some(item => item.targetType === 'project_topic'), true);
  assert.equal(dashboard.json().item.matches.some(item => item.targetType === 'team_candidate'), true);
  assert.equal(typeof dashboard.json().item.stats.unreadReminders, 'number');
});

test('admin match candidates aggregate cross-target candidate pools', async () => {
  const allCandidates = await injectJson('GET', '/api/v1/admin/match-candidates', teacherToken);
  assert.equal(allCandidates.statusCode, 200, allCandidates.body);
  assert.equal(Array.isArray(allCandidates.json().items), true);
  assert.equal(allCandidates.json().items.some(item => item.targetType === 'competition'), true);
  assert.equal(allCandidates.json().items.some(item => item.targetType === 'project_topic'), true);
  assert.equal(allCandidates.json().items.some(item => item.targetType === 'course'), true);
  assert.equal(allCandidates.json().items.some(item => item.targetType === 'team_candidate'), true);

  const readyCompetition = await injectJson('GET', '/api/v1/admin/match-candidates?targetType=competition&candidateBucket=already_registered', teacherToken);
  assert.equal(readyCompetition.statusCode, 200, readyCompetition.body);
  assert.equal(Array.isArray(readyCompetition.json().items), true);
  assert.equal(readyCompetition.json().items.every(item => item.targetType === 'competition'), true);
  assert.equal(readyCompetition.json().items.every(item => item.candidateBucket === 'already_registered'), true);

  const ownerScoped = await injectJson('GET', '/api/v1/admin/match-candidates?userId=1', teacherToken);
  assert.equal(ownerScoped.statusCode, 200, ownerScoped.body);
  assert.equal(Array.isArray(ownerScoped.json().items), true);
  assert.equal(ownerScoped.json().items.every(item => item.userId === 1), true);
});

test('taxonomy APIs expose and persist matching term dictionary', async () => {
  const createTerm = await injectJson('POST', '/api/v1/admin/match-taxonomy', teacherToken, {
    termType: 'skill',
    termKey: 'machine-vision',
    label: '机器视觉',
    aliases: ['cv', 'computer vision'],
    status: 'active'
  });
  assert.equal(createTerm.statusCode, 201, createTerm.body);
  assert.equal(createTerm.json().item.termType, 'skill');
  assert.equal(createTerm.json().item.termKey, 'machine-vision');
  assert.deepEqual(createTerm.json().item.aliases, ['cv', 'computer vision']);

  const publicList = await fastify.inject('/api/v1/match-taxonomy?termType=skill');
  assert.equal(publicList.statusCode, 200, publicList.body);
  assert.equal(Array.isArray(publicList.json().items), true);
  assert.equal(publicList.json().items.some(item => item.termKey === 'machine-vision'), true);

  const adminList = await injectJson('GET', '/api/v1/admin/match-taxonomy?termType=skill', teacherToken);
  assert.equal(adminList.statusCode, 200, adminList.body);
  assert.equal(adminList.json().items.some(item => item.termKey === 'machine-vision'), true);
});

test('taxonomy aliases affect profile normalization and competition matching', async () => {
  const stageTerm = await injectJson('POST', '/api/v1/admin/match-taxonomy', teacherToken, {
    termType: 'stage',
    termKey: 'high',
    label: '高中',
    aliases: ['high school', 'senior high'],
    status: 'active'
  });
  assert.equal(stageTerm.statusCode, 201, stageTerm.body);

  const skillTerm = await injectJson('POST', '/api/v1/admin/match-taxonomy', teacherToken, {
    termType: 'skill',
    termKey: 'machine-vision',
    label: '机器视觉',
    aliases: ['cv', 'computer vision'],
    status: 'active'
  });
  assert.equal(skillTerm.statusCode, 201, skillTerm.body);

  const disciplineTerm = await injectJson('POST', '/api/v1/admin/match-taxonomy', teacherToken, {
    termType: 'discipline',
    termKey: 'robotics',
    label: '机器人',
    aliases: ['robot', 'robotics'],
    status: 'active'
  });
  assert.equal(disciplineTerm.statusCode, 201, disciplineTerm.body);

  const createCompetition = await injectJson('POST', '/api/v1/admin/competitions', teacherToken, {
    title: '机器视觉挑战赛',
    slug: 'vision-alias-competition',
    tier: '测试',
    status: '进行中',
    dateRange: '2026.05 - 2026.08',
    publishStatus: 'published',
    schoolStage: ['high school'],
    tags: ['robot'],
    requiredSkills: ['cv'],
    estimatedHours: 6
  });
  assert.equal(createCompetition.statusCode, 201, createCompetition.body);

  const updateProfile = await injectJson('PUT', '/api/v1/me/profile', ownerToken, {
    schoolStage: 'senior high',
    interestTags: ['robotics'],
    skillTags: ['computer vision'],
    targetTags: ['robot']
  });
  assert.equal(updateProfile.statusCode, 200, updateProfile.body);
  assert.equal(updateProfile.json().item.schoolStage, '高中');
  assert.equal(updateProfile.json().item.skillTags.includes('机器视觉'), true);

  const matches = await injectJson('GET', '/api/v1/me/competition-matches', ownerToken);
  assert.equal(matches.statusCode, 200, matches.body);
  const item = matches.json().items.find(entry => entry.targetKey === 'vision-alias-competition');
  assert.equal(Boolean(item), true);
  assert.equal(item.eligibilityStatus, 'eligible');
  assert.equal(item.score >= 60, true);
  assert.equal(item.gaps.some(text => /缺少核心技能/.test(text)), false);
});

test('spa fallback serves app routes but not missing asset files', async () => {
  const appRoute = await fastify.inject('/knowledge');
  assert.equal(appRoute.statusCode, 200);
  assert.match(appRoute.headers['content-type'] || '', /text\/html/);

  const detailRoute = await fastify.inject('/knowledge/ai');
  assert.equal(detailRoute.statusCode, 200);
  assert.match(detailRoute.headers['content-type'] || '', /text\/html/);

  const missingAsset = await fastify.inject('/assets/does-not-exist.js');
  assert.equal(missingAsset.statusCode, 404);
  assert.match(missingAsset.headers['content-type'] || '', /application\/json/);
});

test('knowledge learning unit APIs expose detail page data', async () => {
  const units = await fastify.inject('/api/v1/knowledge/learning-units');
  assert.equal(units.statusCode, 200, units.body);
  assert.equal(Array.isArray(units.json().learningUnits), true);
  assert.equal(units.json().learningUnits.some(item => item.disciplineId === 'ai'), true);

  const crashCourseSeries = await fastify.inject('/api/v1/knowledge/crash-course-series');
  assert.equal(crashCourseSeries.statusCode, 200, crashCourseSeries.body);
  assert.equal(Array.isArray(crashCourseSeries.json().series), true);
  assert.equal(crashCourseSeries.json().series.length >= 42, true);
  assert.equal(
    crashCourseSeries.json().series.some(item => item.id === 'economics' && item.disciplineId === 'econ'),
    true
  );
  const configuredSeries = crashCourseSeries.json().series.filter(item => Number(item.videoCount || 0) > 0);
  assert.equal(configuredSeries.length >= 41, true);
  assert.equal(configuredSeries.every(item => Number(item.videoCount || 0) > 0), true);
  assert.equal(configuredSeries.reduce((sum, item) => sum + Number(item.videoCount || 0), 0) >= 776, true);

  const detail = await fastify.inject('/api/v1/knowledge/disciplines/ai');
  assert.equal(detail.statusCode, 200, detail.body);
  assert.equal(detail.json().discipline.id, 'ai');
  assert.equal(detail.json().learningUnit.disciplineId, 'ai');
  assert.equal(Array.isArray(detail.json().relatedCourses), true);
  assert.equal(detail.json().series.videos.length, 6);
  assert.equal(detail.json().series.videos.some(item => item.episode === '00'), false);
  assert.deepEqual(
    detail.json().series.videos
      .filter(item => ['ai-01', 'ai-02', 'ai-12'].includes(item.id))
      .map(item => item.bvid),
    ['BV1mE411t7uS', 'BV1YJ411D7Ap', 'BV157411876W']
  );

  const aiEpisodeResponses = await fastify.inject('/api/v1/knowledge/disciplines/ai/responses?episodeKey=BV1mE411t7uS');
  assert.equal(aiEpisodeResponses.statusCode, 200, aiEpisodeResponses.body);
  assert.equal(aiEpisodeResponses.json().courseProgress.videos.length, 6);
  assert.equal(aiEpisodeResponses.json().courseProgress.videos.some(item => item.id === 'ai-01'), true);
  assert.equal(aiEpisodeResponses.json().prompts[0].id, 'concept');
  assert.equal(aiEpisodeResponses.json().prompts[0].type, 'single_choice');
  assert.equal(Array.isArray(aiEpisodeResponses.json().prompts[0].options), true);
  assert.equal(aiEpisodeResponses.json().prompts[0].options.length, 4);
  assert.equal(Object.hasOwn(aiEpisodeResponses.json().prompts[0], 'correctAnswer'), false);
  assert.match(aiEpisodeResponses.json().prompts[0].prompt, /人工智能/);
  assert.equal(aiEpisodeResponses.json().prompts[2].type, 'short_answer');

  dbHandle.run(
    `UPDATE knowledge_open_prompts
     SET prompt = ?, expectation = ?, updated_at = ?
     WHERE discipline_id = ? AND episode_key = ? AND prompt_id = ?`,
    [
      '数据库题目：请用自己的话说明这集的核心概念。',
      '数据库期望：回答必须来自可编辑题库。',
      new Date().toISOString(),
      'ai',
      'ai-01',
      'concept'
    ]
  );

  const dbPromptResponses = await fastify.inject('/api/v1/knowledge/disciplines/ai/responses?episodeKey=BV1mE411t7uS');
  assert.equal(dbPromptResponses.statusCode, 200, dbPromptResponses.body);
  assert.equal(dbPromptResponses.json().prompts[0].prompt, '数据库题目：请用自己的话说明这集的核心概念。');
  assert.equal(dbPromptResponses.json().prompts[0].expectation, '数据库期望：回答必须来自可编辑题库。');
  assert.equal(dbPromptResponses.json().prompts[0].type, 'single_choice');
  assert.equal(dbPromptResponses.json().prompts[0].options.length, 4);

  const supervisedEpisodeResponses = await fastify.inject('/api/v1/knowledge/disciplines/ai/responses?episodeKey=BV1YJ411D7Ap');
  assert.equal(supervisedEpisodeResponses.statusCode, 200, supervisedEpisodeResponses.body);
  assert.match(supervisedEpisodeResponses.json().prompts[0].prompt, /监督式学习/);
  assert.equal(supervisedEpisodeResponses.json().prompts[0].type, 'single_choice');

  const missing = await fastify.inject('/api/v1/knowledge/disciplines/not-a-real-discipline');
  assert.equal(missing.statusCode, 404);
});

test('knowledge response submission uses logged-in student identity', async () => {
  const beforeCount = dbHandle.get('SELECT COUNT(*) AS count FROM match_events WHERE event_type = ?', ['knowledge_progress_updated']).count;
  const payload = {
    episodeKey: 'BV1mE411t7uS',
    sharePublicly: true,
    answers: [
      {
        questionId: 'concept',
        type: 'single_choice',
        prompt: '这集更接近把人工智能理解成哪一种能力？',
        answer: 'a'
      },
      {
        questionId: 'transfer',
        type: 'single_choice',
        prompt: '下面哪个问题更适合用 AI 方法尝试解决？',
        answer: 'a'
      },
      {
        questionId: 'verification',
        type: 'short_answer',
        prompt: '选一个校园场景，说明它为什么适合或不适合用 AI 解决。',
        answer: '校园垃圾桶满溢检测适合，因为可以用照片作为输入，用是否装满作为判断标准，再用测试照片检查正确率。'
      }
    ]
  };

  const anonymous = await injectJson('POST', '/api/v1/knowledge/disciplines/ai/responses', null, payload);
  assert.equal(anonymous.statusCode, 401, anonymous.body);

  const submitted = await injectJson('POST', '/api/v1/knowledge/disciplines/ai/responses', ownerToken, payload);
  assert.equal(submitted.statusCode, 200, submitted.body);
  assert.equal(submitted.json().myResponse.displayName, 'owner');
  const afterCount = dbHandle.get('SELECT COUNT(*) AS count FROM match_events WHERE event_type = ?', ['knowledge_progress_updated']).count;
  assert.equal(afterCount, beforeCount + 1);
  const latestKnowledgeEvent = dbHandle.get(
    'SELECT * FROM match_events WHERE event_type = ? ORDER BY created_at DESC LIMIT 1',
    ['knowledge_progress_updated']
  );
  assert.equal(Number(latestKnowledgeEvent.user_id), 1);
});

test('knowledge response submission validates prompt completion and answer shape', async () => {
  const invalidMissingAnswers = await injectJson('POST', '/api/v1/knowledge/disciplines/ai/responses', ownerToken, {
    episodeKey: 'BV1mE411t7uS',
    answers: []
  });
  assert.equal(invalidMissingAnswers.statusCode, 400, invalidMissingAnswers.body);

  const invalidShortAnswer = await injectJson('POST', '/api/v1/knowledge/disciplines/ai/responses', ownerToken, {
    episodeKey: 'BV1mE411t7uS',
    answers: [
      {
        questionId: 'concept',
        type: 'single_choice',
        prompt: '这集更接近把人工智能理解成哪一种能力？',
        answer: 'a'
      },
      {
        questionId: 'transfer',
        type: 'single_choice',
        prompt: '下面哪个问题更适合用 AI 方法尝试解决？',
        answer: 'a'
      },
      {
        questionId: 'verification',
        type: 'short_answer',
        prompt: '选一个校园场景，说明它为什么适合或不适合用 AI 解决。',
        answer: '太短了'
      }
    ]
  });
  assert.equal(invalidShortAnswer.statusCode, 400, invalidShortAnswer.body);
});

test('review queue and export endpoints stay available to teachers', async () => {
  const queue = await injectJson('GET', '/api/v1/admin/project-review-queue', teacherToken);
  assert.equal(queue.statusCode, 200, queue.body);
  assert.equal(Array.isArray(queue.json().projects), true);
  assert.equal(queue.json().projects.some(item => item.id === projectId), true);

  const dossier = await injectJson('GET', `/api/v1/admin/projects/${projectId}/review-dossier`, teacherToken);
  assert.equal(dossier.statusCode, 200, dossier.body);
  assert.equal(dossier.json().project.id, projectId);

  const csv = await injectJson('GET', '/api/v1/exports/projects.csv', teacherToken);
  assert.equal(csv.statusCode, 200, csv.body);
  assert.match(csv.headers['content-type'], /^text\/csv/);
  assert.match(csv.body, /项目ID/);

  const showcase = await fastify.inject('/api/v1/showcase');
  assert.equal(showcase.statusCode, 200, showcase.body);
  assert.equal(Array.isArray(showcase.json().items), true);
});

test('project ops routes handle logs resources tickets blueprint and status transitions', async () => {
  const saveBlueprint = await injectJson('POST', `/api/v1/projects/${projectId}/blueprint`, ownerToken, {
    strategy: '先做最小可用原型',
    wbs: [{ title: '调研', owner: 'owner' }]
  });
  assert.equal(saveBlueprint.statusCode, 200, saveBlueprint.body);

  const readBlueprint = await injectJson('GET', `/api/v1/projects/${projectId}/blueprint`, ownerToken);
  assert.equal(readBlueprint.statusCode, 200, readBlueprint.body);
  assert.equal(readBlueprint.json().data.strategy, '先做最小可用原型');

  const addLog = await injectJson('POST', `/api/v1/projects/${projectId}/logs`, ownerToken, {
    content: '完成第一版看板',
    tags: 'dev,weekly'
  });
  assert.equal(addLog.statusCode, 200, addLog.body);

  const listLogs = await injectJson('GET', `/api/v1/projects/${projectId}/logs`, ownerToken);
  assert.equal(listLogs.statusCode, 200, listLogs.body);
  assert.equal(listLogs.json().logs[0].content, '完成第一版看板');

  const resource = await injectJson('POST', `/api/v1/projects/${projectId}/resources`, ownerToken, {
    item_name: '摄像头模组',
    quantity: 2,
    reason: '用于原型验证'
  });
  assert.equal(resource.statusCode, 200, resource.body);

  const listResources = await injectJson('GET', `/api/v1/projects/${projectId}/resources`, ownerToken);
  assert.equal(listResources.statusCode, 200, listResources.body);
  assert.equal(listResources.json().requests[0].item_name, '摄像头模组');

  const reviewResources = await injectJson('GET', '/api/v1/admin/resources', teacherToken);
  assert.equal(reviewResources.statusCode, 200, reviewResources.body);
  assert.equal(reviewResources.json().requests.length > 0, true);

  const ticket = await injectJson('POST', `/api/v1/projects/${projectId}/tickets`, ownerToken, {
    title: '需要数据库建议',
    description: '想确认表结构',
    priority: 'high'
  });
  assert.equal(ticket.statusCode, 200, ticket.body);

  const tickets = await injectJson('GET', `/api/v1/projects/${projectId}/tickets`, ownerToken);
  assert.equal(tickets.statusCode, 200, tickets.body);
  assert.equal(tickets.json().tickets[0].title, '需要数据库建议');

  const closeTicket = await injectJson('PATCH', `/api/v1/tickets/${tickets.json().tickets[0].id}`, ownerToken, {
    status: 'closed',
    resolution: '已自查解决'
  });
  assert.equal(closeTicket.statusCode, 200, closeTicket.body);

  const promote = await injectJson('POST', `/api/v1/projects/${projectId}/status`, teacherToken, {
    status: 'reviewing',
    note: '进入审核'
  });
  assert.equal(promote.statusCode, 200, promote.body);

  const detail = await injectJson('GET', `/api/v1/projects/${projectId}`, ownerToken);
  assert.equal(detail.statusCode, 200, detail.body);
  assert.equal(detail.json().project.status, 'reviewing');
});

test('soft-deleted projects disappear from every read path and admin can restore them', async () => {
  const adminDeleteTarget = await injectJson('POST', '/api/v1/projects', ownerToken, { title: '管理员删除非初始项目' });
  assert.equal(adminDeleteTarget.statusCode, 200, adminDeleteTarget.body);
  const adminDeleteProjectId = adminDeleteTarget.json().project.id;
  const promoteForAdminDelete = await injectJson('POST', `/api/v1/projects/${adminDeleteProjectId}/status`, teacherToken, {
    status: 'reviewing',
    note: '进入审核后由管理员清理'
  });
  assert.equal(promoteForAdminDelete.statusCode, 200, promoteForAdminDelete.body);
  const adminDeleted = await injectJson('DELETE', `/api/v1/projects/${adminDeleteProjectId}`, adminToken, { reason: '管理员清理' });
  assert.equal(adminDeleted.statusCode, 200, adminDeleted.body);
  assert.equal((await injectJson('GET', `/api/v1/projects/${adminDeleteProjectId}`, adminToken)).statusCode, 404);
  assert.equal((await injectJson('POST', `/api/v1/admin/projects/${adminDeleteProjectId}/restore`, adminToken, {})).statusCode, 200);

  const created = await injectJson('POST', '/api/v1/projects', ownerToken, { title: '待删除安全项目' });
  assert.equal(created.statusCode, 200, created.body);
  const deletedProjectId = created.json().project.id;

  const deleted = await injectJson('DELETE', `/api/v1/projects/${deletedProjectId}`, ownerToken, { reason: '测试清理' });
  assert.equal(deleted.statusCode, 200, deleted.body);
  assert.deepEqual(deleted.json(), { success: true });
  assert.equal((await injectJson('GET', `/api/v1/projects/${deletedProjectId}`, ownerToken)).statusCode, 404);
  assert.equal((await injectJson('GET', `/api/v1/projects/${deletedProjectId}/logs`, ownerToken)).statusCode, 404);
  assert.equal((await injectJson('DELETE', `/api/v1/projects/${deletedProjectId}`, ownerToken, {})).statusCode, 404);
  assert.equal((await injectJson('POST', `/api/v1/admin/projects/${deletedProjectId}/restore`, ownerToken, {})).statusCode, 403);

  const restored = await injectJson('POST', `/api/v1/admin/projects/${deletedProjectId}/restore`, adminToken, {});
  assert.equal(restored.statusCode, 200, restored.body);
  assert.equal((await injectJson('GET', `/api/v1/projects/${deletedProjectId}`, ownerToken)).statusCode, 200);
  assert.equal((await injectJson('POST', `/api/v1/admin/projects/${deletedProjectId}/restore`, adminToken, {})).statusCode, 409);
});

test('resource paths reject malformed IDs and legacy public uploads are gone', async () => {
  assert.equal((await fastify.inject('/api/v1/courses/not.valid.json')).statusCode, 400);
  assert.equal((await fastify.inject('/api/v1/files/demo-project?path=../storage')).statusCode, 400);
  assert.equal((await fastify.inject('/uploads/anything.txt')).statusCode, 404);
});

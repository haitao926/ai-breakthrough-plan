const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'innovation-api-'));
process.env.PORTAL_DIR = path.join(tmpRoot, 'portal');
process.env.AUTH_SECRET = 'test-secret';
process.env.GITEA_BASE_URL = '';
process.env.GITEA_ADMIN_TOKEN = '';

const { fastify, initDatabase } = require('./server');

let ownerToken;
let memberToken;
let teacherToken;
let projectId;

function jsonHeaders(token) {
  return {
    'content-type': 'application/json',
    ...(token ? { authorization: `Bearer ${token}` } : {})
  };
}

async function injectJson(method, url, token, payload) {
  return fastify.inject({
    method,
    url,
    headers: jsonHeaders(token),
    payload: payload === undefined ? undefined : JSON.stringify(payload)
  });
}

async function register(email, role = 'student') {
  const res = await injectJson('POST', '/api/v1/auth/register', null, {
    name: email.split('@')[0],
    email,
    password: 'secret123',
    role
  });
  assert.equal(res.statusCode, 200, res.body);
  return res.json();
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

test.before(async () => {
  await initDatabase(path.join(tmpRoot, 'db.sqlite'));
  const owner = await register('owner@example.com');
  const member = await register('member@example.com');
  const teacher = await register('teacher@example.com', 'teacher');
  ownerToken = owner.token;
  memberToken = member.token;
  teacherToken = teacher.token;

  const createProject = await injectJson('POST', '/api/v1/projects', ownerToken, {
    title: '智能实验台'
  });
  assert.equal(createProject.statusCode, 200, createProject.body);
  projectId = createProject.json().project.id;
});

test.after(async () => {
  await fastify.close();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

test('health and auth-protected project permissions work', async () => {
  const health = await fastify.inject('/api/v1/health');
  assert.equal(health.statusCode, 200);
  assert.equal(health.json().ok, true);

  const anonymous = await fastify.inject(`/api/v1/projects/${projectId}/tool-data`);
  assert.equal(anonymous.statusCode, 401);

  const forbidden = await injectJson('GET', `/api/v1/projects/${projectId}`, memberToken);
  assert.equal(forbidden.statusCode, 403);

  const addMember = await injectJson('POST', `/api/v1/projects/${projectId}/members`, ownerToken, {
    memberIds: [2]
  });
  assert.equal(addMember.statusCode, 200, addMember.body);

  const allowed = await injectJson('GET', `/api/v1/projects/${projectId}`, memberToken);
  assert.equal(allowed.statusCode, 200, allowed.body);
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
  const form = multipartPayload({
    type: 'proposal',
    title: '开题报告',
    details: JSON.stringify(details)
  });
  const submit = await fastify.inject({
    method: 'POST',
    url: `/api/v1/projects/${projectId}/submissions`,
    headers: { ...form.headers, authorization: `Bearer ${ownerToken}` },
    payload: form.body
  });
  assert.equal(submit.statusCode, 200, submit.body);

  const feedback = await injectJson('POST', `/api/v1/submissions/${submit.json().submissionId}/feedback`, teacherToken, {
    status: 'needs_changes',
    feedback: '补充风险说明'
  });
  assert.equal(feedback.statusCode, 200, feedback.body);
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

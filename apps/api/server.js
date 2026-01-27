const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const archiver = require('archiver');
const fastify = require('fastify')({ logger: true });
const { pipeline } = require('stream');
const util = require('util');
const pump = util.promisify(pipeline);
const { createDatabase, DEFAULT_DB_PATH } = require('./db');

const PORT = Number.parseInt(process.env.PORT || '8090', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;
const UPLOAD_DIR = path.join(__dirname, '../../storage/uploads');
const LOG_DIR = path.join(__dirname, '../../storage/logs');
const AUDIT_LOG_PATH = path.join(LOG_DIR, 'audit.log');
const UPLOAD_MAX_MB = Number.parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || '200', 10);
const UPLOAD_MAX_BYTES = Math.max(1, UPLOAD_MAX_MB) * 1024 * 1024;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const AUTH_SECRET = process.env.AUTH_SECRET || 'change-me-in-production';
const AUTH_TOKEN_TTL_HOURS = Number.parseInt(process.env.AUTH_TOKEN_TTL_HOURS || '168', 10);
const TEACHER_INVITE_CODE = String(process.env.TEACHER_INVITE_CODE || '').trim();
const JUDGE_INVITE_CODE = String(process.env.JUDGE_INVITE_CODE || '').trim();
const GITEA_BASE_URL = String(process.env.GITEA_BASE_URL || '').trim();
const GITEA_ADMIN_TOKEN = String(process.env.GITEA_ADMIN_TOKEN || '').trim();
const GITEA_DEFAULT_OWNER = String(process.env.GITEA_DEFAULT_OWNER || '').trim();
const GITEA_PRIVATE_REPO = String(process.env.GITEA_PRIVATE_REPO || 'true').trim() === 'true';

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.zip',
  '.rar',
  '.7z',
  '.txt',
  '.md',
  '.csv',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg'
]);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.rar',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'text/plain',
  'text/markdown',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/octet-stream'
]);
const EXTENSION_MIME_MAP = {
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.ppt': ['application/vnd.ms-powerpoint'],
  '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.zip': ['application/zip', 'application/x-zip-compressed'],
  '.rar': ['application/vnd.rar', 'application/x-rar-compressed'],
  '.7z': ['application/x-7z-compressed'],
  '.txt': ['text/plain'],
  '.md': ['text/markdown', 'text/plain'],
  '.csv': ['text/csv', 'application/vnd.ms-excel'],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.svg': ['image/svg+xml']
};

const PROJECT_STATUSES = new Set([
  'draft',
  'submitted',
  'reviewing',
  'approved',
  'rejected',
  'in_progress',
  'midterm_review',
  'final_review',
  'archived'
]);
const SUBMISSION_TYPES = new Set([
  'proposal',
  'milestone_1',
  'milestone_2',
  'midterm',
  'milestone_3',
  'final',
  'showcase',
  'legacy'
]);
const SUBMISSION_STATUSES = new Set(['submitted', 'reviewed', 'needs_changes']);
const STATUS_TRANSITIONS = {
  draft: ['submitted'],
  submitted: ['reviewing', 'rejected'],
  reviewing: ['approved', 'rejected'],
  rejected: ['submitted', 'reviewing'],
  approved: ['in_progress'],
  in_progress: ['midterm_review', 'final_review', 'archived'],
  midterm_review: ['in_progress', 'final_review'],
  final_review: ['archived', 'in_progress'],
  archived: []
};
const SUBMISSION_FIELD_SCHEMA = {
  proposal: ['problem', 'goals', 'scope', 'approach', 'plan', 'teamMembers'],
  milestone_1: ['researchConclusion', 'feasibility', 'riskList', 'featureScope'],
  milestone_2: ['designPlan', 'prototype', 'keyPath'],
  midterm: ['progressCompare', 'demoLink', 'issuesAdjust'],
  milestone_3: ['integration', 'testingFeedback', 'mvpValidation'],
  final: ['deliverables', 'demo', 'techSummary', 'reflection'],
  showcase: ['showcaseSummary'],
  legacy: []
};
const SUBMISSION_FIELD_LABELS = {
  problem: '问题与背景',
  goals: '目标',
  scope: '范围',
  approach: '技术路线',
  plan: '计划',
  teamMembers: '成员列表',
  researchConclusion: '需求调研结论',
  feasibility: '可行性分析',
  riskList: '风险清单',
  featureScope: '功能范围说明',
  designPlan: '方案设计说明',
  prototype: '原型/架构图',
  keyPath: '关键路径与技术难点',
  progressCompare: '进度对比',
  demoLink: '演示链接',
  issuesAdjust: '问题与调整',
  integration: '项目集成说明',
  testingFeedback: '测试/反馈记录',
  mvpValidation: 'MVP 验证结果',
  deliverables: '成果包清单',
  demo: '演示说明',
  techSummary: '技术总结',
  reflection: '反思与展望',
  showcaseSummary: '展示说明'
};
let db;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function now() {
  return new Date().toISOString();
}

function sanitizeName(name) {
  return String(name || '')
    .trim()
    .replace(/[^a-zA-Z0-9.\-_ \u4e00-\u9fa5]/g, '_')
    .slice(0, 120);
}

function slugifyRepoName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function toUrlPath(filePath) {
  return String(filePath || '')
    .split(/[/\\]+/)
    .filter(Boolean)
    .map(part => encodeURIComponent(part))
    .join('/');
}

function parseProjectId(value) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function safeParseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
}

function parseAttachmentList(value) {
  const parsed = safeParseJson(value);
  return Array.isArray(parsed) ? parsed : [];
}

function logAudit(action, request, detail = {}) {
  const entry = {
    ts: now(),
    action,
    user: request?.user
      ? { id: request.user.id, role: request.user.role, email: request.user.email }
      : null,
    ip: request?.ip || request?.headers?.['x-forwarded-for'] || '',
    detail
  };
  try {
    fs.appendFileSync(AUDIT_LOG_PATH, `${JSON.stringify(entry)}\n`);
  } catch (err) {
    fastify.log.error(err, 'audit log failed');
  }
}

function isAllowedFile(fileName) {
  const ext = path.extname(fileName || '').toLowerCase();
  if (!ext) return false;
  return ALLOWED_EXTENSIONS.has(ext);
}

function validateFileType(fileName, mimeType) {
  const ext = path.extname(fileName || '').toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return '不支持的文件类型';
  }
  if (!mimeType) return null;
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return '不支持的文件类型';
  }
  if (mimeType === 'application/octet-stream') {
    return null;
  }
  const allowed = EXTENSION_MIME_MAP[ext];
  if (Array.isArray(allowed) && allowed.length && !allowed.includes(mimeType)) {
    return `文件类型与扩展名不匹配：${mimeType}`;
  }
  return null;
}

function validateStatusTransition(currentStatus, nextStatus) {
  if (!currentStatus || currentStatus === nextStatus) return null;
  const allowed = STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    return `状态流转无效：${currentStatus} -> ${nextStatus}`;
  }
  return null;
}

function validateSubmissionDetails(type, details) {
  const requiredFields = SUBMISSION_FIELD_SCHEMA[type] || [];
  if (!requiredFields.length) return null;
  if (!details || typeof details !== 'object') {
    return '缺少阶段内容';
  }
  const missing = requiredFields.filter(key => {
    const value = details ? details[key] : '';
    return !value || !String(value).trim();
  });
  if (!missing.length) {
    if (type === 'midterm' && details?.demoLink) {
      const demoLink = String(details.demoLink || '').trim();
      if (demoLink && !/^https?:\/\//i.test(demoLink)) {
        return '演示链接必须以 http(s) 开头';
      }
    }
    return null;
  }
  const labels = missing.map(key => SUBMISSION_FIELD_LABELS[key] || key).join('、');
  return `缺少必填字段：${labels}`;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(text) {
  const normalized = String(text || '').replace(/-/g, '+').replace(/_/g, '/');
  const padLength = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
  return Buffer.from(`${normalized}${'='.repeat(padLength)}`, 'base64');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hashed = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
  return `scrypt$${salt}$${hashed}`;
}

function verifyPassword(password, storedHash) {
  const parts = String(storedHash || '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hash] = parts;
  const derived = crypto.scryptSync(String(password || ''), salt, 64).toString('hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  const derivedBuffer = Buffer.from(derived, 'hex');
  if (hashBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, derivedBuffer);
}

function createToken(payload) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const exp = issuedAt + Math.max(1, AUTH_TOKEN_TTL_HOURS) * 3600;
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: issuedAt, exp };
  const data = `${toBase64Url(JSON.stringify(header))}.${toBase64Url(JSON.stringify(body))}`;
  const signature = toBase64Url(
    crypto.createHmac('sha256', AUTH_SECRET).update(data).digest()
  );
  return { token: `${data}.${signature}`, exp };
}

function verifyToken(token) {
  const value = String(token || '').trim();
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signature] = parts;
  const data = `${headerPart}.${payloadPart}`;
  const expected = toBase64Url(
    crypto.createHmac('sha256', AUTH_SECRET).update(data).digest()
  );
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
  let payload;
  try {
    payload = JSON.parse(fromBase64Url(payloadPart).toString('utf8'));
  } catch (err) {
    return null;
  }
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function getAuthToken(request) {
  const authHeader = request.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const legacyToken = request.headers['x-auth-token'];
  if (legacyToken) return String(legacyToken);
  return null;
}

function getUserFromToken(token) {
  const payload = verifyToken(token);
  if (!payload || !payload.sub) return null;
  return db.get(
    'SELECT id, name, email, role, avatar_url FROM users WHERE id = ?',
    [payload.sub]
  ) || null;
}

function requireAuth(request, reply) {
  if (request.user) return true;
  reply.code(401);
  reply.send({ error: '未登录' });
  return false;
}

function requireRole(request, reply, roles) {
  if (!requireAuth(request, reply)) return false;
  if (!roles.includes(request.user.role)) {
    reply.code(403);
    reply.send({ error: '权限不足' });
    return false;
  }
  return true;
}

function buildProjectFilters(query, alias = '') {
  const { status, keyword, className } = query || {};
  const prefix = alias ? `${alias}.` : '';
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push(`${prefix}status = ?`);
    params.push(status);
  }
  if (className) {
    conditions.push(`${prefix}class_name = ?`);
    params.push(className);
  }
  if (keyword) {
    conditions.push(`(${prefix}title LIKE ? OR ${prefix}summary LIKE ?)`);
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  return { conditions, params };
}

function toCsvValue(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsvLine(values) {
  return values.map(toCsvValue).join(',');
}

function streamZip(reply, filename, buildArchive) {
  reply
    .header('Content-Type', 'application/zip')
    .header('Content-Disposition', `attachment; filename="${filename}"`);
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', err => {
    throw err;
  });
  reply.send(archive);
  buildArchive(archive);
  archive.finalize();
}

function appendFileSafe(archive, absolutePath, archivePath, missing) {
  if (!fs.existsSync(absolutePath)) {
    missing.push(archivePath);
    return;
  }
  archive.file(absolutePath, { name: archivePath });
}

ensureDir(UPLOAD_DIR);
ensureDir(LOG_DIR);
if (AUTH_SECRET === 'change-me-in-production') {
  fastify.log.warn('AUTH_SECRET 未设置，建议在生产环境中设置安全密钥。');
}

fastify.register(require('@fastify/cors'), { origin: true });
fastify.register(require('@fastify/multipart'), {
  limits: { fileSize: UPLOAD_MAX_BYTES }
});
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../web'),
  prefix: '/',
  decorateReply: false
});
fastify.register(require('@fastify/static'), {
  root: UPLOAD_DIR,
  prefix: '/uploads/',
  decorateReply: false
});

fastify.addHook('preHandler', (request, reply, done) => {
  if (!request.url.startsWith(API_PREFIX)) return done();
  const token = getAuthToken(request);
  if (!token) return done();
  const user = getUserFromToken(token);
  if (user) {
    request.user = user;
  }
  done();
});

function insertProjectLog(projectId, status, note = '') {
  db.run(
    'INSERT INTO project_logs (project_id, status, note, created_at) VALUES (?, ?, ?, ?)',
    [projectId, status, note, now()]
  );
}

function updateProjectStatus(projectId, status, note) {
  db.run('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?', [
    status,
    now(),
    projectId
  ]);
  insertProjectLog(projectId, status, note || '');
}

function getProject(projectId) {
  return db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
}

function getSubmissionAttachments(submissionId, fallback) {
  const rows = db.all(
    'SELECT file_name, file_path, file_size FROM attachments WHERE submission_id = ?',
    [submissionId]
  );
  if (rows.length) {
    return rows.map(row => ({
      name: row.file_name,
      path: row.file_path,
      size: row.file_size,
      url: `/uploads/${toUrlPath(row.file_path)}`
    }));
  }
  return parseAttachmentList(fallback).map(att => ({
    ...att,
    url: `/uploads/${toUrlPath(att.path)}`
  }));
}

function getProjectDetail(projectId) {
  const project = getProject(projectId);
  if (!project) return null;

  const members = db.all(
    `SELECT u.id, u.name, u.email, u.avatar_url, pm.role
     FROM project_members pm
     JOIN users u ON pm.user_id = u.id
     WHERE pm.project_id = ?
     ORDER BY pm.created_at ASC`,
    [projectId]
  );
  const submissions = db.all(
    'SELECT * FROM submissions WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  ).map(row => ({
    ...row,
    details: safeParseJson(row.details),
    attachments: getSubmissionAttachments(row.id, row.attachments)
  }));

  const logs = db.all(
    'SELECT * FROM project_logs WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );

  return { project, members, submissions, logs };
}

function getProjectComments(projectId) {
  return db.all(
    `SELECT c.id, c.content, c.created_at, u.id AS user_id, u.name, u.email, u.role, u.avatar_url
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.project_id = ?
     ORDER BY c.created_at ASC`,
    [projectId]
  );
}

function getProjectScores(projectId) {
  return db.all(
    `SELECT rs.id, rs.submission_id, rs.reviewer_id, rs.role, rs.scores, rs.total_score,
            rs.comment, rs.created_at, rs.updated_at, u.name AS reviewer_name, u.email AS reviewer_email
     FROM review_scores rs
     JOIN submissions s ON s.id = rs.submission_id
     JOIN users u ON u.id = rs.reviewer_id
     WHERE s.project_id = ?
     ORDER BY rs.updated_at DESC`,
    [projectId]
  );
}

function canAccessProject(user, project) {
  if (!user || !project) return false;
  if (user.role === 'teacher' || user.role === 'judge') return true;
  if (!project.created_by) return false;
  return Number(project.created_by) === Number(user.id);
}

function syncLegacyAttachments() {
  const existing = new Set(
    db.all('SELECT submission_id, file_path FROM attachments').map(
      row => `${row.submission_id}:${row.file_path}`
    )
  );
  const submissions = db.all(
    'SELECT id, attachments, created_at FROM submissions WHERE attachments IS NOT NULL AND attachments != ""'
  );
  submissions.forEach(submission => {
    const attachments = parseAttachmentList(submission.attachments);
    attachments.forEach(att => {
      const key = `${submission.id}:${att.path}`;
      if (existing.has(key)) return;
      db.run(
        'INSERT INTO attachments (submission_id, file_name, file_path, file_size, created_at) VALUES (?, ?, ?, ?, ?)',
        [
          submission.id,
          att.name || '',
          att.path || '',
          att.size || 0,
          submission.created_at || now()
        ]
      );
      existing.add(key);
    });
  });
}

function normalizeMemberIds(value) {
  if (!Array.isArray(value)) return [];
  const ids = value
    .map(id => Number.parseInt(String(id || ''), 10))
    .filter(id => Number.isFinite(id) && id > 0);
  return Array.from(new Set(ids));
}

function normalizeScoreTemplateCriteria(criteria) {
  if (!Array.isArray(criteria)) return null;
  const seen = new Set();
  const normalized = [];
  criteria.forEach(item => {
    if (!item) return;
    const label = String(item.label || '').trim();
    const key = String(item.key || label || '').trim();
    const max = Number(item.max);
    if (!label || !key || !Number.isFinite(max) || max <= 0) return;
    const safeKey = key.replace(/\s+/g, '_').toLowerCase();
    if (seen.has(safeKey)) return;
    seen.add(safeKey);
    normalized.push({ key: safeKey, label, max });
  });
  return normalized.length ? normalized : null;
}

function addProjectMembers(projectId, memberIds, role = 'member') {
  if (!memberIds.length) return;
  const placeholders = memberIds.map(() => '?').join(',');
  const rows = db.all(
    `SELECT id FROM users WHERE id IN (${placeholders})`,
    memberIds
  );
  const validIds = new Set(rows.map(row => row.id));
  const createdAt = now();
  memberIds.forEach(id => {
    if (!validIds.has(id)) return;
    const existing = db.get(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, id]
    );
    if (existing) return;
    db.run(
      'INSERT INTO project_members (project_id, user_id, role, created_at) VALUES (?, ?, ?, ?)',
      [projectId, id, role, createdAt]
    );
  });
}

function canRegisterTeacher(inviteCode) {
  const existing = db.get('SELECT id FROM users WHERE role = ?', ['teacher']);
  if (!existing) return true;
  if (!TEACHER_INVITE_CODE) return false;
  return String(inviteCode || '').trim() === TEACHER_INVITE_CODE;
}

function canRegisterJudge(inviteCode) {
  if (JUDGE_INVITE_CODE) {
    return String(inviteCode || '').trim() === JUDGE_INVITE_CODE;
  }
  if (TEACHER_INVITE_CODE) {
    return String(inviteCode || '').trim() === TEACHER_INVITE_CODE;
  }
  return true;
}

async function requestGitea(pathname, options = {}) {
  if (!GITEA_BASE_URL || !GITEA_ADMIN_TOKEN) {
    throw new Error('Gitea 未配置');
  }
  if (typeof fetch !== 'function') {
    throw new Error('当前 Node 版本不支持 fetch');
  }
  const url = new URL(pathname, GITEA_BASE_URL);
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `token ${GITEA_ADMIN_TOKEN}`,
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      data = { message: text };
    }
  }
  return { ok: res.ok, status: res.status, data };
}

async function ensureGiteaRepo(project, request) {
  if (!project || project.gitea_repo_url) return project?.gitea_repo_url || null;
  if (!GITEA_BASE_URL || !GITEA_ADMIN_TOKEN || !GITEA_DEFAULT_OWNER) return null;

  const baseName = slugifyRepoName(project.title) || `project-${project.id}`;
  const repoName = `${baseName}-${project.id}`.replace(/-+/g, '-');
  const payload = {
    name: repoName,
    description: project.summary || '',
    private: GITEA_PRIVATE_REPO
  };

  const tryCreate = async (endpoint) => {
    return requestGitea(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  };

  let result = await tryCreate(`/api/v1/orgs/${encodeURIComponent(GITEA_DEFAULT_OWNER)}/repos`);
  if (!result.ok && result.status === 404) {
    result = await tryCreate(`/api/v1/admin/users/${encodeURIComponent(GITEA_DEFAULT_OWNER)}/repos`);
  }

  if (!result.ok && result.status !== 409) {
    const message = result.data?.message || 'Gitea 创建仓库失败';
    throw new Error(message);
  }

  const repoUrl = result.data?.html_url
    || `${GITEA_BASE_URL.replace(/\/$/, '')}/${GITEA_DEFAULT_OWNER}/${repoName}`;

  db.run('UPDATE projects SET gitea_repo_url = ?, updated_at = ? WHERE id = ?', [
    repoUrl,
    now(),
    project.id
  ]);
  logAudit('gitea.repo.create', request, { projectId: project.id, repoUrl });
  return repoUrl;
}

fastify.get(`${API_PREFIX}/health`, async () => ({ ok: true }));

fastify.post(`${API_PREFIX}/auth/register`, async (request, reply) => {
  const payload = request.body || {};
  const name = String(payload.name || '').trim();
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || '');
  const roleInput = String(payload.role || '').trim();
  const inviteCode = String(payload.inviteCode || '').trim();
  const avatarUrl = String(payload.avatarUrl || '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    reply.code(400);
    return { error: '邮箱格式无效' };
  }
  if (password.length < 6) {
    reply.code(400);
    return { error: '密码至少 6 位' };
  }

  const existing = db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    reply.code(409);
    return { error: '邮箱已注册' };
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
    'INSERT INTO users (name, email, password_hash, role, avatar_url, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, hashPassword(password), role, avatarUrl, createdAt]
  );

  const user = { id: info.lastInsertRowid, name, email, role, avatar_url: avatarUrl };
  const { token, exp } = createToken({ sub: user.id, role: user.role, email: user.email });
  logAudit('auth.register', request, { userId: user.id, role: user.role });
  return { user, token, expiresAt: exp };
});

fastify.post(`${API_PREFIX}/auth/login`, async (request, reply) => {
  const payload = request.body || {};
  const identifier = String(payload.email || payload.username || '').trim(); // Accept 'email' field as generic identifier
  const password = String(payload.password || '');
  
  if (!identifier || !password) {
    reply.code(400);
    return { error: '账号与密码必填' };
  }

  // Find user by email OR name (username)
  const user = db.get(
    'SELECT id, name, email, role, avatar_url, password_hash FROM users WHERE email = ? OR name = ?',
    [identifier, identifier]
  );

  if (!user || !verifyPassword(password, user.password_hash)) {
    reply.code(401);
    return { error: '账号或密码错误' };
  }

  const { token, exp } = createToken({ sub: user.id, role: user.role, email: user.email });
  logAudit('auth.login', request, { userId: user.id });
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url },
    token,
    expiresAt: exp
  };
});

fastify.get(`${API_PREFIX}/auth/me`, async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  return { user: request.user };
});

fastify.patch(`${API_PREFIX}/users/me`, async (request, reply) => {
  if (!requireAuth(request, reply)) return;
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
    'SELECT id, name, email, role, avatar_url FROM users WHERE id = ?',
    [request.user.id]
  );
  logAudit('user.profile.update', request, { userId: request.user.id });
  return { user: updated };
});

fastify.get(`${API_PREFIX}/users/search`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
  const keyword = String(request.query?.keyword || '').trim();
  if (!keyword) {
    return { users: [] };
  }
  const like = `%${keyword}%`;
  const rows = db.all(
    `SELECT id, name, email, role, avatar_url FROM users
     WHERE name LIKE ? OR email LIKE ?
     ORDER BY created_at DESC
     LIMIT 10`,
    [like, like]
  );
  return { users: rows };
});

fastify.get(`${API_PREFIX}/admin/users`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const keyword = String(request.query?.keyword || '').trim();
  const role = String(request.query?.role || '').trim();
  const conditions = [];
  const params = [];
  if (keyword) {
    conditions.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }
  let sql = 'SELECT id, name, email, role, avatar_url, created_at FROM users';
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ' ORDER BY created_at DESC';
  const users = db.all(sql, params);
  return { users };
});

fastify.post(`${API_PREFIX}/admin/users/:id/reset-password`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
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

fastify.post(`${API_PREFIX}/projects`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher'])) return;
  const payload = request.body || {};
  const title = String(payload.title || '').trim();
  if (!title) {
    reply.code(400);
    return { error: '项目名称必填' };
  }

  const summary = String(payload.summary || '').trim();
  const teamMembers = String(payload.teamMembers || '').trim();
  const className = String(payload.className || '').trim();
  const giteaRepoUrl = String(payload.giteaRepoUrl || '').trim();
  const memberIds = normalizeMemberIds(payload.memberIds);
  const createdAt = now();
  const createdBy = request.user.id;

  if (giteaRepoUrl && !/^https?:\/\//i.test(giteaRepoUrl)) {
    reply.code(400);
    return { error: 'Gitea 仓库地址格式无效' };
  }

  const info = db.run(
    `INSERT INTO projects (title, summary, team_members, class_name, status, created_at, updated_at, created_by, gitea_repo_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  , [
    title,
    summary,
    teamMembers,
    className,
    'submitted',
    createdAt,
    createdAt,
    createdBy,
    giteaRepoUrl
  ]);

  const projectId = info.lastInsertRowid;
  insertProjectLog(projectId, 'submitted', '立项提交');
  addProjectMembers(projectId, [createdBy], 'owner');
  if (memberIds.length) {
    addProjectMembers(projectId, memberIds, 'member');
  }

  const project = getProject(projectId);
  logAudit('project.create', request, { projectId });
  return { project };
});

fastify.get(`${API_PREFIX}/projects`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
  const { conditions, params } = buildProjectFilters(request.query);
  if (request.user.role === 'student') {
    conditions.push('(created_by = ? OR id IN (SELECT project_id FROM project_members WHERE user_id = ?))');
    params.push(request.user.id, request.user.id);
  }

  let sql = 'SELECT * FROM projects';
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ' ORDER BY updated_at DESC';

  const projects = db.all(sql, params);
  return { projects };
});

fastify.get(`${API_PREFIX}/exports/projects.csv`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const { conditions, params } = buildProjectFilters(request.query);
  let sql = 'SELECT id, title, class_name, team_members, summary, status, created_at, updated_at FROM projects';
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ' ORDER BY updated_at DESC';

  const rows = db.all(sql, params);
  const header = [
    '项目ID',
    '项目名称',
    '班级/组别',
    '团队成员',
    '项目简介',
    '状态',
    '创建时间',
    '更新时间'
  ];
  const lines = [toCsvLine(header)];
  rows.forEach(row => {
    lines.push(toCsvLine([
      row.id,
      row.title,
      row.class_name || '',
      row.team_members || '',
      row.summary || '',
      row.status,
      row.created_at,
      row.updated_at
    ]));
  });

  logAudit('export.projects.csv', request, { total: rows.length, filters: request.query || {} });
  reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', 'attachment; filename="projects.csv"')
    .send(lines.join('\n'));
});

fastify.get(`${API_PREFIX}/exports/attachments.zip`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const { conditions, params } = buildProjectFilters(request.query, 'p');
  let sql = `
    SELECT a.file_name, a.file_path, s.type AS submission_type, s.id AS submission_id, s.project_id
    FROM attachments a
    JOIN submissions s ON s.id = a.submission_id
    JOIN projects p ON p.id = s.project_id
  `;
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ' ORDER BY s.project_id, s.created_at DESC';
  const rows = db.all(sql, params);
  logAudit('export.attachments.zip', request, { total: rows.length, filters: request.query || {} });

  streamZip(reply, 'attachments.zip', (archive) => {
    const missing = [];
    rows.forEach(row => {
      const safeType = sanitizeName(row.submission_type || 'submission');
      const safeName = sanitizeName(row.file_name || 'file');
      const archivePath = `project-${row.project_id}/${safeType}/${row.submission_id}_${safeName}`;
      const absolutePath = path.join(UPLOAD_DIR, row.file_path);
      appendFileSafe(archive, absolutePath, archivePath, missing);
    });
    if (missing.length) {
      archive.append(missing.join('\n'), { name: 'missing_files.txt' });
    }
  });
});

fastify.get(`${API_PREFIX}/showcase`, async (request) => {
  const { conditions, params } = buildProjectFilters(request.query, 'p');
  let sql = `
    SELECT
      p.id AS project_id,
      p.title AS project_title,
      p.summary AS project_summary,
      p.team_members AS project_team_members,
      p.class_name AS project_class_name,
      p.status AS project_status,
      p.created_at AS project_created_at,
      p.updated_at AS project_updated_at,
      s.id AS submission_id,
      s.title AS submission_title,
      s.content AS submission_content,
      s.details AS submission_details,
      s.attachments AS submission_attachments,
      s.created_at AS submission_created_at
    FROM projects p
    JOIN submissions s ON s.project_id = p.id
    WHERE s.type = 'showcase'
  `;
  if (conditions.length) {
    sql += ` AND ${conditions.join(' AND ')}`;
  }
  sql += ` ORDER BY s.created_at DESC `;

  const rows = db.all(sql, params);
  const items = rows.map(row => ({
    project: {
      id: row.project_id,
      title: row.project_title,
      summary: row.project_summary,
      team_members: row.project_team_members,
      class_name: row.project_class_name,
      status: row.project_status,
      created_at: row.project_created_at,
      updated_at: row.project_updated_at
    },
    showcase: {
      id: row.submission_id,
      title: row.submission_title,
      content: row.submission_content,
      details: safeParseJson(row.submission_details),
      created_at: row.submission_created_at,
      attachments: getSubmissionAttachments(row.submission_id, row.submission_attachments)
    }
  }));

  return { items };
});

fastify.get(`${API_PREFIX}/projects/:id`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
  const projectId = parseProjectId(request.params.id);
  if (!projectId) {
    reply.code(400);
    return { error: '项目ID无效' };
  }

  const project = getProject(projectId);
  if (!project) {
    reply.code(404);
    return { error: '项目不存在' };
  }

  if (!canAccessProject(request.user, project)) {
    reply.code(403);
    return { error: '无权限访问该项目' };
  }

  const detail = getProjectDetail(projectId);
  return detail;
});

fastify.patch(`${API_PREFIX}/projects/:id`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher'])) return;
  const projectId = parseProjectId(request.params.id);
  if (!projectId) {
    reply.code(400);
    return { error: '项目ID无效' };
  }

  const project = getProject(projectId);
  if (!project) {
    reply.code(404);
    return { error: '项目不存在' };
  }

  if (!canAccessProject(request.user, project)) {
    reply.code(403);
    return { error: '无权限操作该项目' };
  }

  const payload = request.body || {};
  const giteaRepoUrl = String(payload.giteaRepoUrl || '').trim();
  if (giteaRepoUrl && !/^https?:\/\//i.test(giteaRepoUrl)) {
    reply.code(400);
    return { error: 'Gitea 仓库地址格式无效' };
  }

  db.run(
    'UPDATE projects SET gitea_repo_url = ?, updated_at = ? WHERE id = ?',
    [giteaRepoUrl, now(), projectId]
  );
  logAudit('project.update', request, { projectId, giteaRepoUrl });
  return { success: true };
});

fastify.post(`${API_PREFIX}/projects/:id/members`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher'])) return;
  const projectId = parseProjectId(request.params.id);
  if (!projectId) {
    reply.code(400);
    return { error: '项目ID无效' };
  }

  const project = getProject(projectId);
  if (!project) {
    reply.code(404);
    return { error: '项目不存在' };
  }
  if (!canAccessProject(request.user, project)) {
    reply.code(403);
    return { error: '无权限操作该项目' };
  }

  const payload = request.body || {};
  const memberIds = normalizeMemberIds(payload.memberIds);
  if (!memberIds.length) {
    reply.code(400);
    return { error: '成员列表为空' };
  }
  addProjectMembers(projectId, memberIds, 'member');
  logAudit('project.members.add', request, { projectId, memberIds });
  return { success: true };
});

fastify.get(`${API_PREFIX}/projects/:id/attachments.zip`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const projectId = parseProjectId(request.params.id);
  if (!projectId) {
    reply.code(400);
    return { error: '项目ID无效' };
  }
  const project = getProject(projectId);
  if (!project) {
    reply.code(404);
    return { error: '项目不存在' };
  }

  const rows = db.all(
    `SELECT a.file_name, a.file_path, s.type AS submission_type, s.id AS submission_id
     FROM attachments a
     JOIN submissions s ON s.id = a.submission_id
     WHERE s.project_id = ?
     ORDER BY s.created_at DESC`,
    [projectId]
  );
  logAudit('project.attachments.zip', request, { projectId, total: rows.length });

  streamZip(reply, `project-${projectId}-attachments.zip`, (archive) => {
    const missing = [];
    rows.forEach(row => {
      const safeType = sanitizeName(row.submission_type || 'submission');
      const safeName = sanitizeName(row.file_name || 'file');
      const archivePath = `project-${projectId}/${safeType}/${row.submission_id}_${safeName}`;
      const absolutePath = path.join(UPLOAD_DIR, row.file_path);
      appendFileSafe(archive, absolutePath, archivePath, missing);
    });
    if (missing.length) {
      archive.append(missing.join('\n'), { name: 'missing_files.txt' });
    }
  });
});

fastify.get(`${API_PREFIX}/projects/:id/archive.zip`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const projectId = parseProjectId(request.params.id);
  if (!projectId) {
    reply.code(400);
    return { error: '项目ID无效' };
  }
  const detail = getProjectDetail(projectId);
  if (!detail) {
    reply.code(404);
    return { error: '项目不存在' };
  }

  const comments = getProjectComments(projectId);
  const scores = getProjectScores(projectId);
  const attachments = db.all(
    `SELECT a.file_name, a.file_path, s.type AS submission_type, s.id AS submission_id
     FROM attachments a
     JOIN submissions s ON s.id = a.submission_id
     WHERE s.project_id = ?
     ORDER BY s.created_at DESC`,
    [projectId]
  );
  logAudit('project.archive.zip', request, { projectId, total: attachments.length });

  streamZip(reply, `project-${projectId}-archive.zip`, (archive) => {
    const missing = [];
    archive.append(JSON.stringify(detail.project, null, 2), { name: 'project.json' });
    archive.append(JSON.stringify(detail.members || [], null, 2), { name: 'members.json' });
    archive.append(JSON.stringify(detail.submissions || [], null, 2), { name: 'submissions.json' });
    archive.append(JSON.stringify(detail.logs || [], null, 2), { name: 'status_logs.json' });
    archive.append(JSON.stringify(comments || [], null, 2), { name: 'comments.json' });
    archive.append(JSON.stringify(scores || [], null, 2), { name: 'scores.json' });

    attachments.forEach(row => {
      const safeType = sanitizeName(row.submission_type || 'submission');
      const safeName = sanitizeName(row.file_name || 'file');
      const archivePath = `attachments/${safeType}/${row.submission_id}_${safeName}`;
      const absolutePath = path.join(UPLOAD_DIR, row.file_path);
      appendFileSafe(archive, absolutePath, archivePath, missing);
    });

    if (missing.length) {
      archive.append(missing.join('\n'), { name: 'missing_files.txt' });
    }
  });
});

fastify.post(`${API_PREFIX}/projects/:id/status`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const projectId = parseProjectId(request.params.id);
  if (!projectId) {
    reply.code(400);
    return { error: '项目ID无效' };
  }

  const payload = request.body || {};
  const nextStatus = String(payload.status || '').trim();
  const note = String(payload.note || '').trim();

  if (!PROJECT_STATUSES.has(nextStatus)) {
    reply.code(400);
    return { error: '项目状态无效' };
  }

  const project = getProject(projectId);
  if (!project) {
    reply.code(404);
    return { error: '项目不存在' };
  }
  const transitionError = validateStatusTransition(project.status, nextStatus);
  if (transitionError) {
    reply.code(400);
    return { error: transitionError };
  }

  updateProjectStatus(projectId, nextStatus, note);
  logAudit('project.status.update', request, { projectId, status: nextStatus });
  if (nextStatus === 'approved') {
    try {
      await ensureGiteaRepo(getProject(projectId), request);
    } catch (err) {
      fastify.log.error(err, 'auto create gitea repo failed');
      logAudit('gitea.repo.error', request, { projectId, message: err.message });
    }
  }
  return { success: true };
});

// --- Dev Logs APIs ---
fastify.get(`${API_PREFIX}/projects/:id/logs`, async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const projectId = parseProjectId(request.params.id);
  const logs = db.all(
    `SELECT l.id, l.content, l.tags, l.created_at, u.name AS author_name, u.avatar_url
     FROM dev_logs l
     JOIN users u ON u.id = l.author_id
     WHERE l.project_id = ?
     ORDER BY l.created_at DESC`,
    [projectId]
  );
  return { logs };
});

fastify.post(`${API_PREFIX}/projects/:id/logs`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher'])) return;
  const projectId = parseProjectId(request.params.id);
  const payload = request.body || {};
  const content = String(payload.content || '').trim();
  const tags = String(payload.tags || '').trim();

  if (!content) {
    reply.code(400);
    return { error: '日志内容必填' };
  }

  db.run(
    'INSERT INTO dev_logs (project_id, author_id, content, tags, created_at) VALUES (?, ?, ?, ?, ?)',
    [projectId, request.user.id, content, tags, now()]
  );
  return { success: true };
});

// --- Resource Request APIs ---
fastify.get(`${API_PREFIX}/projects/:id/resources`, async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const projectId = parseProjectId(request.params.id);
  const requests = db.all(
    `SELECT r.*, u.name AS requester_name
     FROM resource_requests r
     JOIN users u ON u.id = r.requester_id
     WHERE r.project_id = ?
     ORDER BY r.created_at DESC`,
    [projectId]
  );
  return { requests };
});

fastify.post(`${API_PREFIX}/projects/:id/resources`, async (request, reply) => {
  if (!requireRole(request, reply, ['student'])) return;
  const projectId = parseProjectId(request.params.id);
  const payload = request.body || {};
  const type = String(payload.type || 'hardware');
  const itemName = String(payload.item_name || '').trim();
  const quantity = Number(payload.quantity) || 1;
  const reason = String(payload.reason || '').trim();

  if (!itemName) {
    reply.code(400);
    return { error: '物资名称必填' };
  }

  db.run(
    `INSERT INTO resource_requests (project_id, requester_id, type, item_name, quantity, reason, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [projectId, request.user.id, type, itemName, quantity, reason, now(), now()]
  );
  // Notify teacher? (Log for now)
  logAudit('resource.request', request, { projectId, item: itemName });
  return { success: true };
});

fastify.patch(`${API_PREFIX}/resources/:id/status`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const requestId = parseProjectId(request.params.id);
  const payload = request.body || {};
  const status = String(payload.status || '').trim();
  const replyText = String(payload.reply || '').trim();

  if (!['approved', 'rejected'].includes(status)) {
    reply.code(400);
    return { error: '状态无效' };
  }

  db.run(
    'UPDATE resource_requests SET status = ?, reply = ?, updated_at = ? WHERE id = ?',
    [status, replyText, now(), requestId]
  );
  return { success: true };
});

// --- Help Ticket APIs ---
fastify.get(`${API_PREFIX}/projects/:id/tickets`, async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const projectId = parseProjectId(request.params.id);
  const tickets = db.all(
    `SELECT t.*, u.name AS requester_name, u.avatar_url
     FROM help_tickets t
     JOIN users u ON u.id = t.requester_id
     WHERE t.project_id = ?
     ORDER BY t.status ASC, t.priority DESC, t.created_at DESC`, // Open first, then urgent
    [projectId]
  );
  return { tickets };
});

fastify.post(`${API_PREFIX}/projects/:id/tickets`, async (request, reply) => {
  if (!requireRole(request, reply, ['student'])) return;
  const projectId = parseProjectId(request.params.id);
  const payload = request.body || {};
  const title = String(payload.title || '').trim();
  const description = String(payload.description || '').trim();
  const priority = String(payload.priority || 'normal');

  if (!title) {
    reply.code(400);
    return { error: '标题必填' };
  }

  db.run(
    `INSERT INTO help_tickets (project_id, requester_id, title, description, priority, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`,
    [projectId, request.user.id, title, description, priority, now(), now()]
  );
  logAudit('ticket.create', request, { projectId, title });
  return { success: true };
});

fastify.patch(`${API_PREFIX}/tickets/:id`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher'])) return;
  const ticketId = parseProjectId(request.params.id);
  const payload = request.body || {};
  
  // Logic: Student can close their own ticket. Teacher can resolve/reply.
  const ticket = db.get('SELECT * FROM help_tickets WHERE id = ?', [ticketId]);
  if (!ticket) {
    reply.code(404);
    return { error: '工单不存在' };
  }

  const status = payload.status || ticket.status;
  const resolution = payload.resolution || ticket.resolution;

  db.run(
    'UPDATE help_tickets SET status = ?, resolution = ?, updated_at = ? WHERE id = ?',
    [status, resolution, now(), ticketId]
  );
  return { success: true };
});

// --- Admin Resource API ---
fastify.get(`${API_PREFIX}/admin/resources`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const status = request.query.status;
  let sql = `SELECT r.*, u.name AS requester_name, p.title AS project_title
             FROM resource_requests r
             JOIN users u ON u.id = r.requester_id
             JOIN projects p ON p.id = r.project_id`;
  const params = [];
  if (status) {
    sql += ' WHERE r.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY r.created_at DESC';
  const requests = db.all(sql, params);
  return { requests };
});

// --- Milestone/WBS API ---
fastify.get(`${API_PREFIX}/projects/:id/milestones`, async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const projectId = parseProjectId(request.params.id);
  const milestones = db.all(
    `SELECT * FROM project_milestones
     WHERE project_id = ?
     ORDER BY COALESCE(sort_order, id) ASC, id ASC`,
    [projectId]
  );
  return { milestones };
});

fastify.post(`${API_PREFIX}/projects/:id/milestones`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher'])) return;
  const projectId = parseProjectId(request.params.id);
  const payload = request.body || {};
  // Simple WBS task creation
  const title = String(payload.title || '').trim();
  const rawPhase = payload.phase ?? payload.description ?? 'm1';
  const description = String(rawPhase || 'm1').trim() || 'm1'; // reusing description field for phase/tag
  const rawParentId = payload.parent_id ?? payload.parentId ?? null;
  let parentId = rawParentId === '' ? null : rawParentId;
  if (parentId !== null && parentId !== undefined) {
    parentId = Number(parentId);
    if (Number.isNaN(parentId)) parentId = null;
  } else {
    parentId = null;
  }
  const rawSortOrder = payload.sort_order ?? payload.sortOrder ?? null;
  let sortOrder = rawSortOrder === '' ? null : rawSortOrder;
  if (sortOrder !== null && sortOrder !== undefined) {
    sortOrder = Number(sortOrder);
    if (Number.isNaN(sortOrder)) sortOrder = null;
  } else {
    sortOrder = null;
  }
  
  if (!title) { 
      reply.code(400);
      return { error: '任务名称必填' };
  }

  if (sortOrder === null) {
    const row = db.get(
      'SELECT MAX(COALESCE(sort_order, id)) AS max_order FROM project_milestones WHERE project_id = ? AND description = ? AND parent_id IS ?',
      [projectId, description, parentId]
    );
    const maxOrder = row && row.max_order !== null && row.max_order !== undefined ? Number(row.max_order) : null;
    sortOrder = Number.isFinite(maxOrder) ? maxOrder + 1 : 0;
  }

  const info = db.run(
    `INSERT INTO project_milestones (project_id, title, description, parent_id, sort_order, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [projectId, title, description, parentId, sortOrder, now(), now()]
  );
  return { success: true, id: info.lastInsertRowid };
});

fastify.patch(`${API_PREFIX}/milestones/:id`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher'])) return;
  const id = parseProjectId(request.params.id);
  const payload = request.body || {};
  const status = payload.status; // e.g. move to another phase or mark done
  const description = payload.phase ?? payload.description; // update phase
  const hasParent = Object.prototype.hasOwnProperty.call(payload, 'parent_id') || Object.prototype.hasOwnProperty.call(payload, 'parentId');
  const hasSort = Object.prototype.hasOwnProperty.call(payload, 'sort_order') || Object.prototype.hasOwnProperty.call(payload, 'sortOrder');

  // Construct update
  if (status) {
      db.run('UPDATE project_milestones SET status = ?, updated_at = ? WHERE id = ?', [status, now(), id]);
  }
  if (description !== undefined) {
      db.run('UPDATE project_milestones SET description = ?, updated_at = ? WHERE id = ?', [description, now(), id]);
  }
  if (hasParent) {
      const rawParentId = payload.parent_id ?? payload.parentId ?? null;
      let parentId = rawParentId === '' ? null : rawParentId;
      if (parentId !== null && parentId !== undefined) {
        parentId = Number(parentId);
        if (Number.isNaN(parentId)) parentId = null;
      } else {
        parentId = null;
      }
      db.run('UPDATE project_milestones SET parent_id = ?, updated_at = ? WHERE id = ?', [parentId, now(), id]);
  }
  if (hasSort) {
      const rawSortOrder = payload.sort_order ?? payload.sortOrder ?? null;
      let sortOrder = rawSortOrder === '' ? null : rawSortOrder;
      if (sortOrder !== null && sortOrder !== undefined) {
        sortOrder = Number(sortOrder);
        if (Number.isNaN(sortOrder)) sortOrder = null;
      } else {
        sortOrder = null;
      }
      db.run('UPDATE project_milestones SET sort_order = ?, updated_at = ? WHERE id = ?', [sortOrder, now(), id]);
  }
  return { success: true };
});

async function collectMultipart(request) {
  const fields = {};
  const tempFiles = [];

  for await (const part of request.parts()) {
    if (part.type === 'file') {
      if (!part.filename) continue;
      const fileError = validateFileType(part.filename, part.mimetype);
      if (fileError) {
        throw new Error(fileError);
      }
      const safeName = sanitizeName(part.filename) || 'upload';
      const tmpName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
      const tmpPath = path.join(os.tmpdir(), tmpName);
      await pump(part.file, fs.createWriteStream(tmpPath));
      if (part.file.truncated) {
        throw new Error(`文件大小超过限制 (${UPLOAD_MAX_MB}MB)`);
      }
      const stats = fs.statSync(tmpPath);
      if (stats.size > UPLOAD_MAX_BYTES) {
        throw new Error(`文件大小超过限制 (${UPLOAD_MAX_MB}MB)`);
      }
      tempFiles.push({ tmpPath, originalName: safeName });
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  return { fields, tempFiles };
}

function moveTempFiles(tempFiles, projectId, type) {
  const attachments = [];
  const safeType = sanitizeName(type);
  const targetDir = path.join(UPLOAD_DIR, `project-${projectId}`, safeType);
  ensureDir(targetDir);

  tempFiles.forEach(file => {
    const safeName = sanitizeName(file.originalName) || 'upload';
    const finalName = `${Date.now()}_${safeName}`;
    const finalPath = path.join(targetDir, finalName);
    fs.renameSync(file.tmpPath, finalPath);
    const stats = fs.statSync(finalPath);
    attachments.push({
      name: safeName,
      path: path.relative(UPLOAD_DIR, finalPath).replace(/\\/g, '/'),
      size: stats.size
    });
  });

  return attachments;
}

function cleanupTempFiles(tempFiles) {
  tempFiles.forEach(file => {
    try {
      fs.unlinkSync(file.tmpPath);
    } catch (err) {}
  });
}

fastify.post(`${API_PREFIX}/projects/:id/submissions`, async (request, reply) => {
  const projectId = parseProjectId(request.params.id);
  if (!projectId) {
    reply.code(400);
    return { error: '项目ID无效' };
  }
  const project = getProject(projectId);
  if (!project) {
    reply.code(404);
    return { error: '项目不存在' };
  }
  if (project.status === 'archived') {
    reply.code(400);
    return { error: '项目已归档，无法提交' };
  }

  let fields;
  let tempFiles;
  try {
    const collected = await collectMultipart(request);
    fields = collected.fields;
    tempFiles = collected.tempFiles;
  } catch (err) {
    cleanupTempFiles(tempFiles || []);
    reply.code(400);
    return { error: err.message || '提交失败' };
  }

  const type = String(fields.type || '').trim();
  
  // Auth Check
  if (type !== 'showcase') {
    if (!request.user) {
      cleanupTempFiles(tempFiles);
      reply.code(401);
      return { error: '未登录' };
    }
    if (!['student', 'teacher'].includes(request.user.role)) {
      cleanupTempFiles(tempFiles);
      reply.code(403);
      return { error: '权限不足' };
    }
    if (!canAccessProject(request.user, project)) {
      cleanupTempFiles(tempFiles);
      reply.code(403);
      return { error: '无权限提交到该项目' };
    }
  }

  if (!SUBMISSION_TYPES.has(type)) {
    cleanupTempFiles(tempFiles);
    reply.code(400);
    return { error: '提交类型无效' };
  }

  const title = String(fields.title || '').trim();
  const content = String(fields.content || '').trim();
  let details = safeParseJson(fields.details) || {};
  
  // Handle Anonymous Name
  if (type === 'showcase' && !request.user) {
    const studentName = String(fields.studentName || '').trim();
    if (studentName) {
      details.studentName = studentName; // Store in details
    }
  }

  const detailError = validateSubmissionDetails(type, details);
  if (detailError) {
    cleanupTempFiles(tempFiles);
    reply.code(400);
    return { error: detailError };
  }

  let autoStatus = null;
  if (type === 'proposal') {
    autoStatus = 'reviewing';
  } else if (type === 'midterm') {
    autoStatus = 'midterm_review';
  } else if (type === 'final') {
    autoStatus = 'final_review';
  }
  if (autoStatus) {
    const transitionError = validateStatusTransition(project.status, autoStatus);
    if (transitionError) {
      cleanupTempFiles(tempFiles);
      reply.code(400);
      return { error: transitionError };
    }
  }

  const attachments = moveTempFiles(tempFiles, projectId, type);
  // Use 0 for anonymous/guest submissions
  const submittedBy = request.user ? request.user.id : 0;

  const createdAt = now();
  const info = db.run(
    `INSERT INTO submissions (project_id, submitted_by, type, title, content, details, attachments, status, feedback, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  , [
    projectId,
    submittedBy,
    type,
    title,
    content,
    JSON.stringify(details),
    JSON.stringify(attachments),
    'submitted',
    '',
    createdAt
  ]);

  const submissionId = info.lastInsertRowid;
  attachments.forEach(att => {
    db.run(
      'INSERT INTO attachments (submission_id, file_name, file_path, file_size, created_at) VALUES (?, ?, ?, ?, ?)',
      [submissionId, att.name || '', att.path || '', att.size || 0, createdAt]
    );
  });

  if (autoStatus) {
    updateProjectStatus(projectId, autoStatus, `提交${type}`);
  } else {
    db.run('UPDATE projects SET updated_at = ? WHERE id = ?', [now(), projectId]);
  }

  logAudit('submission.create', request, { projectId, submissionId, type, userId: submittedBy });
  return { success: true, submissionId };
});

fastify.post(`${API_PREFIX}/submissions/:id/feedback`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const submissionId = parseProjectId(request.params.id);
  if (!submissionId) {
    reply.code(400);
    return { error: '提交ID无效' };
  }

  const payload = request.body || {};
  const status = String(payload.status || '').trim();
  const feedback = String(payload.feedback || '').trim();

  if (!SUBMISSION_STATUSES.has(status)) {
    reply.code(400);
    return { error: '反馈状态无效' };
  }

  const submission = db.get('SELECT * FROM submissions WHERE id = ?', [submissionId]);
  if (!submission) {
    reply.code(404);
    return { error: '提交记录不存在' };
  }

  const reviewedAt = now();
  db.run(
    'UPDATE submissions SET status = ?, feedback = ?, reviewed_at = ? WHERE id = ?',
    [status, feedback, reviewedAt, submissionId]
  );

  const existingFeedback = db.get(
    'SELECT id FROM feedback WHERE submission_id = ?',
    [submissionId]
  );
  if (existingFeedback) {
    db.run(
      'UPDATE feedback SET comment = ?, teacher_id = ?, created_at = ? WHERE id = ?',
      [feedback, request.user.id, reviewedAt, existingFeedback.id]
    );
  } else {
    db.run(
      'INSERT INTO feedback (submission_id, teacher_id, comment, created_at) VALUES (?, ?, ?, ?)',
      [submissionId, request.user.id, feedback, reviewedAt]
    );
  }

  logAudit('submission.feedback', request, { submissionId, status });
  return { success: true };
});

fastify.get(`${API_PREFIX}/submissions/:id/scores`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
  const submissionId = parseProjectId(request.params.id);
  if (!submissionId) {
    reply.code(400);
    return { error: '提交ID无效' };
  }

  const submission = db.get(
    `SELECT s.id, s.project_id, s.type, p.created_by
     FROM submissions s
     JOIN projects p ON p.id = s.project_id
     WHERE s.id = ?`,
    [submissionId]
  );
  if (!submission) {
    reply.code(404);
    return { error: '提交记录不存在' };
  }
  if (request.user.role === 'student' && Number(submission.created_by) !== Number(request.user.id)) {
    reply.code(403);
    return { error: '无权限查看评分' };
  }

  const rows = db.all(
    `SELECT rs.id, rs.submission_id, rs.reviewer_id, rs.role, rs.scores, rs.total_score,
            rs.comment, rs.created_at, rs.updated_at,
            u.name AS reviewer_name, u.email AS reviewer_email, u.avatar_url AS reviewer_avatar
     FROM review_scores rs
     JOIN users u ON u.id = rs.reviewer_id
     WHERE rs.submission_id = ?
     ORDER BY rs.updated_at DESC`,
    [submissionId]
  );
  return { scores: rows };
});

fastify.post(`${API_PREFIX}/submissions/:id/scores`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher', 'judge'])) return;
  const submissionId = parseProjectId(request.params.id);
  if (!submissionId) {
    reply.code(400);
    return { error: '提交ID无效' };
  }

  const submission = db.get(
    'SELECT id, type FROM submissions WHERE id = ?',
    [submissionId]
  );
  if (!submission) {
    reply.code(404);
    return { error: '提交记录不存在' };
  }

  const payload = request.body || {};
  const rawScores = payload.scores && typeof payload.scores === 'object' ? payload.scores : {};
  const comment = String(payload.comment || '').trim();
  const template = db.get('SELECT id, criteria FROM score_templates WHERE type = ?', [submission.type]);
  let scores = {};
  let totalScore = 0;

  if (template) {
    const criteria = safeParseJson(template.criteria) || [];
    if (!Array.isArray(criteria) || !criteria.length) {
      reply.code(400);
      return { error: '评分标准未配置' };
    }
    for (const item of criteria) {
      const value = Number(rawScores[item.key]);
      if (!Number.isFinite(value)) {
        reply.code(400);
        return { error: `评分项缺失：${item.label}` };
      }
      if (value < 0 || value > item.max) {
        reply.code(400);
        return { error: `评分项 ${item.label} 超出范围` };
      }
      scores[item.key] = value;
      totalScore += value;
    }
  } else {
    const fallbackTotal = Number(payload.totalScore);
    if (!Number.isFinite(fallbackTotal)) {
      reply.code(400);
      return { error: '评分标准未配置且总分无效' };
    }
    totalScore = fallbackTotal;
    scores = rawScores;
  }

  const existing = db.get(
    'SELECT id FROM review_scores WHERE submission_id = ? AND reviewer_id = ?',
    [submissionId, request.user.id]
  );
  const nowAt = now();
  if (existing) {
    db.run(
      'UPDATE review_scores SET scores = ?, total_score = ?, comment = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(scores), totalScore, comment, nowAt, existing.id]
    );
  } else {
    db.run(
      `INSERT INTO review_scores (submission_id, reviewer_id, role, scores, total_score, comment, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        submissionId,
        request.user.id,
        request.user.role,
        JSON.stringify(scores),
        totalScore,
        comment,
        nowAt,
        nowAt
      ]
    );
  }

  logAudit('submission.score', request, { submissionId, totalScore });
  return { success: true, totalScore };
});

fastify.get(`${API_PREFIX}/score-templates`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
  const type = String(request.query?.type || '').trim();
  const params = [];
  let sql = 'SELECT id, type, criteria, updated_at FROM score_templates';
  if (type) {
    sql += ' WHERE type = ?';
    params.push(type);
  }
  sql += ' ORDER BY updated_at DESC';
  const templates = db.all(sql, params);
  return { templates };
});

fastify.post(`${API_PREFIX}/score-templates`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const payload = request.body || {};
  const type = String(payload.type || '').trim();
  const criteria = normalizeScoreTemplateCriteria(payload.criteria);

  if (!SUBMISSION_TYPES.has(type)) {
    reply.code(400);
    return { error: '阶段类型无效' };
  }
  if (!criteria) {
    reply.code(400);
    return { error: '评分标准无效' };
  }

  const nowAt = now();
  const existing = db.get('SELECT id FROM score_templates WHERE type = ?', [type]);
  if (existing) {
    db.run(
      'UPDATE score_templates SET criteria = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(criteria), nowAt, existing.id]
    );
  } else {
    db.run(
      'INSERT INTO score_templates (type, criteria, updated_at) VALUES (?, ?, ?)',
      [type, JSON.stringify(criteria), nowAt]
    );
  }

  logAudit('score.template.update', request, { type });
  return { success: true };
});

fastify.delete(`${API_PREFIX}/score-templates/:id`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const templateId = parseProjectId(request.params.id);
  if (!templateId) {
    reply.code(400);
    return { error: '模板ID无效' };
  }
  db.run('DELETE FROM score_templates WHERE id = ?', [templateId]);
  logAudit('score.template.delete', request, { templateId });
  return { success: true };
});

fastify.get(`${API_PREFIX}/projects/:id/comments`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
  const projectId = parseProjectId(request.params.id);
  if (!projectId) {
    reply.code(400);
    return { error: '项目ID无效' };
  }
  const project = getProject(projectId);
  if (!project) {
    reply.code(404);
    return { error: '项目不存在' };
  }
  if (!canAccessProject(request.user, project)) {
    reply.code(403);
    return { error: '无权限查看讨论' };
  }

  const comments = getProjectComments(projectId);
  return { comments };
});

fastify.post(`${API_PREFIX}/projects/:id/comments`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
  const projectId = parseProjectId(request.params.id);
  if (!projectId) {
    reply.code(400);
    return { error: '项目ID无效' };
  }
  const project = getProject(projectId);
  if (!project) {
    reply.code(404);
    return { error: '项目不存在' };
  }
  if (!canAccessProject(request.user, project)) {
    reply.code(403);
    return { error: '无权限评论' };
  }

  const payload = request.body || {};
  const content = String(payload.content || '').trim();
  if (!content) {
    reply.code(400);
    return { error: '评论内容不能为空' };
  }
  const createdAt = now();
  db.run(
    'INSERT INTO comments (project_id, user_id, content, created_at) VALUES (?, ?, ?, ?)',
    [projectId, request.user.id, content, createdAt]
  );
  logAudit('comment.create', request, { projectId });
  return { success: true };
});

fastify.get(`${API_PREFIX}/announcements`, async () => {
  const announcements = db.all(
    `SELECT a.id, a.title, a.body, a.created_at, u.name AS author_name
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     ORDER BY a.created_at DESC
     LIMIT 10`
  );
  return { announcements };
});

fastify.post(`${API_PREFIX}/announcements`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const payload = request.body || {};
  const title = String(payload.title || '').trim();
  const body = String(payload.body || '').trim();
  if (!title) {
    reply.code(400);
    return { error: '公告标题必填' };
  }
  const createdAt = now();
  db.run(
    'INSERT INTO announcements (title, body, created_by, created_at) VALUES (?, ?, ?, ?)',
    [title, body, request.user.id, createdAt]
  );
  logAudit('announcement.create', request, { title });
  return { success: true };
});

fastify.delete(`${API_PREFIX}/announcements/:id`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const announcementId = parseProjectId(request.params.id);
  if (!announcementId) {
    reply.code(400);
    return { error: '公告ID无效' };
  }
  db.run('DELETE FROM announcements WHERE id = ?', [announcementId]);
  logAudit('announcement.delete', request, { announcementId });
  return { success: true };
});

fastify.get(`${API_PREFIX}/stats`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const { conditions, params } = buildProjectFilters(request.query);
  const whereSql = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const totalRow = db.get(`SELECT COUNT(*) AS count FROM projects${whereSql}`, params);
  const byStatus = db.all(
    `SELECT status, COUNT(*) AS count FROM projects${whereSql} GROUP BY status`,
    params
  );
  logAudit('stats.view', request, { filters: request.query || {} });
  return { total: totalRow ? totalRow.count : 0, byStatus };
});

// --- Resources API ---
const MATERIALS_DIR = path.join(__dirname, '../../content/materials');

fastify.get(`${API_PREFIX}/files/:project`, async (request, reply) => {
  // Note: Allow read access to materials for all authenticated users (or even public if needed)
  // if (!requireAuth(request, reply)) return; 

  const projectId = request.params.project;
  const subPath = request.query.path || '';
  
  // Security check
  if (subPath.includes('..') || projectId.includes('..')) {
    reply.code(400);
    return { error: 'Invalid path' };
  }

  const projectDir = path.join(MATERIALS_DIR, projectId);
  const targetDir = path.join(projectDir, subPath);

  // Prevent traversal out of materials dir
  if (!targetDir.startsWith(MATERIALS_DIR)) { 
     reply.code(403);
     return { error: 'Access denied' };
  }

  if (!fs.existsSync(targetDir)) {
    return { files: [] };
  }

  try {
    const dirents = fs.readdirSync(targetDir, { withFileTypes: true });
    const files = dirents.map(dirent => {
      let size = 0;
      if (dirent.isFile()) {
          try {
              size = fs.statSync(path.join(targetDir, dirent.name)).size;
          } catch (e) {}
      }
      return {
        name: dirent.name,
        isDirectory: dirent.isDirectory(),
        size: size,
        path: subPath ? path.join(subPath, dirent.name) : dirent.name
      };
    });
    // Sort: Folders first, then files
    files.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
        return a.isDirectory ? -1 : 1;
    });
    return { files };
  } catch (err) {
    fastify.log.error(err);
    return { files: [] };
  }
});

fastify.get(`${API_PREFIX}/download/*`, async (request, reply) => {
  const wildcard = request.params['*'];
  const parts = wildcard.split('/');
  
  if (parts.length < 2) {
    reply.code(400);
    return { error: 'Invalid path format' };
  }

  const projectId = parts[0];
  const filePath = parts.slice(1).join('/'); // Rejoin the rest
  
  if (filePath.includes('..') || projectId.includes('..')) {
    reply.code(400);
    return { error: 'Invalid path' };
  }
  
  const absolutePath = path.join(MATERIALS_DIR, projectId, filePath);
  
  if (!absolutePath.startsWith(MATERIALS_DIR)) {
      reply.code(403);
      return { error: 'Access denied' };
  }

  if (!fs.existsSync(absolutePath)) {
    reply.code(404);
    return { error: 'File not found' };
  }

  const filename = path.basename(absolutePath);
  const ext = path.extname(filename).toLowerCase();
  const mimeType = (EXTENSION_MIME_MAP[ext] && EXTENSION_MIME_MAP[ext][0]) || 'application/octet-stream';
  
  reply.header('Content-Type', mimeType);
  reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  
  const stream = fs.createReadStream(absolutePath);
  return reply.send(stream);
});

fastify.get(`${API_PREFIX}/mission/projects`, async (request, reply) => {
  // Public or Teacher only? Teacher only usually.
  // if (!requireRole(request, reply, ['teacher'])) return; 
  // Let's allow public for the big screen display scenario if needed, or stick to teacher.
  // Assuming teacher login on the big screen machine.
  
  const projects = db.all('SELECT id, title, team_members, updated_at FROM projects');
  
  const stats = projects.map(p => {
    const tasks = db.all('SELECT status FROM project_milestones WHERE project_id = ?', [p.id]);
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done' || t.status === 'completed').length; // Check status values
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    
    // Get last activity
    const lastLog = db.get('SELECT created_at FROM dev_logs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1', [p.id]);
    const lastActive = lastLog ? lastLog.created_at : p.updated_at;

    return {
      id: p.id,
      name: p.title,
      members: p.team_members,
      lastActive,
      taskStats: { total, done, progress }
    };
  });
  
  // Sort by activity
  stats.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
  
  return { projects: stats };
});

const start = async () => {
  try {
    db = await createDatabase(DB_PATH);
    syncLegacyAttachments();
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Innovation platform running at http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

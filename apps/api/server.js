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
const ASSESSMENT_DIR = path.join(__dirname, '../../storage/assessments');
const DEFAULT_WEB_ROOT = path.join(__dirname, '../web-vue/dist');
const WEB_ROOT = process.env.WEB_ROOT
  ? path.resolve(process.env.WEB_ROOT)
  : DEFAULT_WEB_ROOT;
const WEB_SPA_ENV = String(process.env.WEB_SPA || '').trim().toLowerCase();
const WEB_SPA = WEB_SPA_ENV
  ? WEB_SPA_ENV === 'true'
  : fs.existsSync(path.join(WEB_ROOT, 'index.html')) || fs.existsSync(path.join(DEFAULT_WEB_ROOT, 'index.html'));
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
const AI_API_BASE = String(process.env.AI_API_BASE || '').trim();
const AI_MODEL = String(process.env.AI_MODEL || '').trim();
const AI_TIMEOUT_MS = Number.parseInt(process.env.AI_TIMEOUT_MS || '20000', 10);
const COURSES_DIR = path.join(__dirname, '../../content/courses');
const COURSE_CATALOG_PATH = path.join(COURSES_DIR, 'catalog.json');
const DISCIPLINE_DATA_PATH = path.join(__dirname, '../../content/courses/disciplines/index.json');
const MATERIALS_DIR = path.join(__dirname, '../../content/materials');
const PORTAL_DIR = path.join(__dirname, '../../content/portal');
const PORTAL_COMPETITIONS_PATH = path.join(PORTAL_DIR, 'competitions.json');
const PORTAL_COMPETITION_DETAILS_DIR = path.join(PORTAL_DIR, 'competition-details');
const PORTAL_STORIES_PATH = path.join(PORTAL_DIR, 'stories.json');
const PORTAL_BANNERS_PATH = path.join(PORTAL_DIR, 'banners.json');

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
const ASSIGNMENT_STATUSES = new Set(['draft', 'published', 'archived']);
const ASSIGNMENT_SUBMISSION_STATUSES = new Set(['submitted', 'needs_changes', 'reviewed']);
const COMPETITION_REGISTRATION_STATUSES = new Set(['pending', 'needs_materials', 'approved', 'rejected']);
const COMPETITION_PUBLISH_STATUSES = new Set(['draft', 'published', 'archived']);
const PROJECT_TOPIC_STATUSES = new Set(['draft', 'published', 'archived']);
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
  milestone_1: ['progressSummary', 'coreContribution', 'codeRepo', 'codeCommit'],
  milestone_2: ['featureSummary', 'validation', 'coreContribution', 'codeRepo', 'codeCommit'],
  midterm: ['progressCompare', 'issuesAdjust', 'codeRepo', 'codeCommit'],
  milestone_3: ['integration', 'testingFeedback', 'mvpValidation'],
  final: ['deliverables', 'demo', 'techSummary', 'reflection', 'codeRepo', 'codeCommit'],
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
  progressSummary: '本次完成内容',
  coreContribution: '核心贡献（你做了什么）',
  evidence: '证据链接/图片/视频（可选）',
  diagram: '流程图/架构图（可选）',
  nextPlan: '下一步计划（可选）',
  featureSummary: '功能完成情况',
  validation: '实验/测试验证与结果',
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
  codeRepo: '代码仓库链接（Gitea）',
  codeCommit: '本次提交说明 / Commit ID',
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

function readJsonFile(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function normalizeJsonArray(value) {
  if (Array.isArray(value)) return value.map(item => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/\n|,/)
      .map(item => item.trim())
      .filter(Boolean);
  }
  return [];
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
  if (details.uploadedMaterials || details.templateRef || details.notes) {
    return null;
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
ensureDir(ASSESSMENT_DIR);
if (AUTH_SECRET === 'change-me-in-production') {
  fastify.log.warn('AUTH_SECRET 未设置，建议在生产环境中设置安全密钥。');
}

fastify.register(require('@fastify/cors'), { origin: true });
fastify.register(require('@fastify/multipart'), {
  limits: { fileSize: UPLOAD_MAX_BYTES }
});
const effectiveWebRoot = fs.existsSync(WEB_ROOT) ? WEB_ROOT : DEFAULT_WEB_ROOT;
if (WEB_SPA) {
  const legacyRedirects = {
    '/workspace.html': '/workspace',
    '/smart_workspace.html': '/workspace',
    '/projects.html': '/projects',
    '/downloads.html': '/downloads',
    '/knowledge.html': '/knowledge',
    '/competencies.html': '/competencies',
    '/study.html': '/study',
    '/tools.html': '/tools',
    '/showcase.html': '/showcase',
    '/teacher.html': '/teacher',
    '/login.html': '/login',
    '/register.html': '/register',
    '/charter.html': '/tools/charter',
    '/pre_research.html': '/tools/pre_research',
    '/literature.html': '/tools/literature',
    '/innovation.html': '/tools/innovation',
    '/wbs.html': '/tools/wbs',
    '/kanban.html': '/tools/kanban',
    '/architect.html': '/tools/architect',
    '/architect_guide.html': '/tools/architect-guide',
    '/tools/charter.html': '/tools/charter',
    '/tools/pre_research.html': '/tools/pre_research',
    '/tools/literature.html': '/tools/literature',
    '/tools/innovation.html': '/tools/innovation',
    '/tools/wbs.html': '/tools/wbs',
    '/tools/kanban.html': '/tools/kanban',
    '/tools/architect_guide.html': '/tools/architect-guide',
    '/tools/architect.html': '/tools/architect',
    '/tools/navigator.html': '/tools'
  };
  Object.entries(legacyRedirects).forEach(([from, to]) => {
    fastify.get(from, (request, reply) => {
      const base = `http://${request.headers.host || 'localhost'}`;
      const { search } = new URL(request.raw.url || from, base);
      reply.redirect(`${to}${search || ''}`);
    });
  });
}
fastify.register(require('@fastify/static'), {
  root: effectiveWebRoot,
  prefix: '/',
  decorateReply: false
});
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../assessment-data-manager'),
  prefix: '/assessment/',
  decorateReply: false
});
fastify.register(require('@fastify/static'), {
  root: UPLOAD_DIR,
  prefix: '/uploads/',
  decorateReply: false
});

fastify.get('/favicon.ico', (request, reply) => {
  reply.code(204).send();
});

if (WEB_SPA) {
  fastify.setNotFoundHandler((request, reply) => {
    const url = request.raw?.url || '';
    if (url.startsWith(API_PREFIX) || url.startsWith('/uploads/') || url.startsWith('/assessment/')) {
      reply.code(404).send({ error: 'Not Found' });
      return;
    }
    const indexPath = path.join(effectiveWebRoot, 'index.html');
    if (!fs.existsSync(indexPath)) {
      reply.code(404).send({ error: 'Not Found' });
      return;
    }
    reply.type('text/html').send(fs.createReadStream(indexPath));
  });
}

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

function getProjectMilestones(projectId) {
  return db.all(
    `SELECT * FROM project_milestones
     WHERE project_id = ?
     ORDER BY COALESCE(sort_order, id) ASC, id ASC`,
    [projectId]
  ).map(row => ({
    ...row,
    deliverables: safeParseJson(row.deliverables) || {}
  }));
}

function getProjectResources(projectId) {
  return db.all(
    `SELECT r.*, u.name AS requester_name, u.email AS requester_email
     FROM resource_requests r
     JOIN users u ON u.id = r.requester_id
     WHERE r.project_id = ?
     ORDER BY r.created_at DESC`,
    [projectId]
  );
}

function getProjectDevLogs(projectId) {
  return db.all(
    `SELECT l.id, l.content, l.tags, l.created_at, u.name AS author_name, u.avatar_url
     FROM dev_logs l
     JOIN users u ON u.id = l.author_id
     WHERE l.project_id = ?
     ORDER BY l.created_at DESC`,
    [projectId]
  );
}

function isReviewableSubmission(submission) {
  return submission && submission.status === 'submitted';
}

function isMilestoneAwaitingReview(milestone) {
  return ['submitted', 'review'].includes(String(milestone?.status || ''));
}

function buildProjectReviewMeta(detail, milestones, resources, devLogs) {
  const submissions = detail.submissions || [];
  const pendingSubmissions = submissions.filter(isReviewableSubmission);
  const latestSubmission = submissions[0] || null;
  const pendingMilestones = milestones.filter(isMilestoneAwaitingReview);
  const approvedMilestones = milestones.filter(item => ['approved', 'done', 'completed'].includes(String(item.status || '')));
  const pendingResources = resources.filter(item => item.status === 'pending');
  const alerts = [];

  if (['submitted', 'reviewing'].includes(detail.project.status)) alerts.push('立项待审核');
  if (['midterm_review', 'final_review'].includes(detail.project.status)) alerts.push('阶段待审核');
  if (pendingSubmissions.length) alerts.push(`${pendingSubmissions.length} 份提交待审核`);
  if (pendingMilestones.length) alerts.push(`${pendingMilestones.length} 个里程碑待验收`);
  if (pendingResources.length) alerts.push(`${pendingResources.length} 个资源申请待审批`);
  if (detail.project.status === 'rejected') alerts.push('项目被退回，需关注修改');

  let reviewBucket = 'active';
  if (detail.project.status === 'archived') {
    reviewBucket = 'archived';
  } else if (pendingResources.length) {
    reviewBucket = 'resource_pending';
  } else if (['submitted', 'reviewing'].includes(detail.project.status)) {
    reviewBucket = 'project_review';
  } else if (['midterm_review', 'final_review'].includes(detail.project.status) || pendingSubmissions.length || pendingMilestones.length) {
    reviewBucket = 'stage_review';
  } else if (detail.project.status === 'rejected' || alerts.length) {
    reviewBucket = 'attention';
  }

  return {
    latestSubmission,
    pendingSubmissionCount: pendingSubmissions.length,
    pendingMilestoneCount: pendingMilestones.length,
    milestoneProgress: {
      total: milestones.length,
      done: approvedMilestones.length,
      percent: milestones.length ? Math.round((approvedMilestones.length / milestones.length) * 100) : 0
    },
    resourcesPendingCount: pendingResources.length,
    implementationLogCount: devLogs.length,
    reviewBucket,
    alerts
  };
}

function buildProjectReviewDossier(projectId) {
  const detail = getProjectDetail(projectId);
  if (!detail) return null;
  const milestones = getProjectMilestones(projectId);
  const resources = getProjectResources(projectId);
  const devLogs = getProjectDevLogs(projectId);
  const meta = buildProjectReviewMeta(detail, milestones, resources, devLogs);
  return {
    ...detail,
    milestones,
    resources,
    implementationLogs: devLogs,
    alerts: meta.alerts,
    meta
  };
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

// --- Knowledge APIs ---
fastify.get(`${API_PREFIX}/knowledge/disciplines`, async (request, reply) => {
  try {
    if (!fs.existsSync(DISCIPLINE_DATA_PATH)) {
      return { disciplines: [] };
    }
    const data = JSON.parse(fs.readFileSync(DISCIPLINE_DATA_PATH, 'utf8'));
    return { disciplines: data };
  } catch (err) {
    fastify.log.error(err);
    reply.code(500);
    return { error: 'Failed to load disciplines' };
  }
});

const COURSE_DIRECTIONS = new Set([
  'foundation',
  'science',
  'engineering',
  'social',
  'humanities',
  'capstone'
]);
const COURSE_STATUSES = new Set(['draft', 'published', 'archived']);
const COURSE_MATERIAL_SECTIONS = new Set(['课程导学', '教师资料', '学生资料', '补充资料']);

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
  return path.join(COURSES_DIR, courseId, 'course.json');
}

function lessonSortValue(value) {
  const match = String(value || '').match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

function loadCourseCatalog() {
  const catalog = readJsonFile(COURSE_CATALOG_PATH, []);
  return Array.isArray(catalog) ? catalog : [];
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
    materials: Array.isArray(course.materials) ? course.materials : [],
    createdBy: course.createdBy || course.created_by || null
  };
}

function listCourseLessons(course) {
  const lessonsDir = path.join(MATERIALS_DIR, course.materialsRoot, 'lessons');
  if (!lessonsDir.startsWith(MATERIALS_DIR) || !fs.existsSync(lessonsDir)) {
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
        ? path.join(MATERIALS_DIR, course.materialsRoot, relativePath)
        : '';
      const exists = absolutePath ? fs.existsSync(absolutePath) : false;
      return {
        id: item.id || `${course.id}-material-${index + 1}`,
        courseId: course.id,
        section: COURSE_MATERIAL_SECTIONS.has(item.section) ? item.section : '补充资料',
        title: String(item.title || relativePath || `资料 ${index + 1}`).trim(),
        path: relativePath,
        kind: String(item.kind || '').trim() || 'file',
        exists,
        downloadUrl: relativePath
          ? `${API_PREFIX}/download/${toUrlPath(course.materialsRoot)}/${toUrlPath(relativePath)}`
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
        section: COURSE_MATERIAL_SECTIONS.has(item.section) ? item.section : '补充资料',
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
    direction: COURSE_DIRECTIONS.has(direction) ? direction : 'foundation',
    teacherName: String(input.teacherName || existingCourse.teacherName || '').trim(),
    summary: String(input.summary || existingCourse.summary || '').trim(),
    description: String(input.description || existingCourse.description || '').trim(),
    audience: String(input.audience || existingCourse.audience || '').trim(),
    pace: String(input.pace || existingCourse.pace || '').trim(),
    status: COURSE_STATUSES.has(status) ? status : 'draft',
    materialsRoot,
    relatedProjects,
    positioning: String(input.positioning || existingCourse.positioning || '').trim(),
    courseType: String(input.courseType || existingCourse.courseType || '').trim(),
    guidePath: normalizeRelativePath(input.guidePath || existingCourse.guidePath || ''),
    learningObjectives,
    materials,
    createdBy: input.createdBy || input.created_by || existingCourse.createdBy || existingCourse.created_by || null
  };
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(item => String(item || '').trim()).filter(Boolean)));
}

function loadPortalCompetitions() {
  const data = readJsonFile(PORTAL_COMPETITIONS_PATH, []);
  if (!Array.isArray(data)) return [];
  return data.map(item => ({
    title: String(item.title || '').trim(),
    slug: String(item.slug || '').trim(),
    tagline: String(item.tagline || '').trim(),
    tier: String(item.tier || '').trim(),
    discipline: normalizeStringArray(item.discipline),
    schoolStage: normalizeStringArray(item.schoolStage),
    status: String(item.status || '').trim(),
    dateRange: String(item.dateRange || '').trim(),
    fitSummary: String(item.fitSummary || '').trim(),
    whyJoin: String(item.whyJoin || '').trim(),
    prepAdvice: String(item.prepAdvice || '').trim(),
    externalLink: String(item.externalLink || '').trim(),
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    relatedCourseIds: normalizeStringArray(item.relatedCourseIds),
    featuredFlags: normalizeStringArray(item.featuredFlags),
    host: String(item.host || '').trim(),
    location: String(item.location || '').trim(),
    publishStatus: COMPETITION_PUBLISH_STATUSES.has(String(item.publishStatus || item.publish_status || 'published').trim())
      ? String(item.publishStatus || item.publish_status || 'published').trim()
      : 'published',
    createdBy: item.createdBy || item.created_by || null
  })).filter(item => item.slug && item.title);
}

function normalizeCompetitionPayload(input = {}, existing = {}) {
  const title = String(input.title || existing.title || '').trim();
  const publishStatus = String(input.publishStatus || input.publish_status || existing.publishStatus || existing.publish_status || 'draft').trim();
  const slug = String(input.slug || existing.slug || title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return {
    title,
    slug,
    tagline: String(input.tagline || existing.tagline || '').trim(),
    tier: String(input.tier || existing.tier || '').trim(),
    discipline: normalizeJsonArray(input.discipline ?? existing.discipline),
    schoolStage: normalizeJsonArray(input.schoolStage ?? existing.schoolStage),
    status: String(input.status || existing.status || '报名中').trim(),
    dateRange: String(input.dateRange || existing.dateRange || '').trim(),
    fitSummary: String(input.fitSummary || existing.fitSummary || '').trim(),
    whyJoin: String(input.whyJoin || existing.whyJoin || '').trim(),
    prepAdvice: String(input.prepAdvice || existing.prepAdvice || '').trim(),
    externalLink: String(input.externalLink || existing.externalLink || '').trim(),
    attachments: Array.isArray(input.attachments) ? input.attachments : (Array.isArray(existing.attachments) ? existing.attachments : []),
    relatedCourseIds: normalizeJsonArray(input.relatedCourseIds ?? existing.relatedCourseIds),
    featuredFlags: normalizeJsonArray(input.featuredFlags ?? existing.featuredFlags),
    host: String(input.host || existing.host || '').trim(),
    location: String(input.location || existing.location || '').trim(),
    publishStatus: COMPETITION_PUBLISH_STATUSES.has(publishStatus) ? publishStatus : 'draft',
    createdBy: input.createdBy || input.created_by || existing.createdBy || existing.created_by || null
  };
}

function savePortalCompetition(competition) {
  const items = loadPortalCompetitions();
  const index = items.findIndex(item => item.slug === competition.slug);
  if (index >= 0) {
    items[index] = competition;
  } else {
    items.unshift(competition);
  }
  writeJsonFile(PORTAL_COMPETITIONS_PATH, items);
}

function loadPortalCompetitionDetail(slug) {
  const safeSlug = String(slug || '').trim();
  if (!safeSlug) return null;
  const detailPath = path.join(PORTAL_COMPETITION_DETAILS_DIR, `${safeSlug}.json`);
  const detail = readJsonFile(detailPath, null);
  return detail && typeof detail === 'object' ? detail : null;
}

function loadPortalStories() {
  const data = readJsonFile(PORTAL_STORIES_PATH, []);
  if (!Array.isArray(data)) return [];
  return data.map(item => ({
    title: String(item.title || '').trim(),
    slug: String(item.slug || '').trim(),
    studentLabel: String(item.studentLabel || '').trim(),
    summary: String(item.summary || '').trim(),
    result: String(item.result || '').trim(),
    relatedCompetitionSlug: String(item.relatedCompetitionSlug || '').trim(),
    relatedCourseIds: normalizeStringArray(item.relatedCourseIds),
    cover: String(item.cover || '').trim(),
    featured: Boolean(item.featured)
  })).filter(item => item.slug && item.title);
}

function loadPortalBanners() {
  const data = readJsonFile(PORTAL_BANNERS_PATH, []);
  if (!Array.isArray(data)) return [];
  return data
    .map(item => ({
      type: String(item.type || '').trim(),
      title: String(item.title || '').trim(),
      image: String(item.image || '').trim(),
      tag: String(item.tag || '').trim(),
      targetUrl: String(item.targetUrl || '').trim(),
      priority: Number.isFinite(Number(item.priority)) ? Number(item.priority) : 999
    }))
    .filter(item => item.title && item.targetUrl)
    .sort((a, b) => a.priority - b.priority);
}

function buildCoursePreviewMap() {
  return loadCourseCatalog().reduce((acc, course) => {
    acc[course.id] = {
      id: course.id,
      title: course.title,
      summary: course.summary,
      audience: course.audience,
      positioning: course.positioning || '',
      courseType: course.courseType || '',
      direction: course.direction || ''
    };
    return acc;
  }, {});
}

function enrichCompetition(competition, courseMap) {
  return {
    ...competition,
    relatedCourses: competition.relatedCourseIds.map(courseId => courseMap[courseId]).filter(Boolean),
    registrationStats: getCompetitionRegistrationStats(competition.slug)
  };
}

function listPublishedCompetitions() {
  return loadPortalCompetitions().filter(item => item.publishStatus === 'published');
}

function buildStoryResponse(story, competitionMap, courseMap) {
  return {
    ...story,
    relatedCompetition: competitionMap[story.relatedCompetitionSlug] || null,
    relatedCourses: story.relatedCourseIds.map(courseId => courseMap[courseId]).filter(Boolean)
  };
}

function getStudentCount() {
  const row = db.get('SELECT COUNT(*) AS count FROM users WHERE role = ?', ['student']);
  return row ? Number(row.count) || 0 : 0;
}

function getAssignmentStats(assignmentId) {
  const totalStudents = getStudentCount();
  const rows = db.all(
    'SELECT status, score FROM assignment_submissions WHERE assignment_id = ?',
    [assignmentId]
  );
  const submitted = rows.length;
  const reviewed = rows.filter(row => row.status === 'reviewed').length;
  const needsChanges = rows.filter(row => row.status === 'needs_changes').length;
  const pendingReview = rows.filter(row => row.status === 'submitted').length;
  const scored = rows.map(row => Number(row.score)).filter(value => Number.isFinite(value));
  return {
    totalStudents,
    submitted,
    missing: Math.max(totalStudents - submitted, 0),
    pendingReview,
    needsChanges,
    reviewed,
    averageScore: scored.length ? Math.round((scored.reduce((sum, value) => sum + value, 0) / scored.length) * 10) / 10 : null
  };
}

function mapAssignment(row, includeStats = true) {
  if (!row) return null;
  return {
    id: row.id,
    courseId: row.course_id,
    lessonId: row.lesson_id || '',
    title: row.title,
    description: row.description || '',
    requirements: row.requirements || '',
    dueAt: row.due_at || '',
    submitType: row.submit_type || 'text',
    rubric: safeParseJson(row.rubric) || [],
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    stats: includeStats ? getAssignmentStats(row.id) : undefined
  };
}

function normalizeAssignmentPayload(input = {}, existing = {}) {
  const status = String(input.status || existing.status || 'draft').trim();
  const submitType = String(input.submitType || input.submit_type || existing.submit_type || 'text').trim();
  return {
    courseId: String(input.courseId || input.course_id || existing.course_id || '').trim(),
    lessonId: String(input.lessonId || input.lesson_id || existing.lesson_id || '').trim(),
    title: String(input.title || existing.title || '').trim(),
    description: String(input.description || existing.description || '').trim(),
    requirements: String(input.requirements || existing.requirements || '').trim(),
    dueAt: String(input.dueAt || input.due_at || existing.due_at || '').trim(),
    submitType: ['text', 'link', 'file_note', 'mixed'].includes(submitType) ? submitType : 'text',
    rubric: Array.isArray(input.rubric) ? input.rubric : (safeParseJson(existing.rubric) || []),
    status: ASSIGNMENT_STATUSES.has(status) ? status : 'draft'
  };
}

function mapAssignmentSubmission(row) {
  if (!row) return null;
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    studentId: row.student_id,
    studentName: row.student_name || '',
    studentEmail: row.student_email || '',
    content: row.content || '',
    link: row.link || '',
    attachmentNote: row.attachment_note || '',
    status: row.status,
    score: row.score === null || row.score === undefined ? null : Number(row.score),
    feedback: row.feedback || '',
    reviewedBy: row.reviewed_by || null,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at || '',
    updatedAt: row.updated_at
  };
}

function getCompetitionRegistrationStats(slug) {
  const rows = db.all(
    'SELECT status FROM competition_registrations WHERE competition_slug = ?',
    [slug]
  );
  return {
    total: rows.length,
    pending: rows.filter(row => row.status === 'pending').length,
    needsMaterials: rows.filter(row => row.status === 'needs_materials').length,
    approved: rows.filter(row => row.status === 'approved').length,
    rejected: rows.filter(row => row.status === 'rejected').length
  };
}

function mapCompetitionRegistration(row) {
  if (!row) return null;
  return {
    id: row.id,
    competitionSlug: row.competition_slug,
    studentId: row.student_id,
    studentName: row.student_name || '',
    studentEmail: row.student_email || '',
    teamName: row.team_name || '',
    className: row.class_name || '',
    members: row.members || '',
    materials: row.materials || '',
    status: row.status,
    note: row.note || '',
    teacherFeedback: row.teacher_feedback || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapProjectTopic(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    background: row.background || '',
    goals: row.goals || '',
    difficulty: row.difficulty || '',
    suggestedTeamSize: row.suggested_team_size || '',
    deliverables: row.deliverables || '',
    relatedCourseId: row.related_course_id || '',
    relatedCompetitionSlug: row.related_competition_slug || '',
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeProjectTopicPayload(input = {}, existing = {}) {
  const status = String(input.status || existing.status || 'draft').trim();
  return {
    title: String(input.title || existing.title || '').trim(),
    description: String(input.description || existing.description || '').trim(),
    background: String(input.background || existing.background || '').trim(),
    goals: String(input.goals || existing.goals || '').trim(),
    difficulty: String(input.difficulty || existing.difficulty || '').trim(),
    suggestedTeamSize: String(input.suggestedTeamSize || input.suggested_team_size || existing.suggested_team_size || '').trim(),
    deliverables: String(input.deliverables || existing.deliverables || '').trim(),
    relatedCourseId: String(input.relatedCourseId || input.related_course_id || existing.related_course_id || '').trim(),
    relatedCompetitionSlug: String(input.relatedCompetitionSlug || input.related_competition_slug || existing.related_competition_slug || '').trim(),
    status: PROJECT_TOPIC_STATUSES.has(status) ? status : 'draft'
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
  writeJsonFile(COURSE_CATALOG_PATH, catalog);
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

fastify.post(`${API_PREFIX}/courses`, async (request, reply) => {
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
  reply.code(201);
  return { course: payload };
});

fastify.patch(`${API_PREFIX}/courses/:id`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher', 'judge'])) return;
  const current = loadCourseDetail(request.params.id);
  if (!current) {
    reply.code(404);
    return { error: 'Course not found' };
  }
  const payload = normalizeCoursePayload(request.body || {}, current);
  payload.id = current.id;
  saveCourseDetail(payload);
  return { course: payload };
});

fastify.post(`${API_PREFIX}/courses/:id/lessons`, async (request, reply) => {
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

fastify.patch(`${API_PREFIX}/courses/:id/lessons/:lessonId`, async (request, reply) => {
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

async function requestAiChat(messages, apiKey) {
  if (!AI_API_BASE) {
    throw new Error('AI_API_BASE 未配置');
  }
  if (!apiKey) {
    throw new Error('AI API Key 未配置');
  }
  if (typeof fetch !== 'function') {
    throw new Error('当前 Node 版本不支持 fetch');
  }
  const base = AI_API_BASE.replace(/\/$/, '');
  const url = `${base}/chat/completions`;
  const payload = {
    model: AI_MODEL || 'gpt-4o-mini',
    messages: Array.isArray(messages) ? messages : [],
    temperature: 0.7
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, AI_TIMEOUT_MS));
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.error?.message || data?.message || 'AI 请求失败';
      throw new Error(message);
    }
    const content = data?.choices?.[0]?.message?.content || '';
    return { content, raw: data };
  } finally {
    clearTimeout(timer);
  }
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

fastify.get(`${API_PREFIX}/public/banners`, async () => {
  return { items: loadPortalBanners() };
});

fastify.get(`${API_PREFIX}/public/competitions`, async () => {
  const courseMap = buildCoursePreviewMap();
  return {
    items: listPublishedCompetitions().map(item => enrichCompetition(item, courseMap))
  };
});

fastify.get(`${API_PREFIX}/public/competitions/:slug`, async (request, reply) => {
  const competition = listPublishedCompetitions().find(item => item.slug === request.params.slug);
  if (!competition) {
    reply.code(404);
    return { error: 'Competition not found' };
  }
  const courseMap = buildCoursePreviewMap();
  return {
    item: {
      ...enrichCompetition(competition, courseMap),
      detail: loadPortalCompetitionDetail(competition.slug)
    }
  };
});

fastify.get(`${API_PREFIX}/public/stories`, async () => {
  const competitionMap = listPublishedCompetitions().reduce((acc, item) => {
    acc[item.slug] = item;
    return acc;
  }, {});
  const courseMap = buildCoursePreviewMap();
  return {
    items: loadPortalStories().map(story => buildStoryResponse(story, competitionMap, courseMap))
  };
});

fastify.get(`${API_PREFIX}/public/stories/:slug`, async (request, reply) => {
  const story = loadPortalStories().find(item => item.slug === request.params.slug);
  if (!story) {
    reply.code(404);
    return { error: 'Story not found' };
  }
  const competitionMap = listPublishedCompetitions().reduce((acc, item) => {
    acc[item.slug] = item;
    return acc;
  }, {});
  const courseMap = buildCoursePreviewMap();
  return { item: buildStoryResponse(story, competitionMap, courseMap) };
});

fastify.get(`${API_PREFIX}/public/path-mappings`, async () => {
  const courseMap = buildCoursePreviewMap();
  const competitions = listPublishedCompetitions().map(item => enrichCompetition(item, courseMap));
  const stories = loadPortalStories();
  return {
    items: Object.values(courseMap).map(course => ({
      ...course,
      competitions: competitions
        .filter(item => item.relatedCourseIds.includes(course.id))
        .map(item => ({
          slug: item.slug,
          title: item.title,
          tier: item.tier,
          status: item.status
        })),
      stories: stories
        .filter(item => item.relatedCourseIds.includes(course.id))
        .map(item => ({
          slug: item.slug,
          title: item.title,
          result: item.result,
          cover: item.cover
        }))
    }))
  };
});

fastify.get(`${API_PREFIX}/assignments`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
  const courseId = String(request.query?.courseId || '').trim();
  const lessonId = String(request.query?.lessonId || '').trim();
  const status = String(request.query?.status || '').trim();
  const conditions = [];
  const params = [];
  if (courseId) {
    conditions.push('course_id = ?');
    params.push(courseId);
  }
  if (lessonId) {
    conditions.push('lesson_id = ?');
    params.push(lessonId);
  }
  if (request.user.role === 'student') {
    conditions.push('status = ?');
    params.push('published');
  } else if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  let sql = 'SELECT * FROM assignments';
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ' ORDER BY due_at IS NULL, due_at ASC, updated_at DESC';
  return { assignments: db.all(sql, params).map(row => mapAssignment(row)) };
});

fastify.post(`${API_PREFIX}/assignments`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const payload = normalizeAssignmentPayload(request.body || {});
  if (!payload.courseId || !payload.title) {
    reply.code(400);
    return { error: '课程与作业标题必填' };
  }
  const createdAt = now();
  const info = db.run(
    `INSERT INTO assignments (course_id, lesson_id, title, description, requirements, due_at, submit_type, rubric, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.courseId,
      payload.lessonId,
      payload.title,
      payload.description,
      payload.requirements,
      payload.dueAt,
      payload.submitType,
      JSON.stringify(payload.rubric || []),
      payload.status,
      request.user.id,
      createdAt,
      createdAt
    ]
  );
  const assignment = db.get('SELECT * FROM assignments WHERE id = ?', [info.lastInsertRowid]);
  logAudit('assignment.create', request, { assignmentId: info.lastInsertRowid });
  reply.code(201);
  return { assignment: mapAssignment(assignment) };
});

fastify.patch(`${API_PREFIX}/assignments/:id`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const assignmentId = parseProjectId(request.params.id);
  if (!assignmentId) {
    reply.code(400);
    return { error: '作业ID无效' };
  }
  const existing = db.get('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
  if (!existing) {
    reply.code(404);
    return { error: '作业不存在' };
  }
  const payload = normalizeAssignmentPayload(request.body || {}, existing);
  if (!payload.courseId || !payload.title) {
    reply.code(400);
    return { error: '课程与作业标题必填' };
  }
  db.run(
    `UPDATE assignments
     SET course_id = ?, lesson_id = ?, title = ?, description = ?, requirements = ?, due_at = ?, submit_type = ?, rubric = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [
      payload.courseId,
      payload.lessonId,
      payload.title,
      payload.description,
      payload.requirements,
      payload.dueAt,
      payload.submitType,
      JSON.stringify(payload.rubric || []),
      payload.status,
      now(),
      assignmentId
    ]
  );
  const assignment = db.get('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
  logAudit('assignment.update', request, { assignmentId });
  return { assignment: mapAssignment(assignment) };
});

fastify.get(`${API_PREFIX}/assignments/:id/submissions`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
  const assignmentId = parseProjectId(request.params.id);
  if (!assignmentId) {
    reply.code(400);
    return { error: '作业ID无效' };
  }
  const assignment = db.get('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
  if (!assignment) {
    reply.code(404);
    return { error: '作业不存在' };
  }
  const params = [assignmentId];
  let sql = `
    SELECT s.*, u.name AS student_name, u.email AS student_email
    FROM assignment_submissions s
    JOIN users u ON u.id = s.student_id
    WHERE s.assignment_id = ?
  `;
  if (request.user.role === 'student') {
    sql += ' AND s.student_id = ?';
    params.push(request.user.id);
  }
  sql += ' ORDER BY s.updated_at DESC';
  return {
    assignment: mapAssignment(assignment),
    submissions: db.all(sql, params).map(mapAssignmentSubmission)
  };
});

fastify.post(`${API_PREFIX}/assignments/:id/submissions`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher'])) return;
  const assignmentId = parseProjectId(request.params.id);
  if (!assignmentId) {
    reply.code(400);
    return { error: '作业ID无效' };
  }
  const assignment = db.get('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
  if (!assignment || (request.user.role === 'student' && assignment.status !== 'published')) {
    reply.code(404);
    return { error: '作业不存在或未发布' };
  }
  const payload = request.body || {};
  const content = String(payload.content || '').trim();
  const link = String(payload.link || '').trim();
  const attachmentNote = String(payload.attachmentNote || payload.attachment_note || '').trim();
  if (!content && !link && !attachmentNote) {
    reply.code(400);
    return { error: '提交内容、链接或附件说明至少填写一项' };
  }
  if (link && !/^https?:\/\//i.test(link)) {
    reply.code(400);
    return { error: '链接必须以 http(s) 开头' };
  }
  const studentId = request.user.id;
  const existing = db.get(
    'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
    [assignmentId, studentId]
  );
  const submittedAt = now();
  if (existing) {
    db.run(
      `UPDATE assignment_submissions
       SET content = ?, link = ?, attachment_note = ?, status = ?, score = NULL, feedback = '', reviewed_by = NULL, reviewed_at = NULL, submitted_at = ?, updated_at = ?
       WHERE id = ?`,
      [content, link, attachmentNote, 'submitted', submittedAt, submittedAt, existing.id]
    );
  } else {
    db.run(
      `INSERT INTO assignment_submissions (assignment_id, student_id, content, link, attachment_note, status, score, feedback, reviewed_by, submitted_at, reviewed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, '', NULL, ?, NULL, ?)`,
      [assignmentId, studentId, content, link, attachmentNote, 'submitted', submittedAt, submittedAt]
    );
  }
  const row = db.get(
    `SELECT s.*, u.name AS student_name, u.email AS student_email
     FROM assignment_submissions s
     JOIN users u ON u.id = s.student_id
     WHERE s.assignment_id = ? AND s.student_id = ?`,
    [assignmentId, studentId]
  );
  logAudit('assignment.submit', request, { assignmentId });
  return { submission: mapAssignmentSubmission(row) };
});

fastify.patch(`${API_PREFIX}/assignments/:id/submissions/:submissionId`, async (request, reply) => {
  return fastify.inject({
    method: 'POST',
    url: `${API_PREFIX}/assignments/${request.params.id}/submissions/${request.params.submissionId}/review`,
    headers: request.headers,
    payload: request.body
  }).then(response => {
    reply.code(response.statusCode);
    Object.entries(response.headers).forEach(([key, value]) => reply.header(key, value));
    return JSON.parse(response.body || '{}');
  });
});

fastify.post(`${API_PREFIX}/assignments/:id/submissions/:submissionId/review`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const assignmentId = parseProjectId(request.params.id);
  const submissionId = parseProjectId(request.params.submissionId);
  if (!assignmentId || !submissionId) {
    reply.code(400);
    return { error: '作业或提交ID无效' };
  }
  const status = String(request.body?.status || 'reviewed').trim();
  const score = request.body?.score === '' || request.body?.score === null || request.body?.score === undefined
    ? null
    : Number(request.body.score);
  const feedback = String(request.body?.feedback || '').trim();
  if (!ASSIGNMENT_SUBMISSION_STATUSES.has(status) || status === 'submitted') {
    reply.code(400);
    return { error: '批改状态无效' };
  }
  if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) {
    reply.code(400);
    return { error: '分数必须在 0-100 之间' };
  }
  if (status === 'needs_changes' && !feedback) {
    reply.code(400);
    return { error: '退回修改必须填写反馈' };
  }
  const reviewedAt = now();
  const result = db.run(
    `UPDATE assignment_submissions
     SET status = ?, score = ?, feedback = ?, reviewed_by = ?, reviewed_at = ?, updated_at = ?
     WHERE id = ? AND assignment_id = ?`,
    [status, score, feedback, request.user.id, reviewedAt, reviewedAt, submissionId, assignmentId]
  );
  if (!result.changes) {
    reply.code(404);
    return { error: '提交不存在' };
  }
  const row = db.get(
    `SELECT s.*, u.name AS student_name, u.email AS student_email
     FROM assignment_submissions s
     JOIN users u ON u.id = s.student_id
     WHERE s.id = ?`,
    [submissionId]
  );
  logAudit('assignment.review', request, { assignmentId, submissionId, status });
  return { submission: mapAssignmentSubmission(row) };
});

fastify.get(`${API_PREFIX}/admin/competitions`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher', 'judge'])) return;
  const courseMap = buildCoursePreviewMap();
  return { competitions: loadPortalCompetitions().map(item => enrichCompetition(item, courseMap)) };
});

fastify.post(`${API_PREFIX}/admin/competitions`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const competition = normalizeCompetitionPayload(request.body || {});
  competition.createdBy = request.user.id;
  if (!competition.title || !competition.slug) {
    reply.code(400);
    return { error: '赛事标题与 slug 必填' };
  }
  if (loadPortalCompetitions().some(item => item.slug === competition.slug)) {
    reply.code(409);
    return { error: '赛事 slug 已存在' };
  }
  savePortalCompetition(competition);
  logAudit('competition.create', request, { slug: competition.slug });
  reply.code(201);
  return { competition: enrichCompetition(competition, buildCoursePreviewMap()) };
});

fastify.patch(`${API_PREFIX}/admin/competitions/:slug`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const current = loadPortalCompetitions().find(item => item.slug === request.params.slug);
  if (!current) {
    reply.code(404);
    return { error: '赛事不存在' };
  }
  const competition = normalizeCompetitionPayload(request.body || {}, current);
  competition.slug = current.slug;
  savePortalCompetition(competition);
  logAudit('competition.update', request, { slug: competition.slug });
  return { competition: enrichCompetition(competition, buildCoursePreviewMap()) };
});

fastify.get(`${API_PREFIX}/competitions/:slug/registrations`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher', 'judge'])) return;
  const slug = String(request.params.slug || '').trim();
  const competition = loadPortalCompetitions().find(item => item.slug === slug);
  if (!competition) {
    reply.code(404);
    return { error: '赛事不存在' };
  }
  const params = [slug];
  let sql = `
    SELECT r.*, u.name AS student_name, u.email AS student_email
    FROM competition_registrations r
    JOIN users u ON u.id = r.student_id
    WHERE r.competition_slug = ?
  `;
  if (request.user.role === 'student') {
    sql += ' AND r.student_id = ?';
    params.push(request.user.id);
  }
  sql += ' ORDER BY r.updated_at DESC';
  return {
    stats: getCompetitionRegistrationStats(slug),
    registrations: db.all(sql, params).map(mapCompetitionRegistration)
  };
});

fastify.post(`${API_PREFIX}/competitions/:slug/registrations`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher'])) return;
  const slug = String(request.params.slug || '').trim();
  if (!loadPortalCompetitions().some(item => item.slug === slug)) {
    reply.code(404);
    return { error: '赛事不存在' };
  }
  const payload = request.body || {};
  const studentId = request.user.id;
  const teamName = String(payload.teamName || payload.team_name || '').trim();
  const className = String(payload.className || payload.class_name || '').trim();
  const members = String(payload.members || '').trim();
  const materials = String(payload.materials || '').trim();
  const note = String(payload.note || '').trim();
  const createdAt = now();
  const existing = db.get(
    'SELECT id FROM competition_registrations WHERE competition_slug = ? AND student_id = ?',
    [slug, studentId]
  );
  if (existing) {
    db.run(
      `UPDATE competition_registrations
       SET team_name = ?, class_name = ?, members = ?, materials = ?, status = ?, note = ?, updated_at = ?
       WHERE id = ?`,
      [teamName, className, members, materials, 'pending', note, createdAt, existing.id]
    );
  } else {
    db.run(
      `INSERT INTO competition_registrations (competition_slug, student_id, team_name, class_name, members, materials, status, note, teacher_feedback, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?)`,
      [slug, studentId, teamName, className, members, materials, 'pending', note, createdAt, createdAt]
    );
  }
  logAudit('competition.registration.submit', request, { slug });
  return { success: true, stats: getCompetitionRegistrationStats(slug) };
});

fastify.patch(`${API_PREFIX}/competitions/:slug/registrations/:id`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const registrationId = parseProjectId(request.params.id);
  if (!registrationId) {
    reply.code(400);
    return { error: '报名ID无效' };
  }
  const status = String(request.body?.status || '').trim();
  const teacherFeedback = String(request.body?.teacherFeedback || request.body?.teacher_feedback || '').trim();
  if (!COMPETITION_REGISTRATION_STATUSES.has(status)) {
    reply.code(400);
    return { error: '报名状态无效' };
  }
  const updatedAt = now();
  const result = db.run(
    `UPDATE competition_registrations
     SET status = ?, teacher_feedback = ?, updated_at = ?
     WHERE id = ? AND competition_slug = ?`,
    [status, teacherFeedback, updatedAt, registrationId, request.params.slug]
  );
  if (!result.changes) {
    reply.code(404);
    return { error: '报名记录不存在' };
  }
  const row = db.get(
    `SELECT r.*, u.name AS student_name, u.email AS student_email
     FROM competition_registrations r
     JOIN users u ON u.id = r.student_id
     WHERE r.id = ?`,
    [registrationId]
  );
  logAudit('competition.registration.review', request, { registrationId, status });
  return { registration: mapCompetitionRegistration(row), stats: getCompetitionRegistrationStats(request.params.slug) };
});

fastify.get(`${API_PREFIX}/admin/project-topics`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher', 'judge'])) return;
  return {
    topics: db.all('SELECT * FROM project_topics ORDER BY updated_at DESC').map(mapProjectTopic)
  };
});

fastify.post(`${API_PREFIX}/admin/project-topics`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const payload = normalizeProjectTopicPayload(request.body || {});
  if (!payload.title) {
    reply.code(400);
    return { error: '项目题目标题必填' };
  }
  const createdAt = now();
  const info = db.run(
    `INSERT INTO project_topics (title, description, background, goals, difficulty, suggested_team_size, deliverables, related_course_id, related_competition_slug, status, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.title,
      payload.description,
      payload.background,
      payload.goals,
      payload.difficulty,
      payload.suggestedTeamSize,
      payload.deliverables,
      payload.relatedCourseId,
      payload.relatedCompetitionSlug,
      payload.status,
      request.user.id,
      createdAt,
      createdAt
    ]
  );
  const row = db.get('SELECT * FROM project_topics WHERE id = ?', [info.lastInsertRowid]);
  logAudit('project_topic.create', request, { topicId: info.lastInsertRowid });
  reply.code(201);
  return { topic: mapProjectTopic(row) };
});

fastify.patch(`${API_PREFIX}/admin/project-topics/:id`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const topicId = parseProjectId(request.params.id);
  if (!topicId) {
    reply.code(400);
    return { error: '题目ID无效' };
  }
  const existing = db.get('SELECT * FROM project_topics WHERE id = ?', [topicId]);
  if (!existing) {
    reply.code(404);
    return { error: '项目题目不存在' };
  }
  const payload = normalizeProjectTopicPayload(request.body || {}, existing);
  if (!payload.title) {
    reply.code(400);
    return { error: '项目题目标题必填' };
  }
  db.run(
    `UPDATE project_topics
     SET title = ?, description = ?, background = ?, goals = ?, difficulty = ?, suggested_team_size = ?, deliverables = ?, related_course_id = ?, related_competition_slug = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [
      payload.title,
      payload.description,
      payload.background,
      payload.goals,
      payload.difficulty,
      payload.suggestedTeamSize,
      payload.deliverables,
      payload.relatedCourseId,
      payload.relatedCompetitionSlug,
      payload.status,
      now(),
      topicId
    ]
  );
  const row = db.get('SELECT * FROM project_topics WHERE id = ?', [topicId]);
  logAudit('project_topic.update', request, { topicId });
  return { topic: mapProjectTopic(row) };
});

fastify.get(`${API_PREFIX}/project-topics`, async () => {
  return {
    topics: db.all('SELECT * FROM project_topics WHERE status = ? ORDER BY updated_at DESC', ['published']).map(mapProjectTopic)
  };
});

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

fastify.post(`${API_PREFIX}/ai/chat`, async (request, reply) => {
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

fastify.get(`${API_PREFIX}/admin/project-review-queue`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher', 'judge'])) return;
  const { conditions, params } = buildProjectFilters(request.query, 'p');
  let sql = 'SELECT p.* FROM projects p';
  if (conditions.length) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ' ORDER BY p.updated_at DESC';

  const projects = db.all(sql, params).map(project => {
    const detail = getProjectDetail(project.id);
    const milestones = getProjectMilestones(project.id);
    const resources = getProjectResources(project.id);
    const devLogs = getProjectDevLogs(project.id);
    const meta = buildProjectReviewMeta(detail, milestones, resources, devLogs);
    const memberNames = (detail.members || []).map(item => item.name).filter(Boolean);
    return {
      ...project,
      members: detail.members || [],
      memberNames,
      latestSubmission: meta.latestSubmission,
      pendingSubmissionCount: meta.pendingSubmissionCount,
      pendingMilestoneCount: meta.pendingMilestoneCount,
      milestoneProgress: meta.milestoneProgress,
      resourcesPendingCount: meta.resourcesPendingCount,
      implementationLogCount: meta.implementationLogCount,
      reviewBucket: meta.reviewBucket,
      alerts: meta.alerts,
      latestActivityAt: [
        project.updated_at,
        meta.latestSubmission?.created_at,
        devLogs[0]?.created_at,
        resources[0]?.updated_at
      ].filter(Boolean).sort().at(-1) || project.updated_at
    };
  });

  return { projects };
});

fastify.get(`${API_PREFIX}/admin/projects/:id/review-dossier`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher', 'judge'])) return;
  const projectId = parseProjectId(request.params.id);
  if (!projectId) {
    reply.code(400);
    return { error: '项目ID无效' };
  }
  const dossier = buildProjectReviewDossier(projectId);
  if (!dossier) {
    reply.code(404);
    return { error: '项目不存在' };
  }
  return dossier;
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
  if (!requireRole(request, reply, ['teacher', 'judge'])) return;
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
  const deadline = payload.deadline ? String(payload.deadline).trim() : null;
  const assignee = payload.assignee ? String(payload.assignee).trim() : null;
  const startDate = payload.start_date ?? payload.startDate ?? payload.start ?? null;
  const endDate = payload.end_date ?? payload.endDate ?? payload.end ?? null;
  const output = payload.output;
  const deliverablesPayload = payload.deliverables;
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

  let deliverables = null;
  if (deliverablesPayload !== undefined) {
    if (typeof deliverablesPayload === 'string') {
      deliverables = deliverablesPayload;
    } else {
      deliverables = JSON.stringify(deliverablesPayload);
    }
  } else if (output !== undefined) {
    deliverables = JSON.stringify({ output: String(output || '').trim() });
  }

  const info = db.run(
    `INSERT INTO project_milestones (project_id, title, description, parent_id, sort_order, assignee, start_date, end_date, deadline, deliverables, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      projectId,
      title,
      description,
      parentId,
      sortOrder,
      assignee,
      startDate ? String(startDate).trim() : null,
      endDate ? String(endDate).trim() : null,
      deadline,
      deliverables,
      now(),
      now()
    ]
  );
  return { success: true, id: info.lastInsertRowid };
});

fastify.patch(`${API_PREFIX}/milestones/:id`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher'])) return;
  const id = parseProjectId(request.params.id);
  const payload = request.body || {};
  const status = payload.status; // e.g. move to another phase or mark done
  const description = payload.phase ?? payload.description; // update phase
  const deadline = payload.deadline;
  const assignee = payload.assignee;
  const title = payload.title;
  const startDate = payload.start_date ?? payload.startDate ?? payload.start;
  const endDate = payload.end_date ?? payload.endDate ?? payload.end;
  const output = payload.output;
  const deliverablesPayload = payload.deliverables;
  const hasParent = Object.prototype.hasOwnProperty.call(payload, 'parent_id') || Object.prototype.hasOwnProperty.call(payload, 'parentId');
  const hasSort = Object.prototype.hasOwnProperty.call(payload, 'sort_order') || Object.prototype.hasOwnProperty.call(payload, 'sortOrder');

  // Construct update
  if (title !== undefined) {
      db.run('UPDATE project_milestones SET title = ?, updated_at = ? WHERE id = ?', [String(title || '').trim(), now(), id]);
  }
  if (status) {
      db.run('UPDATE project_milestones SET status = ?, updated_at = ? WHERE id = ?', [status, now(), id]);
  }
  if (description !== undefined) {
      db.run('UPDATE project_milestones SET description = ?, updated_at = ? WHERE id = ?', [description, now(), id]);
  }
  if (deadline !== undefined) {
      db.run('UPDATE project_milestones SET deadline = ?, updated_at = ? WHERE id = ?', [deadline ? String(deadline).trim() : null, now(), id]);
  }
  if (assignee !== undefined) {
      db.run('UPDATE project_milestones SET assignee = ?, updated_at = ? WHERE id = ?', [assignee ? String(assignee).trim() : null, now(), id]);
  }
  if (startDate !== undefined) {
      db.run('UPDATE project_milestones SET start_date = ?, updated_at = ? WHERE id = ?', [startDate ? String(startDate).trim() : null, now(), id]);
  }
  if (endDate !== undefined) {
      db.run('UPDATE project_milestones SET end_date = ?, updated_at = ? WHERE id = ?', [endDate ? String(endDate).trim() : null, now(), id]);
  }
  if (deliverablesPayload !== undefined || output !== undefined) {
      const row = db.get('SELECT deliverables FROM project_milestones WHERE id = ?', [id]);
      let current = safeParseJson(row?.deliverables) || {};
      if (deliverablesPayload !== undefined) {
        if (typeof deliverablesPayload === 'string') {
          const parsed = safeParseJson(deliverablesPayload);
          current = parsed ? { ...current, ...parsed } : current;
        } else if (typeof deliverablesPayload === 'object' && deliverablesPayload !== null) {
          current = { ...current, ...deliverablesPayload };
        }
      }
      if (output !== undefined) {
        current = { ...current, output: String(output || '').trim() };
      }
      db.run('UPDATE project_milestones SET deliverables = ?, updated_at = ? WHERE id = ?', [JSON.stringify(current), now(), id]);
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

fastify.delete(`${API_PREFIX}/milestones/:id`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher'])) return;
  const id = parseProjectId(request.params.id);
  db.run('DELETE FROM project_milestones WHERE id = ?', [id]);
  return { success: true };
});

// --- Project Blueprint API ---
fastify.get(`${API_PREFIX}/projects/:id/blueprint`, async (request, reply) => {
  if (!requireAuth(request, reply)) return;
  const projectId = parseProjectId(request.params.id);
  const row = db.get('SELECT data FROM project_blueprints WHERE project_id = ?', [projectId]);
  return { data: row ? safeParseJson(row.data) : null };
});

fastify.post(`${API_PREFIX}/projects/:id/blueprint`, async (request, reply) => {
  if (!requireRole(request, reply, ['student', 'teacher'])) return;
  const projectId = parseProjectId(request.params.id);
  const payload = request.body || {};
  
  // Validate basic structure
  if (!payload.strategy || !Array.isArray(payload.wbs)) {
    reply.code(400);
    return { error: 'Invalid blueprint format' };
  }

  const dataJson = JSON.stringify(payload);
  const existing = db.get('SELECT id FROM project_blueprints WHERE project_id = ?', [projectId]);
  const nowAt = now();
  
  if (existing) {
    db.run(
      'UPDATE project_blueprints SET data = ?, updated_at = ? WHERE id = ?',
      [dataJson, nowAt, existing.id]
    );
  } else {
    db.run(
      'INSERT INTO project_blueprints (project_id, data, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [projectId, dataJson, nowAt, nowAt]
    );
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

// --- Assessment Data Manager ---
fastify.get(`${API_PREFIX}/assessments`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const files = db.all(
    'SELECT id, title, original_name, file_path, file_size, uploaded_by, created_at FROM assessment_files ORDER BY created_at DESC'
  );
  return { files };
});

fastify.post(`${API_PREFIX}/assessments`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  let fields;
  let tempFiles;
  try {
    const collected = await collectMultipart(request);
    fields = collected.fields;
    tempFiles = collected.tempFiles;
  } catch (err) {
    cleanupTempFiles(tempFiles || []);
    reply.code(400);
    return { error: err.message || '上传失败' };
  }
  if (!tempFiles || tempFiles.length !== 1) {
    cleanupTempFiles(tempFiles || []);
    reply.code(400);
    return { error: '请上传单个 CSV 文件' };
  }
  const file = tempFiles[0];
  const safeName = sanitizeName(file.originalName) || 'assessment.csv';
  const finalName = `${Date.now()}_${safeName}`;
  const finalPath = path.join(ASSESSMENT_DIR, finalName);
  try {
    fs.renameSync(file.tmpPath, finalPath);
  } catch (err) {
    cleanupTempFiles(tempFiles || []);
    reply.code(500);
    return { error: '保存文件失败' };
  }
  const stats = fs.statSync(finalPath);
  const title = String(fields?.title || '').trim();
  const createdAt = now();
  const info = db.run(
    'INSERT INTO assessment_files (title, original_name, file_path, file_size, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [title, safeName, finalName, stats.size, request.user?.id || null, createdAt]
  );
  logAudit('assessment.upload', request, { fileId: info.lastInsertRowid, fileName: safeName });
  return {
    success: true,
    file: {
      id: info.lastInsertRowid,
      title,
      original_name: safeName,
      file_path: finalName,
      file_size: stats.size,
      created_at: createdAt
    }
  };
});

fastify.get(`${API_PREFIX}/assessments/:id/download`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const fileId = parseProjectId(request.params.id);
  if (!fileId) {
    reply.code(400);
    return { error: '文件ID无效' };
  }
  const row = db.get('SELECT * FROM assessment_files WHERE id = ?', [fileId]);
  if (!row) {
    reply.code(404);
    return { error: '文件不存在' };
  }
  const absolutePath = path.join(ASSESSMENT_DIR, row.file_path);
  if (!absolutePath.startsWith(ASSESSMENT_DIR)) {
    reply.code(403);
    return { error: 'Access denied' };
  }
  if (!fs.existsSync(absolutePath)) {
    reply.code(404);
    return { error: '文件已丢失' };
  }
  const ext = path.extname(row.original_name || '').toLowerCase();
  const mimeType = (EXTENSION_MIME_MAP[ext] && EXTENSION_MIME_MAP[ext][0]) || 'text/csv';
  reply.header('Content-Type', mimeType);
  reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(row.original_name)}"`);
  logAudit('assessment.download', request, { fileId });
  return reply.send(fs.createReadStream(absolutePath));
});

fastify.delete(`${API_PREFIX}/assessments/:id`, async (request, reply) => {
  if (!requireRole(request, reply, ['teacher'])) return;
  const fileId = parseProjectId(request.params.id);
  if (!fileId) {
    reply.code(400);
    return { error: '文件ID无效' };
  }
  const row = db.get('SELECT * FROM assessment_files WHERE id = ?', [fileId]);
  if (!row) {
    reply.code(404);
    return { error: '文件不存在' };
  }
  const absolutePath = path.join(ASSESSMENT_DIR, row.file_path);
  try {
    if (absolutePath.startsWith(ASSESSMENT_DIR) && fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    fastify.log.error(err);
  }
  db.run('DELETE FROM assessment_files WHERE id = ?', [fileId]);
  logAudit('assessment.delete', request, { fileId });
  return { success: true };
});

// --- Resources API ---
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

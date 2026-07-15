const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const NODE_ENV = String(process.env.NODE_ENV || 'development').trim().toLowerCase();
const TRUST_PROXY_ENV = String(process.env.TRUST_PROXY || '').trim().toLowerCase();
const TRUST_PROXY = TRUST_PROXY_ENV === 'true'
  ? true
  : (/^\d+$/.test(TRUST_PROXY_ENV) ? Number(TRUST_PROXY_ENV) : false);
const archiver = require('archiver');
const fastify = require('fastify')({
  logger: true,
  requestTimeout: 30000,
  connectionTimeout: 10000,
  trustProxy: TRUST_PROXY
});
const { pipeline } = require('stream');
const util = require('util');
const pump = util.promisify(pipeline);
const { createDatabase, DEFAULT_DB_PATH } = require('./db');
const { registerAssignmentRoutes } = require('./routes/assignments');
const { registerCourseRoutes } = require('./routes/courses');
const { registerProjectOpsRoutes } = require('./routes/project-ops');
const { registerProjectRoutes } = require('./routes/projects');
const { registerPortalRoutes } = require('./routes/portal');
const { registerMatchingRoutes } = require('./routes/matching');
const { registerReviewRoutes } = require('./routes/review');
const { registerCollaborationRoutes } = require('./routes/collaboration');
const { registerKnowledgeRoutes } = require('./routes/knowledge');
const { registerSystemRoutes } = require('./routes/system');
const { registerAssetRoutes } = require('./routes/assets');
const { createProjectRepository } = require('./repositories/projects');
const { createProjectReviewRepository } = require('./repositories/project-review');
const { createShowcaseRepository } = require('./repositories/showcase');
const { createAuthHelpers } = require('./src/utils/auth-helpers');
const { createCourseContentService } = require('./src/utils/course-content');
const { createFileHelpers } = require('./src/utils/file-helpers');
const { createKnowledgeContentService } = require('./src/utils/knowledge-content');
const { createPortalContentService } = require('./src/utils/portal-content');
const { sanitizeLessonContent } = require('./src/utils/html-sanitizer');

const PORT = Number.parseInt(process.env.PORT || '8090', 10);
const HOST = process.env.HOST || '0.0.0.0';
const PROJECT_ROOT = path.resolve(__dirname, '../..');
function resolveConfiguredPath(value, fallback) {
  const raw = String(value || '').trim();
  return raw ? (path.isAbsolute(raw) ? raw : path.resolve(PROJECT_ROOT, raw)) : fallback;
}
const DB_PATH = resolveConfiguredPath(process.env.DB_PATH, DEFAULT_DB_PATH);
const UPLOAD_DIR = resolveConfiguredPath(process.env.UPLOAD_DIR, path.join(__dirname, '../../storage/uploads'));
const LOG_DIR = resolveConfiguredPath(process.env.LOG_DIR, path.join(__dirname, '../../storage/logs'));
const ASSESSMENT_DIR = resolveConfiguredPath(process.env.ASSESSMENT_DIR, path.join(__dirname, '../../storage/assessments'));
const DEFAULT_WEB_ROOT = path.join(__dirname, '../web-vue/dist');
const WEB_ROOT = resolveConfiguredPath(process.env.WEB_ROOT, DEFAULT_WEB_ROOT);
const WEB_SPA_ENV = String(process.env.WEB_SPA || '').trim().toLowerCase();
const WEB_SPA = WEB_SPA_ENV
  ? WEB_SPA_ENV === 'true'
  : fs.existsSync(path.join(WEB_ROOT, 'index.html')) || fs.existsSync(path.join(DEFAULT_WEB_ROOT, 'index.html'));
const AUDIT_LOG_PATH = path.join(LOG_DIR, 'audit.log');
const UPLOAD_MAX_MB = Number.parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || '100', 10);
const UPLOAD_MAX_BYTES = Math.max(1, UPLOAD_MAX_MB) * 1024 * 1024;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const CORS_ALLOWED_ORIGINS = new Set(
  String(process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
);
if (NODE_ENV === 'development' || NODE_ENV === 'test') {
  CORS_ALLOWED_ORIGINS.add('http://localhost:5173');
}
const AUTH_SECRET = String(process.env.AUTH_SECRET || '').trim();
const IS_TEST_ENV = NODE_ENV === 'test';
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
const COURSES_DIR = resolveConfiguredPath(process.env.COURSES_DIR, path.join(__dirname, '../../content/courses'));
const COURSE_CATALOG_PATH = path.join(COURSES_DIR, 'catalog.json');
const DISCIPLINE_DATA_PATH = path.join(COURSES_DIR, 'disciplines/index.json');
const DISCIPLINE_LEARNING_UNITS_PATH = path.join(COURSES_DIR, 'disciplines/learning-units.json');
const CRASH_COURSE_SERIES_PATH = path.join(COURSES_DIR, 'disciplines/crash-course-series.json');
const CRASH_COURSE_VIDEOS_PATH = path.join(COURSES_DIR, 'disciplines/crash-course-videos.json');
const BILIBILI_SERIES_VIDEOS_PATH = resolveConfiguredPath(process.env.BILIBILI_SERIES_VIDEOS_PATH, path.join(__dirname, '../web-vue/src/data/bilibiliSeriesVideos.json'));
const MATERIALS_DIR = resolveConfiguredPath(process.env.MATERIALS_DIR, path.join(__dirname, '../../content/materials'));
const PORTAL_DIR = resolveConfiguredPath(process.env.PORTAL_DIR, path.join(__dirname, '../../content/portal'));
const PORTAL_COMPETITIONS_PATH = path.join(PORTAL_DIR, 'competitions.json');
const PORTAL_COMPETITION_DETAILS_DIR = path.join(PORTAL_DIR, 'competition-details');
const PORTAL_STORIES_PATH = path.join(PORTAL_DIR, 'stories.json');
const PORTAL_BANNERS_PATH = path.join(PORTAL_DIR, 'banners.json');

function envValue(name, fallback = '') {
  return String(process.env[name] || fallback || '').trim();
}

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
  '.py',
  '.ipynb',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp'
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
  'text/x-python',
  'text/x-script.python',
  'application/json',
  'application/x-ipynb+json',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp'
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
  '.html': ['text/html; charset=utf-8', 'text/html'],
  '.md': ['text/markdown', 'text/plain'],
  '.csv': ['text/csv', 'application/vnd.ms-excel'],
  '.py': ['text/x-python', 'text/x-script.python', 'text/plain'],
  '.ipynb': ['application/json', 'application/x-ipynb+json', 'text/plain'],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.plist': ['application/xml', 'text/xml']
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
const MATCH_ELIGIBILITY_STATUSES = new Set(['eligible', 'conditional', 'ineligible']);
const MATCH_OVERRIDE_TYPES = new Set(['boost', 'suppress', 'force_include', 'force_exclude']);
const MATCH_INTERACTION_TYPES = new Set(['view', 'click', 'apply', 'ignore']);
const MATCH_CANDIDATE_BUCKET_LABELS = {
  ready_to_nudge: '适合但未报名',
  needs_materials: '已报名但缺材料',
  trainable: '边缘匹配，可培养',
  already_registered: '已报名待跟进',
  manually_suppressed: '已人工屏蔽',
  ignored: '学生暂时忽略',
  hold: '暂不推荐'
};
const MATCH_ELIGIBILITY_ORDER = {
  eligible: 0,
  conditional: 1,
  ineligible: 2
};
const MATCH_CANDIDATE_BUCKET_ORDER = {
  ready_to_nudge: 0,
  needs_materials: 1,
  trainable: 2,
  already_registered: 3,
  manually_suppressed: 4,
  ignored: 5,
  hold: 6
};
const MATCH_RULE_VERSION = 'competition-v1';
const MATCH_AI_VERSION = 'competition-ai-v1';
const PROJECT_TOPIC_MATCH_RULE_VERSION = 'project-topic-v1';
const PROJECT_TOPIC_MATCH_AI_VERSION = 'project-topic-ai-v1';
const COURSE_MATCH_RULE_VERSION = 'course-v1';
const COURSE_MATCH_AI_VERSION = 'course-ai-v1';
const TEAM_CANDIDATE_MATCH_RULE_VERSION = 'team-candidate-v1';
const TEAM_CANDIDATE_MATCH_AI_VERSION = 'team-candidate-ai-v1';
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
let projectRepository;
const routeDb = new Proxy({}, {
  get(_target, prop) {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const value = db[prop];
    return typeof value === 'function' ? value.bind(db) : value;
  }
});

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function assertRuntimeConfig() {
  if (IS_TEST_ENV) return;
  const publicDefaults = new Set(['', 'change-me-in-production', 'secret', 'password', 'development-secret']);
  if (publicDefaults.has(AUTH_SECRET) || Buffer.byteLength(AUTH_SECRET, 'utf8') < 32) {
    throw new Error('AUTH_SECRET must be explicitly configured with at least 32 bytes outside test environments');
  }
}

function now() {
  return new Date().toISOString();
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

function slugifyGiteaUsername(value, fallback = 'student') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/@.*$/, '')
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
    .slice(0, 39);
  return normalized || fallback;
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

function normalizeToolKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function constantTimeEqual(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

function normalizeVisibility(value) {
  const raw = String(value || '').trim().toLowerCase();
  return ['public', 'assigned', 'private'].includes(raw) ? raw : 'public';
}

function parseAccessStringList(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map(item => String(item || '').trim()).filter(Boolean)));
  }
  if (value === null || value === undefined) return [];
  const raw = String(value || '').trim();
  if (!raw) return [];
  const parsed = raw.startsWith('[') ? safeParseJson(raw) : null;
  if (Array.isArray(parsed)) {
    return Array.from(new Set(parsed.map(item => String(item || '').trim()).filter(Boolean)));
  }
  return Array.from(new Set(
    raw
      .split(/[,\n，、]+/)
      .map(item => item.trim())
      .filter(Boolean)
  ));
}

function parseAccessIdList(value) {
  return parseAccessStringList(value)
    .map(item => Number.parseInt(String(item), 10))
    .filter(item => Number.isInteger(item) && item > 0)
    .filter((item, index, list) => list.indexOf(item) === index);
}

function readAccessConfig(resource = {}) {
  return {
    visibility: normalizeVisibility(resource.visibility),
    roles: parseAccessStringList(resource.visibleToRoles ?? resource.visible_to_roles)
      .map(item => item.toLowerCase()),
    userIds: parseAccessIdList(resource.visibleToUserIds ?? resource.visible_to_user_ids),
    classNames: parseAccessStringList(resource.visibleToClassNames ?? resource.visible_to_class_names)
  };
}

function getStudentClassName(userId) {
  if (!db || !userId) return '';
  const row = db.get('SELECT class_name FROM student_profiles WHERE user_id = ?', [userId]);
  return String(row?.class_name || '').trim();
}

function hasTeacherLinkToStudents(teacherId, studentIds = []) {
  const normalizedIds = Array.from(new Set(
    studentIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)
  ));
  if (!db || !teacherId || !normalizedIds.length) return false;
  const placeholders = normalizedIds.map(() => '?').join(',');
  const row = db.get(
    `SELECT 1 AS ok FROM teacher_student_links
     WHERE teacher_id = ? AND student_id IN (${placeholders})
     LIMIT 1`,
    [teacherId, ...normalizedIds]
  );
  return Boolean(row);
}

function hasTeacherLinkToClasses(teacherId, classNames = []) {
  const normalizedClasses = Array.from(new Set(
    classNames.map(item => String(item || '').trim()).filter(Boolean)
  ));
  if (!db || !teacherId || !normalizedClasses.length) return false;
  const placeholders = normalizedClasses.map(() => '?').join(',');
  const row = db.get(
    `SELECT 1 AS ok
     FROM teacher_student_links tsl
     JOIN student_profiles sp ON sp.user_id = tsl.student_id
     WHERE tsl.teacher_id = ? AND sp.class_name IN (${placeholders})
     LIMIT 1`,
    [teacherId, ...normalizedClasses]
  );
  return Boolean(row);
}

function accessGrantMatchesUser(user, config) {
  if (!user) return false;
  const role = String(user.role || '').trim().toLowerCase();
  const userId = Number(user.id || 0);
  if (config.roles.includes(role)) return true;
  if (config.userIds.includes(userId)) return true;
  if ((role === 'teacher' || role === 'judge') && hasTeacherLinkToStudents(userId, config.userIds)) {
    return true;
  }
  if (config.classNames.length) {
    if (role === 'student' && config.classNames.includes(getStudentClassName(userId))) {
      return true;
    }
    if ((role === 'teacher' || role === 'judge') && hasTeacherLinkToClasses(userId, config.classNames)) {
      return true;
    }
  }
  return false;
}

function getProjectParticipantIds(project) {
  if (!db || !project?.id) return [];
  const ids = [];
  const ownerId = Number(project.created_by || 0);
  if (ownerId > 0) ids.push(ownerId);
  db.all('SELECT user_id FROM project_members WHERE project_id = ?', [project.id])
    .forEach(row => {
      const id = Number(row.user_id || 0);
      if (id > 0) ids.push(id);
    });
  return Array.from(new Set(ids));
}

function isProjectMemberOrOwner(user, project) {
  if (!user || !project) return false;
  const userId = Number(user.id || 0);
  if (!userId) return false;
  if (Number(project.created_by || 0) === userId) return true;
  const row = db?.get(
    'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
    [project.id, userId]
  );
  return Boolean(row);
}

function canReadCourse(user, course) {
  if (!course) return false;
  const status = String(course.status || '').trim().toLowerCase();
  if (status !== 'published') {
    if (!user) return false;
    const role = String(user.role || '').trim().toLowerCase();
    if (role === 'admin') return true;
    if (Number(course.createdBy || course.created_by || 0) === Number(user.id || 0)) return true;
    return false;
  }
  const config = readAccessConfig(course);
  if (config.visibility === 'public') return true;
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (Number(course.createdBy || course.created_by || 0) === Number(user.id || 0)) return true;
  return accessGrantMatchesUser(user, config);
}

function canEditCourse(user, course) {
  if (!user || !course) return false;
  const role = String(user.role || '').trim().toLowerCase();
  if (role === 'admin') return true;
  return role === 'teacher'
    && Number(course.createdBy || course.created_by || 0) === Number(user.id || 0);
}

function canReadAssignmentSubmission(user, submission = {}) {
  if (!user || !submission) return false;
  const role = String(user.role || '').trim().toLowerCase();
  if (role === 'admin') return true;
  if (role === 'student') return Number(submission.student_id) === Number(user.id);
  if (role !== 'teacher') return false;
  return Number(submission.assignment_created_by || 0) === Number(user.id || 0)
    && hasTeacherLinkToStudents(Number(user.id || 0), [submission.student_id]);
}

function canReadProjectTopic(user, topic) {
  if (!topic) return false;
  const config = readAccessConfig(topic);
  if (config.visibility === 'public') return true;
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (Number(topic.createdBy || topic.created_by || 0) === Number(user.id || 0)) return true;
  return accessGrantMatchesUser(user, config);
}

function canReadProject(user, project) {
  if (!project) return false;
  const config = readAccessConfig(project);
  if (!user) return config.visibility === 'public';
  const role = String(user.role || '').trim().toLowerCase();
  if (role === 'admin') return true;
  if (isProjectMemberOrOwner(user, project)) return true;
  if (config.visibility === 'public') {
    if (role === 'teacher') return true;
    // Judges may only see projects explicitly assigned to them. Public
    // visibility is not an implicit judge assignment.
    return role === 'judge' && accessGrantMatchesUser(user, config);
  }
  if (accessGrantMatchesUser(user, config)) return true;
  if (config.visibility === 'assigned' && (role === 'teacher' || role === 'judge')) {
    return hasTeacherLinkToStudents(Number(user.id || 0), getProjectParticipantIds(project));
  }
  return false;
}

function canWriteProject(user, project) {
  if (!user || !project) return false;
  const config = readAccessConfig(project);
  const role = String(user.role || '').trim().toLowerCase();
  if (role === 'admin') return true;
  if (isProjectMemberOrOwner(user, project)) return true;
  return false;
}

function canSuperviseProject(user, project) {
  if (!user || !project) return false;
  const role = String(user.role || '').trim().toLowerCase();
  if (role === 'admin' || isProjectMemberOrOwner(user, project)) return true;
  if (role !== 'teacher' && role !== 'judge') return false;
  if (!canReadProject(user, project)) return false;
  const config = readAccessConfig(project);
  if (role === 'teacher' && config.visibility === 'public') return true;
  return accessGrantMatchesUser(user, config)
    || (role === 'teacher' && hasTeacherLinkToStudents(Number(user.id || 0), getProjectParticipantIds(project)));
}

function requireProjectAccess(request, reply, project, mode = 'read') {
  const allowed = mode === 'write'
    ? canWriteProject(request.user, project)
    : mode === 'supervise'
      ? canSuperviseProject(request.user, project)
      : canReadProject(request.user, project);
  if (!allowed) {
    // Hide the existence of resources the caller cannot see. This applies to
    // details, attachments and all project child resources.
    reply.code(404);
    reply.send({ error: '项目不存在' });
    return false;
  }
  return true;
}

function parseGiteaRepoUrl(repoUrl) {
  const raw = String(repoUrl || '').trim();
  if (!raw) return null;
  try {
    const normalized = raw.endsWith('.git') ? raw.slice(0, -4) : raw;
    const url = new URL(normalized);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const repo = parts.pop();
    const owner = parts.pop();
    if (!owner || !repo) return null;
    return { host: url.origin, owner, repo, repoUrl: `${url.origin}/${owner}/${repo}` };
  } catch (err) {
    const match = raw.match(/^https?:\/\/[^/]+\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
    if (match) {
      const url = new URL(raw.replace(/\.git$/i, ''));
      return { host: url.origin, owner: match[1], repo: match[2], repoUrl: `${url.origin}/${match[1]}/${match[2]}` };
    }
    return null;
  }
}

async function validateGiteaRepo(repoUrl) {
  const parsed = parseGiteaRepoUrl(repoUrl);
  if (!parsed) {
    return { ok: false, status: 400, error: 'Gitea 仓库地址格式无效' };
  }
  if (!envValue('GITEA_BASE_URL', GITEA_BASE_URL) || !envValue('GITEA_ADMIN_TOKEN', GITEA_ADMIN_TOKEN)) {
    return { ok: false, status: 503, error: 'Gitea 仓库校验服务未配置' };
  }
  const repoPath = `/api/v1/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`;
  const result = await requestGitea(repoPath, { method: 'GET' });
  if (!result.ok) {
    if (result.status === 404) {
      return { ok: false, status: 404, error: 'Gitea 仓库不存在' };
    }
    return { ok: false, status: result.status || 502, error: result.data?.message || 'Gitea 仓库校验失败' };
  }
  return { ok: true, repo: { ...parsed, repoUrl: result.data?.html_url || parsed.repoUrl } };
}

function buildMilestoneSourceKey(task, index = 0) {
  const phase = String(task?.phase || task?.description || 'm1').trim() || 'm1';
  const title = String(task?.title || '').trim().toLowerCase();
  const output = String(task?.output || task?.deliverables?.output || '').trim().toLowerCase();
  const base = [phase, title, output, index].join('|');
  return crypto.createHash('sha1').update(base).digest('hex');
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

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map(item => String(item || '').trim()).filter(Boolean)));
}

function normalizeNullableText(value) {
  const text = String(value || '').trim();
  return text || '';
}

function normalizeNullableNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
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
  if (['milestone_1', 'milestone_2', 'midterm', 'final'].includes(type)) {
    const missingCodeFields = ['codeRepo', 'codeCommit'].filter(key => !String(details?.[key] || '').trim());
    if (missingCodeFields.length) {
      const labels = missingCodeFields.map(key => SUBMISSION_FIELD_LABELS[key] || key).join('、');
      return `缺少必填字段：${labels}`;
    }
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

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const {
  createToken,
  getAuthToken,
  getUserFromToken,
  hashPassword,
  normalizeEmail,
  requireAuth,
  requireRole,
  verifyPassword
} = createAuthHelpers({
  crypto,
  authSecret: AUTH_SECRET,
  authTokenTtlHours: AUTH_TOKEN_TTL_HOURS,
  getUserById: (userId) => db?.get(
    'SELECT id, name, username, email, role, avatar_url FROM users WHERE id = ?',
    [userId]
  ) || null
});

const {
  appendFileSafe,
  cleanupTempFiles,
  collectMultipart,
  moveTempFiles,
  resolveUnder,
  sanitizeName,
  streamZip,
  toCsvLine
} = createFileHelpers({
  fs,
  path,
  os,
  pump,
  archiver,
  ensureDir,
  uploadDir: UPLOAD_DIR,
  uploadMaxBytes: UPLOAD_MAX_BYTES,
  uploadMaxMb: UPLOAD_MAX_MB,
  allowedExtensions: ALLOWED_EXTENSIONS,
  allowedMimeTypes: ALLOWED_MIME_TYPES,
  extensionMimeMap: EXTENSION_MIME_MAP
});

ensureDir(UPLOAD_DIR);
ensureDir(LOG_DIR);
ensureDir(ASSESSMENT_DIR);

fastify.register(require('@fastify/cors'), {
  origin(origin, callback) {
    if (!origin || CORS_ALLOWED_ORIGINS.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  }
});
fastify.register(require('@fastify/rate-limit'), {
  global: true,
  max: 300,
  timeWindow: '1 minute',
  errorResponseBuilder: (_request, context) => ({
    error: '请求过于频繁，请稍后再试',
    retryAfter: Math.ceil(Number(context.ttl || 60000) / 1000)
  })
});
fastify.register(require('@fastify/multipart'), {
  limits: { fileSize: UPLOAD_MAX_BYTES, files: 10 }
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
fastify.get('/favicon.ico', (request, reply) => {
  reply.code(204).send();
});

if (WEB_SPA) {
  fastify.setNotFoundHandler((request, reply) => {
    const url = request.raw?.url || '';
    const pathname = url.split('?')[0] || '';
    const looksLikeStaticAsset =
      pathname.startsWith('/assets/') ||
      pathname.startsWith('/course-covers/') ||
      pathname.startsWith('/data/') ||
      pathname.startsWith('/js/') ||
      pathname.startsWith('/uploads/') ||
      pathname.startsWith('/assessment/') ||
      /\.[a-z0-9]+$/i.test(pathname);

    if (url.startsWith(API_PREFIX) || looksLikeStaticAsset) {
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

const rateLimitBuckets = new Map();
function rateLimitPolicy(request) {
  const route = String(request.routeOptions?.url || request.routerPath || request.url || '').split('?')[0];
  const ip = String(request.ip || request.socket?.remoteAddress || 'unknown');
  if (route.endsWith('/auth/login')) {
    return { max: 10, windowMs: 15 * 60 * 1000, key: `login:${ip}:${normalizeEmail(request.body?.email || request.body?.username || '')}` };
  }
  if (route.endsWith('/auth/register')) {
    return { max: 5, windowMs: 60 * 60 * 1000, key: `register:${ip}` };
  }
  if (/\/assignments\/\d+\/submissions$/.test(route)
    || /\/projects\/\d+\/submissions$/.test(route)
    || route.endsWith('/assessments')) {
    return { max: 20, windowMs: 60 * 60 * 1000, key: `upload:${request.user?.id ? `user:${request.user.id}` : `ip:${ip}`}` };
  }
  return { max: 300, windowMs: 60 * 1000, key: `global:${ip}` };
}

fastify.addHook('preHandler', (request, reply, done) => {
  if (!request.url.startsWith(API_PREFIX)) return done();
  const policy = rateLimitPolicy(request);
  const nowMs = Date.now();
  const current = rateLimitBuckets.get(policy.key);
  const bucket = current && current.expiresAt > nowMs
    ? current
    : { count: 0, expiresAt: nowMs + policy.windowMs };
  bucket.count += 1;
  rateLimitBuckets.set(policy.key, bucket);
  if (rateLimitBuckets.size > 10000) {
    for (const [key, value] of rateLimitBuckets) {
      if (value.expiresAt <= nowMs) rateLimitBuckets.delete(key);
      if (rateLimitBuckets.size <= 5000) break;
    }
  }
  const retryAfter = Math.max(1, Math.ceil((bucket.expiresAt - nowMs) / 1000));
  reply.header('X-RateLimit-Limit', policy.max);
  reply.header('X-RateLimit-Remaining', Math.max(0, policy.max - bucket.count));
  if (bucket.count > policy.max) {
    reply.header('Retry-After', retryAfter);
    reply.code(429).send({ error: '请求过于频繁，请稍后再试', retryAfter });
    return;
  }
  done();
});

fastify.setErrorHandler((error, request, reply) => {
  const statusCode = Number(error?.statusCode) || 500;
  const message = statusCode >= 500 ? '服务器内部错误' : (error.message || '请求失败');
  if (statusCode >= 500) {
    request.log.error(error);
  }
  reply.code(statusCode).send({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && error?.stack ? { stack: error.stack } : {})
  });
});

function updateProjectStatus(projectId, status, note) {
  projectRepository.updateStatus(projectId, status, note);
}

function getProject(projectId) {
  return projectRepository.getById(projectId);
}

function getProjectDetail(projectId) {
  return projectRepository.getDetail(projectId);
}

function getSubmissionAttachments(submissionId, fallback) {
  const rows = db.all(
    `SELECT a.id, a.file_name, a.file_path, a.file_size, s.type AS submission_type, s.status AS submission_status, p.visibility AS project_visibility
     FROM attachments a
     JOIN submissions s ON s.id = a.submission_id
     JOIN projects p ON p.id = s.project_id
     WHERE a.submission_id = ? ORDER BY a.id ASC`,
    [submissionId]
  );
  if (rows.length) {
    return rows.map(row => ({
      id: row.id,
      name: row.file_name,
      path: row.file_path,
      size: row.file_size,
      url: row.submission_type === 'showcase' && row.submission_status === 'approved' && row.project_visibility === 'public'
        ? `/api/v1/showcase-attachments/${row.id}/download`
        : `/api/v1/project-attachments/${row.id}/download`
    }));
  }
  return parseAttachmentList(fallback).map(att => ({
    ...att,
    url: ''
  }));
}

function getProjectMilestones(projectId) {
  return projectRepository.listMilestones(projectId);
}

function getProjectResources(projectId) {
  return projectRepository.listResources(projectId);
}

function getProjectDevLogs(projectId) {
  return projectRepository.listDevLogs(projectId);
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
function createViewerToken() {
  return crypto.randomBytes(18).toString('hex');
}

function createLearnerToken() {
  return crypto.randomBytes(18).toString('hex');
}

function normalizeKnowledgeAnswers(rawAnswers) {
  if (!Array.isArray(rawAnswers)) return [];
  return rawAnswers
    .map((item, index) => ({
      questionId: String(item?.questionId || `q-${index + 1}`).trim(),
      prompt: String(item?.prompt || '').trim(),
      type: String(item?.type || '').trim(),
      answer: String(item?.answer || '').trim()
    }))
    .filter(item => item.prompt && item.answer);
}

function normalizeKnowledgePromptType(value) {
  const type = String(value || '').trim();
  return type === 'single_choice' ? 'single_choice' : 'short_answer';
}

function normalizeKnowledgePromptOptions(options) {
  if (!Array.isArray(options)) return [];
  return options
    .map((option, index) => {
      if (option && typeof option === 'object') {
        return {
          id: String(option.id || option.value || String.fromCharCode(97 + index)).trim(),
          text: String(option.text || option.label || option.value || '').trim()
        };
      }
      return {
        id: String.fromCharCode(97 + index),
        text: String(option || '').trim()
      };
    })
    .filter(option => option.id && option.text);
}

function serializeKnowledgePromptOptions(options) {
  const normalized = normalizeKnowledgePromptOptions(options);
  return normalized.length ? JSON.stringify(normalized) : '';
}

function parseKnowledgePromptOptions(value) {
  return normalizeKnowledgePromptOptions(safeParseJson(value));
}

function publicKnowledgePrompt(prompt) {
  const type = normalizeKnowledgePromptType(prompt?.type || prompt?.promptType);
  const normalized = {
    id: String(prompt?.id || prompt?.promptId || '').trim(),
    type,
    prompt: String(prompt?.prompt || '').trim(),
    expectation: String(prompt?.expectation || '').trim()
  };
  const options = normalizeKnowledgePromptOptions(prompt?.options);
  if (type === 'single_choice') normalized.options = options;
  return normalized;
}

function knowledgePromptFromDbRow(row, fallbackPrompt = null) {
  const type = normalizeKnowledgePromptType(row.prompt_type || fallbackPrompt?.type);
  const options = parseKnowledgePromptOptions(row.options_json);
  return {
    id: row.prompt_id,
    type,
    prompt: row.prompt,
    expectation: row.expectation || fallbackPrompt?.expectation || '',
    options: options.length ? options : normalizeKnowledgePromptOptions(fallbackPrompt?.options),
    correctAnswer: String(row.correct_answer || fallbackPrompt?.correctAnswer || '').trim()
  };
}

function getKnowledgePromptAnswer(answer) {
  return String(answer?.answer || '').trim();
}

function getKnowledgeAnswerText(answer) {
  return String(answer?.answerText || answer?.answer || '').trim();
}

function findKnowledgePromptOption(prompt, value) {
  const answer = String(value || '').trim();
  if (!answer) return null;
  return normalizeKnowledgePromptOptions(prompt?.options).find(option => (
    option.id === answer || option.text === answer
  )) || null;
}

function validateKnowledgeAnswersForPrompts(prompts, rawAnswers) {
  const answerById = new Map(rawAnswers.map(answer => [String(answer.questionId || '').trim(), answer]));
  const normalized = [];
  if (!prompts.length) {
    return { error: '本节题目暂未发布，请稍后再提交。', answers: [] };
  }
  for (const prompt of prompts) {
    const promptId = String(prompt.id || '').trim();
    const answer = answerById.get(promptId);
    const value = getKnowledgePromptAnswer(answer);
    if (!answer || !value) {
      return { error: `请完成全部 ${prompts.length} 题后再提交。`, answers: [] };
    }
    if (normalizeKnowledgePromptType(prompt.type) === 'single_choice') {
      const option = findKnowledgePromptOption(prompt, value);
      if (!option) {
        return { error: '请选择每道选择题的答案。', answers: [] };
      }
      normalized.push({
        questionId: promptId,
        type: 'single_choice',
        prompt: prompt.prompt,
        answer: option.id,
        answerText: option.text
      });
      continue;
    }
    if (value.length < 10) {
      return { error: '简答题至少写 10 个字，说明场景和判断依据。', answers: [] };
    }
    normalized.push({
      questionId: promptId,
      type: 'short_answer',
      prompt: prompt.prompt,
      answer: value
    });
  }
  return { error: '', answers: normalized };
}

function getKnowledgeEpisodePromptPreset(detail, episode = {}) {
  const disciplineId = String(detail?.discipline?.id || '').trim();
  const key = String(episode?.episodeKey || getKnowledgeEpisodeKey(episode?.video) || '').trim();
  const title = String(episode?.video?.title || detail?.learningUnit?.source?.title || detail?.learningUnit?.title || '').trim();
  if (disciplineId !== 'ai') return null;
  if (key === 'ai-02' || key === 'BV1YJ411D7Ap' || /监督式学习/.test(title)) {
    return {
      task: '这节要判断你是否理解监督式学习的基本条件。',
      prompts: [
        {
          id: 'concept',
          type: 'single_choice',
          prompt: '监督式学习最需要哪一类训练数据？',
          options: [
            { id: 'a', text: '输入和标准答案成对' },
            { id: 'b', text: '只有未标注材料' },
            { id: 'c', text: '只靠随机奖励' },
            { id: 'd', text: '只靠运行速度' }
          ],
          correctAnswer: 'a',
          expectation: '选出“输入 + 标签/答案”的核心条件。'
        },
        {
          id: 'transfer',
          type: 'single_choice',
          prompt: '下面哪个校园任务最适合改写成监督式学习问题？',
          options: [
            { id: 'a', text: '作业照片标清晰度' },
            { id: 'b', text: '随便生成广播稿' },
            { id: 'c', text: '只统计经过人数' },
            { id: 'd', text: '按首字母排序' }
          ],
          correctAnswer: 'a',
          expectation: '判断是否有可学习的输入和标签。'
        },
        {
          id: 'verification',
          type: 'short_answer',
          prompt: '如果用监督式学习做一个校园小工具，你会怎样验证它没有只背训练样本？',
          expectation: '写清楚测试数据、判断指标，以及一种可能出错的情况。'
        }
      ]
    };
  }
  if (key === 'ai-12' || key === 'BV157411876W' || /游戏/.test(title)) {
    return {
      task: '这节要判断你是否理解 AI 玩游戏时的试错闭环。',
      prompts: [
        {
          id: 'concept',
          type: 'single_choice',
          prompt: 'AI 玩游戏时，奖励信号主要用来做什么？',
          options: [
            { id: 'a', text: '强化更好的行动' },
            { id: 'b', text: '让画面更清晰' },
            { id: 'c', text: '写固定答案' },
            { id: 'd', text: '保证首次获胜' }
          ],
          correctAnswer: 'a',
          expectation: '抓住行动、反馈、奖励之间的关系。'
        },
        {
          id: 'transfer',
          type: 'single_choice',
          prompt: '下面哪个校园例子最像“通过试错改进策略”？',
          options: [
            { id: 'a', text: '按送书结果改路线' },
            { id: 'b', text: '书名按拼音排序' },
            { id: 'c', text: '原样抄进表格' },
            { id: 'd', text: '定时播放铃声' }
          ],
          correctAnswer: 'a',
          expectation: '判断任务里是否有行动选择和反馈。'
        },
        {
          id: 'verification',
          type: 'short_answer',
          prompt: '设计一个校园试错任务，并说明怎样判断它是真的学会了更好的策略。',
          expectation: '写出可选行动、奖励标准，以及重复测试或对照方法。'
        }
      ]
    };
  }
  return {
    task: '这节要判断你是否理解“什么是人工智能”。',
    prompts: [
      {
        id: 'concept',
        type: 'single_choice',
        prompt: '这集更接近把人工智能理解成哪一种能力？',
        options: [
          { id: 'a', text: '按输入判断并输出' },
          { id: 'b', text: '只要运行得快' },
          { id: 'c', text: '自动化都算 AI' },
          { id: 'd', text: '会聊天就算 AI' }
        ],
        correctAnswer: 'a',
        expectation: '选出最能概括本集定义的一项。'
      },
      {
        id: 'transfer',
        type: 'single_choice',
        prompt: '下面哪个问题更适合用 AI 方法尝试解决？',
        options: [
          { id: 'a', text: '看照片判断桶满' },
          { id: 'b', text: '按学号排序' },
          { id: 'c', text: '打印今天日期' },
          { id: 'd', text: '定时播放铃声' }
        ],
        correctAnswer: 'a',
        expectation: '判断任务是否需要从数据中识别模式。'
      },
      {
        id: 'verification',
        type: 'short_answer',
        prompt: '选一个校园场景，说明它为什么适合或不适合用 AI 解决。',
        expectation: '写清楚任务目标、可用数据和判断标准。'
      }
    ]
  };
}

function buildKnowledgeOpenPrompts(detail, episode = {}, options = {}) {
  const disciplineId = String(detail?.discipline?.id || '').trim();
  const episodeKey = String(episode?.episodeKey || getKnowledgeEpisodeKey(episode?.video) || '').trim();
  const preset = getKnowledgeEpisodePromptPreset(detail, episode);
  const presetById = new Map((preset?.prompts || []).map(prompt => [String(prompt.id || '').trim(), prompt]));
  if (disciplineId && episodeKey && db) {
    const rows = db.all(
      `SELECT prompt_id, prompt_type, prompt, options_json, correct_answer, expectation
       FROM knowledge_open_prompts
       WHERE discipline_id = ? AND episode_key = ? AND status = ?
       ORDER BY sort_order ASC, id ASC`,
      [disciplineId, episodeKey, 'published']
    );
    if (rows.length) {
      const prompts = rows.map(row => knowledgePromptFromDbRow(row, presetById.get(String(row.prompt_id || '').trim())));
      return options.includeAnswers ? prompts : prompts.map(publicKnowledgePrompt);
    }
  }
  if (preset?.prompts?.length) {
    return options.includeAnswers ? preset.prompts : preset.prompts.map(publicKnowledgePrompt);
  }
  const discipline = detail?.discipline || {};
  const learningUnit = detail?.learningUnit || {};
  const firstQuestion = String(discipline?.research_questions?.[0]?.q || '').trim();
  const firstContext = String(discipline?.research_questions?.[0]?.context || '').trim();
  const firstProjectPrompt = String(learningUnit?.next?.projectPrompts?.[0] || '').trim();
  const prompts = [
    {
      id: 'observation',
      type: 'short_answer',
      prompt: firstQuestion || `看完这节“${learningUnit.title || discipline.name || '知识课程'}”后，你最想研究的具体问题是什么？`,
      expectation: firstContext || '要写出一个具体场景、对象或变量，而不是泛泛地说“我想研究环境”。'
    },
    {
      id: 'method',
      type: 'short_answer',
      prompt: '如果你真的要开始做这个小研究，你准备怎样观察、记录或比较？',
      expectation: '至少写出时间、地点、记录方法或评价指标中的两个。'
    },
    {
      id: 'project',
      type: 'short_answer',
      prompt: firstProjectPrompt || '把这个知识点改写成一个可以继续做下去的小项目。',
      expectation: '要写出你想做什么、怎样判断是否有效。'
    }
  ];
  return options.includeAnswers ? prompts : prompts.map(publicKnowledgePrompt);
}

function getKnowledgeEpisodeKey(video) {
  return String(video?.id || video?.bvid || video?.url || '').trim();
}

function resolveKnowledgeEpisode(detail, requestedEpisodeKey) {
  const videos = getKnowledgeSeriesVideos(detail);
  if (!videos.length) {
    return { videos, episodeKey: 'source', episodeIndex: 0, video: null };
  }
  const requested = String(requestedEpisodeKey || '').trim();
  const foundIndex = requested
    ? videos.findIndex(video => getKnowledgeEpisodeKey(video) === requested || String(video?.bvid || '') === requested)
    : 0;
  const episodeIndex = foundIndex >= 0 ? foundIndex : 0;
  return {
    videos,
    episodeKey: getKnowledgeEpisodeKey(videos[episodeIndex]),
    episodeIndex,
    video: videos[episodeIndex]
  };
}

function getKnowledgeIdentityCondition(request, learnerToken) {
  if (request.user?.id) {
    return { sql: 'user_id = ?', params: [request.user.id] };
  }
  const token = String(learnerToken || '').trim();
  if (token) {
    return { sql: 'learner_token = ?', params: [token] };
  }
  return null;
}

function getKnowledgeEpisodeProgress(detail, request, learnerToken) {
  const videos = getKnowledgeSeriesVideos(detail);
  const identity = getKnowledgeIdentityCondition(request, learnerToken);
  if (!identity) {
    return {
      unlockedUntil: videos.length ? 1 : 0,
      completedCount: 0,
      passedEpisodeKeys: [],
      videos
    };
  }
  const rows = db.all(
    `SELECT episode_key, episode_index, passed
     FROM knowledge_responses
     WHERE discipline_id = ? AND ${identity.sql}
     ORDER BY episode_index DESC, created_at DESC`,
    [detail.discipline.id, ...identity.params]
  );
  const passedByIndex = new Map();
  rows.forEach(row => {
    const key = String(row.episode_key || '').trim();
    const currentIndex = videos.findIndex(video => getKnowledgeEpisodeKey(video) === key || String(video?.bvid || '') === key);
    const index = currentIndex >= 0 ? currentIndex : Number(row.episode_index || 0);
    if (!key || Number(row.passed || 0) !== 1 || passedByIndex.has(index)) return;
    passedByIndex.set(index, key);
  });
  let unlockedUntil = videos.length ? 1 : 0;
  for (let index = 0; index < videos.length; index += 1) {
    if (index === 0) continue;
    if (passedByIndex.has(index - 1)) {
      unlockedUntil = index + 1;
      continue;
    }
    break;
  }
  return {
    unlockedUntil,
    completedCount: passedByIndex.size,
    passedEpisodeKeys: Array.from(passedByIndex.values()),
    videos
  };
}

function scoreKnowledgeResponseFallback(detail, answers, episode = {}, prompts = null) {
  const expectedPrompts = Array.isArray(prompts) && prompts.length
    ? prompts
    : buildKnowledgeOpenPrompts(detail, episode, { includeAnswers: true });
  const answerById = new Map(answers.map(item => [String(item.questionId || '').trim(), item]));
  const joined = answers.map(item => `${item.prompt}\n${getKnowledgeAnswerText(item)}`).join('\n');
  const text = joined.toLowerCase();
  const isAiUnit = String(detail?.discipline?.id || '') === 'ai';
  const choicePrompts = expectedPrompts.filter(item => normalizeKnowledgePromptType(item.type) === 'single_choice');
  const shortPrompts = expectedPrompts.filter(item => normalizeKnowledgePromptType(item.type) !== 'single_choice');
  if (choicePrompts.length) {
    const choiceWeight = shortPrompts.length ? 50 / choicePrompts.length : 100 / expectedPrompts.length;
    const shortWeight = shortPrompts.length ? 50 / shortPrompts.length : 100 / expectedPrompts.length;
    let total = 0;
    const rubric = expectedPrompts.map((prompt, index) => {
      const answer = answerById.get(String(prompt.id || '').trim());
      if (normalizeKnowledgePromptType(prompt.type) === 'single_choice') {
        const selected = findKnowledgePromptOption(prompt, getKnowledgePromptAnswer(answer));
        const correct = String(prompt.correctAnswer || '').trim();
        const passed = Boolean(selected && correct && (selected.id === correct || selected.text === correct));
        if (passed) total += choiceWeight;
        return {
          key: prompt.id,
          label: `第 ${index + 1} 题`,
          max: 4,
          score: passed ? 4 : 0,
          feedback: passed ? '选择正确。' : (prompt.expectation || '回看题干里的核心概念。')
        };
      }
      const answerText = getKnowledgeAnswerText(answer);
      const hasScenario = /校园|教室|操场|图书|作业|社团|食堂|走廊|班级|垃圾|图片|声音|文本|样本|场景|学生|老师|路线|测试/.test(answerText);
      const hasData = /数据|输入|照片|记录|样本|标签|标准|指标|正确率|错误|对照|测试|验证|风险|判断/.test(answerText);
      const hasReason = /因为|所以|适合|不适合|有效|无效|判断|比较|观察|记录/.test(answerText);
      let score = answerText.length >= 10 ? 2 : 1;
      if (hasScenario) score += 1;
      if (hasData || hasReason) score += 1;
      score = Math.max(0, Math.min(4, score));
      total += (score / 4) * shortWeight;
      return {
        key: prompt.id,
        label: `第 ${index + 1} 题`,
        max: 4,
        score,
        feedback: score >= 4
          ? '场景、依据和判断标准都比较清楚。'
          : prompt.expectation || '补充场景、可用数据和判断标准。'
      };
    });
    const wrongChoices = rubric.filter(item => item.score === 0).length;
    const weakShortAnswer = rubric.some(item => item.key && item.score > 0 && item.score < 3);
    const score = Math.round(Math.max(0, Math.min(100, total)));
    const suggestions = [];
    if (wrongChoices) suggestions.push('先把选择题里的核心概念重新对齐。');
    if (weakShortAnswer) suggestions.push('简答题补上场景、数据和判断标准。');
    return {
      score,
      feedback: suggestions.length
        ? `已完成。${suggestions.join(' ')}`
        : '已完成，概念判断和迁移表达都达标。',
      rubric,
      summary: answers.map(item => getKnowledgeAnswerText(item)).filter(Boolean).slice(-1)[0] || '',
      provider: 'fallback'
    };
  }
  const rubric = [
    {
      key: 'concept',
      label: '概念是否抓准',
      max: 4,
      score: (
        isAiUnit
          ? /输入|输出|判断|任务|数据|标签|奖励|反馈|行动|模型|学习|智能|预测|分类/.test(joined)
          : /概念|定义|目标|对象|变量|原因/.test(joined)
      ) ? 4 : 2,
      feedback: isAiUnit ? '是否说清 AI 在什么任务中做判断。' : '是否抓住本节核心概念。'
    },
    {
      key: 'transfer',
      label: '能否迁移到场景',
      max: 4,
      score: /校园|教室|操场|图书|作业|社团|食堂|走廊|班级|垃圾|图片|声音|文本|样本|场景/.test(joined) ? 4 : 2,
      feedback: '是否能把视频概念放进一个真实任务里。'
    },
    {
      key: 'verification',
      label: '是否有验证标准',
      max: 4,
      score: /验证|测试|判断|是否有效|正确率|错误|对照|指标|样本|偏差|风险|重复/.test(joined) ? 4 : 2,
      feedback: '是否说明怎样判断方案真的有效。'
    },
    {
      key: 'clarity',
      label: '表达是否清楚',
      max: 4,
      score: text.length >= 90 ? 4 : text.length >= 45 ? 3 : 2,
      feedback: '回答是否完整，是否让别人能看懂你想做什么。'
    }
  ];
  const total = rubric.reduce((sum, item) => sum + item.score, 0);
  const percent = Math.round((total / rubric.reduce((sum, item) => sum + item.max, 0)) * 100);
  const strengths = [];
  const suggestions = [];
  if (rubric[0].score >= 4) strengths.push('你已经抓住了本节的核心概念。');
  else suggestions.push(`先补一句“${episodeTitle.includes('监督') ? '输入和标签是什么' : episodeTitle.includes('游戏') ? '行动、反馈、奖励是什么' : 'AI 在处理什么输入、输出什么结果'}”。`);
  if (rubric[1].score >= 4) strengths.push('你能把概念迁移到具体场景。');
  else suggestions.push('补一个具体场景，不要只停留在抽象定义。');
  if (rubric[2].score >= 4) strengths.push('你提到了怎样判断方案是否有效。');
  else suggestions.push('补上测试方法或评价指标，这会直接影响是否解锁下一节。');

  return {
    score: percent,
    feedback: [
      strengths.length ? `亮点：${strengths.join(' ')}` : '亮点：你已经开始把课程内容转成自己的研究表达。',
      suggestions.length ? `建议：${suggestions.join(' ')}` : '建议：下一步可以把它继续写成一周内可执行的小项目。'
    ].join(' '),
    rubric,
    provider: 'fallback'
  };
}

async function scoreKnowledgeResponse(detail, answers, apiKey, episode = {}) {
  const prompts = buildKnowledgeOpenPrompts(detail, episode, { includeAnswers: true });
  if (prompts.some(prompt => normalizeKnowledgePromptType(prompt.type) === 'single_choice')) {
    return scoreKnowledgeResponseFallback(detail, answers, episode, prompts);
  }
  if (!apiKey) return scoreKnowledgeResponseFallback(detail, answers, episode, prompts);
  const systemPrompt = [
    '你是一名初中创新课程的AI助教。',
    '请根据学生对课程开放题的回答做评分。',
    '输出必须是 JSON，不要输出额外解释。',
    'JSON schema: {"score":0-100,"feedback":"不超过120字","rubric":[{"label":"问题是否具体","score":0-4,"feedback":"一句话"},{"label":"方法是否可执行","score":0-4,"feedback":"一句话"},{"label":"是否有验证意识","score":0-4,"feedback":"一句话"},{"label":"表达是否清楚","score":0-4,"feedback":"一句话"}],"summary":"一句话总结"}'
  ].join('\n');
    const userPrompt = JSON.stringify({
      discipline: detail?.discipline?.name || detail?.discipline?.id || '',
      learningUnit: detail?.learningUnit?.title || '',
      episode: episode?.video?.title || episode?.episodeKey || '',
      expectedPrompts: prompts.map(publicKnowledgePrompt),
      studentAnswers: answers
  }, null, 2);
  try {
    const result = await requestAiChat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], apiKey);
    const raw = String(result?.content || '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : JSON.parse(raw);
    const rubric = Array.isArray(parsed?.rubric) ? parsed.rubric : [];
    const score = Number(parsed?.score);
    return {
      score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0,
      feedback: String(parsed?.feedback || '').trim() || '已完成自动评分。',
      rubric,
      summary: String(parsed?.summary || '').trim(),
      provider: 'ai'
    };
  } catch (err) {
    fastify.log.warn(`knowledge.ai.score failed: ${err.message}`);
    return scoreKnowledgeResponseFallback(detail, answers, episode, prompts);
  }
}

function maskKnowledgeName(name) {
  const text = String(name || '').trim();
  if (!text) return '同学';
  if (text.length <= 1) return `${text}同学`;
  return `${text.slice(0, 1)}*${text.slice(-1)}`;
}

function mapKnowledgeResponseRow(row, options = {}) {
  const revealIdentity = Boolean(options.revealIdentity);
  return {
    id: row.id,
    disciplineId: row.discipline_id,
    episodeKey: row.episode_key || '',
    episodeIndex: row.episode_index === null || row.episode_index === undefined ? 0 : Number(row.episode_index),
    displayName: revealIdentity ? row.display_name : maskKnowledgeName(row.display_name),
    focus: row.focus || '',
    answers: safeParseJson(row.answers) || [],
    summary: row.summary || '',
    aiScore: row.ai_score === null || row.ai_score === undefined ? null : Number(row.ai_score),
    aiFeedback: row.ai_feedback || '',
    aiRubric: safeParseJson(row.ai_rubric) || [],
    scoreProvider: row.score_provider || '',
    passed: Number(row.passed || 0) === 1,
    createdAt: row.created_at,
    isMine: Boolean(options.isMine)
  };
}

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

const {
  loadCourseCatalog,
  loadCourseDetail,
  listCourseLessons,
  listCourseMaterials,
  normalizeCoursePayload,
  normalizeLessonPayload,
  saveCourseDetail
} = createCourseContentService({
  path,
  fs,
  readJsonFile,
  writeJsonFile,
  normalizeTaxonomyArray,
  normalizeTaxonomyValue,
  getActiveTaxonomyIndex,
  courseCatalogPath: COURSE_CATALOG_PATH,
  coursesDir: COURSES_DIR,
  materialsDir: MATERIALS_DIR,
  courseDirections: COURSE_DIRECTIONS,
  courseStatuses: COURSE_STATUSES,
  courseMaterialSections: COURSE_MATERIAL_SECTIONS,
  apiPrefix: API_PREFIX,
  toUrlPath,
  sanitizeLessonContent
});

function findCourseByMaterialsRoot(materialsRoot) {
  const target = String(materialsRoot || '').trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!target) return null;
  const catalog = loadCourseCatalog();
  for (const item of catalog) {
    const course = loadCourseDetail(item.id);
    if (!course) continue;
    if (course.id === target || String(course.materialsRoot || '').trim() === target) {
      return course;
    }
  }
  return null;
}

const {
  dbJson,
  filterKnowledgeLearningVideos,
  findKnowledgeDetail,
  getKnowledgeSeriesVideos,
  loadAllKnowledgeSeriesFromDb,
  loadBilibiliSeriesVideos,
  loadCrashCourseSeries,
  loadCrashCourseVideos,
  loadDisciplines,
  loadKnowledgeDisciplinesFromDb,
  loadKnowledgeLearningUnits,
  loadKnowledgeLearningUnitsFromDb,
  loadKnowledgeSeriesFromDb,
  normalizeKnowledgeDisciplineId,
  seedKnowledgeContent
} = createKnowledgeContentService({
  getDb: () => db,
  now,
  readJsonFile,
  safeParseJson,
  loadCourseCatalog,
  getKnowledgeEpisodePromptPreset,
  normalizeKnowledgePromptType,
  serializeKnowledgePromptOptions,
  disciplineDataPath: DISCIPLINE_DATA_PATH,
  learningUnitsPath: DISCIPLINE_LEARNING_UNITS_PATH,
  crashCourseSeriesPath: CRASH_COURSE_SERIES_PATH,
  crashCourseVideosPath: CRASH_COURSE_VIDEOS_PATH,
  bilibiliSeriesVideosPath: BILIBILI_SERIES_VIDEOS_PATH
});

const {
  loadPortalBanners,
  savePortalBanners,
  normalizeBannerPayload,
  loadPortalStories,
  savePortalStories,
  normalizeStoryPayload,
  buildStoryResponse,
  buildCoursePreviewMap,
  listPublishedCompetitions,
  enrichCompetition,
  loadPortalCompetitionDetail,
  loadPortalCompetitions,
  savePortalCompetition,
  normalizeCompetitionPayload
} = createPortalContentService({
  path,
  readJsonFile,
  writeJsonFile,
  normalizeTaxonomyArray,
  normalizeTaxonomyValue,
  getActiveTaxonomyIndex,
  normalizeJsonArray,
  loadCourseCatalog,
  getCompetitionRegistrationStats,
  portalCompetitionsPath: PORTAL_COMPETITIONS_PATH,
  portalCompetitionDetailsDir: PORTAL_COMPETITION_DETAILS_DIR,
  portalStoriesPath: PORTAL_STORIES_PATH,
  portalBannersPath: PORTAL_BANNERS_PATH,
  competitionPublishStatuses: COMPETITION_PUBLISH_STATUSES
});

function getStudentCount() {
  const row = db.get('SELECT COUNT(*) AS count FROM users WHERE role = ?', ['student']);
  return row ? Number(row.count) || 0 : 0;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return normalizeStringArray(value);
  const raw = String(value || '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeStringArray(parsed) : [];
  } catch {
    return normalizeStringArray(raw.split(/[,，\n]/));
  }
}

function normalizeTaxonomyLookupToken(value) {
  return String(value || '').trim().toLowerCase();
}

function buildTaxonomyIndex(rows = []) {
  return rows.reduce((acc, row) => {
    const type = String(row.term_type || '').trim();
    const key = String(row.term_key || '').trim();
    if (!type || !key) return acc;
    if (!acc[type]) {
      acc[type] = { lookup: new Map(), labels: new Map() };
    }
    const lookup = acc[type].lookup;
    const labels = acc[type].labels;
    labels.set(key, String(row.label || key).trim() || key);
    [key, row.label, ...parseJsonArray(row.aliases)].forEach((item) => {
      const token = normalizeTaxonomyLookupToken(item);
      if (token) lookup.set(token, key);
    });
    return acc;
  }, {});
}

function getActiveTaxonomyIndex() {
  return buildTaxonomyIndex(db.all(
    'SELECT term_type, term_key, label, aliases FROM match_taxonomy_terms WHERE status = ?',
    ['active']
  ));
}

function resolveTaxonomyKey(termTypes = [], value, taxonomyIndex = null) {
  const token = normalizeTaxonomyLookupToken(value);
  if (!token) return '';
  const index = taxonomyIndex || getActiveTaxonomyIndex();
  for (const termType of termTypes) {
    const key = index?.[termType]?.lookup?.get(token);
    if (key) return key;
  }
  return String(value || '').trim();
}

function normalizeTaxonomyArray(value, termTypes = [], taxonomyIndex = null) {
  return normalizeStringArray(normalizeJsonArray(value).map(item => resolveTaxonomyKey(termTypes, item, taxonomyIndex)));
}

function normalizeTaxonomyValue(value, termTypes = [], taxonomyIndex = null) {
  return resolveTaxonomyKey(termTypes, value, taxonomyIndex);
}

function formatTaxonomyLabel(termType, value, taxonomyIndex = null) {
  const key = String(value || '').trim();
  if (!key) return '';
  const index = taxonomyIndex || getActiveTaxonomyIndex();
  return index?.[termType]?.labels?.get(key) || key;
}

function formatTaxonomyLabels(termType, values = [], taxonomyIndex = null) {
  return normalizeStringArray(values).map(item => formatTaxonomyLabel(termType, item, taxonomyIndex));
}

function formatBestEffortTaxonomyLabels(termTypes = [], values = [], taxonomyIndex = null) {
  const index = taxonomyIndex || getActiveTaxonomyIndex();
  return normalizeStringArray(values).map((item) => {
    for (const termType of termTypes) {
      const label = formatTaxonomyLabel(termType, item, index);
      if (label && label !== String(item || '').trim()) return label;
    }
    return String(item || '').trim();
  });
}

function safeParseJsonText(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function defaultStudentProfile(userId) {
  return {
    user_id: userId,
    school_stage: '',
    grade_level: '',
    class_name: '',
    interest_tags: '[]',
    skill_tags: '[]',
    target_tags: '[]',
    weekly_hours: null,
    experience_level: '',
    preferred_team_size: '',
    device_access: '',
    notes: '',
    profile_version: 1,
    created_at: now(),
    updated_at: now()
  };
}

function mapStudentProfile(row) {
  const profile = row || defaultStudentProfile(0);
  const taxonomyIndex = getActiveTaxonomyIndex();
  return {
    userId: Number(profile.user_id || 0),
    schoolStage: formatTaxonomyLabel('stage', profile.school_stage || '', taxonomyIndex),
    gradeLevel: profile.grade_level || '',
    className: profile.class_name || '',
    interestTags: formatBestEffortTaxonomyLabels(['discipline', 'skill'], parseJsonArray(profile.interest_tags), taxonomyIndex),
    skillTags: formatTaxonomyLabels('skill', parseJsonArray(profile.skill_tags), taxonomyIndex),
    targetTags: formatBestEffortTaxonomyLabels(['discipline', 'skill'], parseJsonArray(profile.target_tags), taxonomyIndex),
    weeklyHours: profile.weekly_hours === null || profile.weekly_hours === undefined ? null : Number(profile.weekly_hours),
    experienceLevel: profile.experience_level || '',
    preferredTeamSize: profile.preferred_team_size || '',
    deviceAccess: profile.device_access || '',
    notes: profile.notes || '',
    profileVersion: Number(profile.profile_version || 1),
    createdAt: profile.created_at || '',
    updatedAt: profile.updated_at || ''
  };
}

function normalizeStudentProfilePayload(input = {}, existing = {}) {
  const taxonomyIndex = getActiveTaxonomyIndex();
  return {
    school_stage: normalizeTaxonomyValue(input.schoolStage || input.school_stage || existing.school_stage, ['stage'], taxonomyIndex),
    grade_level: normalizeNullableText(input.gradeLevel || input.grade_level || existing.grade_level),
    class_name: normalizeNullableText(input.className || input.class_name || existing.class_name),
    interest_tags: JSON.stringify(normalizeTaxonomyArray(
      input.interestTags ?? input.interest_tags ?? parseJsonArray(existing.interest_tags),
      ['discipline', 'skill'],
      taxonomyIndex
    )),
    skill_tags: JSON.stringify(normalizeTaxonomyArray(
      input.skillTags ?? input.skill_tags ?? parseJsonArray(existing.skill_tags),
      ['skill'],
      taxonomyIndex
    )),
    target_tags: JSON.stringify(normalizeTaxonomyArray(
      input.targetTags ?? input.target_tags ?? parseJsonArray(existing.target_tags),
      ['discipline', 'skill'],
      taxonomyIndex
    )),
    weekly_hours: normalizeNullableNumber(input.weeklyHours ?? input.weekly_hours ?? existing.weekly_hours),
    experience_level: normalizeNullableText(input.experienceLevel || input.experience_level || existing.experience_level),
    preferred_team_size: normalizeNullableText(input.preferredTeamSize || input.preferred_team_size || existing.preferred_team_size),
    device_access: normalizeNullableText(input.deviceAccess || input.device_access || existing.device_access),
    notes: normalizeNullableText(input.notes || existing.notes),
    profile_version: Math.max(1, Number(existing.profile_version || 1))
  };
}

function getStudentProfile(userId) {
  return db.get('SELECT * FROM student_profiles WHERE user_id = ?', [userId]);
}

function seedStudentProfile(userId) {
  let row = getStudentProfile(userId);
  if (row) return row;
  const profile = defaultStudentProfile(userId);
  db.run(
    `INSERT INTO student_profiles
     (user_id, school_stage, grade_level, class_name, interest_tags, skill_tags, target_tags, weekly_hours, experience_level, preferred_team_size, device_access, notes, profile_version, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      profile.user_id,
      profile.school_stage,
      profile.grade_level,
      profile.class_name,
      profile.interest_tags,
      profile.skill_tags,
      profile.target_tags,
      profile.weekly_hours,
      profile.experience_level,
      profile.preferred_team_size,
      profile.device_access,
      profile.notes,
      profile.profile_version,
      profile.created_at,
      profile.updated_at
    ]
  );
  return getStudentProfile(userId);
}

function upsertStudentProfile(userId, payload) {
  const existing = seedStudentProfile(userId);
  const profileVersion = Number(existing.profile_version || 1) + 1;
  db.run(
    `UPDATE student_profiles
     SET school_stage = ?, grade_level = ?, class_name = ?, interest_tags = ?, skill_tags = ?, target_tags = ?, weekly_hours = ?, experience_level = ?, preferred_team_size = ?, device_access = ?, notes = ?, profile_version = ?, updated_at = ?
     WHERE user_id = ?`,
    [
      payload.school_stage,
      payload.grade_level,
      payload.class_name,
      payload.interest_tags,
      payload.skill_tags,
      payload.target_tags,
      payload.weekly_hours,
      payload.experience_level,
      payload.preferred_team_size,
      payload.device_access,
      payload.notes,
      profileVersion,
      now(),
      userId
    ]
  );
  return getStudentProfile(userId);
}

function getKnowledgeSignals(userId) {
  const responses = db.all('SELECT passed, ai_score FROM knowledge_responses WHERE user_id = ?', [userId]);
  const passedCount = responses.filter(row => Number(row.passed) === 1).length;
  const averageScore = responses.length
    ? responses.reduce((sum, row) => sum + (Number(row.ai_score) || 0), 0) / responses.length
    : 0;
  return { passedCount, averageScore };
}

function parseDeadlineDate(value = '') {
  const text = String(value || '').trim();
  if (!text) return null;
  let match = text.match(/(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59, 999);
  }
  match = text.match(/(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59, 999);
  }
  return null;
}

function countSharedTags(a = [], b = []) {
  const set = new Set(a.map(item => String(item || '').toLowerCase()));
  return b.filter(item => set.has(String(item || '').toLowerCase())).length;
}

function parseTeamSizePreference(value = '') {
  const text = String(value || '').trim();
  if (!text) return null;
  const rangeMatch = text.match(/(\d+)\s*[-~至]\s*(\d+)/);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min) {
      return { min, max };
    }
  }
  const exactMatch = text.match(/(\d+)/);
  if (exactMatch) {
    const size = Number(exactMatch[1]);
    if (Number.isFinite(size) && size > 0) return { min: size, max: size };
  }
  return null;
}

function teamSizeRangesOverlap(a, b) {
  if (!a || !b) return false;
  return Math.max(a.min, b.min) <= Math.min(a.max, b.max);
}

function getCanonicalProfileForMatching(profileRow) {
  const profile = profileRow || defaultStudentProfile(0);
  return {
    userId: Number(profile.user_id || 0),
    schoolStage: String(profile.school_stage || '').trim(),
    gradeLevel: profile.grade_level || '',
    className: profile.class_name || '',
    interestTags: parseJsonArray(profile.interest_tags),
    skillTags: parseJsonArray(profile.skill_tags),
    targetTags: parseJsonArray(profile.target_tags),
    weeklyHours: profile.weekly_hours === null || profile.weekly_hours === undefined ? null : Number(profile.weekly_hours),
    experienceLevel: profile.experience_level || '',
    preferredTeamSize: profile.preferred_team_size || '',
    deviceAccess: profile.device_access || '',
    notes: profile.notes || '',
    profileVersion: Number(profile.profile_version || 1),
    createdAt: profile.created_at || '',
    updatedAt: profile.updated_at || ''
  };
}

function listStudentUsers() {
  return db.all('SELECT id, name, email, role FROM users WHERE role = ? ORDER BY id ASC', ['student']);
}

function getUserForAccess(userId) {
  if (!db || !userId) return null;
  return db.get('SELECT id, name, email, role FROM users WHERE id = ?', [userId]) || null;
}

function getStudentCollaborationContext(studentIds = []) {
  const normalizedIds = Array.from(new Set(studentIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)));
  const contextMap = new Map();
  normalizedIds.forEach((id) => {
    contextMap.set(id, {
      teamIds: new Set(),
      projectIds: new Set(),
      teammateIds: new Set(),
      projectPartnerIds: new Set()
    });
  });
  if (!normalizedIds.length) return contextMap;

  const placeholders = normalizedIds.map(() => '?').join(',');
  const teamRows = db.all(
    `SELECT team_id, user_id FROM team_members WHERE user_id IN (${placeholders})`,
    normalizedIds
  );
  const teamGroups = new Map();
  teamRows.forEach((row) => {
    const teamId = Number(row.team_id || 0);
    const userId = Number(row.user_id || 0);
    if (!teamId || !userId || !contextMap.has(userId)) return;
    contextMap.get(userId).teamIds.add(teamId);
    if (!teamGroups.has(teamId)) teamGroups.set(teamId, new Set());
    teamGroups.get(teamId).add(userId);
  });
  teamGroups.forEach((members) => {
    const ids = Array.from(members);
    ids.forEach((userId) => {
      const context = contextMap.get(userId);
      if (!context) return;
      ids.forEach((peerId) => {
        if (peerId !== userId) context.teammateIds.add(peerId);
      });
    });
  });

  const projectRows = db.all(
    `SELECT id, created_by, team_id FROM projects
     WHERE deleted_at IS NULL
       AND (created_by IN (${placeholders})
        OR id IN (SELECT project_id FROM project_members WHERE user_id IN (${placeholders})))`,
    [...normalizedIds, ...normalizedIds]
  );
  const projectMemberRows = db.all(
    `SELECT project_id, user_id FROM project_members WHERE user_id IN (${placeholders})`,
    normalizedIds
  );
  const projectParticipants = new Map();

  projectRows.forEach((row) => {
    const projectId = Number(row.id || 0);
    if (!projectId) return;
    if (!projectParticipants.has(projectId)) projectParticipants.set(projectId, new Set());
    const creatorId = Number(row.created_by || 0);
    if (contextMap.has(creatorId)) {
      contextMap.get(creatorId).projectIds.add(projectId);
      projectParticipants.get(projectId).add(creatorId);
    }
    const teamId = Number(row.team_id || 0);
    if (teamId && teamGroups.has(teamId)) {
      teamGroups.get(teamId).forEach((userId) => {
        if (!contextMap.has(userId)) return;
        contextMap.get(userId).projectIds.add(projectId);
        projectParticipants.get(projectId).add(userId);
      });
    }
  });

  projectMemberRows.forEach((row) => {
    const projectId = Number(row.project_id || 0);
    const userId = Number(row.user_id || 0);
    if (!projectId || !userId || !contextMap.has(userId)) return;
    contextMap.get(userId).projectIds.add(projectId);
    if (!projectParticipants.has(projectId)) projectParticipants.set(projectId, new Set());
    projectParticipants.get(projectId).add(userId);
  });

  projectParticipants.forEach((participants, projectId) => {
    const ids = Array.from(participants);
    ids.forEach((userId) => {
      const context = contextMap.get(userId);
      if (!context) return;
      context.projectIds.add(projectId);
      ids.forEach((peerId) => {
        if (peerId !== userId) context.projectPartnerIds.add(peerId);
      });
    });
  });

  return contextMap;
}

function buildTeamCandidatePreview(userRow, profileRow, context = null) {
  const profile = getCanonicalProfileForMatching(profileRow);
  const taxonomyIndex = getActiveTaxonomyIndex();
  return {
    userId: Number(userRow?.id || profile.userId || 0),
    name: userRow?.name || '',
    email: userRow?.email || '',
    schoolStage: formatTaxonomyLabel('stage', profile.schoolStage, taxonomyIndex),
    gradeLevel: profile.gradeLevel || '',
    className: profile.className || '',
    interestTags: formatBestEffortTaxonomyLabels(['discipline', 'skill'], profile.interestTags, taxonomyIndex),
    skillTags: formatTaxonomyLabels('skill', profile.skillTags, taxonomyIndex),
    targetTags: formatBestEffortTaxonomyLabels(['discipline', 'skill'], profile.targetTags, taxonomyIndex),
    weeklyHours: profile.weeklyHours,
    experienceLevel: profile.experienceLevel || '',
    preferredTeamSize: profile.preferredTeamSize || '',
    teamCount: context ? context.teamIds.size : 0,
    activeProjectCount: context ? context.projectIds.size : 0
  };
}

function estimateCompetitionDeadline(competition) {
  if (competition.registrationDeadline) return parseDeadlineDate(competition.registrationDeadline);
  const detail = loadPortalCompetitionDetail(competition.slug);
  const timeline = Array.isArray(detail?.timeline) ? detail.timeline : [];
  const target = timeline.find(item => /截止|报送|提交/.test(String(item.label || '')));
  return parseDeadlineDate(target?.date || '');
}

function listPublishedProjectTopics(user = null, options = {}) {
  const topics = db.all(
    'SELECT * FROM project_topics WHERE status = ? ORDER BY updated_at DESC, id DESC',
    ['published']
  ).map(mapProjectTopic);
  if (options.includeRestricted) return topics;
  return topics.filter(topic => canReadProjectTopic(user, topic));
}

function inferCourseMatchSignals(course = {}) {
  const taxonomyIndex = getActiveTaxonomyIndex();
  const text = [
    course.direction,
    course.positioning,
    course.courseType,
    course.summary,
    course.description,
    ...(Array.isArray(course.learningObjectives) ? course.learningObjectives : [])
  ].filter(Boolean).join(' ');

  const inferredTags = [];
  const inferredSkills = [];

  if (/ai|机器学习|神经网络|视觉|算法|数据/i.test(text)) inferredTags.push('ai');
  if (/机器人|ros|硬件|物联网|传感器|控制/i.test(text)) inferredTags.push('robotics');
  if (/产品|用户|设计|访谈|方案/i.test(text)) inferredTags.push('product');
  if (/web|前端|后端|全栈|系统/i.test(text)) inferredTags.push('web');

  if (/python/i.test(text)) inferredSkills.push('python');
  if (/视觉|cv|computer vision|机器视觉/i.test(text)) inferredSkills.push('machine-vision');
  if (/硬件|gpio|树莓派|传感器/i.test(text)) inferredSkills.push('hardware');
  if (/前端|web|界面/i.test(text)) inferredSkills.push('frontend');
  if (/后端|接口|服务/i.test(text)) inferredSkills.push('backend');
  if (/调研|访谈|研究/i.test(text)) inferredSkills.push('research');

  return {
    tags: normalizeTaxonomyArray(
      (Array.isArray(course.tags) ? course.tags : []).concat(inferredTags),
      ['discipline', 'skill'],
      taxonomyIndex
    ),
    skillOutcomes: normalizeTaxonomyArray(
      (Array.isArray(course.skillOutcomes) ? course.skillOutcomes : []).concat(inferredSkills),
      ['skill'],
      taxonomyIndex
    ),
    difficultyPath: normalizeTaxonomyValue(
      course.difficultyPath || (String(course.audience || '').includes('零基础') ? 'beginner' : ''),
      ['difficulty'],
      taxonomyIndex
    )
  };
}

function computeCompetitionMatch(profileRow, competition, courseMap) {
  const profile = getCanonicalProfileForMatching(profileRow);
  const taxonomyIndex = getActiveTaxonomyIndex();
  const knowledge = getKnowledgeSignals(profile.userId);
  const reasons = [];
  const gaps = [];
  const ruleBreakdown = {};
  let score = 0;
  let eligibilityStatus = 'eligible';

  const normalizedCompetitionStage = normalizeStringArray(competition.schoolStage).map(item => item.toLowerCase());
  const profileStage = String(profile.schoolStage || '').toLowerCase();
  if (normalizedCompetitionStage.length) {
    if (profileStage && normalizedCompetitionStage.includes(profileStage)) {
      score += 25;
      ruleBreakdown.stage = 25;
      reasons.push(`学段匹配：${formatTaxonomyLabel('stage', profile.schoolStage, taxonomyIndex)}`);
    } else {
      ruleBreakdown.stage = 0;
      gaps.push(`适合学段：${formatTaxonomyLabels('stage', competition.schoolStage, taxonomyIndex).join(' / ') || '待确认'}`);
      eligibilityStatus = 'conditional';
    }
  } else {
    ruleBreakdown.stage = 12;
    score += 12;
  }

  const competitionTags = normalizeStringArray([
    ...(competition.discipline || []),
    ...(competition.tags || [])
  ]);
  const interestOverlap = countSharedTags(profile.interestTags, competitionTags);
  const targetOverlap = countSharedTags(profile.targetTags, competitionTags);
  const requiredSkills = normalizeStringArray(competition.requiredSkills);
  const recommendedSkills = normalizeStringArray(competition.recommendedSkills);
  const skillOverlap = countSharedTags(profile.skillTags, requiredSkills.length ? requiredSkills : recommendedSkills);

  const interestScore = Math.min(20, interestOverlap * 10);
  score += interestScore;
  ruleBreakdown.interest = interestScore;
  if (interestScore > 0) reasons.push(`兴趣方向匹配：${interestOverlap} 项`);
  else gaps.push('兴趣方向未明显匹配，建议先确认是否真要投入准备');

  const skillScore = Math.min(15, skillOverlap * 7.5);
  score += skillScore;
  ruleBreakdown.skills = skillScore;
  if (requiredSkills.length && skillOverlap === 0) {
    gaps.push(`缺少核心技能：${formatTaxonomyLabels('skill', requiredSkills, taxonomyIndex).join(' / ')}`);
    eligibilityStatus = eligibilityStatus === 'eligible' ? 'conditional' : eligibilityStatus;
  } else if (skillScore > 0) {
    reasons.push(`技能基础匹配：${skillOverlap} 项`);
  }

  const targetScore = Math.min(10, targetOverlap * 5);
  score += targetScore;
  ruleBreakdown.target = targetScore;
  if (targetScore > 0) reasons.push(`目标方向重合：${targetOverlap} 项`);

  const deadline = estimateCompetitionDeadline(competition);
  if (deadline && Date.now() > deadline.getTime()) {
    ruleBreakdown.timeline = 0;
    eligibilityStatus = 'ineligible';
    gaps.push('报名时间已过，需要改为补登记或训练跟进');
  } else if (deadline) {
    ruleBreakdown.timeline = 10;
    score += 10;
    reasons.push('报名时间窗口仍可行动');
  } else {
    ruleBreakdown.timeline = 5;
    score += 5;
    gaps.push('未找到明确报名截止时间，请人工核对');
  }

  const difficultyMap = { beginner: 10, basic: 10, medium: 7, advanced: 4, hard: 4 };
  const experienceMap = { beginner: 'beginner', basic: 'basic', medium: 'medium', advanced: 'advanced' };
  const difficultyKey = String(competition.difficulty || '').trim().toLowerCase();
  const experienceKey = String(profile.experienceLevel || '').trim().toLowerCase();
  const difficultyScore = difficultyKey
    ? ((experienceMap[experienceKey] === difficultyKey || !experienceKey) ? (difficultyMap[difficultyKey] || 6) : 5)
    : 6;
  ruleBreakdown.difficulty = difficultyScore;
  score += difficultyScore;
  if (difficultyKey && experienceKey && experienceKey !== difficultyKey) {
    gaps.push(`赛事难度为 ${competition.difficulty}，当前经验为 ${profile.experienceLevel || '未填写'}`);
  }

  const weeklyHours = Number(profile.weeklyHours || 0);
  const estimatedHours = Number(competition.estimatedHours || 0);
  let timeScore = 5;
  if (estimatedHours > 0 && weeklyHours > 0) {
    timeScore = weeklyHours >= estimatedHours ? 10 : (weeklyHours >= Math.ceil(estimatedHours * 0.6) ? 6 : 2);
    if (timeScore < 6) gaps.push(`建议每周至少投入 ${estimatedHours} 小时，目前填写 ${weeklyHours} 小时`);
  } else if (estimatedHours > 0 && weeklyHours <= 0) {
    gaps.push(`建议补充每周投入时间，赛事预估需要 ${estimatedHours} 小时`);
  }
  ruleBreakdown.time = timeScore;
  score += timeScore;

  const relatedCourses = normalizeStringArray(competition.relatedCourseIds || []);
  const courseSignals = relatedCourses.length ? 5 : 0;
  const knowledgeSignals = knowledge.passedCount > 0 ? 5 : 0;
  const foundationScore = Math.min(10, courseSignals + knowledgeSignals);
  ruleBreakdown.foundation = foundationScore;
  score += foundationScore;
  if (foundationScore > 0) reasons.push('已有课程或知识闯关基础');
  else gaps.push('建议先补课程或知识闯关基础');

  const override = db.get(
    'SELECT * FROM match_overrides WHERE user_id = ? AND target_type = ? AND target_key = ? ORDER BY updated_at DESC, created_at DESC LIMIT 1',
    [profile.userId, 'competition', competition.slug]
  );
  let overrideState = null;
  if (override) {
    overrideState = {
      id: override.id,
      overrideType: override.override_type,
      note: override.note || '',
      createdBy: Number(override.created_by || 0),
      createdAt: override.created_at,
      updatedAt: override.updated_at
    };
    if (override.override_type === 'boost') score += 8;
    if (override.override_type === 'suppress') score = Math.max(0, score - 15);
    if (override.override_type === 'force_include') eligibilityStatus = 'eligible';
    if (override.override_type === 'force_exclude') eligibilityStatus = 'ineligible';
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const lastInteraction = db.get(
    'SELECT interaction_type, created_at FROM match_interactions WHERE user_id = ? AND target_type = ? AND target_key = ? ORDER BY created_at DESC LIMIT 1',
    [profile.userId, 'competition', competition.slug]
  );

  return {
    targetType: 'competition',
    targetKey: competition.slug,
    competition: enrichCompetition(competition, courseMap),
    score,
    eligibilityStatus: MATCH_ELIGIBILITY_STATUSES.has(eligibilityStatus) ? eligibilityStatus : 'conditional',
    ruleBreakdown,
    reasons,
    gaps,
    aiSummary: '',
    aiAdvice: '',
    overrideState,
    interactionState: lastInteraction
      ? { interactionType: lastInteraction.interaction_type, createdAt: lastInteraction.created_at }
      : null,
    computedAt: now(),
    sourceSnapshot: {
      profile: {
        ...profile,
        schoolStageLabel: formatTaxonomyLabel('stage', profile.schoolStage, taxonomyIndex),
        interestTagsLabel: formatBestEffortTaxonomyLabels(['discipline', 'skill'], profile.interestTags, taxonomyIndex),
        skillTagsLabel: formatTaxonomyLabels('skill', profile.skillTags, taxonomyIndex),
        targetTagsLabel: formatBestEffortTaxonomyLabels(['discipline', 'skill'], profile.targetTags, taxonomyIndex)
      },
      competition: {
        slug: competition.slug,
        title: competition.title,
        tags: competitionTags,
        requiredSkills,
        recommendedSkills
      }
    }
  };
}

function computeProjectTopicMatch(profileRow, topic, courseMap) {
  const profile = getCanonicalProfileForMatching(profileRow);
  const taxonomyIndex = getActiveTaxonomyIndex();
  const knowledge = getKnowledgeSignals(profile.userId);
  const reasons = [];
  const gaps = [];
  const ruleBreakdown = {};
  let score = 0;
  let eligibilityStatus = 'eligible';

  const topicTags = normalizeStringArray(topic.tags || []);
  const interestOverlap = countSharedTags(profile.interestTags, topicTags);
  const targetOverlap = countSharedTags(profile.targetTags, topicTags);
  const requiredSkills = normalizeStringArray(topic.requiredSkills || []);
  const skillOverlap = countSharedTags(profile.skillTags, requiredSkills);

  const interestScore = Math.min(25, interestOverlap * 12.5);
  score += interestScore;
  ruleBreakdown.interest = interestScore;
  if (interestScore > 0) reasons.push(`项目方向匹配：${interestOverlap} 项`);
  else gaps.push('项目方向与当前兴趣标签重合较少');

  const skillScore = requiredSkills.length
    ? Math.min(20, skillOverlap * (20 / Math.max(requiredSkills.length, 1)))
    : 10;
  score += skillScore;
  ruleBreakdown.skills = skillScore;
  if (requiredSkills.length && skillOverlap === 0) {
    gaps.push(`待补核心技能：${formatTaxonomyLabels('skill', requiredSkills, taxonomyIndex).join(' / ')}`);
    eligibilityStatus = 'conditional';
  } else if (skillScore > 0) {
    reasons.push(`项目技能基础匹配：${skillOverlap || 1} 项`);
  }

  const targetScore = Math.min(15, targetOverlap * 7.5);
  score += targetScore;
  ruleBreakdown.target = targetScore;
  if (targetScore > 0) reasons.push(`目标方向重合：${targetOverlap} 项`);

  const weeklyHours = Number(profile.weeklyHours || 0);
  const estimatedHours = Number(topic.estimatedHours || 0);
  let timeScore = 8;
  if (estimatedHours > 0 && weeklyHours > 0) {
    timeScore = weeklyHours >= estimatedHours ? 15 : (weeklyHours >= Math.ceil(estimatedHours * 0.6) ? 10 : 4);
    if (timeScore < 10) gaps.push(`建议每周至少投入 ${estimatedHours} 小时，目前填写 ${weeklyHours} 小时`);
  } else if (estimatedHours > 0 && weeklyHours <= 0) {
    timeScore = 4;
    gaps.push(`建议补充每周投入时间，项目预估需要 ${estimatedHours} 小时`);
  }
  score += timeScore;
  ruleBreakdown.time = timeScore;

  const difficultyMap = { beginner: 15, basic: 15, intermediate: 10, medium: 10, advanced: 6, hard: 4 };
  const experienceMap = { beginner: 'beginner', basic: 'basic', medium: 'intermediate', advanced: 'advanced' };
  const difficultyKey = String(topic.difficulty || '').trim().toLowerCase();
  const experienceKey = String(profile.experienceLevel || '').trim().toLowerCase();
  const difficultyScore = difficultyKey
    ? ((experienceMap[experienceKey] === difficultyKey || !experienceKey) ? (difficultyMap[difficultyKey] || 8) : 6)
    : 8;
  score += difficultyScore;
  ruleBreakdown.difficulty = difficultyScore;
  if (difficultyKey && experienceKey && experienceMap[experienceKey] && experienceMap[experienceKey] !== difficultyKey) {
    gaps.push(`项目难度为 ${topic.difficulty}，当前经验为 ${profile.experienceLevel || '未填写'}`);
  }

  const relatedCourseIds = normalizeStringArray([topic.relatedCourseId].filter(Boolean));
  const courseSignals = relatedCourseIds.length ? 6 : 0;
  const knowledgeSignals = knowledge.passedCount > 0 ? 4 : 0;
  const foundationScore = Math.min(10, courseSignals + knowledgeSignals);
  score += foundationScore;
  ruleBreakdown.foundation = foundationScore;
  if (foundationScore > 0) reasons.push('已有课程或知识闯关基础可迁移');
  else gaps.push('建议先补充相关课程或基础训练');

  const preferredTeamSize = String(profile.preferredTeamSize || '').trim();
  const suggestedTeamSize = String(topic.suggestedTeamSize || '').trim();
  let teamScore = 5;
  if (preferredTeamSize && suggestedTeamSize) {
    const normalizedPreferred = preferredTeamSize.replace(/\s+/g, '');
    const normalizedSuggested = suggestedTeamSize.replace(/\s+/g, '');
    teamScore = normalizedPreferred === normalizedSuggested ? 10 : 6;
    if (teamScore < 10) gaps.push(`建议团队规模 ${suggestedTeamSize}，当前偏好 ${preferredTeamSize}`);
  }
  score += teamScore;
  ruleBreakdown.team = teamScore;

  const override = db.get(
    'SELECT * FROM match_overrides WHERE user_id = ? AND target_type = ? AND target_key = ? ORDER BY updated_at DESC, created_at DESC LIMIT 1',
    [profile.userId, 'project_topic', String(topic.id)]
  );
  let overrideState = null;
  if (override) {
    overrideState = {
      id: override.id,
      overrideType: override.override_type,
      note: override.note || '',
      createdBy: Number(override.created_by || 0),
      createdAt: override.created_at,
      updatedAt: override.updated_at
    };
    if (override.override_type === 'boost') score += 8;
    if (override.override_type === 'suppress') score = Math.max(0, score - 15);
    if (override.override_type === 'force_include') eligibilityStatus = 'eligible';
    if (override.override_type === 'force_exclude') eligibilityStatus = 'ineligible';
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const lastInteraction = db.get(
    'SELECT interaction_type, created_at FROM match_interactions WHERE user_id = ? AND target_type = ? AND target_key = ? ORDER BY created_at DESC LIMIT 1',
    [profile.userId, 'project_topic', String(topic.id)]
  );

  return {
    targetType: 'project_topic',
    targetKey: String(topic.id),
    projectTopic: topic,
    score,
    eligibilityStatus: MATCH_ELIGIBILITY_STATUSES.has(eligibilityStatus) ? eligibilityStatus : 'conditional',
    ruleBreakdown,
    reasons,
    gaps,
    aiSummary: '',
    aiAdvice: '',
    overrideState,
    interactionState: lastInteraction
      ? { interactionType: lastInteraction.interaction_type, createdAt: lastInteraction.created_at }
      : null,
    computedAt: now(),
    sourceSnapshot: {
      profile: {
        ...profile,
        schoolStageLabel: formatTaxonomyLabel('stage', profile.schoolStage, taxonomyIndex),
        interestTagsLabel: formatBestEffortTaxonomyLabels(['discipline', 'skill'], profile.interestTags, taxonomyIndex),
        skillTagsLabel: formatTaxonomyLabels('skill', profile.skillTags, taxonomyIndex),
        targetTagsLabel: formatBestEffortTaxonomyLabels(['discipline', 'skill'], profile.targetTags, taxonomyIndex)
      },
      projectTopic: {
        id: topic.id,
        title: topic.title,
        tags: normalizeStringArray(topic.tags || []),
        requiredSkills: normalizeStringArray(topic.requiredSkills || []),
        relatedCourseId: topic.relatedCourseId || '',
        relatedCompetitionSlug: topic.relatedCompetitionSlug || ''
      }
    }
  };
}

function computeCourseMatch(profileRow, course) {
  const profile = getCanonicalProfileForMatching(profileRow);
  const taxonomyIndex = getActiveTaxonomyIndex();
  const signals = inferCourseMatchSignals(course);
  const reasons = [];
  const gaps = [];
  const ruleBreakdown = {};
  let score = 0;
  let eligibilityStatus = 'eligible';

  const courseTags = normalizeStringArray(signals.tags);
  const interestOverlap = countSharedTags(profile.interestTags, courseTags);
  const targetOverlap = countSharedTags(profile.targetTags, courseTags);
  const skillOutcomes = normalizeStringArray(signals.skillOutcomes);
  const skillOverlap = countSharedTags(profile.skillTags, skillOutcomes);

  const interestScore = Math.min(25, interestOverlap * 12.5);
  score += interestScore;
  ruleBreakdown.interest = interestScore;
  if (interestScore > 0) reasons.push(`课程方向匹配：${interestOverlap} 项`);
  else gaps.push('课程方向与当前兴趣标签重合较少');

  const skillScore = skillOutcomes.length
    ? Math.min(20, skillOverlap * (20 / Math.max(skillOutcomes.length, 1)))
    : 8;
  score += skillScore;
  ruleBreakdown.skills = skillScore;
  if (skillOutcomes.length && skillOverlap === 0) {
    gaps.push(`课程将重点训练：${formatTaxonomyLabels('skill', skillOutcomes, taxonomyIndex).join(' / ')}`);
    eligibilityStatus = 'conditional';
  } else if (skillScore > 0) {
    reasons.push(`课程能力产出匹配：${skillOverlap || 1} 项`);
  }

  const targetScore = Math.min(15, targetOverlap * 7.5);
  score += targetScore;
  ruleBreakdown.target = targetScore;
  if (targetScore > 0) reasons.push(`目标方向重合：${targetOverlap} 项`);

  const audienceText = String(course.audience || '').trim();
  let stageScore = 8;
  if (/高中|高一|高二|高三|初中|初一|初二|初三/.test(audienceText)) {
    const profileStageLabel = formatTaxonomyLabel('stage', profile.schoolStage, taxonomyIndex);
    stageScore = audienceText.includes(profileStageLabel) ? 15 : 6;
    if (stageScore < 10) gaps.push(`课程面向：${audienceText}，当前画像学段：${profileStageLabel || '未填写'}`);
  }
  score += stageScore;
  ruleBreakdown.stage = stageScore;

  const difficultyMap = { beginner: 15, basic: 15, intermediate: 10, medium: 10, advanced: 6, hard: 4 };
  const experienceMap = { beginner: 'beginner', basic: 'basic', medium: 'intermediate', advanced: 'advanced' };
  const difficultyKey = String(signals.difficultyPath || '').trim().toLowerCase();
  const experienceKey = String(profile.experienceLevel || '').trim().toLowerCase();
  const difficultyScore = difficultyKey
    ? ((experienceMap[experienceKey] === difficultyKey || !experienceKey) ? (difficultyMap[difficultyKey] || 8) : 6)
    : 8;
  score += difficultyScore;
  ruleBreakdown.difficulty = difficultyScore;

  const foundationScore = Array.isArray(course.relatedProjects) && course.relatedProjects.length ? 10 : 6;
  score += foundationScore;
  ruleBreakdown.foundation = foundationScore;
  if (foundationScore > 6) reasons.push('课程与项目实践链路已关联');

  const override = db.get(
    'SELECT * FROM match_overrides WHERE user_id = ? AND target_type = ? AND target_key = ? ORDER BY updated_at DESC, created_at DESC LIMIT 1',
    [profile.userId, 'course', course.id]
  );
  let overrideState = null;
  if (override) {
    overrideState = {
      id: override.id,
      overrideType: override.override_type,
      note: override.note || '',
      createdBy: Number(override.created_by || 0),
      createdAt: override.created_at,
      updatedAt: override.updated_at
    };
    if (override.override_type === 'boost') score += 8;
    if (override.override_type === 'suppress') score = Math.max(0, score - 15);
    if (override.override_type === 'force_include') eligibilityStatus = 'eligible';
    if (override.override_type === 'force_exclude') eligibilityStatus = 'ineligible';
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const lastInteraction = db.get(
    'SELECT interaction_type, created_at FROM match_interactions WHERE user_id = ? AND target_type = ? AND target_key = ? ORDER BY created_at DESC LIMIT 1',
    [profile.userId, 'course', course.id]
  );

  return {
    targetType: 'course',
    targetKey: course.id,
    course,
    score,
    eligibilityStatus: MATCH_ELIGIBILITY_STATUSES.has(eligibilityStatus) ? eligibilityStatus : 'conditional',
    ruleBreakdown,
    reasons,
    gaps,
    aiSummary: '',
    aiAdvice: '',
    overrideState,
    interactionState: lastInteraction
      ? { interactionType: lastInteraction.interaction_type, createdAt: lastInteraction.created_at }
      : null,
    computedAt: now(),
    sourceSnapshot: {
      profile: {
        ...profile,
        schoolStageLabel: formatTaxonomyLabel('stage', profile.schoolStage, taxonomyIndex),
        interestTagsLabel: formatBestEffortTaxonomyLabels(['discipline', 'skill'], profile.interestTags, taxonomyIndex),
        skillTagsLabel: formatTaxonomyLabels('skill', profile.skillTags, taxonomyIndex),
        targetTagsLabel: formatBestEffortTaxonomyLabels(['discipline', 'skill'], profile.targetTags, taxonomyIndex)
      },
      course: {
        id: course.id,
        title: course.title,
        tags: courseTags,
        skillOutcomes: skillOutcomes,
        difficultyPath: signals.difficultyPath || ''
      }
    }
  };
}

function computeTeamCandidateMatch(profileRow, candidateProfileRow, candidateUserRow, relationship = {}) {
  const profile = getCanonicalProfileForMatching(profileRow);
  const candidateProfile = getCanonicalProfileForMatching(candidateProfileRow);
  const taxonomyIndex = getActiveTaxonomyIndex();
  const reasons = [];
  const gaps = [];
  const ruleBreakdown = {};
  let score = 0;
  let eligibilityStatus = 'eligible';

  const sourceUserId = Number(profile.userId || 0);
  const candidateUserId = Number(candidateUserRow?.id || candidateProfile.userId || 0);
  const sharedTeam = Boolean(relationship.sharedTeam);
  const sharedProject = Boolean(relationship.sharedProject);

  if (!sourceUserId || !candidateUserId || sourceUserId === candidateUserId) {
    return null;
  }

  if (sharedTeam || sharedProject) {
    eligibilityStatus = 'ineligible';
    ruleBreakdown.collaboration = 0;
    gaps.push(sharedTeam ? '该学生已是当前队友，无需重复推荐' : '该学生已与当前项目协作，优先保留给新的组队候选');
  }

  const sameStage = profile.schoolStage && candidateProfile.schoolStage && profile.schoolStage === candidateProfile.schoolStage;
  const sameClass = profile.className && candidateProfile.className && profile.className === candidateProfile.className;
  let stageScore = 10;
  if (sameStage) {
    stageScore = 15;
    reasons.push(`学段一致：${formatTaxonomyLabel('stage', profile.schoolStage, taxonomyIndex)}`);
  } else if (profile.schoolStage && candidateProfile.schoolStage) {
    stageScore = 4;
    eligibilityStatus = eligibilityStatus === 'eligible' ? 'conditional' : eligibilityStatus;
    gaps.push(`学段不同：你是 ${formatTaxonomyLabel('stage', profile.schoolStage, taxonomyIndex)}，对方是 ${formatTaxonomyLabel('stage', candidateProfile.schoolStage, taxonomyIndex)}`);
  }
  if (sameClass) {
    stageScore += 5;
    reasons.push(`同班协作成本更低：${profile.className}`);
  } else if (profile.className && candidateProfile.className) {
    gaps.push(`当前不在同一班级：${profile.className} / ${candidateProfile.className}`);
  }
  ruleBreakdown.stage = Math.min(stageScore, 20);
  score += ruleBreakdown.stage;

  const interestOverlap = countSharedTags(profile.interestTags, candidateProfile.interestTags);
  const targetOverlap = countSharedTags(profile.targetTags, candidateProfile.targetTags);
  const directionScore = Math.min(25, interestOverlap * 7.5 + targetOverlap * 5);
  ruleBreakdown.direction = Math.round(directionScore);
  score += ruleBreakdown.direction;
  if (directionScore > 0) {
    reasons.push(`兴趣/目标方向重合：${interestOverlap + targetOverlap} 项`);
  } else {
    gaps.push('兴趣和目标方向重合较少，建议先确认合作题目');
  }

  const sourceSkills = normalizeStringArray(profile.skillTags);
  const candidateSkills = normalizeStringArray(candidateProfile.skillTags);
  const sharedSkillCount = countSharedTags(sourceSkills, candidateSkills);
  const complementarySkills = candidateSkills.filter(skill => !sourceSkills.includes(skill));
  const complementScore = Math.min(25, sharedSkillCount * 5 + complementarySkills.length * 5);
  ruleBreakdown.skills = Math.round(complementScore);
  score += ruleBreakdown.skills;
  if (sharedSkillCount > 0) reasons.push(`具备共同技能基础：${sharedSkillCount} 项`);
  if (complementarySkills.length > 0) reasons.push(`对方可补位技能：${formatTaxonomyLabels('skill', complementarySkills, taxonomyIndex).slice(0, 3).join(' / ')}`);
  if (!sharedSkillCount && !complementarySkills.length) {
    gaps.push('双方技能画像都较少，建议先补充技能标签后再匹配');
    eligibilityStatus = eligibilityStatus === 'eligible' ? 'conditional' : eligibilityStatus;
  }

  const sourceHours = Number(profile.weeklyHours || 0);
  const candidateHours = Number(candidateProfile.weeklyHours || 0);
  let timeScore = 8;
  if (sourceHours > 0 && candidateHours > 0) {
    const delta = Math.abs(sourceHours - candidateHours);
    timeScore = delta <= 2 ? 15 : (delta <= 5 ? 10 : 4);
    if (timeScore >= 10) reasons.push('每周可投入时间相近');
    else gaps.push(`每周可投入时间差异较大：${sourceHours}h / ${candidateHours}h`);
  } else {
    gaps.push('建议双方补充每周可投入时间，便于判断协作节奏');
  }
  ruleBreakdown.time = timeScore;
  score += timeScore;

  const sourceTeamSize = parseTeamSizePreference(profile.preferredTeamSize);
  const candidateTeamSize = parseTeamSizePreference(candidateProfile.preferredTeamSize);
  let teamSizeScore = 6;
  if (sourceTeamSize && candidateTeamSize) {
    teamSizeScore = teamSizeRangesOverlap(sourceTeamSize, candidateTeamSize) ? 10 : 4;
    if (teamSizeScore >= 10) reasons.push('组队规模偏好一致');
    else gaps.push(`组队规模偏好不同：${profile.preferredTeamSize || '未填'} / ${candidateProfile.preferredTeamSize || '未填'}`);
  } else if (profile.preferredTeamSize || candidateProfile.preferredTeamSize) {
    teamSizeScore = 8;
  } else {
    gaps.push('建议补充偏好组队人数，便于后续成队');
  }
  ruleBreakdown.teamSize = teamSizeScore;
  score += teamSizeScore;

  const experienceScore = profile.experienceLevel && candidateProfile.experienceLevel
    ? (profile.experienceLevel === candidateProfile.experienceLevel ? 5 : 3)
    : 3;
  ruleBreakdown.readiness = experienceScore;
  score += experienceScore;
  if (experienceScore >= 5) reasons.push('经验层级接近，协作节奏更稳定');

  const override = db.get(
    'SELECT * FROM match_overrides WHERE user_id = ? AND target_type = ? AND target_key = ? ORDER BY updated_at DESC, created_at DESC LIMIT 1',
    [profile.userId, 'team_candidate', String(candidateUserId)]
  );
  let overrideState = null;
  if (override) {
    overrideState = {
      id: override.id,
      overrideType: override.override_type,
      note: override.note || '',
      createdBy: Number(override.created_by || 0),
      createdAt: override.created_at,
      updatedAt: override.updated_at
    };
    if (override.override_type === 'boost') score += 8;
    if (override.override_type === 'suppress') score = Math.max(0, score - 15);
    if (override.override_type === 'force_include') eligibilityStatus = 'eligible';
    if (override.override_type === 'force_exclude') eligibilityStatus = 'ineligible';
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const lastInteraction = db.get(
    'SELECT interaction_type, created_at FROM match_interactions WHERE user_id = ? AND target_type = ? AND target_key = ? ORDER BY created_at DESC LIMIT 1',
    [profile.userId, 'team_candidate', String(candidateUserId)]
  );

  return {
    targetType: 'team_candidate',
    targetKey: String(candidateUserId),
    teamCandidate: buildTeamCandidatePreview(candidateUserRow, candidateProfileRow, relationship.candidateContext || null),
    score,
    eligibilityStatus: MATCH_ELIGIBILITY_STATUSES.has(eligibilityStatus) ? eligibilityStatus : 'conditional',
    ruleBreakdown,
    reasons,
    gaps,
    aiSummary: '',
    aiAdvice: '',
    overrideState,
    interactionState: lastInteraction
      ? { interactionType: lastInteraction.interaction_type, createdAt: lastInteraction.created_at }
      : null,
    computedAt: now(),
    sourceSnapshot: {
      profile: {
        ...profile,
        schoolStageLabel: formatTaxonomyLabel('stage', profile.schoolStage, taxonomyIndex),
        interestTagsLabel: formatBestEffortTaxonomyLabels(['discipline', 'skill'], profile.interestTags, taxonomyIndex),
        skillTagsLabel: formatTaxonomyLabels('skill', profile.skillTags, taxonomyIndex),
        targetTagsLabel: formatBestEffortTaxonomyLabels(['discipline', 'skill'], profile.targetTags, taxonomyIndex)
      },
      teamCandidate: {
        userId: candidateUserId,
        name: candidateUserRow?.name || '',
        schoolStage: candidateProfile.schoolStage,
        schoolStageLabel: formatTaxonomyLabel('stage', candidateProfile.schoolStage, taxonomyIndex),
        className: candidateProfile.className || '',
        interestTags: candidateProfile.interestTags,
        interestTagsLabel: formatBestEffortTaxonomyLabels(['discipline', 'skill'], candidateProfile.interestTags, taxonomyIndex),
        skillTags: candidateProfile.skillTags,
        skillTagsLabel: formatTaxonomyLabels('skill', candidateProfile.skillTags, taxonomyIndex),
        targetTags: candidateProfile.targetTags,
        targetTagsLabel: formatBestEffortTaxonomyLabels(['discipline', 'skill'], candidateProfile.targetTags, taxonomyIndex),
        weeklyHours: candidateProfile.weeklyHours,
        experienceLevel: candidateProfile.experienceLevel || '',
        preferredTeamSize: candidateProfile.preferredTeamSize || '',
        sharedTeam,
        sharedProject
      }
    }
  };
}

async function buildAiMatchAdvice(match, aiKey) {
  if (!aiKey) return { aiSummary: '', aiAdvice: '' };
  try {
    let targetSummary = { targetType: match.targetType };
    if (match.targetType === 'project_topic') {
      targetSummary = {
        targetType: 'project_topic',
        projectTopic: {
          id: match.projectTopic?.id,
          title: match.projectTopic?.title,
          difficulty: match.projectTopic?.difficulty || '',
          tags: match.projectTopic?.tags || [],
          requiredSkills: match.projectTopic?.requiredSkills || []
        }
      };
    } else if (match.targetType === 'course') {
      targetSummary = {
        targetType: 'course',
        course: {
          id: match.course?.id,
          title: match.course?.title,
          tags: match.course?.tags || [],
          skillOutcomes: match.course?.skillOutcomes || [],
          difficultyPath: match.sourceSnapshot?.course?.difficultyPath || ''
        }
      };
    } else if (match.targetType === 'team_candidate') {
      targetSummary = {
        targetType: 'team_candidate',
        teamCandidate: {
          userId: match.teamCandidate?.userId,
          name: match.teamCandidate?.name || '',
          schoolStage: match.teamCandidate?.schoolStage || '',
          className: match.teamCandidate?.className || '',
          skillTags: match.teamCandidate?.skillTags || [],
          interestTags: match.teamCandidate?.interestTags || [],
          preferredTeamSize: match.teamCandidate?.preferredTeamSize || ''
        }
      };
    } else {
      targetSummary = {
        targetType: 'competition',
        competition: {
          slug: match.competition?.slug || '',
          title: match.competition?.title || '',
          difficulty: match.competition?.difficulty || '',
          schoolStage: match.competition?.schoolStage || [],
          tags: match.competition?.tags || []
        }
      };
    }
    const result = await requestAiChat([
      {
        role: 'system',
        content: '你是校内匹配助手。只能根据给定的结构化信息，输出简短、务实、无夸张的建议。'
      },
      {
        role: 'user',
        content: JSON.stringify({
          score: match.score,
          eligibilityStatus: match.eligibilityStatus,
          reasons: match.reasons,
          gaps: match.gaps,
          ...targetSummary,
          profile: match.sourceSnapshot.profile
        })
      }
    ], aiKey);
    const content = String(result.content || '').trim();
    if (!content) return { aiSummary: '', aiAdvice: '' };
    const [summary, ...rest] = content.split(/\n+/).filter(Boolean);
    return {
      aiSummary: summary.slice(0, 160),
      aiAdvice: rest.join(' ').slice(0, 320) || summary.slice(0, 320)
    };
  } catch {
    return { aiSummary: '', aiAdvice: '' };
  }
}

function persistMatch(userId, match, ruleVersion = MATCH_RULE_VERSION, aiVersion = MATCH_AI_VERSION) {
  const existing = db.get(
    'SELECT id FROM match_results WHERE user_id = ? AND target_type = ? AND target_key = ?',
    [userId, match.targetType, match.targetKey]
  );
  if (existing) {
    db.run(
      `UPDATE match_results
       SET score = ?, eligibility_status = ?, rule_breakdown = ?, reasons = ?, gaps = ?, ai_summary = ?, ai_advice = ?, rule_version = ?, ai_version = ?, source_snapshot = ?, computed_at = ?, expires_at = ?, updated_at = ?
       WHERE id = ?`,
      [
        match.score,
        match.eligibilityStatus,
        JSON.stringify(match.ruleBreakdown || {}),
        JSON.stringify(match.reasons || []),
        JSON.stringify(match.gaps || []),
        match.aiSummary || '',
        match.aiAdvice || '',
        ruleVersion,
        aiVersion,
        JSON.stringify(match.sourceSnapshot || {}),
        match.computedAt,
        '',
        now(),
        existing.id
      ]
    );
    return existing.id;
  }
  const createdAt = now();
  const info = db.run(
    `INSERT INTO match_results
     (user_id, target_type, target_key, score, eligibility_status, rule_breakdown, reasons, gaps, ai_summary, ai_advice, rule_version, ai_version, source_snapshot, computed_at, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      match.targetType,
      match.targetKey,
      match.score,
      match.eligibilityStatus,
      JSON.stringify(match.ruleBreakdown || {}),
      JSON.stringify(match.reasons || []),
      JSON.stringify(match.gaps || []),
      match.aiSummary || '',
      match.aiAdvice || '',
      ruleVersion,
      aiVersion,
      JSON.stringify(match.sourceSnapshot || {}),
      match.computedAt,
      '',
      createdAt,
      createdAt
    ]
  );
  return info.lastInsertRowid;
}

function mapMatchResultRow(row, competitionMap = {}, projectTopicMap = {}, courseMap = {}, teamCandidateMap = {}) {
  if (!row) return null;
  const competition = competitionMap[row.target_key];
  const projectTopic = projectTopicMap[row.target_key];
  const course = courseMap[row.target_key];
  const teamCandidate = teamCandidateMap[row.target_key];
  const override = db.get(
    'SELECT * FROM match_overrides WHERE user_id = ? AND target_type = ? AND target_key = ? ORDER BY updated_at DESC, created_at DESC LIMIT 1',
    [row.user_id, row.target_type, row.target_key]
  );
  const lastInteraction = db.get(
    'SELECT interaction_type, created_at FROM match_interactions WHERE user_id = ? AND target_type = ? AND target_key = ? ORDER BY created_at DESC LIMIT 1',
    [row.user_id, row.target_type, row.target_key]
  );
  return {
    id: Number(row.id),
    targetType: row.target_type,
    targetKey: row.target_key,
    score: Number(row.score || 0),
    eligibilityStatus: row.eligibility_status,
    ruleBreakdown: safeParseJsonText(row.rule_breakdown, {}),
    reasons: safeParseJsonText(row.reasons, []),
    gaps: safeParseJsonText(row.gaps, []),
    aiSummary: row.ai_summary || '',
    aiAdvice: row.ai_advice || '',
    overrideState: override ? {
      id: override.id,
      overrideType: override.override_type,
      note: override.note || '',
      createdBy: Number(override.created_by || 0),
      createdAt: override.created_at,
      updatedAt: override.updated_at
    } : null,
    interactionState: lastInteraction ? {
      interactionType: lastInteraction.interaction_type,
      createdAt: lastInteraction.created_at
    } : null,
    computedAt: row.computed_at,
    competition,
    projectTopic,
    course,
    teamCandidate
  };
}

function resolveMatchCandidateBucket({ targetType = '', eligibilityStatus = '', overrideState = null, interactionState = null, registrationStatus = '' } = {}) {
  const overrideType = String(overrideState?.overrideType || '').trim();
  if (overrideType === 'force_exclude' || overrideType === 'suppress') return 'manually_suppressed';
  if (targetType === 'competition') {
    if (registrationStatus === 'needs_materials') return 'needs_materials';
    if (registrationStatus) return 'already_registered';
  }
  if (String(interactionState?.interactionType || '').trim() === 'ignore') return 'ignored';
  if (eligibilityStatus === 'eligible') return 'ready_to_nudge';
  if (eligibilityStatus === 'conditional') return 'trainable';
  return 'hold';
}

function formatMatchCandidateBucketLabel(bucket) {
  return MATCH_CANDIDATE_BUCKET_LABELS[bucket] || MATCH_CANDIDATE_BUCKET_LABELS.hold;
}

function mapMatchReminder(row) {
  if (!row) return null;
  return {
    id: Number(row.id || 0),
    userId: Number(row.user_id || 0),
    targetType: row.target_type || '',
    targetKey: row.target_key || '',
    title: row.title || '',
    body: row.body || '',
    candidateBucket: row.candidate_bucket || '',
    createdBy: Number(row.created_by || 0),
    createdAt: row.created_at || '',
    readAt: row.read_at || '',
    studentName: row.student_name || '',
    studentEmail: row.student_email || '',
    teacherName: row.teacher_name || ''
  };
}

function sortCandidateItems(items = []) {
  return [...items].sort((a, b) => {
    const bucketDiff = (MATCH_CANDIDATE_BUCKET_ORDER[a.candidateBucket] ?? 99) - (MATCH_CANDIDATE_BUCKET_ORDER[b.candidateBucket] ?? 99);
    if (bucketDiff !== 0) return bucketDiff;
    return Number(b.score || 0) - Number(a.score || 0);
  });
}

function sortMatchItems(items = []) {
  return [...items].sort((a, b) => {
    const eligibilityDiff = (MATCH_ELIGIBILITY_ORDER[a.eligibilityStatus] ?? 9) - (MATCH_ELIGIBILITY_ORDER[b.eligibilityStatus] ?? 9);
    if (eligibilityDiff !== 0) return eligibilityDiff;
    return Number(b.score || 0) - Number(a.score || 0);
  });
}

function resolveMatchReminderTargetConfig(targetType = '', targetKey = '') {
  const normalizedType = String(targetType || '').trim();
  const normalizedKey = String(targetKey || '').trim();
  if (!normalizedType || !normalizedKey) return null;
  if (normalizedType === 'competition') {
    return {
      targetType: normalizedType,
      targetKey: normalizedKey,
      listCandidates: ({ actor, aiKey }) => listCompetitionCandidates({ slug: normalizedKey, actor, aiKey })
    };
  }
  if (normalizedType === 'project_topic') {
    const topicId = Number(normalizedKey);
    if (!topicId) return null;
    return {
      targetType: normalizedType,
      targetKey: normalizedKey,
      listCandidates: ({ actor, aiKey }) => listProjectTopicCandidates({ topicId, actor, aiKey })
    };
  }
  if (normalizedType === 'course') {
    return {
      targetType: normalizedType,
      targetKey: normalizedKey,
      listCandidates: ({ actor, aiKey }) => listCourseCandidates({ courseId: normalizedKey, actor, aiKey })
    };
  }
  if (normalizedType === 'team_candidate') {
    const userId = Number(normalizedKey);
    if (!userId) return null;
    return {
      targetType: normalizedType,
      targetKey: normalizedKey,
      listCandidates: ({ actor, aiKey }) => listStudentsForTeamCandidateTarget({ candidateId: userId, actor, aiKey })
    };
  }
  return null;
}

async function createMatchReminders({ targetType, targetKey, title, body, candidateBucket = '', studentIds = [], actor = null, aiKey = '' }) {
  const config = resolveMatchReminderTargetConfig(targetType, targetKey);
  if (!config) return { error: '匹配提醒目标无效' };
  let normalizedStudentIds = Array.isArray(studentIds)
    ? studentIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)
    : [];
  if (!normalizedStudentIds.length && candidateBucket) {
    const candidates = await config.listCandidates({ actor, aiKey });
    normalizedStudentIds = candidates
      .filter(item => item.candidateBucket === candidateBucket)
      .map(item => Number(item.userId))
      .filter(id => Number.isFinite(id) && id > 0);
  } else if (normalizedStudentIds.length && ['project_topic', 'course'].includes(config.targetType)) {
    const candidates = await config.listCandidates({ actor, aiKey });
    const allowedStudentIds = new Set(
      candidates.map(item => Number(item.userId)).filter(id => Number.isFinite(id) && id > 0)
    );
    normalizedStudentIds = normalizedStudentIds.filter(id => allowedStudentIds.has(id));
  }
  normalizedStudentIds = Array.from(new Set(normalizedStudentIds));
  if (!normalizedStudentIds.length) {
    return { error: candidateBucket ? '该候选分组下暂无学生可提醒' : '至少选择一名学生' };
  }
  const createdAt = now();
  const reminderIds = [];
  db.transaction((trx) => {
    normalizedStudentIds.forEach((userId) => {
      const info = trx.run(
        `INSERT INTO match_reminders (user_id, target_type, target_key, title, body, candidate_bucket, created_by, created_at, read_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, '')`,
        [userId, config.targetType, config.targetKey, title, body, candidateBucket || '', Number(actor?.id || 0), createdAt]
      );
      reminderIds.push(info.lastInsertRowid);
    });
  });
  normalizedStudentIds.forEach((userId) => {
    logMatchEvent({
      userId,
      targetType: config.targetType,
      targetKey: config.targetKey,
      eventType: 'teacher_reminder_sent',
      payload: {
        title,
        candidateBucket: candidateBucket || '',
        source: 'admin.match-reminders'
      }
    });
  });
  return {
    success: true,
    count: normalizedStudentIds.length,
    reminderIds,
    candidateBucket: candidateBucket || '',
    targetType: config.targetType,
    targetKey: config.targetKey
  };
}

function listMatchReminders({ targetType = '', targetKey = '', actor = null } = {}) {
  const params = [String(targetType || '').trim(), String(targetKey || '').trim()];
  let sql = `
    SELECT mr.*, u.name AS student_name, u.email AS student_email, t.name AS teacher_name
    FROM match_reminders mr
    JOIN users u ON u.id = mr.user_id
    LEFT JOIN users t ON t.id = mr.created_by
    WHERE mr.target_type = ? AND mr.target_key = ?
  `;
  if (actor?.role === 'student') {
    sql += ' AND mr.user_id = ?';
    params.push(Number(actor.id || 0));
  }
  sql += ' ORDER BY mr.created_at DESC, mr.id DESC';
  return db.all(sql, params).map(mapMatchReminder);
}

function listUserMatchReminders({ userId, includeRead = true } = {}) {
  const params = [Number(userId || 0)];
  let sql = `
    SELECT mr.*, u.name AS student_name, u.email AS student_email, t.name AS teacher_name
    FROM match_reminders mr
    JOIN users u ON u.id = mr.user_id
    LEFT JOIN users t ON t.id = mr.created_by
    WHERE mr.user_id = ?
  `;
  if (!includeRead) {
    sql += " AND (mr.read_at IS NULL OR mr.read_at = '')";
  }
  sql += ' ORDER BY mr.read_at ASC, mr.created_at DESC, mr.id DESC';
  return db.all(sql, params).map(mapMatchReminder);
}

function markMatchReminderRead({ reminderId, targetType = '', targetKey = '', actor = null } = {}) {
  const params = [now(), Number(reminderId || 0), String(targetType || '').trim(), String(targetKey || '').trim()];
  let sql = 'UPDATE match_reminders SET read_at = ? WHERE id = ? AND target_type = ? AND target_key = ?';
  if (actor?.role === 'student') {
    sql += ' AND user_id = ?';
    params.push(Number(actor.id || 0));
  }
  return db.run(sql, params);
}

async function recomputeCompetitionMatches({ userIds = [], actor = null, competitionSlugs = [], aiKey = '', preferCached = false, forceRefresh = false } = {}) {
  const normalizedUserIds = Array.from(new Set(userIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)));
  if (!normalizedUserIds.length) return [];
  const courseMap = buildCoursePreviewMap();
  const competitions = listPublishedCompetitions()
    .filter(item => !competitionSlugs.length || competitionSlugs.includes(item.slug));
  const competitionMap = competitions.reduce((acc, item) => {
    acc[item.slug] = enrichCompetition(item, courseMap);
    return acc;
  }, {});

  const items = [];
  for (const userId of normalizedUserIds) {
    seedStudentProfile(userId);
    const cachedRows = preferCached && !forceRefresh
      ? db.all('SELECT * FROM match_results WHERE user_id = ? AND target_type = ? ORDER BY score DESC, updated_at DESC', [userId, 'competition'])
      : [];
    if (cachedRows.length && !competitionSlugs.length) {
      cachedRows.forEach((row) => {
        const item = mapMatchResultRow(row, competitionMap);
        if (item) items.push(item);
      });
      continue;
    }
    const profileRow = seedStudentProfile(userId);
    for (const competition of competitions) {
      const match = computeCompetitionMatch(profileRow, competition, courseMap);
      const ai = await buildAiMatchAdvice(match, aiKey);
      match.aiSummary = ai.aiSummary;
      match.aiAdvice = ai.aiAdvice;
      match.computedAt = now();
      const id = persistMatch(userId, match, MATCH_RULE_VERSION, MATCH_AI_VERSION);
      logMatchEvent({
        userId,
        targetType: 'competition',
        targetKey: competition.slug,
        eventType: forceRefresh ? 'manual_recompute' : 'competition_match_computed',
        payload: { score: match.score, actorId: actor?.id || null }
      });
      items.push({
        id,
        targetType: match.targetType,
        targetKey: match.targetKey,
        score: match.score,
        eligibilityStatus: match.eligibilityStatus,
        ruleBreakdown: match.ruleBreakdown,
        reasons: match.reasons,
        gaps: match.gaps,
        aiSummary: match.aiSummary,
        aiAdvice: match.aiAdvice,
        overrideState: match.overrideState,
        interactionState: match.interactionState,
        computedAt: match.computedAt,
        competition: match.competition
      });
    }
  }

  return sortMatchItems(items);
}

async function recomputeProjectTopicMatches({ userIds = [], actor = null, projectTopicIds = [], aiKey = '', preferCached = false, forceRefresh = false } = {}) {
  const normalizedUserIds = Array.from(new Set(userIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)));
  if (!normalizedUserIds.length) return [];
  const courseMap = buildCoursePreviewMap();
  const allTopics = listPublishedProjectTopics(null, { includeRestricted: true })
    .filter(item => !projectTopicIds.length || projectTopicIds.includes(Number(item.id)));

  const items = [];
  for (const userId of normalizedUserIds) {
    seedStudentProfile(userId);
    const accessUser = getUserForAccess(userId);
    const topics = allTopics.filter(topic => canReadProjectTopic(accessUser, topic));
    const projectTopicMap = topics.reduce((acc, item) => {
      acc[String(item.id)] = item;
      return acc;
    }, {});
    const cachedRows = preferCached && !forceRefresh
      ? db.all('SELECT * FROM match_results WHERE user_id = ? AND target_type = ? ORDER BY score DESC, updated_at DESC', [userId, 'project_topic'])
      : [];
    if (cachedRows.length && !projectTopicIds.length) {
      cachedRows.forEach((row) => {
        const item = mapMatchResultRow(row, {}, projectTopicMap);
        if (item) items.push(item);
      });
      continue;
    }
    const profileRow = seedStudentProfile(userId);
    for (const topic of topics) {
      const match = computeProjectTopicMatch(profileRow, topic, courseMap);
      const ai = await buildAiMatchAdvice(match, aiKey);
      match.aiSummary = ai.aiSummary;
      match.aiAdvice = ai.aiAdvice;
      match.computedAt = now();
      const id = persistMatch(userId, match, PROJECT_TOPIC_MATCH_RULE_VERSION, PROJECT_TOPIC_MATCH_AI_VERSION);
      logMatchEvent({
        userId,
        targetType: 'project_topic',
        targetKey: String(topic.id),
        eventType: forceRefresh ? 'manual_recompute' : 'project_topic_match_computed',
        payload: { score: match.score, actorId: actor?.id || null }
      });
      items.push({
        id,
        targetType: match.targetType,
        targetKey: match.targetKey,
        score: match.score,
        eligibilityStatus: match.eligibilityStatus,
        ruleBreakdown: match.ruleBreakdown,
        reasons: match.reasons,
        gaps: match.gaps,
        aiSummary: match.aiSummary,
        aiAdvice: match.aiAdvice,
        overrideState: match.overrideState,
        interactionState: match.interactionState,
        computedAt: match.computedAt,
        projectTopic: match.projectTopic
      });
    }
  }

  return sortMatchItems(items);
}

async function recomputeCourseMatches({ userIds = [], actor = null, courseIds = [], aiKey = '', preferCached = false, forceRefresh = false } = {}) {
  const normalizedUserIds = Array.from(new Set(userIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)));
  if (!normalizedUserIds.length) return [];
  const allCourses = loadCourseCatalog()
    .filter(item => item.status === 'published')
    .filter(item => !courseIds.length || courseIds.includes(String(item.id)));

  const items = [];
  for (const userId of normalizedUserIds) {
    seedStudentProfile(userId);
    const accessUser = getUserForAccess(userId);
    const courses = allCourses.filter(course => canReadCourse(accessUser, course));
    const courseMap = courses.reduce((acc, item) => {
      acc[String(item.id)] = item;
      return acc;
    }, {});
    const cachedRows = preferCached && !forceRefresh
      ? db.all('SELECT * FROM match_results WHERE user_id = ? AND target_type = ? ORDER BY score DESC, updated_at DESC', [userId, 'course'])
      : [];
    if (cachedRows.length && !courseIds.length) {
      cachedRows.forEach((row) => {
        const item = mapMatchResultRow(row, {}, {}, courseMap);
        if (item) items.push(item);
      });
      continue;
    }
    const profileRow = seedStudentProfile(userId);
    for (const course of courses) {
      const match = computeCourseMatch(profileRow, course);
      const ai = await buildAiMatchAdvice(match, aiKey);
      match.aiSummary = ai.aiSummary;
      match.aiAdvice = ai.aiAdvice;
      match.computedAt = now();
      const id = persistMatch(userId, match, COURSE_MATCH_RULE_VERSION, COURSE_MATCH_AI_VERSION);
      logMatchEvent({
        userId,
        targetType: 'course',
        targetKey: String(course.id),
        eventType: forceRefresh ? 'manual_recompute' : 'course_match_computed',
        payload: { score: match.score, actorId: actor?.id || null }
      });
      items.push({
        id,
        targetType: match.targetType,
        targetKey: match.targetKey,
        score: match.score,
        eligibilityStatus: match.eligibilityStatus,
        ruleBreakdown: match.ruleBreakdown,
        reasons: match.reasons,
        gaps: match.gaps,
        aiSummary: match.aiSummary,
        aiAdvice: match.aiAdvice,
        overrideState: match.overrideState,
        interactionState: match.interactionState,
        computedAt: match.computedAt,
        course: match.course
      });
    }
  }

  return sortMatchItems(items);
}

async function recomputeTeamCandidateMatches({ userIds = [], actor = null, teamCandidateIds = [], aiKey = '', preferCached = false, forceRefresh = false } = {}) {
  const normalizedUserIds = Array.from(new Set(userIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0)));
  if (!normalizedUserIds.length) return [];
  const candidateFilter = new Set(teamCandidateIds.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0));
  const studentRows = listStudentUsers();
  const studentMap = studentRows.reduce((acc, row) => {
    acc[Number(row.id)] = row;
    return acc;
  }, {});
  const profileRows = db.all('SELECT * FROM student_profiles');
  const profileMap = profileRows.reduce((acc, row) => {
    acc[Number(row.user_id)] = row;
    return acc;
  }, {});
  const collaborationMap = getStudentCollaborationContext(studentRows.map(row => Number(row.id)));

  const items = [];
  for (const userId of normalizedUserIds) {
    seedStudentProfile(userId);
    const cachedRows = preferCached && !forceRefresh
      ? db.all('SELECT * FROM match_results WHERE user_id = ? AND target_type = ? ORDER BY score DESC, updated_at DESC', [userId, 'team_candidate'])
      : [];
    if (cachedRows.length && !candidateFilter.size) {
      const teamCandidateMap = {};
      cachedRows.forEach((row) => {
        const candidateId = Number(row.target_key || 0);
        if (!candidateId || !studentMap[candidateId]) return;
        teamCandidateMap[row.target_key] = buildTeamCandidatePreview(
          studentMap[candidateId],
          profileMap[candidateId] || seedStudentProfile(candidateId),
          collaborationMap.get(candidateId) || null
        );
      });
      cachedRows.forEach((row) => {
        const item = mapMatchResultRow(row, {}, {}, {}, teamCandidateMap);
        if (item) items.push(item);
      });
      continue;
    }

    const profileRow = profileMap[userId] || seedStudentProfile(userId);
    const sourceContext = collaborationMap.get(userId) || {
      teamIds: new Set(),
      projectIds: new Set(),
      teammateIds: new Set(),
      projectPartnerIds: new Set()
    };

    for (const candidate of studentRows) {
      const candidateId = Number(candidate.id || 0);
      if (!candidateId || candidateId === userId) continue;
      if (candidateFilter.size && !candidateFilter.has(candidateId)) continue;
      const candidateProfileRow = profileMap[candidateId] || seedStudentProfile(candidateId);
      const candidateContext = collaborationMap.get(candidateId) || null;
      const match = computeTeamCandidateMatch(profileRow, candidateProfileRow, candidate, {
        sharedTeam: sourceContext.teammateIds.has(candidateId),
        sharedProject: sourceContext.projectPartnerIds.has(candidateId),
        candidateContext
      });
      if (!match) continue;
      const ai = await buildAiMatchAdvice(match, aiKey);
      match.aiSummary = ai.aiSummary;
      match.aiAdvice = ai.aiAdvice;
      match.computedAt = now();
      const id = persistMatch(userId, match, TEAM_CANDIDATE_MATCH_RULE_VERSION, TEAM_CANDIDATE_MATCH_AI_VERSION);
      logMatchEvent({
        userId,
        targetType: 'team_candidate',
        targetKey: String(candidateId),
        eventType: forceRefresh ? 'manual_recompute' : 'team_candidate_match_computed',
        payload: { score: match.score, actorId: actor?.id || null }
      });
      items.push({
        id,
        targetType: match.targetType,
        targetKey: match.targetKey,
        score: match.score,
        eligibilityStatus: match.eligibilityStatus,
        ruleBreakdown: match.ruleBreakdown,
        reasons: match.reasons,
        gaps: match.gaps,
        aiSummary: match.aiSummary,
        aiAdvice: match.aiAdvice,
        overrideState: match.overrideState,
        interactionState: match.interactionState,
        computedAt: match.computedAt,
        teamCandidate: match.teamCandidate
      });
    }
  }

  return sortMatchItems(items);
}

async function getCompetitionMatchDetail({ userId, slug, actor, aiKey }) {
  const items = await recomputeCompetitionMatches({
    userIds: [userId],
    actor,
    competitionSlugs: [slug],
    aiKey,
    preferCached: true
  });
  return items.find(item => item.targetKey === slug) || null;
}

async function getProjectTopicMatchDetail({ userId, topicId, actor, aiKey }) {
  const items = await recomputeProjectTopicMatches({
    userIds: [userId],
    actor,
    projectTopicIds: [Number(topicId)],
    aiKey,
    preferCached: true
  });
  return items.find(item => String(item.targetKey) === String(topicId)) || null;
}

async function getCourseMatchDetail({ userId, courseId, actor, aiKey }) {
  const items = await recomputeCourseMatches({
    userIds: [userId],
    actor,
    courseIds: [String(courseId)],
    aiKey,
    preferCached: true
  });
  return items.find(item => String(item.targetKey) === String(courseId)) || null;
}

async function getTeamCandidateMatchDetail({ userId, candidateId, actor, aiKey }) {
  const items = await recomputeTeamCandidateMatches({
    userIds: [userId],
    actor,
    teamCandidateIds: [Number(candidateId)],
    aiKey,
    preferCached: true
  });
  return items.find(item => Number(item.targetKey) === Number(candidateId)) || null;
}

async function listProjectTopicCandidates({ topicId, actor, aiKey }) {
  const topic = mapProjectTopic(db.get('SELECT * FROM project_topics WHERE id = ?', [Number(topicId)]));
  if (!topic || !canReadProjectTopic(actor, topic)) return [];
  const studentRows = db.all('SELECT id, name, email FROM users WHERE role = ?', ['student']);
  const matches = await recomputeProjectTopicMatches({
    userIds: studentRows.map(row => Number(row.id)),
    actor,
    projectTopicIds: [Number(topicId)],
    aiKey,
    preferCached: true
  });
  return sortCandidateItems(matches.map((item) => {
    const matchRow = db.get('SELECT user_id FROM match_results WHERE id = ?', [item.id]);
    const userId = Number(matchRow?.user_id || 0);
    const row = studentRows.find(entry => Number(entry.id) === userId);
    const bucket = resolveMatchCandidateBucket({
      targetType: 'project_topic',
      eligibilityStatus: item.eligibilityStatus,
      overrideState: item.overrideState,
      interactionState: item.interactionState
    });
    return {
      ...item,
      userId,
      studentName: row?.name || '',
      studentEmail: row?.email || '',
      candidateBucket: bucket,
      candidateBucketLabel: formatMatchCandidateBucketLabel(bucket)
    };
  }));
}

async function listCourseCandidates({ courseId, actor, aiKey }) {
  const course = loadCourseDetail(courseId) || loadCourseCatalog().find(item => String(item.id) === String(courseId));
  if (!course || !canReadCourse(actor, course)) return [];
  const studentRows = db.all('SELECT id, name, email FROM users WHERE role = ?', ['student']);
  const matches = await recomputeCourseMatches({
    userIds: studentRows.map(row => Number(row.id)),
    actor,
    courseIds: [String(courseId)],
    aiKey,
    preferCached: true
  });
  return sortCandidateItems(matches.map((item) => {
    const matchRow = db.get('SELECT user_id FROM match_results WHERE id = ?', [item.id]);
    const userId = Number(matchRow?.user_id || 0);
    const row = studentRows.find(entry => Number(entry.id) === userId);
    const bucket = resolveMatchCandidateBucket({
      targetType: 'course',
      eligibilityStatus: item.eligibilityStatus,
      overrideState: item.overrideState,
      interactionState: item.interactionState
    });
    return {
      ...item,
      userId,
      studentName: row?.name || '',
      studentEmail: row?.email || '',
      candidateBucket: bucket,
      candidateBucketLabel: formatMatchCandidateBucketLabel(bucket)
    };
  }));
}

async function listTeamCandidateCandidates({ userId, actor, aiKey }) {
  const studentRows = listStudentUsers();
  const row = studentRows.find(entry => Number(entry.id) === Number(userId));
  if (!row) return [];
  const matches = await recomputeTeamCandidateMatches({
    userIds: [Number(userId)],
    actor,
    aiKey,
    preferCached: true
  });
  return sortCandidateItems(matches.map((item) => {
    const bucket = resolveMatchCandidateBucket({
      targetType: 'team_candidate',
      eligibilityStatus: item.eligibilityStatus,
      overrideState: item.overrideState,
      interactionState: item.interactionState
    });
    return {
      ...item,
      userId: Number(userId),
      studentName: row.name || '',
      studentEmail: row.email || '',
      candidateBucket: bucket,
      candidateBucketLabel: formatMatchCandidateBucketLabel(bucket)
    };
  }));
}

async function listStudentsForTeamCandidateTarget({ candidateId, actor, aiKey }) {
  const studentRows = listStudentUsers();
  const candidateUserId = Number(candidateId || 0);
  if (!candidateUserId) return [];
  const sourceStudentIds = studentRows
    .map(row => Number(row.id))
    .filter(id => id > 0 && id !== candidateUserId);
  const sourceMap = studentRows.reduce((acc, row) => {
    acc[Number(row.id)] = row;
    return acc;
  }, {});
  const matches = await recomputeTeamCandidateMatches({
    userIds: sourceStudentIds,
    actor,
    teamCandidateIds: [candidateUserId],
    aiKey,
    preferCached: true
  });
  return sortCandidateItems(matches.map((item) => {
    const matchRow = db.get('SELECT user_id FROM match_results WHERE id = ?', [item.id]);
    const userId = Number(matchRow?.user_id || 0);
    const sourceRow = sourceMap[userId];
    const bucket = resolveMatchCandidateBucket({
      targetType: 'team_candidate',
      eligibilityStatus: item.eligibilityStatus,
      overrideState: item.overrideState,
      interactionState: item.interactionState
    });
    return {
      ...item,
      userId,
      studentName: sourceRow?.name || '',
      studentEmail: sourceRow?.email || '',
      candidateBucket: bucket,
      candidateBucketLabel: formatMatchCandidateBucketLabel(bucket)
    };
  }));
}

async function getUserMatchOverview({ userId, actor, aiKey }) {
  const [competitionItems, projectTopicItems, courseItems, teamCandidateItems] = await Promise.all([
    recomputeCompetitionMatches({
      userIds: [userId],
      actor,
      aiKey,
      preferCached: true
    }),
    recomputeProjectTopicMatches({
      userIds: [userId],
      actor,
      aiKey,
      preferCached: true
    }),
    recomputeCourseMatches({
      userIds: [userId],
      actor,
      aiKey,
      preferCached: true
    }),
    recomputeTeamCandidateMatches({
      userIds: [userId],
      actor,
      aiKey,
      preferCached: true
    })
  ]);
  return [...competitionItems, ...projectTopicItems, ...courseItems, ...teamCandidateItems]
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
}

async function getAdminUserMatchDashboard({ userId, actor, aiKey }) {
  const [matches, reminders] = await Promise.all([
    getUserMatchOverview({ userId, actor, aiKey }),
    Promise.resolve(listUserMatchReminders({ userId, includeRead: true }))
  ]);
  return {
    matches,
    reminders,
    stats: {
      totalMatches: matches.length,
      eligibleMatches: matches.filter(item => item.eligibilityStatus === 'eligible').length,
      conditionalMatches: matches.filter(item => item.eligibilityStatus === 'conditional').length,
      totalReminders: reminders.length,
      unreadReminders: reminders.filter(item => !item.readAt).length
    }
  };
}

async function listAdminMatchCandidates({ actor, aiKey, targetType = '', candidateBucket = '', userId = 0 } = {}) {
  const normalizedTargetType = String(targetType || '').trim();
  const normalizedCandidateBucket = String(candidateBucket || '').trim();
  const normalizedUserId = Number(userId || 0);
  const items = [];

  if (!normalizedTargetType || normalizedTargetType === 'competition') {
    const competitions = listPublishedCompetitions();
    for (const competition of competitions) {
      const candidateItems = await listCompetitionCandidates({
        slug: competition.slug,
        actor,
        aiKey
      });
      candidateItems.forEach((item) => {
        items.push({
          ...item,
          targetLabel: item.competition?.title || item.targetKey
        });
      });
    }
  }

  if (!normalizedTargetType || normalizedTargetType === 'project_topic') {
    const topics = listPublishedProjectTopics(actor);
    for (const topic of topics) {
      const candidateItems = await listProjectTopicCandidates({
        topicId: Number(topic.id),
        actor,
        aiKey
      });
      candidateItems.forEach((item) => {
        items.push({
          ...item,
          targetLabel: item.projectTopic?.title || item.targetKey
        });
      });
    }
  }

  if (!normalizedTargetType || normalizedTargetType === 'course') {
    const courses = loadCourseCatalog()
      .filter(item => item.status === 'published')
      .filter(item => canReadCourse(actor, item));
    for (const course of courses) {
      const candidateItems = await listCourseCandidates({
        courseId: String(course.id),
        actor,
        aiKey
      });
      candidateItems.forEach((item) => {
        items.push({
          ...item,
          targetLabel: item.course?.title || item.targetKey
        });
      });
    }
  }

  if (!normalizedTargetType || normalizedTargetType === 'team_candidate') {
    const students = listStudentUsers();
    for (const student of students) {
      const candidateItems = await listTeamCandidateCandidates({
        userId: Number(student.id),
        actor,
        aiKey
      });
      candidateItems.forEach((item) => {
        items.push({
          ...item,
          targetLabel: item.teamCandidate?.name || item.targetKey
        });
      });
    }
  }

  return items
    .filter(item => !normalizedCandidateBucket || item.candidateBucket === normalizedCandidateBucket)
    .filter(item => !normalizedUserId || Number(item.userId) === normalizedUserId)
    .sort((a, b) => {
      const bucketDiff = (MATCH_CANDIDATE_BUCKET_ORDER[a.candidateBucket] ?? 99) - (MATCH_CANDIDATE_BUCKET_ORDER[b.candidateBucket] ?? 99);
      if (bucketDiff !== 0) return bucketDiff;
      return Number(b.score || 0) - Number(a.score || 0);
    });
}

async function listCompetitionCandidates({ slug, actor, aiKey }) {
  const studentRows = db.all('SELECT id, name, email FROM users WHERE role = ?', ['student']);
  const matches = await recomputeCompetitionMatches({
    userIds: studentRows.map(row => Number(row.id)),
    actor,
    competitionSlugs: [slug],
    aiKey,
    preferCached: true
  });
  const registrationMap = db.all(
    'SELECT student_id, status FROM competition_registrations WHERE competition_slug = ?',
    [slug]
  ).reduce((acc, row) => {
    acc[Number(row.student_id)] = row.status;
    return acc;
  }, {});
  return sortCandidateItems(matches.map((item) => {
    const matchRow = db.get('SELECT user_id FROM match_results WHERE id = ?', [item.id]);
    const userId = Number(matchRow?.user_id || 0);
    const row = studentRows.find(entry => Number(entry.id) === userId);
    const registrationStatus = registrationMap[userId] || '';
    const bucket = resolveMatchCandidateBucket({
      targetType: 'competition',
      eligibilityStatus: item.eligibilityStatus,
      overrideState: item.overrideState,
      interactionState: item.interactionState,
      registrationStatus
    });
    return {
      ...item,
      userId,
      studentName: row?.name || '',
      studentEmail: row?.email || '',
      registrationStatus,
      candidateBucket: bucket,
      candidateBucketLabel: formatMatchCandidateBucketLabel(bucket)
    };
  }));
}

function saveMatchOverride({ userId, targetType, targetKey, overrideType, note, createdBy }) {
  const existing = db.get(
    'SELECT id FROM match_overrides WHERE user_id = ? AND target_type = ? AND target_key = ?',
    [userId, targetType, targetKey]
  );
  if (existing) {
    db.run(
      'UPDATE match_overrides SET override_type = ?, note = ?, created_by = ?, updated_at = ? WHERE id = ?',
      [overrideType, note, createdBy, now(), existing.id]
    );
    return db.get('SELECT * FROM match_overrides WHERE id = ?', [existing.id]);
  }
  const createdAt = now();
  const info = db.run(
    `INSERT INTO match_overrides (user_id, target_type, target_key, override_type, note, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, targetType, targetKey, overrideType, note, createdBy, createdAt, createdAt]
  );
  return db.get('SELECT * FROM match_overrides WHERE id = ?', [info.lastInsertRowid]);
}

function logMatchInteraction({ userId, targetType, targetKey, interactionType, metadata = {} }) {
  if (!MATCH_INTERACTION_TYPES.has(interactionType)) return null;
  return db.run(
    `INSERT INTO match_interactions (user_id, target_type, target_key, interaction_type, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, targetType, targetKey, interactionType, JSON.stringify(metadata || {}), now()]
  );
}

function logMatchEvent({ userId = null, targetType = '', targetKey = '', eventType, payload = {} }) {
  return db.run(
    `INSERT INTO match_events (user_id, target_type, target_key, event_type, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, targetType, targetKey, eventType, JSON.stringify(payload || {}), now()]
  );
}

function getMatchAnalytics() {
  const studentTotal = getStudentCount();
  const rows = db.all('SELECT id, user_id, target_type, target_key, eligibility_status, score FROM match_results');
  const interactions = db.all('SELECT interaction_type, target_type, user_id, target_key FROM match_interactions');
  const registrations = db.all('SELECT competition_slug, student_id, status FROM competition_registrations');
  const overrides = db.all('SELECT * FROM match_overrides ORDER BY updated_at DESC, created_at DESC');
  const latestOverrideMap = new Map();
  overrides.forEach((row) => {
    const key = `${row.user_id}:${row.target_type}:${row.target_key}`;
    if (!latestOverrideMap.has(key)) latestOverrideMap.set(key, row);
  });
  const latestInteractionMap = new Map();
  db.all('SELECT interaction_type, created_at, user_id, target_type, target_key FROM match_interactions ORDER BY created_at DESC')
    .forEach((row) => {
      const key = `${row.user_id}:${row.target_type}:${row.target_key}`;
      if (!latestInteractionMap.has(key)) latestInteractionMap.set(key, row);
    });
  const registrationMap = new Map();
  registrations.forEach((row) => {
    registrationMap.set(`${Number(row.student_id)}:${row.competition_slug}`, row.status || '');
  });
  const exposureCount = interactions.filter(row => row.interaction_type === 'view').length;
  const clickCount = interactions.filter(row => row.interaction_type === 'click').length;
  const applyCount = interactions.filter(row => row.interaction_type === 'apply').length;
  const approvedCount = registrations.filter(row => row.status === 'approved').length;
  const targetTypes = ['competition', 'project_topic', 'course'];
  const recommendationCountByType = (targetType) => rows.filter(row => row.target_type === targetType).length;
  const targetTypesWithTeam = [...targetTypes, 'team_candidate'];
  const byTargetType = targetTypesWithTeam.reduce((acc, targetType) => {
    const scopedRows = rows.filter(row => row.target_type === targetType);
    const scopedInteractions = interactions.filter(row => row.target_type === targetType);
    const scopedExposureCount = scopedInteractions.filter(row => row.interaction_type === 'view').length;
    const scopedClickCount = scopedInteractions.filter(row => row.interaction_type === 'click').length;
    const scopedApplyCount = scopedInteractions.filter(row => row.interaction_type === 'apply').length;
    const candidateBuckets = scopedRows.reduce((bucketAcc, row) => {
      const key = `${row.user_id}:${row.target_type}:${row.target_key}`;
      const overrideRow = latestOverrideMap.get(key);
      const interactionRow = latestInteractionMap.get(key);
      const bucket = resolveMatchCandidateBucket({
        targetType,
        eligibilityStatus: row.eligibility_status,
        overrideState: overrideRow ? { overrideType: overrideRow.override_type } : null,
        interactionState: interactionRow ? { interactionType: interactionRow.interaction_type } : null,
        registrationStatus: targetType === 'competition' ? (registrationMap.get(`${Number(row.user_id)}:${row.target_key}`) || '') : ''
      });
      bucketAcc[bucket] = (bucketAcc[bucket] || 0) + 1;
      return bucketAcc;
    }, {});
    acc[targetType] = {
      recommendationCount: scopedRows.length,
      coverageRate: studentTotal > 0 ? Number((new Set(scopedRows.map(row => row.user_id)).size / studentTotal).toFixed(2)) : 0,
      exposureCount: scopedExposureCount,
      clickCount: scopedClickCount,
      applyCount: scopedApplyCount,
      clickThroughRate: scopedExposureCount > 0 ? Number((scopedClickCount / scopedExposureCount).toFixed(2)) : 0,
      applyRate: scopedClickCount > 0 ? Number((scopedApplyCount / scopedClickCount).toFixed(2)) : 0,
      candidateBuckets
    };
    return acc;
  }, {});
  return {
    studentTotal,
    recommendationCount: rows.length,
    competitionRecommendationCount: rows.filter(row => row.target_type === 'competition').length,
    projectTopicRecommendationCount: rows.filter(row => row.target_type === 'project_topic').length,
    courseRecommendationCount: rows.filter(row => row.target_type === 'course').length,
    teamCandidateRecommendationCount: recommendationCountByType('team_candidate'),
    coverageRate: studentTotal > 0 ? Number((new Set(rows.map(row => row.user_id)).size / studentTotal).toFixed(2)) : 0,
    exposureCount,
    clickCount,
    applyCount,
    clickThroughRate: exposureCount > 0 ? Number((clickCount / exposureCount).toFixed(2)) : 0,
    applyRate: clickCount > 0 ? Number((applyCount / clickCount).toFixed(2)) : 0,
    approvedRate: applyCount > 0 ? Number((approvedCount / applyCount).toFixed(2)) : 0,
    byTargetType
  };
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
  const attachments = parseAttachmentList(row.attachments)
    .map((attachment) => {
      const source = typeof attachment === 'string' ? { path: attachment } : attachment;
      const relativePath = String(source?.path || '').trim().replace(/\\/g, '/');
      if (!relativePath) return null;
      const size = Number(source?.size);
      return {
        id: source?.id || null,
        name: String(source?.name || relativePath.split('/').pop() || '附件').trim(),
        path: relativePath,
        size: Number.isFinite(size) && size >= 0 ? size : 0,
        url: source?.id ? `/api/v1/assignment-attachments/${source.id}/download` : ''
      };
    })
    .filter(Boolean);
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    studentId: row.student_id,
    studentName: row.student_name || '',
    studentEmail: row.student_email || '',
    content: row.content || '',
    link: row.link || '',
    attachmentNote: row.attachment_note || '',
    attachments,
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

function mapCompetitionReminder(row) {
  if (!row) return null;
  return {
    id: row.id,
    competitionSlug: row.competition_slug,
    studentId: row.student_id,
    studentName: row.student_name || '',
    studentEmail: row.student_email || '',
    title: row.title || '',
    body: row.body || '',
    targetGroup: row.target_group || '',
    teacherName: row.teacher_name || '',
    createdBy: row.created_by || null,
    createdAt: row.created_at,
    readAt: row.read_at || ''
  };
}

function mapProjectTopic(row) {
  if (!row) return null;
  const taxonomyIndex = getActiveTaxonomyIndex();
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    background: row.background || '',
    goals: row.goals || '',
    difficulty: formatTaxonomyLabel('difficulty', row.difficulty || '', taxonomyIndex),
    tags: parseJsonArray(row.tags).map(item => formatTaxonomyLabel('discipline', item, taxonomyIndex) || formatTaxonomyLabel('skill', item, taxonomyIndex)),
    requiredSkills: formatTaxonomyLabels('skill', parseJsonArray(row.required_skills), taxonomyIndex),
    estimatedHours: row.estimated_hours === null || row.estimated_hours === undefined ? null : Number(row.estimated_hours),
    suggestedTeamSize: row.suggested_team_size || '',
    deliverables: row.deliverables || '',
    relatedCourseId: row.related_course_id || '',
    relatedCompetitionSlug: row.related_competition_slug || '',
    visibility: normalizeVisibility(row.visibility),
    visibleToRoles: parseAccessStringList(row.visible_to_roles),
    visibleToUserIds: parseAccessIdList(row.visible_to_user_ids),
    visibleToClassNames: parseAccessStringList(row.visible_to_class_names),
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeProjectTopicPayload(input = {}, existing = {}) {
  const status = String(input.status || existing.status || 'draft').trim();
  const taxonomyIndex = getActiveTaxonomyIndex();
  return {
    title: String(input.title || existing.title || '').trim(),
    description: String(input.description || existing.description || '').trim(),
    background: String(input.background || existing.background || '').trim(),
    goals: String(input.goals || existing.goals || '').trim(),
    difficulty: normalizeTaxonomyValue(input.difficulty || existing.difficulty, ['difficulty'], taxonomyIndex),
    tags: JSON.stringify(normalizeTaxonomyArray(input.tags ?? existing.tags ?? parseJsonArray(existing.tags), ['discipline', 'skill'], taxonomyIndex)),
    requiredSkills: JSON.stringify(normalizeTaxonomyArray(
      input.requiredSkills ?? input.required_skills ?? existing.requiredSkills ?? existing.required_skills ?? parseJsonArray(existing.required_skills)
      , ['skill'], taxonomyIndex
    )),
    estimatedHours: normalizeNullableNumber(
      input.estimatedHours ?? input.estimated_hours ?? existing.estimatedHours ?? existing.estimated_hours
    ),
    suggestedTeamSize: String(input.suggestedTeamSize || input.suggested_team_size || existing.suggested_team_size || '').trim(),
    deliverables: String(input.deliverables || existing.deliverables || '').trim(),
    relatedCourseId: String(input.relatedCourseId || input.related_course_id || existing.related_course_id || '').trim(),
    relatedCompetitionSlug: String(input.relatedCompetitionSlug || input.related_competition_slug || existing.related_competition_slug || '').trim(),
    visibility: normalizeVisibility(input.visibility || existing.visibility),
    visibleToRoles: JSON.stringify(parseAccessStringList(input.visibleToRoles ?? input.visible_to_roles ?? existing.visible_to_roles)),
    visibleToUserIds: JSON.stringify(parseAccessIdList(input.visibleToUserIds ?? input.visible_to_user_ids ?? existing.visible_to_user_ids)),
    visibleToClassNames: JSON.stringify(parseAccessStringList(input.visibleToClassNames ?? input.visible_to_class_names ?? existing.visible_to_class_names)),
    status: PROJECT_TOPIC_STATUSES.has(status) ? status : 'draft'
  };
}

function mapTaxonomyTerm(row) {
  if (!row) return null;
  return {
    id: Number(row.id || 0),
    termType: row.term_type || '',
    termKey: row.term_key || '',
    label: row.label || '',
    aliases: parseJsonArray(row.aliases),
    status: row.status || 'active',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || ''
  };
}

function normalizeTaxonomyTermPayload(input = {}, existing = {}) {
  const termType = String(input.termType || input.term_type || existing.term_type || '').trim();
  const rawTermKey = String(input.termKey || input.term_key || existing.term_key || input.label || existing.label || '').trim();
  const termKey = rawTermKey
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const status = String(input.status || existing.status || 'active').trim().toLowerCase();
  return {
    term_type: termType,
    term_key: termKey,
    label: String(input.label || existing.label || '').trim(),
    aliases: JSON.stringify(normalizeJsonArray(input.aliases ?? existing.aliases ?? parseJsonArray(existing.aliases))),
    status: ['active', 'draft', 'disabled', 'archived'].includes(status) ? status : 'active'
  };
}

function listTaxonomyTerms({ termType = '', status = '' } = {}) {
  const where = [];
  const params = [];
  if (termType) {
    where.push('term_type = ?');
    params.push(termType);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  const sql = `SELECT * FROM match_taxonomy_terms${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY term_type ASC, term_key ASC, updated_at DESC`;
  return db.all(sql, params).map(mapTaxonomyTerm);
}

function upsertTaxonomyTerm(input = {}) {
  const payload = normalizeTaxonomyTermPayload(input);
  if (!payload.term_type || !payload.term_key || !payload.label) return null;
  const existing = db.get(
    'SELECT * FROM match_taxonomy_terms WHERE term_type = ? AND term_key = ?',
    [payload.term_type, payload.term_key]
  );
  if (existing) {
    db.run(
      `UPDATE match_taxonomy_terms
       SET label = ?, aliases = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [payload.label, payload.aliases, payload.status, now(), existing.id]
    );
    return db.get('SELECT * FROM match_taxonomy_terms WHERE id = ?', [existing.id]);
  }
  const createdAt = now();
  const info = db.run(
    `INSERT INTO match_taxonomy_terms (term_type, term_key, label, aliases, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [payload.term_type, payload.term_key, payload.label, payload.aliases, payload.status, createdAt, createdAt]
  );
  return db.get('SELECT * FROM match_taxonomy_terms WHERE id = ?', [info.lastInsertRowid]);
}

registerCourseRoutes(fastify, {
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
  db: routeDb,
  now,
  canReadCourse,
  canEditCourse
});

function canAccessProject(user, project) {
  return canReadProject(user, project);
}

function syncLegacyAttachments() {
  const existing = new Set(
    db.all('SELECT submission_id, file_path FROM attachments').map(
      row => `${row.submission_id}:${row.file_path}`
    )
  );
  const submissions = db.all(
    "SELECT id, attachments, created_at FROM submissions WHERE attachments IS NOT NULL AND attachments != ''"
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

function canRegisterTeacher(inviteCode) {
  return Boolean(TEACHER_INVITE_CODE) && constantTimeEqual(inviteCode, TEACHER_INVITE_CODE);
}

function canRegisterJudge(inviteCode) {
  return Boolean(JUDGE_INVITE_CODE) && constantTimeEqual(inviteCode, JUDGE_INVITE_CODE);
}

async function requestGitea(pathname, options = {}) {
  const baseUrl = envValue('GITEA_BASE_URL', GITEA_BASE_URL);
  const adminToken = envValue('GITEA_ADMIN_TOKEN', GITEA_ADMIN_TOKEN);
  if (!baseUrl || !adminToken) {
    throw new Error('Gitea 未配置');
  }
  if (typeof fetch !== 'function') {
    throw new Error('当前 Node 版本不支持 fetch');
  }
  const url = new URL(pathname, baseUrl);
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `token ${adminToken}`,
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

async function ensureGiteaUser({ user, username = '', password = '', mustChangePassword = false }) {
  const baseUrl = envValue('GITEA_BASE_URL', GITEA_BASE_URL);
  if (!baseUrl || !envValue('GITEA_ADMIN_TOKEN', GITEA_ADMIN_TOKEN)) {
    throw new Error('Gitea 用户同步服务未配置');
  }
  const fallback = `student-${user.id}`;
  const loginName = slugifyGiteaUsername(username || user.gitea_username || user.username || user.name || user.email, fallback);
  const email = String(user.email || `${loginName}@school.local`).trim();
  const generatedPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12);
  const finalPassword = String(password || generatedPassword).trim();
  const payload = {
    username: loginName,
    email,
    password: finalPassword,
    must_change_password: Boolean(mustChangePassword)
  };

  const result = await requestGitea('/api/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!result.ok && result.status !== 409) {
    throw new Error(result.data?.message || 'Gitea 用户创建失败');
  }

  return {
    username: loginName,
    email,
    created: result.ok,
    alreadyExists: result.status === 409,
    password: result.ok && !password ? finalPassword : undefined,
    htmlUrl: result.data?.html_url || `${baseUrl.replace(/\/$/, '')}/${loginName}`
  };
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
  const baseUrl = envValue('GITEA_BASE_URL', GITEA_BASE_URL);
  const defaultOwner = envValue('GITEA_DEFAULT_OWNER', GITEA_DEFAULT_OWNER);
  if (!baseUrl || !envValue('GITEA_ADMIN_TOKEN', GITEA_ADMIN_TOKEN) || !defaultOwner) return null;

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

  let result = await tryCreate(`/api/v1/orgs/${encodeURIComponent(defaultOwner)}/repos`);
  if (!result.ok && result.status === 404) {
    result = await tryCreate(`/api/v1/admin/users/${encodeURIComponent(defaultOwner)}/repos`);
  }

  if (!result.ok && result.status !== 409) {
    const message = result.data?.message || 'Gitea 创建仓库失败';
    throw new Error(message);
  }

  const repoUrl = result.data?.html_url
    || `${baseUrl.replace(/\/$/, '')}/${defaultOwner}/${repoName}`;

  db.run('UPDATE projects SET gitea_repo_url = ?, updated_at = ? WHERE id = ?', [
    repoUrl,
    now(),
    project.id
  ]);
  logAudit('gitea.repo.create', request, { projectId: project.id, repoUrl });
  return repoUrl;
}

registerPortalRoutes(fastify, {
  API_PREFIX,
  db: routeDb,
  now,
  requireRole,
  parseProjectId,
  logAudit,
  COMPETITION_REGISTRATION_STATUSES,
  loadPortalBanners,
  savePortalBanners,
  normalizeBannerPayload,
  loadPortalStories,
  savePortalStories,
  normalizeStoryPayload,
  buildStoryResponse,
  buildCoursePreviewMap,
  listPublishedCompetitions,
  enrichCompetition,
  loadPortalCompetitionDetail,
  loadPortalCompetitions,
  savePortalCompetition,
  normalizeCompetitionPayload,
  getCompetitionRegistrationStats,
  mapCompetitionRegistration,
  mapCompetitionReminder,
  mapProjectTopic,
  normalizeProjectTopicPayload,
  canReadProjectTopic,
  logMatchEvent,
  recomputeCompetitionMatches,
  recomputeProjectTopicMatches
});

registerMatchingRoutes(fastify, {
  API_PREFIX,
  db: routeDb,
  now,
  requireAuth,
  requireRole,
  parseProjectId,
  requestAiChat,
  logAudit,
  listPublishedCompetitions,
  loadPortalCompetitions,
  enrichCompetition,
  buildCoursePreviewMap,
  loadCourseCatalog,
  seedStudentProfile,
  getStudentProfile,
  upsertStudentProfile,
  recomputeCompetitionMatches,
  recomputeProjectTopicMatches,
  recomputeCourseMatches,
  recomputeTeamCandidateMatches,
  getCompetitionMatchDetail,
  getProjectTopicMatchDetail,
  getCourseMatchDetail,
  getTeamCandidateMatchDetail,
  listCompetitionCandidates,
  listProjectTopicCandidates,
  listCourseCandidates,
  listTeamCandidateCandidates,
  listAdminMatchCandidates,
  getUserMatchOverview,
  getAdminUserMatchDashboard,
  getMatchAnalytics,
  createMatchReminders,
  listMatchReminders,
  listUserMatchReminders,
  markMatchReminderRead,
  mapMatchReminder,
  formatMatchCandidateBucketLabel,
  resolveMatchCandidateBucket,
  saveMatchOverride,
  logMatchInteraction,
  logMatchEvent,
  mapStudentProfile,
  normalizeStudentProfilePayload,
  listTaxonomyTerms,
  mapTaxonomyTerm,
  normalizeTaxonomyTermPayload,
  upsertTaxonomyTerm
});

registerAssignmentRoutes(fastify, {
  API_PREFIX,
  db: routeDb,
  fs,
  path,
  UPLOAD_DIR,
  now,
  requireRole,
  parseProjectId,
  normalizeAssignmentPayload,
  mapAssignment,
  mapAssignmentSubmission,
  loadCourseDetail,
  listCourseLessons,
  canReadCourse,
  canEditCourse,
  requestAiChat,
  safeParseJson,
  logAudit,
  ASSIGNMENT_SUBMISSION_STATUSES,
  collectMultipart,
  cleanupTempFiles,
  moveTempFiles,
  resolveUnder,
  canReadAssignmentSubmission,
  getAttachmentById: (attachmentId) => {
    if (!db) return null;
    return db.get(
      `SELECT a.*, s.assignment_id, s.student_id, ass.course_id, ass.created_by AS assignment_created_by
       FROM assignment_submission_attachments a
       JOIN assignment_submissions s ON s.id = a.submission_id
       JOIN assignments ass ON ass.id = s.assignment_id
       WHERE a.id = ?`,
      [attachmentId]
    );
  }
});

registerSystemRoutes(fastify, {
  API_PREFIX,
  getDb: () => db,
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
});

registerAssetRoutes(fastify, {
  API_PREFIX,
  db: routeDb,
  MATERIALS_DIR,
  EXTENSION_MIME_MAP,
  requireRole,
  buildProjectFilters,
  canReadProject,
  canReadCourse,
  findCourseByMaterialsRoot,
  logAudit,
  resolveUnder
});

registerReviewRoutes(fastify, {
  API_PREFIX,
  db: routeDb,
  path,
  UPLOAD_DIR,
  requireRole,
  parseProjectId,
  buildProjectFilters,
  buildProjectReviewDossier,
  projectReviewRepository: createProjectReviewRepository({
    db: routeDb,
    buildProjectFilters,
    getProjectDetail,
    getProjectMilestones,
    getProjectResources,
    getProjectDevLogs,
    buildProjectReviewMeta,
    canReadProject
  }),
  showcaseRepository: createShowcaseRepository({
    db: routeDb,
    buildProjectFilters,
    safeParseJson,
    getSubmissionAttachments,
    canReadProject
  }),
  canReadProject,
  toCsvLine,
  sanitizeName,
  appendFileSafe,
  streamZip,
  logAudit,
  resolveUnder
});

registerProjectRoutes(fastify, {
  API_PREFIX,
  requireRole,
  requireProjectAccess,
  parseProjectId,
  getProject,
  getProjectDetail,
  validateGiteaRepo,
  normalizeMemberIds,
  getProjectRepository: () => projectRepository,
  logAudit
});

registerProjectOpsRoutes(fastify, {
  API_PREFIX,
  db: routeDb,
  path,
  UPLOAD_DIR,
  requireAuth,
  requireRole,
  requireProjectAccess,
  canReadProject,
  parseProjectId,
  normalizeToolKey,
  now,
  PROJECT_STATUSES,
  safeParseJson,
  buildMilestoneSourceKey,
  getProject,
  getProjectDetail,
  getProjectMilestones,
  getProjectComments,
  getProjectScores,
  loadProjectToolData: (...args) => projectRepository.listToolData(...args),
  getProjectToolData: (...args) => projectRepository.getToolData(...args),
  upsertProjectToolData: (projectId, toolKey, data, userId) => projectRepository.upsertToolData(projectId, normalizeToolKey(toolKey), data, userId),
  updateProjectStatus,
  validateStatusTransition,
  getSubmissionAttachments,
  getProjectResources,
  getProjectDevLogs,
  ensureGiteaRepo,
  logAudit,
  sanitizeName,
  appendFileSafe,
  streamZip,
  fastifyLog: fastify.log,
  resolveUnder
});

registerCollaborationRoutes(fastify, {
  API_PREFIX,
  db: routeDb,
  fs,
  path,
  ASSESSMENT_DIR,
  EXTENSION_MIME_MAP,
  now,
  SUBMISSION_TYPES,
  SUBMISSION_STATUSES,
  requireRole,
  requireProjectAccess,
  parseProjectId,
  getProject,
  validateGiteaRepo,
  validateSubmissionDetails,
  validateStatusTransition,
  safeParseJson,
  normalizeScoreTemplateCriteria,
  logAudit,
  collectMultipart,
  cleanupTempFiles,
  moveTempFiles,
  resolveUnder
});

registerKnowledgeRoutes(fastify, {
  API_PREFIX,
  db: routeDb,
  now,
  requireAuth,
  findKnowledgeDetail,
  loadKnowledgeDisciplinesFromDb,
  loadKnowledgeLearningUnitsFromDb,
  loadAllKnowledgeSeriesFromDb,
  createLearnerToken,
  createViewerToken,
  normalizeKnowledgeAnswers,
  resolveKnowledgeEpisode,
  getKnowledgeIdentityCondition,
  getKnowledgeEpisodeProgress,
  buildKnowledgeOpenPrompts,
  validateKnowledgeAnswersForPrompts,
  scoreKnowledgeResponse,
  mapKnowledgeResponseRow,
  logMatchEvent,
  recomputeCompetitionMatches,
  recomputeProjectTopicMatches,
  recomputeCourseMatches,
  recomputeTeamCandidateMatches
});

async function initDatabase(dbPath = DB_PATH) {
  db = await createDatabase(dbPath);
  projectRepository = createProjectRepository({
    db: routeDb,
    now,
    safeParseJson,
    parseAttachmentList,
    toUrlPath,
    buildProjectFilters,
    canReadProject
  });
  seedKnowledgeContent();
  syncLegacyAttachments();
  return db;
}

const start = async () => {
  try {
    assertRuntimeConfig();
    await initDatabase(DB_PATH);
    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Innovation platform running at http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = {
  fastify,
  initDatabase,
  start,
  _internals: {
    assertRuntimeConfig,
    canRegisterTeacher,
    canRegisterJudge,
    parseGiteaRepoUrl,
    validateSubmissionDetails
  }
};

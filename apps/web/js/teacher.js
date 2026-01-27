const { apiFetch, requireAuth, updateAuthUser, renderCurrentUser } = window.auth;
const currentUser = requireAuth(['teacher', 'judge']);
if (!currentUser) {
  throw new Error('auth_required');
}
const isTeacher = currentUser.role === 'teacher';

const projectListEl = document.getElementById('projectList');
const projectDetailEl = document.getElementById('projectDetail');
const filterBtn = document.getElementById('filterBtn');
const statsSummaryEl = document.getElementById('statsSummary');
const statsTotalEl = document.getElementById('statsTotal');
const exportBtn = document.getElementById('exportBtn');
const exportAttachmentsBtn = document.getElementById('exportAttachmentsBtn');

const announcementSection = document.getElementById('announcementSection');
const announcementForm = document.getElementById('announcementForm');
const announcementStatus = document.getElementById('announcementStatus');
const announcementList = document.getElementById('announcementList');

const scoreTemplateSection = document.getElementById('scoreTemplateSection');
const scoreTemplateForm = document.getElementById('scoreTemplateForm');
const scoreTemplateStatus = document.getElementById('scoreTemplateStatus');
const scoreTemplateList = document.getElementById('scoreTemplateList');

const userAdminSection = document.getElementById('userAdminSection');
const userSearchInput = document.getElementById('userSearchInput');
const userRoleFilter = document.getElementById('userRoleFilter');
const userSearchBtn = document.getElementById('userSearchBtn');
const userList = document.getElementById('userList');

const profileForm = document.getElementById('profileForm');
const profileStatus = document.getElementById('profileStatus');

let currentProjectId = null;
let scoreTemplatesByType = {};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function renderStatusBadge(status) {
  const label = PROJECT_STATUS_LABELS[status] || status || '-';
  const style = STATUS_BADGE_STYLES[status] || 'bg-gray-100 text-gray-600';
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style}">${escapeHtml(label)}</span>`;
}

function renderSubmissionStatusBadge(status) {
  const label = SUBMISSION_STATUS_LABELS[status] || status || '-';
  const style = SUBMISSION_STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style}">${escapeHtml(label)}</span>`;
}

function renderMilestoneStatusBadge(status) {
  const label = MILESTONE_STATUS_LABELS[status] || status || '-';
  const style = MILESTONE_STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style}">${escapeHtml(label)}</span>`;
}

function buildMilestoneSummary(submissions) {
  const latestByType = new Map();
  (submissions || []).forEach(submission => {
    if (!MILESTONE_STAGE_ORDER.includes(submission.type)) return;
    if (!latestByType.has(submission.type)) {
      latestByType.set(submission.type, submission);
    }
  });

  return MILESTONE_STAGE_ORDER.map(type => {
    const submission = latestByType.get(type);
    return {
      type,
      status: submission ? (submission.status || 'submitted') : 'pending'
    };
  });
}

const SUBMISSION_LABELS = {
  proposal: '开题',
  milestone_1: '里程碑1：功能一',
  milestone_2: '里程碑2：功能二',
  midterm: '中期评审',
  milestone_3: '里程碑3：项目集成',
  final: '结题评审',
  showcase: '展示/归档',
  legacy: '历史资料'
};

const DETAIL_FIELDS = {
  proposal: [
    { key: 'problem', label: '问题与背景' },
    { key: 'goals', label: '目标' },
    { key: 'scope', label: '范围（做/不做）' },
    { key: 'approach', label: '技术路线' },
    { key: 'plan', label: '计划（阶段安排）' },
    { key: 'teamMembers', label: '团队成员' },
    { key: 'proposalSupplement', label: '开题补充说明' }
  ],
  milestone_1: [
    { key: 'researchConclusion', label: '需求调研结论' },
    { key: 'feasibility', label: '可行性分析' },
    { key: 'riskList', label: '风险清单' },
    { key: 'featureScope', label: '功能一范围说明' }
  ],
  milestone_2: [
    { key: 'designPlan', label: '方案设计说明' },
    { key: 'prototype', label: '原型/架构图说明' },
    { key: 'keyPath', label: '关键路径与技术难点' }
  ],
  midterm: [
    { key: 'progressCompare', label: '进度对比' },
    { key: 'demoLink', label: '演示链接' },
    { key: 'issuesAdjust', label: '问题与调整' }
  ],
  milestone_3: [
    { key: 'integration', label: '项目集成说明' },
    { key: 'testingFeedback', label: '测试/反馈记录' },
    { key: 'mvpValidation', label: 'MVP 验证结果' }
  ],
  final: [
    { key: 'deliverables', label: '成果包清单' },
    { key: 'demo', label: '演示说明' },
    { key: 'techSummary', label: '技术总结' },
    { key: 'reflection', label: '反思与展望' }
  ],
  showcase: [
    { key: 'showcaseSummary', label: '展示说明' },
    { key: 'reusableResources', label: '可复用资源' }
  ]
};

const PROJECT_STATUS_LABELS = {
  draft: '草稿',
  submitted: '已提交',
  reviewing: '审核中',
  approved: '通过',
  rejected: '驳回',
  in_progress: '进行中',
  midterm_review: '中期评审',
  final_review: '结题待审',
  archived: '已归档'
};

const SUBMISSION_STATUS_LABELS = {
  submitted: '已提交',
  reviewed: '已评审',
  needs_changes: '需修改'
};

const STATUS_BADGE_STYLES = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-50 text-blue-600',
  reviewing: 'bg-yellow-50 text-yellow-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  in_progress: 'bg-indigo-50 text-indigo-600',
  midterm_review: 'bg-orange-50 text-orange-700',
  final_review: 'bg-purple-50 text-purple-700',
  archived: 'bg-gray-200 text-gray-600'
};

const SUBMISSION_STATUS_STYLES = {
  submitted: 'bg-blue-50 text-blue-600',
  reviewed: 'bg-green-50 text-green-700',
  needs_changes: 'bg-red-50 text-red-700'
};

const MILESTONE_STAGE_ORDER = [
  'proposal',
  'milestone_1',
  'milestone_2',
  'midterm',
  'milestone_3',
  'final'
];

const MILESTONE_STATUS_LABELS = {
  pending: '待提交',
  ...SUBMISSION_STATUS_LABELS
};

const MILESTONE_STATUS_STYLES = {
  pending: 'bg-gray-100 text-gray-500',
  ...SUBMISSION_STATUS_STYLES
};

function buildFilterParams() {
  const keyword = document.getElementById('filterKeyword').value.trim();
  const className = document.getElementById('filterClass').value.trim();
  const status = document.getElementById('filterStatus').value;

  const params = new URLSearchParams();
  if (keyword) params.set('keyword', keyword);
  if (className) params.set('className', className);
  if (status) params.set('status', status);
  return params;
}

function buildUrl(base, params) {
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

async function fetchProjects() {
  const params = buildFilterParams();
  const res = await apiFetch(buildUrl('/projects', params));
  const data = await res.json();
  return data.projects || [];
}

async function fetchStats() {
  const params = buildFilterParams();
  const res = await apiFetch(buildUrl('/stats', params));
  const data = await res.json();
  return data;
}

async function fetchProjectDetail(projectId) {
  const res = await apiFetch(`/projects/${projectId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '加载失败');
  return data;
}

async function fetchAnnouncements() {
  const res = await apiFetch('/announcements');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '加载公告失败');
  return data.announcements || [];
}

async function createAnnouncement(payload) {
  const res = await apiFetch('/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '发布失败');
  return data;
}

async function deleteAnnouncement(id) {
  const res = await apiFetch(`/announcements/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '删除失败');
  return data;
}

async function fetchScoreTemplates() {
  const res = await apiFetch('/score-templates');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '加载评分标准失败');
  return data.templates || [];
}

async function saveScoreTemplate(payload) {
  const res = await apiFetch('/score-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '保存失败');
  return data;
}

async function deleteScoreTemplate(id) {
  const res = await apiFetch(`/score-templates/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '删除失败');
  return data;
}

async function fetchUsers(params) {
  const query = new URLSearchParams(params || {});
  const res = await apiFetch(`/admin/users?${query.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '加载用户失败');
  return data.users || [];
}

async function resetUserPassword(userId, password) {
  const res = await apiFetch(`/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '重置失败');
  return data;
}

async function fetchComments(projectId) {
  const res = await apiFetch(`/projects/${projectId}/comments`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '加载评论失败');
  return data.comments || [];
}

async function submitComment(projectId, content) {
  const res = await apiFetch(`/projects/${projectId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '评论失败');
  return data;
}

async function fetchSubmissionScores(submissionId) {
  const res = await apiFetch(`/submissions/${submissionId}/scores`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '加载评分失败');
  return data.scores || [];
}

async function submitSubmissionScore(submissionId, payload) {
  const res = await apiFetch(`/submissions/${submissionId}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '评分失败');
  return data;
}

async function downloadAttachmentsExport() {
  const params = buildFilterParams();
  const res = await apiFetch(buildUrl('/exports/attachments.zip', params));
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '下载失败');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'attachments.zip';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function downloadProjectAttachments(projectId) {
  const res = await apiFetch(`/projects/${projectId}/attachments.zip`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '下载失败');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `project-${projectId}-attachments.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function downloadProjectArchive(projectId) {
  const res = await apiFetch(`/projects/${projectId}/archive.zip`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '导出失败');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `project-${projectId}-archive.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
async function updateProjectStatus(projectId, status, note) {
  const res = await apiFetch(`/projects/${projectId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, note })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '更新失败');
}

async function submitFeedback(submissionId, status, feedback) {
  const res = await apiFetch(`/submissions/${submissionId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, feedback })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '保存失败');
}

function renderStats(stats) {
  const total = stats && Number.isFinite(Number(stats.total)) ? stats.total : 0;
  const byStatus = Array.isArray(stats?.byStatus) ? stats.byStatus : [];
  const countMap = {};
  byStatus.forEach(row => {
    countMap[row.status] = row.count;
  });

  if (statsTotalEl) {
    statsTotalEl.textContent = total;
  }
  if (!statsSummaryEl) return;

  const items = Object.keys(PROJECT_STATUS_LABELS).map(status => ({
    status,
    label: PROJECT_STATUS_LABELS[status] || status,
    count: countMap[status] || 0
  }));

  statsSummaryEl.innerHTML = items.map(item => `
    <div class="border border-gray-100 rounded-xl p-3">
      <div class="text-xs text-gray-500">${escapeHtml(item.label)}</div>
      <div class="text-lg font-semibold text-gray-800 mt-1">${item.count}</div>
    </div>
  `).join('');
}

function parseCriteriaInput(text) {
  const lines = String(text || '').split('\n').map(line => line.trim()).filter(Boolean);
  return lines.map(line => {
    const [key, label, max] = line.split('|').map(part => part.trim());
    return { key, label, max: Number(max) };
  }).filter(item => item.key && item.label && Number.isFinite(item.max));
}

function renderScoreTemplateList(templates) {
  if (!scoreTemplateList) return;
  if (!templates.length) {
    scoreTemplateList.innerHTML = '<div class="text-sm text-gray-400">暂无评分标准</div>';
    return;
  }
  scoreTemplateList.innerHTML = templates.map(template => {
    const criteria = Array.isArray(template.criteria) ? template.criteria : [];
    const criteriaText = criteria.map(item => `${item.label}(${item.max})`).join('、');
    const typeLabel = SUBMISSION_LABELS[template.type] || template.type;
    return `
      <div class="border border-gray-100 rounded-lg p-3">
        <div class="text-sm text-gray-800">${escapeHtml(typeLabel)}</div>
        <div class="text-xs text-gray-500 mt-1">${escapeHtml(criteriaText || '未配置')}</div>
        ${isTeacher ? `<button class="text-xs text-red-500 mt-2 hover:underline" data-template-delete="${template.id}">删除</button>` : ''}
      </div>
    `;
  }).join('');
}

function renderAnnouncementList(items) {
  if (!announcementList) return;
  if (!items.length) {
    announcementList.innerHTML = '<div class="text-sm text-gray-400">暂无公告</div>';
    return;
  }
  announcementList.innerHTML = items.map(item => `
    <div class="border border-gray-100 rounded-lg p-3">
      <div class="text-sm text-gray-800">${escapeHtml(item.title)}</div>
      <div class="text-xs text-gray-500 mt-1">${escapeHtml(item.body || '')}</div>
      <div class="text-xs text-gray-400 mt-1">发布：${escapeHtml(formatDateTime(item.created_at))}</div>
      ${isTeacher ? `<button class="text-xs text-red-500 mt-2 hover:underline" data-announcement-delete="${item.id}">删除</button>` : ''}
    </div>
  `).join('');
}

function renderUserList(users) {
  if (!userList) return;
  if (!users.length) {
    userList.innerHTML = '<div class="text-sm text-gray-400">暂无用户</div>';
    return;
  }
  userList.innerHTML = users.map(user => `
    <div class="border border-gray-100 rounded-lg p-3">
      <div class="text-sm text-gray-800">${escapeHtml(user.name || user.email)}</div>
      <div class="text-xs text-gray-500">${escapeHtml(user.email || '')} · ${escapeHtml(user.role || '')} · ${escapeHtml(formatDateTime(user.created_at))}</div>
      <div class="flex flex-col sm:flex-row gap-2 mt-2">
        <input class="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1" placeholder="新密码（可选）" data-reset-password-input="${user.id}" />
        <button class="bg-gray-900 hover:bg-gray-800 text-white text-sm px-3 py-2 rounded-lg" data-reset-password-btn="${user.id}">重置密码</button>
      </div>
      <p class="text-xs text-gray-500 mt-1" data-reset-password-msg="${user.id}"></p>
    </div>
  `).join('');
}

async function refreshAnnouncements() {
  if (!announcementList) return;
  try {
    const items = await fetchAnnouncements();
    renderAnnouncementList(items);
  } catch (err) {
    announcementList.innerHTML = `<div class="text-sm text-red-500">加载失败：${escapeHtml(err.message)}</div>`;
  }
}

async function refreshScoreTemplates() {
  if (!scoreTemplateList) return;
  try {
    const templates = await fetchScoreTemplates();
    scoreTemplatesByType = templates.reduce((acc, template) => {
      let criteria = [];
      try {
        criteria = JSON.parse(template.criteria || '[]');
      } catch (err) {
        criteria = [];
      }
      acc[template.type] = { ...template, criteria };
      return acc;
    }, {});
    renderScoreTemplateList(Object.values(scoreTemplatesByType));
    if (currentProjectId) {
      const detail = await fetchProjectDetail(currentProjectId);
      renderProjectDetail(detail);
      await loadComments(currentProjectId);
      await loadScoresForSubmissions(detail.submissions || []);
    }
  } catch (err) {
    scoreTemplateList.innerHTML = `<div class="text-sm text-red-500">加载失败：${escapeHtml(err.message)}</div>`;
  }
}

async function refreshUsers() {
  if (!userList) return;
  try {
    const users = await fetchUsers({
      keyword: userSearchInput?.value.trim() || '',
      role: userRoleFilter?.value || ''
    });
    renderUserList(users);
  } catch (err) {
    userList.innerHTML = `<div class="text-sm text-red-500">加载失败：${escapeHtml(err.message)}</div>`;
  }
}

function fillScoreForm(submissionId, scores) {
  const myScore = scores.find(item => Number(item.reviewer_id) === Number(currentUser.id));
  if (myScore) {
    let scoreMap = {};
    try {
      scoreMap = JSON.parse(myScore.scores || '{}');
    } catch (err) {
      scoreMap = {};
    }
    const inputs = document.querySelectorAll(`[data-score-input="${submissionId}"]`);
    inputs.forEach(input => {
      const key = input.getAttribute('data-score-key');
      if (key && scoreMap[key] !== undefined) {
        input.value = scoreMap[key];
      }
    });
    const totalInput = document.querySelector(`[data-score-total="${submissionId}"]`);
    if (totalInput && Number.isFinite(Number(myScore.total_score))) {
      totalInput.value = myScore.total_score;
    }
    const commentInput = document.querySelector(`[data-score-comment="${submissionId}"]`);
    if (commentInput && myScore.comment) {
      commentInput.value = myScore.comment;
    }
  }

  const listEl = document.getElementById(`scoreList-${submissionId}`);
  if (listEl) {
    if (!scores.length) {
      listEl.innerHTML = '<div class="text-xs text-gray-400">暂无评分</div>';
    } else {
      listEl.innerHTML = scores.map(item => `
        <div class="text-xs text-gray-500">${escapeHtml(item.reviewer_name || item.reviewer_email || '评审')} · 总分 ${escapeHtml(item.total_score || '-')}</div>
      `).join('');
    }
  }
}

async function loadScoresForSubmissions(submissions) {
  await Promise.all(submissions.map(async submission => {
    try {
      const scores = await fetchSubmissionScores(submission.id);
      fillScoreForm(submission.id, scores);
    } catch (err) {
      const listEl = document.getElementById(`scoreList-${submission.id}`);
      if (listEl) {
        listEl.innerHTML = `<div class="text-xs text-red-500">加载失败：${escapeHtml(err.message)}</div>`;
      }
    }
  }));
}

async function downloadExport() {
  const params = buildFilterParams();
  const res = await apiFetch(buildUrl('/exports/projects.csv', params));
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '导出失败');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'projects.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function formatDetailValue(value) {
  if (!value) return '';
  const escaped = escapeHtml(value);
  const withBreaks = escaped.replace(/\n/g, '<br>');
  if (escaped.startsWith('http://') || escaped.startsWith('https://')) {
    return `<a class="text-indigo-600 hover:underline" href="${escaped}" target="_blank">${escaped}</a>`;
  }
  return withBreaks;
}

function renderSubmissionDetails(submission) {
  const details = submission.details || {};
  const fields = DETAIL_FIELDS[submission.type] || [];
  const blocks = fields
    .map(field => {
      const value = details[field.key];
      if (!value) return '';
      return `<div>
        <div class="text-xs text-gray-500">${escapeHtml(field.label)}</div>
        <div class="text-sm text-gray-700">${formatDetailValue(value)}</div>
      </div>`;
    })
    .filter(Boolean);

  if (!blocks.length) {
    return submission.content
      ? `<div class="text-sm text-gray-700 whitespace-pre-line">${escapeHtml(submission.content)}</div>`
      : '<div class="text-sm text-gray-500">暂无补充说明</div>';
  }

  if (submission.content) {
    blocks.push(`<div>
      <div class="text-xs text-gray-500">补充说明</div>
      <div class="text-sm text-gray-700">${formatDetailValue(submission.content)}</div>
    </div>`);
  }

  return blocks.join('');
}

function renderScoreForm(submission) {
  const template = scoreTemplatesByType[submission.type];
  if (!template || !Array.isArray(template.criteria) || !template.criteria.length) {
    return `
      <div class="grid gap-2">
        <label class="text-xs text-gray-500">总分</label>
        <input type="number" min="0" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" data-score-total="${submission.id}" />
        <textarea rows="2" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="评分备注（可选）" data-score-comment="${submission.id}"></textarea>
        <button class="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded-lg" data-score-submit="${submission.id}">保存评分</button>
        <p class="text-xs text-gray-500" data-score-msg="${submission.id}"></p>
      </div>
    `;
  }

  const inputs = template.criteria.map(item => `
    <div>
      <label class="text-xs text-gray-500">${escapeHtml(item.label)}（0-${item.max}）</label>
      <input type="number" min="0" max="${item.max}" class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full" data-score-input="${submission.id}" data-score-key="${escapeHtml(item.key)}" />
    </div>
  `).join('');

  return `
    <div class="grid gap-2">
      ${inputs}
      <textarea rows="2" class="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="评分备注（可选）" data-score-comment="${submission.id}"></textarea>
      <button class="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded-lg" data-score-submit="${submission.id}">保存评分</button>
      <p class="text-xs text-gray-500" data-score-msg="${submission.id}"></p>
    </div>
  `;
}

function renderComments(comments) {
  const listEl = document.getElementById('commentList');
  if (!listEl) return;
  if (!comments.length) {
    listEl.innerHTML = '<div class="text-sm text-gray-400">暂无评论，快来发起讨论吧。</div>';
    return;
  }
  listEl.innerHTML = comments.map(comment => `
    <div class="border border-gray-100 rounded-lg p-3">
      <div class="text-xs text-gray-500">${escapeHtml(comment.name || comment.email || '匿名')} · ${escapeHtml(comment.role || '')} · ${escapeHtml(formatDateTime(comment.created_at))}</div>
      <div class="text-sm text-gray-700 mt-1 whitespace-pre-line">${escapeHtml(comment.content || '')}</div>
    </div>
  `).join('');
}

async function loadComments(projectId) {
  try {
    const comments = await fetchComments(projectId);
    renderComments(comments);
  } catch (err) {
    const listEl = document.getElementById('commentList');
    if (listEl) {
      listEl.innerHTML = `<div class="text-sm text-red-500">加载失败：${escapeHtml(err.message)}</div>`;
    }
  }
}

function renderProjects(projects) {
  if (!projects.length) {
    projectListEl.textContent = '暂无数据';
    return;
  }

  projectListEl.innerHTML = projects.map(project => (
    `<button class="w-full text-left border-b border-gray-100 py-3 hover:bg-gray-50 px-2" data-project-id="${project.id}">
      <div class="font-medium text-gray-800">${escapeHtml(project.title)}</div>
      <div class="text-xs text-gray-500 flex items-center gap-2">ID: ${project.id} ${renderStatusBadge(project.status)}</div>
      <div class="text-xs text-gray-400 mt-1">更新：${escapeHtml(formatDateTime(project.updated_at))}</div>
    </button>`
  )).join('');
}

function renderProjectDetail(detail) {
  const { project, submissions, logs, members } = detail;
  if (!project) {
    projectDetailEl.textContent = '项目不存在';
    return;
  }

  currentProjectId = project.id;
  const teamMembers = escapeHtml(project.team_members || '').replace(/\n/g, '<br>');
  const summary = escapeHtml(project.summary || '');
  const memberChips = Array.isArray(members) && members.length
    ? members.map(member => `<span class="inline-flex items-center bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full mr-2 mb-2">${escapeHtml(member.name || member.email)}</span>`).join('')
    : '<span class="text-gray-400">暂无系统成员</span>';
  const giteaRepoUrl = project.gitea_repo_url || '';
  const giteaLink = giteaRepoUrl
    ? `<a class="text-indigo-600 hover:underline" href="${escapeHtml(giteaRepoUrl)}" target="_blank">${escapeHtml(giteaRepoUrl)}</a>`
    : '<span class="text-gray-400">未填写</span>';
  const milestoneSummary = buildMilestoneSummary(submissions || []);

  projectDetailEl.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col gap-3">
        <div>
          <h4 class="text-lg font-semibold">${escapeHtml(project.title)}</h4>
          <p class="text-sm text-gray-500 mt-1">项目 ID: ${project.id} · ${renderStatusBadge(project.status)}</p>
          <p class="text-sm text-gray-600 mt-2">班级/组别：${escapeHtml(project.class_name || '-')}</p>
          <p class="text-sm text-gray-600 mt-2">系统成员：<br>${memberChips}</p>
          <p class="text-sm text-gray-600 mt-2">团队成员文本：<br>${teamMembers || '-'}</p>
          <p class="text-sm text-gray-600 mt-2">项目简介：${summary || '-'}</p>
          <p class="text-sm text-gray-600 mt-2">Gitea 仓库：${giteaLink}</p>
        </div>
        ${isTeacher ? `
        <div class="flex flex-wrap gap-2">
          <button id="downloadProjectAttachmentsBtn" class="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded-lg">下载项目附件</button>
          <button id="downloadProjectArchiveBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg">导出项目归档</button>
        </div>
        ` : ''}
      </div>

      ${isTeacher ? `
      <div class="border-t pt-4">
        <h5 class="font-semibold mb-2">状态更新</h5>
        <div class="flex flex-col gap-2 md:flex-row md:items-center">
          <select id="statusSelect" class="border border-gray-300 rounded-lg px-3 py-2">
            <option value="submitted">已提交</option>
            <option value="reviewing">审核中</option>
            <option value="approved">通过</option>
            <option value="rejected">驳回</option>
            <option value="in_progress">进行中</option>
            <option value="midterm_review">中期评审</option>
            <option value="final_review">结题待审</option>
            <option value="archived">已归档</option>
          </select>
          <input id="statusNote" class="flex-1 border border-gray-300 rounded-lg px-3 py-2" placeholder="备注（可选）" />
          <button id="updateStatusBtn" class="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg">更新状态</button>
        </div>
        <p id="statusUpdateMsg" class="text-xs text-gray-500 mt-2"></p>
      </div>
      ` : ''}

      <div class="border-t pt-4">
        <h5 class="font-semibold mb-2">里程碑状态</h5>
        <div class="grid gap-2 sm:grid-cols-2">
          ${milestoneSummary.map(item => `
            <div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <span class="text-sm text-gray-700">${escapeHtml(SUBMISSION_LABELS[item.type] || item.type)}</span>
              ${renderMilestoneStatusBadge(item.status)}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="border-t pt-4">
        <h5 class="font-semibold mb-2">阶段提交</h5>
        <div class="space-y-4">
          ${submissions.length ? submissions.map(submission => `
            <div class="border border-gray-100 rounded-xl p-4">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div class="font-medium">${escapeHtml(SUBMISSION_LABELS[submission.type] || submission.type)} · ${escapeHtml(submission.title || '未命名')}</div>
                  <div class="text-xs text-gray-500">提交时间：${escapeHtml(formatDateTime(submission.created_at))}</div>
                  <div class="text-xs text-gray-500">状态：${renderSubmissionStatusBadge(submission.status)}</div>
                </div>
              </div>
              <div class="mt-3 space-y-3">${renderSubmissionDetails(submission)}</div>
              <div class="mt-2 text-sm text-indigo-600">
                ${(submission.attachments || []).map(att => `<a class="block hover:underline" href="${att.url}" target="_blank">${escapeHtml(att.name)}</a>`).join('') || '无附件'}
              </div>
              ${isTeacher ? `
              <div class="mt-3">
                <label class="block text-xs font-medium mb-1">反馈</label>
                <textarea class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows="3" data-feedback="${submission.id}">${escapeHtml(submission.feedback || '')}</textarea>
                <div class="flex flex-col sm:flex-row gap-2 mt-2">
                  <select class="border border-gray-300 rounded-lg px-3 py-2 text-sm" data-feedback-status="${submission.id}">
                    <option value="reviewed" ${submission.status === 'reviewed' ? 'selected' : ''}>已评审</option>
                    <option value="needs_changes" ${submission.status === 'needs_changes' ? 'selected' : ''}>需修改</option>
                  </select>
                  <button class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg" data-feedback-btn="${submission.id}">保存反馈</button>
                </div>
                <p class="text-xs text-gray-500 mt-1" data-feedback-msg="${submission.id}"></p>
              </div>
              ` : ''}

              <div class="mt-4 border-t pt-3">
                <div class="text-xs font-semibold text-gray-600 mb-2">评分</div>
                ${renderScoreForm(submission)}
                <div id="scoreList-${submission.id}" class="text-xs text-gray-500 mt-2">加载评分中...</div>
              </div>
            </div>
          `).join('') : '<p class="text-sm text-gray-500">暂无提交记录</p>'}
        </div>
      </div>

      <div class="border-t pt-4">
        <h5 class="font-semibold mb-2">项目讨论</h5>
        <div id="commentList" class="space-y-3 text-sm text-gray-700">
          <div class="text-sm text-gray-400">加载评论中...</div>
        </div>
        <div class="mt-3">
          <textarea id="commentInput" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="写下你的想法"></textarea>
          <div class="flex items-center gap-3 mt-2">
            <button id="commentSubmitBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg">发送评论</button>
            <span id="commentStatus" class="text-xs text-gray-500"></span>
          </div>
        </div>
      </div>

      <div class="border-t pt-4">
        <h5 class="font-semibold mb-2">状态日志</h5>
        <div class="text-sm text-gray-500 space-y-2">
          ${logs.length ? logs.map(log => `
            <div class="border-b border-gray-100 pb-2">
              <div class="text-gray-700">${escapeHtml(PROJECT_STATUS_LABELS[log.status] || log.status)} <span class="text-xs text-gray-400">(${escapeHtml(formatDateTime(log.created_at))})</span></div>
              <div class="text-xs text-gray-500">${escapeHtml(log.note || '')}</div>
            </div>
          `).join('') : '暂无日志'}
        </div>
      </div>
    </div>
  `;

  if (isTeacher) {
    const statusSelect = document.getElementById('statusSelect');
    if (statusSelect) statusSelect.value = project.status;
  }
}

async function refreshProjects() {
  const projects = await fetchProjects();
  renderProjects(projects);
  if (isTeacher) {
    const stats = await fetchStats();
    renderStats(stats);
  }
}

projectListEl.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-project-id]');
  if (!target) return;
  const projectId = target.getAttribute('data-project-id');
  currentProjectId = projectId;
  projectDetailEl.textContent = '加载中...';
  try {
    const detail = await fetchProjectDetail(projectId);
    renderProjectDetail(detail);
    await loadComments(projectId);
    await loadScoresForSubmissions(detail.submissions || []);
  } catch (err) {
    projectDetailEl.textContent = `加载失败：${err.message}`;
  }
});

projectDetailEl.addEventListener('click', async (event) => {
  const statusBtn = event.target.closest('#updateStatusBtn');
  if (statusBtn && currentProjectId && isTeacher) {
    const status = document.getElementById('statusSelect').value;
    const note = document.getElementById('statusNote').value.trim();
    const msgEl = document.getElementById('statusUpdateMsg');
    msgEl.textContent = '更新中...';
    try {
      await updateProjectStatus(currentProjectId, status, note);
      msgEl.textContent = '更新成功';
      const detail = await fetchProjectDetail(currentProjectId);
      renderProjectDetail(detail);
      await loadComments(currentProjectId);
      await loadScoresForSubmissions(detail.submissions || []);
      await refreshProjects();
    } catch (err) {
      msgEl.textContent = `更新失败：${err.message}`;
    }
    return;
  }

  const feedbackBtn = event.target.closest('[data-feedback-btn]');
  if (feedbackBtn && isTeacher) {
    const submissionId = feedbackBtn.getAttribute('data-feedback-btn');
    const feedbackEl = document.querySelector(`[data-feedback="${submissionId}"]`);
    const statusEl = document.querySelector(`[data-feedback-status="${submissionId}"]`);
    const msgEl = document.querySelector(`[data-feedback-msg="${submissionId}"]`);
    msgEl.textContent = '保存中...';
    try {
      await submitFeedback(submissionId, statusEl.value, feedbackEl.value.trim());
      msgEl.textContent = '保存成功';
    } catch (err) {
      msgEl.textContent = `保存失败：${err.message}`;
    }
  }

  const downloadAttachmentsBtn = event.target.closest('#downloadProjectAttachmentsBtn');
  if (downloadAttachmentsBtn && currentProjectId) {
    try {
      await downloadProjectAttachments(currentProjectId);
    } catch (err) {
      alert(`下载失败：${err.message}`);
    }
    return;
  }

  const downloadArchiveBtn = event.target.closest('#downloadProjectArchiveBtn');
  if (downloadArchiveBtn && currentProjectId) {
    try {
      await downloadProjectArchive(currentProjectId);
    } catch (err) {
      alert(`导出失败：${err.message}`);
    }
    return;
  }

  const scoreBtn = event.target.closest('[data-score-submit]');
  if (scoreBtn) {
    const submissionId = scoreBtn.getAttribute('data-score-submit');
    const msgEl = document.querySelector(`[data-score-msg="${submissionId}"]`);
    if (msgEl) msgEl.textContent = '保存中...';
    const scoreInputs = document.querySelectorAll(`[data-score-input="${submissionId}"]`);
    const scoreMap = {};
    scoreInputs.forEach(input => {
      const key = input.getAttribute('data-score-key');
      if (!key) return;
      const raw = input.value.trim();
      if (raw !== '') {
        scoreMap[key] = Number(raw);
      }
    });
    const totalInput = document.querySelector(`[data-score-total="${submissionId}"]`);
    const commentInput = document.querySelector(`[data-score-comment="${submissionId}"]`);
    const totalRaw = totalInput ? totalInput.value.trim() : '';
    const payload = {
      scores: scoreMap,
      totalScore: totalRaw ? Number(totalRaw) : undefined,
      comment: commentInput ? commentInput.value.trim() : ''
    };
    try {
      await submitSubmissionScore(submissionId, payload);
      if (msgEl) msgEl.textContent = '保存成功';
      const scores = await fetchSubmissionScores(submissionId);
      fillScoreForm(submissionId, scores);
    } catch (err) {
      if (msgEl) msgEl.textContent = `保存失败：${err.message}`;
    }
    return;
  }

  const commentBtn = event.target.closest('#commentSubmitBtn');
  if (commentBtn && currentProjectId) {
    const input = document.getElementById('commentInput');
    const statusEl = document.getElementById('commentStatus');
    if (!input || !statusEl) return;
    const content = input.value.trim();
    if (!content) {
      statusEl.textContent = '请输入评论内容';
      return;
    }
    statusEl.textContent = '发送中...';
    try {
      await submitComment(currentProjectId, content);
      input.value = '';
      statusEl.textContent = '发送成功';
      await loadComments(currentProjectId);
    } catch (err) {
      statusEl.textContent = `发送失败：${err.message}`;
    }
  }
});

filterBtn.addEventListener('click', refreshProjects);
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    downloadExport().catch(err => {
      alert(`导出失败：${err.message}`);
    });
  });
}
if (exportAttachmentsBtn) {
  exportAttachmentsBtn.addEventListener('click', () => {
    downloadAttachmentsExport().catch(err => {
      alert(`下载失败：${err.message}`);
    });
  });
}

if (announcementForm) {
  announcementForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!announcementStatus) return;
    announcementStatus.textContent = '发布中...';
    const formData = new FormData(announcementForm);
    try {
      await createAnnouncement({
        title: formData.get('title'),
        body: formData.get('body')
      });
      announcementStatus.textContent = '发布成功';
      announcementForm.reset();
      await refreshAnnouncements();
    } catch (err) {
      announcementStatus.textContent = `发布失败：${err.message}`;
    }
  });
}

if (announcementList) {
  announcementList.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-announcement-delete]');
    if (!target) return;
    try {
      await deleteAnnouncement(target.getAttribute('data-announcement-delete'));
      await refreshAnnouncements();
    } catch (err) {
      alert(`删除失败：${err.message}`);
    }
  });
}

if (scoreTemplateForm) {
  scoreTemplateForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!scoreTemplateStatus) return;
    scoreTemplateStatus.textContent = '保存中...';
    const formData = new FormData(scoreTemplateForm);
    const criteria = parseCriteriaInput(formData.get('criteria'));
    if (!criteria.length) {
      scoreTemplateStatus.textContent = '请填写有效的评分标准';
      return;
    }
    try {
      await saveScoreTemplate({
        type: formData.get('type'),
        criteria
      });
      scoreTemplateStatus.textContent = '保存成功';
      scoreTemplateForm.reset();
      await refreshScoreTemplates();
    } catch (err) {
      scoreTemplateStatus.textContent = `保存失败：${err.message}`;
    }
  });
}

if (scoreTemplateList) {
  scoreTemplateList.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-template-delete]');
    if (!target) return;
    try {
      await deleteScoreTemplate(target.getAttribute('data-template-delete'));
      await refreshScoreTemplates();
    } catch (err) {
      alert(`删除失败：${err.message}`);
    }
  });
}

if (userSearchBtn) {
  userSearchBtn.addEventListener('click', refreshUsers);
}

if (userList) {
  userList.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-reset-password-btn]');
    if (!target) return;
    const userId = target.getAttribute('data-reset-password-btn');
    const input = document.querySelector(`[data-reset-password-input="${userId}"]`);
    const msgEl = document.querySelector(`[data-reset-password-msg="${userId}"]`);
    if (!input || !msgEl) return;
    msgEl.textContent = '重置中...';
    try {
      const result = await resetUserPassword(userId, input.value.trim());
      msgEl.textContent = `新密码：${result.password}`;
      input.value = '';
    } catch (err) {
      msgEl.textContent = `重置失败：${err.message}`;
    }
  });
}

if (profileForm) {
  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!profileStatus) return;
    profileStatus.textContent = '保存中...';
    const formData = new FormData(profileForm);
    try {
      const res = await apiFetch('/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          avatarUrl: formData.get('avatarUrl')
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存失败');
      updateAuthUser(data.user);
      renderCurrentUser(data.user);
      profileStatus.textContent = '保存成功';
    } catch (err) {
      profileStatus.textContent = `保存失败：${err.message}`;
    }
  });
}

if (!isTeacher) {
  if (exportBtn) exportBtn.classList.add('hidden');
  if (exportAttachmentsBtn) exportAttachmentsBtn.classList.add('hidden');
  if (statsSummaryEl) statsSummaryEl.parentElement?.classList.add('hidden');
  if (announcementSection) announcementSection.classList.add('hidden');
  if (userAdminSection) userAdminSection.classList.add('hidden');
  if (scoreTemplateForm) scoreTemplateForm.classList.add('hidden');
  if (scoreTemplateStatus) scoreTemplateStatus.textContent = '';
}
refreshScoreTemplates();
refreshProjects();
if (isTeacher) {
  refreshAnnouncements();
  refreshUsers();
}
if (profileForm) {
  profileForm.querySelector('input[name="name"]').value = currentUser?.name || '';
  profileForm.querySelector('input[name="avatarUrl"]').value = currentUser?.avatar_url || '';
}

const { apiFetch, requireAuth, renderCurrentUser, updateAuthUser } = window.auth;
const currentUser = requireAuth('student');
if (!currentUser) {
  throw new Error('auth_required');
}

// Tabs
const tabs = document.querySelectorAll('.nav-tab');
const sections = document.querySelectorAll('.tab-content');

// Dashboard Elements
const myProjectListEl = document.getElementById('myProjectList');
const myProjectDetailEl = document.getElementById('myProjectDetail');

// Forms
const createProjectForm = document.getElementById('createProjectForm');
const createProjectStatus = document.getElementById('createProjectStatus');
const createdProjectHint = document.getElementById('createdProjectHint');
const proposalFilesInput = document.getElementById('proposalFiles');

const submissionForm = document.getElementById('submissionForm');
const submissionStatus = document.getElementById('submissionStatus');
const submissionContent = document.getElementById('submissionContent');
const submissionHelp = document.getElementById('submissionHelp');
const submissionTypeSelect = submissionForm.querySelector('select[name="type"]');
const submissionTitle = document.getElementById('submissionTitle');
const submissionFilesInput = document.getElementById('submissionFiles');
const submitProjectIdInput = document.getElementById('submitProjectId');
const stageFields = document.querySelectorAll('.stage-fields');
const proposalFileHint = document.getElementById('proposalFileHint');
const submissionFileHint = document.getElementById('submissionFileHint');

const memberSearchInput = document.getElementById('memberSearchInput');
const memberSearchBtn = document.getElementById('memberSearchBtn');
const memberSearchResults = document.getElementById('memberSearchResults');
const selectedMembersEl = document.getElementById('selectedMembers');

const profileForm = document.getElementById('profileForm');
const profileStatus = document.getElementById('profileStatus');

let currentProjectId = null;
let selectedMembers = [];

// Constants
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

const STAGE_REQUIRED_FIELDS = {
  proposal: ['problem', 'goals', 'scope', 'approach', 'plan', 'teamMembers'],
  milestone_1: ['researchConclusion', 'feasibility', 'riskList', 'featureScope'],
  milestone_2: ['designPlan', 'prototype', 'keyPath'],
  midterm: ['progressCompare', 'demoLink', 'issuesAdjust'],
  milestone_3: ['integration', 'testingFeedback', 'mvpValidation'],
  final: ['deliverables', 'demo', 'techSummary', 'reflection'],
  showcase: ['showcaseSummary']
};

const PROPOSAL_LABELS = {
  problem: '问题与背景',
  goals: '目标',
  scope: '范围',
  approach: '技术路线',
  plan: '计划',
  teamMembers: '团队成员'
};

const DETAIL_LABELS = Object.values(DETAIL_FIELDS).flat().reduce((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {});

// Utils
function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function updateFileHint(input, hintEl) {
  if (!hintEl) return;
  const count = input?.files?.length || 0;
  hintEl.textContent = count ? `已选择 ${count} 个文件` : '未选择文件';
}

// Tab Switching
function switchTab(targetId) {
  tabs.forEach(t => {
    if (t.dataset.target === targetId) {
      t.classList.add('text-indigo-600', 'border-b-2', 'border-indigo-600');
      t.classList.remove('text-gray-500', 'hover:text-gray-700');
    } else {
      t.classList.remove('text-indigo-600', 'border-b-2', 'border-indigo-600');
      t.classList.add('text-gray-500', 'hover:text-gray-700');
    }
  });
  sections.forEach(s => {
    if (s.id === targetId) {
      s.classList.remove('hidden');
    } else {
      s.classList.add('hidden');
    }
  });
  if (targetId === 'dashboardSection') {
    refreshMyProjects();
  }
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.target));
});

// Logic
async function createProject(payload) {
  const res = await apiFetch('/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '提交失败');
  return data.project;
}

async function submitWork(projectId, formData) {
  const res = await apiFetch(`/projects/${projectId}/submissions`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '提交失败');
  return data;
}

async function loadMyProjects() {
  const res = await apiFetch('/projects');
  const data = await res.json();
  return data.projects || [];
}

async function fetchProjectDetail(projectId) {
  const res = await apiFetch(`/projects/${projectId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '加载失败');
  return data;
}

async function searchMembers(keyword) {
  const res = await apiFetch(`/users/search?keyword=${encodeURIComponent(keyword)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '搜索失败');
  return data.users || [];
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

async function updateGiteaRepo(projectId, giteaRepoUrl) {
  const res = await apiFetch(`/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ giteaRepoUrl })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '更新失败');
  return data;
}

function updateSelectedMembers() {
  if (!selectedMembersEl) return;
  if (!selectedMembers.length) {
    selectedMembersEl.textContent = '';
    return;
  }
  selectedMembersEl.innerHTML = selectedMembers.map(member => `
    <span class="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full mr-2 mb-2">
      ${escapeHtml(member.name || member.email)}
      <button type="button" class="text-indigo-500 hover:text-indigo-700" data-remove-member="${member.id}">×</button>
    </span>
  `).join('');
}

function renderMemberSearchResults(users) {
  if (!memberSearchResults) return;
  if (!users.length) {
    memberSearchResults.textContent = '未找到匹配成员';
    return;
  }
  memberSearchResults.innerHTML = users.map(user => `
    <button type="button" class="block w-full text-left border border-gray-100 rounded-lg px-3 py-2 hover:bg-gray-50 mt-2" data-member-id="${user.id}">
      <div class="text-sm text-gray-800">${escapeHtml(user.name || user.email)}</div>
      <div class="text-xs text-gray-500">${escapeHtml(user.email || '')} · ${escapeHtml(user.role || '')}</div>
    </button>
  `).join('');
}

async function handleMemberSearch() {
  const keyword = memberSearchInput?.value.trim();
  if (!keyword) {
    if (memberSearchResults) memberSearchResults.textContent = '请输入关键词';
    return;
  }
  if (memberSearchResults) memberSearchResults.textContent = '搜索中...';
  try {
    const users = await searchMembers(keyword);
    renderMemberSearchResults(users);
  } catch (err) {
    if (memberSearchResults) memberSearchResults.textContent = `搜索失败：${err.message}`;
  }
}
function buildProposalContent(formData) {
  const sections = [
    ['问题与背景', formData.get('problem')],
    ['目标', formData.get('goals')],
    ['范围（做/不做）', formData.get('scope')],
    ['技术路线', formData.get('approach')],
    ['计划（阶段安排）', formData.get('plan')]
  ];

  return sections
    .filter(([, value]) => value && String(value).trim())
    .map(([label, value]) => `${label}：\n${String(value).trim()}`)
    .join('\n\n');
}

function buildProposalDetails(formData) {
  const details = {
    problem: String(formData.get('problem') || '').trim(),
    goals: String(formData.get('goals') || '').trim(),
    scope: String(formData.get('scope') || '').trim(),
    approach: String(formData.get('approach') || '').trim(),
    plan: String(formData.get('plan') || '').trim(),
    teamMembers: String(formData.get('teamMembers') || '').trim()
  };
  Object.keys(details).forEach(key => {
    if (!details[key]) delete details[key];
  });
  return Object.keys(details).length ? details : null;
}

function updateSubmissionHint() {
  const type = submissionTypeSelect.value;
  const hints = {
    milestone_1: '需求调研结论、风险清单、功能一范围。',
    milestone_2: '方案设计、原型或架构图、关键路径说明。',
    midterm: '进度对比、演示链接、问题与调整。',
    milestone_3: '项目集成情况、测试/反馈、MVP 验证结果。',
    final: '成果包清单、演示说明、技术总结、反思与展望。',
    showcase: '海报/视频/可复用资源说明。',
    proposal: '开题补充材料与说明。'
  };
  const titles = {
    milestone_1: '里程碑1：功能一',
    milestone_2: '里程碑2：功能二',
    midterm: '中期评审',
    milestone_3: '里程碑3：项目集成',
    final: '结题评审',
    showcase: '展示/归档',
    proposal: '开题补充'
  };
  const hint = hints[type] || '';
  submissionContent.placeholder = hint;
  submissionHelp.textContent = hint;
  if (!submissionTitle.value.trim() && titles[type]) {
    submissionTitle.value = titles[type];
  }

  stageFields.forEach(section => {
    if (section.dataset.stage === type) {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  });
}

function buildDetails(formData) {
  const details = {};
  formData.forEach((value, key) => {
    if (!key.startsWith('detail_')) return;
    const trimmed = String(value || '').trim();
    if (!trimmed) return;
    details[key.replace('detail_', '')] = trimmed;
  });
  return Object.keys(details).length ? details : null;
}

function validateCreateProjectForm(formData) {
  const missing = STAGE_REQUIRED_FIELDS.proposal.filter(key => {
    const value = String(formData.get(key) || '').trim();
    return !value;
  });
  if (!missing.length) return null;
  const labels = missing.map(key => PROPOSAL_LABELS[key] || key).join('、');
  return `请完善必填项：${labels}`;
}

function validateSubmissionForm(rawForm) {
  const type = String(rawForm.get('type') || '').trim();
  const required = STAGE_REQUIRED_FIELDS[type] || [];
  const missing = required.filter(key => {
    const value = String(rawForm.get(`detail_${key}`) || '').trim();
    return !value;
  });
  if (missing.length) {
    const labels = missing.map(key => DETAIL_LABELS[key] || key).join('、');
    return `请完善必填项：${labels}`;
  }
  if (type === 'midterm') {
    const demoLink = String(rawForm.get('detail_demoLink') || '').trim();
    if (demoLink && !/^https?:\/\//i.test(demoLink)) {
      return '演示链接必须以 http(s) 开头';
    }
  }
  return null;
}

// Rendering
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

function renderMyProjects(projects) {
  if (!projects.length) {
    myProjectListEl.innerHTML = `
      <div class="border border-dashed border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500">
        <p>暂无项目，快来创建你的第一个科创项目吧。</p>
        <button data-empty-create class="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm">新建项目</button>
      </div>
    `;
    return;
  }
  myProjectListEl.innerHTML = projects.map(project => (
    `<button class="w-full text-left border-b border-gray-100 py-3 hover:bg-gray-50 px-2" data-project-id="${project.id}">
      <div class="font-medium text-gray-800">${escapeHtml(project.title)}</div>
      <div class="text-xs text-gray-500 flex items-center gap-2">ID: ${project.id} ${renderStatusBadge(project.status)}</div>
    </button>`
  )).join('');
}

function renderProjectDetail(detail) {
  const { project, submissions, logs, members } = detail;
  if (!project) {
    myProjectDetailEl.textContent = '项目不存在';
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

  myProjectDetailEl.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-start gap-4">
        <div>
          <h4 class="text-lg font-semibold">${escapeHtml(project.title)}</h4>
          <p class="text-sm text-gray-500 mt-1">项目 ID: ${project.id} · ${renderStatusBadge(project.status)}</p>
          <p class="text-sm text-gray-600 mt-2">班级/组别：${escapeHtml(project.class_name || '-')}</p>
          <p class="text-sm text-gray-600 mt-2">系统成员：<br>${memberChips}</p>
          <p class="text-sm text-gray-600 mt-2">团队成员文本：<br>${teamMembers || '-'}</p>
        </div>
        <button id="goToSubmitBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg" data-project-id="${project.id}">
          提交成果
        </button>
      </div>

      <div class="border-t pt-4">
        <h5 class="font-semibold mb-2">Gitea 仓库</h5>
        <div class="text-sm text-gray-600">当前地址：${giteaLink}</div>
        <div class="flex flex-col sm:flex-row gap-2 mt-2">
          <input id="giteaRepoInput" class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" value="${escapeHtml(giteaRepoUrl)}" placeholder="https://gitea.example.com/owner/repo" />
          <button id="giteaRepoSaveBtn" class="bg-gray-900 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded-lg">保存地址</button>
        </div>
        <p id="giteaRepoMsg" class="text-xs text-gray-500 mt-2"></p>
      </div>

      <div class="border-t pt-4">
        <h5 class="font-semibold mb-2">项目概况</h5>
        <div class="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-lg">${summary || '暂无简介'}</div>
      </div>

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
        <h5 class="font-semibold mb-2">提交记录与反馈</h5>
        <div class="space-y-4">
          ${submissions.length ? submissions.map(submission => `
            <div class="border border-gray-100 rounded-xl p-4 ${submission.status === 'needs_changes' ? 'bg-red-50 border-red-100' : ''}">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div class="font-medium">${escapeHtml(SUBMISSION_LABELS[submission.type] || submission.type)} · ${escapeHtml(submission.title || '未命名')}</div>
                  <div class="text-xs text-gray-500">提交时间：${escapeHtml(formatDateTime(submission.created_at))}</div>
                  <div class="text-xs text-gray-500">状态：${renderSubmissionStatusBadge(submission.status)}</div>
                </div>
                ${submission.status === 'needs_changes' ? `
                  <button class="text-sm text-red-600 hover:underline" data-resubmit-type="${submission.type}" data-resubmit-project="${project.id}">重新提交</button>
                ` : ''}
              </div>
              <div class="mt-3 space-y-3">${renderSubmissionDetails(submission)}</div>
              <div class="mt-2 text-sm text-indigo-600">
                ${(submission.attachments || []).map(att => `<a class="block hover:underline" href="${att.url}" target="_blank">${escapeHtml(att.name)}</a>`).join('') || '无附件'}
              </div>
              ${submission.feedback ? `
                <div class="mt-3 pt-3 border-t border-gray-200">
                  <div class="text-xs font-semibold text-gray-600 mb-1">老师反馈：</div>
                  <div class="text-sm text-gray-800 bg-white p-2 rounded border border-gray-200">${formatDetailValue(submission.feedback)}</div>
                </div>
              ` : ''}
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
        <div class="text-sm text-gray-500 space-y-2 h-32 overflow-y-auto">
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

  const btn = document.getElementById('goToSubmitBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      submitProjectIdInput.value = project.id;
      switchTab('submitSection');
    });
  }
}

async function refreshMyProjects() {
  myProjectListEl.textContent = '加载中...';
  try {
    const projects = await loadMyProjects();
    renderMyProjects(projects);
  } catch (err) {
    myProjectListEl.textContent = `加载失败：${err.message}`;
  }
}

// Event Listeners
createProjectForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  createProjectStatus.textContent = '提交中...';
  createdProjectHint.textContent = '';

  const formData = new FormData(createProjectForm);
  const validationError = validateCreateProjectForm(formData);
  if (validationError) {
    createProjectStatus.textContent = validationError;
    return;
  }
  const payload = {
    title: formData.get('title'),
    className: formData.get('className'),
    teamMembers: formData.get('teamMembers'),
    summary: formData.get('problem'),
    giteaRepoUrl: formData.get('giteaRepoUrl'),
    memberIds: selectedMembers.map(member => member.id)
  };

  try {
    const project = await createProject(payload);
    const proposalData = new FormData();
    proposalData.append('type', 'proposal');
    proposalData.append('title', '开题报告');
    proposalData.append('content', buildProposalContent(formData));
    const proposalDetails = buildProposalDetails(formData);
    if (proposalDetails) {
      proposalData.append('details', JSON.stringify(proposalDetails));
    }
    Array.from(proposalFilesInput.files || []).forEach(file => {
      proposalData.append('files', file);
    });
    await submitWork(project.id, proposalData);

    createProjectStatus.textContent = '立项与开题提交成功';
    createdProjectHint.textContent = `项目已创建，项目 ID：${project.id}`;
    createProjectForm.reset();
    selectedMembers = [];
    updateSelectedMembers();
    updateFileHint(proposalFilesInput, proposalFileHint);
    
    // Switch to Dashboard
    setTimeout(() => {
      createProjectStatus.textContent = '';
      createdProjectHint.textContent = '';
      switchTab('dashboardSection');
    }, 1500);

  } catch (err) {
    createProjectStatus.textContent = `提交失败：${err.message}`;
  }
});

submissionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  submissionStatus.textContent = '提交中...';

  const rawForm = new FormData(submissionForm);
  const projectId = rawForm.get('projectId');
  const type = rawForm.get('type');
  const validationError = validateSubmissionForm(rawForm);
  if (validationError) {
    submissionStatus.textContent = validationError;
    return;
  }

  const details = buildDetails(rawForm);
  const formData = new FormData();
  formData.append('type', type);
  formData.append('title', rawForm.get('title') || '');
  formData.append('content', rawForm.get('content') || '');
  if (details) {
    formData.append('details', JSON.stringify(details));
  }
  Array.from(submissionFilesInput.files || []).forEach(file => {
    formData.append('files', file);
  });

  try {
    await submitWork(projectId, formData);
    submissionStatus.textContent = '提交成功';
    submissionForm.reset();
    updateSubmissionHint();
    updateFileHint(submissionFilesInput, submissionFileHint);
    
    // Switch to Dashboard
    setTimeout(() => {
      submissionStatus.textContent = '';
      switchTab('dashboardSection');
    }, 1500);

  } catch (err) {
    submissionStatus.textContent = `提交失败：${err.message}`;
  }
});

myProjectListEl.addEventListener('click', async (event) => {
  const emptyBtn = event.target.closest('[data-empty-create]');
  if (emptyBtn) {
    switchTab('createSection');
    return;
  }
  const target = event.target.closest('[data-project-id]');
  if (!target) return;
  const projectId = target.getAttribute('data-project-id');
  myProjectDetailEl.textContent = '加载中...';
  try {
    const detail = await fetchProjectDetail(projectId);
    renderProjectDetail(detail);
    await loadComments(projectId);
  } catch (err) {
    myProjectDetailEl.textContent = `加载失败：${err.message}`;
  }
});

myProjectDetailEl.addEventListener('click', async (event) => {
  const resubmitBtn = event.target.closest('[data-resubmit-type]');
  if (resubmitBtn) {
    const type = resubmitBtn.getAttribute('data-resubmit-type');
    const projectId = resubmitBtn.getAttribute('data-resubmit-project');
    submitProjectIdInput.value = projectId;
    submissionTypeSelect.value = type;
    updateSubmissionHint();
    switchTab('submitSection');
    return;
  }

  const giteaBtn = event.target.closest('#giteaRepoSaveBtn');
  if (giteaBtn && currentProjectId) {
    const input = document.getElementById('giteaRepoInput');
    const msgEl = document.getElementById('giteaRepoMsg');
    if (!input || !msgEl) return;
    msgEl.textContent = '保存中...';
    try {
      await updateGiteaRepo(currentProjectId, input.value.trim());
      msgEl.textContent = '保存成功';
      const detail = await fetchProjectDetail(currentProjectId);
      renderProjectDetail(detail);
      await loadComments(currentProjectId);
    } catch (err) {
      msgEl.textContent = `保存失败：${err.message}`;
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

submissionTypeSelect.addEventListener('change', updateSubmissionHint);

if (proposalFilesInput) {
  proposalFilesInput.addEventListener('change', () => updateFileHint(proposalFilesInput, proposalFileHint));
}
if (submissionFilesInput) {
  submissionFilesInput.addEventListener('change', () => updateFileHint(submissionFilesInput, submissionFileHint));
}

if (memberSearchBtn) {
  memberSearchBtn.addEventListener('click', handleMemberSearch);
}
if (memberSearchInput) {
  memberSearchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleMemberSearch();
    }
  });
}
if (memberSearchResults) {
  memberSearchResults.addEventListener('click', (event) => {
    const target = event.target.closest('[data-member-id]');
    if (!target) return;
    const memberId = Number(target.getAttribute('data-member-id'));
    const name = target.querySelector('.text-gray-800')?.textContent || '';
    const email = target.querySelector('.text-gray-500')?.textContent?.split(' · ')[0] || '';
    if (!memberId) return;
    if (selectedMembers.some(member => member.id === memberId)) return;
    selectedMembers.push({ id: memberId, name, email });
    updateSelectedMembers();
  });
}
if (selectedMembersEl) {
  selectedMembersEl.addEventListener('click', (event) => {
    const target = event.target.closest('[data-remove-member]');
    if (!target) return;
    const memberId = Number(target.getAttribute('data-remove-member'));
    selectedMembers = selectedMembers.filter(member => member.id !== memberId);
    updateSelectedMembers();
  });
}

if (profileForm) {
  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!profileStatus) return;
    profileStatus.textContent = '保存中...';
    const formData = new FormData(profileForm);
    const payload = {
      name: formData.get('name'),
      avatarUrl: formData.get('avatarUrl')
    };
    try {
      const res = await apiFetch('/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存失败');
      updateAuthUser(data.user);
      profileStatus.textContent = '保存成功';
      renderCurrentUser(data.user);
    } catch (err) {
      profileStatus.textContent = `保存失败：${err.message}`;
    }
  });
}

// Initialize
updateSubmissionHint();
updateFileHint(proposalFilesInput, proposalFileHint);
updateFileHint(submissionFilesInput, submissionFileHint);
updateSelectedMembers();
if (profileForm) {
  profileForm.querySelector('input[name="name"]').value = currentUser?.name || '';
  profileForm.querySelector('input[name="avatarUrl"]').value = currentUser?.avatar_url || '';
}
refreshMyProjects();

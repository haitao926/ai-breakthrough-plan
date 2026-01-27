const { apiFetch } = window.auth;
const showcaseListEl = document.getElementById('showcaseList');
const showcaseSearchBtn = document.getElementById('showcaseSearchBtn');

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
  const text = String(value).trim();
  const escaped = escapeHtml(text);
  if (text.startsWith('http://') || text.startsWith('https://')) {
    return `<a class="text-indigo-600 hover:underline" href="${escaped}" target="_blank">${escaped}</a>`;
  }
  return escaped.replace(/\n/g, '<br>');
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildParams() {
  const keyword = document.getElementById('showcaseKeyword').value.trim();
  const className = document.getElementById('showcaseClass').value.trim();
  const params = new URLSearchParams();
  if (keyword) params.set('keyword', keyword);
  if (className) params.set('className', className);
  return params;
}

function buildUrl(base, params) {
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

async function fetchShowcase() {
  const params = buildParams();
  const res = await apiFetch(buildUrl('/showcase', params));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '加载失败');
  return data.items || [];
}

function renderShowcase(items) {
  if (!items.length) {
    showcaseListEl.innerHTML = `
      <div class="col-span-full border border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">
        <p>暂无展示项目，期待第一批成果发布。</p>
      </div>
    `;
    return;
  }

  showcaseListEl.innerHTML = items.map(item => {
    const project = item.project || {};
    const showcase = item.showcase || {};
    const details = showcase.details || {};
    const summary = details.showcaseSummary || showcase.content || '';
    const resources = details.reusableResources || '';
    const teamMembers = formatDetailValue(project.team_members || '') || '未填写';
    const attachments = Array.isArray(showcase.attachments) ? showcase.attachments : [];
    const statusLabel = PROJECT_STATUS_LABELS[project.status] || project.status || '-';

    return `
      <div class="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div>
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h3 class="text-lg font-semibold">${escapeHtml(project.title || '未命名项目')}</h3>
              <p class="text-xs text-gray-500">项目 ID: ${project.id || '-'} · 状态: ${escapeHtml(statusLabel)}</p>
            </div>
            <div class="text-xs text-gray-400">展示时间：${escapeHtml(formatDateTime(showcase.created_at))}</div>
          </div>
          <p class="text-sm text-gray-600 mt-2">班级/组别：${escapeHtml(project.class_name || '-')}</p>
          <p class="text-sm text-gray-600 mt-1">团队成员：${teamMembers}</p>
          <p class="text-sm text-gray-600 mt-1">项目简介：${escapeHtml(project.summary || '-')}</p>
        </div>
        <div>
          <div class="text-xs text-gray-500">展示说明</div>
          <div class="text-sm text-gray-700 mt-1">${summary ? formatDetailValue(summary) : '暂无展示说明'}</div>
        </div>
        <div>
          <div class="text-xs text-gray-500">可复用资源</div>
          <div class="text-sm text-gray-700 mt-1">${resources ? formatDetailValue(resources) : '暂无说明'}</div>
        </div>
        <div>
          <div class="text-xs text-gray-500">附件</div>
          <div class="text-sm text-indigo-600 mt-1">
            ${attachments.length ? attachments.map(att => `<a class="block hover:underline" href="${att.url}" target="_blank">${escapeHtml(att.name)}</a>`).join('') : '<span class="text-gray-400">无附件</span>'}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function refreshShowcase() {
  showcaseListEl.innerHTML = '<div class="text-sm text-gray-500">加载中...</div>';
  try {
    const items = await fetchShowcase();
    renderShowcase(items);
  } catch (err) {
    showcaseListEl.innerHTML = `<div class="text-sm text-red-500">加载失败：${escapeHtml(err.message)}</div>`;
  }
}

showcaseSearchBtn.addEventListener('click', refreshShowcase);
refreshShowcase();

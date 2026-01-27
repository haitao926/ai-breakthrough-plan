const announcementBar = document.getElementById('announcementBar');

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
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

async function loadAnnouncements() {
  if (!announcementBar) return;
  try {
    const res = await fetch('/api/v1/announcements');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '加载失败');
    const items = data.announcements || [];
    if (!items.length) {
      announcementBar.textContent = '暂无公告';
      return;
    }
    announcementBar.innerHTML = items.map(item => `
      <div class="border-b border-gray-100 pb-2 mb-2 last:border-b-0 last:mb-0">
        <div class="text-gray-800 font-medium">${escapeHtml(item.title)}</div>
        <div class="text-gray-600 text-xs mt-1">${escapeHtml(item.body || '')}</div>
        <div class="text-gray-400 text-xs mt-1">${escapeHtml(formatDateTime(item.created_at))}</div>
      </div>
    `).join('');
  } catch (err) {
    announcementBar.textContent = `公告加载失败：${err.message}`;
  }
}

loadAnnouncements();

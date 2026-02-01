const { apiFetch, requireAuth } = window.auth || {};

const currentUser = requireAuth ? requireAuth('teacher') : null;
if (!currentUser) {
  throw new Error('auth_required');
}

const currentUserEl = document.getElementById('currentUser');
if (currentUserEl) {
  currentUserEl.textContent = currentUser.name || currentUser.email;
}

const uploadForm = document.getElementById('uploadForm');
const uploadStatus = document.getElementById('uploadStatus');
const datasetTitle = document.getElementById('datasetTitle');
const datasetFile = document.getElementById('datasetFile');
const listStatus = document.getElementById('listStatus');
const fileTableBody = document.getElementById('fileTableBody');

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

async function loadFiles() {
  if (!apiFetch) return;
  listStatus.textContent = '加载中...';
  try {
    const res = await apiFetch('/assessments');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '加载失败');
    const files = data.files || [];
    if (!files.length) {
      listStatus.textContent = '暂无上传记录';
      fileTableBody.innerHTML = '';
      return;
    }
    listStatus.textContent = '';
    fileTableBody.innerHTML = files.map(file => `
      <tr>
        <td class="p-3 font-medium text-gray-800">${file.title || '-'}</td>
        <td class="p-3 text-gray-600">${file.original_name}</td>
        <td class="p-3 text-gray-500">${formatSize(file.file_size)}</td>
        <td class="p-3 text-gray-500">${formatDate(file.created_at)}</td>
        <td class="p-3 text-right space-x-2">
          <button class="text-indigo-600 hover:underline" onclick="downloadFile(${file.id}, '${file.original_name.replace(/'/g, '')}')">下载</button>
          <button class="text-red-500 hover:underline" onclick="deleteFile(${file.id})">删除</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    listStatus.textContent = `加载失败：${err.message}`;
  }
}

async function downloadFile(id, name) {
  try {
    const res = await apiFetch(`/assessments/${id}/download`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || '下载失败');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name || `assessment-${id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert(`下载失败：${err.message}`);
  }
}

async function deleteFile(id) {
  if (!confirm('确定要删除该数据集吗？')) return;
  try {
    const res = await apiFetch(`/assessments/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '删除失败');
    await loadFiles();
  } catch (err) {
    alert(`删除失败：${err.message}`);
  }
}

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!datasetFile.files || !datasetFile.files[0]) {
    alert('请选择 CSV 文件');
    return;
  }
  uploadStatus.textContent = '上传中...';
  const formData = new FormData();
  formData.append('title', datasetTitle.value.trim());
  formData.append('files', datasetFile.files[0]);
  try {
    const res = await apiFetch('/assessments', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '上传失败');
    uploadStatus.textContent = '上传成功';
    datasetTitle.value = '';
    datasetFile.value = '';
    await loadFiles();
    setTimeout(() => (uploadStatus.textContent = ''), 1200);
  } catch (err) {
    uploadStatus.textContent = `上传失败：${err.message}`;
  }
});

loadFiles();

window.downloadFile = downloadFile;
window.deleteFile = deleteFile;

<template>
  <PageShell active="" main-class="portal-shell portal-main assessment-main" class="assessment-page text-slate-900">
    <template #header>
      <section class="rounded-[36px] bg-white border border-slate-200/80 p-8 lg:p-12 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div class="space-y-2">
          <StatusBadge label="学情数据台" tone="teal" size="sm" />
          <h1 class="text-3xl font-black text-slate-950 lg:text-4xl">考评数据中心</h1>
          <p class="text-sm font-semibold text-slate-500 leading-relaxed max-w-xl">
            上传及更新 CSV 考试成绩集，为班级学情统计与个人学评提供数据基础。
          </p>
        </div>
        <RouterLink to="/teacher/review" class="btn-secondary text-xs font-black uppercase flex items-center gap-2 py-3">
          <i class="fas fa-arrow-left"></i> 返回教师工作台
        </RouterLink>
      </section>
    </template>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-8 space-y-8">
        <DataCard title="上传新数据集 (CSV)" padding="lg">
            <form @submit.prevent="handleUpload" class="space-y-6">
              <div class="grid md:grid-cols-2 gap-6">
                <FormField label="数据集名称" for-id="assessment-upload-title" :error="visibleUploadErrors.title">
                  <input 
                    id="assessment-upload-title"
                    v-model="uploadTitle" 
                    type="text" 
                    required 
                    placeholder="例如：2026-下学期-期末成绩" 
                    class="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-50 outline-none transition-colors font-semibold text-sm"
                    @blur="touchUpload('title')"
                  />
                </FormField>
                <FormField label="CSV 文件" for-id="assessment-upload-file" hint="支持单个成绩数据 CSV 上传。" :error="visibleUploadErrors.file">
                  <input 
                    id="assessment-upload-file"
                    type="file" 
                    accept=".csv" 
                    required 
                    @change="handleFileChange" 
                    class="w-full text-xs font-semibold text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 file:cursor-pointer transition-colors border border-dashed border-slate-200 rounded-2xl p-1.5"
                  />
                </FormField>
              </div>
              <p v-if="uploadDraftRestored" class="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-xs font-bold text-teal-700">
                已恢复上次未提交的数据集标题草稿，请重新选择 CSV 文件后提交。
              </p>
              <div class="flex items-center gap-4 pt-2">
                <button 
                  type="submit" 
                  :disabled="uploading" 
                  class="btn-primary px-6 py-3.5 text-xs font-black uppercase rounded-xl text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ uploading ? '正在上传...' : '开始上传' }}
                </button>
                <button
                  v-if="canRetryUpload"
                  type="button"
                  :disabled="uploading"
                  class="text-xs font-black text-teal-700 hover:text-teal-900 hover:underline disabled:opacity-50"
                  @click="handleUpload"
                >
                  重试上传
                </button>
                <span v-if="submitState.message" class="text-xs font-bold" :class="submitState.type === 'success' ? 'text-emerald-600' : 'text-rose-500'">
                  {{ submitState.message }}
                </span>
              </div>
            </form>
        </DataCard>

        <DataCard title="已上传数据集" padding="lg">
          <template #meta>
            <StatusBadge :label="`共 ${files.length} 个文件`" tone="slate" size="sm" />
          </template>
            <p
              v-if="datasetStatusMsg"
              class="rounded-xl border px-4 py-3 text-xs font-bold"
              :class="datasetStatusType === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-rose-100 bg-rose-50 text-rose-600'"
              :role="datasetStatusType === 'error' ? 'alert' : 'status'"
            >
              {{ datasetStatusMsg }}
            </p>

            <div v-if="loading" class="assessment-skeleton-list" aria-label="考评历史数据加载中">
              <article v-for="index in 4" :key="`assessment-skeleton-${index}`" class="assessment-skeleton-row content-skeleton-card">
                <div class="assessment-skeleton-row__main">
                  <div class="content-skeleton-line content-skeleton-line--md"></div>
                  <div class="content-skeleton-line content-skeleton-line--lg"></div>
                </div>
                <div class="assessment-skeleton-row__meta">
                  <div class="content-skeleton-line content-skeleton-line--sm"></div>
                  <div class="content-skeleton-line content-skeleton-line--xs"></div>
                </div>
                <div class="assessment-skeleton-row__actions">
                  <div class="content-skeleton-line content-skeleton-line--xs"></div>
                  <div class="content-skeleton-line content-skeleton-line--xs"></div>
                </div>
              </article>
            </div>

            <EmptyState
              v-else-if="!files.length"
              icon="far fa-folder-open"
              eyebrow="Upload Queue"
              title="暂无上传的考评数据集"
              description="先上传一份 CSV 数据集，再回到这里统一管理历史文件。"
            />

            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm text-left border-collapse">
                <thead>
                  <tr class="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                    <th class="pb-4 font-bold">数据集名称</th>
                    <th class="pb-4 font-bold">源文件名</th>
                    <th class="pb-4 font-bold">数据大小</th>
                    <th class="pb-4 font-bold">上传时间</th>
                    <th class="pb-4 font-bold text-right">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-semibold text-slate-700">
                  <tr v-for="file in files" :key="file.id" class="group hover:bg-slate-50/50 transition-colors">
                    <td class="py-4 pr-3 font-extrabold text-slate-900">{{ file.title || '-' }}</td>
                    <td class="py-4 pr-3 text-slate-500 text-xs truncate max-w-[120px]" :title="file.original_name">{{ file.original_name }}</td>
                    <td class="py-4 pr-3 text-slate-500 text-xs">{{ formatSize(file.file_size) }}</td>
                    <td class="py-4 pr-3 text-slate-400 text-xs">{{ formatDate(file.created_at) }}</td>
                    <td class="py-4 text-right space-x-3 text-xs shrink-0">
                      <button type="button" @click="downloadFile(file.id, file.original_name)" class="text-teal-700 hover:text-teal-900 font-black hover:underline">
                        下载
                      </button>
                      <button type="button" @click="requestDeleteFile(file)" class="text-rose-500 hover:text-rose-700 font-black hover:underline">
                        删除
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
        </DataCard>
      </div>

      <div class="lg:col-span-4 space-y-8">
        <DataCard tag="article" eyebrow="学情数据监控统计" padding="md">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-teal-50/40 border border-teal-100 p-4 rounded-2xl flex flex-col gap-1">
                <span class="text-[9px] font-black text-teal-700 uppercase">上传文件总数</span>
                <strong class="text-2xl font-black text-teal-950">{{ files.length }}</strong>
                <span class="text-[9px] text-slate-400 font-semibold mt-1">个独立数据集</span>
              </div>
              <div class="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col gap-1">
                <span class="text-[9px] font-black text-slate-600 uppercase">总体数据大小</span>
                <strong class="text-2xl font-black text-slate-950">{{ totalSizeLabel }}</strong>
                <span class="text-[9px] text-slate-400 font-semibold mt-1">云端存储容量</span>
              </div>
            </div>
        </DataCard>

        <DataCard tag="article" eyebrow="学术数据洞察预测" padding="md">
            <div class="space-y-1">
              <p class="text-[10px] text-slate-400 font-bold">模拟期末成绩正态分布（Bell Curve）</p>
            </div>
            
            <div class="bg-slate-950 border border-slate-900 rounded-2xl p-4 flex flex-col items-center">
              <svg viewBox="0 0 200 100" class="w-full h-auto">
                <!-- Grid Lines -->
                <line x1="10" y1="90" x2="190" y2="90" stroke="rgba(255,255,255,0.08)" stroke-width="1"></line>
                <line x1="10" y1="10" x2="10" y2="90" stroke="rgba(255,255,255,0.08)" stroke-width="1"></line>
                <line x1="100" y1="10" x2="100" y2="90" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2,2"></line>
                
                <!-- Distribution curve -->
                <path d="M 10 90 Q 55 90 75 70 T 100 20 T 125 70 T 190 90" fill="none" stroke="#0f766e" stroke-width="2"></path>
                
                <!-- Highlights dot -->
                <circle cx="100" cy="20" r="2.5" fill="#0f766e"></circle>
                
                <!-- Axis Labels -->
                <text x="10" y="98" fill="rgba(255,255,255,0.4)" font-size="6" font-family="monospace" text-anchor="middle">0</text>
                <text x="100" y="98" fill="rgba(255,255,255,0.4)" font-size="6" font-family="monospace" text-anchor="middle">60 (及格)</text>
                <text x="190" y="98" fill="rgba(255,255,255,0.4)" font-size="6" font-family="monospace" text-anchor="middle">100</text>

              </svg>
            </div>
            
            <div class="text-[10px] text-slate-500 leading-relaxed font-semibold bg-slate-50 p-3 rounded-xl border border-slate-100">
              <strong>学情诊断提示</strong>：期末分数集中于 75 - 85 分区间，说明教学目标达成情况良好。可为高分层学生补充更深入的科创探究任务。
            </div>
        </DataCard>
      </div>
    </div>

    <ConfirmAction ref="confirmAction" />
  </PageShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import ConfirmAction from '@/components/ConfirmAction.vue';
import DataCard from '@/components/DataCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import FormField from '@/components/FormField.vue';
import PageShell from '@/components/PageShell.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { apiFetch } from '@/api/client';
import { useFormDraft } from '@/composables/useFormDraft';
import { useSubmitState } from '@/composables/useSubmitState';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();

authStore.hydrate();

onMounted(() => {
  if (!['teacher', 'judge'].includes(authStore.user?.role)) {
    router.replace('/my');
    return;
  }
  loadFiles();
});

const files = ref([]);
const loading = ref(true);
const uploading = ref(false);
const uploadTitle = ref('');
const selectedFile = ref(null);
const uploadDraftRestored = ref(false);
const uploadSubmittedOnce = ref(false);
const datasetStatusMsg = ref('');
const datasetStatusType = ref('success');
const confirmAction = ref(null);
const uploadTouched = reactive({
  title: false,
  file: false
});
const uploadDraft = reactive({
  title: ''
});

const { restoreDraft: restoreUploadDraft, clearDraft: clearUploadDraft } = useFormDraft('assessment:upload', uploadDraft, {
  shouldSave: value => Boolean(String(value.title || '').trim())
});

const totalSize = computed(() => {
  return files.value.reduce((sum, file) => sum + Number(file.file_size || 0), 0);
});

const totalSizeLabel = computed(() => {
  return formatSize(totalSize.value);
});

const uploadErrors = computed(() => {
  const errors = {};
  if (!String(uploadTitle.value || '').trim()) {
    errors.title = '请输入数据集名称，便于后续识别。';
  }
  if (!selectedFile.value) {
    errors.file = '请选择 CSV 文件。';
  } else if (!String(selectedFile.value.name || '').toLowerCase().endsWith('.csv')) {
    errors.file = '仅支持 .csv 文件。';
  }
  return errors;
});

const visibleUploadErrors = computed(() => {
  const errors = {};
  Object.entries(uploadErrors.value).forEach(([key, value]) => {
    if (uploadSubmittedOnce.value || uploadTouched[key]) errors[key] = value;
  });
  return errors;
});

const canUpload = computed(() => Object.keys(uploadErrors.value).length === 0);
const { submitState, canRetry: canRetryUpload, start, succeed, fail } = useSubmitState({
  getBusy: () => uploading.value,
  getCanSubmit: () => canUpload.value
});

watch(uploadTitle, (value) => {
  uploadDraft.title = value;
});

function touchUpload(field) {
  uploadTouched[field] = true;
}

function touchAllUpload() {
  Object.keys(uploadTouched).forEach((key) => {
    uploadTouched[key] = true;
  });
}

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
  const pad = num => String(num).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function loadFiles() {
  loading.value = true;
  datasetStatusMsg.value = '';
  try {
    const res = await apiFetch('/assessments');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '加载数据文件失败');
    files.value = data.files || [];
  } catch (err) {
    console.error(err);
    datasetStatusType.value = 'error';
    datasetStatusMsg.value = `加载数据失败：${err.message}`;
  } finally {
    loading.value = false;
  }
}

function handleFileChange(e) {
  const selected = e.target.files?.[0];
  touchUpload('file');
  if (selected) {
    selectedFile.value = selected;
    start();
  }
}

async function handleUpload() {
  uploadSubmittedOnce.value = true;
  touchAllUpload();
  if (!canUpload.value) {
    fail('请先修正上传表单中的提示。', { retry: false });
    return;
  }
  uploading.value = true;
  start();
  const formData = new FormData();
  formData.append('title', uploadTitle.value.trim());
  formData.append('files', selectedFile.value);
  try {
    const res = await apiFetch('/assessments', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '上传失败');
    succeed('上传成功！');
    clearUploadDraft();
    uploadTitle.value = '';
    selectedFile.value = null;
    await loadFiles();
    setTimeout(() => {
      start();
    }, 2000);
  } catch (err) {
    fail(`上传失败：${err.message}`);
  } finally {
    uploading.value = false;
  }
}

async function downloadFile(id, name) {
  try {
    const res = await apiFetch(`/assessments/${id}/download`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || '下载文件失败');
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
    datasetStatusType.value = 'success';
    datasetStatusMsg.value = '下载已开始，请在浏览器下载记录中查看文件。';
  } catch (err) {
    datasetStatusType.value = 'error';
    datasetStatusMsg.value = `下载失败：${err.message}`;
  }
}

async function requestDeleteFile(file) {
  const confirmed = await confirmAction.value?.open({
    eyebrow: '删除数据集',
    title: '确认删除该数据集？',
    message: `删除后，关联的学情分析数据将失效。文件：${file?.original_name || file?.title || '未命名文件'}`,
    confirmLabel: '删除',
    danger: true
  });
  if (!confirmed) return;
  try {
    const res = await apiFetch(`/assessments/${file.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '删除失败');
    await loadFiles();
    datasetStatusType.value = 'success';
    datasetStatusMsg.value = '数据集已删除。';
  } catch (err) {
    datasetStatusType.value = 'error';
    datasetStatusMsg.value = `删除失败：${err.message}`;
  }
}

uploadDraftRestored.value = restoreUploadDraft();
if (uploadDraftRestored.value) {
  uploadTitle.value = uploadDraft.title;
}
</script>

<style scoped>
.assessment-page {
  background: #f8fafc;
}

.assessment-skeleton-list {
  display: grid;
  gap: 14px;
}

.assessment-skeleton-row {
  grid-template-columns: minmax(0, 1.4fr) minmax(180px, 0.7fr) auto;
  align-items: center;
  gap: 18px;
}

.assessment-skeleton-row__main,
.assessment-skeleton-row__meta,
.assessment-skeleton-row__actions {
  display: grid;
  gap: 10px;
}

.assessment-skeleton-row__actions {
  justify-items: end;
}

@media (max-width: 720px) {
  .assessment-skeleton-row {
    grid-template-columns: 1fr;
  }

  .assessment-skeleton-row__actions {
    justify-items: start;
  }
}
</style>

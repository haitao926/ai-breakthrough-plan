<template>
  <div class="assessment-page min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
    <SiteNav active="teacher" />

    <main class="portal-shell portal-main flex-grow max-w-[1180px] mx-auto px-6 py-8 space-y-8">
      <!-- Hero Panel -->
      <section class="rounded-[36px] bg-white border border-slate-200/80 p-8 lg:p-12 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600 border border-indigo-100/50">
            <span class="h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
            Academic Insight Desk
          </div>
          <h1 class="text-3xl font-black text-slate-950 tracking-tight lg:text-4xl">考评数据中心</h1>
          <p class="text-sm font-semibold text-slate-500 leading-relaxed max-w-xl">
            上传及更新 CSV 考试成绩集，为班级学情统计与个人学评提供数据基础。
          </p>
        </div>
        <RouterLink to="/teacher" class="btn-secondary text-xs font-black uppercase tracking-wider flex items-center gap-2 py-3">
          <i class="fas fa-arrow-left"></i> 返回运营中心
        </RouterLink>
      </section>

      <!-- Grid layout for uploading and stats -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Left: Upload Form & Table (8 cols) -->
        <div class="lg:col-span-8 space-y-8">
          <!-- Upload Card -->
          <section class="glass-premium rounded-[32px] p-6 sm:p-8 border border-white/50 shadow-sm space-y-6">
            <h2 class="text-base font-black text-slate-900 tracking-tight uppercase tracking-wider flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              上传新数据集 (CSV)
            </h2>
            <form @submit.prevent="handleUpload" class="space-y-6">
              <div class="grid md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">数据集名称</label>
                  <input 
                    v-model="uploadTitle" 
                    type="text" 
                    required 
                    placeholder="例如：2026-下学期-期末成绩" 
                    class="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-200 font-semibold text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CSV 文件</label>
                  <input 
                    type="file" 
                    accept=".csv" 
                    required 
                    @change="handleFileChange" 
                    class="w-full text-xs font-semibold text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 file:cursor-pointer transition-all duration-200 border border-dashed border-slate-200 rounded-2xl p-1.5"
                  />
                </div>
              </div>
              <div class="flex items-center gap-4 pt-2">
                <button 
                  type="submit" 
                  :disabled="uploading" 
                  class="btn-primary px-6 py-3.5 text-xs font-black uppercase tracking-wider rounded-xl text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ uploading ? '正在上传...' : '开始上传' }}
                </button>
                <span v-if="uploadStatusMsg" class="text-xs font-bold" :class="uploadSuccess ? 'text-emerald-600' : 'text-rose-500'">
                  {{ uploadStatusMsg }}
                </span>
              </div>
            </form>
          </section>

          <!-- Datasets Table Card -->
          <section class="glass-premium rounded-[32px] p-6 sm:p-8 border border-white/50 shadow-sm space-y-6">
            <div class="flex justify-between items-center">
              <h2 class="text-base font-black text-slate-900 tracking-tight uppercase tracking-wider flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                已上传数据集
              </h2>
              <span class="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">
                TOTAL: {{ files.length }} FILES
              </span>
            </div>

            <div v-if="loading" class="text-center py-20 text-slate-400 space-y-2">
              <i class="fas fa-spinner fa-spin text-xl text-indigo-500"></i>
              <p class="text-xs font-black">正在读取考评历史数据...</p>
            </div>

            <div v-else-if="!files.length" class="text-center py-20 border border-dashed border-slate-200 rounded-[28px] bg-slate-50/50 text-slate-400 space-y-3">
              <i class="far fa-folder-open text-2xl text-slate-300"></i>
              <p class="text-xs font-bold">暂无上传的考评数据集</p>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm text-left border-collapse">
                <thead>
                  <tr class="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
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
                      <button @click="downloadFile(file.id, file.original_name)" class="text-indigo-600 hover:text-indigo-800 font-black hover:underline">
                        下载
                      </button>
                      <button @click="deleteFile(file.id)" class="text-rose-500 hover:text-rose-700 font-black hover:underline">
                        删除
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <!-- Right: Telemetry & Insight charts (4 cols) -->
        <div class="lg:col-span-4 space-y-8">
          <!-- Data telemetry stats -->
          <article class="glass-premium rounded-[32px] p-6 border border-white/50 shadow-sm space-y-6">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">学情数据监控统计</h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-indigo-50/30 border border-indigo-100/30 p-4 rounded-2xl flex flex-col gap-1">
                <span class="text-[9px] font-black text-indigo-600 uppercase tracking-widest">上传文件总数</span>
                <strong class="text-2xl font-black text-indigo-950">{{ files.length }}</strong>
                <span class="text-[9px] text-slate-400 font-semibold mt-1">个独立数据集</span>
              </div>
              <div class="bg-purple-50/30 border border-purple-100/30 p-4 rounded-2xl flex flex-col gap-1">
                <span class="text-[9px] font-black text-purple-600 uppercase tracking-widest">总体数据大小</span>
                <strong class="text-2xl font-black text-purple-950">{{ totalSizeLabel }}</strong>
                <span class="text-[9px] text-slate-400 font-semibold mt-1">云端存储容量</span>
              </div>
            </div>
          </article>

          <!-- SVG Distribution Chart -->
          <article class="glass-premium rounded-[32px] p-6 border border-white/50 shadow-sm space-y-4">
            <div class="space-y-1">
              <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">学术数据洞察预测</h3>
              <p class="text-[10px] text-slate-400 font-bold">模拟期末成绩正态分布（Bell Curve）</p>
            </div>
            
            <div class="bg-slate-950 border border-slate-900 rounded-2xl p-4 flex flex-col items-center">
              <svg viewBox="0 0 200 100" class="w-full h-auto">
                <!-- Grid Lines -->
                <line x1="10" y1="90" x2="190" y2="90" stroke="rgba(255,255,255,0.08)" stroke-width="1"></line>
                <line x1="10" y1="10" x2="10" y2="90" stroke="rgba(255,255,255,0.08)" stroke-width="1"></line>
                <line x1="100" y1="10" x2="100" y2="90" stroke="rgba(255,255,255,0.04)" stroke-dasharray="2,2"></line>
                
                <!-- Distribution curve -->
                <path d="M 10 90 Q 55 90 75 70 T 100 20 T 125 70 T 190 90" fill="url(#curveFill)" stroke="url(#curveStroke)" stroke-width="2" class="transition-all duration-1000"></path>
                
                <!-- Highlights dot -->
                <circle cx="100" cy="20" r="3" fill="#06b6d4" class="animate-ping"></circle>
                <circle cx="100" cy="20" r="2.5" fill="#06b6d4"></circle>
                
                <!-- Axis Labels -->
                <text x="10" y="98" fill="rgba(255,255,255,0.4)" font-size="6" font-family="monospace" text-anchor="middle">0</text>
                <text x="100" y="98" fill="rgba(255,255,255,0.4)" font-size="6" font-family="monospace" text-anchor="middle">60 (及格)</text>
                <text x="190" y="98" fill="rgba(255,255,255,0.4)" font-size="6" font-family="monospace" text-anchor="middle">100</text>

                <!-- Gradients -->
                <defs>
                  <linearGradient id="curveStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#4f46e5"></stop>
                    <stop offset="50%" stop-color="#06b6d4"></stop>
                    <stop offset="100%" stop-color="#8b5cf6"></stop>
                  </linearGradient>
                  <linearGradient id="curveFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="rgba(6, 182, 212, 0.15)"></stop>
                    <stop offset="100%" stop-color="rgba(6, 182, 212, 0)"></stop>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            <div class="text-[10px] text-slate-500 leading-relaxed font-semibold bg-slate-50 p-3 rounded-xl border border-slate-100">
              ℹ️ <strong>学情诊断提示</strong>：期末分数集中于 75 - 85 分区间，说明教学目标达成情况良好。可以通过提供额外的 AI 探究包，推动卓越层级学生进行更深入的科创攻关。
            </div>
          </article>
        </div>
      </div>
    </main>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import { apiFetch } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();

authStore.hydrate();

onMounted(() => {
  if (authStore.user?.role !== 'teacher') {
    router.replace(authStore.user?.role === 'judge' ? '/teacher' : '/workspace');
    return;
  }
  loadFiles();
});

const files = ref([]);
const loading = ref(true);
const uploading = ref(false);
const uploadTitle = ref('');
const selectedFile = ref(null);
const uploadStatusMsg = ref('');
const uploadSuccess = ref(false);

const totalSize = computed(() => {
  return files.value.reduce((sum, file) => sum + Number(file.file_size || 0), 0);
});

const totalSizeLabel = computed(() => {
  return formatSize(totalSize.value);
});

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
  try {
    const res = await apiFetch('/assessments');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '加载数据文件失败');
    files.value = data.files || [];
  } catch (err) {
    console.error(err);
    alert(`加载数据失败：${err.message}`);
  } finally {
    loading.value = false;
  }
}

function handleFileChange(e) {
  const selected = e.target.files?.[0];
  if (selected) {
    selectedFile.value = selected;
  }
}

async function handleUpload() {
  if (!selectedFile.value) {
    alert('请选择需要上传的 CSV 数据集文件');
    return;
  }
  uploading.value = true;
  uploadStatusMsg.value = '正在上传数据...';
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
    uploadSuccess.value = true;
    uploadStatusMsg.value = '上传成功！';
    uploadTitle.value = '';
    selectedFile.value = null;
    await loadFiles();
    setTimeout(() => {
      uploadStatusMsg.value = '';
    }, 2000);
  } catch (err) {
    uploadSuccess.value = false;
    uploadStatusMsg.value = `上传失败：${err.message}`;
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
  } catch (err) {
    alert(`下载失败：${err.message}`);
  }
}

async function deleteFile(id) {
  if (!confirm('确定要删除该数据集吗？删除后相关的学情分析数据将失效。')) return;
  try {
    const res = await apiFetch(`/assessments/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '删除失败');
    await loadFiles();
  } catch (err) {
    alert(`删除失败：${err.message}`);
  }
}
</script>

<style scoped>
.assessment-page {
  background: 
    linear-gradient(180deg, rgba(238, 242, 255, 0.9), rgba(248, 250, 252, 0.2) 320px),
    #f8fafc;
}
.portal-shell {
  width: min(1180px, calc(100vw - 32px));
  margin: 0 auto;
}
.portal-main {
  padding-top: 118px;
  padding-bottom: 88px;
}
</style>

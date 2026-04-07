<template>
  <div class="devlog-tool bg-slate-50 min-h-screen pb-20">
    <!-- Header Nav -->
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <i class="fas fa-pen-nib text-lg"></i>
          </div>
          <div>
            <h1 class="text-sm font-black text-slate-900 uppercase tracking-widest">项目实施日志</h1>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">DevLog & Engineering Journals</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <button @click="loadLogs" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
            <i class="fas fa-sync-alt text-xs" :class="{ 'fa-spin': loading }"></i>
          </button>
          <div class="h-8 w-px bg-slate-200 mx-2"></div>
          <div class="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button @click="mode = 'guided'" class="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all" :class="mode === 'guided' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'">结构化</button>
            <button @click="mode = 'free'" class="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all" :class="mode === 'free' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'">自由记录</button>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-12 animate-reveal">
      <!-- Left: Editor Pad -->
      <section class="lg:col-span-5 space-y-8">
        <div class="premium-card !bg-white !p-10 shadow-2xl shadow-indigo-500/5">
          <h2 class="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
             <span class="w-2 h-2 bg-indigo-600 rounded-full"></span> 撰写今日进展
          </h2>

          <div v-if="!projectId" class="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600">
            <i class="fas fa-exclamation-triangle mr-2"></i> 请先在工作台选择一个项目。
          </div>

          <div v-else class="space-y-6">
            <template v-if="mode === 'guided'">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. 本次核心进展</label>
                <textarea v-model="form.summary" rows="3" class="log-input" placeholder="今天攻克了什么技术难题？"></textarea>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. 你的关键贡献</label>
                <textarea v-model="form.contribution" rows="2" class="log-input" placeholder="在团队中完成了哪些具体模块？"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">代码提交 ID</label>
                  <input v-model="form.commit" class="log-input" placeholder="Git Commit Hash">
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">结果验证链接</label>
                  <input v-model="form.evidence" class="log-input" placeholder="Demo URL / Photo">
                </div>
              </div>
            </template>

            <template v-else>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">自由记录灵感与过程</label>
                <textarea v-model="form.free" rows="12" class="log-input font-medium" placeholder="记录任何想法、错误代码、调试过程或突发灵感..."></textarea>
              </div>
            </template>

            <div class="space-y-2 pt-4">
               <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">标签 (逗号分隔)</label>
               <input v-model="form.tags" class="log-input" placeholder="例如：代码重构, 传感器调试, 算法优化">
            </div>

            <div class="pt-8 border-t border-slate-50 flex items-center justify-between">
              <span v-if="error" class="text-[10px] font-bold text-rose-500 animate-pulse">{{ error }}</span>
              <button 
                class="ml-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                :disabled="posting"
                @click="submitLog"
              >
                {{ posting ? 'Publishing...' : '发布当前记录' }}
              </button>
            </div>
          </div>
        </div>

        <div class="p-8 bg-slate-100/50 rounded-[32px] border border-slate-200/50">
           <h4 class="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">学术规范小贴士</h4>
           <div class="space-y-3">
              <div class="flex gap-3 items-start text-[11px] text-slate-500 font-medium">
                 <i class="fas fa-check-circle text-emerald-500 mt-0.5"></i>
                 <span>保持真实性：失败的实验记录比成功的结论更具有分析价值。</span>
              </div>
              <div class="flex gap-3 items-start text-[11px] text-slate-500 font-medium">
                 <i class="fas fa-check-circle text-emerald-500 mt-0.5"></i>
                 <span>关联性：尽量引用你的代码仓库 commit ID 建立追溯链。</span>
              </div>
           </div>
        </div>
      </section>

      <!-- Right: Timeline Flow -->
      <section class="lg:col-span-7">
        <div class="flex items-center justify-between mb-10">
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">工程时间轴 (Dev-Flow)</h3>
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{{ logs.length }} Entries</div>
        </div>

        <div v-if="loading" class="space-y-6">
           <div v-for="i in 3" :key="i" class="w-full h-32 bg-slate-100 animate-pulse rounded-3xl"></div>
        </div>

        <div v-else-if="!logs.length" class="flex flex-col items-center justify-center py-40 bg-white rounded-[48px] border border-slate-100 border-dashed">
           <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
              <i class="fas fa-pen-fancy text-2xl"></i>
           </div>
           <p class="text-xs font-black text-slate-400 uppercase tracking-widest">暂无记录，写下你的第一块砖石吧</p>
        </div>

        <div v-else class="space-y-6">
          <div v-for="log in logs" :key="log.id" class="premium-card !bg-white group cursor-default">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <img v-if="log.avatar_url" :src="log.avatar_url" class="w-full h-full rounded-xl object-cover">
                  <i v-else class="fas fa-user-astronaut"></i>
                </div>
                <div>
                  <div class="text-xs font-black text-slate-900">{{ log.author_name || 'Anonymous Creator' }}</div>
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{{ formatDateTime(log.created_at) }}</div>
                </div>
              </div>
              <div class="flex gap-2">
                <span v-for="tag in splitTags(log.tags)" :key="tag" class="px-3 py-1 bg-slate-50 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-[0.05em]">#{{ tag }}</span>
              </div>
            </div>
            
            <div class="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap select-all">{{ log.content }}</div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { apiFetch } from '@/api/client';

const route = useRoute();
const projectId = computed(() => route.query.project);

const logs = ref([]);
const loading = ref(false);
const posting = ref(false);
const error = ref('');
const mode = ref('guided');

const form = reactive({
  summary: '',
  contribution: '',
  commit: '',
  evidence: '',
  free: '',
  tags: ''
});

function resetForm() {
  form.summary = '';
  form.contribution = '';
  form.commit = '';
  form.evidence = '';
  form.free = '';
  form.tags = '';
}

function buildContent() {
  if (mode.value === 'free') return String(form.free || '').trim();
  const lines = [];
  if (form.summary) lines.push(`【核心进展】${form.summary}`);
  if (form.contribution) lines.push(`【关键贡献】${form.contribution}`);
  if (form.commit) lines.push(`【代码追踪】${form.commit}`);
  if (form.evidence) lines.push(`【验证链接】${form.evidence}`);
  return lines.join('\n');
}

async function loadLogs() {
  if (!projectId.value) return;
  loading.value = true;
  try {
    const res = await apiFetch(`/projects/${projectId.value}/logs`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sync journals');
    logs.value = Array.isArray(data.logs) ? data.logs : [];
  } catch (err) { console.error(err); }
  finally { loading.value = false; }
}

async function submitLog() {
  error.value = '';
  if (!projectId.value) { error.value = 'Missing project context.'; return; }
  if (mode.value === 'guided' && !String(form.summary || '').trim()) {
    error.value = 'Please describe your core progress.'; return;
  }
  const content = buildContent();
  if (!content) { error.value = 'Record is empty.'; return; }
  
  posting.value = true;
  try {
    const res = await apiFetch(`/projects/${projectId.value}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, tags: form.tags || '' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Cloud sync error');
    resetForm();
    await loadLogs();
  } catch (err) { error.value = err.message; }
  finally { posting.value = false; }
}

function splitTags(tags) {
  return String(tags || '').split(/[，,]/).map(t => t.trim()).filter(Boolean);
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const pad = n => String(n).padStart(2, '0');
  return `${date.getMonth() + 1}/${date.getDate()} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

onMounted(loadLogs);
watch(() => projectId.value, loadLogs);
</script>

<style scoped>
.devlog-tool { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
.premium-card { @apply rounded-[40px] border border-slate-200/60 p-8 shadow-sm; }
.log-input {
  @apply w-full p-6 bg-slate-50 border-none rounded-2xl outline-none text-sm font-black transition-all placeholder:text-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/5;
}
.animate-reveal { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes reveal { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>

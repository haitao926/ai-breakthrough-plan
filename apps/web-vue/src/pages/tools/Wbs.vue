<template>
  <div class="wbs-tool bg-slate-50 min-h-screen pb-20">
    <!-- Header Nav -->
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <i class="fas fa-sitemap text-lg"></i>
          </div>
          <div>
            <h1 class="text-sm font-black text-slate-900 uppercase tracking-widest">任务拆解与规划</h1>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">WBS & Milestone Planning</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <span class="text-[10px] font-black uppercase tracking-widest transition-all duration-500" :class="saved ? 'text-emerald-500' : 'text-slate-300'">
            <i v-if="saved" class="fas fa-satellite-dish mr-1 animate-pulse"></i> {{ saved ? 'Cloud Synced' : 'Auto-saving...' }}
          </span>
          <div class="h-8 w-px bg-slate-200 mx-2"></div>
          <button @click="generateTasks(true)" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95">
             <i class="fas fa-magic mr-2"></i> AI 智能生成任务
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-6 py-12 space-y-12 animate-reveal">
      <!-- Project Context & Brief -->
      <section class="premium-card !bg-white grid lg:grid-cols-3 gap-12 items-start shadow-2xl shadow-indigo-500/5">
        <div class="lg:col-span-2 space-y-8">
          <div class="flex items-center gap-3">
             <div class="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
             <h2 class="text-xs font-black text-slate-900 uppercase tracking-widest">项目构思与目标</h2>
          </div>
          <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">一句话构思</label>
              <input v-model.trim="brief.idea" class="wbs-input" placeholder="例如：开发一个基于人脸识别的自动签到系统">
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">目标用户/场景</label>
              <input v-model.trim="brief.target" class="wbs-input" placeholder="例如：经常需要点名的实验室场景">
            </div>
          </div>
        </div>

        <div class="space-y-8">
          <div class="flex items-center gap-3">
             <div class="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
             <h2 class="text-xs font-black text-slate-900 uppercase tracking-widest">可行性自检</h2>
          </div>
          <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
             <label v-for="(val, key) in feasibility" :key="key" class="flex items-center gap-3 cursor-pointer group">
                <div class="w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all"
                  :class="feasibility[key] ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white group-hover:border-indigo-400'">
                  <i v-if="feasibility[key]" class="fas fa-check text-[10px]"></i>
                  <input type="checkbox" v-model="feasibility[key]" class="hidden">
                </div>
                <span class="text-[11px] font-black uppercase tracking-widest transition-colors" :class="feasibility[key] ? 'text-indigo-600' : 'text-slate-400'">
                  {{ key === 'resource' ? '资源到位' : key === 'time' ? '时间充裕' : '难度匹配' }}
                </span>
             </label>
          </div>
        </div>
      </section>

      <!-- Kanban Columns -->
      <div class="grid lg:grid-cols-3 gap-8">
        <div v-for="phase in phases" :key="phase.key" class="space-y-6">
          <div class="flex items-center justify-between px-2">
             <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-xs font-black text-slate-900 border border-slate-100">
                   {{ phase.key === 'm1' ? '01' : phase.key === 'm2' ? '02' : '03' }}
                </span>
                <div>
                   <h3 class="text-[10px] font-black text-slate-900 uppercase tracking-widest">{{ phase.label }}</h3>
                   <p class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{{ phaseCounts[phase.key] }} 条任务记录</p>
                </div>
             </div>
             <button @click="focusDraft(phase.key)" class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                <i class="fas fa-plus text-xs"></i>
             </button>
          </div>

          <div class="space-y-4">
            <!-- Draft Pad -->
            <div class="p-6 bg-white border border-slate-200 border-dashed rounded-[32px] group hover:border-indigo-400 transition-all">
              <input v-model.trim="drafts[phase.key].title" class="w-full text-xs font-black bg-transparent outline-none border-none placeholder:text-slate-200" :placeholder="phase.placeholder" @keyup.enter="submitDraft(phase.key)">
              <div class="flex items-center justify-between mt-4">
                 <input v-model.trim="drafts[phase.key].output" class="text-[10px] font-bold bg-transparent outline-none border-none placeholder:text-slate-200 text-slate-400 italic" placeholder="产出成果 (Deliverable)">
                 <button @click="submitDraft(phase.key)" :disabled="!drafts[phase.key].title" class="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center disabled:opacity-20">
                    <i class="fas fa-arrow-right text-[10px]"></i>
                 </button>
              </div>
            </div>

            <!-- Task Card Flow -->
            <div v-for="task in phaseTasks(phase.key)" :key="task.id" class="premium-card !bg-white group">
              <div class="flex items-start justify-between gap-4 mb-4">
                 <input v-model.trim="task.title" class="flex-1 text-xs font-black text-slate-900 bg-transparent outline-none border-none focus:text-indigo-600 transition-colors" @blur="persistTask(task)">
                 <button @click="removeTask(task)" class="w-6 h-6 rounded-lg text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all">
                    <i class="fas fa-times text-[10px]"></i>
                 </button>
              </div>
              
              <div class="space-y-3 pt-4 border-t border-slate-50">
                <div class="flex items-center justify-between">
                   <div class="flex items-center gap-2">
                      <i class="fas fa-bullseye text-[9px] text-indigo-400"></i>
                      <input v-model.trim="task.output" class="text-[10px] font-bold text-slate-400 bg-transparent outline-none border-none italic" placeholder="未定义产出" @blur="persistTask(task)">
                   </div>
                </div>
                <div class="flex items-center justify-between">
                   <div class="text-[9px] font-black uppercase tracking-widest text-slate-300">
                      {{ resolveAction(task).hint }}
                   </div>
                   <button @click="goNext(task)" class="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">
                      {{ resolveAction(task).label }}
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiFetch } from '@/api/client';
import { saveToolData } from '@/api/toolData';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.query.project);
const dataKey = computed(() => projectId.value ? `ai_course_wbs_${projectId.value}` : 'ai_course_wbs');
const briefKey = computed(() => projectId.value ? `ai_course_wbs_brief_${projectId.value}` : 'ai_course_wbs_brief');

const tasks = ref([]);
const saved = ref(true);
const useLocal = ref(false);
const drafts = reactive({ m1: { title: '', output: '' }, m2: { title: '', output: '' }, m3: { title: '', output: '' } });
const brief = reactive({ idea: '', target: '', type: 'product' });
const feasibility = reactive({ resource: false, time: false, scope: false });
let ready = false;

const phases = [
  { key: 'm1', label: 'PHASE 01: INCEPTION', placeholder: '添加调研或立项任务...' },
  { key: 'm2', label: 'PHASE 02: EXECUTION', placeholder: '添加设计或开发任务...' },
  { key: 'm3', label: 'PHASE 03: CONCLUSION', placeholder: '添加总结或提交任务...' }
];

const phaseCounts = computed(() => ({
  m1: tasks.value.filter(item => item.phase === 'm1').length,
  m2: tasks.value.filter(item => item.phase === 'm2').length,
  m3: tasks.value.filter(item => item.phase === 'm3').length
}));

const ACTIONS = {
  charter: { label: '去立项', hint: '完善愿景' },
  pre_research: { label: '去调研', hint: '收集证据' },
  literature: { label: '去阅读', hint: '学术深度' },
  innovation: { label: '去创新', hint: '核心价值' },
  architect: { label: '去架构', hint: '技术大图' },
  kanban: { label: '去看板', hint: '敏捷实施' },
  devlog: { label: '去日志', hint: '记录历程' }
};

const STAGE_LABELS = { proposal: '开题审批', milestone_1: 'M1验收', midterm: '中期审查', milestone_2: 'M2验收', final: '结题评审' };

function normalizeTask(task) {
  return {
    id: task?.id ? String(task.id) : `local-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title: String(task?.title || ''),
    phase: task?.phase || 'm1',
    output: String(task?.output || ''),
    action: task?.action || '',
    hint: task?.hint || ''
  };
}

// Data Syncing
async function loadData() {
  if (!projectId.value) { useLocal.value = true; loadLocal(); ready = true; return; }
  try {
    const res = await apiFetch(`/projects/${projectId.value}/milestones`);
    const data = await res.json();
    if (!res.ok) throw new Error('Load failed');
    tasks.value = (data.milestones || []).map(item => {
      let deliverables = {};
      try { deliverables = JSON.parse(item.deliverables || '{}'); } catch(e){}
      return normalizeTask({ id: item.id, title: item.title, phase: item.description || 'm1', output: deliverables.output, action: deliverables.action, hint: deliverables.hint });
    });
    useLocal.value = false;
  } catch (e) { useLocal.value = true; loadLocal(); }
  finally { ready = true; }
}

function loadLocal() {
  const savedData = JSON.parse(localStorage.getItem(dataKey.value) || '{}');
  tasks.value = (savedData.tasks || []).map(t => normalizeTask(t));
}

function loadBrief() {
  try {
    const saved = JSON.parse(localStorage.getItem(briefKey.value) || '{}');
    brief.idea = saved.idea || '';
    brief.target = saved.target || '';
    brief.type = saved.type || 'product';
    if(saved.feasibility) Object.assign(feasibility, saved.feasibility);
  } catch(e){}
}

function syncLocal() {
  if (!ready) return;
  localStorage.setItem(dataKey.value, JSON.stringify({ tasks: tasks.value }));
  localStorage.setItem(briefKey.value, JSON.stringify({ ...brief, feasibility }));
  if (projectId.value) {
    saveToolData(projectId.value, 'wbs', dataKey.value, {
      tasks: tasks.value,
      brief: { ...brief, feasibility },
      updatedAt: new Date().toISOString()
    });
  }
  saved.value = false;
  setTimeout(() => { saved.value = true; }, 1000);
}

// Task Actions
async function createTask(title, phase, output = '', meta = {}) {
  const cleanTitle = title.trim();
  if (!cleanTitle) return;
  if (tasks.value.some(t => t.title === cleanTitle && t.phase === phase)) return;

  const newTask = normalizeTask({ title: cleanTitle, phase, output, ...meta });
  
  if (!useLocal.value && projectId.value) {
    try {
      const res = await apiFetch(`/projects/${projectId.value}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: cleanTitle, phase, output, deliverables: JSON.stringify({ output, ...meta }) })
      });
      const data = await res.json();
      newTask.id = data.id;
    } catch(e) { console.error('Cloud creation failed'); }
  }
  
  tasks.value.push(newTask);
  syncLocal();
}

async function persistTask(task) {
  syncLocal();
  if (!useLocal.value && projectId.value && !String(task.id).startsWith('local-')) {
    try {
      await apiFetch(`/milestones/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task.title, phase: task.phase, output: task.output, deliverables: JSON.stringify({ output: task.output, action: task.action, hint: task.hint }) })
      });
    } catch(e){}
  }
}

async function removeTask(task) {
  tasks.value = tasks.value.filter(t => t.id !== task.id);
  syncLocal();
  if (!useLocal.value && projectId.value && !String(task.id).startsWith('local-')) {
    try { await apiFetch(`/milestones/${task.id}`, { method: 'DELETE' }); } catch(e){}
  }
}

function submitDraft(phase) {
  if (!drafts[phase].title) return;
  createTask(drafts[phase].title, phase, drafts[phase].output);
  drafts[phase].title = '';
  drafts[phase].output = '';
}

// Logic & Intelligence
function resolveAction(task) {
  const infer = (title) => {
    if (/调研|访谈/.test(title)) return 'pre_research';
    if (/文献|阅读/.test(title)) return 'literature';
    if (/开题/.test(title)) return 'submission:proposal';
    if (/架构|图/.test(title)) return 'architect';
    if (/开发|实现/.test(title)) return 'devlog';
    if (/结题|报告/.test(title)) return 'submission:final';
    return 'kanban';
  };
  const key = task.action || infer(task.title);
  if (key.startsWith('submission:')) {
    const stage = key.split(':')[1];
    return { type: 'stage', key: stage, label: STAGE_LABELS[stage] || '去提交', hint: '阶段评审节点' };
  }
  const cfg = ACTIONS[key] || ACTIONS.kanban;
  return { type: 'tool', key, label: cfg.label, hint: cfg.hint };
}

function goNext(task) {
  const action = resolveAction(task);
  if (!projectId.value) return;
  if (action.type === 'stage') {
    router.push({ path: '/workspace', query: { project: projectId.value, stage: action.key } });
  } else {
    router.push({ path: `/tools/${action.key}`, query: { project: projectId.value } });
  }
}

async function generateTasks(replace) {
  if (replace && tasks.value.length > 0) {
    if (!confirm('确定覆盖当前任务清单吗？')) return;
    tasks.value = [];
  }
  
  const suggestions = [
    { title: '确立立项核心愿景', phase: 'm1', action: 'charter', output: '初步愿景说明' },
    { title: '针对目标群体的痛点调研', phase: 'm1', action: 'pre_research', output: '调研分析报告' },
    { title: '行业同类案例/技术调研', phase: 'm1', action: 'literature', output: '调研笔记' },
    { title: '系统架构与技术路线设计', phase: 'm2', action: 'architect', output: '架构图' },
    { title: '核心原型/最小化可行产品开发', phase: 'm2', action: 'devlog', output: 'MVP 原型' },
    { title: '用户测试与反馈收集', phase: 'm2', action: 'devlog', output: '测试记录' },
    { title: '撰写结题项目报告', phase: 'm3', action: 'submission:final', output: '项目终稿' }
  ];

  for (const s of suggestions) await createTask(s.title, s.phase, s.output, { action: s.action });
}

function focusDraft(p) { /* Focus logic */ }

watch([brief, feasibility], syncLocal, { deep: true });

onMounted(() => { loadData(); loadBrief(); });
</script>

<style scoped>
.wbs-tool { font-family: inherit; }
.premium-card { @apply rounded-[40px] border border-slate-200/60 p-8 shadow-sm; }
.wbs-input {
  @apply w-full p-4 bg-slate-50 border-none rounded-2xl outline-none text-[11px] font-black transition-all placeholder:text-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/5;
}
.animate-reveal { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes reveal { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>

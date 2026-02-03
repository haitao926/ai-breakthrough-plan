<template>
  <div class="tool-root">
    <nav class="tool-nav">
      <div class="nav-left">
        <RouterLink to="/tools" class="nav-back"><i class="fas fa-arrow-left"></i></RouterLink>
        <h1 class="nav-title">
          <i class="fas fa-sitemap text-indigo-600 mr-2"></i> WBS 任务拆解
        </h1>
      </div>
      <div class="nav-right">
        <span class="save-status" :class="saved ? 'text-emerald-600' : 'text-slate-400'">
          <i v-if="saved" class="fas fa-check mr-1"></i> {{ saveStatus }}
        </span>
      </div>
    </nav>

    <main class="tool-main">
      <!-- 1. Brief & Generate -->
      <section class="brief-section card-base">
        <div class="brief-header">
          <div class="brief-title">
            <h2>项目构思</h2>
            <p>描述你的想法，AI 帮你拆解任务。</p>
          </div>
          <div class="brief-actions">
            <button class="btn-ghost small" @click="showFeasibility = !showFeasibility">
              <i class="fas fa-clipboard-check mr-1"></i> 可行性自检
            </button>
            <button class="btn-primary" @click="generateTasks(true)">
              <i class="fas fa-magic mr-2"></i> 自动生成任务
            </button>
          </div>
        </div>

        <div class="brief-form">
          <div class="form-group">
            <label>一句话描述</label>
            <input v-model.trim="brief.idea" placeholder="例如：我想做一个智能浇花装置..." />
          </div>
          <div class="form-group">
            <label>解决对象</label>
            <input v-model.trim="brief.target" placeholder="例如：经常出差的上班族" />
          </div>
          <div class="form-group">
            <label>项目类型</label>
            <select v-model="brief.type">
              <option value="product">工程产品</option>
              <option value="research">课题研究</option>
              <option value="impact">社会公益</option>
            </select>
          </div>
        </div>

        <div v-if="showFeasibility" class="feasibility-panel">
          <label><input type="checkbox" v-model="feasibility.resource"> 能获取所需资源</label>
          <label><input type="checkbox" v-model="feasibility.time"> 每周保证 2 小时</label>
          <label><input type="checkbox" v-model="feasibility.scope"> 难度适中可完成</label>
        </div>
      </section>

      <!-- 2. Task Lists by Phase -->
      <div class="phases-grid">
        <div v-for="phase in phases" :key="phase.key" class="phase-col">
          <div class="phase-header">
            <div class="phase-meta">
              <span class="phase-badge" :class="phase.badgeClass">{{ phase.label }}</span>
              <span class="phase-count">{{ phaseCounts[phase.key] }}</span>
            </div>
            <button class="add-btn" @click="focusDraft(phase.key)">
              <i class="fas fa-plus"></i>
            </button>
          </div>

          <div class="task-list">
            <!-- Draft Input -->
            <div class="task-card draft">
              <input 
                v-model.trim="drafts[phase.key].title" 
                :placeholder="phase.placeholder"
                @keyup.enter="submitDraft(phase.key)"
              />
              <button @click="submitDraft(phase.key)" :disabled="!drafts[phase.key].title">
                <i class="fas fa-arrow-right"></i>
              </button>
            </div>

            <!-- Tasks -->
            <div v-for="task in phaseTasks(phase.key)" :key="task.id || task.title" class="task-card">
              <div class="task-body">
                <input v-model.trim="task.title" class="task-input" @blur="persistTask(task)" />
                <div class="task-actions">
                  <button class="action-link" @click="goNext(task)">
                    {{ resolveAction(task).label }} <i class="fas fa-chevron-right ml-1"></i>
                  </button>
                  <button class="delete-btn" @click="removeTask(task)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <div v-if="!phaseTasks(phase.key).length" class="empty-state">
              暂无任务
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiFetch } from '@/api/client';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.query.project);
const dataKey = computed(() => projectId.value ? `ai_course_wbs_${projectId.value}` : 'ai_course_wbs');
const briefKey = computed(() => projectId.value ? `ai_course_wbs_brief_${projectId.value}` : 'ai_course_wbs_brief');

const tasks = ref([]);
const saveStatus = ref('已同步');
const saved = ref(true);
const useLocal = ref(false);
const showFeasibility = ref(false);
const drafts = reactive({
  m1: { title: '', output: '' },
  m2: { title: '', output: '' },
  m3: { title: '', output: '' }
});

const brief = reactive({
  idea: '',
  target: '',
  type: 'product',
  resources: '',
  timeline: ''
});
const feasibility = reactive({ resource: false, time: false, scope: false });

const mode = ref('product');
let statusTimer = null;
let ready = false;

const MODE_LABELS = {
  product: '工程产品',
  research: '课题研究',
  impact: '社会公益'
};

const selectedType = computed(() => brief.type || mode.value || 'product');
const deliverableType = computed(() => (selectedType.value === 'research' ? 'research' : selectedType.value === 'impact' ? 'impact' : 'engineering'));
const feasibilityReady = computed(() => feasibility.resource && feasibility.time && feasibility.scope);

const phases = computed(() => [
  { key: 'm1', label: '阶段一：立项', placeholder: '添加调研或阅读任务...', badgeClass: 'badge-indigo' },
  { key: 'm2', label: '阶段二：实施', placeholder: '添加设计或开发任务...', badgeClass: 'badge-amber' },
  { key: 'm3', label: '阶段三：结题', placeholder: '添加总结或展示任务...', badgeClass: 'badge-emerald' }
]);

const phaseCounts = computed(() => ({
  m1: tasks.value.filter(item => item.phase === 'm1').length,
  m2: tasks.value.filter(item => item.phase === 'm2').length,
  m3: tasks.value.filter(item => item.phase === 'm3').length
}));

const ACTIONS = {
  charter: { label: '去立项', type: 'tool' },
  pre_research: { label: '去调研', type: 'tool' },
  literature: { label: '去阅读', type: 'tool' },
  innovation: { label: '去创新', type: 'tool' },
  architect: { label: '去架构', type: 'tool' },
  wbs: { label: 'WBS', type: 'tool' },
  kanban: { label: '看板', type: 'tool' },
  devlog: { label: '日志', type: 'tool' }
};

const STAGE_LABELS = {
  proposal: '提交开题',
  milestone_1: '提交里程碑1',
  midterm: '提交中期',
  milestone_2: '提交里程碑2',
  final: '提交结题'
};

function touchSaved() {
  saved.value = true;
  saveStatus.value = '已保存';
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    // saved.value = false; 
    // keep green
  }, 2000);
}

function normalizeTask(task) {
  return {
    id: task?.id ? String(task.id) : '',
    title: String(task?.title || ''),
    phase: task?.phase || 'm1',
    output: String(task?.output || ''),
    action: task?.action || '',
    hint: task?.hint || '',
    deliverables: task?.deliverables || {}
  };
}

function buildDeliverables(output, meta = {}) {
  const payload = {};
  const cleanOutput = String(output || '').trim();
  if (cleanOutput) payload.output = cleanOutput;
  if (meta.action) payload.action = meta.action;
  if (meta.hint) payload.hint = meta.hint;
  return payload;
}

function saveLocalData() {
  if (!ready) return;
  localStorage.setItem(dataKey.value, JSON.stringify({
    tasks: tasks.value.map(task => ({
      title: task.title,
      phase: task.phase,
      output: task.output,
      action: task.action,
      hint: task.hint
    }))
  }));
  touchSaved();
  notifyParent();
}

function syncLocalCache(silent = true) {
  if (!projectId.value) return;
  localStorage.setItem(dataKey.value, JSON.stringify({
    tasks: tasks.value.map(task => ({
      title: task.title,
      phase: task.phase,
      output: task.output,
      action: task.action,
      hint: task.hint
    }))
  }));
  if (!silent) touchSaved();
  if (!silent) notifyParent();
}

async function loadData() {
  if (!projectId.value) {
    useLocal.value = true;
    loadLocal();
    ready = true;
    return;
  }
  try {
    const res = await apiFetch(`/projects/${projectId.value}/milestones`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '加载失败');
    tasks.value = (data.milestones || []).map(item => {
      let deliverables = {};
      try { deliverables = JSON.parse(item.deliverables || '{}'); } catch(e){}
      return normalizeTask({
        id: item.id,
        title: item.title,
        phase: item.description || 'm1',
        output: deliverables.output || '',
        action: deliverables.action,
        hint: deliverables.hint,
        deliverables
      });
    });
    useLocal.value = false;
    syncLocalCache();
  } catch (e) {
    console.error(e);
    useLocal.value = true;
    loadLocal();
  } finally {
    ready = true;
  }
}

function loadLocal() {
  const savedData = JSON.parse(localStorage.getItem(dataKey.value) || '{}');
  const rawTasks = Array.isArray(savedData.tasks) ? savedData.tasks : [];
  tasks.value = rawTasks.map(task => normalizeTask(task));
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

function saveBrief() {
  localStorage.setItem(briefKey.value, JSON.stringify({
    idea: brief.idea,
    target: brief.target,
    type: brief.type,
    feasibility: { ...feasibility }
  }));
}

function hasTaskTitle(title) {
  const key = String(title || '').trim().toLowerCase();
  return tasks.value.some(task => String(task.title).trim().toLowerCase() === key);
}

async function createTask(title, phase, output = '', meta = {}) {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) return;
  if (hasTaskTitle(cleanTitle)) return;

  if (useLocal.value || !projectId.value) {
    tasks.value.push(normalizeTask({
      id: `local-${Date.now()}`,
      title: cleanTitle,
      phase,
      output,
      action: meta.action,
      hint: meta.hint
    }));
    saveLocalData();
    return;
  }

  try {
    const res = await apiFetch(`/projects/${projectId.value}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: cleanTitle,
        phase,
        output,
        deliverables: buildDeliverables(output, meta)
      })
    });
    const data = await res.json();
    tasks.value.push(normalizeTask({
      id: data.id,
      title: cleanTitle,
      phase,
      output,
      action: meta.action,
      hint: meta.hint
    }));
    syncLocalCache();
    touchSaved();
    notifyParent();
  } catch (err) {
    alert('创建失败');
  }
}

async function persistTask(task) {
  if (!task) return;
  if (useLocal.value || !projectId.value || !task.id) {
    saveLocalData();
    return;
  }
  try {
    await apiFetch(`/milestones/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: task.title,
        phase: task.phase,
        output: task.output,
        deliverables: buildDeliverables(task.output, { action: task.action, hint: task.hint })
      })
    });
    syncLocalCache();
    touchSaved();
    notifyParent();
  } catch (err) {}
}

async function removeTask(task) {
  if (!task) return;
  if (useLocal.value || !projectId.value || !task.id) {
    tasks.value = tasks.value.filter(item => item !== task);
    saveLocalData();
    return;
  }
  try {
    await apiFetch(`/milestones/${task.id}`, { method: 'DELETE' });
    tasks.value = tasks.value.filter(item => item.id !== task.id);
    syncLocalCache();
    touchSaved();
    notifyParent();
  } catch (err) {}
}

function phaseTasks(phaseKey) {
  return tasks.value.filter(task => task.phase === phaseKey);
}

function submitDraft(phase) {
  const title = drafts[phase].title.trim();
  if (!title) return;
  createTask(title, phase, drafts[phase].output);
  drafts[phase].title = '';
  drafts[phase].output = '';
}

function buildGuidedTasks() {
  const list = [];
  const add = (title, phase, action) => list.push({ title, phase, action });
  
  add('明确问题与目标', 'm1', 'charter');
  add('前期调研', 'm1', 'pre_research');
  add('文献阅读', 'm1', 'literature');
  
  if (deliverableType.value === 'research') {
    add('实验设计', 'm2', 'pre_research');
    add('数据收集', 'm2', 'devlog');
    add('结果分析', 'm3', 'devlog');
    add('研究报告', 'm3', 'submission:final');
  } else {
    add('架构/原型设计', 'm2', 'architect');
    add('核心功能开发', 'm2', 'devlog');
    add('测试与优化', 'm2', 'devlog');
    add('演示视频', 'm3', 'submission:milestone_2');
    add('结题展示', 'm3', 'submission:final');
  }
  return list;
}

async function generateTasks(replace) {
  if (!brief.idea && !confirm('未填写构思，确定生成通用任务？')) return;
  const suggestions = buildGuidedTasks();
  
  if (replace && tasks.value.length) {
    if (!confirm('确定覆盖现有任务吗？')) return;
    for (const task of [...tasks.value]) await removeTask(task);
  }

  for (const item of suggestions) {
    if (!hasTaskTitle(item.title)) {
      await createTask(item.title, item.phase, '', { action: item.action });
    }
  }
}

function inferActionFromTitle(title, phase) {
  const text = String(title || '');
  if (/调研/.test(text)) return 'pre_research';
  if (/架构|设计/.test(text)) return 'architect';
  if (/代码|开发/.test(text)) return 'devlog';
  if (/视频/.test(text)) return 'submission:milestone_2';
  return 'kanban';
}

function resolveAction(task) {
  const rawKey = task.action || inferActionFromTitle(task.title, task.phase);
  if (rawKey && rawKey.startsWith('submission:')) {
    const stage = rawKey.split(':')[1] || 'final';
    return { type: 'stage', key: stage, label: '去提交' };
  }
  const config = ACTIONS[rawKey] || ACTIONS.kanban;
  return { type: 'tool', key: rawKey, label: config.label };
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

function notifyParent() {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'wbs-updated', projectId: projectId.value }, window.location.origin);
    }
  } catch (e) {}
}

function focusDraft(phase) {
  // logic to focus input
}

watch(brief, saveBrief, { deep: true });
watch(feasibility, saveBrief, { deep: true });

onMounted(() => {
  loadData();
  loadBrief();
});

watch(() => projectId.value, () => {
  ready = false;
  loadData();
  loadBrief();
});
</script>

<style scoped>
.tool-root {
  min-height: 100vh;
  background: var(--bg-app);
  display: flex;
  flex-direction: column;
}

.tool-nav {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-main);
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 50;
}

.nav-left { display: flex; align-items: center; gap: 1rem; }
.nav-back { color: var(--text-secondary); transition: color 0.2s; }
.nav-back:hover { color: var(--text-main); }
.nav-title { font-size: 1rem; font-weight: 700; color: var(--text-main); display: flex; align-items: center; }
.save-status { font-size: 0.75rem; font-weight: 500; }

.tool-main {
  flex: 1;
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.brief-section {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.brief-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.brief-title h2 { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem; }
.brief-title p { color: var(--text-secondary); font-size: 0.875rem; }

.brief-actions { display: flex; gap: 0.75rem; }

.brief-form {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
}

.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-group label { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }
.form-group input, .form-group select {
  padding: 0.6rem;
  border: 1px solid var(--border-main);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: var(--bg-app);
}

.feasibility-panel {
  display: flex;
  gap: 1.5rem;
  padding: 0.75rem;
  background: var(--primary-50);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--primary-700);
}

.phases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.phase-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.phase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.phase-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
}
.badge-indigo { background: var(--primary-100); color: var(--primary-700); }
.badge-amber { background: #fef3c7; color: #b45309; }
.badge-emerald { background: #dcfce7; color: #047857; }

.phase-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-left: 0.5rem;
}

.add-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid var(--border-main);
  background: var(--bg-card);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}
.add-btn:hover { background: var(--primary-50); color: var(--primary-600); border-color: var(--primary-100); }

.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.task-card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 0.75rem;
  padding: 0.75rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  transition: all 0.2s;
}
.task-card:hover { border-color: var(--primary-100); box-shadow: 0 4px 6px -2px rgba(0,0,0,0.05); }

.task-card.draft {
  border-style: dashed;
  background: var(--bg-app);
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.task-card.draft input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 0.875rem;
  outline: none;
}
.task-card.draft button {
  color: var(--primary-600);
}

.task-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: var(--text-main);
  font-weight: 500;
  padding: 0;
  outline: none;
}

.task-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-subtle);
}

.action-link {
  font-size: 0.75rem;
  color: var(--primary-600);
  font-weight: 600;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.action-link:hover { text-decoration: underline; }

.delete-btn {
  color: var(--text-muted);
  font-size: 0.75rem;
  cursor: pointer;
}
.delete-btn:hover { color: #ef4444; }

.empty-state {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  padding: 1rem;
  border: 1px dashed var(--border-main);
  border-radius: 0.75rem;
}

.btn-primary.small { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
.btn-ghost.small { padding: 0.4rem 0.8rem; font-size: 0.8rem; }

@media (max-width: 768px) {
  .brief-form { grid-template-columns: 1fr; }
}
</style>
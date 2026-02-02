<template>
  <div class="min-h-screen flex flex-col bg-[#f8fafc] text-gray-800">
    <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <div class="flex items-center gap-3">
        <RouterLink to="/tools" class="text-gray-400 hover:text-gray-600 transition"><i class="fas fa-arrow-left"></i></RouterLink>
        <h1 class="font-bold text-gray-800 text-lg flex items-center">
          <i class="fas fa-sitemap text-indigo-600 mr-2"></i> WBS 拆解
        </h1>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs" :class="saved ? 'text-green-500' : 'text-gray-400'">{{ saveStatus }}</span>
      </div>
    </nav>

    <main class="flex-1 max-w-6xl mx-auto w-full p-8 space-y-6">
      <section class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">把项目拆成可执行的三阶段任务</h2>
        <p class="text-gray-500 text-sm">先立项、再实施、最后结题。拆得清楚，执行就更轻松。</p>
      </section>

      <section class="grid gap-4 md:grid-cols-3">
        <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div class="text-xs text-gray-400">项目类型</div>
          <div class="text-lg font-bold text-gray-900 mt-1">{{ modeLabel }}</div>
          <div class="text-xs text-gray-400 mt-2">来自立项书，可在立项书中修改</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div class="text-xs text-gray-400">任务总数</div>
          <div class="text-lg font-bold text-gray-900 mt-1">{{ totalCount }}</div>
          <div class="text-xs text-gray-400 mt-2">建议至少 5 条，并覆盖三阶段</div>
        </div>
        <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div class="text-xs text-gray-400">阶段覆盖</div>
          <div class="text-lg font-bold text-gray-900 mt-1">{{ coverageText }}</div>
          <div v-if="missingChecks.length" class="text-xs text-amber-600 mt-2">待补齐：{{ missingChecks.join('、') }}</div>
          <div v-else class="text-xs text-green-600 mt-2">覆盖良好，可继续完善细节。</div>
        </div>
      </section>

      <section class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-lg font-bold text-gray-900">WBS 质量检查</h3>
            <p class="text-xs text-gray-400">快速生成建议任务，再根据你的项目进行微调。</p>
          </div>
          <div class="flex gap-2">
            <button type="button" @click="fillSuggestions" class="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition">
              <i class="fas fa-wand-magic-sparkles mr-1"></i> 一键生成
            </button>
            <button type="button" @click="appendSuggestions" class="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">
              <i class="fas fa-layer-group mr-1"></i> 追加建议
            </button>
            <button type="button" @click="clearTasks" class="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">
              <i class="fas fa-trash-alt mr-1"></i> 清空
            </button>
          </div>
        </div>
        <div class="grid gap-3 md:grid-cols-4 mt-4 text-sm">
          <div class="bg-gray-50 rounded-xl p-3">
            <div class="text-xs text-gray-400">立项任务</div>
            <div class="text-lg font-semibold text-gray-800">{{ phaseCounts.m1 }}</div>
          </div>
          <div class="bg-gray-50 rounded-xl p-3">
            <div class="text-xs text-gray-400">实施任务</div>
            <div class="text-lg font-semibold text-gray-800">{{ phaseCounts.m2 }}</div>
          </div>
          <div class="bg-gray-50 rounded-xl p-3">
            <div class="text-xs text-gray-400">结题任务</div>
            <div class="text-lg font-semibold text-gray-800">{{ phaseCounts.m3 }}</div>
          </div>
          <div class="bg-gray-50 rounded-xl p-3">
            <div class="text-xs text-gray-400">建议任务量</div>
            <div class="text-lg font-semibold text-gray-800">5 - 10 条</div>
          </div>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-3">
        <div v-for="phase in phases" :key="phase.key" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs uppercase text-gray-400 font-semibold">阶段 {{ phase.index }}</div>
              <h3 class="text-xl font-bold text-gray-900 mt-1">{{ phase.label }}</h3>
              <p class="text-xs text-gray-500 mt-1">{{ phase.desc }}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="phase.badgeClass">{{ phaseCounts[phase.key] }} 条</span>
          </div>

          <div class="mt-4">
            <div class="text-xs text-gray-400 mb-2">快速添加</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="chip in phase.chips"
                :key="chip.title"
                class="px-2 py-1 text-xs rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition"
                @click="quickAdd(phase.key, chip)"
              >
                + {{ chip.title }}
              </button>
            </div>
          </div>

          <div class="mt-4 bg-gray-50 rounded-xl p-3">
            <div class="text-xs text-gray-400 mb-2">添加任务</div>
            <div class="space-y-2">
              <input
                v-model.trim="drafts[phase.key].title"
                class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                :placeholder="phase.placeholder"
                @keyup.enter="submitDraft(phase.key)"
              />
              <input
                v-model.trim="drafts[phase.key].output"
                class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="预期产出（可选）"
              />
              <p v-if="draftErrors[phase.key]" class="text-xs text-red-500">{{ draftErrors[phase.key] }}</p>
              <button class="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition" @click="submitDraft(phase.key)">
                <i class="fas fa-plus mr-1"></i> 添加到 {{ phase.label }}
              </button>
            </div>
          </div>

          <div class="mt-4 flex-1">
            <div v-if="!phaseTasks(phase.key).length" class="text-xs text-gray-400">暂无任务，先从上方添加。</div>
            <div v-else class="space-y-3">
              <div v-for="task in phaseTasks(phase.key)" :key="task.id || task.title" class="border border-gray-200 rounded-xl p-3 bg-white">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 space-y-2">
                    <input
                      v-model.trim="task.title"
                      class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="任务描述"
                      @blur="persistTask(task)"
                    />
                    <input
                      v-model.trim="task.output"
                      class="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="产出/证据（可选）"
                      @blur="persistTask(task)"
                    />
                  </div>
                  <button type="button" class="text-xs text-gray-400 hover:text-red-500" @click="removeTask(task)">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
                <div class="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>可在此调整阶段</span>
                  <select v-model="task.phase" class="px-2 py-1 rounded-lg border border-gray-200 text-xs text-gray-500" @change="persistTask(task)">
                    <option value="m1">立项</option>
                    <option value="m2">实施</option>
                    <option value="m3">结题</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { apiFetch } from '@/api/client';

const route = useRoute();
const projectId = computed(() => route.query.project);
const dataKey = computed(() => projectId.value ? `ai_course_wbs_${projectId.value}` : 'ai_course_wbs');

const tasks = ref([]);
const saveStatus = ref('自动保存中...');
const saved = ref(false);
const useLocal = ref(false);
const loading = ref(false);
const draftErrors = reactive({ m1: '', m2: '', m3: '' });
const drafts = reactive({
  m1: { title: '', output: '' },
  m2: { title: '', output: '' },
  m3: { title: '', output: '' }
});

const mode = ref('product');
let statusTimer = null;
let ready = false;

const MODE_LABELS = {
  product: '工程产品',
  research: '课题探究',
  impact: '社会公益'
};

const deliverableType = computed(() => (mode.value === 'research' ? 'research' : mode.value === 'impact' ? 'impact' : 'engineering'));
const modeLabel = computed(() => MODE_LABELS[mode.value] || '工程产品');

const phases = computed(() => {
  const m2Desc = deliverableType.value === 'research' ? '实验设计 / 执行' : deliverableType.value === 'impact' ? '行动方案 / 执行' : '方案设计 / 实现';
  const m3Desc = deliverableType.value === 'research'
    ? '结果分析 / 报告'
    : deliverableType.value === 'impact'
      ? '影响总结 / 传播'
      : '验证 / 展示';
  const m3Placeholder = deliverableType.value === 'research'
    ? '例如：结果分析与结论'
    : deliverableType.value === 'impact'
      ? '例如：行动反馈与影响总结'
      : '例如：演示视频录制';

  return [
    {
      key: 'm1',
      index: 1,
      label: '立项',
      desc: '问题 / 调研 / 创新',
      placeholder: '例如：明确问题与目标',
      badgeClass: 'bg-indigo-50 text-indigo-600'
    },
    {
      key: 'm2',
      index: 2,
      label: '实施',
      desc: m2Desc,
      placeholder: '例如：方案设计与原型',
      badgeClass: 'bg-amber-50 text-amber-600'
    },
    {
      key: 'm3',
      index: 3,
      label: '结题',
      desc: m3Desc,
      placeholder: m3Placeholder,
      badgeClass: 'bg-emerald-50 text-emerald-600'
    }
  ].map(phase => ({
    ...phase,
    chips: phaseChips(phase.key)
  }));
});

const totalCount = computed(() => tasks.value.length);
const phaseCounts = computed(() => ({
  m1: tasks.value.filter(item => item.phase === 'm1').length,
  m2: tasks.value.filter(item => item.phase === 'm2').length,
  m3: tasks.value.filter(item => item.phase === 'm3').length
}));

const coverageText = computed(() => `立项 ${phaseCounts.value.m1} · 实施 ${phaseCounts.value.m2} · 结题 ${phaseCounts.value.m3}`);

const missingChecks = computed(() => {
  const missing = [];
  if (totalCount.value < 5) missing.push(`任务不足（${totalCount.value}/5）`);
  if (!phaseCounts.value.m1) missing.push('立项阶段');
  if (!phaseCounts.value.m2) missing.push('实施阶段');
  if (!phaseCounts.value.m3) missing.push('结题阶段');
  return missing;
});

function touchSaved() {
  saved.value = true;
  saveStatus.value = '已保存';
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    saved.value = false;
    saveStatus.value = '自动保存中...';
  }, 1000);
}

function parseDeliverables(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw) || {};
  } catch (e) {
    return {};
  }
}

function normalizeTask(task) {
  return {
    id: task?.id ? String(task.id) : '',
    title: String(task?.title || ''),
    phase: task?.phase || 'm1',
    output: String(task?.output || ''),
    deliverables: task?.deliverables || {}
  };
}

function saveLocalData() {
  if (!ready) return;
  localStorage.setItem(dataKey.value, JSON.stringify({
    tasks: tasks.value.map(task => ({
      title: task.title,
      phase: task.phase,
      output: task.output
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
      output: task.output
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
  loading.value = true;
  try {
    const res = await apiFetch(`/projects/${projectId.value}/milestones`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '加载失败');
    tasks.value = (data.milestones || []).map(item => {
      const deliverables = parseDeliverables(item.deliverables);
      return normalizeTask({
        id: item.id,
        title: item.title,
        phase: item.description || 'm1',
        output: deliverables.output || '',
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
    loading.value = false;
  }
}

function loadLocal() {
  const savedData = JSON.parse(localStorage.getItem(dataKey.value) || '{}');
  const rawTasks = Array.isArray(savedData.tasks) ? savedData.tasks : [];
  tasks.value = rawTasks.map(task => normalizeTask(task));
}

function loadMode() {
  const pid = projectId.value || '';
  const charter = getLocalData(`ai_course_charter_${pid}`) || {};
  mode.value = charter.mode || 'product';
}

function normalizeTitle(title) {
  return String(title || '').trim().toLowerCase();
}

function hasTaskTitle(title) {
  const key = normalizeTitle(title);
  if (!key) return false;
  return tasks.value.some(task => normalizeTitle(task.title) === key);
}

async function createTask(title, phase, output = '') {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) return;
  if (hasTaskTitle(cleanTitle)) return;

  if (useLocal.value || !projectId.value) {
    tasks.value.push(normalizeTask({
      id: `local-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      title: cleanTitle,
      phase,
      output: String(output || '').trim()
    }));
    saveLocalData();
    return;
  }

  try {
    const res = await apiFetch(`/projects/${projectId.value}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: cleanTitle, phase, output })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '创建失败');
    tasks.value.push(normalizeTask({
      id: data.id,
      title: cleanTitle,
      phase,
      output: String(output || '').trim(),
      deliverables: { output: String(output || '').trim() }
    }));
    syncLocalCache();
    touchSaved();
    notifyParent();
  } catch (err) {
    window.alert(err.message || '创建失败');
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
        output: task.output
      })
    });
    syncLocalCache();
    touchSaved();
    notifyParent();
  } catch (err) {
    console.error(err);
  }
}

async function removeTask(task) {
  if (!task) return;
  if (useLocal.value || !projectId.value || !task.id) {
    tasks.value = tasks.value.filter(item => item !== task);
    saveLocalData();
    return;
  }
  try {
    const res = await apiFetch(`/milestones/${task.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '删除失败');
    }
    tasks.value = tasks.value.filter(item => item.id !== task.id);
    syncLocalCache();
    touchSaved();
    notifyParent();
  } catch (err) {
    window.alert(err.message || '删除失败');
  }
}

function phaseTasks(phaseKey) {
  return tasks.value.filter(task => task.phase === phaseKey);
}

function submitDraft(phase) {
  draftErrors[phase] = '';
  const title = drafts[phase].title.trim();
  if (!title) {
    draftErrors[phase] = '请输入任务描述';
    return;
  }
  createTask(title, phase, drafts[phase].output);
  drafts[phase].title = '';
  drafts[phase].output = '';
}

function quickAdd(phase, chip) {
  createTask(chip.title, phase, chip.output);
}

function getLocalData(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function buildSuggestionTasks() {
  const pid = projectId.value || '';
  const charter = getLocalData(`ai_course_charter_${pid}`) || {};
  const pre = getLocalData(`ai_course_pre_research_${pid}`) || {};
  const literature = getLocalData(`ai_course_literature_${pid}`) || {};
  const innovation = getLocalData(`ai_course_innovation_${pid}`) || {};

  const modeValue = charter.mode || mode.value || 'product';
  const deliverType = modeValue === 'research' ? 'research' : modeValue === 'impact' ? 'impact' : 'engineering';
  const list = [];
  const seen = new Set();
  const add = (title, phase, output = '') => {
    const clean = String(title || '').trim();
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    list.push({ title: clean, phase, output });
  };

  if (charter.projPain || charter.projValue || pre.question) add('明确问题与目标', 'm1', '问题与目标清单');
  if (literature.topic || (literature.papers || []).length) add('文献阅读与关键结论整理', 'm1', '阅读笔记');
  if (Array.isArray(pre.methods)) {
    if (pre.methods.includes('interview')) add('访谈与记录整理', 'm1', '访谈记录');
    if (pre.methods.includes('survey')) add('问卷设计与数据分析', 'm1', '问卷结果');
    if (pre.methods.includes('observation')) add('观察记录与结论提炼', 'm1', '观察记录');
    if (pre.methods.includes('data')) add('数据采集与分析', 'm1', '数据表');
  }
  if (innovation.summary) add('创新点对比与验证', 'm1', '创新点说明');

  if (charter.projSolution) add('技术路线与方案设计', 'm2', '技术路线图');
  add('原型/系统设计', 'm2', '流程图或原型');

  if (deliverType === 'research') {
    add('实验设计与执行', 'm2', '实验记录');
    add('数据分析与结果结论', 'm3', '结果分析');
    add('研究报告撰写', 'm3', '研究报告');
  } else if (deliverType === 'impact') {
    add('行动方案与资源准备', 'm2', '行动清单');
    add('活动执行与反馈收集', 'm3', '反馈记录');
    add('影响总结与传播', 'm3', '总结材料');
  } else {
    add('核心功能实现', 'm2', '阶段演示');
    add('测试与优化', 'm3', '测试记录');
    add('演示视频与代码归档', 'm3', '视频/仓库');
  }

  add('结题展示材料准备', 'm3', '汇报材料');
  return list;
}

async function fillSuggestions() {
  if (tasks.value.length && !window.confirm('已有任务，将覆盖为建议任务，继续吗？')) return;
  const suggestions = buildSuggestionTasks();
  if (useLocal.value || !projectId.value) {
    tasks.value = suggestions.map(task => normalizeTask(task));
    saveLocalData();
    return;
  }
  for (const task of [...tasks.value]) {
    await removeTask(task);
  }
  for (const task of suggestions) {
    await createTask(task.title, task.phase, task.output);
  }
  notifyParent();
}

async function appendSuggestions() {
  const suggestions = buildSuggestionTasks();
  for (const item of suggestions) {
    if (hasTaskTitle(item.title)) continue;
    await createTask(item.title, item.phase, item.output);
  }
  notifyParent();
}

async function clearTasks() {
  if (!tasks.value.length) return;
  if (!window.confirm('确定清空全部任务吗？')) return;
  if (useLocal.value || !projectId.value) {
    tasks.value = [];
    saveLocalData();
    return;
  }
  for (const task of [...tasks.value]) {
    await removeTask(task);
  }
  notifyParent();
}

function notifyParent() {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        { type: 'wbs-updated', projectId: projectId.value || '' },
        window.location.origin
      );
    }
  } catch (e) {
    // ignore
  }
}

function phaseChips(phaseKey) {
  const common = {
    m1: [
      { title: '明确问题与目标', output: '问题清单' },
      { title: '前期调研计划', output: '调研计划' },
      { title: '文献阅读与笔记', output: '阅读笔记' },
      { title: '创新点验证', output: '创新点说明' }
    ],
    m2: [
      { title: '方案设计', output: '方案草图' },
      { title: '架构/原型设计', output: '流程图或原型' },
      { title: '核心实现/实验执行', output: '实现记录' },
      { title: '风险与可行性', output: '风险清单' }
    ],
    m3: [
      { title: '测试与验证', output: '测试记录' },
      { title: '成果总结与展示', output: '展示材料' },
      { title: '项目报告/总结', output: '报告文档' }
    ]
  };

  if (phaseKey !== 'm3') return common[phaseKey] || [];
  if (deliverableType.value === 'research') {
    return [
      { title: '实验结果分析', output: '分析报告' },
      { title: '研究报告撰写', output: '报告终稿' },
      { title: '结题展示材料', output: 'PPT/海报' }
    ];
  }
  if (deliverableType.value === 'impact') {
    return [
      { title: '反馈整理与总结', output: '反馈材料' },
      { title: '影响评估', output: '评估报告' },
      { title: '结题展示材料', output: '展示材料' }
    ];
  }
  return [
    { title: '演示视频录制', output: '演示视频' },
    { title: '代码整理归档', output: '仓库链接' },
    { title: '结题展示材料', output: 'PPT/海报' }
  ];
}

watch(tasks, () => {
  if (!ready) return;
  if (useLocal.value || !projectId.value) {
    saveLocalData();
  } else {
    syncLocalCache(true);
  }
}, { deep: true });

onMounted(() => {
  loadData();
  loadMode();
  window.addEventListener('focus', loadMode);
});

watch(
  () => projectId.value,
  () => {
    ready = false;
    loadData();
    loadMode();
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('focus', loadMode);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
body { font-family: 'Inter', sans-serif; background: #f8fafc; }
</style>

<template>
  <div class="h-screen flex flex-col overflow-hidden bg-[#eef2f6]">
    <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shrink-0 z-50">
      <div class="flex items-center gap-3">
        <h1 class="font-bold text-gray-800 text-lg flex items-center">
          <i class="fas fa-tasks text-blue-600 mr-2"></i> 敏捷看板
        </h1>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          <i class="far fa-clock mr-1"></i> Sprint 1
        </div>
        <div class="flex items-center gap-2 text-xs bg-white border border-gray-200 rounded-full px-2 py-1">
          <span class="text-gray-400 px-2">阶段</span>
          <button
            v-for="item in phaseFilters"
            :key="item.value"
            class="px-2 py-0.5 rounded-full transition"
            :class="phaseFilter === item.value ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-700'"
            @click="setPhaseFilter(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
        <button @click="openAddModal" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition">
          <i class="fas fa-plus mr-1"></i> 新建任务
        </button>
      </div>
    </nav>

    <main class="flex-1 overflow-x-auto overflow-y-hidden p-6">
      <div class="flex h-full gap-6">
        <div
          v-for="col in columns"
          :key="col.key"
          class="column flex-1 max-w-sm flex flex-col rounded-xl shadow-sm"
          :class="col.wrapperClass"
          @dragover.prevent="onDragOver($event)"
          @dragleave="onDragLeave($event)"
          @drop="onDrop($event, col.key)"
        >
          <div class="p-3 flex justify-between items-center" :class="col.headerBorder">
            <span class="font-bold text-sm" :class="col.labelClass">
              <i :class="col.icon" class="mr-2"></i>{{ col.label }}
            </span>
            <span class="bg-white text-xs px-2 py-0.5 rounded-full border" :class="col.countClass">{{ countByStatus(col.key) }}</span>
          </div>
          <div class="flex-1 overflow-y-auto p-3 space-y-3">
            <div
              v-for="task in tasksByStatus(col.key)"
              :key="task.id"
              class="task-card bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md group"
              draggable="true"
              @dragstart="onDragStart(task.id)"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded" :class="phaseTone(task.phase)">{{ phaseLabel(task.phase) }}</span>
                <button class="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition" @click="requestRemove(task.id)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <p class="text-sm font-medium text-gray-800 leading-snug">{{ task.title }}</p>
              <div v-if="task.assignee || task.deadline" class="mt-2 text-xs text-gray-400 flex flex-wrap gap-3">
                <span v-if="task.assignee"><i class="fas fa-user mr-1"></i>{{ task.assignee }}</span>
                <span v-if="task.deadline"><i class="far fa-calendar mr-1"></i>{{ task.deadline }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showAddModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white w-full max-w-md rounded-xl p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-900 mb-4">新建任务</h3>
        <div class="space-y-3">
          <input
            v-model.trim="addForm.title"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="任务内容"
            @keyup.enter="submitAdd"
          />
          <input
            v-model.trim="addForm.assignee"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="责任人（可选）"
          />
          <input
            v-model="addForm.deadline"
            type="date"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select v-model="addForm.phase" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="m1">m1 立项</option>
            <option value="m2">m2 实施</option>
            <option value="m3">m3 结题</option>
          </select>
          <p v-if="addError" class="text-xs text-red-500">{{ addError }}</p>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800" @click="closeAddModal">取消</button>
          <button class="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700" @click="submitAdd">添加</button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white w-full max-w-sm rounded-xl p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-900 mb-2">删除任务</h3>
        <p class="text-sm text-gray-500">确定要删除此任务吗？</p>
        <div class="mt-6 flex justify-end gap-2">
          <button class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800" @click="cancelRemove">取消</button>
          <button class="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700" @click="confirmRemove">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { apiFetch } from '@/api/client';

const route = useRoute();
const projectId = computed(() => route.query.project);

const state = reactive({
  tasks: []
});

const useLocal = ref(false);
const draggingId = ref(null);
const phaseFilter = ref('all');
const showAddModal = ref(false);
const showDeleteModal = ref(false);
const deleteTargetId = ref(null);
const addError = ref('');
const addForm = reactive({ title: '', phase: 'm1', deadline: '', assignee: '' });
const columns = [
  {
    key: 'todo',
    label: '待办 (To Do)',
    icon: 'far fa-circle',
    wrapperClass: 'bg-gray-100 border border-gray-200/60',
    headerBorder: 'border-b border-gray-200/50',
    labelClass: 'text-gray-600',
    countClass: 'text-gray-500 border-gray-200'
  },
  {
    key: 'doing',
    label: '进行中 (Doing)',
    icon: 'fas fa-spinner fa-spin',
    wrapperClass: 'bg-blue-50/50 border border-blue-100',
    headerBorder: 'border-b border-blue-100',
    labelClass: 'text-blue-700',
    countClass: 'text-blue-600 border-blue-100'
  },
  {
    key: 'review',
    label: '待验收 (Review)',
    icon: 'fas fa-microscope',
    wrapperClass: 'bg-yellow-50/50 border border-yellow-100',
    headerBorder: 'border-b border-yellow-100',
    labelClass: 'text-yellow-700',
    countClass: 'text-yellow-600 border-yellow-100'
  },
  {
    key: 'done',
    label: '已完成 (Done)',
    icon: 'fas fa-check-circle',
    wrapperClass: 'bg-green-50/50 border border-green-100',
    headerBorder: 'border-b border-green-100',
    labelClass: 'text-green-700',
    countClass: 'text-green-600 border-green-100'
  }
];

const PHASE_LABELS = { m1: '立项', m2: '实施', m3: '结题' };
const PHASE_TONES = {
  m1: 'bg-indigo-100 text-indigo-600',
  m2: 'bg-amber-100 text-amber-600',
  m3: 'bg-emerald-100 text-emerald-600'
};

const dataKey = computed(() => {
  if (projectId.value) return `ai_course_kanban_${projectId.value}`;
  return 'ai_course_kanban';
});

function normalizeTitle(title) {
  return String(title || '').trim().toLowerCase();
}

function getWbsCache() {
  if (!projectId.value) return { tasks: [] };
  try {
    const raw = window.localStorage.getItem(`ai_course_wbs_${projectId.value}`) || '{}';
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.tasks) ? parsed : { tasks: [] };
  } catch (e) {
    return { tasks: [] };
  }
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

function syncWbsCacheFromMilestones(milestones) {
  if (!projectId.value) return;
  const cache = getWbsCache();
  const cacheMap = new Map(cache.tasks.map(item => [normalizeTitle(item.title), item.output || '']));
  const tasks = (milestones || []).map(item => {
    const deliverables = parseDeliverables(item.deliverables);
    return {
      title: item.title,
      phase: item.description || 'm1',
      output: deliverables.output || cacheMap.get(normalizeTitle(item.title)) || ''
    };
  });
  window.localStorage.setItem(`ai_course_wbs_${projectId.value}`, JSON.stringify({ tasks }));
}

function syncWbsCacheFromTasks(taskList) {
  if (!projectId.value) return;
  const cache = getWbsCache();
  const cacheMap = new Map(cache.tasks.map(item => [normalizeTitle(item.title), item.output || '']));
  const tasks = taskList.map(task => ({
    title: task.title,
    phase: task.phase || 'm1',
    output: cacheMap.get(normalizeTitle(task.title)) || ''
  }));
  window.localStorage.setItem(`ai_course_wbs_${projectId.value}`, JSON.stringify({ tasks }));
}

function normalizeStatus(raw) {
  if (!raw) return 'todo';
  if (['todo', 'doing', 'review', 'done'].includes(raw)) return raw;
  const map = { pending: 'todo', submitted: 'review', approved: 'done', rejected: 'todo' };
  return map[raw] || 'todo';
}

function phaseLabel(phase) {
  return PHASE_LABELS[phase] || phase || '任务';
}

function phaseTone(phase) {
  return PHASE_TONES[phase] || 'bg-gray-100 text-gray-500';
}

const phaseFilters = [
  { value: 'all', label: '全部' },
  { value: 'm1', label: '立项' },
  { value: 'm2', label: '实施' },
  { value: 'm3', label: '结题' }
];

function setPhaseFilter(value) {
  phaseFilter.value = value;
}

function tasksByStatus(status) {
  return state.tasks.filter(task => {
    if (task.status !== status) return false;
    if (phaseFilter.value === 'all') return true;
    return task.phase === phaseFilter.value;
  });
}

function countByStatus(status) {
  return tasksByStatus(status).length;
}

function loadLocal() {
  useLocal.value = true;
  const raw = window.localStorage.getItem(dataKey.value);
  state.tasks = raw ? JSON.parse(raw) : [];
  state.tasks = state.tasks.map(item => ({
    ...item,
    deadline: item.deadline || '',
    assignee: item.assignee || ''
  }));
  if (!state.tasks.length) {
    state.tasks = [
      { id: 't1', title: '完成问题定义与立项目标', status: 'todo', phase: 'm1', deadline: '', assignee: '' },
      { id: 't2', title: '推进核心实现与阶段迭代', status: 'doing', phase: 'm2', deadline: '', assignee: '' },
      { id: 't3', title: '整理成果与结题展示', status: 'todo', phase: 'm3', deadline: '', assignee: '' }
    ];
  }
  saveLocal();
}

function saveLocal() {
  window.localStorage.setItem(dataKey.value, JSON.stringify(state.tasks));
}

async function loadMilestones() {
  if (!projectId.value) {
    loadLocal();
    return;
  }
  try {
    const res = await apiFetch(`/projects/${projectId.value}/milestones`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '加载失败');
    state.tasks = (data.milestones || []).map(item => ({
      id: String(item.id),
      title: item.title,
      status: normalizeStatus(item.status),
      phase: item.description || 'm1',
      deadline: item.end_date || item.deadline || '',
      assignee: item.assignee || ''
    }));
    syncWbsCacheFromMilestones(data.milestones || []);
  } catch (err) {
    console.error(err);
    loadLocal();
  }
}

function openAddModal() {
  addForm.title = '';
  addForm.phase = 'm1';
  addForm.deadline = '';
  addForm.assignee = '';
  addError.value = '';
  showAddModal.value = true;
}

function closeAddModal() {
  showAddModal.value = false;
}

async function submitAdd() {
  const title = addForm.title.trim();
  const phase = addForm.phase || 'm1';
  const deadline = addForm.deadline || '';
  const assignee = addForm.assignee.trim();
  if (!title) {
    addError.value = '请输入任务内容';
    return;
  }
  const ok = await createTask(title, phase, deadline, assignee);
  if (ok) {
    closeAddModal();
  }
}

async function createTask(title, phase, deadline, assignee) {
  if (useLocal.value || !projectId.value) {
    state.tasks.push({ id: `t-${Date.now()}`, title, status: 'todo', phase, deadline, assignee });
    saveLocal();
    return true;
  }
  try {
    const res = await apiFetch(`/projects/${projectId.value}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        phase,
        assignee,
        end_date: deadline || null,
        deadline: deadline || null
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '创建失败');
    state.tasks.push({ id: String(data.id), title, status: 'todo', phase, deadline, assignee });
    syncWbsCacheFromTasks(state.tasks);
    return true;
  } catch (err) {
    addError.value = `创建失败：${err.message}`;
    return false;
  }
}

function requestRemove(id) {
  deleteTargetId.value = id;
  showDeleteModal.value = true;
}

function cancelRemove() {
  showDeleteModal.value = false;
  deleteTargetId.value = null;
}

async function confirmRemove() {
  if (deleteTargetId.value) {
    await removeTask(deleteTargetId.value);
  }
  cancelRemove();
}

async function removeTask(id) {
  if (useLocal.value || !projectId.value) {
    state.tasks = state.tasks.filter(task => task.id !== id);
    saveLocal();
    return;
  }
  const previous = [...state.tasks];
  state.tasks = state.tasks.filter(task => task.id !== id);
  try {
    const res = await apiFetch(`/milestones/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '删除失败');
    }
    syncWbsCacheFromTasks(state.tasks);
  } catch (err) {
    state.tasks = previous;
  }
}

function onDragStart(id) {
  draggingId.value = id;
}

function onDragOver(event) {
  event.currentTarget.classList.add('drag-over');
}

function onDragLeave(event) {
  event.currentTarget.classList.remove('drag-over');
}

async function onDrop(event, targetStatus) {
  event.currentTarget.classList.remove('drag-over');
  const task = state.tasks.find(t => t.id === draggingId.value);
  if (!task || task.status === targetStatus) return;
  const previous = task.status;
  task.status = targetStatus;
  if (useLocal.value) {
    saveLocal();
    return;
  }
  try {
    await apiFetch(`/milestones/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetStatus })
    });
  } catch (err) {
    task.status = previous;
  }
}

onMounted(() => {
  loadMilestones();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
body { font-family: 'Inter', sans-serif; background: #eef2f6; }
.column { min-width: 280px; }
.task-card {
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: grab;
}
.task-card:active { cursor: grabbing; transform: rotate(1deg); }
.drag-over { background-color: rgba(226, 232, 240, 0.8); border: 2px dashed #94a3b8; }
</style>

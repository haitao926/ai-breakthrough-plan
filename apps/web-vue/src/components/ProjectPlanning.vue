<template>
  <div class="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <!-- Header with Tabs -->
    <div class="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-white z-20">
      <div class="flex items-center gap-4">
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
          <i class="fas fa-tasks text-indigo-500"></i> 项目计划与追踪
        </h2>
        <div class="flex bg-gray-100 p-1 rounded-lg">
          <button 
            @click="activeTab = 'gantt'"
            class="px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-2"
            :class="activeTab === 'gantt' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          >
            <i class="fas fa-stream"></i> 甘特图
          </button>
          <button 
            @click="activeTab = 'kanban'"
            class="px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-2"
            :class="activeTab === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          >
            <i class="fas fa-columns"></i> 看板
          </button>
        </div>
      </div>
      
      <div class="flex gap-2">
        <button @click="showAddModal = true" class="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm transition-colors flex items-center gap-1">
          <i class="fas fa-plus"></i> 新建任务
        </button>
        <button @click="refreshData" class="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-gray-600 transition-colors">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden relative">
      <GanttChart 
        v-show="activeTab === 'gantt'" 
        :project-id="projectId" 
        :tasks="tasks"
        @update-task="updateTask"
        @request-create-default="createDefaultPlan"
        @edit-task="openEditModal"
        ref="ganttRef"
      />
      <KanbanBoard 
        v-show="activeTab === 'kanban'" 
        :tasks="tasks"
        @update-status="updateTaskStatus"
        @edit="openEditModal"
        @request-create-default="createDefaultPlan"
      />
    </div>

    <!-- Add/Edit Task Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div class="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 class="font-bold text-gray-800">{{ editingTask ? '编辑任务' : '新建任务' }}</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
        </div>
        <form @submit.prevent="saveTask" class="p-5 space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">任务名称</label>
            <input v-model="taskForm.title" type="text" required class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="例如：完成需求文档" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">阶段/标签</label>
              <select v-model="taskForm.phase" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                <option value="规划">规划</option>
                <option value="设计">设计</option>
                <option value="开发">开发</option>
                <option value="测试">测试</option>
                <option value="部署">部署</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">状态</label>
              <select v-model="taskForm.status" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                <option value="pending">待办</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="closeModal" class="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">取消</button>
            <button type="submit" class="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">保存</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue';
import GanttChart from './GanttChart.vue';
import KanbanBoard from './KanbanBoard.vue';
import { apiFetch } from '@/api/client';

const props = defineProps({
  projectId: { type: String, required: true }
});

const activeTab = ref('gantt');
const tasks = ref([]);
const ganttRef = ref(null);

const showAddModal = ref(false);
const editingTask = ref(null);
const taskForm = reactive({ title: '', phase: '规划', status: 'pending' });

const loadTasks = async () => {
  if (!props.projectId) return;
  try {
    const res = await apiFetch(`/projects/${props.projectId}/milestones`);
    const data = await res.json();
    tasks.value = (data.milestones || []).map(m => ({
        id: m.id,
        title: m.title,
        phase: m.phase || m.description || '规划',
        status: m.status || 'pending',
        // Preserve Gantt props if they exist in localStorage (handled by Gantt component mostly, but we pass raw data)
        // Here we just manage the "What" (tasks)
    }));
    // GanttChart component will handle merging with its own local config for dates
    if (ganttRef.value) ganttRef.value.syncTasks(tasks.value);
  } catch (e) {
    console.error(e);
  }
};

const refreshData = () => loadTasks();

const updateTaskStatus = async ({ taskId, status }) => {
  // Optimistic update
  const task = tasks.value.find(t => t.id == taskId);
  if (task) task.status = status;
  
  try {
    await apiFetch(`/milestones/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  } catch (e) {
    console.error(e);
    loadTasks(); // Revert on error
  }
};

const openEditModal = (task) => {
  editingTask.value = task;
  taskForm.title = task.title;
  taskForm.phase = task.phase;
  taskForm.status = task.status;
  showAddModal.value = true;
};

const closeModal = () => {
  showAddModal.value = false;
  editingTask.value = null;
  taskForm.title = '';
  taskForm.phase = '规划';
  taskForm.status = 'pending';
};

const saveTask = async () => {
  const payload = {
    title: taskForm.title,
    phase: taskForm.phase,
    // Store status in DB. Note: DB schema has 'status' in project_milestones
    status: taskForm.status
  };

  try {
    if (editingTask.value) {
      // Edit
      await apiFetch(`/milestones/${editingTask.value.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      // Create
      await apiFetch(`/projects/${props.projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, description: payload.phase }) // Use description for phase storage
      });
    }
    closeModal();
    loadTasks();
  } catch (e) {
    alert('保存失败');
  }
};

const createDefaultPlan = async () => {
  if (!props.projectId) return;
  const defaults = [
    { title: '需求调研', phase: '规划', status: 'completed' },
    { title: '方案设计', phase: '设计', status: 'in_progress' },
    { title: '核心功能开发', phase: '开发', status: 'pending' },
    { title: '系统测试', phase: '测试', status: 'pending' }
  ];
  
  try {
    for (const task of defaults) {
      await apiFetch(`/projects/${props.projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task.title, description: task.phase, status: task.status })
      });
    }
    loadTasks();
  } catch (e) {
    console.error(e);
    alert('创建默认计划失败');
  }
};

// Handlers for Gantt updates
const updateTask = (updatedTask) => {
    // This comes from Gantt when dates change. 
    // Since we don't store dates in backend yet (only local config in Gantt), 
    // we let Gantt handle its persistence.
    // If we wanted to persist dates to backend, we would do it here.
};

watch(() => props.projectId, loadTasks, { immediate: true });
</script>

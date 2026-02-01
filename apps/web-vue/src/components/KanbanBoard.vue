<template>
  <div class="h-full bg-gray-50 p-6">
    <!-- Global Empty State -->
    <div v-if="tasks.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-white/50">
        <div class="text-4xl mb-4 text-gray-300">📋</div>
        <p>暂无看板任务</p>
        <p class="text-xs text-gray-400 mt-1 mb-6">您可以手动创建任务，或一键生成默认计划</p>
        <button @click="$emit('request-create-default')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm text-sm font-medium transition-colors flex items-center gap-2">
          <i class="fas fa-magic"></i> 创建默认计划
        </button>
    </div>

    <!-- Kanban Columns -->
    <div v-else class="flex h-full overflow-x-auto gap-6">
      <div 
        v-for="col in columns" 
        :key="col.id" 
        class="flex-shrink-0 w-80 flex flex-col bg-gray-100 rounded-xl border border-gray-200"
        @dragover.prevent
        @drop="onDrop($event, col.id)"
      >
        <!-- Column Header -->
        <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h3 class="font-bold text-gray-700 flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" :class="col.color"></div>
            {{ col.title }}
          </h3>
          <span class="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{{ getTasksByStatus(col.id).length }}</span>
        </div>

        <!-- Task List -->
        <div class="flex-1 overflow-y-auto p-3 space-y-3 min-h-[100px]">
          <div 
            v-for="task in getTasksByStatus(col.id)" 
            :key="task.id" 
            draggable="true"
            @dragstart="onDragStart($event, task)"
            class="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-all group"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">{{ task.phase || '任务' }}</span>
              <button @click="$emit('edit', task)" class="text-gray-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <i class="fas fa-pen text-xs"></i>
              </button>
            </div>
            <h4 class="text-sm font-medium text-gray-800 mb-1 leading-snug">{{ task.title }}</h4>
            <p v-if="task.description && task.description !== task.phase" class="text-xs text-gray-500 truncate">{{ task.description }}</p>
          </div>
          
          <!-- Empty Column Placeholder -->
          <div v-if="getTasksByStatus(col.id).length === 0" class="h-full flex items-center justify-center text-gray-300 text-xs italic border-2 border-dashed border-gray-200 rounded-lg m-2 bg-gray-50/50">
            拖拽任务到这里
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tasks: { type: Array, default: () => [] }
});

const emit = defineEmits(['update-status', 'edit', 'request-create-default']);

const columns = [
  { id: 'pending', title: '待办事项', color: 'bg-gray-400' },
  { id: 'in_progress', title: '进行中', color: 'bg-blue-500' },
  { id: 'completed', title: '已完成', color: 'bg-green-500' }
];

const getTasksByStatus = (status) => {
  return props.tasks.filter(t => (t.status || 'pending') === status);
};

const onDragStart = (e, task) => {
  e.dataTransfer.dropEffect = 'move';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('task-id', task.id);
};

const onDrop = (e, status) => {
  const taskId = e.dataTransfer.getData('task-id');
  if (taskId) {
    emit('update-status', { taskId, status });
  }
};
</script>
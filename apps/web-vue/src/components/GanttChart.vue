<template>
  <div class="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <!-- Top Bar -->
    <div class="flex justify-between items-center p-4 border-b border-gray-200 bg-white z-20">
      <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
        <i class="fas fa-stream text-indigo-500"></i> 项目进度
      </h2>
      <div class="text-xs text-gray-400">提示：拖动任务条可平移时间，点击任务可编辑日期</div>
      <div class="flex gap-2">
        <button @click="refreshData" class="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-gray-600 transition-colors">
          <i class="fas fa-sync-alt mr-1"></i> 同步
        </button>
        <div class="h-6 w-px bg-gray-200 mx-1"></div>
        <button @click="shiftView(-7)" class="px-2 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-gray-600">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button @click="goToToday" class="px-3 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-gray-600">
          今天
        </button>
        <button @click="shiftView(7)" class="px-2 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-gray-600">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex flex-1 overflow-hidden relative">
      
      <!-- Chart Area -->
      <div class="flex-1 flex flex-col min-w-0 bg-white relative">
        
        <!-- Empty State -->
        <div v-if="!loading && tasks.length === 0" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 z-10">
          <div class="text-4xl mb-4 text-gray-300">📊</div>
          <p class="text-gray-500 text-sm mb-6">暂无任务</p>
          <button @click="createDefaultPlan" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm text-sm font-medium transition-colors">
            创建默认计划
          </button>
        </div>

        <!-- Gantt Header (Dates) -->
        <div class="flex border-b border-gray-200 bg-gray-50 select-none">
          <div class="w-48 flex-shrink-0 border-r border-gray-200 p-2 text-xs font-bold text-gray-500 flex items-center pl-4 bg-white sticky left-0 z-10">
            任务名称
          </div>
          <div class="flex-1 overflow-hidden" ref="headerScrollContainer">
            <div class="flex" :style="{ width: totalWidth + 'px', transform: `translateX(-${scrollX}px)` }">
              <div 
                v-for="day in dateHeaders" 
                :key="day.date" 
                class="flex-shrink-0 border-r border-gray-100 flex flex-col items-center justify-center text-xs h-10"
                :class="{'bg-blue-50/50': day.isWeekend, 'bg-indigo-50 text-indigo-600 font-bold': day.isToday}"
                :style="{ width: cellWidth + 'px' }"
              >
                <span class="text-[10px] text-gray-400 scale-90">{{ day.dayName }}</span>
                <span>{{ day.dateNum }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Gantt Body (Tasks) -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden relative" @scroll="onBodyScroll">
          <!-- Grid Background -->
          <div class="absolute top-0 bottom-0 left-48 z-0 flex" :style="{ width: totalWidth + 'px', transform: `translateX(-${scrollX}px)` }">
             <div 
                v-for="day in dateHeaders" 
                :key="'grid-' + day.date" 
                class="flex-shrink-0 border-r border-gray-100 h-full"
                :class="{'bg-gray-50/30': day.isWeekend, 'bg-indigo-50/10': day.isToday}"
                :style="{ width: cellWidth + 'px' }"
              ></div>
          </div>

          <!-- Rows -->
          <div v-for="(task, idx) in tasks" :key="task.id" class="flex relative z-0 hover:bg-gray-50 transition-colors h-12 group">
            <div class="w-48 flex-shrink-0 border-r border-gray-200 p-2 text-sm text-gray-700 flex items-center pl-4 bg-white sticky left-0 z-10 border-b border-gray-50 group-hover:border-gray-100">
              <span class="truncate" :title="task.name">{{ task.name }}</span>
              <button class="ml-auto text-gray-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition" @click="openEdit(task)">
                <i class="fas fa-pen"></i>
              </button>
            </div>
            <div class="flex-1 relative border-b border-gray-50 group-hover:border-gray-100">
              <!-- Task Bar -->
              <div 
                v-if="isTaskVisible(task)"
                class="absolute h-7 top-2.5 rounded shadow-sm text-xs text-white flex items-center px-2 cursor-pointer hover:brightness-110 transition-all select-none whitespace-nowrap overflow-hidden"
                :style="getTaskStyle(task)"
                @mousedown.stop="startDrag(task, $event)"
                @click.stop="openEdit(task)"
              >
                {{ task.name }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Horizontal Scrollbar for Timeline -->
        <div class="h-3 bg-gray-100 border-t border-gray-200 overflow-x-auto overflow-y-hidden" ref="bottomScrollContainer" @scroll="onBottomScroll">
           <div :style="{ width: totalWidth + 'px', height: '1px' }"></div>
        </div>

      </div>

      <!-- Right: AI Copilot -->
      <div class="w-80 bg-white border-l border-gray-200 flex flex-col shadow-xl z-30">
        <div class="p-3 border-b border-gray-100 bg-gray-50/80">
          <h3 class="font-bold text-sm text-gray-700 flex items-center gap-2">
            <i class="fas fa-robot text-indigo-500"></i> AI 助手
          </h3>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="msgContainer">
          <div v-for="(msg, idx) in chatMessages" :key="idx" class="flex flex-col gap-1" :class="msg.role === 'user' ? 'items-end' : 'items-start'">
            <div class="text-[10px] text-gray-400 px-1">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
            <div 
              class="px-3 py-2 rounded-2xl text-xs max-w-[90%] shadow-sm leading-relaxed"
              :class="msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-sm'"
            >
              {{ msg.text }}
            </div>
          </div>
          <div v-if="aiProcessing" class="flex items-start gap-1">
             <div class="px-3 py-2 bg-white rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm">
               <i class="fas fa-circle-notch fa-spin text-indigo-500 text-xs"></i>
             </div>
          </div>
        </div>

        <div class="p-3 border-t border-gray-100 bg-white">
          <div class="flex gap-2 mb-2 overflow-x-auto pb-1 no-scrollbar">
            <button 
              v-for="action in quickActions" 
              :key="action"
              @click="sendQuickAction(action)"
              class="whitespace-nowrap px-2 py-1 text-[10px] bg-gray-50 hover:bg-gray-100 text-gray-600 rounded border border-gray-200 transition-colors"
            >
              {{ action }}
            </button>
          </div>
          <div class="relative">
            <textarea 
              v-model="userPrompt" 
              @keydown.enter.prevent="sendMessage"
              placeholder="输入指令，如'延后两天'..." 
              class="w-full pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-16 bg-gray-50 focus:bg-white transition-colors"
            ></textarea>
            <button 
              @click="sendMessage"
              :disabled="!userPrompt.trim() || aiProcessing"
              class="absolute bottom-2 right-2 text-indigo-500 hover:text-indigo-600 disabled:text-gray-300 transition-colors"
            >
              <i class="fas fa-paper-plane text-xs"></i>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Edit Modal -->
    <div v-if="showEdit" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div class="bg-white w-full max-w-md rounded-xl p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-900 mb-4">编辑任务时间</h3>
        <div class="space-y-3">
          <div>
            <label class="text-xs text-gray-500">任务名称</label>
            <input v-model="editForm.name" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-500">开始日期</label>
              <input type="date" v-model="editForm.start" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label class="text-xs text-gray-500">结束日期</label>
              <input type="date" v-model="editForm.end" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label class="text-xs text-gray-500">颜色</label>
            <input type="color" v-model="editForm.color" class="w-full mt-1 h-9 px-2 py-1 border border-gray-200 rounded-lg" />
          </div>
          <p v-if="editError" class="text-xs text-red-500">{{ editError }}</p>
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800" @click="closeEdit">取消</button>
          <button class="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" @click="applyEdit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import dayjs from 'dayjs';
import { apiFetch } from '@/api/client';

const props = defineProps({
  projectId: { type: String, required: true }
});

// --- State ---
const loading = ref(false);
const tasks = ref([]);
const startDate = ref(dayjs().subtract(7, 'day'));
const cellWidth = 40;
const visibleDays = 60; // Render range
const scrollX = ref(0);
const showEdit = ref(false);
const editError = ref('');
const editForm = ref({ id: '', name: '', start: '', end: '', color: '#3b82f6' });

// --- Layout Helpers ---
const dateHeaders = computed(() => {
  const days = [];
  for (let i = 0; i < visibleDays; i++) {
    const d = startDate.value.add(i, 'day');
    days.push({
      date: d.format('YYYY-MM-DD'),
      dateNum: d.format('D'),
      dayName: ['日','一','二','三','四','五','六'][d.day()],
      isWeekend: d.day() === 0 || d.day() === 6,
      isToday: d.isSame(dayjs(), 'day')
    });
  }
  return days;
});

const totalWidth = computed(() => visibleDays * cellWidth);

// --- Data ---
const STORAGE_KEY_PREFIX = 'custom_gantt_v1_';
const PHASE_COLORS = {
  m1: '#6366f1',
  m2: '#f59e0b',
  m3: '#10b981'
};

const loadData = async () => {
  loading.value = true;
  try {
    // API Data
    const res = await apiFetch(`/projects/${props.projectId}/milestones`);
    const data = await res.json();
    const apiMilestones = data.milestones || [];

    // Local Config (Colors only)
    const savedKey = STORAGE_KEY_PREFIX + props.projectId;
    const savedStr = localStorage.getItem(savedKey);
    const savedConfig = savedStr ? JSON.parse(savedStr) : {};

    // Merge
    tasks.value = apiMilestones.map((m, idx) => {
        const phase = m.description || 'm1';
        const defaultStart = dayjs().add(idx * 2, 'day').format('YYYY-MM-DD');
        const defaultEnd = dayjs().add(idx * 2 + 3, 'day').format('YYYY-MM-DD');
        const startFromDb = m.start_date || m.startDate || m.start;
        const endFromDb = m.end_date || m.endDate || m.end;

        let start = startFromDb ? dayjs(startFromDb).format('YYYY-MM-DD') : defaultStart;
        let end = endFromDb ? dayjs(endFromDb).format('YYYY-MM-DD') : defaultEnd;

        if (!endFromDb && startFromDb) {
            end = dayjs(start).add(3, 'day').format('YYYY-MM-DD');
        }
        if (!startFromDb && endFromDb) {
            start = dayjs(end).subtract(3, 'day').format('YYYY-MM-DD');
        }

        const saved = savedConfig[m.id] || {};
        const defaultColor = PHASE_COLORS[phase] || '#3b82f6';

        return {
            id: m.id || `temp-${idx}`,
            name: m.title,
            phase,
            start,
            end,
            color: saved.color || defaultColor
        };
    });

    if (tasks.value.length === 0) {
       // Just keep empty state
    } else {
       // Align view to first task
       const firstStart = dayjs(tasks.value[0].start);
       startDate.value = firstStart.subtract(3, 'day');
    }

  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const saveData = () => {
    if (!props.projectId) return;
    const config = {};
    tasks.value.forEach(t => {
        if (!t.id) return;
        config[t.id] = {
            color: t.color
        };
    });
    localStorage.setItem(STORAGE_KEY_PREFIX + props.projectId, JSON.stringify(config));
};

const persistTaskDates = async (task) => {
    if (!props.projectId || !task?.id) return;
    try {
        await apiFetch(`/milestones/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: task.name,
                start_date: task.start,
                end_date: task.end
            })
        });
    } catch (e) {
        console.error(e);
    }
};

const persistAllDates = async () => {
    if (!props.projectId) return;
    for (const task of tasks.value) {
        await persistTaskDates(task);
    }
};

const createDefaultPlan = async () => {
    const today = dayjs().format('YYYY-MM-DD');
    const defaults = [
        { title: '需求分析', phase: 'm1', start: today, end: dayjs(today).add(2, 'day').format('YYYY-MM-DD'), color: '#6366f1' },
        { title: '方案设计', phase: 'm2', start: dayjs(today).add(3, 'day').format('YYYY-MM-DD'), end: dayjs(today).add(6, 'day').format('YYYY-MM-DD'), color: '#f59e0b' },
        { title: '原型开发', phase: 'm2', start: dayjs(today).add(7, 'day').format('YYYY-MM-DD'), end: dayjs(today).add(14, 'day').format('YYYY-MM-DD'), color: '#8b5cf6' },
        { title: '测试反馈', phase: 'm3', start: dayjs(today).add(15, 'day').format('YYYY-MM-DD'), end: dayjs(today).add(17, 'day').format('YYYY-MM-DD'), color: '#10b981' }
    ];

    if (!props.projectId) {
        tasks.value = defaults.map((item, idx) => ({
            id: `d${idx + 1}`,
            name: item.title,
            phase: item.phase,
            start: item.start,
            end: item.end,
            color: item.color
        }));
        return;
    }

    loading.value = true;
    try {
        for (const item of defaults) {
            await apiFetch(`/projects/${props.projectId}/milestones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: item.title,
                    phase: item.phase,
                    start_date: item.start,
                    end_date: item.end
                })
            });
        }
        await loadData();
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

const refreshData = () => {
    if(confirm('重新同步将覆盖未保存的日期调整，确定吗？')) {
        loadData();
    }
};

const openEdit = (task) => {
    if (!task) return;
    editForm.value = {
        id: task.id,
        name: task.name,
        start: task.start,
        end: task.end,
        color: task.color || '#3b82f6'
    };
    editError.value = '';
    showEdit.value = true;
};

const closeEdit = () => {
    showEdit.value = false;
};

const applyEdit = async () => {
    const task = tasks.value.find(t => t.id === editForm.value.id);
    if (!task) {
        closeEdit();
        return;
    }
    const start = dayjs(editForm.value.start);
    const end = dayjs(editForm.value.end);
    if (!start.isValid() || !end.isValid()) {
        editError.value = '请选择有效日期';
        return;
    }
    if (end.isBefore(start)) {
        editError.value = '结束日期不能早于开始日期';
        return;
    }
    task.name = editForm.value.name || task.name;
    task.start = start.format('YYYY-MM-DD');
    task.end = end.format('YYYY-MM-DD');
    task.color = editForm.value.color || task.color;
    saveData();
    await persistTaskDates(task);
    closeEdit();
};

// --- Visualization ---
const getTaskStyle = (task) => {
    const start = dayjs(task.start);
    const end = dayjs(task.end);
    const diffStart = start.diff(startDate.value, 'day');
    const duration = end.diff(start, 'day') + 1; // inclusive

    const left = diffStart * cellWidth;
    const width = duration * cellWidth;

    return {
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: task.color,
        transform: `translateX(-${scrollX.value}px)`
    };
};

const isTaskVisible = (task) => {
    // Simple visibility check
    const start = dayjs(task.start);
    const end = dayjs(task.end);
    const viewStart = startDate.value;
    const viewEnd = startDate.value.add(visibleDays, 'day');
    return start.isBefore(viewEnd) && end.isAfter(viewStart);
};

// --- Navigation ---
const headerScrollContainer = ref(null);
const bottomScrollContainer = ref(null);

const onBodyScroll = (e) => {
    // vertical scroll only
};

const onBottomScroll = (e) => {
    scrollX.value = e.target.scrollLeft;
};

const shiftView = (days) => {
    startDate.value = startDate.value.add(days, 'day');
};

const goToToday = () => {
    startDate.value = dayjs().subtract(3, 'day');
};

// --- Dragging ---
const startDrag = (task, event) => {
    const startX = event.clientX;
    const originalLeft = dayjs(task.start).diff(startDate.value, 'day') * cellWidth;
    
    const onMove = (e) => {
        const dx = e.clientX - startX;
        const newLeft = originalLeft + dx;
        const daysShift = Math.round(newLeft / cellWidth);
        
        // Update task dates (visual)
        const currentStart = dayjs(task.start);
        const duration = dayjs(task.end).diff(currentStart, 'day');
        
        const newStart = startDate.value.add(daysShift, 'day');
        const newEnd = newStart.add(duration, 'day');
        
        task.start = newStart.format('YYYY-MM-DD');
        task.end = newEnd.format('YYYY-MM-DD');
    };
    
    const onUp = async () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        saveData();
        await persistTaskDates(task);
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
};

// --- AI Copilot ---
const chatMessages = ref([
    { role: 'ai', text: '你好！我是项目进度助手。我可以帮你“生成计划”或“把任务延后3天”。' }
]);
const userPrompt = ref('');
const aiProcessing = ref(false);
const msgContainer = ref(null);
const quickActions = ['生成默认计划', '所有任务延后3天', '标为紧急(红色)'];

const scrollToBottom = () => {
    nextTick(() => {
        if (msgContainer.value) {
            msgContainer.value.scrollTop = msgContainer.value.scrollHeight;
        }
    });
};

const sendQuickAction = (action) => {
    userPrompt.value = action;
    sendMessage();
};

const sendMessage = async () => {
    const text = userPrompt.value.trim();
    if (!text) return;
    
    chatMessages.value.push({ role: 'user', text });
    userPrompt.value = '';
    scrollToBottom();
    aiProcessing.value = true;
    
    await new Promise(r => setTimeout(r, 800)); // Simulate thinking
    
    try {
        const reply = processAI(text);
        chatMessages.value.push({ role: 'ai', text: reply });
        saveData();
    } catch (e) {
        chatMessages.value.push({ role: 'ai', text: '抱歉，我出错了。' });
    } finally {
        aiProcessing.value = false;
        scrollToBottom();
    }
};

const processAI = (text) => {
    if (text.includes('生成') || text.includes('默认') || text.includes('计划')) {
        createDefaultPlan();
        return '已为您生成了默认的项目计划。';
    }
    
    if (text.includes('延后') || text.includes('推迟')) {
        const match = text.match(/(\d+)天/);
        const days = match ? parseInt(match[1]) : 1;
        tasks.value.forEach(t => {
            t.start = dayjs(t.start).add(days, 'day').format('YYYY-MM-DD');
            t.end = dayjs(t.end).add(days, 'day').format('YYYY-MM-DD');
        });
        persistAllDates();
        return `已将所有任务延后了 ${days} 天。`;
    }
    
    if (text.includes('红') || text.includes('紧急')) {
        tasks.value.forEach(t => t.color = '#ef4444');
        return '已将任务标记为红色。';
    }
    
    if (text.includes('绿') || text.includes('完成')) {
        tasks.value.forEach(t => t.color = '#10b981');
        return '已将任务标记为绿色。';
    }

    return '我还在学习这个指令，试着说“所有任务延后2天”？';
};

// --- Init ---
watch(() => props.projectId, (id) => {
    if(id) loadData();
}, { immediate: true });

</script>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>

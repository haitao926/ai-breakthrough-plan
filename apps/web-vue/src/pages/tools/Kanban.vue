<template>
  <div class="h-full flex flex-col bg-[#f8fafc]">
    <!-- 1. Top Bar: Phase Navigation & Stats -->
    <div class="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-20">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i class="fas fa-tasks text-indigo-600"></i> 任务规划与执行
          </h1>
          <div class="bg-slate-100 rounded-lg p-1 flex text-xs font-medium">
            <button 
              class="px-3 py-1 rounded-md transition-all flex items-center"
              :class="viewMode === 'board' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              @click="viewMode = 'board'"
            >
              <i class="fas fa-columns mr-1"></i> 执行看板
            </button>
            <button 
              class="px-3 py-1 rounded-md transition-all flex items-center"
              :class="viewMode === 'plan' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              @click="viewMode = 'plan'"
            >
              <i class="fas fa-list mr-1"></i> 规划视图 (Plan)
            </button>
            <button 
              class="px-3 py-1 rounded-md transition-all flex items-center"
              :class="viewMode === 'gantt' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              @click="viewMode = 'gantt'"
            >
              <i class="fas fa-stream mr-1"></i> 进度甘特
            </button>
          </div>
        </div>
        <div class="flex items-center gap-3">
           <button
             class="btn-secondary small"
             :disabled="!tasks.length"
             @click="markAllDone"
           >
             <i class="fas fa-check-double mr-1"></i> 全部完成
           </button>
           <span class="text-xs text-slate-400" v-if="saving">
             <i class="fas fa-sync fa-spin mr-1"></i> 保存中...
           </span>
        </div>
      </div>

      <!-- Command Bar -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <i class="fas fa-bolt text-amber-400 text-xs"></i>
          <input
            v-model="commandText"
            @keydown.enter="applyCommand"
            class="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
            placeholder="一句话改计划：例如“文献阅读在3月10日前完成，负责人小李，阶段立项”"
          />
        </div>
        <button
          class="px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
          @click="applyCommand"
        >
          应用
        </button>
        <span v-if="commandStatus.message" class="text-xs" :class="commandStatus.type === 'error' ? 'text-red-500' : 'text-emerald-600'">
          {{ commandStatus.message }}
        </span>
      </div>

      <!-- Phase Stepper (Visible in Board Mode) -->
      <div v-if="viewMode === 'board'" class="flex items-center w-full max-w-4xl mx-auto">
        <div 
          v-for="(phase, idx) in phases" 
          :key="phase.key"
          class="flex-1 relative cursor-pointer group"
          @click="currentPhase = phase.key"
        >
          <div class="flex items-center mb-2">
            <div 
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 z-10 bg-white"
              :class="getPhaseStepClass(phase.key)"
            >
              <i v-if="getPhaseProgress(phase.key) >= 100" class="fas fa-check"></i>
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <div 
              class="h-1 flex-1 mx-2 rounded-full transition-all"
              :class="idx < phases.length - 1 ? 'bg-slate-100' : 'hidden'"
            >
               <div class="h-full bg-indigo-500 rounded-full transition-all" :style="{ width: idx < phases.indexOf(phases.find(p => p.key === currentPhase)) ? '100%' : '0%' }"></div>
            </div>
          </div>
          <div class="pr-8">
            <div class="flex justify-between items-center">
              <span class="text-sm font-bold transition-colors" :class="currentPhase === phase.key ? 'text-indigo-600' : 'text-slate-500'">{{ phase.label }}</span>
              <span class="text-xs text-slate-400 font-mono">{{ getPhaseStats(phase.key) }}</span>
            </div>
            <div class="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div class="h-full bg-emerald-400 transition-all duration-500" :style="{ width: getPhaseProgress(phase.key) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Main Content Area -->
    <div class="flex-1 overflow-hidden relative">
      
      <!-- VIEW A: Focused Board (Kanban) -->
      <div v-if="viewMode === 'board'" class="h-full p-6 overflow-x-auto">
        <div class="flex h-full gap-6 max-w-6xl mx-auto">
          <div 
            v-for="col in columns" 
            :key="col.id" 
            class="flex-1 flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200/60 min-w-[300px]"
            @dragover.prevent
            @drop="onDrop($event, col.id)"
          >
            <div class="p-4 flex justify-between items-center border-b border-slate-200/50">
              <h3 class="font-bold text-slate-700 flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :class="col.dotClass"></div>
                {{ col.title }}
              </h3>
              <span class="bg-slate-200 text-slate-500 px-2 py-0.5 rounded text-xs font-bold">{{ getColumnTasks(col.id).length }}</span>
            </div>

            <div class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              <div 
                v-for="task in getColumnTasks(col.id)" 
                :key="task.id" 
                draggable="true"
                @dragstart="onDragStart($event, task)"
                class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-move group select-none relative"
                @click="openEdit(task)"
              > 
                <div class="flex items-start gap-3">
                  <div class="mt-1">
                    <div 
                      class="w-4 h-4 rounded border cursor-pointer transition-colors flex items-center justify-center"
                      :class="task.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-indigo-500'"
                      @click.stop="toggleTaskStatus(task)"
                    >
                      <i v-if="task.status === 'done'" class="fas fa-check text-white text-[10px]"></i>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-slate-800 leading-snug" :class="{ 'line-through text-slate-400': task.status === 'done' }">
                      {{ task.title }}
                    </div>
                    <div class="text-xs text-slate-400 mt-1 truncate" v-if="task.output">
                      <i class="fas fa-bullseye mr-1 text-slate-300"></i> {{ task.output }}
                    </div>
                    <div v-if="task.assignee || task.startDate || task.endDate" class="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span v-if="task.assignee" class="flex items-center gap-1">
                        <i class="fas fa-user text-slate-300"></i> {{ task.assignee }}
                      </span>
                      <span v-if="task.startDate || task.endDate" class="flex items-center gap-1">
                        <i class="fas fa-calendar text-slate-300"></i>
                        <span>
                          {{ formatDeadline(task.startDate) }}<span v-if="task.startDate && task.endDate"> - </span>{{ formatDeadline(task.endDate) }}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Add (Todo only) -->
              <div v-if="col.id === 'todo'" class="mt-2">
                <div v-if="isAdding" class="bg-white p-3 rounded-xl border border-indigo-200 shadow-sm ring-2 ring-indigo-500/10">
                  <input 
                    v-model="newTaskTitle" 
                    ref="newTaskInput"
                    @keydown.enter="addTask"
                    @blur="cancelAdd"
                    class="w-full text-sm outline-none placeholder:text-slate-400"
                    placeholder="输入任务标题，回车创建..."
                  />
                </div>
                <button 
                  v-else
                  @click="startAdd"
                  class="w-full py-2 text-xs text-slate-500 hover:text-indigo-600 hover:bg-white/50 border border-transparent hover:border-indigo-100 rounded-lg transition-all flex items-center justify-center gap-1 group"
                >
                  <i class="fas fa-plus group-hover:scale-110 transition-transform"></i> 添加任务
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW B: Global Plan (Brief + Grouped List) -->
      <div v-else-if="viewMode === 'plan'" class="h-full overflow-y-auto p-8 custom-scrollbar">
        <div class="max-w-4xl mx-auto space-y-6">
          
          <!-- Project Brief & AI Generation (Collapsible) -->
          <section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300" :class="{'pb-4': showBrief}">
            <div class="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 border-b border-transparent" :class="{'border-slate-100': showBrief}" @click="showBrief = !showBrief">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <i class="fas fa-magic"></i>
                </div>
                <div>
                  <h2 class="text-sm font-bold text-slate-800">项目构思与生成</h2>
                  <p class="text-xs text-slate-500" v-if="!showBrief">点击展开，AI 帮你规划任务。</p>
                </div>
              </div>
              <i class="fas text-slate-400" :class="showBrief ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            </div>

            <div v-show="showBrief" class="px-6 pt-4 space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div>
                  <label class="text-xs font-bold text-slate-500 mb-1 block">我想做什么？</label>
                  <input 
                    v-model.trim="brief.idea" 
                    class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all"
                    placeholder="例如：做一个智能浇花系统..." 
                  />
                </div>
                <div>
                  <label class="text-xs font-bold text-slate-500 mb-1 block">核心产出类型</label>
                  <select 
                    v-model="brief.type"
                    class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="product">工程产品 (实物/软件)</option>
                    <option value="research">课题研究 (论文/报告)</option>
                    <option value="impact">社会公益 (行动/宣传)</option>
                  </select>
                </div>
              </div>
              
              <div class="flex justify-between items-center pt-2">
                <label class="flex items-center gap-2 text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                  <input type="checkbox" v-model="brief.check" class="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300">
                  <span>确认资源与时间充足</span>
                </label>
                              <div class="flex gap-2">
                                <button 
                                  class="btn-secondary small text-red-500 hover:bg-red-50 hover:border-red-200"
                                  @click="clearTasks"
                                  v-if="tasks.length > 0"
                                >
                                  <i class="fas fa-trash-alt mr-1"></i> 清空
                                </button>
                                <button 
                                  class="btn-primary text-xs flex items-center gap-1 px-4 py-2"
                                  @click="generateTasks"
                                  :disabled="!brief.idea && !tasks.length"
                                >
                                  <i class="fas fa-wand-magic-sparkles"></i> 智能生成任务清单
                                </button>
                              </div>              </div>
            </div>
          </section>

          <!-- Phase Lists -->
          <div v-for="phase in phases" :key="phase.key" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="p-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
              <div class="flex items-center gap-2">
                <span class="w-2 h-8 rounded-full" :class="phase.barClass"></span>
                <h3 class="text-lg font-bold text-slate-800">{{ phase.label }}</h3>
              </div>
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span>{{ getPhaseProgress(phase.key) }}% 完成</span>
              </div>
            </div>
            <div class="divide-y divide-slate-100">
              <div 
                v-for="task in getPhaseTasks(phase.key)" 
                :key="task.id" 
                class="p-4 hover:bg-slate-50 flex items-center gap-4 group transition-colors"
              >
                <div 
                  class="w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-all"
                  :class="task.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-indigo-500'"
                  @click="toggleTaskStatus(task)"
                >
                  <i v-if="task.status === 'done'" class="fas fa-check text-white text-xs"></i>
                </div>
                <input 
                  v-model="task.title" 
                  class="flex-1 bg-transparent text-sm text-slate-800 focus:outline-none focus:text-indigo-700 font-medium"
                  :class="{ 'line-through text-slate-400': task.status === 'done' }"
                  @blur="persistTask(task)"
                />
                <div class="flex items-center gap-3 text-xs text-slate-500">
                  <div class="flex items-center gap-2">
                    <i class="fas fa-user text-slate-300"></i>
                    <input
                      v-model="task.assignee"
                      list="assignee-options"
                      class="bg-slate-100 rounded px-2 py-1 w-24 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                      placeholder="负责人"
                      @blur="persistTask(task)"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="fas fa-calendar text-slate-300"></i>
                    <input
                      v-model="task.startDate"
                      type="date"
                      class="bg-slate-100 rounded px-2 py-1 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                      title="开始日期"
                      @change="persistTask(task)"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <i class="fas fa-flag-checkered text-slate-300"></i>
                    <input
                      v-model="task.endDate"
                      type="date"
                      class="bg-slate-100 rounded px-2 py-1 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                      title="截止日期"
                      @change="persistTask(task)"
                    />
                  </div>
                </div>
                <select 
                  v-model="task.status" 
                  class="text-xs bg-slate-100 border-none rounded px-2 py-1 text-slate-600 focus:ring-0 cursor-pointer"
                  @change="saveData"
                >
                  <option value="todo">待办</option>
                  <option value="doing">进行中</option>
                  <option value="done">已完成</option>
                </select>
                <button class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" @click="deleteTask(task)">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
              <!-- Inline Add for Plan View -->
              <div class="p-3 pl-12 bg-slate-50/30">
                <input 
                  placeholder="+ 添加新任务..." 
                  class="w-full bg-transparent text-sm text-slate-500 placeholder:text-slate-400 focus:outline-none"
                  @keydown.enter="addPlanTask($event, phase.key)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- VIEW C: Gantt Timeline -->
      <div v-else class="h-full p-6 overflow-hidden">
        <GanttChart :project-id="projectId" />
      </div>

      <datalist id="assignee-options">
        <option v-for="member in assigneeOptions" :key="member" :value="member" />
      </datalist>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import dayjs from 'dayjs';
import { useRoute, useRouter } from 'vue-router';
import { apiFetch } from '@/api/client';
import GanttChart from '@/components/GanttChart.vue';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.query.project);

// --- State ---
const viewMode = ref('board'); // 'board' | 'plan' | 'gantt'
const currentPhase = ref('m1');
const tasks = ref([]);
const saving = ref(false);
const isAdding = ref(false);
const newTaskTitle = ref('');
const newTaskInput = ref(null);
const showBrief = ref(true);
const members = ref([]);
const commandText = ref('');
const commandStatus = ref({ type: '', message: '' });

const brief = reactive({
  idea: '',
  type: 'product',
  check: false
});

// --- Constants ---
const phases = [
  { key: 'm1', label: '阶段一：立项', barClass: 'bg-indigo-500' },
  { key: 'm2', label: '阶段二：实施', barClass: 'bg-amber-500' },
  { key: 'm3', label: '阶段三：结题', barClass: 'bg-emerald-500' }
];

const columns = [
  { id: 'todo', title: '待办事项', dotClass: 'bg-slate-400' },
  { id: 'doing', title: '进行中', dotClass: 'bg-indigo-500' },
  { id: 'done', title: '已完成', dotClass: 'bg-emerald-500' }
];

// --- Helpers ---
const getPhaseTasks = (phase) => tasks.value.filter(t => t.phase === phase);

const getColumnTasks = (status) => {
  return tasks.value.filter(t => t.phase === currentPhase.value && (t.status || 'todo') === status);
};

const getPhaseStats = (phase) => {
  const pTasks = getPhaseTasks(phase);
  const done = pTasks.filter(t => t.status === 'done').length;
  return `${done}/${pTasks.length}`;
};

const getPhaseProgress = (phase) => {
  const pTasks = getPhaseTasks(phase);
  if (!pTasks.length) return 0;
  const done = pTasks.filter(t => t.status === 'done').length;
  return Math.round((done / pTasks.length) * 100);
};

const getPhaseStepClass = (phase) => {
  const isActive = currentPhase.value === phase;
  if (isActive) return 'border-indigo-600 text-indigo-600 shadow-md scale-110';
  return 'border-slate-200 text-slate-400';
};

const hasTaskTitle = (title) => {
  const key = String(title || '').trim().toLowerCase();
  return tasks.value.some(t => String(t.title).trim().toLowerCase() === key);
};

const formatDeadline = (value) => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const assigneeOptions = computed(() => {
  const list = (members.value || [])
    .map(member => member?.name || member?.email || (member?.id ? `成员${member.id}` : ''))
    .filter(Boolean);
  return Array.from(new Set(list));
});

const DEFAULT_DURATION_DAYS = 3;
const COMMAND_TIMEOUT_MS = 20000;

const normalizeDate = (value) => {
  if (!value) return '';
  return dayjs(value).format('YYYY-MM-DD');
};

const parseDateToken = (raw) => {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const today = dayjs();
  if (/今天/.test(text)) return today;
  if (/明天/.test(text)) return today.add(1, 'day');
  if (/后天/.test(text)) return today.add(2, 'day');

  let match = text.match(/(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/);
  if (match) return dayjs(`${match[1]}-${match[2]}-${match[3]}`, 'YYYY-M-D');

  match = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (match) return dayjs(`${match[1]}-${match[2]}-${match[3]}`, 'YYYY-M-D');

  match = text.match(/(\d{1,2})月(\d{1,2})日?/);
  if (match) return dayjs(`${today.year()}-${match[1]}-${match[2]}`, 'YYYY-M-D');

  return null;
};

const extractDates = (text) => {
  let start = null;
  let end = null;

  let match = text.match(/从(.+?)到(.+?)(?:完成|截止|之前|前|$)/);
  if (match) {
    start = parseDateToken(match[1]);
    end = parseDateToken(match[2]);
    return { start, end };
  }

  match = text.match(/(?:在|于)?(.+?)(?:前完成|截止|之前|前|到期|完成)/);
  if (match) {
    end = parseDateToken(match[1]);
    return { start, end };
  }

  match = text.match(/开始(?:于|在)?(.+?)(?:完成|截止|前|$)/);
  if (match) {
    start = parseDateToken(match[1]);
    return { start, end };
  }

  return { start, end };
};

const extractAssignee = (text) => {
  let match = text.match(/负责人[:：]?\s*([^\s,，。；;]+)/);
  if (match) return match[1];
  match = text.match(/由([^\s,，。；;]+)负责/);
  if (match) return match[1];
  return '';
};

const extractPhase = (text) => {
  if (/立项|m1/i.test(text)) return 'm1';
  if (/实施|m2/i.test(text)) return 'm2';
  if (/结题|m3/i.test(text)) return 'm3';
  return '';
};

const extractStatus = (text) => {
  if (/已完成|完成/.test(text)) return 'done';
  if (/进行中|在做|执行中/.test(text)) return 'doing';
  if (/待办|未开始|计划/.test(text)) return 'todo';
  return '';
};

const extractTitles = (text) => {
  let cleaned = String(text || '').trim();
  cleaned = cleaned.replace(/^请|帮我|请把|请将|把|将|需要|安排|设定|要求/g, '');

  const taskPartMatch = cleaned.match(/任务[:：]?(.*)/);
  if (taskPartMatch) cleaned = taskPartMatch[1];

  const cutMatch = cleaned.match(/^(.*?)(?:在|于|从|截止|之前|前|到期|完成|由|负责人)/);
  if (cutMatch && cutMatch[1]) cleaned = cutMatch[1];

  cleaned = cleaned.replace(/负责人[:：]?.*$/g, '');
  cleaned = cleaned.replace(/由.*负责/g, '');

  const parts = cleaned
    .split(/、|,|，|和|以及|及|与|&/g)
    .map(p => p.trim())
    .filter(Boolean);
  return parts;
};

const normalizePhaseInput = (value) => {
  if (!value) return '';
  const text = String(value).toLowerCase();
  if (text.includes('m1') || text.includes('立项')) return 'm1';
  if (text.includes('m2') || text.includes('实施')) return 'm2';
  if (text.includes('m3') || text.includes('结题')) return 'm3';
  return '';
};

const normalizeStatusInput = (value) => {
  if (!value) return '';
  const text = String(value).toLowerCase();
  if (text.includes('done') || text.includes('完成')) return 'done';
  if (text.includes('doing') || text.includes('进行')) return 'doing';
  if (text.includes('todo') || text.includes('待办') || text.includes('计划')) return 'todo';
  return '';
};

const extractJsonBlock = (raw) => {
  if (!raw) return '';
  const text = String(raw).replace(/```json|```/gi, '').trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return '';
  return text.slice(first, last + 1);
};

const parseAiUpdates = async (text) => {
  const today = dayjs().format('YYYY-MM-DD');
  const contextTasks = tasks.value.map(t => ({
    title: t.title,
    phase: t.phase,
    status: t.status,
    assignee: t.assignee || '',
    startDate: t.startDate || '',
    endDate: t.endDate || ''
  }));

  const system = [
    '你是任务规划解析器。',
    '只输出 JSON，不要任何解释。',
    '输出格式：{"updates":[{"title":"任务名","phase":"m1|m2|m3","status":"todo|doing|done","assignee":"姓名","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD"}]}',
    '如果信息缺失，请省略该字段。',
    '优先使用现有任务标题（完全匹配）。',
    '日期中允许今天/明天/后天/年月日，请转换为 YYYY-MM-DD。'
  ].join('\n');

  const user = [
    `今天日期：${today}`,
    `现有任务：${JSON.stringify(contextTasks)}`,
    `用户指令：${text}`
  ].join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COMMAND_TIMEOUT_MS);
  try {
    const res = await apiFetch('/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ] }),
      signal: controller.signal
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'AI 解析失败');
    const raw = data?.reply || '';
    const jsonBlock = extractJsonBlock(raw);
    if (!jsonBlock) throw new Error('AI 返回内容无法解析为 JSON');
    const parsed = JSON.parse(jsonBlock);
    const updates = Array.isArray(parsed?.updates) ? parsed.updates : [];
    return updates;
  } finally {
    clearTimeout(timer);
  }
};

const applyCommand = async () => {
  const text = commandText.value.trim();
  if (!text) return;
  commandStatus.value = { type: 'info', message: '解析中...' };

  let updates = [];
  try {
    updates = await parseAiUpdates(text);
  } catch (err) {
    commandStatus.value = { type: 'error', message: err.message || 'AI 解析失败' };
    return;
  }

  if (!updates.length) {
    commandStatus.value = { type: 'error', message: '未解析到任务更新' };
    return;
  }

  const fallbackPhase = viewMode.value === 'board' ? currentPhase.value : 'm1';
  const updatedTasks = [];

  updates.forEach((item) => {
    const title = String(item?.title || '').trim();
    if (!title) return;
    let task = tasks.value.find(t => String(t.title).trim() === title);
    if (!task) {
      task = {
        id: `temp-${Date.now()}-${Math.random()}`,
        title,
        phase: fallbackPhase,
        status: 'todo',
        output: '',
        assignee: '',
        startDate: '',
        endDate: ''
      };
      tasks.value.push(task);
    }

    const phase = normalizePhaseInput(item?.phase) || task.phase;
    const status = normalizeStatusInput(item?.status) || task.status;
    const assignee = item?.assignee ? String(item.assignee).trim() : task.assignee;

    let startDate = item?.startDate ? normalizeDate(item.startDate) : task.startDate;
    let endDate = item?.endDate ? normalizeDate(item.endDate) : task.endDate;
    if (startDate && !endDate) {
      endDate = normalizeDate(dayjs(startDate).add(DEFAULT_DURATION_DAYS, 'day'));
    }
    if (endDate && !startDate) {
      startDate = normalizeDate(dayjs(endDate).subtract(DEFAULT_DURATION_DAYS, 'day'));
    }

    task.phase = phase;
    task.status = status;
    task.assignee = assignee || '';
    task.startDate = startDate || '';
    task.endDate = endDate || '';

    updatedTasks.push(task);
  });

  for (const task of updatedTasks) {
    await persistTask(task);
  }

  commandStatus.value = { type: 'success', message: `已更新 ${updatedTasks.length} 项` };
  commandText.value = '';
};

// --- Actions ---
const startAdd = () => {
  isAdding.value = true;
  nextTick(() => newTaskInput.value?.focus());
};

const cancelAdd = () => {
  setTimeout(() => {
    if (!newTaskTitle.value) isAdding.value = false;
  }, 200);
};

const addTask = async () => {
  const title = newTaskTitle.value.trim();
  if (!title) {
    isAdding.value = false;
    return;
  }
  const newTask = {
    id: `temp-${Date.now()}`,
    title,
    phase: currentPhase.value,
    status: 'todo',
    output: '',
    assignee: '',
    startDate: '',
    endDate: ''
  };
  tasks.value.push(newTask);
  newTaskTitle.value = '';
  await persistTask(newTask);
};

const addPlanTask = async (e, phase) => {
  const title = e.target.value.trim();
  if (!title) return;
  
  const newTask = {
    id: `temp-${Date.now()}`,
    title,
    phase,
    status: 'todo',
    assignee: '',
    startDate: '',
    endDate: ''
  };
  tasks.value.push(newTask);
  e.target.value = '';
  await persistTask(newTask);
};

const markAllDone = async () => {
  if (!tasks.value.length) return;
  if (!confirm('确定将所有任务标记为已完成吗？')) return;
  tasks.value.forEach(task => {
    task.status = 'done';
  });
  await saveData();
};

const toggleTaskStatus = async (task) => {
  task.status = task.status === 'done' ? 'todo' : 'done';
  await saveData();
};

const deleteTask = async (task) => {
  if (!confirm('确定删除此任务吗？')) return;
  tasks.value = tasks.value.filter(t => t.id !== task.id);
  if (projectId.value && !task.id.startsWith('temp')) {
    try {
      await apiFetch(`/milestones/${task.id}`, { method: 'DELETE' });
    } catch(e) {}
  }
  notifyParent();
};

// --- Drag & Drop ---
const onDragStart = (e, task) => {
  e.dataTransfer.dropEffect = 'move';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('task-id', task.id);
};

const onDrop = async (e, status) => {
  const taskId = e.dataTransfer.getData('task-id');
  const task = tasks.value.find(t => t.id == taskId);
  if (task && task.status !== status) {
    task.status = status;
    await saveData();
  }
};

// --- Data Persistence ---
const loadData = async () => {
  if (!projectId.value) return; 
  try {
    const res = await apiFetch(`/projects/${projectId.value}/milestones`);
    const data = await res.json();
    tasks.value = (data.milestones || []).map(m => {
      let deliverables = {};
      try { deliverables = JSON.parse(m.deliverables || '{}'); } catch(e) {}
      return {
        id: m.id,
        title: m.title,
        phase: m.description || 'm1',
        status: mapBackendStatus(m.status),
        output: deliverables.output || '',
        action: deliverables.action || '',
        assignee: m.assignee || '',
        startDate: formatDeadline(m.start_date),
        endDate: formatDeadline(m.end_date || m.deadline)
      };
    });
  } catch (e) {
    console.error(e);
  }
};

const loadMembers = async () => {
  if (!projectId.value) {
    members.value = [];
    return;
  }
  try {
    const res = await apiFetch(`/projects/${projectId.value}`);
    const data = await res.json();
    members.value = Array.isArray(data?.members) ? data.members : [];
  } catch (e) {
    members.value = [];
  }
};

const saveData = async () => {
  if (!projectId.value) return;
  saving.value = true;
  for (const t of tasks.value) {
     if(!t.id.startsWith('temp')) await persistTask(t);
  }
  saving.value = false;
  notifyParent();
};

const persistTask = async (task, actionOverride = null) => {
  if (!projectId.value) return;
  saving.value = true;
  try {
    if (actionOverride) task.action = actionOverride;

    const payload = {
      title: task.title,
      description: task.phase,
      status: mapFrontendStatus(task.status),
      assignee: task.assignee || null,
      start_date: task.startDate || null,
      end_date: task.endDate || null,
      deadline: task.endDate || null,
      deliverables: JSON.stringify({ output: task.output, action: task.action })
    };
    
    if (task.id.startsWith('temp')) {
      const res = await apiFetch(`/projects/${projectId.value}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      task.id = data.id;
    } else {
      await apiFetch(`/milestones/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
    notifyParent();
  }
};

// AI Generation Logic Merged
const generateTasks = async () => {
  if (!brief.idea && !confirm('未填写构思，确定生成通用任务？')) return;
  
  const suggestions = [];
  const add = (title, phase, action) => suggestions.push({ title, phase, action });

  add('明确问题与目标', 'm1', 'charter');
  add('前期调研', 'm1', 'pre_research');
  add('文献阅读', 'm1', 'literature');

  if (brief.type === 'research') {
    add('实验设计', 'm2', 'pre_research');
    add('数据收集', 'm2', 'devlog');
    add('结果分析', 'm3', 'devlog');
    add('研究报告', 'm3', 'submission:final');
  } else if (brief.type === 'impact') {
    add('行动方案', 'm2', 'pre_research');
    add('执行记录', 'm2', 'devlog');
    add('影响评估', 'm3', 'submission:final');
    add('传播展示', 'm3', 'submission:final');
  } else {
    add('系统架构设计', 'm2', 'architect');
    add('核心功能开发', 'm2', 'devlog');
    add('系统测试', 'm2', 'devlog');
    add('演示视频', 'm3', 'submission:milestone_2');
    add('结题答辩', 'm3', 'submission:final');
  }

  for (const item of suggestions) {
    if (!hasTaskTitle(item.title)) {
      const newTask = {
        id: `temp-${Date.now()}-${Math.random()}`,
        title: item.title,
        phase: item.phase,
        status: 'todo',
        output: '',
        assignee: '',
        startDate: '',
        endDate: ''
      };
      tasks.value.push(newTask);
      // Pass the specific action to persistTask
      await persistTask(newTask, item.action);
    }
  }
  showBrief.value = false; // Auto collapse after generation
};

const clearTasks = async () => {
  if (!confirm('确定清空所有任务吗？此操作不可恢复。')) return;
  saving.value = true;
  for (const task of [...tasks.value]) {
    await deleteTask(task); // Re-use delete logic
  }
  tasks.value = [];
  saving.value = false;
};

// --- Navigation Helpers ---
const ACTIONS = {
  charter: { label: '立项书', hint: '去完善立项书' },
  pre_research: { label: '去调研', hint: '进入调研工具' },
  literature: { label: '去阅读', hint: '进入文献工具' },
  innovation: { label: '去创新', hint: '进入创新工具' },
  architect: { label: '画架构', hint: '进入架构设计' },
  kanban: { label: '看进度', hint: '查看看板' },
  devlog: { label: '写日志', hint: '记录实施日志' }
};

const STAGE_LABELS = {
  proposal: '提交开题',
  milestone_1: '提交 M1',
  midterm: '提交中期',
  milestone_2: '提交 M2',
  final: '提交结题'
};

function inferActionFromTitle(title, phase) {
  const text = String(title || '');
  if (/调研|问卷/.test(text)) return 'pre_research';
  if (/文献|阅读/.test(text)) return 'literature';
  if (/创新/.test(text)) return 'innovation';
  if (/架构|设计/.test(text)) return 'architect';
  if (/代码|开发|测试/.test(text)) return 'devlog';
  if (/视频/.test(text)) return 'submission:milestone_2';
  if (/结题|报告/.test(text)) return 'submission:final';
  return 'kanban';
}

function resolveAction(task) {
  let rawKey = task.action;
  if (!rawKey) rawKey = inferActionFromTitle(task.title, task.phase);
  
  if (rawKey && rawKey.startsWith('submission:')) {
    const stage = rawKey.split(':')[1] || 'final';
    return { type: 'stage', key: stage, label: STAGE_LABELS[stage] || '去提交', hint: '提交阶段成果' };
  }
  const config = ACTIONS[rawKey] || ACTIONS.kanban;
  return { type: 'tool', key: rawKey, label: config.label, hint: config.hint };
}

function goNext(task) {
  const action = resolveAction(task);
  if (!projectId.value) return;
  if (action.type === 'stage') {
     router.push({ path: '/workspace', query: { project: projectId.value, stage: action.key }});
  } else {
     router.push({ path: `/tools/${action.key}`, query: { project: projectId.value }});
  }
}

function openEdit(task) {
  // Placeholder for future detail view
}

// --- Mappers ---
function mapBackendStatus(s) {
  if (['todo', 'doing', 'done'].includes(s)) return s;
  if (s === 'completed' || s === 'approved') return 'done';
  if (s === 'in_progress') return 'doing';
  return 'todo';
}

function mapFrontendStatus(s) { return s; }

function tryParseOutput(str) {
  try { return JSON.parse(str).output || ''; } catch { return ''; }
}

function notifyParent() {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'wbs-updated', projectId: projectId.value }, window.location.origin);
    }
  } catch(e) {}
}

watch(() => projectId.value, () => {
  loadData();
  loadMembers();
}, { immediate: true });
</script>

<style scoped>
.h-full {
  background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.03), transparent 30%);
}
.bg-white {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(20px);
}
.bg-slate-100\/50 {
  background: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 24px !important;
}
.bg-white.p-4 {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.7) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02) !important;
  border-radius: 18px !important;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.bg-white.p-4:hover {
  transform: translateY(-3px) scale(1.01);
  border-color: rgba(99, 102, 241, 0.3) !important;
  box-shadow: 0 15px 30px rgba(99, 102, 241, 0.06) !important;
}
</style>

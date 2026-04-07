<template>
  <div class="workspace-root selection:bg-indigo-100 selection:text-indigo-900 bg-slate-50 min-h-screen">
    <div v-if="projectId" class="flex h-screen overflow-hidden">
      <WorkspaceSidebar
        :project-id="projectId"
        :project-title="projectTitle"
        :projects="projects"
        :show-project-menu="showProjectMenu"
        :nav-structure="navStructure"
        :collapsed-groups="collapsedGroups"
        :current-user="currentUser"
        :view-mode="viewMode"
        :current-tool="currentTool"
        :active-stage="activeStage"
        class="w-72 flex-shrink-0"
        @toggle-project-menu="showProjectMenu = !showProjectMenu"
        @switch-project="switchProject"
        @toggle-group="toggleGroup"
        @nav-click="handleNavClick"
        @logout="logout"
      />

      <div class="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        <WorkspaceHeader
          :view-title="viewTitle"
          :current-phase-index="currentPhaseIndex"
          :view-mode="viewMode"
          :current-tool="currentTool"
          :active-stage="activeStage"
          :proposal-ready="proposalStatus.ready"
          @set-submission-view="setSubmissionView"
          @set-tool-view="setToolView"
          @clear-draft="clearCurrentDraft"
        />

        <main class="flex-1 overflow-y-auto custom-scrollbar relative">
          <template v-if="viewMode === 'tool'">
            <div v-if="currentTool === 'inception'" class="p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
              <div class="bg-slate-900 p-12 lg:p-20 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
                <div class="flex items-center justify-between relative z-10">
                  <div>
                    <h2 class="text-4xl lg:text-5xl font-black mb-4">立项导航中心</h2>
                    <p class="text-lg text-slate-300 font-medium italic">伟大的创新源于严谨的学术规划。完成核心任务，系统将为生成开题报告。</p>
                  </div>
                  <button @click="openFirstMissing" class="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black shadow-xl hover:bg-slate-50 transition-all active:scale-95">
                    立即开始学术规划
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="premium-card lg:col-span-2 !bg-white">
                  <div class="flex items-center justify-between mb-8">
                    <div>
                      <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">关键里程碑</h3>
                      <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Inception Milestones</p>
                    </div>
                    <div class="text-right">
                      <div class="text-2xl font-black text-indigo-600 leading-none">{{ inceptionPercent }}%</div>
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Overall Progress</div>
                    </div>
                  </div>
                  <div class="relative h-4 bg-slate-100 rounded-full overflow-hidden mb-10 shadow-inner">
                    <div class="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 ease-out" :style="{ width: inceptionPercent + '%' }">
                      <div class="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.1)_50%,rgba(255,255,255,.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_2s_linear_infinite]"></div>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="(item, idx) in inceptionItems" :key="item.key" 
                      class="flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group cursor-pointer"
                      :class="item.done ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50/50 border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5'"
                      @click="openInceptionItem(item)"
                    >
                      <div class="flex items-center gap-4">
                        <div class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-500"
                          :class="item.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white text-slate-400 border border-slate-100 group-hover:text-indigo-600'">
                          <i v-if="item.done" class="fas fa-check"></i>
                          <span v-else>{{ idx + 1 }}</span>
                        </div>
                        <span class="text-xs font-bold transition-colors" :class="item.done ? 'text-emerald-700' : 'text-slate-600 group-hover:text-slate-900'">{{ item.label }}</span>
                      </div>
                      <i v-if="!item.done" class="fas fa-arrow-right text-[10px] text-slate-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all"></i>
                    </div>
                  </div>
                </div>

                <div class="premium-card !bg-white space-y-8">
                  <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">评审状态</h3>
                  <div class="text-center py-6">
                    <div class="w-20 h-20 rounded-[24px] mx-auto mb-6 flex items-center justify-center transition-all duration-700"
                      :class="proposalStatus.ready ? 'bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 rotate-12 scale-110' : 'bg-slate-100 text-slate-300'">
                      <i class="fas text-3xl" :class="proposalStatus.ready ? 'fa-check-double' : 'fa-lock'"></i>
                    </div>
                    <div class="text-lg font-black text-slate-900 mb-2">{{ proposalStatus.ready ? '一切就绪' : '尚在筹备中' }}</div>
                    <p class="text-xs text-slate-400 font-medium leading-relaxed">
                      {{ proposalStatus.ready ? '你已经完成了所有核心规划任务，快去提交评审吧！' : '由于立项关键任务尚未全部完成，开题报告提交通路暂时锁定。' }}
                    </p>
                  </div>
                  <button 
                    class="w-full py-4 rounded-2xl text-xs font-black tracking-widest uppercase transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none"
                    :class="proposalStatus.ready ? 'bg-slate-900 text-white hover:bg-black hover:shadow-slate-400' : 'bg-slate-100 text-slate-400'"
                    :disabled="!proposalStatus.ready" 
                    @click="setSubmissionView('proposal')"
                  >
                    <i class="fas fa-paper-plane"></i> 提交评审申请
                  </button>
                </div>
              </div>
            </div>

            <div v-else-if="currentTool === 'implementation'" class="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 animate-reveal">
              <header class="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-slate-100 pb-12 mb-4">
                <div class="max-w-xl">
                  <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                    <i class="fas fa-layer-group"></i> Phase 2: Implementation
                  </div>
                  <h2 class="text-4xl font-black text-slate-900 tracking-tight mb-3">项目实施工作台</h2>
                  <p class="text-base text-slate-500 font-medium leading-relaxed">记录每一个微小的技术突破，让创意从代码构思转化为现实成果。</p>
                </div>
                <div class="flex items-center gap-4 bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm">
                   <button class="px-6 py-3 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200" @click="setToolView('devlog')">记录学术日志</button>
                   <button class="px-6 py-3 rounded-2xl bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95" @click="setToolView('kanban')">访问敏捷看板</button>
                </div>
              </header>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div class="premium-card lg:col-span-2 !bg-white">
                  <div class="flex items-center justify-between mb-10">
                     <div class="flex items-center gap-3">
                        <div class="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
                        <h3 class="text-base font-black text-slate-900 uppercase tracking-widest">实施步履轨迹</h3>
                     </div>
                     <div class="flex items-center gap-8">
                        <div class="text-center">
                          <div class="text-2xl font-black text-slate-900 leading-none">{{ milestoneCounts.done }}</div>
                          <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">已攻克</div>
                        </div>
                        <div class="text-center">
                          <div class="text-2xl font-black text-indigo-600 leading-none">{{ milestonePercent }}%</div>
                           <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">总体效能</div>
                        </div>
                     </div>
                  </div>
                  
                  <div class="space-y-4">
                     <div v-for="task in milestoneTodo" :key="task.id" class="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-200 transition-all group">
                        <div class="w-1.5 h-6 rounded-full" :class="`bg-indigo-600`"></div>
                        <div class="flex-1 min-w-0">
                           <div class="text-xs font-black text-slate-900 mb-0.5 truncate">{{ task.title }}</div>
                           <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ phaseLabel(task.phase) }} · {{ task.statusLabel }}</div>
                        </div>
                        <i class="fas fa-arrow-right text-[10px] text-slate-300 group-hover:text-indigo-600"></i>
                     </div>
                  </div>
                </div>

                <div class="space-y-8">
                  <div class="premium-card !bg-slate-900 !text-white overflow-hidden relative">
                    <div class="absolute top-0 right-0 p-4 opacity-5">
                      <i class="fab fa-git-alt text-6xl"></i>
                    </div>
                    <h3 class="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">云端代码仓库</h3>
                    <div v-if="repoUrl" class="text-xs font-mono bg-white/10 p-4 rounded-xl border border-white/10 break-all select-all">{{ repoUrl }}</div>
                    <div v-else class="text-xs text-white/40 italic">暂未绑定代码仓库，请在架构设计中配置。</div>
                  </div>

                  <div class="premium-card !bg-white">
                    <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">最近实施碎拍</h3>
                    <div class="space-y-6">
                      <div v-for="log in implementationLogsPreview" :key="log.id" class="relative pl-6 border-l-2 border-indigo-100 last:border-transparent pb-1">
                        <div class="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-indigo-500"></div>
                        <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">{{ formatDateTime(log.created_at) }}</div>
                        <div class="text-xs text-slate-600 font-medium leading-relaxed italic line-clamp-2">"{{ log.content }}"</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="currentTool === 'kanban'" class="h-full">
              <KanbanTool />
            </div>
            <div v-else-if="currentTool === 'gantt'" class="p-8 lg:p-12 h-full overflow-y-auto custom-scrollbar">
              <GanttChart :project-id="projectId" />
            </div>
            <iframe v-else class="w-full h-full border-none bg-white" :src="toolFrameSrc"></iframe>
          </template>

          <!-- 提交面板 -->
          <StageSubmissionPanel
            v-show="viewMode === 'stage'"
            :stage-config="stageConfig"
            :status-style="statusStyle"
            :status-meta="statusMeta"
            :latest-submission="latestSubmission"
            :proposal-status="proposalStatus"
            :active-stage="activeStage"
            :submitting="submitting"
            :form-details="formDetails"
            :files="files"
            :file-input-key="fileInputKey"
            :format-size="formatSize"
            @refresh-status="refreshStatus"
            @open-item="openInceptionItem"
            @submit-stage="submitStage"
            @file-change="handleFileChange"
          />
        </main>
      </div>
    </div>

    <!-- 项目广场入口 -->
    <ProjectPlaza
      v-else
      :projects="projects"
      :projects-loading="projectsLoading"
      :status-options="statusOptions"
      :plaza-keyword="plazaKeyword"
      :plaza-status="plazaStatus"
      :plaza-sort="plazaSort"
      :quick-create-title="quickCreateTitle"
      :creating-project="creatingProject"
      :quick-create-error="quickCreateError"
      :show-recent="showRecent"
      :recent-projects="recentProjects"
      :filtered-projects="filteredProjects"
      :last-visited-project-id="lastVisitedProjectId"
      :project-status-label="projectStatusLabel"
      :format-date="formatDate"
      @update:quickCreateTitle="quickCreateTitle = $event"
      @update:plazaKeyword="plazaKeyword = $event"
      @update:plazaStatus="plazaStatus = $event"
      @update:plazaSort="plazaSort = $event"
      @create-project="createProject"
      @switch-project="switchProject"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import GanttChart from '@/components/GanttChart.vue';
import ProjectPlaza from '@/components/workspace/ProjectPlaza.vue';
import StageSubmissionPanel from '@/components/workspace/StageSubmissionPanel.vue';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader.vue';
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar.vue';
import KanbanTool from '@/pages/tools/Kanban.vue';
import { apiFetch } from '@/api/client';
import { buildProposalStatus } from '@/modules/inception/proposal';
import { STAGE_CONFIG, getStageConfig, validateStageDetails } from '@/modules/workspace/stages';
import { buildProposalMarkdown } from '@/modules/workspace/report';
import { useAuthStore } from '@/stores/auth';
import { useProjectStore } from '@/stores/project';
import { useDraftStore } from '@/stores/draft';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.query.project);

const authStore = useAuthStore();
const projectStore = useProjectStore();
const draftStore = useDraftStore();

authStore.hydrate();

const { user: currentUser } = storeToRefs(authStore);
const {
  list: projects,
  listLoading: projectsLoading,
  detail: projectDetail,
  submissionIndex,
  milestones: milestoneList,
  milestonesLoading: milestoneLoading,
  logs: implementationLogs,
  logsLoading: logLoading,
  lastVisitedId: lastVisitedProjectId
} = storeToRefs(projectStore);
const draftMap = computed(() => draftStore.draftMap(projectId.value));

const showProjectMenu = ref(false);
const plazaKeyword = ref('');
const plazaStatus = ref('');
const plazaSort = ref('updated_desc');
const quickCreateTitle = ref('');
const creatingProject = ref(false);
const quickCreateError = ref('');

const viewMode = ref('tool');
const currentTool = ref('inception');
const toolPinned = ref(false);
const activeStage = ref('proposal');
const submitting = ref(false);
const statusVersion = ref(0);

const fileInputKey = ref(0);
const files = ref([]);
const formDetails = reactive({});
const draftTimer = ref(null);

// --- Nav Structure ---
const navStructure = ref([
  {
    id: 'overview',
    title: '项目概览',
    items: [
      { key: 'kanban', label: '任务规划 (Tasks)', icon: 'fas fa-tasks', action: 'tool', value: 'kanban' },
      { key: 'gantt', label: '进度甘特', icon: 'fas fa-stream', action: 'tool', value: 'gantt' }
    ]
  },
  {
    id: 'inception',
    title: '阶段一：立项',
    items: [
      { key: 'inception', label: '立项导航', icon: 'fas fa-compass', action: 'tool', value: 'inception' },
      { key: 'charter', label: '项目立项书', icon: 'fas fa-file-signature', action: 'tool', value: 'charter' },
      { key: 'pre_research', label: '前期调研', icon: 'fas fa-search', action: 'tool', value: 'pre_research' },
      { key: 'literature', label: '文献阅读', icon: 'fas fa-book-reader', action: 'tool', value: 'literature' },
      { key: 'innovation', label: '创新点梳理', icon: 'fas fa-lightbulb', action: 'tool', value: 'innovation' },
      { key: 'architect', label: '架构设计', icon: 'fas fa-sitemap', action: 'tool', value: 'architect' },
      { key: 'proposal_sub', label: '提交开题', icon: 'fas fa-clipboard-list', action: 'stage', value: 'proposal', isSubmission: true }
    ]
  },
  {
    id: 'implementation',
    title: '阶段二：实施',
    items: [
      { key: 'implementation', label: '实施导航', icon: 'fas fa-route', action: 'tool', value: 'implementation' },
      { key: 'devlog', label: '实施日志', icon: 'fas fa-pen-nib', action: 'tool', value: 'devlog' },
      { key: 'm1_sub', label: '提交里程碑1', icon: 'fas fa-flag', action: 'stage', value: 'milestone_1', isSubmission: true },
      { key: 'midterm_sub', label: '提交中期检查', icon: 'fas fa-clipboard-check', action: 'stage', value: 'midterm', isSubmission: true },
      { key: 'm2_sub', label: '提交里程碑2', icon: 'fas fa-flag', action: 'stage', value: 'milestone_2', isSubmission: true }
    ]
  },
  {
    id: 'conclusion',
    title: '阶段三：结题',
    items: [
      { key: 'final_sub', label: '结题答辩', icon: 'fas fa-trophy', action: 'stage', value: 'final', isSubmission: true }
    ]
  }
]);

const collapsedGroups = reactive({
  overview: false,
  inception: false,
  implementation: false,
  conclusion: false
});

function toggleGroup(id) {
  collapsedGroups[id] = !collapsedGroups[id];
}

function handleNavClick(item) {
  if (item.action === 'tool') {
    setToolView(item.value);
  } else if (item.action === 'stage') {
    setSubmissionView(item.value);
  }
}

// Update nav badges based on state
watch([submissionIndex, draftMap], () => {
  navStructure.value.forEach(group => {
    group.items.forEach(item => {
      if (item.isSubmission) {
        const key = item.value;
        const badges = getBadges();
        item.badge = badges[key] || null;
      }
    });
  });
}, { deep: true });

function getBadges() {
  const badges = {};
  Object.keys(STAGE_CONFIG).forEach(key => {
    const latest = submissionIndex.value[key];
    const draft = draftMap.value[key];
    if (latest) {
      const statusKey = mapSubmissionStatus(latest.status);
      if (statusKey === 'reviewed') {
        badges[key] = { label: '已评审', tone: 'badge-success' };
      } else if (statusKey === 'needs_changes') {
        badges[key] = { label: '需修改', tone: 'badge-danger' };
      } else {
        badges[key] = { label: '已提交', tone: 'badge-info' };
      }
      return;
    }
    if (draft) {
      badges[key] = { label: '草稿', tone: 'badge-warn' };
    }
  });
  return badges;
}
// --- End Nav Structure ---

const inceptionTips = {
  charter: '建议输出：一句话目标 + 用户画像 + 痛点 + 方案',
  pre_research: '建议输出：调研问题 + 方法 + 关键发现 + 下一步',
  literature: '建议输出：主题 + 文献/阅读笔记',
  innovation: '建议输出：创新点 + 对比 + 验证方式',
  wbs: '建议输出：≥5 条可执行任务，标注阶段',
  projects: '建议输出：团队成员与分工'
};

const STATUS_LABELS = {
  draft: '草稿',
  submitted: '已提交',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '需修改',
  in_progress: '进行中',
  midterm_review: '中期检查',
  final_review: '结题检查',
  archived: '已归档'
};

const statusOptions = computed(() => Object.keys(STATUS_LABELS).map(key => ({ value: key, label: STATUS_LABELS[key] })));

const sortedProjects = computed(() => {
  return [...projects.value].sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });
});

const filteredProjects = computed(() => {
  let list = [...projects.value];
  const keyword = plazaKeyword.value.trim().toLowerCase();
  if (keyword) {
    list = list.filter(item => {
      const title = String(item.title || '').toLowerCase();
      const summary = String(item.summary || '').toLowerCase();
      return title.includes(keyword) || summary.includes(keyword);
    });
  }
  if (plazaStatus.value) {
    list = list.filter(item => item.status === plazaStatus.value);
  }
  if (plazaSort.value === 'title_asc') {
    list.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'zh-Hans-CN'));
  } else if (plazaSort.value === 'created_desc') {
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  } else {
    list.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
  }
  return list;
});

const recentProjects = computed(() => sortedProjects.value.slice(0, 3));
const showRecent = computed(() => !plazaKeyword.value && !plazaStatus.value && plazaSort.value === 'updated_desc');

const stageConfig = computed(() => getStageConfig(activeStage.value));

const latestSubmission = computed(() => submissionIndex.value[activeStage.value] || null);

const proposalStatus = computed(() => {
  statusVersion.value;
  return applyToolActions(buildProposalStatus(projectId.value, projectDetail.value));
});

const inceptionItems = computed(() => proposalStatus.value?.items || []);
const inceptionDoneCount = computed(() => inceptionItems.value.filter(item => item.done).length);
const inceptionTotalCount = computed(() => Math.max(inceptionItems.value.length, 1));
const inceptionPercent = computed(() => Math.round((inceptionDoneCount.value / inceptionTotalCount.value) * 100));
const nextStep = computed(() => inceptionItems.value.find(item => !item.done) || null);
const deliverableType = computed(() => proposalStatus.value?.details?.deliverableType || 'engineering');
const wbsPreview = computed(() => (proposalStatus.value?.wbsTasks || []).slice(0, 6));
const repoUrl = computed(() => projectDetail.value?.project?.gitea_repo_url || getLastRepo());
const milestoneCounts = computed(() => {
  const counts = { total: 0, done: 0, doing: 0, review: 0, todo: 0 };
  milestoneList.value.forEach(item => {
    counts.total += 1;
    if (counts[item.status] !== undefined) {
      counts[item.status] += 1;
    }
  });
  return counts;
});
const milestonePercent = computed(() => {
  if (!milestoneCounts.value.total) return 0;
  return Math.round((milestoneCounts.value.done / milestoneCounts.value.total) * 100);
});
const milestoneTodo = computed(() => milestoneList.value.filter(item => item.status !== 'done').slice(0, 5));
const implementationLogsPreview = computed(() => implementationLogs.value.slice(0, 3));

const projectTitle = computed(() => projectDetail.value?.project?.title || '未选择项目');

const viewTitle = computed(() => {
  if (!projectId.value) return '项目广场';
  if (viewMode.value === 'tool') {
    const flat = navStructure.value.flatMap(g => g.items);
    const item = flat.find(i => i.value === currentTool.value && i.action === 'tool');
    return item ? item.label : '工作台';
  }
  return stageConfig.value.title || '提交评审';
});

const currentPhaseIndex = computed(() => {
   // Determine phase based on current view/stage
   if (viewMode.value === 'stage') {
     if (activeStage.value === 'proposal') return 0;
     if (['milestone_1', 'midterm', 'milestone_2'].includes(activeStage.value)) return 1;
     if (activeStage.value === 'final') return 2;
   }
   if (currentTool.value === 'inception') return 0;
   if (currentTool.value === 'implementation' || currentTool.value === 'kanban' || currentTool.value === 'devlog') return 1;
   
   // Check open group if tool not specific
   if (!collapsedGroups.inception) return 0;
   if (!collapsedGroups.implementation) return 1;
   if (!collapsedGroups.conclusion) return 2;
   return 0; 
});

const toolFrameSrc = computed(() => {
  if (!projectId.value) return '';
  const id = projectId.value;
  if (currentTool.value === 'architect') {
    return `/tools/architect?project=${id}`;
  }
  if (currentTool.value === 'gantt' || currentTool.value === 'kanban') {
    return ''; 
  }
  return `/tools/${currentTool.value}?project=${id}`;
});

const statusStyle = computed(() => {
  const latest = latestSubmission.value;
  const draft = draftMap.value[activeStage.value];
  if (latest) {
    const statusKey = mapSubmissionStatus(latest.status);
    return STATUS_STYLE[statusKey] || STATUS_STYLE.pending;
  }
  if (draft?.savedAt) {
    return STATUS_STYLE.draft;
  }
  return STATUS_STYLE.pending;
});

const statusMeta = computed(() => {
  const latest = latestSubmission.value;
  const draft = draftMap.value[activeStage.value];
  if (latest) {
    const submittedAt = latest.created_at ? `提交于 ${formatDateTime(latest.created_at)}` : '';
    const draftAt = draft?.savedAt ? `草稿已保存 ${formatDateTime(draft.savedAt)}` : '';
    return [submittedAt, draftAt].filter(Boolean).join(' · ');
  }
  if (draft?.savedAt) {
    return `保存于 ${formatDateTime(draft.savedAt)}`;
  }
  return '尚未提交，建议先保存草稿';
});

async function loadProjects() {
  await projectStore.fetchList();
}

async function createProject() {
  const title = quickCreateTitle.value.trim();
  if (!title) {
    quickCreateError.value = '请输入项目名称';
    return;
  }
  quickCreateError.value = '';
  creatingProject.value = true;
  try {
    const project = await projectStore.create(title);
    quickCreateTitle.value = '';
    if (project?.id) {
      switchProject(project.id);
    }
  } catch (err) {
    quickCreateError.value = err.message || '创建失败';
  } finally {
    creatingProject.value = false;
  }
}

function switchProject(id) {
  showProjectMenu.value = false;
  toolPinned.value = false;
  projectStore.setLastVisited(id);
  router.replace({ path: '/workspace', query: { project: id } });
}

function setToolView(tool) {
  currentTool.value = tool;
  viewMode.value = 'tool';
  toolPinned.value = true;
  if (tool === 'implementation') {
    refreshImplementationData();
  }
}

function setSubmissionView(stageKey) {
  activeStage.value = stageKey;
  viewMode.value = 'stage';
  resetForm(stageKey);
}

function applyRouteView() {
  const stage = route.query.stage;
  const tool = route.query.tool;
  if (stage && STAGE_CONFIG[stage]) {
    setSubmissionView(stage);
    return;
  }
  if (tool) {
    setToolView(tool);
  }
}

function openInceptionItem(item) {
  if (!item) return;
  const key = item.actionKey || item.action;
  if (key === 'projects') {
    router.push('/projects');
    return;
  }
  if (key) {
    setToolView(key);
  }
}

function openFirstMissing() {
  if (proposalStatus.value?.ready) {
    setSubmissionView('proposal');
    return;
  }
  const next = nextStep.value || inceptionItems.value[0];
  if (next) {
    openInceptionItem(next);
  }
}

function phaseLabel(phase) {
  const map = { m1: '立项', m2: '实施', m3: '结题' };
  return map[phase] || phase || '任务';
}

function milestoneStatusTone(status) {
  const map = { todo: 'status-pending', doing: 'status-doing', review: 'status-review', done: 'status-done' };
  return map[status] || 'status-pending';
}

function previewText(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length > 64 ? `${clean.slice(0, 64)}...` : clean;
}

function applyToolActions(result) {
  if (!result?.items) return result;
  return {
    ...result,
    items: result.items.map(item => {
      return {
        ...item,
        actionKey: item.actionKey || item.action
      };
    })
  };
}

function indexSubmissions(submissions = []) {
  const map = {};
  submissions.forEach(sub => {
    if (!sub?.type) return;
    const current = map[sub.type];
    if (!current || new Date(sub.created_at) > new Date(current.created_at)) {
      map[sub.type] = sub;
    }
  });
  return map;
}

function mapSubmissionStatus(status) {
  if (status === 'reviewed') return 'reviewed';
  if (status === 'needs_changes') return 'needs_changes';
  if (status === 'submitted' || status === 'reviewing') return 'submitted';
  return 'submitted';
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const pad = num => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  const pad = num => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function projectStatusLabel(status) {
  return STATUS_LABELS[status] || status || '进行中';
}

function formatSize(bytes) {
  if (!bytes) return '0B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let idx = 0;
  let size = bytes;
  while (size >= 1024 && idx < units.length - 1) {
    size /= 1024;
    idx += 1;
  }
  return `${size.toFixed(1)}${units[idx]}`;
}

async function fetchMilestones() {
  await projectStore.fetchMilestones(projectId.value);
  refreshStatus();
}

async function fetchDevLogs() {
  await projectStore.fetchLogs(projectId.value);
}

async function refreshImplementationData() {
  await projectStore.refreshImplementationData(projectId.value);
  refreshStatus();
}

function applyDefaultTool() {
  if (toolPinned.value) return;
  const hasProposal = Boolean(submissionIndex.value?.proposal);
  currentTool.value = hasProposal ? 'kanban' : 'inception';
  // Auto-expand relevant group
  if (hasProposal) {
    collapsedGroups.overview = false;
    collapsedGroups.implementation = false;
    collapsedGroups.inception = true;
  } else {
    collapsedGroups.inception = false;
    collapsedGroups.implementation = true;
  }
}

async function fetchProjectDetail() {
  if (!projectId.value) return;
  try {
    await projectStore.fetchDetail(projectId.value);
    refreshDraftCache();
    applyDefaultTool();
    await refreshImplementationData();
  } catch (err) {
    console.error(err);
  }
}

function refreshDraftCache() {
  draftStore.refreshProjectDrafts(projectId.value, Object.keys(STAGE_CONFIG));
}

function refreshStatus() {
  refreshDraftCache();
  statusVersion.value += 1;
}

function resetForm(stageKey) {
  files.value = [];
  fileInputKey.value += 1;
  Object.keys(formDetails).forEach(key => delete formDetails[key]);
  if (stageKey === 'proposal') return;
  const config = getStageConfig(stageKey);
  const draft = draftMap.value[stageKey] || null;
  const latest = submissionIndex.value[stageKey];
  const details = draft?.details || latest?.details || {};
  config.fields.forEach(field => {
    formDetails[field.name] = details[field.name] || '';
  });
  if (!formDetails.codeRepo) {
    const repo = getLastRepo();
    if (repo) formDetails.codeRepo = repo;
  }
}

function getLastRepo() {
  const submissions = projectDetail.value?.submissions || [];
  for (const sub of submissions) {
    const repo = sub?.details?.codeRepo;
    if (repo) return repo;
  }
  return '';
}

function scheduleDraftSave() {
  if (!projectId.value || activeStage.value === 'proposal') return;
  if (draftTimer.value) clearTimeout(draftTimer.value);
  draftTimer.value = setTimeout(() => {
    draftStore.saveProjectDraft(projectId.value, activeStage.value, { ...formDetails });
  }, 600);
}

function clearCurrentDraft() {
  if (!projectId.value || activeStage.value === 'proposal') return;
  draftStore.clearProjectDraft(projectId.value, activeStage.value);
  resetForm(activeStage.value);
}

function handleFileChange(event) {
  const input = event.target;
  files.value = Array.from(input.files || []);
}

async function saveProjectBlueprint(details, wbsTasks) {
  if (!projectId.value) return;
  const payload = {
    strategy: {
      problem: details.problem || '',
      goals: details.goals || '',
      scope: details.scope || '',
      approach: details.approach || '',
      innovation: details.innovation || '',
      innovationProof: details.innovationProof || '',
      researchMethods: details.researchMethods || '',
      deliverableType: details.deliverableType || ''
    },
    wbs: wbsTasks || []
  };
  try {
    await apiFetch(`/projects/${projectId.value}/blueprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error(err);
  }
}

async function syncMilestonesFromWbs(wbsTasks) {
  if (!projectId.value || !wbsTasks?.length) return;
  try {
    const res = await apiFetch(`/projects/${projectId.value}/milestones`);
    const data = await res.json();
    if (res.ok && Array.isArray(data.milestones) && data.milestones.length) {
      return;
    }
  } catch (err) {}

  for (const task of wbsTasks) {
    try {
      await apiFetch(`/projects/${projectId.value}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task.title, phase: task.phase, output: task.output })
      });
    } catch (err) {
      console.error(err);
    }
  }
}

async function submitStage() {
  if (!projectId.value) return;
  const stageKey = activeStage.value;
  const config = getStageConfig(stageKey);
  let details = { ...formDetails };
  let content = '';

  if (stageKey === 'proposal') {
    details = {
      ...proposalStatus.value.details,
      wbs: proposalStatus.value.wbsTasks || [],
      plan: proposalStatus.value.planText || ''
    };
    content = buildProposalMarkdown(details, details.wbs || []);
  }

  const validationError = validateStageDetails(stageKey, details, proposalStatus.value);
  if (validationError) {
    window.alert(validationError);
    return;
  }

  submitting.value = true;
  try {
    const formData = new FormData();
    formData.append('type', stageKey);
    formData.append('title', config.title || '提交评审');
    formData.append('details', JSON.stringify(details));
    if (content) formData.append('content', content);
    files.value.forEach(file => formData.append('attachments', file));

    const res = await apiFetch(`/projects/${projectId.value}/submissions`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '提交失败');

    if (stageKey === 'proposal') {
      await saveProjectBlueprint(details, details.wbs || []);
      await syncMilestonesFromWbs(details.wbs || []);
    }

    draftStore.clearProjectDraft(projectId.value, stageKey);
    await fetchProjectDetail();
    window.alert('提交成功');
  } catch (err) {
    window.alert(err.message || '提交失败');
  } finally {
    submitting.value = false;
  }
}

function handleFocus() {
  refreshStatus();
  refreshImplementationData();
}

function handleMessage(event) {
  if (event.origin !== window.location.origin) return;
  const data = event.data || {};
  if (data.type === 'wbs-updated') {
    if (!data.projectId || String(data.projectId) === String(projectId.value || '')) {
      refreshStatus();
    }
  }
}

function logout() {
  authStore.logout();
  router.replace('/login');
}

onMounted(async () => {
  authStore.hydrate();
  const user = authStore.user;
  if (!user) {
    const redirect = projectId.value ? `/workspace?project=${projectId.value}` : '/workspace';
    authStore.setRedirect(redirect);
    router.replace('/login');
    return;
  }
  await loadProjects();
  await fetchProjectDetail();
  refreshStatus();
  applyRouteView();
  window.addEventListener('focus', handleFocus);
  window.addEventListener('message', handleMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener('focus', handleFocus);
  window.removeEventListener('message', handleMessage);
  if (draftTimer.value) clearTimeout(draftTimer.value);
});

watch(
  () => projectId.value,
  async () => {
    toolPinned.value = false;
    await fetchProjectDetail();
    refreshStatus();
    applyRouteView();
  }
);

watch(
  () => route.query.stage,
  () => {
    applyRouteView();
  }
);

watch(
  () => route.query.tool,
  () => {
    applyRouteView();
  }
);

watch(
  formDetails,
  () => {
    scheduleDraftSave();
  },
  { deep: true }
);

const STATUS_STYLE = {
  pending: {
    title: '待提交',
    banner: 'status-pending',
    icon: 'status-icon-pending',
    iconHtml: '<i class="fas fa-circle"></i>'
  },
  draft: {
    title: '草稿已保存',
    banner: 'status-draft',
    icon: 'status-icon-draft',
    iconHtml: '<i class="fas fa-save"></i>'
  },
  submitted: {
    title: '已提交',
    banner: 'status-submitted',
    icon: 'status-icon-submitted',
    iconHtml: '<i class="fas fa-paper-plane"></i>'
  },
  reviewed: {
    title: '已评审',
    banner: 'status-reviewed',
    icon: 'status-icon-reviewed',
    iconHtml: '<i class="fas fa-check-circle"></i>'
  },
  needs_changes: {
    title: '需修改',
    banner: 'status-needs',
    icon: 'status-icon-needs',
    iconHtml: '<i class="fas fa-exclamation-circle"></i>'
  }
};
</script>

<style scoped>
.workspace-root {
  height: 100vh;
  background: var(--bg-app);
  display: flex;
  flex-direction: column;
}

.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  grid-template-rows: var(--header-h) 1fr;
  height: 100%;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  grid-row: 1 / -1;
  background: var(--bg-card);
  border-right: 1px solid var(--border-main);
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.sidebar-header {
  height: var(--header-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  border-bottom: 1px solid var(--border-main);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.025em;
  font-size: 1.1rem;
}

.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 100%);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 14px;
}

.home-link {
  color: var(--text-muted);
  transition: color 0.2s;
  padding: 8px;
}
.home-link:hover {
  color: var(--primary-600);
}

/* Project Switcher */
.project-switcher {
  padding: 1.25rem 1rem 0.5rem;
  position: relative;
}

.switcher-btn {
  width: 100%;
  background: var(--bg-app);
  border: 1px solid var(--border-main);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.switcher-btn:hover {
  background: white;
  border-color: var(--primary-100);
  box-shadow: var(--shadow-card);
}

.switcher-meta {
  flex: 1;
  min-width: 0;
}

.switcher-label {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.switcher-name {
  font-weight: 600;
  color: var(--text-main);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.switcher-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 16px;
  right: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 12px;
  box-shadow: var(--shadow-hover);
  z-index: 50;
  animation: slideDown 0.1s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.switcher-list {
  max-height: 280px;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.switcher-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  color: var(--text-secondary);
}

.switcher-item:hover {
  background: var(--bg-app);
  color: var(--text-main);
}

.switcher-footer {
  border-top: 1px solid var(--border-subtle);
  padding: 8px;
}

.new-project {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  border: 1px dashed var(--text-muted);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}
.new-project:hover {
  border-color: var(--primary-500);
  color: var(--primary-600);
  background: var(--primary-50);
}

/* Nav */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1rem 1.5rem;
}

.nav-group {
  margin-bottom: 4px;
}

.nav-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  cursor: pointer;
  user-select: none;
  transition: color 0.2s;
}
.nav-group-header:hover {
  color: var(--text-main);
}

.group-arrow {
  transition: transform 0.2s;
  font-size: 0.7rem;
}
.group-arrow.rotated {
  transform: rotate(-90deg);
}

.nav-group-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  gap: 0.75rem;
  border: 1px solid transparent;
}

.nav-item:hover {
  background-color: var(--bg-app);
  color: var(--text-main);
}

.nav-item.active {
  background-color: var(--primary-50);
  color: var(--primary-700);
  font-weight: 600;
  border-color: var(--primary-100);
}

.nav-item i {
  width: 1.25rem;
  text-align: center;
  font-size: 1rem;
  opacity: 0.7;
}
.nav-item.active i {
  opacity: 1;
}

.stage-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.badge-success { background: #dcfce7; color: #166534; }
.badge-danger { background: #fee2e2; color: #991b1b; }
.badge-info { background: #e0e7ff; color: #3730a3; }
.badge-warn { background: #fef3c7; color: #92400e; }

/* Sidebar Footer */
.sidebar-footer {
  border-top: 1px solid var(--border-main);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--bg-card);
}

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-app);
  object-fit: cover;
  border: 1px solid var(--border-main);
}

.name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
}

.logout {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}
.logout:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* Header */
.header {
  grid-column: 2;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-main);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  z-index: 10;
  position: sticky;
  top: 0;
}

.header-left {
  flex: 1;
}
.header-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-main);
}

.header-actions {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Phase Stepper */
.phase-stepper {
  display: flex;
  align-items: center;
  gap: 4px;
}
.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.4;
  transition: opacity 0.3s;
}
.step-item.active {
  opacity: 1;
}
.step-item.completed {
  opacity: 1;
}
.step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--bg-app);
  color: var(--text-muted);
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid var(--border-main);
}
.step-item.active .step-dot {
  background: var(--primary-600);
  color: #fff;
  border-color: var(--primary-600);
  box-shadow: 0 0 0 3px var(--primary-100);
}
.step-item.completed .step-dot {
  background: #10b981;
  color: #fff;
  border-color: #10b981;
}
.step-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-main);
}
.step-line {
  width: 40px;
  height: 2px;
  background: var(--border-main);
  margin: 0 8px;
  border-radius: 999px;
}
.step-item.completed .step-line {
  background: #10b981;
}

/* Main Canvas */
.main-canvas {
  grid-column: 2;
  grid-row: 2;
  position: relative;
  overflow: hidden;
  background-color: var(--bg-app);
  padding: 0;
}

.tool-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

/* Stage & Forms */
.stage-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-card);
  box-shadow: 0 0 40px rgba(0,0,0,0.02);
}

.stage-header {
  margin-bottom: 2rem;
  text-align: center;
}
.stage-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 0.75rem;
  letter-spacing: -0.025em;
}

.stage-desc {
  color: var(--text-secondary);
  font-size: 1rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Status Banner */
.status-banner {
  border-radius: 12px;
  border: 1px solid transparent;
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px;
  margin-bottom: 2rem;
}
.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 18px;
}
.status-title { font-weight: 600; }
.status-meta { font-size: 12px; color: var(--text-secondary); }
.status-pending { border-color: var(--border-main); background: var(--bg-app); }
.status-draft { border-color: #fde68a; background: #fffbeb; }
.status-submitted { border-color: var(--primary-100); background: var(--primary-50); }
.status-reviewed { border-color: #bbf7d0; background: #ecfdf3; }
.status-needs { border-color: #fecdd3; background: #fff1f2; }
.status-icon-pending { background: var(--border-main); color: var(--text-secondary); }
.status-icon-draft { background: #fef3c7; color: #b45309; }
.status-icon-submitted { background: var(--primary-100); color: var(--primary-700); }
.status-icon-reviewed { background: #dcfce7; color: #15803d; }
.status-icon-needs { background: #fee2e2; color: #b91c1c; }

.feedback-card {
  border: 1px solid #fde68a;
  background: #fffbeb;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 1.5rem;
}
.feedback-title { font-weight: 600; margin-bottom: 4px; }
.feedback-body { font-size: 13px; color: #7c2d12; white-space: pre-wrap; }

.proposal-wrapper { display: grid; gap: 16px; }
.proposal-actions { display: flex; justify-content: flex-end; }

.stage-form { display: grid; gap: 16px; }
.form-grid { display: grid; gap: 16px; }
.form-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--border-main);
  border-radius: 0.5rem;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}
.form-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-50);
}
.form-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.4rem;
}
.textarea { min-height: 120px; resize: vertical; }
.required { color: #ef4444; margin-left: 4px; }

.attachments {
  border: 1px dashed var(--border-main);
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 8px;
}
.attachments-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}
.file-list { display: grid; gap: 6px; }
.file-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-app);
  padding: 6px 8px;
  border-radius: 8px;
}
.file-name { color: var(--text-main); }
.form-actions { display: flex; justify-content: flex-end; }

/* Inception / Implementation Dashboards */
.inception-canvas,
.implementation-canvas {
  height: 100%;
  overflow-y: auto;
  padding: 2.5rem;
  background: var(--bg-app);
}

.inception-hero,
.implementation-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-main);
  padding-bottom: 2rem;
}

.hero-kicker {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--primary-600);
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

.inception-hero h2,
.implementation-hero h2 {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.inception-hero p,
.implementation-hero p {
  color: var(--text-secondary);
  font-size: 1rem;
  margin-top: 0.5rem;
  max-width: 600px;
}

.inception-grid,
.implementation-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  margin-bottom: 24px;
}

.inception-body,
.implementation-body {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  align-items: start;
}

.inception-card,
.impl-card {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-main);
  padding: 20px;
  display: grid;
  gap: 16px;
  box-shadow: var(--shadow-card);
  transition: transform 0.2s, box-shadow 0.2s;
}

.inception-card:hover,
.impl-card:hover {
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-100);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.card-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.percent {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary-600);
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  height: 8px;
  background: var(--bg-app);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-600);
  border-radius: 999px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Tasks */
.task-item,
.log-item,
.impl-task {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 16px;
  background: var(--bg-card);
  transition: border-color 0.2s;
}
.task-item:hover,
.log-item:hover {
  border-color: var(--border-main);
}
.task-item.done {
  background: var(--bg-app);
  opacity: 0.8;
}

.task-index {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--primary-50);
  color: var(--primary-700);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 11px;
}

.task-list {
  display: grid;
  gap: 8px;
}
.task-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}
.task-left {
  display: flex;
  gap: 12px;
  align-items: center;
}
.task-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
}

.pill {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
}
.pill--m1 { background: var(--primary-50); color: var(--primary-700); }
.pill--m2 { background: #fef3c7; color: #92400e; }
.pill--m3 { background: #dcfce7; color: #166534; }

/* Status Styles Refined */
.status-pending { background: var(--bg-app); color: var(--text-secondary); border: 1px solid var(--border-main); }
.status-done { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.status-doing { background: var(--primary-50); color: var(--primary-600); border: 1px solid var(--primary-100); }
.status-review { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }

.task-status {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}

/* Utilities */
.muted { color: var(--text-muted); font-size: 0.85rem; }
.warn { color: #ef4444; font-size: 0.85rem; }
.success { color: #059669; font-size: 0.85rem; }
.tip { color: var(--primary-600); font-size: 0.85rem; font-weight: 500; }
.empty { padding: 12px; text-align: center; color: var(--text-muted); font-size: 12px; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.repo-box {
  font-size: 12px;
  background: var(--bg-app);
  border: 1px dashed var(--border-main);
  padding: 8px;
  border-radius: 8px;
  color: var(--text-secondary);
  word-break: break-all;
}
.log-preview { display: grid; gap: 8px; }
.log-item { display: block; }
.log-meta { font-size: 10px; color: var(--text-muted); margin-bottom: 2px; }
.log-content { font-size: 0.85rem; color: var(--text-secondary); }
.impl-list { display: grid; gap: 8px; }
.impl-task {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
}
.impl-task-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}
.wbs-preview { display: grid; gap: 8px; }
.wbs-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.project-plaza {
  display: grid;
  gap: 24px;
  padding: 2.5rem;
}
.plaza-shell {
  min-height: 100vh;
  background: var(--bg-app);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
}
.plaza-shell .project-plaza {
  width: min(1200px, 92vw);
  margin: 0 auto;
  padding-top: 2.5rem;
  align-self: center;
}
.plaza-nav {
  position: sticky;
  top: 0;
  width: 100%;
  background: rgba(248, 250, 252, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-main);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2.5rem;
  z-index: 10;
}
.plaza-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.plaza-brand .brand-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--primary-600);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 16px;
}
.brand-title {
  font-weight: 700;
  color: var(--text-main);
}
.brand-sub {
  font-size: 12px;
  color: var(--text-muted);
}
.plaza-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.plaza-loading {
  font-size: 0.9rem;
  color: var(--text-muted);
  border: 1px solid var(--border-main);
  padding: 20px;
  border-radius: 12px;
  background: var(--bg-card);
  text-align: center;
}
.plaza-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 1px solid var(--border-main);
  padding-bottom: 1.5rem;
}
.plaza-create {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.plaza-create-input {
  min-width: 220px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-main);
  background: var(--bg-card);
  font-size: 0.85rem;
  color: var(--text-main);
  outline: none;
}
.plaza-create-input:focus {
  border-color: var(--primary-200);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.12);
}
.plaza-error {
  margin-top: -12px;
  font-size: 0.8rem;
  color: #ef4444;
}
.plaza-tools {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.plaza-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-main);
  background: var(--bg-card);
  color: var(--text-muted);
}
.plaza-search input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.85rem;
  color: var(--text-main);
  min-width: 200px;
}
.plaza-tools select {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-main);
  background: var(--bg-card);
  font-size: 0.85rem;
  color: var(--text-main);
}
.plaza-recent {
  display: grid;
  gap: 12px;
}
.plaza-section-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.plaza-header h2 {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
}
.plaza-header p {
  color: var(--text-secondary);
  margin-top: 0.5rem;
}
.plaza-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}
.plaza-card {
  text-align: left;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: var(--radius-main);
  padding: 16px;
  box-shadow: var(--shadow-card);
  display: grid;
  gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.plaza-card--active {
  border-color: var(--primary-200);
  box-shadow: 0 10px 22px rgba(99, 102, 241, 0.08);
}
.plaza-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary-100);
  box-shadow: var(--shadow-hover);
}
.plaza-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
}
.plaza-meta {
  display: flex;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--text-muted);
  align-items: center;
}
.plaza-status {
  background: var(--primary-50);
  color: var(--primary-700);
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
}
.plaza-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}
.plaza-empty {
  font-size: 0.9rem;
  color: var(--text-muted);
  border: 1px dashed var(--border-main);
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  background: var(--bg-card);
}

.btn-primary.small,
.btn-secondary.small {
  font-size: 0.75rem;
  padding: 4px 10px;
  height: auto;
}

@media (max-width: 1024px) {
  .inception-body,
  .implementation-body {
    grid-template-columns: 1fr;
  }
  .phase-stepper {
    display: none;
  }
}
</style>

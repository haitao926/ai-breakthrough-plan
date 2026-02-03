<template>
  <div class="workspace-root">
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand">
            <div class="brand-icon"><i class="fas fa-cube"></i></div>
            <span>科创工作台</span>
          </div>
          <RouterLink class="home-link" to="/" title="返回首页"><i class="fas fa-home"></i></RouterLink>
        </div>

        <div class="project-switcher">
          <button class="switcher-btn" @click="showProjectMenu = !showProjectMenu">
            <div class="switcher-meta">
              <div class="switcher-label">当前项目</div>
              <div class="switcher-name">{{ projectTitle }}</div>
            </div>
            <i class="fas fa-sort" style="opacity: 0.4; font-size: 12px;"></i>
          </button>
          <div v-if="showProjectMenu" class="switcher-menu">
            <div class="switcher-list">
              <div v-if="!projects.length" class="empty">暂无项目</div>
              <button
                v-for="project in projects"
                :key="project.id"
                class="switcher-item"
                @click="switchProject(project.id)"
              >
                <div style="width: 16px; display: flex; justify-content: center;">
                  <i v-if="project.id === projectId" class="fas fa-check" style="color: var(--primary); font-size: 12px;"></i>
                </div>
                <span class="truncate" :style="{ fontWeight: project.id === projectId ? '600' : '400' }">{{ project.title }}</span>
              </button>
            </div>
            <div class="switcher-footer">
              <RouterLink class="new-project" to="/projects">新建项目</RouterLink>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div v-for="group in navStructure" :key="group.id" class="nav-group">
            <div class="nav-group-header" @click="toggleGroup(group.id)">
              <span class="group-title">{{ group.title }}</span>
              <i class="fas fa-chevron-down group-arrow" :class="{ rotated: collapsedGroups[group.id] }"></i>
            </div>
            <div v-show="!collapsedGroups[group.id]" class="nav-group-items">
              <div 
                v-for="item in group.items" 
                :key="item.key"
                class="nav-item"
                :class="{ active: isItemActive(item) }"
                @click="handleNavClick(item)"
              >
                <i :class="item.icon"></i>
                <span class="flex-1">{{ item.label }}</span>
                <span v-if="item.badge" class="stage-badge" :class="item.badge.tone">{{ item.badge.label }}</span>
              </div>
            </div>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="profile">
            <img class="avatar" :src="currentUser?.avatar_url || ''" alt="avatar" />
            <div class="name">{{ currentUser?.name || '学生' }}</div>
          </div>
          <button class="logout" @click="logout" title="退出登录"><i class="fas fa-sign-out-alt"></i></button>
        </div>
      </aside>

      <header class="header">
        <div class="header-left">
           <h1 class="header-title">{{ viewTitle }}</h1>
        </div>
        
        <!-- Phase Stepper -->
        <div class="phase-stepper">
           <div 
             v-for="(phase, idx) in ['立项', '实施', '结题']" 
             :key="idx"
             class="step-item"
             :class="{ 
               active: currentPhaseIndex === idx, 
               completed: currentPhaseIndex > idx 
             }"
           >
             <div class="step-dot">
               <i v-if="currentPhaseIndex > idx" class="fas fa-check text-[10px]"></i>
               <span v-else>{{ idx + 1 }}</span>
             </div>
             <span class="step-label">{{ phase }}</span>
             <div v-if="idx < 2" class="step-line"></div>
           </div>
        </div>

        <div class="header-actions">
          <button v-if="viewMode === 'tool' && currentTool === 'inception'" class="btn-primary" @click="setSubmissionView('proposal')">
            <i class="fas fa-clipboard-list"></i>
            {{ proposalStatus.ready ? '提交开题' : '查看开题进度' }}
          </button>
          <button v-if="viewMode === 'tool' && currentTool === 'charter'" class="btn-primary" @click="setSubmissionView('proposal')">
            <i class="fas fa-paper-plane"></i> 提交开题
          </button>
          <button v-if="viewMode === 'stage' && activeStage === 'proposal'" class="btn-ghost" @click="setToolView('charter')">
            <i class="fas fa-file-signature"></i> 返回立项画布
          </button>
          <button v-if="viewMode === 'stage'" class="btn-ghost" @click="clearCurrentDraft">清空草稿</button>
        </div>
      </header>

      <main class="main-canvas">
        <template v-if="viewMode === 'tool'">
          <div v-if="currentTool === 'inception'" class="inception-canvas">
            <section class="inception-hero">
              <div>
                <div class="hero-kicker">Phase 1: Inception</div>
                <h2>立项导航</h2>
                <p>完成以下任务以生成开题报告。</p>
              </div>
              <div class="hero-actions">
                <button class="btn-primary" @click="openFirstMissing">
                  <i class="fas fa-play"></i> {{ proposalStatus.ready ? '查看开题报告' : '继续下一步' }}
                </button>
              </div>
            </section>

            <section class="inception-grid">
              <div class="inception-card">
                <div class="card-header">
                  <h3>总体进度</h3>
                  <div class="percent">{{ inceptionPercent }}%</div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: inceptionPercent + '%' }"></div>
                </div>
                <div class="muted">已完成 {{ inceptionDoneCount }}/{{ inceptionTotalCount }} 项</div>
              </div>

              <div class="inception-card">
                 <div class="card-header"><h3>当前任务</h3></div>
                 <div v-if="nextStep" class="next-step">
                    <div class="font-bold text-slate-800">{{ nextStep.label }}</div>
                    <div class="muted">{{ nextStep.desc }}</div>
                    <button class="btn-primary small mt-2" @click="openInceptionItem(nextStep)">立即开始</button>
                 </div>
                 <div v-else class="muted">立项任务已全部完成！</div>
              </div>
            </section>

            <section class="inception-body">
              <div class="inception-col">
                <div class="inception-card">
                  <div class="card-header"><h3>任务清单</h3></div>
                  <div class="task-list">
                    <div v-for="(item, idx) in inceptionItems" :key="item.key" class="task-item" :class="{ done: item.done }">
                      <div class="task-left">
                        <div class="task-index">{{ idx + 1 }}</div>
                        <div>
                          <div class="task-title">{{ item.label }}</div>
                          <div class="muted">{{ item.desc }}</div>
                        </div>
                      </div>
                      <div class="task-actions">
                        <i v-if="item.done" class="fas fa-check-circle text-green-500 text-lg"></i>
                        <button v-else class="btn-ghost small" @click="openInceptionItem(item)">去完成</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="inception-col">
                <div class="inception-card">
                  <div class="card-header"><h3>WBS 预览</h3></div>
                  <div v-if="!wbsPreview.length" class="muted">暂无数据</div>
                  <div v-else class="wbs-preview">
                    <div v-for="(task, idx) in wbsPreview" :key="idx" class="wbs-item">
                      <span class="pill" :class="`pill--${task.phase}`">{{ phaseLabel(task.phase) }}</span>
                      <span class="truncate">{{ task.title }}</span>
                    </div>
                  </div>
                  <button class="btn-ghost small mt-2" @click="setToolView('wbs')">管理 WBS</button>
                </div>
                <div class="inception-card">
                   <div class="card-header"><h3>提交状态</h3></div>
                   <div class="muted mb-2">{{ proposalStatus.ready ? '已就绪' : '未就绪' }}</div>
                   <button class="btn-primary small" :disabled="!proposalStatus.ready" @click="setSubmissionView('proposal')">提交开题</button>
                </div>
              </div>
            </section>
          </div>

          <div v-else-if="currentTool === 'implementation'" class="implementation-canvas">
            <section class="implementation-hero">
              <div>
                <div class="hero-kicker">Phase 2: Implementation</div>
                <h2>实施导航</h2>
                <p>记录开发过程，管理任务进度。</p>
              </div>
              <div class="hero-actions">
                <button class="btn-primary" @click="setToolView('devlog')">
                  <i class="fas fa-pen-nib"></i> 写日志
                </button>
                <button class="btn-ghost" @click="setToolView('kanban')">
                  <i class="fas fa-columns"></i> 看板
                </button>
              </div>
            </section>

            <section class="implementation-grid">
               <div class="impl-card">
                  <div class="card-header"><h3>任务进度</h3> <div class="percent">{{ milestonePercent }}%</div></div>
                  <div class="progress-bar"><div class="progress-fill" :style="{ width: milestonePercent + '%' }"></div></div>
                  <div class="muted">已完成 {{ milestoneCounts.done }}/{{ milestoneCounts.total }}</div>
               </div>
               <div class="impl-card">
                  <div class="card-header"><h3>代码仓库</h3></div>
                  <div v-if="repoUrl" class="repo-box">{{ repoUrl }}</div>
                  <div v-else class="muted">未绑定仓库</div>
               </div>
            </section>
            
            <section class="implementation-body">
               <div class="impl-card">
                 <div class="card-header"><h3>待办任务</h3></div>
                 <div v-if="!milestoneTodo.length" class="muted">暂无待办</div>
                 <div v-else class="impl-list">
                    <div v-for="task in milestoneTodo" :key="task.id" class="impl-task">
                       <div class="impl-task-left">
                          <span class="pill" :class="`pill--${task.phase}`">{{ phaseLabel(task.phase) }}</span>
                          <span>{{ task.title }}</span>
                       </div>
                       <span class="task-status" :class="milestoneStatusTone(task.status)">{{ task.statusLabel }}</span>
                    </div>
                 </div>
               </div>
               <div class="impl-card">
                  <div class="card-header"><h3>最近日志</h3></div>
                  <div v-if="!implementationLogs.length" class="muted">暂无日志</div>
                  <div v-else class="log-preview">
                    <div v-for="log in implementationLogsPreview" :key="log.id" class="log-item">
                      <div class="log-meta">{{ formatDateTime(log.created_at) }}</div>
                      <div class="log-content">{{ previewText(log.content) }}</div>
                    </div>
                  </div>
               </div>
            </section>
          </div>

          <div v-else-if="currentTool === 'kanban'" class="p-0 h-full overflow-hidden">
            <KanbanTool />
          </div>
          <div v-else-if="currentTool === 'gantt'" class="p-6 h-full overflow-y-auto">
            <GanttChart :project-id="projectId" />
          </div>
          <iframe v-else class="tool-frame" :src="toolFrameSrc"></iframe>
        </template>

        <div v-show="viewMode === 'stage'" class="stage-container">
          <div class="stage-header">
            <h2 class="stage-title">{{ stageConfig.title }}</h2>
            <p class="stage-desc">{{ stageConfig.desc }}</p>
          </div>

          <div class="status-banner" :class="statusStyle.banner">
            <div class="status-icon" :class="statusStyle.icon" v-html="statusStyle.iconHtml"></div>
            <div>
              <div class="status-title">{{ statusStyle.title }}</div>
              <div class="status-meta">{{ statusMeta }}</div>
            </div>
          </div>

          <div v-if="latestSubmission?.feedback" class="feedback-card">
            <div class="feedback-title">老师反馈</div>
            <div class="feedback-body">{{ latestSubmission.feedback }}</div>
          </div>

          <div v-if="activeStage === 'proposal'" class="proposal-wrapper">
            <ProposalStatus
              :items="proposalStatus.items"
              :missing="proposalStatus.missing"
              :wbs-tasks="proposalStatus.wbsTasks"
              :ready="proposalStatus.ready"
              @refresh="refreshStatus"
            />
            <div class="proposal-actions">
              <button class="btn-primary" :disabled="!proposalStatus.ready || submitting" @click="submitStage">
                {{ submitting ? '提交中...' : '提交开题报告' }}
              </button>
            </div>
          </div>

          <form v-else class="stage-form" @submit.prevent="submitStage">
            <div class="form-grid">
              <label v-for="field in stageConfig.fields" :key="field.name">
                <span class="form-label">
                  {{ field.label }}
                  <span v-if="field.required" class="required">*</span>
                </span>
                <textarea
                  v-if="field.type === 'textarea'"
                  v-model="formDetails[field.name]"
                  class="form-input textarea"
                  :placeholder="field.placeholder || ''"
                ></textarea>
                <input
                  v-else
                  v-model="formDetails[field.name]"
                  class="form-input"
                  :placeholder="field.placeholder || ''"
                />
              </label>
            </div>

            <div class="attachments">
              <div class="attachments-header">
                <span>附件上传</span>
                <span class="muted">支持多文件</span>
              </div>
              <input ref="fileInput" type="file" multiple @change="handleFileChange" />
              <div v-if="files.length" class="file-list">
                <div v-for="file in files" :key="file.name" class="file-item">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatSize(file.size) }}</span>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn-primary" type="submit" :disabled="submitting">
                {{ submitting ? '提交中...' : '提交评审' }}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ProposalStatus from '@/components/ProposalStatus.vue';
import GanttChart from '@/components/GanttChart.vue';
import KanbanTool from '@/pages/tools/Kanban.vue';
import { apiFetch } from '@/api/client';
import { buildProposalStatus } from '@/modules/inception/proposal';
import { STAGE_CONFIG, getStageConfig, validateStageDetails } from '@/modules/workspace/stages';
import { buildProposalMarkdown } from '@/modules/workspace/report';
import { clearDraft, loadDraft, saveDraft } from '@/modules/workspace/draft';
import { getCurrentUser, logout as doLogout } from '@/api/authApi';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.query.project);

const currentUser = ref(null);
const projects = ref([]);
const showProjectMenu = ref(false);

const projectDetail = ref(null);
const submissionIndex = ref({});
const viewMode = ref('tool');
const currentTool = ref('inception');
const toolPinned = ref(false);
const activeStage = ref('proposal');
const submitting = ref(false);
const statusVersion = ref(0);
const milestoneList = ref([]);
const milestoneLoading = ref(false);
const implementationLogs = ref([]);
const logLoading = ref(false);

const fileInput = ref(null);
const files = ref([]);
const formDetails = reactive({});
const draftTimer = ref(null);
const draftMap = ref({});

// --- Nav Structure ---
const navStructure = ref([
  {
    id: 'overview',
    title: '项目概览',
    items: [
      { key: 'kanban', label: '任务看板', icon: 'fas fa-columns', action: 'tool', value: 'kanban' },
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
      { key: 'wbs', label: 'WBS 拆解', icon: 'fas fa-project-diagram', action: 'tool', value: 'wbs' },
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

function isItemActive(item) {
  if (item.action === 'tool') {
    return viewMode.value === 'tool' && currentTool.value === item.value;
  }
  if (item.action === 'stage') {
    return viewMode.value === 'stage' && activeStage.value === item.value;
  }
  return false;
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
  try {
    const res = await apiFetch('/projects');
    const data = await res.json();
    projects.value = data.projects || [];
    if (!projectId.value && projects.value.length) {
      switchProject(projects.value[0].id);
    }
  } catch (err) {
    console.error(err);
  }
}

function switchProject(id) {
  showProjectMenu.value = false;
  toolPinned.value = false;
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

function normalizeMilestoneStatus(status) {
  if (!status) return 'todo';
  if (['todo', 'doing', 'review', 'done'].includes(status)) return status;
  const map = { pending: 'todo', submitted: 'review', approved: 'done', rejected: 'todo' };
  return map[status] || 'todo';
}

function milestoneStatusLabel(status) {
  const map = { todo: '待办', doing: '进行中', review: '待验收', done: '已完成' };
  return map[status] || '待办';
}

function milestoneStatusTone(status) {
  const map = { todo: 'status-pending', doing: 'status-doing', review: 'status-review', done: 'status-done' };
  return map[status] || 'status-pending';
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

function previewText(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length > 64 ? `${clean.slice(0, 64)}...` : clean;
}

function applyToolActions(result) {
  if (!result?.items) return result;
  const id = projectId.value;
  const map = {
    charter: `/tools/charter?project=${id}`,
    pre_research: `/tools/pre_research?project=${id}`,
    literature: `/tools/literature?project=${id}`,
    innovation: `/tools/innovation?project=${id}`,
    wbs: `/tools/wbs?project=${id}`,
    projects: `/projects`
  };
  return {
    ...result,
    items: result.items.map(item => {
      const key = item.action;
      return {
        ...item,
        actionKey: item.actionKey || key,
        action: map[key] || ''
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
  if (!projectId.value) {
    milestoneList.value = [];
    return;
  }
  milestoneLoading.value = true;
  try {
    const res = await apiFetch(`/projects/${projectId.value}/milestones`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '加载失败');
    milestoneList.value = (data.milestones || []).map(item => {
      const status = normalizeMilestoneStatus(item.status);
      return {
        ...item,
        status,
        statusLabel: milestoneStatusLabel(status),
        phase: item.description || 'm1'
      };
    });
    if (projectId.value) {
      const cacheKey = `ai_course_wbs_${projectId.value}`;
      const wbsTasks = milestoneList.value.map(item => {
        const deliverables = parseDeliverables(item.deliverables);
        return {
          title: item.title,
          phase: item.phase || 'm1',
          output: deliverables.output || ''
        };
      });
      localStorage.setItem(cacheKey, JSON.stringify({ tasks: wbsTasks }));
      refreshStatus();
    }
  } catch (err) {
    console.error(err);
    milestoneList.value = [];
  } finally {
    milestoneLoading.value = false;
  }
}

async function fetchDevLogs() {
  if (!projectId.value) {
    implementationLogs.value = [];
    return;
  }
  logLoading.value = true;
  try {
    const res = await apiFetch(`/projects/${projectId.value}/logs`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '加载失败');
    implementationLogs.value = Array.isArray(data.logs) ? data.logs : [];
  } catch (err) {
    console.error(err);
    implementationLogs.value = [];
  } finally {
    logLoading.value = false;
  }
}

async function refreshImplementationData() {
  await Promise.all([fetchMilestones(), fetchDevLogs()]);
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
    const res = await apiFetch(`/projects/${projectId.value}`);
    const data = await res.json();
    if (res.ok) {
      projectDetail.value = data;
      submissionIndex.value = indexSubmissions(data.submissions || []);
      refreshDraftCache();
      applyDefaultTool();
      await refreshImplementationData();
    }
  } catch (err) {
    console.error(err);
  }
}

function refreshDraftCache() {
  const next = {};
  Object.keys(STAGE_CONFIG).forEach(key => {
    next[key] = loadDraft(projectId.value, key);
  });
  draftMap.value = next;
}

function refreshStatus() {
  refreshDraftCache();
  statusVersion.value += 1;
}

function resetForm(stageKey) {
  files.value = [];
  if (fileInput.value) fileInput.value.value = '';
  Object.keys(formDetails).forEach(key => delete formDetails[key]);
  if (stageKey === 'proposal') return;
  const config = getStageConfig(stageKey);
  const draft = loadDraft(projectId.value, stageKey);
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
    const payload = saveDraft(projectId.value, activeStage.value, { ...formDetails });
    draftMap.value = { ...draftMap.value, [activeStage.value]: payload };
  }, 600);
}

function clearCurrentDraft() {
  if (!projectId.value || activeStage.value === 'proposal') return;
  clearDraft(projectId.value, activeStage.value);
  draftMap.value = { ...draftMap.value, [activeStage.value]: null };
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

    clearDraft(projectId.value, stageKey);
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
  doLogout();
  router.replace('/login');
}

onMounted(async () => {
  const user = getCurrentUser();
  if (!user) {
    const redirect = projectId.value ? `/workspace?project=${projectId.value}` : '/workspace';
    window.sessionStorage.setItem('auth_redirect', redirect);
    router.replace('/login');
    return;
  }
  currentUser.value = user;
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

.btn-primary.small,
.btn-ghost.small {
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

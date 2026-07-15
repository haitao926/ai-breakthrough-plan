<template>
  <div class="workspace-root selection:bg-slate-200 selection:text-slate-900 bg-slate-50 min-h-dvh">
    <div v-if="projectId" class="workspace-shell">
      <button
        v-if="sidebarDrawerOpen"
        type="button"
        class="workspace-sidebar-backdrop"
        aria-label="关闭侧边栏"
        @click="sidebarDrawerOpen = false"
      ></button>

      <WorkspaceSidebar
        :project-id="projectId"
        :project-title="projectTitle"
        :projects="projects"
        :show-project-menu="showProjectMenu"
        :nav-structure="navStructure"
        :collapsed-groups="collapsedGroups"
        :current-user="currentUser"
        :active-panel="activePanel"
        :drawer-open="sidebarDrawerOpen"
        @toggle-project-menu="showProjectMenu = !showProjectMenu"
        @switch-project="switchProject"
        @toggle-group="toggleGroup"
        @nav-click="handleSidebarNavClick"
        @logout="logout"
        @close-drawer="sidebarDrawerOpen = false"
        @delete-project="handleDeleteProject"
      />

      <div class="workspace-main-shell flex-1 flex flex-col min-w-0 bg-slate-50/50">
        <WorkspaceHeader
          :view-title="viewTitle"
          :current-phase-index="currentPhaseIndex"
          :active-panel="activePanel"
          :proposal-ready="proposalStatus.ready"
          :next-step-label="nextStepLabel"
          :sidebar-open="sidebarDrawerOpen"
          :badge-label="isToolPanel ? '' : statusStyle.title"
          :badge-class="isToolPanel ? '' : getBannerClass(statusStyle.banner)"
          :override-hint="isToolPanel ? '' : statusMeta"
          @toggle-sidebar="sidebarDrawerOpen = !sidebarDrawerOpen"
          @set-submission-view="setSubmissionView"
          @set-tool-view="setToolView"
          @clear-draft="clearCurrentDraft"
        />

        <div class="flex-1 overflow-hidden relative flex">
          <main class="flex-1 overflow-y-auto custom-scrollbar relative">
          <WorkspaceToolPanel
            v-if="isToolPanel"
            :active-panel="activePanel"
            :project-id="projectId"
            :milestone-counts="milestoneCounts"
            :required-submission-stages="requiredSubmissionStages"
            :proposal-ready="proposalStatus.ready"
            :milestone-percent="milestonePercent"
            :milestone-todo="milestoneTodo"
            :implementation-logs-preview="implementationLogsPreview"
            :repo-url="repoUrl"
            :phase-label="phaseLabel"
            :format-date-time="formatDateTime"
            @set-tool-view="setToolView"
            @set-submission-view="setSubmissionView"
            @open-submission-guide="openSubmissionGuide"
          />

          <!-- 提交面板 -->
          <StageSubmissionPanel
            v-show="!isToolPanel"
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
            :submit-feedback="submitFeedback"
            @refresh-status="refreshStatus"
            @open-item="openInceptionItem"
            @submit-stage="submitStage"
            @file-change="handleFileChange"
          />
        </main>

        <!-- Right Sidebar (Only shown when not in tool panel) -->
        <WorkspaceRightSidebar v-if="!isToolPanel" />
      </div>
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
      :create-hint="createHint"
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
import ProjectPlaza from '@/components/workspace/ProjectPlaza.vue';
import StageSubmissionPanel from '@/components/workspace/StageSubmissionPanel.vue';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader.vue';
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar.vue';
import WorkspaceToolPanel from '@/components/workspace/WorkspaceToolPanel.vue';
import WorkspaceRightSidebar from '@/components/workspace/WorkspaceRightSidebar.vue';
import { apiFetch } from '@/api/client';
import { buildProposalStatus } from '@/modules/inception/proposal';
import { STAGE_CONFIG, getStageConfig, validateStageDetails } from '@/modules/workspace/stages';
import { buildProposalMarkdown } from '@/modules/workspace/report';
import {
  buildBlueprintPayload,
  createDraftScheduler,
  createStageFormDetails
} from '@/modules/workspace/submission.js';
import {
  STATUS_LABELS,
  STATUS_STYLE,
  inceptionTips,
  createStagePanels,
  createWorkspaceNavStructure,
  getDefaultCollapsedGroups,
  applySubmissionBadges,
  submissionStageMeta,
  phaseLabel,
  milestoneStatusTone,
  previewText,
  applyToolActions,
  formatDate,
  formatDateTime,
  projectStatusLabel,
  formatSize,
  getActiveStage,
  getCurrentPhaseIndex,
  getDefaultPanel,
  getIsToolPanel,
  getOnboardingVisibility,
  getViewTitle,
  resolveRoutePanel
} from '@/modules/workspace/view.js';
import { useAuthStore } from '@/stores/auth';
import { useProjectStore } from '@/stores/project';
import { useDraftStore } from '@/stores/draft';
import { buildWorkspaceBase, buildWorkspacePanelRoute } from '@/utils/workspaceRoute';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.params.projectId || route.query.project);

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
const sidebarDrawerOpen = ref(false);
const plazaKeyword = ref('');
const plazaStatus = ref('');
const plazaSort = ref('updated_desc');
const quickCreateTitle = ref('');
const creatingProject = ref(false);
const quickCreateError = ref('');
const showOnboarding = ref(false);

const activePanel = ref('proposal');
const toolPinned = ref(false);
const submitting = ref(false);
const statusVersion = ref(0);
const onboardingKey = computed(() => (projectId.value ? `workspace_onboarding_seen_${projectId.value}` : ''));

const fileInputKey = ref(0);
const files = ref([]);
const formDetails = reactive({});
const submitFeedback = ref({ type: '', message: '' });

const navStructure = ref(createWorkspaceNavStructure());

const collapsedGroups = reactive(getDefaultCollapsedGroups());

function toggleGroup(id) {
  collapsedGroups[id] = !collapsedGroups[id];
}

function handleNavClick(item) {
  if (item.action === 'tool') setToolView(item.value);
  if (item.action === 'stage') setSubmissionView(item.value);
}

function handleSidebarNavClick(item) {
  handleNavClick(item);
  sidebarDrawerOpen.value = false;
}

// Update nav badges based on state
watch([submissionIndex, draftMap], () => {
  applySubmissionBadges(navStructure.value, submissionIndex.value, draftMap.value);
}, { deep: true });

const statusOptions = computed(() => Object.keys(STATUS_LABELS).map(key => ({ value: key, label: STATUS_LABELS[key] })));
const createHint = computed(() => {
  if (String(route.query.create || '') !== 'true') return '';
  const source = String(route.query.topicSource || '').trim();
  const requester = String(route.query.topicRequester || '').trim();
  const reward = String(route.query.topicReward || '').trim();
  const deadline = String(route.query.topicDeadline || '').trim();
  if (source !== 'bounty') {
    return '已从公开项目页带入推荐方向。确认项目名后可直接创建并进入你的项目空间。';
  }
  const facts = [requester ? `发布老师：${requester}` : '', reward ? `回报：${reward}` : '', deadline ? `截止：${deadline}` : '']
    .filter(Boolean)
    .join(' · ');
  return facts
    ? `已从教师悬赏入口带入题目。${facts}。创建项目后即可继续推进，并联系老师确认认领细节。`
    : '已从教师悬赏入口带入题目。创建项目后即可继续推进，并联系老师确认认领细节。';
});

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

const requiredSubmissionStages = computed(() => [
  {
    key: 'proposal',
    title: '开题',
    time: '立项后提交',
    materials: '开题报告、调研记录、创新点说明、技术路线或方案。',
    ...submissionStageMeta('proposal', submissionIndex.value, draftMap.value)
  },
  {
    key: 'midterm',
    title: '中期',
    time: '项目中段提交',
    materials: '中期检查表、当前进度、问题调整、阶段证据或演示链接。',
    ...submissionStageMeta('midterm', submissionIndex.value, draftMap.value)
  },
  {
    key: 'final',
    title: '结题',
    time: '项目结束前提交',
    materials: '结题报告、成果包、演示视频或链接、反思与验证材料。',
    ...submissionStageMeta('final', submissionIndex.value, draftMap.value)
  }
]);

const proposalStatus = computed(() => {
  statusVersion.value;
  const hasFiles = files.value.length > 0 || (draftMap.value['proposal']?.attachments?.length > 0);
  return applyToolActions(buildProposalStatus(projectId.value, projectDetail.value, hasFiles));
});

const inceptionItems = computed(() => proposalStatus.value?.items || []);
const inceptionDoneCount = computed(() => inceptionItems.value.filter(item => item.done).length);
const inceptionTotalCount = computed(() => Math.max(inceptionItems.value.length, 1));
const inceptionPercent = computed(() => Math.round((inceptionDoneCount.value / inceptionTotalCount.value) * 100));
const nextStep = computed(() => inceptionItems.value.find(item => !item.done) || null);
const nextStepTitle = computed(() => nextStep.value?.label || '查看阶段提交要求');
const nextStepLabel = computed(() => {
  if (proposalStatus.value?.ready) return '开题材料已基本就绪，可随时提交开题报告。';
  if (nextStep.value?.label) return `请先完善「${nextStep.value.label}」相关内容。`;
  return '工作台只做两件事：平时推进任务，到节点提交材料。';
});
const visibleInceptionItems = computed(() => {
  const missing = inceptionItems.value.filter(item => !item.done);
  return missing.length ? missing : inceptionItems.value;
});
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
const stagePanels = createStagePanels();
const isToolPanel = computed(() => getIsToolPanel(activePanel.value, stagePanels));
const activeStage = computed(() => getActiveStage(activePanel.value, stagePanels));

const viewTitle = computed(() => getViewTitle({
  projectId: projectId.value,
  navStructure: navStructure.value,
  activePanel: activePanel.value,
  isToolPanel: isToolPanel.value,
  stageConfig: stageConfig.value
}));

const currentPhaseIndex = computed(() => getCurrentPhaseIndex({
  activePanel: activePanel.value,
  activeStage: activeStage.value,
  isToolPanel: isToolPanel.value
}));

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
  return '尚未提交。你可以分步起草大纲，确认无误后提交。';
});

function getBannerClass(cls) {
  const map = {
    'status-pending': 'bg-slate-100 text-slate-600',
    'status-draft': 'bg-amber-100 text-amber-800',
    'status-submitted': 'bg-teal-100 text-teal-800',
    'status-reviewed': 'bg-emerald-100 text-emerald-800',
    'status-needs': 'bg-rose-100 text-rose-800'
  };
  return map[cls] || 'bg-slate-100 text-slate-600';
}

async function loadProjects() {
  await projectStore.fetchList();
}

async function createProject(payload) {
  const incoming = payload || { title: quickCreateTitle.value.trim() };
  const data = {
    visibility: 'assigned',
    visibleToRoles: [],
    visibleToUserIds: [],
    visibleToClassNames: [],
    ...incoming
  };
  if (!data.title) {
    quickCreateError.value = '请输入项目名称';
    return;
  }
  quickCreateError.value = '';
  creatingProject.value = true;
  try {
    const project = await projectStore.create(data);
    quickCreateTitle.value = '';
    // Let child modal know to close if we had a dedicated v-model, but setting title to '' helps with intent sync
    if (project?.id) {
      switchProject(project.id);
    }
  } catch (err) {
    quickCreateError.value = err.message || '创建失败';
  } finally {
    creatingProject.value = false;
  }
}

function syncCreateIntentFromRoute() {
  if (projectId.value) return;
  if (String(route.query.create || '') !== 'true') return;
  const incomingTitle = String(route.query.topicTitle || '').trim();
  if (incomingTitle && !quickCreateTitle.value.trim()) {
    quickCreateTitle.value = incomingTitle;
  }
}

function switchProject(id) {
  showProjectMenu.value = false;
  sidebarDrawerOpen.value = false;
  toolPinned.value = false;
  projectStore.setLastVisited(id);
  const nextPanel = stagePanels.has(activePanel.value) ? activePanel.value : activePanel.value || 'inception';
  router.replace(buildWorkspacePanelRoute(id, nextPanel));
}

async function handleDeleteProject(project) {
  if (!confirm(`确定要删除新建项目“${project.title}”吗？此操作无法撤销。`)) return;
  try {
    await projectStore.deleteProject(project.id);
    if (String(project.id) === String(projectId.value)) {
      // If we deleted the current project, navigate to the first available project or projects page
      if (projects.value.length > 0) {
        switchProject(projects.value[0].id);
      } else {
        router.replace('/projects');
      }
    }
  } catch (err) {
    alert(err.message || '删除失败');
  }
}

function maybeShowOnboarding() {
  if (typeof window === 'undefined') return;
  const forcedCreate = String(route.query.create || '') === 'true';
  const seen = window.localStorage.getItem(onboardingKey.value) === 'true';
  showOnboarding.value = getOnboardingVisibility({
    hasProjectId: Boolean(projectId.value),
    hasProposalStatus: Boolean(proposalStatus.value),
    onboardingKey: onboardingKey.value,
    localStorageSeen: seen,
    forcedCreate,
    hasProposalSubmission: Boolean(submissionIndex.value?.proposal)
  });
}

watch(
  () => [route.query.create, route.query.topicTitle, projectId.value],
  () => {
    syncCreateIntentFromRoute();
  },
  { immediate: true }
);

function dismissOnboarding() {
  showOnboarding.value = false;
  if (typeof window !== 'undefined' && onboardingKey.value) {
    window.localStorage.setItem(onboardingKey.value, 'true');
  }
  if (route.query.create) {
    const nextQuery = { ...route.query };
    delete nextQuery.create;
    router.replace({ path: route.path, query: nextQuery }).catch(() => {});
  }
}

function openOnboardingKanban() {
  dismissOnboarding();
  setToolView('kanban');
}

function openOnboardingProposal() {
  dismissOnboarding();
  setSubmissionView('proposal');
}

function setToolView(tool) {
  activePanel.value = tool;
  toolPinned.value = true;
  if (projectId.value) {
    router.replace(buildWorkspacePanelRoute(projectId.value, tool)).catch(() => {});
  }
  if (tool === 'implementation') {
    refreshImplementationData();
  }
}

function setSubmissionView(stageKey) {
  activePanel.value = stageKey;
  if (projectId.value) {
    router.replace(buildWorkspacePanelRoute(projectId.value, stageKey)).catch(() => {});
  }
  resetForm(stageKey);
}

function applyRouteView() {
  const resolved = resolveRoutePanel({
    route,
    stageConfig: STAGE_CONFIG,
    hasProjectId: Boolean(projectId.value),
    fallbackPanel: activePanel.value || (submissionIndex.value?.proposal ? 'kanban' : 'proposal')
  });
  if (!resolved) {
    if (projectId.value) applyDefaultTool();
    return;
  }
  activePanel.value = resolved.panel;
  toolPinned.value = resolved.toolPinned;
  if (resolved.requiresReset && resolved.stageKey) {
    resetForm(resolved.stageKey);
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

function openSubmissionGuide(target) {
  const key = typeof target === 'string' ? target : target?.actionKey || target?.action;
  if (key === 'proposal') {
    setSubmissionView('proposal');
    return;
  }
  if (key === 'projects') {
    router.push('/projects');
    return;
  }
  if (key) {
    setToolView(key);
    return;
  }
  openFirstMissing();
}

function openFirstMissing() {
  setSubmissionView('proposal');
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
  const nextPanel = getDefaultPanel({
    toolPinned: toolPinned.value,
    hasProposal: Boolean(submissionIndex.value?.proposal)
  });
  if (nextPanel) {
    activePanel.value = nextPanel === 'inception' ? 'proposal' : nextPanel;
  } else {
    activePanel.value = submissionIndex.value?.proposal ? 'kanban' : 'proposal';
  }
  collapsedGroups.main = false;
}

async function fetchProjectDetail() {
  if (!projectId.value) return;
  try {
    await projectStore.fetchDetail(projectId.value);
    refreshDraftCache();
    await refreshImplementationData();
    maybeShowOnboarding();
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
  submitFeedback.value = { type: '', message: '' };
  Object.keys(formDetails).forEach(key => delete formDetails[key]);
  const nextDetails = createStageFormDetails(
    stageKey,
    draftMap.value,
    submissionIndex.value,
    getStageConfig,
    getLastRepo
  );
  Object.assign(formDetails, nextDetails);
}

function getLastRepo() {
  const submissions = projectDetail.value?.submissions || [];
  for (const sub of submissions) {
    const repo = sub?.details?.codeRepo;
    if (repo) return repo;
  }
  return '';
}

const draftScheduler = createDraftScheduler({
  projectId: () => projectId.value,
  activeStage: () => activeStage.value,
  getFormDetails: () => ({ ...formDetails }),
  saveDraft: (id, stage, details) => draftStore.saveProjectDraft(id, stage, details)
});

function scheduleDraftSave() {
  draftScheduler.schedule();
}

function clearCurrentDraft() {
  if (!projectId.value || activeStage.value === 'proposal') return;
  draftStore.clearProjectDraft(projectId.value, activeStage.value);
  resetForm(activeStage.value);
}

function handleFileChange(event) {
  if (Array.isArray(event)) {
    files.value = event;
    submitFeedback.value = { type: '', message: '' };
    return;
  }
  const input = event.target;
  files.value = Array.from(input.files || []);
  submitFeedback.value = { type: '', message: '' };
}

async function saveProjectBlueprint(details, wbsTasks) {
  if (!projectId.value) return;
  const payload = buildBlueprintPayload(details, wbsTasks);
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
    await apiFetch(`/projects/${projectId.value}/sync-wbs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: wbsTasks, source: 'wbs' })
    });
  } catch (err) {
    console.error(err);
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
      plan: proposalStatus.value.planText || '',
      templateRef: formDetails.templateRef || '',
      notes: formDetails.notes || ''
    };
    content = buildProposalMarkdown(details, details.wbs || []);
  }

  if (files.value.length) {
    details.uploadedMaterials = true;
  }

  const validationError = validateStageDetails(stageKey, details, proposalStatus.value);
  if (validationError) {
    submitFeedback.value = { type: 'error', message: validationError };
    return;
  }

  submitting.value = true;
  submitFeedback.value = { type: '', message: '' };
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
    submitFeedback.value = { type: 'success', message: '提交成功，已同步最新评审状态。' };
  } catch (err) {
    submitFeedback.value = { type: 'error', message: err.message || '提交失败' };
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
    const redirect = projectId.value ? buildWorkspaceBase(projectId.value).path : '/my';
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
  draftScheduler.cancel();
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
  [proposalStatus, () => route.query.create, projectId],
  () => {
    maybeShowOnboarding();
  },
  { deep: true }
);

watch(
  () => route.query.stage,
  () => {
    applyRouteView();
  }
);

watch(
  () => route.params.stageId,
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
  () => route.query.panel,
  () => {
    applyRouteView();
  }
);

watch(
  () => route.params.panelId,
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

</script>

<style scoped>
.workspace-sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 25;
  border: 0;
  background: rgba(15, 23, 42, 0.28);
}
</style>

<style src="./Workspace.css"></style>

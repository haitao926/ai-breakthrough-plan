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
            <i class="fas fa-chevron-down"></i>
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
                <span class="dot" :class="{ active: project.id === projectId }"></span>
                <span class="truncate">{{ project.title }}</span>
              </button>
            </div>
            <div class="switcher-footer">
              <RouterLink class="new-project" to="/projects">新建项目</RouterLink>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-group-title">0. 项目概览 (Overview)</div>
          <div :class="['nav-item', currentTool === 'kanban' ? 'active' : '']" @click="setToolView('kanban')">
            <i class="fas fa-columns"></i> 敏捷看板 (Kanban)
          </div>
          <div :class="['nav-item', currentTool === 'gantt' ? 'active' : '']" @click="setToolView('gantt')">
            <i class="fas fa-stream"></i> 进度甘特 (Gantt)
          </div>

          <div class="nav-group-title">1. 立项阶段 (Inception)</div>
          <div :class="['nav-item', currentTool === 'inception' ? 'active' : '']" @click="setToolView('inception')">
            <i class="fas fa-compass"></i> 立项导航
          </div>
          <div :class="['nav-item', currentTool === 'charter' ? 'active' : '']" @click="setToolView('charter')">
            <i class="fas fa-file-signature"></i> 项目立项书 (Charter)
          </div>
          <div :class="['nav-item', currentTool === 'pre_research' ? 'active' : '']" @click="setToolView('pre_research')">
            <i class="fas fa-search"></i> 前期调研
          </div>
          <div :class="['nav-item', currentTool === 'literature' ? 'active' : '']" @click="setToolView('literature')">
            <i class="fas fa-book-reader"></i> 文献阅读
          </div>
          <div :class="['nav-item', currentTool === 'innovation' ? 'active' : '']" @click="setToolView('innovation')">
            <i class="fas fa-lightbulb"></i> 创新点梳理
          </div>
          <div :class="['nav-item', currentTool === 'wbs' ? 'active' : '']" @click="setToolView('wbs')">
            <i class="fas fa-project-diagram"></i> WBS 拆解
          </div>
          <div :class="['nav-item', currentTool === 'architect' ? 'active' : '']" @click="setToolView('architect')">
            <i class="fas fa-sitemap"></i> 架构设计 (Architecture)
          </div>
          <div :class="['nav-item', activeStage === 'proposal' ? 'active' : '']" @click="setSubmissionView('proposal')">
            <i class="fas fa-clipboard-list"></i> 提交：开题报告
            <span v-if="stageBadges.proposal" class="stage-badge" :class="stageBadges.proposal.tone">
              {{ stageBadges.proposal.label }}
            </span>
          </div>

          <div class="nav-group-title">2. 实施阶段 (Implementation)</div>
          <div :class="['nav-item', currentTool === 'implementation' ? 'active' : '']" @click="setToolView('implementation')">
            <i class="fas fa-route"></i> 实施导航
          </div>
          <div :class="['nav-item', currentTool === 'devlog' ? 'active' : '']" @click="setToolView('devlog')">
            <i class="fas fa-pen-nib"></i> 实施日志
          </div>
          <div :class="['nav-item', activeStage === 'milestone_1' ? 'active' : '']" @click="setSubmissionView('milestone_1')">
            <i class="fas fa-flag"></i> 提交：里程碑 1
            <span v-if="stageBadges.milestone_1" class="stage-badge" :class="stageBadges.milestone_1.tone">
              {{ stageBadges.milestone_1.label }}
            </span>
          </div>
          <div :class="['nav-item', activeStage === 'midterm' ? 'active' : '']" @click="setSubmissionView('midterm')">
            <i class="fas fa-clipboard-check"></i> 提交：中期检查
            <span v-if="stageBadges.midterm" class="stage-badge" :class="stageBadges.midterm.tone">
              {{ stageBadges.midterm.label }}
            </span>
          </div>
          <div :class="['nav-item', activeStage === 'milestone_2' ? 'active' : '']" @click="setSubmissionView('milestone_2')">
            <i class="fas fa-flag"></i> 提交：里程碑 2
            <span v-if="stageBadges.milestone_2" class="stage-badge" :class="stageBadges.milestone_2.tone">
              {{ stageBadges.milestone_2.label }}
            </span>
          </div>

          <div class="nav-group-title">3. 结题阶段 (Conclusion)</div>
          <div :class="['nav-item', activeStage === 'final' ? 'active' : '']" @click="setSubmissionView('final')">
            <i class="fas fa-trophy"></i> 结题答辩 (Final)
            <span v-if="stageBadges.final" class="stage-badge" :class="stageBadges.final.tone">
              {{ stageBadges.final.label }}
            </span>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="profile">
            <img class="avatar" :src="currentUser?.avatar_url || ''" alt="avatar" />
            <div class="name">{{ currentUser?.name || '学生' }}</div>
          </div>
          <button class="logout" @click="logout"><i class="fas fa-sign-out-alt"></i></button>
        </div>
      </aside>

      <header class="header">
        <h1 class="header-title">{{ viewTitle }}</h1>
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
                <div class="hero-kicker">立项阶段</div>
                <h2>把想法拆成可执行的项目路线</h2>
                <p>按清单完成后，将自动生成开题报告并同步到任务看板。</p>
              </div>
              <div class="hero-actions">
                <button class="btn-primary" @click="openFirstMissing">
                  <i class="fas fa-play"></i> {{ proposalStatus.ready ? '查看开题报告' : '继续完善' }}
                </button>
                <button class="btn-ghost" @click="setSubmissionView('proposal')">
                  <i class="fas fa-clipboard-list"></i> 开题进度
                </button>
              </div>
            </section>

            <section class="inception-grid">
              <div class="inception-card">
                <div class="card-header">
                  <div>
                    <h3>立项完成度</h3>
                    <div class="muted">完成清单即可提交开题</div>
                  </div>
                  <div class="percent">{{ inceptionPercent }}%</div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: inceptionPercent + '%' }"></div>
                </div>
                <div class="muted">已完成 {{ inceptionDoneCount }}/{{ inceptionTotalCount }} 项 · {{ proposalStatus.ready ? '可提交开题' : '继续补齐' }}</div>
              </div>

              <div class="inception-card">
                <div class="card-header">
                  <h3>下一步建议</h3>
                </div>
                <div v-if="nextStep" class="next-step">
                  <div class="next-title">{{ nextStep.label }}</div>
                  <div class="muted">{{ nextStep.desc }}</div>
                  <div v-if="nextStep.detail" class="warn">{{ nextStep.detail }}</div>
                  <div v-if="inceptionTips[nextStep.actionKey]" class="tip">{{ inceptionTips[nextStep.actionKey] }}</div>
                  <button class="btn-primary small" @click="openInceptionItem(nextStep)">开始梳理</button>
                </div>
                <div v-else class="muted">已完成全部立项任务，直接提交开题即可。</div>
              </div>
            </section>

            <section class="inception-body">
              <div class="inception-col">
                <div class="inception-card">
                  <div class="card-header">
                    <h3>立项任务清单</h3>
                  </div>
                  <div class="task-list">
                    <div v-for="(item, idx) in inceptionItems" :key="item.key" class="task-item" :class="{ done: item.done }">
                      <div class="task-left">
                        <div class="task-index">{{ idx + 1 }}</div>
                        <div>
                          <div class="task-title">{{ item.label }}</div>
                          <div class="muted">{{ item.desc }}</div>
                          <div v-if="item.detail" class="task-detail" :class="item.done ? 'muted' : 'warn'">{{ item.detail }}</div>
                          <div v-if="inceptionTips[item.actionKey]" class="task-tip">{{ inceptionTips[item.actionKey] }}</div>
                        </div>
                      </div>
                      <div class="task-actions">
                        <span class="task-status" :class="item.done ? 'status-done' : 'status-pending'">
                          {{ item.done ? '已完成' : '待完成' }}
                        </span>
                        <button v-if="item.actionKey" class="btn-ghost small" @click="openInceptionItem(item)">去梳理</button>
                      </div>
                    </div>
                  </div>
                  <div v-if="proposalStatus.missing.length" class="missing">尚需完成：{{ proposalStatus.missing.join('、') }}</div>
                </div>
              </div>

              <div class="inception-col">
                <div class="inception-card">
                  <div class="card-header">
                    <h3>WBS 快览</h3>
                    <span class="muted">已拆解 {{ wbsTotal }} 条</span>
                  </div>
                  <div v-if="!wbsPreview.length" class="muted">尚未拆解任务，先完成 WBS。</div>
                  <div v-else class="wbs-preview">
                    <div v-for="(task, idx) in wbsPreview" :key="idx" class="wbs-item">
                      <span class="pill" :class="`pill--${task.phase}`">{{ phaseLabel(task.phase) }}</span>
                      <span>{{ task.title }}</span>
                    </div>
                    <div v-if="wbsTotal > wbsPreview.length" class="muted">……共 {{ wbsTotal }} 条任务</div>
                  </div>
                  <button class="btn-ghost small" @click="setToolView('wbs')">去拆解任务</button>
                </div>

                <div class="inception-card">
                  <div class="card-header">
                    <h3>交付物建议</h3>
                  </div>
                  <ul class="deliver-list">
                    <li v-for="(item, idx) in deliverableTips" :key="idx">{{ item }}</li>
                  </ul>
                </div>

                <div class="inception-card">
                  <div class="card-header">
                    <h3>提交提示</h3>
                  </div>
                  <div class="muted" :class="proposalStatus.ready ? 'success' : ''">
                    {{ proposalStatus.ready ? '已满足开题条件，可提交开题报告。' : '完成清单后即可提交开题。' }}
                  </div>
                  <button class="btn-primary small" :disabled="!proposalStatus.ready" @click="setSubmissionView('proposal')">提交开题报告</button>
                </div>
              </div>
            </section>
          </div>

          <div v-else-if="currentTool === 'implementation'" class="implementation-canvas">
            <section class="implementation-hero">
              <div>
                <div class="hero-kicker">实施阶段</div>
                <h2>任务推进 + 过程记录 = 最好的成长证据</h2>
                <p>保持轻量记录，持续更新看板，阶段提交时自然就有内容。</p>
              </div>
              <div class="hero-actions">
                <button class="btn-primary" @click="setToolView('devlog')">
                  <i class="fas fa-pen-nib"></i> 写实施日志
                </button>
                <button class="btn-ghost" @click="setToolView('kanban')">
                  <i class="fas fa-columns"></i> 打开看板
                </button>
              </div>
            </section>

            <section class="implementation-grid">
              <div class="impl-card">
                <div class="card-header">
                  <div>
                    <h3>任务推进</h3>
                    <div class="muted">看板任务完成度</div>
                  </div>
                  <div class="percent">{{ milestonePercent }}%</div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: milestonePercent + '%' }"></div>
                </div>
                <div v-if="milestoneLoading" class="muted">加载中...</div>
                <div v-else class="muted">已完成 {{ milestoneCounts.done }}/{{ milestoneCounts.total }} 项</div>
                <button class="btn-ghost small" @click="setToolView('kanban')">去更新看板</button>
              </div>

              <div class="impl-card">
                <div class="card-header">
                  <h3>代码仓库</h3>
                </div>
                <div v-if="repoUrl" class="repo-box">{{ repoUrl }}</div>
                <div v-else class="muted">尚未绑定仓库，建议在 Gitea 创建并填入项目。</div>
                <div class="muted">每个里程碑提交需包含仓库链接与 commit 说明。</div>
                <button class="btn-ghost small" @click="setSubmissionView('milestone_1')">提交里程碑</button>
              </div>

              <div class="impl-card">
                <div class="card-header">
                  <h3>过程记录</h3>
                  <button class="btn-ghost small" @click="setToolView('devlog')">写记录</button>
                </div>
                <div v-if="logLoading" class="muted">记录加载中...</div>
                <div v-else-if="!implementationLogs.length" class="muted">暂无记录，先写一条今日进展。</div>
                <div v-else class="log-preview">
                  <div v-for="log in implementationLogsPreview" :key="log.id" class="log-item">
                    <div class="log-meta">{{ log.author_name || '学生' }} · {{ formatDateTime(log.created_at) }}</div>
                    <div class="log-content">{{ previewText(log.content) }}</div>
                  </div>
                </div>
              </div>
            </section>

            <section class="implementation-body">
              <div class="impl-card">
                <div class="card-header">
                  <h3>待办清单</h3>
                  <span class="muted">来自任务看板</span>
                </div>
                <div v-if="!milestoneTodo.length" class="muted">暂无待办，继续维护看板。</div>
                <div v-else class="impl-list">
                  <div v-for="task in milestoneTodo" :key="task.id" class="impl-task">
                    <div class="impl-task-left">
                      <span class="pill" :class="`pill--${task.phase}`">{{ phaseLabel(task.phase) }}</span>
                      <span>{{ task.title }}</span>
                    </div>
                    <span class="task-status" :class="milestoneStatusTone(task.status)">{{ task.statusLabel }}</span>
                  </div>
                </div>
                <button class="btn-ghost small" @click="setToolView('kanban')">打开看板</button>
              </div>

              <div class="impl-card">
                <div class="card-header">
                  <h3>过程证据</h3>
                </div>
                <ul class="deliver-list">
                  <li>阶段性截图或实验记录</li>
                  <li>演示视频或 demo 链接</li>
                  <li>流程图 / 架构图 / 原型图</li>
                  <li>代码仓库与提交记录</li>
                </ul>
                <div class="impl-actions">
                  <button class="btn-ghost small" @click="setSubmissionView('milestone_1')">里程碑 1</button>
                  <button class="btn-ghost small" @click="setSubmissionView('midterm')">中期检查</button>
                  <button class="btn-ghost small" @click="setSubmissionView('milestone_2')">里程碑 2</button>
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

const toolTitles = {
  kanban: '任务看板',
  inception: '立项导航',
  implementation: '实施导航',
  devlog: '实施日志',
  charter: '项目立项书',
  pre_research: '前期调研',
  literature: '文献阅读',
  innovation: '创新点梳理',
  wbs: 'WBS 拆解',
  architect: '架构设计',
  gantt: '进度甘特'
};

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
const deliverableTips = computed(() => {
  if (deliverableType.value === 'research') {
    return ['研究报告（含方法/数据/结论）', '过程图片或实验记录', '数据图表与分析说明', '讨论与展望'];
  }
  return ['可运行原型或核心功能', '演示视频或现场演示脚本', '代码仓库与提交记录', '过程记录与总结'];
});
const wbsPreview = computed(() => (proposalStatus.value?.wbsTasks || []).slice(0, 6));
const wbsTotal = computed(() => (proposalStatus.value?.wbsTasks || []).length);
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
    return toolTitles[currentTool.value] || '工作台';
  }
  return stageConfig.value.title || '提交评审';
});

const toolFrameSrc = computed(() => {
  if (!projectId.value) return '';
  const id = projectId.value;
  if (currentTool.value === 'architect') {
    return `/tools/architect?project=${id}`;
  }
  // Gantt and Kanban are now Vue components
  if (currentTool.value === 'gantt' || currentTool.value === 'kanban') {
    return ''; 
  }
  return `/tools/${currentTool.value}?project=${id}`;
});

const stageBadges = computed(() => {
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
  --sidebar-w: 260px;
  --header-h: 64px;
  --primary: #4f46e5;
  --bg-page: #f8fafc;
  --bg-card: #ffffff;
  --border-color: #e2e8f0;
  --text-main: #1e293b;
  --text-sub: #64748b;
  height: 100vh;
  background: var(--bg-page);
}
.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) 1fr;
  grid-template-rows: var(--header-h) 1fr;
  height: 100%;
}
.sidebar {
  grid-row: 1 / -1;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  z-index: 20;
}
.sidebar-header {
  height: var(--header-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  color: #1e293b;
}
.brand-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 14px;
}
.home-link {
  color: #94a3b8;
}
.project-switcher {
  padding: 1rem;
  position: relative;
}
.switcher-btn {
  width: 100%;
  background: #eef2ff;
  border: 1px solid #e0e7ff;
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  text-align: left;
  cursor: pointer;
}
.switcher-label {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
}
.switcher-name {
  font-weight: 700;
  color: #1e293b;
}
.switcher-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 16px;
  right: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  z-index: 40;
}
.switcher-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 8px;
  display: grid;
  gap: 6px;
}
.switcher-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
}
.switcher-item:hover {
  background: #f8fafc;
}
.switcher-footer {
  border-top: 1px solid #f3f4f6;
  padding: 8px;
}
.new-project {
  display: block;
  text-align: center;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  padding: 6px;
  font-size: 12px;
  color: #6b7280;
  text-decoration: none;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #cbd5f5;
}
.dot.active {
  background: #22c55e;
}
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.5rem 1rem;
}
.nav-group-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 1rem 1rem 0.5rem;
  letter-spacing: 0.05em;
}
.nav-item {
  display: flex;
  align-items: center;
  padding: 0.6rem 1rem;
  margin: 0.1rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-sub);
  transition: all 0.2s;
  cursor: pointer;
  gap: 0.5rem;
}
.nav-item:hover {
  background-color: #f1f5f9;
  color: var(--text-main);
}
.nav-item.active {
  background-color: #eef2ff;
  color: var(--primary);
}
.nav-item i {
  width: 1.25rem;
  text-align: center;
  font-size: 0.9rem;
}
.stage-badge {
  margin-left: auto;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
}
.badge-success { background: #dcfce7; color: #15803d; }
.badge-danger { background: #fee2e2; color: #b91c1c; }
.badge-info { background: #e0e7ff; color: #4338ca; }
.badge-warn { background: #fef3c7; color: #b45309; }
.sidebar-footer {
  border-top: 1px solid #f3f4f6;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.profile {
  display: flex;
  align-items: center;
  gap: 8px;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e8f0;
  object-fit: cover;
}
.name {
  font-size: 12px;
  font-weight: 700;
}
.logout {
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}
.header {
  grid-column: 2;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  z-index: 10;
}
.header-title {
  font-size: 1rem;
  font-weight: 700;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.btn-primary {
  background: var(--primary);
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-ghost {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #64748b;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}
.main-canvas {
  grid-column: 2;
  grid-row: 2;
  position: relative;
  overflow: hidden;
  background-color: #f1f5f9;
  padding: 0;
}
.tool-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}
.stage-container {
  max-width: 960px;
  margin: 0 auto;
  padding: 2.5rem 2rem;
  height: 100%;
  overflow-y: auto;
  background: white;
}
.stage-header {
  margin-bottom: 1.5rem;
}
.stage-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}
.stage-desc {
  color: #64748b;
  font-size: 0.9rem;
}
.status-banner {
  border-radius: 12px;
  border: 1px solid transparent;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  margin-bottom: 1.5rem;
}
.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 18px;
}
.status-title {
  font-weight: 600;
}
.status-meta {
  font-size: 12px;
  color: #6b7280;
}
.status-pending { border-color: #e5e7eb; background: #f9fafb; }
.status-draft { border-color: #fde68a; background: #fffbeb; }
.status-submitted { border-color: #c7d2fe; background: #eef2ff; }
.status-reviewed { border-color: #bbf7d0; background: #ecfdf3; }
.status-needs { border-color: #fecdd3; background: #fff1f2; }
.status-icon-pending { background: #e5e7eb; color: #6b7280; }
.status-icon-draft { background: #fef3c7; color: #b45309; }
.status-icon-submitted { background: #e0e7ff; color: #4338ca; }
.status-icon-reviewed { background: #dcfce7; color: #15803d; }
.status-icon-needs { background: #fee2e2; color: #b91c1c; }
.feedback-card {
  border: 1px solid #fde68a;
  background: #fffbeb;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 1.5rem;
}
.feedback-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.feedback-body {
  font-size: 13px;
  color: #7c2d12;
  white-space: pre-wrap;
}
.proposal-wrapper {
  display: grid;
  gap: 16px;
}
.proposal-actions {
  display: flex;
  justify-content: flex-end;
}
.stage-form {
  display: grid;
  gap: 16px;
}
.form-grid {
  display: grid;
  gap: 16px;
}
.form-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.9rem;
}
.form-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-sub);
  margin-bottom: 0.4rem;
}
.textarea {
  min-height: 120px;
  resize: vertical;
}
.required {
  color: #ef4444;
  margin-left: 4px;
}
.attachments {
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 8px;
}
.attachments-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
}
.file-list {
  display: grid;
  gap: 6px;
}
.file-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
  background: #f9fafb;
  padding: 6px 8px;
  border-radius: 8px;
}
.file-name {
  color: #111827;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
}
.inception-canvas {
  height: 100%;
  overflow-y: auto;
  padding: 2rem;
  background: #f8fafc;
}
.inception-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.hero-kicker {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #6366f1;
  letter-spacing: 0.06em;
  margin-bottom: 0.4rem;
}
.inception-hero h2 {
  font-size: 1.6rem;
  font-weight: 700;
  color: #1f2937;
}
.inception-hero p {
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 0.3rem;
}
.hero-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.inception-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  margin-bottom: 16px;
}
.inception-body {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
}
.inception-col {
  display: grid;
  gap: 16px;
}
.inception-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 12px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.percent {
  font-size: 1.4rem;
  font-weight: 700;
  color: #4f46e5;
}
.progress-bar {
  height: 6px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #6366f1;
}
.next-step {
  display: grid;
  gap: 6px;
}
.next-title {
  font-weight: 600;
  color: #111827;
}
.task-list {
  display: grid;
  gap: 10px;
}
.task-item {
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  background: #fafafa;
}
.task-left {
  display: flex;
  gap: 12px;
}
.task-index {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #eef2ff;
  color: #4338ca;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 12px;
}
.task-title {
  font-weight: 600;
  color: #111827;
}
.task-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.task-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
}
.status-done {
  background: #dcfce7;
  color: #15803d;
}
.status-pending {
  background: #fef3c7;
  color: #b45309;
}
.status-doing {
  background: #dbeafe;
  color: #1d4ed8;
}
.status-review {
  background: #fef3c7;
  color: #b45309;
}
.task-detail {
  font-size: 12px;
  margin-top: 4px;
}
.task-tip {
  font-size: 12px;
  margin-top: 4px;
  color: #6366f1;
}
.missing {
  font-size: 12px;
  color: #ef4444;
}
.wbs-preview {
  display: grid;
  gap: 6px;
}
.wbs-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.pill {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
}
.pill--m1 {
  background: #eef2ff;
  color: #4338ca;
}
.pill--m2 {
  background: #fef3c7;
  color: #b45309;
}
.pill--m3 {
  background: #dcfce7;
  color: #15803d;
}
.deliver-list {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: #374151;
  padding-left: 16px;
}
.warn {
  font-size: 12px;
  color: #dc2626;
}
.tip {
  font-size: 12px;
  color: #4f46e5;
}
.btn-primary.small,
.btn-ghost.small {
  font-size: 12px;
  padding: 6px 10px;
}
.btn-primary.small[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
.success {
  color: #059669;
}
@media (max-width: 1100px) {
  .inception-body {
    grid-template-columns: 1fr;
  }
  .inception-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
.implementation-canvas {
  height: 100%;
  overflow-y: auto;
  padding: 2rem;
  background: #f8fafc;
}
.implementation-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.implementation-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  margin-bottom: 16px;
}
.implementation-body {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 16px;
}
.impl-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 12px;
}
.repo-box {
  font-size: 12px;
  background: #f8fafc;
  border: 1px dashed #e5e7eb;
  padding: 8px;
  border-radius: 8px;
  color: #475569;
  word-break: break-all;
}
.log-preview {
  display: grid;
  gap: 8px;
}
.log-item {
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 10px;
  background: #fafafa;
}
.log-meta {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 4px;
}
.log-content {
  font-size: 12px;
  color: #334155;
}
.impl-list {
  display: grid;
  gap: 8px;
}
.impl-task {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  background: #f9fafb;
}
.impl-task-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
}
.impl-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
@media (max-width: 1100px) {
  .implementation-body {
    grid-template-columns: 1fr;
  }
  .implementation-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
.muted {
  color: #94a3b8;
  font-size: 12px;
}
.empty {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

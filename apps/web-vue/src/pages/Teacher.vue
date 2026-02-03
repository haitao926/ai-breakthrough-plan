<template>
  <div class="teacher-page text-gray-800">
    <nav class="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-3 shrink-0">
            <RouterLink to="/" class="flex items-center gap-2 group">
              <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md group-hover:bg-indigo-700 transition">AI</div>
              <span class="font-bold text-xl tracking-tight text-gray-900 group-hover:text-indigo-600 transition">破壁计划</span>
            </RouterLink>
            <span class="hidden md:inline-flex px-2 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full">教师管理</span>
          </div>

          <div class="hidden md:flex items-center space-x-1">
            <RouterLink to="/knowledge" class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center">
              <i class="fas fa-book-reader mr-2 text-xs"></i>创新知识库
            </RouterLink>
            <RouterLink to="/competencies" class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center">
              <i class="fas fa-graduation-cap mr-2 text-xs"></i>学术指导
            </RouterLink>
            <RouterLink to="/projects" class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center">
              <i class="fas fa-layer-group mr-2 text-xs"></i>项目库
            </RouterLink>
            <RouterLink to="/downloads" class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center">
              <i class="fas fa-folder-open mr-2 text-xs"></i>课程资料库
            </RouterLink>
          </div>

          <div class="flex gap-3 items-center shrink-0">
            <div class="hidden md:flex items-center gap-2 text-sm text-gray-600">
              <i class="fas fa-user-circle text-gray-400"></i>
              <span class="font-semibold">{{ currentUser?.name || '老师' }}</span>
            </div>
            <button class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800" @click="logout">
              退出
            </button>
          </div>
        </div>
      </div>
    </nav>

    <header class="pt-28 pb-10 bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-extrabold text-gray-900">教师项目管理后台</h1>
            <p class="text-gray-500 mt-2">集中查看学生项目、WBS 任务与关键提交物。</p>
          </div>
          <div class="flex gap-2">
            <button class="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" @click="refreshAll">
              <i class="fas fa-sync-alt mr-1"></i> 刷新
            </button>
            <RouterLink to="/mission-control" class="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <i class="fas fa-tower-observation mr-1"></i> 指挥塔
            </RouterLink>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-4 mt-6">
          <div class="bg-gray-50 rounded-xl p-4">
            <div class="text-xs text-gray-400">项目总数</div>
            <div class="text-xl font-bold text-gray-900">{{ stats.total }}</div>
          </div>
          <div class="bg-gray-50 rounded-xl p-4">
            <div class="text-xs text-gray-400">进行中</div>
            <div class="text-xl font-bold text-gray-900">{{ stats.inProgress }}</div>
          </div>
          <div class="bg-gray-50 rounded-xl p-4">
            <div class="text-xs text-gray-400">待审核项目</div>
            <div class="text-xl font-bold text-gray-900">{{ stats.submitted }}</div>
          </div>
          <div class="bg-gray-50 rounded-xl p-4">
            <div class="text-xs text-gray-400">待审批物资</div>
            <div class="text-xl font-bold text-gray-900">{{ pendingCount }}</div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid lg:grid-cols-[320px_1fr] gap-6">
        <aside class="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-900">学生项目</h2>
            <button class="text-xs text-gray-500 hover:text-indigo-600" @click="loadProjects">刷新</button>
          </div>
          <div class="space-y-3">
            <input v-model="keyword" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="搜索项目..." />
            <select v-model="statusFilter" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">全部状态</option>
              <option v-for="status in statusOptions" :key="status.value" :value="status.value">{{ status.label }}</option>
            </select>
            <select v-model="classFilter" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">全部班级</option>
              <option v-for="item in classOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </div>
          <div class="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            <button
              v-for="project in filteredProjects"
              :key="project.id"
              class="w-full text-left px-3 py-3 rounded-xl border transition"
              :class="project.id === selectedProject?.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'"
              @click="selectProject(project)"
            >
              <div class="font-semibold text-gray-900 truncate">{{ project.title }}</div>
              <div class="text-xs text-gray-500 mt-1 flex items-center justify-between">
                <span>{{ project.class_name || '未分组' }}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px]" :class="projectStatusTone(project.status)">{{ projectStatusLabel(project.status) }}</span>
              </div>
            </button>
            <div v-if="!filteredProjects.length" class="text-sm text-gray-400 text-center py-6">暂无项目</div>
          </div>

          <div class="pt-2 border-t border-gray-100">
            <button class="w-full px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" @click="tab = 'resources'">
              物资审批
              <span v-if="pendingCount" class="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{{ pendingCount }}</span>
            </button>
          </div>
        </aside>

        <section class="space-y-6">
          <div v-if="tab === 'resources'" class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-bold text-gray-900">物资审批</h3>
                <p class="text-xs text-gray-500 mt-1">处理学生的硬件与算力申请。</p>
              </div>
              <button class="text-xs text-gray-500 hover:text-indigo-600" @click="loadResources">刷新</button>
            </div>
            <div v-if="!resources.length" class="text-sm text-gray-400">暂无待审批申请</div>
            <div v-for="item in resources" :key="item.id" class="flex items-center justify-between border border-gray-100 rounded-xl p-4">
              <div>
                <div class="font-semibold text-gray-900">{{ item.project_title }}</div>
                <div class="text-xs text-gray-500">{{ item.item_name }} × {{ item.quantity }}</div>
                <div class="text-xs text-gray-400 mt-1">申请人：{{ item.requester_name || '-' }}</div>
              </div>
              <div class="flex gap-2">
                <button class="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg" @click="auditResource(item.id, 'approved')">通过</button>
                <button class="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg" @click="auditResource(item.id, 'rejected')">驳回</button>
              </div>
            </div>
          </div>

          <template v-else>
            <div v-if="!selectedProject" class="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">
              请选择左侧项目查看详情
            </div>

            <div v-else class="space-y-6">
              <section class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div class="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 class="text-xl font-bold text-gray-900">{{ selectedProject.title }}</h3>
                    <p class="text-sm text-gray-500 mt-1">{{ selectedProject.class_name || '-' }} | 负责人：{{ selectedProject.team_members || '未知' }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="px-3 py-1 rounded-full text-xs" :class="projectStatusTone(selectedProject.status)">{{ projectStatusLabel(selectedProject.status) }}</span>
                    <RouterLink :to="`/workspace?project=${selectedProject.id}`" class="px-3 py-2 text-xs bg-indigo-600 text-white rounded-lg">进入工作台</RouterLink>
                  </div>
                </div>
                <div class="grid gap-3 md:grid-cols-3 mt-4 text-xs text-gray-500">
                  <div class="bg-gray-50 rounded-lg p-3">
                    <div>项目状态</div>
                    <div class="font-semibold text-gray-900 mt-1">{{ projectStatusLabel(selectedProject.status) }}</div>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3">
                    <div>代码仓库</div>
                    <div class="font-semibold text-gray-900 mt-1 truncate">{{ selectedProject.gitea_repo_url || '未绑定' }}</div>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-3">
                    <div>提交数量</div>
                    <div class="font-semibold text-gray-900 mt-1">{{ submissions.length }}</div>
                  </div>
                </div>
              </section>

              <section class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div class="flex items-center justify-between">
                  <h4 class="text-lg font-bold text-gray-900">WBS 任务</h4>
                  <span class="text-xs text-gray-400">共 {{ milestoneCount }} 条</span>
                </div>
                <div class="grid gap-4 md:grid-cols-3 mt-4">
                  <div v-for="phase in ['m1','m2','m3']" :key="phase" class="bg-gray-50 rounded-xl p-4">
                    <div class="font-semibold text-gray-900 mb-2">{{ phaseLabel(phase) }}</div>
                    <div v-if="!wbs[phase].length" class="text-xs text-gray-400">无任务</div>
                    <div v-for="task in wbs[phase]" :key="task.id" class="bg-white rounded-lg p-3 border border-gray-100 mb-2">
                      <div class="text-sm font-medium text-gray-900">{{ task.title }}</div>
                      <div class="text-xs text-gray-400 mt-1 flex flex-wrap gap-3">
                        <span><i class="fas fa-user mr-1"></i>{{ task.assignee || '未分配' }}</span>
                        <span v-if="task.endDate"><i class="far fa-calendar mr-1"></i>{{ task.endDate }}</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px]" :class="milestoneTone(task.status)">{{ milestoneLabel(task.status) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div class="flex items-center justify-between">
                  <h4 class="text-lg font-bold text-gray-900">最新日志</h4>
                  <span class="text-xs text-gray-400">共 {{ logs.length }} 条</span>
                </div>
                <div v-if="!logs.length" class="text-sm text-gray-400 mt-4">暂无日志</div>
                <div v-else class="space-y-3 mt-4">
                  <div v-for="log in logs.slice(0, 5)" :key="log.id" class="border border-gray-100 rounded-lg p-3">
                    <div class="text-xs text-gray-400">{{ log.author_name || log.author || '学生' }} · {{ formatDate(log.created_at) }}</div>
                    <div class="text-sm text-gray-700 mt-1">{{ log.content }}</div>
                  </div>
                </div>
              </section>

              <section class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div class="flex items-center justify-between">
                  <h4 class="text-lg font-bold text-gray-900">关键提交物</h4>
                  <span class="text-xs text-gray-400">共 {{ submissions.length }} 条</span>
                </div>
                <div v-if="!submissions.length" class="text-sm text-gray-400 mt-4">暂无交付物</div>
                <div v-else class="space-y-4 mt-4">
                  <div v-for="sub in submissions" :key="sub.id" class="border border-gray-100 rounded-xl p-4">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div class="font-semibold text-gray-900">{{ submissionTypeLabel(sub.type) }}</div>
                        <div class="text-xs text-gray-400 mt-1">提交于 {{ formatDate(sub.created_at) }}</div>
                      </div>
                      <span class="px-2 py-1 rounded-full text-[10px]" :class="submissionTone(sub.status)">{{ submissionStatusLabel(sub.status) }}</span>
                    </div>

                    <div v-if="sub.content" class="text-sm text-gray-600 mt-3 whitespace-pre-line">
                      {{ expandMap[sub.id] ? sub.content : previewText(sub.content) }}
                    </div>

                    <div v-if="detailEntries(sub).length" class="grid gap-2 mt-3 text-xs text-gray-500">
                      <div v-for="item in visibleDetails(sub)" :key="item.label" class="flex flex-wrap gap-2">
                        <span class="text-gray-400">{{ item.label }}：</span>
                        <span class="text-gray-700">{{ item.value }}</span>
                      </div>
                    </div>

                    <div v-if="sub.attachments?.length" class="flex flex-wrap gap-2 mt-3">
                      <a v-for="file in sub.attachments" :key="file.url" :href="file.url" target="_blank" class="text-xs text-indigo-600 hover:underline">
                        <i class="fas fa-paperclip mr-1"></i>{{ file.name }}
                      </a>
                    </div>

                    <div v-if="sub.feedback" class="text-xs text-amber-600 mt-3">反馈：{{ sub.feedback }}</div>

                    <div class="flex flex-wrap items-center justify-between gap-2 mt-4">
                      <div class="flex gap-2">
                        <button class="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg" @click="openReview(sub, 'reviewed')">通过</button>
                        <button class="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg" @click="openReview(sub, 'needs_changes')">退回修改</button>
                      </div>
                      <button class="text-xs text-gray-500 hover:text-indigo-600" @click="toggleExpand(sub.id)">
                        {{ expandMap[sub.id] ? '收起详情' : '查看详情' }}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </template>
        </section>
      </div>
    </main>

    <div v-if="reviewModal.open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeReview"></div>
      <div class="relative bg-white w-full max-w-md mx-4 rounded-2xl p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-900">评审：{{ submissionTypeLabel(reviewModal.submission?.type) }}</h3>
        <p class="text-xs text-gray-400 mt-1">{{ reviewModal.status === 'reviewed' ? '通过评语（可选）' : '退回原因（必填）' }}</p>
        <textarea v-model="reviewModal.feedback" class="w-full mt-4 h-28 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="填写老师反馈..."></textarea>
        <div class="flex justify-end gap-2 mt-4">
          <button class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800" @click="closeReview">取消</button>
          <button class="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" :disabled="reviewing" @click="confirmReview">
            {{ reviewing ? '提交中...' : '提交评语' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch } from '@/api/client';
import { getCurrentUser, logout as doLogout } from '@/api/authApi';

const router = useRouter();
const currentUser = ref(null);
const tab = ref('projects');
const keyword = ref('');
const statusFilter = ref('');
const classFilter = ref('');

const projects = ref([]);
const selectedProject = ref(null);
const submissions = ref([]);
const logs = ref([]);
const wbs = ref({ m1: [], m2: [], m3: [] });
const resources = ref([]);
const pendingCount = ref(0);
const expandMap = ref({});

const reviewModal = ref({ open: false, submission: null, status: 'reviewed', feedback: '' });
const reviewing = ref(false);

const STATUS_LABELS = {
  draft: '草稿',
  submitted: '已提交',
  reviewing: '审核中',
  approved: '通过',
  rejected: '退回',
  in_progress: '进行中',
  midterm_review: '中期',
  final_review: '结题审核',
  archived: '归档'
};

const statusOptions = computed(() => Object.keys(STATUS_LABELS).map(key => ({ value: key, label: STATUS_LABELS[key] })));
const classOptions = computed(() => [...new Set(projects.value.map(p => p.class_name).filter(Boolean))]);

const filteredProjects = computed(() => {
  return projects.value.filter(p => {
    if (keyword.value && !p.title.includes(keyword.value)) return false;
    if (statusFilter.value && p.status !== statusFilter.value) return false;
    if (classFilter.value && p.class_name !== classFilter.value) return false;
    return true;
  });
});

const stats = computed(() => {
  const total = projects.value.length;
  const inProgress = projects.value.filter(p => p.status === 'in_progress').length;
  const submitted = projects.value.filter(p => ['submitted', 'reviewing'].includes(p.status)).length;
  return { total, inProgress, submitted };
});

const milestoneCount = computed(() => Object.values(wbs.value).reduce((acc, list) => acc + list.length, 0));

function projectStatusLabel(status) {
  return STATUS_LABELS[status] || status || '未知';
}

function projectStatusTone(status) {
  const map = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-blue-100 text-blue-600',
    reviewing: 'bg-blue-100 text-blue-600',
    approved: 'bg-green-100 text-green-600',
    rejected: 'bg-red-100 text-red-600',
    in_progress: 'bg-amber-100 text-amber-700',
    midterm_review: 'bg-purple-100 text-purple-600',
    final_review: 'bg-indigo-100 text-indigo-600',
    archived: 'bg-gray-200 text-gray-600'
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

function phaseLabel(phase) {
  const map = { m1: '立项', m2: '实施', m3: '结题' };
  return map[phase] || phase;
}

function milestoneLabel(status) {
  const map = { todo: '待办', doing: '进行中', review: '待验收', done: '已完成' };
  return map[status] || '待办';
}

function milestoneTone(status) {
  const map = {
    todo: 'bg-gray-100 text-gray-500',
    doing: 'bg-blue-100 text-blue-600',
    review: 'bg-amber-100 text-amber-700',
    done: 'bg-green-100 text-green-600'
  };
  return map[status] || 'bg-gray-100 text-gray-500';
}

function submissionTypeLabel(type) {
  const map = {
    proposal: '开题报告',
    milestone_1: '里程碑 1',
    milestone_2: '里程碑 2',
    midterm: '中期检查',
    final: '结题答辩',
    showcase: '展示墙'
  };
  return map[type] || type || '提交';
}

function submissionStatusLabel(status) {
  if (status === 'reviewed') return '已评审';
  if (status === 'needs_changes') return '需修改';
  if (status === 'submitted' || status === 'reviewing') return '已提交';
  return status || '提交';
}

function submissionTone(status) {
  if (status === 'reviewed') return 'bg-green-100 text-green-600';
  if (status === 'needs_changes') return 'bg-red-100 text-red-600';
  return 'bg-blue-100 text-blue-600';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  const pad = (num) => String(num).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function previewText(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length > 180 ? `${clean.slice(0, 180)}...` : clean;
}

const FIELD_LABELS = {
  problem: '问题与背景',
  goals: '目标',
  scope: '范围',
  approach: '技术路线',
  plan: '计划',
  teamMembers: '成员列表',
  progressSummary: '本次完成内容',
  coreContribution: '核心贡献',
  evidence: '证据链接/图片/视频',
  diagram: '流程图/架构图',
  nextPlan: '下一步计划',
  featureSummary: '功能完成情况',
  validation: '实验/测试验证',
  demoLink: '演示链接',
  progressCompare: '计划 vs 现状',
  issuesAdjust: '问题与调整',
  deliverables: '成果包清单',
  demo: '演示说明/视频',
  techSummary: '技术总结',
  reflection: '反思与展望',
  codeRepo: '代码仓库链接',
  codeCommit: '提交说明/Commit'
};

function detailEntries(sub) {
  const details = sub?.details || {};
  const orderedKeys = Object.keys(FIELD_LABELS).filter(key => Object.prototype.hasOwnProperty.call(details, key));
  const extraKeys = Object.keys(details).filter(key => !orderedKeys.includes(key));
  const keys = [...orderedKeys, ...extraKeys];
  return keys.map(key => ({
    label: FIELD_LABELS[key] || key,
    value: formatDetailValue(details[key])
  })).filter(item => item.value);
}

function formatDetailValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join('、');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function visibleDetails(sub) {
  const entries = detailEntries(sub);
  if (expandMap.value[sub.id]) return entries;
  return entries.slice(0, 4);
}

function toggleExpand(id) {
  expandMap.value = { ...expandMap.value, [id]: !expandMap.value[id] };
}

async function loadProjects() {
  try {
    const res = await apiFetch('/projects');
    const data = await res.json();
    projects.value = data.projects || [];
  } catch (err) {
    console.error(err);
    projects.value = [];
  }
}

async function loadResources() {
  try {
    const res = await apiFetch('/admin/resources?status=pending');
    const data = await res.json();
    resources.value = data.requests || [];
    pendingCount.value = resources.value.length;
  } catch (err) {
    console.error(err);
    resources.value = [];
    pendingCount.value = 0;
  }
}

function normalizeMilestoneStatus(status) {
  if (!status) return 'todo';
  if (['todo', 'doing', 'review', 'done'].includes(status)) return status;
  const map = { pending: 'todo', submitted: 'review', approved: 'done', rejected: 'todo' };
  return map[status] || 'todo';
}

async function selectProject(project) {
  tab.value = 'projects';
  selectedProject.value = project;
  submissions.value = [];
  logs.value = [];
  wbs.value = { m1: [], m2: [], m3: [] };
  expandMap.value = {};

  try {
    const detailRes = await apiFetch(`/projects/${project.id}`);
    const detailData = await detailRes.json();
    submissions.value = detailData.submissions || [];
    logs.value = detailData.logs || [];
  } catch (err) {
    console.error(err);
  }

  try {
    const milestoneRes = await apiFetch(`/projects/${project.id}/milestones`);
    const milestoneData = await milestoneRes.json();
    const milestones = milestoneData.milestones || [];
    const tasks = milestones.map(item => ({
      id: item.id,
      title: item.title,
      phase: item.description || 'm1',
      status: normalizeMilestoneStatus(item.status),
      assignee: item.assignee || '',
      endDate: item.end_date || item.deadline || ''
    }));
    wbs.value = {
      m1: tasks.filter(t => t.phase === 'm1'),
      m2: tasks.filter(t => t.phase === 'm2'),
      m3: tasks.filter(t => t.phase === 'm3')
    };
  } catch (err) {
    console.error(err);
  }
}

function openReview(submission, status) {
  reviewModal.value = { open: true, submission, status, feedback: '' };
}

function closeReview() {
  reviewModal.value = { open: false, submission: null, status: 'reviewed', feedback: '' };
}

async function confirmReview() {
  const { submission, status, feedback } = reviewModal.value;
  if (!submission) return;
  if (status === 'needs_changes' && !feedback.trim()) {
    window.alert('退回修改必须填写原因/建议');
    return;
  }
  reviewing.value = true;
  try {
    const res = await apiFetch(`/submissions/${submission.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, feedback })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '提交失败');
    closeReview();
    await selectProject(selectedProject.value);
  } catch (err) {
    window.alert(err.message || '提交失败');
  } finally {
    reviewing.value = false;
  }
}

function refreshAll() {
  loadProjects();
  loadResources();
  if (selectedProject.value) {
    selectProject(selectedProject.value);
  }
}

function logout() {
  doLogout();
  router.replace('/login');
}

onMounted(async () => {
  const user = getCurrentUser();
  if (!user) {
    window.sessionStorage.setItem('auth_redirect', '/teacher');
    router.replace('/login');
    return;
  }
  if (user.role !== 'teacher' && user.role !== 'judge') {
    router.replace('/workspace');
    return;
  }
  currentUser.value = user;
  await loadProjects();
  await loadResources();
});

watch(tab, (value) => {
  if (value === 'resources') {
    loadResources();
  }
});
</script>

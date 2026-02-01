<template>
  <section class="teacher">
    <aside class="sidebar">
      <div class="brand">教师管理后台</div>
      <nav>
        <button :class="{ active: tab === 'projects' }" @click="tab = 'projects'">学生项目</button>
        <button :class="{ active: tab === 'resources' }" @click="tab = 'resources'">
          物资审批
          <span v-if="pendingCount" class="badge">{{ pendingCount }}</span>
        </button>
        <RouterLink class="nav-link" to="/mission-control" target="_blank">实时指挥塔</RouterLink>
      </nav>
      <div class="profile">
        <div class="avatar">T</div>
        <div>
          <div class="name">{{ currentUser?.name || '老师' }}</div>
          <button class="link" @click="logout">退出登录</button>
        </div>
      </div>
    </aside>

    <main class="content">
      <div v-if="tab === 'projects'" class="panel">
        <header class="panel__header">
          <div>
            <h2>项目管理</h2>
            <p class="muted">选择项目查看 WBS、日志与提交记录。</p>
          </div>
          <div class="toolbar">
            <input v-model="keyword" placeholder="搜索项目..." />
            <button class="ghost" @click="loadProjects">刷新</button>
          </div>
        </header>

        <div class="panel__body">
          <div class="list">
            <div
              v-for="project in filteredProjects"
              :key="project.id"
              class="list-item"
              :class="{ active: project.id === selectedProject?.id }"
              @click="selectProject(project)"
            >
              <div class="title">{{ project.title }}</div>
              <div class="meta">
                <span>{{ project.class_name || '未分组' }}</span>
                <span class="status" :class="statusTone(project.status)">{{ project.status }}</span>
              </div>
            </div>
            <div v-if="!filteredProjects.length" class="empty">暂无项目</div>
          </div>

          <div class="detail">
            <div v-if="!selectedProject" class="empty">请选择左侧项目查看详情</div>
            <div v-else>
              <div class="detail__header">
                <div>
                  <h3>{{ selectedProject.title }}</h3>
                  <p class="muted">{{ selectedProject.class_name || '-' }} | 负责人：{{ selectedProject.team_members || '未知' }}</p>
                </div>
                <span class="status-pill" :class="statusTone(selectedProject.status)">{{ selectedProject.status }}</span>
              </div>

              <section>
                <h4>WBS 规划</h4>
                <div class="wbs-grid">
                  <div v-for="phase in ['m1','m2','m3']" :key="phase" class="wbs-col">
                    <div class="wbs-title">{{ phaseLabel(phase) }}</div>
                    <div v-if="!wbs[phase].length" class="muted">无任务</div>
                    <div v-for="task in wbs[phase]" :key="task.id" class="wbs-item">{{ task.title }}</div>
                  </div>
                </div>
              </section>

              <section>
                <h4>最新日志</h4>
                <div v-if="!logs.length" class="muted">暂无日志</div>
                <div v-for="log in logs" :key="log.id" class="log-item">
                  <span class="log-time">{{ formatDate(log.created_at) }}</span>
                  <span>{{ log.content }}</span>
                </div>
              </section>

              <section>
                <h4>关键节点交付物</h4>
                <div v-if="!submissions.length" class="muted">暂无交付物</div>
                <div v-for="sub in submissions" :key="sub.id" class="submission">
                  <div class="submission__header">
                    <div>
                      <div class="submission__title">{{ sub.title || sub.type }}</div>
                      <div class="muted">提交于 {{ formatDate(sub.created_at) }}</div>
                    </div>
                    <span class="status-pill" :class="statusTone(sub.status)">{{ statusLabel(sub.status) }}</span>
                  </div>
                  <div v-if="sub.content" class="submission__body">{{ sub.content }}</div>
                  <div v-if="sub.feedback" class="submission__feedback">反馈：{{ sub.feedback }}</div>
                  <div class="submission__attachments">
                    <a
                      v-for="file in sub.attachments || []"
                      :key="file.url"
                      :href="file.url"
                      target="_blank"
                    >
                      {{ file.name }}
                    </a>
                    <span v-if="!sub.attachments?.length" class="muted">无附件</span>
                  </div>
                  <div class="submission__actions">
                    <button class="approve" @click="reviewSubmission(sub, 'reviewed')">通过</button>
                    <button class="reject" @click="reviewSubmission(sub, 'needs_changes')">退回修改</button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="panel">
        <header class="panel__header">
          <div>
            <h2>物资审批</h2>
            <p class="muted">处理学生的硬件与算力申请。</p>
          </div>
          <button class="ghost" @click="loadResources">刷新</button>
        </header>
        <div class="resources">
          <div v-if="!resources.length" class="muted">暂无待审批申请</div>
          <div v-for="item in resources" :key="item.id" class="resource-card">
            <div>
              <div class="title">{{ item.project_title }}</div>
              <div class="muted">{{ item.item_name }} × {{ item.quantity }}</div>
              <div class="muted">申请人：{{ item.requester_name || '-' }}</div>
            </div>
            <div class="actions">
              <button class="approve" @click="auditResource(item.id, 'approved')">通过</button>
              <button class="reject" @click="auditResource(item.id, 'rejected')">驳回</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </section>
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

const projects = ref([]);
const selectedProject = ref(null);
const submissions = ref([]);
const logs = ref([]);
const wbs = ref({ m1: [], m2: [], m3: [] });
const resources = ref([]);
const pendingCount = ref(0);

const filteredProjects = computed(() => {
  if (!keyword.value) return projects.value;
  return projects.value.filter(p => p.title.includes(keyword.value));
});

function phaseLabel(phase) {
  const map = { m1: '里程碑 1', m2: '里程碑 2', m3: '里程碑 3' };
  return map[phase] || phase;
}

function statusLabel(status) {
  if (status === 'reviewed') return '已评审';
  if (status === 'needs_changes') return '需修改';
  if (status === 'submitted' || status === 'reviewing') return '已提交';
  return status || '提交';
}

function statusTone(status) {
  if (status === 'reviewed') return 'status--success';
  if (status === 'needs_changes') return 'status--danger';
  if (status === 'submitted' || status === 'reviewing') return 'status--info';
  return 'status--info';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  const pad = (num) => String(num).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

async function selectProject(project) {
  selectedProject.value = project;
  submissions.value = [];
  logs.value = [];
  wbs.value = { m1: [], m2: [], m3: [] };

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
    wbs.value = {
      m1: milestones.filter(t => t.description === 'm1'),
      m2: milestones.filter(t => t.description === 'm2'),
      m3: milestones.filter(t => t.description === 'm3')
    };
  } catch (err) {
    console.error(err);
  }
}

async function reviewSubmission(submission, status) {
  let feedback = '';
  if (status === 'needs_changes') {
    feedback = window.prompt('请填写需要修改的原因/建议：', '') || '';
    if (!feedback.trim()) return;
  } else {
    feedback = window.prompt('通过评语（可选）：', '') || '';
  }

  try {
    const res = await apiFetch(`/submissions/${submission.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, feedback })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '提交失败');
    await selectProject(selectedProject.value);
  } catch (err) {
    window.alert(err.message || '提交失败');
  }
}

async function auditResource(id, status) {
  if (!window.confirm(`确定要${status === 'approved' ? '通过' : '驳回'}该申请吗？`)) return;
  await apiFetch(`/resources/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  loadResources();
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

<style scoped>
.teacher {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}
.sidebar {
  background: #fff;
  border-right: 1px solid #e5e7eb;
  padding: 16px;
  display: grid;
  gap: 16px;
}
.brand {
  font-weight: 700;
}
nav {
  display: grid;
  gap: 8px;
}
nav button,
.nav-link {
  border: none;
  background: transparent;
  text-align: left;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #4b5563;
  text-decoration: none;
}
nav button.active {
  background: #eef2ff;
  color: #4338ca;
}
.badge {
  margin-left: auto;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
}
.profile {
  display: flex;
  gap: 8px;
  align-items: center;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e7ff;
  display: grid;
  place-items: center;
}
.link {
  border: none;
  background: transparent;
  color: #ef4444;
  cursor: pointer;
  font-size: 12px;
}
.content {
  padding: 20px;
}
.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px;
  display: grid;
  gap: 16px;
}
.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}
.toolbar input {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 6px 10px;
}
.ghost {
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}
.panel__body {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
}
.list {
  border-right: 1px solid #f3f4f6;
  padding-right: 12px;
  display: grid;
  gap: 8px;
}
.list-item {
  border: 1px solid #f3f4f6;
  border-radius: 10px;
  padding: 10px;
  cursor: pointer;
}
.list-item.active {
  border-color: #c7d2fe;
  background: #eef2ff;
}
.title {
  font-weight: 600;
}
.meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}
.detail {
  display: grid;
  gap: 16px;
}
.detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.status-pill {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
}
.status--success {
  background: #dcfce7;
  color: #15803d;
}
.status--danger {
  background: #fee2e2;
  color: #b91c1c;
}
.status--info {
  background: #e0e7ff;
  color: #4338ca;
}
.wbs-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}
.wbs-col {
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 8px;
}
.wbs-title {
  font-size: 12px;
  color: #6b7280;
}
.wbs-item {
  font-size: 13px;
  background: #f9fafb;
  padding: 6px 8px;
  border-radius: 8px;
}
.log-item {
  font-size: 12px;
  color: #374151;
  padding: 6px 0;
  border-bottom: 1px dashed #f3f4f6;
}
.log-time {
  color: #9ca3af;
  margin-right: 8px;
}
.submission {
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 8px;
}
.submission__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.submission__title {
  font-weight: 600;
}
.submission__body {
  font-size: 13px;
  color: #374151;
  white-space: pre-wrap;
}
.submission__feedback {
  font-size: 12px;
  color: #b45309;
}
.submission__attachments {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
}
.submission__attachments a {
  color: #4f46e5;
  text-decoration: none;
}
.submission__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.approve {
  background: #4f46e5;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}
.reject {
  background: #fee2e2;
  color: #b91c1c;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}
.resources {
  display: grid;
  gap: 12px;
}
.resource-card {
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.actions {
  display: flex;
  gap: 8px;
}
.muted {
  font-size: 12px;
  color: #6b7280;
}
.empty {
  font-size: 12px;
  color: #9ca3af;
  padding: 12px;
}
</style>

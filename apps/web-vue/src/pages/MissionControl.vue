<template>
  <div class="mission">
    <header class="mission-header">
      <div class="title">
        <RouterLink to="/teacher" class="back">返回后台</RouterLink>
        <h1>Mission Control Center</h1>
      </div>
      <div class="meta">
        <span>Projects: {{ projects.length }}</span>
        <button class="ghost" @click="loadProjects">刷新</button>
      </div>
    </header>

    <main class="mission-body">
      <aside class="list">
        <div v-if="!projects.length" class="muted">暂无项目</div>
        <div
          v-for="project in projects"
          :key="project.id"
          class="list-item"
          :class="{ active: project.id === selectedId }"
          @click="selectProject(project.id)"
        >
          <div class="list-title">{{ project.name }}</div>
          <div class="list-meta">任务进度 {{ project.taskStats.done }}/{{ project.taskStats.total }}</div>
          <div class="progress">
            <div class="progress-bar" :style="{ width: `${project.taskStats.progress}%` }"></div>
          </div>
        </div>
      </aside>

      <section class="detail">
        <div v-if="!detail" class="empty">请选择项目查看详情</div>
        <div v-else>
          <div class="detail-header">
            <div>
              <h2>{{ detail.project.title }}</h2>
              <p class="muted">{{ detail.project.team_members || '无成员信息' }}</p>
            </div>
            <div class="muted">更新时间 {{ formatDate(detail.project.updated_at) }}</div>
          </div>

          <div class="progress-wrap">
            <div class="progress-label">
              <span>任务完成度</span>
              <span>{{ progress }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
            </div>
          </div>

          <div class="grid">
            <div v-for="phase in ['m1','m2','m3']" :key="phase" class="column">
              <h4>{{ phaseLabel(phase) }}</h4>
              <div v-if="!wbs[phase].length" class="muted">无任务</div>
              <div v-for="task in wbs[phase]" :key="task.id" class="task">{{ task.title }}</div>
            </div>
          </div>

          <div class="logs">
            <h3>开发日志</h3>
            <div v-if="!detail.logs?.length" class="muted">暂无日志</div>
            <div v-for="log in (detail.logs || []).slice(0, 6)" :key="log.id" class="log-item">
              <span class="muted">{{ formatDate(log.created_at) }}</span>
              <span>{{ log.content }}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiFetch } from '@/api/client';

const projects = ref([]);
const selectedId = ref(null);
const detail = ref(null);
const wbs = ref({ m1: [], m2: [], m3: [] });
const progress = ref(0);

function phaseLabel(phase) {
  const map = { m1: 'Phase 1', m2: 'Phase 2', m3: 'Phase 3' };
  return map[phase] || phase;
}

function formatDate(value) {
  if (!value) return '--';
  const date = new Date(value);
  return `${date.getMonth() + 1}-${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

async function loadProjects() {
  try {
    const res = await apiFetch('/mission/projects');
    const data = await res.json();
    projects.value = data.projects || [];
  } catch (err) {
    console.error(err);
    projects.value = [];
  }
}

async function selectProject(id) {
  selectedId.value = id;
  try {
    const res = await apiFetch(`/projects/${id}`);
    const data = await res.json();
    detail.value = data;
  } catch (err) {
    console.error(err);
    detail.value = null;
  }
  try {
    const res = await apiFetch(`/projects/${id}/milestones`);
    const data = await res.json();
    const tasks = data.milestones || [];
    wbs.value = {
      m1: tasks.filter(t => t.description === 'm1'),
      m2: tasks.filter(t => t.description === 'm2'),
      m3: tasks.filter(t => t.description === 'm3')
    };
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    progress.value = total ? Math.round((done / total) * 100) : 0;
  } catch (err) {
    console.error(err);
    wbs.value = { m1: [], m2: [], m3: [] };
    progress.value = 0;
  }
}

onMounted(async () => {
  await loadProjects();
});
</script>

<style scoped>
.mission {
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
}
.mission-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.title {
  display: flex;
  gap: 12px;
  align-items: center;
}
.back {
  color: #93c5fd;
  text-decoration: none;
}
.meta {
  display: flex;
  gap: 12px;
  align-items: center;
}
.ghost {
  border: 1px solid rgba(255,255,255,0.2);
  background: transparent;
  color: #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.mission-body {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr;
}
.list {
  border-right: 1px solid rgba(255,255,255,0.1);
  padding: 16px;
  display: grid;
  gap: 12px;
}
.list-item {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
}
.list-item.active {
  border-color: #6366f1;
}
.progress {
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 6px;
}
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #22d3ee);
}
.detail {
  padding: 24px;
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.progress-wrap {
  margin-bottom: 16px;
}
.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.progress-track {
  height: 10px;
  background: rgba(255,255,255,0.1);
  border-radius: 999px;
  overflow: hidden;
}
.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-bottom: 16px;
}
.column {
  background: rgba(30, 41, 59, 0.6);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(255,255,255,0.08);
}
.task {
  font-size: 12px;
  padding: 6px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 8px;
  margin-top: 6px;
}
.logs {
  background: rgba(30, 41, 59, 0.6);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(255,255,255,0.08);
}
.log-item {
  font-size: 12px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.muted {
  font-size: 12px;
  color: #94a3b8;
}
.empty {
  color: #94a3b8;
}
</style>

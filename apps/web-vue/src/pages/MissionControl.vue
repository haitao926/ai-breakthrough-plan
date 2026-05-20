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
  background: radial-gradient(circle at 50% 0%, #17153b, #0c0a1c);
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  background-image: 
    linear-gradient(rgba(99, 102, 241, 0.02) 1px, transparent 1px), 
    linear-gradient(90deg, rgba(99, 102, 241, 0.02) 1px, transparent 1px);
  background-size: 32px 32px;
}

.mission-header {
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(12, 10, 28, 0.4);
  backdrop-filter: blur(12px);
}

.title {
  display: flex;
  gap: 20px;
  align-items: center;
}

.title h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #a5b4fc, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
}

.back {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 800;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.25s ease;
}

.back:hover {
  color: #fff;
  border-color: rgba(99, 102, 241, 0.3);
  background: rgba(99, 102, 241, 0.1);
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.15);
}

.meta {
  display: flex;
  gap: 16px;
  align-items: center;
}

.meta span {
  font-size: 0.85rem;
  font-weight: 800;
  color: #818cf8;
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.03);
  color: #f1f5f9;
  padding: 8px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 800;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.ghost:hover {
  background: #fff;
  color: #0c0a1c;
  border-color: #fff;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
}

.mission-body {
  flex: 1;
  display: grid;
  grid-template-columns: 320px 1fr;
}

.list {
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  padding: 24px;
  display: grid;
  gap: 14px;
  align-content: start;
  background: rgba(12, 10, 28, 0.2);
}

.list-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.list-item:hover {
  transform: translateY(-2px);
  background: rgba(99, 102, 241, 0.04);
  border-color: rgba(99, 102, 241, 0.2);
}

.list-item.active {
  background: rgba(99, 102, 241, 0.08);
  border-color: #6366f1;
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.15);
}

.list-title {
  font-weight: 800;
  font-size: 0.95rem;
  color: #fff;
  margin-bottom: 4px;
}

.list-meta {
  font-size: 0.76rem;
  color: #94a3b8;
  font-weight: 700;
}

.progress {
  height: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 10px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #06b6d4);
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.detail {
  padding: 32px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 800;
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.01);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 24px;
}

.detail-header h2 {
  margin: 0 0 6px 0;
  font-size: 1.6rem;
  font-weight: 900;
  color: #fff;
}

.progress-wrap {
  margin-bottom: 28px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 24px;
  padding: 20px 24px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.85rem;
  font-weight: 800;
  color: #a5b4fc;
}

.progress-track {
  height: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 999px;
  overflow: hidden;
}

.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: 24px;
}

.column {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  min-height: 200px;
}

.column h4 {
  margin: 0 0 12px 0;
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #818cf8;
}

.task {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  margin-top: 8px;
  color: #e2e8f0;
  transition: all 0.2s ease;
}

.task:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(99, 102, 241, 0.2);
}

.logs {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 24px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.logs h3 {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 900;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.log-item {
  font-size: 0.82rem;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  gap: 16px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item span:first-child {
  font-family: monospace;
  font-weight: 800;
  color: #6366f1;
}

.log-item span:last-child {
  color: #e2e8f0;
}

.muted {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 700;
}

@media (max-width: 980px) {
  .mission-body {
    grid-template-columns: 1fr;
  }
  .list {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
}
</style>

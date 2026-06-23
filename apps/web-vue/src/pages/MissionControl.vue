<template>
  <div class="mission bg-[#0b0f19] text-[#f1f5f9] min-h-dvh flex flex-col font-sans">
    <header class="mission-header border-b border-slate-800 bg-slate-950 sticky top-0 z-50">
      <div class="app-page-shell app-page-shell--wide mission-header__inner">
        <div class="title flex items-center gap-4">
          <RouterLink to="/teacher/review" class="back border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-colors px-4 py-2 rounded-xl text-xs font-black uppercase">返回项目干预</RouterLink>
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-2.5 bg-teal-400 rounded-full"></div>
            <h1 class="text-lg font-black uppercase text-teal-300 font-mono">项目监测大屏</h1>
          </div>
        </div>
        <div class="meta flex items-center gap-6">
          <span class="text-xs font-mono font-bold text-slate-400">监控队列：<strong class="text-teal-300 font-black">{{ projects.length }} 个项目</strong></span>
          <button class="ghost border border-slate-800 bg-slate-900/60 hover:bg-white hover:text-slate-950 hover:border-white transition-colors text-xs font-extrabold px-4 py-2 rounded-xl" @click="loadProjects">刷新数据</button>
        </div>
      </div>
    </header>

    <main class="mission-body flex-1">
      <div class="app-page-shell app-page-shell--wide mission-body__shell">
        <div class="mission-grid grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          <!-- Sidebar List -->
          <aside class="list lg:col-span-3 border-r border-slate-800 bg-slate-950/30 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            <div v-if="!projects.length" class="text-center py-20 text-xs font-mono font-bold text-slate-600">当前没有需要监控的项目。</div>
            <div
              v-for="project in projects"
              :key="project.id"
              class="list-item bg-slate-900/40 border border-slate-900 hover:border-teal-500/30 hover:bg-slate-900/80 p-5 rounded-2xl cursor-pointer transition-colors duration-150 relative overflow-hidden group"
              :class="{ active: project.id === selectedId }"
              @click="selectProject(project.id)"
            >
              <div class="flex items-center justify-between gap-3 mb-2">
                <h4 class="font-extrabold text-sm text-slate-200 group-hover:text-white transition-colors truncate flex-1 flex items-center gap-2">
                  <span v-if="project.taskStats.progress > 0" class="relative flex h-2 w-2">
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
                  </span>
                  {{ project.name }}
                </h4>
                <span class="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-bold shrink-0">
                  {{ project.taskStats.progress }}%
                </span>
              </div>

              <div class="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500">
                <span>MILESTONES DEPLOYED</span>
                <span>{{ project.taskStats.done }}/{{ project.taskStats.total }}</span>
              </div>

              <div class="progress h-1 bg-slate-950 rounded-full overflow-hidden mt-3">
                <div class="progress-bar h-full bg-teal-500" :style="{ width: `${project.taskStats.progress}%` }"></div>
              </div>
            </div>
          </aside>

          <section class="detail lg:col-span-9 p-8 overflow-y-auto custom-scrollbar flex flex-col justify-between">
            <div v-if="!detail" class="empty border border-dashed border-slate-800 rounded-3xl bg-slate-950/20 flex flex-col items-center justify-center py-40 text-slate-500 space-y-4">
              <i class="fas fa-radar text-4xl text-slate-700"></i>
              <span class="text-xs font-mono font-bold uppercase text-slate-600">Select target node to establish telemetry connection</span>
            </div>
            <div v-else class="space-y-6">
              <div class="detail-header flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-800 pb-6">
                <div class="space-y-1">
                  <div class="flex items-center gap-3">
                    <span class="px-2.5 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-teal-500/10 text-teal-300 border border-teal-500/30">ONLINE TELEMETRY</span>
                    <span class="text-xs font-mono font-bold text-slate-500">ID: {{ selectedId.slice(0, 8) }}</span>
                  </div>
                  <h2 class="text-2xl font-black text-white">{{ detail.project.title }}</h2>
                  <p class="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <i class="fas fa-users text-slate-500"></i> {{ detail.project.team_members || '未知成员' }}
                  </p>
                </div>
                <div class="text-xs font-mono text-slate-500 font-bold bg-slate-950/40 border border-slate-900 px-4 py-2 rounded-xl">
                  LAST UPDATE: <span class="text-slate-300">{{ formatDate(detail.project.updated_at) }}</span>
                </div>
              </div>

              <div class="progress-wrap bg-slate-950/30 border border-slate-800 p-6 rounded-2xl space-y-3">
                <div class="progress-label flex justify-between items-center text-xs font-mono font-bold text-teal-300">
                  <span>PROJECT OVERALL PERFORMANCE TELEMETRY</span>
                  <span class="text-teal-300 font-black">{{ progress }}%</span>
                </div>
                <div class="progress-track h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                  <div class="progress-bar h-full bg-teal-500" :style="{ width: `${progress}%` }"></div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div v-for="phase in ['m1','m2','m3']" :key="phase" class="column bg-slate-950/20 border border-slate-800 p-6 rounded-2xl min-h-[220px]">
                  <h4 class="text-[10px] font-mono font-black uppercase text-teal-300 border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
                    <span>{{ phaseLabel(phase) }}</span>
                    <span class="size-1.5 rounded-full bg-teal-400"></span>
                  </h4>
                  <div v-if="!wbs[phase].length" class="text-xs font-mono italic text-slate-600 py-6 text-center">NO DEPLOYED TASKS</div>
                  <div v-for="task in wbs[phase]" :key="task.id" class="task bg-[#111422] hover:bg-[#161a2e] border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-default mb-2 flex items-center justify-between">
                    <span>{{ task.title }}</span>
                    <span class="w-1.5 h-1.5 rounded-full" :class="task.status === 'done' || task.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
                  </div>
                </div>
              </div>

              <div class="logs-console bg-slate-950 border border-teal-500/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                <div class="console-header bg-slate-900/60 px-6 py-3 border-b border-slate-800 flex items-center">
                  <div class="flex gap-1.5">
                    <div class="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <span class="text-[10px] font-mono font-black uppercase text-slate-500 ml-4">DEVLOGS TELEMETRY STREAM</span>
                </div>
                <div class="console-body p-6 max-h-60 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
                  <div v-if="!detail.logs?.length" class="console-line font-mono text-xs text-slate-500">SYSTEM: NO DEPLOYMENT LOGS DETECTED ON TARGET TELEMETRY.</div>
                  <div v-for="log in (detail.logs || [])" :key="log.id" class="console-line font-mono text-xs flex gap-3 items-start">
                    <span class="text-teal-300 font-bold shrink-0">[{{ formatDate(log.created_at) }}]</span>
                    <span class="text-teal-300 font-bold shrink-0">$</span>
                    <span class="text-emerald-400 leading-relaxed">{{ log.content }}</span>
                  </div>
                  <div class="console-line font-mono text-xs text-emerald-400/50 flex gap-2 items-center">
                    <span>> TELEMETRY LOG WATCHER ACTIVE [WAITING FOR STACK PULSE]</span>
                    <span class="w-1.5 h-4 bg-emerald-400 shrink-0"></span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
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
  const map = { m1: '阶段 1', m2: '阶段 2', m3: '阶段 3' };
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
  min-height: 100dvh;
  background: #090d16;
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
  font-family: inherit;
}

.mission-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: #020617;
}

.mission-header__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 24px clamp(16px, 2vw, 24px);
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
  color: #5eead4;
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
  transition: color 0.18s ease, border-color 0.18s ease, background-color 0.18s ease;
}

.back:hover {
  color: #fff;
  border-color: rgba(45, 212, 191, 0.3);
  background: rgba(20, 184, 166, 0.1);
}

.meta {
  display: flex;
  gap: 16px;
  align-items: center;
}

.meta span {
  font-size: 0.85rem;
  font-weight: 800;
  color: #5eead4;
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
  transition: color 150ms ease-out, border-color 150ms ease-out, background-color 150ms ease-out;
}

.ghost:hover {
  background: #fff;
  color: #0c0a1c;
  border-color: #fff;
}

.mission-body {
  flex: 1;
  padding: 24px clamp(16px, 2vw, 24px) 32px;
}

.mission-body__shell {
  flex: 1;
}

.mission-grid {
  min-height: calc(100dvh - 150px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 32px;
  background: rgba(2, 6, 23, 0.45);
}

.list {
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  padding: 16px;
  display: grid;
  gap: 14px;
  align-content: start;
  background: rgba(12, 10, 28, 0.2);
}

.list-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: border-color 150ms ease-out, background-color 150ms ease-out;
}

.list-item:hover {
  background: rgba(20, 184, 166, 0.06);
  border-color: rgba(20, 184, 166, 0.18);
}

.list-item.active {
  background: rgba(15, 118, 110, 0.08);
  border-color: #0f766e;
  box-shadow: 0 8px 30px rgba(15, 118, 110, 0.08);
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
  background: #0f766e;
  box-shadow: none;
  transition: none;
}

.detail {
  padding: 16px;
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
  border-radius: 12px;
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
  border-radius: 12px;
  padding: 20px 24px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.85rem;
  font-weight: 800;
  color: #5eead4;
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
  border-radius: 10px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  min-height: 200px;
}

.column h4 {
  margin: 0 0 12px 0;
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
  color: #5eead4;
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
  transition: background-color 150ms ease-out, border-color 150ms ease-out;
}

.task:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(20, 184, 166, 0.18);
}

.logs-console {
  background: #05070f;
  border: 1px solid rgba(6, 182, 212, 0.15);
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
}

.console-body {
  font-family: 'Outfit', monospace;
  background-image: none;
}


.list-item.active {
  border-color: #0f766e;
  background: rgba(15, 118, 110, 0.08);
  box-shadow: 0 8px 30px rgba(15, 118, 110, 0.08);
}

.muted {
  font-size: 0.8rem;
  color: #475569;
  font-weight: 700;
}

@media (max-width: 980px) {
  .mission-header__inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .mission-grid {
    min-height: auto;
  }

  .list {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
}
</style>

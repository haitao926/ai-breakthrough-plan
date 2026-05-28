<template>
  <div class="mission bg-[#0b0f19] text-[#f1f5f9] min-h-screen flex flex-col font-sans">
    <header class="mission-header border-b border-indigo-950 bg-slate-950/80 backdrop-blur-xl px-8 py-5 flex items-center justify-between sticky top-0 z-50">
      <div class="title flex items-center gap-4">
        <RouterLink to="/teacher" class="back border border-indigo-900 bg-indigo-950/20 text-indigo-400 hover:text-white hover:bg-indigo-900/50 hover:border-indigo-600 transition-all px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase">返回后台</RouterLink>
        <div class="flex items-center gap-3">
          <div class="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping"></div>
          <h1 class="text-lg font-black uppercase tracking-wider text-cyan-400 font-mono">HAI Cyber Control Center</h1>
        </div>
      </div>
      <div class="meta flex items-center gap-6">
        <span class="text-xs font-mono font-bold text-slate-400">MONITOR QUEUE: <strong class="text-cyan-400 font-black">{{ projects.length }} PROJECTS</strong></span>
        <button class="ghost border border-slate-800 bg-slate-900/60 hover:bg-white hover:text-slate-950 hover:border-white transition-all text-xs font-extrabold px-4 py-2 rounded-xl" @click="loadProjects">REFRESH DATA</button>
      </div>
    </header>

    <main class="mission-body flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-73px)]">
      <!-- Sidebar List -->
      <aside class="list lg:col-span-3 border-r border-indigo-950 bg-slate-950/30 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
        <div v-if="!projects.length" class="text-center py-20 text-xs font-mono font-bold text-slate-600">SYSTEM: NO INCEPTION TARGETS DETECTED.</div>
        <div
          v-for="project in projects"
          :key="project.id"
          class="list-item bg-slate-900/40 border border-slate-900 hover:border-cyan-500/30 hover:bg-slate-900/80 p-5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group"
          :class="{ active: project.id === selectedId }"
          @click="selectProject(project.id)"
        >
          <!-- Pulsing dot for activity indication -->
          <div class="flex items-center justify-between gap-3 mb-2">
            <h4 class="font-extrabold text-sm text-slate-200 group-hover:text-white transition-colors truncate flex-1 flex items-center gap-2">
              <span v-if="project.taskStats.progress > 0" class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              {{ project.name }}
            </h4>
            <span class="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold shrink-0">
              {{ project.taskStats.progress }}%
            </span>
          </div>

          <div class="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500">
            <span>MILESTONES DEPLOYED</span>
            <span>{{ project.taskStats.done }}/{{ project.taskStats.total }}</span>
          </div>

          <div class="progress h-1 bg-slate-950 rounded-full overflow-hidden mt-3">
            <div class="progress-bar h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500" :style="{ width: `${project.taskStats.progress}%` }"></div>
          </div>
        </div>
      </aside>

      <!-- Details Area -->
      <section class="detail lg:col-span-9 p-8 overflow-y-auto custom-scrollbar flex flex-col justify-between">
        <div v-if="!detail" class="empty border border-dashed border-slate-800 rounded-3xl bg-slate-950/20 flex flex-col items-center justify-center py-40 text-slate-500 space-y-4">
          <i class="fas fa-radar text-4xl text-slate-700 animate-pulse"></i>
          <span class="text-xs font-mono font-bold uppercase tracking-widest text-slate-600">Select target node to establish telemetry connection</span>
        </div>
        <div v-else class="space-y-6">
          <div class="detail-header flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-indigo-950 pb-6">
            <div class="space-y-1">
              <div class="flex items-center gap-3">
                <span class="px-2.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">ONLINE TELEMETRY</span>
                <span class="text-xs font-mono font-bold text-slate-500">ID: {{ selectedId.slice(0, 8) }}</span>
              </div>
              <h2 class="text-2xl font-black text-white tracking-tight">{{ detail.project.title }}</h2>
              <p class="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <i class="fas fa-users text-slate-500"></i> {{ detail.project.team_members || '未知成员' }}
              </p>
            </div>
            <div class="text-xs font-mono text-slate-500 font-bold bg-slate-950/40 border border-slate-900 px-4 py-2 rounded-xl">
              LAST UPDATE: <span class="text-slate-300">{{ formatDate(detail.project.updated_at) }}</span>
            </div>
          </div>

          <div class="progress-wrap bg-slate-950/30 border border-indigo-950/50 p-6 rounded-2xl space-y-3">
            <div class="progress-label flex justify-between items-center text-xs font-mono font-bold text-indigo-300">
              <span>PROJECT OVERALL PERFORMANCE TELEMETRY</span>
              <span class="text-cyan-400 font-black">{{ progress }}%</span>
            </div>
            <div class="progress-track h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div class="progress-bar h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-500 transition-all duration-500" :style="{ width: `${progress}%` }"></div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div v-for="phase in ['m1','m2','m3']" :key="phase" class="column bg-slate-950/20 border border-indigo-950/50 p-6 rounded-2xl min-h-[220px]">
              <h4 class="text-[10px] font-mono font-black uppercase tracking-wider text-indigo-400 border-b border-indigo-950 pb-3 mb-4 flex items-center justify-between">
                <span>{{ phaseLabel(phase) }}</span>
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              </h4>
              <div v-if="!wbs[phase].length" class="text-xs font-mono italic text-slate-600 py-6 text-center">NO DEPLOYED TASKS</div>
              <div v-for="task in wbs[phase]" :key="task.id" class="task bg-[#111422] hover:bg-[#161a2e] border border-indigo-950/50 rounded-xl px-4 py-3 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-default mb-2 flex items-center justify-between">
                <span>{{ task.title }}</span>
                <span class="w-1.5 h-1.5 rounded-full" :class="task.status === 'done' || task.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 animate-pulse'"></span>
              </div>
            </div>
          </div>

          <!-- Auto-scrolling Terminal Console -->
          <div class="logs-console bg-slate-950 border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div class="console-header bg-slate-900/60 px-6 py-3 border-b border-indigo-950 flex items-center">
              <div class="flex gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
              </div>
              <span class="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500 ml-4">DEVLOGS TELEMETRY STREAM</span>
            </div>
            <div class="console-body p-6 max-h-60 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
              <div v-if="!detail.logs?.length" class="console-line font-mono text-xs text-slate-500">SYSTEM: NO DEPLOYMENT LOGS DETECTED ON TARGET TELEMETRY.</div>
              <div v-for="log in (detail.logs || [])" :key="log.id" class="console-line font-mono text-xs flex gap-3 items-start">
                <span class="text-indigo-400 font-bold shrink-0">[{{ formatDate(log.created_at) }}]</span>
                <span class="text-cyan-400 font-bold shrink-0">$</span>
                <span class="text-emerald-400 leading-relaxed">{{ log.content }}</span>
              </div>
              <div class="console-line font-mono text-xs text-emerald-400/50 flex gap-2 items-center">
                <span>> TELEMETRY LOG WATCHER ACTIVE [WAITING FOR STACK PULSE]</span>
                <span class="w-1.5 h-4 bg-emerald-400 animate-blink shrink-0"></span>
              </div>
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

.logs-console {
  background: #05070f;
  border: 1px solid rgba(6, 182, 212, 0.15);
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
}

.console-body {
  font-family: 'Outfit', monospace;
  background-image: linear-gradient(rgba(16, 185, 129, 0.015) 50%, transparent 50%);
  background-size: 100% 4px;
}

.console-line {
  letter-spacing: 0.05em;
  text-shadow: 0 0 4px rgba(16, 185, 129, 0.3);
}

.animate-blink {
  animation: blink-cursor 1s step-end infinite;
}

@keyframes blink-cursor {
  from, to { background-color: transparent; }
  50% { background-color: currentColor; }
}

.list-item.active {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.08);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.15);
}

.muted {
  font-size: 0.8rem;
  color: #475569;
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

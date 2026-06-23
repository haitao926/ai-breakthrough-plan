<template>
  <aside class="side-panel">
    <div class="panel-title">
      <p>Review Queue</p>
      <h2>项目干预队列</h2>
    </div>

    <div v-if="alertProjects.length > 0" class="mb-2 rounded-2xl border border-rose-100/60 bg-rose-50 p-3">
      <h3 class="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase text-rose-600">
        <i class="fas fa-exclamation-circle"></i> 警报矩阵 (STUCK TARGETS)
      </h3>
      <div class="grid grid-cols-4 gap-1.5">
        <button
          v-for="proj in alertProjects"
          :key="proj.id"
          class="group relative flex aspect-square w-full flex-col items-center justify-center rounded-xl border border-rose-100 bg-white p-1 transition-colors hover:border-rose-300"
          :aria-label="`查看警报项目：${proj.title}`"
          :title="proj.title"
          @click="$emit('select-project', proj.id)"
        >
          <div class="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500"></div>
          <i class="fas mb-0.5 text-[10px]" :class="proj.resourcesPendingCount > 0 ? 'fa-cubes text-amber-500' : 'fa-exclamation-triangle text-rose-500'"></i>
          <span class="w-full truncate text-center text-[8px] font-black text-slate-700">{{ proj.title }}</span>
        </button>
      </div>
    </div>

    <button
      v-for="queue in projectQueues"
      :key="queue.key"
      class="list-item"
      :class="{ active: activeQueue === queue.key }"
      @click="$emit('set-queue', queue.key)"
    >
      <strong>{{ queue.label }}</strong>
      <span>{{ queue.count }} 个项目</span>
    </button>

    <div class="queue-list">
      <button
        v-for="project in filteredReviewProjects"
        :key="project.id"
        class="project-queue-card"
        :class="{ active: selectedReviewProjectId === project.id }"
        @click="$emit('select-project', project.id)"
      >
        <div class="queue-head">
          <strong>{{ project.title }}</strong>
          <span class="status-pill">{{ statusLabel(project.status) }}</span>
        </div>
        <p>{{ project.class_name || '未分班' }} · {{ project.memberNames?.join('、') || project.team_members || '成员待补齐' }}</p>
        <div class="queue-meta">
          <span>进度 {{ project.milestoneProgress?.percent || 0 }}%</span>
          <span>提交 {{ project.pendingSubmissionCount || 0 }}</span>
          <span>里程碑 {{ project.pendingMilestoneCount || 0 }}</span>
          <span>资源 {{ project.resourcesPendingCount || 0 }}</span>
        </div>
        <div v-if="project.latestActivityAt" class="queue-foot">
          最近活动：{{ formatQueueDate(project.latestActivityAt) }}
        </div>
      </button>
      <div v-if="!filteredReviewProjects.length" class="empty-note compact">当前队列没有项目。</div>
    </div>
  </aside>
</template>

<script setup>
const props = defineProps({
  alertProjects: { type: Array, default: () => [] },
  projectQueues: { type: Array, default: () => [] },
  activeQueue: { type: String, default: 'project_review' },
  filteredReviewProjects: { type: Array, default: () => [] },
  selectedReviewProjectId: { type: [String, Number], default: '' },
  statusLabel: { type: Function, required: true }
});

defineEmits(['set-queue', 'select-project']);

function formatQueueDate(value) {
  const text = String(value || '').trim();
  if (!text) return '未记录';
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped>
.side-panel {
  position: sticky;
  top: 88px;
  display: grid;
  gap: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.02);
}

.panel-title {
  margin-bottom: 4px;
}

.panel-title p {
  margin: 0;
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
}

.panel-title h2 {
  margin: 6px 0 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.list-item {
  display: grid;
  gap: 6px;
  border-radius: 18px;
  padding: 16px;
  text-align: left;
  border: 1px solid transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.list-item:hover,
.list-item.active {
  background: rgba(148, 163, 184, 0.06);
  border-color: rgba(148, 163, 184, 0.1);
}

.list-item strong,
.project-queue-card strong {
  font-weight: 600;
  color: #0f172a;
}

.list-item span,
.project-queue-card span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 500;
}

.queue-list {
  display: grid;
  gap: 12px;
  max-height: calc(100dvh - 410px);
  overflow-y: auto;
  padding-right: 4px;
}

.project-queue-card {
  display: grid;
  gap: 8px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.6);
  padding: 16px;
  text-align: left;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.project-queue-card:hover,
.project-queue-card.active {
  border-color: rgba(148, 163, 184, 0.25);
  background: rgba(148, 163, 184, 0.06);
}

.queue-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 10px;
}

.queue-head strong {
  font-size: 0.9rem;
  font-weight: 800;
  color: #1e1b4b;
}

.project-queue-card p {
  margin: 0;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.45;
}

.queue-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.queue-meta span,
.status-pill {
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.04);
  padding: 0.35rem 0.65rem;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 800;
}

.queue-foot {
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 700;
}

.empty-note {
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.02);
  padding: 20px;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 800;
  border: 1px dashed rgba(0, 0, 0, 0.08);
}

.empty-note.compact {
  padding: 12px;
  font-size: 0.78rem;
}

@media (max-width: 980px) {
  .side-panel {
    position: static;
  }

  .queue-list {
    max-height: none;
  }
}
</style>

<template>
  <section class="main-panel intervention-workbench">
    <div class="panel-title row-title">
      <div>
          <p>Intervention Dossier</p>
        <h2>{{ reviewDossier?.project?.title || '选择一个学生项目' }}</h2>
      </div>
      <button v-if="reviewDossier?.project" class="secondary-btn" @click="openProject(reviewDossier.project)">
        学生视图
      </button>
    </div>

    <div v-if="reviewDossierLoading" class="review-workbench-skeleton" aria-label="项目审核包加载中">
      <article class="review-workbench-skeleton__hero content-skeleton-card">
        <div class="review-workbench-skeleton__title-row">
          <div class="content-skeleton-line content-skeleton-line--xs"></div>
          <div class="content-skeleton-line content-skeleton-line--sm"></div>
        </div>
        <div class="content-skeleton-line content-skeleton-line--lg"></div>
        <div class="content-skeleton-line content-skeleton-line--md"></div>
        <div class="content-skeleton-line content-skeleton-line--sm"></div>
      </article>
      <div class="review-workbench-skeleton__grid">
        <article v-for="index in 3" :key="`dossier-skeleton-${index}`" class="content-skeleton-card review-workbench-skeleton__card">
          <div class="content-skeleton-line content-skeleton-line--xs"></div>
          <div class="content-skeleton-line content-skeleton-line--sm"></div>
          <div class="content-skeleton-line content-skeleton-line--lg"></div>
          <div class="content-skeleton-line content-skeleton-line--md"></div>
          <div class="content-skeleton-line content-skeleton-line--sm"></div>
        </article>
      </div>
    </div>

    <template v-else-if="reviewDossier?.project">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-8 space-y-6">
          <article class="preview-panel">
            <div class="preview-head">
              <span class="status-pill">{{ statusLabel(reviewDossier.project.status) }}</span>
              <span>{{ formatDate(reviewDossier.project.updated_at) }}</span>
            </div>
            <h3>{{ reviewDossier.project.title }}</h3>
            <p>{{ reviewDossier.project.summary || '学生尚未填写项目摘要。' }}</p>
            <div class="metric-strip">
              <span>{{ reviewDossier.project.class_name || '未分班' }}</span>
              <span>成员 {{ reviewDossier.members?.length || 0 }}</span>
              <span>进度 {{ reviewDossier.meta?.milestoneProgress?.percent || 0 }}%</span>
              <span>资源待批 {{ reviewDossier.meta?.resourcesPendingCount || 0 }}</span>
            </div>
            <a v-if="reviewDossier.project.gitea_repo_url" class="repo-link" :href="reviewDossier.project.gitea_repo_url" target="_blank" rel="noreferrer">
              {{ reviewDossier.project.gitea_repo_url }}
            </a>
          </article>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article class="workbench-card">
              <div class="panel-title row-title">
                <div>
                  <p>Milestones</p>
                  <h3>里程碑验收</h3>
                </div>
                <span class="status-pill">{{ reviewDossier.meta?.milestoneProgress?.done || 0 }}/{{ reviewDossier.meta?.milestoneProgress?.total || 0 }}</span>
              </div>
              <MilestoneTimeline
                :milestones="reviewDossier.milestones || []"
                :can-manage="canManage"
                :action-working="actionWorking"
                :status-label="statusLabel"
                empty-text="学生还没有拆解里程碑。"
                @approve="reviewMilestone($event, 'approved')"
                @reject="reviewMilestone($event, 'rejected')"
              />
            </article>

            <article class="workbench-card">
              <div class="panel-title row-title">
                <div>
                  <p>Resource Queue</p>
                  <h3>资源申请</h3>
                </div>
                <span class="status-pill">{{ reviewDossier.resources?.length || 0 }} 条</span>
              </div>
              <div class="submission-list compact-list">
                <article v-for="resource in reviewDossier.resources" :key="resource.id" class="mini-review-card p-3 border border-slate-100 rounded-xl mb-2 bg-slate-50/50">
                  <div>
                    <strong class="text-xs text-slate-800">{{ resource.item_name }}</strong>
                    <div class="text-[10px] text-slate-400 font-bold mt-0.5">{{ resource.type }} · 数量 {{ resource.quantity }} · {{ statusLabel(resource.status) }}</div>
                    <p class="text-xs text-slate-600 mt-2 font-medium">{{ resource.reason || '未填写申请理由。' }}</p>
                  </div>
                  <div class="button-row flex gap-2 mt-3">
                    <button class="secondary-btn text-xs px-2.5 py-1.5" :disabled="!canManage || actionWorking || resource.status !== 'pending'" @click="auditResource(resource.id, 'approved')">同意</button>
                    <button class="secondary-btn danger text-xs px-2.5 py-1.5" :disabled="!canManage || actionWorking || resource.status !== 'pending'" @click="auditResource(resource.id, 'rejected')">驳回</button>
                  </div>
                </article>
                <div v-if="!reviewDossier.resources?.length" class="empty-note compact">没有资源申请。</div>
              </div>
            </article>
          </div>

          <article class="workbench-card">
            <div class="panel-title">
              <p>Implementation Logs</p>
              <h3>实施日志</h3>
            </div>
            <div class="timeline-list">
              <div v-for="log in reviewDossier.implementationLogs?.slice(0, 6)" :key="log.id" class="timeline-item">
                <strong>{{ log.author_name || '学生' }}</strong>
                <span>{{ formatDate(log.created_at) }}</span>
                <p>{{ log.content }}</p>
              </div>
              <div v-if="!reviewDossier.implementationLogs?.length" class="empty-note compact">还没有实施日志。</div>
            </div>
          </article>
        </div>

        <div class="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <article class="preview-panel">
            <h3>项目状态干预</h3>
            <div class="button-row flex flex-wrap gap-2 mt-3">
              <button
                v-for="action in statusActions"
                :key="action.status"
                class="secondary-btn text-xs px-3 py-2 flex-grow text-center"
                :class="{ danger: action.danger }"
                :disabled="!canManage || actionWorking"
                @click="advanceProjectStatus(action.status, action.note)"
              >
                {{ action.label }}
              </button>
            </div>
            <textarea v-model="projectActionNoteModel" placeholder="项目状态推进说明（可选）" class="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-2 bg-slate-50/50 focus:bg-white transition-colors outline-none"></textarea>
          </article>

          <article class="workbench-card">
            <div class="panel-title row-title">
              <div>
                <p>Stage Submissions</p>
                <h3>阶段提交审核</h3>
              </div>
              <span class="status-pill">{{ reviewDossier.submissions?.length || 0 }} 份</span>
            </div>
            <div class="submission-list compact-list max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
              <ProjectReviewCard
                v-for="submission in reviewDossier.submissions"
                :key="submission.id"
                :submission="submission"
                :draft="projectReviewDrafts[submission.id]"
                :can-manage="canManage"
                :action-working="actionWorking"
                :status-label="statusLabel"
                :submission-type-label="submissionTypeLabel"
                :submission-summary="submissionSummary"
                :format-date="formatDate"
                @submit="reviewProjectSubmission"
              />
              <div v-if="!reviewDossier.submissions?.length" class="empty-note compact">还没有阶段提交。</div>
            </div>
          </article>
        </div>
      </div>
    </template>

    <div v-else class="empty-note">学生提交立项、中期、结题、里程碑或资源申请后，教师会在这里完成审核与状态推进。</div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import MilestoneTimeline from '@/components/MilestoneTimeline.vue';
import ProjectReviewCard from '@/components/ProjectReviewCard.vue';

const props = defineProps({
  reviewDossier: { type: Object, default: null },
  reviewDossierLoading: { type: Boolean, default: false },
  canManage: { type: Boolean, default: false },
  actionWorking: { type: Boolean, default: false },
  projectActionNote: { type: String, default: '' },
  statusActions: { type: Array, default: () => [] },
  projectReviewDrafts: { type: Object, default: () => ({}) },
  statusLabel: { type: Function, required: true },
  submissionTypeLabel: { type: Function, required: true },
  submissionSummary: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  openProject: { type: Function, required: true },
  reviewMilestone: { type: Function, required: true },
  auditResource: { type: Function, required: true },
  advanceProjectStatus: { type: Function, required: true },
  reviewProjectSubmission: { type: Function, required: true }
});

const emit = defineEmits(['update:projectActionNote']);

const projectActionNoteModel = computed({
  get: () => props.projectActionNote,
  set: (value) => emit('update:projectActionNote', value)
});
</script>

<style scoped>
.main-panel {
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.02);
}

.intervention-workbench {
  min-height: 680px;
}

.review-workbench-skeleton {
  display: grid;
  gap: 20px;
}

.review-workbench-skeleton__hero {
  min-height: 220px;
}

.review-workbench-skeleton__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.review-workbench-skeleton__card {
  min-height: 240px;
}

.review-workbench-skeleton__title-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.panel-title {
  margin-bottom: 16px;
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

.row-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.preview-panel,
.workbench-card,
.submission-card {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 28px;
  background: #fff;
  padding: 20px;
}

.preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 800;
}

.preview-panel h3,
.workbench-card h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #1e1b4b;
}

.preview-panel p,
.timeline-item p,
.mini-review-card p,
.submission-card p {
  margin: 0;
  color: #475569;
  line-height: 1.65;
}

.metric-strip,
.status-pill {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.metric-strip span,
.status-pill {
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.04);
  padding: 0.35rem 0.65rem;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 800;
}

.repo-link {
  overflow-wrap: anywhere;
  color: var(--color-brand-accent);
  font-size: 0.8rem;
  font-weight: 800;
}

.submission-list {
  display: grid;
  gap: 12px;
}

.compact-list {
  max-height: 520px;
  overflow-y: auto;
}

.mini-review-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  border: 1px solid rgba(0, 0, 0, 0.03);
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.015);
  padding: 16px;
}

.mini-review-card strong,
.timeline-item strong {
  display: block;
  font-weight: 800;
  color: #1e1b4b;
}

.mini-review-card span,
.timeline-item span {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
}

.timeline-list {
  display: grid;
  gap: 12px;
}

.timeline-item {
  border-left: 3px solid var(--color-brand-accent-light);
  padding-left: 12px;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: start;
}

.secondary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0.55rem 1rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.8);
  color: #334155;
  font-size: 0.8rem;
  font-weight: 800;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.01);
  transition: color 0.18s ease, background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.secondary-btn:hover {
  border-color: var(--color-brand-accent-light);
  color: var(--color-brand-accent);
  background: #fff;
}

.secondary-btn.danger {
  border-color: #fca5a5;
  color: #dc2626;
  background: rgba(254, 242, 242, 0.5);
}

.secondary-btn.danger:hover {
  background: #fef2f2;
}

.submission-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 0.5fr);
  gap: 16px;
}

.submission-card a {
  color: var(--color-brand-accent);
  font-weight: 800;
}

.review-form {
  display: grid;
  gap: 8px;
}

.btn-primary {
  background: var(--color-brand-accent);
  color: #fff;
  box-shadow: 0 8px 20px rgba(15, 118, 110, 0.15);
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

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 980px) {
  .review-workbench-skeleton__grid,
  .submission-card,
  .mini-review-card {
    grid-template-columns: 1fr;
  }

  .compact-list {
    max-height: none;
  }
}
</style>

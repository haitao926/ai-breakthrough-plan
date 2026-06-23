<template>
  <div>
    <div class="panel-title row-title">
      <div>
        <p>Course Brief</p>
        <h2>{{ selectedCourse?.title || '等待课程 Skill 上传结果' }}</h2>
      </div>
      <div v-if="selectedCourse" class="button-row">
        <button class="secondary-btn" type="button" :disabled="courseSaving" @click="saveCourseAs('draft')">保留草稿</button>
        <button class="secondary-btn danger" type="button" :disabled="courseSaving" @click="saveCourseAs('archived')">归档</button>
        <button class="primary-btn small" type="button" :disabled="courseSaving || selectedCourse.status === 'published'" @click="saveCourseAs('published')">
          {{ selectedCourse.status === 'published' ? '已发布' : '确认发布' }}
        </button>
      </div>
    </div>

    <section v-if="selectedCourse" class="preview-layout">
      <article class="preview-panel">
        <div class="preview-head">
          <span class="status-pill">{{ statusLabel(selectedCourse.status) }}</span>
          <span>{{ selectedCourse.id }}</span>
        </div>
        <h3>{{ selectedCourse.title }}</h3>
        <p>{{ selectedCourse.summary || selectedCourse.description || '课程 Skill 尚未提供简介。' }}</p>
        <div class="metric-strip">
          <span>课时 {{ selectedCourseLessons.length }}</span>
          <span>资料 {{ selectedCourse.materials?.length || 0 }}</span>
          <span>作业 {{ assignments.length }}</span>
          <span>{{ selectedCourse.pace || '节奏待补齐' }}</span>
        </div>
      </article>

      <article class="preview-panel">
        <h3>发布前检查</h3>
        <ul class="check-list">
          <li :class="{ ok: Boolean(selectedCourse.summary || selectedCourse.description) }">课程简介</li>
          <li :class="{ ok: selectedCourseLessons.length > 0 }">课时结构</li>
          <li :class="{ ok: (selectedCourse.materials?.length || 0) > 0 }">资料清单</li>
          <li :class="{ ok: assignments.length > 0 }">作业入口</li>
        </ul>
      </article>
    </section>

    <section v-if="selectedCourse" class="data-grid">
      <article v-for="lesson in selectedCourseLessons" :key="lesson.id" class="data-card">
        <strong>{{ lesson.title }}</strong>
        <span>{{ lesson.duration || 0 }} 分钟 · {{ lesson.id }}</span>
        <p>{{ lesson.description || lesson.essentialQuestion }}</p>
      </article>
      <article v-for="assignment in assignments" :key="`assignment-${assignment.id}`" class="data-card">
        <strong>{{ assignment.title }}</strong>
        <span>{{ lessonName(assignment.lessonId) }} · {{ statusLabel(assignment.status) }}</span>
        <p>{{ assignment.requirements || assignment.description || '作业要求待补齐。' }}</p>
        <button class="secondary-btn full" @click="loadAssignmentSubmissions(assignment)">查看提交情况</button>
      </article>
    </section>

    <div v-else class="empty-note">课程 Skill 上传完成后，会在这里出现课程结构、资料、作业和发布检查结果。</div>

    <section v-if="selectedAssignment" class="review-panel">
      <div class="panel-title row-title">
        <div>
          <p>Review Desk</p>
          <h2>{{ selectedAssignment.title }} · 提交情况</h2>
        </div>
        <span class="status-pill">{{ submissions.length }} 份提交</span>
      </div>
      <div class="submission-list">
        <article v-for="submission in submissions" :key="submission.id" class="submission-card">
          <div>
            <strong>{{ submission.studentName || submission.studentEmail }}</strong>
            <span>{{ submission.status }} · {{ formatDate(submission.updatedAt) }}</span>
            <p v-if="submission.content">{{ submission.content }}</p>
            <a v-if="submission.link" :href="submission.link" target="_blank" rel="noreferrer">{{ submission.link }}</a>
            <p v-if="submission.attachmentNote">附件说明：{{ submission.attachmentNote }}</p>
          </div>
          <form class="review-form" @submit.prevent="reviewAssignmentSubmission(submission)">
            <input v-model="reviewDrafts[submission.id].score" type="number" min="0" max="100" placeholder="分数" />
            <select v-model="reviewDrafts[submission.id].status">
              <option value="reviewed">通过</option>
              <option value="needs_changes">退回修改</option>
            </select>
            <textarea v-model="reviewDrafts[submission.id].feedback" placeholder="反馈"></textarea>
            <button class="primary-btn small" type="submit">提交批改</button>
          </form>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
defineProps({
  selectedCourse: { type: Object, default: null },
  selectedCourseLessons: { type: Array, default: () => [] },
  assignments: { type: Array, default: () => [] },
  courseSaving: { type: Boolean, default: false },
  selectedAssignment: { type: Object, default: null },
  submissions: { type: Array, default: () => [] },
  reviewDrafts: { type: Object, default: () => ({}) },
  statusLabel: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  saveCourseAs: { type: Function, required: true },
  lessonName: { type: Function, required: true },
  loadAssignmentSubmissions: { type: Function, required: true },
  reviewAssignmentSubmission: { type: Function, required: true }
});
</script>

<style scoped>
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

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: start;
}

.primary-btn,
.secondary-btn {
  transition: color 0.18s ease, background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.primary-btn,
.secondary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 16px;
  font-weight: 800;
}

.primary-btn {
  background: var(--color-brand-accent);
  color: #fff;
  box-shadow: 0 8px 20px rgba(15, 118, 110, 0.15);
}

.primary-btn:hover {
  background: var(--color-brand-accent-hover);
  box-shadow: 0 12px 25px rgba(15, 118, 110, 0.25);
}

.primary-btn.small,
.secondary-btn {
  min-height: 40px;
  padding: 0.55rem 1rem;
  font-size: 0.8rem;
}

.secondary-btn {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.8);
  color: #334155;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.01);
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

.secondary-btn.full {
  width: 100%;
  margin-top: 12px;
}

.preview-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(290px, 0.8fr);
  gap: 16px;
  margin-bottom: 18px;
}

.preview-panel {
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

.preview-panel h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 900;
  color: #1e1b4b;
}

.preview-panel p {
  margin: 0;
  color: #475569;
  line-height: 1.75;
  font-size: 0.9rem;
}

.check-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.check-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 14px;
  background: #fff7ed;
  padding: 0.75rem 0.85rem;
  color: #9a3412;
  font-size: 0.82rem;
  font-weight: 800;
}

.check-list li::after {
  content: "待确认";
  font-size: 0.72rem;
}

.check-list li.ok {
  background: #ecfdf5;
  color: #047857;
}

.check-list li.ok::after {
  content: "已识别";
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

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.data-card,
.review-panel,
.submission-card {
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.02);
}

.data-card {
  padding: 20px;
}

.data-card strong,
.submission-card strong {
  font-weight: 600;
  color: #0f172a;
}

.data-card span,
.submission-card span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 500;
}

.data-card p,
.submission-card p {
  color: #475569;
  line-height: 1.65;
}

.review-panel {
  margin-top: 20px;
  padding: 20px;
}

.submission-list {
  display: grid;
  gap: 12px;
}

.submission-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(250px, 0.5fr);
  gap: 16px;
  padding: 20px;
}

.submission-card a {
  color: var(--color-brand-accent);
  font-weight: 800;
}

.review-form {
  display: grid;
  gap: 8px;
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

input,
textarea,
select {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.75);
  padding: 0.75rem 0.85rem;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 600;
  outline: none;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus,
textarea:focus,
select:focus {
  background: #fff;
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.05);
}

textarea {
  min-height: 92px;
  resize: vertical;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 980px) {
  .preview-layout,
  .data-grid,
  .submission-card {
    grid-template-columns: 1fr;
  }
}
</style>

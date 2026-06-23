<template>
  <section class="main-panel">
    <template v-if="uploadKind === 'course'">
      <p v-if="courseDraftRestored && !selectedCourse" class="draft-note">已恢复上次未保存的课程草稿。</p>
      <CourseEditor
        :selected-course="selectedCourse"
        :selected-course-lessons="selectedCourseLessons"
        :assignments="assignments"
        :course-saving="courseSaving"
        :selected-assignment="selectedAssignment"
        :submissions="submissions"
        :review-drafts="reviewDrafts"
        :status-label="statusLabel"
        :format-date="formatDate"
        :save-course-as="saveCourseAs"
        :lesson-name="lessonName"
        :load-assignment-submissions="loadAssignmentSubmissions"
        :review-assignment-submission="reviewAssignmentSubmission"
      />
    </template>

    <template v-else-if="uploadKind === 'project'">
      <div class="panel-title row-title">
        <div>
          <p>Project Brief</p>
          <h2>{{ selectedProjectTopic?.title || '等待项目 Skill 上传结果' }}</h2>
        </div>
        <div v-if="selectedProjectTopic" class="button-row">
          <button class="secondary-btn" type="button" @click="saveProjectTopicAs('draft')">保留草稿</button>
          <button class="secondary-btn danger" type="button" @click="saveProjectTopicAs('archived')">归档</button>
          <button class="primary-btn small" type="button" :disabled="selectedProjectTopic.status === 'published'" @click="saveProjectTopicAs('published')">
            {{ selectedProjectTopic.status === 'published' ? '已发布' : '确认发布' }}
          </button>
        </div>
      </div>

      <section v-if="selectedProjectTopic" class="preview-layout">
        <article class="preview-panel">
          <div class="preview-head">
            <span class="status-pill">{{ statusLabel(selectedProjectTopic.status) }}</span>
            <span>{{ selectedProjectTopic.difficulty || '难度待定' }}</span>
          </div>
          <h3>{{ selectedProjectTopic.title }}</h3>
          <p>{{ selectedProjectTopic.description || '项目 Skill 尚未提供项目描述。' }}</p>
          <div class="metric-strip">
            <span>建议人数 {{ selectedProjectTopic.suggestedTeamSize || '-' }}</span>
            <span>关联课程 {{ selectedProjectTopic.relatedCourseId || '-' }}</span>
            <span>关联赛事 {{ selectedProjectTopic.relatedCompetitionSlug || '-' }}</span>
          </div>
        </article>
        <article class="preview-panel">
          <h3>发布前检查</h3>
          <ul class="check-list">
            <li :class="{ ok: Boolean(selectedProjectTopic.description) }">项目描述</li>
            <li :class="{ ok: Boolean(selectedProjectTopic.goals) }">项目目标</li>
            <li :class="{ ok: Boolean(selectedProjectTopic.deliverables) }">交付物</li>
            <li :class="{ ok: Boolean(selectedProjectTopic.difficulty) }">难度标注</li>
          </ul>
        </article>
      </section>

      <section v-if="selectedProjectTopic" class="preview-panel">
        <h3>交付与目标</h3>
        <p v-if="selectedProjectTopic.background"><strong>背景：</strong>{{ selectedProjectTopic.background }}</p>
        <p v-if="selectedProjectTopic.goals"><strong>目标：</strong>{{ selectedProjectTopic.goals }}</p>
        <p v-if="selectedProjectTopic.deliverables"><strong>交付物：</strong>{{ selectedProjectTopic.deliverables }}</p>
      </section>

      <div class="data-grid">
        <article v-for="topic in myProjectTopics" :key="topic.id" class="data-card">
          <div class="data-card-head">
            <div>
              <strong>{{ topic.title }}</strong>
              <span>{{ topic.difficulty || '难度待定' }} · {{ statusLabel(topic.status) }}</span>
            </div>
            <button class="text-btn" @click="editProjectTopic(topic)">预览</button>
          </div>
          <p>{{ topic.description }}</p>
        </article>
      </div>
      <div v-if="!selectedProjectTopic" class="empty-note">项目 Skill 上传完成后，会在这里出现题目背景、目标、人数、交付物和发布检查结果。</div>
    </template>

    <template v-else-if="uploadKind === 'competition'">
      <div class="panel-title row-title">
        <div>
          <p>Competition Brief</p>
          <h2>{{ selectedCompetition?.title || '等待赛事 Skill 上传结果' }}</h2>
        </div>
        <div v-if="selectedCompetition" class="button-row">
          <button class="secondary-btn" type="button" @click="saveCompetitionAs('draft')">保留草稿</button>
          <button class="secondary-btn danger" type="button" @click="saveCompetitionAs('archived')">归档</button>
          <button class="primary-btn small" type="button" :disabled="selectedCompetition.publishStatus === 'published'" @click="saveCompetitionAs('published')">
            {{ selectedCompetition.publishStatus === 'published' ? '已发布' : '确认发布' }}
          </button>
        </div>
      </div>
      <p v-if="competitionDraftRestored && !selectedCompetition" class="draft-note">已恢复上次未保存的赛事草稿。</p>
      <section v-if="selectedCompetition" class="preview-layout">
        <article class="preview-panel">
          <div class="preview-head">
            <span class="status-pill">{{ selectedCompetition.publishStatus === 'published' ? '已发布' : '待发布' }}</span>
            <span>{{ selectedCompetition.status || '报名中' }}</span>
          </div>
          <h3>{{ selectedCompetition.title }}</h3>
          <p>{{ selectedCompetition.fitSummary || selectedCompetition.tagline || '赛事 Skill 尚未提供摘要。' }}</p>
          <div class="metric-strip">
            <span>时间 {{ selectedCompetition.dateRange || '-' }}</span>
            <span>主办 {{ selectedCompetition.host || '-' }}</span>
            <span>地点 {{ selectedCompetition.location || '-' }}</span>
          </div>
        </article>
        <article class="preview-panel">
          <h3>发布前检查</h3>
          <ul class="check-list">
            <li :class="{ ok: Boolean(selectedCompetition.title) }">赛事标题</li>
            <li :class="{ ok: Boolean(selectedCompetition.dateRange) }">时间范围</li>
            <li :class="{ ok: Boolean(selectedCompetition.host) }">主办单位</li>
            <li :class="{ ok: Boolean(selectedCompetition.fitSummary || selectedCompetition.tagline) }">赛事摘要</li>
          </ul>
        </article>
      </section>

      <section v-if="selectedCompetition" class="preview-panel">
        <h3>报名信息</h3>
        <p><strong>报名状态：</strong>{{ selectedCompetition.status || '-' }}</p>
        <p><strong>关联课程：</strong>{{ (selectedCompetition.relatedCourses || []).map(item => item.title).join('、') || '-' }}</p>
        <p><strong>补充说明：</strong>{{ selectedCompetition.whyJoin || selectedCompetition.prepAdvice || '暂无补充说明。' }}</p>
      </section>

      <section v-if="selectedCompetition" class="uploaded-status">
        <div class="metric-strip">
          <span>总报名 {{ registrationStats.total || 0 }}</span>
          <span>待确认 {{ registrationStats.pending || 0 }}</span>
          <span>需补材料 {{ registrationStats.needsMaterials || 0 }}</span>
          <span>已通过 {{ registrationStats.approved || 0 }}</span>
        </div>
        <article class="preview-panel mt-4">
          <h3>匹配候选学生</h3>
          <div class="submission-list">
            <article v-for="candidate in competitionCandidates" :key="candidate.id" class="submission-card">
              <div>
                <strong>{{ candidate.studentName || candidate.studentEmail || `学生 ${candidate.userId}` }}</strong>
                <span>{{ candidate.candidateBucket }} · {{ candidate.score }} 分 · {{ candidate.eligibilityStatus }}</span>
                <p>{{ candidate.aiSummary || candidate.reasons?.[0] || '已生成推荐判断。' }}</p>
                <p v-if="candidate.gaps?.length">待补：{{ candidate.gaps[0] }}</p>
              </div>
              <div class="button-row">
                <button class="secondary-btn" type="button" @click="sendMatchReminder(candidate)">定向提醒</button>
                <button class="secondary-btn" type="button" @click="applyMatchOverride(candidate, 'boost')">加推</button>
                <button class="secondary-btn danger" type="button" @click="applyMatchOverride(candidate, 'suppress')">屏蔽</button>
              </div>
            </article>
            <div v-if="!competitionCandidates.length" class="empty-note">还没有匹配候选学生。</div>
          </div>
        </article>
        <article class="reminder-panel">
          <div>
            <strong>提醒学生</strong>
            <span :class="{ danger: isSelectedCompetitionDeadlinePast }">{{ selectedCompetitionReminderStatus }}</span>
          </div>
          <label>
            提醒对象
            <select v-model="reminderForm.targetGroup">
              <option value="not_registered">未报名学生</option>
              <option value="pending">待确认报名</option>
              <option value="needs_materials">需补材料</option>
              <option value="approved">已通过报名</option>
              <option value="registered">所有已报名学生</option>
              <option value="all_students">全部学生</option>
            </select>
          </label>
          <label>
            提醒内容
            <textarea v-model="reminderForm.body" rows="4"></textarea>
          </label>
          <button class="primary-btn small" type="button" @click="sendCompetitionReminder">发送站内提醒</button>
        </article>
        <div class="submission-list">
          <article v-for="registration in registrations" :key="registration.id" class="submission-card">
            <div>
              <strong>{{ registration.teamName || registration.studentName || '个人报名' }}</strong>
              <span>{{ registration.className || '未填班级' }} · {{ registration.status }}</span>
              <p>成员：{{ registration.members || registration.studentName }}</p>
              <p>材料：{{ registration.materials || '未提交材料说明' }}</p>
            </div>
            <div class="button-row">
              <button class="secondary-btn" @click="reviewRegistration(registration, 'approved')">通过</button>
              <button class="secondary-btn" @click="reviewRegistration(registration, 'needs_materials')">补材料</button>
              <button class="secondary-btn danger" @click="reviewRegistration(registration, 'rejected')">驳回</button>
            </div>
          </article>
          <div v-if="!registrations.length" class="empty-note">这项赛事还没有学生报名。</div>
        </div>
      </section>
      <section v-if="myCompetitions.length" class="data-grid">
        <article v-for="competition in myCompetitions" :key="competition.slug" class="data-card">
          <div class="data-card-head">
            <div>
              <strong>{{ competition.title }}</strong>
              <span>{{ statusLabel(competition.publishStatus) }} · 报名 {{ competition.registrationStats?.total || 0 }}</span>
            </div>
            <button class="text-btn" @click="selectCompetition(competition)">预览</button>
          </div>
        </article>
      </section>
      <div v-if="!selectedCompetition" class="empty-note">赛事 Skill 写入平台后，会在这里展示赛事摘要、报名信息和发布确认状态。</div>
    </template>

    <template v-else-if="uploadKind === 'banner'">
      <div class="panel-title row-title">
        <div>
          <p>Banner Center</p>
          <h2>{{ selectedBannerIndex >= 0 ? '编辑门户 Banner' : '新建门户 Banner' }}</h2>
        </div>
        <div class="button-row">
          <button class="secondary-btn" type="button" @click="startBannerCreate">新建</button>
          <button v-if="selectedBannerIndex >= 0" class="secondary-btn danger" type="button" @click="deleteBanner">删除</button>
          <button class="primary-btn small" type="button" @click="saveBanner">保存 Banner</button>
        </div>
      </div>
      <p v-if="bannerDraftRestored && selectedBannerIndex < 0" class="draft-note">已恢复上次未保存的 Banner 草稿。</p>
      <section class="preview-panel">
        <div class="form-grid">
          <label>页面归属
            <select v-model="bannerForm.pageKey">
              <option value="home">首页</option>
              <option value="projects">项目库</option>
              <option value="knowledge">知识库</option>
              <option value="courses">课程库</option>
              <option value="competitions">竞赛页</option>
            </select>
          </label>
          <label :class="{ 'is-invalid': bannerFormErrors.title }">
            标题
            <input v-model="bannerForm.title" placeholder="例如：高一 AI 成果展" />
            <small v-if="bannerFormErrors.title">{{ bannerFormErrors.title }}</small>
          </label>
          <label>标签<input v-model="bannerForm.tag" placeholder="展示 / 赛事 / 课程" /></label>
          <label>类型<input v-model="bannerForm.type" placeholder="feature" /></label>
          <label>CTA 文案<input v-model="bannerForm.buttonText" placeholder="立即查看" /></label>
          <label>布局
            <select v-model="bannerForm.layout">
              <option value="">左下文案</option>
              <option value="center">居中文案</option>
            </select>
          </label>
          <label :class="{ 'is-invalid': bannerFormErrors.priority }">
            优先级
            <input v-model.number="bannerForm.priority" type="number" min="0" />
            <small v-if="bannerFormErrors.priority">{{ bannerFormErrors.priority }}</small>
          </label>
          <label>图片地址<input v-model="bannerForm.image" placeholder="/assets/banners/..." /></label>
          <label>图片替代文本<input v-model="bannerForm.imageAlt" placeholder="用于无图或读屏描述" /></label>
          <label :class="{ 'is-invalid': bannerFormErrors.targetUrl }">
            目标链接
            <input v-model="bannerForm.targetUrl" placeholder="/showcase" />
            <small v-if="bannerFormErrors.targetUrl">{{ bannerFormErrors.targetUrl }}</small>
          </label>
          <label class="form-switch">
            <span>是否启用</span>
            <select v-model="bannerForm.active">
              <option :value="true">启用</option>
              <option :value="false">停用</option>
            </select>
          </label>
        </div>
        <label class="mt-4 block">
          摘要
          <textarea v-model="bannerForm.summary" rows="3" placeholder="用于 Banner 说明文案"></textarea>
        </label>
      </section>
      <section class="data-grid">
        <article v-for="(banner, index) in banners" :key="`${banner.title}-${index}`" class="data-card">
          <div class="data-card-head">
            <div>
              <strong>{{ banner.title }}</strong>
              <span>{{ banner.pageKey || 'home' }} · {{ banner.tag || banner.type }} · {{ banner.targetUrl }}</span>
            </div>
            <button class="text-btn" @click="selectBanner(index)">编辑</button>
          </div>
        </article>
      </section>
    </template>

    <template v-else-if="uploadKind === 'story'">
      <div class="panel-title row-title">
        <div>
          <p>Story Center</p>
          <h2>{{ selectedStorySlug ? '编辑成果故事' : '新建成果故事' }}</h2>
        </div>
        <div class="button-row">
          <button class="secondary-btn" type="button" @click="startStoryCreate">新建</button>
          <button v-if="selectedStorySlug" class="secondary-btn danger" type="button" @click="deleteStory">删除</button>
          <button class="primary-btn small" type="button" @click="saveStory">保存故事</button>
        </div>
      </div>
      <p v-if="storyDraftRestored && !selectedStorySlug" class="draft-note">已恢复上次未保存的成果故事草稿。</p>
      <section class="preview-panel">
        <div class="form-grid">
          <label :class="{ 'is-invalid': storyFormErrors.title }">
            标题
            <input v-model="storyForm.title" placeholder="成果故事标题" />
            <small v-if="storyFormErrors.title">{{ storyFormErrors.title }}</small>
          </label>
          <label :class="{ 'is-invalid': storyFormErrors.slug }">
            Slug
            <input v-model="storyForm.slug" :disabled="Boolean(selectedStorySlug)" placeholder="story-slug" />
            <small v-if="storyFormErrors.slug">{{ storyFormErrors.slug }}</small>
          </label>
          <label>学生/团队<input v-model="storyForm.studentLabel" placeholder="高一某团队" /></label>
          <label>成果标签<input v-model="storyForm.result" placeholder="市级展示 / 校内路演" /></label>
          <label>关联赛事<input v-model="storyForm.relatedCompetitionSlug" placeholder="competition-slug" /></label>
          <label>关联课程<input v-model="storyForm.relatedCourseIdsText" placeholder="project1, robotics-club" /></label>
          <label>封面<input v-model="storyForm.cover" placeholder="/assets/portal/..." /></label>
          <label>精选<select v-model="storyForm.featured"><option :value="false">否</option><option :value="true">是</option></select></label>
        </div>
        <label class="mt-4 block" :class="{ 'is-invalid': storyFormErrors.summary }">
          摘要
          <textarea v-model="storyForm.summary" placeholder="简要描述学生成果、过程与亮点"></textarea>
          <small v-if="storyFormErrors.summary">{{ storyFormErrors.summary }}</small>
        </label>
      </section>
      <section class="data-grid">
        <article v-for="story in stories" :key="story.slug" class="data-card">
          <div class="data-card-head">
            <div>
              <strong>{{ story.title }}</strong>
              <span>{{ story.result || '成果故事' }}</span>
            </div>
            <button class="text-btn" @click="selectStory(story)">编辑</button>
          </div>
          <p>{{ story.summary }}</p>
        </article>
      </section>
    </template>
  </section>
</template>

<script setup>
import CourseEditor from '@/components/teacher/CourseEditor.vue';

defineProps({
  uploadKind: { type: String, default: 'course' },
  selectedCourse: { type: Object, default: null },
  courseDraftRestored: { type: Boolean, default: false },
  selectedCourseLessons: { type: Array, default: () => [] },
  assignments: { type: Array, default: () => [] },
  courseSaving: { type: Boolean, default: false },
  selectedAssignment: { type: Object, default: null },
  submissions: { type: Array, default: () => [] },
  reviewDrafts: { type: Object, default: () => ({}) },
  selectedProjectTopic: { type: Object, default: null },
  myProjectTopics: { type: Array, default: () => [] },
  selectedCompetition: { type: Object, default: null },
  competitionDraftRestored: { type: Boolean, default: false },
  registrationStats: { type: Object, default: () => ({}) },
  competitionCandidates: { type: Array, default: () => [] },
  reminderForm: { type: Object, default: () => ({}) },
  selectedCompetitionReminderStatus: { type: String, default: '' },
  isSelectedCompetitionDeadlinePast: { type: Boolean, default: false },
  registrations: { type: Array, default: () => [] },
  myCompetitions: { type: Array, default: () => [] },
  selectedBannerIndex: { type: Number, default: -1 },
  bannerDraftRestored: { type: Boolean, default: false },
  bannerForm: { type: Object, default: () => ({}) },
  bannerFormErrors: { type: Object, default: () => ({}) },
  banners: { type: Array, default: () => [] },
  selectedStorySlug: { type: String, default: '' },
  storyDraftRestored: { type: Boolean, default: false },
  storyForm: { type: Object, default: () => ({}) },
  storyFormErrors: { type: Object, default: () => ({}) },
  stories: { type: Array, default: () => [] },
  statusLabel: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  saveCourseAs: { type: Function, required: true },
  lessonName: { type: Function, required: true },
  loadAssignmentSubmissions: { type: Function, required: true },
  reviewAssignmentSubmission: { type: Function, required: true },
  editProjectTopic: { type: Function, required: true },
  saveProjectTopicAs: { type: Function, required: true },
  saveCompetitionAs: { type: Function, required: true },
  selectCompetition: { type: Function, required: true },
  reviewRegistration: { type: Function, required: true },
  sendCompetitionReminder: { type: Function, required: true },
  sendMatchReminder: { type: Function, required: true },
  applyMatchOverride: { type: Function, required: true },
  startBannerCreate: { type: Function, required: true },
  saveBanner: { type: Function, required: true },
  deleteBanner: { type: Function, required: true },
  selectBanner: { type: Function, required: true },
  startStoryCreate: { type: Function, required: true },
  saveStory: { type: Function, required: true },
  deleteStory: { type: Function, required: true },
  selectStory: { type: Function, required: true }
});
</script>

<style scoped>
.main-panel,
.data-card,
.review-panel,
.submission-card {
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.02);
}

.main-panel {
  padding: 24px;
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

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: start;
}

.primary-btn,
.secondary-btn,
.text-btn {
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

.text-btn {
  color: var(--color-brand-accent);
  font-size: 0.78rem;
  font-weight: 800;
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

.data-card-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
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

.uploaded-status {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 28px;
  background: #fff;
  padding: 20px;
}

.reminder-panel {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(15, 118, 110, 0.14);
  border-radius: 20px;
  background: #f7fbf9;
  padding: 16px;
}

.reminder-panel > div {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.reminder-panel strong {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.reminder-panel span {
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 850;
}

.reminder-panel span.danger {
  color: #dc2626;
}

.reminder-panel textarea {
  min-height: 112px;
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

.draft-note {
  margin: 0 0 12px;
  color: var(--color-brand-accent);
  font-size: 0.82rem;
  font-weight: 800;
}

label {
  display: grid;
  gap: 6px;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}

label small {
  color: #be123c;
  font-size: 0.76rem;
  font-weight: 800;
}

label.is-invalid input,
label.is-invalid textarea,
label.is-invalid select {
  border-color: rgba(190, 24, 93, 0.5);
  box-shadow: 0 0 0 4px rgba(190, 24, 93, 0.06);
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
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

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

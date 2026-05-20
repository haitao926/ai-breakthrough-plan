<template>
  <div class="course-page min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
    <SiteNav active="downloads" />

    <main class="mx-auto max-w-[1320px] px-5 pb-16 pt-[96px] sm:px-6 lg:px-8">
      <section v-if="loading" class="course-panel flex min-h-[26rem] items-center justify-center bg-white">
        <div class="text-center text-slate-400">
          <i class="fas fa-spinner fa-spin text-4xl"></i>
          <div class="mt-4 text-xs font-black uppercase tracking-[0.24em]">正在加载课程主页</div>
        </div>
      </section>

      <section v-else-if="error" class="course-panel bg-white text-center">
        <div class="mx-auto max-w-xl rounded-2xl border border-rose-100 bg-rose-50 px-6 py-10 text-rose-600">
          <div class="text-sm font-black">课程加载失败</div>
          <p class="mt-3 text-sm font-medium leading-7">{{ error }}</p>
        </div>
      </section>

      <template v-else-if="course">
        <header class="course-hero">
          <div class="course-hero__main">
            <div class="course-eyebrow">
              <i class="fas" :class="sectionMeta.icon"></i>
              {{ sectionMeta.label }}
              <span></span>
              {{ course.courseType || '课程' }}
            </div>
            <h1>{{ course.title }}</h1>
            <p class="course-summary">{{ course.summary || course.description }}</p>
            <div class="course-meta">
              <span>{{ lessons.length }} 节课时</span>
              <span>{{ assignmentCountLabel }}</span>
              <span>{{ materials.length }} 份资料</span>
              <span>{{ course.teacherName || '导师组' }}</span>
            </div>
            <div class="course-actions">
              <RouterLink v-if="firstLesson" :to="lessonRoute(firstLesson)" class="primary-action">
                <i class="fas fa-play"></i>
                从第一课开始
              </RouterLink>
              <a v-if="featuredGuide" :href="featuredGuide.downloadUrl" target="_blank" rel="noreferrer" class="secondary-action">
                <i class="fas fa-book-open"></i>
                查看课程导学
              </a>
            </div>
          </div>

          <aside class="course-hero__aside">
            <img :src="courseVisual.cover" :alt="`${course.title} 封面`" />
            <div class="course-snapshot">
              <strong>{{ course.positioning || sectionMeta.title }}</strong>
              <p>{{ compactDescription }}</p>
            </div>
          </aside>
        </header>

        <section class="learning-rail" aria-label="课程学习路径">
          <article v-for="step in learningPath" :key="step.id" class="rail-step" :class="`rail-step--${step.tone}`">
            <div class="rail-step__icon">
              <i class="fas" :class="step.icon"></i>
            </div>
            <div>
              <span>{{ step.kicker }}</span>
              <strong>{{ step.title }}</strong>
              <p>{{ step.description }}</p>
            </div>
          </article>
        </section>

        <section class="content-grid">
          <article class="course-panel course-overview">
            <div class="section-heading">
              <span>Course focus</span>
              <h2>这门课要带你完成什么</h2>
            </div>
            <p class="overview-copy">{{ course.description || course.summary || '课程说明正在整理中。' }}</p>
            <div class="objective-list">
              <div v-for="(objective, index) in learningObjectives" :key="objective" class="objective-item">
                <span>{{ index + 1 }}</span>
                <p>{{ objective }}</p>
              </div>
              <div v-if="!learningObjectives.length" class="empty-note">学习目标正在补充中。</div>
            </div>
            <div class="audience-box">
              <span>适合对象</span>
              <strong>{{ course.audience || '待补充' }}</strong>
            </div>
          </article>

          <article class="course-panel next-panel">
            <div class="section-heading">
              <span>Next action</span>
              <h2>现在可以做什么</h2>
            </div>
            <div class="next-action-list">
              <RouterLink v-if="firstLesson" :to="lessonRoute(firstLesson)" class="next-action-card">
                <i class="fas fa-layer-group"></i>
                <div>
                  <strong>进入第 {{ firstLesson.order || 1 }} 课</strong>
                  <p>{{ firstLesson.title }}</p>
                </div>
              </RouterLink>
              <a v-if="featuredGuide" :href="featuredGuide.downloadUrl" target="_blank" rel="noreferrer" class="next-action-card">
                <i class="fas fa-file-lines"></i>
                <div>
                  <strong>先看导学资料</strong>
                  <p>{{ featuredGuide.title }}</p>
                </div>
              </a>
              <RouterLink :to="{ path: '/workspace', query: { course: course.id, title: `${course.title}实践项目` } }" class="next-action-card">
                <i class="fas fa-diagram-project"></i>
                <div>
                  <strong>发起课程实践项目</strong>
                  <p>进入工作台，把课程内容延展成作品。</p>
                </div>
              </RouterLink>
            </div>
          </article>
        </section>

        <section class="course-section" id="lessons">
          <div class="section-heading section-heading--row">
            <div>
              <span>Lessons</span>
              <h2>完整课时路径</h2>
            </div>
            <p>{{ lessons.length }} 节课 · {{ assignmentCountLabel }}</p>
          </div>

          <div v-if="lessons.length" class="lesson-list">
            <RouterLink v-for="lesson in lessons" :key="lesson.id" :to="lessonRoute(lesson)" class="lesson-card">
              <div class="lesson-card__index">{{ lesson.order || lessonFallbackOrder(lesson) }}</div>
              <div class="lesson-card__body">
                <div class="lesson-card__top">
                  <h3>{{ lesson.title }}</h3>
                  <span>{{ lesson.duration || 45 }} 分钟</span>
                </div>
                <p>{{ lesson.description || lesson.essentialQuestion || '本课内容正在整理中。' }}</p>
                <div class="lesson-card__meta">
                  <span>{{ lessonAssignmentLabel(lesson.id) }}</span>
                  <span v-if="lessonSubmissionLabel(lesson.id)">{{ lessonSubmissionLabel(lesson.id) }}</span>
                </div>
              </div>
              <div class="lesson-card__cta">
                进入学习
                <i class="fas fa-arrow-right"></i>
              </div>
            </RouterLink>
          </div>
          <div v-else class="empty-note course-panel">课时内容正在整理中。</div>
        </section>

        <section class="course-section" id="materials">
          <div class="section-heading section-heading--row">
            <div>
              <span>Materials</span>
              <h2>课程资料</h2>
            </div>
            <p>{{ visibleMaterialGroups.length }} 组资料</p>
          </div>

          <div v-if="visibleMaterialGroups.length" class="material-grid">
            <article v-for="group in visibleMaterialGroups" :key="group.name" class="material-group">
              <div class="material-group__head">
                <i class="fas" :class="group.icon"></i>
                <div>
                  <strong>{{ group.name }}</strong>
                  <span>{{ group.items.length }} 项</span>
                </div>
              </div>
              <div class="material-list">
                <a v-for="material in group.items" :key="material.id || material.path" :href="material.downloadUrl" target="_blank" rel="noreferrer" class="material-link">
                  <i class="fas" :class="materialIcon(material)"></i>
                  <span>{{ material.title }}</span>
                  <small>{{ materialKindLabel(material) }}</small>
                </a>
              </div>
            </article>
          </div>
          <div v-else class="empty-note course-panel">课程资料正在整理中。</div>
        </section>

        <section class="course-section" id="practice">
          <div class="section-heading section-heading--row">
            <div>
              <span>Practice</span>
              <h2>实践延展</h2>
            </div>
            <p>{{ relatedTopics.length ? `${relatedTopics.length} 个关联课题` : '可直接进入工作台' }}</p>
          </div>

          <div v-if="relatedTopics.length" class="topic-grid">
            <article v-for="topic in relatedTopics" :key="topic.id" class="topic-card">
              <div class="topic-card__head">
                <span>{{ topic.difficulty || '难度待定' }}</span>
                <span>{{ topic.suggestedTeamSize || '人数待定' }}</span>
              </div>
              <h3>{{ topic.title }}</h3>
              <p>{{ topic.description || topic.goals || '课题说明正在整理中。' }}</p>
              <div v-if="topic.deliverables" class="topic-deliverable">
                <strong>交付物</strong>
                <span>{{ topic.deliverables }}</span>
              </div>
              <RouterLink :to="topicWorkspaceRoute(topic)" class="topic-action">
                用这个方向立项
                <i class="fas fa-arrow-right"></i>
              </RouterLink>
            </article>
          </div>

          <div v-else class="course-panel practice-empty">
            <div>
              <span>暂无明确关联课题</span>
              <h3>可以先从课程内容发起一个实践项目</h3>
              <p>项目来源会通过链接带入工作台，后续可继续补充立项书、WBS 和阶段提交。</p>
            </div>
            <RouterLink :to="{ path: '/workspace', query: { course: course.id, title: `${course.title}实践项目` } }" class="primary-action">
              <i class="fas fa-plus"></i>
              进入项目工作台
            </RouterLink>
          </div>
        </section>
      </template>
    </main>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import { getAuthToken, getAuthUser } from '@/api/auth';
import { apiFetch } from '@/api/client';
import { getCourseSection, getCourseVisual } from '@/utils/courseMeta';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref('');
const course = ref(null);
const lessons = ref([]);
const materials = ref([]);
const assignments = ref([]);
const assignmentSubmissions = ref({});
const projectTopics = ref([]);

const materialOrder = ['课程导学', '学生资料', '教师资料', '补充资料'];
const materialMeta = {
  课程导学: { icon: 'fa-book-open' },
  学生资料: { icon: 'fa-user-graduate' },
  教师资料: { icon: 'fa-chalkboard-teacher' },
  补充资料: { icon: 'fa-folder-open' }
};

const sectionMeta = computed(() => getCourseSection(course.value?.direction));
const courseVisual = computed(() => getCourseVisual(course.value?.id, course.value?.direction));
const firstLesson = computed(() => lessons.value[0] || null);
const learningObjectives = computed(() => Array.isArray(course.value?.learningObjectives) ? course.value.learningObjectives : []);
const compactDescription = computed(() => compactText(course.value?.description || course.value?.summary, 72));
const featuredGuide = computed(() => {
  return materials.value.find(item => item.section === '课程导学') || materials.value[0] || null;
});
const user = computed(() => getAuthUser());
const isTeacher = computed(() => ['teacher', 'judge'].includes(user.value?.role));
const assignmentCountLabel = computed(() => {
  if (!getAuthToken()) return '登录后查看作业';
  return `${assignments.value.length} 项作业`;
});
const relatedTopics = computed(() => {
  const courseId = String(course.value?.id || '');
  return projectTopics.value.filter(topic => String(topic.relatedCourseId || '') === courseId);
});
const learningPath = computed(() => [
  {
    id: 'guide',
    kicker: '01 / Guide',
    title: featuredGuide.value ? '先读课程导学' : '理解课程目标',
    description: featuredGuide.value ? featuredGuide.value.title : '先确认学习目标、适合对象和课程节奏。',
    icon: 'fa-book-open',
    tone: 'guide'
  },
  {
    id: 'lessons',
    kicker: '02 / Learn',
    title: '按课时推进学习',
    description: lessons.value.length ? `完成 ${lessons.value.length} 节课时和课堂任务。` : '课时内容正在整理中。',
    icon: 'fa-layer-group',
    tone: 'learn'
  },
  {
    id: 'practice',
    kicker: '03 / Make',
    title: '进入实践或项目创作',
    description: relatedTopics.value.length ? `当前有 ${relatedTopics.value.length} 个关联课题可以立项。` : '把课程能力延展成自己的项目作品。',
    icon: 'fa-diagram-project',
    tone: 'make'
  }
]);
const visibleMaterialGroups = computed(() => {
  const groups = new Map();
  materials.value.forEach((material) => {
    const name = material.section || '补充资料';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(material);
  });

  const names = Array.from(groups.keys()).sort((a, b) => {
    const aIndex = materialOrder.indexOf(a);
    const bIndex = materialOrder.indexOf(b);
    const normalizedA = aIndex === -1 ? 99 : aIndex;
    const normalizedB = bIndex === -1 ? 99 : bIndex;
    if (normalizedA !== normalizedB) return normalizedA - normalizedB;
    return a.localeCompare(b, 'zh-Hans-CN');
  });

  return names
    .filter(name => isTeacher.value || name !== '教师资料')
    .map(name => ({
      name,
      icon: materialMeta[name]?.icon || 'fa-folder-open',
      items: groups.get(name)
    }));
});

function compactText(value, maxLength = 84) {
  const text = String(value || '').trim();
  if (!text) return '课程信息正在整理中。';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function lessonFallbackOrder(lesson) {
  const index = lessons.value.findIndex(item => item.id === lesson.id);
  return index >= 0 ? index + 1 : 1;
}

function lessonRoute(lesson) {
  return `/courses/${course.value.id}/lessons/${lesson.id}`;
}

function assignmentsForLesson(lessonId) {
  return assignments.value.filter(item => String(item.lessonId || '') === String(lessonId || ''));
}

function lessonAssignmentLabel(lessonId) {
  if (!getAuthToken()) return '登录后查看作业';
  const items = assignmentsForLesson(lessonId);
  if (!items.length) return '暂无作业';
  return `${items.length} 项作业`;
}

function lessonSubmissionLabel(lessonId) {
  const items = assignmentsForLesson(lessonId);
  if (!items.length) return '';
  if (isTeacher.value) {
    const submitted = items.reduce((sum, item) => sum + Number(item.stats?.submitted || 0), 0);
    return submitted ? `${submitted} 份提交` : '暂无提交';
  }
  const submissions = items.map(item => assignmentSubmissions.value[item.id]).filter(Boolean);
  if (!submissions.length) return '待提交';
  if (submissions.some(item => item.status === 'needs_changes')) return '需修改';
  if (submissions.some(item => item.status === 'reviewed')) return '已反馈';
  return '已提交';
}

function materialIcon(material) {
  const kind = String(material?.kind || '').toLowerCase();
  const path = String(material?.path || '').toLowerCase();
  if (kind === 'presentation' || /\.pptx?$/i.test(path)) return 'fa-file-powerpoint';
  if (kind === 'video' || /\.mp4$/i.test(path)) return 'fa-file-video';
  if (kind === 'html') return 'fa-file-code';
  if (/\.md$/i.test(path)) return 'fa-file-lines';
  return 'fa-file';
}

function materialKindLabel(material) {
  const kind = String(material?.kind || '').trim();
  if (kind === 'presentation') return '课件';
  if (kind === 'markdown') return '讲义';
  if (kind === 'html') return '网页';
  if (kind === 'video') return '视频';
  return kind || '资料';
}

function topicWorkspaceRoute(topic) {
  return {
    path: '/workspace',
    query: {
      course: course.value.id,
      topic: topic.id,
      title: topic.title
    }
  };
}

async function handleEntryRedirect() {
  const entry = String(route.query.entry || '').trim();
  if (entry !== 'practice' || !course.value) return;
  if (!firstLesson.value) return;
  await router.replace({
    path: lessonRoute(firstLesson.value),
    query: {
      mode: 'mission',
      entry: 'practice'
    }
  });
}

async function loadCoursePage() {
  loading.value = true;
  error.value = '';
  assignments.value = [];
  assignmentSubmissions.value = {};
  projectTopics.value = [];

  try {
    const courseId = String(route.params.courseId || '');
    const [courseRes, lessonsRes, materialsRes, topicsRes] = await Promise.all([
      apiFetch(`/courses/${courseId}`),
      apiFetch(`/courses/${courseId}/lessons`),
      apiFetch(`/courses/${courseId}/materials`),
      apiFetch('/project-topics')
    ]);

    const [courseData, lessonsData, materialsData, topicsData] = await Promise.all([
      courseRes.json(),
      lessonsRes.json(),
      materialsRes.json(),
      topicsRes.json()
    ]);

    if (!courseRes.ok) throw new Error(courseData?.error || '课程加载失败');
    if (!lessonsRes.ok) throw new Error(lessonsData?.error || '课时加载失败');
    if (!materialsRes.ok) throw new Error(materialsData?.error || '课程资料加载失败');
    if (!topicsRes.ok) throw new Error(topicsData?.error || '课题加载失败');

    course.value = courseData.course || null;
    lessons.value = lessonsData.lessons || [];
    materials.value = materialsData.materials || [];
    projectTopics.value = topicsData.topics || [];
    await loadAssignments(courseId);
    await handleEntryRedirect();
  } catch (err) {
    error.value = err.message || '课程加载失败';
    course.value = null;
    lessons.value = [];
    materials.value = [];
    assignments.value = [];
    assignmentSubmissions.value = {};
    projectTopics.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadAssignments(courseId) {
  if (!getAuthToken()) return;
  try {
    const response = await apiFetch(`/assignments?courseId=${encodeURIComponent(courseId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || '作业加载失败');
    assignments.value = data.assignments || [];
    if (!isTeacher.value) {
      await Promise.all(assignments.value.map(loadOwnAssignmentSubmission));
    }
  } catch (err) {
    assignments.value = [];
    assignmentSubmissions.value = {};
  }
}

async function loadOwnAssignmentSubmission(assignment) {
  const response = await apiFetch(`/assignments/${assignment.id}/submissions`);
  const data = await response.json();
  const submission = response.ok ? (data.submissions || [])[0] : null;
  assignmentSubmissions.value = {
    ...assignmentSubmissions.value,
    [assignment.id]: submission || null
  };
}

onMounted(loadCoursePage);

watch(() => route.params.courseId, loadCoursePage);
</script>

<style scoped>
.course-page {
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.92), #f8fafc 28rem),
    radial-gradient(circle at top left, rgba(16, 185, 129, 0.12), transparent 30rem);
}

.course-panel {
  @apply rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60;
}

.course-hero {
  @apply grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 lg:grid-cols-[1fr_24rem];
}

.course-hero__main {
  @apply flex min-w-0 flex-col justify-between rounded-2xl bg-slate-50 p-6 sm:p-8;
}

.course-eyebrow {
  @apply inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500;
}

.course-eyebrow span {
  @apply h-1 w-1 rounded-full bg-slate-300;
}

.course-hero h1 {
  @apply mt-5 max-w-4xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl;
}

.course-summary {
  @apply mt-4 max-w-3xl text-base font-medium leading-8 text-slate-600;
}

.course-meta {
  @apply mt-6 flex flex-wrap gap-2;
}

.course-meta span {
  @apply rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-500;
}

.course-actions {
  @apply mt-7 flex flex-wrap gap-3;
}

.primary-action,
.secondary-action,
.topic-action {
  @apply inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition;
}

.primary-action {
  @apply bg-slate-950 text-white hover:bg-slate-800;
}

.secondary-action {
  @apply border border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700;
}

.course-hero__aside {
  @apply relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900;
  min-height: 22rem;
}

.course-hero__aside img {
  @apply h-full w-full object-cover opacity-90;
}

.course-snapshot {
  @apply absolute bottom-4 left-4 right-4 rounded-2xl border border-white/20 bg-slate-950/70 p-4 text-white backdrop-blur;
}

.course-snapshot strong {
  @apply text-sm font-black;
}

.course-snapshot p {
  @apply mt-2 text-xs font-medium leading-6 text-white/75;
}

.learning-rail {
  @apply mt-5 grid gap-4 md:grid-cols-3;
}

.rail-step {
  @apply flex gap-4 rounded-3xl border bg-white p-5 shadow-sm;
}

.rail-step--guide {
  @apply border-amber-100;
}

.rail-step--learn {
  @apply border-emerald-100;
}

.rail-step--make {
  @apply border-sky-100;
}

.rail-step__icon {
  @apply flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white;
}

.rail-step span {
  @apply text-[10px] font-black uppercase tracking-[0.18em] text-slate-400;
}

.rail-step strong {
  @apply mt-1 block text-base font-black text-slate-950;
}

.rail-step p {
  @apply mt-2 text-sm font-medium leading-7 text-slate-500;
}

.content-grid {
  @apply mt-5 grid gap-5 lg:grid-cols-[1fr_24rem];
}

.section-heading span {
  @apply text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600;
}

.section-heading h2 {
  @apply mt-2 text-2xl font-black tracking-normal text-slate-950;
}

.section-heading--row {
  @apply mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end;
}

.section-heading--row p {
  @apply text-sm font-bold text-slate-400;
}

.overview-copy {
  @apply mt-5 text-sm font-medium leading-8 text-slate-600;
}

.objective-list {
  @apply mt-6 grid gap-3;
}

.objective-item {
  @apply flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4;
}

.objective-item span {
  @apply flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white;
}

.objective-item p {
  @apply text-sm font-medium leading-7 text-slate-600;
}

.audience-box {
  @apply mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4;
}

.audience-box span {
  @apply text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700;
}

.audience-box strong {
  @apply mt-2 block text-sm font-black leading-7 text-slate-800;
}

.next-panel {
  @apply h-fit;
}

.next-action-list {
  @apply mt-5 grid gap-3;
}

.next-action-card {
  @apply flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50;
}

.next-action-card i {
  @apply mt-1 text-emerald-600;
}

.next-action-card strong {
  @apply text-sm font-black text-slate-950;
}

.next-action-card p {
  @apply mt-1 text-xs font-medium leading-6 text-slate-500;
}

.course-section {
  @apply mt-10;
}

.lesson-list {
  @apply grid gap-3;
}

.lesson-card {
  @apply grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:grid-cols-[3.5rem_1fr_auto] sm:items-center;
}

.lesson-card__index {
  @apply flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white;
}

.lesson-card__body {
  @apply min-w-0;
}

.lesson-card__top {
  @apply flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between;
}

.lesson-card__top h3 {
  @apply text-base font-black text-slate-950;
}

.lesson-card__top span {
  @apply text-xs font-bold text-slate-400;
}

.lesson-card__body p {
  @apply mt-2 text-sm font-medium leading-7 text-slate-500;
}

.lesson-card__meta {
  @apply mt-3 flex flex-wrap gap-2;
}

.lesson-card__meta span {
  @apply rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-500;
}

.lesson-card__cta {
  @apply inline-flex items-center gap-2 text-sm font-black text-emerald-700;
}

.material-grid {
  @apply grid gap-4 lg:grid-cols-2;
}

.material-group {
  @apply rounded-3xl border border-slate-200 bg-white p-5 shadow-sm;
}

.material-group__head {
  @apply flex items-center gap-3 border-b border-slate-100 pb-4;
}

.material-group__head > i {
  @apply flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white;
}

.material-group__head strong {
  @apply block text-sm font-black text-slate-950;
}

.material-group__head span {
  @apply text-xs font-bold text-slate-400;
}

.material-list {
  @apply mt-4 grid gap-2;
}

.material-link {
  @apply grid grid-cols-[1.5rem_1fr_auto] items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800;
}

.material-link i {
  @apply text-slate-400;
}

.material-link span {
  @apply min-w-0 truncate;
}

.material-link small {
  @apply text-[10px] font-black uppercase tracking-[0.14em] text-slate-400;
}

.topic-grid {
  @apply grid gap-4 lg:grid-cols-3;
}

.topic-card {
  @apply flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm;
}

.topic-card__head {
  @apply flex flex-wrap gap-2;
}

.topic-card__head span {
  @apply rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-black text-slate-500;
}

.topic-card h3 {
  @apply mt-4 text-lg font-black leading-7 text-slate-950;
}

.topic-card p {
  @apply mt-3 flex-1 text-sm font-medium leading-7 text-slate-500;
}

.topic-deliverable {
  @apply mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-6 text-slate-500;
}

.topic-deliverable strong {
  @apply mr-2 text-slate-900;
}

.topic-action {
  @apply mt-5 bg-emerald-600 text-white hover:bg-emerald-700;
}

.practice-empty {
  @apply flex flex-col justify-between gap-5 md:flex-row md:items-center;
}

.practice-empty span {
  @apply text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600;
}

.practice-empty h3 {
  @apply mt-2 text-xl font-black text-slate-950;
}

.practice-empty p {
  @apply mt-2 text-sm font-medium leading-7 text-slate-500;
}

.empty-note {
  @apply text-sm font-bold leading-7 text-slate-400;
}

@media (max-width: 640px) {
  .course-hero h1 {
    @apply text-3xl;
  }

  .course-hero__aside {
    min-height: 15rem;
  }
}
</style>

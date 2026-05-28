<template>
  <div class="min-h-screen text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 study-page">
    <header class="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div class="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-6 py-5 lg:px-8">
        <div class="flex items-center gap-4">
          <RouterLink
            :to="backToCourse"
            class="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            <i class="fas fa-arrow-left"></i>
          </RouterLink>
          <div class="flex items-center gap-4">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <i class="fas fa-book-open"></i>
            </div>
            <div>
              <h1 class="text-sm font-black uppercase tracking-[0.22em] text-slate-900">{{ lessonTitle }}</h1>
              <p class="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                {{ course?.title || '课程' }} / {{ lessonLabel }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <button
            v-if="mode === 'mission'"
            @click="showWorkbench = !showWorkbench"
            class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4.5 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 hover:-translate-y-0.5 active:scale-95"
          >
            <i class="fas" :class="showWorkbench ? 'fa-columns' : 'fa-bullseye'"></i>
            {{ showWorkbench ? '收起任务面板' : '展开任务面板' }}
          </button>

          <div class="flex rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
            <button :class="modeButtonClass('mission')" @click="setMode('mission')">课件舞台</button>
            <button :class="modeButtonClass('guide')" @click="setMode('guide')">完整讲义</button>
          </div>
        </div>
      </div>
    </header>

    <section v-if="loadingPage" class="flex min-h-[70vh] items-center justify-center">
      <div class="text-center text-slate-400">
        <i class="fas fa-spinner fa-spin text-4xl"></i>
        <div class="mt-4 text-xs font-black uppercase tracking-[0.24em]">正在加载课时内容</div>
      </div>
    </section>

    <section v-else-if="pageError" class="mx-auto max-w-4xl px-6 py-20">
      <div class="rounded-[32px] border border-rose-100 bg-white p-10 text-center shadow-xl shadow-rose-500/5">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-400">
          <i class="fas fa-circle-exclamation text-xl"></i>
        </div>
        <h2 class="mt-5 text-xl font-black tracking-tight text-slate-900">课时加载失败</h2>
        <p class="mt-3 text-sm font-medium leading-7 text-slate-500">{{ pageError }}</p>
      </div>
    </section>

    <template v-else>
      <div v-show="mode === 'mission'" class="flex min-h-[calc(100vh-92px)] flex-col xl:flex-row">
        <CourseSyllabusSidebar
          :course-id="courseId"
          :lessons="lessons"
          :active-lesson-id="lessonId"
        />

        <main ref="mainScroll" class="flex-1 overflow-y-auto px-6 py-10 lg:px-10 xl:px-14 relative bg-slate-50/50">
          <div class="mx-auto max-w-4xl space-y-12">
            
            <LessonStage
              :lesson-title="lessonTitle"
              :lesson-description="lessonData?.description"
              :phases="lessonPhases"
              @focus-submission="focusSubmission"
            />
          </div>
        </main>

        <MissionControlPanel
          v-if="showWorkbench"
          ref="missionControlRef"
          :materials="materials"
          :assignments="lessonAssignments"
          :submissions="assignmentSubmissions"
          :drafts="assignmentDrafts"
          :loading="assignmentLoading"
          @submit="submitAssignment"
        />

        <input ref="hwInput" type="file" class="hidden" @change="handleHomeworkUpload" />
      </div>

      <div v-show="mode === 'guide'" class="px-6 py-12 lg:px-10 xl:px-14">
        <div class="mx-auto max-w-5xl rounded-[36px] bg-white p-8 shadow-2xl shadow-indigo-500/5 lg:p-10">
          <div class="flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div class="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-500">Guide Mode</div>
              <h2 class="mt-3 text-3xl font-black tracking-tight text-slate-900">{{ course?.title }}</h2>
            </div>
            <div class="text-sm font-medium text-slate-500">优先展示课程导学或完整讲义</div>
          </div>
          <div v-if="guideLoading" class="py-20 text-center text-slate-400">
            <i class="fas fa-spinner fa-spin text-3xl"></i>
          </div>
          <div v-else class="prose prose-slate mt-8 max-w-none" v-html="guideHtml"></div>
        </div>
      </div>
    </template>

    <div v-if="toastVisible" class="fixed bottom-8 right-8 z-[100]">
      <div class="rounded-2xl bg-slate-900 px-6 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-white shadow-2xl">
        {{ toastMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiFetch } from '@/api/client';
import { getAuthToken } from '@/api/auth';
import { getCurrentUser } from '@/api/authApi';
import CourseSyllabusSidebar from '@/components/study/CourseSyllabusSidebar.vue';
import LessonStage from '@/components/study/LessonStage.vue';
import MissionControlPanel from '@/components/study/MissionControlPanel.vue';

const route = useRoute();
const router = useRouter();

const mode = ref('mission');
const showWorkbench = ref(true);
const loadingPage = ref(true);
const pageError = ref('');
const guideLoading = ref(false);
const guideHtml = ref('<p class="text-slate-500">正在准备讲义内容...</p>');
const guideLoaded = ref(false);
const course = ref(null);
const lessons = ref([]);
const materials = ref([]);
const currentSlideIndex = ref(0);
const homeworkDone = ref(false);
const homeworkName = ref('');
const homeworkUploading = ref(false);
const assignmentLoading = ref(false);
const hwInput = ref(null);
const toastVisible = ref(false);
const toastMessage = ref('已复制');
const mainScroll = ref(null);
const lessonAssignments = ref([]);
const assignmentSubmissions = ref({});
const assignmentDrafts = reactive({});
const missionControlRef = ref(null);
function focusSubmission() {
  showWorkbench.value = true;
  
  nextTick(() => {
    if (lessonAssignments.value?.length > 0) {
      missionControlRef.value?.openAssignmentDrawer(lessonAssignments.value[0].id);
    }
  });
}

const courseId = computed(() => String(route.params.courseId || route.query.project || 'project1'));
const lessonId = computed(() => String(route.params.lessonId || route.query.lesson || 'lesson1'));
const lessonData = computed(() => lessons.value.find(item => item.id === lessonId.value) || null);
const lessonPhases = computed(() => lessonData.value?.phases || []);
const lessonSlides = computed(() => buildLessonSlides());
const activeSlide = computed(() => lessonSlides.value[currentSlideIndex.value] || null);
const lessonDeliverables = computed(() => buildLessonDeliverables());
const lessonTitle = computed(() => lessonData.value?.title || '课时学习');
const lessonLabel = computed(() => {
  const order = lessonData.value?.order || parseInt(String(lessonId.value).replace('lesson', ''), 10) || 1;
  return `第 ${order} 课`;
});
const backToCourse = computed(() => `/courses/${courseId.value}`);
const emptyPhaseHtml = '<p>当前阶段内容正在整理中。</p>';
const isLastSlide = computed(() => currentSlideIndex.value >= Math.max(lessonSlides.value.length - 1, 0));
const currentLessonIndex = computed(() => lessons.value.findIndex(item => item.id === lessonId.value));
const nextLesson = computed(() => {
  const index = currentLessonIndex.value;
  if (index < 0) return null;
  return lessons.value[index + 1] || null;
});
const hasNextLesson = computed(() => Boolean(nextLesson.value));
const nextDisabled = computed(() => !lessonSlides.value.length);
const nextButtonClass = computed(() => hasNextLesson.value && isLastSlide.value
  ? 'bg-emerald-600 shadow-emerald-500/20'
  : 'bg-indigo-600 shadow-indigo-600/20');
const routeMode = computed(() => {
  const value = String(route.query.mode || '').trim();
  return value === 'guide' ? 'guide' : 'mission';
});

function modeButtonClass(target) {
  return mode.value === target
    ? 'rounded-xl bg-white px-5 py-2.5 text-xs font-black text-indigo-600 shadow-sm transition'
    : 'rounded-xl px-5 py-2.5 text-xs font-black text-slate-500 transition hover:text-slate-900';
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function encodeDownloadPath(value) {
  return String(value || '')
    .split('/')
    .filter(Boolean)
    .map(part => encodeURIComponent(part))
    .join('/');
}

function setMode(target) {
  mode.value = target;
  router.replace({
    query: {
      ...route.query,
      mode: target
    }
  }).catch(() => {});
  if (target === 'guide') {
    loadGuidebook();
  }
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function toTextList(value) {
  return Array.isArray(value) ? value.map(item => String(item || '').trim()).filter(Boolean) : [];
}

function makeDeliverableTitle(phase, phaseIndex) {
  const title = `${phase?.title || ''} ${phase?.student?.title || ''}`;
  if (/场景|任务/.test(title) && phaseIndex === 0) return '任务场景卡';
  if (/标准|判断/.test(title)) return '成功标准说明';
  if (/流程/.test(title)) return '机器人任务流程图';
  if (/联调|失败|跑通|调试/.test(title)) return '任务调试记录';
  if (/展示|升级|改进/.test(title)) return '升级清单';
  return `知识点 ${phaseIndex + 1} 活动记录`;
}

function buildLessonSlides() {
  const slides = [];
  const lesson = lessonData.value;
  if (!lesson) return slides;
  const units = Array.isArray(lesson.units) ? lesson.units : [];
  const deliverables = buildLessonDeliverables();

  slides.push({
    id: `${lesson.id}-overview`,
    type: 'overview',
    typeLabel: '本课导入',
    title: lesson.title || lessonTitle.value,
    description: lesson.description || course.value?.summary || '本节课将围绕知识点讲解、活动要求和作业提交展开。',
    highlights: [
      `${lesson.duration || 60} 分钟课堂`,
      `${units.length || lessonPhases.value.length || 0} 个学习单元`,
      `${deliverables.length || 1} 项本课成果`
    ]
  });

  if (units.length) {
    units.forEach((unit, unitIndex) => {
      const unitTitle = String(unit?.title || `学习单元 ${unitIndex + 1}`).trim();
      const pages = Array.isArray(unit?.pages) ? unit.pages : [];
      pages.forEach((page, pageIndex) => {
        const type = ['knowledge', 'check', 'activity'].includes(page?.type) ? page.type : 'knowledge';
        const typeLabelMap = {
          knowledge: `知识点 ${unitIndex + 1}`,
          check: '理解检查',
          activity: `活动 ${unitIndex + 1}`
        };
        slides.push({
          id: `${unit.id || unitIndex}-${page.id || pageIndex}`,
          type,
          typeLabel: typeLabelMap[type],
          title: page?.title || unitTitle,
          unitTitle,
          content: page?.content || '',
          examples: toTextList(page?.examples),
          misconceptions: toTextList(page?.misconceptions),
          question: String(page?.question || '').trim(),
          options: toTextList(page?.options),
          answer: Number.isFinite(Number(page?.answer)) ? Number(page.answer) : -1,
          explanation: String(page?.explanation || '').trim(),
          description: String(page?.description || '').trim() || stripHtml(page?.content) || `完成“${unitTitle}”对应学习任务。`,
          steps: toTextList(page?.steps),
          criteria: toTextList(page?.criteria),
          deliverable: String(page?.deliverable || unit?.deliverable || '').trim()
        });
      });
    });
  } else {
    lessonPhases.value.forEach((phase, phaseIndex) => {
      const student = phase.student || phase;
      const title = student?.title || phase.title || `知识点 ${phaseIndex + 1}`;
      const deliverable = makeDeliverableTitle(phase, phaseIndex);

      slides.push({
        id: `${phase.id || phaseIndex}-knowledge`,
        type: 'knowledge',
        typeLabel: `知识点 ${phaseIndex + 1}`,
        title,
        phaseTitle: phase.title || `第 ${phaseIndex + 1} 个知识任务`,
        content: student?.content || emptyPhaseHtml
      });

      slides.push({
        id: `${phase.id || phaseIndex}-activity`,
        type: 'activity',
        typeLabel: `任务 ${phaseIndex + 1}`,
        title: `${title}：活动要求`,
        description: stripHtml(student?.content) || '完成本页要求后，再进入下一页继续学习。',
        steps: Array.isArray(student?.tasks) && student.tasks.length
          ? student.tasks
          : ['完成本知识点对应的课堂操作', '记录过程中的关键问题和结果'],
        criteria: [],
        deliverable
      });
    });
  }

  slides.push({
    id: `${lesson.id}-summary`,
    type: 'summary',
    typeLabel: '成果检查',
    title: '检查本课学习成果',
    description: '对照右侧成果清单整理材料，确认完整后使用右侧作业提交入口上传。',
    items: deliverables.length ? deliverables : ['整理本课活动记录', '确认材料完整后在右侧提交']
  });

  return slides;
}

function buildLessonDeliverables() {
  const lesson = lessonData.value;
  if (!lesson) return [];
  const homework = toTextList(lesson.homework);
  if (homework.length) return Array.from(new Set(homework));

  const values = toTextList(lesson.deliverables);
  if (Array.isArray(lesson.units)) {
    lesson.units.forEach(unit => {
      if (unit?.deliverable) values.push(String(unit.deliverable).trim());
      if (Array.isArray(unit?.pages)) {
        unit.pages.forEach(page => {
          if (page?.deliverable) values.push(String(page.deliverable).trim());
        });
      }
    });
  }
  if (!values.length) {
    lessonPhases.value.forEach((phase, index) => values.push(makeDeliverableTitle(phase, index)));
  }
  return Array.from(new Set(values.filter(Boolean)));
}

function loadSlide(index) {
  currentSlideIndex.value = Math.min(Math.max(index, 0), Math.max(lessonSlides.value.length - 1, 0));
  nextTick(() => {
    if (mainScroll.value) {
      mainScroll.value.scrollTop = 0;
    }
  });
}

function prevSlide() {
  if (currentSlideIndex.value > 0) {
    loadSlide(currentSlideIndex.value - 1);
  }
}

async function nextSlide() {
  if (!isLastSlide.value) {
    loadSlide(currentSlideIndex.value + 1);
    return;
  }
  if (nextLesson.value) {
    await router.push(`/courses/${courseId.value}/lessons/${nextLesson.value.id}`);
    return;
  }
  await router.push(backToCourse.value);
}

function handleSlideKeydown(event) {
  if (mode.value !== 'mission') return;
  const target = event.target;
  const tagName = String(target?.tagName || '').toLowerCase();
  if (['input', 'textarea', 'select', 'button', 'a'].includes(tagName) || target?.isContentEditable) return;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    prevSlide();
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    nextSlide();
  }
}

async function loadLessonPage() {
  loadingPage.value = true;
  pageError.value = '';

  try {
    const [courseRes, lessonsRes, materialsRes] = await Promise.all([
      apiFetch(`/courses/${courseId.value}`),
      apiFetch(`/courses/${courseId.value}/lessons`),
      apiFetch(`/courses/${courseId.value}/materials`)
    ]);

    const [courseData, lessonsData, materialsData] = await Promise.all([
      courseRes.json(),
      lessonsRes.json(),
      materialsRes.json()
    ]);

    if (!courseRes.ok) throw new Error(courseData?.error || '课程加载失败');
    if (!lessonsRes.ok) throw new Error(lessonsData?.error || '课时加载失败');
    if (!materialsRes.ok) throw new Error(materialsData?.error || '资料加载失败');

    course.value = courseData.course || null;
    lessons.value = lessonsData.lessons || [];
    materials.value = materialsData.materials || [];

    if (!lessonData.value) {
      throw new Error('没有找到对应课时');
    }
    await loadLessonAssignments();
  } catch (err) {
    pageError.value = err.message || '课时加载失败';
    course.value = null;
    lessons.value = [];
    materials.value = [];
  } finally {
    loadingPage.value = false;
  }
}

async function loadLessonAssignments() {
  if (!getAuthToken()) {
    lessonAssignments.value = [];
    assignmentSubmissions.value = {};
    return;
  }
  assignmentLoading.value = true;
  try {
    const res = await apiFetch(`/assignments?courseId=${encodeURIComponent(courseId.value)}&lessonId=${encodeURIComponent(lessonId.value)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || '作业加载失败');
    lessonAssignments.value = data.assignments || [];
    await Promise.all(lessonAssignments.value.map(loadOwnAssignmentSubmission));
  } catch (err) {
    lessonAssignments.value = [];
  } finally {
    assignmentLoading.value = false;
  }
}

async function loadOwnAssignmentSubmission(assignment) {
  assignmentDrafts[assignment.id] = assignmentDrafts[assignment.id] || { content: '', link: '', attachmentNote: '' };
  const res = await apiFetch(`/assignments/${assignment.id}/submissions`);
  const data = await res.json();
  const submission = res.ok ? (data.submissions || [])[0] : null;
  assignmentSubmissions.value = { ...assignmentSubmissions.value, [assignment.id]: submission || null };
  if (submission) {
    assignmentDrafts[assignment.id] = {
      content: submission.content || '',
      link: submission.link || '',
      attachmentNote: submission.attachmentNote || ''
    };
  }
}

function ownSubmission(assignmentId) {
  return assignmentSubmissions.value[assignmentId] || null;
}

async function submitAssignment(assignment) {
  const draft = assignmentDrafts[assignment.id] || {};
  try {
    const res = await apiFetch(`/assignments/${assignment.id}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || '作业提交失败');
    assignmentSubmissions.value = { ...assignmentSubmissions.value, [assignment.id]: data.submission };
    toastMessage.value = '作业已提交';
    toastVisible.value = true;
    setTimeout(() => {
      toastVisible.value = false;
    }, 1800);
  } catch (err) {
    pageError.value = err.message || '作业提交失败';
  }
}

async function ensureLegacyRedirect() {
  if (route.path !== '/study') return false;
  const project = route.query.project;
  const lesson = route.query.lesson;
  if (!project || !lesson) return false;
  await router.replace(`/courses/${project}/lessons/${lesson}`);
  return true;
}

async function loadGuidebook() {
  if (guideLoaded.value || !course.value?.guidePath) return;
  guideLoading.value = true;
  try {
    const resourcePath = encodeDownloadPath(course.value.guidePath);
    const res = await fetch(`/api/v1/download/${encodeURIComponent(course.value.materialsRoot)}/${resourcePath}`);
    if (!res.ok) throw new Error('guide_not_found');
    const text = await res.text();
    guideHtml.value = window.marked ? window.marked.parse(text) : `<pre>${text}</pre>`;
    guideLoaded.value = true;
  } catch (err) {
    guideHtml.value = '<p class="text-rose-500">无法加载完整讲义文件。</p>';
  } finally {
    guideLoading.value = false;
  }
}

async function copyPrompt(text) {
  await navigator.clipboard.writeText(text || '');
  toastMessage.value = 'Prompt 已复制';
  toastVisible.value = true;
  setTimeout(() => {
    toastVisible.value = false;
  }, 1800);
}

function triggerHomework() {
  if (!homeworkUploading.value) {
    hwInput.value?.click();
  }
}

async function handleHomeworkUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const projectRef = course.value?.relatedProjects?.[0] || courseId.value;
  const projectNumber = parseInt(String(projectRef).replace('project', ''), 10);
  if (!projectNumber) {
    pageError.value = '当前课程未绑定项目，暂不支持直接提交作业。';
    event.target.value = '';
    return;
  }

  homeworkUploading.value = true;
  try {
    const user = getCurrentUser();
    const formData = new FormData();
    formData.append('type', 'showcase');
    formData.append('title', `[${lessonId.value}] ${file.name}`);
    formData.append('studentName', user?.name || 'Anonymous Student');
    formData.append('file', file);
    const response = await apiFetch(`/projects/${projectNumber}/submissions`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || '上传失败');
    homeworkDone.value = true;
    homeworkName.value = file.name;
    localStorage.setItem(`hw_${courseId.value}_${lessonId.value}`, 'true');
    localStorage.setItem(`hw_${courseId.value}_${lessonId.value}_name`, file.name);
  } catch (err) {
    pageError.value = err.message || '上传失败';
  } finally {
    homeworkUploading.value = false;
    event.target.value = '';
  }
}

function hydrateHomeworkState() {
  const doneKey = `hw_${courseId.value}_${lessonId.value}`;
  homeworkDone.value = localStorage.getItem(doneKey) === 'true';
  homeworkName.value = localStorage.getItem(`${doneKey}_name`) || '';
}

onMounted(async () => {
  const redirected = await ensureLegacyRedirect();
  if (redirected) return;
  window.addEventListener('keydown', handleSlideKeydown);
  mode.value = routeMode.value;
  hydrateHomeworkState();
  await loadLessonPage();
  if (mode.value === 'guide') {
    await loadGuidebook();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleSlideKeydown);
});

watch([courseId, lessonId], async () => {
  currentSlideIndex.value = 0;
  guideLoaded.value = false;
  guideHtml.value = '<p class="text-slate-500">正在准备讲义内容...</p>';
  hydrateHomeworkState();
  await loadLessonPage();
  if (mode.value === 'guide') {
    await loadGuidebook();
  }
});

watch(lessonSlides, slides => {
  if (currentSlideIndex.value >= slides.length) {
    currentSlideIndex.value = Math.max(slides.length - 1, 0);
  }
});

watch(routeMode, async value => {
  mode.value = value;
  if (value === 'guide' && course.value) {
    await loadGuidebook();
  }
});
</script>

<style scoped>
.study-page {
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.08), transparent 30%),
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.05), transparent 30%),
    #f8fafc;
  min-height: 100vh;
}

.assignment-input {
  width: 100%;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.82);
  padding: 0.9rem 1rem;
  color: #0f172a;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s ease;
}

.assignment-input:focus {
  border-color: #6366f1;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
}
</style>

<style scoped>
.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  @apply font-black tracking-tight text-slate-900;
}

.prose :deep(p) {
  @apply leading-8 text-slate-600;
}

.prose :deep(ul) {
  @apply leading-8 text-slate-600;
}

</style>

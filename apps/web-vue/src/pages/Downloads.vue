<template>
  <div class="downloads-page text-gray-800">
    <SiteNav active="courses" />

    <PublicPageHeader
      title="课程库"
      description="按学科方向整理课程、课时和资料，让学生从能力训练进入真实项目实践。"
    />

    <main class="public-index-content min-h-dvh pb-3">
      <CategorySearchBar
        :category="activeFilter"
        :search="searchTerm"
        :options="courseCategoryOptions"
        :placeholder="courseSearchPlaceholder"
        :clear-disabled="!searchTerm && activeFilter === 'all'"
        @update:category="setActiveFilter"
        @update:search="searchTerm = $event"
        @clear="resetCourseSearch"
      />

      <section ref="courseListRef" class="scroll-anchor">
        <template v-if="loading">
          <div class="text-center py-16 text-gray-400">
            <i class="fas fa-circle-notch text-2xl mb-2"></i><br />
            加载课程中...
          </div>
        </template>

        <template v-else-if="error">
          <div class="text-center py-16 text-red-500">{{ error }}</div>
        </template>

        <template v-else>
          <section v-for="section in visibleSections" :key="section.id" class="mb-10">
            <div class="course-section-heading">
              <div>
                <p>
                  <i class="fas" :class="section.icon"></i>
                  {{ section.label }}
                </p>
                <h2>{{ section.title }}</h2>
              </div>
              <span>{{ section.desc }} · {{ section.items.length }} 门</span>
            </div>

            <div v-if="section.items.length" class="course-list">
              <button
                v-for="course in section.items"
                :key="course.id"
                type="button"
                class="course-card group text-left"
                :style="getTrackStyles(section.id)"
                :aria-label="`打开课程：${course.title}`"
                @click="openCourse(course.id)"
              >
                <div class="course-card__media" :class="sectionCoverBg(section.id)">
                  <img
                    :src="getCourseVisual(course.id, course.direction).cover"
                    :alt="course.title"
                    class="course-card__image"
                    :class="{ 'course-card__image--svg': isSvg(getCourseVisual(course.id, course.direction).cover) }"
                  />
                </div>

                <div class="course-card__top">
                  <span>{{ section.label }}</span>
                  <span>{{ course.courseType || '课程' }}</span>
                </div>

                <div class="course-card__content">
                  <div class="course-card__summary">
                    <h3>{{ course.title }}</h3>
                    <p>{{ course.summary }}</p>
                  </div>

                  <div class="course-card__facts">
                    <span>{{ course.positioning || section.desc }}</span>
                    <span>{{ course.pace || '节奏待补充' }}</span>
                  </div>

                  <div class="course-card__details">
                    <span>{{ course.audience || '适合对象待补充' }}</span>
                    <span>{{ course.teacherName || '导师组' }}</span>
                  </div>

                  <div class="course-card__action">
                    <span class="flex items-center gap-1.5">
                      <i class="fas" :class="stepActionIcon(activeStep)"></i> 
                      {{ stepActionLabel(activeStep) }}
                    </span>
                    <i class="fas fa-arrow-right"></i>
                  </div>
                </div>
              </button>
            </div>

            <div v-else class="text-gray-400 text-sm">这一方向的课程正在整理中。</div>
          </section>
        </template>
      </section>
    </main>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiFetch, readJsonResponse } from '@/api/client';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import PublicPageHeader from '@/components/PublicPageHeader.vue';
import CategorySearchBar from '@/components/CategorySearchBar.vue';
import { courseFilters, courseSections, getCourseSection, getCourseVisual } from '@/utils/courseMeta';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref('');
const activeFilter = ref('all');
const activeStep = ref(resolveStep(route.query.step));
const searchTerm = ref('');
const courses = ref([]);
const courseListRef = ref(null);
const hiddenCourseSectionIds = new Set(['capstone']);
const displayCourseSections = courseSections.filter(section => !hiddenCourseSectionIds.has(section.id));
const displayCourseFilters = courseFilters.filter(filter => !hiddenCourseSectionIds.has(filter.id));

function resolveStep(value) {
  return ['guide', 'lessons', 'materials', 'practice'].includes(String(value || ''))
    ? String(value)
    : 'guide';
}

const visibleSections = computed(() => {
  const sectionIds = activeFilter.value === 'all'
    ? displayCourseSections.map(section => section.id)
    : [activeFilter.value];

  return sectionIds.map(sectionId => {
    const meta = getCourseSection(sectionId);
    return {
      ...meta,
      items: courses.value
        .filter(course => course.direction === sectionId)
        .filter(matchesCourseSearch)
    };
  });
});


const courseCategoryOptions = computed(() => displayCourseFilters.map(filter => ({
  value: filter.id,
  label: filter.id === 'all' ? '全部课程' : filter.label
})));

const courseSearchPlaceholder = computed(() => {
  const label = displayCourseFilters.find(item => item.id === activeFilter.value)?.label || '课程';
  return activeFilter.value === 'all'
    ? '搜索课程标题、简介或方向'
    : `在${label}中搜索课程标题或简介`;
});

function matchesCourseSearch(course) {
  const keyword = searchTerm.value.trim().toLowerCase();
  if (!keyword) return true;
  return [
    course.title,
    course.summary,
    course.description,
    course.courseType,
    getCourseSection(course.direction).label
  ].filter(Boolean).join(' ').toLowerCase().includes(keyword);
}

function sectionIcon(id) {
  return {
    foundation: 'fa-graduation-cap',
    science: 'fa-flask',
    engineering: 'fa-microchip',
    social: 'fa-comments',
    humanities: 'fa-feather-pointed',
    capstone: 'fa-flag-checkered'
  }[id] || 'fa-folder-open';
}

function sectionText(id) {
  return {
    foundation: 'text-slate-700',
    science: 'text-slate-700',
    engineering: 'text-teal-700',
    social: 'text-slate-700',
    humanities: 'text-slate-700',
    capstone: 'text-slate-700'
  }[id] || 'text-teal-700';
}

function sectionBorderBg(id) {
  return {
    foundation: 'bg-slate-400/80',
    science: 'bg-slate-500/80',
    engineering: 'bg-teal-600/80',
    social: 'bg-slate-500/80',
    humanities: 'bg-slate-500/80',
    capstone: 'bg-slate-700/80'
  }[id] || 'bg-teal-600/80';
}

function sectionIconBg(id) {
  return {
    foundation: 'bg-slate-100 text-slate-600',
    science: 'bg-slate-100 text-slate-600',
    engineering: 'bg-teal-50 text-teal-700',
    social: 'bg-slate-100 text-slate-600',
    humanities: 'bg-slate-100 text-slate-600',
    capstone: 'bg-slate-100 text-slate-700'
  }[id] || 'bg-teal-50 text-teal-700';
}

function isSvg(path) {
  return String(path || '').toLowerCase().endsWith('.svg');
}

function sectionCoverBg(id) {
  return {
    foundation: 'bg-slate-50',
    science: 'bg-slate-50',
    engineering: 'bg-teal-50',
    social: 'bg-slate-50',
    humanities: 'bg-slate-50',
    capstone: 'bg-slate-100'
  }[id] || 'bg-teal-50';
}

function stepActiveBg(sectionId) {
  return {
    foundation: 'bg-slate-900 text-white border-transparent',
    science: 'bg-slate-800 text-white border-transparent',
    engineering: 'bg-teal-700 text-white border-transparent',
    social: 'bg-slate-800 text-white border-transparent',
    humanities: 'bg-slate-800 text-white border-transparent',
    capstone: 'bg-slate-800 text-white border-transparent'
  }[sectionId] || 'bg-teal-700 text-white border-transparent';
}

function getTrackStyles(sectionId) {
  const configs = {
    foundation: {
      accent: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      glow: 'rgba(99, 102, 241, 0.25)',
      tagText: '#c7d2fe',
      tagBg: 'rgba(99, 102, 241, 0.12)'
    },
    science: {
      accent: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      glow: 'rgba(16, 185, 129, 0.25)',
      tagText: '#a7f3d0',
      tagBg: 'rgba(16, 185, 129, 0.12)'
    },
    engineering: {
      accent: '#0d9488',
      gradient: 'linear-gradient(135deg, #0d9488, #0f766e)',
      glow: 'rgba(13, 148, 136, 0.25)',
      tagText: '#99f6e4',
      tagBg: 'rgba(13, 148, 136, 0.12)'
    },
    social: {
      accent: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
      glow: 'rgba(244, 63, 94, 0.25)',
      tagText: '#fecdd3',
      tagBg: 'rgba(244, 63, 94, 0.12)'
    },
    humanities: {
      accent: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      glow: 'rgba(245, 158, 11, 0.25)',
      tagText: '#fde68a',
      tagBg: 'rgba(245, 158, 11, 0.12)'
    },
    capstone: {
      accent: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      glow: 'rgba(139, 92, 246, 0.25)',
      tagText: '#ddd6fe',
      tagBg: 'rgba(139, 92, 246, 0.12)'
    }
  };
  const config = configs[sectionId] || configs.engineering;
  return {
    '--track-accent-color': config.accent,
    '--track-gradient': config.gradient,
    '--track-glow-color': config.glow,
    '--track-tag-text': config.tagText,
    '--track-tag-bg': config.tagBg
  };
}

function tagStyle(sectionId) {
  return {
    foundation: 'bg-slate-50 text-slate-500 border border-slate-100/80 hover:bg-slate-100',
    science: 'bg-slate-50 text-slate-600 border border-slate-100/80 hover:bg-slate-100',
    engineering: 'bg-teal-50/50 text-teal-700 border border-teal-100/50 hover:bg-teal-50',
    social: 'bg-slate-50 text-slate-600 border border-slate-100/80 hover:bg-slate-100',
    humanities: 'bg-slate-50 text-slate-600 border border-slate-100/80 hover:bg-slate-100',
    capstone: 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
  }[sectionId] || 'bg-teal-50/50 text-teal-700 border border-teal-100/50 hover:bg-teal-50';
}

function openCourseWithStep(courseId, stepId) {
  router.push({
    path: `/courses/${courseId}`,
    query: {
      entry: stepId
    }
  });
}

function stepActionLabel(step) {
  return {
    guide: '查看导学',
    lessons: '浏览课时',
    materials: '查看讲义 / 代码',
    practice: '进入实践'
  }[step] || '进入课程';
}

function stepActionIcon(step) {
  return {
    guide: 'fa-compass',
    lessons: 'fa-layer-group',
    materials: 'fa-folder-open',
    practice: 'fa-screwdriver-wrench'
  }[step] || 'fa-folder-open';
}

function scrollToCourseList() {
  nextTick(() => {
    courseListRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function setActiveStep(step, { scroll = false } = {}) {
  activeStep.value = resolveStep(step);
  router.replace({
    query: {
      ...route.query,
      step: activeStep.value
    }
  }).catch(() => {});
  if (scroll) scrollToCourseList();
}

function setActiveFilter(direction, { scroll = false } = {}) {
  activeFilter.value = displayCourseFilters.some(item => item.id === direction) ? direction : 'all';
  const query = { ...route.query };
  if (activeFilter.value === 'all') delete query.direction;
  else query.direction = activeFilter.value;
  router.replace({ query }).catch(() => {});
  if (scroll) scrollToCourseList();
}

function resetCourseSearch() {
  searchTerm.value = '';
  setActiveFilter('all');
}

function openCourse(courseId) {
  router.push({
    path: `/courses/${courseId}`,
    query: {
      entry: activeStep.value
    }
  });
}

async function loadCourses() {
  loading.value = true;
  error.value = '';
  try {
    const response = await apiFetch('/courses');
    const data = await readJsonResponse(response, 'courses');
    if (!response.ok) throw new Error(data?.error || '课程目录加载失败');
    courses.value = data.courses || [];
  } catch (err) {
    if (err.message === 'courses_returned_html') {
      error.value = '课程接口返回了页面内容而不是 JSON。请确认后端服务运行在 http://localhost:8090。';
    } else {
      error.value = err.message || '课程目录加载失败';
    }
    courses.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  const direction = String(route.query.direction || '');
  if (displayCourseFilters.some(item => item.id === direction)) {
    activeFilter.value = direction;
  }
  searchTerm.value = String(route.query.q || '');
  await loadCourses();
});

watch(() => route.query.step, value => {
  activeStep.value = resolveStep(value);
}, { immediate: true });

watch(() => route.query.q, value => {
  const next = String(value || '');
  if (next !== searchTerm.value) searchTerm.value = next;
});

watch(() => route.query.direction, value => {
  const next = String(value || '');
  if (displayCourseFilters.some(item => item.id === next)) activeFilter.value = next;
  else activeFilter.value = 'all';
});

watch(searchTerm, value => {
  const query = { ...route.query };
  const q = value.trim();
  if (q) query.q = q;
  else delete query.q;
  router.replace({ query }).catch(() => {});
});
</script>

<style scoped>
.downloads-page {
  background: #f8fafc;
  min-height: 100dvh;
}

.public-index-content {
  width: min(1320px, calc(100vw - 40px));
  margin: 0 auto;
}

.course-section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.course-section-heading p {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--color-brand-accent);
  font-size: 0.66rem;
  font-weight: 900;
  text-transform: uppercase;
}

.course-section-heading h2 {
  margin: 4px 0 0;
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 900;
  line-height: 1.08;
}

.course-section-heading span {
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 800;
}

.scroll-anchor {
  scroll-margin-top: 112px;
}

.course-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  padding-inline: 4px;
}

@media (max-width: 860px) {
  .course-section-heading {
    align-items: start;
    flex-direction: column;
  }

  .course-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .public-index-content {
    width: min(1320px, calc(100vw - 22px));
  }

  .course-list {
    grid-template-columns: 1fr;
    padding-inline: 0;
  }
}

.grid-pattern {
  background-image: none;
}

.course-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 460px;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background: #090d16;
  color: inherit;
  text-align: left;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  transition: border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease;
}

.course-card:hover {
  border-color: var(--track-accent-color) !important;
  box-shadow: 0 20px 40px -10px var(--track-glow-color), 0 4px 28px rgba(0, 0, 0, 0.35);
  transform: translateY(-4px);
}

.course-card__media {
  position: relative;
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0f172a;
}

.course-card__media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(9, 13, 22, 0.1) 0%, rgba(9, 13, 22, 0.4) 100%);
  transition: background 220ms ease;
}

.course-card:hover .course-card__media::after {
  background: linear-gradient(180deg, rgba(9, 13, 22, 0.2) 0%, rgba(9, 13, 22, 0.5) 100%);
}

.course-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.01);
  transition: transform 260ms cubic-bezier(0.25, 0.8, 0.25, 1);
}

.course-card:hover .course-card__image {
  transform: scale(1.06);
}

.course-card__image--svg {
  width: 65%;
  height: 65%;
  object-fit: contain;
  transform: scale(1);
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
}

.course-card:hover .course-card__image--svg {
  transform: scale(1.05);
}

.course-card__top {
  position: absolute;
  z-index: 2;
  top: 16px;
  inset-inline: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  pointer-events: none;
}

.course-card__top span {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(15, 23, 42, 0.65);
  color: #fff;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.course-card__top span:first-child {
  background: var(--track-gradient);
  border: none;
  color: #fff;
  font-weight: 900;
  box-shadow: 0 4px 10px var(--track-glow-color);
}

.course-card__content {
  position: relative;
  flex-grow: 1;
  display: grid;
  gap: 14px;
  padding: 20px 24px 16px;
  background: #0c111d;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: #fff;
  transition: background-color 220ms ease;
}

.course-card:hover .course-card__content {
  background: #0f1626;
}

.course-card__summary {
  min-height: 0;
}

.course-card__content h3 {
  margin: 0;
  color: #fff;
  font-size: 1.25rem;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: 0.02em;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 220ms ease;
}

.course-card:hover .course-card__content h3 {
  color: var(--track-accent-color);
}

.course-card__content p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.5;
  min-height: 36px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-card__facts,
.course-card__details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.course-card__facts span,
.course-card__details span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  max-width: 100%;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 600;
  line-height: 1.3;
  transition: all 220ms ease;
}

.course-card__facts span {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

.course-card:hover .course-card__facts span {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.course-card__details span {
  background: var(--track-tag-bg);
  border: 1px solid rgba(255, 255, 255, 0.02);
  color: var(--track-tag-text);
  font-weight: 700;
}

.course-card:hover .course-card__details span {
  filter: brightness(1.2);
}

.course-card__action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.8rem;
  font-weight: 700;
  transition: color 220ms ease, border-top-color 220ms ease;
}

.course-card:hover .course-card__action {
  color: #fff;
  border-top-color: rgba(255, 255, 255, 0.12);
}

.course-card__action .fa-arrow-right {
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), color 220ms ease;
}

.course-card:hover .course-card__action .fa-arrow-right {
  transform: translateX(6px);
  color: var(--track-accent-color);
}

@media (max-width: 640px) {
  .course-card {
    min-height: 350px;
  }

  .course-card__content {
    padding: 24px;
  }
}
</style>

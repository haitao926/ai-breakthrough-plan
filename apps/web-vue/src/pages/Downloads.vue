<template>
  <div class="downloads-page text-gray-800">
    <SiteNav active="downloads" />

    <PublicPageHeader
      eyebrow="Courses"
      title="课程库"
      description="课程、讲义、代码与资料集中在这里。"
      :meta="`${visibleCourseCount} 门内容`"
    />

    <main class="max-w-[1320px] mx-auto px-5 sm:px-6 lg:px-8 py-3 min-h-screen space-y-5">
      <CategorySearchBar
        :meta="`${visibleCourseCount} 门匹配`"
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
            <i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br />
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
                <p>{{ section.label }}</p>
                <h2>{{ section.title }}</h2>
              </div>
              <span>{{ section.desc }}</span>
            </div>

            <div v-if="section.items.length" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="course in section.items"
                :key="course.id"
                class="course-card rounded-2xl overflow-hidden cursor-pointer group"
                :class="`course-card--${section.id}`"
                @click="openCourse(course.id)"
              >
                <div class="course-track-label">{{ section.label }} Track</div>
                <div class="h-32 relative" :class="sectionGradient(section.id)">
                  <i class="fas absolute -bottom-4 -right-4 text-8xl text-white opacity-10 transform rotate-12 group-hover:rotate-0 transition duration-500" :class="sectionIcon(section.id)"></i>
                  <div class="absolute bottom-4 left-6 text-white">
                    <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded backdrop-blur">{{ course.courseType || section.label }}</span>
                    <h3 class="text-xl font-bold mt-1">{{ course.title }}</h3>
                  </div>
                </div>
                <div class="p-6">
                  <p class="text-sm text-gray-500 mb-4 h-12 overflow-hidden">{{ course.summary }}</p>
                  <div class="course-entry-grid">
                    <span
                      v-for="step in pathwaySteps"
                      :key="`${course.id}-${step.id}`"
                      class="course-entry-chip"
                      :class="{ 'is-active': activeStep === step.id }"
                    >
                      {{ step.label }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-xs font-bold border-t border-gray-100 pt-4" :class="sectionText(section.id)">
                    <span><i class="fas" :class="stepActionIcon(activeStep)"></i> {{ stepActionLabel(activeStep) }}</span>
                    <i class="fas fa-arrow-right group-hover:translate-x-1 transition"></i>
                  </div>
                </div>
              </div>
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

const pathwaySteps = [
  { id: 'guide', label: '导学', icon: 'fa-graduation-cap' },
  { id: 'lessons', label: '课时', icon: 'fa-layer-group' },
  { id: 'materials', label: '资料', icon: 'fa-folder-open' },
  { id: 'practice', label: '实践', icon: 'fa-screwdriver-wrench' }
];

function resolveStep(value) {
  return ['guide', 'lessons', 'materials', 'practice'].includes(String(value || ''))
    ? String(value)
    : 'guide';
}

const visibleSections = computed(() => {
  const sectionIds = activeFilter.value === 'all'
    ? courseSections.map(section => section.id)
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

const visibleCourseCount = computed(() =>
  visibleSections.value.reduce((total, section) => total + section.items.length, 0)
);

const courseCategoryOptions = computed(() => courseFilters.map(filter => ({
  value: filter.id,
  label: filter.id === 'all' ? '全部课程' : filter.label
})));

const courseSearchPlaceholder = computed(() => {
  const label = courseFilters.find(item => item.id === activeFilter.value)?.label || '课程';
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

function sectionGradient(id) {
  return {
    foundation: 'bg-gradient-to-br from-slate-700 to-slate-900',
    science: 'bg-gradient-to-br from-emerald-600 to-teal-500',
    engineering: 'bg-gradient-to-br from-blue-600 to-cyan-500',
    social: 'bg-gradient-to-br from-purple-600 to-pink-500',
    humanities: 'bg-gradient-to-br from-amber-500 to-orange-400',
    capstone: 'bg-gradient-to-br from-indigo-900 to-blue-900'
  }[id] || 'bg-gradient-to-br from-indigo-600 to-blue-500';
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
    science: 'text-emerald-600',
    engineering: 'text-blue-600',
    social: 'text-purple-600',
    humanities: 'text-amber-600',
    capstone: 'text-indigo-400'
  }[id] || 'text-indigo-600';
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
  activeFilter.value = courseFilters.some(item => item.id === direction) ? direction : 'all';
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
  if (courseFilters.some(item => item.id === direction)) {
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
  if (courseFilters.some(item => item.id === next)) activeFilter.value = next;
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
  background:
    linear-gradient(180deg, rgba(238, 242, 255, 0.9), rgba(248, 250, 252, 0.2) 320px),
    #f8fafc;
  min-height: 100vh;
}

.course-section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  border-left: 5px solid #4f46e5;
  padding-left: 14px;
}

.course-section-heading p {
  margin: 0;
  color: #4f46e5;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.course-section-heading h2 {
  margin: 4px 0 0;
  color: #111827;
  font-size: 1.2rem;
  font-weight: 800;
}

.course-section-heading span {
  color: #64748b;
  font-size: 0.86rem;
  font-weight: 700;
}

.course-card {
  position: relative;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.02);
}

.course-track-label {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  padding: 4px 9px;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  backdrop-filter: blur(12px);
}

.course-card:hover {
  transform: translateY(-4px);
  border-color: rgba(99, 102, 241, 0.25);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.08);
}


.course-entry-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 14px;
}

.course-entry-chip {
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid transparent;
  background: #f8fafc;
  padding: 0 4px;
  color: #64748b;
  font-size: 0.66rem;
  font-weight: 800;
  white-space: nowrap;
}

.course-entry-chip.is-active {
  border-color: #cbd5e1;
  background: #fff;
  color: #0f172a;
}

.course-card--foundation { border-color: #cbd5e1; }
.course-card--science { border-color: #bbf7d0; }
.course-card--engineering { border-color: #bfdbfe; }
.course-card--social { border-color: #fecdd3; }
.course-card--humanities { border-color: #fde68a; }
.course-card--capstone { border-color: #ddd6fe; }

.scroll-anchor {
  scroll-margin-top: 112px;
}

@media (max-width: 860px) {
  .course-section-heading {
    align-items: start;
    flex-direction: column;
  }
}
</style>

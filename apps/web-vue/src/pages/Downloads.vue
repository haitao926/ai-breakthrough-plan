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

            <div v-if="section.items.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="course in section.items"
                :key="course.id"
                class="course-card relative rounded-3xl border border-slate-200/60 bg-white/95 flex flex-col justify-between cursor-pointer group overflow-hidden"
                :style="getTrackStyles(section.id)"
                @click="openCourse(course.id)"
              >
                <!-- Top Cover Visual Area -->
                <div class="relative w-full">
                  <!-- Tag Badge -->
                  <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/90 backdrop-blur-md text-slate-700 shadow-sm border border-slate-100/40 z-20">
                    {{ course.courseType || section.label }}
                  </span>

                  <!-- SVG layout -->
                  <div v-if="isSvg(getCourseVisual(course.id, course.direction).cover)" class="h-36 w-full flex items-center justify-center p-6 relative overflow-hidden grid-pattern" :class="sectionCoverBg(section.id)">
                    <div class="absolute inset-0 bg-white/20 opacity-40 blur-xl pointer-events-none"></div>
                    <img :src="getCourseVisual(course.id, course.direction).cover" class="h-full w-auto object-contain relative z-10 transition-transform duration-500 group-hover:scale-110" />
                  </div>

                  <!-- PNG layout -->
                  <div v-else class="h-36 w-full overflow-hidden relative bg-slate-900">
                    <img :src="getCourseVisual(course.id, course.direction).cover" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                </div>

                <!-- Bottom Content Details -->
                <div class="p-6 flex-1 flex flex-col justify-between">
                  <div class="space-y-4">
                    <!-- Title & Summary -->
                    <div class="space-y-2">
                      <div>
                        <h3 class="text-sm sm:text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-1">
                          {{ course.title }}
                        </h3>
                        <span class="inline-block text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100/60 px-2.5 py-0.5 rounded-full mt-1.5">
                          {{ course.audience || '面向全体' }}
                        </span>
                      </div>
                      
                      <p class="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-2 h-[36px]">
                        {{ course.summary }}
                      </p>

                      <!-- Positioning tags -->
                      <div v-if="course.positioning" class="flex flex-wrap gap-1 pt-1">
                        <span
                          v-for="tag in course.positioning.split('/')"
                          :key="tag"
                          class="px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide"
                          :class="tagStyle(section.id)"
                        >
                          # {{ tag.trim() }}
                        </span>
                      </div>
                    </div>

                    <!-- Step pathways progress grid -->
                    <div class="grid grid-cols-4 gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      <span
                        v-for="step in pathwaySteps"
                        :key="`${course.id}-${step.id}`"
                        class="py-1.5 rounded-lg text-[10px] font-black text-center border transition-all duration-300 flex flex-col items-center justify-center gap-0.5 hover:bg-slate-100 hover:scale-[1.05]"
                        :class="activeStep === step.id 
                          ? [stepActiveBg(section.id), 'shadow-sm font-extrabold'] 
                          : 'bg-transparent text-slate-400 border-transparent hover:text-slate-600'"
                        @click.stop="openCourseWithStep(course.id, step.id)"
                      >
                        <i class="fas text-[9px]" :class="step.icon"></i>
                        {{ step.label }}
                      </span>
                    </div>

                    <!-- Teacher and Pace meta row -->
                    <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-3 border-t border-slate-100/60">
                      <span class="flex items-center gap-1.5">
                        <i class="fas fa-user-edit text-[9px] text-slate-300"></i> 
                        {{ course.teacherName || '导师组' }}
                      </span>
                      <span class="flex items-center gap-1.5 bg-slate-50 px-2.5 py-0.5 rounded-md text-slate-500 border border-slate-100/50">
                        <i class="far fa-clock text-[9px] text-slate-400"></i> 
                        {{ course.pace || '4 课时' }}
                      </span>
                    </div>
                  </div>

                  <!-- Footer Action row -->
                  <div class="flex items-center justify-between text-xs font-bold pt-4 border-t border-slate-100/60 mt-5 transition-colors duration-300 group-hover:text-indigo-600" :class="sectionText(section.id)">
                    <span class="flex items-center gap-1.5">
                      <i class="fas" :class="stepActionIcon(activeStep)"></i> 
                      {{ stepActionLabel(activeStep) }}
                    </span>
                    <i class="fas fa-arrow-right transition-transform duration-300 group-hover:translate-x-1.5"></i>
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

function sectionBorderBg(id) {
  return {
    foundation: 'bg-slate-400/80',
    science: 'bg-emerald-500/80',
    engineering: 'bg-blue-500/80',
    social: 'bg-purple-500/80',
    humanities: 'bg-amber-500/80',
    capstone: 'bg-indigo-600/80'
  }[id] || 'bg-indigo-500/80';
}

function sectionIconBg(id) {
  return {
    foundation: 'bg-slate-100 text-slate-600',
    science: 'bg-emerald-50 text-emerald-600',
    engineering: 'bg-blue-50 text-blue-600',
    social: 'bg-purple-50 text-purple-600',
    humanities: 'bg-amber-50 text-amber-600',
    capstone: 'bg-indigo-50 text-indigo-600'
  }[id] || 'bg-indigo-50 text-indigo-600';
}

function isSvg(path) {
  return String(path || '').toLowerCase().endsWith('.svg');
}

function sectionCoverBg(id) {
  return {
    foundation: 'bg-gradient-to-br from-slate-50 to-slate-100',
    science: 'bg-gradient-to-br from-emerald-50 to-teal-100/50',
    engineering: 'bg-gradient-to-br from-indigo-50/50 to-blue-100/60',
    social: 'bg-gradient-to-br from-rose-50 to-pink-100/50',
    humanities: 'bg-gradient-to-br from-amber-50 to-orange-100/50',
    capstone: 'bg-gradient-to-br from-violet-50 to-indigo-100/50'
  }[id] || 'bg-gradient-to-br from-indigo-50 to-blue-100/50';
}

function stepActiveBg(sectionId) {
  return {
    foundation: 'bg-slate-900 text-white border-transparent',
    science: 'bg-emerald-600 text-white border-transparent',
    engineering: 'bg-indigo-600 text-white border-transparent',
    social: 'bg-rose-500 text-white border-transparent',
    humanities: 'bg-amber-50 text-amber-600 border-transparent',
    capstone: 'bg-violet-600 text-white border-transparent'
  }[sectionId] || 'bg-indigo-600 text-white border-transparent';
}

function getTrackStyles(sectionId) {
  const configs = {
    foundation: {
      color: 'rgba(100, 116, 139, 0.4)',
      shadow1: 'rgba(100, 116, 139, 0.10)',
      shadow2: 'rgba(100, 116, 139, 0.05)'
    },
    science: {
      color: 'rgba(16, 185, 129, 0.4)',
      shadow1: 'rgba(16, 185, 129, 0.10)',
      shadow2: 'rgba(16, 185, 129, 0.05)'
    },
    engineering: {
      color: 'rgba(99, 102, 241, 0.4)',
      shadow1: 'rgba(99, 102, 241, 0.10)',
      shadow2: 'rgba(99, 102, 241, 0.05)'
    },
    social: {
      color: 'rgba(244, 63, 94, 0.4)',
      shadow1: 'rgba(244, 63, 94, 0.10)',
      shadow2: 'rgba(244, 63, 94, 0.05)'
    },
    humanities: {
      color: 'rgba(245, 158, 11, 0.4)',
      shadow1: 'rgba(245, 158, 11, 0.10)',
      shadow2: 'rgba(245, 158, 11, 0.05)'
    },
    capstone: {
      color: 'rgba(139, 92, 246, 0.4)',
      shadow1: 'rgba(139, 92, 246, 0.10)',
      shadow2: 'rgba(139, 92, 246, 0.05)'
    }
  };
  const config = configs[sectionId] || configs.engineering;
  return {
    '--track-hover-color': config.color,
    '--track-hover-shadow-1': config.shadow1,
    '--track-hover-shadow-2': config.shadow2
  };
}

function tagStyle(sectionId) {
  return {
    foundation: 'bg-slate-50 text-slate-500 border border-slate-100/80 hover:bg-slate-100',
    science: 'bg-emerald-50/50 text-emerald-600 border border-emerald-100/50 hover:bg-emerald-50',
    engineering: 'bg-indigo-50/50 text-indigo-600 border border-indigo-100/50 hover:bg-indigo-50',
    social: 'bg-rose-50/50 text-rose-600 border border-rose-100/50 hover:bg-rose-50',
    humanities: 'bg-amber-50/50 text-amber-600 border border-amber-100/50 hover:bg-amber-50',
    capstone: 'bg-violet-50/50 text-violet-600 border border-violet-100/50 hover:bg-violet-50'
  }[sectionId] || 'bg-indigo-50/50 text-indigo-600 border border-indigo-100/50 hover:bg-indigo-50';
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

.scroll-anchor {
  scroll-margin-top: 112px;
}

@media (max-width: 860px) {
  .course-section-heading {
    align-items: start;
    flex-direction: column;
  }
}

.grid-pattern {
  background-size: 16px 16px;
  background-image: 
    linear-gradient(to right, rgba(148, 163, 184, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
}

.course-card {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
}

.course-card:hover {
  transform: translateY(-6px);
  border-color: var(--track-hover-color) !important;
  box-shadow: 
    0 24px 48px -12px var(--track-hover-shadow-1),
    0 8px 16px -8px var(--track-hover-shadow-2) !important;
}
</style>

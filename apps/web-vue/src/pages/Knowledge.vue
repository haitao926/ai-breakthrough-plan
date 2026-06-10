<template>
  <div class="knowledge-page text-slate-800">
    <SiteNav active="knowledge" />

    <PublicPageHeader
      eyebrow="Knowledge"
      title="创新知识库"
      description="以 Crash Course 系列作为入口，把公开视频目录映射到本地知识挑战、课程和项目。"
      :meta="headerMeta"
    />

    <main class="max-w-[1320px] mx-auto px-5 sm:px-6 lg:px-8 py-4 min-h-screen">
      <CategorySearchBar
        :meta="headerMeta"
        :category="filter"
        :search="searchTerm"
        :options="knowledgeCategoryOptions"
        :placeholder="knowledgeSearchPlaceholder"
        :clear-disabled="!searchTerm && filter === 'all'"
        @update:category="applyFilter"
        @update:search="searchTerm = $event"
        @clear="resetKnowledgeSearch"
      />

      <section ref="catalogRef" class="scroll-anchor">
        <div class="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="series in filteredSeries"
            :key="series.id"
            class="knowledge-card group"
            :style="{ '--field-color': series.colorText, '--field-bg': series.colorBg }"
            @click="openSeries(series)"
          >
            <div class="knowledge-cover">
              <img v-if="series.image" :src="series.image" :alt="series.title" class="knowledge-cover-image" />
              <div v-else class="knowledge-cover-fallback" :style="{ backgroundColor: series.colorBg, color: series.colorText }">
                <i class="fas" :class="series.icon"></i>
              </div>
            </div>
            <div class="p-5">
              <div class="knowledge-node">
                <span>Crash Course · {{ categoryLabel(series.category) }}</span>
                <strong>{{ series.episodeText || '系列课程' }}</strong>
              </div>
              <div class="knowledge-icon" :style="{ backgroundColor: series.colorBg, color: series.colorText }">
                <i class="fas" :class="series.icon"></i>
              </div>
              <h3 class="font-bold text-slate-900 mt-4 group-hover:text-indigo-600 transition-colors">{{ series.title }}</h3>
              <p class="text-xs text-slate-400">{{ series.englishName }}</p>
              <p class="text-xs text-slate-500 mt-3 leading-relaxed">{{ seriesCardSummary(series) }}</p>
              <div class="knowledge-card__meta-row">
                <span class="knowledge-task-pill">
                  <i class="fas fa-map-signs"></i> 映射到 {{ series.disciplineName }}
                </span>
                <span v-if="unitFor(series.disciplineId)" class="knowledge-task-pill">
                  <i class="fas fa-play"></i> 可进入挑战
                </span>
                <span v-if="isCompleted(series.disciplineId)" class="knowledge-task-pill is-complete">
                  <i class="fas fa-check"></i> 已完成
                </span>
              </div>
              <span class="inline-flex items-center text-xs font-bold text-indigo-600 mt-4 opacity-80 group-hover:opacity-100 transition-opacity">
                进入探索 <i class="fas fa-arrow-right ml-2 text-[10px]"></i>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section class="knowledge-progress-panel">
        <div class="knowledge-progress-panel__copy">
          <p class="knowledge-kicker">Learning Progress</p>
          <h2>我的知识探索进度</h2>
          <span>积分和榜单应该来自真实完成记录。先进入任意方向，看视频并完成挑战后，这里会生成你的探索动态。</span>
        </div>
        <div class="knowledge-progress-panel__stats">
          <div>
            <span>知识积分</span>
            <strong>{{ progressSummary.totalPoints }}</strong>
          </div>
          <div>
            <span>完成挑战</span>
            <strong>{{ progressSummary.completedUnits }}</strong>
          </div>
        </div>
        <div v-if="leaderboardItems.length" class="knowledge-rank-grid">
          <article
            v-for="(item, index) in leaderboardItems"
            :key="item.id"
            class="knowledge-rank-card"
            :class="{ 'is-top': index === 0 }"
          >
            <div class="knowledge-rank-card__rank">#{{ index + 1 }}</div>
            <div>
              <strong>{{ item.name }}</strong>
              <p>{{ item.action }}</p>
            </div>
            <span>{{ item.points }} 分</span>
          </article>
        </div>
        <div v-else class="knowledge-progress-empty">
          <i class="fas fa-compass"></i>
          <span>还没有探索记录。完成第一个视频挑战后，再显示你的真实排名和积分变化。</span>
        </div>
      </section>
    </main>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import PublicPageHeader from '@/components/PublicPageHeader.vue';
import CategorySearchBar from '@/components/CategorySearchBar.vue';
import { apiFetch, readJsonResponse } from '@/api/client';
import staticLearningUnits from '@/data/knowledgeLearningUnits.json';
import staticCrashCourseSeries from '@/data/crashCourseSeries.json';

const route = useRoute();
const router = useRouter();
const filter = ref('all');
const searchTerm = ref('');
const fieldsData = ref([]);
const learningUnits = ref([]);
const crashCourseSeries = ref([]);
const progress = ref({});
const catalogRef = ref(null);
const progressKey = 'kbLearningProgress:v1';

const palette = {
  science: { bg: '#eff6ff', text: '#2563eb', icon: 'fa-flask' },
  engineering: { bg: '#eef2ff', text: '#4f46e5', icon: 'fa-microchip' },
  social: { bg: '#ecfeff', text: '#0891b2', icon: 'fa-users' },
  humanities: { bg: '#fff7ed', text: '#ea580c', icon: 'fa-feather-pointed' },
  all: { bg: '#f3f4f6', text: '#4b5563', icon: 'fa-book' }
};

function categoryKey(field) {
  if (!field) return 'all';
  const c = String(field.cat || '').toLowerCase();
  if (c === 'science') return 'science';
  if (c === 'engineering' || c === 'stem') return 'engineering';
  if (c === 'social') return 'social';
  if (c === 'humanities') return 'humanities';
  const id = String(field.id || '').toLowerCase();
  if (['env', 'physics', 'math', 'bio', 'medicine'].includes(id)) return 'science';
  if (['tech', 'cs', 'ai', 'robotics', 'materials', 'hci'].includes(id)) return 'engineering';
  if (['soc', 'psych', 'econ', 'edu', 'public_health', 'comm'].includes(id)) return 'social';
  return 'humanities';
}

function categoryLabel(key) {
  return {
    all: '全部',
    science: '理科',
    engineering: '工科',
    social: '社科',
    humanities: '人文'
  }[key] || key;
}

function compactDefinition(value) {
  const text = String(value || '').trim();
  if (!text) return '这个方向主要研究真实问题背后的学科逻辑。';
  return text.length > 46 ? `${text.slice(0, 46)}...` : text;
}

const normalizedFields = computed(() =>
  fieldsData.value.map(field => {
    const category = categoryKey(field);
    return {
      ...field,
      colorBg: palette[category]?.bg || palette.all.bg,
      colorText: palette[category]?.text || palette.all.text,
      icon: field.icon || palette[category]?.icon || palette.all.icon
    };
  })
);

const fieldById = computed(() => {
  return normalizedFields.value.reduce((map, field) => {
    map.set(String(field.id || ''), field);
    return map;
  }, new Map());
});

const normalizedSeries = computed(() =>
  crashCourseSeries.value.map(series => {
    const mappedField = fieldById.value.get(String(series.disciplineId || '')) || {};
    const category = series.category || categoryKey(mappedField);
    return {
      ...series,
      category,
      disciplineName: mappedField.name || '创新知识方向',
      disciplineTagline: mappedField.tagline || mappedField.definition || '',
      colorBg: palette[category]?.bg || palette.all.bg,
      colorText: palette[category]?.text || palette.all.text,
      icon: mappedField.icon || palette[category]?.icon || palette.all.icon
    };
  })
);

const progressSummary = computed(() => {
  const profile = progress.value?._profile || {};
  const completedIds = Object.entries(progress.value || {})
    .filter(([key, value]) => key !== '_profile' && value?.completed)
    .map(([key]) => key);
  const totalPoints = Number(profile.totalPoints || 0)
    || completedIds.reduce((sum, id) => sum + Number(progress.value[id]?.points || 0), 0);
  return {
    totalPoints,
    completedUnits: Number(profile.completedUnits || completedIds.length),
    streakDays: Number(profile.streakDays || 0)
  };
});

const leaderboardItems = computed(() => {
  return normalizedFields.value
    .filter(field => isCompleted(field.id))
    .map(field => ({
      id: `me-${field.id}`,
      name: '我的探索',
      action: `完成 ${field.name} 挑战`,
      points: Number(progress.value[field.id]?.points || unitFor(field.id)?.points || 0)
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);
});

const filteredSeries = computed(() => {
  return normalizedSeries.value
    .filter(series => filter.value === 'all' || series.category === filter.value)
    .filter(matchesSeriesSearch);
});

const headerMeta = computed(() => (
  filter.value === 'all'
    ? `${normalizedSeries.value.length} 个 Crash Course 系列`
    : `${categoryLabel(filter.value)} · ${filteredSeries.value.length} 个系列`
));

const knowledgeCategoryOptions = [
  { value: 'all', label: '全部学科' },
  { value: 'science', label: '理科' },
  { value: 'engineering', label: '工科' },
  { value: 'social', label: '社科' },
  { value: 'humanities', label: '人文' }
];

const knowledgeSearchPlaceholder = computed(() => {
  const label = categoryLabel(filter.value);
  return filter.value === 'all'
    ? '搜索 Crash Course 系列、学科或关键词'
    : `在${label}视角中搜索 Crash Course 系列`;
});

function openSeries(series) {
  router.push({
    path: `/knowledge/${encodeURIComponent(series.disciplineId)}`,
    query: { filter: series.category, series: series.id }
  }).catch(() => {});
}

function scrollToCatalog() {
  nextTick(() => {
    catalogRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function applyFilter(key, { scroll = false } = {}) {
  filter.value = key;
  const query = { ...route.query };
  if (key === 'all') delete query.filter;
  else query.filter = key;
  router.replace({ query }).catch(() => {});
  if (scroll) scrollToCatalog();
}

function seriesCardSummary(series) {
  const tagline = String(series.disciplineTagline || '').trim();
  if (tagline) return `从 ${series.title} 进入 ${series.disciplineName}：${compactDefinition(tagline)}`;
  return `从 ${series.title} 进入 ${series.disciplineName}，再完成视频挑战、答题和项目探索。`;
}

function matchesSeriesSearch(series) {
  const keyword = searchTerm.value.trim().toLowerCase();
  if (!keyword) return true;
  return [
    series.title,
    series.englishName,
    series.episodeText,
    series.disciplineName,
    series.disciplineTagline
  ].filter(Boolean).join(' ').toLowerCase().includes(keyword);
}

function resetKnowledgeSearch() {
  searchTerm.value = '';
  applyFilter('all');
}

function syncFromRoute() {
  const nextFilter = ['all', 'science', 'engineering', 'social', 'humanities'].includes(String(route.query.filter || ''))
    ? String(route.query.filter)
    : 'all';

  filter.value = nextFilter;
}

function unitFor(fieldId) {
  return learningUnits.value.find(item => String(item.disciplineId || '') === String(fieldId)) || null;
}

function isCompleted(fieldId) {
  return Boolean(progress.value?.[fieldId]?.completed);
}

function loadProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(progressKey) || '{}');
    progress.value = parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    progress.value = {};
  }
}

watch([() => route.query.filter], () => {
  syncFromRoute();
}, { immediate: true });

watch(() => route.query.q, value => {
  const next = String(value || '');
  if (next !== searchTerm.value) searchTerm.value = next;
});

watch(searchTerm, value => {
  const query = { ...route.query };
  const q = value.trim();
  if (q) query.q = q;
  else delete query.q;
  router.replace({ query }).catch(() => {});
});

onMounted(async () => {
  try {
    searchTerm.value = String(route.query.q || '');
    loadProgress();
    const [disciplinesRes, unitsRes, seriesRes] = await Promise.all([
      apiFetch('/knowledge/disciplines'),
      apiFetch('/knowledge/learning-units'),
      apiFetch('/knowledge/crash-course-series')
    ]);
    const disciplinesData = await readJsonResponse(disciplinesRes, 'knowledge_disciplines');
    const unitsData = await readJsonResponse(unitsRes, 'knowledge_learning_units');
    const seriesData = await readJsonResponse(seriesRes, 'knowledge_crash_course_series');
    if (!disciplinesRes.ok) throw new Error(disciplinesData?.error || 'knowledge_disciplines_failed');
    fieldsData.value = disciplinesData.disciplines || [];
    learningUnits.value = unitsRes.ok ? (unitsData.learningUnits || []) : staticLearningUnits;
    crashCourseSeries.value = seriesRes.ok ? (seriesData.series || []) : staticCrashCourseSeries;

    const focusId = String(route.query.focus || '');
    if (focusId) {
      router.replace({
        path: `/knowledge/${encodeURIComponent(focusId)}`,
        query: route.query.filter ? { filter: route.query.filter } : {}
      }).catch(() => {});
    }
  } catch (err) {
    console.error(err);
    fieldsData.value = [];
  }
});
</script>

<style scoped>
.knowledge-page {
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.025) 1px, transparent 1px),
    linear-gradient(180deg, rgba(15, 23, 42, 0.025) 1px, transparent 1px),
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.08), transparent 30%),
    #f8fafc;
  background-size: 42px 42px, 42px 42px, 100% 100%, 100% 100%;
  min-height: 100vh;
}

.knowledge-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.02);
}

.knowledge-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--field-color);
  opacity: 0.75;
}

.knowledge-card:hover {
  border-color: var(--field-color);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.08);
  transform: translateY(-4px);
}

.knowledge-progress-panel {
  margin-top: 28px;
  border: 1px solid rgba(255, 255, 255, 0.66);
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(15, 23, 42, 0.055), transparent 36%),
    rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(10px);
  padding: 18px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.025);
}

.knowledge-progress-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
}

.knowledge-progress-panel__copy h2 {
  margin: 7px 0 0;
  color: #0f172a;
  font-size: 1.12rem;
  font-weight: 900;
  letter-spacing: -0.01em;
}

.knowledge-progress-panel__copy span {
  display: block;
  margin-top: 6px;
  max-width: 680px;
  color: #64748b;
  font-size: 0.86rem;
  line-height: 1.6;
}

.knowledge-progress-panel__stats {
  display: flex;
  gap: 10px;
}

.knowledge-kicker {
  margin: 0;
  color: #4f46e5;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.knowledge-progress-panel__stats > div {
  min-width: 104px;
  border: 1px solid #c7d2fe;
  border-radius: 18px;
  background: linear-gradient(135deg, #eef2ff, #ffffff);
  padding: 12px;
  text-align: center;
}

.knowledge-progress-panel__stats span {
  margin: 0;
  color: #4f46e5;
  font-size: 0.72rem;
  font-weight: 900;
}

.knowledge-progress-panel__stats strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
  font-size: 1.55rem;
  font-weight: 950;
  line-height: 1;
}

.knowledge-rank-grid {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.knowledge-rank-card {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid #f1f5f9;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  padding: 14px;
}

.knowledge-rank-card.is-top {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb, #ffffff);
}

.knowledge-rank-card__rank {
  display: grid;
  place-items: center;
  height: 32px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 0.78rem;
  font-weight: 900;
}

.knowledge-rank-card strong {
  display: block;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 900;
}

.knowledge-rank-card p {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 0.76rem;
}

.knowledge-rank-card > span {
  color: #0f172a;
  font-size: 0.82rem;
  font-weight: 900;
}

.knowledge-progress-empty {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.72);
  color: #64748b;
  padding: 12px 14px;
  font-size: 0.84rem;
  font-weight: 700;
}

.knowledge-progress-empty i {
  color: #4f46e5;
}

.knowledge-cover {
  height: 142px;
  background:
    linear-gradient(135deg, var(--field-bg), #ffffff),
    repeating-linear-gradient(0deg, rgba(15, 23, 42, 0.05) 0 1px, transparent 1px 14px);
  overflow: hidden;
}

.knowledge-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.knowledge-cover-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.knowledge-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.knowledge-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  border-bottom: 1px dashed #dbeafe;
  padding-bottom: 10px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
}

.knowledge-node strong {
  color: var(--field-color);
  font-weight: 800;
}

.knowledge-card__meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.knowledge-task-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
  padding: 6px 9px;
  font-size: 0.68rem;
  font-weight: 900;
}

.knowledge-task-pill.is-complete {
  background: #dcfce7;
  color: #16a34a;
}

.scroll-anchor {
  scroll-margin-top: 110px;
}

@media (max-width: 980px) {
  .knowledge-progress-panel,
  .knowledge-rank-grid {
    grid-template-columns: 1fr;
  }
}

</style>

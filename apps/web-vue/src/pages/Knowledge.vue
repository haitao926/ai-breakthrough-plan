<template>
  <div class="knowledge-page text-slate-800">
    <SiteNav active="knowledge" />

    <main class="knowledge-shell">
      <section class="knowledge-control-panel">
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
      </section>

      <section class="knowledge-progress-panel">
        <div class="knowledge-progress-panel__copy">
          <p class="knowledge-kicker">学习进度</p>
          <h2>知识观测榜单</h2>
          <span>榜单只使用你的真实本地完成记录。先进入任意方向，看视频并完成挑战后，这里会生成积分和探索排名。</span>
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
          <i class="fas fa-location-crosshairs"></i>
          <span>还没有探索记录。完成第一个视频挑战后，再显示你的真实排名和积分变化。</span>
        </div>
      </section>

      <section>
        <div class="knowledge-catalog-heading">
          <div>
            <p class="knowledge-kicker">系列目录</p>
            <h2>选择一个系列进入知识任务</h2>
          </div>
          <span>{{ filteredSeries.length }} 个可见系列</span>
        </div>

        <div class="knowledge-grid">
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
              <h3 class="knowledge-card__title">{{ series.title }}</h3>
              <p class="text-xs text-slate-400">{{ series.englishName }}</p>
              <p class="text-xs text-slate-500 mt-3 leading-relaxed">{{ seriesCardSummary(series) }}</p>
              <span class="knowledge-card__action">
                进入探索 <i class="fas fa-arrow-right ml-2 text-[10px]"></i>
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
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
const progressKey = 'kbLearningProgress:v1';

const palette = {
  science: { bg: '#e8f5ec', text: '#207a54', icon: 'fa-flask' },
  engineering: { bg: '#edf3ee', text: '#3f6f5d', icon: 'fa-microchip' },
  social: { bg: '#eef4ea', text: '#6b7f2a', icon: 'fa-users' },
  humanities: { bg: '#f7f0e4', text: '#9a5b2f', icon: 'fa-feather-pointed' },
  all: { bg: '#eef2e8', text: '#4d644f', icon: 'fa-book' }
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
  const unit = unitFor(series.disciplineId);
  const videoKey = firstVideoKeyForUnit(unit);
  const query = { filter: series.category };
  if (videoKey) query.video = videoKey;
  router.push({
    path: `/knowledge/${encodeURIComponent(series.disciplineId)}`,
    query
  }).catch(() => {});
}

function firstVideoKeyForUnit(unit) {
  const recommended = String(unit?.series?.recommendedVideoId || '').trim();
  if (recommended) return recommended;
  const source = unit?.source || {};
  const sourceKey = String(source.id || source.bvid || '').trim();
  if (sourceKey) return sourceKey;
  return extractBvid(source.url);
}

function extractBvid(url) {
  const match = String(url || '').match(/\/video\/(BV[a-zA-Z0-9]+)/);
  return match?.[1] || '';
}

function applyFilter(key, { scroll = false } = {}) {
  filter.value = key;
  const query = { ...route.query };
  if (key === 'all') delete query.filter;
  else query.filter = key;
  router.replace({ query }).catch(() => {});
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
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
  --map-ink: #1f2f24;
  --map-muted: #65725f;
  --map-line: rgba(77, 100, 79, 0.16);
  --map-green: #4d644f;
  --map-earth: #9a6b3e;
  background:
    radial-gradient(circle at 12% 6%, rgba(77, 100, 79, 0.16), transparent 28%),
    radial-gradient(circle at 88% 16%, rgba(154, 107, 62, 0.14), transparent 28%),
    linear-gradient(115deg, rgba(64, 88, 58, 0.04) 25%, transparent 25%) 0 0 / 52px 52px,
    linear-gradient(65deg, rgba(64, 88, 58, 0.035) 25%, transparent 25%) 0 0 / 52px 52px,
    linear-gradient(rgba(77, 100, 79, 0.04) 1px, transparent 1px) 0 0 / 28px 28px,
    linear-gradient(90deg, rgba(77, 100, 79, 0.035) 1px, transparent 1px) 0 0 / 28px 28px,
    #f5f7ef;
  min-height: 100vh;
}

.knowledge-control-panel,
.knowledge-progress-panel {
  border: 1px solid rgba(77, 100, 79, 0.16);
  background: rgba(255, 253, 246, 0.78);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 45px rgba(51, 67, 45, 0.07);
}

.knowledge-kicker {
  margin: 0;
  color: var(--map-green);
  font-size: 0.72rem;
  font-weight: 950;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.knowledge-shell {
  max-width: 1320px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 32px 20px 56px;
}

.knowledge-control-panel {
  border-radius: 24px;
  padding: 12px;
}

.knowledge-control-panel :deep(.category-search-bar) {
  margin: 0;
}

.knowledge-catalog-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin: 28px 0 16px;
}

.knowledge-catalog-heading h2 {
  margin: 6px 0 0;
  color: var(--map-ink);
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 950;
  letter-spacing: -0.04em;
}

.knowledge-catalog-heading > span {
  flex: 0 0 auto;
  border: 1px solid rgba(77, 100, 79, 0.16);
  border-radius: 999px;
  background: rgba(255, 253, 246, 0.75);
  color: #65725f;
  padding: 9px 12px;
  font-size: 0.8rem;
  font-weight: 900;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
}

.knowledge-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(77, 100, 79, 0.14);
  border-radius: 24px;
  background:
    radial-gradient(circle at 18% 0%, var(--field-bg), transparent 42%),
    rgba(255, 253, 246, 0.82);
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 12px 32px rgba(51, 67, 45, 0.055);
}

.knowledge-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(rgba(77, 100, 79, 0.06) 1px, transparent 1px) 0 0 / 20px 20px,
    linear-gradient(90deg, rgba(77, 100, 79, 0.045) 1px, transparent 1px) 0 0 / 20px 20px;
  opacity: 0;
  transition: opacity 0.28s ease;
}

.knowledge-card::after {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: var(--field-color);
  opacity: 0.75;
}

.knowledge-card:hover {
  border-color: var(--field-color);
  box-shadow: 0 22px 46px rgba(51, 67, 45, 0.11);
  transform: translateY(-4px);
}

.knowledge-card:hover::before {
  opacity: 1;
}

.knowledge-progress-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  margin-top: 18px;
  border-radius: 26px;
  background:
    radial-gradient(circle at top left, rgba(77, 100, 79, 0.14), transparent 36%),
    rgba(255, 253, 246, 0.78);
  padding: 18px;
}

.knowledge-progress-panel__copy h2 {
  margin: 7px 0 0;
  color: var(--map-ink);
  font-size: 1.35rem;
  font-weight: 950;
  letter-spacing: -0.025em;
}

.knowledge-progress-panel__copy span {
  display: block;
  margin-top: 6px;
  max-width: 680px;
  color: var(--map-muted);
  font-size: 0.86rem;
  line-height: 1.6;
}

.knowledge-progress-panel__stats {
  display: flex;
  gap: 10px;
}

.knowledge-progress-panel__stats > div {
  min-width: 104px;
  border: 1px solid rgba(77, 100, 79, 0.16);
  border-radius: 18px;
  background: linear-gradient(135deg, #e8f5ec, #fffdf6);
  padding: 12px;
  text-align: center;
}

.knowledge-progress-panel__stats span {
  margin: 0;
  color: var(--map-green);
  font-size: 0.72rem;
  font-weight: 900;
}

.knowledge-progress-panel__stats strong {
  display: block;
  margin-top: 4px;
  color: var(--map-ink);
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
  border: 1px solid rgba(77, 100, 79, 0.12);
  border-radius: 18px;
  background: rgba(255, 253, 246, 0.82);
  padding: 14px;
}

.knowledge-rank-card.is-top {
  border-color: #9a6b3e;
  background: linear-gradient(135deg, #f7f0e4, #fffdf6);
}

.knowledge-rank-card__rank {
  display: grid;
  place-items: center;
  height: 32px;
  border-radius: 999px;
  background: #e8f5ec;
  color: var(--map-green);
  font-size: 0.78rem;
  font-weight: 900;
}

.knowledge-rank-card strong {
  display: block;
  color: var(--map-ink);
  font-size: 0.88rem;
  font-weight: 900;
}

.knowledge-rank-card p {
  margin: 2px 0 0;
  color: var(--map-muted);
  font-size: 0.76rem;
}

.knowledge-rank-card > span {
  color: var(--map-ink);
  font-size: 0.82rem;
  font-weight: 900;
}

.knowledge-progress-empty {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px dashed rgba(77, 100, 79, 0.24);
  border-radius: 16px;
  background: rgba(255, 253, 246, 0.62);
  color: var(--map-muted);
  padding: 12px 14px;
  font-size: 0.84rem;
  font-weight: 700;
}

.knowledge-progress-empty i {
  color: var(--map-green);
}

.knowledge-cover {
  height: 142px;
  background:
    linear-gradient(135deg, var(--field-bg), #ffffff),
    repeating-linear-gradient(0deg, rgba(77, 100, 79, 0.08) 0 1px, transparent 1px 14px);
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

.knowledge-card__title {
  margin-top: 16px;
  color: var(--map-ink);
  font-weight: 950;
  letter-spacing: -0.01em;
  transition: color 0.2s ease;
}

.knowledge-card:hover .knowledge-card__title {
  color: var(--field-color);
}

.knowledge-card__action {
  display: inline-flex;
  align-items: center;
  margin-top: 16px;
  color: var(--field-color);
  font-size: 0.78rem;
  font-weight: 950;
  opacity: 0.84;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.knowledge-card:hover .knowledge-card__action {
  opacity: 1;
  transform: translateX(2px);
}

/* Compatibility guard for old utility classes in card content. */
.knowledge-card h3 {
  color: var(--map-ink) !important;
  transition: color 0.2s ease;
}

.knowledge-card:hover h3 {
  color: var(--field-color) !important;
}

.knowledge-card p {
  color: var(--map-muted) !important;
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
  border-bottom: 1px dashed rgba(77, 100, 79, 0.2);
  padding-bottom: 10px;
  color: var(--map-muted);
  font-size: 0.72rem;
  font-weight: 800;
}

.knowledge-node strong {
  color: var(--field-color);
  font-weight: 800;
}

@media (max-width: 980px) {
  .knowledge-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .knowledge-progress-panel,
  .knowledge-rank-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .knowledge-grid,
  .knowledge-catalog-heading {
    grid-template-columns: 1fr;
  }

  .knowledge-shell {
    padding: 20px 14px 42px;
  }

  .knowledge-catalog-heading {
    display: grid;
    align-items: start;
  }

  .knowledge-progress-panel__stats {
    width: 100%;
  }

  .knowledge-progress-panel__stats > div {
    flex: 1;
  }
}

</style>

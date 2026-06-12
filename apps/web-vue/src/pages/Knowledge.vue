<template>
  <div class="knowledge-page text-slate-800">
    <SiteNav active="knowledge" />

    <PublicPageHeader
      title="创新知识库"
      description="按学科方向整理 Crash Course、研究问题与知识挑战，让学生从兴趣进入持续探索。"
    />

    <main class="public-index-content min-h-dvh pb-12">
      <CategorySearchBar
        :category="filter"
        :search="searchTerm"
        :options="knowledgeCategoryOptions"
        :placeholder="knowledgeSearchPlaceholder"
        :clear-disabled="!searchTerm && filter === 'all'"
        @update:category="applyFilter"
        @update:search="searchTerm = $event"
        @clear="resetKnowledgeSearch"
      />

      <section>
        <div class="knowledge-catalog-heading">
          <div>
            <p class="knowledge-kicker">全部方向</p>
            <h2>{{ catalogHeadingTitle }}</h2>
          </div>
          <div class="knowledge-catalog-actions">
            <RouterLink class="knowledge-leaderboard-entry" to="/knowledge/leaderboard">
              <i class="fas fa-ranking-star"></i>
              <span>我的知识榜</span>
            </RouterLink>
            <span>{{ filteredSeries.length }} 个可见系列</span>
          </div>
        </div>

        <div v-if="filteredSeries.length" class="knowledge-grid">
          <RouterLink
            v-for="series in filteredSeries"
            :key="series.id"
            class="knowledge-card group"
            :class="{ 'is-featured': isFeaturedSeries(series) }"
            :style="{ '--field-color': series.colorText, '--field-bg': series.colorBg }"
            :to="seriesTarget(series)"
          >
            <div class="knowledge-cover">
              <img v-if="series.image" :src="series.image" :alt="series.title" class="knowledge-cover-image" />
              <div v-else class="knowledge-cover-fallback" :style="{ backgroundColor: series.colorBg, color: series.colorText }">
                <i class="fas" :class="series.icon"></i>
              </div>
            </div>

            <div class="knowledge-card__body">
              <h3 class="knowledge-card__title">{{ series.title }}</h3>
              <p class="knowledge-card__english">{{ series.englishName }}</p>
              <p class="knowledge-card__summary">{{ seriesCardSummary(series) }}</p>
              <p class="knowledge-card__prompt">{{ seriesPrompt(series) }}</p>
              <span class="knowledge-card__action">
                进入探索 <i class="fas fa-arrow-right"></i>
              </span>
            </div>
          </RouterLink>
        </div>

        <div v-else class="knowledge-empty-state">
          <p class="knowledge-kicker">No Match</p>
          <h3>没有找到符合条件的探索方向</h3>
          <p>可以先清空筛选条件，或者回到上面的推荐路径重新开始。</p>
          <button type="button" @click="resetKnowledgeSearch">重置筛选</button>
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
import PublicPageHeader from '@/components/PublicPageHeader.vue';
import CategorySearchBar from '@/components/CategorySearchBar.vue';
import { apiFetch, readJsonResponse } from '@/api/client';

const route = useRoute();
const router = useRouter();
const filter = ref('all');
const searchTerm = ref('');
const fieldsData = ref([]);
const learningUnits = ref([]);
const crashCourseSeries = ref([]);

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
  if (['soc', 'psych', 'econ', 'edu', 'public_health', 'comm', 'media'].includes(id)) return 'social';
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

function compactDefinition(value, max = 54) {
  const text = String(value || '').trim();
  if (!text) return '这个方向主要研究真实问题背后的学科逻辑。';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function clampLine(value, max = 28) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
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
      disciplineQuestion: mappedField.research_questions?.[0]?.q || '',
      colorBg: palette[category]?.bg || palette.all.bg,
      colorText: palette[category]?.text || palette.all.text,
      icon: mappedField.icon || palette[category]?.icon || palette.all.icon
    };
  })
);

const filteredSeries = computed(() => {
  return normalizedSeries.value
    .filter(series => filter.value === 'all' || series.category === filter.value)
    .filter(matchesSeriesSearch);
});

const catalogHeadingTitle = computed(() => {
  if (searchTerm.value.trim()) return '搜索结果中的探索方向';
  if (filter.value === 'all') return '全部探索方向';
  return `继续浏览 ${categoryLabel(filter.value)} 视角`;
});

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
    ? '搜索系列、学科或你想研究的问题'
    : `在${label}视角中搜索 Crash Course 系列`;
});

function firstSeriesForDiscipline(disciplineId) {
  return normalizedSeries.value.find(item => String(item.disciplineId || '') === String(disciplineId || '')) || null;
}

function unitFor(fieldId) {
  return learningUnits.value.find(item => String(item.disciplineId || '') === String(fieldId)) || null;
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

function seriesTarget(series) {
  const unit = unitFor(series.disciplineId);
  const videoKey = firstVideoKeyForUnit(unit);
  const query = {};
  if (series.category && series.category !== 'all') query.filter = series.category;
  if (videoKey) query.video = videoKey;
  return {
    path: `/knowledge/${encodeURIComponent(series.disciplineId)}`,
    query
  };
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
  if (tagline) return clampLine(tagline, 26);
  return `从 ${series.disciplineName} 进入探索。`;
}

function seriesPrompt(series) {
  if (series.disciplineQuestion) return clampLine(series.disciplineQuestion, 24);
  return `从真实问题开始。`;
}

function isFeaturedSeries(series) {
  return false;
}

function matchesSeriesSearch(series) {
  const keyword = searchTerm.value.trim().toLowerCase();
  if (!keyword) return true;
  return [
    series.title,
    series.englishName,
    series.episodeText,
    series.disciplineName,
    series.disciplineTagline,
    series.disciplineQuestion
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
    const [disciplinesRes, unitsRes, seriesRes] = await Promise.all([
      apiFetch('/knowledge/disciplines'),
      apiFetch('/knowledge/learning-units'),
      apiFetch('/knowledge/crash-course-series')
    ]);
    const disciplinesData = await readJsonResponse(disciplinesRes, 'knowledge_disciplines');
    const unitsData = await readJsonResponse(unitsRes, 'knowledge_learning_units');
    const seriesData = await readJsonResponse(seriesRes, 'knowledge_crash_course_series');
    if (!disciplinesRes.ok) throw new Error(disciplinesData?.error || 'knowledge_disciplines_failed');
    if (!unitsRes.ok) throw new Error(unitsData?.error || 'knowledge_learning_units_failed');
    if (!seriesRes.ok) throw new Error(seriesData?.error || 'knowledge_crash_course_series_failed');
    fieldsData.value = disciplinesData.disciplines || [];
    learningUnits.value = unitsData.learningUnits || [];
    crashCourseSeries.value = seriesData.series || [];

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
  --map-panel: rgba(255, 253, 246, 0.82);
  --map-panel-strong: rgba(255, 253, 246, 0.92);
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

.public-index-content {
  width: min(1320px, calc(100vw - 40px));
  margin: 0 auto;
}

.knowledge-page :deep(.public-page-header) {
  background: transparent;
  padding-bottom: 1.2rem;
}

.knowledge-page :deep(.public-page-header__title) {
  color: var(--map-ink);
}

.knowledge-page :deep(.public-page-header__description) {
  color: var(--map-muted);
}

.knowledge-kicker {
  margin: 0;
  color: var(--map-green);
  font-size: 0.72rem;
  font-weight: 950;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.knowledge-entry-card,
.knowledge-path-card,
.knowledge-card,
.knowledge-empty-state {
  border: 1px solid rgba(77, 100, 79, 0.16);
  background: var(--map-panel);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 45px rgba(51, 67, 45, 0.07);
}

.knowledge-entry-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
  margin-top: 24px;
}

.knowledge-entry-card {
  border-radius: 28px;
  padding: 22px;
}

.knowledge-entry-card__top h2 {
  margin: 10px 0 10px;
  color: var(--map-ink);
  font-size: clamp(1.35rem, 2vw, 1.8rem);
  font-weight: 940;
  letter-spacing: -0.04em;
}

.knowledge-entry-card__top p:last-child {
  margin: 0;
  color: var(--map-muted);
  line-height: 1.75;
}

.knowledge-entry-picks {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.knowledge-entry-pick {
  display: grid;
  gap: 4px;
  width: 100%;
  border: 1px solid rgba(77, 100, 79, 0.14);
  border-radius: 20px;
  background:
    radial-gradient(circle at 0 0, var(--entry-bg, #eef2e8), transparent 32%),
    rgba(255, 253, 246, 0.92);
  color: var(--map-ink);
  padding: 16px;
  text-align: left;
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.knowledge-entry-pick:hover {
  border-color: var(--entry-color, #4d644f);
  box-shadow: 0 14px 30px rgba(51, 67, 45, 0.08);
  transform: translateY(-1px);
}

.knowledge-entry-pick span {
  color: var(--entry-color, #4d644f);
  font-size: 0.74rem;
  font-weight: 950;
  letter-spacing: 0.04em;
}

.knowledge-entry-pick strong {
  color: var(--map-ink);
  font-size: 1rem;
  font-weight: 930;
}

.knowledge-entry-pick em {
  color: var(--map-muted);
  font-style: normal;
  font-size: 0.8rem;
  line-height: 1.55;
}

.knowledge-featured-section {
  margin-top: 30px;
}

.knowledge-catalog-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.knowledge-catalog-heading h2 {
  margin: 8px 0 8px;
  color: var(--map-ink);
  font-size: clamp(1.55rem, 3vw, 2.35rem);
  font-weight: 960;
  letter-spacing: -0.05em;
}

.knowledge-catalog-heading p:last-child {
  margin: 0;
  color: var(--map-muted);
  line-height: 1.7;
  max-width: 62ch;
}

.knowledge-catalog-heading > span {
  flex: 0 0 auto;
  border: 1px solid rgba(77, 100, 79, 0.16);
  border-radius: 999px;
  background: rgba(255, 253, 246, 0.76);
  color: #65725f;
  padding: 9px 12px;
  font-size: 0.8rem;
  font-weight: 900;
}

.knowledge-catalog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.knowledge-leaderboard-entry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid rgba(77, 100, 79, 0.16);
  border-radius: 999px;
  background: rgba(255, 253, 246, 0.92);
  color: var(--map-ink);
  font-size: 0.82rem;
  font-weight: 920;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.knowledge-leaderboard-entry:hover {
  border-color: rgba(77, 100, 79, 0.3);
  box-shadow: 0 12px 24px rgba(51, 67, 45, 0.08);
  transform: translateY(-1px);
}

.knowledge-leaderboard-entry i {
  color: var(--map-green);
}

.knowledge-path-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
}

.knowledge-path-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 28px;
  text-decoration: none;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease;
}

.knowledge-path-card:hover {
  border-color: var(--field-color);
  box-shadow: 0 24px 48px rgba(51, 67, 45, 0.12);
  transform: translateY(-4px);
}

.knowledge-path-card__cover {
  height: 168px;
  background:
    linear-gradient(135deg, var(--field-bg), #ffffff),
    repeating-linear-gradient(0deg, rgba(77, 100, 79, 0.08) 0 1px, transparent 1px 14px);
  overflow: hidden;
}

.knowledge-path-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.knowledge-path-card__fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--field-color);
  font-size: 2rem;
}

.knowledge-path-card__body {
  display: grid;
  gap: 12px;
  padding: 18px;
}

.knowledge-path-card__body h3 {
  margin: 0;
  color: var(--map-ink);
  font-size: 1.18rem;
  font-weight: 940;
  letter-spacing: -0.03em;
}

.knowledge-path-card__summary {
  margin: 0;
  color: var(--map-muted);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.knowledge-path-card__question {
  margin: 0;
  border-left: 3px solid var(--field-color);
  padding-left: 12px;
  color: var(--map-ink);
  font-size: 0.88rem;
  font-weight: 850;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.knowledge-catalog-heading {
  margin: 24px 0 16px;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 22px;
}

.knowledge-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 24px;
  background:
    radial-gradient(circle at 18% 0%, var(--field-bg), transparent 42%),
    rgba(255, 253, 246, 0.82);
  text-decoration: none;
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

.knowledge-card.is-featured {
  background:
    radial-gradient(circle at 18% 0%, var(--field-bg), transparent 42%),
    linear-gradient(180deg, rgba(255, 253, 246, 0.9), rgba(247, 248, 239, 0.84));
}

.knowledge-card__body {
  display: grid;
  gap: 12px;
  padding: 20px;
}

.knowledge-cover {
  height: 148px;
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
  margin: 0;
  color: var(--map-ink);
  font-size: 1.26rem;
  font-weight: 950;
  letter-spacing: -0.02em;
  transition: color 0.2s ease;
}

.knowledge-card:hover .knowledge-card__title {
  color: var(--field-color);
}

.knowledge-card__english {
  margin: -2px 0 0;
  color: #879088;
  font-size: 0.73rem;
  font-weight: 820;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.knowledge-card__summary,
.knowledge-card__prompt {
  margin: 0;
  color: var(--map-muted);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.knowledge-card__summary {
  -webkit-line-clamp: 2;
}

.knowledge-card__prompt {
  color: var(--map-ink);
  font-size: 0.88rem;
  font-weight: 860;
  -webkit-line-clamp: 2;
}

.knowledge-card__action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  color: var(--field-color);
  font-size: 0.78rem;
  font-weight: 950;
  opacity: 0.9;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.knowledge-card:hover .knowledge-card__action,
.knowledge-path-card:hover .knowledge-card__action {
  opacity: 1;
  transform: translateX(2px);
}

.knowledge-empty-state {
  border-radius: 28px;
  padding: 28px;
}

.knowledge-empty-state h3 {
  margin: 10px 0 8px;
  color: var(--map-ink);
  font-size: 1.4rem;
  font-weight: 940;
}

.knowledge-empty-state p {
  margin: 0;
  color: var(--map-muted);
  line-height: 1.75;
}

.knowledge-empty-state button {
  margin-top: 18px;
  border: 1px solid rgba(77, 100, 79, 0.16);
  border-radius: 999px;
  background: rgba(255, 253, 246, 0.94);
  color: var(--map-ink);
  padding: 11px 16px;
  font-size: 0.82rem;
  font-weight: 900;
}

.knowledge-card:focus-visible,
.knowledge-path-card:focus-visible,
.knowledge-entry-pick:focus-visible,
.knowledge-leaderboard-entry:focus-visible,
.knowledge-empty-state button:focus-visible {
  outline: 3px solid rgba(77, 100, 79, 0.28);
  outline-offset: 3px;
}

@media (max-width: 1180px) {
  .knowledge-entry-grid,
  .knowledge-path-grid,
  .knowledge-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .public-index-content {
    width: min(1320px, calc(100vw - 22px));
  }

  .knowledge-page :deep(.public-page-header) {
    padding-bottom: 1rem;
  }

  .knowledge-entry-grid,
  .knowledge-path-grid,
  .knowledge-grid {
    grid-template-columns: 1fr;
  }

  .knowledge-catalog-heading {
    display: grid;
    align-items: start;
  }

  .knowledge-catalog-actions {
    justify-content: flex-start;
  }

  .knowledge-card__body,
  .knowledge-path-card__body {
    padding: 18px;
  }

}
</style>

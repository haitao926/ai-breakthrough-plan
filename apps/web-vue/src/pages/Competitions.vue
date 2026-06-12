<template>
  <div class="competitions-page">
    <SiteNav active="competitions" />

    <PublicPageHeader
      title="赛事活动"
      description="整理适合学生参与的科创、机器人和 AI 赛事，帮助项目成果找到展示与评审场景。"
    />

    <main class="public-index-content min-h-dvh pb-12">
      <CategorySearchBar
        title="赛事筛选"
        category-label="赛事类别"
        :category="activeCategory"
        :search="keyword"
        :options="competitionCategoryOptions"
        placeholder="搜索赛事名称、方向、主办方或课程衔接"
        :clear-disabled="!keyword && activeCategory === '全部'"
        @update:category="activeCategory = $event"
        @update:search="keyword = $event"
        @clear="resetFilters"
      />

      <section id="competition-list" class="competition-list-section">
        <div class="competitions-section-heading">
          <h2>赛事清单</h2>
        </div>

        <div v-if="filteredCompetitions.length" class="competition-list">
          <RouterLink
            v-for="item in filteredCompetitions"
            :key="item.slug"
            :to="`/competitions/${item.slug}`"
            :class="['competition-list-card', categoryToneClass(getCategory(item))]"
          >
            <div class="competition-list-card__media">
              <img :src="competitionImage(item)" :alt="item.title" />
              <div class="competition-list-card__poster">
                <span>
                  <i :class="getCategoryIcon(getCategory(item))" aria-hidden="true"></i>
                  {{ getCategory(item) }}
                </span>
                <h3>{{ item.title }}</h3>
              </div>
            </div>

            <div class="competition-list-card__top">
              <span :class="['status-badge', statusClass(item.status)]">{{ item.status }}</span>
              <span>{{ item.tier }}</span>
            </div>

            <div class="competition-list-card__body">
              <p>{{ item.fitSummary }}</p>
            </div>

            <div class="competition-list-card__facts">
              <span>
                <i class="fas fa-calendar-days" aria-hidden="true"></i>
                {{ item.dateRange }}
              </span>
              <span>
                <i class="fas fa-book-open" aria-hidden="true"></i>
                {{ courseSummary(item) }}
              </span>
            </div>

            <div class="competition-list-card__action">
              <span>{{ actionLabel(item.status) }}</span>
              <i class="fas fa-arrow-right" aria-hidden="true"></i>
            </div>
          </RouterLink>
        </div>

        <div v-else class="competition-empty-state">
          <i class="fas fa-filter-circle-xmark" aria-hidden="true"></i>
          <h3>没有符合筛选条件的赛事</h3>
          <p>
            放宽状态或方向条件后，再按学生基础缩小候选范围。
          </p>
          <button type="button" @click="resetFilters">
            重置所有条件
          </button>
        </div>
      </section>
    </main>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import PublicPageHeader from '@/components/PublicPageHeader.vue';
import CategorySearchBar from '@/components/CategorySearchBar.vue';
import { fetchCompetitions } from '@/api/portal';
import { competitionImage, getCompetitionCategory } from '@/utils/competitionVisuals';

const competitions = ref([]);
const keyword = ref('');
const activeCategory = ref('全部');

const statusRank = {
  报名中: 5,
  进行中: 4,
  即将开始: 3,
  长期征集: 2
};

const tierRank = {
  白名单赛事: 5,
  上海市赛事: 4,
  区赛: 3,
  校内活动: 2
};

const categoryTabs = [
  { name: '全部', icon: 'fas fa-border-all' },
  { name: '科创项目', icon: 'fas fa-lightbulb' },
  { name: '机器人', icon: 'fas fa-robot' },
  { name: '创客马拉松', icon: 'fas fa-tools' },
  { name: '其他', icon: 'fas fa-cubes' }
];

const competitionCategoryOptions = computed(() =>
  categoryTabs.map(tab => ({
    value: tab.name,
    label: tab.name === '全部' ? '全部赛事' : tab.name
  }))
);

function getCategory(item) {
  return getCompetitionCategory(item);
}

function getCategoryIcon(category) {
  if (category === '科创项目') return 'fas fa-lightbulb';
  if (category === '机器人') return 'fas fa-robot';
  if (category === '创客马拉松') return 'fas fa-tools';
  return 'fas fa-cubes';
}

const filteredCompetitions = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  const items = competitions.value.filter(item => {
    const searchable = [
      item.title,
      item.tagline,
      item.fitSummary,
      item.whyJoin,
      item.prepAdvice,
      item.host,
      item.location,
      ...item.discipline,
      ...item.schoolStage,
      ...(item.relatedCourses || []).map(course => course.title)
    ].join(' ').toLowerCase();

    const matchesKeyword = !query || searchable.includes(query);
    const matchesCategory = activeCategory.value === '全部' || getCategory(item) === activeCategory.value;
    return matchesKeyword && matchesCategory;
  });

  return [...items].sort((a, b) => getMatchScore(b) - getMatchScore(a));
});

function getStatusRank(item) {
  return statusRank[item.status] || 1;
}

function getTierRank(item) {
  return tierRank[item.tier] || 1;
}

function getMatchScore(item) {
  let score = 54;
  score += getStatusRank(item) * 6;
  score += getTierRank(item) * 4;
  score += (item.relatedCourses?.length || 0) * 4;
  if (item.featuredFlags?.includes('home')) score += 5;
  return Math.min(score, 98);
}

function categoryToneClass(category) {
  if (category === '机器人') return 'tone-robot';
  if (category === '创客马拉松') return 'tone-maker';
  if (category === '科创项目') return 'tone-project';
  return 'tone-general';
}

function courseSummary(item) {
  if (!item.relatedCourses?.length) return '自主准备';
  return item.relatedCourses.map(course => course.title).slice(0, 2).join(' / ');
}

function actionLabel(status) {
  if (status === '报名中') return '查看报名路径';
  if (status === '即将开始') return '制定准备计划';
  if (status === '进行中') return '查看参与方式';
  if (status === '长期征集') return '加入候选池';
  return '查看详情';
}

function resetFilters() {
  keyword.value = '';
  activeCategory.value = '全部';
}

function statusClass(status) {
  if (status === '报名中') return 'is-open';
  if (status === '即将开始') return 'is-upcoming';
  if (status === '进行中') return 'is-live';
  return 'is-muted';
}

onMounted(async () => {
  try {
    const items = await fetchCompetitions();
    competitions.value = Array.isArray(items) ? items : [];
  } catch (err) {
    console.error(err);
    competitions.value = [];
  }
});
</script>

<style scoped>
.competitions-page {
  min-height: 100dvh;
  background: #f8fafc;
  color: #172033;
  font-variant-numeric: tabular-nums;
}

.public-index-content {
  width: min(1320px, calc(100vw - 40px));
  margin: 0 auto;
}

.competitions-section-heading {
  display: grid;
  justify-items: start;
  gap: 3px;
  margin-bottom: 22px;
}

.competitions-section-heading h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 900;
  line-height: 1.08;
}

.competition-list-section {
  padding-top: 0;
  scroll-margin-top: 112px;
}

.competition-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.competition-list-card,
.competition-empty-state {
  border: 1px solid rgba(226, 232, 240, 0.74);
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.competition-list-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 410px;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  transition: border-color 160ms ease-out, box-shadow 160ms ease-out, transform 160ms ease-out;
}

.competition-list-card:hover {
  transform: translateY(-2px);
  border-color: rgba(148, 163, 184, 0.38);
  box-shadow: 0 22px 44px rgba(15, 23, 42, 0.08);
}

.tone-project {
  --tone-soft: rgba(15, 118, 110, 0.1);
  --tone-ink: #0f766e;
}

.tone-robot {
  --tone-soft: rgba(65, 90, 123, 0.1);
  --tone-ink: #415a7b;
}

.tone-maker {
  --tone-soft: rgba(154, 103, 39, 0.1);
  --tone-ink: #9a6727;
}

.tone-general {
  --tone-soft: rgba(100, 116, 139, 0.08);
  --tone-ink: #475569;
}

.competition-list-card__media {
  position: relative;
  height: 196px;
  overflow: hidden;
  background: #0f172a;
}

.competition-list-card__media::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.72) 48%, rgba(15, 23, 42, 0.24) 100%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.58));
}

.competition-list-card__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 220ms ease;
}

.competition-list-card__poster {
  position: absolute;
  z-index: 2;
  inset: 18px 20px 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 12px;
  max-width: 82%;
  color: #fff;
}

.competition-list-card__poster span {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.68rem;
  font-weight: 900;
  backdrop-filter: blur(10px);
}

.competition-list-card__poster h3 {
  margin: 0;
  color: #fff;
  font-size: clamp(1.04rem, 1.55vw, 1.28rem);
  font-weight: 950;
  line-height: 1.18;
  letter-spacing: 0;
  text-shadow: 0 12px 26px rgba(15, 23, 42, 0.38);
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.competition-list-card:hover .competition-list-card__media img {
  transform: scale(1.035);
}

.tone-maker .competition-list-card__media img {
  object-position: center top;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 11px;
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.72);
  background: #f8fafc;
  font-size: 0.68rem;
  font-weight: 900;
}

.competition-list-card__top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 18px 20px 0;
}

.competition-list-card__top span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  gap: 5px;
  padding: 0 9px;
  border-radius: 8px;
  font-size: 0.66rem;
  font-weight: 900;
}

.competition-list-card__top span:first-child {
  background: var(--tone-soft, #f1f5f9);
  color: var(--tone-ink, #475569);
  border: 1px solid rgba(226, 232, 240, 0.62);
}

.competition-list-card__top span:last-child {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid rgba(226, 232, 240, 0.72);
}

.status-badge.is-open,
.status-badge.is-live {
  background: #ecfdf5;
  color: #0f766e;
}

.status-badge.is-upcoming {
  background: #fff7e7;
  color: #9a6727;
}

.status-badge.is-muted {
  background: #edf1f5;
  color: #64748b;
}

.competition-list-card__body {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
  padding: 18px 20px 0;
}

.competition-list-card__body p {
  margin: 0;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 750;
  line-height: 1.58;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.competition-list-card__facts {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 20px 0;
}

.competition-list-card__facts span {
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 9px;
  background: #f8fafc;
  border: 1px solid rgba(226, 232, 240, 0.72);
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.competition-list-card__facts i {
  color: var(--tone-ink, #0f766e);
  font-size: 0.72rem;
}

.competition-list-card__action {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding: 22px 20px 20px;
  color: var(--tone-ink, #0f766e);
  font-size: 0.82rem;
  font-weight: 900;
  transition: color 0.18s ease;
}

.competition-list-card__action i {
  font-size: 0.72rem;
  transition: transform 0.2s ease;
}

.competition-list-card:hover .competition-list-card__action {
  color: #0f172a;
}

.competition-list-card:hover .competition-list-card__action i {
  transform: translateX(3px);
}

.competition-empty-state {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 46px 18px;
  text-align: center;
}

.competition-empty-state i {
  color: #94a3b8;
  font-size: 2rem;
}

.competition-empty-state h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 950;
}

.competition-empty-state p {
  max-width: 24rem;
  margin: 0;
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.6;
  font-weight: 700;
}

.competition-empty-state button {
  min-height: 36px;
  border: 1px solid #99d3ca;
  border-radius: 9px;
  background: #e8f5f3;
  color: #0f766e;
  padding: 0 13px;
  font-size: 0.82rem;
  font-weight: 900;
}

@media (max-width: 1000px) {
  .competition-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .public-index-content {
    width: min(1320px, calc(100vw - 22px));
  }

  .competition-list {
    grid-template-columns: 1fr;
  }

  .competition-list-card {
    min-height: 0;
  }

  .competition-list-card__media {
    height: 184px;
  }

  .competition-list-card__poster {
    max-width: 92%;
  }
}
</style>

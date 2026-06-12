<template>
  <div class="projects-page text-gray-800">
    <SiteNav active="projects" />

    <PublicPageHeader
      title="项目课题入口"
      description="汇集教师悬赏和推荐研究方向，帮助学生把问题转成可持续推进的项目。"
    />

    <main class="public-index-content min-h-dvh pb-12">
      <CategorySearchBar
        :category="activeCategory"
        :search="searchTerm"
        :options="topicCategoryOptions"
        :placeholder="searchPlaceholder"
        :clear-disabled="!searchTerm && activeCategory === 'all'"
        @update:category="applyCategory"
        @update:search="searchTerm = $event"
        @clear="resetSearch"
      />

      <div class="space-y-12">
        <!-- 教师悬赏课题 -->
        <section
          v-if="showBounties"
          id="projects-bounties"
          class="scroll-anchor"
        >
          <div class="projects-section-heading">
            <h2>教师悬赏课题</h2>
          </div>
          <p
            v-if="claimNotice"
            class="mb-5 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600"
            role="status"
          >
            {{ claimNotice }}
          </p>
          <div class="projects-bounty-grid">
            <div v-if="topicsLoading" class="text-gray-400 text-sm">加载中...</div>
            <template v-else>
              <button
                v-for="bounty in filteredBounties"
                :key="bounty.id || bounty.title"
                type="button"
                class="bounty-card card-hover group text-left"
                :aria-label="`查看悬赏课题：${bounty.title}`"
                @click="showClaimNotice(bounty)"
	              >
                <div class="project-card__media">
                  <img :src="topicImage(bounty, 'bounty')" :alt="bounty.title" />
                </div>
                <div class="bounty-card__top">
                  <span class="bounty-ribbon">悬赏</span>
                  <span class="bounty-card__tag">教师发布</span>
                </div>
                <div class="bounty-card__body">
                  <h3>{{ bounty.title }}</h3>
                  <p>{{ bounty.description }}</p>
                </div>
                <div class="bounty-card__footer">
                  <span><i class="fas fa-gift"></i> {{ bounty.reward }}</span>
                  <span>截止: {{ bounty.deadline }}</span>
                </div>
              </button>
              <div v-if="!filteredBounties.length" class="text-gray-400 text-sm">暂无匹配悬赏</div>
            </template>
          </div>
        </section>

        <!-- 推荐课题 -->
        <section
          v-if="showTeacherTopics"
          id="projects-topics"
          class="scroll-anchor"
        >
          <div class="projects-section-heading">
            <h2>推荐课题</h2>
          </div>
          <div class="projects-topic-grid">
            <div v-if="topicsLoading" class="text-gray-400 text-sm">加载中...</div>
            <template v-else>
              <button
                v-for="topic in filteredTeacherTopics"
                :key="topic.id || topic.title"
                type="button"
                class="topic-card card-hover flex flex-col h-full text-left"
                :aria-label="authStore.isAuthenticated ? `以${topic.title}方向立项` : `登录后以${topic.title}方向立项`"
                @click="goCreate(topic)"
	              >
                <div class="project-card__media">
                  <img :src="topicImage(topic, 'topic')" :alt="topic.title" />
                </div>
                <div class="topic-card__top">
                  <span>{{ topic.category }}</span>
                  <span>{{ topic.difficulty }}</span>
                </div>
                <div class="topic-card__body">
                  <h3>{{ topic.title }}</h3>
                  <p>{{ topic.description }}</p>
                </div>
                <div class="topic-card__tags">
                  <span v-for="tag in topic.tags || []" :key="tag">#{{ tag }}</span>
                </div>
                <div class="topic-card__cta">
                  <span>{{ topicCtaLabel }}</span>
                  <i class="fas fa-arrow-right text-[10px]"></i>
                </div>
              </button>
              <div v-if="!filteredTeacherTopics.length" class="text-gray-400 text-sm">暂无匹配推荐</div>
            </template>
          </div>
        </section>
      </div>
    </main>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiFetch, readJsonResponse } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import PublicPageHeader from '@/components/PublicPageHeader.vue';
import CategorySearchBar from '@/components/CategorySearchBar.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
authStore.hydrate();

const topics = reactive({ bounties: [], teacher_topics: [] });
const topicsLoading = ref(true);
const activeCategory = ref('all');
const searchTerm = ref('');
const claimNotice = ref('');

const topicCategoryOptions = [
  { value: 'all', label: '全部课题' },
  { value: 'bounties', label: '悬赏课题' },
  { value: 'teacher_topics', label: '推荐课题' }
];

const normalizedSearch = computed(() => searchTerm.value.trim().toLowerCase());

const showBounties = computed(() => ['all', 'bounties'].includes(activeCategory.value));
const showTeacherTopics = computed(() => ['all', 'teacher_topics'].includes(activeCategory.value));
const topicCtaLabel = computed(() => (authStore.isAuthenticated ? '以这个方向立项' : '登录后立项'));

const filteredBounties = computed(() => {
  if (!normalizedSearch.value) return topics.bounties;
  return topics.bounties.filter(item => matchesSearch([
    item.title,
    item.description,
    item.reward,
    item.deadline,
    item.requester
  ]));
});

const filteredTeacherTopics = computed(() => {
  if (!normalizedSearch.value) return topics.teacher_topics;
  return topics.teacher_topics.filter(item => matchesSearch([
    item.title,
    item.description,
    item.category,
    item.difficulty,
    ...(item.tags || [])
  ]));
});

const searchPlaceholder = computed(() => {
  if (activeCategory.value === 'bounties') return '搜索悬赏标题、描述、回报或截止时间';
  if (activeCategory.value === 'teacher_topics') return '搜索推荐方向、难度、标签';
  return '搜索课题方向、标签或关键词';
});

function matchesSearch(parts) {
  const haystack = parts
    .filter(value => value !== undefined && value !== null)
    .map(value => String(value).toLowerCase())
    .join(' ');
  return haystack.includes(normalizedSearch.value);
}

function applyCategory(value, { syncUrl = true } = {}) {
  activeCategory.value = value;
  claimNotice.value = '';
  if (syncUrl) {
    const query = {
      ...route.query,
      category: value,
      q: searchTerm.value.trim() || undefined
    };
    if (!query.q) delete query.q;
    router.replace({ query }).catch(() => {});
  }
}

function resetSearch() {
  searchTerm.value = '';
  claimNotice.value = '';
  applyCategory('all');
}

function showClaimNotice(item) {
  claimNotice.value = `请联系 ${item.requester || '老师'} 认领此任务。`;
}

function goCreate(item) {
  const target = {
    path: '/workspace',
    query: {
      create: 'true',
      topic: item.dbId || item.id,
      topicTitle: item.title
    }
  };
  if (!authStore.isAuthenticated) {
    authStore.setRedirect(router.resolve(target).fullPath);
    router.push('/login');
    return;
  }
  router.push(target);
}

function topicImage(item, type = 'topic') {
  const text = [
    item?.title,
    item?.description,
    item?.category,
    ...(item?.tags || [])
  ].filter(Boolean).join(' ');

  if (/图书馆|还书|小车|硬件|物联网|机器人|避障/.test(text)) return '/course-covers/project5.png';
  if (/视觉|AI|Python|数据|分析|食堂|人流|智能|算法/.test(text)) return '/course-covers/project4.png';
  if (/方言|文化|调研|网页|档案/.test(text)) return '/assets/banners/banner-projects-showcase.png';
  if (type === 'bounty') return '/assets/banners/banner-projects-topics.png';
  return '/assets/banners/banner-projects.png';
}

async function loadTopics() {
  topicsLoading.value = true;
  try {
    const [staticRes, dynamicRes] = await Promise.all([
      fetch('/data/topics_data.json'),
      apiFetch('/project-topics')
    ]);
    const staticData = await staticRes.json();
    const dynamicData = await readJsonResponse(dynamicRes, 'project_topics');
    const dynamicTopics = dynamicRes.ok ? (dynamicData.topics || []).map(item => ({
      id: `db-${item.id}`,
      dbId: item.id,
      title: item.title,
      description: item.description || item.goals || item.background,
      category: item.relatedCourseId || '教师发布',
      difficulty: item.difficulty || '难度待定',
      tags: [item.suggestedTeamSize, item.relatedCompetitionSlug].filter(Boolean),
      deliverables: item.deliverables
    })) : [];
    topics.bounties = staticData.bounties || [];
    topics.teacher_topics = [...dynamicTopics, ...(staticData.teacher_topics || [])];
  } catch (err) {
    console.error(err);
    topics.bounties = [];
    topics.teacher_topics = [];
  } finally {
    topicsLoading.value = false;
  }
}

watch(() => route.query.category, value => {
  const next = ['all', 'bounties', 'teacher_topics'].includes(String(value || ''))
    ? String(value)
    : 'all';
  if (next !== activeCategory.value) activeCategory.value = next;
}, { immediate: true });

watch(() => route.query.q, value => {
  const next = String(value || '');
  if (next !== searchTerm.value) searchTerm.value = next;
}, { immediate: true });

watch(searchTerm, value => {
  const query = { ...route.query };
  const q = value.trim();
  if (q) query.q = q;
  else delete query.q;
  router.replace({ query }).catch(() => {});
});

onMounted(() => {
  loadTopics();
});
</script>

<style scoped>
.projects-page {
  background: #f8fafc;
  min-height: 100dvh;
}

.public-index-content {
  width: min(1320px, calc(100vw - 40px));
  margin: 0 auto;
}

.projects-section-heading {
  display: grid;
  justify-items: start;
  gap: 3px;
  margin-bottom: 22px;
}

.projects-section-heading h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 900;
  line-height: 1.08;
}

.projects-bounty-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.projects-topic-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.bounty-card,
.topic-card {
  position: relative;
  overflow: hidden;
  min-height: 360px;
  border-radius: 28px;
  background: #fff;
  color: inherit;
  transition: border-color 160ms ease-out, box-shadow 160ms ease-out, transform 160ms ease-out;
  border: 1px solid rgba(226, 232, 240, 0.74);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.bounty-card:hover,
.topic-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 44px rgba(15, 23, 42, 0.08);
  border-color: rgba(148, 163, 184, 0.38);
}

.bounty-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  background: #fff;
}

.project-card__media {
  position: relative;
  height: 148px;
  overflow: hidden;
  background: #e2e8f0;
}

.project-card__media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.34));
}

.project-card__media img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 220ms ease;
}

.bounty-card:hover .project-card__media img,
.topic-card:hover .project-card__media img {
  transform: scale(1.035);
}

.bounty-card__top,
.topic-card__top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 18px 20px 0;
}

.bounty-ribbon {
  border-radius: 8px;
  background: #fff1f2;
  border: 1px solid rgba(254, 205, 211, 0.72);
  color: #be123c;
  padding: 4px 10px;
  font-size: 0.66rem;
  font-weight: 900;
}

.bounty-card__tag {
  border-radius: 8px;
  background: #0f172a;
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #fff;
  padding: 4px 10px;
  font-size: 0.66rem;
  font-weight: 900;
}

.bounty-card__body,
.topic-card__body {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
  padding: 22px 20px 0;
}

.bounty-card__body h3,
.topic-card__body h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1.125rem;
  font-weight: 900;
  line-height: 1.22;
}

.bounty-card__body p,
.topic-card__body p {
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 750;
  line-height: 1.68;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bounty-card__footer {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: auto 20px 0;
  padding-top: 16px;
  padding-bottom: 20px;
  border-top: 1px solid rgba(226, 232, 240, 0.72);
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 900;
  transition: color 160ms ease, border-color 160ms ease;
}

.bounty-card__footer i {
  color: #e11d48;
  margin-right: 4px;
}

.bounty-card:hover .bounty-card__footer {
  border-color: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.topic-card {
  padding: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.topic-card::before {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 5px;
  background: #0f766e;
}

.topic-card__top span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 8px;
  font-size: 0.66rem;
  font-weight: 900;
}

.topic-card__top span:first-child {
  background: #ecfdf5;
  color: #0f766e;
  border: 1px solid rgba(15, 118, 110, 0.12);
}

.topic-card__top span:last-child {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid rgba(226, 232, 240, 0.72);
}

.topic-card__tags {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 18px 20px 0;
}

.topic-card__tags span {
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  padding: 4px 8px;
  font-size: 0.68rem;
  font-weight: 800;
}

.topic-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  margin-left: 20px;
  margin-right: 20px;
  padding-top: 22px;
  padding-bottom: 20px;
  color: #0f766e;
  font-size: 0.82rem;
  font-weight: 900;
  transition: color 0.18s ease;
}

.topic-card:hover .topic-card__cta {
  color: #0f172a;
}

.topic-card:hover .topic-card__cta i {
  transform: translateX(3px);
}

.topic-card__cta i {
  transition: transform 0.2s ease;
}

.scroll-anchor {
  scroll-margin-top: 112px;
}

@media (max-width: 720px) {
  .public-index-content {
    width: min(1320px, calc(100vw - 22px));
  }

  .projects-bounty-grid,
  .projects-topic-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) and (min-width: 721px) {
  .projects-topic-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>

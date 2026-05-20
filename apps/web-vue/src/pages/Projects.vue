<template>
  <div class="projects-page text-gray-800">
    <SiteNav active="projects" />

    <PublicPageHeader
      eyebrow="Topics Entry"
      title="项目课题入口"
      description="教师发布悬赏课题与推荐研究方向，开启你的创新课题之旅。"
      layout="split"
    >
      <div class="project-header-panel">
        <div class="project-header-panel__meta">
          <strong><i class="fas fa-bullhorn"></i> 课题总览</strong>
          <span>{{ projectSearchMeta }}</span>
        </div>
      </div>
    </PublicPageHeader>

    <main class="max-w-[1320px] mx-auto px-5 sm:px-6 lg:px-8 py-4 min-h-screen">
      <CategorySearchBar
        :meta="projectSearchMeta"
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
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm shadow-sm">
              <i class="fas fa-bullhorn"></i>
            </div>
            <h2 class="text-xl font-bold text-gray-900">教师悬赏课题</h2>
          </div>
          <div class="grid md:grid-cols-2 gap-6">
            <div v-if="topicsLoading" class="text-gray-400 text-sm">加载中...</div>
            <template v-else>
              <div
                v-for="bounty in filteredBounties"
                :key="bounty.id || bounty.title"
                class="bounty-card card-hover group"
                @click="alertClaim(bounty)"
              >
                <div class="bounty-ribbon">悬赏</div>
                <h3 class="font-bold text-gray-900 mb-2 group-hover:text-red-600 transition">{{ bounty.title }}</h3>
                <p class="text-sm text-gray-500 mb-4 line-clamp-2">{{ bounty.description }}</p>
                <div class="flex justify-between items-center text-xs border-t border-gray-50 pt-3 gap-3">
                  <span class="font-bold text-red-500"><i class="fas fa-gift mr-1"></i> {{ bounty.reward }}</span>
                  <span class="text-gray-400">截止: {{ bounty.deadline }}</span>
                </div>
              </div>
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
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm shadow-sm">
              <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <h2 class="text-xl font-bold text-gray-900">推荐课题</h2>
          </div>
          <div class="grid md:grid-cols-3 gap-6">
            <div v-if="topicsLoading" class="text-gray-400 text-sm">加载中...</div>
            <template v-else>
              <div
                v-for="topic in filteredTeacherTopics"
                :key="topic.id || topic.title"
                class="topic-card card-hover flex flex-col h-full cursor-pointer"
                @click="goCreate(topic)"
              >
                <div class="flex justify-between items-start mb-3 gap-3">
                  <span class="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{{ topic.category }}</span>
                  <span class="text-[10px] text-gray-400">{{ topic.difficulty }}</span>
                </div>
                <h3 class="font-bold text-gray-900 mb-2 flex-1 hover:text-indigo-600 transition">{{ topic.title }}</h3>
                <p class="text-xs text-gray-500 mb-4 line-clamp-3">{{ topic.description }}</p>
                <div class="flex gap-1 flex-wrap">
                  <span v-for="tag in topic.tags || []" :key="tag" class="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{{ tag }}</span>
                </div>
                <div class="topic-card__cta">
                  <span>以这个方向立项</span>
                  <i class="fas fa-arrow-right text-[10px]"></i>
                </div>
              </div>
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
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import PublicPageHeader from '@/components/PublicPageHeader.vue';
import CategorySearchBar from '@/components/CategorySearchBar.vue';

const route = useRoute();
const router = useRouter();

const topics = reactive({ bounties: [], teacher_topics: [] });
const topicsLoading = ref(true);
const activeCategory = ref('all');
const searchTerm = ref('');

const topicCategoryOptions = [
  { value: 'all', label: '全部课题' },
  { value: 'bounties', label: '悬赏课题' },
  { value: 'teacher_topics', label: '推荐课题' }
];

const normalizedSearch = computed(() => searchTerm.value.trim().toLowerCase());

const showBounties = computed(() => ['all', 'bounties'].includes(activeCategory.value));
const showTeacherTopics = computed(() => ['all', 'teacher_topics'].includes(activeCategory.value));

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

const visibleProjectCount = computed(() => {
  return (showBounties.value ? filteredBounties.value.length : 0)
    + (showTeacherTopics.value ? filteredTeacherTopics.value.length : 0);
});

const projectSearchMeta = computed(() => `${visibleProjectCount.value} 个研究课题`);

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
  applyCategory('all');
}

function alertClaim(item) {
  window.alert(`请联系 ${item.requester || '老师'} 认领此任务`);
}

function goCreate(item) {
  router.push({
    path: '/workspace',
    query: {
      create: 'true',
      topic: item.dbId || item.id,
      topicTitle: item.title
    }
  });
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
  background:
    radial-gradient(circle at 12% 18%, rgba(99, 102, 241, 0.04), transparent 28%),
    radial-gradient(circle at 88% 16%, rgba(14, 165, 233, 0.04), transparent 26%),
    #f8fafc;
  min-height: 100vh;
}

.project-header-panel {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.project-header-panel__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 16px 24px;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.02);
  width: min(100%, 280px);
}

.project-header-panel__meta strong {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-header-panel__meta strong i {
  color: #6366f1;
}

.project-header-panel__meta span {
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 700;
}

.bounty-card,
.topic-card {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  background: #fff;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.02);
}

.bounty-card:hover,
.topic-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(99, 102, 241, 0.06);
  border-color: rgba(99, 102, 241, 0.3);
}

.bounty-card {
  padding: 26px;
  background: linear-gradient(135deg, rgba(254, 242, 242, 0.5), #fff 40%);
}

.bounty-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(to bottom, #ef4444, #f43f5e);
}

.bounty-ribbon {
  position: absolute;
  top: 0;
  right: 0;
  border-bottom-left-radius: 12px;
  background: linear-gradient(135deg, #ef4444, #e11d48);
  color: #fff;
  padding: 4px 12px;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.15);
}

.topic-card {
  padding: 26px;
  background: linear-gradient(180deg, rgba(238, 242, 255, 0.4), #fff 40%);
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.topic-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #06b6d4);
}

.topic-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  color: #4f46e5;
  font-size: 0.8rem;
  font-weight: 800;
  transition: all 0.2s ease;
}

.topic-card:hover .topic-card__cta {
  color: #4338ca;
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
</style>

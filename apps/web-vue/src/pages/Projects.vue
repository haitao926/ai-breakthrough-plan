<template>
  <div class="projects-page text-gray-800">
    <!-- 导航栏 -->
    <nav class="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-3 shrink-0">
            <RouterLink to="/" class="flex items-center gap-2 group">
              <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md group-hover:bg-indigo-700 transition">AI</div>
              <span class="font-bold text-xl tracking-tight text-gray-900 group-hover:text-indigo-600 transition">破壁计划</span>
            </RouterLink>
          </div>

          <div class="hidden md:flex items-center space-x-1">
            <RouterLink to="/knowledge" class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center">
              <i class="fas fa-book-reader mr-2 text-xs"></i>创新知识库
            </RouterLink>
            <RouterLink to="/competencies" class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center">
              <i class="fas fa-graduation-cap mr-2 text-xs"></i>学术指导
            </RouterLink>
            <RouterLink to="/projects" class="px-3 py-2 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700 transition-all flex items-center">
              <i class="fas fa-layer-group mr-2 text-xs"></i>项目库
            </RouterLink>
            <RouterLink to="/downloads" class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center">
              <i class="fas fa-folder-open mr-2 text-xs"></i>课程资料库
            </RouterLink>
          </div>

          <div class="flex gap-3 items-center shrink-0">
            <RouterLink to="/workspace" class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5">
              <i class="fas fa-rocket mr-2"></i> 进入工作台
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Header -->
    <header class="pt-32 pb-10 bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-extrabold text-gray-900 mb-6">发现与探索</h1>
        <div class="flex gap-8 border-b border-gray-200">
          <button
            id="tab-topics"
            class="tab-btn pb-4 px-2 text-gray-500 hover:text-gray-700 transition"
            :class="{ active: tab === 'topics' }"
            @click="switchTab('topics')"
          >
            <i class="fas fa-list-ul mr-2"></i> 课题选题库
          </button>
          <button
            id="tab-showcase"
            class="tab-btn pb-4 px-2 text-gray-500 hover:text-gray-700 transition"
            :class="{ active: tab === 'showcase' }"
            @click="switchTab('showcase')"
          >
            <i class="fas fa-trophy mr-2"></i> 往届优秀作品
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <!-- Tab 1: Topic Library -->
      <div v-show="tab === 'topics'" id="view-topics" class="space-y-12">
        <section>
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm shadow-sm"><i class="fas fa-bullhorn"></i></div>
            <h2 class="text-xl font-bold text-gray-900">🔥 教师悬赏令</h2>
          </div>
          <div class="grid md:grid-cols-2 gap-6" id="bounty-grid">
            <div v-if="topicsLoading" class="text-gray-400 text-sm">加载中...</div>
            <template v-else>
              <div
                v-for="bounty in topics.bounties"
                :key="bounty.id || bounty.title"
                class="bg-white rounded-xl p-6 border border-red-100 shadow-sm card-hover relative overflow-hidden group cursor-pointer"
                @click="alertClaim(bounty)"
              >
                <div class="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">悬赏</div>
                <h3 class="font-bold text-gray-900 mb-2 group-hover:text-red-600 transition">{{ bounty.title }}</h3>
                <p class="text-sm text-gray-500 mb-4 line-clamp-2">{{ bounty.description }}</p>
                <div class="flex justify-between items-center text-xs border-t border-gray-50 pt-3">
                  <span class="font-bold text-red-500"><i class="fas fa-gift mr-1"></i> {{ bounty.reward }}</span>
                  <span class="text-gray-400">截止: {{ bounty.deadline }}</span>
                </div>
              </div>
              <div v-if="!topics.bounties.length" class="text-gray-400 text-sm">暂无悬赏</div>
            </template>
          </div>
        </section>

        <section>
          <div class="flex items-center gap-3 mb-6">
            <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm shadow-sm"><i class="fas fa-chalkboard-teacher"></i></div>
            <h2 class="text-xl font-bold text-gray-900">📚 推荐课题</h2>
          </div>
          <div class="grid md:grid-cols-3 gap-6" id="topic-grid">
            <div v-if="topicsLoading" class="text-gray-400 text-sm">加载中...</div>
            <template v-else>
              <div
                v-for="topic in topics.teacher_topics"
                :key="topic.id || topic.title"
                class="bg-white rounded-xl p-6 border border-blue-50 shadow-sm card-hover flex flex-col h-full cursor-pointer"
                @click="goCreate(topic)"
              >
                <div class="flex justify-between items-start mb-3">
                  <span class="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{{ topic.category }}</span>
                  <span class="text-[10px] text-gray-400">{{ topic.difficulty }}</span>
                </div>
                <h3 class="font-bold text-gray-900 mb-2 flex-1 hover:text-indigo-600 transition">{{ topic.title }}</h3>
                <p class="text-xs text-gray-500 mb-4 line-clamp-3">{{ topic.description }}</p>
                <div class="flex gap-1 flex-wrap">
                  <span v-for="tag in topic.tags || []" :key="tag" class="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{{ tag }}</span>
                </div>
              </div>
              <div v-if="!topics.teacher_topics.length" class="text-gray-400 text-sm">暂无推荐</div>
            </template>
          </div>
        </section>
      </div>

      <!-- Tab 2: Showcase -->
      <div v-show="tab === 'showcase'" id="view-showcase">
        <div class="flex gap-2 overflow-x-auto pb-6 mb-4">
          <button
            class="showcase-filter px-3 py-1.5 rounded-lg text-xs font-bold transition"
            :class="filterKey === 'all' ? 'active bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
            @click="filterShowcase('all')"
          >全部</button>
          <button
            class="showcase-filter px-3 py-1.5 rounded-lg text-xs font-bold transition"
            :class="filterKey === 'project1' ? 'active bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
            @click="filterShowcase('project1')"
          >Vibe Coding</button>
          <button
            class="showcase-filter px-3 py-1.5 rounded-lg text-xs font-bold transition"
            :class="filterKey === 'project2' ? 'active bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
            @click="filterShowcase('project2')"
          >产品设计</button>
          <button
            class="showcase-filter px-3 py-1.5 rounded-lg text-xs font-bold transition"
            :class="filterKey === 'project5' ? 'active bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
            @click="filterShowcase('project5')"
          >智能硬件</button>
        </div>

        <div class="grid md:grid-cols-3 gap-8" id="showcase-grid">
          <div v-if="showcaseLoading" class="text-center py-20 text-gray-400 w-full col-span-3">
            <i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br />加载作品中...
          </div>
          <div v-else-if="filteredShowcase.length === 0" class="col-span-3 text-center text-gray-400 py-10">暂无作品</div>
          <div v-else v-for="item in filteredShowcase" :key="item.url" class="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm card-hover">
            <div class="h-40 bg-gray-100 relative group overflow-hidden">
              <img
                v-if="isImage(item.filename)"
                :src="item.url"
                class="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                :alt="item.title"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-4xl"><i class="fas fa-file-alt"></i></div>
            </div>
            <div class="p-4">
              <h4 class="font-bold text-gray-900 text-sm truncate" :title="item.title">{{ item.title }}</h4>
              <div class="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span><i class="fas fa-user mr-1"></i> {{ item.studentName }}</span>
                <a :href="item.url" target="_blank" class="text-indigo-600 font-bold hover:underline">查看</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch } from '@/api/client';

const router = useRouter();
const tab = ref('topics');
const filterKey = ref('all');
const topics = reactive({ bounties: [], teacher_topics: [] });
const topicsLoading = ref(true);
const showcaseItems = ref([]);
const showcaseLoading = ref(false);
let showcaseLoaded = false;

const filteredShowcase = computed(() => {
  if (filterKey.value === 'all') return showcaseItems.value;
  return showcaseItems.value.filter(item => item.project === filterKey.value);
});

function switchTab(next) {
  tab.value = next;
  if (next === 'showcase' && !showcaseLoaded) {
    loadShowcase();
  }
}

function filterShowcase(key) {
  filterKey.value = key;
}

function alertClaim(item) {
  window.alert(`请联系 ${item.requester || '老师'} 认领此任务`);
}

function goCreate(item) {
  router.push(`/workspace?create=true&topic=${item.id}`);
}

function isImage(filename) {
  return /\.(png|jpe?g)$/i.test(filename || '');
}

async function loadTopics() {
  topicsLoading.value = true;
  try {
    const res = await fetch('/data/topics_data.json');
    const data = await res.json();
    topics.bounties = data.bounties || [];
    topics.teacher_topics = data.teacher_topics || [];
  } catch (err) {
    console.error(err);
    topics.bounties = [];
    topics.teacher_topics = [];
  } finally {
    topicsLoading.value = false;
  }
}

async function loadShowcase() {
  showcaseLoading.value = true;
  try {
    const res = await apiFetch('/showcase');
    const data = await res.json();
    const items = data.items || [];
    showcaseItems.value = items.flatMap(item => {
      const pid = `project${item.project?.id || ''}`;
      return (item.showcase?.attachments || []).map(att => ({
        project: pid,
        filename: att.name,
        url: att.url,
        title: item.showcase?.title || att.name,
        studentName: item.showcase?.details?.studentName || '匿名'
      }));
    });
    showcaseLoaded = true;
  } catch (err) {
    console.error(err);
  } finally {
    showcaseLoading.value = false;
  }
}

onMounted(() => {
  loadTopics();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
.projects-page { font-family: 'Inter', sans-serif; background: #f8fafc; }
.glass { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.3); }
.tab-btn.active { border-bottom: 2px solid #4f46e5; color: #4f46e5; font-weight: 600; }
.card-hover { transition: all 0.3s ease; }
.card-hover:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
</style>

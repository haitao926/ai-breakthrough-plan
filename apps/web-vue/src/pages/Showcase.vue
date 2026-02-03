<template>
  <div class="showcase-page text-gray-800">
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
            <RouterLink to="/projects" class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center">
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

    <header class="pt-32 pb-12 bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">展示墙</h1>
        <p class="text-lg text-gray-500 max-w-3xl">浏览往届项目成果，找到灵感与方向。</p>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div class="flex gap-2 overflow-x-auto pb-4 mb-6">
        <button
          v-for="item in showcaseFilters"
          :key="item.key"
          class="px-3 py-1.5 rounded-lg text-xs font-bold transition"
          :class="filterKey === item.key ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'"
          @click="filterKey = item.key"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <div v-if="loading" class="col-span-3 text-center py-20 text-gray-400">
          <i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br />加载作品中...
        </div>
        <div v-else-if="filteredShowcase.length === 0" class="col-span-3 text-center text-gray-400 py-10">暂无作品</div>
        <div v-else v-for="item in filteredShowcase" :key="item.url" class="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm card-hover">
          <div class="h-40 bg-gray-100 relative group overflow-hidden">
            <img
              v-if="isImage(item.url)"
              :src="item.url"
              class="w-full h-full object-cover transition duration-500 group-hover:scale-105"
              :alt="item.title"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-4xl"><i class="fas fa-file-alt"></i></div>
          </div>
          <div class="p-4">
            <h4 class="font-bold text-gray-900 text-sm truncate" :title="item.title">{{ item.title }}</h4>
            <div class="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span><i class="fas fa-user mr-1"></i> {{ item.studentName || '学生' }}</span>
              <a :href="item.url" target="_blank" class="text-indigo-600 font-bold hover:underline">查看</a>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { apiFetch } from '@/api/client';

const showcaseItems = ref([]);
const filterKey = ref('all');
const loading = ref(true);

const showcaseFilters = [
  { key: 'all', label: '全部' },
  { key: 'project1', label: 'Vibe Coding' },
  { key: 'project2', label: '产品设计' },
  { key: 'project5', label: '智能硬件' }
];

const filteredShowcase = computed(() => {
  if (filterKey.value === 'all') return showcaseItems.value;
  return showcaseItems.value.filter(item => item.project === filterKey.value);
});

function isImage(url) {
  return /\.(png|jpe?g|gif|webp)$/i.test(url);
}

async function loadShowcase() {
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
        title: item.project?.title || att.name,
        studentName: item.project?.team_members || ''
      }));
    });
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(loadShowcase);
</script>

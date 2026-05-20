<template>
  <div class="portal-page text-gray-800 min-h-screen flex flex-col">
    <SiteNav active="showcase" />

    <!-- Main Container -->
    <main class="portal-shell portal-main flex-grow max-w-[1320px] mx-auto px-5 sm:px-6 lg:px-8 pb-16 space-y-16">
      
      <!-- Spotlight Hero Section -->
      <section v-if="featuredStory" class="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 backdrop-blur-xl p-6 sm:p-10 shadow-xl shadow-slate-100/40">
        <!-- Background Ambient Glows -->
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          <!-- Copy Column -->
          <div class="lg:col-span-7 space-y-6">
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200/50">
                Spotlight Project
              </span>
              <span class="flex items-center gap-1 text-[10px] font-black text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-100/50">
                <i class="fas fa-magic"></i> HAI Co-Created
              </span>
            </div>
            
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              {{ featuredStory.title }}
            </h1>
            
            <p class="text-sm sm:text-base text-slate-500 font-bold leading-relaxed max-w-2xl">
              {{ featuredStory.summary }}
            </p>
            
            <!-- Metadata & Action Row -->
            <div class="pt-4 flex flex-wrap items-center gap-3 border-t border-slate-100/80">
              <div class="flex items-center gap-2">
                <span class="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs font-black text-slate-600">
                  <i class="fas fa-award mr-1.5 text-indigo-500"></i>{{ featuredStory.result }}
                </span>
                <span class="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs font-black text-slate-500">
                  <i class="fas fa-users mr-1.5 text-slate-400"></i>{{ featuredStory.studentLabel }}
                </span>
              </div>
            </div>
          </div>

          <!-- Cover Image Column -->
          <div class="lg:col-span-5">
            <div class="relative group aspect-video sm:aspect-square lg:aspect-auto lg:h-[360px] rounded-2xl overflow-hidden shadow-2xl shadow-indigo-950/5 border border-slate-200/40">
              <img 
                :src="featuredStory.cover" 
                :alt="featuredStory.title" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Curated Cases Section -->
      <section class="space-y-6">
        <div class="border-l-4 border-indigo-600 pl-4 py-1">
          <p class="text-[10px] font-black uppercase tracking-widest text-indigo-600">Gallery</p>
          <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1">深度孵化案例</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article 
            v-for="story in stories" 
            :key="story.slug" 
            class="group relative rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between"
          >
            <!-- Thumbnail Banner -->
            <div class="relative h-48 overflow-hidden bg-slate-50 border-b border-slate-100">
              <img 
                :src="story.cover" 
                :alt="story.title" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
              />
              <div class="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                <span class="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-white/95 backdrop-blur text-slate-700 shadow-sm border border-slate-200/20">
                  {{ story.result }}
                </span>
                <span class="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-indigo-600 text-indigo-50 shadow-sm">
                  Curated
                </span>
              </div>
            </div>

            <!-- Content Area -->
            <div class="p-6 flex-grow flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <div class="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <span>{{ story.studentLabel }}</span>
                  <span>•</span>
                  <span class="text-indigo-500"><i class="fas fa-magic mr-1"></i>Co-Created</span>
                </div>
                <h3 class="text-lg font-extrabold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                  {{ story.title }}
                </h3>
                <p class="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed line-clamp-3">
                  {{ story.summary }}
                </p>
              </div>
              
              <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                <span><i class="far fa-eye mr-1.5"></i>查看实践详情</span>
                <i class="fas fa-arrow-right transition-transform group-hover:translate-x-1"></i>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- Student Showcase Wall Section -->
      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/50 pb-6">
          <div class="border-l-4 border-indigo-600 pl-4 py-1">
            <p class="text-[10px] font-black uppercase tracking-widest text-indigo-600">Showcase Wall</p>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-1">学生创意实践墙</h2>
          </div>
          
          <!-- Filter / Search box -->
          <div class="relative w-full sm:w-72">
            <div class="flex items-center gap-2 bg-white/70 backdrop-blur border border-slate-200/80 rounded-xl px-3.5 py-2 hover:border-slate-300 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <i class="fas fa-search text-slate-400 text-xs"></i>
              <input 
                v-model="searchTerm" 
                type="text" 
                placeholder="搜索标题、简介或作者..." 
                class="bg-transparent border-0 outline-none w-full text-xs font-bold text-slate-700 placeholder-slate-400"
              />
              <button v-if="searchTerm" class="text-slate-400 hover:text-slate-600" @click="searchTerm = ''">
                <i class="fas fa-times text-xs"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- States -->
        <div v-if="showcaseLoading" class="text-center py-20 bg-white/50 backdrop-blur rounded-2xl border border-slate-200/50 text-slate-400 space-y-2">
          <i class="fas fa-spinner fa-spin text-xl"></i>
          <p class="text-xs font-black">正在加载学生项目作品...</p>
        </div>

        <div v-if="filteredShowcase.length === 0" class="text-center py-20 bg-white/50 backdrop-blur rounded-2xl border border-slate-200/50 text-slate-400 space-y-2">
          <i class="far fa-folder-open text-2xl opacity-60"></i>
          <p class="text-xs font-black">暂无符合条件的项目展示</p>
        </div>

        <!-- Student Cards Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <article 
            v-for="item in filteredShowcase" 
            :key="item.id" 
            class="group relative rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-xl overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between"
          >
            <!-- Cover image placeholder/loading -->
            <div class="relative h-44 bg-gradient-to-br from-indigo-50/50 to-cyan-50/50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
              <img
                v-if="item.coverUrl"
                :src="item.coverUrl"
                :alt="item.projectTitle"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              <div v-else class="text-center space-y-1.5 opacity-60">
                <i class="fas fa-shapes text-2xl text-indigo-400/80"></i>
                <p class="text-[10px] font-bold uppercase tracking-widest text-indigo-500">HAI Tech Lab</p>
              </div>
              
              <!-- Badges on cover -->
              <span class="absolute top-3 left-3 px-2.5 py-1 rounded text-xs font-bold bg-white/95 backdrop-blur text-indigo-600 shadow-sm border border-indigo-100/50">
                优秀成果
              </span>
              <span v-if="item.className" class="absolute top-3 right-3 px-2.5 py-1 rounded text-xs font-bold bg-slate-900/90 text-white shadow-sm">
                {{ item.className }}
              </span>
            </div>

            <!-- Body info -->
            <div class="p-6 flex-grow flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <h3 class="text-base font-extrabold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {{ item.projectTitle }}
                </h3>
                <p class="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed line-clamp-2 h-[40px]">
                  {{ item.projectSummary }}
                </p>
              </div>

              <!-- Footer with author & downloads -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span class="text-slate-500 flex items-center gap-1.5">
                  <i class="far fa-user text-indigo-500"></i>
                  {{ item.studentName }}
                </span>
                
                <div class="flex gap-2">
                  <template v-if="item.attachments && item.attachments.length">
                    <a
                      v-for="att in item.attachments"
                      :key="att.url"
                      :href="att.url"
                      target="_blank"
                      rel="noreferrer"
                      class="px-3 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <i class="fas fa-paperclip text-[10px]"></i>
                      查看成果
                    </a>
                  </template>
                  <span v-else class="text-slate-300 py-1">无附件</span>
                </div>
              </div>
            </div>
          </article>
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
import { fetchStories } from '@/api/portal';
import { apiFetch, readJsonResponse } from '@/api/client';

const stories = ref([]);
const showcaseItems = ref([]);
const showcaseLoading = ref(true);
const searchTerm = ref('');

const featuredStory = computed(() => stories.value.find(item => item.featured) || stories.value[0] || null);

const filteredShowcase = computed(() => {
  const items = showcaseItems.value;
  const q = searchTerm.value.trim().toLowerCase();
  if (!q) return items;
  return items.filter(item => {
    const haystack = [
      item.projectTitle,
      item.projectSummary,
      item.studentName,
      item.className
    ].filter(Boolean).map(v => String(v).toLowerCase()).join(' ');
    return haystack.includes(q);
  });
});

function isImage(filename) {
  return /\.(png|jpe?g|webp|gif)$/i.test(filename || '');
}

async function loadShowcase() {
  showcaseLoading.value = true;
  try {
    const res = await apiFetch('/showcase');
    const data = await readJsonResponse(res, 'showcase');
    if (!res.ok) throw new Error(data?.error || 'showcase_failed');
    const items = data.items || [];
    showcaseItems.value = items.map(item => {
      const coverAttachment = (item.showcase?.attachments || []).find(att => isImage(att.name));
      return {
        id: item.showcase?.id || item.project?.id,
        projectTitle: item.project?.title || item.showcase?.title,
        projectSummary: item.project?.summary || item.showcase?.content || '暂无项目介绍。',
        className: item.project?.class_name || '',
        studentName: item.showcase?.details?.studentName || item.project?.team_members || '匿名',
        coverUrl: coverAttachment ? coverAttachment.url : null,
        attachments: item.showcase?.attachments || []
      };
    });
  } catch (err) {
    console.error(err);
    showcaseItems.value = [];
  } finally {
    showcaseLoading.value = false;
  }
}

onMounted(async () => {
  try {
    const data = await fetchStories();
    stories.value = data || [];
  } catch (e) {
    console.error(e);
  }
  await loadShowcase();
});
</script>

<style scoped>
.portal-page {
  background: 
    linear-gradient(180deg, rgba(238, 242, 255, 0.9), rgba(248, 250, 252, 0.2) 320px),
    #f8fafc;
  min-height: 100vh;
}
</style>

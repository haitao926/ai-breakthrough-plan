<template>
  <div class="showcase-page text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 min-h-screen bg-[#f8fafc]">
    <!-- 动态背景层 -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute top-[-10%] sm:top-[-20%] left-[-10%] w-[60%] sm:w-[40%] h-[60%] sm:h-[40%] bg-indigo-200/20 blur-[120px] rounded-full"></div>
      <div class="absolute bottom-[-10%] sm:bottom-[-20%] right-[-10%] w-[60%] sm:w-[40%] h-[60%] sm:h-[40%] bg-blue-200/20 blur-[120px] rounded-full"></div>
    </div>

    <!-- 导航栏 -->
    <nav class="fixed w-full z-50 glass-nav transition-all duration-500 py-4">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-4 shrink-0">
            <RouterLink to="/" class="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 group">
              <div class="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
                <i class="fas fa-cube text-lg"></i>
              </div>
              <div class="flex flex-col">
                <span class="font-black text-xl tracking-tight leading-none text-slate-900">AI 破壁计划</span>
                <span class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Showcase Gallery</span>
              </div>
            </RouterLink>
          </div>

          <div class="hidden lg:flex items-center space-x-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
            <RouterLink to="/knowledge" class="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all">创新知识库</RouterLink>
            <RouterLink to="/competencies" class="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all">学术指导</RouterLink>
            <RouterLink to="/projects" class="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all">项目库</RouterLink>
            <RouterLink to="/downloads" class="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all">资料下载</RouterLink>
          </div>

          <div class="flex gap-4 items-center shrink-0">
             <RouterLink to="/workspace" class="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all">
               进入工作台
             </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Header -->
    <header class="relative pt-44 pb-20 overflow-hidden z-10">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 text-center lg:text-left">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm">
           <i class="fas fa-magic"></i> Project Inspiration
        </div>
        <h1 class="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
          看见未来的<br><span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">创新成果</span>
        </h1>
        <p class="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
          在这里，每一个创意都留下了痕迹。从 Vibe Coding 的灵动到智能硬件的严谨，浏览往届学长的代表作品，连接真实的创新世界。
        </p>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-12 relative z-10">
      <!-- Filter Chips -->
      <div class="flex items-center gap-3 overflow-x-auto pb-8 mb-12 scroll-none animate-reveal">
        <button
          v-for="item in showcaseFilters"
          :key="item.key"
          class="px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all whitespace-nowrap"
          :class="filterKey === item.key ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'"
          @click="filterKey = item.key"
        >
          {{ item.label }}
        </button>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 animate-reveal">
        <div v-if="loading" class="col-span-full flex flex-col items-center justify-center py-40 text-slate-300">
          <i class="fas fa-spinner fa-spin text-4xl mb-6"></i>
          <span class="text-xs font-black uppercase tracking-widest">Collecting Excellence...</span>
        </div>
        
        <div v-else-if="filteredShowcase.length === 0" class="col-span-full flex flex-col items-center justify-center py-40 text-slate-300">
           <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <i class="fas fa-ghost text-3xl"></i>
           </div>
           <span class="text-xs font-black uppercase tracking-widest">No entries found yet</span>
        </div>

        <div v-else v-for="item in filteredShowcase" :key="item.url" 
          class="group relative premium-card !p-0 overflow-hidden !bg-white border-none shadow-xl hover:!shadow-2xl transition-all duration-500"
        >
          <div class="h-64 bg-slate-100 relative overflow-hidden">
            <img
              v-if="isImage(item.url)"
              :src="item.url"
              class="w-full h-full object-cover transition duration-700 group-hover:scale-110"
              :alt="item.title"
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-200 bg-slate-900">
              <i class="fas fa-file-invoice text-5xl mb-4 opacity-20"></i>
              <span class="text-[9px] font-black uppercase tracking-widest opacity-40">Document Archive</span>
            </div>
            
            <!-- Type Badge -->
            <div class="absolute top-6 left-6 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-[9px] font-black text-white uppercase tracking-widest">
               {{ item.projectLabel || 'Project' }}
            </div>
            
            <!-- Overlay Mask -->
            <div class="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
               <a :href="item.url" target="_blank" class="w-14 h-14 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:scale-110">
                  <i class="fas fa-expand-alt"></i>
               </a>
            </div>
          </div>

          <div class="p-8 space-y-6">
            <div>
               <h4 class="text-xl font-black text-slate-900 tracking-tight min-h-[3rem] line-clamp-2" :title="item.title">{{ item.title }}</h4>
               <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Submission Details</p>
            </div>
            
            <div class="flex items-center justify-between pt-6 border-t border-slate-50">
               <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[10px]">
                     {{ (item.studentName || 'Student').charAt(0).toUpperCase() }}
                  </div>
                  <span class="text-xs font-black text-slate-600 uppercase tracking-tight">{{ item.studentName || 'AI Explorer' }}</span>
               </div>
               <a :href="item.url" target="_blank" class="flex items-center gap-2 group/btn">
                  <span class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] group-hover/btn:translate-x-1 transition-transform">View</span>
                  <i class="fas fa-chevron-right text-[9px] text-indigo-400"></i>
               </a>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="py-20 border-t border-slate-100 relative z-10 text-center">
       <div class="flex items-center justify-center gap-3 mb-6">
          <div class="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
             <i class="fas fa-cube text-xs"></i>
          </div>
          <span class="text-xs font-black text-slate-900 uppercase tracking-widest">HAI Tech Lab <span class="text-slate-300 mx-2">|</span> 2026 Innovation Board</span>
       </div>
       <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Celebrating the spirit of "Make with Code".</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { apiFetch } from '@/api/client';

const showcaseItems = ref([]);
const filterKey = ref('all');
const loading = ref(true);

const showcaseFilters = [
  { key: 'all', label: '全部作品' },
  { key: 'project1', label: 'Vibe Coding' },
  { key: 'project2', label: '产品设计' },
  { key: 'project3', label: 'Web 开发' },
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
        projectLabel: item.project?.title?.split(' ')[0] || 'Inno Project',
        filename: att.name,
        url: att.url,
        title: item.title || item.project?.title || att.name,
        studentName: item.studentName || item.project?.team_members || 'AI Student'
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

<style scoped>
.glass-nav {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}
.premium-card { @apply rounded-[40px] border border-slate-200/60 p-8 shadow-sm; }
.animate-reveal { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes reveal { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.scroll-none::-webkit-scrollbar { display: none; }
</style>

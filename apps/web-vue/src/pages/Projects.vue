<template>
  <div class="projects-page text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 min-h-screen bg-[#f8fafc]">
    <!-- 动态背景层 -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 blur-[120px] rounded-full"></div>
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
                <span class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Project Discovery</span>
              </div>
            </RouterLink>
          </div>

          <div class="hidden lg:flex items-center space-x-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
            <RouterLink v-for="t in [
              { path: '/knowledge', label: '知识库' },
              { path: '/competencies', label: '学术指导' },
              { path: '/projects', label: '项目库', active: true },
              { path: '/downloads', label: '资料中心' }
            ]" :key="t.path" :to="t.path" class="px-5 py-2 rounded-xl text-sm font-bold transition-all"
            :class="t.active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-indigo-600 hover:bg-white'">
              {{ t.label }}
            </RouterLink>
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
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
           <div class="space-y-6">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                 <i class="fas fa-compass"></i> Explore Phase
              </div>
              <h1 class="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                发现与探索<br><span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">创新课题</span>
              </h1>
           </div>
           
           <div class="flex bg-slate-100 p-1.5 rounded-[22px] border border-slate-200/60 shadow-inner">
             <button @click="switchTab('topics')" 
               class="px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
               :class="tab === 'topics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'">
                <i class="fas fa-lightbulb mr-2"></i> 课题选题库
             </button>
             <button @click="switchTab('showcase')" 
               class="px-8 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
               :class="tab === 'showcase' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'">
                <i class="fas fa-trophy mr-2"></i> 往届优秀作品
             </button>
           </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-12 relative z-10 min-h-screen">
      <!-- Tab 1: Topic Library -->
      <div v-show="tab === 'topics'" id="view-topics" class="space-y-24 animate-reveal">
        <!-- 1. Bounties (Featured) -->
        <section class="space-y-10">
          <div class="flex items-center gap-4">
             <div class="w-1.5 h-8 bg-rose-500 rounded-full"></div>
             <h2 class="text-2xl font-black text-slate-900 tracking-tight">🔥 教师悬营令 (Bounties)</h2>
             <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-4">High Priority Challenges</p>
          </div>
          
          <div class="grid md:grid-cols-2 gap-8">
            <div v-if="topicsLoading" class="col-span-2 flex flex-col items-center justify-center py-20 text-slate-300">
               <i class="fas fa-spinner fa-spin text-3xl mb-4"></i>
               <span class="text-[10px] font-black uppercase tracking-widest">Scanning Bounties...</span>
            </div>
            <template v-else>
               <div v-for="b in topics.bounties" :key="b.id" @click="alertClaim(b)"
                 class="premium-card group relative !bg-white !p-10 border-none shadow-xl hover:!shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden ring-1 ring-rose-500/5 hover:ring-rose-500/20">
                  <div class="absolute top-0 right-0 py-2 px-6 bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] origin-bottom-right rotate-0">Bounty</div>
                  <div class="space-y-6">
                     <h3 class="text-2xl font-black text-slate-900 tracking-tight group-hover:text-rose-600 transition-colors leading-tight">{{ b.title }}</h3>
                     <p class="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3">{{ b.description }}</p>
                     <div class="flex items-center justify-between pt-8 border-t border-slate-50">
                        <div class="flex items-center gap-2">
                           <i class="fas fa-gift text-rose-500 text-sm"></i>
                           <span class="text-xs font-black text-rose-600 uppercase tracking-widest">{{ b.reward }}</span>
                        </div>
                        <div class="flex items-center gap-2 text-slate-300">
                           <i class="far fa-calendar-alt text-[10px]"></i>
                           <span class="text-[10px] font-bold uppercase tracking-widest">DEADLINE: {{ b.deadline }}</span>
                        </div>
                     </div>
                  </div>
               </div>
               <div v-if="!topics.bounties.length" class="col-span-2 text-center py-10 bg-slate-50 rounded-[32px] text-slate-400 text-xs font-bold italic border-2 border-dashed border-slate-100">暂无正在进行的悬赏。</div>
            </template>
          </div>
        </section>

        <!-- 2. Recommended Topics -->
        <section class="space-y-10">
          <div class="flex items-center gap-4">
             <div class="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
             <h2 class="text-2xl font-black text-slate-900 tracking-tight">📚 推荐探索课题</h2>
             <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-4">Curated Starting Points</p>
          </div>
          
          <div class="grid md:grid-cols-3 gap-8">
            <template v-if="!topicsLoading">
               <div v-for="t in topics.teacher_topics" :key="t.id" @click="goCreate(t)"
                 class="premium-card group bg-white border-none shadow-xl hover:!shadow-2xl transition-all duration-500 cursor-pointer flex flex-col h-full ring-1 ring-slate-100 hover:ring-indigo-200">
                  <div class="flex justify-between items-start mb-6">
                     <span class="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg uppercase tracking-widest border border-indigo-100">{{ t.category }}</span>
                     <div class="flex gap-1">
                        <div v-for="i in 3" :key="i" class="w-1.5 h-1.5 rounded-full" :class="i <= (t.difficulty === '难' ? 3 : t.difficulty === '中' ? 2 : 1) ? 'bg-indigo-400' : 'bg-slate-100'"></div>
                     </div>
                  </div>
                  <h3 class="text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-tight mb-4 flex-1">{{ t.title }}</h3>
                  <p class="text-xs font-medium text-slate-500 leading-relaxed mb-8 line-clamp-4">{{ t.description }}</p>
                  <div class="flex flex-wrap gap-2 pt-6 border-t border-slate-50">
                     <span v-for="tag in t.tags || []" :key="tag" class="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors">#{{ tag }}</span>
                  </div>
               </div>
            </template>
          </div>
        </section>
      </div>

      <!-- Tab 2: Filterable Showcase (integrated) -->
      <div v-show="tab === 'showcase'" id="view-showcase" class="animate-reveal">
         <div class="flex items-center gap-3 overflow-x-auto pb-10 mb-6 scroll-none">
            <button
              v-for="item in [
                { key: 'all', label: 'All Projects' },
                { key: 'project1', label: 'Vibe Coding' },
                { key: 'project2', label: 'Product Design' },
                { key: 'project5', label: 'Hardware & IOT' }
              ]"
              :key="item.key"
              class="px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap"
              :class="filterKey === item.key ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-400'"
              @click="filterKey = item.key"
            >
              {{ item.label }}
            </button>
         </div>

         <div class="grid md:grid-cols-3 gap-10">
            <div v-if="showcaseLoading" class="col-span-full flex flex-col items-center justify-center py-40 text-slate-300">
               <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
               <span class="text-[10px] font-black uppercase tracking-widest">Loading Showcase...</span>
            </div>
            <div v-else-if="filteredShowcase.length === 0" class="col-span-full text-center py-20 text-slate-300 uppercase font-black tracking-widest text-[10px] italic">No projects found for this track.</div>
            <div v-else v-for="item in filteredShowcase" :key="item.url" class="premium-card group !p-0 overflow-hidden !bg-white border-none shadow-xl hover:!shadow-2xl transition-all duration-500 animate-reveal">
               <div class="h-48 bg-slate-100 relative overflow-hidden">
                  <img v-if="isImage(item.filename)" :src="item.url" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-200 bg-slate-900 opacity-20"><i class="fas fa-file-invoice text-4xl"></i></div>
                  <div class="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <a :href="item.url" target="_blank" class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-2xl transition-all hover:scale-110"><i class="fas fa-expand-alt"></i></a>
                  </div>
               </div>
               <div class="p-8 space-y-6">
                  <h4 class="text-lg font-black text-slate-900 tracking-tight truncate">{{ item.title }}</h4>
                  <div class="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div class="flex items-center gap-2">
                       <div class="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">{{ item.studentName?.charAt(0) }}</div>
                       <span class="text-[10px] font-black text-slate-500 uppercase tracking-tight">{{ item.studentName }}</span>
                    </div>
                    <a :href="item.url" target="_blank" class="text-[10px] font-black text-indigo-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Explore <i class="fas fa-arrow-right ml-1"></i></a>
                  </div>
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
       <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Ideation is the beginning of every revolution.</p>
    </footer>
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
  if (next === 'showcase' && !showcaseLoaded) loadShowcase();
}

function alertClaim(item) { window.alert(`Mission Bounty: Please contact the requester (${item.requester || 'Teacher'}) to claim this mission.`); }
function goCreate(item) { router.push(`/workspace?create=true&topic=${item.id}`); }
function isImage(f) { return /\.(png|jpe?g|webp)$/i.test(f || ''); }

async function loadTopics() {
  topicsLoading.value = true;
  try {
    const res = await fetch('/data/topics_data.json');
    const data = await res.json();
    topics.bounties = data.bounties || [];
    topics.teacher_topics = data.teacher_topics || [];
  } catch (err) { topics.bounties = []; topics.teacher_topics = []; }
  finally { topicsLoading.value = false; }
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
        title: item.title || item.project?.title || att.name,
        studentName: item.studentName || item.showcase?.details?.studentName || 'Explorer'
      }));
    });
    showcaseLoaded = true;
  } catch (err) {}
  finally { showcaseLoading.value = false; }
}

onMounted(() => { loadTopics(); });
</script>

<style scoped>
.glass-nav { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(226, 232, 240, 0.6); }
.premium-card { @apply rounded-[40px] border border-slate-200/60 p-8 shadow-sm; }
.animate-reveal { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes reveal { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.scroll-none::-webkit-scrollbar { display: none; }
</style>

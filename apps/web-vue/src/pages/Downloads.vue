<template>
  <div class="downloads-page text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 min-h-screen bg-[#f8fafc]">
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
                <span class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Resources Hub</span>
              </div>
            </RouterLink>
          </div>

          <div class="hidden lg:flex items-center space-x-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
            <RouterLink to="/knowledge" class="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all flex items-center gap-2">
              <i class="fas fa-book-reader text-xs opacity-70"></i>创新库
            </RouterLink>
            <RouterLink to="/competencies" class="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all flex items-center gap-2">
              <i class="fas fa-graduation-cap text-xs opacity-70"></i>学术指导
            </RouterLink>
            <RouterLink to="/projects" class="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all flex items-center gap-2">
              <i class="fas fa-layer-group text-xs opacity-70"></i>项目库
            </RouterLink>
            <RouterLink to="/downloads" class="px-5 py-2 rounded-xl text-sm font-bold bg-white text-indigo-600 shadow-sm transition-all flex items-center gap-2">
              <i class="fas fa-folder-open text-xs opacity-70"></i>资料中心
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
      <div class="max-w-7xl mx-auto px-6 lg:px-12 text-center lg:text-left">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm">
           <i class="fas fa-cloud-download-alt"></i> Download Center
        </div>
        <h1 class="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
          全栈科创<br><span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">数字资源库</span>
        </h1>
        <p class="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
          这里有你进行 PBL 探究所需的所有“弹药”：完整的讲义、开箱即用的代码库、专业的数据集，以及各领域的学术规范模板。
        </p>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-12 relative z-10">
      <!-- View 1: Course Gallery -->
      <div v-show="view === 'gallery'" id="view-gallery" class="space-y-24 animate-reveal">
        <section v-for="(group, gIdx) in groupedCourses" :key="gIdx" class="space-y-10">
          <div class="flex items-center gap-4">
             <div class="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
             <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ group.title }}</h2>
             <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest border-l border-slate-200 pl-4">{{ group.desc }}</span>
          </div>
          
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div v-for="course in group.items" :key="course.id" 
              class="premium-card group overflow-hidden cursor-pointer !p-0 !border-none !bg-white shadow-xl hover:!shadow-2xl transition-all duration-500"
              @click="openCourse(course.id)"
            >
              <div :class="course.bg" class="h-40 relative flex items-center justify-center overflow-hidden">
                 <div class="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px:16px] opacity-10"></div>
                 <i :class="course.icon" class="text-6xl text-white opacity-20 transform -rotate-12 transition-all group-hover:rotate-0 group-hover:scale-125 duration-700"></i>
                 <div class="absolute bottom-6 left-8 text-white">
                    <span class="text-[10px] font-black bg-white/20 px-2 py-1 rounded-lg backdrop-blur-md uppercase tracking-widest border border-white/10">{{ course.tag }}</span>
                    <h3 class="text-2xl font-black mt-2 tracking-tight">{{ course.title }}</h3>
                 </div>
              </div>
              <div class="p-8 space-y-6">
                <p class="text-sm font-medium text-slate-500 leading-relaxed min-h-[4rem]">{{ course.description }}</p>
                <div class="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div class="flex items-center gap-2 group-hover:translate-x-2 transition-transform duration-500">
                    <span class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">进入课程</span>
                    <i class="fas fa-arrow-right text-[10px] text-indigo-400"></i>
                  </div>
                  <div class="flex -space-x-2">
                    <div v-for="i in 3" :key="i" class="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shadow-sm">
                      <i class="fas fa-file text-[8px] text-slate-400"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- View 2: File Browser -->
      <div v-show="view === 'files'" id="view-files" class="animate-reveal">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div class="flex items-center gap-4">
            <button @click="showGallery" class="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm">
              <i class="fas fa-arrow-left"></i>
            </button>
            <div>
               <h3 class="text-2xl font-black text-slate-900 tracking-tight">{{ projectNames[currentProject] }}</h3>
               <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  <span class="cursor-pointer hover:text-indigo-600" @click="loadFiles(currentProject, '')">ROOT</span>
                  <template v-for="(part, idx) in breadcrumbParts" :key="part">
                    <span class="text-slate-200">/</span>
                    <span v-if="idx < breadcrumbParts.length - 1" class="cursor-pointer hover:text-indigo-600" @click="loadFiles(currentProject, breadcrumbPaths[idx])">{{ part }}</span>
                    <span v-else class="text-slate-900">{{ part }}</span>
                  </template>
               </div>
            </div>
          </div>
          
          <div class="relative w-full md:w-80 group">
             <i class="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"></i>
             <input v-model="searchTerm" type="text" placeholder="在课程资源中速搜..." 
               class="w-full pl-14 pr-6 py-4 rounded-[20px] bg-white border border-slate-100 shadow-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-sm font-medium">
          </div>
        </div>

        <div class="premium-card !bg-white min-h-[600px] shadow-2xl shadow-indigo-500/5 !p-10">
          <div v-if="loading" class="flex flex-col items-center justify-center py-40 text-slate-300">
            <i class="fas fa-spinner fa-spin text-4xl mb-6"></i>
            <span class="text-xs font-black uppercase tracking-widest">Synchronizing Library...</span>
          </div>

          <div v-else-if="filteredFiles.length === 0" class="flex flex-col items-center justify-center py-40 text-slate-300">
            <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <i class="fas fa-folder-open text-3xl"></i>
            </div>
            <span class="text-xs font-black uppercase tracking-widest">No Documents Found</span>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="file in filteredFiles" :key="file.path" 
               class="p-6 rounded-[28px] border border-slate-100 transition-all duration-300 group cursor-pointer relative overflow-hidden"
               :class="file.isDirectory ? 'bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-200' : 'bg-white hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-100'"
               @click="openFile(file)"
            >
               <div class="flex items-start justify-between mb-8">
                  <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3"
                    :class="file.isDirectory ? 'bg-white text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-400'">
                     <i class="fas text-xl" :class="resourceIcon(file)"></i>
                  </div>
                  <i v-if="!file.isDirectory" class="fas fa-arrow-down-long text-slate-200 opacity-0 group-hover:opacity-100 transition-all transform -translate-y-2 group-hover:translate-y-0"></i>
               </div>
               
               <div class="space-y-2">
                 <h4 class="text-sm font-black text-slate-900 truncate" :title="file.name">{{ file.name }}</h4>
                 <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ file.isDirectory ? 'Directory' : formatBytes(file.size) }}</span>
                    <span v-if="file.isDirectory" class="text-[9px] font-black text-indigo-500 bg-white px-2 py-0.5 rounded-full border border-indigo-50">EXPLORE</span>
                 </div>
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
          <span class="text-xs font-black text-slate-900 uppercase tracking-widest">HAI Tech Lab <span class="text-slate-300 mx-2">|</span> 2026 Resource Archive</span>
       </div>
       <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Igniting creativity through structured knowledge.</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiFetch } from '@/api/client';

const route = useRoute();
const router = useRouter();

const view = ref('gallery');
const currentProject = ref('');
const currentPath = ref('');
const allFiles = ref([]);
const loading = ref(false);
const searchTerm = ref('');

const projectNames = {
  common: '通识与学术方法论',
  project1: 'Vibe Coding 体感编程',
  project2: '产品设计与交互体验',
  project3: '全栈式 Web 开发',
  project4: 'AI 机器学习与神经网络',
  project5: '开源硬件与物联网系统',
  project6: '综合创业实战'
};

const groupedCourses = [
  {
    title: '学术基础 (Mandatory)',
    desc: 'The Methodology Foundation',
    items: [
      { id: 'common', tag: '学术 00', title: '通识与方法论', description: '学术写作、研究设计与创新工具包。', icon: 'fas fa-graduation-cap', bg: 'bg-slate-900' }
    ]
  },
  {
    title: '核心工程项目 (Tracks)',
    desc: 'Build Real Things',
    items: [
      { id: 'project1', tag: '工程 01', title: 'Vibe Coding', description: '基于视觉识别的交互游戏开发。', icon: 'fas fa-gamepad', bg: 'bg-blue-600' },
      { id: 'project2', tag: '设计 02', title: '产品设计', description: '从用户洞察到高保真原型实现。', icon: 'fas fa-palette', bg: 'bg-purple-600' },
      { id: 'project3', tag: '全栈 03', title: '全栈开发', description: '构建复杂的现代 Web 应用程序。', icon: 'fas fa-terminal', bg: 'bg-emerald-600' },
      { id: 'project4', tag: '算法 04', title: 'AI 机器学习', description: '深度学习入门与专属模型训练。', icon: 'fas fa-brain', bg: 'bg-rose-600' },
      { id: 'project5', tag: '硬件 05', title: '智能硬件', description: '传感器融合与 IOT 远程控制。', icon: 'fas fa-microchip', bg: 'bg-amber-500' }
    ]
  },
  {
    title: '终极结题 (Capstone)',
    desc: 'Launch Your Startup',
    items: [
      { id: 'project6', tag: '结题', title: '综合创业实战', description: '集成所学技能，孵化可落地的商业原型。', icon: 'fas fa-rocket', bg: 'bg-indigo-900' }
    ]
  }
];

const breadcrumbParts = computed(() => currentPath.value.split('/').filter(Boolean));
const breadcrumbPaths = computed(() => {
  const parts = breadcrumbParts.value;
  const paths = [];
  parts.reduce((acc, part) => {
    const next = acc ? `${acc}/${part}` : part;
    paths.push(next);
    return next;
  }, '');
  return paths;
});

const filteredFiles = computed(() => {
  if (!searchTerm.value) return allFiles.value;
  const keyword = searchTerm.value.toLowerCase();
  return allFiles.value.filter(file => file.name.toLowerCase().includes(keyword));
});

function showGallery() {
  view.value = 'gallery';
}

function openCourse(projectId) {
  // Option 1: Jump to file browser
  loadFiles(projectId, '');
  // Option 2: router.push({ path: '/study', query: { project: projectId } });
}

async function loadFiles(project, path) {
  if (!project) return;
  view.value = 'files';
  currentProject.value = project;
  currentPath.value = path || '';
  loading.value = true;
  try {
    const safePath = encodeURIComponent(currentPath.value);
    const res = await apiFetch(`/files/${project}?path=${safePath}`);
    const data = await res.json();
    allFiles.value = data.files || [];
  } catch (err) {
    console.error(err);
    allFiles.value = [];
  } finally {
    loading.value = false;
  }
}

function openFile(file) {
  if (file.isDirectory) {
    loadFiles(currentProject.value, file.path);
    return;
  }
  const url = `/api/v1/download/${currentProject.value}/${encodeURIComponent(file.path)}`;
  window.open(url, '_blank');
}

function resourceIcon(file) {
  if (file.isDirectory) return 'fa-folder';
  const ext = file.name.split('.').pop().toLowerCase();
  const map = {
    pdf: 'fa-file-pdf',
    doc: 'fa-file-word',
    docx: 'fa-file-word',
    ppt: 'fa-file-powerpoint',
    pptx: 'fa-file-powerpoint',
    xls: 'fa-file-excel',
    xlsx: 'fa-file-excel',
    zip: 'fa-file-archive',
    py: 'fa-file-code',
    js: 'fa-file-code',
    html: 'fa-file-code',
    png: 'fa-file-image',
    jpg: 'fa-file-image'
  };
  return map[ext] || 'fa-file';
}

function formatBytes(bytes) {
  if (!+bytes) return '0B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
}

onMounted(() => {
  if (route.query.project) {
    const path = route.query.path ? decodeURIComponent(route.query.path) : '';
    loadFiles(String(route.query.project), path);
  }
});
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
</style>

<template>
  <div class="min-h-screen bg-[#f8fafc] flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
    <!-- 背景层 -->
    <div class="fixed inset-0 pointer-events-none opacity-[0.4] interactive-grid"></div>

    <!-- 顶部导航 -->
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-8 py-4 flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
          <i class="fas fa-cube text-lg"></i>
        </div>
        <div>
          <div class="text-xs font-black text-slate-900 tracking-tight leading-none">{{ brandName }}</div>
          <div class="text-[9px] font-bold text-indigo-500 tracking-widest mt-1">{{ schoolName }} · 项目广场</div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink class="btn-secondary !py-2 !px-4 !rounded-xl !text-xs" to="/">返回门户</RouterLink>
        <RouterLink class="btn-primary !py-2 !px-4 !rounded-xl !text-xs !bg-slate-900 shadow-none border-none" to="/projects">学术项目库</RouterLink>
      </div>
    </nav>

    <main class="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-12 py-12 relative z-10">
      <!-- 头部介绍 -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b-2 border-slate-100 pb-12 mb-12">
        <div class="max-w-xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            {{ brandName }} · Project Hub
          </div>
          <h2 class="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-4">开启你的科创旅程</h2>
          <p class="text-lg text-slate-500 font-medium leading-relaxed">伟大的创新始于每一个小小的灵感快拍。在这里管理你的所有 AI 课题，或者立即开启一个新文件夹。</p>
        </div>
        
        <!-- 快速创建 -->
        <div class="flex items-center gap-3 bg-white p-2 rounded-[24px] border border-slate-200 shadow-xl shadow-slate-200/50 w-full lg:w-auto">
          <div class="flex-1 lg:w-64 px-4 overflow-hidden">
             <input
              :value="quickCreateTitle"
              class="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-900 placeholder-slate-300"
              placeholder="命名你的新点子..."
              @input="$emit('update:quickCreateTitle', $event.target.value)"
              @keydown.enter="$emit('create-project')"
            />
          </div>
          <button 
            class="btn-primary !px-6 !py-3 !rounded-[18px] !text-xs flex items-center gap-2" 
            :disabled="creatingProject" 
            @click="$emit('create-project')"
          >
            <i class="fas" :class="creatingProject ? 'fa-circle-notch animate-spin' : 'fa-plus-circle'"></i> 
            {{ creatingProject ? '创建中' : '一键开启' }}
          </button>
        </div>
      </div>

      <div v-if="quickCreateError" class="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold animate-pulse">{{ quickCreateError }}</div>

      <!-- 工具栏 -->
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="flex-1 md:w-80 flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 focus-within:border-indigo-500 transition-all shadow-sm">
            <i class="fas fa-search text-slate-300"></i>
            <input 
              :value="plazaKeyword" 
              class="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-300"
              placeholder="搜索项目关键词或标签..." 
              @input="$emit('update:plazaKeyword', $event.target.value)" 
            />
          </div>
        </div>
        
        <div class="flex items-center gap-3 w-full md:w-auto">
          <select 
            :value="plazaStatus" 
            class="flex-1 md:w-40 bg-white px-4 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 outline-none hover:border-indigo-300 transition-colors"
            @change="$emit('update:plazaStatus', $event.target.value)"
          >
            <option value="">全部状态</option>
            <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <select 
            :value="plazaSort" 
            class="flex-1 md:w-40 bg-white px-4 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 outline-none hover:border-indigo-300 transition-colors"
            @change="$emit('update:plazaSort', $event.target.value)"
          >
            <option value="updated_desc">最近活跃</option>
            <option value="created_desc">最早创建</option>
            <option value="title_asc">项目名称</option>
          </select>
        </div>
      </div>

      <!-- 主网格 -->
      <div v-if="projectsLoading" class="py-20 text-center">
        <div class="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div class="text-sm font-black text-slate-400 uppercase tracking-widest">正在检索你的云端仓库...</div>
      </div>

      <div v-else class="space-y-12 pb-20">
        <!-- 最近项目 -->
        <div v-if="showRecent && recentProjects.length" class="animate-reveal">
          <div class="flex items-center gap-4 mb-8">
             <div class="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
             <h3 class="text-base font-black text-slate-900 uppercase tracking-widest">最近活跃课题</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <button
              v-for="(project, idx) in recentProjects"
              :key="`recent-${project.id}`"
              class="premium-card !p-0 overflow-hidden flex flex-col group text-left animate-reveal"
              :class="[
                String(project.id) === String(lastVisitedProjectId) ? '!border-indigo-600 !ring-4 !ring-indigo-50' : '',
                `stagger-${idx + 1}`
              ]"
              @click="$emit('switch-project', project.id)"
            >
              <div class="p-8 pb-6">
                <div class="flex justify-between items-start mb-6">
                  <div class="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-2xl group-hover:shadow-indigo-500/30 transition-all duration-700">
                    <i class="fas fa-folder-open text-xl"></i>
                  </div>
                  <span class="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
                    {{ projectStatusLabel(project.status) }}
                  </span>
                </div>
                <h4 class="text-xl font-black text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{{ project.title || '未命名项目' }}</h4>
                <p class="text-sm text-slate-500 font-medium line-clamp-2 h-10 leading-relaxed mb-6">{{ project.summary || '暂无课题简介，点击进入后开启学术规划。' }}</p>
              </div>
              <div class="mt-auto p-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span class="flex items-center gap-2"><i class="far fa-clock"></i> {{ formatDate(project.updated_at || project.created_at) }}</span>
                <span class="text-indigo-600 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 translate-x-4 group-hover:translate-x-0">
                  进入项目 <i class="fas fa-arrow-right"></i>
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- 所有项目 -->
        <div>
          <div v-if="showRecent && recentProjects.length" class="flex items-center gap-4 mb-6 pt-6">
             <div class="w-1.5 h-6 bg-slate-200 rounded-full"></div>
             <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest">所有存档</h3>
          </div>
          
          <div v-if="filteredProjects.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              v-for="project in filteredProjects"
              :key="project.id"
              class="premium-card !p-0 overflow-hidden flex flex-col group text-left !bg-white border-2 border-slate-50 hover:border-indigo-200 transition-all duration-300"
              @click="$emit('switch-project', project.id)"
            >
              <div class="p-8 pb-4">
                <div class="flex justify-between items-start mb-4">
                  <div class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                    <i class="fas fa-archive text-base"></i>
                  </div>
                  <span class="px-3 py-1 rounded-lg bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-wider">
                    {{ projectStatusLabel(project.status) }}
                  </span>
                </div>
                <h4 class="text-lg font-black text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{{ project.title || '未命名项目' }}</h4>
                <p class="text-xs text-slate-500 font-medium line-clamp-2 h-8 leading-relaxed mb-4">{{ project.summary || '暂无项目简介' }}</p>
              </div>
              <div class="mt-auto p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span class="flex items-center gap-2"><i class="far fa-calendar"></i> {{ formatDate(project.created_at) }}</span>
                <span class="group-hover:text-indigo-600 transition-colors">查看项目 <i class="fas fa-chevron-right ml-1"></i></span>
              </div>
            </button>
          </div>
          
          <div v-else class="py-24 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 shadow-sm animate-reveal">
            <div class="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-slate-200 group-hover:scale-110 transition-transform duration-700">
              <i class="fas fa-search-plus text-4xl"></i>
            </div>
            <h4 class="text-xl font-black text-slate-900 mb-3 tracking-tight">未找到匹配的项目</h4>
            <p class="text-slate-400 font-medium text-sm max-w-sm mx-auto leading-relaxed">没关系，所有伟大的点子最初都只是空白。换个搜索词，或者在上方的输入框立即创建一个新起点。</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { brandName, schoolName } from '@/constants/brand';

defineProps({
  projects: { type: Array, default: () => [] },
  projectsLoading: { type: Boolean, default: false },
  statusOptions: { type: Array, default: () => [] },
  plazaKeyword: { type: String, default: '' },
  plazaStatus: { type: String, default: '' },
  plazaSort: { type: String, default: 'updated_desc' },
  quickCreateTitle: { type: String, default: '' },
  creatingProject: { type: Boolean, default: false },
  quickCreateError: { type: String, default: '' },
  showRecent: { type: Boolean, default: false },
  recentProjects: { type: Array, default: () => [] },
  filteredProjects: { type: Array, default: () => [] },
  lastVisitedProjectId: { type: [String, Number], default: '' },
  projectStatusLabel: { type: Function, required: true },
  formatDate: { type: Function, required: true }
});

defineEmits([
  'update:quickCreateTitle',
  'update:plazaKeyword',
  'update:plazaStatus',
  'update:plazaSort',
  'create-project',
  'switch-project'
]);
</script>

<style scoped>
/* Tailwind handles the bulk. Keep local overrides minimal. */
</style>

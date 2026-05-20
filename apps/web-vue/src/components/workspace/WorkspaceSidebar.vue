<template>
  <aside class="sidebar selection:bg-indigo-100 selection:text-indigo-900 border-r border-slate-200/60 bg-white flex flex-col z-30 overflow-hidden shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
    <div class="h-[var(--header-h)] flex items-center justify-between px-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <i class="fas fa-cube text-xs"></i>
        </div>
        <div class="flex flex-col">
          <span class="text-sm font-black text-slate-900 leading-none">科创工作台</span>
          <span class="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Next step first</span>
        </div>
      </div>
      <RouterLink to="/" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-300">
        <i class="fas fa-home text-sm"></i>
      </RouterLink>
    </div>

    <!--项目切换器-->
    <div class="p-4 relative">
      <button 
        class="w-full flex items-center justify-between gap-3 p-3.5 rounded-[18px] bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group"
        @click="$emit('toggle-project-menu')"
      >
        <div class="flex-1 text-left min-w-0">
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">当前项目</div>
          <div class="text-sm font-bold text-slate-900 truncate">{{ projectTitle }}</div>
        </div>
        <div class="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
          <i class="fas fa-sort text-[10px]"></i>
        </div>
      </button>

      <!-- 弹出菜单 -->
      <transition 
        enter-active-class="transition duration-200 ease-out" 
        enter-from-class="transform scale-95 opacity-0 -translate-y-2"
        enter-to-class="transform scale-100 opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100 translate-y-0"
        leave-to-class="transform scale-95 opacity-0 -translate-y-2"
      >
        <div v-if="showProjectMenu" class="absolute top-[calc(100%-8px)] left-4 right-4 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-2 overflow-hidden backdrop-blur-xl">
          <div class="max-h-64 overflow-y-auto custom-scrollbar p-1 flex flex-col gap-1">
            <div v-if="!projects.length" class="py-4 text-center text-xs font-bold text-slate-400">暂无活跃项目</div>
            <button
              v-for="project in projects"
              :key="project.id"
              class="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group"
              :class="String(project.id) === String(projectId) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'"
              @click="$emit('switch-project', project.id)"
            >
              <div class="w-1.5 h-1.5 rounded-full" :class="String(project.id) === String(projectId) ? 'bg-indigo-600' : 'bg-transparent'"></div>
              <span class="text-xs font-bold truncate flex-1">{{ project.title }}</span>
              <i v-if="String(project.id) === String(projectId)" class="fas fa-check-circle text-[10px]"></i>
            </button>
          </div>
          <div class="mt-2 p-1 border-t border-slate-100">
            <RouterLink to="/projects" class="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-bold text-[11px] uppercase tracking-wider">
              <i class="fas fa-plus-circle"></i> 去项目广场
            </RouterLink>
          </div>
        </div>
      </transition>
    </div>

    <!-- 导航菜单 -->
    <nav class="flex-1 overflow-y-auto custom-scrollbar px-4 pb-10">
      <div v-for="group in navStructure" :key="group.id" class="mb-4">
        <div 
          class="flex items-start justify-between gap-2 px-3 py-2 cursor-pointer group select-none"
          @click="$emit('toggle-group', group.id)"
        >
          <div class="min-w-0">
            <span class="block text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{{ group.title }}</span>
            <span v-if="group.description" class="mt-1 block text-[10px] font-bold text-slate-300 leading-snug normal-case tracking-normal">{{ group.description }}</span>
          </div>
          <i class="fas fa-chevron-right text-[8px] text-slate-300 transition-transform duration-300 mt-1" :class="{ 'rotate-90': !collapsedGroups[group.id] }"></i>
        </div>
        
        <transition 
          enter-active-class="transition-all duration-300 ease-out overflow-hidden" 
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-[500px] opacity-100"
          leave-active-class="transition-all duration-200 ease-in overflow-hidden"
          leave-from-class="max-h-[500px] opacity-100"
          leave-to-class="max-h-0 opacity-0"
        >
          <div v-show="!collapsedGroups[group.id]" class="flex flex-col gap-1 mt-1">
            <div
              v-for="item in group.items"
              :key="item.key"
              class="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group"
              :class="isItemActive(item) 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-500 hover:bg-indigo-50/50 hover:text-indigo-600'"
              @click="$emit('nav-click', item)"
            >
              <i :class="item.icon" class="text-base w-5 text-center transition-transform group-hover:scale-110"></i>
              <span class="text-xs font-bold flex-1">{{ item.label }}</span>
              <span v-if="item.badge" class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-colors shadow-sm"
                :class="getBadgeClass(item.badge)">
                {{ item.badge.label }}
              </span>
            </div>
          </div>
        </transition>
      </div>
    </nav>

    <!-- 底部个人信息 -->
    <div class="mt-auto p-4 border-t border-slate-100 bg-slate-50/30">
      <div class="flex items-center gap-3 p-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <img class="w-10 h-10 rounded-xl object-cover border-2 border-slate-50 shadow-inner" :src="avatarUrl" alt="avatar" />
        <div class="flex-1 min-w-0">
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">已登录为</div>
          <div class="text-sm font-bold text-slate-900 truncate">{{ currentUser?.name || '学生' }}</div>
        </div>
        <button 
          class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 group"
          @click="$emit('logout')"
        >
          <i class="fas fa-sign-out-alt text-xs transition-transform group-hover:-translate-x-0.5"></i>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  projectId: { type: [String, Number], default: '' },
  projectTitle: { type: String, default: '未选择项目' },
  projects: { type: Array, default: () => [] },
  showProjectMenu: { type: Boolean, default: false },
  navStructure: { type: Array, default: () => [] },
  collapsedGroups: { type: Object, default: () => ({}) },
  currentUser: { type: Object, default: null },
  viewMode: { type: String, default: 'tool' },
  currentTool: { type: String, default: 'inception' },
  activeStage: { type: String, default: 'proposal' }
});

defineEmits(['toggle-project-menu', 'switch-project', 'toggle-group', 'nav-click', 'logout']);

const avatarUrl = computed(() => {
  if (!props.currentUser) return '';
  return props.currentUser.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${props.currentUser.id || 'guest'}`;
});

function isItemActive(item) {
  if (item.action === 'tool') {
    return props.viewMode === 'tool' && props.currentTool === item.value;
  }
  if (item.action === 'stage') {
    return props.viewMode === 'stage' && props.activeStage === item.value;
  }
  return false;
}

function getBadgeClass(badge) {
  const map = {
    'badge-success': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'badge-danger': 'bg-rose-50 text-rose-600 border-rose-100',
    'badge-info': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'badge-warn': 'bg-amber-50 text-amber-600 border-amber-100'
  };
  return map[badge.tone] || 'bg-slate-50 text-slate-500 border-slate-100';
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>

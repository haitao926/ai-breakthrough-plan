<template>
  <div class="teacher-shell">
    <!-- Top Global Nav -->
    <nav class="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div class="app-topbar-shell flex items-center justify-between gap-4 px-6 py-3">
        <div class="flex items-center gap-4">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
            <i class="fas fa-chalkboard-teacher text-sm"></i>
          </div>
          <div>
            <div class="text-sm font-black text-slate-900 leading-none">{{ brandName }}</div>
            <div class="mt-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">{{ schoolName }} · 教师台</div>
          </div>
        </div>
        
        <div class="flex flex-1 items-center justify-center gap-1 sm:gap-2">
          <RouterLink to="/" class="nav-link">门户</RouterLink>
          <RouterLink to="/teacher/monitor" class="nav-link">大屏</RouterLink>
          <RouterLink v-if="currentUser?.role === 'teacher'" to="/teacher/students" class="nav-link">学生</RouterLink>
          <RouterLink to="/teacher/assessment" class="nav-link">考评</RouterLink>
          <div class="mx-2 h-4 w-px bg-slate-200"></div>
          <button class="nav-link font-bold" :class="{ 'text-teal-700 bg-teal-50': activeModule === 'projects' }" @click="$emit('set-module', 'projects')">项目干预</button>
          <button class="nav-link font-bold" :class="{ 'text-teal-700 bg-teal-50': activeModule === 'uploads' }" @click="$emit('set-module', 'uploads')">资源发布</button>
        </div>

        <div class="flex items-center gap-3">
          <button class="icon-btn" aria-label="刷新数据" @click="$emit('refresh')" title="刷新数据">
            <i class="fas fa-sync-alt text-slate-400 hover:text-teal-600 transition-colors"></i>
          </button>
          <span class="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 sm:inline-flex">{{ currentUser?.name || '教师' }}</span>
          <button class="icon-btn text-slate-400 hover:text-red-600 transition-colors" aria-label="退出登录" @click="$emit('logout')" title="退出">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </nav>

    <!-- Stats Ribbon -->
    <header class="bg-white border-b border-slate-200 pb-4 pt-4 mb-6">
      <div class="app-page-shell app-page-shell--wide">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-xl font-black text-slate-900">工作台预览</h1>
            <p class="text-xs font-medium text-slate-500 mt-1">优先处理学生项目队列，随后发布教学资源。</p>
          </div>
          
          <div class="flex flex-wrap items-center gap-3">
            <button class="stat-badge group" @click="$emit('set-module', 'projects', { queue: 'project_review' })">
              <span class="stat-label">待干预项目</span>
              <span class="stat-val group-hover:bg-amber-100 group-hover:text-amber-800" :class="{'bg-amber-100 text-amber-800': interventionCount > 0}">{{ interventionCount }}</span>
            </button>
            <button class="stat-badge group" @click="$emit('set-module', 'projects', { queue: 'stage_review' })">
              <span class="stat-label">阶段待审</span>
              <span class="stat-val group-hover:bg-blue-100 group-hover:text-blue-800" :class="{'bg-blue-100 text-blue-800': stageReviewCount > 0}">{{ stageReviewCount }}</span>
            </button>
            <button class="stat-badge group" @click="$emit('set-module', 'projects', { queue: 'resource_pending' })">
              <span class="stat-label">资源待批</span>
              <span class="stat-val group-hover:bg-purple-100 group-hover:text-purple-800" :class="{'bg-purple-100 text-purple-800': resourceQueueCount > 0}">{{ resourceQueueCount }}</span>
            </button>
            <div class="h-6 w-px bg-slate-200 mx-1"></div>
            <button class="stat-badge group" @click="$emit('set-module', 'uploads', { kind: 'course' })">
              <span class="stat-label">待发布草稿</span>
              <span class="stat-val group-hover:bg-slate-200 group-hover:text-slate-800">{{ publishCount }}</span>
            </button>
          </div>
        </div>

        <div v-if="showQueueCelebration" class="mt-4 flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-2 text-sm text-teal-800 border border-teal-100/50">
          <i class="fas fa-check-circle text-teal-500"></i>
          <strong>今日教师队列已清空</strong>
          <span class="text-teal-600/80">干预、审批资源请求皆已处理完毕。</span>
        </div>
      </div>
    </header>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';

defineProps({
  brandName: { type: String, default: '' },
  schoolName: { type: String, default: '' },
  currentUser: { type: Object, default: null },
  activeModule: { type: String, default: 'projects' },
  interventionCount: { type: Number, default: 0 },
  stageReviewCount: { type: Number, default: 0 },
  resourceQueueCount: { type: Number, default: 0 },
  pendingCourseCount: { type: Number, default: 0 },
  pendingProjectTopicCount: { type: Number, default: 0 },
  pendingCompetitionCount: { type: Number, default: 0 },
  publishCount: { type: Number, default: 0 },
  showQueueCelebration: { type: Boolean, default: false }
});

defineEmits(['refresh', 'set-module', 'logout']);
</script>

<style scoped>
.nav-link {
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.icon-btn {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 999px;
  background: transparent;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: #f1f5f9;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 4px 4px 4px 12px;
  transition: all 0.2s ease;
}

.stat-badge:hover {
  border-color: #cbd5e1;
  background: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
}

.stat-val {
  display: grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
  transition: all 0.2s ease;
}
</style>


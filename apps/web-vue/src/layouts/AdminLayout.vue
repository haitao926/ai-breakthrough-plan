<template>
  <div class="admin-layout min-h-dvh bg-slate-950 text-slate-100">
    <header class="border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div class="app-page-shell app-page-shell--wide flex flex-col gap-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-3">
          <p class="text-[11px] font-black uppercase tracking-[0.24em] text-teal-300">{{ brandName }}</p>
          <div>
            <h1 class="text-3xl font-black text-white">管理后台</h1>
            <p class="mt-2 max-w-2xl text-sm font-semibold leading-7 text-slate-400">
              平台级账号、班级与教师分工在这里统一查看。教师评审与资源发布已独立到教师工作台。
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <RouterLink to="/teacher" class="admin-link">
            <i class="fas fa-chalkboard-teacher"></i>
            教师工作台
          </RouterLink>
          <span class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300">
            {{ currentUser?.name || '管理员' }}
          </span>
          <button class="admin-link admin-link--ghost" type="button" @click="logout">
            <i class="fas fa-sign-out-alt"></i>
            退出
          </button>
        </div>
      </div>

      <div class="app-page-shell app-page-shell--wide flex flex-wrap gap-3 pb-5">
        <RouterLink to="/admin" class="admin-tab" :class="{ active: route.path === '/admin' }">总览</RouterLink>
        <RouterLink to="/admin/teachers" class="admin-tab" :class="{ active: route.path.startsWith('/admin/teachers') }">教师管理</RouterLink>
        <RouterLink to="/admin/students" class="admin-tab" :class="{ active: route.path.startsWith('/admin/students') }">学生账号</RouterLink>
      </div>
    </header>

    <main class="app-page-shell app-page-shell--wide pb-14 pt-8">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { brandName } from '@/constants/brand';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { user: currentUser } = storeToRefs(authStore);

function logout() {
  authStore.logout();
  router.replace('/login');
}
</script>

<style scoped>
.admin-link,
.admin-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 800;
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.admin-link {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  padding: 0.75rem 1rem;
  color: #e2e8f0;
}

.admin-link:hover {
  transform: translateY(-1px);
  border-color: rgba(45, 212, 191, 0.3);
  background: rgba(45, 212, 191, 0.12);
  color: #f8fafc;
}

.admin-link--ghost {
  cursor: pointer;
}

.admin-tab {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 0.75rem 1.1rem;
  color: #94a3b8;
}

.admin-tab:hover,
.admin-tab.active {
  border-color: rgba(45, 212, 191, 0.28);
  background: rgba(45, 212, 191, 0.14);
  color: #f0fdfa;
}
</style>

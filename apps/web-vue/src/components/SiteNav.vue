<template>
  <nav class="fixed top-0 w-full z-50 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl shadow-[0_1px_2px_rgba(15,23,42,0.03)] pt-[env(safe-area-inset-top,0px)]">
    <div class="max-w-7xl mx-auto min-h-[72px] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 md:gap-6 flex-wrap md:flex-nowrap relative">
      
      <RouterLink to="/" class="flex-shrink-0 flex items-center gap-3 text-slate-900 no-underline group" @click="closeNav">
        <span class="w-10 h-10 rounded-full flex items-center justify-center bg-white overflow-hidden shadow-sm transition-all duration-200 group-hover:-translate-y-[1px] group-hover:shadow-md border border-slate-100">
          <img src="/assets/branding/site-logo.png" alt="Logo" class="w-full h-full object-contain block" />
        </span>
        <span class="text-[1.05rem] font-bold tracking-tight whitespace-nowrap hidden sm:block md:block">{{ brandName }}</span>
      </RouterLink>

      <button
        type="button"
        class="md:hidden flex items-center justify-center w-11 h-11 border border-slate-200 rounded-xl bg-white text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900"
        :aria-expanded="navOpen ? 'true' : 'false'"
        aria-controls="public-nav-links"
        aria-label="打开导航菜单"
        @click="navOpen = !navOpen"
      >
        <i class="fas" :class="navOpen ? 'fa-xmark' : 'fa-bars'"></i>
      </button>

      <div 
        id="public-nav-links" 
        class="flex-1 w-full md:w-auto md:flex items-center justify-center gap-2"
        :class="navOpen ? 'flex flex-col mt-2 pt-2 border-t border-slate-100 pb-4 order-last col-span-full absolute top-[72px] left-0 w-full bg-white/95 backdrop-blur-xl px-4 shadow-md' : 'hidden md:flex'"
      >
        <RouterLink :class="['inline-flex items-center justify-start md:justify-center w-full md:w-auto min-h-[44px] px-3.5 rounded-full text-[0.9rem] font-semibold transition-colors whitespace-nowrap relative', active === 'competitions' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900']" to="/competitions" @click="closeNav">竞赛活动</RouterLink>
        <RouterLink :class="['inline-flex items-center justify-start md:justify-center w-full md:w-auto min-h-[44px] px-3.5 rounded-full text-[0.9rem] font-semibold transition-colors whitespace-nowrap relative', active === 'knowledge' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900']" to="/knowledge" @click="closeNav">创新知识库</RouterLink>
        <RouterLink :class="['inline-flex items-center justify-start md:justify-center w-full md:w-auto min-h-[44px] px-3.5 rounded-full text-[0.9rem] font-semibold transition-colors whitespace-nowrap relative', active === 'projects' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900']" to="/projects" @click="closeNav">项目库</RouterLink>
        <RouterLink :class="['inline-flex items-center justify-start md:justify-center w-full md:w-auto min-h-[44px] px-3.5 rounded-full text-[0.9rem] font-semibold transition-colors whitespace-nowrap relative', active === 'courses' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900']" to="/courses" @click="closeNav">课程库</RouterLink>
        <RouterLink v-if="!isAuthenticated && navOpen" class="inline-flex items-center justify-start w-full min-h-[44px] px-3.5 rounded-xl text-[0.9rem] font-semibold text-slate-600 transition-colors whitespace-nowrap md:hidden" to="/login" @click="closeNav">登录</RouterLink>
      </div>

      <div class="flex items-center justify-end gap-3 shrink-0 ml-auto md:ml-0 md:order-last" :class="{ 'absolute right-[70px] top-[14px]': navOpen }">
        <template v-if="isAuthenticated && user">
          <div ref="menuRoot" class="relative">
            <button
              type="button"
              class="inline-flex items-center gap-2.5 min-h-[44px] p-1 pr-3 border border-slate-200/80 rounded-2xl bg-white/95 transition-all hover:border-teal-500/25 hover:shadow-sm"
              :aria-expanded="menuOpen ? 'true' : 'false'"
              aria-haspopup="menu"
              @click.stop="toggleMenu"
            >
              <img :src="avatarUrl" alt="" class="w-8 h-8 rounded-full border-[1.5px] border-slate-200 shrink-0 bg-white transition-all group-hover:scale-105 group-hover:border-teal-500" />
              <div class="hidden sm:flex flex-col items-start min-w-0">
                <strong class="text-slate-900 text-[0.84rem] font-bold leading-tight">{{ user.name }}</strong>
                <span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[0.65rem] font-bold leading-none mt-1">{{ roleLabel }}</span>
              </div>
              <i class="fas fa-chevron-down text-slate-400 text-xs transition-transform" :class="{ 'rotate-180': menuOpen }"></i>
            </button>

            <div v-if="menuOpen" class="absolute top-[calc(100%+10px)] right-0 w-[300px] max-w-[calc(100vw-28px)] border border-slate-200/80 rounded-2xl bg-white/95 shadow-xl p-3.5 z-50">
              <div class="grid grid-cols-[auto_1fr] gap-3 items-center px-1 pb-3.5 border-b border-slate-100">
                <img :src="avatarUrl" alt="" class="w-11 h-11 rounded-xl border border-slate-200" />
                <div>
                  <strong class="block text-slate-900 text-[0.92rem] font-bold">{{ user.name }}</strong>
                  <p class="mt-0.5 text-slate-500 text-[0.78rem] font-medium">{{ user.email }}</p>
                  <span class="inline-flex items-center justify-center px-2 py-1 rounded-md bg-teal-50 text-teal-600 text-[0.72rem] font-bold leading-none mt-1.5">{{ roleLabel }}</span>
                </div>
              </div>

              <div class="grid gap-2 pt-3">
                <RouterLink class="inline-flex items-center justify-center gap-2.5 min-h-[44px] rounded-xl font-bold text-[0.84rem] transition-colors bg-teal-600 text-white hover:bg-teal-700" :to="primaryWorkspaceTarget" @click="closeMenu">
                  <i class="fas" :class="primaryWorkspaceIcon"></i>
                  {{ primaryWorkspaceLabel }}
                </RouterLink>

                <RouterLink
                  v-if="secondaryWorkspaceTarget"
                  class="inline-flex items-center justify-start px-3.5 gap-2.5 min-h-[44px] rounded-xl font-bold text-[0.84rem] transition-colors bg-white border border-slate-200 text-slate-600 hover:border-teal-200 hover:text-teal-600"
                  :to="secondaryWorkspaceTarget"
                  @click="closeMenu"
                >
                  <i class="fas fa-arrow-right-arrow-left"></i>
                  {{ secondaryWorkspaceLabel }}
                </RouterLink>

                <RouterLink class="inline-flex items-center justify-start px-3.5 gap-2.5 min-h-[44px] rounded-xl font-bold text-[0.84rem] transition-colors bg-white border border-slate-200 text-slate-600 hover:border-teal-200 hover:text-teal-600" to="/account" @click="closeMenu">
                  <i class="fas fa-id-card"></i>
                  个人中心
                </RouterLink>

                <button type="button" class="inline-flex items-center justify-start px-3.5 gap-2.5 min-h-[44px] rounded-xl font-bold text-[0.84rem] transition-colors bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300" @click="handleLogout">
                  <i class="fas fa-sign-out-alt"></i>
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <RouterLink class="hidden md:inline-flex items-center min-h-[44px] px-3 text-slate-600 font-semibold text-[0.9rem] hover:text-slate-900" to="/login" @click="closeNav">登录</RouterLink>
          <RouterLink class="inline-flex items-center justify-center min-h-[44px] px-4 rounded-full bg-teal-700 text-white font-bold text-[0.88rem] hover:bg-teal-800 whitespace-nowrap shadow-[0_16px_28px_-20px_rgba(15,118,110,0.55)]" to="/register" @click="closeNav">开始使用</RouterLink>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { brandName } from '@/constants/brand';
import {
  getPrimaryWorkspaceIcon,
  getPrimaryWorkspaceLabel,
  getPrimaryWorkspaceTarget,
  getRoleLabel,
  getSecondaryWorkspaceLabel,
  getSecondaryWorkspaceTarget
} from '@/utils/userRole';

const props = defineProps({
  active: { type: String, default: '' }
});

const router = useRouter();
const authStore = useAuthStore();
authStore.hydrate();
const { user, isAuthenticated } = storeToRefs(authStore);
const menuOpen = ref(false);
const navOpen = ref(false);
const menuRoot = ref(null);

const active = computed(() => props.active);
const avatarUrl = computed(() => {
  if (!user.value) return '';
  return user.value.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.value.id || user.value.email || 'user'}`;
});
const roleLabel = computed(() => getRoleLabel(user.value?.role));
const primaryWorkspaceIcon = computed(() => getPrimaryWorkspaceIcon(user.value));
const primaryWorkspaceTarget = computed(() => getPrimaryWorkspaceTarget(user.value));
const primaryWorkspaceLabel = computed(() => getPrimaryWorkspaceLabel(user.value));
const secondaryWorkspaceTarget = computed(() => getSecondaryWorkspaceTarget(user.value));
const secondaryWorkspaceLabel = computed(() => getSecondaryWorkspaceLabel(user.value));

function closeMenu() {
  menuOpen.value = false;
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function handleDocumentClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!menuRoot.value?.contains(target)) {
    closeMenu();
  }
}

function closeNav() {
  navOpen.value = false;
}

function handleLogout() {
  authStore.logout();
  closeMenu();
  router.replace('/login');
}

onMounted(() => {
  window.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', handleDocumentClick);
});
</script>

<template>
  <nav class="public-nav">
    <div class="public-nav-inner">
      <RouterLink to="/" class="public-brand">
        <span class="public-brand-badge">
          <i class="fas fa-cube"></i>
        </span>
        <span class="public-brand-copy">{{ brandName }}</span>
      </RouterLink>

      <div class="public-nav-links">
        <RouterLink :class="{ active: active === 'competitions' }" to="/competitions">竞赛活动</RouterLink>
        <RouterLink :class="{ active: active === 'knowledge' }" to="/knowledge">创新知识库</RouterLink>
        <RouterLink :class="{ active: active === 'projects' }" to="/projects">项目库</RouterLink>
        <RouterLink :class="{ active: active === 'downloads' }" to="/downloads">课程库</RouterLink>
        <RouterLink :class="{ active: active === 'showcase' }" to="/showcase">项目展示台</RouterLink>
      </div>

      <div class="public-nav-actions">
        <template v-if="isAuthenticated && user">
          <div ref="menuRoot" class="public-account">
            <button
              type="button"
              class="public-account-trigger"
              :aria-expanded="menuOpen ? 'true' : 'false'"
              aria-haspopup="menu"
              @click.stop="toggleMenu"
            >
              <img :src="avatarUrl" alt="" class="public-avatar" />
              <div class="public-account-copy">
                <strong>{{ user.name }}</strong>
                <span>{{ roleLabel }}</span>
              </div>
              <i class="fas fa-chevron-down public-account-chevron" :class="{ 'is-open': menuOpen }"></i>
            </button>

            <div v-if="menuOpen" class="public-account-menu">
              <div class="public-account-summary">
                <img :src="avatarUrl" alt="" class="public-account-summary-avatar" />
                <div>
                  <strong>{{ user.name }}</strong>
                  <p>{{ user.email }}</p>
                  <span>{{ roleLabel }}</span>
                </div>
              </div>

              <div class="public-account-links">
                <RouterLink class="public-account-primary" :to="primaryWorkspaceTarget" @click="closeMenu">
                  <i class="fas" :class="isTeacher ? 'fa-chalkboard-teacher' : 'fa-rocket'"></i>
                  {{ primaryWorkspaceLabel }}
                </RouterLink>

                <RouterLink
                  v-if="secondaryWorkspaceTarget"
                  class="public-account-link"
                  :to="secondaryWorkspaceTarget"
                  @click="closeMenu"
                >
                  <i class="fas fa-arrow-right-arrow-left"></i>
                  {{ secondaryWorkspaceLabel }}
                </RouterLink>

                <RouterLink class="public-account-link" to="/account" @click="closeMenu">
                  <i class="fas fa-id-card"></i>
                  个人中心
                </RouterLink>

                <button type="button" class="public-account-link public-account-link--danger" @click="handleLogout">
                  <i class="fas fa-sign-out-alt"></i>
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <RouterLink class="public-link" to="/login">登录</RouterLink>
          <RouterLink class="public-primary" to="/register">开始使用</RouterLink>
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
import { getPrimaryWorkspaceLabel, getPrimaryWorkspaceTarget, getRoleLabel, isTeacherLike } from '@/utils/userRole';

const props = defineProps({
  active: { type: String, default: '' }
});

const router = useRouter();
const authStore = useAuthStore();
authStore.hydrate();
const { user, isAuthenticated } = storeToRefs(authStore);
const menuOpen = ref(false);
const menuRoot = ref(null);

const active = computed(() => props.active);
const avatarUrl = computed(() => {
  if (!user.value) return '';
  return user.value.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.value.id || user.value.email || 'user'}`;
});
const isTeacher = computed(() => isTeacherLike(user.value?.role));
const roleLabel = computed(() => getRoleLabel(user.value?.role));
const primaryWorkspaceTarget = computed(() => getPrimaryWorkspaceTarget(user.value));
const primaryWorkspaceLabel = computed(() => getPrimaryWorkspaceLabel(user.value));
const secondaryWorkspaceTarget = computed(() => (isTeacher.value ? '/workspace' : ''));
const secondaryWorkspaceLabel = computed(() => (isTeacher.value ? '进入学生工作台' : ''));

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

<style scoped>
.public-nav {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 50;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
}

.public-nav-inner {
  max-width: 1320px;
  margin: 0 auto;
  min-height: 68px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.public-brand {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #111827;
  text-decoration: none;
}

.public-brand-badge {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
  transition: all 0.3s ease;
}

.public-brand:hover .public-brand-badge {
  transform: rotate(10deg) scale(1.1);
  box-shadow: 0 8px 25px rgba(79, 70, 229, 0.5);
}

.public-brand-copy {
  font-size: 1.08rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.public-nav-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  flex: 1;
  overflow-x: auto;
  scrollbar-width: none;
}

.public-nav-links::-webkit-scrollbar {
  display: none;
}

.public-nav-links a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 11px;
  border-radius: 10px;
  color: #475569;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 700;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
  position: relative;
}

.public-nav-links a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: #4f46e5;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateX(-50%);
  border-radius: 99px;
}

.public-nav-links a:hover::after,
.public-nav-links a.active::after {
  width: 60%;
}

.public-nav-links a:hover,
.public-nav-links a.active {
  background: rgba(99, 102, 241, 0.05);
  color: #4338ca;
}

.public-nav-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.public-account {
  position: relative;
}

.public-account-trigger {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 4px 10px 4px 4px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.98);
  transition: 0.18s ease;
}

.public-account-trigger:hover {
  border-color: #c7d2fe;
  box-shadow: 0 14px 26px -22px rgba(79, 70, 229, 0.6);
}

.public-account-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.public-account-copy strong {
  color: #0f172a;
  font-size: 0.84rem;
  font-weight: 800;
  line-height: 1.1;
}

.public-account-copy span {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.2;
}

.public-account-chevron {
  color: #94a3b8;
  font-size: 0.75rem;
  transition: transform 0.18s ease;
}

.public-account-chevron.is-open {
  transform: rotate(180deg);
}

.public-account-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(320px, calc(100vw - 28px));
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 30px 50px -28px rgba(15, 23, 42, 0.28);
  padding: 14px;
  backdrop-filter: blur(16px);
}

.public-account-summary {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 4px 2px 14px;
  border-bottom: 1px solid #eef2ff;
}

.public-account-summary-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  border: 1px solid #dbeafe;
}

.public-account-summary strong {
  display: block;
  color: #0f172a;
  font-size: 0.96rem;
  font-weight: 800;
}

.public-account-summary p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 600;
}

.public-account-summary span {
  display: inline-flex;
  margin-top: 8px;
  color: #4338ca;
  font-size: 0.72rem;
  font-weight: 800;
}

.public-account-links {
  display: grid;
  gap: 8px;
  padding-top: 12px;
}

.public-account-primary,
.public-account-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  border-radius: 12px;
  text-decoration: none;
  font-size: 0.84rem;
  font-weight: 800;
  transition: 0.18s ease;
}

.public-account-primary {
  justify-content: center;
  background: #4f46e5;
  color: #fff;
}

.public-account-primary:hover {
  background: #4338ca;
}

.public-account-link {
  width: 100%;
  padding: 0 14px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #334155;
}

.public-account-link:hover {
  border-color: #c7d2fe;
  color: #312e81;
}

.public-account-link--danger {
  border-color: #fecdd3;
  color: #be123c;
}

.public-account-link--danger:hover {
  background: #fff1f2;
  border-color: #fda4af;
}

.public-link {
  padding: 8px 10px;
  color: #475569;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
}

.public-link:hover {
  color: #312e81;
}

.public-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  background: #4f46e5;
  color: #fff;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 800;
  transition: 0.2s ease;
  white-space: nowrap;
}

.public-primary:hover {
  background: #4338ca;
}

.public-avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1.5px solid #dbeafe;
  background: #fff;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.public-account-trigger:hover .public-avatar {
  transform: scale(1.1);
  border-color: #6366f1;
}

@media (max-width: 1100px) {
  .public-nav-inner {
    gap: 12px;
  }

  .public-nav-links a {
    padding: 7px 9px;
    font-size: 0.88rem;
  }
}

@media (max-width: 860px) {
  .public-nav-inner {
    flex-wrap: wrap;
    padding: 10px 14px 12px;
  }

  .public-nav-links {
    order: 3;
    width: 100%;
    justify-content: flex-start;
    padding-bottom: 2px;
  }

  .public-nav-actions {
    margin-left: auto;
  }
}

@media (max-width: 640px) {
  .public-brand-copy {
    font-size: 0.98rem;
  }

  .public-link {
    display: none;
  }

  .public-primary {
    min-height: 38px;
    padding: 0 12px;
    font-size: 0.82rem;
  }
}
</style>

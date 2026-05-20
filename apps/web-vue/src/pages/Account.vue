<template>
  <div class="account-page selection:bg-indigo-100 selection:text-indigo-900">
    <SiteNav />

    <main class="account-shell">
      <section class="profile-hero">
        <div class="profile-main">
          <img :src="avatarUrl" alt="" class="profile-avatar" />
          <div class="profile-copy">
            <p class="profile-kicker">{{ currentRoleLabel }}</p>
            <h1>{{ currentUser?.name || '未登录用户' }}</h1>
            <p>{{ currentUser?.email || '暂无邮箱信息' }}</p>
          </div>
        </div>

        <div class="profile-actions">
          <RouterLink :to="primaryWorkspaceTarget" class="primary-action">
            <i class="fas" :class="isTeacherLike ? 'fa-chalkboard-teacher' : 'fa-rocket'"></i>
            {{ primaryWorkspaceLabel }}
          </RouterLink>
          <button type="button" class="quiet-action danger" @click="handleLogout">
            <i class="fas fa-sign-out-alt"></i>
            退出
          </button>
        </div>
      </section>

      <section class="account-grid">
        <article class="overview-panel">
          <div class="section-heading">
            <p>{{ isTeacherLike ? 'Faculty Home' : 'Student Home' }}</p>
            <h2>{{ homeTitle }}</h2>
          </div>

          <div class="route-list">
            <RouterLink
              v-for="item in roleRoutes"
              :key="item.to"
              :to="item.to"
              class="route-item"
            >
              <span class="route-icon"><i class="fas" :class="item.icon"></i></span>
              <span>
                <strong>{{ item.title }}</strong>
                <small>{{ item.description }}</small>
              </span>
              <i class="fas fa-arrow-right route-arrow"></i>
            </RouterLink>
          </div>
        </article>

        <aside class="status-panel">
          <div class="section-heading">
            <p>Account Status</p>
            <h2>账号状态</h2>
          </div>

          <dl class="status-list">
            <div>
              <dt>身份</dt>
              <dd>{{ currentRoleLabel }}</dd>
            </div>
            <div>
              <dt>默认主页</dt>
              <dd>{{ primaryWorkspaceLabel }}</dd>
            </div>
            <div>
              <dt>会话校验</dt>
              <dd>{{ validating ? '校验中' : '已同步' }}</dd>
            </div>
          </dl>

          <div class="account-note">
            <i class="fas" :class="isTeacherLike ? 'fa-clipboard-check' : 'fa-folder-open'"></i>
            <p>{{ roleNote }}</p>
          </div>

          <RouterLink v-if="secondaryWorkspaceTarget" :to="secondaryWorkspaceTarget" class="quiet-action full">
            <i class="fas fa-arrow-right-arrow-left"></i>
            {{ secondaryWorkspaceLabel }}
          </RouterLink>
        </aside>
      </section>

      <section class="quick-panel">
        <div class="section-heading">
          <p>Next Actions</p>
          <h2>{{ isTeacherLike ? '教师常用操作' : '学生常用操作' }}</h2>
        </div>

        <div class="quick-grid">
          <RouterLink
            v-for="item in quickActions"
            :key="item.to"
            :to="item.to"
            class="quick-item"
          >
            <i class="fas" :class="item.icon"></i>
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </section>

      <p v-if="status" class="account-status">{{ status }}</p>
    </main>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import { apiFetch, readJsonResponse } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import {
  getPrimaryWorkspaceLabel,
  getPrimaryWorkspaceTarget,
  getRoleLabel,
  isTeacherLike as isTeacherRole
} from '@/utils/userRole';

const router = useRouter();
const authStore = useAuthStore();
authStore.hydrate();

const { user } = storeToRefs(authStore);
const status = ref('');
const validating = ref(true);

const currentUser = computed(() => user.value);
const isTeacherLike = computed(() => isTeacherRole(currentUser.value?.role));
const currentRoleLabel = computed(() => getRoleLabel(currentUser.value?.role));
const avatarUrl = computed(() => (
  currentUser.value?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.value?.id || currentUser.value?.email || 'account'}`
));
const primaryWorkspaceTarget = computed(() => getPrimaryWorkspaceTarget(currentUser.value));
const primaryWorkspaceLabel = computed(() => getPrimaryWorkspaceLabel(currentUser.value));
const secondaryWorkspaceTarget = computed(() => (isTeacherLike.value ? '/workspace' : ''));
const secondaryWorkspaceLabel = computed(() => (isTeacherLike.value ? '进入学生工作台' : ''));

const homeTitle = computed(() => (
  isTeacherLike.value ? '评审、审批与课程维护集中处理' : '项目推进、工具与阶段提交集中管理'
));
const roleNote = computed(() => (
  isTeacherLike.value
    ? '教师账号默认进入教师后台；需要查看学生视角时，可以临时切换到学生工作台。'
    : '学生账号默认进入学生工作台；课程资料、项目库和工具入口会保留在顶部导航。'
));

const roleRoutes = computed(() => (
  isTeacherLike.value
    ? [
        { to: '/teacher', icon: 'fa-clipboard-check', title: '教师后台', description: '处理项目评审、物资审批与课程维护' },
        { to: '/mission-control', icon: 'fa-tower-observation', title: 'Mission Control', description: '查看平台级运营与管理视图' },
        { to: '/downloads', icon: 'fa-book-open', title: '课程库', description: '检查课程材料和教学资源' }
      ]
    : [
        { to: '/workspace', icon: 'fa-rocket', title: '学生工作台', description: '继续课题立项、实施日志和阶段提交' },
        { to: '/projects', icon: 'fa-layer-group', title: '项目库', description: '浏览优秀课题和可参考方向' },
        { to: '/tools', icon: 'fa-screwdriver-wrench', title: '工具中心', description: '进入立项、文献、创新点和看板工具' }
      ]
));

const quickActions = computed(() => (
  isTeacherLike.value
    ? [
        { to: '/teacher', icon: 'fa-list-check', label: '查看待评审' },
        { to: '/teacher', icon: 'fa-microchip', label: '处理物资审批' },
        { to: '/downloads', icon: 'fa-book', label: '课程材料' },
        { to: '/projects', icon: 'fa-magnifying-glass-chart', label: '项目库' }
      ]
    : [
        { to: '/workspace', icon: 'fa-folder-open', label: '我的项目' },
        { to: '/tools/kanban', icon: 'fa-table-columns', label: '任务看板' },
        { to: '/tools/devlog', icon: 'fa-pen-nib', label: '实施日志' },
        { to: '/downloads', icon: 'fa-book-open-reader', label: '课程资料' }
      ]
));

async function validateSession() {
  validating.value = true;
  try {
    const res = await apiFetch('/auth/me');
    const data = await readJsonResponse(res, 'auth_me');
    if (!res.ok || !data?.user) throw new Error(data?.error || 'auth_me_failed');
    authStore.user = data.user;
  } catch (err) {
    authStore.setRedirect('/account');
    authStore.logout();
    router.replace('/login');
  } finally {
    validating.value = false;
  }
}

function handleLogout() {
  authStore.logout();
  status.value = '已退出登录，正在返回登录页。';
  router.replace('/login');
}

onMounted(() => {
  validateSession();
});
</script>

<style scoped>
.account-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.1), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f8fafc 48%, #eef4ff 100%);
}

.account-shell {
  width: min(1120px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 112px 0 72px;
}

.profile-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  border-bottom: 1px solid #dbe4f0;
  padding-bottom: 28px;
}

.profile-main {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}

.profile-avatar {
  width: 92px;
  height: 92px;
  border-radius: 8px;
  border: 1px solid #dbeafe;
  background: #fff;
  box-shadow: 0 20px 45px -32px rgba(15, 23, 42, 0.6);
}

.profile-copy {
  min-width: 0;
}

.profile-kicker,
.section-heading p {
  margin: 0;
  color: #4f46e5;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.profile-copy h1 {
  margin: 9px 0 0;
  color: #0f172a;
  font-family: 'Outfit', 'Noto Sans SC', sans-serif;
  font-size: clamp(2rem, 4vw, 4.1rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.profile-copy p:last-child {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 0.98rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.profile-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.primary-action,
.quiet-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 44px;
  border-radius: 8px;
  padding: 0 16px;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 900;
  transition: 0.18s ease;
}

.primary-action {
  border: 1px solid #111827;
  background: #111827;
  color: #fff;
}

.primary-action:hover {
  background: #1e293b;
  transform: translateY(-1px);
}

.quiet-action {
  border: 1px solid #dbe4f0;
  background: rgba(255, 255, 255, 0.84);
  color: #334155;
}

.quiet-action:hover {
  border-color: #a5b4fc;
  color: #3730a3;
  background: #fff;
}

.quiet-action.danger {
  color: #be123c;
}

.quiet-action.danger:hover {
  border-color: #fda4af;
  color: #9f1239;
  background: #fff1f2;
}

.quiet-action.full {
  width: 100%;
  margin-top: 18px;
}

.account-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 22px;
  margin-top: 28px;
}

.overview-panel,
.status-panel,
.quick-panel {
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  padding: 24px;
  box-shadow: 0 24px 58px -44px rgba(15, 23, 42, 0.34);
}

.section-heading h2 {
  margin: 8px 0 0;
  color: #0f172a;
  font-family: 'Outfit', 'Noto Sans SC', sans-serif;
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.25;
}

.route-list {
  display: grid;
  gap: 12px;
  margin-top: 22px;
}

.route-item {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 14px;
  align-items: center;
  min-height: 72px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 13px;
  color: #0f172a;
  text-decoration: none;
  transition: 0.18s ease;
}

.route-item:hover {
  border-color: #818cf8;
  background: #fff;
  box-shadow: 0 18px 42px -32px rgba(79, 70, 229, 0.55);
}

.route-icon {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #eef2ff;
  color: #4f46e5;
}

.route-item strong,
.route-item small {
  display: block;
}

.route-item strong {
  font-size: 0.98rem;
  font-weight: 900;
}

.route-item small {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.5;
}

.route-arrow {
  color: #94a3b8;
}

.status-list {
  display: grid;
  gap: 13px;
  margin: 22px 0 0;
}

.status-list div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 12px;
}

.status-list dt,
.status-list dd {
  margin: 0;
  font-size: 0.84rem;
  font-weight: 800;
}

.status-list dt {
  color: #64748b;
}

.status-list dd {
  color: #0f172a;
  text-align: right;
}

.account-note {
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 12px;
  margin-top: 22px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #f8fbff;
  padding: 14px;
}

.account-note i {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #eef2ff;
  color: #4f46e5;
}

.account-note p {
  margin: 0;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.7;
}

.quick-panel {
  margin-top: 22px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.quick-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  text-decoration: none;
  font-size: 0.84rem;
  font-weight: 900;
  transition: 0.18s ease;
}

.quick-item:hover {
  border-color: #a5b4fc;
  background: #fff;
  color: #3730a3;
}

.account-status {
  margin: 16px 0 0;
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 800;
}

@media (max-width: 900px) {
  .profile-hero,
  .profile-main {
    align-items: flex-start;
  }

  .profile-hero {
    display: grid;
  }

  .profile-actions {
    justify-content: flex-start;
  }

  .account-grid {
    grid-template-columns: 1fr;
  }

  .quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .account-shell {
    width: min(100% - 24px, 1120px);
    padding-top: 96px;
  }

  .profile-main {
    display: grid;
  }

  .profile-avatar {
    width: 76px;
    height: 76px;
  }

  .profile-actions,
  .primary-action,
  .quiet-action {
    width: 100%;
  }

  .overview-panel,
  .status-panel,
  .quick-panel {
    padding: 20px 16px;
  }

  .route-item {
    grid-template-columns: 40px 1fr;
  }

  .route-arrow {
    display: none;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>

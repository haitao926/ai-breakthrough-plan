<template>
  <PageShell active="" main-class="account-shell page-gutter">
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
            <i class="fas" :class="primaryWorkspaceIcon"></i>
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
            <p>{{ workspaceOverviewLabel }}</p>
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
            <i class="fas" :class="accountNoteIcon"></i>
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
          <p>Action Queue</p>
          <h2>{{ quickPanelTitle }}</h2>
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

      <section v-if="isStudentRole" class="match-grid">
        <article class="overview-panel">
          <div class="section-heading">
            <p>Learner Profile</p>
            <h2>竞赛画像</h2>
          </div>
          <p v-if="profileDraftRestored" class="profile-draft-note">已恢复上次未提交的画像草稿。</p>
          <div class="profile-form-grid">
            <label :class="{ 'is-invalid': profileValidationErrors.schoolStage }">
              学段
              <input v-model="profileForm.schoolStage" placeholder="如 high / middle" />
              <small v-if="profileValidationErrors.schoolStage">{{ profileValidationErrors.schoolStage }}</small>
            </label>
            <label>
              年级
              <input v-model="profileForm.gradeLevel" placeholder="如 g10" />
            </label>
            <label :class="{ 'is-invalid': profileValidationErrors.className }">
              班级
              <input v-model="profileForm.className" placeholder="如 高一 1 班" />
              <small v-if="profileValidationErrors.className">{{ profileValidationErrors.className }}</small>
            </label>
            <label :class="{ 'is-invalid': profileValidationErrors.weeklyHours }">
              每周投入时长
              <input v-model="profileForm.weeklyHours" type="number" min="0" placeholder="小时" />
              <small v-if="profileValidationErrors.weeklyHours">{{ profileValidationErrors.weeklyHours }}</small>
            </label>
            <label :class="{ 'is-invalid': profileValidationErrors.interestTagsText }">
              兴趣标签
              <input v-model="profileForm.interestTagsText" placeholder="ai, robotics, data" />
              <small v-if="profileValidationErrors.interestTagsText">{{ profileValidationErrors.interestTagsText }}</small>
            </label>
            <label>
              技能标签
              <input v-model="profileForm.skillTagsText" placeholder="python, design, hardware" />
            </label>
            <label>
              目标方向
              <input v-model="profileForm.targetTagsText" placeholder="ai, research, maker" />
            </label>
            <label>
              经验等级
              <input v-model="profileForm.experienceLevel" placeholder="beginner / medium / advanced" />
            </label>
            <label>
              偏好组队人数
              <input v-model="profileForm.preferredTeamSize" placeholder="如 2-4" />
            </label>
            <label>
              设备条件
              <input v-model="profileForm.deviceAccess" placeholder="如 pc / hardware lab" />
            </label>
          </div>
          <label class="profile-notes">
            备注
            <textarea v-model="profileForm.notes" rows="3" placeholder="补充你的方向、限制或想冲刺的赛事"></textarea>
          </label>
          <div class="profile-actions-row">
            <button type="button" class="primary-action" @click="saveProfile" :disabled="profileSaving">
              <i class="fas fa-floppy-disk"></i>
              {{ profileSaving ? '保存中' : '保存画像并重算' }}
            </button>
            <button
              v-if="canRetryProfile"
              type="button"
              class="quiet-action"
              @click="saveProfile"
            >
              重新提交
            </button>
          </div>
          <p
            v-if="profileSubmitState.message"
            class="profile-submit-state"
            :class="profileSubmitState.type"
            :role="profileSubmitState.type === 'error' ? 'alert' : 'status'"
          >
            {{ profileSubmitState.message }}
          </p>
        </article>

        <article class="status-panel">
          <div class="section-heading">
            <p>Competition Match</p>
            <h2>适合我的竞赛</h2>
          </div>
          <div class="match-list">
            <RouterLink
              v-for="item in recommendedCompetitions"
              :key="item.targetKey"
              :to="`/competitions/${item.targetKey}`"
              class="match-item"
              @click="trackCompetitionMatch(item, 'click')"
            >
              <div class="match-item__top">
                <strong>{{ item.competition?.title || item.targetKey }}</strong>
                <span :class="['match-score', item.eligibilityStatus]">{{ item.score }} 分</span>
              </div>
              <p>{{ item.aiSummary || item.reasons?.[0] || '已生成结构化推荐结果。' }}</p>
              <small>{{ matchStatusLabel(item.eligibilityStatus) }} · {{ item.gaps?.[0] || '可继续查看详情' }}</small>
            </RouterLink>
            <div v-if="!recommendedCompetitions.length" class="empty-match-note">
              先完善画像，再生成竞赛推荐。
            </div>
          </div>
        </article>
      </section>

      <p v-if="status" class="account-status">{{ status }}</p>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import PageShell from '@/components/PageShell.vue';
import { apiFetch, readJsonResponse } from '@/api/client';
import { useFormDraft } from '@/composables/useFormDraft';
import { useSubmitState } from '@/composables/useSubmitState';
import { useAuthStore } from '@/stores/auth';
import {
  getPrimaryWorkspaceIcon,
  getPrimaryWorkspaceLabel,
  getPrimaryWorkspaceTarget,
  getRoleLabel,
  getSecondaryWorkspaceLabel,
  getSecondaryWorkspaceTarget,
  isAdminRole,
  isTeacherRole
} from '@/utils/userRole';
import { buildWorkspacePanelRoute } from '@/utils/workspaceRoute';

const router = useRouter();
const authStore = useAuthStore();
authStore.hydrate();

const { user } = storeToRefs(authStore);
const status = ref('');
const validating = ref(true);
const profileSaving = ref(false);
const profileDraftRestored = ref(false);
const recommendedCompetitions = ref([]);
const profileForm = ref({
  schoolStage: '',
  gradeLevel: '',
  className: '',
  interestTagsText: '',
  skillTagsText: '',
  targetTagsText: '',
  weeklyHours: '',
  experienceLevel: '',
  preferredTeamSize: '',
  deviceAccess: '',
  notes: ''
});
const { submitState: profileSubmitState, canRetry: canRetryProfile, start: startProfileSubmit, succeed: succeedProfileSubmit, fail: failProfileSubmit } = useSubmitState({
  getBusy: () => profileSaving.value,
  getCanSubmit: () => Object.keys(profileValidationErrors.value).length === 0
});

const currentUser = computed(() => user.value);
const isAdmin = computed(() => isAdminRole(currentUser.value?.role));
const isTeacherLike = computed(() => isTeacherRole(currentUser.value?.role));
const isStudentRole = computed(() => !isAdmin.value && !isTeacherLike.value);
const currentRoleLabel = computed(() => getRoleLabel(currentUser.value?.role));
const avatarUrl = computed(() => (
  currentUser.value?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.value?.id || currentUser.value?.email || 'account'}`
));
const primaryWorkspaceIcon = computed(() => getPrimaryWorkspaceIcon(currentUser.value));
const primaryWorkspaceTarget = computed(() => getPrimaryWorkspaceTarget(currentUser.value));
const primaryWorkspaceLabel = computed(() => getPrimaryWorkspaceLabel(currentUser.value));
const secondaryWorkspaceTarget = computed(() => getSecondaryWorkspaceTarget(currentUser.value));
const secondaryWorkspaceLabel = computed(() => getSecondaryWorkspaceLabel(currentUser.value));
const workspaceOverviewLabel = computed(() => (
  isAdmin.value ? 'Admin Hub' : isTeacherLike.value ? 'Teacher Hub' : 'My Hub'
));
const quickPanelTitle = computed(() => (
  isAdmin.value ? '管理员常用操作' : isTeacherLike.value ? '教师常用操作' : '学生常用操作'
));
const accountNoteIcon = computed(() => (
  isAdmin.value ? 'fa-shield-halved' : isTeacherLike.value ? 'fa-clipboard-check' : 'fa-folder-open'
));
const profileValidationErrors = computed(() => {
  const errors = {};
  if (!String(profileForm.value.schoolStage || '').trim()) {
    errors.schoolStage = '请先填写学段，便于筛选合适赛事。';
  }
  if (!String(profileForm.value.className || '').trim()) {
    errors.className = '请填写班级，教师端需要按班级查看画像。';
  }
  if (profileForm.value.weeklyHours !== '' && Number(profileForm.value.weeklyHours) < 0) {
    errors.weeklyHours = '每周投入时长不能小于 0。';
  }
  if (!tagsFromText(profileForm.value.interestTagsText).length) {
    errors.interestTagsText = '至少填写一个兴趣标签，例如 ai 或 robotics。';
  }
  return errors;
});

const { restoreDraft: restoreProfileDraft, clearDraft: clearProfileDraft } = useFormDraft('account:learner-profile', profileForm.value, {
  shouldSave(value) {
    if (!isStudentRole.value) return false;
    return Object.values(value || {}).some((item) => String(item || '').trim());
  }
});

const homeTitle = computed(() => (
  isAdmin.value
    ? '平台账号、班级分工与教师覆盖集中处理'
    : isTeacherLike.value
    ? '评审、审批与课程维护集中处理'
    : '项目推进、工具与阶段提交集中管理'
));
const roleNote = computed(() => (
  isAdmin.value
    ? '管理员默认进入管理后台；需要查看教师执行面时，可继续进入教师工作台。'
    : isTeacherLike.value
    ? '教师账号默认进入教师工作台；需要查看学生视角时，可以临时切换到学生工作台。'
    : '学生账号默认进入学生工作台；课程资料、项目库和工具入口会保留在顶部导航。'
));

const roleRoutes = computed(() => (
  isAdmin.value
    ? [
        { to: '/admin', icon: 'fa-shield-halved', title: '管理后台', description: '查看平台总览、教师分工与学生账号' },
        { to: '/teacher', icon: 'fa-chalkboard-teacher', title: '教师工作台', description: '进入评审、发布和项目干预流' },
        { to: '/courses', icon: 'fa-book-open', title: '课程库', description: '检查课程材料和教学资源' }
      ]
    : isTeacherLike.value
    ? [
        { to: '/teacher', icon: 'fa-clipboard-check', title: '教师工作台', description: '处理项目评审、物资审批与课程维护' },
        { to: '/teacher/monitor', icon: 'fa-tower-observation', title: '运营总览', description: '查看项目推进与运营状态' },
        { to: '/courses', icon: 'fa-book-open', title: '课程库', description: '检查课程材料和教学资源' }
      ]
    : [
        { to: '/my', icon: 'fa-folder-open', title: '我的空间', description: '继续课题立项、实施日志和阶段提交' },
        { to: '/projects', icon: 'fa-layer-group', title: '项目库', description: '浏览优秀课题和可参考方向' },
        { to: '/courses', icon: 'fa-book-open', title: '课程库', description: '按课程任务补资料、补方法和补实践步骤' }
      ]
));

const quickActions = computed(() => (
  isAdmin.value
    ? [
        { to: '/admin', icon: 'fa-chart-line', label: '后台总览' },
        { to: '/admin/teachers', icon: 'fa-users-gear', label: '教师分工' },
        { to: '/admin/students', icon: 'fa-id-card', label: '学生账号' },
        { to: '/teacher', icon: 'fa-chalkboard-teacher', label: '教师工作台' }
      ]
    : isTeacherLike.value
    ? [
        { to: '/teacher', icon: 'fa-list-check', label: '查看待评审' },
        { to: '/teacher', icon: 'fa-microchip', label: '处理物资审批' },
        { to: '/courses', icon: 'fa-book', label: '课程材料' },
        { to: '/projects', icon: 'fa-magnifying-glass-chart', label: '项目库' }
      ]
    : [
        { to: '/my', icon: 'fa-folder-open', label: '我的项目' },
        { to: '/projects', icon: 'fa-layer-group', label: '找项目方向' },
        { to: buildWorkspacePanelRoute('', 'kanban'), icon: 'fa-table-columns', label: '任务看板' },
        { to: '/courses', icon: 'fa-book-open-reader', label: '课程资料' }
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

function tagsFromText(value) {
  return String(value || '')
    .split(/[,，\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function syncProfileForm(item = {}) {
  profileForm.value = {
    schoolStage: item.schoolStage || '',
    gradeLevel: item.gradeLevel || '',
    className: item.className || '',
    interestTagsText: Array.isArray(item.interestTags) ? item.interestTags.join(', ') : '',
    skillTagsText: Array.isArray(item.skillTags) ? item.skillTags.join(', ') : '',
    targetTagsText: Array.isArray(item.targetTags) ? item.targetTags.join(', ') : '',
    weeklyHours: item.weeklyHours === null || item.weeklyHours === undefined ? '' : String(item.weeklyHours),
    experienceLevel: item.experienceLevel || '',
    preferredTeamSize: item.preferredTeamSize || '',
    deviceAccess: item.deviceAccess || '',
    notes: item.notes || ''
  };
}

function matchStatusLabel(statusValue) {
  return {
    eligible: '高度匹配',
    conditional: '有条件匹配',
    ineligible: '暂不匹配'
  }[statusValue] || '待评估';
}

async function loadProfile() {
  if (!isStudentRole.value) return;
  const res = await apiFetch('/me/profile');
  const data = await readJsonResponse(res, 'me_profile');
  if (!res.ok) throw new Error(data?.error || '画像加载失败');
  syncProfileForm(data.item || {});
  profileDraftRestored.value = restoreProfileDraft();
}

async function loadCompetitionMatches() {
  if (!isStudentRole.value) return;
  const res = await apiFetch('/me/competition-matches');
  const data = await readJsonResponse(res, 'me_competition_matches');
  if (!res.ok) throw new Error(data?.error || '竞赛推荐加载失败');
  recommendedCompetitions.value = Array.isArray(data.items) ? data.items : [];
}

async function saveProfile() {
  if (Object.keys(profileValidationErrors.value).length) {
    failProfileSubmit('请先补齐画像关键信息，再保存并重算推荐。', { retry: false });
    return;
  }
  profileSaving.value = true;
  startProfileSubmit();
  try {
    const payload = {
      schoolStage: profileForm.value.schoolStage,
      gradeLevel: profileForm.value.gradeLevel,
      className: profileForm.value.className,
      interestTags: tagsFromText(profileForm.value.interestTagsText),
      skillTags: tagsFromText(profileForm.value.skillTagsText),
      targetTags: tagsFromText(profileForm.value.targetTagsText),
      weeklyHours: profileForm.value.weeklyHours ? Number(profileForm.value.weeklyHours) : null,
      experienceLevel: profileForm.value.experienceLevel,
      preferredTeamSize: profileForm.value.preferredTeamSize,
      deviceAccess: profileForm.value.deviceAccess,
      notes: profileForm.value.notes
    };
    const res = await apiFetch('/me/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await readJsonResponse(res, 'me_profile_update');
    if (!res.ok) throw new Error(data?.error || '画像保存失败');
    syncProfileForm(data.item || {});
    clearProfileDraft();
    profileDraftRestored.value = false;
    await loadCompetitionMatches();
    status.value = '画像已更新，竞赛推荐已重算。';
    succeedProfileSubmit('画像已保存，竞赛推荐已同步更新。');
  } catch (err) {
    status.value = err.message || '画像保存失败';
    failProfileSubmit(err.message || '画像保存失败，请检查网络后重试。');
  } finally {
    profileSaving.value = false;
  }
}

async function trackCompetitionMatch(item, interactionType = 'view') {
  if (!item?.targetKey) return;
  try {
    await apiFetch(`/me/competition-matches/${item.targetKey}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interactionType, metadata: { source: 'account' } })
    });
  } catch {}
}

function handleLogout() {
  authStore.logout();
  status.value = '已退出登录，正在返回登录页。';
  router.replace('/login');
}

onMounted(() => {
  validateSession().then(async () => {
    if (isStudentRole.value) {
      try {
        await loadProfile();
        await loadCompetitionMatches();
        recommendedCompetitions.value.slice(0, 3).forEach(item => {
          trackCompetitionMatch(item, 'view');
        });
      } catch (err) {
        status.value = err.message || '匹配信息加载失败';
      }
    }
  });
});
</script>

<style scoped>
.account-page {
  min-height: 100dvh;
  background: #f8fafc;
}

.account-shell {
  --page-gutter-max: 1120px;
  padding: 112px clamp(16px, 2vw, 24px) 72px;
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
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 12px 30px -15px rgba(15, 23, 42, 0.15);
}

.profile-copy {
  min-width: 0;
}

.profile-kicker,
.section-heading p {
  margin: 0;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
}

.profile-copy h1 {
  margin: 9px 0 0;
  color: #0f172a;
  font-family: inherit;
  font-size: clamp(2rem, 4vw, 4.1rem);
  font-weight: 700;
  line-height: 1;
  overflow-wrap: anywhere;
}

.profile-copy p:last-child {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 0.98rem;
  font-weight: 500;
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
  font-weight: 600;
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
  border-color: #cbd5e1;
  color: #1e293b;
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
  box-shadow: 0 24px 58px -44px rgba(15, 23, 42, 0.12);
}

.section-heading h2 {
  margin: 8px 0 0;
  color: #0f172a;
  font-family: inherit;
  font-size: 1.45rem;
  font-weight: 700;
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
  border-color: #cbd5e1;
  background: #fff;
  box-shadow: 0 10px 25px -10px rgba(15, 23, 42, 0.08);
}

.route-icon {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
}

.route-item strong,
.route-item small {
  display: block;
}

.route-item strong {
  font-size: 0.98rem;
  font-weight: 600;
}

.route-item small {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 500;
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
  font-weight: 600;
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
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 14px;
}

.account-note i {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
}

.account-note p {
  margin: 0;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 500;
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

.match-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 22px;
  margin-top: 24px;
}

.profile-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.profile-form-grid label,
.profile-notes {
  display: grid;
  gap: 8px;
  color: #334155;
  font-size: 0.84rem;
  font-weight: 600;
}

.profile-form-grid input,
.profile-notes textarea {
  min-height: 42px;
  border: 1px solid #dbe4f0;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fff;
  color: #0f172a;
  font: inherit;
}

.profile-form-grid label.is-invalid,
.profile-notes.is-invalid {
  color: #b91c1c;
}

.profile-form-grid label.is-invalid input,
.profile-notes.is-invalid textarea {
  border-color: #fca5a5;
  background: #fff5f5;
}

.profile-form-grid small,
.profile-notes small {
  color: #b91c1c;
  font-size: 0.72rem;
  font-weight: 600;
}

.profile-notes {
  margin-top: 14px;
}

.profile-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.profile-draft-note,
.profile-submit-state {
  margin: 12px 0 0;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 0.84rem;
  font-weight: 600;
}

.profile-draft-note {
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.profile-submit-state.success {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.profile-submit-state.error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.match-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.match-item {
  border: 1px solid #dbe4f0;
  border-radius: 8px;
  background: #fff;
  padding: 14px;
  text-decoration: none;
  color: inherit;
}

.match-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.match-item p {
  margin: 10px 0 0;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.55;
}

.match-item small {
  display: block;
  margin-top: 8px;
  color: #64748b;
}

.match-score {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.76rem;
  font-weight: 700;
}

.match-score.eligible {
  background: #dcfce7;
  color: #166534;
}

.match-score.conditional {
  background: #fef3c7;
  color: #92400e;
}

.match-score.ineligible {
  background: #fee2e2;
  color: #991b1b;
}

.empty-match-note {
  color: #64748b;
  font-size: 0.9rem;
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
  font-weight: 600;
  transition: 0.18s ease;
}

.quick-item:hover {
  border-color: #cbd5e1;
  background: #fff;
  color: #1e293b;
}

.account-status {
  margin: 16px 0 0;
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 600;
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

  .match-grid {
    grid-template-columns: 1fr;
  }

  .quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .account-shell {
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

  .profile-form-grid {
    grid-template-columns: 1fr;
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

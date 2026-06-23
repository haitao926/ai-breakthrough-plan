<template>
  <section class="login-page selection:bg-teal-100 selection:text-teal-900">

    <div class="login-header-wrapper">
      <div class="login-header-inner">
        <RouterLink to="/" class="login-brand group" aria-label="返回门户首页">
          <span class="w-10 h-10 rounded-full flex items-center justify-center bg-white overflow-hidden shadow-sm transition-all duration-200 group-hover:-translate-y-[1px] group-hover:shadow-md border border-slate-100">
            <img src="/assets/branding/site-logo.png" alt="Logo" class="w-full h-full object-contain block" />
          </span>
          <span>
            <strong>{{ brandName }}</strong>
            <small>{{ schoolName }}</small>
          </span>
        </RouterLink>
      </div>
    </div>

    <main class="login-shell">
      <section class="login-intro">
        <p class="login-eyebrow">{{ brandName }}</p>
        <h1>进入你的 AI 创新工作台</h1>
        <p class="login-lead">登录后回到当前页面，继续项目、提交或评审。</p>
        <p class="login-sublead">还没决定下一步时，先去项目库或课程库看看。</p>

        <div class="role-preview" aria-label="登录身份入口">
          <button
            v-for="option in roleOptions"
            :key="option.id"
            type="button"
            class="role-option"
            :class="{ active: selectedRole === option.id }"
            @click="selectedRole = option.id"
          >
            <i class="fas" :class="option.icon"></i>
            <span>
              <strong>{{ option.title }}</strong>
              <small>{{ option.description }}</small>
            </span>
          </button>
        </div>
      </section>

      <section class="login-panel" aria-label="账号登录">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">{{ activeRole.title }}</p>
            <h2>账号登录</h2>
            <p class="panel-note">{{ activeRole.description }}</p>
          </div>
          <span class="role-badge">{{ activeRole.badge }}</span>
        </div>

        <p v-if="redirectHint" class="redirect-hint">
          <i class="fas fa-location-arrow"></i>
          登录后回到 {{ redirectHint }}
        </p>

        <form class="login-form" autocomplete="on" @submit.prevent="handleSubmit">
          <label for="login-identifier">
            <span>账号</span>
            <input
              id="login-identifier"
              v-model.trim="form.email"
              type="text"
              name="username"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              placeholder="邮箱或用户名"
              :disabled="loading"
              @blur="touch('email')"
            />
            <small v-if="visibleErrors.email" class="field-error">{{ visibleErrors.email }}</small>
          </label>

          <label for="login-password">
            <span class="field-row">
              <span>密码</span>
              <button type="button" class="forgot-link" @click="showResetHelp = !showResetHelp">
                忘记密码？
              </button>
            </span>
            <div class="password-field">
              <input
                id="login-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                name="password"
                autocomplete="current-password"
                autocapitalize="none"
                spellcheck="false"
                placeholder="请输入密码"
                :disabled="loading"
                @blur="touch('password')"
              />
              <button type="button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">
                <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
            <small v-if="visibleErrors.password" class="field-error">{{ visibleErrors.password }}</small>
          </label>

          <p v-if="showResetHelp" class="reset-help">
            <i class="fas fa-circle-info"></i>
            请联系课程教师或平台管理员重置密码；校内账号可先确认邮箱/用户名是否输入正确。
          </p>

          <p v-if="draftRestored" class="draft-note">
            <i class="fas fa-clock-rotate-left"></i>
            已恢复上次未完成的登录账号草稿（不含密码）。
          </p>

          <button class="login-submit" type="submit" :disabled="loading || !canSubmit">
            <i class="fas" :class="loading ? 'fa-circle-notch' : activeRole.submitIcon"></i>
            <span>{{ loading ? '正在验证账号' : activeRole.submitLabel }}</span>
          </button>

          <p v-if="submitState.message" class="login-status" :class="submitState.type === 'success' ? 'success' : 'error'">
            <i class="fas" :class="submitState.type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation'"></i>
            {{ submitState.message }}
          </p>
          <button v-if="canRetry" class="retry-link" type="button" :disabled="loading" @click="handleSubmit">
            重试登录
          </button>
        </form>

        <div class="panel-footer">
          <span>还没有账号？</span>
          <RouterLink to="/register">创建学生或教师账号</RouterLink>
        </div>
      </section>
    </main>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { loginUser } from '@/api/authApi';
import { useAuthStore } from '@/stores/auth';
import { brandName, schoolName } from '@/constants/brand';
import { useFormDraft } from '@/composables/useFormDraft';
import { useSubmitState } from '@/composables/useSubmitState';
import { getPrimaryWorkspaceTarget, isAdminRole, isTeacherLike } from '@/utils/userRole';

const AUTH_REDIRECT_KEY = 'auth_redirect';

const router = useRouter();
const authStore = useAuthStore();
authStore.hydrate();

const form = reactive({ email: '', password: '' });
const selectedRole = ref('student');
const loading = ref(false);
const showPassword = ref(false);
const showResetHelp = ref(false);
const redirectPath = ref('');
const draftRestored = ref(false);
const submittedOnce = ref(false);
const touched = reactive({
  email: false,
  password: false
});
const draftFields = reactive({
  email: '',
  role: 'student'
});

const roleOptions = [
  {
    id: 'student',
    title: '学生入口',
    badge: 'Student',
    description: '继续项目与阶段提交',
    submitLabel: '进入学生工作台',
    submitIcon: 'fa-rocket',
    icon: 'fa-user-graduate'
  },
  {
    id: 'teacher',
    title: '教师入口',
    badge: 'Faculty',
    description: '进入评审与课程维护',
    submitLabel: '进入教师工作台',
    submitIcon: 'fa-chalkboard-teacher',
    icon: 'fa-chalkboard-teacher'
  },
  {
    id: 'admin',
    title: '管理入口',
    badge: 'Admin',
    description: '进入平台总览与账号管理',
    submitLabel: '进入管理后台',
    submitIcon: 'fa-shield-halved',
    icon: 'fa-shield-halved'
  }
];

const activeRole = computed(() => roleOptions.find(item => item.id === selectedRole.value) || roleOptions[0]);
const validationErrors = computed(() => {
  const errors = {};
  if (!String(form.email || '').trim()) errors.email = '请输入邮箱或用户名。';
  if (!String(form.password || '')) errors.password = '请输入密码。';
  return errors;
});
const visibleErrors = computed(() => {
  const errors = {};
  Object.entries(validationErrors.value).forEach(([key, value]) => {
    if (submittedOnce.value || touched[key]) errors[key] = value;
  });
  return errors;
});
const canSubmit = computed(() => Object.keys(validationErrors.value).length === 0);
const { submitState, canRetry, start, succeed, fail } = useSubmitState({
  getBusy: () => loading.value,
  getCanSubmit: () => canSubmit.value
});
const redirectHint = computed(() => {
  if (!redirectPath.value) return '';
  const routeLabels = {
    '/admin': '管理后台',
    '/teacher': '教师工作台',
    '/my': '我的空间',
    '/account': '个人中心',
    '/tools': '工具中心',
    '/teacher/monitor': '运营总览'
  };
  return routeLabels[redirectPath.value] || redirectPath.value;
});

const { restoreDraft, clearDraft } = useFormDraft('auth:login', draftFields, {
  shouldSave: value => Boolean(String(value.email || '').trim())
});

function touch(field) {
  touched[field] = true;
}

function touchAll() {
  Object.keys(touched).forEach((key) => {
    touched[key] = true;
  });
}

function getStoredRedirect() {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(AUTH_REDIRECT_KEY) || '';
}

function syncRoleFromRedirect(path) {
  if (path.startsWith('/admin')) {
    selectedRole.value = 'admin';
    return;
  }
  if (path.startsWith('/teacher') || path.startsWith('/mission-control')) {
    selectedRole.value = 'teacher';
  }
}

function consumeRedirect() {
  if (typeof window === 'undefined') return '';
  const redirect = window.sessionStorage.getItem(AUTH_REDIRECT_KEY) || '';
  window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  return redirect;
}

function redirectAfterLogin(user) {
  const redirect = consumeRedirect();
  if (redirect) {
    router.replace(redirect);
    return;
  }
  router.replace(getPrimaryWorkspaceTarget(user));
}

async function handleSubmit() {
  submittedOnce.value = true;
  touchAll();
  if (!canSubmit.value || loading.value) return;
  start();
  loading.value = true;
  try {
    const user = await loginUser(form.email, form.password);
    clearDraft();
    authStore.hydrate();
    selectedRole.value = isAdminRole(user.role) ? 'admin' : isTeacherLike(user.role) ? 'teacher' : 'student';
    succeed(
      isAdminRole(user.role)
        ? '管理员账号验证通过，正在进入管理后台。'
        : isTeacherLike(user.role)
        ? '教师账号验证通过，正在进入教师工作台。'
        : '学生账号验证通过，正在进入工作台。'
    );
    redirectAfterLogin(user);
  } catch (err) {
    fail(`登录失败：${err.message}`);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  redirectPath.value = getStoredRedirect();
  draftRestored.value = restoreDraft();
  if (draftRestored.value) {
    form.email = draftFields.email;
    selectedRole.value = draftFields.role || 'student';
  }
  syncRoleFromRedirect(redirectPath.value);
  if (authStore.isAuthenticated && authStore.user) {
    redirectAfterLogin(authStore.user);
  }
});

watchEffect(() => {
  draftFields.email = form.email;
  draftFields.role = selectedRole.value;
});
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  position: relative;
  display: grid;
  align-items: center;
  overflow: hidden;
  background: #f8fafc;
  padding: 88px 24px 40px;
}

.login-page::before {
  content: none;
}

.login-page::after {
  content: none;
}

.login-header-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 0 24px;
  z-index: 2;
}

.login-header-inner {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding-top: 22px;
}

.login-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #0f172a;
  text-decoration: none;
}



.login-brand strong,
.login-brand small {
  display: block;
}

.login-brand strong {
  font-family: inherit;
  font-size: 1rem;
  font-weight: 800;
}

.login-brand small {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(1180px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 430px);
  gap: clamp(40px, 7vw, 104px);
  align-items: center;
}

.login-intro {
  max-width: 660px;
}

.login-eyebrow,
.panel-kicker {
  margin: 0;
  color: var(--color-brand-accent);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.login-intro h1 {
  margin: 18px 0 0;
  color: #0f172a;
  font-family: inherit;
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 0.98;
  text-wrap: balance;
}

.login-lead {
  margin: 22px 0 0;
  max-width: 560px;
  color: #475569;
  font-size: 1.08rem;
  font-weight: 600;
  line-height: 1.7;
}

.login-sublead {
  margin: 10px 0 0;
  max-width: 520px;
  color: #64748b;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.65;
}

.role-preview {
  display: grid;
  gap: 12px;
  margin-top: 28px;
  max-width: 460px;
}

.role-option {
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 14px;
  align-items: center;
  min-height: 70px;
  border: 1px solid rgba(203, 213, 225, 0.72);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.62);
  padding: 12px 14px;
  color: #334155;
  text-align: left;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.role-option i {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
}

.role-option strong,
.role-option small {
  display: block;
}

.role-option strong {
  color: #0f172a;
  font-size: 0.96rem;
  font-weight: 900;
}

.role-option small {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
}

.role-option:hover,
.role-option.active {
  border-color: var(--color-brand-accent);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 24px 54px -36px rgba(15, 118, 110, 0.25);
  transform: translateY(-2px);
}

.role-option.active i {
  background: var(--color-brand-accent);
  color: #fff;
  box-shadow: 0 14px 28px -18px rgba(15, 118, 110, 0.35);
}

.login-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  background: #fff;
  padding: 30px;
  box-shadow: var(--shadow-card);
}

.login-panel::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 2px;
  background: var(--color-brand-accent);
}

.login-panel::after {
  content: none;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: start;
}

.panel-head h2 {
  margin: 8px 0 0;
  color: #0f172a;
  font-family: inherit;
  font-size: 2.08rem;
  font-weight: 800;
}

.panel-note {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 700;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 11px;
  border-radius: 999px;
  background: var(--color-brand-accent-light);
  color: var(--color-brand-accent);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.redirect-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 0;
  border: 1px solid rgba(203, 213, 225, 0.72);
  border-radius: 8px;
  background: #f8fafc;
  padding: 11px 12px;
  color: #475569;
  font-size: 0.79rem;
  font-weight: 700;
}

.login-form {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}

.login-form label {
  display: grid;
  gap: 8px;
}

.field-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.login-form label > span {
  color: #475569;
  font-size: 0.78rem;
  font-weight: 900;
}

.forgot-link {
  border: 0;
  background: transparent;
  color: var(--color-brand-accent);
  min-height: 44px;
  padding: 0 4px;
  font-size: 0.78rem;
  font-weight: 900;
  cursor: pointer;
}

.forgot-link:hover {
  color: var(--color-brand-accent-hover);
  text-decoration: underline;
}

.login-form input {
  width: 100%;
  min-height: 48px;
  border: 1px solid #dbe4f0;
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.78);
  padding: 0 13px;
  color: #0f172a;
  font-size: 0.94rem;
  font-weight: 700;
  outline: none;
  transition: 0.16s ease;
}

.login-form input:focus {
  border-color: var(--color-brand-accent);
  background: #fff;
  box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.25);
}

.password-field {
  position: relative;
}

.password-field input {
  padding-right: 48px;
}

.password-field button {
  position: absolute;
  top: 50%;
  right: 7px;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
}

.password-field button:hover {
  background: var(--color-brand-accent-light);
  color: var(--color-brand-accent);
}

.reset-help {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: start;
  margin: -2px 0 0;
  border: 1px solid var(--color-brand-accent-light);
  border-radius: 8px;
  background: var(--color-brand-accent-light);
  padding: 10px 12px;
  color: var(--color-brand-accent-hover);
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.55;
}

.field-error {
  color: #be123c;
  font-size: 0.74rem;
  font-weight: 800;
}

.draft-note {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: start;
  margin: -2px 0 0;
  border: 1px solid #ccfbf1;
  border-radius: 8px;
  background: #f0fdfa;
  padding: 10px 12px;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.55;
}

.login-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 50px;
  margin-top: 4px;
  border: 0;
  border-radius: 8px;
  background: #1e293b;
  color: #fff;
  font-size: 0.94rem;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.login-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #0f172a;
  box-shadow: 0 18px 34px -24px rgba(15, 118, 110, 0.88);
}

.login-submit:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.login-status {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1.5;
}

.login-status.error {
  background: #fff1f2;
  color: #be123c;
}

.login-status.success {
  background: #ecfdf5;
  color: #047857;
}

.retry-link {
  justify-self: center;
  border: 0;
  background: transparent;
  color: var(--color-brand-accent);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 900;
}

.retry-link:hover:not(:disabled) {
  text-decoration: underline;
}

.panel-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 700;
}

.panel-footer a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--color-brand-accent);
  font-weight: 900;
  text-decoration: none;
}

.panel-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 900px) {
  .login-page {
    align-items: start;
  }

  .login-shell {
    grid-template-columns: 1fr;
  }

  .login-intro {
    max-width: none;
  }

  
}

@media (max-width: 560px) {
  .login-page {
    padding: 86px 16px 28px;
  }

  .login-brand {
    left: 16px;
  }

  .login-intro h1 {
    font-size: 2.55rem;
    line-height: 1.02;
  }

  .login-lead {
    font-size: 0.98rem;
  }

  .login-panel {
    padding: 22px 18px;
  }

  .panel-head {
    display: grid;
  }

  .role-badge {
    justify-self: start;
  }

  
}

</style>

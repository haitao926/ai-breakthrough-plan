<template>
  <section class="login-page selection:bg-indigo-100 selection:text-indigo-900">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>
    <div class="orbit-field" aria-hidden="true">
      <span class="orbit orbit-a"></span>
      <span class="orbit orbit-b"></span>
      <span class="orbit orbit-c"></span>
    </div>

    <RouterLink to="/" class="login-brand" aria-label="返回门户首页">
      <span class="brand-mark"><i class="fas fa-cube"></i></span>
      <span>
        <strong>{{ brandName }}</strong>
        <small>{{ schoolName }}</small>
      </span>
    </RouterLink>

    <main class="login-shell">
      <section class="login-intro">
        <p class="login-eyebrow">SASU AI Lab</p>
        <h1>进入你的 AI 创新工作台</h1>
        <p class="login-lead">面向学生项目实践与教师评审管理的统一入口。选择身份后继续课程、课题与协作流程。</p>

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

        <div class="login-rhythm">
          <span v-for="item in activeRoleSteps" :key="item">{{ item }}</span>
        </div>

        <div class="signal-panel" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </section>

      <section class="login-panel" aria-label="账号登录">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">{{ activeRole.title }}</p>
            <h2>账号登录</h2>
          </div>
          <span class="role-badge">{{ activeRole.badge }}</span>
        </div>

        <p v-if="redirectHint" class="redirect-hint">
          <i class="fas fa-location-arrow"></i>
          登录后返回 {{ redirectHint }}
        </p>

        <form class="login-form" @submit.prevent="handleSubmit">
          <label>
            <span>账号</span>
            <input
              v-model.trim="form.email"
              autocomplete="username"
              placeholder="邮箱或用户名"
              :disabled="loading"
            />
          </label>

          <label>
            <span class="field-row">
              <span>密码</span>
              <button type="button" class="forgot-link" @click="showResetHelp = !showResetHelp">
                忘记密码？
              </button>
            </span>
            <div class="password-field">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="请输入密码"
                :disabled="loading"
              />
              <button type="button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">
                <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
          </label>

          <p v-if="showResetHelp" class="reset-help">
            <i class="fas fa-circle-info"></i>
            请联系课程教师或平台管理员重置密码；校内账号可先确认邮箱/用户名是否输入正确。
          </p>

          <div class="test-account-panel" aria-label="测试账号快捷填充">
            <div class="test-account-head">
              <span>测试账号</span>
              <small>一键填充，不会自动登录</small>
            </div>
            <div class="test-account-grid">
              <button
                v-for="account in testAccounts"
                :key="account.role"
                type="button"
                class="test-account-btn"
                :disabled="loading"
                @click="fillTestAccount(account)"
              >
                <i class="fas" :class="account.icon"></i>
                <span>
                  <strong>{{ account.label }}</strong>
                  <small>{{ account.email }}</small>
                </span>
              </button>
            </div>
          </div>

          <button class="login-submit" type="submit" :disabled="loading || !canSubmit">
            <i class="fas" :class="loading ? 'fa-circle-notch fa-spin' : activeRole.submitIcon"></i>
            <span>{{ loading ? '正在验证账号' : activeRole.submitLabel }}</span>
          </button>

          <p v-if="status" class="login-status" :class="statusTone">
            <i class="fas" :class="statusTone === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation'"></i>
            {{ status }}
          </p>
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
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginUser } from '@/api/authApi';
import { useAuthStore } from '@/stores/auth';
import { brandName, schoolName } from '@/constants/brand';
import { getPrimaryWorkspaceTarget, isTeacherLike } from '@/utils/userRole';

const AUTH_REDIRECT_KEY = 'auth_redirect';

const router = useRouter();
const authStore = useAuthStore();
authStore.hydrate();

const form = reactive({ email: '', password: '' });
const selectedRole = ref('student');
const status = ref('');
const statusTone = ref('error');
const loading = ref(false);
const showPassword = ref(false);
const showResetHelp = ref(false);
const redirectPath = ref('');

const testAccounts = [
  {
    role: 'student',
    label: '学生测试号',
    email: 'test01@school.local',
    password: 'hvb9v7',
    icon: 'fa-user-graduate'
  },
  {
    role: 'teacher',
    label: '教师测试号',
    email: 'teacher01@school.local',
    password: 'mncxsj',
    icon: 'fa-chalkboard-teacher'
  }
];

const roleOptions = [
  {
    id: 'student',
    title: '学生入口',
    badge: 'Student',
    description: '课题、日志、提交与协作',
    submitLabel: '进入学生工作台',
    submitIcon: 'fa-rocket',
    icon: 'fa-user-graduate',
    steps: ['项目广场', '立项导航', '阶段提交']
  },
  {
    id: 'teacher',
    title: '教师入口',
    badge: 'Faculty',
    description: '评审、审批、课程维护',
    submitLabel: '进入教师后台',
    submitIcon: 'fa-chalkboard-teacher',
    icon: 'fa-chalkboard-teacher',
    steps: ['待评审项目', '物资审批', '课程维护']
  }
];

const activeRole = computed(() => roleOptions.find(item => item.id === selectedRole.value) || roleOptions[0]);
const activeRoleSteps = computed(() => activeRole.value.steps);
const canSubmit = computed(() => form.email.trim() && form.password);
const redirectHint = computed(() => {
  if (!redirectPath.value) return '';
  const routeLabels = {
    '/teacher': '教师后台',
    '/workspace': '学生工作台',
    '/account': '个人中心',
    '/tools': '工具中心',
    '/mission-control': 'Mission Control'
  };
  return routeLabels[redirectPath.value] || redirectPath.value;
});

function getStoredRedirect() {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(AUTH_REDIRECT_KEY) || '';
}

function syncRoleFromRedirect(path) {
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

function fillTestAccount(account) {
  form.email = account.email;
  form.password = account.password;
  selectedRole.value = account.role;
  showPassword.value = true;
  statusTone.value = 'success';
  status.value = `已填充${account.label}，点击登录即可进入。`;
}

async function handleSubmit() {
  if (!canSubmit.value || loading.value) return;
  status.value = '';
  statusTone.value = 'error';
  loading.value = true;
  try {
    const user = await loginUser(form.email, form.password);
    authStore.hydrate();
    selectedRole.value = isTeacherLike(user.role) ? 'teacher' : 'student';
    statusTone.value = 'success';
    status.value = isTeacherLike(user.role) ? '教师账号验证通过，正在进入后台。' : '学生账号验证通过，正在进入工作台。';
    redirectAfterLogin(user);
  } catch (err) {
    statusTone.value = 'error';
    status.value = `登录失败：${err.message}`;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  redirectPath.value = getStoredRedirect();
  syncRoleFromRedirect(redirectPath.value);
  if (authStore.isAuthenticated && authStore.user) {
    redirectAfterLogin(authStore.user);
  }
});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  display: grid;
  align-items: center;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.96) 48%, rgba(238, 242, 255, 0.94)),
    radial-gradient(circle at 18% 18%, rgba(14, 165, 233, 0.16), transparent 28%),
    radial-gradient(circle at 82% 20%, rgba(99, 102, 241, 0.18), transparent 32%);
  padding: 88px 24px 40px;
}

.login-page::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.58;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(180deg, #000, transparent 82%);
}

.login-page::after {
  content: '';
  position: absolute;
  inset: auto -8% -28% -8%;
  height: 48vh;
  pointer-events: none;
  background:
    linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.2), transparent),
    linear-gradient(115deg, transparent 18%, rgba(14, 165, 233, 0.14) 42%, transparent 68%);
  filter: blur(24px);
  transform: skewY(-8deg);
  animation: lightSweep 9s ease-in-out infinite alternate;
}

.ambient {
  position: absolute;
  width: 34rem;
  height: 34rem;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(34px);
  opacity: 0.42;
  mix-blend-mode: multiply;
}

.ambient-one {
  top: -10rem;
  right: 6%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.34), transparent 66%);
  animation: driftOne 12s ease-in-out infinite alternate;
}

.ambient-two {
  left: -12rem;
  bottom: -10rem;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.24), transparent 66%);
  animation: driftTwo 14s ease-in-out infinite alternate;
}

.orbit-field {
  position: absolute;
  inset: 12% 8% auto auto;
  width: 28rem;
  height: 28rem;
  pointer-events: none;
  opacity: 0.75;
}

.orbit {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(99, 102, 241, 0.18);
  border-radius: 999px;
  transform: rotateX(66deg) rotateZ(18deg);
}

.orbit::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -4px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #2563eb;
  box-shadow: 0 0 22px rgba(37, 99, 235, 0.78);
}

.orbit-a {
  animation: orbitSpin 11s linear infinite;
}

.orbit-b {
  inset: 48px;
  border-color: rgba(14, 165, 233, 0.2);
  animation: orbitSpin 15s linear infinite reverse;
}

.orbit-c {
  inset: 96px;
  border-color: rgba(15, 23, 42, 0.11);
  animation: orbitSpin 18s linear infinite;
}

.login-brand {
  position: absolute;
  top: 22px;
  left: 24px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #0f172a;
  text-decoration: none;
}

.brand-mark {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #111827;
  color: #fff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.login-brand strong,
.login-brand small {
  display: block;
}

.login-brand strong {
  font-family: 'Outfit', 'Noto Sans SC', sans-serif;
  font-size: 1rem;
  font-weight: 800;
}

.login-brand small {
  margin-top: 2px;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
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
  animation: introRise 0.72s ease-out both;
}

.login-eyebrow,
.panel-kicker {
  margin: 0;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.login-intro h1 {
  margin: 18px 0 0;
  color: #0f172a;
  font-family: 'Outfit', 'Noto Sans SC', sans-serif;
  font-size: clamp(2.8rem, 6.2vw, 6.4rem);
  font-weight: 800;
  line-height: 0.98;
  letter-spacing: 0;
  text-wrap: balance;
}

.login-lead {
  margin: 22px 0 0;
  max-width: 560px;
  color: #475569;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.85;
}

.role-preview {
  display: grid;
  gap: 12px;
  margin-top: 34px;
  max-width: 540px;
}

.role-option {
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 14px;
  align-items: center;
  min-height: 76px;
  border: 1px solid rgba(203, 213, 225, 0.72);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.62);
  padding: 14px;
  color: #334155;
  text-align: left;
  backdrop-filter: blur(14px);
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
  font-size: 0.78rem;
  font-weight: 700;
}

.role-option:hover,
.role-option.active {
  border-color: #6366f1;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 24px 54px -36px rgba(79, 70, 229, 0.68);
  transform: translateY(-2px);
}

.role-option.active i {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  box-shadow: 0 14px 28px -18px rgba(37, 99, 235, 0.95);
}

.login-rhythm {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.login-rhythm span {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid #dbeafe;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: #334155;
  font-size: 0.76rem;
  font-weight: 800;
}

.signal-panel {
  position: relative;
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 1fr;
  gap: 10px;
  width: min(420px, 100%);
  height: 54px;
  margin-top: 30px;
}

.signal-panel span {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.56);
  border: 1px solid rgba(203, 213, 225, 0.58);
}

.signal-panel span::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.32), transparent);
  animation: signalRun 2.8s ease-in-out infinite;
}

.signal-panel span:nth-child(2)::after {
  animation-delay: 0.45s;
}

.signal-panel span:nth-child(3)::after {
  animation-delay: 0.85s;
}

.login-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.82));
  padding: 30px;
  box-shadow: 0 34px 82px -46px rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(22px);
  animation: panelRise 0.7s 0.08s ease-out both;
}

.login-panel::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 2px;
  background: linear-gradient(90deg, transparent, #2563eb, #14b8a6, transparent);
  animation: borderPulse 4s ease-in-out infinite;
}

.login-panel::after {
  content: '';
  position: absolute;
  top: -42%;
  left: -40%;
  width: 70%;
  height: 180%;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.54), transparent);
  transform: rotate(16deg);
  animation: glassGlide 8s ease-in-out infinite;
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
  font-family: 'Outfit', 'Noto Sans SC', sans-serif;
  font-size: 2.08rem;
  font-weight: 800;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 11px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.redirect-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 20px 0 0;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  background: #f0f9ff;
  padding: 11px 12px;
  color: #0369a1;
  font-size: 0.82rem;
  font-weight: 800;
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
  color: #2563eb;
  padding: 0;
  font-size: 0.78rem;
  font-weight: 900;
  cursor: pointer;
}

.forgot-link:hover {
  color: #1d4ed8;
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
  border-color: #2563eb;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
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
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
}

.password-field button:hover {
  background: #eff6ff;
  color: #2563eb;
}

.reset-help {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: start;
  margin: -2px 0 0;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: rgba(239, 246, 255, 0.82);
  padding: 10px 12px;
  color: #1e40af;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.55;
  animation: helpIn 0.22s ease-out both;
}

.test-account-panel {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(203, 213, 225, 0.8);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
}

.test-account-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}

.test-account-head span {
  color: #0f172a;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.test-account-head small {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 700;
}

.test-account-grid {
  display: grid;
  gap: 10px;
}

.test-account-btn {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  align-items: center;
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 12px;
  color: #334155;
  text-align: left;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.test-account-btn:hover:not(:disabled) {
  border-color: #c7d2fe;
  background: #eef2ff;
  transform: translateY(-1px);
  box-shadow: 0 14px 28px -22px rgba(99, 102, 241, 0.35);
}

.test-account-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.test-account-btn i {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f8fafc;
  color: #6366f1;
}

.test-account-btn strong,
.test-account-btn small {
  display: block;
}

.test-account-btn strong {
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 900;
}

.test-account-btn small {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 700;
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
  background: linear-gradient(135deg, #0f172a, #1e293b 52%, #2563eb);
  color: #fff;
  font-size: 0.94rem;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.login-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: saturate(1.08);
  box-shadow: 0 18px 34px -24px rgba(37, 99, 235, 0.88);
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

.panel-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 700;
}

.panel-footer a {
  color: #2563eb;
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

  .orbit-field {
    opacity: 0.32;
    right: -8rem;
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

  .signal-panel {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ambient,
  .orbit,
  .signal-panel span::after,
  .login-page::after,
  .login-panel,
  .login-panel::before,
  .login-panel::after,
  .login-intro,
  .reset-help {
    animation: none;
  }
}

@keyframes introRise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes panelRise {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes driftOne {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(-56px, 42px, 0) scale(1.08);
  }
}

@keyframes driftTwo {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }
  to {
    transform: translate3d(68px, -42px, 0) scale(1.06);
  }
}

@keyframes orbitSpin {
  from {
    transform: rotateX(66deg) rotateZ(0deg);
  }
  to {
    transform: rotateX(66deg) rotateZ(360deg);
  }
}

@keyframes signalRun {
  0%,
  18% {
    transform: translateX(-100%);
  }
  52%,
  100% {
    transform: translateX(100%);
  }
}

@keyframes lightSweep {
  from {
    transform: translateX(-4%) skewY(-8deg);
    opacity: 0.35;
  }
  to {
    transform: translateX(5%) skewY(-8deg);
    opacity: 0.72;
  }
}

@keyframes borderPulse {
  0%,
  100% {
    opacity: 0.38;
  }
  50% {
    opacity: 1;
  }
}

@keyframes glassGlide {
  0%,
  38% {
    transform: translateX(-30%) rotate(16deg);
    opacity: 0;
  }
  52% {
    opacity: 0.68;
  }
  78%,
  100% {
    transform: translateX(240%) rotate(16deg);
    opacity: 0;
  }
}

@keyframes helpIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

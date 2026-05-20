<template>
  <section class="auth selection:bg-indigo-100 selection:text-indigo-900">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>

    <div class="card glass-card">
      <div class="card-head">
        <h2>创建账号</h2>
        <p class="muted">注册学生、教师或评审专家账号</p>
      </div>

      <form @submit.prevent="handleSubmit" class="form">
        <label>
          <span>姓名</span>
          <input v-model="form.name" placeholder="请输入真实姓名" :disabled="loading" />
        </label>
        <label>
          <span>邮箱</span>
          <input v-model="form.email" placeholder="email@example.com" :disabled="loading" />
        </label>
        <label>
          <span>密码</span>
          <input type="password" v-model="form.password" placeholder="密码（至少 6 位）" :disabled="loading" />
        </label>
        <label>
          <span>注册角色</span>
          <select v-model="form.role" :disabled="loading">
            <option value="student">学生 (Student)</option>
            <option value="teacher">教师 (Faculty)</option>
            <option value="judge">评委 (Judge)</option>
          </select>
        </label>
        <label v-if="showInvite">
          <span>邀请码</span>
          <input v-model="form.inviteCode" placeholder="请输入内部邀请码" :disabled="loading" />
        </label>
        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? '正在注册...' : '提交注册' }}
        </button>
        <div class="status" v-if="status">{{ status }}</div>
      </form>

      <div class="footer">
        <RouterLink to="/login">已有账号？立即登录</RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { registerUser } from '@/api/authApi';

const router = useRouter();
const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'student',
  inviteCode: ''
});

const status = ref('');
const loading = ref(false);
const showInvite = computed(() => form.role === 'teacher' || form.role === 'judge');

async function handleSubmit() {
  status.value = '';
  const email = String(form.email || '').trim();
  const password = String(form.password || '');
  if (!form.name.trim()) {
    status.value = '注册失败：请输入姓名';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    status.value = '注册失败：请输入有效邮箱';
    return;
  }
  if (password.length < 6) {
    status.value = '注册失败：密码至少 6 位';
    return;
  }
  loading.value = true;
  try {
    const user = await registerUser({
      name: form.name,
      email,
      password,
      role: form.role,
      inviteCode: String(form.inviteCode || '').trim()
    });
    status.value = '注册成功，正在跳转...';
    router.replace(user.role === 'teacher' || user.role === 'judge' ? '/teacher' : '/workspace');
  } catch (err) {
    status.value = `注册失败：${err.message}`;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth {
  min-height: 100vh;
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.96) 48%, rgba(238, 242, 255, 0.94)),
    radial-gradient(circle at 18% 18%, rgba(14, 165, 233, 0.12), transparent 28%),
    radial-gradient(circle at 82% 20%, rgba(99, 102, 241, 0.14), transparent 32%);
  padding: 40px 16px;
}

.auth::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.58;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(180deg, #000, transparent 82%);
}

.ambient {
  position: absolute;
  width: 30rem;
  height: 30rem;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(34px);
  opacity: 0.35;
  mix-blend-mode: multiply;
}

.ambient-one {
  top: -8rem;
  right: 10%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent 66%);
}

.ambient-two {
  left: -10rem;
  bottom: -8rem;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.2), transparent 66%);
}

.card {
  position: relative;
  z-index: 1;
  width: min(460px, 100%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  padding: 34px;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.08);
  display: grid;
  gap: 20px;
}

.card-head h2 {
  margin: 0;
  font-family: inherit;
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
}

.card-head p {
  margin: 6px 0 0;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 700;
}

.form {
  display: grid;
  gap: 16px;
}

label {
  display: grid;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 800;
  color: #475569;
}

input, select {
  width: 100%;
  min-height: 44px;
  border: 1px solid #dbe4f0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  padding: 0 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f172a;
  outline: none;
  transition: all 0.2s ease;
}

input:focus, select:focus {
  border-color: #4f46e5;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
}

.primary {
  border: none;
  min-height: 46px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
  transition: all 0.2s ease;
}

.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.25);
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status {
  font-size: 0.78rem;
  font-weight: 800;
  color: #ef4444;
  padding: 10px;
  border-radius: 8px;
  background: #fef2f2;
}

.footer {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-align: center;
}

.footer a {
  color: #4f46e5;
  font-weight: 800;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}
</style>

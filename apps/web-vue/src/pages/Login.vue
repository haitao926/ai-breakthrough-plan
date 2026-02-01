<template>
  <section class="auth">
    <div class="card">
      <h2>登录</h2>
      <p class="muted">使用邮箱或用户名登录。</p>

      <form @submit.prevent="handleSubmit" class="form">
        <label>
          <span>账号</span>
          <input v-model="form.email" placeholder="邮箱或用户名" />
        </label>
        <label>
          <span>密码</span>
          <input type="password" v-model="form.password" placeholder="密码" />
        </label>
        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <div class="status" v-if="status">{{ status }}</div>
      </form>

      <div class="footer">
        <RouterLink to="/register">没有账号？注册</RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginUser, getCurrentUser } from '@/api/authApi';

const router = useRouter();
const form = reactive({ email: '', password: '' });
const status = ref('');
const loading = ref(false);

function redirectAfterLogin(user) {
  const redirect = window.sessionStorage.getItem('auth_redirect');
  if (redirect) {
    window.sessionStorage.removeItem('auth_redirect');
    router.replace(redirect);
    return;
  }
  router.replace(user.role === 'teacher' || user.role === 'judge' ? '/teacher' : '/workspace');
}

async function handleSubmit() {
  status.value = '';
  loading.value = true;
  try {
    const user = await loginUser(form.email, form.password);
    status.value = '登录成功，正在跳转...';
    redirectAfterLogin(user);
  } catch (err) {
    status.value = `登录失败：${err.message}`;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const existing = getCurrentUser();
  if (existing) redirectAfterLogin(existing);
});
</script>

<style scoped>
.auth {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f8fafc;
}
.card {
  width: min(420px, 90vw);
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  display: grid;
  gap: 16px;
}
.form {
  display: grid;
  gap: 12px;
}
label {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}
input {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 14px;
}
.primary {
  border: none;
  background: #4f46e5;
  color: #fff;
  padding: 10px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}
.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.status {
  font-size: 12px;
  color: #ef4444;
}
.footer {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}
.muted {
  font-size: 12px;
  color: #6b7280;
}
</style>

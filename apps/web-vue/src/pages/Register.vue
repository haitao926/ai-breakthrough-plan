<template>
  <section class="auth">
    <div class="card">
      <h2>注册</h2>
      <p class="muted">创建学生/教师账号。</p>

      <form @submit.prevent="handleSubmit" class="form">
        <label>
          <span>姓名</span>
          <input v-model="form.name" placeholder="姓名" />
        </label>
        <label>
          <span>邮箱</span>
          <input v-model="form.email" placeholder="邮箱" />
        </label>
        <label>
          <span>密码</span>
          <input type="password" v-model="form.password" placeholder="至少 6 位" />
        </label>
        <label>
          <span>角色</span>
          <select v-model="form.role">
            <option value="student">学生</option>
            <option value="teacher">老师</option>
            <option value="judge">评委</option>
          </select>
        </label>
        <label v-if="showInvite">
          <span>邀请码</span>
          <input v-model="form.inviteCode" placeholder="老师/评委邀请码" />
        </label>
        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <div class="status" v-if="status">{{ status }}</div>
      </form>

      <div class="footer">
        <RouterLink to="/login">已有账号？登录</RouterLink>
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
  display: grid;
  place-items: center;
  background: #f8fafc;
}
.card {
  width: min(460px, 90vw);
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
input, select {
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

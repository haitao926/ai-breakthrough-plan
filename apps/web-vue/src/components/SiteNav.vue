<template>
  <nav class="site-nav">
    <div class="nav-inner">
      <div class="logo">
        <RouterLink to="/">AI 破壁计划</RouterLink>
      </div>
      <div class="links">
        <RouterLink :class="{ active: active === 'knowledge' }" to="/knowledge">创新知识库</RouterLink>
        <RouterLink :class="{ active: active === 'competencies' }" to="/competencies">学术指导</RouterLink>
        <RouterLink :class="{ active: active === 'projects' }" to="/projects">项目库</RouterLink>
        <RouterLink :class="{ active: active === 'downloads' }" to="/downloads">课程资料库</RouterLink>
      </div>
      <div class="actions">
        <RouterLink v-if="!user" class="link" to="/login">登录</RouterLink>
        <RouterLink v-if="!user" class="primary" to="/register">注册</RouterLink>
        <RouterLink v-else class="primary" :to="user.role === 'teacher' ? '/teacher' : '/workspace'">进入工作台</RouterLink>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  active: { type: String, default: '' }
});

const authStore = useAuthStore();
authStore.hydrate();
const { user } = storeToRefs(authStore);

const active = computed(() => props.active);
</script>

<style scoped>
.site-nav {
  position: fixed;
  top: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e5e7eb;
  z-index: 50;
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.logo a {
  font-weight: 700;
  color: #111827;
  text-decoration: none;
}
.links {
  display: flex;
  gap: 12px;
}
.links a {
  font-size: 14px;
  color: #6b7280;
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 999px;
}
.links a.active {
  background: #eef2ff;
  color: #4338ca;
}
.actions {
  display: flex;
  gap: 8px;
}
.link {
  font-size: 14px;
  color: #4b5563;
  text-decoration: none;
  padding: 6px 10px;
}
.primary {
  background: #4f46e5;
  color: #fff;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 14px;
}
</style>

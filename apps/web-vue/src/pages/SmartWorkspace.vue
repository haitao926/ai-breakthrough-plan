<template>
  <div class="smart">
    <div class="card">
      <h2>智能工作台已合并</h2>
      <p>该入口已合并到新版工作台，正在为你跳转。</p>
      <RouterLink :to="{ path: '/workspace', query: route.query }">如果没有自动跳转，点击这里</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

onMounted(() => {
  router.replace({ path: '/workspace', query: route.query });
});
</script>

<style scoped>
.smart {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #f8fafc;
}
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  max-width: 420px;
}
.card a {
  color: #4f46e5;
  text-decoration: none;
}
</style>

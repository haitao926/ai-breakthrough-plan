<template>
  <div class="smart">
    <div class="card-base max-w-[420px] text-center">
      <h2 class="typo-page-title">智能工作台已合并</h2>
      <p class="typo-body text-slate-500 mt-2">该入口已合并到新版工作台，正在为你跳转。</p>
      <RouterLink class="btn-ghost mt-4 inline-flex items-center justify-center" :to="{ path: '/workspace', query: route.query }">如果没有自动跳转，点击这里</RouterLink>
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
</style>

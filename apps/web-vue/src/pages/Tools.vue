<template>
  <section class="tools">
    <header class="tools__header">
      <div>
        <h2 class="typo-page-title">工具集合</h2>
        <p class="typo-caption-compact text-slate-500">工具已迁移至 Vue 版本。</p>
      </div>
    </header>

    <div class="grid">
      <RouterLink class="card-base group" :to="{ path: '/tools/charter', query: projectQuery }">
        <h3 class="typo-card-title group-hover:text-indigo-600 transition-colors">项目立项书</h3>
        <p class="typo-body text-slate-500">梳理目标用户、痛点与价值。</p>
        <span class="typo-inline-label text-indigo-600">进入</span>
      </RouterLink>

      <RouterLink class="card-base group" :to="{ path: '/tools/pre_research', query: projectQuery }">
        <h3 class="typo-card-title group-hover:text-indigo-600 transition-colors">前期调研</h3>
        <p class="typo-body text-slate-500">记录调研方法与关键发现。</p>
        <span class="typo-inline-label text-indigo-600">进入</span>
      </RouterLink>

      <RouterLink class="card-base group" :to="{ path: '/tools/literature', query: projectQuery }">
        <h3 class="typo-card-title group-hover:text-indigo-600 transition-colors">文献阅读</h3>
        <p class="typo-body text-slate-500">整理论文与阅读笔记。</p>
        <span class="typo-inline-label text-indigo-600">进入</span>
      </RouterLink>

      <RouterLink class="card-base group" :to="{ path: '/tools/innovation', query: projectQuery }">
        <h3 class="typo-card-title group-hover:text-indigo-600 transition-colors">创新点梳理</h3>
        <p class="typo-body text-slate-500">明确创新点与验证方式。</p>
        <span class="typo-inline-label text-indigo-600">进入</span>
      </RouterLink>

      <RouterLink class="card-base group" :to="{ path: '/tools/kanban', query: projectQuery }">
        <h3 class="typo-card-title group-hover:text-indigo-600 transition-colors">任务规划 (Tasks)</h3>
        <p class="typo-body text-slate-500">规划清单 + 看板执行。</p>
        <span class="typo-inline-label text-indigo-600">进入</span>
      </RouterLink>

      <RouterLink class="card-base group" :to="{ path: '/tools/devlog', query: projectQuery }">
        <h3 class="typo-card-title group-hover:text-indigo-600 transition-colors">实施日志</h3>
        <p class="typo-body text-slate-500">记录过程与贡献，形成实践证据。</p>
        <span class="typo-inline-label text-indigo-600">进入</span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const projectId = computed(() => route.query.project);

const projectQuery = computed(() => ({ project: projectId.value }));
</script>

<style scoped>
.tools {
  display: grid;
  gap: 20px;
}
.tools__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
</style>

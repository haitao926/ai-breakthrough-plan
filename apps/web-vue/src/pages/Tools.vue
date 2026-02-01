<template>
  <section class="tools">
    <header class="tools__header">
      <div>
        <h2>工具集合</h2>
        <p class="muted">工具已迁移至 Vue 版本。</p>
      </div>
    </header>

    <div class="grid">
      <RouterLink class="card" :to="{ path: '/tools/charter', query: projectQuery }">
        <h3>项目立项书</h3>
        <p>梳理目标用户、痛点与价值。</p>
        <span class="link">进入</span>
      </RouterLink>

      <RouterLink class="card" :to="{ path: '/tools/pre_research', query: projectQuery }">
        <h3>前期调研</h3>
        <p>记录调研方法与关键发现。</p>
        <span class="link">进入</span>
      </RouterLink>

      <RouterLink class="card" :to="{ path: '/tools/literature', query: projectQuery }">
        <h3>文献阅读</h3>
        <p>整理论文与阅读笔记。</p>
        <span class="link">进入</span>
      </RouterLink>

      <RouterLink class="card" :to="{ path: '/tools/innovation', query: projectQuery }">
        <h3>创新点梳理</h3>
        <p>明确创新点与验证方式。</p>
        <span class="link">进入</span>
      </RouterLink>

      <RouterLink class="card" :to="{ path: '/tools/wbs', query: projectQuery }">
        <h3>WBS 拆解</h3>
        <p>拆解任务形成执行计划。</p>
        <span class="link">进入</span>
      </RouterLink>

      <RouterLink class="card" :to="{ path: '/tools/kanban', query: projectQuery }">
        <h3>敏捷看板</h3>
        <p>拖拽式任务管理。</p>
        <span class="link">进入</span>
      </RouterLink>

      <RouterLink class="card" :to="{ path: '/tools/devlog', query: projectQuery }">
        <h3>实施日志</h3>
        <p>记录过程与贡献，形成实践证据。</p>
        <span class="link">进入</span>
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
.card {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  text-decoration: none;
  color: inherit;
  display: grid;
  gap: 8px;
}
.card h3 {
  margin: 0;
}
.card p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}
.link {
  color: #4f46e5;
  font-size: 12px;
  font-weight: 600;
}
.muted {
  font-size: 12px;
  color: #6b7280;
}
</style>

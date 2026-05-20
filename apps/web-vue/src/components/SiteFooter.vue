<template>
  <footer class="site-footer typo-caption-compact text-slate-400">
    <div>© 2025 {{ footerLabel }}</div>
  </footer>
</template>

<script setup>
import { footerLabel } from '@/constants/brand';
</script>

<style scoped>
.site-footer {
  border-top: 1px solid #e5e7eb;
  padding: 24px 16px;
  text-align: center;
  background: #fff;
}
</style>

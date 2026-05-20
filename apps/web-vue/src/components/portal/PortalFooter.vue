<template>
  <footer class="border-t border-gray-200 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm">
      <div class="text-slate-500">© 2025 {{ footerLabel }}</div>
      <div class="flex flex-wrap gap-4 text-slate-500 font-medium">
        <RouterLink to="/knowledge" class="hover:text-indigo-600">创新知识库</RouterLink>
        <RouterLink to="/projects" class="hover:text-indigo-600">项目库</RouterLink>
        <RouterLink to="/downloads" class="hover:text-indigo-600">课程库</RouterLink>
        <RouterLink to="/competitions" class="hover:text-indigo-600">竞赛活动</RouterLink>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { footerLabel } from '@/constants/brand';
</script>

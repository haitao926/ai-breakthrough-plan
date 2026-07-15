<template>
  <div class="guide-mode-shell">
    <div class="guide-mode-card">
      <div class="guide-mode-head">
        <div>
          <div class="guide-mode-kicker">讲义模式</div>
          <h2 class="guide-mode-title">{{ title }}</h2>
        </div>
        <div class="guide-mode-note">优先展示课程导学或完整讲义</div>
      </div>
      <div v-if="loading" class="guide-mode-loading">
        <i class="fas fa-circle-notch text-3xl"></i>
      </div>
      <div v-else class="markdown-premium guide-mode-content" v-html="safeHtml(html)"></div>
    </div>
  </div>
</template>

<script setup>
import { safeHtml } from '../../utils/safeHtml.js';

defineProps({
  title: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  html: { type: String, default: '' }
});
</script>

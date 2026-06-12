<template>
  <footer class="portal-footer">
    <div class="portal-footer-shell">
      <div class="portal-footer-inner">
        <div class="portal-footer-copy">
          <div class="portal-footer-title">© 2025 {{ footerLabel }}</div>
        </div>
        <div class="portal-footer-links">
        <RouterLink to="/knowledge" class="footer-link">创新知识库</RouterLink>
        <RouterLink to="/projects" class="footer-link">项目库</RouterLink>
        <RouterLink to="/courses" class="footer-link">课程库</RouterLink>
        <RouterLink to="/competitions" class="footer-link">竞赛活动</RouterLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { footerLabel } from '@/constants/brand';
</script>

<style scoped>
.portal-footer-shell {
  width: min(1320px, calc(100vw - 40px));
  margin: 0 auto;
}

.portal-footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 8px;
  color: inherit;
  text-decoration: none;
  transition: color 0.18s ease;
}

.footer-link:hover {
  color: var(--color-brand-accent);
}

@media (max-width: 720px) {
  .portal-footer-shell {
    width: min(1320px, calc(100vw - 22px));
  }
}
</style>

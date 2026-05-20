<template>
  <header class="public-page-header" :class="{ 'public-page-header--split': layout === 'split' }">
    <div class="public-page-header__inner">
      <div class="public-page-header__copy">
        <p v-if="eyebrow" class="public-page-header__eyebrow">{{ eyebrow }}</p>
        <div class="public-page-header__headline">
          <h1 class="public-page-header__title">{{ title }}</h1>
          <div v-if="meta" class="public-page-header__meta">{{ meta }}</div>
        </div>
        <p v-if="description" class="public-page-header__description">{{ description }}</p>
      </div>

      <div v-if="$slots.default" class="public-page-header__aside">
        <slot />
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  meta: { type: String, default: '' },
  bannerItems: { type: Array, default: () => [] },
  layout: { type: String, default: 'stack' }
});
</script>

<style scoped>
.public-page-header {
  padding-top: 6.2rem;
  padding-bottom: 0.35rem;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(248, 250, 252, 0.9) 100%);
}

.public-page-header__inner {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 20px;
}

.public-page-header__inner {
  padding-bottom: 8px;
}

.public-page-header__copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.public-page-header__aside {
  min-width: 0;
}

.public-page-header__eyebrow {
  margin: 0;
  color: #4f46e5;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.public-page-header__headline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.public-page-header__title {
  margin: 0;
  color: #0f172a;
  font-family: inherit;
  font-size: clamp(1.42rem, 1.7vw, 1.8rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.public-page-header__description {
  margin: 0;
  max-width: 40rem;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.6;
}

.public-page-header__meta {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 11px;
  border-radius: 999px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: rgba(255, 255, 255, 0.88);
  color: #475569;
  font-size: 0.78rem;
  font-weight: 800;
}

@media (min-width: 1024px) {
  .public-page-header__inner {
    padding: 0 24px;
  }

  .public-page-header--split .public-page-header__inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(360px, 0.88fr);
    gap: clamp(24px, 3vw, 44px);
    align-items: start;
  }

  .public-page-header--split .public-page-header__copy {
    padding-bottom: 4px;
  }

  .public-page-header--split .public-page-header__headline {
    justify-content: flex-start;
  }

  .public-page-header--split .public-page-header__aside {
    justify-self: stretch;
    padding-bottom: 4px;
  }
}

@media (max-width: 720px) {
  .public-page-header {
    padding-top: 5.65rem;
  }

  .public-page-header__inner {
    padding: 0 14px;
  }

  .public-page-header--split .public-page-header__aside {
    margin-top: 12px;
  }
}
</style>

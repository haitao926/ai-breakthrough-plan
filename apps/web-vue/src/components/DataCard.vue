<template>
  <component :is="tag" class="data-card" :class="[`data-card--${tone}`, `data-card--${padding}`]">
    <div v-if="$slots.eyebrow || title || meta" class="data-card__header">
      <div class="data-card__heading">
        <slot name="eyebrow">
          <p v-if="eyebrow" class="data-card__eyebrow">{{ eyebrow }}</p>
        </slot>
        <slot name="title">
          <h2 v-if="title" class="data-card__title">{{ title }}</h2>
        </slot>
      </div>
      <div v-if="$slots.meta || meta" class="data-card__meta">
        <slot name="meta">
          <span>{{ meta }}</span>
        </slot>
      </div>
    </div>

    <div class="data-card__body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="data-card__footer">
      <slot name="footer" />
    </div>
  </component>
</template>

<script setup>
defineProps({
  tag: { type: String, default: 'section' },
  tone: { type: String, default: 'default' },
  padding: { type: String, default: 'md' },
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  meta: { type: String, default: '' }
});
</script>

<style scoped>
.data-card {
  position: relative;
  z-index: 1;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-card, 24px);
  background: var(--color-surface-card);
  box-shadow: var(--shadow-card);
}

.data-card--default {
  border-color: rgba(226, 232, 240, 0.72);
}

.data-card--soft {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
  border-color: rgba(226, 232, 240, 0.9);
}

.data-card--contrast {
  background: #0f172a;
  border-color: rgba(15, 23, 42, 0.95);
  color: #e2e8f0;
}

.data-card--sm {
  padding: 1.25rem;
}

.data-card--md {
  padding: 1.5rem;
}

.data-card--lg {
  padding: 2rem;
}

.data-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.data-card__heading {
  display: grid;
  gap: 0.35rem;
}

.data-card__eyebrow {
  margin: 0;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.data-card__title {
  margin: 0;
  color: currentColor;
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.25;
}

.data-card__meta {
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 800;
}

.data-card__body {
  min-width: 0;
}

.data-card__footer {
  margin-top: 1.5rem;
}
</style>

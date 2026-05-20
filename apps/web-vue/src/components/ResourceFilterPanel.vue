<template>
  <section class="resource-filter-panel" :class="`resource-filter-panel--${tone}`">
    <div class="resource-filter-panel__summary">
      <p v-if="eyebrow" class="resource-filter-panel__eyebrow">{{ eyebrow }}</p>
      <div class="resource-filter-panel__title-row">
        <h2>{{ title }}</h2>
        <span v-if="meta" class="resource-filter-panel__meta">{{ meta }}</span>
      </div>
      <p v-if="description" class="resource-filter-panel__description">{{ description }}</p>
    </div>

    <div class="resource-filter-panel__groups">
      <div
        v-for="group in groups"
        :key="group.id"
        class="resource-filter-panel__group"
      >
        <div class="resource-filter-panel__group-head">
          <span>{{ group.label }}</span>
          <button
            v-if="group.clearable && activeValue(group) !== group.defaultValue"
            type="button"
            class="resource-filter-panel__clear"
            @click="$emit('change', group.id, group.defaultValue)"
          >
            清除
          </button>
        </div>

        <div class="resource-filter-panel__chips" :aria-label="group.label">
          <button
            v-for="option in group.options"
            :key="option.value"
            type="button"
            class="resource-filter-panel__chip"
            :class="{ 'is-active': activeValue(group) === option.value }"
            :disabled="option.disabled"
            @click="$emit('change', group.id, option.value)"
          >
            <i v-if="option.icon" class="fas" :class="option.icon"></i>
            <span>{{ option.label }}</span>
            <strong v-if="option.count !== undefined">{{ option.count }}</strong>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  meta: { type: String, default: '' },
  tone: { type: String, default: 'indigo' },
  groups: { type: Array, default: () => [] }
});

defineEmits(['change']);

function activeValue(group) {
  if (group.activeValue !== undefined) return group.activeValue;
  return group.defaultValue;
}
</script>

<style scoped>
.resource-filter-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  align-items: center;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
  padding: 9px 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.035);
}

.resource-filter-panel--indigo {
  --panel-accent: #334155;
  --panel-accent-soft: #f1f5f9;
  --panel-active: #312e81;
  --panel-border: #cbd5e1;
}

.resource-filter-panel--blue {
  --panel-accent: #334155;
  --panel-accent-soft: #f1f5f9;
  --panel-active: #312e81;
  --panel-border: #cbd5e1;
}

.resource-filter-panel--rose {
  --panel-accent: #334155;
  --panel-accent-soft: #f1f5f9;
  --panel-active: #312e81;
  --panel-border: #cbd5e1;
}

.resource-filter-panel__summary {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding-right: 2px;
}

.resource-filter-panel__eyebrow {
  margin: 0;
  color: var(--panel-accent);
  font-size: 0.62rem;
  font-weight: 850;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.resource-filter-panel__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin-top: 0;
}

.resource-filter-panel__title-row h2 {
  margin: 0;
  color: #0f172a;
  font-size: 0.84rem;
  font-weight: 850;
  line-height: 1.2;
}

.resource-filter-panel__meta {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  border-radius: 999px;
  background: var(--panel-accent-soft);
  padding: 0 8px;
  color: #64748b;
  font-size: 0.66rem;
  font-weight: 850;
}

.resource-filter-panel__description {
  display: none;
}

.resource-filter-panel__groups {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex: 1;
  gap: 8px 20px;
  min-width: min(620px, 100%);
}

.resource-filter-panel__group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.resource-filter-panel__group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
  color: #64748b;
  font-size: 0.66rem;
  font-weight: 850;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.resource-filter-panel__clear {
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: none;
}

.resource-filter-panel__clear:hover {
  color: var(--panel-accent);
}

.resource-filter-panel__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.resource-filter-panel__chip {
  position: relative;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  padding: 0 9px;
  color: #475569;
  font-size: 0.74rem;
  font-weight: 800;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.resource-filter-panel__chip:hover:not(:disabled) {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.resource-filter-panel__chip.is-active {
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.16);
}

.resource-filter-panel__chip.is-active::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--panel-active);
}

.resource-filter-panel__chip:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.resource-filter-panel__chip strong {
  min-width: 18px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: #e2e8f0;
  padding: 0 5px;
  font-size: 0.64rem;
}

.resource-filter-panel__chip.is-active strong {
  background: #e2e8f0;
}

@media (max-width: 860px) {
  .resource-filter-panel {
    align-items: start;
  }
}

@media (max-width: 640px) {
  .resource-filter-panel {
    padding: 10px;
  }

  .resource-filter-panel__description {
    display: none;
  }

  .resource-filter-panel__groups {
    display: grid;
    gap: 8px;
  }

  .resource-filter-panel__chips {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .resource-filter-panel__chip {
    white-space: nowrap;
  }
}
</style>

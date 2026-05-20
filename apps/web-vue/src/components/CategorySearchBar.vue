<template>
  <section class="category-search-bar" :aria-label="title">
    <div class="category-search-bar__rail">
      <div class="category-search-bar__category">
        <label class="sr-only" :for="selectId">{{ categoryLabel }}</label>
        <select
          :id="selectId"
          class="category-search-bar__select"
          :value="category"
          @change="$emit('update:category', ($event.target).value)"
        >
          <option v-for="option in options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <i class="fas fa-chevron-down" aria-hidden="true"></i>
      </div>

      <div class="category-search-bar__divider" aria-hidden="true"></div>

      <div class="category-search-bar__search">
        <i class="fas fa-magnifying-glass" aria-hidden="true"></i>
        <label class="sr-only" :for="searchId">搜索</label>
        <input
          :id="searchId"
          class="category-search-bar__input"
          type="search"
          :value="search"
          :placeholder="placeholder"
          @input="$emit('update:search', ($event.target).value)"
        />
      </div>

      <button
        type="button"
        class="category-search-bar__clear"
        title="清空筛选"
        :disabled="clearDisabled"
        @click="$emit('clear')"
      >
        <i class="fas fa-xmark" aria-hidden="true"></i>
        <span class="sr-only">清空筛选</span>
      </button>

      <div v-if="meta" class="category-search-bar__meta">{{ meta }}</div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '搜索' },
  meta: { type: String, default: '' },
  categoryLabel: { type: String, default: '类别' },
  category: { type: String, default: 'all' },
  search: { type: String, default: '' },
  placeholder: { type: String, default: '输入关键词搜索' },
  options: { type: Array, default: () => [] },
  clearDisabled: { type: Boolean, default: false }
});

defineEmits(['update:category', 'update:search', 'clear']);

const selectId = `category-search-select-${Math.random().toString(36).slice(2, 8)}`;
const searchId = `category-search-input-${Math.random().toString(36).slice(2, 8)}`;
</script>

<style scoped>
.category-search-bar {
  margin-bottom: 24px;
  padding: 2px 0 12px;
  border-bottom: 1px solid rgba(203, 213, 225, 0.72);
}

.category-search-bar__rail {
  display: grid;
  grid-template-columns: minmax(142px, 190px) 1px minmax(220px, 1fr) 34px auto;
  gap: 0;
  align-items: center;
  min-height: 46px;
  border: 1px solid rgba(203, 213, 225, 0.82);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.category-search-bar__category,
.category-search-bar__search {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  height: 100%;
}

.category-search-bar__category {
  color: #334155;
}

.category-search-bar__category i {
  position: absolute;
  right: 14px;
  color: #94a3b8;
  font-size: 0.7rem;
  pointer-events: none;
}

.category-search-bar__select {
  width: 100%;
  height: 44px;
  border: 0;
  appearance: none;
  background: transparent;
  padding: 0 34px 0 16px;
  color: #0f172a;
  font-size: 0.86rem;
  font-weight: 800;
  outline: none;
}

.category-search-bar__divider {
  width: 1px;
  height: 22px;
  background: #e2e8f0;
}

.category-search-bar__search {
  gap: 10px;
  padding-left: 16px;
  color: #94a3b8;
}

.category-search-bar__search i {
  font-size: 0.86rem;
}

.category-search-bar__input {
  width: 100%;
  min-width: 0;
  height: 44px;
  border: 0;
  background: transparent;
  padding: 0 10px 0 0;
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 600;
  outline: none;
}

.category-search-bar__input::placeholder {
  color: #94a3b8;
  font-weight: 500;
}

.category-search-bar__select:focus,
.category-search-bar__input:focus {
  outline: none;
}

.category-search-bar__rail:focus-within {
  border-color: #94a3b8;
  box-shadow:
    0 14px 34px rgba(15, 23, 42, 0.05),
    0 0 0 3px rgba(148, 163, 184, 0.14);
}

.category-search-bar__clear {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  transition: 0.16s ease;
}

.category-search-bar__clear:not(:disabled):hover {
  background: #e2e8f0;
  color: #0f172a;
}

.category-search-bar__clear:disabled {
  opacity: 0.36;
  cursor: default;
}

.category-search-bar__meta {
  justify-self: end;
  padding: 0 16px 0 10px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 800;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .category-search-bar__rail {
    grid-template-columns: minmax(118px, 0.42fr) 1px minmax(0, 1fr) 34px;
  }

  .category-search-bar__meta {
    grid-column: 1 / -1;
    justify-self: start;
    width: 100%;
    border-top: 1px solid #e2e8f0;
    padding: 8px 14px 9px;
    font-size: 0.76rem;
  }
}

@media (max-width: 640px) {
  .category-search-bar {
    margin-bottom: 18px;
  }

  .category-search-bar__rail {
    grid-template-columns: minmax(0, 1fr) 34px;
  }

  .category-search-bar__category,
  .category-search-bar__search {
    grid-column: 1 / -1;
  }

  .category-search-bar__category {
    border-bottom: 1px solid #e2e8f0;
  }

  .category-search-bar__divider {
    display: none;
  }

  .category-search-bar__search {
    grid-column: 1 / 2;
  }

  .category-search-bar__clear {
    grid-column: 2 / 3;
    grid-row: 2;
    justify-self: center;
  }
}
</style>

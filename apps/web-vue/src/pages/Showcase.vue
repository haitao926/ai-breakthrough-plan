<template>
  <div class="page">
    <SiteNav />
    <section class="showcase">
      <header class="showcase__header">
        <h2>展示墙</h2>
        <div class="filters">
          <button v-for="item in showcaseFilters" :key="item.key" :class="{ active: filterKey === item.key }" @click="filterKey = item.key">
            {{ item.label }}
          </button>
        </div>
      </header>

      <div class="grid">
        <div v-for="item in filteredShowcase" :key="item.url" class="card">
          <img v-if="isImage(item.url)" :src="item.url" alt="showcase" />
          <video v-else controls :src="item.url"></video>
          <div class="meta">
            <span>{{ item.project }}</span>
            <span>{{ item.filename }}</span>
          </div>
        </div>
      </div>
    </section>
    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { apiFetch } from '@/api/client';
import SiteNav from '@/components/SiteNav.vue';
import SiteFooter from '@/components/SiteFooter.vue';

const showcaseItems = ref([]);
const filterKey = ref('all');

const showcaseFilters = [
  { key: 'all', label: '全部' },
  { key: 'project1', label: 'Vibe Coding' },
  { key: 'project2', label: '产品设计' },
  { key: 'project5', label: '智能硬件' }
];

const filteredShowcase = computed(() => {
  if (filterKey.value === 'all') return showcaseItems.value;
  return showcaseItems.value.filter(item => item.project === filterKey.value);
});

function isImage(url) {
  return /\.(png|jpe?g|gif|webp)$/i.test(url);
}

async function loadShowcase() {
  try {
    const res = await apiFetch('/showcase');
    const data = await res.json();
    const items = data.items || [];
    showcaseItems.value = items.flatMap(item => {
      const pid = `project${item.project?.id || ''}`;
      return (item.showcase?.attachments || []).map(att => ({
        project: pid,
        filename: att.name,
        url: att.url
      }));
    });
  } catch (err) {
    console.error(err);
  }
}

onMounted(loadShowcase);
</script>

<style scoped>
.page {
  background: #f8fafc;
  min-height: 100vh;
}
.showcase {
  display: grid;
  gap: 20px;
  max-width: 1100px;
  margin: 0 auto;
  padding: 120px 16px 60px;
}
.showcase__header {
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
  display: grid;
  gap: 8px;
}
.card img,
.card video {
  width: 100%;
  border-radius: 12px;
}
.meta {
  font-size: 12px;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
}
.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.filters button {
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}
.filters button.active {
  background: #111827;
  color: #fff;
}
</style>

<template>
  <div class="knowledge-page text-slate-800">
    <SiteNav active="knowledge" />

    <PublicPageHeader
      eyebrow="Knowledge"
      title="创新知识库"
      description="按学科视角进入，再往下看研究方向和研究问题。"
      :meta="headerMeta"
    />

    <main class="max-w-[1320px] mx-auto px-5 sm:px-6 lg:px-8 py-4 min-h-screen">
      <CategorySearchBar
        :meta="headerMeta"
        :category="filter"
        :search="searchTerm"
        :options="knowledgeCategoryOptions"
        :placeholder="knowledgeSearchPlaceholder"
        :clear-disabled="!searchTerm && filter === 'all'"
        @update:category="applyFilter"
        @update:search="searchTerm = $event"
        @clear="resetKnowledgeSearch"
      />

      <section ref="catalogRef" class="scroll-anchor">
        <div class="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="field in filteredFields"
            :key="field.id"
            class="knowledge-card group"
            :style="{ '--field-color': field.colorText, '--field-bg': field.colorBg }"
            @click="openField(field)"
          >
            <div class="knowledge-cover">
              <img v-if="field.image" :src="field.image" :alt="field.name" class="knowledge-cover-image" />
              <div v-else class="knowledge-cover-fallback" :style="{ backgroundColor: field.colorBg, color: field.colorText }">
                <i class="fas" :class="field.icon"></i>
              </div>
            </div>
            <div class="p-5">
              <div class="knowledge-node">
                <span>{{ categoryLabel(categoryKey(field)) }} · 研究方向</span>
                <strong>{{ field.research_questions?.length || 0 }} 个研究问题</strong>
              </div>
              <div class="knowledge-icon" :style="{ backgroundColor: field.colorBg, color: field.colorText }">
                <i class="fas" :class="field.icon"></i>
              </div>
              <h3 class="font-bold text-slate-900 mt-4 group-hover:text-indigo-600 transition-colors">{{ field.name }}</h3>
              <p class="text-xs text-slate-400">{{ field.en }}</p>
              <p class="text-xs text-slate-500 mt-3 leading-relaxed">{{ field.tagline || compactDefinition(field.definition) }}</p>
              <span class="inline-flex items-center text-xs font-bold text-indigo-600 mt-4 opacity-80 group-hover:opacity-100 transition-opacity">
                查看研究问题 <i class="fas fa-arrow-right ml-2 text-[10px]"></i>
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <div v-if="activeField" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="closeField"></div>
      <div class="relative bg-white w-full max-w-3xl rounded-2xl p-8 shadow-2xl knowledge-modal">
        <button class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition" @click="closeField">
          <i class="fas fa-times"></i>
        </button>
        <div class="knowledge-modal__header">
          <div>
            <div class="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-flex border border-indigo-100">
              {{ categoryLabel(categoryKey(activeField)) }}视角
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mt-4">{{ activeField.name }}</h3>
            <p class="text-sm text-slate-500 font-medium">{{ activeField.en }}</p>
            <p class="text-base text-slate-600 mt-5 leading-relaxed">{{ activeField.definition }}</p>
          </div>
          <div class="knowledge-modal__summary">
            <p class="knowledge-modal__summary-kicker">下一步会看到</p>
            <strong>{{ activeField.research_questions?.length || 0 }} 个研究问题</strong>
            <span>先从问题判断你是否值得继续投入，再决定要不要往课程或项目里延展。</span>
          </div>
        </div>

        <div v-if="activeField.research_questions?.length" class="mt-8">
          <div class="text-sm font-bold text-slate-800 mb-3">研究问题</div>
          <div class="space-y-3">
            <div v-for="item in activeField.research_questions" :key="item.q" class="rounded-xl border border-slate-100 bg-white px-4 py-4">
              <div class="font-bold text-slate-900 text-sm">{{ item.q }}</div>
              <p class="text-sm text-slate-500 mt-2 leading-6">{{ item.context }}</p>
            </div>
          </div>
        </div>

        <div class="mt-8 bg-slate-50 rounded-xl p-5 border border-slate-100">
          <div class="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
            <i class="fas fa-lightbulb text-yellow-500"></i> 为什么值得做
          </div>
          <p class="text-sm text-slate-600 leading-relaxed">{{ activeField.why_matters || activeField.tagline || '从真实问题中寻找研究与实践切口。' }}</p>
        </div>
      </div>
    </div>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';
import PublicPageHeader from '@/components/PublicPageHeader.vue';
import CategorySearchBar from '@/components/CategorySearchBar.vue';
import { apiFetch, readJsonResponse } from '@/api/client';

const route = useRoute();
const router = useRouter();
const filter = ref('all');
const searchTerm = ref('');
const activeField = ref(null);
const fieldsData = ref([]);
const catalogRef = ref(null);

const palette = {
  science: { bg: '#eff6ff', text: '#2563eb', icon: 'fa-flask' },
  engineering: { bg: '#eef2ff', text: '#4f46e5', icon: 'fa-microchip' },
  social: { bg: '#ecfeff', text: '#0891b2', icon: 'fa-users' },
  humanities: { bg: '#fff7ed', text: '#ea580c', icon: 'fa-feather-pointed' },
  all: { bg: '#f3f4f6', text: '#4b5563', icon: 'fa-book' }
};

function categoryKey(field) {
  if (!field) return 'all';
  const c = String(field.cat || '').toLowerCase();
  if (c === 'science') return 'science';
  if (c === 'engineering' || c === 'stem') return 'engineering';
  if (c === 'social') return 'social';
  if (c === 'humanities') return 'humanities';
  const id = String(field.id || '').toLowerCase();
  if (['env', 'physics', 'math', 'bio', 'medicine'].includes(id)) return 'science';
  if (['tech', 'cs', 'ai', 'robotics', 'materials', 'hci'].includes(id)) return 'engineering';
  if (['soc', 'psych', 'econ', 'edu', 'public_health', 'comm'].includes(id)) return 'social';
  return 'humanities';
}

function categoryLabel(key) {
  return {
    all: '全部',
    science: '理科',
    engineering: '工科',
    social: '社科',
    humanities: '人文'
  }[key] || key;
}

function compactDefinition(value) {
  const text = String(value || '').trim();
  if (!text) return '这个方向主要研究真实问题背后的学科逻辑。';
  return text.length > 46 ? `${text.slice(0, 46)}...` : text;
}

const normalizedFields = computed(() =>
  fieldsData.value.map(field => {
    const category = categoryKey(field);
    return {
      ...field,
      colorBg: palette[category]?.bg || palette.all.bg,
      colorText: palette[category]?.text || palette.all.text,
      icon: field.icon || palette[category]?.icon || palette.all.icon
    };
  })
);

const filteredFields = computed(() => {
  return normalizedFields.value
    .filter(field => filter.value === 'all' || categoryKey(field) === filter.value)
    .filter(matchesFieldSearch);
});

const headerMeta = computed(() => (
  filter.value === 'all'
    ? `${normalizedFields.value.length} 个研究方向`
    : `${categoryLabel(filter.value)} · ${filteredFields.value.length} 个研究方向`
));

const knowledgeCategoryOptions = [
  { value: 'all', label: '全部学科' },
  { value: 'science', label: '理科' },
  { value: 'engineering', label: '工科' },
  { value: 'social', label: '社科' },
  { value: 'humanities', label: '人文' }
];

const knowledgeSearchPlaceholder = computed(() => {
  const label = categoryLabel(filter.value);
  return filter.value === 'all'
    ? '搜索研究方向、问题或关键词'
    : `在${label}视角中搜索方向或研究问题`;
});

function openField(field) {
  activeField.value = field;
  document.body.style.overflow = 'hidden';
  router.replace({
    query: {
      ...route.query,
      focus: field.id,
      filter: categoryKey(field)
    }
  }).catch(() => {});
}

function closeField() {
  activeField.value = null;
  document.body.style.overflow = '';
  const query = { ...route.query };
  delete query.focus;
  router.replace({ query }).catch(() => {});
}

function scrollToCatalog() {
  nextTick(() => {
    catalogRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function applyFilter(key, { scroll = false } = {}) {
  filter.value = key;
  activeField.value = null;
  document.body.style.overflow = '';
  const query = { ...route.query };
  if (key === 'all') delete query.filter;
  else query.filter = key;
  delete query.focus;
  router.replace({ query }).catch(() => {});
  if (scroll) scrollToCatalog();
}

function matchesFieldSearch(field) {
  const keyword = searchTerm.value.trim().toLowerCase();
  if (!keyword) return true;
  return [
    field.name,
    field.en,
    field.definition,
    field.tagline,
    field.why_matters,
    ...(field.research_questions || []).flatMap(item => [item.q, item.context])
  ].filter(Boolean).join(' ').toLowerCase().includes(keyword);
}

function resetKnowledgeSearch() {
  searchTerm.value = '';
  applyFilter('all');
}

function syncFromRoute() {
  const nextFilter = ['all', 'science', 'engineering', 'social', 'humanities'].includes(String(route.query.filter || ''))
    ? String(route.query.filter)
    : 'all';

  filter.value = nextFilter;

  const focusId = String(route.query.focus || '');
  if (!focusId || !normalizedFields.value.length) {
    if (activeField.value) {
      activeField.value = null;
      document.body.style.overflow = '';
    }
    return;
  }

  const match = normalizedFields.value.find(field => String(field.id) === focusId);
  if (match) {
    activeField.value = match;
    document.body.style.overflow = 'hidden';
  }
}

watch([() => route.query.filter, () => route.query.focus, normalizedFields], () => {
  syncFromRoute();
}, { immediate: true });

watch(() => route.query.q, value => {
  const next = String(value || '');
  if (next !== searchTerm.value) searchTerm.value = next;
});

watch(searchTerm, value => {
  const query = { ...route.query };
  const q = value.trim();
  if (q) query.q = q;
  else delete query.q;
  router.replace({ query }).catch(() => {});
});

onMounted(async () => {
  try {
    searchTerm.value = String(route.query.q || '');
    const res = await apiFetch('/knowledge/disciplines');
    const data = await readJsonResponse(res, 'knowledge_disciplines');
    if (!res.ok) throw new Error(data?.error || 'knowledge_disciplines_failed');
    fieldsData.value = data.disciplines || [];
  } catch (err) {
    console.error(err);
    fieldsData.value = [];
  }
});
</script>

<style scoped>
.knowledge-page {
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.025) 1px, transparent 1px),
    linear-gradient(180deg, rgba(15, 23, 42, 0.025) 1px, transparent 1px),
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.08), transparent 30%),
    #f8fafc;
  background-size: 42px 42px, 42px 42px, 100% 100%, 100% 100%;
  min-height: 100vh;
}

.knowledge-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.02);
}

.knowledge-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--field-color);
  opacity: 0.75;
}

.knowledge-card:hover {
  border-color: var(--field-color);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.08);
  transform: translateY(-4px);
}


.knowledge-cover {
  height: 142px;
  background:
    linear-gradient(135deg, var(--field-bg), #ffffff),
    repeating-linear-gradient(0deg, rgba(15, 23, 42, 0.05) 0 1px, transparent 1px 14px);
  overflow: hidden;
}

.knowledge-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.knowledge-cover-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.knowledge-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.knowledge-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  border-bottom: 1px dashed #dbeafe;
  padding-bottom: 10px;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
}

.knowledge-node strong {
  color: var(--field-color);
  font-weight: 800;
}

.knowledge-modal {
  max-height: min(88vh, 860px);
  overflow-y: auto;
}

.knowledge-modal__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 18px;
  align-items: start;
}

.knowledge-modal__summary {
  border: 1px solid #dbeafe;
  border-radius: 18px;
  background: #eff6ff;
  padding: 16px;
}

.knowledge-modal__summary-kicker {
  margin: 0;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.knowledge-modal__summary strong {
  display: block;
  margin-top: 10px;
  color: #0f172a;
  font-size: 1.4rem;
  font-weight: 800;
}

.knowledge-modal__summary span {
  display: block;
  margin-top: 10px;
  color: #475569;
  font-size: 0.84rem;
  line-height: 1.6;
}

.scroll-anchor {
  scroll-margin-top: 110px;
}

@media (max-width: 980px) {
  .knowledge-modal__header {
    grid-template-columns: 1fr;
  }
}

</style>

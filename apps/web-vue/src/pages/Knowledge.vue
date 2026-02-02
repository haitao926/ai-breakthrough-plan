<template>
  <div class="page">
    <SiteNav active="knowledge" />

    <header class="hero">
      <div class="hero__inner">
        <h1>探索学术前沿，<span>点亮创新火花</span></h1>
        <p>这里汇集了 20+ 核心学科领域知识，帮助学生找到研究方向与创新灵感。</p>
      </div>
    </header>

    <main class="main">
      <section>
        <div class="section-header">
          <div>
            <h2>学科知识百科</h2>
            <p>20 大核心学科领域的入门指引与项目启发</p>
          </div>
          <div class="filters">
            <button :class="{ active: filter === 'all' }" @click="filter = 'all'">全部</button>
            <button :class="{ active: filter === 'stem' }" @click="filter = 'stem'">理工科 (STEM)</button>
            <button :class="{ active: filter === 'social' }" @click="filter = 'social'">社科 (Social)</button>
            <button :class="{ active: filter === 'humanities' }" @click="filter = 'humanities'">人文 (Humanities)</button>
          </div>
        </div>

        <div class="grid">
          <div v-for="field in filteredFields" :key="field.id" class="card" @click="openField(field)">
            <div class="icon" :style="{ backgroundColor: field.colorBg, color: field.colorText }">
              <i class="fas" :class="field.icon"></i>
            </div>
            <h3>{{ field.name }}</h3>
            <p class="muted">{{ field.en }}</p>
            <span class="hint">点击查看详情</span>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter />

    <div v-if="activeField" class="modal">
      <div class="backdrop" @click="closeField"></div>
      <div class="modal-panel">
        <button class="close" @click="closeField">×</button>
        <div class="modal-content">
          <div class="tag">{{ activeField.cat.toUpperCase() }}</div>
          <h3>{{ activeField.name }}</h3>
          <p class="muted">{{ activeField.en }}</p>
          <p class="desc">{{ activeField.desc }}</p>
          <div class="inspiration">
            <div class="title">项目启发</div>
            <p>{{ activeField.inspiration }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import SiteNav from '@/components/SiteNav.vue';
import SiteFooter from '@/components/SiteFooter.vue';

const filter = ref('all');
const activeField = ref(null);

const fieldsData = [
  {
    id: 'tech',
    name: '科技与工程',
    en: 'Technology and Engineering',
    cat: 'stem',
    icon: 'fa-microchip',
    color: 'blue',
    desc:
      '科技与工程让科学脱离纸面，触手可及。它带给我们便利、欢乐、更多机会和无限可能。',
    inspiration: '观看领域专家分享，结合往届项目案例，从学术研究与创新行动方向进行探索。'
  },
  { id: 'math', name: '应用数学', en: 'Applied Mathematics', cat: 'stem', icon: 'fa-calculator', color: 'indigo', desc: '数学是描述宇宙规律的语言，应用数学关注用模型解决现实问题。', inspiration: '用数学建模重新定义城市交通，或用统计算法优化资源分配。' },
  { id: 'cs', name: '计算机科学', en: 'Computer Science', cat: 'stem', icon: 'fa-laptop-code', color: 'blue', desc: '计算机科学不仅关乎代码，更关乎逻辑思维与解决问题的能力。', inspiration: '研究人工智能伦理，或开发辅助视障人士的交互应用。' },
  { id: 'physics', name: '物理与化学', en: 'Physics & Chemistry', cat: 'stem', icon: 'fa-atom', color: 'purple', desc: '探索物质的本质与能量转化，为技术创新提供理论支持。', inspiration: '研究新型环保材料，或探索家庭常见液体的物理特性。' },
  { id: 'env', name: '环境科学', en: 'Environmental Science', cat: 'stem', icon: 'fa-leaf', color: 'green', desc: '研究气候变化、生态保护与资源利用，寻找可持续未来。', inspiration: '调查校园碳足迹，或设计社区垃圾分类激励系统。' },
  { id: 'bio', name: '生命科学', en: 'Life Sciences', cat: 'stem', icon: 'fa-dna', color: 'red', desc: '从基因编辑到神经科学，生命科学重塑我们对健康的认知。', inspiration: '研究睡眠习惯对青少年记忆力的影响。' },
  { id: 'astro', name: '天文地理', en: 'Astronomy & Geography', cat: 'stem', icon: 'fa-globe-americas', color: 'blue', desc: '研究宇宙起源与地球演变，理解时空中的位置。', inspiration: '利用卫星数据分析城市光污染。' },
  { id: 'med', name: '医学', en: 'Medicine', cat: 'stem', icon: 'fa-heartbeat', color: 'red', desc: '关注疾病治疗与预防医学、医疗公平与健康体系优化。', inspiration: '设计针对老年人的急救科普方案。' },

  { id: 'soc', name: '社会学与人类学', en: 'Sociology & Anthropology', cat: 'social', icon: 'fa-users', color: 'orange', desc: '观察群体行为与社会关系，反思日常生活方式。', inspiration: '记录消失的方言文化或研究社交媒体影响。' },
  { id: 'econ', name: '经济学', en: 'Economics', cat: 'social', icon: 'fa-chart-line', color: 'emerald', desc: '研究资源配置与决策选择，从微观到宏观分析世界。', inspiration: '调查盲盒经济的消费心理。' },
  { id: 'psych', name: '心理学', en: 'Psychology', cat: 'social', icon: 'fa-brain', color: 'pink', desc: '探索认知、情绪与人格，理解自己与他人。', inspiration: '研究颜色对学习效率的影响。' },
  { id: 'edu', name: '教育学', en: 'Education', cat: 'social', icon: 'fa-chalkboard-teacher', color: 'yellow', desc: '关注教学法创新与终身学习，探索如何赋能未来一代。', inspiration: '设计跨学科 PBL 课程。' },
  { id: 'public_health', name: '公共健康', en: 'Public Health', cat: 'social', icon: 'fa-hospital-user', color: 'teal', desc: '关注流行病防控与健康政策，构建更健康的社会环境。', inspiration: '评估学校食堂的营养均衡度。' },
  { id: 'comm', name: '传播和媒体', en: 'Media & Communication', cat: 'social', icon: 'fa-broadcast', color: 'cyan', desc: '研究媒介如何塑造舆论、构建现实。', inspiration: '分析短视频算法对信息茧房的构建。' },

  { id: 'arch', name: '建筑与城市', en: 'Architecture & Urban Studies', cat: 'humanities', icon: 'fa-city', color: 'stone', desc: '研究建筑设计、城市规划与空间正义。', inspiration: '改造校园中的消极空间。' },
  { id: 'art', name: '艺术', en: 'Arts', cat: 'humanities', icon: 'fa-palette', color: 'rose', desc: '表达人类情感与想象，连接心灵与社会。', inspiration: '用装置艺术表达环保理念。' },
  { id: 'culture', name: '跨文化研究', en: 'Cross-Cultural Studies', cat: 'humanities', icon: 'fa-comments', color: 'fuchsia', desc: '研究文化间冲突与融合，培养全球胜任力。', inspiration: '比较不同文化对“成功”的定义。' },
  { id: 'lang', name: '语言学', en: 'Linguistics', cat: 'humanities', icon: 'fa-language', color: 'violet', desc: '研究语言结构、演变与社会功能。', inspiration: '分析网络流行语的构词规律。' },
  { id: 'lit', name: '文学', en: 'Literature', cat: 'humanities', icon: 'fa-feather-alt', color: 'amber', desc: '通过文本细读与批评洞察人性与历史。', inspiration: '改编经典文学作品为现代剧本。' },
  { id: 'sport', name: '体育和运动', en: 'Sports', cat: 'humanities', icon: 'fa-running', color: 'orange', desc: '研究运动科学、体育产业与体育文化。', inspiration: '设计久坐学生的体能恢复方案。' }
];

const palette = {
  blue: { bg: '#eff6ff', text: '#2563eb' },
  indigo: { bg: '#eef2ff', text: '#4f46e5' },
  purple: { bg: '#f3e8ff', text: '#7c3aed' },
  green: { bg: '#ecfdf3', text: '#059669' },
  red: { bg: '#fee2e2', text: '#dc2626' },
  orange: { bg: '#fff7ed', text: '#ea580c' },
  emerald: { bg: '#ecfdf5', text: '#059669' },
  pink: { bg: '#fce7f3', text: '#db2777' },
  yellow: { bg: '#fef9c3', text: '#ca8a04' },
  teal: { bg: '#f0fdfa', text: '#0d9488' },
  cyan: { bg: '#ecfeff', text: '#0891b2' },
  stone: { bg: '#f5f5f4', text: '#78716c' },
  rose: { bg: '#fff1f2', text: '#e11d48' },
  fuchsia: { bg: '#fdf4ff', text: '#c026d3' },
  violet: { bg: '#f5f3ff', text: '#7c3aed' },
  amber: { bg: '#fffbeb', text: '#d97706' }
};

const normalizedFields = computed(() =>
  fieldsData.map(field => ({
    ...field,
    colorBg: palette[field.color]?.bg || '#f3f4f6',
    colorText: palette[field.color]?.text || '#4b5563'
  }))
);

const filteredFields = computed(() => {
  if (filter.value === 'all') return normalizedFields.value;
  return normalizedFields.value.filter(field => field.cat === filter.value);
});

function openField(field) {
  activeField.value = field;
}

function closeField() {
  activeField.value = null;
}
</script>

<style scoped>
.page {
  background: #f8fafc;
  min-height: 100vh;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.hero {
  padding: 120px 16px 60px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.hero__inner {
  max-width: 1100px;
  margin: 0 auto;
  text-align: center;
}
.hero h1 {
  font-size: 36px;
  margin-bottom: 12px;
}
.hero h1 span {
  color: #6366f1;
}
.hero p {
  color: #6b7280;
  max-width: 640px;
  margin: 0 auto;
}
.main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 60px 16px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.filters button {
  border: 1px solid #e5e7eb;
  padding: 6px 12px;
  border-radius: 999px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
}
.filters button.active {
  background: #4f46e5;
  color: #fff;
  border-color: #4f46e5;
}
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 18px;
  display: grid;
  gap: 8px;
  text-align: center;
  cursor: pointer;
}
.icon {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  margin: 0 auto;
  font-size: 22px;
}
.muted {
  font-size: 12px;
  color: #9ca3af;
}
.hint {
  font-size: 12px;
  color: #4f46e5;
  opacity: 0.7;
}
.modal {
  position: fixed;
  inset: 0;
  z-index: 100;
}
.backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}
.modal-panel {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: min(520px, 92vw);
  background: #fff;
  padding: 24px;
  overflow-y: auto;
}
.close {
  position: absolute;
  right: 16px;
  top: 16px;
  border: none;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
}
.modal-content {
  margin-top: 40px;
  display: grid;
  gap: 12px;
}
.tag {
  font-size: 12px;
  background: #eef2ff;
  color: #4338ca;
  padding: 4px 8px;
  border-radius: 999px;
  width: fit-content;
}
.desc {
  font-size: 14px;
  color: #374151;
}
.inspiration {
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}
.inspiration .title {
  font-weight: 600;
  margin-bottom: 6px;
}
</style>

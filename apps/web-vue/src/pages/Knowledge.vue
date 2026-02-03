<template>
  <div class="knowledge-page text-slate-800">
    <nav class="fixed w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-3 shrink-0">
            <RouterLink to="/" class="flex items-center gap-2 group">
              <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm group-hover:bg-indigo-700 transition">AI</div>
              <span class="font-bold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition">破壁计划</span>
            </RouterLink>
          </div>

          <div class="hidden md:flex items-center space-x-1">
            <RouterLink to="/knowledge" :class="navLinkClass('knowledge')">
              <i class="fas fa-book-reader mr-2 text-xs"></i>创新知识库
            </RouterLink>
            <RouterLink to="/competencies" :class="navLinkClass('competencies')">
              <i class="fas fa-graduation-cap mr-2 text-xs"></i>学术指导
            </RouterLink>
            <RouterLink to="/projects" :class="navLinkClass('projects')">
              <i class="fas fa-layer-group mr-2 text-xs"></i>项目库
            </RouterLink>
            <RouterLink to="/downloads" :class="navLinkClass('downloads')">
              <i class="fas fa-folder-open mr-2 text-xs"></i>课程资料库
            </RouterLink>
          </div>

          <div class="flex gap-3 items-center shrink-0">
            <RouterLink
              to="/workspace"
              class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5"
            >
              <i class="fas fa-rocket mr-2"></i> 进入工作台
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <header class="pt-32 pb-12 bg-white border-b border-slate-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          探索学术前沿，<span class="text-indigo-600">点亮创新火花</span>
        </h1>
        <p class="text-lg text-slate-500 max-w-3xl">
          这里汇集了 20+ 核心学科领域知识，帮助学生找到研究方向与创新灵感。
        </p>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <section>
        <div class="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 class="text-2xl font-bold text-slate-900">学科知识百科</h2>
            <p class="text-sm text-slate-500 mt-2">20 大核心学科领域的入门指引与项目启发</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button :class="filterClass('all')" @click="filter = 'all'">全部</button>
            <button :class="filterClass('stem')" @click="filter = 'stem'">理工科 (STEM)</button>
            <button :class="filterClass('social')" @click="filter = 'social'">社科 (Social)</button>
            <button :class="filterClass('humanities')" @click="filter = 'humanities'">人文 (Humanities)</button>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="field in filteredFields"
            :key="field.id"
            class="bg-white rounded-2xl border border-slate-200 p-5 hover:border-indigo-400 hover:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] transition-all cursor-pointer group"
            @click="openField(field)"
          >
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-transform group-hover:scale-110" :style="{ backgroundColor: field.colorBg, color: field.colorText }">
              <i class="fas" :class="field.icon"></i>
            </div>
            <h3 class="font-bold text-slate-900 mt-4 group-hover:text-indigo-600 transition-colors">{{ field.name }}</h3>
            <p class="text-xs text-slate-400">{{ field.en }}</p>
            <p class="text-xs text-slate-500 mt-3 leading-relaxed">{{ field.desc }}</p>
            <span class="inline-flex items-center text-xs font-bold text-indigo-600 mt-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              查看详情 <i class="fas fa-arrow-right ml-2 text-[10px]"></i>
            </span>
          </div>
        </div>
      </section>
    </main>

    <div v-if="activeField" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="closeField"></div>
      <div class="relative bg-white w-full max-w-lg rounded-2xl p-8 shadow-2xl transform transition-all scale-100 opacity-100">
        <button class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition" @click="closeField">
          <i class="fas fa-times"></i>
        </button>
        <div class="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-flex border border-indigo-100">
          {{ activeField.cat.toUpperCase() }}
        </div>
        <h3 class="text-2xl font-bold text-slate-900 mt-4">{{ activeField.name }}</h3>
        <p class="text-sm text-slate-500 font-medium">{{ activeField.en }}</p>
        <p class="text-base text-slate-600 mt-6 leading-relaxed">{{ activeField.desc }}</p>
        <div class="mt-8 bg-slate-50 rounded-xl p-5 border border-slate-100">
          <div class="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
            <i class="fas fa-lightbulb text-yellow-500"></i> 项目启发
          </div>
          <p class="text-sm text-slate-600 leading-relaxed">{{ activeField.inspiration }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

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

function navLinkClass(key) {
  const base = 'px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center';
  if (key === 'knowledge') {
    return `${base} bg-indigo-50 text-indigo-700`;
  }
  return `${base} text-slate-500 hover:text-slate-900 hover:bg-slate-50`;
}

function filterClass(key) {
  const base = 'px-3 py-1.5 rounded-lg text-xs font-bold transition';
  if (filter.value === key) {
    return `${base} bg-slate-800 text-white`;
  }
  return `${base} bg-white border border-slate-200 text-slate-600 hover:bg-slate-50`;
}
</script>

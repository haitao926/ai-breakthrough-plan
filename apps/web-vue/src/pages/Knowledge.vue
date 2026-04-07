<template>
  <div class="knowledge-page text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 min-h-screen bg-[#f8fafc]">
    <!-- 动态背景层 -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 blur-[120px] rounded-full"></div>
    </div>

    <!-- 导航栏 -->
    <nav class="fixed w-full z-50 glass-nav transition-all duration-500 py-4">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-4 shrink-0">
            <RouterLink to="/" class="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 group">
              <div class="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
                <i class="fas fa-cube text-lg"></i>
              </div>
              <div class="flex flex-col">
                <span class="font-black text-xl tracking-tight leading-none text-slate-900">AI 破壁计划</span>
                <span class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Knowledge Base</span>
              </div>
            </RouterLink>
          </div>

          <div class="hidden lg:flex items-center space-x-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
            <RouterLink to="/knowledge" class="px-5 py-2 rounded-xl text-sm font-bold bg-white text-indigo-600 shadow-sm transition-all flex items-center gap-2">创新库</RouterLink>
            <RouterLink to="/competencies" class="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all flex items-center gap-2">学术指导</RouterLink>
            <RouterLink to="/projects" class="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all flex items-center gap-2">项目库</RouterLink>
            <RouterLink to="/downloads" class="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all flex items-center gap-2">资料中心</RouterLink>
          </div>

          <div class="flex gap-4 items-center shrink-0">
             <RouterLink to="/workspace" class="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all">
               进入工作台
             </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Header -->
    <header class="relative pt-44 pb-20 overflow-hidden z-10">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <label class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 block">Inspiration Library</label>
        <h1 class="text-4xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-tight">
          找寻你的<br><span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">创新锚点</span>
        </h1>
        <p class="text-xl text-slate-500 max-w-2xl leading-relaxed font-medium">
          这里汇集了 20+ 个核心学科的入门指引，旨在帮助你在复杂的现实世界中找到那个值得被解决的“真问题”。
        </p>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-12 relative z-10 min-h-screen">
      <section class="space-y-16">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-reveal">
           <div class="space-y-2">
              <h2 class="text-3xl font-black text-slate-900 tracking-tight">学科百科 (Disciplines)</h2>
              <p class="text-sm font-medium text-slate-400 uppercase tracking-widest italic">Cross-disciplinary academic guide</p>
           </div>
           <!-- Filter Buttons -->
           <div class="flex flex-wrap gap-2 bg-slate-100/50 p-1.5 rounded-[22px] border border-slate-200/40">
             <button v-for="k in ['all', 'stem', 'social', 'humanities']" :key="k"
               class="px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all"
               :class="filter === k ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-900'"
               @click="filter = k">
               {{ k === 'all' ? '全部' : k === 'stem' ? '理工科' : k === 'social' ? '社科' : '人文' }}
             </button>
           </div>
        </div>

        <!-- Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-reveal">
          <div
            v-for="field in filteredFields"
            :key="field.id"
            class="premium-card group !p-0 overflow-hidden !bg-white border-none shadow-xl hover:!shadow-2xl transition-all duration-500 flex flex-col cursor-pointer"
            @click="openField(field)"
          >
            <!-- Card Image -->
            <div class="h-52 overflow-hidden relative">
              <img :src="field.image" :alt="field.name" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60"></div>
              <div class="absolute top-6 left-6 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-6">
                <i class="fas" :class="field.icon"></i>
              </div>
              <div class="absolute bottom-6 left-8 text-white">
                 <span class="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-lg border border-white/10">{{ field.cat }}</span>
                 <h3 class="text-2xl font-black tracking-tight mt-2">{{ field.name }}</h3>
              </div>
            </div>

            <!-- Card Content -->
            <div class="p-8 flex-1 flex flex-col space-y-6">
              <div class="space-y-4">
                 <p class="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{{ field.en }}</p>
                 <p class="text-sm text-slate-500 leading-relaxed font-medium line-clamp-3">{{ field.desc }}</p>
              </div>
              
              <div class="pt-8 border-t border-slate-50 mt-auto flex items-center justify-between">
                <div class="flex items-center gap-3">
                   <div class="flex -space-x-2">
                      <div v-for="i in 3" :key="i" class="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                         <i class="fas fa-lightbulb text-[6px] text-slate-300"></i>
                      </div>
                   </div>
                   <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter">12+ Reference Items</span>
                </div>
                <span class="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform">
                  Explore <i class="fas fa-arrow-right ml-1"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Detailed Modal -->
    <div v-if="activeField" class="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" @click="closeField"></div>
      <div class="relative bg-white w-full max-w-2xl rounded-[48px] p-12 shadow-2xl overflow-hidden animate-reveal">
        <div class="absolute top-0 right-0 p-8">
           <button class="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all" @click="closeField">
             <i class="fas fa-times"></i>
           </button>
        </div>
        <div class="space-y-12">
           <div class="flex items-center gap-6">
              <div class="w-16 h-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-2xl text-white shadow-xl shadow-slate-900/20">
                 <i class="fas" :class="activeField.icon"></i>
              </div>
              <div>
                 <span class="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-full">{{ activeField.cat }} Domain</span>
                 <h3 class="text-3xl font-black text-slate-900 mt-2 tracking-tight">{{ activeField.name }}</h3>
              </div>
           </div>
           
           <div class="space-y-6">
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Introduction</h4>
              <p class="text-lg text-slate-600 leading-relaxed font-medium">{{ activeField.desc }}</p>
           </div>
           
           <div class="p-8 rounded-[32px] bg-indigo-600 text-white shadow-xl relative overflow-hidden group">
              <div class="absolute top-0 right-0 p-8 opacity-10"><i class="fas fa-lightbulb text-6xl"></i></div>
              <div class="relative z-10 space-y-4">
                 <h4 class="text-[10px] font-black uppercase tracking-widest opacity-60">Project Inspiration</h4>
                 <p class="text-lg font-bold leading-relaxed">{{ activeField.inspiration }}</p>
              </div>
           </div>
           
           <div class="flex gap-4">
              <button @click="closeField" class="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Dismiss</button>
              <RouterLink :to="{ path: '/projects', query: { category: activeField.cat } }" class="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-lg hover:shadow-slate-400 transition-all">
                Find Related Projects <i class="fas fa-arrow-right ml-2"></i>
              </RouterLink>
           </div>
        </div>
      </div>
    </div>

    <footer class="py-24 border-t border-slate-100 relative z-10 text-center">
       <div class="flex items-center justify-center gap-3 mb-6">
          <div class="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
             <i class="fas fa-cube text-xs"></i>
          </div>
          <span class="text-xs font-black text-slate-900 uppercase tracking-widest">HAI Tech Lab <span class="text-slate-300 mx-2">|</span> 2026 Innovation Archive</span>
       </div>
       <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Curiosities are the seeds of great engineering.</p>
    </footer>
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
    en: 'Technology & Engineering',
    cat: 'stem',
    icon: 'fa-microchip',
    image: '/Users/apple/.gemini/antigravity/brain/0e8ab5fd-5c6a-4e28-bd6a-d6b91a5b276b/knowledge_stem_tech_1775053306726.png',
    desc: '科技与工程让科学脱离纸面，触手可及。它带给我们便利、更多机会和无限可能。在这里你可以探索从极简代码到物理世界的万物互联。',
    inspiration: '研究基于计算机视觉的校园安全系统，或设计一套属于你的智能家居控制原型。'
  },
  {
    id: 'cs',
    name: '计算机科学',
    en: 'Computer Science',
    cat: 'stem',
    icon: 'fa-laptop-code',
    image: '/Users/apple/.gemini/antigravity/brain/0e8ab5fd-5c6a-4e28-bd6a-d6b91a5b276b/knowledge_cs_coding_1775091665013.png',
    desc: '计算机科学不仅关乎代码，更关乎逻辑思维与解决问题的能力。通过 Python 体验“用代码驱动世界”的全新视角。',
    inspiration: '研究人工智能交互伦理，或尝试开发一个辅助视障人士实时识别环境中障碍物的应用。'
  },
  {
    id: 'env',
    name: '环境科学',
    en: 'Environmental Science',
    cat: 'stem',
    icon: 'fa-leaf',
    image: '/Users/apple/.gemini/antigravity/brain/0e8ab5fd-5c6a-4e28-bd6a-d6b91a5b276b/knowledge_env_science_1775091679064.png',
    desc: '研究气候变化、生态保护与资源循环利用。在这个模块，我们将环境痛点转化为技术落点，寻找可持续发展的未来。',
    inspiration: '调查校园碳足迹并设计一套自动化的节能控制系统，或开发社区智能垃圾分类激励小程序。'
  },
  {
    id: 'soc',
    name: '社会与人类学',
    en: 'Sociology & Anthropology',
    cat: 'social',
    icon: 'fa-users',
    image: '/Users/apple/.gemini/antigravity/brain/0e8ab5fd-5c6a-4e28-bd6a-d6b91a5b276b/knowledge_social_science_v2_1775053348027.png',
    desc: '观察群体行为与社会关系，反思我们的生活方式。从田野调查中发现未被关注的弱势需求，通过行动产生真实的社会价值。',
    inspiration: '记录并分析正在消失的校园方言片段，或发起一场利用社交媒体推动社区资源互助的公益项目。'
  },
  {
    id: 'psych',
    name: '心理与认知',
    en: 'Psychology & Cognition',
    cat: 'social',
    icon: 'fa-brain',
    image: '/Users/apple/.gemini/antigravity/brain/0e8ab5fd-5c6a-4e28-bd6a-d6b91a5b276b/knowledge_psychology_brain_1775091711415.png',
    desc: '探索认知、情绪与人格。跨越数据与共情的鸿沟，利用 AI 技术辅助压力调节或专注力提升，让科技更具温情。',
    inspiration: '研究不同环境色温下学生的专注力差异，或设计一款基于情绪识别的青少年心理互助 AI 助手原型。'
  },
  {
    id: 'econ',
    name: '经济与商业模型',
    en: 'Economics & Business',
    cat: 'social',
    icon: 'fa-chart-pie',
    image: '/Users/apple/.gemini/antigravity/brain/0e8ab5fd-5c6a-4e28-bd6a-d6b91a5b276b/knowledge_economics_graph_1775091725443.png',
    desc: '研究资源优化配置。从盲盒经济到共享循环，通过实证分析理解消费决策背后的底层逻辑，构建可持续的商业方案。',
    inspiration: '针对校园二手流转设计一套基于区块链思想的信用评估模型，或调查盲盒消费对青少年消费决策的影响。'
  },
  {
    id: 'arch',
    name: '建筑与城市',
    en: 'Urban & Architecture',
    cat: 'humanities',
    icon: 'fa-city',
    image: '/Users/apple/.gemini/antigravity/brain/0e8ab5fd-5c6a-4e28-bd6a-d6b91a5b276b/knowledge_urban_architecture_1775091740036.png',
    desc: '城市不仅是冰冷的建筑，更是活生生的空间正义。从校园微更新到适老化设计，重新定义我们生活与相遇的场所。',
    inspiration: '调研校园中的“消极空间”并提出基于多学科视角的微景观改造方案，或设计针对高层老旧社区的智慧撤桶方案建议。'
  },
  {
    id: 'culture',
    name: '跨文化沟通',
    en: 'Intercultural Studies',
    cat: 'humanities',
    icon: 'fa-comments',
    image: '/Users/apple/.gemini/antigravity/brain/0e8ab5fd-5c6a-4e28-bd6a-d6b91a5b276b/knowledge_humanities_art_1775091646552.png',
    desc: '在全球化视野中理解差异。研究不同文化背景下的共识构建。',
    inspiration: '通过 AI 辅助的同理心训练系统，帮助青少年理解不同文化语境下的非言语沟通信号。'
  }

];

const filteredFields = computed(() => {
  if (filter.value === 'all') return fieldsData;
  return fieldsData.filter(field => field.cat === filter.value);
});

function openField(field) { activeField.value = field; }
function closeField() { activeField.value = null; }
</script>

<style scoped>
.glass-nav { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px); border-bottom: 1px solid rgba(226, 232, 240, 0.4); }
.premium-card { @apply bg-white rounded-[40px] border border-slate-200/60 transition-all duration-500 shadow-sm; }
.animate-reveal { animation: reveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes reveal { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>

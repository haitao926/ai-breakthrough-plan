<template>
  <div class="competencies-page bg-gray-50 text-gray-800 scroll-smooth">
    <SiteNav active="competencies" />

    <header class="bg-white pt-24 pb-6 border-b border-gray-200">
      <div class="max-w-[1320px] mx-auto px-5 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="text-xs font-bold tracking-[0.16em] text-indigo-600 uppercase mb-2">Competency Guide</p>
            <h1 class="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              核心能力<span class="text-indigo-600">学术指导</span>
            </h1>
            <p class="mt-3 text-sm md:text-base text-gray-500 max-w-3xl leading-7">
              在这里建立你的项目底层逻辑，先选方向，再掌握通识技能，为后续课程学习和项目实践打下基础。
            </p>
          </div>
          <div class="text-sm font-bold text-slate-500">
            {{ tracks.length }} 个方向 · {{ modules.length }} 个能力模块
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-[1320px] mx-auto px-5 sm:px-6 lg:px-8 py-8 space-y-16">
      <section>
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl">
            <i class="fas fa-compass"></i>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">第一步：选择你的创新方向</h2>
            <p class="text-sm text-gray-500">你想解决什么问题？你准备以什么方式推进？</p>
          </div>
        </div>

        <div class="grid md:grid-cols-3 gap-8 mb-10">
          <div v-for="track in tracks" :key="track.title" class="rounded-2xl p-8 border relative overflow-hidden hover:shadow-lg transition" :class="track.cardClass">
            <div class="relative z-10">
              <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm" :class="track.iconClass"><i class="fas" :class="track.icon"></i></div>
              <h3 class="text-xl font-bold text-gray-900 mb-1">{{ track.title }}</h3>
              <p class="text-xs font-bold mb-4 uppercase tracking-wide" :class="track.labelClass">{{ track.label }}</p>
              <p class="text-gray-600 text-sm mb-6 min-h-[60px]">{{ track.desc }}</p>
              <div class="flex gap-2 flex-wrap">
                <span v-for="tag in track.tags" :key="tag" class="px-2 py-1 bg-white rounded-md text-xs font-bold border" :class="track.tagClass">{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
            <i class="fas fa-layer-group"></i>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">第二步：掌握核心能力</h2>
            <p class="text-sm text-gray-500">完成项目所需的通识能力与专业技能。</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-4 mb-8">
          <button
            v-for="item in modules"
            :key="item.id"
            class="px-5 py-2.5 rounded-lg font-bold text-sm border transition shadow-sm"
            :class="tabClass(item.id)"
            @click="activeModule = item.id"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="module-content grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div v-for="skill in currentSkills" :key="skill.title" class="module-card bg-white p-5 rounded-xl border border-gray-100">
            <div class="text-2xl mb-3" :class="skill.colorClass"><i class="fas" :class="skill.icon"></i></div>
            <h3 class="font-bold text-gray-900 mb-1">{{ skill.title }}</h3>
            <p class="text-xs text-gray-500">{{ skill.desc }}</p>
          </div>
        </div>
      </section>

      <section class="mt-16 bg-gray-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20"></div>
        <div class="relative z-10">
          <h2 class="text-2xl font-bold mb-4">掌握了核心能力？</h2>
          <p class="text-gray-400 mb-8 max-w-lg">现在，去课程库查看完整课程内容，或者去项目库开始你的实战。</p>
          <div class="flex gap-4 flex-wrap">
            <RouterLink to="/downloads" class="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg font-bold transition flex items-center">
              <i class="fas fa-folder-open mr-2"></i> 前往课程库
            </RouterLink>
            <RouterLink to="/projects" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg transition flex items-center">
              <i class="fas fa-rocket mr-2"></i> 前往项目库
            </RouterLink>
          </div>
        </div>
      </section>
    </main>

    <PortalFooter />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';

const activeModule = ref('general');

const tracks = [
  {
    title: '研究项目',
    label: 'Research Project',
    desc: '聚焦提出学术问题，通过严谨的研究方法寻找证据，形成有逻辑支持的结论。',
    tags: ['学术论文', '数据分析'],
    icon: 'fa-book-open',
    cardClass: 'bg-blue-50 border-blue-100',
    iconClass: 'text-blue-600',
    labelClass: 'text-blue-600',
    tagClass: 'text-blue-500 border-blue-100'
  },
  {
    title: '创新项目',
    label: 'Innovation Project',
    desc: '从现实问题出发，结合设计思维，提出新颖可行的解决方案。',
    tags: ['产品原型', '设计思维'],
    icon: 'fa-lightbulb',
    cardClass: 'bg-green-50 border-green-100',
    iconClass: 'text-green-600',
    labelClass: 'text-green-600',
    tagClass: 'text-green-500 border-green-100'
  },
  {
    title: '公益项目',
    label: 'Community Impact',
    desc: '关注社会议题，通过实地行动推动改变，强调行动的发生和社会影响。',
    tags: ['社会行动', '公众倡导'],
    icon: 'fa-hands-helping',
    cardClass: 'bg-red-50 border-red-100',
    iconClass: 'text-red-600',
    labelClass: 'text-red-600',
    tagClass: 'text-red-500 border-red-100'
  }
];

const modules = [
  { id: 'general', label: '通识模块 (必修)' },
  { id: 'research', label: '学术研究模块' },
  { id: 'innovation', label: '创新行动模块' },
  { id: 'public', label: '公益活动模块' }
];

const moduleSkills = {
  general: [
    { title: '组队指南', desc: '如何邀请和吸引队员、凝聚团队。', icon: 'fa-users', colorClass: 'text-blue-600' },
    { title: '时间管理', desc: '合理安排分工和计划、巧用甘特图。', icon: 'fa-clock', colorClass: 'text-blue-600' },
    { title: '高效团队协作', desc: '管理项目和团队以及进行有效协作。', icon: 'fa-sync-alt', colorClass: 'text-blue-600' },
    { title: '代码管理', desc: '学习使用 Git 和 Gitea 进行版本控制与代码提交。', icon: 'fa-code-branch', colorClass: 'text-blue-600' },
    { title: '选题指南', desc: '在现实生活中找到有趣、影响较大的课题。', icon: 'fa-search', colorClass: 'text-blue-600' },
    { title: '财务管理', desc: '制定预算、记录账目和进行融资。', icon: 'fa-coins', colorClass: 'text-blue-600' },
    { title: '可视化设计', desc: 'PPT、网站和视频的有效视觉表达。', icon: 'fa-paint-brush', colorClass: 'text-blue-600' },
    { title: '演讲与表达', desc: '现场展示备战宝典，帮助作品脱颖而出。', icon: 'fa-microphone-alt', colorClass: 'text-blue-600' }
  ],
  research: [
    { title: '文献阅读', desc: '找到可靠文献并高效阅读，建立理论框架。', icon: 'fa-book-open', colorClass: 'text-indigo-600' },
    { title: '定量研究', desc: '通过数据分析进行系统性量化考察。', icon: 'fa-chart-bar', colorClass: 'text-indigo-600' },
    { title: '定性研究', desc: '通过观测、访谈分析行为和观点。', icon: 'fa-comments', colorClass: 'text-indigo-600' },
    { title: '论文写作指南', desc: '掌握学术论文的结构与写作要求。', icon: 'fa-pen-fancy', colorClass: 'text-indigo-600' }
  ],
  innovation: [
    { title: '前期调研', desc: '精准把握现象成因、剖析受众需求。', icon: 'fa-search-location', colorClass: 'text-green-600' },
    { title: '设计思维', desc: '拆解创新流程，从 0 到 1 构建理念。', icon: 'fa-drafting-compass', colorClass: 'text-green-600' },
    { title: '市场宣传', desc: '制定传播与展示策略，提高影响力。', icon: 'fa-bullhorn', colorClass: 'text-green-600' },
    { title: '创新报告写作', desc: '商业计划书与产品报告的写作要求。', icon: 'fa-file-alt', colorClass: 'text-green-600' }
  ],
  public: [
    { title: '前期调研', desc: '把握社会问题成因、剖析受助群体需求。', icon: 'fa-search-plus', colorClass: 'text-red-600' },
    { title: '行动实践', desc: '产出可行解决方案，验证行动效果。', icon: 'fa-hand-holding-heart', colorClass: 'text-red-600' },
    { title: '市场宣传', desc: '利用新媒体提高公益项目传播度。', icon: 'fa-share-alt', colorClass: 'text-red-600' },
    { title: '公益报告写作', desc: '社会影响力报告的写作逻辑。', icon: 'fa-edit', colorClass: 'text-red-600' }
  ]
};

const currentSkills = computed(() => moduleSkills[activeModule.value] || []);

function tabClass(id) {
  if (activeModule.value === id) return 'bg-indigo-600 text-white border-transparent';
  return 'bg-white text-gray-600 border-gray-200 hover:border-indigo-500';
}
</script>

<style scoped>
.module-card {
  transition: all 0.3s ease;
}

.module-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
}
</style>

<template>
  <div class="competencies-page bg-[#f8fafc] text-slate-800 scroll-smooth selection:bg-indigo-100 selection:text-indigo-900 min-h-screen">
    <!-- 动态背景 -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 blur-[120px] rounded-full"></div>
    </div>

    <!-- 导航栏 -->
    <nav class="fixed w-full z-50 glass-nav transition-all duration-500 py-4">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-4 shrink-0">
            <RouterLink to="/" class="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 group">
              <div class="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
                <i class="fas fa-cube text-lg"></i>
              </div>
              <div class="flex flex-col">
                <span class="font-black text-xl tracking-tight leading-none text-slate-900">AI 破壁计划</span>
                <span class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Competency Hub</span>
              </div>
            </RouterLink>
          </div>

          <div class="hidden lg:flex items-center space-x-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
            <RouterLink to="/knowledge" class="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white transition-all flex items-center gap-2">创新库</RouterLink>
            <RouterLink to="/competencies" class="px-5 py-2 rounded-xl text-sm font-bold bg-white text-indigo-600 shadow-sm transition-all flex items-center gap-2">学术指导</RouterLink>
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
    <header class="relative pt-44 pb-20 overflow-hidden z-10 text-center lg:text-left">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <label class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 block">The Master Plan</label>
        <h1 class="text-4xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter leading-tight">
          掌握项目核心<br><span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">竞争力</span>
        </h1>
        <p class="text-xl text-slate-500 max-w-2xl leading-relaxed font-medium">
          建立你的“项目底层逻辑”。在这里你将获得从选题立项到结题答辩的完整“弹药库”，将每一个朴素的构想转化为具备学术深度的现实成果。
        </p>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 lg:px-12 py-12 relative z-10 space-y-32">
      <!-- PART 1: Track Selection -->
      <section class="animate-reveal">
        <div class="flex items-center gap-4 mb-16">
          <div class="w-1.5 h-10 bg-indigo-600 rounded-full"></div>
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">第一步：选择你的创新航向</h2>
          <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest border-l border-slate-200 pl-4">Define your path</span>
        </div>

        <div class="grid md:grid-cols-3 gap-10">
          <div v-for="track in tracks" :key="track.title" class="premium-card group hover:!shadow-2xl hover:!shadow-indigo-500/10 transition-all duration-700">
             <div :class="track.bg" class="w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <i :class="[track.icon, track.color]"></i>
             </div>
             <h3 class="text-2xl font-black text-slate-900 mb-2 tracking-tight">{{ track.title }}</h3>
             <p class="text-[10px] font-black uppercase tracking-widest mb-6" :class="track.color">{{ track.label }}</p>
             <p class="text-slate-500 text-sm font-medium leading-relaxed mb-10 min-h-[4rem]">{{ track.desc }}</p>
             <div class="pt-8 border-t border-slate-50 flex flex-wrap gap-2">
                <span v-for="tag in track.tags" :key="tag" :class="[track.bg, track.color]" class="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider">{{ tag }}</span>
             </div>
          </div>
        </div>
      </section>

      <!-- PART 2: Mastery Modules -->
      <section class="animate-reveal">
        <div class="flex items-center gap-4 mb-16">
          <div class="w-1.5 h-10 bg-slate-900 rounded-full"></div>
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">第二步：打造“通才”模型</h2>
          <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest border-l border-slate-200 pl-4">Core Competency Matrix</span>
        </div>

        <!-- Capability Tabs -->
        <div class="flex flex-wrap gap-3 mb-12 bg-slate-100/50 p-2 rounded-[28px] w-fit border border-slate-200/40">
          <button v-for="m in modules" :key="m.id"
            class="px-8 py-3.5 rounded-[22px] font-black text-[10px] uppercase tracking-widest transition-all"
            :class="activeModule === m.id ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-600/5 scale-105' : 'text-slate-400 hover:text-slate-900'"
            @click="activeModule = m.id"
          >
            {{ m.label }}
          </button>
        </div>

        <!-- Module Content Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 min-h-[400px]">
          <transition-group name="stagger">
              <div v-for="skill in currentSkills" :key="skill.title" 
                class="premium-card group !bg-white border-none shadow-xl hover:!shadow-2xl hover:!shadow-indigo-500/10 hover:-translate-y-2 transition-all duration-500 flex flex-col cursor-pointer"
                @click="goToStudy(skill)"
              >
                 <div class="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl mb-8 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-600/30 transition-all duration-500">
                    <i :class="skill.icon"></i>
                 </div>
                 <h3 class="text-lg font-black text-slate-900 mb-3 tracking-tight">{{ skill.title }}</h3>
                 <p class="text-xs text-slate-400 font-medium leading-relaxed flex-1">{{ skill.desc }}</p>
                 <div class="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-indigo-600">
                    <span class="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all">Start Lesson</span>
                    <i class="fas fa-arrow-right text-[10px] transform group-hover:translate-x-2 transition-transform"></i>
                 </div>
              </div>
          </transition-group>
        </div>
      </section>

      <!-- Final CTA -->
      <section class="mt-40 p-20 bg-slate-900 rounded-[56px] text-center text-white relative overflow-hidden animate-reveal group shadow-2xl">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#4f46e5_0%,transparent_60%)] opacity-30 group-hover:scale-110 transition-transform duration-1000"></div>
        <div class="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:32px_32px] opacity-10"></div>
        <div class="relative z-10 space-y-10">
          <h2 class="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">READY TO<br>BREAK THE WALL?</h2>
          <p class="text-slate-400 text-lg max-w-xl mx-auto font-medium leading-relaxed">知识已就绪，导师已到位。去资源库寻找专业工具，开始你的科创破壁之旅。</p>
          <div class="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <RouterLink to="/downloads" class="px-12 py-6 bg-white/10 hover:bg-white/20 border border-white/10 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center group/btn">
              <i class="fas fa-folder-open mr-3"></i> 课程资源库
            </RouterLink>
            <RouterLink to="/workspace" class="px-12 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center">
              <i class="fas fa-rocket mr-3 animate-pulse"></i> 开启第一个项目
            </RouterLink>
          </div>
        </div>
      </section>
    </main>

    <footer class="py-24 border-t border-slate-100 relative z-10 text-center">
       <div class="flex items-center justify-center gap-3 mb-6">
          <div class="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
             <i class="fas fa-cube text-xs"></i>
          </div>
          <span class="text-xs font-black text-slate-900 uppercase tracking-widest">HAI Tech Lab <span class="text-slate-300 mx-2">|</span> 2026 Core Framework</span>
       </div>
       <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Empowering the next generation of full-stack innovators.</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const activeModule = ref('general');

const tracks = [
  { title: '学术研究', label: 'Research & Science', icon: 'fas fa-microscope', bg: 'bg-blue-50', color: 'text-blue-600', desc: '聚焦提出学术问题，通过严谨的研究方法寻找证据，形成有逻辑支持的结论。', tags: ['学术论文', '数据建模', '科学实验'] },
  { title: '创新行动', label: 'Innovation & MVP', icon: 'fas fa-wand-magic-sparkles', bg: 'bg-emerald-50', color: 'text-emerald-600', desc: '从现实问题出发，结合设计思维，提出新颖可行的解决方案与产品原型。', tags: ['产品原型', '商业模式', '极简编程'] },
  { title: '公益活动', label: 'Social Impact', icon: 'fas fa-heart-pulse', bg: 'bg-rose-50', color: 'text-rose-600', desc: '关注社会议题，通过实地行动推动改变。强调行动的真实发生与社会量化影响。', tags: ['社区动员', '社会倡导', '实地调研'] }
];

const modules = [
  { id: 'general', label: '通识模块 (必修)' },
  { id: 'research', label: '学术能力' },
  { id: 'innovation', label: '创新技能' },
  { id: 'leadership', label: '管理协作' }
];

const skillsData = {
  general: [
    { icon: 'fas fa-magnifying-glass-location', title: '选题指南', desc: '在现实生活中发现有趣且具有真实价值、影响较大的课题。', target: 'lesson1' },
    { icon: 'fas fa-code-merge', title: '代码与版本管理', desc: '学习使用 Git 和 Gitea 进行课程文件同步与多端版本控制。', target: 'lesson2' },
    { icon: 'fas fa-calendar-check', title: '时间管理', desc: '科学安排分工和计划、巧用甘特图与看板管控项目生命周期。', target: 'lesson3' },
    { icon: 'fas fa-swatches', title: '可视化设计', desc: '如何通过 PPT、网站与视频进行有效的学术呈现与视觉表达。', target: 'lesson4' },
    { icon: 'fas fa-bullhorn', title: '演讲与表达', desc: '现场展示备战宝典。学习如何用故事力打动评审，脱颖而出。', target: 'lesson5' }
  ],
  research: [
    { icon: 'fas fa-book-open-reader', title: '学术研究规范', desc: '文献深度综述。掌握数据库检索与引用的严谨学术规范。' },
    { icon: 'fas fa-chart-line', title: '定量与统计分析', desc: '从凌乱数据中发现秘密。通过统计学验证你的研究假设。' },
    { icon: 'fas fa-comments', title: '定性走访调查', desc: '深度访谈与田野调查方案建议，挖掘冰山下的真实动机。' },
    { icon: 'fas fa-file-signature', title: '学术论文撰写', desc: '逻辑严丝合缝。如何撰写一篇符合学术奖项标准的论文。' }
  ],
  innovation: [
    { icon: 'fas fa-brain-circuit', title: '设计思维 (DT)', desc: '共情、定义、设想、原型与测试。全链路创新黑客指南。' },
    { icon: 'fas fa-cubes-stacked', title: 'MVP 快速迭代', desc: '用最低成本构建“最简可行产品”，实现创意的物理落地。' },
    { icon: 'fas fa-sack-dollar', title: '财务与融资管理', desc: '制定项目预算、记录账目收支，理解商业初创运作逻辑。' },
    { icon: 'fas fa-shield-halved', title: '专利与产权保护', desc: '保护你的创意火花。理解科创比赛中的知识产权申请流程。' }
  ],
  leadership: [
    { icon: 'fas fa-users-viewfinder', title: '组队指南', desc: '如何邀请和吸引优质队员、凝聚核心精神并明确团队分工。' },
    { icon: 'fas fa-people-roof', title: '高效团队协作', desc: '冲突解决、异步协作工具使用及通过 Git 共享项目进度。' },
    { icon: 'fas fa-map-location-dot', title: '社会动员技术', desc: '如何调动多方社会资源，让你的公益项目产生真实改变。' },
    { icon: 'fas fa-square-poll-vertical', title: '影响力评估', desc: '量化你的行动价值。如何证明你的项目带来了多少社会效益。' }
  ]
};

const currentSkills = computed(() => skillsData[activeModule.value] || []);

function goToStudy(skill) {
  if (skill.target) {
     router.push({ path: '/study', query: { project: 'common', lesson: skill.target } });
  }
}
</script>

<style scoped>
.glass-nav { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(24px); border-bottom: 1px solid rgba(226, 232, 240, 0.4); }
.premium-card { @apply bg-white rounded-[40px] border border-slate-200/60 p-10 shadow-sm transition-all duration-500; }
.animate-reveal { animation: reveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes reveal { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.stagger-enter-active { animation: reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.stagger-enter-from { opacity: 0; transform: translateY(20px); }
</style>

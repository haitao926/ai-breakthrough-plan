<template>
  <div class="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 flex justify-between items-center">
      <div class="flex items-center gap-4">
        <RouterLink :to="{ path: '/workspace', query: { project: projectId } }" class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all">
          <i class="fas fa-arrow-left"></i>
        </RouterLink>
        <div>
          <h1 class="font-black text-slate-900 text-lg flex items-center tracking-tight">
            <span class="w-2 h-6 bg-indigo-600 rounded-full mr-3"></span>
            前期调研与需求验证
          </h1>
          <p class="text-[10px] font-bold text-slate-400 tracking-tight mt-0.5">用于整理开题/中期提交中的调研依据</p>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100/50 border border-slate-200/50">
          <div class="w-1.5 h-1.5 rounded-full transition-all duration-500" :class="saved ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'"></div>
          <span class="text-[11px] font-black uppercase tracking-widest" :class="saved ? 'text-emerald-600' : 'text-amber-600'">{{ saveStatus }}</span>
        </div>
        <button @click="generateAIHelp" class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all group">
          <i class="fas fa-magic text-xs group-hover:rotate-12 transition-transform"></i>
        </button>
      </div>
    </nav>

    <main class="max-w-6xl mx-auto px-6 py-12">
      <header class="mb-16 text-center animate-reveal">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          <i class="fas fa-microscope"></i> Discovery Phase
        </div>
        <h2 class="text-4xl font-black text-slate-900 tracking-tight mb-4">先验证，再动手</h2>
        <p class="text-slate-500 font-medium max-w-2xl mx-auto">把访谈、问卷、观察或案例调研整理成可上传的依据材料，提交开题或中期时可以作为附件说明项目方向。</p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Sidebar: Steps -->
        <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
           <div class="premium-card !p-6 space-y-8">
             <h3 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">调研路线图</h3>
             <div class="space-y-6">
               <div v-for="(step, idx) in steps" :key="idx" class="flex gap-4 group cursor-pointer" @click="scrollToField(step.id)">
                 <div class="w-8 h-8 rounded-xl flex shrink-0 items-center justify-center text-xs font-black transition-all"
                   :class="isFieldReady(step.id) ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'">
                   <i v-if="isFieldReady(step.id)" class="fas fa-check"></i>
                   <span v-else>{{ idx + 1 }}</span>
                 </div>
                 <div class="flex-1">
                   <div class="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{{ step.label }}</div>
                   <div class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{{ step.desc }}</div>
                 </div>
               </div>
             </div>
           </div>

           <div class="premium-card !p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl shadow-indigo-500/20">
             <i class="fas fa-lightbulb text-2xl mb-4 text-indigo-200"></i>
             <h4 class="text-sm font-black mb-2 tracking-tight">调研贴士</h4>
             <p class="text-xs text-indigo-100 font-medium leading-relaxed opacity-90">不要问用户“你想要什么”，而要问他们“在做某件事时遇到了什么困难”。</p>
           </div>
        </div>

        <!-- Main Form Content -->
        <div class="lg:col-span-8 space-y-8">
          <!-- Item 1: Core Question -->
          <section id="question" class="premium-card group focus-within:ring-2 ring-indigo-500/20 transition-all">
             <div class="flex items-start justify-between mb-6">
                <div>
                   <label class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 block">Part 01</label>
                   <h3 class="text-xl font-black text-slate-900 tracking-tight">聚焦核心问题</h3>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                   <i class="fas fa-bullseye text-lg"></i>
                </div>
             </div>
             <textarea v-model="form.question" class="w-full min-h-[100px] border-none bg-slate-50 rounded-[20px] p-6 text-slate-700 font-medium focus:ring-2 ring-indigo-100 transition-all outline-none resize-none placeholder:text-slate-300" placeholder="你想验证的假设或问题是什么？例如：初中生在整理错题时最大的阻碍是什么？"></textarea>
          </section>

          <!-- Item 2: Target Audience -->
          <section id="targets" class="premium-card group focus-within:ring-2 ring-indigo-500/20 transition-all">
             <div class="flex items-start justify-between mb-6">
                <div>
                   <label class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 block">Part 02</label>
                   <h3 class="text-xl font-black text-slate-900 tracking-tight">锁定目标对象</h3>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                   <i class="fas fa-user-group text-lg"></i>
                </div>
             </div>
             <textarea v-model="form.targets" class="w-full min-h-[100px] border-none bg-slate-50 rounded-[20px] p-6 text-slate-700 font-medium focus:ring-2 ring-amber-100 transition-all outline-none resize-none placeholder:text-slate-300" placeholder="谁会面临这个问题？请描述他们的身份、年级或其他特征..."></textarea>
          </section>

          <!-- Item 3: Methods -->
          <section id="methods" class="premium-card">
              <div class="flex items-start justify-between mb-8">
                <div>
                   <label class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 block">Part 03</label>
                   <h3 class="text-xl font-black text-slate-900 tracking-tight">调研方法选择</h3>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                   <i class="fas fa-list-check text-lg"></i>
                </div>
             </div>
             <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
               <div v-for="m in methodOptions" :key="m.value" 
                 class="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer group"
                 :class="form.methods.includes(m.value) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-200'"
                 @click="toggleMethod(m.value)">
                 <i class="fas text-lg transition-transform group-hover:scale-110" :class="m.icon"></i>
                 <span class="text-[11px] font-black uppercase tracking-widest">{{ m.label }}</span>
               </div>
             </div>
          </section>

          <!-- Item 4: Plan & Questions -->
          <section id="questions" class="premium-card">
             <div class="flex items-start justify-between mb-6">
                <div>
                   <label class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 block">Part 04</label>
                   <h3 class="text-xl font-black text-slate-900 tracking-tight">准备你的问卷/提纲</h3>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                   <i class="fas fa-clipboard-question text-lg"></i>
                </div>
             </div>
             <div class="space-y-4">
                <div v-for="(q, idx) in dynamicQuestions" :key="idx" class="flex gap-3 group">
                   <div class="flex-1 bg-slate-50 rounded-2xl p-4 flex items-center border border-transparent focus-within:border-indigo-300 transition-all">
                      <span class="text-xs font-black text-indigo-400 mr-3">{{ String(idx + 1).padStart(2, '0') }}</span>
                      <input v-model="dynamicQuestions[idx]" class="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700" placeholder="输入调研问题...">
                   </div>
                   <button v-if="dynamicQuestions.length > 1" @click="removeQuestion(idx)" class="w-12 h-12 rounded-2xl bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <i class="fas fa-trash-alt text-xs"></i>
                   </button>
                </div>
                <button @click="addQuestion" class="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                   <i class="fas fa-plus-circle"></i> 添加问题
                </button>
             </div>
          </section>

          <!-- Item 5: Findings (Cards Mode) -->
          <section id="findings" class="premium-card">
              <div class="flex items-start justify-between mb-8">
                <div>
                   <label class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 block">Part 05</label>
                   <h3 class="text-xl font-black text-slate-900 tracking-tight">关键发现洞察</h3>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                   <i class="fas fa-magnifying-glass-chart text-lg"></i>
                </div>
             </div>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="(f, idx) in dynamicFindings" :key="idx" class="premium-card !bg-slate-50 !p-5 !rounded-2xl border-none relative group hover:!bg-white hover:ring-2 ring-indigo-500/10 transition-all">
                    <div class="flex items-center gap-3 mb-4">
                       <div class="w-2 h-2 rounded-full bg-indigo-600"></div>
                       <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discovery {{ idx + 1 }}</div>
                    </div>
                    <textarea v-model="dynamicFindings[idx]" class="w-full bg-transparent border-none outline-none text-sm font-semibold text-slate-700 min-h-[80px] resize-none" placeholder="记录一个真实而深刻的发现..."></textarea>
                    <button v-if="dynamicFindings.length > 1" @click="removeFinding(idx)" class="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                       <i class="fas fa-times-circle"></i>
                    </button>
                </div>
                <button @click="addFinding" class="h-full min-h-[120px] rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50 transition-all text-xs font-black uppercase tracking-widest flex flex-col items-center justify-center gap-3">
                   <i class="fas fa-circle-plus text-xl"></i> 追加新发现
                </button>
             </div>
          </section>

          <!-- Item 6: Conclusion -->
          <section id="nextSteps" class="premium-card group focus-within:ring-2 ring-indigo-500/20 transition-all">
             <div class="flex items-start justify-between mb-6">
                <div>
                   <label class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2 block">Part 06</label>
                   <h3 class="text-xl font-black text-slate-900 tracking-tight">结论与下一步行动</h3>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                   <i class="fas fa-flag-checkered text-lg"></i>
                </div>
             </div>
             <textarea v-model="form.nextSteps" class="w-full min-h-[120px] border-none bg-slate-50 rounded-[20px] p-6 text-slate-700 font-bold italic focus:ring-2 ring-rose-100 transition-all outline-none resize-none placeholder:text-slate-300" placeholder="基于调研结果，你的项目方向会有什么调整？下一步要做什么？"></textarea>
          </section>
        </div>
      </div>
    </main>

    <!-- Footer Action -->
    <div class="h-24 px-8 border-t border-slate-200/60 bg-white/50 backdrop-blur-md flex items-center justify-between sticky bottom-0 z-40">
        <div class="flex items-center gap-4">
           <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">{{ progressPercent }}%</div>
           <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">总体完成度</div>
        </div>
        <button @click="goBack" class="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all">
           返回工作台
        </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { loadToolData, saveToolData } from '@/api/toolData';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.query.project);
const dataKey = computed(() => projectId.value ? `ai_course_pre_research_${projectId.value}` : 'ai_course_pre_research');

const form = reactive({
  question: '',
  targets: '',
  methods: [],
  plan: '',
  questions: '',
  findings: '',
  nextSteps: ''
});

const dynamicQuestions = ref(['']);
const dynamicFindings = ref(['']);

const steps = [
  { id: 'question', label: '定义问题', desc: 'Hypothesis' },
  { id: 'targets', label: '目标受众', desc: 'Audience' },
  { id: 'methods', label: '调研方法', desc: 'Research Methods' },
  { id: 'questions', label: '问题清单', desc: 'Interview Guide' },
  { id: 'findings', label: '调研发现', desc: 'Insights' },
  { id: 'nextSteps', label: '结论演进', desc: 'Actionable Steps' }
];

const methodOptions = [
  { value: 'interview', label: '深度访谈', icon: 'fa-comments' },
  { value: 'survey', label: '问卷采集', icon: 'fa-poll-h' },
  { value: 'observation', label: '实地观察', icon: 'fa-eye' },
  { value: 'data', label: '二传分析', icon: 'fa-chart-pie' }
];

const saveStatus = ref('Synced');
const saved = ref(true);
let statusTimer = null;
let ready = false;

async function loadData() {
  const savedData = await loadToolData(projectId.value, 'pre_research', dataKey.value);
  form.question = savedData.question || '';
  form.targets = savedData.targets || '';
  form.methods = Array.isArray(savedData.methods) ? savedData.methods : [];
  form.plan = savedData.plan || '';
  form.nextSteps = savedData.nextSteps || '';

  // Parse strings back to arrays if needed
  if (savedData.questions && typeof savedData.questions === 'string') {
     dynamicQuestions.value = savedData.questions.split('\n').filter(Boolean);
  } else if (Array.isArray(savedData.questionsList)) {
     dynamicQuestions.value = savedData.questionsList;
  }
  
  if (savedData.findings && typeof savedData.findings === 'string') {
     dynamicFindings.value = savedData.findings.split('\n').filter(Boolean);
  } else if (Array.isArray(savedData.findingsList)) {
     dynamicFindings.value = savedData.findingsList;
  }

  if (dynamicQuestions.value.length === 0) dynamicQuestions.value = [''];
  if (dynamicFindings.value.length === 0) dynamicFindings.value = [''];

  ready = true;
}

async function saveData() {
  if (!ready) return;
  saved.value = false;
  saveStatus.value = 'Saving...';
  
  const payload = {
    ...form,
    questions: dynamicQuestions.value.join('\n'), // For backward compatibility
    questionsList: dynamicQuestions.value,
    findings: dynamicFindings.value.join('\n'),
    findingsList: dynamicFindings.value,
    updatedAt: new Date().toISOString()
  };
  
  await saveToolData(projectId.value, 'pre_research', dataKey.value, payload);
  
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    saved.value = true;
    saveStatus.value = 'Synced';
  }, 800);
}

function toggleMethod(val) {
  const idx = form.methods.indexOf(val);
  if (idx > -1) form.methods.splice(idx, 1);
  else form.methods.push(val);
}

function addQuestion() { dynamicQuestions.value.push(''); }
function removeQuestion(idx) { dynamicQuestions.value.splice(idx, 1); }
function addFinding() { dynamicFindings.value.push(''); }
function removeFinding(idx) { dynamicFindings.value.splice(idx, 1); }

function isFieldReady(id) {
  if (id === 'question') return form.question.length > 5;
  if (id === 'targets') return form.targets.length > 5;
  if (id === 'methods') return form.methods.length > 0;
  if (id === 'questions') return dynamicQuestions.value.some(q => q.length > 3);
  if (id === 'findings') return dynamicFindings.value.some(f => f.length > 5);
  if (id === 'nextSteps') return form.nextSteps.length > 10;
  return false;
}

const progressPercent = computed(() => {
  const count = steps.filter(s => isFieldReady(s.id)).length;
  return Math.round((count / steps.length) * 100);
});

function scrollToField(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function generateAIHelp() {
  alert('AI 正在接入中... 这里的接口将分析你的立项 Brief 并推荐核心调研问题。');
}

function goBack() {
  router.push({ path: '/workspace', query: { project: projectId.value } });
}

watch([form, dynamicQuestions, dynamicFindings], saveData, { deep: true });

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.animate-reveal {
  animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes reveal {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

::selection {
  background: #e0e7ff;
  color: #3730a3;
}
</style>

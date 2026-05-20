<template>
  <div class="h-full bg-[#f8fafc] selection:bg-indigo-100 selection:text-indigo-900 overflow-y-auto custom-scrollbar">
    <!-- Header Nav -->
    <nav class="sticky top-0 z-50 bg-white/85 backdrop-blur-2xl border-b border-slate-200/60 px-6 py-4 flex justify-between items-center transition-all duration-500">
      <div class="flex items-center gap-4">
        <RouterLink :to="{ path: '/workspace', query: { project: projectId } }" class="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200">
          <i class="fas fa-arrow-left text-sm"></i>
        </RouterLink>
        <div>
          <h1 class="font-black text-slate-900 text-lg flex items-center tracking-tight">
            <span class="w-2.5 h-7 bg-indigo-600 rounded-full mr-3 shadow-lg shadow-indigo-600/20"></span>
            创新点梳理
          </h1>
          <p class="text-[10px] font-black text-indigo-500 tracking-tight mt-0.5">用于整理开题/结题提交中的创新点说明</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-sm transition-all duration-500">
          <div class="w-2 h-2 rounded-full transition-all duration-500" :class="saved ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-amber-400 animate-pulse'"></div>
          <span class="text-[10px] font-black uppercase tracking-widest" :class="saved ? 'text-emerald-600' : 'text-amber-600'">{{ saveStatus }}</span>
        </div>
        <button @click="optimizeWithAI" class="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all active:scale-95 flex items-center gap-2">
           <i class="fas fa-magic text-indigo-400"></i> AI 润色
        </button>
      </div>
    </nav>

    <main class="max-w-6xl mx-auto px-6 py-16">
      <header class="mb-20 text-center animate-reveal">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] mb-6 border border-indigo-100 shadow-sm">
          <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
          Creativity Phase
        </div>
        <h2 class="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-6 uppercase">Define Your Unique<br><span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">Differentiation</span></h2>
        <p class="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
          把“新在哪里、和已有方案相比好在哪里、如何验证”整理成可提交段落，方便放入开题报告、结题报告或答辩材料。
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
        <!-- Part 1: Core Summary -->
        <section class="premium-card group hover:!border-amber-400/50 transition-all duration-700 bg-white">
           <div class="flex items-center gap-5 mb-8">
              <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-2xl shadow-sm group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
                 <i class="fas fa-star-of-life"></i>
              </div>
              <div>
                 <h3 class="text-xl font-black text-slate-900 tracking-tight">创新核心定义</h3>
                 <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">The Core Value Prop</p>
              </div>
           </div>
           <textarea v-model="form.summary" class="w-full min-h-[180px] bg-slate-50/50 rounded-3xl p-8 text-sm font-semibold text-slate-700 border border-slate-100 outline-none focus:bg-white focus:border-amber-300 focus:ring-4 focus:ring-amber-500/5 transition-all resize-none leading-relaxed placeholder:text-slate-300" placeholder="用一句话描述你的创新：通过什么样的方式，解决了什么样的问题，带来了什么样的价值？"></textarea>
           <div class="mt-6 flex flex-col gap-3 p-5 rounded-2xl bg-amber-50/30 border border-amber-100/50 italic">
              <div class="flex items-center gap-2">
                 <span class="w-1 h-3 bg-amber-400 rounded-full"></span>
                 <span class="text-[10px] font-black text-amber-600 uppercase tracking-wider">Example Reference</span>
              </div>
              <p class="text-[11px] text-slate-400 font-medium leading-relaxed">“通过引入轻量级姿态补全算法，将原本复杂的 3D 动作识别延迟从 500ms 降低至受限端侧的 50ms。”</p>
           </div>
        </section>

        <!-- Part 2: Comparison -->
        <section class="premium-card group hover:!border-blue-400/50 transition-all duration-700 bg-white">
           <div class="flex items-center gap-5 mb-8">
              <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-2xl shadow-sm group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
                 <i class="fas fa-layer-group"></i>
              </div>
              <div>
                 <h3 class="text-xl font-black text-slate-900 tracking-tight">现有方案对比</h3>
                 <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Competitive Analysis</p>
              </div>
           </div>
           <textarea v-model="form.comparison" class="w-full min-h-[180px] bg-slate-50/50 rounded-3xl p-8 text-sm font-semibold text-slate-700 border border-slate-100 outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none leading-relaxed placeholder:text-slate-300" placeholder="目前市面上的主流方法是怎么做的？你的方案在性能、交互、成本或伦理上有什么突破？"></textarea>
           <div class="mt-6 p-5 rounded-2xl bg-blue-50/30 border border-blue-100/50">
              <div class="flex items-center justify-between mb-2">
                 <span class="text-[10px] font-black text-blue-600 uppercase tracking-widest">USP Metric</span>
                 <i class="fas fa-chart-simple text-blue-300 text-xs"></i>
              </div>
              <p class="text-[11px] text-slate-400 font-medium italic">明确你的“核心指标改进”。例如：精度提升 15% 或 部署门槛降低 80%。</p>
           </div>
        </section>

        <!-- Part 3: Proof -->
        <section class="premium-card group hover:!border-emerald-400/50 transition-all duration-700 bg-white">
           <div class="flex items-center gap-5 mb-8">
              <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl shadow-sm group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
                 <i class="fas fa-flask-vial"></i>
              </div>
              <div>
                 <h3 class="text-xl font-black text-slate-900 tracking-tight">验证与实证方法</h3>
                 <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Proof of Significance</p>
              </div>
           </div>
           <textarea v-model="form.proof" class="w-full min-h-[180px] bg-slate-50/50 rounded-3xl p-8 text-sm font-semibold text-slate-700 border border-slate-100 outline-none focus:bg-white focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none leading-relaxed placeholder:text-slate-300" placeholder="你打算通过什么实验、数据采样或用户对比测试来证明你的“不同之处”是成立且有价值的？"></textarea>
           <div class="mt-6 grid grid-cols-3 gap-3">
              <label v-for="tag in ['对比实验', '用户访谈', '压力测试']" :key="tag" class="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer group/tag transition-all hover:bg-emerald-50 hover:border-emerald-200">
                 <input type="checkbox" class="accent-emerald-600 w-3 h-3">
                 <span class="text-[10px] font-black text-slate-500 group-hover/tag:text-emerald-700 transition-colors uppercase">{{ tag }}</span>
              </label>
           </div>
        </section>

        <!-- Part 4: Risk -->
        <section class="premium-card group hover:!border-rose-400/50 transition-all duration-700 bg-white">
           <div class="flex items-center gap-5 mb-8">
              <div class="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-2xl shadow-sm group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
                 <i class="fas fa-shield-halved"></i>
              </div>
              <div>
                 <h3 class="text-xl font-black text-slate-900 tracking-tight">风险与边界意识</h3>
                 <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Risks & Blind Spots</p>
              </div>
           </div>
           <textarea v-model="form.risk" class="w-full min-h-[180px] bg-slate-50/50 rounded-3xl p-8 text-sm font-semibold text-slate-700 border border-slate-100 outline-none focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-500/5 transition-all resize-none leading-relaxed placeholder:text-slate-300" placeholder="哪些场景是本创新无法覆盖的？最大的技术风险点在哪里？思考你的技术伦理边界。"></textarea>
           <div class="mt-6 flex gap-4">
              <div class="flex-1 p-3 rounded-xl bg-rose-50 border border-rose-100 text-[10px] font-black text-rose-600 uppercase tracking-widest text-center shadow-sm">High Risk Zone</div>
              <div class="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Safety Buffer</div>
           </div>
        </section>
      </div>

      <div class="mt-24 mb-12 flex justify-center">
         <button @click="goBack" class="px-16 py-6 bg-slate-900 text-white rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/30 hover:scale-105 active:scale-95 transition-all group flex items-center gap-3">
            锁定创新锚点 <i class="fas fa-check-circle text-emerald-400 opacity-60 group-hover:opacity-100 transition-opacity"></i>
         </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiFetch } from '@/api/client';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.query.project);
const dataKey = computed(() => projectId.value ? `ai_course_innovation_${projectId.value}` : 'ai_course_innovation');

const form = reactive({
  summary: '',
  comparison: '',
  proof: '',
  risk: ''
});

const saveStatus = ref('Synced');
const saved = ref(true);
let statusTimer = null;
let ready = false;

function loadData() {
  const savedData = JSON.parse(localStorage.getItem(dataKey.value) || '{}');
  form.summary = savedData.summary || '';
  form.comparison = savedData.comparison || '';
  form.proof = savedData.proof || '';
  form.risk = savedData.risk || '';
  ready = true;
}

function saveData() {
  if (!ready) return;
  saved.value = false;
  saveStatus.value = 'Auto Saving...';
  
  localStorage.setItem(dataKey.value, JSON.stringify({ ...form, updatedAt: new Date().toISOString() }));
  
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    saved.value = true;
    saveStatus.value = 'Everything Synced';
    notifyParent();
  }, 1000);
}

function notifyParent() {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'innovation-updated', projectId: projectId.value }, window.location.origin);
    }
  } catch(e) {}
}

function goBack() {
  router.push({ path: '/workspace', query: { project: projectId.value } });
}

function optimizeWithAI() {
  // Placeholder: In a real app, send 'form' content to LLM to refine phrases
  alert('AI 润色功能正在接入：将基于学术规范优化你的创新点表述。');
}

watch(form, saveData, { deep: true });

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.premium-card { @apply rounded-[48px] border border-slate-200/60 p-12 transition-all duration-700 shadow-sm; }
.animate-reveal { animation: reveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes reveal { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>

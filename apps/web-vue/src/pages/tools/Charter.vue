<template>
  <div class="charter-tool bg-[#f8fafc] min-h-screen pb-20 selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Header Nav -->
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 transition-all py-2">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <i class="fas fa-file-signature text-lg"></i>
          </div>
          <div>
            <h1 class="text-sm font-black text-slate-900 uppercase tracking-widest">项目立项书</h1>
            <p class="text-[10px] font-bold text-slate-400 tracking-tight">用于整理开题提交中的立项书内容</p>
          </div>
        </div>

        <div class="flex items-center gap-2 bg-slate-100/50 p-1 rounded-[18px] border border-slate-200/50">
          <button v-for="(label, key) in CONFIG" :key="key"
            class="px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-[14px] transition-all"
            :class="mode === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'"
            @click="setMode(key)"
          >
            {{ key === 'product' ? '工程产品' : key === 'research' ? '课题探究' : '社会公益' }}
          </button>
        </div>

        <div class="flex items-center gap-5">
          <div class="flex flex-col items-end">
            <span class="text-[9px] font-black uppercase tracking-widest transition-colors duration-500" :class="saved ? 'text-emerald-500' : 'text-slate-300'">
              {{ saved ? 'Everything Synced' : 'Saving Draft...' }}
            </span>
            <div v-if="!saved" class="w-24 h-0.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
               <div class="h-full bg-indigo-500 w-1/3 animate-[progress-stripe_1s_linear_infinite] bg-[length:10px_10px] bg-[linear-gradient(45deg,rgba(255,255,255,.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.2)_50%,rgba(255,255,255,.2)_75%,transparent_75%,transparent)]"></div>
            </div>
          </div>
          <button @click="exportPDF" class="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all active:scale-95">
            <i class="fas fa-file-pdf mr-2 opacity-70"></i> 导出 PDF
          </button>
        </div>
      </div>
    </nav>

    <main class="max-w-5xl mx-auto px-6 py-20 animate-reveal">
      <!-- Title Input Section -->
      <div class="relative group mb-24">
        <div class="absolute -top-10 left-1/2 -translate-x-1/2 text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-all">Project Identity</div>
        <input 
          v-model="form.projName" 
          type="text" 
          class="text-4xl md:text-6xl font-black text-center bg-transparent border-none outline-none w-full py-4 tracking-tighter text-slate-900 placeholder:text-slate-200 transition-all hover:placeholder:text-slate-300" 
          placeholder="给你的项目起一个响亮的名字..."
        >
        <div class="h-1.5 w-32 bg-indigo-600 mx-auto rounded-full mt-6 shadow-lg shadow-indigo-500/20 group-hover:w-48 transition-all duration-700"></div>
      </div>

      <!-- Input Grid -->
      <div class="grid md:grid-cols-2 gap-10">
        <div v-for="(cfg, key) in labels" :key="key" 
          class="premium-card group hover:!border-indigo-400/50 transition-all duration-700 flex flex-col min-h-[320px] relative overflow-hidden"
          :class="key === 'q4' ? '!bg-slate-900 !text-white !border-none shadow-2xl shadow-indigo-900/20' : '!bg-white'"
        >
          <!-- Corner Badge for Step Number -->
          <div class="absolute -top-4 -right-4 w-16 h-16 bg-slate-50 rounded-full flex items-end justify-start p-4 text-slate-100 font-black text-3xl group-hover:text-indigo-50 transition-colors" :class="{'!bg-white/5 !text-white/5': key === 'q4'}">
             {{ key.slice(1) }}
          </div>

          <div class="flex items-center gap-4 mb-8 relative z-10">
            <div class="w-12 h-12 rounded-[20px] flex items-center justify-center text-xl transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-sm"
              :class="key === 'q4' ? 'bg-white/10 text-indigo-400' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-600/30'"
            >
              <i :class="cfg.icon"></i>
            </div>
            <div>
               <h3 class="text-[11px] font-black uppercase tracking-[0.1em]" :class="key === 'q4' ? 'text-slate-400' : 'text-slate-500'">{{ cfg.text }}</h3>
               <p class="text-[9px] font-bold uppercase tracking-widest opacity-40 mt-1" :class="{'text-indigo-300': key === 'q4'}">
                  {{ labelsInfo[key] }}
               </p>
            </div>
          </div>
          
          <textarea 
            v-model="form[mapField(key)]" 
            class="flex-1 w-full bg-transparent border-none outline-none resize-none text-base font-medium leading-relaxed placeholder:opacity-30 relative z-10 p-2 rounded-xl transition-all focus:ring-4"
            :class="key === 'q4' ? 'placeholder:text-indigo-300/50 italic text-xl focus:ring-white/5' : 'text-slate-600 placeholder:text-slate-400 focus:ring-indigo-50/50'"
            :placeholder="placeholders[key]"
          ></textarea>

          <!-- AI Optimization Trigger (Mock) -->
          <button v-if="key === 'q4'" class="absolute bottom-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100">
             <i class="fas fa-magic mr-1 text-indigo-400"></i> AI Optimize
          </button>
        </div>
      </div>

      <!-- Expert Guidance Section -->
      <section class="mt-20 relative p-12 bg-white rounded-[48px] border border-slate-200/60 shadow-xl overflow-hidden group">
        <div class="absolute top-0 right-0 p-12 opacity-[0.03] scale-150 rotate-12 transition-transform group-hover:rotate-0 duration-1000">
          <i class="fas fa-user-tie text-9xl"></i>
        </div>
        <div class="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
          <div class="w-20 h-20 rounded-[28px] bg-indigo-600 text-white flex items-center justify-center text-3xl shadow-2xl shadow-indigo-600/30 shrink-0 animate-bounce-subtle">
            <i class="fas fa-graduation-cap"></i>
          </div>
          <div class="space-y-4">
             <h4 class="text-lg font-black text-slate-900 uppercase tracking-widest">立项导师的深度建议</h4>
             <p class="text-sm text-slate-500 font-medium leading-relaxed max-w-3xl">
               立项书模板用于帮助你准备开题材料，不要求必须在平台内写完；整理好后可导出或作为附件上传。
               <br>• <span class="text-indigo-600 font-bold">工程产品类</span>项：请像产品经理一样思考，明确“谁在什么时间、什么地点”会使用你的东西。
               <br>• <span class="text-blue-600 font-bold">课题探究类</span>：你的研究变量必须是可观测、可量化的。
               <br>• <span class="text-rose-600 font-bold">电梯演讲</span>：应能在 30 秒内向不了解你的人解释清楚核心价值。
             </p>
             <div class="pt-4 flex gap-4">
                <button @click="setToolView('pre_research')" class="px-5 py-2.5 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">查看调研范例</button>
                <button @click="setToolView('innovation')" class="px-5 py-2.5 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">寻找创新灵感</button>
             </div>
          </div>
        </div>
      </section>
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
const dataKey = computed(() => projectId.value ? `ai_course_charter_${projectId.value}` : 'ai_course_charter');

const form = reactive({
  projName: '',
  projPersona: '',
  projPain: '',
  projSolution: '',
  projValue: ''
});

const mode = ref('product');
const saved = ref(false);
let ready = false;

const labelsInfo = {
  q1: 'Target Audience / Research Subject',
  q2: 'Core Painpoints / Research Question',
  q3: 'Mechanism / Solution Path',
  q4: 'Elevator Pitch / Final Impact'
};

const CONFIG = {
  product: {
    labels: {
      q1: { icon: 'fas fa-user-astronaut', text: '1. 目标用户画像' },
      q2: { icon: 'fas fa-ghost', text: '2. 真实痛点洞察' },
      q3: { icon: 'fas fa-gears', text: '3. 产品核心逻辑' },
      q4: { icon: 'fas fa-bolt-lightning', text: '4. 黄金电梯演讲' }
    },
    placeholders: {
      q1: '谁是你的核心玩家？描述他们的年龄、身份及典型生活片段。\n例如：高一（3）班经常忘记带饭卡的走读生...',
      q2: '他们在什么场景下感到痛苦？目前的替代方案有多糟糕？\n例如：午休时间只有40分钟，排队充卡要花15分钟，导致无法午睡...',
      q3: '你要用什么技术手段优雅地解决它？\n例如：基于人脸识别的无感支付终端，部署在食堂窗口，实现“刷脸即付”...',
      q4: '一句话定乾坤：我们做的是______，专门解决______，让目标用户能够______。'
    }
  },
  research: {
    labels: {
      q1: { icon: 'fas fa-microscope', text: '1. 核心研究对象' },
      q2: { icon: 'fas fa-circle-question', text: '2. 待验证的假设' },
      q3: { icon: 'fas fa-vial-circle-check', text: '3. 变量控制方案' },
      q4: { icon: 'fas fa-file-invoice', text: '4. 学术预期成果' }
    },
    placeholders: {
      q1: '你的研究主权落在哪里？\n例如：校园内不同光照强度下，景天科植物的叶绿素含量变化...',
      q2: '你打算攻克哪个未知的逻辑点？\n例如：是否存在一个特定的补光频率，能让多肉在无阳光环境下保持红润？',
      q3: '你打算怎么做实验？有哪些不可控变量？\n例如：设置三组对照，控制温度与水分。通过高精度传感器每4小时记录一次数据...',
      q4: '结题时你打算拿出什么证据？\n例如：一份含原始实验记录、统计显著性分析对比的完整学术报告。'
    }
  },
  impact: {
    labels: {
      q1: { icon: 'fas fa-people-pulling', text: '1. 受益社区群体' },
      q2: { icon: 'fas fa-heart-crack', text: '2. 社会问题现状' },
      q3: { icon: 'fas fa-bridge-circle-check', text: '3. 公益行动路径' },
      q4: { icon: 'fas fa-star-of-life', text: '4. 长期社会影响' }
    },
    placeholders: {
      q1: '谁处在困境之中？\n例如：无法适应由于医院全面数字化转型而导致的柜台预约取消的社区空巢老人...',
      q2: '不解决这个问题，社会会发生什么？\n例如：老人错失最佳诊疗期。目前的“健康码”和“预约App”对他们而言是无法逾越的数字鸿沟...',
      q3: '你打算如何发动社区力量产生真实干预？\n例如：组织“跨代互助”小组，开发一套极简的、全语音交互的挂号辅助导航软件...',
      q4: '行动之后，社区的面貌会有何不同？\n例如：提升100位老人的挂号成功率，建立一套可复制的适老化数字转型支持方案。'
    }
  }
};

const labels = computed(() => CONFIG[mode.value].labels);
const placeholders = computed(() => CONFIG[mode.value].placeholders);

function mapField(key) {
  const map = { q1: 'projPersona', q2: 'projPain', q3: 'projSolution', q4: 'projValue' };
  return map[key];
}

function setMode(next) {
  mode.value = next;
}

function setToolView(tool) {
   if (projectId.value) {
     router.push({ path: `/tools/${tool}`, query: { project: projectId.value } });
   }
}

async function saveData() {
  if (!ready) return;
  saved.value = false;
  
  localStorage.setItem(dataKey.value, JSON.stringify({ mode: mode.value, ...form }));
  
  setTimeout(() => {
    saved.value = true;
    notifyParent();
  }, 1000);
}

function loadData() {
  const savedData = JSON.parse(localStorage.getItem(dataKey.value) || '{}');
  form.projName = savedData.projName || '';
  form.projPersona = savedData.projPersona || '';
  form.projPain = savedData.projPain || '';
  form.projSolution = savedData.projSolution || '';
  form.projValue = savedData.projValue || '';
  mode.value = savedData.mode || 'product';
  ready = true;
  saved.value = true;
}

function notifyParent() {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'charter-updated', projectId: projectId.value }, window.location.origin);
    }
  } catch(e) {}
}

function exportPDF() {
  window.print();
}

let saveTimeout = null;
watch([form, mode], () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveData, 1000);
}, { deep: true });

onMounted(loadData);
</script>

<style scoped>
.charter-tool { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
.premium-card { @apply rounded-[44px] border border-slate-200/60 p-10 shadow-sm transition-all duration-700; }
.animate-reveal { animation: reveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes reveal { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
.animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }

@media print {
  nav { display: none !important; }
  .charter-tool { background: white !important; }
  .premium-card { border: 1px solid #eee !important; box-shadow: none !important; border-radius: 20px !important; margin-bottom: 20px; page-break-inside: avoid; }
  .bg-slate-900 { background: #333 !important; color: white !important; -webkit-print-color-adjust: exact; }
  textarea { height: auto !important; }
}
</style>

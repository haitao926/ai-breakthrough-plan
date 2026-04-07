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
            文献阅读与学术发现
          </h1>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Literature Review & Insights</p>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100/50 border border-slate-200/50">
          <div class="w-1.5 h-1.5 rounded-full transition-all duration-500" :class="saved ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'"></div>
          <span class="text-[11px] font-black uppercase tracking-widest" :class="saved ? 'text-emerald-600' : 'text-amber-600'">{{ saveStatus }}</span>
        </div>
        <button @click="addPaper" class="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all">
          <i class="fas fa-plus mr-2"></i> 添加文献
        </button>
      </div>
    </nav>

    <main class="max-w-6xl mx-auto px-6 py-12">
      <header class="mb-16 text-center animate-reveal">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          <i class="fas fa-book-open"></i> Foundation Phase
        </div>
        <h2 class="text-4xl font-black text-slate-900 tracking-tight mb-4">站在巨人的肩膀上</h2>
        <p class="text-slate-500 font-medium max-w-2xl mx-auto">通过梳理已有研究成果，确定你的项目在学术和市场中的独特定位，避免“重复造轮子”。</p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Main Form Area -->
        <div class="lg:col-span-8 space-y-8">
          <!-- Top Section: Research Topic -->
          <div class="premium-card">
            <div class="grid md:grid-cols-2 gap-8">
               <div class="space-y-4">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <i class="fas fa-bullseye text-indigo-600"></i> 研究主题 / 核心问题
                  </label>
                  <textarea v-model="form.topic" class="w-full min-h-[80px] bg-slate-50 rounded-2xl p-4 text-sm font-semibold text-slate-700 outline-none focus:ring-2 ring-indigo-100 transition-all border-none resize-none" placeholder="输入你要通过文献解决的课题..."></textarea>
               </div>
               <div class="space-y-4">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <i class="fas fa-search text-indigo-600"></i> 数据检索关键词
                  </label>
                  <textarea v-model="form.keywords" class="w-full min-h-[80px] bg-slate-50 rounded-2xl p-4 text-sm font-semibold text-slate-700 outline-none focus:ring-2 ring-indigo-100 transition-all border-none resize-none" placeholder="关键词A, 关键词B, 关键词C..."></textarea>
               </div>
            </div>
          </div>

          <!-- Papers Section -->
          <div class="space-y-6">
             <div v-if="!form.papers.length" class="premium-card !bg-slate-50 border-dashed !py-16 text-center">
                <div class="w-16 h-16 rounded-full bg-white mx-auto mb-6 flex items-center justify-center text-slate-300">
                   <i class="fas fa-book-bookmark text-2xl"></i>
                </div>
                <h4 class="text-sm font-black text-slate-900 mb-2">暂无阅读资料</h4>
                <p class="text-xs text-slate-400 font-medium mb-6">点击右上角“添加文献”按钮，开启深度阅读之旅。</p>
             </div>

             <div v-for="(paper, idx) in form.papers" :key="idx" class="premium-card hover:ring-2 ring-indigo-500/10 transition-all group relative">
                <button @click="removePaper(idx)" class="absolute top-6 right-6 w-8 h-8 rounded-lg bg-slate-50 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                   <i class="fas fa-trash-alt text-xs"></i>
                </button>
                
                <div class="flex items-start gap-6 mb-8">
                   <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex shrink-0 items-center justify-center font-black">
                      {{ String(idx + 1).padStart(2, '0') }}
                   </div>
                   <div class="flex-1">
                      <input v-model="paper.title" class="w-full bg-transparent border-none outline-none text-xl font-black text-slate-900 placeholder:text-slate-200" placeholder="文献标题 / 论文名称">
                      <div class="flex items-center gap-4 mt-3">
                        <div class="flex items-center gap-2">
                           <i class="fas fa-user-edit text-[10px] text-slate-400"></i>
                           <input v-model="paper.authors" class="text-xs font-bold text-slate-500 bg-transparent border-none outline-none" placeholder="作者 / 发表年份">
                        </div>
                        <div class="flex items-center gap-2">
                           <i class="fas fa-link text-[10px] text-slate-400"></i>
                           <input v-model="paper.link" class="text-xs font-bold text-slate-500 bg-transparent border-none outline-none" placeholder="DOI / 检索链接">
                        </div>
                      </div>
                   </div>
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                   <div class="space-y-4">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">核心结论</label>
                      <textarea v-model="paper.takeaway" class="w-full bg-slate-50 rounded-2xl p-5 text-sm font-medium text-slate-600 min-h-[120px] border-none outline-none focus:ring-2 ring-emerald-100 transition-all resize-none" placeholder="这篇文献主要证明了什么？核心发现有哪些？"></textarea>
                   </div>
                   <div class="space-y-4">
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">对我们项目的启发</label>
                      <textarea v-model="paper.inspiration" class="w-full bg-indigo-50/30 rounded-2xl p-5 text-sm font-bold text-slate-700 min-h-[120px] border-none outline-none focus:ring-2 ring-indigo-200 transition-all resize-none italic" placeholder="我们可以借鉴它的什么方法？或者它留下了什么我们可以补充的空白？"></textarea>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <!-- Right Side: Navigation & Summary -->
        <div class="lg:col-span-4 space-y-6">
           <div class="premium-card !p-6 space-y-8 sticky top-28">
              <div class="space-y-2">
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">阅读进度汇总</h3>
                <div class="flex items-end justify-between">
                   <div class="text-3xl font-black text-slate-900">{{ form.papers.length }}</div>
                   <div class="text-[10px] font-bold text-slate-400 uppercase mb-1">篇文献已录入</div>
                </div>
                <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                   <div class="h-full bg-indigo-600" :style="{ width: Math.min(100, form.papers.length * 20) + '%' }"></div>
                </div>
              </div>

              <div class="space-y-4">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <i class="fas fa-pen-nib text-indigo-600"></i> 总结性启发笔记
                </label>
                <textarea v-model="form.notes" class="w-full h-[300px] bg-slate-50 rounded-2xl p-5 text-sm font-medium text-slate-600 outline-none focus:ring-2 ring-indigo-100 transition-all border-none resize-none leading-relaxed" placeholder="综合以上所有阅读，你得出的最重要的结论是..."></textarea>
              </div>

              <div class="pt-4 border-t border-slate-100">
                 <button @click="goBack" class="w-full py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:-translate-y-0.5 active:scale-95 transition-all">
                    完成并返回
                 </button>
              </div>
           </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.query.project);
const dataKey = computed(() => projectId.value ? `ai_course_literature_${projectId.value}` : 'ai_course_literature');

const form = reactive({
  topic: '',
  keywords: '',
  notes: '',
  papers: []
});

const saveStatus = ref('Synced');
const saved = ref(true);
let statusTimer = null;
let ready = false;

function loadData() {
  const savedData = JSON.parse(localStorage.getItem(dataKey.value) || '{}');
  form.topic = savedData.topic || '';
  form.keywords = savedData.keywords || '';
  form.notes = savedData.notes || '';
  form.papers = Array.isArray(savedData.papers) ? savedData.papers : [];
  ready = true;
}

function saveData() {
  if (!ready) return;
  saved.value = false;
  saveStatus.value = 'Saving...';
  
  localStorage.setItem(dataKey.value, JSON.stringify({ ...form, updatedAt: new Date().toISOString() }));
  
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    saved.value = true;
    saveStatus.value = 'Synced';
  }, 800);
}

function addPaper() {
  form.papers.unshift({ title: '', authors: '', link: '', takeaway: '', inspiration: '' });
}

function removePaper(idx) {
  if (confirm('确定移除这篇文献记录吗？')) {
    form.papers.splice(idx, 1);
  }
}

function goBack() {
  router.push({ path: '/workspace', query: { project: projectId.value } });
}

watch(form, saveData, { deep: true });

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
</style>


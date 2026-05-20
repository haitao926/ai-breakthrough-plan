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
            系统架构与设计
          </h1>
          <p class="text-[10px] font-bold text-slate-400 tracking-tight mt-0.5">用于整理开题/里程碑/结题提交中的技术附件</p>
        </div>
      </div>
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100/50 border border-slate-200/50">
          <div class="w-1.5 h-1.5 rounded-full transition-all duration-500" :class="saved ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'"></div>
          <span class="text-[11px] font-black uppercase tracking-widest" :class="saved ? 'text-emerald-600' : 'text-amber-600'">{{ saveStatus }}</span>
        </div>
        <button @click="openDrawio" class="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 hover:scale-105 active:scale-95 transition-all">
          <i class="fas fa-external-link-alt mr-2"></i> 进入 Draw.io
        </button>
      </div>
    </nav>

    <main class="max-w-6xl mx-auto px-6 py-12">
      <header class="mb-16 animate-reveal">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
          <i class="fas fa-layer-group"></i> Blueprints Phase
        </div>
        <h2 class="text-4xl font-black text-slate-900 tracking-tight mb-4">描绘你的技术蓝图</h2>
        <p class="text-slate-500 font-medium max-w-2xl">用于准备可上传的架构图、流程图、硬件接线图和 BOM 清单，作为开题方案、里程碑记录或结题附件。</p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Dashboard & Preview -->
        <div class="lg:col-span-12">
           <div class="premium-card !bg-slate-900 !text-white overflow-hidden relative min-h-[300px] flex flex-col items-center justify-center text-center">
              <div class="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:20px_20px]"></div>
              <div class="relative z-10 p-12 max-w-xl">
                 <div class="w-20 h-20 rounded-[28px] bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center mx-auto mb-8 text-3xl">
                    <i class="fas fa-project-diagram text-indigo-400"></i>
                 </div>
                 <h3 class="text-2xl font-black mb-4">可视化架构建模</h3>
                 <p class="text-slate-400 text-sm font-medium leading-relaxed mb-8">点击上方按钮进入 Draw.io 绘制架构，完成后可将导出的图片或截图上传到对应阶段提交中。</p>
                 <div class="flex items-center justify-center gap-4">
                    <div class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">逻辑流图</div>
                    <div class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">硬件接线</div>
                    <div class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">数据结构</div>
                 </div>
              </div>
           </div>
        </div>

        <!-- BOM Section -->
        <div class="lg:col-span-8">
           <div class="premium-card space-y-8">
              <div class="flex items-center justify-between">
                 <div>
                    <h3 class="text-xl font-black text-slate-900 tracking-tight">资材清单 (BOM)</h3>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resource planning</p>
                 </div>
                 <button @click="addItem" class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-all">
                    <i class="fas fa-plus"></i>
                 </button>
              </div>

              <div class="space-y-4">
                 <div v-if="!form.items.length" class="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p class="text-xs font-bold text-slate-400">点击 “+” 开始规划你的软硬件需求</p>
                 </div>
                 
                 <div v-for="(item, idx) in form.items" :key="idx" class="flex gap-4 items-center group">
                    <div class="w-12 h-12 rounded-2xl bg-slate-100 flex shrink-0 items-center justify-center">
                       <select v-model="item.type" class="bg-transparent border-none outline-none text-lg cursor-pointer">
                          <option value="hardware">🔌</option>
                          <option value="software">💾</option>
                          <option value="service">☁️</option>
                       </select>
                    </div>
                    <div class="flex-1 grid grid-cols-12 gap-3 bg-slate-50 rounded-2xl border border-transparent focus-within:border-indigo-200 transition-all p-2 pr-4">
                       <input v-model="item.name" class="col-span-5 bg-transparent border-none outline-none text-sm font-black text-slate-700 px-4" placeholder="组件名称">
                       <input v-model="item.spec" class="col-span-5 bg-transparent border-none outline-none text-xs font-bold text-slate-400 px-4" placeholder="规格 / 版本 / 备注">
                       <input v-model="item.count" type="number" class="col-span-2 bg-transparent border-none outline-none text-sm font-black text-indigo-600 text-right pr-2" placeholder="1">
                    </div>
                    <button @click="removeItem(idx)" class="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                       <i class="fas fa-times"></i>
                    </button>
                 </div>
              </div>
           </div>
        </div>

        <!-- Strategy Sidebar -->
        <div class="lg:col-span-4 space-y-6">
           <div class="premium-card !p-6 space-y-6">
              <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest">设计侧重</h4>
              <div class="space-y-4">
                 <div class="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                    <div class="text-amber-700 text-xs font-black mb-1">功能解耦</div>
                    <p class="text-[10px] text-amber-600/80 font-medium leading-relaxed">确保每个模块只负责一件事。高内聚低耦合是好设计的标志。</p>
                 </div>
                 <div class="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <div class="text-emerald-700 text-xs font-black mb-1">错误处理</div>
                    <p class="text-[10px] text-emerald-600/80 font-medium leading-relaxed">在架构中考虑“如果某个部分挂了，系统该怎么办”。</p>
                 </div>
                 <div class="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                    <div class="text-indigo-700 text-xs font-black mb-1">可扩展性</div>
                    <p class="text-[10px] text-indigo-600/80 font-medium leading-relaxed">为未来的功能迭代预留接口或数据空间。</p>
                 </div>
              </div>
           </div>

           <div class="premium-card !p-6 bg-slate-900 !text-white !rounded-[24px]">
              <h4 class="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">粘贴截图链接</h4>
              <input v-model="form.diagramUrl" class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-mono text-white outline-none focus:border-indigo-500 transition-all" placeholder="https://cdn.example.com/arch.png">
              <p class="mt-4 text-[10px] text-white/40 font-medium italic italic">提示：你可以将 Draw.io 图表导出为图片，上传至图床后在此粘贴链接。</p>
           </div>
        </div>
      </div>

      <div class="mt-12 flex justify-center">
         <button @click="goBack" class="px-12 py-4 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all">
            规划完毕
         </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { loadToolData, saveToolData } from '@/api/toolData';

const route = useRoute();
const router = useRouter();
const projectId = computed(() => route.query.project);
const dataKey = computed(() => projectId.value ? `ai_course_architect_${projectId.value}` : 'ai_course_architect');

const form = reactive({
  diagramUrl: '',
  items: []
});

const saveStatus = ref('Synced');
const saved = ref(true);
let statusTimer = null;
let ready = false;

async function loadData() {
  const savedData = await loadToolData(projectId.value, 'architect', dataKey.value);
  form.diagramUrl = savedData.diagramUrl || '';
  form.items = Array.isArray(savedData.items) ? savedData.items : [];
  ready = true;
}

async function saveData() {
  if (!ready) return;
  saved.value = false;
  saveStatus.value = 'Saving...';
  await saveToolData(projectId.value, 'architect', dataKey.value, { ...form, updatedAt: new Date().toISOString() });
  
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    saved.value = true;
    saveStatus.value = 'Synced';
  }, 800);
}

function addItem() {
  form.items.push({ type: 'hardware', name: '', spec: '', count: 1 });
}

function removeItem(idx) {
  form.items.splice(idx, 1);
}

function openDrawio() {
  window.open('https://drawio.reopeninnolab.com', '_blank');
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

select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
</style>

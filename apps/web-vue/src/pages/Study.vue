<template>
  <div class="study-page min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
    <!-- Header -->
    <header class="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 flex items-center justify-between sticky top-0 z-50 transition-all">
      <div class="flex items-center gap-6">
        <RouterLink to="/downloads" class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all">
          <i class="fas fa-arrow-left"></i>
        </RouterLink>
        <div class="flex items-center gap-4">
           <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
             <i class="fas fa-book-open"></i>
           </div>
           <div>
              <h1 class="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">{{ lessonTitle }}</h1>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{{ projectId }} / {{ lessonId }}</p>
           </div>
        </div>
      </div>

      <div class="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
        <button :class="modeButtonClass('mission')" @click="setMode('mission')">🎯 任务模式</button>
        <button :class="modeButtonClass('guide')" @click="setMode('guide')">📖 完整讲义</button>
      </div>
    </header>

    <!-- Mission Mode -->
    <div v-show="mode === 'mission'" class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar: Progress -->
      <aside class="w-72 bg-white border-r border-slate-200/60 flex flex-col overflow-y-auto flex-none z-10 p-6 space-y-8">
        <div>
           <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Course Timeline</h3>
           <div class="space-y-3">
              <button
                v-for="(phase, idx) in lessonPhases"
                :key="idx"
                class="w-full text-left p-4 rounded-2xl text-xs font-black transition-all flex items-center gap-4 group"
                :class="idx === currentStep ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-slate-50'"
                @click="loadStep(idx)"
              >
                <div class="w-8 h-8 rounded-xl border-2 flex shrink-0 items-center justify-center text-[10px] transition-colors"
                  :class="idx === currentStep ? 'border-white/20 bg-white/10' : 'border-slate-100 bg-white group-hover:border-indigo-100'">
                  {{ idx + 1 }}
                </div>
                <span class="truncate">{{ phase.student?.title || phase.title }}</span>
              </button>
           </div>
        </div>

        <div class="pt-8 border-t border-slate-100">
           <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Teacher Note</h3>
           <div class="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-[11px] font-bold text-indigo-600 leading-relaxed">
             "先理解逻辑，再敲代码。遇到困难随时向 AI Assistant 提问。"
           </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main ref="mainScroll" class="flex-1 overflow-y-auto bg-[#fcfdfe] scroll-smooth py-12 px-8 lg:px-20">
        <div class="max-w-4xl mx-auto space-y-12 animate-reveal">
          <div class="premium-card !bg-white !p-12 min-h-[600px] shadow-2xl shadow-indigo-500/5 relative overflow-hidden">
            <div v-if="lessonError" class="text-rose-500 font-bold p-6 bg-rose-50 rounded-2xl">{{ lessonError }}</div>
            <div v-else-if="!currentPhase" class="flex flex-col items-center justify-center py-40 text-slate-300">
               <i class="fas fa-spinner fa-spin text-3xl mb-4"></i>
               <span class="text-xs font-black uppercase tracking-widest">Constructing Content...</span>
            </div>
            
            <template v-else>
              <!-- Global Briefing (only on first step) -->
              <div v-if="showBriefing" class="bg-slate-900 rounded-[32px] p-8 text-white mb-16 shadow-2xl relative overflow-hidden group">
                <div class="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:20px_20px] opacity-10"></div>
                <div class="relative z-10 flex flex-col md:flex-row items-center gap-10">
                   <div class="flex-1 space-y-4 text-center md:text-left">
                      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-[9px] font-black uppercase tracking-widest border border-white/5">Initial Mission</div>
                      <h3 class="text-2xl font-black tracking-tight">选择你的创新航向</h3>
                      <p class="text-slate-400 text-sm font-medium leading-relaxed">
                        在所有的技术实践之前，明确你的赛道优先级：研究员、工程师还是公益行动者？这决定了你如何运用所学工具。
                      </p>
                      <RouterLink to="/competencies" class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                         查看《三位一体能力地图》
                      </RouterLink>
                   </div>
                   <div class="w-32 h-32 bg-indigo-500/20 rounded-full flex items-center justify-center animate-pulse">
                      <i class="fas fa-satellite text-4xl text-indigo-400"></i>
                   </div>
                </div>
              </div>

              <div class="flex items-center gap-4 mb-8">
                 <span class="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-4 py-1.5 bg-indigo-50 rounded-full">Phase {{ currentStep + 1 }}</span>
                 <div class="h-px flex-1 bg-slate-100"></div>
              </div>

              <h2 class="text-4xl font-black text-slate-900 tracking-tight mb-8 leading-tight">{{ currentPhase.title || currentPhaseName }}</h2>
              
              <article class="prose prose-slate prose-indigo max-w-none text-slate-600 font-medium leading-loose selection:bg-indigo-100 selection:text-indigo-900 mb-12" v-html="currentPhase.content || ''"></article>

              <!-- AI Prompts Area -->
              <div v-if="currentPhase.prompts?.length" class="space-y-6 my-12 pt-12 border-t border-slate-50">
                 <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Prompt Library</h4>
                 <div v-for="(p, idx) in currentPhase.prompts" :key="idx" 
                   class="p-6 rounded-[24px] bg-slate-50 border border-slate-100 group cursor-pointer transition-all hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100"
                   @click="copyPrompt(p.text)"
                 >
                    <div class="flex items-center justify-between mb-4">
                       <span class="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                          <i class="fas fa-robot"></i> {{ p.label || 'PROMPT' }}
                       </span>
                       <span class="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Click to copy</span>
                    </div>
                    <p class="text-sm font-bold text-slate-700 font-mono italic leading-relaxed">{{ p.text }}</p>
                 </div>
              </div>

              <!-- Task List Area -->
              <div v-if="currentPhase.tasks?.length" class="bg-indigo-900 rounded-[32px] p-8 mt-16 text-white shadow-xl">
                 <h3 class="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                    <i class="fas fa-tasks-alt text-indigo-400"></i> Action Checklist
                 </h3>
                 <div class="space-y-4">
                    <label v-for="(t, idx) in currentPhase.tasks" :key="idx" class="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                       <div class="relative w-5 h-5 mt-0.5">
                          <input type="checkbox" class="task-checkbox peer absolute opacity-0 cursor-pointer">
                          <div class="w-5 h-5 border-2 border-white/20 rounded-md peer-checked:bg-white peer-checked:border-white transition-all flex items-center justify-center">
                             <i class="fas fa-check text-[10px] text-indigo-900 opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                          </div>
                       </div>
                       <span class="text-sm font-bold text-slate-200 peer-checked:text-slate-500 peer-checked:line-through transition-all leading-tight" v-html="t"></span>
                    </label>
                 </div>
              </div>
            </template>
          </div>

          <footer class="flex items-center justify-between py-12">
            <button @click="prevStep" :disabled="currentStep === 0" class="flex items-center gap-4 px-8 py-4 rounded-2xl bg-white border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all disabled:opacity-30">
               <i class="fas fa-arrow-left"></i> PREV PHASE
            </button>
            <button @click="nextStep" :disabled="nextDisabled" class="flex items-center gap-4 px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 disabled:opacity-30" :class="nextButtonClass">
               {{ currentStep === lessonPhases.length - 1 ? 'COMPLETE COURSE' : 'NEXT PHASE' }} <i class="fas fa-arrow-right"></i>
            </button>
          </footer>
        </div>
      </main>

      <!-- Right Sidebar: Assets & HW -->
      <aside class="w-80 bg-white border-l border-slate-200/60 hidden xl:flex flex-col overflow-y-auto p-8 space-y-12">
        <!-- Resource Section -->
        <div>
           <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Core Assets</h3>
           <div v-if="loadingResources" class="flex items-center justify-center py-10 text-slate-300"><i class="fas fa-spinner fa-spin"></i></div>
           <div v-else class="space-y-2">
              <div v-if="!resources.length" class="text-xs font-bold text-slate-300 text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 italic">No assets linked</div>
              <a v-for="file in resources" :key="file.path" :href="resourceLink(file)" target="_blank" 
                class="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100">
                <div class="w-10 h-10 rounded-xl bg-slate-50 flex shrink-0 items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                   <i class="fas" :class="resourceIcon(file)"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-[11px] font-black text-slate-900 truncate tracking-tight">{{ file.name }}</div>
                  <div class="text-[9px] font-bold text-slate-400 uppercase">{{ file.isDirectory ? 'Dir' : formatBytes(file.size) }}</div>
                </div>
              </a>
           </div>
        </div>

        <!-- Homework Section -->
        <div>
           <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 italic">Submission Pad</h3>
           <div class="p-8 rounded-[32px] border-2 border-dashed transition-all cursor-pointer group text-center relative overflow-hidden"
             :class="homeworkDone ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-slate-100'"
             @click="triggerHomework">
              <div v-if="homeworkUploading" class="flex flex-col items-center py-4"><i class="fas fa-spinner fa-spin text-indigo-400 mb-4"></i><p class="text-[10px] font-black uppercase text-indigo-500">Transmitting...</p></div>
              <template v-else>
                 <div v-if="!homeworkDone" class="space-y-4">
                    <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mx-auto shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                       <i class="fas fa-file-export"></i>
                    </div>
                    <div class="text-[10px] font-black uppercase tracking-widest text-slate-900">Upload Task</div>
                    <p class="text-[8px] font-bold text-slate-400 uppercase">ZIP / PDF / CODE</p>
                 </div>
                 <div v-else class="space-y-4">
                    <div class="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/20"><i class="fas fa-check"></i></div>
                    <div class="text-[10px] font-black uppercase text-emerald-700">Mission Accomplished</div>
                    <p class="text-[8px] font-bold text-emerald-600 truncate px-4">{{ homeworkName }}</p>
                 </div>
              </template>
              <input ref="hwInput" type="file" class="hidden" @change="handleHomeworkUpload" />
           </div>
        </div>

        <!-- External Tools -->
        <div>
           <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Technical Tools</h3>
           <div class="space-y-4">
              <a v-for="t in externalTools" :key="t.name" :href="t.url" target="_blank"
                class="block p-5 rounded-[24px] border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group relative overflow-hidden">
                 <div class="relative z-10 flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                       <span class="text-[10px] font-black text-slate-900 uppercase tracking-widest">{{ t.name }}</span>
                       <i class="fas fa-external-link-alt text-[8px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </div>
                    <p class="text-[10px] font-bold text-slate-400">{{ t.desc }}</p>
                 </div>
              </a>
           </div>
        </div>
      </aside>
    </div>

    <!-- Guidebook Mode -->
    <div v-show="mode === 'guide'" class="flex-1 overflow-y-auto bg-white py-20 px-8 lg:px-20">
      <div class="max-w-4xl mx-auto prose prose-indigo prose-slate max-w-none animate-reveal" v-html="guideHtml"></div>
    </div>

    <!-- Toast Component -->
    <div v-if="toastVisible" class="fixed bottom-12 right-12 z-[100] animate-bounce">
       <div class="bg-indigo-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10">
          <i class="fas fa-comment-check text-emerald-400"></i>
          <span class="text-[10px] font-black uppercase tracking-widest">{{ toastMessage }}</span>
       </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { apiFetch } from '@/api/client';
import { getCurrentUser } from '@/api/authApi';

const route = useRoute();
const projectId = computed(() => route.query.project || 'project1');
const lessonId = computed(() => route.query.lesson || 'lesson1');

const mode = ref('mission');
const lessonData = ref(null);
const lessonError = ref('');
const currentStep = ref(0);
const resources = ref([]);
const loadingResources = ref(false);
const guideHtml = ref('');
const guideLoaded = ref(false);
const homeworkDone = ref(false);
const homeworkName = ref('');
const homeworkUploading = ref(false);
const hwInput = ref(null);
const toastVisible = ref(false);
const toastMessage = ref('Synced');
const mainScroll = ref(null);

const externalTools = [
  { name: 'Claude Code', desc: 'VS Code 沉浸式编程助手', url: 'https://claude.ai' },
  { name: 'Gitea', desc: '校内私有代码仓库', url: `http://${window.location.hostname}:3000` },
  { name: 'MediaPipe', desc: '谷歌官方算法可视化调试', url: 'https://mediapipe-studio.web.app/' }
];

const lessonPhases = computed(() => lessonData.value?.phases || []);
const currentPhase = computed(() => lessonPhases.value[currentStep.value]?.student || null);
const currentPhaseName = computed(() => lessonPhases.value[currentStep.value]?.title || '');
const lessonTitle = computed(() => lessonData.value?.title || 'Course In Progress');
const showBriefing = computed(() => lessonId.value === 'lesson1' && currentStep.value === 0);
const nextButtonClass = computed(() => currentStep.value === lessonPhases.value.length - 1 ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-indigo-600 shadow-indigo-600/20');
const nextDisabled = computed(() => {
  if (!lessonPhases.value.length) return true;
  if (currentStep.value === lessonPhases.value.length - 1) {
    return (parseInt(lessonId.value.replace('lesson', '')) || 1) >= 4;
  }
  return false;
});

function modeButtonClass(t) {
  return mode.value === t 
    ? 'px-6 py-2.5 rounded-xl text-xs font-black shadow-sm bg-white text-indigo-600 transition'
    : 'px-6 py-2.5 rounded-xl text-xs font-black text-slate-500 hover:text-slate-900 transition';
}

function setMode(m) { mode.value = m; if (m === 'guide') loadGuidebook(); }
function loadStep(idx) { currentStep.value = idx; nextTick(() => { if (mainScroll.value) mainScroll.value.scrollTop = 0; }); }
function prevStep() { if (currentStep.value > 0) loadStep(currentStep.value - 1); }
function nextStep() {
  if (currentStep.value < lessonPhases.value.length - 1) return loadStep(currentStep.value + 1);
  const curr = parseInt(lessonId.value.replace('lesson', '')) || 1;
  if (curr < 4) window.location.href = `/study?project=${projectId.value}&lesson=lesson${curr+1}`;
}

async function loadLesson() {
  lessonError.value = '';
  try {
    const res = await apiFetch(`/download/${projectId.value}/lessons/${lessonId.value}.json`);
    if (!res.ok) throw new Error('Lesson file not found');
    lessonData.value = await res.json();
  } catch (err) { lessonError.value = err.message; }
}

async function loadGuidebook() {
  if (guideLoaded.value) return;
  try {
    const res = await fetch(`/api/v1/download/${projectId.value}/guide.md`);
    const text = await res.text();
    guideHtml.value = window.marked ? window.marked.parse(text) : `<pre>${text}</pre>`;
    guideLoaded.value = true;
  } catch (err) { guideHtml.value = '<p class="text-rose-500">无法加载完整讲义文件。</p>'; }
}

async function loadResources() {
  loadingResources.value = true;
  try {
    const res = await apiFetch(`/files/${projectId.value}`);
    const data = await res.json();
    resources.value = (data.files || []).slice(0, 5);
  } catch (err) { resources.value = []; }
  finally { loadingResources.value = false; }
}

function resourceLink(f) { return f.isDirectory ? `/downloads?project=${projectId.value}&path=${encodeURIComponent(f.path)}` : `/api/v1/download/${projectId.value}/${encodeURIComponent(f.path)}`; }
function resourceIcon(f) {
  if (f.isDirectory) return 'fa-folder';
  const ext = f.name.split('.').pop().toLowerCase();
  const map = { pdf: 'fa-file-pdf', zip: 'fa-file-archive', py: 'fa-file-code', html: 'fa-file-code' };
  return map[ext] || 'fa-file';
}
function formatBytes(b) { return b > 1024 * 1024 ? (b/(1024*1024)).toFixed(1)+'MB' : (b/1024).toFixed(0)+'KB'; }

async function copyPrompt(t) {
  await navigator.clipboard.writeText(t || '');
  toastMessage.value = 'AI Prompt Copied';
  toastVisible.value = true;
  setTimeout(() => toastVisible.value = false, 2000);
}

function triggerHomework() { if (!homeworkUploading.value) hwInput.value?.click(); }
async function handleHomeworkUpload(e) {
  const file = e.target.files?.[0]; if (!file) return;
  homeworkUploading.value = true;
  try {
    const user = getCurrentUser();
    const pid = parseInt(projectId.value.replace('project', '')) || 1;
    const formData = new FormData();
    formData.append('type', 'showcase');
    formData.append('title', `[${lessonId.value}] ${file.name}`);
    formData.append('studentName', user?.name || 'Anonymous Student');
    formData.append('file', file);
    const res = await apiFetch(`/projects/${pid}/submissions`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    homeworkDone.value = true; homeworkName.value = file.name;
    const key = `hw_${projectId.value}_${lessonId.value}`;
    localStorage.setItem(key, 'true'); localStorage.setItem(`${key}_name`, file.name);
  } catch (err) { alert(err.message); }
  finally { homeworkUploading.value = false; e.target.value = ''; }
}

onMounted(() => { loadLesson(); loadResources(); const key = `hw_${projectId.value}_${lessonId.value}`; if(localStorage.getItem(key) === 'true') { homeworkDone.value = true; homeworkName.value = localStorage.getItem(`${key}_name`); } });
watch([projectId, lessonId], () => { loadLesson(); loadResources(); });
</script>

<style scoped>
.premium-card { @apply rounded-[40px] border border-slate-200/60 p-8 shadow-sm; }
.animate-reveal { animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes reveal { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.prose h1, .prose h2 { @apply font-black text-slate-900 tracking-tight; }
.prose p { @apply my-6 text-slate-600 leading-relaxed; }
</style>

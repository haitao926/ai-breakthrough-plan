<template>
  <div class="min-h-screen flex flex-col bg-[#f8fafc]">
    <header class="bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between flex-none z-50">
      <div class="flex items-center gap-3">
        <RouterLink to="/" class="text-gray-400 hover:text-indigo-600 mr-2"><i class="fas fa-arrow-left"></i></RouterLink>
        <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
          <i class="fas fa-code"></i>
        </div>
        <h1 class="font-bold text-gray-900">{{ lessonTitle }}</h1>
      </div>
      <div class="flex bg-gray-100 p-1 rounded-lg">
        <button :class="modeButtonClass('mission')" @click="setMode('mission')">🎯 任务模式</button>
        <button :class="modeButtonClass('guide')" @click="setMode('guide')">📖 完整讲义</button>
      </div>
    </header>

    <div v-show="mode === 'mission'" class="flex flex-1 overflow-hidden">
      <div class="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto flex-none z-10">
        <div class="p-4">
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">MISSION LOG</h3>
          <div class="space-y-1">
            <button
              v-for="(phase, idx) in lessonPhases"
              :key="phase.id || idx"
              class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-3"
              :class="idx === currentStep ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'"
              @click="loadStep(idx)"
            >
              <div class="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs opacity-70">{{ idx + 1 }}</div>
              <span class="truncate">{{ phase.student?.title || phase.title }}</span>
            </button>
          </div>
        </div>
      </div>

      <div ref="mainScroll" class="flex-1 overflow-y-auto p-8 bg-gray-50 scroll-smooth">
        <div class="max-w-4xl mx-auto space-y-8">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
            <div v-if="lessonError" class="text-red-500 p-4">{{ lessonError }}</div>
            <div v-else-if="!currentPhase" class="text-gray-400">课程数据加载中...</div>
            <template v-else>
              <div v-if="showBriefing" class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white mb-8 shadow-lg relative overflow-hidden">
                <div class="relative z-10 flex flex-col md:flex-row items-center gap-6">
                  <div class="flex-1">
                    <h3 class="text-xl font-bold mb-2"><i class="fas fa-flag-checkered mr-2"></i> 任务简报：选择你的赛道</h3>
                    <p class="text-indigo-100 text-sm mb-4 leading-relaxed">
                      在开始技术学习之前，你需要明确你的终极目标。是做一名<b>研究员</b>、<b>发明家</b>还是<b>公益行动者</b>？不同的选择将决定你后续项目的方向。
                    </p>
                    <RouterLink
                      to="/competencies"
                      class="inline-flex items-center px-4 py-2 bg-white text-indigo-600 rounded-lg font-bold text-sm hover:bg-gray-100 transition shadow-md"
                      target="_blank"
                    >
                      <i class="fas fa-map-signs mr-2"></i> 阅读《项目类型指南》
                    </RouterLink>
                  </div>
                  <div class="hidden md:block opacity-80">
                    <i class="fas fa-rocket text-6xl"></i>
                  </div>
                </div>
                <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
              </div>

              <div class="mb-2 text-indigo-600 font-bold text-sm uppercase tracking-wider">Step {{ currentStep + 1 }}</div>
              <h2 class="text-3xl font-bold text-gray-900 mb-6">{{ currentPhase.title || currentPhaseName }}</h2>
              <div class="markdown-body text-gray-600" v-html="currentPhase.content || ''"></div>

              <div v-if="currentPhase.prompts?.length" class="space-y-4 my-6">
                <div
                  v-for="(prompt, idx) in currentPhase.prompts"
                  :key="idx"
                  class="prompt-card p-4 rounded-lg border border-gray-200 cursor-pointer group"
                  @click="copyPrompt(prompt.text)"
                >
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                      <i class="fas fa-robot mr-1"></i> {{ prompt.label || 'AI Prompt' }}
                    </span>
                    <span class="text-xs text-gray-400 group-hover:text-indigo-500 transition"><i class="far fa-copy"></i> 点击复制</span>
                  </div>
                  <p class="text-gray-800 text-sm font-medium font-mono whitespace-pre-wrap pointer-events-none">{{ prompt.text }}</p>
                </div>
              </div>

              <div v-if="currentPhase.tasks?.length" class="bg-gray-50 rounded-xl p-6 mt-8">
                <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <i class="fas fa-list-check text-green-500"></i> 当前任务
                </h3>
                <div class="space-y-3">
                  <label v-for="(task, idx) in currentPhase.tasks" :key="idx" class="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" class="task-checkbox mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500">
                    <span class="text-gray-700 text-sm select-none" v-html="task"></span>
                  </label>
                </div>
              </div>
            </template>
          </div>

          <div class="flex justify-between pb-12">
            <button
              class="px-6 py-2 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
              :disabled="currentStep === 0"
              @click="prevStep"
            >
              <i class="fas fa-arrow-left mr-2"></i> 上一步
            </button>
            <button
              class="px-6 py-2 rounded-lg font-bold shadow-md hover:shadow-lg transition disabled:opacity-50"
              :class="nextButtonClass"
              :disabled="nextDisabled"
              @click="nextStep"
            >
              <span v-html="nextButtonLabel"></span>
            </button>
          </div>
        </div>
      </div>

      <div class="w-80 bg-white border-l border-gray-200 flex-col overflow-y-auto flex-none hidden xl:flex">
        <div class="p-6 border-b border-gray-100">
          <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <i class="fas fa-folder-open text-yellow-500"></i> 本课资源
          </h3>
          <div v-if="loadingResources" class="text-gray-400 text-sm flex items-center justify-center py-4">
            <i class="fas fa-spinner fa-spin mr-2"></i> 加载中...
          </div>
          <div v-else class="space-y-2">
            <div v-if="!resources.length" class="text-gray-400 text-xs text-center py-2">暂无资源文件</div>
            <a
              v-for="file in resources"
              :key="file.path"
              :href="resourceLink(file)"
              target="_blank"
              class="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition group"
            >
              <div class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                <i :class="resourceIcon(file)"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-700 truncate group-hover:text-indigo-700">{{ file.name }}</div>
                <div class="text-xs text-gray-400">{{ file.isDirectory ? '文件夹' : formatBytes(file.size) }}</div>
              </div>
              <i :class="file.isDirectory ? 'fas fa-external-link-alt' : 'fas fa-download'" class="text-gray-300 opacity-0 group-hover:opacity-100 transition"></i>
            </a>
          </div>
        </div>

        <div class="p-6 border-b border-gray-100">
          <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <i class="fas fa-cloud-upload-alt text-indigo-500"></i> 本课作业
          </h3>
          <div
            class="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl p-6 text-center hover:bg-indigo-100 transition cursor-pointer group relative"
            :class="homeworkDone ? 'bg-green-50 border-green-200' : ''"
            @click="triggerHomework"
          >
            <div v-if="homeworkUploading" class="py-4 text-indigo-600">
              <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
              <p class="text-xs">正在上传...</p>
            </div>
            <template v-else>
              <div v-show="!homeworkDone" id="hw-default" class="block">
                <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-500 text-2xl mx-auto mb-3 shadow-sm group-hover:scale-110 transition">
                  <i class="fas fa-plus"></i>
                </div>
                <p class="text-xs font-bold text-indigo-900">点击上传作业</p>
                <p class="text-[10px] text-indigo-400 mt-1">支持图片、文档或代码包</p>
              </div>
              <div v-show="homeworkDone" id="hw-uploaded" class="block">
                <div class="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-3 shadow-md">
                  <i class="fas fa-check"></i>
                </div>
                <p class="text-xs font-bold text-green-700">作业已提交</p>
                <p class="text-[10px] text-green-600 mt-1 truncate px-2">{{ homeworkName }}</p>
                <div class="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition backdrop-blur-sm rounded-xl">
                  <span class="text-xs font-bold text-indigo-600">点击重新上传</span>
                </div>
              </div>
            </template>
            <input ref="hwInput" type="file" class="hidden" @change="handleHomeworkUpload" />
          </div>
        </div>

        <div class="p-6">
          <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <i class="fas fa-toolbox text-indigo-500"></i> 常用工具
          </h3>
          <div class="space-y-3">
            <a href="https://claude.ai" target="_blank" class="block p-3 rounded-lg bg-orange-50 border border-orange-100 hover:border-orange-300 transition group">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-orange-800 text-sm">Claude Code</span>
                <i class="fas fa-external-link-alt text-orange-400 text-xs opacity-0 group-hover:opacity-100"></i>
              </div>
              <p class="text-xs text-orange-600">VS Code 沉浸式编程</p>
            </a>
            <a href="#" @click.prevent="openGitea" class="block p-3 rounded-lg bg-green-50 border border-green-100 hover:border-green-300 transition group">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-green-800 text-sm">校内代码仓</span>
                <i class="fas fa-code-branch text-green-400 text-xs opacity-0 group-hover:opacity-100"></i>
              </div>
              <p class="text-xs text-green-600">提交代码作业</p>
            </a>
            <a href="https://mediapipe-studio.web.app/" target="_blank" class="block p-3 rounded-lg bg-blue-50 border border-blue-100 hover:border-blue-300 transition group">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-blue-800 text-sm">MediaPipe Studio</span>
                <i class="fas fa-eye text-blue-400 text-xs opacity-0 group-hover:opacity-100"></i>
              </div>
              <p class="text-xs text-blue-600">算法可视化调试</p>
            </a>
          </div>
        </div>
      </div>
    </div>

    <div v-show="mode === 'guide'" class="flex-1 overflow-y-auto bg-white">
      <div class="max-w-4xl mx-auto py-12 px-8">
        <div class="markdown-body prose prose-indigo max-w-none" v-html="guideHtml"></div>
      </div>
    </div>

    <div
      class="toast fixed bottom-8 right-8 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl transform transition duration-300 flex items-center gap-3 z-50"
      :class="toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'"
    >
      <i class="fas fa-check-circle text-green-400"></i>
      <span>{{ toastMessage }}</span>
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
const guideHtml = ref('<div class="flex items-center justify-center h-64 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i> 正在加载完整讲义...</div>');
const guideLoaded = ref(false);

const homeworkDone = ref(false);
const homeworkName = ref('');
const homeworkUploading = ref(false);
const hwInput = ref(null);

const toastVisible = ref(false);
const toastMessage = ref('已复制到剪贴板');
const mainScroll = ref(null);

const guideFiles = {
  project1: '/api/v1/download/project1/项目1-VibeCoding.md',
  project2: '/api/v1/download/project2/项目2-产品经理与项目经理.md',
  project3: '/api/v1/download/project3/项目3-全栈工程师.md',
  project4: '/api/v1/download/project4/项目4-算法工程师.md',
  project5: '/api/v1/download/project5/项目5-嵌入式工程师.md'
};

const lessonPhases = computed(() => lessonData.value?.phases || []);
const currentPhase = computed(() => lessonPhases.value[currentStep.value]?.student || null);
const currentPhaseName = computed(() => lessonPhases.value[currentStep.value]?.title || '');
const lessonTitle = computed(() => lessonData.value?.title || 'Loading...');
const hasNext = computed(() => currentStep.value < lessonPhases.value.length - 1);
const showBriefing = computed(() => lessonId.value === 'lesson1' && currentStep.value === 0);

const nextButtonLabel = computed(() => {
  if (!lessonPhases.value.length) return '下一步 <i class="fas fa-arrow-right ml-2"></i>';
  if (currentStep.value === lessonPhases.value.length - 1) {
    const currentNum = parseInt(String(lessonId.value).replace('lesson', ''), 10) || 1;
    if (currentNum < 4) return `下一课 <i class="fas fa-forward ml-2"></i>`;
    return '课程完成 <i class="fas fa-check ml-2"></i>';
  }
  return '下一步 <i class="fas fa-arrow-right ml-2"></i>';
});

const nextButtonClass = computed(() => {
  if (currentStep.value === lessonPhases.value.length - 1) {
    const currentNum = parseInt(String(lessonId.value).replace('lesson', ''), 10) || 1;
    if (currentNum < 4) return 'bg-green-600 text-white hover:bg-green-700';
    return 'bg-indigo-600 text-white opacity-50 cursor-not-allowed';
  }
  return 'bg-indigo-600 text-white hover:bg-indigo-700';
});

const nextDisabled = computed(() => {
  if (!lessonPhases.value.length) return true;
  if (currentStep.value === lessonPhases.value.length - 1) {
    const currentNum = parseInt(String(lessonId.value).replace('lesson', ''), 10) || 1;
    return currentNum >= 4;
  }
  return false;
});

function modeButtonClass(target) {
  if (mode.value === target) {
    return 'px-4 py-1.5 rounded-md text-sm font-bold shadow-sm bg-white text-indigo-600 transition';
  }
  return 'px-4 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 transition';
}

function setMode(nextMode) {
  mode.value = nextMode;
  if (nextMode === 'guide') {
    loadGuidebook();
  }
}

function loadStep(index) {
  currentStep.value = index;
  nextTick(() => {
    if (mainScroll.value) mainScroll.value.scrollTop = 0;
  });
}

function prevStep() {
  if (currentStep.value > 0) {
    loadStep(currentStep.value - 1);
  }
}

function nextStep() {
  if (!lessonPhases.value.length) return;
  if (currentStep.value === lessonPhases.value.length - 1) {
    const currentNum = parseInt(String(lessonId.value).replace('lesson', ''), 10) || 1;
    if (currentNum < 4) {
      window.location.href = `/study?project=${projectId.value}&lesson=lesson${currentNum + 1}`;
    }
    return;
  }
  loadStep(currentStep.value + 1);
}

async function loadLesson() {
  lessonError.value = '';
  try {
    const res = await apiFetch(`/download/${projectId.value}/lessons/${lessonId.value}.json`);
    if (!res.ok) throw new Error('无法加载课程数据，请确认项目与课时参数。');
    lessonData.value = await res.json();
    currentStep.value = 0;
  } catch (err) {
    lessonData.value = null;
    lessonError.value = err.message || '无法加载课程数据。';
  }
}

async function loadGuidebook() {
  if (guideLoaded.value) return;
  const url = guideFiles[projectId.value];
  if (!url) {
    guideHtml.value = '<div class="text-red-500 text-center">暂无完整讲义</div>';
    return;
  }
  try {
    const res = await fetch(url);
    const text = await res.text();
    const marked = window.marked;
    guideHtml.value = marked ? marked.parse(text) : `<pre>${text}</pre>`;
    guideLoaded.value = true;
  } catch (err) {
    guideHtml.value = '<div class="text-red-500 text-center">加载讲义失败: 文件不存在</div>';
  }
}

async function loadResources() {
  loadingResources.value = true;
  try {
    const res = await apiFetch(`/files/${projectId.value}`);
    const data = await res.json();
    resources.value = data.files || [];
  } catch (err) {
    resources.value = [];
  } finally {
    loadingResources.value = false;
  }
}

function resourceLink(file) {
  if (file.isDirectory) {
    const path = encodeURIComponent(file.path);
    return `/downloads?project=${projectId.value}&path=${path}#files`;
  }
  return `/api/v1/download/${projectId.value}/${encodeURIComponent(file.path)}`;
}

function resourceIcon(file) {
  if (file.isDirectory) return 'fas fa-folder text-yellow-400';
  return getFileIcon(file.name);
}

function getFileIcon(filename) {
  const ext = String(filename || '').split('.').pop().toLowerCase();
  const icons = {
    pdf: 'fas fa-file-pdf text-red-500',
    doc: 'fas fa-file-word text-blue-500',
    docx: 'fas fa-file-word text-blue-500',
    ppt: 'fas fa-file-powerpoint text-orange-500',
    pptx: 'fas fa-file-powerpoint text-orange-500',
    zip: 'fas fa-file-archive text-yellow-500',
    rar: 'fas fa-file-archive text-yellow-500',
    py: 'fab fa-python text-blue-600',
    js: 'fab fa-js text-yellow-400',
    html: 'fab fa-html5 text-orange-600',
    png: 'fas fa-image text-purple-500',
    jpg: 'fas fa-image text-purple-500',
    jpeg: 'fas fa-image text-purple-500'
  };
  return icons[ext] || 'fas fa-file text-gray-400';
}

function formatBytes(bytes) {
  if (!+bytes) return '0B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
}

function showToast(message) {
  toastMessage.value = message;
  toastVisible.value = true;
  setTimeout(() => {
    toastVisible.value = false;
  }, 2000);
}

async function copyPrompt(text) {
  try {
    await navigator.clipboard.writeText(text || '');
    showToast('已复制到剪贴板');
  } catch (err) {
    showToast('复制失败');
  }
}

function openGitea() {
  window.open(`http://${window.location.hostname}:3000`, '_blank');
}

function triggerHomework() {
  if (homeworkUploading.value) return;
  hwInput.value?.click();
}

async function handleHomeworkUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const user = getCurrentUser();
  let studentName = user?.name || '';
  if (!user) {
    studentName = window.prompt('请输入你的姓名以提交作业：') || '';
    if (!studentName) {
      event.target.value = '';
      return;
    }
  }
  homeworkUploading.value = true;
  try {
    const pid = parseInt(String(projectId.value).replace('project', ''), 10) || 1;
    const formData = new FormData();
    formData.append('type', 'showcase');
    formData.append('title', `[${lessonTitle.value}] 作业`);
    formData.append('content', `Lesson: ${lessonId.value}`);
    formData.append('details', JSON.stringify({
      lessonId: lessonId.value,
      lessonTitle: lessonTitle.value,
      studentName,
      showcaseSummary: `课程作业 - ${lessonTitle.value}`
    }));
    if (!user) {
      formData.append('studentName', studentName);
    }
    formData.append('file', file);

    const res = await apiFetch(`/projects/${pid}/submissions`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '上传失败');
    }
    const key = `hw_${projectId.value}_${lessonId.value}`;
    window.localStorage.setItem(key, 'true');
    window.localStorage.setItem(`${key}_name`, file.name);
    homeworkDone.value = true;
    homeworkName.value = file.name;
    showToast(`作业已提交: ${file.name}`);
  } catch (err) {
    window.alert(`提交失败: ${err.message || '上传失败'}`);
  } finally {
    homeworkUploading.value = false;
    event.target.value = '';
  }
}

function loadHomeworkStatus() {
  const key = `hw_${projectId.value}_${lessonId.value}`;
  const isDone = window.localStorage.getItem(key) === 'true';
  homeworkDone.value = isDone;
  homeworkName.value = isDone ? window.localStorage.getItem(`${key}_name`) || '' : '';
}

onMounted(async () => {
  await loadLesson();
  await loadResources();
  loadHomeworkStatus();
});

watch([projectId, lessonId], async () => {
  guideLoaded.value = false;
  guideHtml.value = '<div class="flex items-center justify-center h-64 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i> 正在加载完整讲义...</div>';
  await loadLesson();
  await loadResources();
  loadHomeworkStatus();
});
</script>

<style scoped>
.markdown-body p {
  margin-bottom: 1rem;
  line-height: 1.6;
  color: #374151;
}
.markdown-body strong {
  color: #111827;
  font-weight: 700;
}
.prompt-card {
  background: linear-gradient(to right, #ffffff, #f9fafb);
  border-left: 4px solid #6366f1;
  transition: all 0.2s;
}
.prompt-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateX(4px);
}
.task-checkbox:checked + span {
  text-decoration: line-through;
  color: #9ca3af;
}
</style>

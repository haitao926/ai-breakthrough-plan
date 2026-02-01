<template>
  <div class="downloads-page text-gray-800">
    <!-- 导航栏 -->
    <nav class="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/50 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <div class="flex items-center gap-3 shrink-0">
            <RouterLink to="/" class="flex items-center gap-2 group">
              <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md group-hover:bg-indigo-700 transition">AI</div>
              <span class="font-bold text-xl tracking-tight text-gray-900 group-hover:text-indigo-600 transition">破壁计划</span>
            </RouterLink>
          </div>

          <div class="hidden md:flex items-center space-x-1">
            <RouterLink to="/knowledge" class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center">
              <i class="fas fa-book-reader mr-2 text-xs"></i>创新知识库
            </RouterLink>
            <RouterLink to="/competencies" class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center">
              <i class="fas fa-graduation-cap mr-2 text-xs"></i>学术指导
            </RouterLink>
            <RouterLink to="/projects" class="px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center">
              <i class="fas fa-layer-group mr-2 text-xs"></i>项目库
            </RouterLink>
            <RouterLink to="/downloads" class="px-3 py-2 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700 transition-all flex items-center">
              <i class="fas fa-folder-open mr-2 text-xs"></i>课程资料库
            </RouterLink>
          </div>

          <div class="flex gap-3 items-center shrink-0">
            <RouterLink to="/workspace" class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:-translate-y-0.5">
              <i class="fas fa-rocket mr-2"></i> 进入工作台
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Header -->
    <header class="pt-32 pb-12 bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">课程资源库</h1>
        <p class="text-lg text-gray-500 max-w-3xl">
          这里是你的数字图书馆。选择一门课程，进入学习页面，并下载相关的讲义、代码包、数据集和参考文档。
        </p>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <!-- View 1: Course Gallery -->
      <div v-show="view === 'gallery'" id="view-gallery" class="space-y-12">
        <section>
          <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span class="w-2 h-6 bg-indigo-600 rounded-full mr-3"></span>
            通识与基础
          </h2>
          <div class="grid md:grid-cols-3 gap-6">
            <div class="course-card bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group" @click="openCourse('common')">
              <div class="h-32 bg-gray-100 relative">
                <div class="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 opacity-90"></div>
                <i class="fas fa-graduation-cap absolute -bottom-4 -right-4 text-8xl text-white opacity-10 transform rotate-12 group-hover:rotate-0 transition duration-500"></i>
                <div class="absolute bottom-4 left-6 text-white">
                  <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded backdrop-blur">必修 00</span>
                  <h3 class="text-xl font-bold mt-1">通识与学术方法论</h3>
                </div>
              </div>
              <div class="p-6">
                <p class="text-sm text-gray-500 mb-4 h-10 overflow-hidden">学术写作规范、研究方法、创新思维工具包及通用项目模板。</p>
                <div class="flex items-center justify-between text-xs text-indigo-600 font-bold border-t border-gray-100 pt-4">
                  <span><i class="fas fa-folder mr-1"></i> 进入课程</span>
                  <i class="fas fa-arrow-right group-hover:translate-x-1 transition"></i>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span class="w-2 h-6 bg-indigo-600 rounded-full mr-3"></span>
            专项技能课程
          </h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="course-card bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group" @click="openCourse('project1')">
              <div class="h-32 bg-blue-600 relative">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-500 opacity-90"></div>
                <i class="fas fa-gamepad absolute -bottom-4 -right-4 text-8xl text-white opacity-10 transform rotate-12 group-hover:rotate-0 transition duration-500"></i>
                <div class="absolute bottom-4 left-6 text-white">
                  <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded backdrop-blur">项目 01</span>
                  <h3 class="text-xl font-bold mt-1">Vibe Coding</h3>
                </div>
              </div>
              <div class="p-6">
                <p class="text-sm text-gray-500 mb-4 h-10 overflow-hidden">体感交互游戏开发。包含 Python 源码、OpenCV 库及素材包。</p>
                <div class="flex items-center justify-between text-xs text-blue-600 font-bold border-t border-gray-100 pt-4">
                  <span><i class="fas fa-folder mr-1"></i> 进入课程</span>
                  <i class="fas fa-arrow-right group-hover:translate-x-1 transition"></i>
                </div>
              </div>
            </div>

            <div class="course-card bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group" @click="openCourse('project2')">
              <div class="h-32 bg-purple-600 relative">
                <div class="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-500 opacity-90"></div>
                <i class="fas fa-tasks absolute -bottom-4 -right-4 text-8xl text-white opacity-10 transform rotate-12 group-hover:rotate-0 transition duration-500"></i>
                <div class="absolute bottom-4 left-6 text-white">
                  <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded backdrop-blur">项目 02</span>
                  <h3 class="text-xl font-bold mt-1">产品思维</h3>
                </div>
              </div>
              <div class="p-6">
                <p class="text-sm text-gray-500 mb-4 h-10 overflow-hidden">用户调研与原型设计。包含 Figma 组件库、PRD 模板。</p>
                <div class="flex items-center justify-between text-xs text-purple-600 font-bold border-t border-gray-100 pt-4">
                  <span><i class="fas fa-folder mr-1"></i> 进入课程</span>
                  <i class="fas fa-arrow-right group-hover:translate-x-1 transition"></i>
                </div>
              </div>
            </div>

            <div class="course-card bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group" @click="openCourse('project3')">
              <div class="h-32 bg-green-600 relative">
                <div class="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-500 opacity-90"></div>
                <i class="fas fa-server absolute -bottom-4 -right-4 text-8xl text-white opacity-10 transform rotate-12 group-hover:rotate-0 transition duration-500"></i>
                <div class="absolute bottom-4 left-6 text-white">
                  <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded backdrop-blur">项目 03</span>
                  <h3 class="text-xl font-bold mt-1">全栈开发</h3>
                </div>
              </div>
              <div class="p-6">
                <p class="text-sm text-gray-500 mb-4 h-10 overflow-hidden">Web 应用开发。包含 React 模版、Node.js 后端示例代码。</p>
                <div class="flex items-center justify-between text-xs text-green-600 font-bold border-t border-gray-100 pt-4">
                  <span><i class="fas fa-folder mr-1"></i> 进入课程</span>
                  <i class="fas fa-arrow-right group-hover:translate-x-1 transition"></i>
                </div>
              </div>
            </div>

            <div class="course-card bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group" @click="openCourse('project4')">
              <div class="h-32 bg-red-600 relative">
                <div class="absolute inset-0 bg-gradient-to-br from-red-600 to-orange-500 opacity-90"></div>
                <i class="fas fa-brain absolute -bottom-4 -right-4 text-8xl text-white opacity-10 transform rotate-12 group-hover:rotate-0 transition duration-500"></i>
                <div class="absolute bottom-4 left-6 text-white">
                  <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded backdrop-blur">项目 04</span>
                  <h3 class="text-xl font-bold mt-1">AI 算法</h3>
                </div>
              </div>
              <div class="p-6">
                <p class="text-sm text-gray-500 mb-4 h-10 overflow-hidden">机器学习与模型训练。包含 PyTorch 笔记本、训练数据集。</p>
                <div class="flex items-center justify-between text-xs text-red-600 font-bold border-t border-gray-100 pt-4">
                  <span><i class="fas fa-folder mr-1"></i> 进入课程</span>
                  <i class="fas fa-arrow-right group-hover:translate-x-1 transition"></i>
                </div>
              </div>
            </div>

            <div class="course-card bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group" @click="openCourse('project5')">
              <div class="h-32 bg-yellow-500 relative">
                <div class="absolute inset-0 bg-gradient-to-br from-yellow-500 to-amber-400 opacity-90"></div>
                <i class="fas fa-microchip absolute -bottom-4 -right-4 text-8xl text-white opacity-10 transform rotate-12 group-hover:rotate-0 transition duration-500"></i>
                <div class="absolute bottom-4 left-6 text-white">
                  <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded backdrop-blur">项目 05</span>
                  <h3 class="text-xl font-bold mt-1">智能硬件</h3>
                </div>
              </div>
              <div class="p-6">
                <p class="text-sm text-gray-500 mb-4 h-10 overflow-hidden">嵌入式与物联网。包含 Arduino/树莓派驱动、电路图纸。</p>
                <div class="flex items-center justify-between text-xs text-yellow-600 font-bold border-t border-gray-100 pt-4">
                  <span><i class="fas fa-folder mr-1"></i> 进入课程</span>
                  <i class="fas fa-arrow-right group-hover:translate-x-1 transition"></i>
                </div>
              </div>
            </div>

            <div class="course-card bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer group" @click="openCourse('project6')">
              <div class="h-32 bg-indigo-900 relative">
                <div class="absolute inset-0 bg-gradient-to-br from-indigo-900 to-blue-900 opacity-90"></div>
                <i class="fas fa-flag-checkered absolute -bottom-4 -right-4 text-8xl text-white opacity-10 transform rotate-12 group-hover:rotate-0 transition duration-500"></i>
                <div class="absolute bottom-4 left-6 text-white">
                  <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded backdrop-blur">Final</span>
                  <h3 class="text-xl font-bold mt-1">综合创业实战</h3>
                </div>
              </div>
              <div class="p-6">
                <p class="text-sm text-gray-500 mb-4 h-10 overflow-hidden">孵化真实产品。包含路演 PPT 模板、商业计划书范例。</p>
                <div class="flex items-center justify-between text-xs text-indigo-400 font-bold border-t border-gray-100 pt-4">
                  <span><i class="fas fa-folder mr-1"></i> 进入课程</span>
                  <i class="fas fa-arrow-right group-hover:translate-x-1 transition"></i>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- View 2: File Browser (Hidden by default) -->
      <div v-show="view === 'files'" id="view-files">
        <div class="flex items-center justify-between mb-6">
          <button @click="showGallery" class="flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition">
            <i class="fas fa-arrow-left mr-2"></i> 返回课程列表
          </button>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{{ projectNames[currentProject] || 'Course Name' }}</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[500px]">
          <div class="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div class="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg flex-1">
              <span class="cursor-pointer hover:text-indigo-600 font-bold" @click="loadFiles(currentProject, '')">
                <i class="fas fa-home"></i> 根目录
              </span>
              <template v-for="(part, idx) in breadcrumbParts" :key="part">
                <span class="text-gray-300">/</span>
                <span
                  v-if="idx < breadcrumbParts.length - 1"
                  class="cursor-pointer hover:text-indigo-600 transition"
                  @click="loadFiles(currentProject, breadcrumbPaths[idx])"
                >{{ part }}</span>
                <span v-else class="text-gray-800 font-medium truncate">{{ part }}</span>
              </template>
            </div>
            <div class="relative w-full md:w-64">
              <input v-model="searchTerm" type="text" placeholder="在此课程中搜索..."
                     class="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition text-sm">
              <i class="fas fa-search absolute left-3 top-2.5 text-gray-400"></i>
            </div>
          </div>

          <div v-if="loading" class="text-center py-20 text-gray-400">
            <i class="fas fa-spinner fa-spin text-3xl mb-3"></i>
            <p>加载中...</p>
          </div>
          <div v-else-if="filteredFiles.length === 0" class="text-center py-20 text-gray-400">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <i class="fas fa-folder-open text-2xl"></i>
            </div>
            <p>暂无文件</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="file in filteredFiles"
              :key="file.path"
              class="file-card p-4 rounded-xl border border-gray-100 flex items-center gap-3 cursor-pointer"
              :class="file.isDirectory ? 'bg-yellow-50/50 border-yellow-100' : 'bg-white'"
              @click="openFile(file)"
            >
              <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-xl" :class="file.isDirectory ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100'">
                <i class="fas" :class="fileIcon(file)"></i>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-gray-800 text-sm truncate" :title="file.name">{{ file.name }}</h4>
                <p class="text-xs text-gray-400 mt-0.5">{{ file.isDirectory ? '文件夹' : formatBytes(file.size) }}</p>
              </div>
              <i v-if="!file.isDirectory" class="fas fa-download text-gray-300 hover:text-indigo-500"></i>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="bg-white border-t border-gray-200 py-12 mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
        <p>© 2025 HAI Tech Lab | 资源与工具库</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiFetch } from '@/api/client';

const route = useRoute();
const router = useRouter();

const view = ref('gallery');
const currentProject = ref('');
const currentPath = ref('');
const allFiles = ref([]);
const loading = ref(false);
const searchTerm = ref('');

const projectNames = {
  common: '通识与学术方法论',
  project1: 'Vibe Coding',
  project2: '产品思维',
  project3: '全栈开发',
  project4: 'AI 算法',
  project5: '智能硬件',
  project6: '综合创业实战'
};

const fileIcons = {
  pdf: 'fa-file-pdf text-red-500',
  doc: 'fa-file-word text-blue-500',
  docx: 'fa-file-word text-blue-500',
  ppt: 'fa-file-powerpoint text-orange-500',
  pptx: 'fa-file-powerpoint text-orange-500',
  xls: 'fa-file-excel text-green-500',
  xlsx: 'fa-file-excel text-green-500',
  zip: 'fa-file-archive text-yellow-500',
  rar: 'fa-file-archive text-yellow-500',
  '7z': 'fa-file-archive text-yellow-500',
  png: 'fa-file-image text-purple-500',
  jpg: 'fa-file-image text-purple-500',
  jpeg: 'fa-file-image text-purple-500',
  py: 'fa-file-code text-yellow-600',
  js: 'fa-file-code text-yellow-400',
  html: 'fa-file-code text-orange-600',
  css: 'fa-file-code text-blue-400',
  folder: 'fa-folder text-yellow-400'
};

const breadcrumbParts = computed(() => currentPath.value.split('/').filter(Boolean));
const breadcrumbPaths = computed(() => {
  const parts = breadcrumbParts.value;
  const paths = [];
  parts.reduce((acc, part) => {
    const next = acc ? `${acc}/${part}` : part;
    paths.push(next);
    return next;
  }, '');
  return paths;
});

const filteredFiles = computed(() => {
  if (!searchTerm.value) return allFiles.value;
  const keyword = searchTerm.value.toLowerCase();
  return allFiles.value.filter(file => file.name.toLowerCase().includes(keyword));
});

function showGallery() {
  view.value = 'gallery';
  router.replace({ path: '/downloads' });
}

function openCourse(projectId) {
  router.push({ path: '/study', query: { project: projectId, lesson: 'lesson1' } });
}

async function loadFiles(project, path) {
  if (!project) return;
  view.value = 'files';
  currentProject.value = project;
  currentPath.value = path || '';
  loading.value = true;
  try {
    const safePath = encodeURIComponent(currentPath.value);
    const res = await apiFetch(`/files/${project}?path=${safePath}`);
    const data = await res.json();
    allFiles.value = data.files || [];
  } catch (err) {
    console.error(err);
    allFiles.value = [];
  } finally {
    loading.value = false;
  }
}

function openFile(file) {
  if (file.isDirectory) {
    loadFiles(currentProject.value, file.path);
    return;
  }
  const url = `/api/v1/download/${currentProject.value}/${encodeURIComponent(file.path)}`;
  window.open(url, '_blank');
}

function fileIcon(file) {
  if (file.isDirectory) return fileIcons.folder;
  const ext = file.name.split('.').pop().toLowerCase();
  return fileIcons[ext] || 'fa-file text-gray-400';
}

function formatBytes(bytes) {
  if (!+bytes) return '0B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
}

onMounted(() => {
  if (route.query.project) {
    const path = route.query.path ? decodeURIComponent(route.query.path) : '';
    loadFiles(String(route.query.project), path);
  }
});

watch(
  () => route.query,
  (query) => {
    if (query.project) {
      const path = query.path ? decodeURIComponent(query.path) : '';
      loadFiles(String(query.project), path);
    }
  }
);
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
body { font-family: 'Inter', sans-serif; background: #f8fafc; }
.course-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.course-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
.file-card { transition: all 0.2s ease; }
.file-card:hover { border-color: #6366f1; background-color: #f8fafc; }
</style>

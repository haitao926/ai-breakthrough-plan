<template>
  <div class="min-h-screen flex flex-col bg-[#f8fafc] text-gray-800">
    <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <div class="flex items-center gap-3">
        <h1 class="font-bold text-gray-800 text-lg flex items-center">
          <i class="fas fa-book text-indigo-600 mr-2"></i> 文献阅读
        </h1>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs" :class="saved ? 'text-green-500' : 'text-gray-400'">{{ saveStatus }}</span>
      </div>
    </nav>

    <main class="flex-1 max-w-5xl mx-auto w-full p-8">
      <div class="mb-8 text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">先读文献，再定方向</h2>
        <p class="text-gray-500 text-sm">整理已有研究与关键结论，为项目立项提供证据。</p>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
            <i class="fas fa-bullseye mr-2 text-lg"></i> 研究主题 / 问题
          </label>
          <input v-model="form.topic" class="w-full text-base outline-none text-gray-700 bg-transparent placeholder-gray-300" placeholder="你要解决的问题是什么？">
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
            <i class="fas fa-search mr-2 text-lg"></i> 检索关键词
          </label>
          <textarea v-model="form.keywords" class="w-full h-24 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300" placeholder="关键词 1、关键词 2、关键词 3..."></textarea>
        </div>
      </div>

      <div class="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-bold text-gray-900">文献清单</h3>
            <p class="text-xs text-gray-400 mt-1">记录阅读过的核心论文与关键结论。</p>
          </div>
          <button type="button" @click="addPaper" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition">
            <i class="fas fa-plus mr-1"></i> 添加文献
          </button>
        </div>
        <div class="space-y-4">
          <div v-if="!form.papers.length" class="text-sm text-gray-400">还没有文献，点击“添加文献”。</div>
          <div v-for="(paper, idx) in form.papers" :key="idx" class="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <div class="flex items-center justify-between mb-3">
              <div class="text-sm font-bold text-gray-700">文献 {{ idx + 1 }}</div>
              <button type="button" @click="removePaper(idx)" class="text-xs text-gray-400 hover:text-red-500">
                <i class="fas fa-trash-alt mr-1"></i>移除
              </button>
            </div>
            <div class="grid md:grid-cols-2 gap-3">
              <input v-model="paper.title" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="论文标题">
              <input v-model="paper.authors" class="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="作者 / 年份">
            </div>
            <input v-model="paper.link" class="w-full mt-3 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="链接 / DOI">
            <textarea v-model="paper.takeaway" class="w-full mt-3 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows="3" placeholder="核心结论 / 可借鉴点"></textarea>
          </div>
        </div>
      </div>

      <div class="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group">
        <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
          <i class="fas fa-lightbulb mr-2 text-lg"></i> 阅读笔记 / 关键启发
        </label>
        <textarea v-model="form.notes" class="w-full h-32 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300" placeholder="总结最重要的发现：已有研究做了什么、你还可以补充什么？"></textarea>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const projectId = computed(() => route.query.project);
const dataKey = computed(() => projectId.value ? `ai_course_literature_${projectId.value}` : 'ai_course_literature');

const form = reactive({
  topic: '',
  keywords: '',
  notes: '',
  papers: []
});

const saveStatus = ref('自动保存中...');
const saved = ref(false);
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

function touchSaved() {
  saved.value = true;
  saveStatus.value = '已保存';
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    saved.value = false;
    saveStatus.value = '自动保存中...';
  }, 1000);
}

function saveData() {
  if (!ready) return;
  localStorage.setItem(dataKey.value, JSON.stringify({ ...form }));
  touchSaved();
}

function addPaper() {
  form.papers.push({ title: '', authors: '', link: '', takeaway: '' });
}

function removePaper(idx) {
  form.papers.splice(idx, 1);
}

watch(form, saveData, { deep: true });

onMounted(() => {
  loadData();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
body { font-family: 'Inter', sans-serif; background: #f8fafc; }
.input-group:focus-within label { color: #4f46e5; }
.input-group:focus-within i { color: #4f46e5; }
</style>

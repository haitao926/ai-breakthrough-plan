<template>
  <div class="min-h-screen flex flex-col bg-[#f8fafc] text-gray-800">
    <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shrink-0 z-50">
      <div class="flex items-center gap-3">
        <h1 class="font-bold text-gray-800 text-lg flex items-center">
          <i class="fas fa-search text-indigo-600 mr-2"></i> 前期调研
        </h1>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs" :class="saved ? 'text-green-500' : 'text-gray-400'">{{ saveStatus }}</span>
      </div>
    </nav>

    <main class="flex-1 max-w-5xl mx-auto w-full p-8">
      <div class="mb-8 text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">先验证，再动手</h2>
        <p class="text-gray-500 text-sm">记录调研对象、方法与关键发现，为立项提供真实依据。</p>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
            <i class="fas fa-question-circle mr-2 text-lg"></i> 核心问题
          </label>
          <textarea v-model="form.question" class="w-full h-24 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300" placeholder="你想验证的假设或问题是什么？"></textarea>
        </div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
            <i class="fas fa-users mr-2 text-lg"></i> 目标对象
          </label>
          <textarea v-model="form.targets" class="w-full h-24 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300" placeholder="调研谁？（年级、身份、场景等）"></textarea>
        </div>
      </div>

      <div class="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <label class="block text-xs font-bold text-gray-500 uppercase mb-4 flex items-center">
          <i class="fas fa-clipboard-list mr-2 text-lg"></i> 调研方法
        </label>
        <div class="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <label class="flex items-center gap-2"><input v-model="form.methods" value="interview" type="checkbox" class="rounded text-indigo-600"> 访谈</label>
          <label class="flex items-center gap-2"><input v-model="form.methods" value="survey" type="checkbox" class="rounded text-indigo-600"> 问卷</label>
          <label class="flex items-center gap-2"><input v-model="form.methods" value="observation" type="checkbox" class="rounded text-indigo-600"> 观察</label>
          <label class="flex items-center gap-2"><input v-model="form.methods" value="data" type="checkbox" class="rounded text-indigo-600"> 数据分析</label>
        </div>
      </div>

      <div class="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group">
        <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
          <i class="fas fa-route mr-2 text-lg"></i> 调研计划
        </label>
        <textarea v-model="form.plan" class="w-full h-24 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300" placeholder="计划何时、如何开展调研？需要谁参与？"></textarea>
      </div>

      <div class="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group">
        <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
          <i class="fas fa-pen-nib mr-2 text-lg"></i> 调研问题清单
        </label>
        <textarea v-model="form.questions" class="w-full h-28 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300" placeholder="列出访谈/问卷问题，至少 5 条。"></textarea>
      </div>

      <div class="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group">
        <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
          <i class="fas fa-chart-line mr-2 text-lg"></i> 关键发现
        </label>
        <textarea v-model="form.findings" class="w-full h-28 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300" placeholder="整理最重要的现象、证据和痛点。"></textarea>
      </div>

      <div class="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group">
        <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
          <i class="fas fa-flag-checkered mr-2 text-lg"></i> 结论与下一步
        </label>
        <textarea v-model="form.nextSteps" class="w-full h-24 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300" placeholder="调研结论是什么？下一步准备如何调整项目方向？"></textarea>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
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

const saveStatus = ref('自动保存中...');
const saved = ref(false);
let statusTimer = null;
let ready = false;

function loadData() {
  const savedData = JSON.parse(localStorage.getItem(dataKey.value) || '{}');
  form.question = savedData.question || '';
  form.targets = savedData.targets || '';
  form.methods = Array.isArray(savedData.methods) ? savedData.methods : [];
  form.plan = savedData.plan || '';
  form.questions = savedData.questions || '';
  form.findings = savedData.findings || '';
  form.nextSteps = savedData.nextSteps || '';
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

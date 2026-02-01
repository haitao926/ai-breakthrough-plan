<template>
  <div class="min-h-screen flex flex-col bg-[#f8fafc] text-gray-800">
    <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <div class="flex items-center gap-3">
        <RouterLink to="/tools" class="text-gray-400 hover:text-gray-600 transition"><i class="fas fa-arrow-left"></i></RouterLink>
        <h1 class="font-bold text-gray-800 text-lg flex items-center">
          <i class="fas fa-lightbulb text-indigo-600 mr-2"></i> 创新点梳理
        </h1>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs" :class="saved ? 'text-green-500' : 'text-gray-400'">{{ saveStatus }}</span>
      </div>
    </nav>

    <main class="flex-1 max-w-4xl mx-auto w-full p-8">
      <div class="mb-8 text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-2">写清楚“你的不同”</h2>
        <p class="text-gray-500 text-sm">把创新点说清楚，写具体、可验证。</p>
      </div>

      <div class="space-y-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
            <i class="fas fa-star mr-2 text-lg"></i> 创新点一句话
          </label>
          <textarea v-model="form.summary" class="w-full h-24 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300" placeholder="用一句话描述创新点（是什么 + 为什么重要）"></textarea>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
            <i class="fas fa-exchange-alt mr-2 text-lg"></i> 对比现有方案
          </label>
          <textarea v-model="form.comparison" class="w-full h-24 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300" placeholder="当前已有方案是什么？你的差异是什么？"></textarea>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
            <i class="fas fa-vial mr-2 text-lg"></i> 创新验证方式
          </label>
          <textarea v-model="form.proof" class="w-full h-24 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300" placeholder="你打算如何证明创新有效？（实验/数据/用户反馈/对比测试）"></textarea>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
            <i class="fas fa-flag-checkered mr-2 text-lg"></i> 风险与边界（可选）
          </label>
          <textarea v-model="form.risk" class="w-full h-20 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300" placeholder="有哪些风险或限制？"></textarea>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const projectId = computed(() => route.query.project);
const dataKey = computed(() => projectId.value ? `ai_course_innovation_${projectId.value}` : 'ai_course_innovation');

const form = reactive({
  summary: '',
  comparison: '',
  proof: '',
  risk: ''
});

const saveStatus = ref('自动保存中...');
const saved = ref(false);
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

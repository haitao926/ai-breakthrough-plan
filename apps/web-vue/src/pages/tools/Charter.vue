<template>
  <div class="min-h-screen flex flex-col bg-[#f8fafc] text-gray-800">
    <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
      <div class="flex items-center gap-3">
        <h1 class="font-bold text-gray-800 text-lg flex items-center">
          <i class="fas fa-file-signature text-purple-600 mr-2"></i> 项目立项书
        </h1>
        <RouterLink to="/competencies" target="_blank" class="ml-2 text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full border border-indigo-100 hover:bg-indigo-100 transition">
          <i class="fas fa-question-circle mr-1"></i> 类型指南
        </RouterLink>
      </div>

      <div class="flex bg-gray-100 p-1 rounded-lg">
        <button class="mode-btn px-3 py-1 text-xs rounded-md text-gray-500 border border-transparent transition" :class="{ active: mode === 'product' }" @click="setMode('product')">工程产品</button>
        <button class="mode-btn px-3 py-1 text-xs rounded-md text-gray-500 border border-transparent transition" :class="{ active: mode === 'research' }" @click="setMode('research')">课题探究</button>
        <button class="mode-btn px-3 py-1 text-xs rounded-md text-gray-500 border border-transparent transition" :class="{ active: mode === 'impact' }" @click="setMode('impact')">社会公益</button>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs" :class="saved ? 'text-green-500' : 'text-gray-400'">{{ saveStatus }}</span>
        <button @click="exportPDF" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm transition">
          <i class="fas fa-file-pdf mr-1"></i> 导出 PDF
        </button>
      </div>
    </nav>

    <main class="flex-1 max-w-5xl mx-auto w-full p-8">
      <div class="mb-8 text-center">
        <input v-model="form.projName" type="text" class="text-4xl font-extrabold text-center bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-purple-500 outline-none w-full py-2 transition placeholder-gray-300" placeholder="在此输入项目名称...">
        <p class="text-gray-400 mt-2 text-sm">定义你的愿景，明确你的方向</p>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group hover:shadow-md transition duration-300">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center transition-colors">
            <i :class="labels.q1.icon" class="mr-2 text-lg"></i> {{ labels.q1.text }}
          </label>
          <textarea v-model="form.projPersona" class="w-full h-32 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300 leading-relaxed" :placeholder="placeholders.q1"></textarea>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group hover:shadow-md transition duration-300">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center transition-colors">
            <i :class="labels.q2.icon" class="mr-2 text-lg"></i> {{ labels.q2.text }}
          </label>
          <textarea v-model="form.projPain" class="w-full h-32 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300 leading-relaxed" :placeholder="placeholders.q2"></textarea>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 input-group hover:shadow-md transition duration-300">
          <label class="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center transition-colors">
            <i :class="labels.q3.icon" class="mr-2 text-lg"></i> {{ labels.q3.text }}
          </label>
          <textarea v-model="form.projSolution" class="w-full h-32 text-base resize-none outline-none text-gray-700 bg-transparent placeholder-gray-300 leading-relaxed" :placeholder="placeholders.q3"></textarea>
        </div>

        <div class="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
          <label class="block text-xs font-bold text-purple-200 uppercase mb-3 flex items-center">
            <i :class="labels.q4.icon" class="mr-2 text-lg"></i> {{ labels.q4.text }}
          </label>
          <textarea v-model="form.projValue" class="w-full h-32 text-lg font-medium resize-none outline-none text-white bg-transparent placeholder-purple-300/50 leading-relaxed" :placeholder="placeholders.q4"></textarea>
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
const dataKey = computed(() => projectId.value ? `ai_course_charter_${projectId.value}` : 'ai_course_charter');

const form = reactive({
  projName: '',
  projPersona: '',
  projPain: '',
  projSolution: '',
  projValue: ''
});

const mode = ref('product');
const saveStatus = ref('自动保存中...');
const saved = ref(false);
let statusTimer = null;
let ready = false;

const CONFIG = {
  product: {
    labels: {
      q1: { icon: 'fas fa-user-circle', text: '1. 目标用户 (Who)' },
      q2: { icon: 'fas fa-exclamation-triangle', text: '2. 核心痛点 (Why)' },
      q3: { icon: 'fas fa-lightbulb', text: '3. 解决方案 (How)' },
      q4: { icon: 'fas fa-bullhorn', text: '4. 电梯演讲 (Value)' }
    },
    placeholders: {
      q1: '描述你的典型用户画像。\\n例如：高一（3）班经常忘记带饭卡的走读生...',
      q2: '他们遇到了什么麻烦？\\n例如：午休时间只有40分钟，排队充卡要花15分钟...',
      q3: '我们要开发什么？\\n例如：基于人脸识别的无感支付终端，部署在食堂窗口...',
      q4: '一句话打动评委：\\n我们的产品是______，为了解决______问题，它能够______。'
    }
  },
  research: {
    labels: {
      q1: { icon: 'fas fa-microscope', text: '1. 研究对象 (Object)' },
      q2: { icon: 'fas fa-question-circle', text: '2. 探究问题 (Question)' },
      q3: { icon: 'fas fa-vial', text: '3. 研究方法 (Method)' },
      q4: { icon: 'fas fa-clipboard-check', text: '4. 预期成果 (Outcome)' }
    },
    placeholders: {
      q1: '你的研究主体是什么？\\n例如：校园内不同光照条件下的植物生长情况...',
      q2: '你想解决什么科学问题或验证什么假设？\\n例如：红光照射是否比蓝光更能促进多肉植物生长？',
      q3: '你打算怎么做实验？\\n例如：设置对照组，控制变量（光照强度、水分），每日记录...',
      q4: '你希望得到什么结论或产出？\\n例如：一份关于光照对植物生长影响的实验报告和数据图表。'
    }
  },
  impact: {
    labels: {
      q1: { icon: 'fas fa-hands-helping', text: '1. 受益群体 (Beneficiary)' },
      q2: { icon: 'fas fa-heart-broken', text: '2. 社会议题 (Issue)' },
      q3: { icon: 'fas fa-hand-holding-heart', text: '3. 行动方案 (Action)' },
      q4: { icon: 'fas fa-star', text: '4. 社会影响 (Impact)' }
    },
    placeholders: {
      q1: '谁会因为你的行动而受益？\\n例如：社区里的空巢老人，子女长期在外工作...',
      q2: '你关注的社会问题是什么？\\n例如：老年人缺乏陪伴，且难以适应数字化生活（买菜、就医困难）...',
      q3: '你打算做什么具体的行动？\\n例如：组织每周一次的“数字反哺”志愿服务，一对一教老人使用智能手机...',
      q4: '你希望带来什么样的改变？\\n例如：帮助30位老人掌握微信使用，建立社区互助网络，提升幸福感。'
    }
  }
};

const labels = computed(() => CONFIG[mode.value].labels);
const placeholders = computed(() => CONFIG[mode.value].placeholders);

function setMode(next) {
  mode.value = next;
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
  localStorage.setItem(dataKey.value, JSON.stringify({ mode: mode.value, ...form }));
  touchSaved();
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
}

function exportPDF() {
  window.print();
}

watch(form, saveData, { deep: true });
watch(mode, saveData);

onMounted(() => {
  loadData();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');
body { font-family: 'Inter', sans-serif; background: #f8fafc; }
.input-group:focus-within label { color: #4f46e5; }
.input-group:focus-within i { color: #4f46e5; }
.mode-btn.active { background-color: #e0e7ff; color: #4f46e5; border-color: #4f46e5; font-weight: bold; }
</style>

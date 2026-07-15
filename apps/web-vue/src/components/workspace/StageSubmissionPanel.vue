<template>
  <div class="h-full overflow-y-auto custom-scrollbar bg-slate-100/50 p-4 md:p-8">

    <!-- A4 沉浸式编辑区 / 向导区 -->
    <div class="max-w-4xl mx-auto bg-white shadow-sm border border-slate-200 rounded-xl min-h-[800px] flex flex-col relative overflow-hidden">



      <!-- 卡片内部反馈与状态头部 -->
      <div class="px-8 md:px-12 pt-6 pb-2" :class="{ 'border-b border-slate-100': submitFeedback.message || latestSubmission?.feedback }">
        <div v-if="submitFeedback.message" class="mb-4 text-xs font-bold px-3 py-1.5 rounded-md inline-block" :class="submitFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'">
          {{ submitFeedback.message }}
        </div>

        <!-- 老师反馈 -->
        <transition
          enter-active-class="transition-opacity duration-150 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
        >
          <div v-if="latestSubmission?.feedback" class="mt-4 mb-2 p-5 rounded-xl bg-amber-50/80 border border-amber-200/50 shadow-sm relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <i class="fas fa-quote-right text-5xl text-amber-900"></i>
            </div>
            <div class="flex items-center gap-2 text-amber-600 text-[10px] font-black uppercase mb-2">
              <span class="size-1.5 rounded-full bg-amber-500"></span>
              导师学术评价
            </div>
            <div class="text-[14px] text-amber-950 font-medium leading-relaxed italic">{{ latestSubmission.feedback }}</div>
          </div>
        </transition>

        <!-- 进度指示 (仅向导模式) -->
        <div v-if="isWizardMode" class="pt-2 pb-4 text-[15px] text-slate-500 font-medium flex items-center justify-between">
          <div class="flex items-baseline gap-2">
            <span>第 {{ currentStep + 1 }} 步 / 共 {{ stageConfig.wizard.length }} 步：</span>
            <span class="text-slate-900 font-black text-xl tracking-tight">{{ currentWizardStep.chapter }} · {{ currentWizardStep.title }}</span>
          </div>
        </div>
      </div>

      <template v-if="isWizardMode">
        <!-- 统一内边距的内容区 -->
        <div class="px-8 md:px-12 py-8 flex-1">

            <div class="space-y-10">
              <div v-for="q in currentWizardStep.questions" :key="q.id" class="flex flex-col gap-3">
                <div class="mb-1">
                  <label class="block text-[15px] font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{{ q.label }}</span>
                  </label>
                  <div v-if="q.desc" class="text-[13px] text-slate-500 leading-relaxed pl-3.5">{{ q.desc }}</div>
                </div>
                <!-- Dynamic List Render -->
                <div v-if="q.type === 'dynamic-list'" class="space-y-4 mt-2">
                  <div v-for="(item, index) in getDynamicList(q.id)" :key="index" class="relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm group">
                    <button @click="removeDynamicItem(q.id, index)" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-colors opacity-0 group-hover:opacity-100">
                      <i class="fas fa-trash"></i>
                    </button>
                    <div class="space-y-4">
                      <div v-for="field in q.subFields" :key="field.name">
                        <label class="block text-xs font-bold text-slate-600 mb-1.5">{{ field.label }}</label>
                        <input v-if="field.type === 'input'" v-model="item[field.name]" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors" :placeholder="field.placeholder">
                        <textarea v-else-if="field.type === 'textarea'" v-model="item[field.name]" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-colors min-h-[80px] resize-y" :placeholder="field.placeholder"></textarea>
                      </div>
                    </div>
                  </div>
                  <button @click="addDynamicItem(q.id)" class="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 font-bold text-sm rounded-xl hover:border-teal-300 hover:text-teal-600 hover:bg-teal-50 transition-all flex items-center justify-center gap-2 mt-2">
                    <i class="fas fa-plus"></i> 添加一项
                  </button>
                </div>

                <!-- Image Upload Render -->
                <div v-else-if="q.type === 'image'" class="mt-2">
                  <div class="relative w-full h-64 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 hover:border-slate-300 transition-colors overflow-hidden group">
                    <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" @change="e => handleImageUpload(q.id, e)">
                    <div v-if="wizardImages[q.id]?.previewUrl" class="absolute inset-0 w-full h-full">
                      <img :src="wizardImages[q.id].previewUrl" class="w-full h-full object-contain" alt="已选择的图片附件">
                      <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="text-white font-bold"><i class="fas fa-camera mr-2"></i>点击更换图片</span>
                      </div>
                    </div>
                    <div v-else class="text-center text-slate-400">
                      <i class="fas fa-image text-3xl mb-2"></i>
                      <p class="font-medium">点击此处上传图片文件</p>
                    </div>
                  </div>
                  <div v-if="wizardImages[q.id]" class="mt-3 flex justify-end">
                    <button @click="removeWizardImage(q.id)" class="text-sm text-rose-500 hover:text-rose-600 font-medium">
                      <i class="fas fa-trash mr-1"></i> 移除图片
                    </button>
                  </div>
                </div>

                <!-- Standard Render -->
                <RichTextEditor
                  v-else
                  v-model="wizardAnswers[q.id]"
                  :placeholder="q.placeholder"
                  :minHeight="400"
                />
              </div>
          </div>
        </div>
        <!-- 统一内边距的底部栏 -->
        <div class="bg-slate-50/50 border-t border-slate-100 px-8 md:px-12 py-6 flex justify-between items-center">
            <button
              @click="prevStep"
              class="px-6 py-2.5 rounded-lg text-sm font-bold transition-all border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              :class="{ 'invisible': currentStep === 0 }"
            >
              <i class="fas fa-arrow-left mr-2"></i> 上一步
            </button>
            <button
              v-if="currentStep < stageConfig.wizard.length - 1"
              @click="nextStep"
              class="px-8 py-2.5 rounded-lg text-[15px] font-bold transition-all bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
            >
              下一步 <i class="fas fa-arrow-right ml-2"></i>
            </button>
            <button
              v-else
              @click="nextStep"
              class="px-8 py-2.5 rounded-lg text-[15px] font-bold transition-all bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20"
            >
              <i class="fas fa-check mr-2"></i>
              完成并预览报告
            </button>
          </div>
        </template>

        <!-- 预览模式 / 自由撰写模式视图 -->
        <template v-else>
          <!-- 撰写提示 -->

          <div v-if="stageConfig.wizard" class="px-8 md:px-12 pt-8 pb-2">
             <div class="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-[14px] text-emerald-800 font-medium flex items-center justify-between">
               <div class="flex items-center gap-2"><i class="fas fa-check-circle text-emerald-500"></i> 报告预览已生成，请核对和润色。</div>
               <button @click="currentStep = 0" class="text-emerald-700 hover:underline flex items-center gap-1.5"><i class="fas fa-edit"></i>重填向导</button>
             </div>
          </div>

          <!-- 主输入区 -->
          <div class="flex-1 px-8 md:px-12 py-8" v-if="mainTextareaField">
            <RichTextEditor
              v-model="formDetails[mainTextareaField.name]"
              :placeholder="mainTextareaField.placeholder || '像在 Word 中一样，直接在这里撰写您的正文内容...'"
              :minHeight="500"
              class="shadow-none border-none focus-within:ring-0 focus-within:border-transparent"
            />
          </div>

          <!-- 元数据输入框与提交栏 (固定在底部) -->
          <div class="border-t border-slate-100 bg-slate-50/50 mt-auto flex flex-col">

            <!-- 其他必填/选填元数据字段 (代码仓库、链接等) -->
            <div v-if="metadataFields.length" class="px-8 md:px-12 py-6 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div v-for="field in metadataFields" :key="field.name" class="col-span-1">
                <label class="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  {{ field.label }}
                  <span v-if="field.required" class="text-rose-500">*</span>
                </label>
                <input
                  v-model="formDetails[field.name]"
                  class="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-slate-300 shadow-sm"
                  :placeholder="field.placeholder || ''"
                />
              </div>
            </div>

            <!-- 提交操作 -->
            <div class="px-8 md:px-12 py-6 flex items-center justify-between">
              <div class="text-sm text-slate-500">
                如果一切就绪，可以提交给老师审阅
              </div>
              <button
                class="shrink-0 group inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-900 rounded-xl text-white font-bold text-[15px] shadow-md hover:bg-slate-800 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:grayscale disabled:transform-none"
                :disabled="submitting || isSubmitDisabled"
                @click="$emit('submit-stage')"
              >
                <i class="fas" :class="submitting ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'"></i>
                <span>{{ submitting ? '提交中...' : '提交给教师审阅' }}</span>
              </button>
            </div>
          </div>
        </template>

      </div>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import RichTextEditor from './RichTextEditor.vue';
import { safeHtml } from '../../utils/safeHtml.js';

const props = defineProps({
  stageConfig: { type: Object, required: true },
  statusStyle: { type: Object, required: true },
  statusMeta: { type: String, default: '' },
  latestSubmission: { type: Object, default: null },
  proposalStatus: { type: Object, required: true },
  activeStage: { type: String, default: 'proposal' },
  submitting: { type: Boolean, default: false },
  formDetails: { type: Object, required: true },
  files: { type: Array, default: () => [] },
  fileInputKey: { type: Number, default: 0 },
  formatSize: { type: Function, required: true },
  submitFeedback: { type: Object, default: () => ({ type: '', message: '' }) }
});

const emit = defineEmits(['refresh-status', 'open-item', 'submit-stage', 'file-change']);

const inceptionItems = computed(() => props.proposalStatus?.items || []);
const inceptionDoneCount = computed(() => inceptionItems.value.filter(item => item.done).length);
const inceptionTotalCount = computed(() => Math.max(inceptionItems.value.length, 1));
const inceptionPercent = computed(() => Math.round((inceptionDoneCount.value / inceptionTotalCount.value) * 100));
const visibleInceptionItems = computed(() => {
  const missing = inceptionItems.value.filter(item => !item.done);
  return missing.length ? missing : inceptionItems.value;
});

const mainTextareaField = computed(() => {
  return props.stageConfig.fields.find(f => f.type === 'textarea') || null;
});

const metadataFields = computed(() => {
  return props.stageConfig.fields.filter(f => f.type !== 'textarea');
});

const isSubmitDisabled = computed(() => {
  const hasFiles = props.files.length > 0;
  let hasMainText = false;
  if (mainTextareaField.value && props.formDetails[mainTextareaField.value.name]) {
    hasMainText = true;
  }
  return !hasFiles && !hasMainText;
});

function getBannerClass(cls) {
  const map = {
    'status-pending': 'bg-slate-100 text-slate-600',
    'status-draft': 'bg-amber-100 text-amber-800',
    'status-submitted': 'bg-teal-100 text-teal-800',
    'status-reviewed': 'bg-emerald-100 text-emerald-800',
    'status-needs': 'bg-rose-100 text-rose-800'
  };
  return map[cls] || 'bg-slate-100 text-slate-600';
}

// Wizard State
const currentStep = ref(0);
const wizardAnswers = ref({});
const wizardImages = reactive({});
const IMAGE_LIMIT_BYTES = 100 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clearWizardImage(qId) {
  const current = wizardImages[qId];
  if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
  delete wizardImages[qId];
}

function clearAllWizardImages() {
  Object.keys(wizardImages).forEach(clearWizardImage);
}

function emitFiles(files) {
  emit('file-change', files);
}

async function handleImageUpload(qId, event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (!IMAGE_TYPES.has(String(file.type || '').toLowerCase()) || /\.svg$/i.test(file.name || '')) {
    emit('file-change', props.files);
    return;
  }
  if (file.size > IMAGE_LIMIT_BYTES) return;
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isPng = header.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => header[i] === v);
  const isJpeg = header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isGif = new TextDecoder().decode(header.slice(0, 6)) === 'GIF89a' || new TextDecoder().decode(header.slice(0, 6)) === 'GIF87a';
  const isWebp = new TextDecoder().decode(header.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(header.slice(8, 12)) === 'WEBP';
  if (!isPng && !isJpeg && !isGif && !isWebp) return;

  const previous = wizardImages[qId]?.file;
  clearWizardImage(qId);
  const nextFiles = props.files.filter(item => item !== previous).concat(file);
  wizardImages[qId] = { file, previewUrl: URL.createObjectURL(file) };
  emitFiles(nextFiles);
}

function removeWizardImage(qId) {
  const current = wizardImages[qId]?.file;
  clearWizardImage(qId);
  emitFiles(props.files.filter(item => item !== current));
}

// Automatically skip wizard if they already have text in the notes/summary field
watch(() => props.activeStage, () => {
  const fieldName = mainTextareaField.value?.name;
  if (props.stageConfig.wizard && fieldName && props.formDetails[fieldName]) {
    // If they already have a drafted report, jump straight to preview
    currentStep.value = props.stageConfig.wizard.length;
  } else {
    clearAllWizardImages();
    currentStep.value = 0;
    wizardAnswers.value = {};
    if (props.stageConfig.wizard) {
      props.stageConfig.wizard.forEach(step => {
        step.questions.forEach(q => {
          if (q.type === 'dynamic-list') {
            wizardAnswers.value[q.id] = [{}]; // start with one empty item
          }
        });
      });
    }
  }
}, { immediate: true });

const isWizardMode = computed(() => {
  if (!props.stageConfig.wizard) return false;
  return currentStep.value < props.stageConfig.wizard.length;
});

const currentWizardStep = computed(() => {
  if (!isWizardMode.value) return null;
  return props.stageConfig.wizard[currentStep.value];
});

function getDynamicList(qId) {
  if (!Array.isArray(wizardAnswers.value[qId])) {
    wizardAnswers.value[qId] = [];
  }
  return wizardAnswers.value[qId];
}

function addDynamicItem(qId) {
  getDynamicList(qId).push({});
}

function removeDynamicItem(qId, index) {
  const list = getDynamicList(qId);
  list.splice(index, 1);
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function nextStep() {
  if (currentStep.value < props.stageConfig.wizard.length - 1) {
    currentStep.value++;
  } else if (currentStep.value === props.stageConfig.wizard.length - 1) {
    // Final step, generate report!
    let generatedReport = '';
    for (const step of props.stageConfig.wizard) {
      // Step acts as a big heading, though we can skip if it feels redundant
      generatedReport += `<h2>${escapeHtml(step.title)}</h2>\n`;
      for (const q of step.questions) {
        const answer = wizardAnswers.value[q.id];
        if (Array.isArray(answer)) {
          if (answer.length === 0) continue;
          let listStr = '';
          answer.forEach((item, idx) => {
            const heading = item.title || item.method || '未命名条目';
            listStr += `#### ${idx + 1}. ${escapeHtml(heading)}\n`;
            if (item.url) listStr += `- **链接**：${escapeHtml(item.url)}\n`;
            if (item.theme) listStr += `- **主旨**：\n  ${escapeHtml(item.theme).replace(/\n/g, '\n  ')}\n`;
            if (item.shortcoming) listStr += `- **不足与启发**：\n  ${escapeHtml(item.shortcoming).replace(/\n/g, '\n  ')}\n`;
            if (item.findings) listStr += `- **核心发现**：\n  ${escapeHtml(item.findings).replace(/\n/g, '\n  ')}\n`;
            listStr += `\n`;
          });
          if (listStr.trim()) {
            generatedReport += `<h3>${escapeHtml(q.label)}</h3>\n${listStr}\n`;
          }
        } else if (q.type === 'image' && wizardImages[q.id]) {
          generatedReport += `<h3>${escapeHtml(q.label)}</h3>\n<p>图片附件：${escapeHtml(wizardImages[q.id].file.name)}</p>\n\n`;
        } else {
          generatedReport += `<h3>${escapeHtml(q.label)}</h3>\n${safeHtml(answer || '')}\n\n`;
        }
      }
    }
    const fieldName = mainTextareaField.value?.name;
    if (fieldName) {
      // Overwrite the textarea with generated report
      props.formDetails[fieldName] = generatedReport.trim();
    }
    currentStep.value++;
  }
}

onBeforeUnmount(clearAllWizardImages);
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
textarea {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
}
</style>

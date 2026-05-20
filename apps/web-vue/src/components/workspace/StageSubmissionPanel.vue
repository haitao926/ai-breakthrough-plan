<template>
  <div class="h-full overflow-y-auto custom-scrollbar bg-slate-50/50">
    <div class="max-w-4xl mx-auto px-8 py-12">
      <!-- 头部信息 -->
      <div class="text-center mb-10">
        <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-3">{{ stageConfig.title }}</h2>
        <p class="text-sm text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">{{ stageConfig.desc }}</p>
      </div>

      <!-- 状态条 -->
      <div 
        class="flex items-center gap-6 p-8 rounded-[32px] border transition-all duration-500 shadow-sm mb-12"
        :class="getBannerClass(statusStyle.banner)"
      >
        <div 
          class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
          :class="getIconClass(statusStyle.icon)"
          v-html="statusStyle.iconHtml"
        ></div>
        <div class="flex-1">
          <div class="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">{{ statusStyle.title }}</div>
          <div class="text-sm font-bold leading-relaxed">{{ statusMeta || '正在准备你的科创画布...' }}</div>
        </div>
      </div>

      <!-- 老师反馈 -->
      <transition 
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="transform -translate-y-6 opacity-0 scale-95"
        enter-to-class="transform translate-y-0 opacity-100 scale-100"
      >
        <div v-if="latestSubmission?.feedback" class="mb-12 p-8 rounded-[32px] bg-amber-50/50 border border-amber-100 shadow-sm relative overflow-hidden group">
          <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <i class="fas fa-quote-right text-6xl text-amber-900"></i>
          </div>
          <div class="flex items-center gap-3 text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            导师学术评价
          </div>
          <div class="text-base text-amber-950 font-medium leading-relaxed italic selection:bg-amber-100">{{ latestSubmission.feedback }}</div>
        </div>
      </transition>

      <!-- 开题报告专用布局 -->
      <div v-if="activeStage === 'proposal'" class="space-y-8 animate-reveal">
        <div class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-base font-black text-slate-900 mb-2">材料可以先在线下完成</h3>
          <p class="text-sm text-slate-500 leading-relaxed">
            平台用于提醒节点和归档材料。学生可以先按开题模板在 Word / Markdown / PDF 中填写，再上传文件；平台内的整理工具只是辅助。
          </p>
        </div>

        <ProposalStatus
          :items="proposalStatus.items"
          :missing="proposalStatus.missing"
          :wbs-tasks="proposalStatus.wbsTasks"
          :ready="proposalStatus.ready"
          @refresh="$emit('refresh-status')"
          @open-item="$emit('open-item', $event)"
        />

        <div class="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <h3 class="text-base font-black text-slate-900 mb-1">上传开题材料</h3>
            <p class="text-sm text-slate-500">已填写的开题模板、调研记录、图片或 PDF 都可以作为附件提交。</p>
          </div>
          <div v-for="field in stageConfig.fields" :key="field.name" class="group">
            <label class="block mb-2">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {{ field.label }}
              </span>
            </label>
            <textarea
              v-if="field.type === 'textarea'"
              v-model="formDetails[field.name]"
              class="w-full min-h-[110px] bg-white border border-slate-200 rounded-[16px] p-4 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300 resize-none"
              :placeholder="field.placeholder || '可补充说明上传材料的内容...'"
            ></textarea>
            <input
              v-else
              v-model="formDetails[field.name]"
              class="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300"
              :placeholder="field.placeholder || ''"
            />
          </div>
          <div class="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all group relative cursor-pointer">
            <input
              :key="fileInputKey"
              type="file"
              multiple
              class="absolute inset-0 opacity-0 cursor-pointer z-10"
              @change="$emit('file-change', $event)"
            />
            <div class="text-center">
              <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-indigo-600 transition-colors">
                <i class="fas fa-cloud-upload-alt text-xl"></i>
              </div>
              <h4 class="text-sm font-black text-slate-900 mb-1">上传已填写模板或附件</h4>
              <p class="text-xs text-slate-400 font-bold">支持 Word、PDF、图片、压缩包等材料</p>
            </div>
          </div>
          <div v-if="files.length" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="file in files" :key="file.name" class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
              <div class="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
                <i class="fas fa-file-alt"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-bold text-slate-900 truncate">{{ file.name }}</div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ formatSize(file.size) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-center pt-4">
          <button 
            class="group relative inline-flex items-center justify-center gap-3 px-10 py-4 bg-indigo-600 rounded-[22px] text-white font-black text-sm tracking-widest uppercase overflow-hidden shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0"
            :disabled="(!proposalStatus.ready && !files.length && !formDetails.templateRef && !formDetails.notes) || submitting" 
            @click="$emit('submit-stage')"
          >
            <div class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <i class="fas" :class="submitting ? 'fa-circle-notch animate-spin' : 'fa-paper-plane'"></i>
            <span>{{ submitting ? '正在提交...' : '上传 / 提交开题材料' }}</span>
          </button>
        </div>
      </div>

      <!-- 普通表单布局 -->
      <form v-else class="space-y-8 animate-reveal" @submit.prevent="$emit('submit-stage')">
        <div class="grid grid-cols-1 gap-6">
          <div v-for="field in stageConfig.fields" :key="field.name" class="group">
            <label class="block mb-2">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {{ field.label }}
                <span v-if="field.required" class="text-rose-500 ml-1">*</span>
              </span>
            </label>
            <textarea
              v-if="field.type === 'textarea'"
              v-model="formDetails[field.name]"
              class="w-full min-h-[160px] bg-white border border-slate-200 rounded-[20px] p-5 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300 resize-none shadow-sm"
              :placeholder="field.placeholder || '请在此输入具体内容...'"
            ></textarea>
            <input
              v-else
              v-model="formDetails[field.name]"
              class="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-300 shadow-sm"
              :placeholder="field.placeholder || ''"
            />
          </div>
        </div>

        <!-- 附件上传 -->
        <div class="p-8 rounded-[32px] border-2 border-dashed border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/20 transition-all group relative cursor-pointer">
          <input 
            :key="fileInputKey" 
            type="file" 
            multiple 
            class="absolute inset-0 opacity-0 cursor-pointer z-10"
            @change="$emit('file-change', $event)" 
          />
          <div class="text-center">
            <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
              <i class="fas fa-cloud-upload-alt text-2xl"></i>
            </div>
            <h4 class="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">上传已填写模板或附件</h4>
            <p class="text-xs text-slate-400 font-bold uppercase tracking-tighter">支持多选，最大限制 50MB 每文件</p>
          </div>
        </div>

        <!-- 已选文件列表 -->
        <transition-group 
          tag="div" 
          v-if="files.length" 
          class="grid grid-cols-1 sm:grid-cols-2 gap-3"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
        >
          <div v-for="file in files" :key="file.name" class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div class="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
              <i class="fas fa-file-alt"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold text-slate-900 truncate">{{ file.name }}</div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ formatSize(file.size) }}</div>
            </div>
          </div>
        </transition-group>

        <div class="flex justify-end pt-10">
          <button 
            type="submit" 
            class="btn-action min-w-[200px]"
            :disabled="submitting"
          >
            <i class="fas" :class="submitting ? 'fa-spinner animate-spin' : 'fa-rocket'"></i>
            <span>{{ submitting ? '正在提交...' : '上传 / 提交材料' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import ProposalStatus from '@/components/ProposalStatus.vue';

defineProps({
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
  formatSize: { type: Function, required: true }
});

defineEmits(['refresh-status', 'open-item', 'submit-stage', 'file-change']);

function getBannerClass(cls) {
  const map = {
    'status-pending': 'bg-white border-slate-100 text-slate-600',
    'status-draft': 'bg-amber-50 border-amber-100 text-amber-900',
    'status-submitted': 'bg-indigo-50 border-indigo-100 text-indigo-900',
    'status-reviewed': 'bg-emerald-50 border-emerald-100 text-emerald-900',
    'status-needs': 'bg-rose-50 border-rose-100 text-rose-900'
  };
  return map[cls] || 'bg-slate-50 border-slate-200';
}

function getIconClass(cls) {
  const map = {
    'status-icon-pending': 'bg-slate-100 text-slate-400',
    'status-icon-draft': 'bg-amber-100 text-amber-600 shadow-amber-500/20',
    'status-icon-submitted': 'bg-indigo-600 text-white shadow-indigo-500/30',
    'status-icon-reviewed': 'bg-emerald-500 text-white shadow-emerald-500/30',
    'status-icon-needs': 'bg-rose-600 text-white shadow-rose-500/30'
  };
  return map[cls] || 'bg-slate-200';
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>

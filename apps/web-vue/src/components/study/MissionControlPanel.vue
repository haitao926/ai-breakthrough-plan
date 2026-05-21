<template>
  <div class="flex h-full flex-col border-l border-slate-200/80 bg-slate-50/90 text-slate-800 shadow-xl xl:w-[28%] shrink-0 overflow-hidden relative">
    
    <!-- Top Indigo Highlight Accent -->
    <div class="h-[3px] w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

    <!-- Header Panel (Light Mode Integrated) -->
    <div class="flex h-20 items-center justify-between bg-white px-6 border-b border-slate-200/80 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <!-- Colored control dots -->
        <div class="flex gap-1.5">
          <div class="h-3 w-3 rounded-full bg-rose-400/80"></div>
          <div class="h-3 w-3 rounded-full bg-amber-400/80"></div>
          <div class="h-3 w-3 rounded-full bg-emerald-400/80"></div>
        </div>
        <div>
          <span class="text-xs font-black uppercase tracking-[0.24em] text-slate-800">Mission Control</span>
          <span class="block text-[8px] font-black tracking-widest text-indigo-500 uppercase mt-0.5">任务与即时反馈</span>
        </div>
      </div>
      <div class="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black tracking-wider text-indigo-600 border border-indigo-100">
        AI助教小破已就绪
      </div>
    </div>

    <!-- Panel Content Area -->
    <div class="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
      
      <!-- Progress Indicator -->
      <section v-if="deliverables?.length" class="bg-white rounded-2xl border border-slate-200/60 p-4.5 shadow-sm">
        <div class="flex justify-between items-center mb-2.5">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">本课任务进度</span>
          <span class="text-xs font-black text-indigo-600">{{ checkedCount }}/{{ deliverables.length }} 已完成</span>
        </div>
        <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
            :style="{ width: `${(checkedCount / deliverables.length) * 100}%` }"
          ></div>
        </div>
      </section>

      <!-- Section 1: Core Deliverables Checklist (Interactive Quest checklist) -->
      <section v-if="deliverables?.length" class="space-y-2.5">
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 flex items-center gap-2 pl-1">
          <i class="fas fa-list-check text-slate-400"></i>
          <span>核心交付成果</span>
        </div>

        <div class="bg-white rounded-2.5xl border border-slate-200/60 p-4.5 shadow-sm divide-y divide-slate-100">
          <div
            v-for="(item, idx) in deliverables"
            :key="item"
            class="flex items-start gap-3.5 py-3 first:pt-1 last:pb-1 group cursor-pointer"
            @click="toggleCheck(idx)"
          >
            <button
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all mt-0.5"
              :class="isChecked(idx) ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/20' : 'border-slate-300 bg-white group-hover:border-slate-400'"
            >
              <i v-if="isChecked(idx)" class="fas fa-check text-[10px]"></i>
            </button>
            <span
              class="text-xs font-bold leading-5 transition-all duration-200"
              :class="isChecked(idx) ? 'text-slate-400 line-through' : 'text-slate-700 group-hover:text-slate-900'"
            >
              {{ item }}
            </span>
          </div>
        </div>
      </section>

      <!-- Section 2: Lesson Materials & Files (Downloads) -->
      <section v-if="materials?.length" class="space-y-2.5">
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 flex items-center gap-2 pl-1">
          <i class="fas fa-folder-open text-slate-400"></i>
          <span>配套课程资料</span>
        </div>

        <div class="grid gap-3">
          <a
            v-for="material in materials"
            :key="material.id"
            :href="material.downloadUrl"
            target="_blank"
            class="group flex items-center gap-3.5 rounded-2xl border border-slate-200/50 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <!-- Specific light colors for file extensions -->
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition duration-300 group-hover:scale-105"
              :class="iconBgClass(material)"
            >
              <i class="fas text-sm" :class="[materialIcon(material), iconTextClass(material)]"></i>
            </div>

            <div class="flex-1 min-w-0">
              <span class="block text-xs font-black text-slate-700 group-hover:text-indigo-600 transition line-clamp-1 leading-normal">{{ material.title }}</span>
              <span class="block text-[8px] font-black text-slate-400 tracking-wider uppercase mt-1">Ready for download</span>
            </div>

            <i class="fas fa-chevron-right text-[9px] text-slate-300 transition duration-300 group-hover:translate-x-1 group-hover:text-indigo-600"></i>
          </a>
        </div>
      </section>

      <!-- Section 3: Homework Submissions and AI Feedback -->
      <section class="space-y-3">
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 flex items-center gap-2 pl-1">
          <i class="fas fa-file-signature text-slate-400"></i>
          <span>成果提交与评测</span>
        </div>

        <div v-if="loading" class="py-12 text-center text-slate-400 bg-white rounded-2.5xl border border-slate-200/60 shadow-sm">
          <i class="fas fa-spinner fa-spin text-xl mb-2 text-indigo-500"></i>
          <p class="text-[10px] font-black tracking-widest text-slate-400 uppercase">Synchronizing with system...</p>
        </div>

        <div v-else-if="!assignments?.length" class="py-12 text-center text-slate-400 bg-white rounded-2.5xl border border-slate-200/60 shadow-sm">
          <i class="fas fa-award text-2xl mb-2 text-slate-300"></i>
          <p class="text-xs font-bold text-slate-400 tracking-wider">本课无需提交电子作业</p>
        </div>

        <div v-else class="space-y-5">
          <div
            v-for="assignment in assignments"
            :key="assignment.id"
            class="bg-white rounded-2.5xl border border-slate-200/60 p-5 shadow-sm space-y-4"
          >
            <!-- Assignment header -->
            <div class="flex flex-col gap-2 pb-3 border-b border-slate-100">
              <div class="flex items-start justify-between gap-4">
                <h4 class="text-xs font-black text-slate-800 leading-snug">{{ assignment.title }}</h4>
                <span
                  class="rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider shrink-0"
                  :class="submissionStatusClass(assignment.id)"
                >
                  {{ submissionStatusText(assignment.id) }}
                </span>
              </div>
              <p class="text-[11px] leading-relaxed text-slate-500">{{ assignment.requirements || assignment.description }}</p>
            </div>

            <!-- Submission Form -->
            <form @submit.prevent="$emit('submit', assignment)" class="space-y-3.5">
              <div class="space-y-1">
                <label class="block text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">成果心得 / 代码内容</label>
                <textarea
                  v-model="drafts[assignment.id].content"
                  rows="4"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-700 placeholder-slate-400 shadow-inner focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="在这里写下你的研究成果、思考心得，或者实验代码段..."
                ></textarea>
              </div>

              <div class="space-y-1">
                <label class="block text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">作品链接（GitHub / 网盘 / 演示网页）</label>
                <input
                  v-model="drafts[assignment.id].link"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-medium text-slate-700 placeholder-slate-400 shadow-inner focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="项目链接 (以 http(s) 开头)"
                />
              </div>

              <div class="space-y-1">
                <label class="block text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">附件备注</label>
                <input
                  v-model="drafts[assignment.id].attachmentNote"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs font-medium text-slate-700 placeholder-slate-400 shadow-inner focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="如：已在纸质作业本中画图"
                />
              </div>
              
              <button
                type="submit"
                class="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 py-3 text-xs font-black text-white transition-all shadow-md shadow-indigo-600/10 active:scale-98"
              >
                <i class="fas fa-bolt mr-1.5"></i>
                {{ hasSubmission(assignment.id) ? '更新提交 & AI重新评测' : '提交并获取 AI 助教即时评测' }}
              </button>
            </form>

            <!-- Light Mode Premium AI Assistant Feedback bubble -->
            <div
              v-if="hasSubmission(assignment.id) && getSubmission(assignment.id).feedback"
              class="relative rounded-2xl p-4.5 border transition duration-300"
              :class="getSubmission(assignment.id).reviewed_by === 'AI_Assistant'
                ? 'bg-indigo-50/50 border-indigo-100 shadow-[0_4px_20px_rgba(99,102,241,0.04)]'
                : 'bg-slate-50 border-slate-150'"
            >
              <!-- Cyber decoration elements -->
              <div v-if="getSubmission(assignment.id).reviewed_by === 'AI_Assistant'" class="absolute top-0 right-0 h-8 w-8 pointer-events-none">
                <div class="absolute top-0 right-0 h-[2px] w-3 bg-indigo-300"></div>
                <div class="absolute top-0 right-0 h-3 w-[2px] bg-indigo-300"></div>
              </div>

              <div class="flex items-center gap-3 mb-3 pb-3 border-b border-indigo-100/50">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm relative"
                  :class="getSubmission(assignment.id).reviewed_by === 'AI_Assistant' ? 'bg-indigo-600' : 'bg-slate-700'"
                >
                  <i class="fas text-xs" :class="getSubmission(assignment.id).reviewed_by === 'AI_Assistant' ? 'fa-robot' : 'fa-graduation-cap'"></i>
                </div>
                <div>
                  <div class="text-[11px] font-black text-slate-800 uppercase tracking-wider leading-none">
                    {{ getSubmission(assignment.id).reviewed_by === 'AI_Assistant' ? 'AI 助教小破的反馈' : '教师评价' }}
                  </div>
                  <div class="mt-1 text-[8px] font-black text-indigo-500 uppercase tracking-[0.16em] leading-none">
                    Instant Review
                  </div>
                </div>
              </div>
              
              <p class="text-xs font-bold leading-6 text-slate-600 whitespace-pre-line">
                {{ getSubmission(assignment.id).feedback }}
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';

const props = defineProps({
  materials: {
    type: Array,
    default: () => []
  },
  deliverables: {
    type: Array,
    default: () => []
  },
  assignments: {
    type: Array,
    default: () => []
  },
  submissions: {
    type: Object,
    default: () => ({})
  },
  drafts: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['submit']);

// Save checked states of deliverables to local storage to make it interactive
const checkedStates = ref({});

onMounted(() => {
  try {
    const key = `deliverables_check_${props.assignments?.[0]?.lessonId || 'default'}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      checkedStates.value = JSON.parse(stored);
    }
  } catch (err) {
    console.error(err);
  }
});

const checkedCount = computed(() => {
  return Object.values(checkedStates.value).filter(Boolean).length;
});

function isChecked(idx) {
  return Boolean(checkedStates.value[idx]);
}

function toggleCheck(idx) {
  checkedStates.value[idx] = !checkedStates.value[idx];
  try {
    const key = `deliverables_check_${props.assignments?.[0]?.lessonId || 'default'}`;
    localStorage.setItem(key, JSON.stringify(checkedStates.value));
  } catch (err) {
    console.error(err);
  }
}

function hasSubmission(assignmentId) {
  return Boolean(props.submissions[assignmentId]);
}

function getSubmission(assignmentId) {
  return props.submissions[assignmentId] || {};
}

function submissionStatusText(assignmentId) {
  const sub = getSubmission(assignmentId);
  if (!sub.id) return '未完成';
  if (sub.status === 'reviewed') return '已评测';
  if (sub.status === 'submitted') return '已提交';
  return sub.status || '已提交';
}

function submissionStatusClass(assignmentId) {
  const sub = getSubmission(assignmentId);
  if (!sub.id) return 'bg-slate-100 text-slate-400 border border-slate-200';
  if (sub.status === 'reviewed') return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
}

function materialIcon(material) {
  const kind = String(material?.kind || '').toLowerCase();
  const path = String(material?.path || '').toLowerCase();
  if (kind === 'presentation' || /\.pptx?$/i.test(path)) return 'fa-file-powerpoint';
  if (kind === 'video' || /\.mp4$/i.test(path)) return 'fa-file-video';
  if (kind === 'html') return 'fa-file-code';
  if (/\.md$/i.test(path)) return 'fa-file-lines';
  if (/\.ipynb$/i.test(path)) return 'fa-microchip';
  if (/\.py$/i.test(path)) return 'fa-code';
  return 'fa-file-lines';
}

function iconBgClass(material) {
  const path = String(material?.path || '').toLowerCase();
  if (/\.py$/i.test(path) || /\.ipynb$/i.test(path)) return 'bg-amber-50 border border-amber-100';
  if (/\.pptx?$/i.test(path)) return 'bg-orange-50 border border-orange-100';
  if (/\.pdf$/i.test(path)) return 'bg-rose-50 border border-rose-100';
  return 'bg-indigo-50 border border-indigo-100';
}

function iconTextClass(material) {
  const path = String(material?.path || '').toLowerCase();
  if (/\.py$/i.test(path) || /\.ipynb$/i.test(path)) return 'text-amber-500';
  if (/\.pptx?$/i.test(path)) return 'text-orange-500';
  if (/\.pdf$/i.test(path)) return 'text-rose-500';
  return 'text-indigo-500';
}
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>

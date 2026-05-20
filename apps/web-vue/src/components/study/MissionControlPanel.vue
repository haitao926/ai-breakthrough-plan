<template>
  <div class="flex h-full flex-col border-l border-slate-200/60 bg-slate-900 text-slate-100 shadow-2xl xl:w-[38%] shrink-0">
    <!-- Panel Header -->
    <div class="flex h-20 items-center justify-between border-b border-slate-800 bg-slate-950 px-6">
      <div class="flex items-center gap-3">
        <div class="flex gap-1.5">
          <div class="h-3 w-3 rounded-full bg-rose-500"></div>
          <div class="h-3 w-3 rounded-full bg-amber-500"></div>
          <div class="h-3 w-3 rounded-full bg-emerald-500"></div>
        </div>
        <span class="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Mission Control</span>
      </div>
      <div class="rounded-full bg-indigo-950/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-400 border border-indigo-900">
        任务与即时反馈
      </div>
    </div>

    <!-- Panel Content Area -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      
      <!-- Section 1: Lesson Materials & Files -->
      <section v-if="materials?.length" class="rounded-2xl border border-slate-800/80 bg-slate-950 p-5 shadow-sm">
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 mb-4 flex items-center gap-2">
          <i class="fas fa-download text-slate-400"></i>
          <span>课程资料下载</span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <a
            v-for="material in materials"
            :key="material.id"
            :href="material.downloadUrl"
            target="_blank"
            class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 transition hover:border-indigo-500 hover:bg-slate-800"
          >
            <i class="fas text-slate-400" :class="materialIcon(material)"></i>
            <span class="text-xs font-bold text-slate-200 line-clamp-1">{{ material.title }}</span>
          </a>
        </div>
      </section>

      <!-- Section 2: Core Deliverables Checklist -->
      <section v-if="deliverables?.length" class="rounded-2xl border border-slate-800/80 bg-slate-950 p-5 shadow-sm">
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 mb-4 flex items-center gap-2">
          <i class="fas fa-bullseye text-slate-400"></i>
          <span>本课成果目标</span>
        </div>
        <ul class="space-y-3">
          <li v-for="item in deliverables" :key="item" class="flex items-start gap-3">
            <i class="fas fa-circle-check mt-1 text-indigo-500 shrink-0"></i>
            <span class="text-xs font-bold leading-5 text-slate-400">{{ item }}</span>
          </li>
        </ul>
      </section>

      <!-- Section 3: Homework Submissions and AI Feedback -->
      <section class="space-y-4">
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 flex items-center gap-2">
          <i class="fas fa-file-signature text-slate-400"></i>
          <span>作业提交与反馈</span>
        </div>

        <div v-if="loading" class="py-12 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
          <i class="fas fa-spinner fa-spin text-xl mb-2"></i>
          <p class="text-xs font-bold tracking-widest uppercase">正在读取任务状态</p>
        </div>

        <div v-else-if="!assignments?.length" class="py-12 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
          <i class="fas fa-clipboard-check text-xl mb-2 text-slate-600"></i>
          <p class="text-xs font-bold tracking-widest uppercase">本课无须提交作业</p>
        </div>

        <div v-else class="space-y-6">
          <div
            v-for="assignment in assignments"
            :key="assignment.id"
            class="rounded-2xl border border-slate-800/80 bg-slate-950 p-5 space-y-4"
          >
            <!-- Assignment meta -->
            <div class="flex items-start justify-between gap-3 border-b border-slate-900 pb-3">
              <div>
                <h4 class="text-sm font-black text-white">{{ assignment.title }}</h4>
                <p class="mt-1 text-[11px] leading-relaxed text-slate-500">{{ assignment.requirements || assignment.description }}</p>
              </div>
              <span
                class="rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider shadow"
                :class="submissionStatusClass(assignment.id)"
              >
                {{ submissionStatusText(assignment.id) }}
              </span>
            </div>

            <!-- Submission Form -->
            <form @submit.prevent="$emit('submit', assignment)" class="space-y-3">
              <textarea
                v-model="drafts[assignment.id].content"
                class="min-h-[100px] w-full rounded-xl border border-slate-850 bg-slate-900 p-3 text-xs font-medium text-slate-200 placeholder-slate-550 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="在此粘贴你的代码、文字报告、心想与反思"
              ></textarea>
              <input
                v-model="drafts[assignment.id].link"
                class="w-full rounded-xl border border-slate-850 bg-slate-900 p-3 text-xs font-medium text-slate-200 placeholder-slate-550 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="作品/代码仓库链接（可选，需 http(s)）"
              />
              <input
                v-model="drafts[assignment.id].attachmentNote"
                class="w-full rounded-xl border border-slate-850 bg-slate-900 p-3 text-xs font-medium text-slate-200 placeholder-slate-550 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="附件说明（可选）"
              />
              
              <button
                type="submit"
                class="w-full rounded-xl bg-indigo-600 py-3 text-xs font-black text-white hover:bg-indigo-700 transition duration-300 shadow shadow-indigo-600/20 active:scale-98"
              >
                {{ hasSubmission(assignment.id) ? '更新提交并自动评测' : '提交并开启 AI 即时评测' }}
              </button>
            </form>

            <!-- Instant AI Evaluation Feedback Panel -->
            <div
              v-if="hasSubmission(assignment.id) && getSubmission(assignment.id).feedback"
              class="mt-4 rounded-xl p-4.5 border"
              :class="getSubmission(assignment.id).reviewed_by === 'AI_Assistant' ? 'bg-indigo-950/40 border-indigo-900/50' : 'bg-slate-900 border-slate-850'"
            >
              <div class="flex items-center gap-3 mb-3">
                <div
                  class="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow"
                  :class="getSubmission(assignment.id).reviewed_by === 'AI_Assistant' ? 'bg-indigo-600 shadow-indigo-650/30' : 'bg-slate-800'"
                >
                  <i class="fas text-xs" :class="getSubmission(assignment.id).reviewed_by === 'AI_Assistant' ? 'fa-robot' : 'fa-graduation-cap'"></i>
                </div>
                <div>
                  <div class="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                    {{ getSubmission(assignment.id).reviewed_by === 'AI_Assistant' ? 'AI 助教小破的评测反馈' : '教师反馈' }}
                  </div>
                  <div class="mt-1 text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none">
                    Instant Evaluation
                  </div>
                </div>
              </div>
              <p class="text-xs font-medium leading-6 text-slate-300 whitespace-pre-line">
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

function hasSubmission(assignmentId) {
  return Boolean(props.submissions[assignmentId]);
}

function getSubmission(assignmentId) {
  return props.submissions[assignmentId] || {};
}

function submissionStatusText(assignmentId) {
  const sub = getSubmission(assignmentId);
  if (!sub.id) return '未提交';
  if (sub.status === 'reviewed') return 'AI已评测';
  if (sub.status === 'submitted') return '已提交';
  return sub.status || '已提交';
}

function submissionStatusClass(assignmentId) {
  const sub = getSubmission(assignmentId);
  if (!sub.id) return 'bg-slate-800 text-slate-400 border border-slate-700';
  if (sub.status === 'reviewed') return 'bg-emerald-950 text-emerald-400 border border-emerald-900';
  return 'bg-indigo-950 text-indigo-400 border border-indigo-900';
}

function materialIcon(material) {
  const kind = String(material?.kind || '').toLowerCase();
  const path = String(material?.path || '').toLowerCase();
  if (kind === 'presentation' || /\.pptx?$/i.test(path)) return 'fa-file-powerpoint';
  if (kind === 'video' || /\.mp4$/i.test(path)) return 'fa-file-video';
  if (kind === 'html') return 'fa-file-code';
  if (/\.md$/i.test(path)) return 'fa-file-lines';
  return 'fa-file';
}
</script>

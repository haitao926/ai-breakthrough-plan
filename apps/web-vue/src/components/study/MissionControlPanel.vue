<template>
  <div class="flex h-full flex-col border-l border-slate-800 bg-slate-950 text-slate-100 shadow-2xl xl:w-[38%] shrink-0 overflow-hidden relative">
    
    <!-- Top Cyber Accent Line -->
    <div class="h-[2px] w-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400"></div>

    <!-- Header Panel with Cyberpunk Info Bar -->
    <div class="flex h-20 items-center justify-between bg-slate-950/95 px-6 border-b border-slate-900/80 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <!-- Animated indicator dot -->
        <div class="relative flex h-3.5 w-3.5 items-center justify-center">
          <span class="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-indigo-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </div>
        <div>
          <span class="text-xs font-black uppercase tracking-[0.28em] text-white">Mission Control</span>
          <span class="block text-[8px] font-black tracking-widest text-indigo-400/80 uppercase mt-0.5">Core Workspace</span>
        </div>
      </div>
      <div class="flex items-center gap-2 rounded-xl bg-slate-900/80 border border-slate-800/80 px-3.5 py-1.5 shadow-inner">
        <i class="fas fa-microchip text-[10px] text-cyan-400"></i>
        <span class="text-[9px] font-black uppercase tracking-wider text-slate-300">AI-Powered Hub</span>
      </div>
    </div>

    <!-- Panel Content Area -->
    <div class="flex-1 overflow-y-auto p-6 space-y-7 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
      
      <!-- Section 1: Lesson Materials & Files -->
      <section v-if="materials?.length" class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 flex items-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            <span>课程资料及工具包</span>
          </div>
          <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">{{ materials.length }} Files</span>
        </div>

        <div class="grid gap-3.5 sm:grid-cols-2">
          <a
            v-for="material in materials"
            :key="material.id"
            :href="material.downloadUrl"
            target="_blank"
            class="group relative flex items-center gap-3.5 rounded-2xl border border-slate-900 bg-slate-900/40 p-4 transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-900 hover:shadow-[0_0_20px_rgba(34,211,238,0.06)]"
          >
            <!-- File icon with specific gradient background for file types -->
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition duration-300 group-hover:scale-105"
              :class="iconBgClass(material)"
            >
              <i class="fas text-sm" :class="[materialIcon(material), iconTextClass(material)]"></i>
            </div>

            <div class="flex-1 min-w-0">
              <span class="block text-xs font-black text-slate-200 group-hover:text-white transition line-clamp-1 leading-normal">{{ material.title }}</span>
              <span class="block text-[8px] font-black text-slate-500 tracking-wider uppercase mt-1">Ready for download</span>
            </div>

            <!-- Arrow icon that slides on hover -->
            <i class="fas fa-chevron-right text-[10px] text-slate-700 transition duration-300 group-hover:translate-x-1 group-hover:text-cyan-400"></i>
          </a>
        </div>
      </section>

      <!-- Section 2: Core Deliverables Checklist (Quest Log style) -->
      <section v-if="deliverables?.length" class="space-y-3">
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 flex items-center gap-2">
          <span class="h-1.5 w-1.5 rounded-full bg-violet-400"></span>
          <span>本课成果里程碑</span>
        </div>

        <div class="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 space-y-4">
          <div
            v-for="(item, idx) in deliverables"
            :key="item"
            class="flex items-start gap-3.5 group"
          >
            <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-950 border border-indigo-800 text-indigo-400 mt-0.5">
              <span class="text-[9px] font-black">{{ idx + 1 }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-xs font-bold leading-6 text-slate-300 group-hover:text-slate-200 transition">{{ item }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3: Homework Submissions and AI Feedback -->
      <section class="space-y-4">
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 flex items-center gap-2">
          <span class="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
          <span>作业提报与即时评测</span>
        </div>

        <div v-if="loading" class="py-16 text-center text-slate-500 bg-slate-900/20 rounded-3xl border border-slate-900">
          <div class="relative flex h-10 w-10 mx-auto items-center justify-center mb-4">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-indigo-500 opacity-75"></span>
            <i class="fas fa-satellite-dish text-indigo-400 text-lg relative"></i>
          </div>
          <p class="text-[10px] font-black tracking-widest text-slate-400 uppercase">Synchronizing with teacher server...</p>
        </div>

        <div v-else-if="!assignments?.length" class="py-16 text-center text-slate-500 bg-slate-900/20 rounded-3xl border border-slate-900">
          <i class="fas fa-award text-3xl mb-4 text-slate-700"></i>
          <p class="text-xs font-bold text-slate-400 tracking-wider">本节课不需要提交电子作业</p>
        </div>

        <div v-else class="space-y-6">
          <div
            v-for="assignment in assignments"
            :key="assignment.id"
            class="rounded-3xl border border-slate-900 bg-slate-900/20 p-6 space-y-5"
          >
            <!-- Assignment meta -->
            <div class="flex flex-col gap-2.5 pb-4 border-b border-slate-900/80">
              <div class="flex items-start justify-between gap-4">
                <h4 class="text-sm font-black text-white leading-snug">{{ assignment.title }}</h4>
                <span
                  class="rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-wider shadow shrink-0"
                  :class="submissionStatusClass(assignment.id)"
                >
                  {{ submissionStatusText(assignment.id) }}
                </span>
              </div>
              <p class="text-[11px] leading-relaxed text-slate-400">{{ assignment.requirements || assignment.description }}</p>
            </div>

            <!-- Submission Form -->
            <form @submit.prevent="$emit('submit', assignment)" class="space-y-4">
              <div class="space-y-1">
                <label class="block text-[8px] font-black text-slate-500 uppercase tracking-widest pl-1">Submission Notes / Code</label>
                <textarea
                  v-model="drafts[assignment.id].content"
                  rows="4"
                  class="w-full rounded-2xl border border-slate-900 bg-slate-950 p-4 text-xs font-medium text-slate-200 placeholder-slate-600 shadow-inner focus:border-indigo-500/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 transition-all duration-300"
                  placeholder="在此填写你的论文阅读总结、研究说明、或实验代码..."
                ></textarea>
              </div>

              <div class="space-y-1">
                <label class="block text-[8px] font-black text-slate-500 uppercase tracking-widest pl-1">Project Link (GitHub / Gitee)</label>
                <input
                  v-model="drafts[assignment.id].link"
                  class="w-full rounded-2xl border border-slate-900 bg-slate-950 px-4 py-3.5 text-xs font-medium text-slate-200 placeholder-slate-600 shadow-inner focus:border-indigo-500/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 transition-all duration-300"
                  placeholder="项目链接，须以 http(s) 开头"
                />
              </div>

              <div class="space-y-1">
                <label class="block text-[8px] font-black text-slate-500 uppercase tracking-widest pl-1">Attachment description</label>
                <input
                  v-model="drafts[assignment.id].attachmentNote"
                  class="w-full rounded-2xl border border-slate-900 bg-slate-950 px-4 py-3.5 text-xs font-medium text-slate-200 placeholder-slate-600 shadow-inner focus:border-indigo-500/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 transition-all duration-300"
                  placeholder="如有附件，请注明（如：已提交PDF讲义在教师台）"
                />
              </div>
              
              <button
                type="submit"
                class="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 py-3.5 text-xs font-black text-white transition-all duration-300 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-98"
              >
                <i class="fas fa-bolt mr-2"></i>
                {{ hasSubmission(assignment.id) ? '更新提报 & 重新即时评测' : '确认提报并开启 AI 评测' }}
              </button>
            </form>

            <!-- Holographic/Glowing AI Assistant Feedback Card -->
            <div
              v-if="hasSubmission(assignment.id) && getSubmission(assignment.id).feedback"
              class="relative rounded-3xl p-5 border overflow-hidden"
              :class="getSubmission(assignment.id).reviewed_by === 'AI_Assistant'
                ? 'bg-gradient-to-br from-indigo-950/80 to-slate-950 border-indigo-500/30 shadow-[0_4px_30px_rgba(99,102,241,0.06)]'
                : 'bg-slate-900/60 border-slate-800'"
            >
              <!-- Cyber corner highlights -->
              <div v-if="getSubmission(assignment.id).reviewed_by === 'AI_Assistant'" class="absolute top-0 right-0 h-10 w-10 pointer-events-none">
                <div class="absolute top-0 right-0 h-[2px] w-4 bg-indigo-400"></div>
                <div class="absolute top-0 right-0 h-4 w-[2px] bg-indigo-400"></div>
              </div>

              <div class="flex items-center gap-3.5 mb-4.5">
                <!-- Glowing avatar wrapper -->
                <div
                  class="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md relative"
                  :class="getSubmission(assignment.id).reviewed_by === 'AI_Assistant' ? 'bg-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-slate-800'"
                >
                  <i class="fas text-sm" :class="getSubmission(assignment.id).reviewed_by === 'AI_Assistant' ? 'fa-robot' : 'fa-graduation-cap'"></i>
                </div>
                <div>
                  <div class="text-xs font-black text-white uppercase tracking-wider leading-none">
                    {{ getSubmission(assignment.id).reviewed_by === 'AI_Assistant' ? 'AI 伴读小破的反馈报告' : '教师反馈报告' }}
                  </div>
                  <div class="mt-1.5 text-[8px] font-black text-indigo-400 uppercase tracking-[0.16em] leading-none">
                    System Auto Evaluation
                  </div>
                </div>
              </div>
              
              <p class="text-xs font-bold leading-7 text-slate-200 whitespace-pre-line border-t border-slate-900 pt-4 mt-3">
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
  if (!sub.id) return '未提报';
  if (sub.status === 'reviewed') return 'AI 已评测';
  if (sub.status === 'submitted') return '已提报';
  return sub.status || '已提报';
}

function submissionStatusClass(assignmentId) {
  const sub = getSubmission(assignmentId);
  if (!sub.id) return 'bg-slate-900 text-slate-500 border border-slate-800';
  if (sub.status === 'reviewed') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
  return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25';
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
  if (/\.py$/i.test(path) || /\.ipynb$/i.test(path)) return 'bg-yellow-500/10 border border-yellow-500/20';
  if (/\.pptx?$/i.test(path)) return 'bg-orange-500/10 border border-orange-500/20';
  if (/\.pdf$/i.test(path)) return 'bg-rose-500/10 border border-rose-500/20';
  return 'bg-indigo-500/10 border border-indigo-500/20';
}

function iconTextClass(material) {
  const path = String(material?.path || '').toLowerCase();
  if (/\.py$/i.test(path) || /\.ipynb$/i.test(path)) return 'text-yellow-400';
  if (/\.pptx?$/i.test(path)) return 'text-orange-400';
  if (/\.pdf$/i.test(path)) return 'text-rose-400';
  return 'text-indigo-400';
}
</script>

<style scoped>
/* Custom scrollbar to keep it sleek */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #1e293b;
  border-radius: 9999px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #334155;
}
</style>

<template>
  <div class="flex xl:h-[calc(100vh-92px)] flex-col border-l border-slate-200/60 bg-slate-50/70 text-slate-800 xl:w-[25%] xl:min-w-[320px] xl:max-w-[400px] shrink-0 overflow-hidden relative backdrop-blur-md">
    
    <!-- Top Indigo Highlight Accent -->
    <div class="h-[3px] w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

    <!-- Header Panel (Frosted glass integrated) -->
    <div class="flex h-20 items-center justify-between bg-white/80 px-6 border-b border-slate-200/80 backdrop-blur-md shrink-0">
      <div class="flex items-center gap-3">
        <div class="flex gap-1.5">
          <div class="h-2.5 w-2.5 rounded-full bg-rose-400/80 animate-pulse"></div>
          <div class="h-2.5 w-2.5 rounded-full bg-amber-400/80"></div>
          <div class="h-2.5 w-2.5 rounded-full bg-emerald-400/80"></div>
        </div>
        <div>
          <span class="text-xs font-black uppercase tracking-[0.24em] text-slate-800">Mission Control</span>
          <span class="block text-[8px] font-black tracking-widest text-indigo-500 uppercase mt-0.5">交付与评测中心</span>
        </div>
      </div>
      <div class="rounded-full bg-indigo-50/80 px-3 py-1 text-[9px] font-black tracking-wider text-indigo-655 border border-indigo-150/40">
        AI 助教已就绪
      </div>
    </div>

    <!-- Panel Content Area -->
    <div class="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
      
      <!-- Progress Indicator -->
      <section v-if="assignments?.length" class="bg-white/95 rounded-2.5xl border border-slate-200/50 p-4.5 shadow-sm">
        <div class="flex justify-between items-center mb-2.5">
          <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">本课工程里程碑进度</span>
          <span class="text-xs font-black text-indigo-600">{{ submittedCount }}/{{ assignments.length }} 已完成交付</span>
        </div>
        <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
            :style="{ width: `${(submittedCount / assignments.length) * 100}%` }"
          ></div>
        </div>
      </section>

      <!-- Section 1: Core Deliverables Checklist (Milestones vertical timeline) -->
      <section v-if="assignments?.length" class="space-y-3">
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-450 flex items-center gap-2 pl-1">
          <i class="fas fa-cubes-stacked text-indigo-500"></i>
          <span>本课工程里程碑</span>
        </div>

        <div class="relative pl-6 space-y-5.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
          <div
            v-for="(assignment, idx) in assignments"
            :key="assignment.id"
            class="relative flex flex-col group cursor-pointer"
            @click="openAssignmentDrawer(assignment.id)"
          >
            <!-- Timeline Indicator Node -->
            <div
              class="absolute -left-[21px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all duration-300"
              :class="hasSubmission(assignment.id) 
                ? 'bg-indigo-600 border-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.4)]' 
                : 'bg-white border-slate-300 group-hover:border-indigo-400'"
            >
              <div v-if="hasSubmission(assignment.id)" class="h-1.5 w-1.5 rounded-full bg-white"></div>
            </div>

            <!-- Content details -->
            <div class="bg-white rounded-2xl border border-slate-200/50 p-4 transition-all duration-300 hover:shadow-md hover:border-indigo-300/80">
              <div class="flex items-start justify-between gap-3">
                <span
                  class="text-xs font-bold leading-normal transition-all duration-200 truncate pr-1"
                  :class="hasSubmission(assignment.id) ? 'text-slate-400 line-through font-medium' : 'text-slate-700 font-bold group-hover:text-indigo-650'"
                >
                  {{ idx + 1 }}. {{ assignment.title }}
                </span>
                
                <!-- Status Badge -->
                <span
                  class="rounded-full px-2 py-0.5 text-[8px] font-black tracking-wide shrink-0 transition border uppercase"
                  :class="getMilestoneBadgeClass(assignment.id)"
                >
                  {{ getMilestoneBadgeLabel(assignment.id) }}
                </span>
              </div>
              <p class="text-[10px] font-medium text-slate-400 mt-2 line-clamp-1">
                {{ assignment.requirements || assignment.description }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Lesson Materials & Files (Downloads) -->
      <section v-if="materials?.length" class="space-y-3">
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-455 flex items-center gap-2 pl-1">
          <i class="fas fa-folder-open text-indigo-500"></i>
          <span>配套课程资料</span>
        </div>

        <div class="flex flex-col gap-2.5">
          <a
            v-for="material in materials"
            :key="material.id"
            :href="material.downloadUrl"
            target="_blank"
            class="group flex items-center justify-between rounded-xl border border-slate-200/50 bg-white/70 px-4 py-3 shadow-sm transition hover:bg-white hover:border-indigo-350 hover:shadow-md"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition duration-300 group-hover:scale-105" :class="iconBgClass(material)">
                <i class="fas text-xs" :class="[materialIcon(material), iconTextClass(material)]"></i>
              </div>
              <span class="text-xs font-bold text-slate-650 group-hover:text-indigo-600 transition truncate leading-none pt-0.5">
                {{ material.title }}
              </span>
            </div>
            <i class="fas fa-chevron-down text-[9px] text-slate-350 group-hover:text-indigo-600 group-hover:translate-y-0.5 transition duration-300"></i>
          </a>
        </div>
      </section>

      <!-- Section 3: Homework Submissions Summary list -->
      <section class="space-y-3">
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-450 flex items-center gap-2 pl-1">
          <i class="fas fa-laptop-code text-indigo-500"></i>
          <span>本课成果交付区</span>
        </div>

        <div v-if="loading" class="py-10 text-center text-slate-400 bg-white rounded-2.5xl border border-slate-200/50 shadow-sm">
          <i class="fas fa-spinner fa-spin text-lg mb-1.5 text-indigo-500"></i>
          <p class="text-[9px] font-black tracking-widest text-slate-400 uppercase">Synchronizing with system...</p>
        </div>

        <div v-else-if="!assignments?.length" class="py-10 text-center text-slate-400 bg-white rounded-2.5xl border border-slate-200/50 shadow-sm">
          <i class="fas fa-award text-xl mb-1.5 text-slate-300"></i>
          <p class="text-xs font-bold text-slate-400 tracking-wider">本课无需提交电子作业</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(assignment, idx) in assignments"
            :key="assignment.id"
            class="bg-white rounded-2.5xl border border-slate-200/50 p-4 shadow-sm space-y-3.5 hover:border-indigo-200 transition duration-300"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h4 class="text-xs font-black text-slate-750 line-clamp-1 leading-normal">{{ assignment.title }}</h4>
                <p class="text-[9px] text-slate-400 mt-1">成果任务 {{ idx + 1 }}</p>
              </div>
              <span
                class="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider shrink-0"
                :class="submissionStatusClass(assignment.id)"
              >
                {{ submissionStatusText(assignment.id) }}
              </span>
            </div>

            <button
              @click="openAssignmentDrawer(assignment.id)"
              class="w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black transition-all"
              :class="hasSubmission(assignment.id) 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-650' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10'"
            >
              <i class="fas" :class="hasSubmission(assignment.id) ? 'fa-magnifying-glass-chart' : 'fa-bolt-lightning'"></i>
              {{ hasSubmission(assignment.id) ? '查看我的提交与AI评测' : '去交付本课成果' }}
            </button>
          </div>
        </div>
      </section>

    </div>

    <!-- FIXED DRAWERS AND SLIDE-OVERS -->
    <Teleport to="body">
      <!-- Backdrop with blur -->
      <Transition name="fade">
        <div
          v-if="drawerOpen"
          class="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          @click="closeDrawer"
        ></div>
      </Transition>

      <!-- Workbench drawer slide-out -->
      <Transition name="slide-over">
        <div
          v-if="drawerOpen && activeAssignment"
          class="fixed bottom-0 right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl border-l border-slate-200/80"
        >
          <!-- Drawer Header -->
          <div class="flex h-20 items-center justify-between border-b border-slate-150 px-6.5 bg-slate-50/60 shrink-0">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
                <i class="fas fa-terminal text-sm"></i>
              </div>
              <div>
                <h3 class="text-sm font-black text-slate-800 leading-none">工程成果交付台</h3>
                <span class="block text-[8px] font-black tracking-widest text-indigo-500 uppercase mt-1.5">Deliverable Workbench</span>
              </div>
            </div>
            <button
              @click="closeDrawer"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-650 hover:shadow-sm transition"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Drawer Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Assignment Info Section -->
            <div class="bg-indigo-50/20 rounded-2.5xl border border-indigo-100/50 p-5 space-y-2">
              <div class="flex items-center justify-between gap-3">
                <h4 class="text-xs font-black text-indigo-850">{{ activeAssignment.title }}</h4>
                <span
                  class="rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider shrink-0 border"
                  :class="submissionStatusClass(activeAssignment.id)"
                >
                  {{ submissionStatusText(activeAssignment.id) }}
                </span>
              </div>
              <p class="text-[11px] leading-relaxed text-indigo-700/80 whitespace-pre-line">{{ activeAssignment.requirements || activeAssignment.description }}</p>
            </div>

            <!-- Form Content -->
            <form @submit.prevent="handleSubmit" class="space-y-5">
              <div class="space-y-2">
                <div class="flex items-center justify-between pl-1">
                  <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    成果心得 / 实验代码段
                  </label>
                  <span class="text-[9px] font-bold text-slate-400">支持 Markdown 与 Python 代码</span>
                </div>
                <textarea
                  v-model="drafts[activeAssignment.id].content"
                  rows="10"
                  class="w-full rounded-2.5xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-mono leading-relaxed text-slate-700 placeholder-slate-400 shadow-inner focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="请输入你的实践观察、核心代码、发现的问题或者反思体会..."
                ></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">作品链接（GitHub / 演示）</label>
                  <input
                    v-model="drafts[activeAssignment.id].link"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-xs font-medium text-slate-700 placeholder-slate-400 shadow-inner focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                    placeholder="https://..."
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">附件说明 / 备注</label>
                  <input
                    v-model="drafts[activeAssignment.id].attachmentNote"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-3 text-xs font-medium text-slate-700 placeholder-slate-400 shadow-inner focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                    placeholder="如：已在纸质作业本完成制图"
                  />
                </div>
              </div>

              <button
                type="submit"
                class="w-full inline-flex items-center justify-center gap-2 rounded-2.5xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 py-3.5 text-xs font-black text-white transition-all shadow-lg shadow-indigo-600/15 active:scale-98"
              >
                <i class="fas fa-paper-plane"></i>
                {{ hasSubmission(activeAssignment.id) ? '重新提交并获取最新评测' : '正式提交成果并激活 AI 评测' }}
              </button>
            </form>

            <!-- Premium AI Feedback bubble -->
            <Transition name="fade-slide">
              <div
                v-if="hasSubmission(activeAssignment.id) && getSubmission(activeAssignment.id).feedback"
                class="relative rounded-2.5xl p-5.5 border bg-gradient-to-br from-indigo-50/30 to-purple-50/20 border-indigo-100 shadow-md shadow-indigo-500/5"
              >
                <!-- Decorative grid pattern -->
                <div class="absolute top-0 right-0 h-10 w-10 pointer-events-none">
                  <div class="absolute top-0 right-0 h-[2px] w-4 bg-indigo-400/50"></div>
                  <div class="absolute top-0 right-0 h-4 w-[2px] bg-indigo-400/50"></div>
                </div>

                <div class="flex items-center gap-3.5 mb-4 pb-3.5 border-b border-indigo-100">
                  <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
                    <i class="fas fa-robot text-xs animate-pulse"></i>
                  </div>
                  <div>
                    <div class="text-xs font-black text-slate-800 uppercase tracking-wider leading-none">
                      {{ getSubmission(activeAssignment.id).reviewed_by === 'AI_Assistant' ? 'AI 助教小破的评测报告' : '教师评价' }}
                    </div>
                    <div class="mt-1.5 text-[8px] font-black text-indigo-500 uppercase tracking-[0.16em] leading-none">
                      Interactive Evaluation
                    </div>
                  </div>
                </div>
                
                <p class="text-xs font-bold leading-7 text-slate-655 whitespace-pre-line pl-1">
                  {{ getSubmission(activeAssignment.id).feedback }}
                </p>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  materials: {
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

const emit = defineEmits(['submit']);

// Drawer States
const drawerOpen = ref(false);
const activeAssignmentId = ref(null);

const activeAssignment = computed(() => {
  return props.assignments.find(a => a.id === activeAssignmentId.value) || null;
});

const submittedCount = computed(() => {
  return props.assignments.filter(a => hasSubmission(a.id)).length;
});

function openAssignmentDrawer(assignmentId) {
  activeAssignmentId.value = assignmentId;
  drawerOpen.value = true;
}

function closeDrawer() {
  drawerOpen.value = false;
  activeAssignmentId.value = null;
}

function handleSubmit() {
  if (activeAssignment.value) {
    emit('submit', activeAssignment.value);
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
  if (!sub.id) return '未交付';
  if (sub.status === 'reviewed') return '已验证';
  if (sub.status === 'submitted') return '已提交';
  return sub.status || '已提交';
}

function submissionStatusClass(assignmentId) {
  const sub = getSubmission(assignmentId);
  if (!sub.id) return 'bg-slate-100 text-slate-400 border border-slate-200/60';
  if (sub.status === 'reviewed') return 'bg-emerald-50 text-emerald-600 border border-emerald-150';
  return 'bg-indigo-50 text-indigo-600 border border-indigo-150';
}

function getMilestoneBadgeClass(assignmentId) {
  const sub = getSubmission(assignmentId);
  if (!sub.id) return 'bg-slate-50 text-slate-400 border-slate-200/40';
  if (sub.status === 'reviewed') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  return 'bg-indigo-50 text-indigo-600 border-indigo-100';
}

function getMilestoneBadgeLabel(assignmentId) {
  const sub = getSubmission(assignmentId);
  if (!sub.id) return '未交付';
  if (sub.status === 'reviewed') return '已验证';
  return '已提交';
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

defineExpose({
  openAssignmentDrawer
});
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

/* Slide-over Drawer Animations */
.slide-over-enter-active,
.slide-over-leave-active {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-over-enter-from,
.slide-over-leave-to {
  transform: translateX(100%);
}

/* Fade Overlay Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Fade Slide Up Feedback Bubble */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease-out;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>

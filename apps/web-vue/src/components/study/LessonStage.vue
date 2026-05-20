<template>
  <div class="space-y-12">
    <!-- Header Area (Title + Description + Materials) -->
    <header class="rounded-[36px] bg-white p-8 lg:p-12 shadow-sm border border-slate-200">
      <div class="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-indigo-500">
        <span class="h-2 w-2 rounded-full bg-indigo-500"></span>
        LESSON OVERVIEW
      </div>
      <h1 class="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-950 lg:text-5xl">{{ lessonTitle }}</h1>
      <p v-if="lessonDescription" class="mt-6 text-xl font-medium leading-9 text-slate-600">{{ lessonDescription }}</p>
    </header>

    <!-- Main Content Flow (Phases) -->
    <div v-if="!phases?.length" class="rounded-[36px] bg-slate-100 py-32 text-center text-slate-400 border border-slate-200/60 shadow-inner">
      <i class="fas fa-hammer text-4xl"></i>
      <p class="mt-4 text-sm font-bold tracking-widest">内容正在整理中</p>
    </div>

    <div v-else class="space-y-12">
      <section v-for="(phase, index) in phases" :key="phase.id || index" class="rounded-[36px] bg-white shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden">
        
        <!-- Phase Header -->
        <div class="border-b border-slate-100 bg-slate-50/50 px-8 py-6 lg:px-12">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-black text-slate-900">{{ phase.title }}</h2>
            <div v-if="phase.duration" class="rounded-full bg-white px-4 py-1.5 text-xs font-black text-slate-500 shadow-sm border border-slate-200">
              {{ phase.duration }} min
            </div>
          </div>
        </div>

        <!-- Phase Content (Knowledge / Text) -->
        <div class="px-8 py-10 lg:px-12">
          <article v-if="phase.student?.content" class="slide-prose" v-html="phase.student.content"></article>

          <!-- Code Prompts -->
          <div v-if="phase.student?.prompts?.length" class="mt-10 space-y-6">
            <div v-for="(prompt, pIndex) in phase.student.prompts" :key="pIndex" class="relative overflow-hidden rounded-2xl bg-slate-950 p-6 shadow-2xl">
              <div class="flex items-center gap-3 mb-4">
                <div class="flex gap-1.5">
                  <div class="h-3 w-3 rounded-full bg-rose-500"></div>
                  <div class="h-3 w-3 rounded-full bg-amber-500"></div>
                  <div class="h-3 w-3 rounded-full bg-emerald-500"></div>
                </div>
                <div class="text-[10px] font-black uppercase tracking-widest text-slate-500">{{ prompt.label || 'Prompt' }}</div>
              </div>
              <pre class="whitespace-pre-wrap font-mono text-sm leading-7 text-emerald-400 selection:bg-emerald-500/30">{{ prompt.text }}</pre>
            </div>
          </div>

          <!-- Tasks / Activities -->
          <div v-if="phase.student?.tasks?.length" class="mt-10 rounded-[28px] border border-sky-100 bg-sky-50 p-8">
            <div class="text-[11px] font-black uppercase tracking-[0.24em] text-sky-600 mb-6">Activity Tasks</div>
            <div class="space-y-4">
              <div
                v-for="(task, tIndex) in phase.student.tasks"
                :key="tIndex"
                class="flex items-start gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm"
              >
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-black text-sky-600">
                  {{ tIndex + 1 }}
                </div>
                <div class="slide-prose pt-0.5 text-sm font-bold leading-7 text-slate-700" v-html="task"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Summary End Mark -->
    <div v-if="phases?.length" class="flex justify-center pt-8 pb-10">
      <button 
        class="inline-flex items-center gap-3 rounded-full bg-emerald-500 px-10 py-5 text-sm font-black tracking-widest text-white shadow-xl shadow-emerald-500/30 transition hover:-translate-y-1 hover:bg-emerald-600 hover:shadow-2xl hover:shadow-emerald-500/40"
        @click="scrollToAssignments"
      >
        <i class="fas fa-rocket"></i>
        我已经完成了上述内容，去交作业！
      </button>
    </div>

  </div>
</template>

<script setup>
defineProps({
  lessonTitle: {
    type: String,
    default: ''
  },
  lessonDescription: {
    type: String,
    default: ''
  },
  phases: {
    type: Array,
    default: () => []
  },
  materials: {
    type: Array,
    default: () => []
  },
  deliverables: {
    type: Array,
    default: () => []
  }
});

function materialIcon(material) {
  const kind = String(material?.kind || '').toLowerCase();
  const path = String(material?.path || '').toLowerCase();
  if (kind === 'presentation' || /\.pptx?$/i.test(path)) return 'fa-file-powerpoint';
  if (kind === 'video' || /\.mp4$/i.test(path)) return 'fa-file-video';
  if (kind === 'html') return 'fa-file-code';
  if (/\.md$/i.test(path)) return 'fa-file-lines';
  return 'fa-file';
}

function scrollToAssignments() {
  const el = document.getElementById('lesson-assignments');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    el.classList.add('ring-4', 'ring-emerald-500/50', 'ring-offset-4', 'transition-all', 'duration-500');
    setTimeout(() => {
      el.classList.remove('ring-4', 'ring-emerald-500/50', 'ring-offset-4');
    }, 1500);
  }
}
</script>

<style scoped>
.slide-prose :deep(p) {
  @apply text-lg font-medium leading-9 text-slate-700;
}

.slide-prose :deep(p + p) {
  @apply mt-5;
}

.slide-prose :deep(strong) {
  @apply font-black text-slate-950;
}

.slide-prose :deep(ul) {
  @apply mt-4 space-y-2 text-lg font-medium leading-8 text-slate-700 list-disc pl-5;
}

.slide-prose :deep(code) {
  @apply rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.85em] font-black text-pink-600;
}

.slide-prose :deep(pre) {
  @apply relative mt-8 mb-8 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 px-6 pb-6 pt-14 text-sm font-medium leading-relaxed text-emerald-400 shadow-xl shadow-slate-900/20;
}

.slide-prose :deep(pre::before) {
  content: '';
  display: block;
  position: absolute;
  top: 18px;
  left: 20px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff5f56;
  box-shadow: 20px 0 0 #ffbd2e, 40px 0 0 #27c93f;
}

.slide-prose :deep(pre code) {
  @apply bg-transparent p-0 text-emerald-400 font-medium;
}
</style>

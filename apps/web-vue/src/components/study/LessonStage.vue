<template>
  <div class="space-y-12">
    <!-- Header Area (Title + Description + Materials) -->
    <header class="rounded-3xl bg-white p-6 lg:p-8 shadow-sm border border-slate-200">
      <div class="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-[10px] font-black uppercase text-teal-700 border border-teal-100">
        <span class="size-2 rounded-full bg-teal-700"></span>
        LESSON OVERVIEW
      </div>
      <h1 class="mt-4 text-3xl font-extrabold leading-tight text-slate-950 lg:text-4xl">{{ lessonTitle }}</h1>
      <p v-if="lessonDescription" class="mt-4 text-base font-medium leading-7 text-slate-600">{{ lessonDescription }}</p>
    </header>

    <!-- Main Content Flow (Phases) -->
    <div v-if="!phases?.length" class="rounded-3xl bg-slate-100 py-24 text-center text-slate-400 border border-slate-200/60 shadow-inner">
      <i class="fas fa-hammer text-3xl"></i>
      <p class="mt-3 text-xs font-bold">内容正在整理中</p>
    </div>

    <div v-else class="space-y-8">
      <section v-for="(phase, index) in phases" :key="phase.id || index" class="rounded-3xl bg-white shadow-md border border-slate-200 overflow-hidden">
        
        <!-- Phase Header -->
        <div class="border-b border-slate-100 bg-slate-50/50 px-6 py-4 lg:px-8">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-slate-900">{{ phase.title }}</h2>
            <div v-if="phase.duration" class="rounded-full bg-white px-3.5 py-1 text-xs font-bold text-slate-500 shadow-sm border border-slate-200">
              {{ phase.duration }} min
            </div>
          </div>
        </div>

        <!-- Phase Content (Knowledge / Text) -->
        <div class="px-6 py-8 lg:px-8">
          <article v-if="phase.student?.content" class="slide-prose markdown-premium" v-html="safeHtml(phase.student.content)"></article>

          <div v-if="phase.student?.resources?.length" class="mt-8 rounded-[28px] border border-amber-100 bg-amber-50/80 p-7">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                <i class="fas fa-bolt"></i>
              </div>
              <div>
                <div class="text-[10px] font-black uppercase text-amber-700">Crash Course</div>
                <div class="text-sm font-bold text-slate-900">和当前知识点直接对应的速学资源</div>
              </div>
            </div>

            <div class="mt-5 grid gap-3">
              <a
                v-for="(resource, resourceIndex) in phase.student.resources"
                :key="`${phase.id || index}-resource-${resourceIndex}`"
                :href="resource.url"
                target="_blank"
                rel="noreferrer"
                class="flex items-start justify-between gap-4 rounded-2xl border border-amber-100 bg-white px-5 py-4 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/40"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-2 text-[10px] font-black uppercase text-amber-700">
                    <span>{{ resource.provider || '外部视频' }}</span>
                    <span v-if="resource.tag" class="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] text-amber-800">{{ resource.tag }}</span>
                  </div>
                  <div class="mt-2 text-sm font-black leading-6 text-slate-900">{{ resource.title }}</div>
                  <p v-if="resource.note" class="mt-2 text-sm font-medium leading-6 text-slate-600">{{ resource.note }}</p>
                </div>
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <i class="fas fa-arrow-up-right-from-square text-sm"></i>
                </div>
              </a>
            </div>
          </div>

          <!-- Code Prompts -->
          <div v-if="phase.student?.prompts?.length" class="mt-10 space-y-6">
            <div v-for="(prompt, pIndex) in phase.student.prompts" :key="pIndex" class="relative overflow-hidden rounded-2xl bg-slate-950 p-6 shadow-2xl group/prompt">
              <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div class="flex items-center gap-3">
                  <div class="flex gap-1.5">
                    <div class="h-3 w-3 rounded-full bg-rose-500"></div>
                    <div class="h-3 w-3 rounded-full bg-amber-500"></div>
                    <div class="h-3 w-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <div class="text-[10px] font-mono font-black uppercase text-slate-400">{{ prompt.label || 'Prompt' }}</div>
                </div>
                <button 
                  @click="copyPrompt(prompt.text, pIndex)" 
                  class="text-[10px] font-black flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors"
                  :class="copiedIndex === pIndex ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5' : 'text-slate-400 hover:text-emerald-400'"
                >
                  <i class="fas" :class="copiedIndex === pIndex ? 'fa-check' : 'fa-copy'"></i>
                  <span>{{ copiedIndex === pIndex ? '已复制' : '复制提示词' }}</span>
                </button>
              </div>
              <pre class="whitespace-pre-wrap font-mono text-xs leading-6 text-emerald-400 selection:bg-emerald-500/30 pr-2">{{ prompt.text }}</pre>
            </div>
          </div>

          <!-- Tasks / Activities -->
          <div v-if="phase.student?.tasks?.length" class="mt-8 rounded-2.5xl border border-teal-100 bg-teal-50/50 p-6">
            <div class="text-[10px] font-extrabold uppercase tracking-wide text-teal-700 mb-4">Activity Tasks</div>
            <div class="space-y-3">
              <div
                v-for="(task, tIndex) in phase.student.tasks"
                :key="tIndex"
                class="flex items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-sm border border-slate-100"
              >
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[11px] font-extrabold text-teal-700">
                  {{ tIndex + 1 }}
                </div>
                <div class="slide-prose pt-0.5 text-xs font-semibold leading-6 text-slate-700" v-html="safeHtml(task)"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Summary End Mark -->
    <div v-if="phases?.length" class="flex justify-center pt-8 pb-10">
      <button 
        class="inline-flex items-center gap-3 rounded-full bg-teal-700 px-10 py-5 text-sm font-black text-white shadow-sm transition-colors hover:bg-teal-800"
        @click="$emit('focus-submission')"
      >
        <i class="fas fa-paper-plane"></i>
        我已完成全部学习，去交作业！
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { safeHtml } from '../../utils/safeHtml.js';

const props = defineProps({
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
  }
});

const emit = defineEmits(['focus-submission']);

const copiedIndex = ref(null);
async function copyPrompt(text, index) {
  try {
    await navigator.clipboard.writeText(text || '');
    copiedIndex.value = index;
    setTimeout(() => {
      if (copiedIndex.value === index) {
        copiedIndex.value = null;
      }
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
}

function materialIcon(material) {
  const kind = String(material?.kind || '').toLowerCase();
  const path = String(material?.path || '').toLowerCase();
  if (kind === 'presentation' || /\.pptx?$/i.test(path)) return 'fa-file-powerpoint';
  if (kind === 'video' || /\.mp4$/i.test(path)) return 'fa-file-video';
  if (kind === 'image' || /\.(png|jpe?g|gif|webp|svg)$/i.test(path)) return 'fa-file-image';
  if (kind === 'html') return 'fa-file-code';
  if (kind === 'notebook' || /\.ipynb$/i.test(path)) return 'fa-book-open';
  if (kind === 'json' || /\.json$/i.test(path)) return 'fa-brackets-curly';
  if (kind === 'text' || /\.txt$/i.test(path)) return 'fa-file-alt';
  if (/\.py$/i.test(path)) return 'fa-file-code';
  if (/\.md$/i.test(path)) return 'fa-file-lines';
  return 'fa-file';
}
</script>

<style scoped>
.slide-prose :deep(p) {
  @apply text-base font-medium leading-7 text-slate-700;
}

.slide-prose :deep(p + p) {
  @apply mt-4;
}

.slide-prose :deep(strong) {
  @apply font-extrabold text-slate-950;
}

.slide-prose :deep(ul) {
  @apply mt-3 space-y-1.5 text-base font-medium leading-7 text-slate-700 list-disc pl-5;
}

.slide-prose :deep(code) {
  @apply rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.85em] font-bold text-pink-600;
}

.slide-prose :deep(pre) {
  @apply relative mt-6 mb-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 px-5 pb-5 pt-12 text-[13px] font-medium leading-relaxed text-emerald-400 shadow-lg shadow-slate-900/10;
}

.slide-prose :deep(pre::before) {
  content: '';
  display: block;
  position: absolute;
  top: 14px;
  left: 18px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff5f56;
  box-shadow: 16px 0 0 #ffbd2e, 32px 0 0 #27c93f;
}

.slide-prose :deep(pre code) {
  @apply bg-transparent p-0 text-emerald-400 font-medium;
}
</style>

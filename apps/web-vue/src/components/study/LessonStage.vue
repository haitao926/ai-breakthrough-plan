<template>
  <section class="overflow-hidden rounded-[36px] border border-slate-200 bg-slate-950 p-3 shadow-2xl shadow-indigo-500/10">
    <div class="relative aspect-video overflow-hidden rounded-[28px] bg-white">
      <div class="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 px-8 py-6">
        <div class="inline-flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white">
          <span class="h-2 w-2 rounded-full" :class="activeSlideDotClass"></span>
          {{ slide?.typeLabel || '学习页' }}
        </div>
        <div class="rounded-full bg-white/85 px-4 py-2 text-xs font-black text-slate-500 shadow-sm">
          {{ currentIndex + 1 }} / {{ total || 1 }}
        </div>
      </div>

      <div v-if="slide" class="flex h-full flex-col justify-center px-10 pb-10 pt-24 lg:px-14">
        <template v-if="slide.type === 'overview'">
          <div class="max-w-4xl">
            <div class="text-[11px] font-black uppercase tracking-[0.28em] text-indigo-500">Lesson Overview</div>
            <h2 class="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 lg:text-4xl">{{ slide.title }}</h2>
            <p class="mt-5 max-w-3xl text-lg font-medium leading-9 text-slate-600">{{ slide.description }}</p>
          </div>
          <div class="mt-8 grid gap-4 md:grid-cols-3">
            <div
              v-for="item in slide.highlights"
              :key="item"
              class="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold leading-7 text-slate-700"
            >
              {{ item }}
            </div>
          </div>
        </template>

        <template v-else-if="slide.type === 'knowledge'">
          <div class="grid h-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div class="text-[11px] font-black uppercase tracking-[0.28em] text-indigo-500">Knowledge Point</div>
              <h2 class="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 lg:text-4xl">{{ slide.title }}</h2>
              <p class="mt-5 text-base font-semibold leading-8 text-slate-500">{{ slide.unitTitle || slide.phaseTitle }}</p>
              <div v-if="slide.examples?.length" class="mt-7 flex flex-wrap gap-2">
                <span
                  v-for="example in slide.examples"
                  :key="example"
                  class="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-600"
                >
                  {{ example }}
                </span>
              </div>
            </div>
            <div class="space-y-4">
              <article class="slide-prose rounded-[28px] bg-slate-50 px-7 py-6 text-slate-700" v-html="slide.content || emptyHtml"></article>
              <div v-if="slide.misconceptions?.length" class="rounded-[24px] bg-amber-50 px-5 py-4">
                <div class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">常见误区</div>
                <ul class="mt-2 space-y-2">
                  <li v-for="item in slide.misconceptions" :key="item" class="text-sm font-bold leading-6 text-amber-900">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="slide.type === 'check'">
          <div class="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div class="text-[11px] font-black uppercase tracking-[0.28em] text-sky-500">Understanding Check</div>
              <h2 class="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 lg:text-4xl">{{ slide.title }}</h2>
              <p class="mt-5 text-lg font-semibold leading-9 text-slate-600">{{ slide.question }}</p>
            </div>
            <div class="space-y-3">
              <div
                v-for="(option, index) in slide.options"
                :key="`${slide.id}-option-${index}`"
                class="flex items-start gap-4 rounded-[22px] border px-5 py-4"
                :class="index === slide.answer ? 'border-sky-200 bg-sky-50' : 'border-slate-200 bg-white'"
              >
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">{{ optionLetter(index) }}</span>
                <span class="pt-0.5 text-base font-bold leading-8 text-slate-700">{{ option }}</span>
              </div>
              <p v-if="slide.explanation" class="rounded-2xl bg-slate-50 px-5 py-4 text-sm font-bold leading-7 text-slate-600">{{ slide.explanation }}</p>
            </div>
          </div>
        </template>

        <template v-else-if="slide.type === 'activity'">
          <div class="grid h-full gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div class="flex flex-col justify-center">
              <div class="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-500">Activity Requirement</div>
              <h2 class="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 lg:text-4xl">{{ slide.title }}</h2>
              <p class="mt-5 text-base font-semibold leading-8 text-slate-500">{{ slide.description }}</p>
              <div v-if="slide.deliverable" class="mt-8 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-800">
                产出物：{{ slide.deliverable }}
              </div>
            </div>
            <div class="flex flex-col justify-center">
              <div class="space-y-4">
                <div
                  v-for="(step, index) in slide.steps"
                  :key="`${slide.id}-step-${index}`"
                  class="flex items-start gap-4 rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-sm"
                >
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">{{ index + 1 }}</span>
                  <span class="pt-0.5 text-base font-bold leading-8 text-slate-700" v-html="step"></span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="slide.type === 'summary'">
          <div class="mx-auto max-w-4xl text-center">
            <div class="text-[11px] font-black uppercase tracking-[0.28em] text-indigo-500">Learning Summary</div>
            <h2 class="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 lg:text-4xl">{{ slide.title }}</h2>
            <p class="mt-5 text-lg font-medium leading-9 text-slate-600">{{ slide.description }}</p>
            <div class="mt-8 grid gap-4 md:grid-cols-2">
              <div
                v-for="item in slide.items"
                :key="item"
                class="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-left text-sm font-bold leading-7 text-slate-700"
              >
                {{ item }}
              </div>
            </div>
          </div>
        </template>
      </div>

      <div v-else class="flex h-full items-center justify-center text-slate-400">
        当前学习内容正在整理。
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  slide: {
    type: Object,
    default: null
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  }
});

const emptyHtml = '<p>当前内容正在整理中。</p>';

const activeSlideDotClass = computed(() => {
  if (props.slide?.type === 'activity') return 'bg-emerald-400';
  if (props.slide?.type === 'check') return 'bg-sky-400';
  if (props.slide?.type === 'summary') return 'bg-amber-400';
  return 'bg-indigo-400';
});

function optionLetter(index) {
  return String.fromCharCode(65 + index);
}
</script>

<style scoped>
.slide-prose :deep(p) {
  @apply text-lg font-semibold leading-9 text-slate-700;
}

.slide-prose :deep(p + p) {
  @apply mt-4;
}

.slide-prose :deep(strong) {
  @apply font-black text-slate-950;
}

.slide-prose :deep(ul) {
  @apply space-y-3 text-lg font-semibold leading-8 text-slate-700;
}

.slide-prose :deep(li) {
  @apply rounded-2xl bg-white px-4 py-3 shadow-sm;
}
</style>

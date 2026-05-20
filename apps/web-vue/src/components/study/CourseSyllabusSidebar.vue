<template>
  <aside class="hidden w-72 shrink-0 flex-col border-r border-slate-200/60 bg-slate-50 xl:flex">
    <div class="flex h-20 items-center border-b border-slate-200/60 px-6">
      <div class="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Course Syllabus</div>
    </div>
    
    <div class="flex-1 overflow-y-auto px-4 py-6">
      <div class="space-y-2">
        <RouterLink
          v-for="(lesson, index) in lessons"
          :key="lesson.id"
          :to="`/courses/${courseId}/lessons/${lesson.id}`"
          class="flex w-full items-start gap-3 rounded-[20px] px-3 py-3 text-left transition-all"
          :class="lesson.id === activeLessonId ? 'bg-white shadow-sm ring-1 ring-slate-200/60 text-slate-900' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'"
        >
          <div
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-[11px] font-black"
            :class="lesson.id === activeLessonId ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-200 text-slate-500'"
          >
            {{ index + 1 }}
          </div>
          <div class="min-w-0 flex-1 pt-0.5">
            <div class="line-clamp-2 text-sm font-bold leading-5" :class="lesson.id === activeLessonId ? 'text-indigo-950' : ''">{{ lesson.title }}</div>
            <div class="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]" :class="lesson.id === activeLessonId ? 'text-indigo-500' : 'text-slate-400'">
              <span>{{ lesson.duration ? `${lesson.duration} min` : 'Lesson' }}</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>

    <div class="border-t border-slate-200/60 p-6">
      <div class="rounded-[24px] border border-indigo-100 bg-white px-5 py-5 shadow-sm">
        <div class="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-500">Learning Flow</div>
        <p class="mt-3 text-xs font-medium leading-6 text-slate-500">
          顺着大纲往下读。长文档包含了所有理论和实操，读到底部即可交作业。
        </p>
      </div>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  courseId: {
    type: String,
    required: true
  },
  lessons: {
    type: Array,
    default: () => []
  },
  activeLessonId: {
    type: String,
    default: ''
  }
});
</script>

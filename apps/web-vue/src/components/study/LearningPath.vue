<template>
  <aside class="hidden w-72 shrink-0 border-r border-slate-200/60 bg-white px-6 py-8 xl:block">
    <div>
      <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">学习路径</div>
      <div class="mt-6 space-y-3">
        <button
          v-for="(slide, index) in slides"
          :key="slide.id"
          class="flex w-full items-center gap-4 rounded-[24px] px-4 py-4 text-left transition-all"
          :class="index === currentIndex ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'"
          @click="$emit('select', index)"
        >
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-black"
            :class="index === currentIndex ? 'bg-white/10 text-white' : index < currentIndex ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-slate-500'"
          >
            <i v-if="index < currentIndex" class="fas fa-check text-[10px]"></i>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="min-w-0">
            <div class="line-clamp-2 text-sm font-black leading-5">{{ slide.title }}</div>
            <div class="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]" :class="index === currentIndex ? 'text-white/60' : 'text-slate-400'">
              <span>{{ slide.typeLabel }}</span>
              <span>{{ statusLabel(index) }}</span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <div class="mt-10 rounded-[28px] border border-indigo-100 bg-indigo-50 px-5 py-6">
      <div class="text-[10px] font-black uppercase tracking-[0.24em] text-indigo-500">Learning Note</div>
      <p class="mt-3 text-sm font-medium leading-7 text-indigo-700">
        按学习路径推进：先理解知识点，再完成检查和活动，最后在右侧提交本课成果。
      </p>
    </div>
  </aside>
</template>

<script setup>
const props = defineProps({
  slides: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: 0
  }
});

defineEmits(['select']);

function statusLabel(index) {
  if (index < props.currentIndex) return '已完成';
  if (index === props.currentIndex) return '学习中';
  return '未开始';
}
</script>

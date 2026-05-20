<template>
  <aside class="space-y-8 bg-white px-6 py-8 xl:w-80 xl:shrink-0 xl:border-l xl:border-slate-200/60">
    <section>
      <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">作业提交</div>
      <div
        class="mt-5 cursor-pointer rounded-[30px] border-2 px-6 py-8 text-center transition"
        :class="homeworkDone ? 'border-emerald-200 bg-emerald-50' : 'border-indigo-100 bg-indigo-50 hover:border-indigo-300 hover:bg-white'"
        @click="$emit('trigger-homework')"
      >
        <div v-if="homeworkUploading" class="text-indigo-500">
          <i class="fas fa-spinner fa-spin text-2xl"></i>
          <div class="mt-4 text-[10px] font-black uppercase tracking-[0.2em]">正在上传</div>
        </div>
        <template v-else-if="homeworkDone">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <i class="fas fa-check"></i>
          </div>
          <div class="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">已提交</div>
          <div class="mt-3 truncate text-sm font-black text-emerald-800">{{ homeworkName }}</div>
        </template>
        <template v-else>
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
            <i class="fas fa-upload"></i>
          </div>
          <div class="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-indigo-600">提交本课成果</div>
          <div class="mt-3 text-sm font-medium leading-7 text-slate-500">上传图片、PDF、文档或代码压缩包。</div>
        </template>
      </div>
    </section>

    <section v-if="deliverables.length">
      <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">本课成果清单</div>
      <div class="mt-4 space-y-2">
        <div
          v-for="item in deliverables"
          :key="item"
          class="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-700"
        >
          {{ item }}
        </div>
      </div>
    </section>

    <section>
      <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">当前页提示</div>
      <div class="mt-4 rounded-[24px] bg-slate-50 px-5 py-5">
        <div class="text-sm font-black text-slate-900">{{ currentHint.title }}</div>
        <p class="mt-2 text-sm font-medium leading-7 text-slate-500">{{ currentHint.body }}</p>
      </div>
    </section>

    <section>
      <div class="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">核心资源</div>
      <div class="mt-6 space-y-3">
        <a
          v-for="material in materials.slice(0, 6)"
          :key="material.id"
          :href="material.downloadUrl"
          target="_blank"
          class="flex items-center gap-4 rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-4 transition hover:border-indigo-200 hover:bg-white"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500">
            <i class="fas" :class="materialIcon(material)"></i>
          </div>
          <div class="min-w-0">
            <div class="truncate text-sm font-black text-slate-900">{{ material.title }}</div>
            <div class="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{{ material.section }}</div>
          </div>
        </a>

        <div v-if="!materials.length" class="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-medium text-slate-400">
          本课暂未挂载额外资料。
        </div>
      </div>
    </section>
  </aside>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  activeSlide: {
    type: Object,
    default: null
  },
  deliverables: {
    type: Array,
    default: () => []
  },
  materials: {
    type: Array,
    default: () => []
  },
  homeworkDone: {
    type: Boolean,
    default: false
  },
  homeworkName: {
    type: String,
    default: ''
  },
  homeworkUploading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['trigger-homework']);

const currentHint = computed(() => {
  if (props.activeSlide?.type === 'knowledge') {
    return {
      title: '先理解概念',
      body: '本页只关注知识点理解。完成后进入检查或活动页，再产出成果。'
    };
  }
  if (props.activeSlide?.type === 'check') {
    return {
      title: '完成理解检查',
      body: '先判断答案，再看解释。这个检查帮助你确认是否能进入活动。'
    };
  }
  if (props.activeSlide?.type === 'activity') {
    return {
      title: '按步骤完成活动',
      body: props.activeSlide?.deliverable ? `本活动产出：${props.activeSlide.deliverable}` : '完成活动步骤后，把成果整理到本课作业中。'
    };
  }
  if (props.activeSlide?.type === 'summary') {
    return {
      title: '检查成果再提交',
      body: '对照成果清单，确认材料完整后使用上方作业提交入口。'
    };
  }
  return {
    title: '按路径学习',
    body: '跟随左侧学习路径推进，右侧始终保留作业提交和资源入口。'
  };
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
</script>

<template>
  <header class="h-[var(--header-h)] sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 flex items-center justify-between shadow-sm">
    <div class="flex-1">
      <h1 class="text-lg font-black text-slate-900 tracking-tight leading-none">{{ viewTitle }}</h1>
      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5 opacity-60">HAI Tech Lab / Workspace</p>
    </div>

    <!-- 阶段步进器 -->
    <div class="hidden lg:flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
      <div
        v-for="(phase, idx) in phases"
        :key="idx"
        class="flex items-center group"
      >
        <div 
          class="flex items-center gap-2.5 px-4 py-1.5 rounded-xl transition-all duration-500 select-none"
          :class="{ 
            'bg-white shadow-sm ring-1 ring-slate-200/50': currentPhaseIndex === idx,
            'opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100': currentPhaseIndex !== idx 
          }"
        >
          <div 
            class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border-2 transition-all duration-500"
            :class="{
              'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30': currentPhaseIndex === idx,
              'bg-emerald-500 border-emerald-500 text-white': currentPhaseIndex > idx,
              'bg-white border-slate-200 text-slate-400': currentPhaseIndex < idx
            }"
          >
            <i v-if="currentPhaseIndex > idx" class="fas fa-check"></i>
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <span class="text-xs font-black uppercase tracking-widest transition-colors"
            :class="currentPhaseIndex === idx ? 'text-slate-900' : 'text-slate-500'">
            {{ phase }}
          </span>
        </div>
        <div v-if="idx < phases.length - 1" class="w-8 h-px bg-slate-200 mx-1"></div>
      </div>
    </div>

    <div class="flex-1 flex justify-end gap-3">
      <button 
        v-if="viewMode === 'tool' && currentTool === 'inception'" 
        class="btn-primary !py-2.5 !px-5 !rounded-xl text-xs flex items-center gap-2" 
        @click="$emit('set-submission-view', 'proposal')"
      >
        <i class="fas fa-clipboard-list"></i>
        {{ proposalReady ? '提交开题报告' : '立项进度中心' }}
      </button>

      <button 
        v-if="viewMode === 'tool' && currentTool === 'charter'" 
        class="btn-primary !py-2.5 !px-5 !rounded-xl text-xs flex items-center gap-2" 
        @click="$emit('set-submission-view', 'proposal')"
      >
        <i class="fas fa-paper-plane"></i> 准备提交
      </button>

      <button 
        v-if="viewMode === 'stage' && activeStage === 'proposal'" 
        class="px-5 py-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 text-indigo-600 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2" 
        @click="$emit('set-tool-view', 'charter')"
      >
        <i class="fas fa-file-signature"></i> 返回学术画布
      </button>

      <button 
        v-if="viewMode === 'stage'" 
        class="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
        @click="$emit('clear-draft')"
      >
        清空草稿
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  viewTitle: { type: String, default: '工作台' },
  currentPhaseIndex: { type: Number, default: 0 },
  viewMode: { type: String, default: 'tool' },
  currentTool: { type: String, default: 'inception' },
  activeStage: { type: String, default: 'proposal' },
  proposalReady: { type: Boolean, default: false }
});

defineEmits(['set-submission-view', 'set-tool-view', 'clear-draft']);

const phases = ['立项策划', '实施记录', '结题答辩'];
</script>

<style scoped>
/* Scoped styles kept minimal due to Tailwind usage in premium refactor */
</style>


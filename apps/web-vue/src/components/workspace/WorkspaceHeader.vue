<template>
  <header class="h-[var(--header-h)] sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-8 flex items-center justify-between shadow-sm">
    <div class="flex-1">
      <h1 class="text-lg font-black text-slate-900 tracking-tight leading-none">{{ viewTitle }}</h1>
      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5 opacity-60">{{ workspaceLabel }}</p>
    </div>

    <div class="flex-1 flex justify-end">
      <div class="hidden lg:flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-100/70 border border-slate-200/60">
        <i class="fas fa-circle text-[8px]" :class="phaseDotClass"></i>
        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{{ phaseLabel }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { workspaceLabel } from '@/constants/brand';

import { computed } from 'vue';

const props = defineProps({
  viewTitle: { type: String, default: '工作台' },
  currentPhaseIndex: { type: Number, default: 0 },
  viewMode: { type: String, default: 'tool' },
  currentTool: { type: String, default: 'inception' },
  activeStage: { type: String, default: 'proposal' },
  proposalReady: { type: Boolean, default: false },
  nextStepLabel: { type: String, default: '' }
});

defineEmits(['set-submission-view', 'set-tool-view', 'clear-draft']);

const phaseLabel = computed(() => {
  if (props.viewMode === 'stage') {
    if (props.activeStage === 'proposal') return '立项';
    if (['milestone_1', 'midterm', 'milestone_2'].includes(props.activeStage)) return '实施';
    return '结题';
  }
  if (props.currentTool === 'implementation' || props.currentTool === 'kanban' || props.currentTool === 'devlog') {
    return '实施';
  }
  if (props.currentTool === 'inception' || props.currentTool === 'charter' || props.currentTool === 'pre_research' || props.currentTool === 'literature' || props.currentTool === 'innovation' || props.currentTool === 'architect') {
    return '立项';
  }
  return '工作台';
});

const phaseDotClass = computed(() => {
  if (phaseLabel.value === '立项') return 'text-indigo-500';
  if (phaseLabel.value === '实施') return 'text-emerald-500';
  if (phaseLabel.value === '结题') return 'text-amber-500';
  return 'text-slate-400';
});
</script>

<style scoped>
/* Scoped styles kept minimal due to Tailwind usage in premium refactor */
</style>

<template>
  <div class="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
    <transition-group 
      enter-active-class="transition duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
      enter-from-class="translate-x-full opacity-0 scale-90"
      enter-to-class="translate-x-0 opacity-100 scale-100"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-90"
    >
      <div 
        v-for="note in notifications" 
        :key="note.id"
        class="pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border min-w-[320px] max-w-md bg-white/90 backdrop-blur-xl group relative overflow-hidden"
        :class="typeClasses[note.type] || typeClasses.info"
      >
        <!-- 装饰背景 -->
        <div class="absolute inset-x-0 top-0 h-1" :class="bgClasses[note.type]"></div>
        
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" :class="iconClasses[note.type]">
          <i :class="icons[note.type] || icons.info"></i>
        </div>
        
        <div class="flex-1">
          <div class="text-[10px] font-black uppercase tracking-widest opacity-50 mb-0.5">HAI NOTIFICATION</div>
          <div class="text-xs font-bold text-slate-800 leading-relaxed">{{ note.message }}</div>
        </div>

        <button 
          @click="remove(note.id)" 
          class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-50 hover:text-slate-500 transition-all opacity-0 group-hover:opacity-100"
        >
          <i class="fas fa-times text-[10px]"></i>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useNotificationStore } from '@/stores/notification';

const store = useNotificationStore();
const { notifications } = storeToRefs(store);
const { remove } = store;

const typeClasses = {
  success: 'border-emerald-100 shadow-emerald-500/5',
  error: 'border-rose-100 shadow-rose-500/5',
  warning: 'border-amber-100 shadow-amber-500/5',
  info: 'border-indigo-100 shadow-indigo-500/5'
};

const bgClasses = {
  success: 'bg-emerald-500', error: 'bg-rose-500', warning: 'bg-amber-500', info: 'bg-indigo-600'
};

const iconClasses = {
  success: 'bg-emerald-50 text-emerald-600',
  error: 'bg-rose-50 text-rose-600',
  warning: 'bg-amber-50 text-amber-600',
  info: 'bg-indigo-50 text-indigo-600'
};

const icons = {
  success: 'fas fa-check-circle',
  error: 'fas fa-exclamation-octagon',
  warning: 'fas fa-triangle-exclamation',
  info: 'fas fa-bell'
};
</script>

<style scoped>
.cubic-bezier {
  transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
</style>

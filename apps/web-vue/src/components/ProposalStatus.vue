<template>
  <section class="status-wrap">
    <div class="status-card">
      <div class="status-card__header">
        <h3>立项完成度</h3>
        <button type="button" class="ghost" @click="$emit('refresh')">刷新状态</button>
      </div>
      <div class="progress">
        <div class="progress__bar">
          <div class="progress__fill" :style="{ width: percent + '%' }"></div>
        </div>
        <div class="progress__text">完成度 {{ percent }}%（{{ doneCount }}/{{ totalCount }}）</div>
      </div>
    </div>

    <div class="status-card">
      <div class="status-card__header">
        <h3>任务完成清单</h3>
        <span class="muted">完成即可自动生成开题</span>
      </div>
      <div class="status-list">
        <div v-for="item in items" :key="item.key" class="status-item">
          <div>
            <div class="status-item__title">
              <span class="dot" :class="item.done ? 'done' : 'pending'"></span>
              {{ item.label }}
            </div>
            <div class="status-item__desc">{{ item.desc }}</div>
            <div v-if="item.detail" class="status-item__detail" :class="item.done ? 'muted' : 'danger'">
              {{ item.detail }}
            </div>
          </div>
          <div class="status-item__meta">
            <span class="badge" :class="item.done ? 'badge--done' : 'badge--pending'">
              {{ item.done ? '已完成' : '待完成' }}
            </span>
            <a v-if="item.action" class="link" :href="item.action" target="_blank">去完成</a>
          </div>
        </div>
      </div>
      <div v-if="missing.length" class="missing">尚需完成：{{ missing.join('、') }}</div>
    </div>

    <div class="status-card">
      <div class="status-card__header">
        <h3>自动生成的 WBS</h3>
        <span class="muted">将作为看板初始任务</span>
      </div>
      <div v-if="!wbsTasks.length" class="muted">尚未完成 WBS 拆解，去 WBS 页面添加任务。</div>
      <div v-else class="wbs-list">
        <div v-for="(task, idx) in wbsTasks" :key="idx" class="wbs-item">
          <span class="pill" :class="`pill--${task.phase}`">{{ phaseLabel(task.phase) }}</span>
          <span>{{ task.title }}</span>
        </div>
      </div>
    </div>

    <div class="status-card">
      <h3>提交说明</h3>
      <div class="muted" :class="ready ? 'success' : ''">
        {{ ready ? '已满足开题条件，可提交开题报告。' : '完成清单中的必做项后即可提交开题。' }}
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  missing: { type: Array, default: () => [] },
  wbsTasks: { type: Array, default: () => [] },
  ready: { type: Boolean, default: false }
});

defineEmits(['refresh']);

const doneCount = computed(() => props.items.filter(item => item.done).length);
const totalCount = computed(() => (props.items.length ? props.items.length : 1));
const percent = computed(() => Math.round((doneCount.value / totalCount.value) * 100));

function phaseLabel(phase) {
  const map = { m1: '立项', m2: '实施', m3: '结题' };
  return map[phase] || phase;
}
</script>

<style scoped>
.status-wrap {
  display: grid;
  gap: 16px;
}
.status-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px;
}
.status-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.progress__bar {
  height: 6px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
}
.progress__fill {
  height: 100%;
  background: #6366f1;
}
.progress__text {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}
.status-list {
  display: grid;
  gap: 10px;
}
.status-item {
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.status-item__title {
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 6px;
}
.status-item__desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}
.status-item__detail {
  font-size: 12px;
  margin-top: 4px;
}
.status-item__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
}
.dot.pending {
  background: #d1d5db;
}
.dot.done {
  background: #10b981;
}
.badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
}
.badge--done {
  background: #dcfce7;
  color: #15803d;
}
.badge--pending {
  background: #f3f4f6;
  color: #6b7280;
}
.missing {
  font-size: 12px;
  color: #ef4444;
  margin-top: 8px;
}
.muted {
  font-size: 12px;
  color: #6b7280;
}
.danger {
  color: #ef4444;
}
.success {
  color: #059669;
}
.link {
  font-size: 12px;
  color: #4f46e5;
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
.ghost {
  border: 1px solid #e5e7eb;
  background: transparent;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
}
.wbs-list {
  display: grid;
  gap: 6px;
}
.wbs-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.pill {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
}
.pill--m1 {
  background: #eef2ff;
  color: #4338ca;
}
.pill--m2 {
  background: #fef3c7;
  color: #b45309;
}
.pill--m3 {
  background: #dcfce7;
  color: #15803d;
}
</style>

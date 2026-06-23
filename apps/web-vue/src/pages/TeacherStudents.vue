<template>
  <section class="space-y-6">
    <div class="teacher-students-hero">
      <div>
        <p class="teacher-students-hero__eyebrow">Student Roster</p>
        <h2>我的学生与账号状态</h2>
        <p>
          这里只看当前教师已关联的学生，便于按班级检查画像、账号和 Gitea 同步情况；跨教师分配与平台级账号操作保留在管理后台。
        </p>
      </div>
      <button class="teacher-students-refresh" type="button" :disabled="loading" @click="loadStudents">
        <i class="fas fa-sync-alt"></i>
        刷新
      </button>
    </div>

    <form class="teacher-students-toolbar" @submit.prevent="loadStudents">
      <label>
        搜索学生
        <input v-model="keyword" placeholder="姓名、平台账号或邮箱" />
      </label>
      <label>
        按班级筛选
        <select v-model="classNameFilter">
          <option value="">全部班级</option>
          <option v-for="item in classes" :key="item.className" :value="item.className">
            {{ item.className }}（{{ item.studentCount }}）
          </option>
        </select>
      </label>
      <button class="teacher-students-filter" type="submit" :disabled="loading">筛选</button>
    </form>

    <div class="teacher-students-summary">
      <article class="teacher-students-metric">
        <span>已关联学生</span>
        <strong>{{ summary.students }}</strong>
      </article>
      <article class="teacher-students-metric">
        <span>覆盖班级</span>
        <strong>{{ summary.classes }}</strong>
      </article>
      <article class="teacher-students-metric">
        <span>已同步 Gitea</span>
        <strong>{{ summary.syncedStudents }}</strong>
      </article>
    </div>

    <div v-if="loading" class="teacher-students-empty">正在加载学生名册...</div>

    <div v-else-if="students.length" class="teacher-students-grid">
      <article v-for="student in students" :key="student.id" class="teacher-students-card">
        <div class="teacher-students-card__header">
          <div>
            <p class="teacher-students-card__eyebrow">{{ student.class_name || '未填写班级' }}</p>
            <h3>{{ student.name || student.username || student.email || `学生 ${student.id}` }}</h3>
            <span>{{ student.username || student.email || '未填写账号信息' }}</span>
          </div>
          <span class="teacher-students-pill" :class="{ synced: student.gitea_username }">
            {{ student.gitea_username ? 'Gitea 已同步' : 'Gitea 未同步' }}
          </span>
        </div>

        <dl class="teacher-students-meta">
          <div>
            <dt>平台账号</dt>
            <dd>{{ student.username || '--' }}</dd>
          </div>
          <div>
            <dt>邮箱</dt>
            <dd>{{ student.email || '--' }}</dd>
          </div>
          <div>
            <dt>Gitea 用户名</dt>
            <dd>{{ student.gitea_username || '--' }}</dd>
          </div>
          <div>
            <dt>创建时间</dt>
            <dd>{{ formatDate(student.created_at) }}</dd>
          </div>
        </dl>
      </article>
    </div>

    <div v-else class="teacher-students-empty">当前教师还没有已关联的学生，或筛选条件下没有结果。</div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { apiFetch, readJsonResponse } from '@/api/client';
import { useNotificationStore } from '@/stores/notification';

const notification = useNotificationStore();
const loading = ref(false);
const keyword = ref('');
const classNameFilter = ref('');
const students = ref([]);
const classes = ref([]);
const summary = ref({
  students: 0,
  classes: 0,
  syncedStudents: 0
});

function formatDate(value) {
  const text = String(value || '').trim();
  if (!text) return '--';
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function loadStudents() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (keyword.value.trim()) params.set('keyword', keyword.value.trim());
    if (classNameFilter.value.trim()) params.set('className', classNameFilter.value.trim());
    const query = params.toString();
    const res = await apiFetch(`/teacher/students${query ? `?${query}` : ''}`);
    const data = await readJsonResponse(res, 'teacher_students');
    if (!res.ok) throw new Error(data?.error || '教师学生名册加载失败');
    students.value = Array.isArray(data.students) ? data.students : [];
    classes.value = Array.isArray(data.classes) ? data.classes : [];
    summary.value = data.summary || {
      students: students.value.length,
      classes: classes.value.length,
      syncedStudents: students.value.filter(item => item.gitea_username).length
    };
  } catch (err) {
    notification.error(err.message || '教师学生名册加载失败');
  } finally {
    loading.value = false;
  }
}

onMounted(loadStudents);
</script>

<style scoped>
.teacher-students-hero,
.teacher-students-metric,
.teacher-students-card,
.teacher-students-empty {
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 24px;
}

.teacher-students-hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.08), rgba(15, 23, 42, 0.04));
  padding: 1.5rem;
}

.teacher-students-hero__eyebrow {
  margin: 0 0 0.35rem;
  color: #0f766e;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.teacher-students-hero h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.8rem;
  font-weight: 900;
}

.teacher-students-hero p:not(.teacher-students-hero__eyebrow) {
  margin: 0.75rem 0 0;
  max-width: 48rem;
  color: #475569;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.75;
}

.teacher-students-refresh,
.teacher-students-filter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 42px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 900;
}

.teacher-students-refresh {
  border: 1px solid rgba(15, 118, 110, 0.18);
  background: rgba(15, 118, 110, 0.08);
  padding: 0 1rem;
  color: #0f766e;
}

.teacher-students-toolbar {
  display: grid;
  grid-template-columns: minmax(240px, 1.2fr) minmax(220px, 0.9fr) auto;
  gap: 0.9rem;
  align-items: end;
}

.teacher-students-toolbar label {
  display: grid;
  gap: 0.4rem;
  color: #475569;
  font-size: 0.76rem;
  font-weight: 900;
}

.teacher-students-toolbar input,
.teacher-students-toolbar select {
  min-height: 44px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 14px;
  background: #fff;
  padding: 0 0.85rem;
  color: #0f172a;
  font-size: 0.92rem;
}

.teacher-students-filter {
  border: 1px solid rgba(15, 118, 110, 0.2);
  background: #0f766e;
  padding: 0 1rem;
  color: #fff;
}

.teacher-students-summary,
.teacher-students-grid {
  display: grid;
  gap: 1rem;
}

.teacher-students-summary {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.teacher-students-metric {
  display: grid;
  gap: 0.45rem;
  background: #fff;
  padding: 1.2rem 1.25rem;
}

.teacher-students-metric span {
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.teacher-students-metric strong {
  color: #0f172a;
  font-size: 2rem;
  font-weight: 900;
}

.teacher-students-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.teacher-students-card {
  display: grid;
  gap: 1rem;
  background: #fff;
  padding: 1.2rem;
}

.teacher-students-card__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.9rem;
}

.teacher-students-card__eyebrow {
  margin: 0 0 0.3rem;
  color: #0f766e;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.teacher-students-card h3 {
  margin: 0;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.teacher-students-card span {
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
}

.teacher-students-pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  border-radius: 999px;
  background: #f1f5f9;
  padding: 0 0.75rem;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 900;
  white-space: nowrap;
}

.teacher-students-pill.synced {
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.teacher-students-meta {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.teacher-students-meta div {
  border-radius: 16px;
  background: #f8fafc;
  padding: 0.9rem;
}

.teacher-students-meta dt {
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.teacher-students-meta dd {
  margin: 0.35rem 0 0;
  color: #0f172a;
  font-size: 0.85rem;
  font-weight: 800;
  line-height: 1.5;
}

.teacher-students-empty {
  background: rgba(255, 255, 255, 0.72);
  padding: 1rem 1.1rem;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 700;
}

@media (max-width: 860px) {
  .teacher-students-hero,
  .teacher-students-card__header {
    display: grid;
  }

  .teacher-students-toolbar,
  .teacher-students-summary,
  .teacher-students-meta {
    grid-template-columns: 1fr;
  }
}
</style>

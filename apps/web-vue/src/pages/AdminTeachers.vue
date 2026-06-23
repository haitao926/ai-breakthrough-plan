<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-4 rounded-[30px] border border-white/10 bg-white/5 p-6 text-slate-100 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-[11px] font-black uppercase tracking-[0.18em] text-teal-300">Teacher Ops</p>
        <h2 class="mt-2 text-2xl font-black text-white">教师与评委分工</h2>
        <p class="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-400">
          这里聚焦教师、评委和管理员的学生覆盖范围，优先补齐未分配学生，再观察班级覆盖是否过度集中。
        </p>
      </div>
      <button class="refresh-btn" type="button" :disabled="loading" @click="loadTeachers">
        <i class="fas fa-sync-alt"></i>
        刷新
      </button>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <article class="metric-card">
        <span>角色账号总数</span>
        <strong>{{ totals.all }}</strong>
      </article>
      <article class="metric-card">
        <span>已带学生教师</span>
        <strong>{{ totals.active }}</strong>
      </article>
      <article class="metric-card">
        <span>待分配角色</span>
        <strong>{{ totals.idle }}</strong>
      </article>
    </div>

    <div v-if="loading" class="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-slate-400">
      正在加载教师管理数据...
    </div>

    <div v-else class="teacher-admin-grid">
      <article v-for="teacher in teachers" :key="teacher.id" class="teacher-admin-card">
        <div class="teacher-admin-card__head">
          <div>
            <p class="teacher-admin-card__role">{{ getRoleLabel(teacher.role) }}</p>
            <h3>{{ teacher.name || teacher.username || teacher.email }}</h3>
            <span>{{ teacher.email || teacher.username || '未填写联系方式' }}</span>
          </div>
          <RouterLink
            v-if="teacher.role !== 'admin'"
            class="teacher-admin-card__link"
            :to="`/admin/students?teacherId=${teacher.id}`"
          >
            查看学生
          </RouterLink>
        </div>

        <div class="teacher-admin-card__stats">
          <div>
            <strong>{{ teacher.student_count || 0 }}</strong>
            <span>学生</span>
          </div>
          <div>
            <strong>{{ teacher.class_count || 0 }}</strong>
            <span>班级</span>
          </div>
          <div>
            <strong>{{ formatDate(teacher.created_at) }}</strong>
            <span>创建时间</span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { apiFetch, readJsonResponse } from '@/api/client';
import { useNotificationStore } from '@/stores/notification';
import { getRoleLabel } from '@/utils/userRole';

const notification = useNotificationStore();
const loading = ref(false);
const teachers = ref([]);

const totals = computed(() => {
  const rows = teachers.value || [];
  return {
    all: rows.length,
    active: rows.filter(item => Number(item.student_count || 0) > 0).length,
    idle: rows.filter(item => Number(item.student_count || 0) === 0).length
  };
});

function formatDate(value) {
  const text = String(value || '').trim();
  if (!text) return '--';
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit'
  });
}

async function loadTeachers() {
  loading.value = true;
  try {
    const res = await apiFetch('/admin/teachers');
    const data = await readJsonResponse(res, 'admin_teachers');
    if (!res.ok) throw new Error(data?.error || '教师管理数据加载失败');
    teachers.value = Array.isArray(data.teachers) ? data.teachers : [];
  } catch (err) {
    notification.error(err.message || '教师管理数据加载失败');
  } finally {
    loading.value = false;
  }
}

onMounted(loadTeachers);
</script>

<style scoped>
.refresh-btn,
.teacher-admin-card__link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 900;
}

.refresh-btn {
  min-height: 44px;
  border: 1px solid rgba(45, 212, 191, 0.28);
  background: rgba(45, 212, 191, 0.12);
  padding: 0 1.1rem;
  color: #ccfbf1;
}

.metric-card,
.teacher-admin-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
}

.metric-card {
  display: grid;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1.25rem;
}

.metric-card span {
  color: #94a3b8;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.metric-card strong {
  color: #fff;
  font-size: 2rem;
  font-weight: 900;
}

.teacher-admin-grid {
  display: grid;
  gap: 1rem;
}

.teacher-admin-card {
  display: grid;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1.25rem;
}

.teacher-admin-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.teacher-admin-card__role {
  margin: 0 0 0.4rem;
  color: #5eead4;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.teacher-admin-card h3 {
  margin: 0;
  color: #fff;
  font-size: 1rem;
  font-weight: 900;
}

.teacher-admin-card span {
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 700;
}

.teacher-admin-card__link {
  min-height: 40px;
  border: 1px solid rgba(45, 212, 191, 0.22);
  background: rgba(45, 212, 191, 0.1);
  padding: 0 0.95rem;
  color: #ccfbf1;
}

.teacher-admin-card__stats {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.teacher-admin-card__stats div {
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.5);
  padding: 0.95rem;
}

.teacher-admin-card__stats strong {
  display: block;
  color: #fff;
  font-size: 1.15rem;
  font-weight: 900;
}

.teacher-admin-card__stats span {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.72rem;
}

@media (max-width: 720px) {
  .teacher-admin-card__head,
  .teacher-admin-card__stats {
    grid-template-columns: 1fr;
  }

  .teacher-admin-card__head {
    display: grid;
  }
}
</style>

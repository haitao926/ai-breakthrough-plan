<template>
  <section class="space-y-8">
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in summaryCards" :key="card.label" class="summary-card">
        <p class="summary-card__label">{{ card.label }}</p>
        <strong class="summary-card__value">{{ card.value }}</strong>
        <span class="summary-card__note">{{ card.note }}</span>
      </article>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
      <DataCard title="班级覆盖" eyebrow="Class Overview" padding="lg" tone="soft">
        <div v-if="loading" class="text-sm font-semibold text-slate-400">正在加载后台概览...</div>
        <div v-else-if="!classes.length" class="text-sm font-semibold text-slate-400">还没有可展示的班级信息。</div>
        <div v-else class="class-list">
          <article v-for="item in classes" :key="item.className" class="class-row">
            <div>
              <strong>{{ item.className }}</strong>
              <p>{{ item.studentCount }} 名学生</p>
            </div>
            <RouterLink class="class-row__link" :to="`/admin/students?className=${encodeURIComponent(item.className)}`">查看学生</RouterLink>
          </article>
        </div>
      </DataCard>

      <DataCard title="后台入口分工" eyebrow="Route Split" padding="lg">
        <div class="space-y-4 text-sm font-semibold leading-7 text-slate-600">
          <p>`/admin` 负责平台级账号与班级管理，`/teacher` 负责教师评审、发布和日常干预。</p>
          <p>现在管理员不再默认落到教师评审页，教师也不会再误入平台级总览。</p>
        </div>
        <template #footer>
          <div class="flex flex-wrap gap-3">
            <RouterLink to="/admin/teachers" class="action-link">教师管理</RouterLink>
            <RouterLink to="/admin/students" class="action-link">学生账号</RouterLink>
            <RouterLink to="/teacher" class="action-link action-link--ghost">教师工作台</RouterLink>
          </div>
        </template>
      </DataCard>
    </div>

    <DataCard title="教师分工预览" eyebrow="Teacher Coverage" :meta="`${teacherPreview.length} 位角色账号`" padding="lg">
      <div v-if="loading" class="text-sm font-semibold text-slate-400">正在加载教师分工...</div>
      <div v-else class="teacher-grid">
        <article v-for="teacher in teacherPreview" :key="teacher.id" class="teacher-tile">
          <div>
            <p class="teacher-tile__role">{{ getRoleLabel(teacher.role) }}</p>
            <strong>{{ teacher.name || teacher.username || teacher.email }}</strong>
            <span>{{ teacher.email || teacher.username || '未填写联系方式' }}</span>
          </div>
          <div class="teacher-tile__metrics">
            <span>{{ teacher.student_count }} 名学生</span>
            <span>{{ teacher.class_count }} 个班级</span>
          </div>
        </article>
      </div>
    </DataCard>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import DataCard from '@/components/DataCard.vue';
import { apiFetch, readJsonResponse } from '@/api/client';
import { getRoleLabel } from '@/utils/userRole';
import { useNotificationStore } from '@/stores/notification';

const notification = useNotificationStore();
const loading = ref(false);
const overview = ref({
  summary: {},
  classes: [],
  teachers: []
});

const summary = computed(() => overview.value.summary || {});
const classes = computed(() => overview.value.classes || []);
const teacherPreview = computed(() => (overview.value.teachers || []).slice(0, 6));
const summaryCards = computed(() => ([
  {
    label: '学生账号',
    value: summary.value.students || 0,
    note: `已关联教师 ${summary.value.linkedStudents || 0} 人`
  },
  {
    label: '未分配学生',
    value: summary.value.unassignedStudents || 0,
    note: '还没有对应负责教师'
  },
  {
    label: '教师 / 评委 / 管理员',
    value: `${summary.value.teachers || 0} / ${summary.value.judges || 0} / ${summary.value.admins || 0}`,
    note: '平台运营角色分布'
  },
  {
    label: '项目进展',
    value: `${summary.value.activeProjects || 0} 进行中`,
    note: `待启动 ${summary.value.pendingProjects || 0} · 已完成 ${summary.value.completedProjects || 0}`
  }
]));

async function loadOverview() {
  loading.value = true;
  try {
    const res = await apiFetch('/admin/overview');
    const data = await readJsonResponse(res, 'admin_overview');
    if (!res.ok) throw new Error(data?.error || '后台概览加载失败');
    overview.value = {
      summary: data.summary || {},
      classes: data.classes || [],
      teachers: data.teachers || []
    };
  } catch (err) {
    notification.error(err.message || '后台概览加载失败');
  } finally {
    loading.value = false;
  }
}

onMounted(loadOverview);
</script>

<style scoped>
.summary-card,
.teacher-tile,
.class-row {
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 24px;
}

.summary-card {
  display: grid;
  gap: 0.5rem;
  min-height: 170px;
  background:
    radial-gradient(circle at top right, rgba(45, 212, 191, 0.15), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.92));
  padding: 1.5rem;
  box-shadow: 0 20px 60px rgba(2, 6, 23, 0.18);
}

.summary-card__label {
  margin: 0;
  color: #5eead4;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.summary-card__value {
  color: #fff;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  font-weight: 900;
  line-height: 1.05;
}

.summary-card__note {
  color: #94a3b8;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.6;
}

.class-list,
.teacher-grid {
  display: grid;
  gap: 1rem;
}

.class-row,
.teacher-tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: rgba(248, 250, 252, 0.72);
  padding: 1rem 1.1rem;
}

.class-row strong,
.teacher-tile strong {
  display: block;
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 900;
}

.class-row p,
.teacher-tile span {
  margin: 0.2rem 0 0;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
}

.class-row__link,
.action-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(15, 118, 110, 0.18);
  background: rgba(20, 184, 166, 0.08);
  padding: 0 1rem;
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 900;
}

.action-link--ghost {
  border-color: rgba(148, 163, 184, 0.26);
  background: #fff;
  color: #334155;
}

.teacher-tile__role {
  margin: 0 0 0.3rem;
  color: #0f766e;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.teacher-tile__metrics {
  display: grid;
  justify-items: end;
  gap: 0.3rem;
  white-space: nowrap;
}

.teacher-tile__metrics span {
  margin: 0;
}
</style>

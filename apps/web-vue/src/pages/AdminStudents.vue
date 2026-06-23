<template>
  <section class="main-panel">
    <div class="panel-title row-title">
      <div>
        <p>Student Accounts</p>
        <h2>学生账号、教师关联与 Gitea 同步</h2>
      </div>
      <button class="secondary-btn" type="button" :disabled="loading" @click="loadStudents">
        <i class="fas fa-sync-alt"></i>
        刷新
      </button>
    </div>

    <form class="student-toolbar" @submit.prevent="loadStudents">
      <label>
        搜索学生
        <input v-model="keyword" placeholder="姓名、平台账号或邮箱" />
      </label>
      <label>
        按班级筛选
        <input v-model="classNameFilter" placeholder="例如：七年级一班" />
      </label>
      <label>
        按教师筛选
        <select v-model="teacherFilterId">
          <option value="">全部教师</option>
          <option value="__unassigned__">未绑定教师</option>
          <option v-for="teacher in teachers" :key="teacher.id" :value="String(teacher.id)">
            {{ teacher.name || teacher.username || teacher.email }}
          </option>
        </select>
      </label>
      <button class="primary-btn small" type="submit" :disabled="loading">筛选</button>
      <button class="secondary-btn small" type="button" :disabled="loading || bulkSyncing" @click="syncUnsyncedStudents">
        同步未同步学生
      </button>
      <button
        v-if="lastSyncedAccounts.length"
        class="secondary-btn small"
        type="button"
        @click="copyLastSyncedAccounts"
      >
        复制本次账号清单
      </button>
    </form>

    <section class="assignment-panel">
      <div>
        <strong>批量关联教师</strong>
        <small>先勾选学生，再指定 1 位或多位教师。</small>
      </div>
      <div class="assignment-panel__controls">
        <label>
          选择教师
          <select v-model="bulkTeacherIds" multiple>
            <option v-for="teacher in teachers" :key="teacher.id" :value="String(teacher.id)">
              {{ teacher.name || teacher.username || teacher.email }}
            </option>
          </select>
        </label>
        <button
          class="primary-btn small"
          type="button"
          :disabled="!selectedStudentIds.length || !normalizedBulkTeacherIds.length || assignmentWorking"
          @click="assignTeachersToSelected"
        >
          关联到选中学生
        </button>
      </div>
      <div class="assignment-panel__meta">
        <label class="inline-check">
          <input
            type="checkbox"
            :checked="allVisibleSelected"
            :indeterminate.prop="someVisibleSelected && !allVisibleSelected"
            @change="toggleSelectVisible($event)"
          />
          <span>全选当前列表</span>
        </label>
        <small>已选 {{ selectedStudentIds.length }} 名学生</small>
      </div>
    </section>

    <div v-if="lastSyncedAccounts.length || lastSyncFailures.length" class="sync-summary">
      <div v-if="lastSyncedAccounts.length">
        <strong>本次已同步 {{ lastSyncedAccounts.length }} 个 Gitea 账号</strong>
        <small>只有本次新建成功的账号会返回初始密码；已存在账号不会显示密码。</small>
      </div>
      <div v-if="lastSyncFailures.length" class="sync-summary__error">
        <strong>{{ lastSyncFailures.length }} 个账号同步失败</strong>
        <small>{{ lastSyncFailures.map(item => `${item.email || item.name || item.userId}: ${item.error}`).join('；') }}</small>
      </div>
    </div>

    <div class="student-table" role="table" aria-label="学生账号列表">
      <div class="student-table__head" role="row">
        <span>选择 / 学生</span>
        <span>平台账号</span>
        <span>负责教师</span>
        <span>Gitea</span>
        <span>操作</span>
      </div>
      <article v-for="student in students" :key="student.id" class="student-table__row" role="row">
        <div class="student-meta">
          <label class="row-check">
            <input
              :checked="selectedStudentIds.includes(student.id)"
              type="checkbox"
              @change="toggleStudent(student.id, $event)"
            />
          </label>
          <div>
            <strong>{{ student.name || '未命名学生' }}</strong>
            <small>ID {{ student.id }}</small>
          </div>
        </div>
        <div>
          <span>{{ student.username || student.email }}</span>
          <small>{{ student.class_name ? `${student.class_name} · ` : '' }}{{ formatDate(student.created_at) }}</small>
        </div>
        <div class="teacher-cell">
          <div class="teacher-tags">
            <span
              v-for="teacher in student.teachers || []"
              :key="`${student.id}-${teacher.id}`"
              class="teacher-pill"
            >
              {{ teacher.name || teacher.username || teacher.email }}
              <button
                class="pill-remove"
                type="button"
                :disabled="removingLinkKey === `${student.id}:${teacher.id}`"
                @click="removeTeacher(student.id, teacher.id)"
              >
                ×
              </button>
            </span>
            <span v-if="!(student.teachers || []).length" class="teacher-pill is-empty">未绑定</span>
          </div>
          <div class="teacher-editor">
            <select :value="teacherDraftMap[student.id] || ''" @change="updateTeacherDraft(student.id, $event)">
              <option value="">选择教师后添加</option>
              <option v-for="teacher in availableTeacherOptions(student)" :key="teacher.id" :value="String(teacher.id)">
                {{ teacher.name || teacher.username || teacher.email }}
              </option>
            </select>
            <button
              class="secondary-btn small"
              type="button"
              :disabled="!teacherDraftMap[student.id] || assignmentWorking"
              @click="appendTeacher(student)"
            >
              添加
            </button>
          </div>
        </div>
        <div>
          <span v-if="student.gitea_username" class="sync-pill is-synced">{{ student.gitea_username }}</span>
          <span v-else class="sync-pill">未同步</span>
          <small v-if="student.gitea_synced_at">同步于 {{ formatDate(student.gitea_synced_at) }}</small>
        </div>
        <div class="student-actions">
          <button
            class="secondary-btn small"
            type="button"
            :disabled="syncingId === student.id"
            @click="syncGitea(student)"
          >
            <i class="fas fa-code-branch"></i>
            {{ student.gitea_username ? '重新同步' : '创建 Gitea 用户' }}
          </button>
        </div>
      </article>
    </div>

    <div v-if="!students.length && !loading" class="empty-note">还没有匹配的学生账号。</div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { apiFetch, readJsonResponse } from '@/api/client';
import { useNotificationStore } from '@/stores/notification';

const route = useRoute();
const notification = useNotificationStore();
const loading = ref(false);
const syncingId = ref(null);
const bulkSyncing = ref(false);
const assignmentWorking = ref(false);
const removingLinkKey = ref('');
const keyword = ref('');
const classNameFilter = ref('');
const teacherFilterId = ref('');
const students = ref([]);
const teachers = ref([]);
const selectedStudentIds = ref([]);
const bulkTeacherIds = ref([]);
const lastSyncedAccounts = ref([]);
const lastSyncFailures = ref([]);
const teacherDraftMap = ref({});

const normalizedBulkTeacherIds = computed(() => {
  return [...new Set((bulkTeacherIds.value || []).map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0))];
});

const visibleStudentIds = computed(() => students.value.map(student => Number(student.id)).filter(id => Number.isInteger(id) && id > 0));
const allVisibleSelected = computed(() => visibleStudentIds.value.length > 0 && visibleStudentIds.value.every(id => selectedStudentIds.value.includes(id)));
const someVisibleSelected = computed(() => visibleStudentIds.value.some(id => selectedStudentIds.value.includes(id)));

function formatDate(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function normalizeTeacherList(items) {
  return Array.isArray(items) ? items.map(item => ({ ...item, id: Number(item.id) })).filter(item => Number.isInteger(item.id) && item.id > 0) : [];
}

function buildAccountList(accounts) {
  return accounts
    .map(item => [
      item.name || '',
      item.username || '',
      item.email || '',
      item.giteaUsername || '',
      item.password || '已存在账号，请沿用原 Gitea 密码',
      item.htmlUrl || ''
    ].join('\t'))
    .join('\n');
}

function availableTeacherOptions(student) {
  const existingIds = new Set(normalizeTeacherList(student.teachers).map(item => item.id));
  return teachers.value.filter(teacher => !existingIds.has(Number(teacher.id)));
}

function updateLocalStudentTeachers(studentId, nextTeachers) {
  students.value = students.value.map(student => {
    if (Number(student.id) !== Number(studentId)) return student;
    return {
      ...student,
      teachers: normalizeTeacherList(nextTeachers)
    };
  });
}

async function loadStudents() {
  loading.value = true;
  try {
    const params = new URLSearchParams({ role: 'student' });
    if (keyword.value.trim()) params.set('keyword', keyword.value.trim());
    if (classNameFilter.value.trim()) params.set('className', classNameFilter.value.trim());
    if (teacherFilterId.value === '__unassigned__') {
      params.set('withoutTeacher', 'true');
    } else if (teacherFilterId.value) {
      params.set('teacherId', teacherFilterId.value);
    }
    const res = await apiFetch(`/admin/users?${params.toString()}`);
    const data = await readJsonResponse(res, 'admin_students');
    if (!res.ok) throw new Error(data?.error || '学生账号加载失败');
    students.value = (data.users || []).map(student => ({
      ...student,
      id: Number(student.id),
      teachers: normalizeTeacherList(student.teachers)
    }));
    teachers.value = normalizeTeacherList(data.teachers);
    selectedStudentIds.value = selectedStudentIds.value.filter(id => students.value.some(student => student.id === id));
  } catch (err) {
    notification.error(err.message || '学生账号加载失败');
  } finally {
    loading.value = false;
  }
}

function toggleStudent(studentId, event) {
  const checked = Boolean(event?.target?.checked);
  const next = new Set(selectedStudentIds.value);
  if (checked) next.add(Number(studentId));
  else next.delete(Number(studentId));
  selectedStudentIds.value = [...next];
}

function toggleSelectVisible(event) {
  const checked = Boolean(event?.target?.checked);
  const next = new Set(selectedStudentIds.value);
  visibleStudentIds.value.forEach((id) => {
    if (checked) next.add(id);
    else next.delete(id);
  });
  selectedStudentIds.value = [...next];
}

function updateTeacherDraft(studentId, event) {
  teacherDraftMap.value = {
    ...teacherDraftMap.value,
    [studentId]: String(event?.target?.value || '')
  };
}

async function appendTeacher(student) {
  const teacherId = Number(teacherDraftMap.value[student.id] || 0);
  if (!teacherId) return;
  const teacherIds = [
    ...new Set([
      ...normalizeTeacherList(student.teachers).map(item => item.id),
      teacherId
    ])
  ];
  assignmentWorking.value = true;
  try {
    const res = await apiFetch(`/admin/students/${student.id}/teachers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherIds })
    });
    const data = await readJsonResponse(res, 'student_teacher_assign');
    if (!res.ok) throw new Error(data?.error || '教师关联失败');
    updateLocalStudentTeachers(student.id, data.teachers || []);
    teacherDraftMap.value = { ...teacherDraftMap.value, [student.id]: '' };
    notification.success('教师关联已更新');
  } catch (err) {
    notification.error(err.message || '教师关联失败');
  } finally {
    assignmentWorking.value = false;
  }
}

async function assignTeachersToSelected() {
  assignmentWorking.value = true;
  try {
    const res = await apiFetch('/admin/student-teacher-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentIds: selectedStudentIds.value,
        teacherIds: normalizedBulkTeacherIds.value
      })
    });
    const data = await readJsonResponse(res, 'student_teacher_batch_assign');
    if (!res.ok) throw new Error(data?.error || '批量关联失败');
    Object.entries(data.links || {}).forEach(([studentId, nextTeachers]) => {
      updateLocalStudentTeachers(Number(studentId), nextTeachers || []);
    });
    notification.success(`已为 ${selectedStudentIds.value.length} 名学生关联教师`);
  } catch (err) {
    notification.error(err.message || '批量关联失败');
  } finally {
    assignmentWorking.value = false;
  }
}

async function removeTeacher(studentId, teacherId) {
  removingLinkKey.value = `${studentId}:${teacherId}`;
  try {
    const res = await apiFetch(`/admin/students/${studentId}/teachers/${teacherId}`, {
      method: 'DELETE'
    });
    const data = await readJsonResponse(res, 'student_teacher_remove');
    if (!res.ok) throw new Error(data?.error || '解绑教师失败');
    updateLocalStudentTeachers(studentId, data.teachers || []);
    notification.success('教师已解绑');
  } catch (err) {
    notification.error(err.message || '解绑教师失败');
  } finally {
    removingLinkKey.value = '';
  }
}

async function syncGitea(student) {
  syncingId.value = student.id;
  try {
    const res = await apiFetch(`/admin/users/${student.id}/sync-gitea`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await readJsonResponse(res, 'sync_gitea_user');
    if (!res.ok) throw new Error(data?.error || 'Gitea 用户同步失败');
    const passwordText = data.gitea?.password ? `，初始密码：${data.gitea.password}` : '';
    notification.success(`Gitea 用户 ${data.gitea?.username || ''} 已同步${passwordText}`, 8000);
    await loadStudents();
  } catch (err) {
    notification.error(err.message || 'Gitea 用户同步失败', 6000);
  } finally {
    syncingId.value = null;
  }
}

async function syncUnsyncedStudents() {
  bulkSyncing.value = true;
  lastSyncedAccounts.value = [];
  lastSyncFailures.value = [];
  try {
    const res = await apiFetch('/admin/students/sync-gitea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onlyUnsynced: true })
    });
    const data = await readJsonResponse(res, 'sync_gitea_students');
    if (!res.ok && !data?.synced?.length) throw new Error(data?.error || '批量同步失败');
    lastSyncedAccounts.value = data.synced || [];
    lastSyncFailures.value = data.failed || [];
    const failedText = lastSyncFailures.value.length ? `，${lastSyncFailures.value.length} 个失败` : '';
    notification.success(`已同步 ${lastSyncedAccounts.value.length} 个学生 Gitea 账号${failedText}`, 8000);
    await loadStudents();
  } catch (err) {
    notification.error(err.message || '批量同步失败', 6000);
  } finally {
    bulkSyncing.value = false;
  }
}

async function copyLastSyncedAccounts() {
  const header = ['姓名', '平台账号', '内部邮箱', 'Gitea 用户名', '初始密码', 'Gitea 地址'].join('\t');
  const text = `${header}\n${buildAccountList(lastSyncedAccounts.value)}`;
  try {
    await navigator.clipboard.writeText(text);
    notification.success('账号清单已复制');
  } catch {
    notification.error('复制失败，请手动选择清单内容');
  }
}

onMounted(() => {
  const initialTeacherId = String(route.query?.teacherId || '').trim();
  const initialClassName = String(route.query?.className || '').trim();
  if (initialTeacherId) teacherFilterId.value = initialTeacherId;
  if (initialClassName) classNameFilter.value = initialClassName;
  loadStudents();
});
</script>

<style scoped>
.student-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1.2fr) minmax(180px, 0.9fr) minmax(180px, 0.9fr) auto auto auto;
  align-items: end;
  gap: 12px;
  margin-bottom: 18px;
}

.student-toolbar label,
.assignment-panel__controls label {
  display: grid;
  gap: 6px;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
}

.student-toolbar input,
.student-toolbar select,
.assignment-panel__controls select,
.teacher-editor select {
  min-height: 42px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 12px;
  background: #fff;
  padding: 0 12px;
  color: #0f172a;
  font-size: 0.9rem;
}

.assignment-panel {
  display: grid;
  gap: 14px;
  margin-bottom: 18px;
  border: 1px solid rgba(14, 116, 144, 0.18);
  border-radius: 18px;
  background: linear-gradient(135deg, #f8fdff 0%, #eff6ff 100%);
  padding: 16px;
}

.assignment-panel strong,
.assignment-panel small {
  display: block;
}

.assignment-panel small {
  margin-top: 4px;
  color: #64748b;
}

.assignment-panel__controls {
  display: flex;
  gap: 12px;
  align-items: end;
}

.assignment-panel__controls label {
  flex: 1;
}

.assignment-panel__controls select {
  min-height: 96px;
  padding: 10px 12px;
}

.assignment-panel__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.inline-check,
.row-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.student-table {
  display: grid;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  background: #fff;
}

.sync-summary {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
  border: 1px solid rgba(20, 184, 166, 0.22);
  border-radius: 16px;
  background: #f0fdfa;
  padding: 14px 16px;
  color: #115e59;
}

.sync-summary strong,
.sync-summary small {
  display: block;
}

.sync-summary small {
  margin-top: 4px;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 700;
}

.sync-summary__error {
  border-top: 1px solid rgba(20, 184, 166, 0.2);
  padding-top: 10px;
  color: #991b1b;
}

.sync-summary__error small {
  color: #b91c1c;
}

.student-table__head,
.student-table__row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr) minmax(280px, 1.5fr) minmax(140px, 0.9fr) minmax(160px, auto);
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
}

.student-table__head {
  background: #f8fafc;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.student-table__row {
  border-top: 1px solid rgba(148, 163, 184, 0.16);
}

.student-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-table__row strong,
.student-table__row span {
  display: block;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 800;
}

.student-table__row small {
  display: block;
  margin-top: 4px;
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 700;
}

.teacher-cell {
  display: grid;
  gap: 10px;
}

.teacher-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.teacher-pill,
.sync-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  border-radius: 999px;
  background: #f1f5f9;
  padding: 0.35rem 0.65rem;
  color: #475569;
  font-size: 0.72rem;
  font-weight: 900;
}

.teacher-pill {
  background: #ecfeff;
  color: #155e75;
}

.teacher-pill.is-empty {
  background: #f8fafc;
  color: #94a3b8;
}

.pill-remove {
  border: 0;
  background: transparent;
  padding: 0;
  color: inherit;
  cursor: pointer;
  font-weight: 900;
}

.teacher-editor {
  display: flex;
  gap: 8px;
  align-items: center;
}

.teacher-editor select {
  flex: 1;
}

.sync-pill.is-synced {
  background: #ecfdf5;
  color: #047857;
}

.student-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1080px) {
  .student-toolbar {
    grid-template-columns: 1fr 1fr;
  }

  .assignment-panel__controls,
  .assignment-panel__meta {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 860px) {
  .student-toolbar {
    grid-template-columns: 1fr;
  }

  .student-table__head {
    display: none;
  }

  .student-table {
    gap: 10px;
    overflow: visible;
    border: 0;
    background: transparent;
  }

  .student-table__row {
    grid-template-columns: 1fr;
    gap: 12px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 16px;
    background: #fff;
  }

  .student-actions {
    justify-content: flex-start;
  }
}
</style>

<template>
  <div class="teacher-ops min-h-dvh bg-slate-50 text-slate-900">
    <TeacherShell
      :brand-name="brandName"
      :school-name="schoolName"
      :current-user="currentUser"
      :active-module="activeModule"
      :intervention-count="interventionCount"
      :stage-review-count="stageReviewCount"
      :resource-queue-count="resourceQueueCount"
      :pending-course-count="pendingCourseCount"
      :pending-project-topic-count="pendingProjectTopicCount"
      :pending-competition-count="pendingCompetitionCount"
      :publish-count="pendingCourseCount + pendingProjectTopicCount + pendingCompetitionCount"
      :show-queue-celebration="showQueueCelebration"
      @refresh="refreshAll"
      @set-module="goModule"
      @logout="logout"
    />

    <main class="app-page-shell app-page-shell--wide pb-14">
      <slot></slot>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import TeacherShell from '@/components/teacher/TeacherShell.vue';
import { useAuthStore } from '@/stores/auth';
import { useProjectStore } from '@/stores/project';
import { useTeacherStore } from '@/stores/teacher';
import { brandName, schoolName } from '@/constants/brand';
import { isOwnedByTeacher, getQueueCelebration } from '@/modules/teacher/admin.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const projectStore = useProjectStore();
const teacherStore = useTeacherStore();

const { user: currentUser } = storeToRefs(authStore);
const { courses, projectTopics, competitions, resources, reviewQueue } = storeToRefs(teacherStore);

const activeModule = ref('projects');
let queueRefreshTimer = null;
const previousQueueTotal = ref(0);

const currentTeacherId = computed(() => Number(currentUser.value?.id || 0));
const isOwnedByCurrentTeacher = item => isOwnedByTeacher(item, currentTeacherId.value);

const myCourses = computed(() => courses.value.filter(isOwnedByCurrentTeacher));
const myProjectTopics = computed(() => projectTopics.value.filter(isOwnedByCurrentTeacher));
const myCompetitions = computed(() => competitions.value.filter(isOwnedByCurrentTeacher));

const pendingCourseCount = computed(() => myCourses.value.filter(item => item.status !== 'published').length);
const pendingProjectTopicCount = computed(() => myProjectTopics.value.filter(item => item.status !== 'published').length);
const pendingCompetitionCount = computed(() => myCompetitions.value.filter(item => item.publishStatus !== 'published').length);

const projectReviewCount = computed(() => reviewQueue.value.filter(item => item.reviewBucket === 'project_review').length);
const stageReviewCount = computed(() => reviewQueue.value.filter(item => item.reviewBucket === 'stage_review').length);
const resourceQueueCount = computed(() => reviewQueue.value.filter(item => item.reviewBucket === 'resource_pending').length);
const attentionCount = computed(() => reviewQueue.value.filter(item => item.reviewBucket === 'attention').length);
const interventionCount = computed(() => projectReviewCount.value + stageReviewCount.value + attentionCount.value);
const queueTotal = computed(() => projectReviewCount.value + stageReviewCount.value + resourceQueueCount.value + attentionCount.value);

const showQueueCelebration = computed(() => getQueueCelebration(previousQueueTotal.value, queueTotal.value));

function applyRouteState() {
  if (route.path.startsWith('/teacher/publish')) {
    activeModule.value = 'uploads';
  } else {
    activeModule.value = 'projects';
  }
}

function goModule(module, options = {}) {
  activeModule.value = module;
  if (module === 'uploads') {
    router.replace({ path: '/teacher/publish', query: { ...route.query, kind: options.kind || 'course' } }).catch(() => {});
  } else {
    router.replace({ path: '/teacher/review', query: { ...route.query, queue: options.queue || 'project_review' } }).catch(() => {});
  }
}

async function refreshAll() {
  await Promise.all([
    teacherStore.fetchAll(),
    projectStore.fetchList()
  ]);
}

function startQueuePolling() {
  stopQueuePolling();
  queueRefreshTimer = window.setInterval(() => {
    if (document.hidden || teacherStore.loading) return;
    refreshAll().catch(() => {});
  }, 30000);
}

function stopQueuePolling() {
  if (queueRefreshTimer) {
    window.clearInterval(queueRefreshTimer);
    queueRefreshTimer = null;
  }
}

function logout() {
  authStore.logout();
  router.replace('/login');
}

watch(() => route.fullPath, () => {
  applyRouteState();
});

watch(queueTotal, (value, oldValue) => {
  previousQueueTotal.value = Math.max(Number(oldValue || 0), previousQueueTotal.value);
  if (value > 0) {
    previousQueueTotal.value = value;
  }
});

onMounted(async () => {
  applyRouteState();
  await refreshAll();
  startQueuePolling();
});

onBeforeUnmount(() => {
  stopQueuePolling();
});
</script>

<style>
/* Scoped css for Teacher Layout if needed, imported from previous Teacher.css */
@import '../pages/Teacher.css';
</style>

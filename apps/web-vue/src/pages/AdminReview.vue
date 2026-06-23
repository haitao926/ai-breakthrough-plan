<template>
  <div class="ops-layout">
    <TeacherReviewSidebar
      :alert-projects="alertProjects"
      :project-queues="projectQueues"
      :filtered-review-projects="filteredReviewProjects"
      :selected-review-project-id="selectedReviewProjectId"
      :active-queue="activeQueue"
      :status-label="statusLabel"
      @select-project="selectReviewProject"
      @set-queue="goModule('projects', { queue: $event })"
    />
    <TeacherReviewWorkbench
      :selected-project-id="selectedReviewProjectId"
      :review-dossier="reviewDossier"
      :review-dossier-loading="reviewDossierLoading"
      :project-review-drafts="projectReviewDrafts"
      :project-action-note="projectActionNote"
      :action-working="actionWorking"
      :can-manage="canManage"
      :status-actions="statusActions"
      :status-label="statusLabel"
      :submission-type-label="submissionTypeLabel"
      :submission-summary="submissionSummary"
      :format-date="formatDate"
      :audit-resource="auditResource"
      :advance-project-status="advanceProjectStatus"
      :review-project-submission="reviewProjectSubmission"
      :review-milestone="reviewMilestone"
      :open-project="openProject"
      @update:project-action-note="projectActionNote = $event"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import TeacherReviewSidebar from '@/components/teacher/TeacherReviewSidebar.vue';
import TeacherReviewWorkbench from '@/components/teacher/TeacherReviewWorkbench.vue';
import { useTeacherDashboard } from '@/composables/teacher/useTeacherDashboard';

const dashboard = useTeacherDashboard();

// Destructure values for the template
const {
  alertProjects, projectQueues, filteredReviewProjects, selectedReviewProjectId, activeQueue,
  selectReviewProject, goModule, auditResource, reviewDossier, reviewDossierLoading,
  projectReviewDrafts, projectActionNote, actionWorking, canManage, statusActions,
  statusLabel, submissionTypeLabel, submissionSummary, formatDate, advanceProjectStatus,
  reviewProjectSubmission, reviewMilestone, openProject, applyRouteState
} = dashboard;

onMounted(() => {
  applyRouteState();
});
</script>

<style scoped>
.ops-layout {
  display: flex;
  align-items: flex-start;
  gap: 32px;
  max-width: 1400px;
  margin: 0 auto;
}
</style>

<template>
  <div class="ops-layout">
    <TeacherUploadSidebar
      :upload-kind="uploadKind"
      :my-courses="myCourses"
      :selected-course-id="selectedCourseId"
      :my-project-topics="myProjectTopics"
      :my-competitions="myCompetitions"
      :selected-competition-slug="selectedCompetitionSlug"
      :banners="banners"
      :selected-banner-index="selectedBannerIndex"
      :stories="stories"
      :selected-story-slug="selectedStorySlug"
      @set-kind="goModule('uploads', { kind: $event })"
      @select-course="selectCourse"
      @select-project-topic="editProjectTopic"
      @select-competition="selectCompetition"
      @select-banner="selectBanner"
      @select-story="selectStory"
    />
    <TeacherPublishPanel
      :upload-kind="uploadKind"
      :selected-course="selectedCourse"
      :course-draft-restored="courseDraftRestored"
      :selected-course-lessons="selectedCourseLessons"
      :assignments="assignments"
      :course-saving="courseSaving"
      :selected-assignment="selectedAssignment"
      :submissions="submissions"
      :review-drafts="reviewDrafts"
      :selected-project-topic="selectedProjectTopic"
      :my-project-topics="myProjectTopics"
      :selected-competition="selectedCompetition"
      :competition-draft-restored="competitionDraftRestored"
      :registration-stats="registrationStats"
      :competition-candidates="competitionCandidates"
      :reminder-form="reminderForm"
      :selected-competition-reminder-status="selectedCompetitionReminderStatus"
      :is-selected-competition-deadline-past="isSelectedCompetitionDeadlinePast"
      :registrations="registrations"
      :my-competitions="myCompetitions"
      :selected-banner-index="selectedBannerIndex"
      :banner-draft-restored="bannerDraftRestored"
      :banner-form="bannerForm"
      :banner-form-errors="bannerFormErrors"
      :banners="banners"
      :selected-story-slug="selectedStorySlug"
      :story-draft-restored="storyDraftRestored"
      :story-form="storyForm"
      :story-form-errors="storyFormErrors"
      :stories="stories"
      :status-label="statusLabel"
      :format-date="formatDate"
      :save-course-as="saveCourseAs"
      :lesson-name="lessonName"
      :load-assignment-submissions="loadAssignmentSubmissions"
      :review-assignment-submission="reviewAssignmentSubmission"
      :edit-project-topic="editProjectTopic"
      :save-project-topic-as="saveProjectTopicAs"
      :save-competition-as="saveCompetitionAs"
      :select-competition="selectCompetition"
      :review-registration="reviewRegistration"
      :send-competition-reminder="sendCompetitionReminder"
      :send-match-reminder="sendMatchReminder"
      :apply-match-override="applyMatchOverride"
      :start-banner-create="startBannerCreate"
      :save-banner="saveBanner"
      :delete-banner="deleteBanner"
      :select-banner="selectBanner"
      :start-story-create="startStoryCreate"
      :save-story="saveStory"
      :delete-story="deleteStory"
      :select-story="selectStory"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import TeacherUploadSidebar from '@/components/teacher/TeacherUploadSidebar.vue';
import TeacherPublishPanel from '@/components/teacher/TeacherPublishPanel.vue';
import { useTeacherDashboard } from '@/composables/teacher/useTeacherDashboard';

const dashboard = useTeacherDashboard();
// Expose all dashboard variables to the template
defineExpose(dashboard);

const {
  uploadKind, myCourses, selectedCourseId, myProjectTopics, myCompetitions,
  selectedCompetitionSlug, banners, selectedBannerIndex, stories, selectedStorySlug,
  selectedCourse, courseDraftRestored, selectedCourseLessons, assignments, courseSaving,
  selectedAssignment, submissions, reviewDrafts, selectedProjectTopic, selectedCompetition,
  competitionDraftRestored, registrationStats, competitionCandidates, reminderForm,
  selectedCompetitionReminderStatus, isSelectedCompetitionDeadlinePast, registrations,
  bannerDraftRestored, bannerForm, bannerFormErrors, storyDraftRestored, storyForm, storyFormErrors,
  goModule, selectCourse, editProjectTopic, selectCompetition, selectBanner, selectStory,
  statusLabel, formatDate, saveCourseAs, lessonName, loadAssignmentSubmissions, reviewAssignmentSubmission,
  saveProjectTopicAs, saveCompetitionAs, reviewRegistration, sendCompetitionReminder, sendMatchReminder,
  applyMatchOverride, startBannerCreate, saveBanner, deleteBanner, startStoryCreate, saveStory, deleteStory,
  applyRouteState
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

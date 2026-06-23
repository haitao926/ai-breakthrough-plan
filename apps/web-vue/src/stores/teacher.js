import { defineStore } from 'pinia';
import { apiFetch, readJsonResponse } from '@/api/client';

export const useTeacherStore = defineStore('teacher', {
  state: () => ({
    loading: false,
    courses: [],
    competitions: [],
    banners: [],
    stories: [],
    resources: [],
    projectTopics: [],
    reviewQueue: []
  }),
  actions: {
    async fetchAll() {
      this.loading = true;
      try {
        await Promise.all([
          this.fetchCourses(),
          this.fetchCompetitions(),
          this.fetchBanners(),
          this.fetchStories(),
          this.fetchResources(),
          this.fetchProjectTopics(),
          this.fetchProjectReviewQueue()
        ]);
      } catch (err) {
        console.error('Failed to fetch teacher data', err);
      } finally {
        this.loading = false;
      }
    },
    async fetchCourses() {
      const res = await apiFetch('/courses');
      const data = await readJsonResponse(res, 'courses');
      if (res.ok) this.courses = data.courses || [];
    },
    async fetchCompetitions() {
      const res = await apiFetch('/teacher/competitions');
      const data = await readJsonResponse(res, 'teacher_competitions');
      if (res.ok) this.competitions = data.competitions || [];
    },
    async fetchBanners() {
      const res = await apiFetch('/teacher/banners');
      const data = await readJsonResponse(res, 'teacher_banners');
      if (res.ok) this.banners = data.banners || [];
    },
    async fetchStories() {
      const res = await apiFetch('/teacher/stories');
      const data = await readJsonResponse(res, 'teacher_stories');
      if (res.ok) this.stories = data.stories || [];
    },
    async fetchResources() {
      const res = await apiFetch('/teacher/resources?status=pending');
      const data = await readJsonResponse(res, 'resources');
      if (res.ok) this.resources = data.requests || [];
    },
    async fetchProjectTopics() {
      const res = await apiFetch('/teacher/project-topics');
      const data = await readJsonResponse(res, 'project_topics');
      if (res.ok) this.projectTopics = data.topics || [];
    },
    async fetchProjectReviewQueue() {
      const res = await apiFetch('/teacher/project-review-queue');
      const data = await readJsonResponse(res, 'project_review_queue');
      if (res.ok) this.reviewQueue = data.projects || [];
    }
  }
});

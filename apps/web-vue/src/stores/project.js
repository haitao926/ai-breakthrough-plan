import { defineStore } from 'pinia';
import { apiFetch } from '@/api/client';

function indexSubmissions(submissions = []) {
  const map = {};
  submissions.forEach((sub) => {
    if (!sub?.type) return;
    const current = map[sub.type];
    if (!current || new Date(sub.created_at) > new Date(current.created_at)) {
      map[sub.type] = sub;
    }
  });
  return map;
}

function normalizeMilestoneStatus(status) {
  if (!status) return 'todo';
  if (['todo', 'doing', 'review', 'done'].includes(status)) return status;
  const map = { pending: 'todo', submitted: 'review', approved: 'done', rejected: 'todo' };
  return map[status] || 'todo';
}

function parseDeliverables(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export const useProjectStore = defineStore('project', {
  state: () => ({
    list: [],
    listLoading: false,
    detail: null,
    submissionIndex: {},
    milestones: [],
    milestonesLoading: false,
    logs: [],
    logsLoading: false,
    lastVisitedId: ''
  }),
  persist: {
    paths: ['lastVisitedId']
  },
  actions: {
    setLastVisited(id) {
      this.lastVisitedId = String(id || '');
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ai_course_last_project', this.lastVisitedId);
      }
    },
    async fetchList() {
      this.listLoading = true;
      try {
        const res = await apiFetch('/projects');
        const data = await res.json();
        this.list = data.projects || [];
      } catch (err) {
        console.error(err);
        this.list = [];
      } finally {
        this.listLoading = false;
      }
      return this.list;
    },
    async create(title) {
      const res = await apiFetch('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '创建失败');
      await this.fetchList();
      return data.project || data;
    },
    async fetchDetail(projectId) {
      if (!projectId) {
        this.detail = null;
        this.submissionIndex = {};
        return null;
      }
      const res = await apiFetch(`/projects/${projectId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '加载项目失败');
      this.detail = data;
      this.submissionIndex = indexSubmissions(data.submissions || []);
      return data;
    },
    async fetchMilestones(projectId) {
      if (!projectId) {
        this.milestones = [];
        return [];
      }
      this.milestonesLoading = true;
      try {
        const res = await apiFetch(`/projects/${projectId}/milestones`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || '加载失败');
        this.milestones = (data.milestones || []).map((item) => {
          const status = normalizeMilestoneStatus(item.status);
          return {
            ...item,
            status,
            statusLabel: {
              todo: '待办',
              doing: '进行中',
              review: '待验收',
              done: '已完成'
            }[status] || '待办',
            phase: item.phase || item.description || 'm1'
          };
        });

        if (typeof window !== 'undefined') {
          const cacheKey = `ai_course_wbs_${projectId}`;
          const tasks = this.milestones.map((item) => {
            const deliverables = parseDeliverables(item.deliverables);
            return {
              title: item.title,
              phase: item.phase || 'm1',
              output: deliverables.output || ''
            };
          });
          window.localStorage.setItem(cacheKey, JSON.stringify({ tasks }));
        }
      } catch (err) {
        console.error(err);
        this.milestones = [];
      } finally {
        this.milestonesLoading = false;
      }
      return this.milestones;
    },
    async fetchLogs(projectId) {
      if (!projectId) {
        this.logs = [];
        return [];
      }
      this.logsLoading = true;
      try {
        const res = await apiFetch(`/projects/${projectId}/logs`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || '加载失败');
        this.logs = Array.isArray(data.logs) ? data.logs : [];
      } catch (err) {
        console.error(err);
        this.logs = [];
      } finally {
        this.logsLoading = false;
      }
      return this.logs;
    },
    async refreshImplementationData(projectId) {
      await Promise.all([this.fetchMilestones(projectId), this.fetchLogs(projectId)]);
    }
  }
});

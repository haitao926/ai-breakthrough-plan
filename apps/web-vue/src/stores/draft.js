import { defineStore } from 'pinia';
import { clearDraft, loadDraft, saveDraft } from '@/modules/workspace/draft';

export const useDraftStore = defineStore('draft', {
  state: () => ({
    draftsByProject: {}
  }),
  persist: true,
  getters: {
    draftMap: (state) => (projectId) => state.draftsByProject[String(projectId || '')] || {}
  },
  actions: {
    refreshProjectDrafts(projectId, stageKeys) {
      const id = String(projectId || '');
      if (!id) return {};
      const next = {};
      stageKeys.forEach((key) => {
        next[key] = loadDraft(id, key) || this.draftsByProject[id]?.[key] || null;
      });
      this.draftsByProject[id] = next;
      return next;
    },
    saveProjectDraft(projectId, stageKey, details) {
      const id = String(projectId || '');
      if (!id || !stageKey) return null;
      const payload = saveDraft(id, stageKey, details);
      this.draftsByProject[id] = {
        ...(this.draftsByProject[id] || {}),
        [stageKey]: payload
      };
      return payload;
    },
    clearProjectDraft(projectId, stageKey) {
      const id = String(projectId || '');
      if (!id || !stageKey) return;
      clearDraft(id, stageKey);
      this.draftsByProject[id] = {
        ...(this.draftsByProject[id] || {}),
        [stageKey]: null
      };
    }
  }
});

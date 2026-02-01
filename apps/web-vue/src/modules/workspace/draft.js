function hasContent(details) {
  if (!details) return false;
  return Object.values(details).some(value => String(value || '').trim());
}

export function getDraftKey(projectId, stageKey) {
  return `ai_course_draft_${projectId}_${stageKey}`;
}

export function loadDraft(projectId, stageKey) {
  if (!projectId || !stageKey) return null;
  try {
    const raw = window.localStorage.getItem(getDraftKey(projectId, stageKey));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function saveDraft(projectId, stageKey, details) {
  if (!projectId || !stageKey) return null;
  if (!hasContent(details)) {
    clearDraft(projectId, stageKey);
    return null;
  }
  const payload = { details, savedAt: new Date().toISOString() };
  window.localStorage.setItem(getDraftKey(projectId, stageKey), JSON.stringify(payload));
  return payload;
}

export function clearDraft(projectId, stageKey) {
  if (!projectId || !stageKey) return;
  window.localStorage.removeItem(getDraftKey(projectId, stageKey));
}


import { apiFetch, readJsonResponse } from './client';

function readLocal(localKey) {
  try {
    return JSON.parse(window.localStorage.getItem(localKey) || '{}');
  } catch {
    return {};
  }
}

export async function loadToolData(projectId, toolKey, localKey) {
  const localData = readLocal(localKey);
  if (!projectId || !toolKey) return localData;
  try {
    const res = await apiFetch(`/projects/${projectId}/tool-data/${toolKey}`);
    const data = await readJsonResponse(res, `tool_data_${toolKey}`);
    if (!res.ok) return localData;
    return data?.data || localData;
  } catch {
    return localData;
  }
}

export async function saveToolData(projectId, toolKey, localKey, payload) {
  const data = payload && typeof payload === 'object' ? payload : {};
  window.localStorage.setItem(localKey, JSON.stringify(data));
  if (!projectId || !toolKey) return { savedRemote: false };
  try {
    const res = await apiFetch(`/projects/${projectId}/tool-data/${toolKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    if (!res.ok) return { savedRemote: false };
    return { savedRemote: true };
  } catch {
    return { savedRemote: false };
  }
}

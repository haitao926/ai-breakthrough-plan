import { apiFetch, readJsonResponse } from './client';

async function unwrap(path, key = 'items') {
  const res = await apiFetch(path);
  const data = await readJsonResponse(res, path.replace(/\W+/g, '_'));
  if (!res.ok) {
    throw new Error(data?.error || `${path} failed`);
  }
  return data[key];
}

export function fetchPortalBanners() {
  return unwrap('/public/banners');
}

export function fetchCompetitions() {
  return unwrap('/public/competitions');
}

export async function fetchCompetitionDetail(slug) {
  const res = await apiFetch(`/public/competitions/${slug}`);
  const data = await readJsonResponse(res, 'competition_detail');
  if (!res.ok) throw new Error(data?.error || 'competition_detail_failed');
  return data.item;
}

export function fetchStories() {
  return unwrap('/public/stories');
}

export function fetchPathMappings() {
  return unwrap('/public/path-mappings');
}

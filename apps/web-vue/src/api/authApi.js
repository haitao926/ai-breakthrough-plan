import { apiFetch, readJsonResponse } from './client';
import { setAuth, getAuthUser, clearAuth } from './auth';

export async function loginUser(identifier, password) {
  const payload = { email: identifier, password };
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(res, 'auth_login');
  if (!res.ok) throw new Error(data.error || '登录失败');
  setAuth(data.token, data.user);
  return data.user;
}

export async function registerUser(payload) {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await readJsonResponse(res, 'auth_register');
  if (!res.ok) throw new Error(data.error || '注册失败');
  setAuth(data.token, data.user);
  return data.user;
}

export function getCurrentUser() {
  return getAuthUser();
}

export async function fetchCurrentUser() {
  const res = await apiFetch('/auth/me');
  const data = await readJsonResponse(res, 'auth_me');
  if (!res.ok) throw new Error(data.error || '获取当前用户失败');
  return data.user;
}

export function logout() {
  clearAuth();
}

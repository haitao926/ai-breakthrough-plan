import { apiFetch } from './client';
import { setAuth, getAuthUser, clearAuth } from './auth';

export async function loginUser(identifier, password) {
  const payload = { email: identifier, password };
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '注册失败');
  setAuth(data.token, data.user);
  return data.user;
}

export function getCurrentUser() {
  return getAuthUser();
}

export function logout() {
  clearAuth();
}

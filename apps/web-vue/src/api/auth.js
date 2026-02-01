const AUTH_TOKEN_KEY = 'haitlab_token';
const AUTH_USER_KEY = 'haitlab_user';
const MODEL_KEY_KEY = 'haitlab_model_key';

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getAuthUser() {
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function getModelKey() {
  const raw = window.localStorage.getItem(MODEL_KEY_KEY);
  if (!raw) return '';
  return String(raw).trim();
}

export function setModelKey(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    window.localStorage.removeItem(MODEL_KEY_KEY);
    return '';
  }
  window.localStorage.setItem(MODEL_KEY_KEY, raw);
  return raw;
}

export function clearModelKey() {
  window.localStorage.removeItem(MODEL_KEY_KEY);
}

export function setAuth(token, user) {
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export function updateAuthUser(user) {
  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export function clearAuth() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

const API_BASE = '/api/v1';
const AUTH_TOKEN_KEY = 'haitlab_token';
const AUTH_USER_KEY = 'haitlab_user';

function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

function getAuthUser() {
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function setAuth(token, user) {
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

function updateAuthUser(user) {
  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

function clearAuth() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

function resolveApiUrl(path) {
  if (/^https?:/i.test(path)) return path;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${suffix}`;
}

function apiFetch(path, options = {}) {
  const url = resolveApiUrl(path);
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

async function loginUser(email, password) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '登录失败');
  setAuth(data.token, data.user);
  return data.user;
}

async function registerUser(payload) {
  const res = await apiFetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '注册失败');
  if (data.token && data.user) {
    setAuth(data.token, data.user);
  }
  return data.user;
}

function redirectToLogin() {
  const path = window.location.pathname.split('/').pop();
  if (path && path !== 'login.html') {
    window.sessionStorage.setItem('auth_redirect', path);
  }
  window.location.href = 'login.html';
}

function renderCurrentUser(user) {
  const currentUserEl = document.getElementById('currentUser');
  if (currentUserEl) {
    const roleLabel = user.role === 'teacher' ? '老师' : user.role === 'judge' ? '评委' : '学生';
    currentUserEl.textContent = `${user.name || user.email}（${roleLabel}）`;
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAuth();
      window.location.href = 'login.html';
    });
  }
}

function requireAuth(requiredRole) {
  const token = getAuthToken();
  const user = getAuthUser();
  if (!token || !user) {
    redirectToLogin();
    return null;
  }
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : [];
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    window.location.href = (user.role === 'teacher' || user.role === 'judge') ? 'teacher.html' : 'workspace.html';
    return null;
  }
  renderCurrentUser(user);
  return user;
}

window.auth = {
  apiFetch,
  loginUser,
  registerUser,
  getAuthUser,
  updateAuthUser,
  renderCurrentUser,
  requireAuth,
  clearAuth
};

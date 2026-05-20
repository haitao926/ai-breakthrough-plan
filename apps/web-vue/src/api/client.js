import { clearAuth, getAuthToken, getModelKey } from './auth';

const DEFAULT_CONFIG = {
  apiBase: '/api/v1',
  legacyBase: ''
};

let cachedConfig = null;
let isHandlingUnauthorized = false;

export async function loadConfig() {
  if (cachedConfig) return cachedConfig;
  try {
    const res = await fetch('/config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('config_not_found');
    cachedConfig = await res.json();
  } catch (err) {
    cachedConfig = { ...DEFAULT_CONFIG };
  }
  if (!cachedConfig.apiBase) cachedConfig.apiBase = DEFAULT_CONFIG.apiBase;
  if (cachedConfig.legacyBase === undefined || cachedConfig.legacyBase === null) {
    cachedConfig.legacyBase = DEFAULT_CONFIG.legacyBase;
  }
  return cachedConfig;
}

export async function getLegacyBase() {
  const config = await loadConfig();
  const base = config.legacyBase || '';
  if (window.location.port === '5173') {
    return base ? `http://localhost:8090${base}` : 'http://localhost:8090';
  }
  return base;
}

export async function apiFetch(path, options = {}) {
  const config = await loadConfig();
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http') ? path : `${config.apiBase}${suffix}`;
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const modelKey = getModelKey();
  if (modelKey) {
    headers.set('x-model-key', modelKey);
  }
  const response = await fetch(url, { ...options, headers });

  const isAuthRequest = suffix.startsWith('/auth/login') || suffix.startsWith('/auth/register');
  if (response.status === 401 && !isAuthRequest && typeof window !== 'undefined') {
    clearAuth();

    const onAuthPage = ['/login', '/register'].includes(window.location.pathname);
    if (!onAuthPage && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;
      const redirectTarget = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.sessionStorage.setItem('auth_redirect', redirectTarget);
      window.location.assign('/login');
    }
  }

  return response;
}

export async function readJsonResponse(response, label = 'api_request') {
  const rawText = await response.text();
  const trimmed = rawText.trim();

  if (!trimmed) return {};

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const looksLikeHtml = trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.startsWith('<');
    if (looksLikeHtml) {
      throw new Error(`${label}_returned_html`);
    }
    throw new Error(`${label}_invalid_json`);
  }
}

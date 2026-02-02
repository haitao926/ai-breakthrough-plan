(() => {
  const AUTH_TOKEN_KEY = "haitlab_token";
  const AUTH_USER_KEY = "haitlab_user";
  const MODEL_KEY_KEY = "haitlab_model_key";
  const DEFAULT_CONFIG = { apiBase: "/api/v1" };

  let cachedConfig = null;

  async function loadConfig() {
    if (cachedConfig) return cachedConfig;
    try {
      const res = await fetch("/config.json", { cache: "no-store" });
      if (!res.ok) throw new Error("config_not_found");
      cachedConfig = await res.json();
    } catch (err) {
      cachedConfig = { ...DEFAULT_CONFIG };
    }
    if (!cachedConfig.apiBase) cachedConfig.apiBase = DEFAULT_CONFIG.apiBase;
    return cachedConfig;
  }

  function getAuthToken() {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  }

  function getCurrentUser() {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function getModelKey() {
    const raw = window.localStorage.getItem(MODEL_KEY_KEY);
    return raw ? String(raw).trim() : "";
  }

  function requireAuth(role) {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = "/login";
      return null;
    }
    if (role && user.role && user.role !== role) {
      window.alert("权限不足");
      return null;
    }
    return user;
  }

  async function apiFetch(path, options = {}) {
    const config = await loadConfig();
    const suffix = path.startsWith("/") ? path : `/${path}`;
    const url = path.startsWith("http") ? path : `${config.apiBase}${suffix}`;
    const headers = new Headers(options.headers || {});
    const token = getAuthToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const modelKey = getModelKey();
    if (modelKey) headers.set("x-model-key", modelKey);
    return fetch(url, { ...options, headers });
  }

  window.auth = {
    apiFetch,
    requireAuth,
    getCurrentUser
  };
})();

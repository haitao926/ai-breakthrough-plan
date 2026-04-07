import { defineStore } from 'pinia';
import { getAuthToken, getAuthUser, clearAuth } from '@/api/auth';
import { loginUser, registerUser } from '@/api/authApi';

const AUTH_REDIRECT_KEY = 'auth_redirect';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: getAuthUser(),
    token: getAuthToken()
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user && state.token),
    isTeacherLike: (state) => ['teacher', 'judge'].includes(state.user?.role)
  },
  actions: {
    hydrate() {
      this.user = getAuthUser();
      this.token = getAuthToken();
    },
    async login(identifier, password) {
      const user = await loginUser(identifier, password);
      this.hydrate();
      return user;
    },
    async register(payload) {
      const user = await registerUser(payload);
      this.hydrate();
      return user;
    },
    logout() {
      clearAuth();
      this.user = null;
      this.token = '';
    },
    setRedirect(path) {
      if (typeof window === 'undefined' || !path) return;
      window.sessionStorage.setItem(AUTH_REDIRECT_KEY, path);
    },
    consumeRedirect(fallback = '/') {
      if (typeof window === 'undefined') return fallback;
      const redirect = window.sessionStorage.getItem(AUTH_REDIRECT_KEY) || fallback;
      window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
      return redirect;
    }
  }
});

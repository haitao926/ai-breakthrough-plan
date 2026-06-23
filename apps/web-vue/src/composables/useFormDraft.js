import { watch } from 'vue';

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_err) {
    return null;
  }
}

export function useFormDraft(key, target, options = {}) {
  const storageKey = `formDraft:${key}`;
  const shouldSave = options.shouldSave || (() => true);

  function restore() {
    if (typeof window === 'undefined') return false;
    const saved = safeParse(window.localStorage.getItem(storageKey));
    if (!saved || typeof saved !== 'object') return false;
    Object.assign(target, saved);
    return true;
  }

  function clear() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(storageKey);
  }

  watch(target, (value) => {
    if (typeof window === 'undefined') return;
    if (!shouldSave(value)) {
      clear();
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, { deep: true });

  return {
    restoreDraft: restore,
    clearDraft: clear
  };
}

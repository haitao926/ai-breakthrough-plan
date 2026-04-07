import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([]);

  const show = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    notifications.value.push({ id, message, type });
    
    setTimeout(() => {
      remove(id);
    }, duration);
  };

  const remove = (id) => {
    notifications.value = notifications.value.filter(n => n.id !== id);
  };

  const success = (msg, dur) => show(msg, 'success', dur);
  const error = (msg, dur) => show(msg, 'error', dur);
  const warning = (msg, dur) => show(msg, 'warning', dur);
  const info = (msg, dur) => show(msg, 'info', dur);

  return { notifications, show, remove, success, error, warning, info };
});

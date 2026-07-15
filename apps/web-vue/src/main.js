import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import pinia from './stores';
import './styles/base.css';

const app = createApp(App);

function applyLazyLoading(root) {
  if (typeof root?.querySelectorAll !== 'function') return;
  root.querySelectorAll('img').forEach((img) => {
    if (img.dataset.eager === 'true') return;
    if (!img.getAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });
}

app.directive('lazy', {
  mounted(element) {
    if (element?.tagName === 'IMG') {
      if (!element.getAttribute('loading') && element.dataset.eager !== 'true') {
        element.setAttribute('loading', 'lazy');
      }
      return;
    }
    applyLazyLoading(element);
  },
  updated(element) {
    if (element?.tagName === 'IMG') {
      if (!element.getAttribute('loading') && element.dataset.eager !== 'true') {
        element.setAttribute('loading', 'lazy');
      }
      return;
    }
    applyLazyLoading(element);
  }
});

app.directive('img-loading', {
  mounted(element) {
    applyLazyLoading(element);
  },
  updated(element) {
    applyLazyLoading(element);
  }
});

app.use(pinia);
app.use(router);
app.mount('#app');

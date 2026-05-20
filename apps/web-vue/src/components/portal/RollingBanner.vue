<template>
  <section v-if="items.length" class="rolling-banner" :class="{ 'rolling-banner--compact': compact }">
    <div class="rolling-banner__stage">
      <component
        v-for="(item, index) in items"
        :key="`${item.image}-${index}`"
        :is="item.targetUrl ? RouterLink : 'div'"
        v-bind="getSlideProps(item)"
        class="rolling-banner__slide"
        :class="{
          'is-active': index === currentIndex,
          'is-clickable': Boolean(item.targetUrl)
        }"
        :aria-hidden="index !== currentIndex"
      >
        <img v-if="item.image" :src="item.image" :alt="item.title || item.tag || 'banner image'" />
        <div
          v-if="item.title || item.summary || item.buttonText"
          class="rolling-banner__overlay"
          :class="{ 'rolling-banner__overlay--center': item.layout === 'center' }"
        >
          <div
            class="rolling-banner__content"
            :class="{ 'rolling-banner__content--center': item.layout === 'center' }"
          >
            <p v-if="item.tag" class="rolling-banner__tag">{{ item.tag }}</p>
            <h2 v-if="item.title" class="rolling-banner__title">{{ item.title }}</h2>
            <p v-if="item.summary" class="rolling-banner__summary">{{ item.summary }}</p>
            <span v-if="item.buttonText" class="rolling-banner__cta">
              {{ item.buttonText }}
              <i class="fas fa-arrow-right"></i>
            </span>
          </div>
        </div>
      </component>

      <div v-if="items.length > 1" class="rolling-banner__controls" aria-label="Banner navigation">
        <button
          v-for="(item, index) in items"
          :key="`${item.title || item.tag || 'item'}-${index}`"
          type="button"
          class="rolling-banner__dot"
          :class="{ 'is-active': index === currentIndex }"
          :aria-current="index === currentIndex ? 'true' : 'false'"
          :aria-label="`切换到第 ${index + 1} 张横幅：${item.title || item.tag || '内容图'}`"
          @click="setCurrent(index)"
        >
          <span class="rolling-banner__sr">{{ item.title || item.tag || '内容图' }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  compact: {
    type: Boolean,
    default: false
  }
});

const currentIndex = ref(0);
let timer = null;

const itemSignature = computed(() =>
  props.items.map(item => `${item.image}|${item.title}|${item.tag}`).join('::')
);

function stopRotation() {
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }
}

function startRotation() {
  stopRotation();
  if (props.items.length < 2) return;
  timer = window.setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % props.items.length;
  }, 5600);
}

function setCurrent(index) {
  currentIndex.value = index;
  startRotation();
}

function getSlideProps(item) {
  return item.targetUrl ? { to: item.targetUrl } : {};
}

watch(itemSignature, () => {
  currentIndex.value = 0;
  startRotation();
});

onMounted(startRotation);
onUnmounted(stopRotation);
</script>

<style scoped>
.rolling-banner {
  width: 100%;
}

.rolling-banner__stage {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 3.35;
  border-radius: 30px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.18), transparent 30%),
    linear-gradient(180deg, #eef2ff 0%, #f8fafc 100%);
  box-shadow: 0 28px 60px -42px rgba(15, 23, 42, 0.44);
  isolation: isolate;
}

.rolling-banner--compact .rolling-banner__stage {
  border-radius: 28px;
}

.rolling-banner__slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: scale(1.028);
  color: inherit;
  text-decoration: none;
  pointer-events: none;
  transition:
    opacity 0.72s ease,
    transform 1.45s ease;
}

.rolling-banner__slide.is-active {
  z-index: 1;
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

.rolling-banner__slide.is-clickable {
  cursor: pointer;
}

.rolling-banner__slide img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.rolling-banner__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  padding: 24px 36px;
  background:
    radial-gradient(circle at 18% 50%, rgba(49, 46, 129, 0.8), rgba(79, 70, 229, 0.42) 36%, rgba(99, 102, 241, 0.22) 100%),
    linear-gradient(90deg, rgba(49, 46, 129, 0.78), rgba(79, 70, 229, 0.5) 52%, rgba(99, 102, 241, 0.24));
}

.rolling-banner__overlay--center {
  justify-content: center;
  text-align: center;
  background:
    radial-gradient(circle at center, rgba(49, 46, 129, 0.7), rgba(79, 70, 229, 0.42) 44%, rgba(99, 102, 241, 0.16) 100%);
}

.rolling-banner__content {
  max-width: min(560px, calc(100% - 96px));
}

.rolling-banner__content--center {
  max-width: min(780px, calc(100% - 112px));
}

.rolling-banner__tag {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.rolling-banner__title {
  margin: 9px 0 0;
  color: #fff;
  font-family: inherit;
  font-size: clamp(1.75rem, 3.1vw, 3.35rem);
  font-weight: 800;
  line-height: 1.03;
  letter-spacing: -0.05em;
  text-shadow: 0 14px 38px rgba(15, 23, 42, 0.28);
}

.rolling-banner__summary {
  margin: 12px auto 0;
  max-width: 42rem;
  color: rgba(248, 250, 252, 0.86);
  font-size: clamp(0.9rem, 1.1vw, 1rem);
  line-height: 1.58;
}

.rolling-banner__content:not(.rolling-banner__content--center) .rolling-banner__summary {
  margin-right: 0;
  margin-left: 0;
}

.rolling-banner__cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  min-width: 132px;
  min-height: 40px;
  margin-top: 18px;
  padding: 0 22px;
  border-radius: 999px;
  background: #fef08a;
  color: #312e81;
  font-size: 0.86rem;
  font-weight: 800;
  box-shadow: 0 18px 36px -26px rgba(15, 23, 42, 0.72);
}

.rolling-banner__controls {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 34px -24px rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(16px);
}

.rolling-banner__dot {
  position: relative;
  width: 18px;
  height: 8px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: rgba(51, 65, 85, 0.22);
  cursor: pointer;
  transition:
    width 0.22s ease,
    background 0.22s ease,
    transform 0.22s ease;
}

.rolling-banner__dot:hover {
  transform: translateY(-1px);
}

.rolling-banner__dot:focus-visible {
  outline: 2px solid rgba(79, 70, 229, 0.85);
  outline-offset: 2px;
}

.rolling-banner__dot.is-active {
  width: 42px;
  background: rgba(15, 23, 42, 0.88);
}

.rolling-banner__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 900px) {
  .rolling-banner__stage {
    aspect-ratio: 16 / 9;
    border-radius: 24px;
  }

  .rolling-banner__overlay {
    align-items: flex-end;
    padding: 18px;
  }

  .rolling-banner__content {
    max-width: calc(100% - 76px);
  }

  .rolling-banner__controls {
    right: 14px;
    bottom: 14px;
  }
}
</style>

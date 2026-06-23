<template>
  <div v-img-loading>
    <component :is="layoutComponent">
      <router-view v-slot="{ Component, route }">
        <Transition name="route-fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </router-view>
    </component>
    <AppNotification />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppNotification from '@/components/common/AppNotification.vue';
import PortalLayout from '@/layouts/PortalLayout.vue';
import BlankLayout from '@/layouts/BlankLayout.vue';
import TeacherLayout from '@/layouts/TeacherLayout.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';

const route = useRoute();

const layouts = {
  PortalLayout,
  BlankLayout,
  TeacherLayout,
  AdminLayout
};

// Use the route's meta.layout, or fallback to PortalLayout if portalShell is true for backwards compatibility, else BlankLayout
const layoutComponent = computed(() => {
  const layoutName = route.meta?.layout || (route.meta?.portalShell ? 'PortalLayout' : 'BlankLayout');
  return layouts[layoutName] || BlankLayout;
});
</script>

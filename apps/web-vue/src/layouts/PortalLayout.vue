<template>
  <div class="portal-layout flex min-h-dvh flex-col">
    <SiteNav :active="navActive" />
    <div class="portal-main flex-1 flex flex-col">
      <slot></slot>
    </div>
    <PortalFooter />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SiteNav from '@/components/SiteNav.vue';
import PortalFooter from '@/components/portal/PortalFooter.vue';

const route = useRoute();
const navActive = computed(() => String(route.meta?.navActive || ''));
</script>

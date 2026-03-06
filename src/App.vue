<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const route = useRoute()
const layoutName = computed(() => (route.meta.layout as string) || 'bare')
</script>

<template>
  <MainLayout v-if="layoutName === 'main'" />
  <template v-else>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </template>
</template>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity var(--transition-hover);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

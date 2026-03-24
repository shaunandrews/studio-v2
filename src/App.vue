<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import ShortcutsModal from '@/components/composites/ShortcutsModal.vue'
import ConfirmDialog from '@/components/primitives/ConfirmDialog.vue'
import { usePersona } from '@/data/usePersona'
import { useSites } from '@/data/useSites'

const { activeProject } = useSites()
const route = useRoute()
const router = useRouter()
const layoutName = computed(() => (route.meta.layout as string) || 'bare')

const showShortcuts = ref(false)
const { clearPersona } = usePersona()

watchEffect(() => {
  document.title = activeProject.value
    ? `WordPress Studio · ${activeProject.value.name}`
    : 'WordPress Studio'
})

function onGlobalKeydown(e: KeyboardEvent) {
  // Cmd+/ — Toggle shortcuts modal (global)
  if ((e.metaKey || e.ctrlKey) && e.key === '/') {
    e.preventDefault()
    showShortcuts.value = !showShortcuts.value
  }
  // Cmd+Shift+P — Switch persona (global)
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
    e.preventDefault()
    showShortcuts.value = false
    clearPersona(router)
  }
}

onMounted(() => {
  document.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <MainLayout v-if="layoutName === 'main'" />
  <template v-else>
    <router-view />
  </template>
  <ShortcutsModal :open="showShortcuts" @close="showShortcuts = false" />
  <ConfirmDialog />
</template>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity var(--transition-hover);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string
  surface?: 'light' | 'dark'
}>(), {
  surface: 'light',
})
</script>

<template>
  <div class="panel vstack flex-1 min-w-0 overflow-hidden" :class="`surface-${props.surface}`">
    <slot />
  </div>
</template>

<style scoped>
.panel {
  border-inline-start: 1px solid var(--color-surface-border);
}

.panel.surface-dark {
  border-inline-start-color: var(--color-chrome-border);
}

.panel:first-child {
  border-inline-start: none;
}
</style>

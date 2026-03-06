<script setup lang="ts">
defineProps<{
  label: string
  active?: boolean
}>()
</script>

<template>
  <button class="prefs-nav-item" :class="{ 'is-active': active }">
    {{ label }}
  </button>
</template>

<style scoped>
.prefs-nav-item {
  display: flex;
  align-items: center;
  height: 32px;
  width: 100%;
  padding: 0 var(--space-s);
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-m);
  line-height: var(--line-height-s);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--duration-instant) var(--ease-default);
}

.prefs-nav-item:hover:not(.is-active) {
  background: var(--color-frame-hover);
}

.prefs-nav-item.is-active {
  background: var(--color-frame-fg);
  color: var(--color-frame-bg);
}
</style>

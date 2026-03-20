<script setup lang="ts">
defineProps<{
  isDragging?: boolean
}>()

defineEmits<{
  pointerdown: [e: PointerEvent]
  dblclick: []
}>()
</script>

<template>
  <div
    class="resize-handle"
    :class="{ 'is-dragging': isDragging }"
    @pointerdown="$emit('pointerdown', $event)"
    @dblclick="$emit('dblclick')"
  >
    <div class="resize-handle__line" />
  </div>
</template>

<style scoped>
.resize-handle {
  position: relative;
  flex: 0 0 1px;
  width: 1px;
  cursor: col-resize;
  z-index: 2;
  background: var(--color-frame-border);
}

/* Wider hit area */
.resize-handle::before {
  content: '';
  position: absolute;
  inset-block: 0;
  inset-inline-start: -3px;
  inset-inline-end: -3px;
}

/* Visible indicator on hover/drag */
.resize-handle__line {
  position: absolute;
  inset-block: 0;
  width: 2px;
  background: var(--color-frame-theme);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-default);
  pointer-events: none;
}

.resize-handle:hover .resize-handle__line,
.resize-handle.is-dragging .resize-handle__line {
  opacity: 1;
}
</style>

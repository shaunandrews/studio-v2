<script setup lang="ts">
withDefaults(defineProps<{
  selected?: boolean
  stack?: boolean
  count?: number
}>(), {
  selected: false,
  stack: false,
})
</script>

<template>
  <div class="canvas-card" :class="{ 'is-selected': selected, 'canvas-card--stack': stack }">
    <div v-if="stack" class="canvas-card__stack" aria-hidden="true">
      <div class="canvas-card__stack-layer" />
      <div class="canvas-card__stack-layer" />
    </div>
    <div class="canvas-card__content">
      <slot />
    </div>
    <span v-if="stack && count" class="canvas-card__badge">{{ count }}</span>
  </div>
</template>

<style scoped>
.canvas-card {
  position: relative;
}

.canvas-card--stack {
  padding-block-end: 8px;
  padding-inline-end: 8px;
}

/* ── Stack layers ── */

.canvas-card__stack {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* Back layer — full offset (renders first, sits behind) */
.canvas-card__stack-layer:first-child {
  position: absolute;
  inset-inline-start: 8px;
  inset-block-start: 8px;
  inset-inline-end: 0;
  inset-block-end: 0;
  background: var(--color-frame-bg);
  border: calc(1px / var(--zoom, 1)) solid var(--color-frame-border);
  box-shadow: 0 calc(1px / var(--zoom, 1)) calc(3px / var(--zoom, 1)) var(--color-shadow);
}

/* Middle layer — half offset (renders second, sits in front of back) */
.canvas-card__stack-layer:last-child {
  position: absolute;
  inset-inline-start: 4px;
  inset-block-start: 4px;
  inset-inline-end: 4px;
  inset-block-end: 4px;
  background: var(--color-frame-bg);
  border: calc(1px / var(--zoom, 1)) solid var(--color-frame-border);
  box-shadow: 0 calc(1px / var(--zoom, 1)) calc(3px / var(--zoom, 1)) var(--color-shadow);
}

/* ── Content area ── */

.canvas-card__content {
  position: relative;
  z-index: 1;
  overflow: hidden;
  background: white;
  /* border-radius: calc(var(--radius-s) / var(--zoom, 1)); */
  box-shadow: 0 calc(1px / var(--zoom, 1)) calc(3px / var(--zoom, 1)) var(--color-shadow);
  transition: outline-color var(--duration-fast) var(--ease-default);
  outline: calc(1.5px / var(--zoom, 1)) solid transparent;
  outline-offset: calc(2px / var(--zoom, 1));
}

.is-selected .canvas-card__content {
  outline-color: var(--color-frame-selected);
}

/* ── Badge ── */

.canvas-card__badge {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  transform-origin: top right;
  z-index: 3;
  min-width: 20px;
  height: 20px;
  padding: 0 var(--space-xxs);
  border-radius: 10px;
  background: var(--color-theme-bg);
  color: var(--color-theme-fg);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  text-align: center;
}

/* ── Dark mode ── */

@media (prefers-color-scheme: dark) {
  .canvas-card__content {
    background: #2c2c2c;
  }

  .canvas-card__stack-layer {
    background: var(--color-frame-bg);
  }
}
</style>

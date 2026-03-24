<script setup lang="ts">
import type { PreviewOperation } from '@/data/types'

defineProps<{
  operation: PreviewOperation
}>()
</script>

<template>
  <div class="progress-card">
    <div class="progress-card__main">
      <span class="progress-card__detail">{{ operation.detail }}</span>
      <div class="progress-card__track">
        <div
          class="progress-card__fill"
          :style="{ width: `${operation.progress}%` }"
        />
      </div>
    </div>
    <div class="progress-card__footer">
      Your share link will appear shortly
    </div>
  </div>
</template>

<style scoped>
.progress-card {
  display: flex;
  flex-direction: column;
  background: var(--color-frame-fill);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  overflow: hidden;
}

.progress-card__main {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding-block-start: var(--space-m);
  padding-block-end: var(--space-s);
  padding-inline-start: var(--space-xl);
  padding-inline-end: var(--space-s);
  background: var(--color-frame-bg);
  border-end-start-radius: var(--radius-m);
  border-end-end-radius: var(--radius-m);
  border-block-end: 1px solid var(--color-frame-border);
}

.progress-card__detail {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
}

.progress-card__track {
  width: 100%;
  height: 4px;
  background: var(--color-frame-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-card__fill {
  height: 100%;
  background: var(--color-frame-theme);
  border-radius: var(--radius-full);
  transition: width var(--duration-slow) var(--ease-out);
}

.progress-card__footer {
  padding-inline: var(--space-xl);
  padding-block: var(--space-xs);
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  opacity: 0.5;
}
</style>

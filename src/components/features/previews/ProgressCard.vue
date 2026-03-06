<script setup lang="ts">
import type { PreviewOperation } from '@/data/types'

defineProps<{
  operation: PreviewOperation
}>()
</script>

<template>
  <div class="progress-card">
    <div class="progress-card__body">
      <span class="progress-card__detail">{{ operation.detail }}</span>
      <div class="progress-card__track">
        <div
          class="progress-card__fill"
          :style="{ width: `${operation.progress}%` }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-card {
  display: flex;
  align-items: center;
  padding: var(--space-m);
  background: var(--color-frame-bg);
  border: 1px dashed var(--color-frame-border);
  border-radius: var(--radius-m);
}

.progress-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  min-width: 0;
}

.progress-card__detail {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-secondary);
}

.progress-card__track {
  width: 100%;
  max-width: 200px;
  height: 4px;
  background: var(--color-frame-border);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.progress-card__fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-s);
  transition: width 150ms ease;
}
</style>

<script setup lang="ts">
import type { CardUiState } from '@/data/types'

withDefaults(defineProps<{
  compact?: boolean
  state?: CardUiState
  title?: string
}>(), {
  compact: false,
  state: 'default',
})
</script>

<template>
  <div class="chat-card" :class="[`chat-card--${state}`, { 'chat-card--compact': compact }]">
    <div v-if="title || $slots.header" class="chat-card__header">
      <slot name="header">
        <strong>{{ title }}</strong>
      </slot>
    </div>
    <div class="chat-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="chat-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.chat-card {
  width: calc(100% + var(--space-s) * 2);
  min-width: 360px;
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-m);
  background: var(--color-surface);
  margin-block: var(--space-xs);
  margin-inline-start: calc(-1 * var(--space-s));
  overflow: hidden;
}

.chat-card__header {
  padding: var(--space-xs) var(--space-s);
  border-block-end: 1px solid var(--color-surface-border);
}

.chat-card__body {
  padding: var(--space-s);
}

.chat-card--compact .chat-card__header {
  padding: var(--space-xxs) var(--space-xs);
}

.chat-card--compact .chat-card__body {
  padding: var(--space-xs);
}

.chat-card__footer {
  padding: var(--space-xs) var(--space-s);
  border-block-start: 1px solid var(--color-surface-border);
}

.chat-card--compact .chat-card__footer {
  padding: var(--space-xxs) var(--space-xs);
}

.chat-card--disabled {
  opacity: 0.65;
}

.chat-card--error {
  border-color: #d63638;
}

.chat-card--loading {
  border-color: var(--color-primary);
}
</style>

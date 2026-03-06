<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  variant?: 'default' | 'success' | 'warning' | 'error'
}>(), {
  variant: 'default',
})
</script>

<template>
  <span class="badge" :class="`badge--${variant}`">{{ label }}</span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xxxs) var(--space-xxs);
  border-radius: var(--radius-s);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  white-space: nowrap;
}

.badge--default {
  background: var(--color-surface-secondary);
  color: var(--color-text-secondary);
}

.badge--success {
  background: rgba(6, 158, 8, 0.1);
  color: var(--color-status-running);
}

.badge--warning {
  background: rgba(255, 189, 46, 0.15);
  color: #b87a00;
}

.badge--error {
  background: rgba(255, 95, 87, 0.1);
  color: #d63638;
}
</style>

<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'global' | 'site'
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
  background: var(--color-frame-hover);
  color: var(--color-frame-fg-muted);
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

.badge--global {
  background: rgba(242, 215, 107, 0.35);
  color: var(--color-frame-fg-muted);
}

.badge--site {
  background: rgba(184, 230, 191, 0.45);
  color: var(--color-frame-fg-muted);
}
</style>

<script setup lang="ts">
import EmptyState from '@/components/composites/EmptyState.vue'

defineEmits<{
  setup: []
}>()
</script>

<template>
  <EmptyState
    heading="Keep every environment in sync"
    subtext="Know exactly what's changed locally, what's been tested on staging, and what's live in production — all in one place."
    action-label="Setup Sync"
    @action="$emit('setup')"
  >
    <template #illustration>
      <div class="sync-env sync-env--local">Local</div>
      <div class="sync-env sync-env--staging">Staging</div>
      <div class="sync-env sync-env--production">Production</div>
    </template>
  </EmptyState>
</template>

<style scoped>
.sync-env {
  position: absolute;
  width: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-m);
  border-radius: var(--radius-m);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: translate 400ms cubic-bezier(0.22, 1, 0.36, 1);
}

.sync-env--local {
  inset-block-start: 15px;
  inset-inline-start: 15px;
  background: var(--color-env-local-bg);
}

.sync-env--staging {
  inset-block-start: 50%;
  inset-inline-start: 105px;
  translate: 0 -50%;
  background: var(--color-env-staging-bg);
}

.sync-env--production {
  inset-block-end: 15px;
  inset-inline-start: 195px;
  background: var(--color-env-production-bg);
}
</style>

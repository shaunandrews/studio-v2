<script setup lang="ts">
import { computed } from 'vue'
import Text from '@/components/primitives/Text.vue'
import type { TaskStatus } from '@/data/types'

const props = defineProps<{
  status: TaskStatus
  branch?: string
  title: string
}>()

const statusLabel: Record<TaskStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  review: 'In Review',
  approved: 'Approved',
  merged: 'Merged',
  rejected: 'Rejected',
  failed: 'Failed',
}

const label = computed(() => statusLabel[props.status])
</script>

<template>
  <div class="brief-header hstack justify-between">
    <Text variant="body-small" color="muted">{{ label }}</Text>

    <Text
      tag="h2"
      variant="body"
      weight="semibold"
      class="brief-title"
      :title="title"
    >{{ title }}</Text>

    <Text v-if="branch" variant="body-small" class="brief-branch" :title="branch">
      {{ branch }}
    </Text>
  </div>
</template>

<style scoped>
.brief-header {
  padding: var(--space-xs) var(--space-s);
  border-start-start-radius: var(--radius-m);
  border-start-end-radius: var(--radius-m);
}

.brief-title {
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-inline-size: 0;
}

/* Branch name */
.brief-branch {
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg-muted);
  word-break: break-all;
}
</style>

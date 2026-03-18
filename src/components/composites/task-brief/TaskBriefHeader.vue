<script setup lang="ts">
import { computed } from 'vue'
import Text from '@/components/primitives/Text.vue'
import type { ConversationStatus } from '@/data/types'

const props = defineProps<{
  status: ConversationStatus
  branch?: string
}>()

const statusLabel: Record<ConversationStatus, string> = {
  idle: 'Idle',
  running: 'Running',
  review: 'In Review',
  approved: 'Approved',
  merged: 'Merged',
  rejected: 'Rejected',
}

const label = computed(() => statusLabel[props.status])
</script>

<template>
  <div class="brief-header hstack justify-between" :data-status="status">
    <!-- Status badge -->
    <div class="brief-status hstack gap-xxxs">
      <span class="brief-status__dot" aria-hidden="true" />
      <Text variant="body-small" weight="medium" class="brief-status__label">{{ label }}</Text>
    </div>

    <!-- Branch name -->
    <Text v-if="branch" variant="body-small" class="brief-branch" :title="branch">
      {{ branch }}
    </Text>
  </div>
</template>

<style scoped>
.brief-header {
  padding-block: var(--space-xxs);
  padding-inline: var(--space-s);
  background: var(--color-brief-idle);
  border-start-start-radius: var(--radius-m);
  border-start-end-radius: var(--radius-m);
  transition: background var(--duration-moderate) var(--ease-out);
}

.brief-header[data-status="running"]  { background: var(--color-brief-running); }
.brief-header[data-status="review"]   { background: var(--color-brief-review); }
.brief-header[data-status="approved"] { background: var(--color-brief-approved); }
.brief-header[data-status="merged"]   { background: var(--color-brief-merged); }
.brief-header[data-status="rejected"] { background: var(--color-brief-rejected); }

/* Status dot */
.brief-status__dot {
  width: 6px; /* Intentional exception: 6px is the established dot size (StatusIndicator), not a spacing value */
  height: 6px;
  border-radius: 50%;
  background: var(--color-brief-dot-idle);
  flex-shrink: 0;
  transition: background var(--duration-moderate) var(--ease-out);
}

.brief-header[data-status="running"]  .brief-status__dot { background: var(--color-brief-dot-running); }
.brief-header[data-status="review"]   .brief-status__dot { background: var(--color-brief-dot-review); }
.brief-header[data-status="approved"] .brief-status__dot { background: var(--color-brief-dot-approved); }
.brief-header[data-status="merged"]   .brief-status__dot { background: var(--color-brief-dot-approved); }
.brief-header[data-status="rejected"] .brief-status__dot { background: var(--color-brief-dot-rejected); }

/* Running pulse animation on the dot */
@keyframes brief-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.brief-header[data-status="running"] .brief-status__dot {
  animation: brief-pulse 1800ms var(--ease-in-out) infinite;
}

/* Branch name */
.brief-branch {
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-inline-size: 200px;
}
</style>

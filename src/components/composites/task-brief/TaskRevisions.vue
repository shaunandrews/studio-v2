<script setup lang="ts">
import { computed } from 'vue'
import Popover from '@/components/primitives/Popover.vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import { useRevisions } from '@/data/useRevisions'
import { useTasks } from '@/data/useTasks'

const props = defineProps<{
  taskId: string
}>()

const emit = defineEmits<{
  'preview-revision': [revisionId: string]
}>()

const { getRevisionsForTask } = useRevisions()
const revisions = getRevisionsForTask(props.taskId)

const revisionCount = computed(() => revisions.value.length)

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function onPreview(revisionId: string, close: () => void) {
  emit('preview-revision', revisionId)
  close()
}
</script>

<template>
  <Popover
    v-if="revisionCount > 0"
    align="end"
    max-height="360px"
  >
    <template #trigger="{ toggle }">
      <Button
        variant="tertiary"
        :label="`${revisionCount} revision${revisionCount === 1 ? '' : 's'}`"
        @click.stop="toggle"
      />
    </template>
    <template #default="{ close }">
      <div class="revisions-panel">
        <Text variant="body-small" weight="semibold" class="revisions-panel__title">Revisions</Text>
        <div class="revisions-list">
          <div
            v-for="rev in revisions"
            :key="rev.id"
            class="revision-item"
          >
            <div class="revision-item__header">
              <Text variant="body-small" class="revision-item__label">{{ rev.label }}</Text>
              <Text variant="caption" color="muted" class="revision-item__time">{{ formatTime(rev.timestamp) }}</Text>
            </div>
            <div class="revision-item__changes">
              <Text
                v-for="(change, i) in rev.changes"
                :key="i"
                variant="caption"
                color="muted"
                tag="div"
                class="revision-item__change"
              >
                {{ change.label }}
              </Text>
            </div>
            <button class="revision-item__preview" @click="onPreview(rev.id, close)">
              Preview
            </button>
          </div>
        </div>
      </div>
    </template>
  </Popover>
</template>

<style scoped>
.revisions-panel {
  min-width: 280px;
  max-width: 360px;
}

.revisions-panel__title {
  display: block;
  padding-block-end: var(--space-xs);
  border-block-end: 1px solid var(--color-frame-border);
  margin-block-end: var(--space-xs);
}

.revisions-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.revision-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
  padding: var(--space-xs);
  border-radius: var(--radius-s);
  transition: background var(--duration-instant) var(--ease-default);
}

.revision-item:hover {
  background: var(--color-frame-fill);
}

.revision-item__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-xs);
}

.revision-item__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.revision-item__time {
  flex-shrink: 0;
}

.revision-item__changes {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-inline-start: var(--space-xs);
  border-inline-start: 2px solid var(--color-frame-border);
}

.revision-item__change {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.revision-item__preview {
  align-self: flex-start;
  font-family: inherit;
  font-size: var(--font-size-xs);
  color: var(--color-frame-theme);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-xxxs) 0;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-default);
}

.revision-item:hover .revision-item__preview {
  opacity: 1;
}

.revision-item__preview:hover {
  text-decoration: underline;
}
</style>

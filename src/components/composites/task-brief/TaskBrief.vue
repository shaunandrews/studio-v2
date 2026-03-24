<script setup lang="ts">
import { computed } from 'vue'
import { seen as seenIcon, unseen as unseenIcon } from '@wordpress/icons'
import { useTasks } from '@/data/useTasks'
import Text from '@/components/primitives/Text.vue'
import Button from '@/components/primitives/Button.vue'
import TaskRevisions from './TaskRevisions.vue'

const props = defineProps<{
  taskId: string
  browserVisible?: boolean
}>()

const emit = defineEmits<{
  'toggle-browser': []
  'preview-revision': [revisionId: string]
}>()

const { tasks } = useTasks()

const task = computed(() =>
  tasks.value.find(t => t.id === props.taskId)
)

const title = computed(() => task.value?.title ?? 'New task')
const worktree = computed(() => task.value?.worktree)
const browserUrl = computed(() =>
  worktree.value ? `http://localhost:${worktree.value.port}` : undefined
)
</script>

<template>
  <div class="task-brief">
    <Text v-if="worktree?.branch" variant="caption" color="muted" class="brief-branch" :title="worktree.branch">
      {{ worktree.branch }}
    </Text>

    <Text
      tag="h2"
      variant="body-small"
      weight="semibold"
      class="brief-title"
      :title="title"
    >{{ title }}</Text>

    <div class="brief-end">
      <TaskRevisions :task-id="taskId" @preview-revision="(id) => emit('preview-revision', id)" />
      <Button
        v-if="browserUrl"
        :icon="browserVisible ? unseenIcon : seenIcon"
        :tooltip="browserVisible ? 'Hide browser' : 'Show browser'"
        variant="tertiary"
        @click.stop="emit('toggle-browser')"
      />
    </div>
  </div>
</template>

<style scoped>
.task-brief {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  border-block-end: 1px solid var(--color-frame-border);
  padding: var(--space-xs) var(--space-s);
}

.brief-title {
  flex: 1;
  min-inline-size: 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brief-branch {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xxs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-inline-size: 0;
  flex-shrink: 1;
}

.brief-end {
  display: flex;
  align-items: center;
  gap: var(--space-xxxs);
  flex-shrink: 0;
}
</style>

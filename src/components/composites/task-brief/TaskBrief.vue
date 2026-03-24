<script setup lang="ts">
import { computed } from 'vue'
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
        :label="browserVisible ? 'Hide browser' : 'Show browser'"
        variant="tertiary"
        @click.stop="emit('toggle-browser')"
      />
    </div>
  </div>
</template>

<style scoped>
.task-brief {
  position: relative;
  display: flex;
  align-items: center;
  border-block-end: 1px solid var(--color-frame-border);
  padding: var(--space-xs) var(--space-s);
}

.brief-title {
  position: absolute;
  inset-inline: 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  padding-inline: var(--space-xxxl);
}

.brief-branch {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xxs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-inline-size: 0;
  position: relative;
  z-index: 1;
}

.brief-end {
  margin-inline-start: auto;
  position: relative;
  z-index: 1;
}
</style>

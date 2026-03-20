<script setup lang="ts">
import { computed } from 'vue'
import { useTasks } from '@/data/useTasks'
import TaskBriefHeader from './TaskBriefHeader.vue'
import TaskBriefStats from './TaskBriefStats.vue'
import TaskBriefActions from './TaskBriefActions.vue'
import Text from '@/components/primitives/Text.vue'

const props = defineProps<{
  taskId: string
  elevated?: boolean
}>()

const emit = defineEmits<{
  'preview': [taskId: string]
}>()

const { tasks } = useTasks()

const task = computed(() =>
  tasks.value.find(t => t.id === props.taskId)
)

const title = computed(() => task.value?.title ?? 'New task')
const status = computed(() => task.value?.status ?? 'queued')
const worktree = computed(() => task.value?.worktree)
const summary = computed(() => task.value?.summary)
const changedFiles = computed(() => task.value?.changedFiles)
const changedEntities = computed(() => task.value?.changedEntities)
const previewUrl = computed(() =>
  worktree.value ? `http://localhost:${worktree.value.port}` : undefined
)
</script>

<template>
  <div
    class="task-brief"
    :class="[`status-${status}`, { 'is-elevated': elevated }]"
  >
    <TaskBriefHeader :status="status" :branch="worktree?.branch" :title="title" />

    <div class="brief-body p-s">
      <Text
        v-if="summary"
        variant="body-small"
        color="muted"
        class="brief-summary"
      >{{ summary }}</Text>

      <TaskBriefStats
        class="brief-stats"
        :changed-files="changedFiles"
        :changed-entities="changedEntities"
      />

      <TaskBriefActions
        :preview-url="previewUrl"
        @preview="emit('preview', taskId)"
      />
    </div>
  </div>
</template>

<style scoped>
.task-brief {
  position: relative;
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  box-shadow: none;
  overflow: hidden;
  flex-shrink: 0;
  transition:
    filter var(--duration-moderate) var(--ease-out),
    box-shadow var(--duration-moderate) var(--ease-out);
}

.task-brief.is-elevated {
  box-shadow: var(--shadow-m);
}

.task-brief.status-merged,
.task-brief.status-rejected {
  filter: saturate(0.6);
}

.brief-body {
  position: relative;
}

.brief-summary {
  margin-block-end: var(--space-xxs);
}

.brief-stats {
  margin-block-end: var(--space-xxs);
}
</style>

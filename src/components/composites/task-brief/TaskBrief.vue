<script setup lang="ts">
import { computed } from 'vue'
import { useTasks } from '@/data/useTasks'
import TaskBriefHeader from './TaskBriefHeader.vue'
import TaskBriefActions from './TaskBriefActions.vue'

const props = defineProps<{
  taskId: string
  elevated?: boolean
  previewVisible?: boolean
}>()

const emit = defineEmits<{
  'toggle-preview': []
}>()

const { tasks } = useTasks()

const task = computed(() =>
  tasks.value.find(t => t.id === props.taskId)
)

const title = computed(() => task.value?.title ?? 'New task')
const worktree = computed(() => task.value?.worktree)
const previewUrl = computed(() =>
  worktree.value ? `http://localhost:${worktree.value.port}` : undefined
)
</script>

<template>
  <div
    class="task-brief"
    :class="{ 'is-elevated': elevated }"
  >
    <TaskBriefHeader :branch="worktree?.branch" :title="title" />

    <div class="brief-body p-s">
      <TaskBriefActions
        :preview-url="previewUrl"
        :preview-visible="previewVisible"
        @toggle-preview="emit('toggle-preview')"
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
  transition: box-shadow var(--duration-moderate) var(--ease-out);
}

.task-brief.is-elevated {
  box-shadow: var(--shadow-m);
}

.brief-body {
  position: relative;
}
</style>

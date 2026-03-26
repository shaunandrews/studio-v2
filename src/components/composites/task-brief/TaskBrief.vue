<script setup lang="ts">
import { computed } from 'vue'
import { useTasks } from '@/data/useTasks'
import { useBranches } from '@/data/useBranches'
import Button from '@/components/primitives/Button.vue'
import Toolbar from '@/components/composites/Toolbar.vue'
import TaskRevisions from './TaskRevisions.vue'

const props = defineProps<{
  taskId: string
  browserVisible?: boolean
}>()

const emit = defineEmits<{
  'toggle-browser': []
  'preview-revision': [revisionId: string]
  'merge-task': []
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

const { hasDiverged } = useBranches()
const canMerge = computed(() => hasDiverged(props.taskId))
</script>

<template>
  <Toolbar :title="title" size="mini">
    <template #end>
      <TaskRevisions :task-id="taskId" @preview-revision="(id) => emit('preview-revision', id)" />
      <Button
        v-if="canMerge"
        label="Merge to site"
        tooltip="Merge task changes to the main site"
        variant="primary"
        @click.stop="emit('merge-task')"
      />
      <Button
        v-if="browserUrl"
        :label="browserVisible ? 'Hide browser' : 'Show browser'"
        :tooltip="browserVisible ? 'Hide browser' : 'Show browser'"
        variant="secondary"
        @click.stop="emit('toggle-browser')"
      />
    </template>
  </Toolbar>
</template>

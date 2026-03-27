<script setup lang="ts">
import { computed } from 'vue'
import { useTasks } from '@/data/useTasks'
import { useBranches } from '@/data/useBranches'
import { useUnifiedSidebar } from '@/data/useUnifiedSidebar'
import Button from '@/components/primitives/Button.vue'
import Toolbar from '@/components/composites/Toolbar.vue'
import ScreenSwitcher from '@/components/composites/ScreenSwitcher.vue'
import TaskRevisions from './TaskRevisions.vue'

const props = defineProps<{
  taskId: string
  browserVisible?: boolean
}>()

const emit = defineEmits<{
  'toggle-browser': []
  'preview-revision': [revisionId: string]
  'merge-task': []
  'start-task': []
  'stop-task': []
  'undo-merge': []
}>()

const { tasks, isBusy, hasPreMergeSnapshot } = useTasks()

const task = computed(() =>
  tasks.value.find(t => t.id === props.taskId)
)

const title = computed(() => task.value?.title ?? 'New task')
const taskStatus = computed(() => task.value?.status ?? 'backlog')
const taskBusy = isBusy(props.taskId)
const worktree = computed(() => task.value?.worktree)
const browserUrl = computed(() =>
  worktree.value ? `http://localhost:${worktree.value.port}` : undefined
)

const { hasDiverged } = useBranches()
const canMerge = computed(() => hasDiverged(props.taskId))
const { unifiedSidebar } = useUnifiedSidebar()
const canUndoMerge = computed(() => hasPreMergeSnapshot(props.taskId))
</script>

<template>
  <Toolbar :title="unifiedSidebar ? undefined : title" size="mini">
    <template v-if="unifiedSidebar" #start>
      <ScreenSwitcher :title="title" />
    </template>
    <template #end>
      <TaskRevisions :task-id="taskId" @preview-revision="(id) => emit('preview-revision', id)" />
      <!-- Backlog: Start button -->
      <Button
        v-if="taskStatus === 'backlog'"
        label="Start"
        tooltip="Start this task"
        variant="primary"
        @click.stop="emit('start-task')"
      />
      <!-- In progress: Stop button -->
      <Button
        v-if="taskStatus === 'in_progress' && taskBusy"
        label="Stop"
        tooltip="Stop AI work"
        variant="secondary"
        @click.stop="emit('stop-task')"
      />
      <!-- Review: Merge button -->
      <Button
        v-if="taskStatus === 'review' && canMerge"
        label="Merge to site"
        tooltip="Merge task changes to the main site"
        variant="primary"
        @click.stop="emit('merge-task')"
      />
      <!-- Merged: Undo merge button -->
      <Button
        v-if="taskStatus === 'merged' && canUndoMerge"
        label="Undo merge"
        tooltip="Revert this merge and return task to review"
        variant="secondary"
        @click.stop="emit('undo-merge')"
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

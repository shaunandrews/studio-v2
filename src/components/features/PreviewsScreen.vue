<script setup lang="ts">
import { computed } from 'vue'
import { plus } from '@wordpress/icons'
import { useProjects } from '@/data/useProjects'
import { usePreviews } from '@/data/usePreviews'
import Button from '@/components/primitives/Button.vue'
import ScreenLayout from '@/components/composites/ScreenLayout.vue'
import PreviewsEmptyState from './previews/PreviewsEmptyState.vue'
import PreviewCard from './previews/PreviewCard.vue'
import ProgressCard from './previews/ProgressCard.vue'

const props = defineProps<{
  projectId: string
}>()

const { projects } = useProjects()
const {
  getPreviews,
  activeOperation,
  createPreview,
  deletePreview,
  clearPreview,
  extendPreview,
} = usePreviews()

const previews = getPreviews(props.projectId)
const createOp = computed(() => activeOperation(props.projectId).value)

const project = computed(() => projects.value.find(p => p.id === props.projectId))

const hasPreviews = computed(() => previews.value.length > 0 || !!createOp.value)

function handleCreate() {
  createPreview(props.projectId, project.value?.name ?? 'Site')
}

function handleDelete(previewId: string) {
  deletePreview(previewId)
}

function handleExtend(previewId: string) {
  extendPreview(previewId)
}

function handleClear(previewId: string) {
  clearPreview(previewId)
}
</script>

<template>
  <PreviewsEmptyState v-if="!hasPreviews" @create="handleCreate" />

  <ScreenLayout
    v-else
    title="Preview sites"
    subtitle="Share a hosted preview of your site for feedback."
  >
    <template #actions>
      <Button
        variant="primary"
        :icon="plus"
        label="New preview"
        size="small"
        :disabled="!!createOp"
        @click="handleCreate"
      />
    </template>

    <div class="previews-screen__list">
      <ProgressCard v-if="createOp" :operation="createOp" />
      <PreviewCard
        v-for="preview in previews"
        :key="preview.id"
        :preview="preview"
        :project-id="projectId"
        @delete="handleDelete(preview.id)"
        @extend="handleExtend(preview.id)"
        @clear="handleClear(preview.id)"
      />
    </div>
  </ScreenLayout>
</template>

<style scoped>
.previews-screen__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
</style>

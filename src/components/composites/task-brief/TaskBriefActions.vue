<script setup lang="ts">
import Button from '@/components/primitives/Button.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'

const props = defineProps<{
  previewUrl?: string
  previewVisible?: boolean
}>()

const emit = defineEmits<{
  'toggle-preview': []
}>()
</script>

<template>
  <div v-if="previewUrl" class="brief-actions hstack gap-xxs justify-end">
    <Button
      :label="previewVisible ? 'Hide preview' : 'Show preview'"
      size="small"
      variant="tertiary"
      @click.stop="emit('toggle-preview')"
    />
  </div>
</template>

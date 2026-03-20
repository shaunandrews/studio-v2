<script setup lang="ts">
import Button from '@/components/primitives/Button.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'

const props = defineProps<{
  previewUrl?: string
}>()

const emit = defineEmits<{
  'preview': []
}>()
</script>

<template>
  <div v-if="previewUrl" class="brief-actions hstack gap-xxs justify-end">
    <Tooltip :text="`Preview at ${previewUrl}`" placement="top">
      <Button label="Preview" size="small" variant="tertiary" @click.stop="emit('preview')" />
    </Tooltip>
  </div>
</template>

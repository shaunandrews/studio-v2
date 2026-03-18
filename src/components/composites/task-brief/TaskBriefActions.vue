<script setup lang="ts">
import { computed } from 'vue'
import { seen, code } from '@wordpress/icons'
import Button from '@/components/primitives/Button.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import type { ConversationStatus } from '@/data/types'

const props = defineProps<{
  previewUrl?: string
  status?: ConversationStatus
  compact?: boolean
}>()

const emit = defineEmits<{
  'preview': []
  'review': []
}>()

const isReview = computed(() => props.status === 'review')
</script>

<template>
  <!-- Compact: icon-only buttons -->
  <div v-if="compact" class="brief-actions-compact hstack gap-xxxs">
    <Tooltip v-if="previewUrl" :text="`Preview at ${previewUrl}`" placement="bottom">
      <Button :icon="seen" icon-only size="small" variant="tertiary" @click.stop="emit('preview')" />
    </Tooltip>
    <Tooltip text="Review changes" placement="bottom">
      <Button
        :icon="code"
        icon-only
        size="small"
        :variant="isReview ? 'secondary' : 'tertiary'"
        @click.stop="emit('review')"
      />
    </Tooltip>
  </div>

  <!-- Expanded: labelled buttons in footer -->
  <div v-else class="brief-actions-expanded hstack gap-xxs justify-end">
    <Tooltip v-if="previewUrl" :text="`Preview at ${previewUrl}`" placement="top">
      <Button :icon="seen" label="Preview" size="small" variant="tertiary" @click.stop="emit('preview')" />
    </Tooltip>
    <Button
      :icon="code"
      label="Review changes"
      size="small"
      :variant="isReview ? 'primary' : 'secondary'"
      @click.stop="emit('review')"
    />
  </div>
</template>

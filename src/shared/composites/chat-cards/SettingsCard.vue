<script setup lang="ts">
import ChatCard from './ChatCard.vue'
import type { CardUiState, SettingsCardData } from '@/data/types'

withDefaults(defineProps<{
  data: SettingsCardData
  compact?: boolean
  state?: CardUiState
}>(), {
  compact: false,
  state: 'default',
})
</script>

<template>
  <ChatCard :compact="compact" :state="state" :title="data.label">
    <div class="settings-list vstack">
      <div
        v-for="setting in data.settings"
        :key="setting.key"
        class="setting-row hstack justify-between gap-xs"
      >
        <span class="setting-key">{{ setting.key }}</span>
        <span class="setting-arrow">{{ setting.current }} → {{ setting.proposed }}</span>
      </div>
    </div>
  </ChatCard>
</template>

<style scoped>
.settings-list {
  /* No outer border — card body provides the frame */
}

.setting-row {
  padding: var(--space-xxxs) 0;
  border-block-end: 1px solid var(--color-surface-border);
}

.setting-row:last-child {
  border-block-end: none;
}

.setting-key {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.setting-arrow {
  font-size: var(--font-size-xs);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { seen } from '@wordpress/icons'
import PanelToolbar from './PanelToolbar.vue'
import Text from '@/components/primitives/Text.vue'
import Button from '@/components/primitives/Button.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import { useConversations } from '@/data/useConversations'

const props = defineProps<{
  conversationId: string
}>()

const emit = defineEmits<{
  'preview': [conversationId: string]
}>()

const { conversations } = useConversations()
const conversation = computed(() =>
  conversations.value.find(c => c.id === props.conversationId)
)

const title = computed(() => conversation.value?.title || 'New task')
const worktree = computed(() => conversation.value?.worktree)
const previewUrl = computed(() => worktree.value ? `localhost:${worktree.value.port}` : null)
</script>

<template>
  <PanelToolbar>
    <template #start>
      <Text variant="body-small" weight="semibold" class="task-title" :title="title">{{ title }}</Text>
    </template>
    <template #end>
      <!-- Worktree branch info -->
      <Tooltip v-if="worktree" :text="`Branch: ${worktree.branch}`" placement="bottom">
        <div class="worktree-badge">
          <svg class="worktree-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="3" r="2" stroke="currentColor" stroke-width="1.5" fill="none" />
            <circle cx="4" cy="13" r="2" stroke="currentColor" stroke-width="1.5" fill="none" />
            <circle cx="12" cy="13" r="2" stroke="currentColor" stroke-width="1.5" fill="none" />
            <path d="M8 5v3M8 8l-4 3M8 8l4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <span class="worktree-branch">{{ worktree.branch }}</span>
        </div>
      </Tooltip>

      <!-- Preview this task's site -->
      <Tooltip v-if="previewUrl" :text="`Preview at ${previewUrl}`" placement="bottom">
        <Button
          :icon="seen"
          icon-only
          size="small"
          variant="tertiary"
          @click="emit('preview', conversationId)"
        />
      </Tooltip>
    </template>
  </PanelToolbar>
</template>

<style scoped>
.task-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* ── Worktree badge ── */

.worktree-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xxxs);
  padding: var(--space-xxxs) var(--space-xs);
  border-radius: var(--radius-s);
  background: var(--color-frame-fill);
  cursor: default;
}

.worktree-icon {
  flex-shrink: 0;
  color: var(--color-frame-fg-muted);
}

.worktree-branch {
  font-size: var(--font-size-xs);
  font-family: var(--font-family-mono, monospace);
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}
</style>

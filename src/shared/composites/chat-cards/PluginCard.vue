<script setup lang="ts">
import { computed } from 'vue'
import { moreVertical } from '@wordpress/icons'
import Badge from '../../primitives/Badge.vue'
import Button from '@/components/primitives/Button.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import WPIcon from '../../primitives/WPIcon.vue'
import ChatCard from './ChatCard.vue'
import type { CardUiState, PluginCardData } from '@/data/types'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'

const props = withDefaults(defineProps<{
  data: PluginCardData
  state?: CardUiState
}>(), {
  state: 'default',
})

const emit = defineEmits<{
  action: [data: PluginCardData]
}>()

const dirSlug = computed(() => props.data.slug.split('/')[0])

const iconUrl = computed(() =>
  props.data.icon || `https://ps.w.org/${dirSlug.value}/assets/icon-256x256.png`
)

const statusLabel = computed(() => {
  const map: Record<PluginCardData['status'], string> = {
    available: 'Available',
    installing: 'Installing',
    installed: 'Installed',
    active: 'Active',
    error: 'Error',
  }
  return map[props.data.status]
})

const statusVariant = computed(() => {
  if (props.data.status === 'active' || props.data.status === 'installed') return 'success'
  if (props.data.status === 'installing') return 'warning'
  if (props.data.status === 'error') return 'error'
  return 'default'
})

// Build menu groups from plugin status
const menuGroups = computed<FlyoutMenuGroup[]>(() => {
  const items: FlyoutMenuGroup['items'] = [
    { label: 'View plugin page', action: () => {} },
  ]
  const s = props.data.status
  if (s === 'available') {
    items.push({ label: 'Install', action: () => {} })
  } else if (s === 'installed') {
    items.push({ label: 'Activate', action: () => {} })
    items.push({ label: 'Delete', destructive: true, action: () => {} })
  } else if (s === 'active') {
    items.push({ label: 'Deactivate', action: () => {} })
    items.push({ label: 'Delete', destructive: true, action: () => {} })
  } else if (s === 'error') {
    items.push({ label: 'Retry', action: () => {} })
    items.push({ label: 'Delete', destructive: true, action: () => {} })
  }
  return [{ items }]
})
</script>

<template>
  <ChatCard :state="state">
    <template #header>
      <div class="plugin-header">
        <strong>Plugin</strong>
        <FlyoutMenu :groups="menuGroups" surface="light" align="end">
          <template #trigger="{ toggle }">
            <button class="plugin-menu-trigger" @click="toggle" aria-label="More options">
              <WPIcon :icon="moreVertical" :size="20" />
            </button>
          </template>
        </FlyoutMenu>
      </div>
    </template>
    <div class="plugin-layout">
      <img
        :src="iconUrl"
        :alt="`${data.name} icon`"
        class="plugin-icon"
        loading="lazy"
      />
      <div class="plugin-content vstack gap-xxxs">
        <div class="hstack gap-xs align-center">
          <strong class="plugin-name">{{ data.name }}</strong>
          <Badge :label="statusLabel" :variant="statusVariant" />
        </div>
        <p class="plugin-description">{{ data.description }}</p>
      </div>
      <Button
        v-if="data.action"
        class="plugin-action"
        :label="data.action.label"
        :variant="data.action.variant || 'primary'"
        size="small"
        @click="emit('action', data)"
      />
    </div>
  </ChatCard>
</template>

<style scoped>
:deep(.chat-card__header) {
  padding: 0;
}

.plugin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs) var(--space-s);
}

.plugin-layout {
  display: flex;
  align-items: start;
  gap: var(--space-s);
}

.plugin-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-s);
  flex-shrink: 0;
  object-fit: cover;
}

.plugin-content {
  flex: 1;
  min-width: 0;
}

.plugin-name {
  line-height: var(--line-height-tight);
}

.plugin-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-s);
  line-height: var(--line-height-normal);
}

.plugin-action {
  flex-shrink: 0;
  align-self: center;
}

.plugin-menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: var(--radius-s);
  cursor: pointer;
  color: var(--color-text-muted);
  transition: background var(--duration-instant) var(--ease-default), color var(--duration-instant) var(--ease-default);
}

.plugin-menu-trigger:hover {
  background: var(--color-surface-secondary);
  color: var(--color-text);
}
</style>

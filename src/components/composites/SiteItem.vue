<script setup lang="ts">
import type { Site } from '@/data/types'
import StatusIndicator from '@/components/primitives/StatusIndicator.vue'
import SiteIcon from '@/components/primitives/SiteIcon.vue'
import { useSites } from '@/data/useSites'

const props = defineProps<{
  site: Site
  active?: boolean
  unreadCount?: number
  surface?: 'chrome' | 'frame'
}>()

defineEmits<{
  select: [id: string]
}>()

const { setStatus } = useSites()

function toggleStatus() {
  const target = props.site.status === 'running' ? 'stopped' : 'running'
  setStatus(props.site.id, 'loading')
  setTimeout(() => setStatus(props.site.id, target), 1200)
}
</script>

<template>
  <div
    class="site-list-item"
    :class="{ active, 'surface-frame': surface === 'frame' }"
    @click="$emit('select', site.id)"
  >
    <SiteIcon :favicon="site.favicon" :site-name="site.name" :size="24" />
    <span v-if="unreadCount" class="site-unread-count">{{ unreadCount }}</span>
    <span class="site-name">{{ site.name }}</span>
    <StatusIndicator
      class="site-status"
      :status="site.status"
      @toggle="toggleStatus"
      @click.stop
    />
  </div>
</template>

<style scoped>
.site-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px 4px 4px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-chrome-fg-muted);
  transition: background var(--duration-instant) var(--ease-default);
}

.site-list-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-chrome-fg);
}

.site-list-item.active {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-chrome-fg);
}

.site-unread-count {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--color-frame-theme);
  color: #fff;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  text-align: center;
  flex-shrink: 0;
}

.site-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-status {
  opacity: 1;
}

/* ── Frame surface variant (light background) ── */
.site-list-item.surface-frame {
  color: var(--color-frame-fg-muted);
}

.site-list-item.surface-frame:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.site-list-item.surface-frame.active {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}
</style>

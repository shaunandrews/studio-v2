<script setup lang="ts">
import type { Site } from '@/data/types'
import StatusIndicator from '@/components/primitives/StatusIndicator.vue'
import { useSites } from '@/data/useSites'

const props = defineProps<{
  site: Site
  active?: boolean
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
    :class="{ active }"
    @click="$emit('select', site.id)"
  >
    <div class="site-icon">
      <img class="site-icon-img" :src="site.favicon" alt="" />
    </div>
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

.site-icon {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-s);
  overflow: hidden;
  flex-shrink: 0;
}

.site-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, RouterView, RouterLink } from 'vue-router'
import { closeSmall } from '@wordpress/icons'
import Button from '@/components/primitives/Button.vue'
import { useSites } from '@/data/useSites'

const route = useRoute()
const router = useRouter()
const { activeSiteId } = useSites()

const tabs = [
  { label: 'Design System', to: '/dev/design-system' },
  { label: 'Components', to: '/dev/components' },
  { label: 'Architecture', to: '/dev/architecture' },
]

function isActive(to: string) {
  return route.path.startsWith(to)
}

function close() {
  if (activeSiteId.value) {
    router.push({ name: 'site-tasks', params: { id: activeSiteId.value } })
  } else {
    router.push({ name: 'all-sites' })
  }
}
</script>

<template>
  <div class="dev-page">
    <div class="dev-toolbar">
      <div class="dev-tabs">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="dev-tab"
          :class="{ 'is-active': isActive(tab.to) }"
        >
          {{ tab.label }}
        </RouterLink>
      </div>
      <Button
        :icon="closeSmall"
        variant="tertiary"
        surface="light"
        tooltip="Close"
        tooltipPlacement="bottom"
        @click="close"
      />
    </div>
    <div class="dev-content">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.dev-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dev-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-xxs) 0 var(--space-xs);
  height: 48px;
  flex-shrink: 0;
  border-block-end: 1px solid var(--color-frame-border);
}

.dev-tabs {
  display: flex;
  align-items: center;
  gap: var(--space-xxxs);
}

.dev-tab {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 var(--space-xxs);
  border-radius: var(--radius-s);
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg-muted);
  text-decoration: none;
  transition: background var(--transition-hover), color var(--transition-hover);
}

.dev-tab:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.dev-tab.is-active {
  color: var(--color-frame-fg);
  background: var(--color-frame-hover);
}

.dev-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>

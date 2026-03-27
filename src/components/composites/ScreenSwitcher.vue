<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { chevronDown } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import SiteIcon from '@/components/primitives/SiteIcon.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'
import { useSites } from '@/data/useSites'
import { useTasks } from '@/data/useTasks'
import { useSidebarCollapse } from '@/data/useSidebarCollapse'
import { useOperatingSystem } from '@/data/useOperatingSystem'
import { ROUTE_TO_SCREEN, SCREEN_LABELS } from '@/data/screenMapping'
import type { Screen } from '@/data/screenMapping'

defineProps<{
  title?: string
}>()

const route = useRoute()
const router = useRouter()
const { sites, activeSiteId } = useSites()
const { tasks } = useTasks()
const { hidden } = useSidebarCollapse()
const { isWindows } = useOperatingSystem()

const currentScreen = computed(() => ROUTE_TO_SCREEN[route.name as string] ?? 'overview')
const currentSite = computed(() => sites.value.find(s => s.id === activeSiteId.value))

const siteTasks = computed(() =>
  tasks.value
    .filter(t => t.siteId === activeSiteId.value && !t.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
)

function navigateToScreen(screen: string) {
  const id = activeSiteId.value
  if (!id) return
  router.push({ name: screen === 'tasks' ? 'site-tasks' : `site-${screen}`, params: { id } })
}

function navigateToSite(siteId: string) {
  const screen = currentScreen.value === 'tasks' ? 'site-tasks' : `site-${currentScreen.value}`
  router.push({ name: screen, params: { id: siteId } })
}

function navigateToTask(taskId: string) {
  const id = activeSiteId.value
  if (!id) return
  router.push({ name: 'site-task', params: { id, taskId } })
}

const menuGroups = computed<FlyoutMenuGroup[]>(() => {
  const groups: FlyoutMenuGroup[] = []

  // Sections
  groups.push({
    items: (['overview', 'canvas', 'sync', 'sharing', 'settings'] as Screen[]).map(s => ({
      label: SCREEN_LABELS[s],
      checked: currentScreen.value === s,
      action: () => navigateToScreen(s),
    })),
  })

  // Tasks
  if (siteTasks.value.length > 0) {
    const recent = siteTasks.value.slice(0, 3)
    const rest = siteTasks.value.slice(3)

    const taskItems = recent.map(t => ({
      label: t.title || 'New task',
      action: () => navigateToTask(t.id),
    }))

    if (rest.length > 0) {
      taskItems.push({
        label: `${rest.length} more…`,
        children: rest.map(t => ({
          label: t.title || 'New task',
          action: () => navigateToTask(t.id),
        })),
      })
    }

    groups.push({
      label: 'Tasks',
      items: taskItems,
    })
  }

  // Switch site (flyout submenu)
  groups.push({
    items: [{
      label: 'Switch site…',
      children: sites.value.map(s => ({
        label: s.name,
        iconUrl: s.favicon,
        status: s.status === 'running' ? 'running' : 'stopped',
        checked: s.id === activeSiteId.value,
        action: () => navigateToSite(s.id),
      })),
    }],
  })

  return groups
})
</script>

<template>
  <!-- Sidebar visible: plain title -->
  <Transition name="title-fade">
    <span v-if="!hidden && title" class="switcher-title">{{ title }}</span>
  </Transition>

  <!-- Sidebar hidden: traffic light spacer + dropdown -->
  <Transition name="switcher-in">
    <div v-if="hidden" class="screen-switcher-wrap">
      <div v-if="!isWindows" class="lights-spacer" />
      <FlyoutMenu :groups="menuGroups" align="start">
        <template #trigger="{ toggle }">
          <button class="screen-switcher" @click="toggle">
            <SiteIcon v-if="currentSite" :favicon="currentSite.favicon" :site-name="currentSite.name" :size="14" />
            <span class="screen-switcher__site">{{ currentSite?.name }}</span>
            <span class="screen-switcher__section">{{ SCREEN_LABELS[currentScreen] }}</span>
            <WPIcon :icon="chevronDown" :size="14" class="screen-switcher__chevron" />
          </button>
        </template>
      </FlyoutMenu>
    </div>
  </Transition>
</template>

<style scoped>
.switcher-title {
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--color-frame-fg);
}

.lights-spacer {
  width: 72px; /* Clear macOS traffic lights */
  flex-shrink: 0;
}

.screen-switcher {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  height: 28px;
  max-width: 240px;
  padding: 0 var(--space-xxs) 0 var(--space-xxxs);
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg);
  font-family: inherit;
  font-size: var(--font-size-m);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--duration-instant) var(--ease-default);
}

.screen-switcher:hover {
  background: var(--color-frame-hover);
}

.screen-switcher__site {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.screen-switcher__section {
  color: var(--color-frame-fg-muted);
  flex-shrink: 0;
}

.screen-switcher__chevron {
  color: var(--color-frame-fg-muted);
  flex-shrink: 0;
}

.screen-switcher-wrap {
  display: flex;
  align-items: center;
}

/* ── Transitions ── */

.switcher-in-enter-active {
  transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out);
}
.switcher-in-leave-active {
  transition: opacity 100ms var(--ease-default);
}
.switcher-in-enter-from {
  opacity: 0;
  transform: translateX(-6px);
}
.switcher-in-leave-to {
  opacity: 0;
}

.title-fade-enter-active {
  transition: opacity 180ms var(--ease-out) 80ms; /* slight delay so dropdown clears first */
}
.title-fade-leave-active {
  transition: opacity 80ms var(--ease-default);
}
.title-fade-enter-from,
.title-fade-leave-to {
  opacity: 0;
}
</style>

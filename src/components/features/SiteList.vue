<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { plus, category } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import SiteItem from '@/components/composites/SiteItem.vue'
import ContextMenu from '@/components/primitives/ContextMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'
import { useSites } from '@/data/useSites'
import { useTasks } from '@/data/useTasks'
import { useSiteTransition } from '@/data/useSiteTransition'
import { useAllSitesView } from '@/data/useAllSitesView'
import type { Site } from '@/data/types'

const emit = defineEmits<{
  'new-site': []
}>()

const { sites, activeSiteId, setStatus, reorderSites } = useSites()

// Drag-and-drop reordering
const dragIndex = ref<number | null>(null)
const dropIndex = ref<number | null>(null)

function onDragStart(index: number, e: DragEvent) {
  dragIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }
}

function onDragOver(index: number, e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dropIndex.value = index
}

function onDragLeave() {
  dropIndex.value = null
}

function onDrop(index: number) {
  if (dragIndex.value !== null && dragIndex.value !== index) {
    reorderSites(dragIndex.value, index)
  }
  dragIndex.value = null
  dropIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
  dropIndex.value = null
}
const { tasks } = useTasks()
const { navigateToSite } = useSiteTransition('site')

function getUnreadCount(siteId: string): number {
  return tasks.value.filter(t => t.siteId === siteId && t.unread && !t.archived).length
}

function getSiteMenuGroups(site: Site): FlyoutMenuGroup[] {
  return [
    {
      items: [
        { label: 'Open in Browser', action: () => alert(`Open ${site.url} in browser`) },
        { label: 'Copy Site URL', action: () => alert(`Copied ${site.url}`) },
      ],
    },
    {
      items: [
        { label: 'Open in Finder', action: () => alert(`Open ${site.name} in Finder`) },
        { label: 'Open in VS Code', action: () => alert(`Open ${site.name} in VS Code`) },
        { label: 'Open in Terminal', action: () => alert(`Open ${site.name} in Terminal`) },
      ],
    },
    {
      items: [
        {
          label: site.status === 'running' ? 'Stop Site' : 'Start Site',
          action: () => {
            const target = site.status === 'running' ? 'stopped' : 'running'
            setStatus(site.id, 'loading')
            setTimeout(() => setStatus(site.id, target), 1200)
          },
        },
        { label: 'Site Settings', action: () => alert(`Settings for ${site.name}`) },
        { label: 'Duplicate Site', action: () => alert(`Duplicate ${site.name}`) },
      ],
    },
    {
      items: [
        { label: 'Delete Site', destructive: true, action: () => alert(`Delete ${site.name}`) },
      ],
    },
  ]
}

const router = useRouter()
const route = useRoute()
const isAllSitesActive = computed(() => route.name === 'all-sites')
const { showAllSitesView } = useAllSitesView()
const showAllSites = computed(() => showAllSitesView.value && sites.value.length > 1)

function goToAllSites() {
  router.push({ name: 'all-sites' })
}
</script>

<template>
  <div class="site-list vstack">
    <template v-if="showAllSites">
      <button
        class="all-sites-item"
        :class="{ active: isAllSitesActive }"
        @click="goToAllSites"
      >
        <div class="all-sites-icon">
          <WPIcon :icon="category" :size="20" />
        </div>
        <span class="all-sites-label">All Sites</span>
      </button>

      <div class="sidebar-divider" />
    </template>

    <div class="items-stack">
      <div
        v-for="(site, index) in sites"
        :key="site.id"
        class="drag-wrapper"
        :class="{
          dragging: dragIndex === index,
          'drop-above': dropIndex === index && dragIndex !== null && dragIndex > index,
          'drop-below': dropIndex === index && dragIndex !== null && dragIndex < index,
        }"
        draggable="true"
        @dragstart="onDragStart(index, $event)"
        @dragover="onDragOver(index, $event)"
        @dragleave="onDragLeave"
        @drop="onDrop(index)"
        @dragend="onDragEnd"
      >
        <ContextMenu
          :groups="getSiteMenuGroups(site)"
          surface="dark"
        >
          <SiteItem
            :site="site"
            :active="site.id === activeSiteId"
            :unread-count="getUnreadCount(site.id)"
            @select="navigateToSite"
          />
        </ContextMenu>
      </div>
    </div>

    <button class="add-site-item" @click="emit('new-site')">
      <div class="add-site-icon">
        <WPIcon :icon="plus" :size="16" />
      </div>
      <span class="add-site-label">Add site</span>
    </button>
  </div>
</template>

<style scoped>
.site-list {
  width: 100%;
  height: 100%;
  overflow: auto;
  gap: 4px;
}

.items-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drag-wrapper {
  border-radius: var(--radius-s);
  transition: transform var(--duration-instant) var(--ease-default);
}

.drag-wrapper.dragging {
  opacity: 0.4;
}

.drag-wrapper.drop-above {
  box-shadow: 0 -2px 0 0 var(--color-frame-theme);
}

.drag-wrapper.drop-below {
  box-shadow: 0 2px 0 0 var(--color-frame-theme);
}

.add-site-item {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  padding: 4px 2px 4px 4px; /* Optical: match site-list-item spacing */
  border: none;
  border-radius: 6px; /* Optical: match site-list-item */
  background: none;
  font-family: inherit;
  text-align: start;
  cursor: pointer;
  color: var(--color-chrome-fg-muted);
  transition: background var(--duration-instant) var(--ease-default);
}

.add-site-item:hover {
  background: var(--color-chrome-fill);
  color: var(--color-chrome-fg);
}

.add-site-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-site-label {
  font-size: var(--font-size-m);
  line-height: 20px;
}

.all-sites-item {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  padding: 4px 2px 4px 4px; /* Optical: match site-list-item spacing */
  border: none;
  border-radius: 6px; /* Optical: match site-list-item */
  background: none;
  font-family: inherit;
  text-align: start;
  cursor: pointer;
  color: var(--color-chrome-fg-muted);
  transition: background var(--duration-instant) var(--ease-default);
}

.all-sites-item:hover {
  background: var(--color-chrome-fill);
  color: var(--color-chrome-fg);
}

.all-sites-item.active {
  background: var(--color-chrome-hover);
  color: var(--color-chrome-fg);
}

.all-sites-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.all-sites-label {
  font-size: var(--font-size-m);
  line-height: 20px;
}

.sidebar-divider {
  height: 1px;
  background: var(--color-chrome-hover);
  margin-block: var(--space-xxs);
}
</style>

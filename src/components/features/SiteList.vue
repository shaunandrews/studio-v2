<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { plus, category } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import SiteItem from '@/components/composites/SiteItem.vue'
import ContextMenu from '@/components/primitives/ContextMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'
import { useSites } from '@/data/useSites'
import { useConversations } from '@/data/useConversations'
import { useSiteTransition } from '@/data/useSiteTransition'
import type { Site } from '@/data/types'

const emit = defineEmits<{
  'new-site': []
}>()

const { sites, activeSiteId, setStatus } = useSites()
const { conversations } = useConversations()
const { navigateToSite } = useSiteTransition('site')

function getUnreadCount(siteId: string): number {
  return conversations.value.filter(c => c.siteId === siteId && c.unread && !c.archived).length
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
const showAllSites = computed(() => sites.value.length > 1)

function goToAllSites() {
  router.push({ name: 'all-sites' })
}
</script>

<template>
  <div class="site-list vstack">
    <template v-if="showAllSites">
      <div
        class="all-sites-item"
        :class="{ active: isAllSitesActive }"
        @click="goToAllSites"
      >
        <div class="all-sites-icon">
          <WPIcon :icon="category" :size="20" />
        </div>
        <span class="all-sites-label">All Sites</span>
      </div>

      <div class="sidebar-divider" />
    </template>

    <div class="items-stack">
      <ContextMenu
        v-for="site in sites"
        :key="site.id"
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

    <div class="add-site-item" @click="emit('new-site')">
      <div class="add-site-icon">
        <WPIcon :icon="plus" :size="16" />
      </div>
      <span class="add-site-label">Add site</span>
    </div>
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

.add-site-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px 4px 4px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-chrome-fg-muted);
  transition: background var(--duration-instant) var(--ease-default);
}

.add-site-item:hover {
  background: rgba(255, 255, 255, 0.05);
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
  font-size: 13px;
  line-height: 20px;
}

.all-sites-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px 4px 4px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-chrome-fg-muted);
  transition: background var(--duration-instant) var(--ease-default);
}

.all-sites-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-chrome-fg);
}

.all-sites-item.active {
  background: rgba(255, 255, 255, 0.08);
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
  font-size: 13px;
  line-height: 20px;
}

.sidebar-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin-block: var(--space-xxs);
}
</style>

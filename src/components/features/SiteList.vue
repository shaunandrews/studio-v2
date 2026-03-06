<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { plus, category } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import SiteItem from '@/components/composites/SiteItem.vue'
import { useSites } from '@/data/useSites'
import { useSiteTransition } from '@/data/useSiteTransition'

const emit = defineEmits<{
  'new-site': []
}>()

const { sites, activeSiteId } = useSites()
const { navigateToSite } = useSiteTransition('site')

const router = useRouter()
const route = useRoute()
const isAllSitesActive = computed(() => route.name === 'all-sites')

function goToAllSites() {
  router.push({ name: 'all-sites' })
}
</script>

<template>
  <div class="site-list vstack">
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

    <div class="items-stack">
      <SiteItem
        v-for="site in sites"
        :key="site.id"
        :site="site"
        :active="site.id === activeSiteId"
        @select="navigateToSite"
      />
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

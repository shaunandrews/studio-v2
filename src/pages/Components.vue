<script setup lang="ts">
import { watch, nextTick } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import '@/pages/dev-docs.css'

const route = useRoute()
const router = useRouter()

const categories = [
  {
    label: 'Primitives',
    route: '/dev/components/primitives',
    items: [
      { id: 'badge', label: 'Badge' },
      { id: 'button', label: 'Button' },
      { id: 'button-split', label: 'ButtonSplit' },
      { id: 'context-menu', label: 'ContextMenu' },
      { id: 'context-ring', label: 'ContextRing' },
      { id: 'dropdown', label: 'Dropdown' },
      { id: 'flyout-menu', label: 'FlyoutMenu' },
      { id: 'modal', label: 'Modal' },
      { id: 'status-indicator', label: 'StatusIndicator' },
      { id: 'text', label: 'Text' },
      { id: 'toggle', label: 'Toggle' },
      { id: 'tooltip', label: 'Tooltip' },
      { id: 'wpicon', label: 'WPIcon' },
    ],
  },
  {
    label: 'Composites',
    route: '/dev/components/composites',
    items: [
      { id: 'chat-message', label: 'ChatMessage' },
      { id: 'chat-message-list', label: 'ChatMessageList' },
      { id: 'content-selector', label: 'ContentSelector' },
      { id: 'global-menu', label: 'GlobalMenu' },
      { id: 'input-chat', label: 'InputChat' },
      { id: 'panel-toolbar', label: 'PanelToolbar' },
      { id: 'preferences-modal', label: 'PreferencesModal' },
      { id: 'site-item', label: 'SiteItem' },
      { id: 'screen-layout', label: 'ScreenLayout' },
      { id: 'shortcuts-modal', label: 'ShortcutsModal' },
      { id: 'site-toolbar', label: 'SiteToolbar' },
    ],
  },
  {
    label: 'Features',
    route: '/dev/components/features',
    items: [
      { id: 'site-navigation', label: 'SiteNavigation' },
      { id: 'site-list', label: 'SiteList' },
      { id: 'site-settings', label: 'SiteSettings' },
      { id: 'import-export', label: 'ImportExport' },
      { id: 'previews', label: 'Previews' },
      { id: 'sync', label: 'Sync' },
      { id: 'add-site', label: 'Add Site' },
    ],
  },
  {
    label: 'Chat Cards',
    route: '/dev/components/chat-cards',
    items: [
      { id: 'chat-card', label: 'ChatCard' },
      { id: 'plugin-card', label: 'PluginCard' },
      { id: 'settings-card', label: 'SettingsCard' },
      { id: 'progress-card', label: 'ProgressCard' },
      { id: 'page-card', label: 'PageCard' },
      { id: 'post-draft-card', label: 'PostDraftCard' },
      { id: 'markdown-text', label: 'MarkdownText' },
    ],
  },
]

function handleNavClick(e: Event, catRoute: string, itemId: string) {
  e.preventDefault()
  const target = `${catRoute}#${itemId}`
  if (route.path === catRoute) {
    const el = document.getElementById(itemId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } else {
    router.push(target)
  }
}

watch(() => route.hash, async (hash) => {
  if (hash) {
    await nextTick()
    const el = document.querySelector(hash)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
})
</script>

<template>
  <div class="dev-layout hstack">
    <nav class="dev-nav" style="width: 220px">
      <h2 class="nav-heading">Components</h2>
      <div v-for="cat in categories" :key="cat.label" class="nav-category">
        <RouterLink :to="cat.route" class="nav-category-link">{{ cat.label }}</RouterLink>
        <ul class="vstack gap-xxxs">
          <li v-for="item in cat.items" :key="item.id">
            <a :href="`${cat.route}#${item.id}`" class="nav-sub-link" @click="handleNavClick($event, cat.route, item.id)">{{ item.label }}</a>
          </li>
        </ul>
      </div>
    </nav>
    <div class="dev-main flex-1 min-w-0">
      <RouterView />
    </div>
  </div>
</template>

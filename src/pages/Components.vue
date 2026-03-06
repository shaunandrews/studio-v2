<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import '@/pages/components/components-docs.css'

const categories = [
  {
    label: 'Primitives',
    route: '/components/primitives',
    items: [
      { id: 'avatar', label: 'Avatar' },
      { id: 'badge', label: 'Badge' },
      { id: 'browser-bar', label: 'BrowserBar' },
      { id: 'button', label: 'Button' },
      { id: 'context-ring', label: 'ContextRing' },
      { id: 'dropdown', label: 'Dropdown' },
      { id: 'status-indicator', label: 'StatusIndicator' },
      { id: 'text', label: 'Text' },
      { id: 'titlebar', label: 'Titlebar' },
      { id: 'tooltip', label: 'Tooltip' },
      { id: 'wpicon', label: 'WPIcon' },
    ],
  },
  {
    label: 'Composites',
    route: '/components/composites',
    items: [
      { id: 'chat-message', label: 'ChatMessage' },
      { id: 'input-chat', label: 'InputChat' },
      { id: 'panel', label: 'Panel' },
      { id: 'panel-toolbar', label: 'PanelToolbar' },
      { id: 'project-item', label: 'ProjectItem' },
      { id: 'tab-bar', label: 'TabBar' },
    ],
  },
  {
    label: 'Features',
    route: '/components/features',
    items: [
      { id: 'agent-panel', label: 'AgentPanel' },
      { id: 'project-list', label: 'ProjectList' },
    ],
  },
  {
    label: 'Chat Cards',
    route: '/components/chat-cards',
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
</script>

<template>
  <div class="components-layout hstack">
    <nav class="components-nav">
      <h2 class="nav-heading">Components</h2>
      <div v-for="cat in categories" :key="cat.label" class="nav-category">
        <RouterLink :to="cat.route" class="nav-category-link">{{ cat.label }}</RouterLink>
        <ul class="vstack gap-xxxs">
          <li v-for="item in cat.items" :key="item.id">
            <a :href="`${cat.route}#${item.id}`" class="nav-link">{{ item.label }}</a>
          </li>
        </ul>
      </div>
    </nav>
    <div class="components flex-1 min-w-0">
      <RouterView />
    </div>
  </div>
</template>

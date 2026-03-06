<script setup lang="ts">
import {
  cog, help, chevronDown,
  pencil, copy, trash,
  dashboard, styles, navigation, layout, pages, post,
  download, upload, cloudUpload,
  external as externalIcon,
} from '@wordpress/icons'

import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from '@/components/primitives/Button.vue'
import Dropdown from '@/components/primitives/Dropdown.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import Text from '@/components/primitives/Text.vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { useProjects } from '@/data/useProjects'
import { isAIConfigured, getAPIKey, setAPIKey } from '@/data/ai-service'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'

const emit = defineEmits<{
  'open-shortcuts': []
  'start-tour': []
}>()

const router = useRouter()
const route = useRoute()
const { projects } = useProjects()

const currentProject = computed(() => {
  const projectId = route.params.id as string | undefined
  if (projectId) return projects.value.find(p => p.id === projectId) ?? null
  return null
})

const title = computed(() => {
  if (currentProject.value) return `WordPress Studio \u2022 ${currentProject.value.name}`
  return 'WordPress Studio'
})
watch(title, (t) => { document.title = t }, { immediate: true })

// ── Project flyout menu ──
const flyoutMenuRef = ref<InstanceType<typeof FlyoutMenu> | null>(null)

const projectMenuGroups = computed<FlyoutMenuGroup[]>(() => [
  {
    items: [
      {
        label: 'Project',
        children: [
          { label: 'Rename', icon: pencil, action: () => {} },
          { label: 'Duplicate', icon: copy, action: () => {} },
          { label: 'Delete', icon: trash, destructive: true, action: () => {} },
        ],
      },
      {
        label: 'WordPress Admin',
        children: [
          { label: 'WP Admin', icon: dashboard, action: () => {} },
          { label: 'Styles', icon: styles, action: () => {} },
          { label: 'Navigation', icon: navigation, action: () => {} },
          { label: 'Templates', icon: layout, action: () => {} },
          { label: 'Pages', icon: pages, action: () => {} },
          { label: 'Posts', icon: post, action: () => {} },
        ],
      },
      {
        label: 'Open in\u2026',
        children: [
          { label: 'Finder', iconUrl: 'https://symbl.revend.group/img/appicon/Finder.png', action: () => {} },
          { label: 'Cursor', iconUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/cursor-ai-code-icon.svg', action: () => {} },
          { label: 'VS Code', iconUrl: 'https://icon.icepanel.io/Technology/svg/Visual-Studio-Code-%28VS-Code%29.svg', action: () => {} },
          { label: 'Terminal', iconUrl: 'https://symbl.revend.group/img/appicon/Terminal.png', action: () => {} },
        ],
      },
    ],
  },
  {
    items: [
      {
        label: 'More',
        children: [
          { label: 'Import', icon: download, action: () => {} },
          { label: 'Export', icon: upload, action: () => {} },
          { label: 'Publish', icon: cloudUpload, action: () => {} },
        ],
      },
    ],
  },
])

// ── Help menu ──
const helpMenuGroups = computed<FlyoutMenuGroup[]>(() => [
  {
    items: [
      { label: 'Take a Tour', action: () => emit('start-tour') },
      { label: 'Keyboard Shortcuts', detail: '⌘/', action: () => emit('open-shortcuts') },
    ],
  },
  {
    items: [
      { label: 'Help', icon: externalIcon, action: () => window.open('https://developer.wordpress.org/studio/', '_blank') },
      { label: 'Community', icon: externalIcon, action: () => window.open('https://wordpress.org/support/forum/', '_blank') },
      { label: 'Report a Bug', icon: externalIcon, action: () => window.open('https://github.com/Automattic/studio/issues', '_blank') },
    ],
  },
])

// ── Settings dropdown ──
const settingsValue = ref('')

const settingsOptions = [
  { label: 'Settings', options: [
    { label: 'API Key', value: '__api-key__' },
  ]},
  { label: 'Dev Pages', options: [
    { label: 'Components', value: 'components' },
    { label: 'Design System', value: 'design-system' },
    { label: 'Architecture', value: 'architecture' },
  ]},
]

// API key popover
const showKeySettings = ref(false)
const keyInput = ref('')
const keySaved = ref(false)
const aiConfigured = ref(isAIConfigured())
const keyPopoverRef = ref<HTMLElement | null>(null)

function openKeySettings() {
  showKeySettings.value = true
  keyInput.value = getAPIKey()
  keySaved.value = false
}

function saveKey() {
  setAPIKey(keyInput.value)
  aiConfigured.value = isAIConfigured()
  keySaved.value = true
  setTimeout(() => {
    keySaved.value = false
    showKeySettings.value = false
  }, 1000)
}

function onClickOutsideKey(e: MouseEvent) {
  if (showKeySettings.value && keyPopoverRef.value && !keyPopoverRef.value.contains(e.target as Node)) {
    showKeySettings.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onClickOutsideKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onClickOutsideKey)
})

function onSettingsSelect(value: string) {
  settingsValue.value = ''
  if (value === '__api-key__') {
    openKeySettings()
    return
  }
  router.push({ name: value })
}
</script>

<template>
  <div class="titlebar">
    <div class="titlebar-start hstack gap-xxs">
      <div class="traffic-lights hstack gap-xs me-xxs">
        <span class="light close"></span>
        <span class="light minimize"></span>
        <span class="light maximize"></span>
      </div>
    </div>
    <div class="titlebar-center hstack">
      <template v-if="currentProject">
        <button class="titlebar-home" @click="router.push('/')">
          <Text variant="body" color="secondary">WordPress Studio</Text>
        </button>
        <span class="titlebar-sep">/</span>
        <FlyoutMenu
          ref="flyoutMenuRef"
          :groups="projectMenuGroups"
          surface="dark"
        >
          <template #trigger="{ toggle, open }">
            <button
              class="project-menu-trigger hstack gap-xxxs"
              @click="toggle"
            >
              <Text variant="body" color="secondary" weight="semibold">{{ currentProject.name }}</Text>
              <WPIcon :icon="chevronDown" :size="14" />
            </button>
          </template>
        </FlyoutMenu>
      </template>
      <Text v-else variant="body" color="secondary" weight="semibold" tag="h1">{{ title }}</Text>
    </div>
    <div class="titlebar-end hstack gap-xxs">
      <Dropdown
        v-model="settingsValue"
        :groups="settingsOptions"
        :trigger-icon="cog"
        :show-chevron="false"
        surface="dark"
        placement="below"
        tooltip="Settings"
        @update:model-value="onSettingsSelect"
      />
      <FlyoutMenu :groups="helpMenuGroups" surface="dark" align="end">
        <template #trigger="{ toggle, open: menuOpen }">
          <Button variant="tertiary" surface="dark" :icon="help" size="small"
            :tooltip="menuOpen ? undefined : 'Help'" @click="toggle" />
        </template>
      </FlyoutMenu>
    </div>
    <div v-if="showKeySettings" ref="keyPopoverRef" class="key-popover" @click.stop>
      <div class="key-popover__status">
        {{ aiConfigured ? 'AI configured' : 'No API key' }}
      </div>
      <input
        v-model="keyInput"
        type="password"
        placeholder="sk-ant-..."
        class="key-popover__input"
      />
      <Button :label="keySaved ? 'Saved!' : 'Save'" variant="primary" surface="dark" size="small" width="full" @click="saveKey" />
    </div>
  </div>
</template>

<style scoped>
.titlebar {
  height: 35px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-xs) 0 var(--space-s);
  flex-shrink: 0;
  -webkit-app-region: drag;
  border-bottom: 1px solid var(--color-chrome-border);
}

.titlebar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  gap: var(--space-xxs);
}

/* Home link in project view */
.titlebar-home {
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;
  padding: var(--space-xxxs) var(--space-xxs);
  border-radius: var(--radius-s);
  -webkit-app-region: no-drag;
  transition: background var(--duration-instant) var(--ease-default);
}

.titlebar-home:hover {
  background: var(--color-chrome-hover);
}

.titlebar-sep {
  color: var(--color-chrome-text-muted);
  pointer-events: none;
  user-select: none;
  font-size: var(--font-size-m);
  line-height: 1;
}

/* Project name dropdown trigger */
.project-menu-trigger {
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;
  color: var(--color-chrome-text-secondary);
  border-radius: var(--radius-s);
  padding: var(--space-xxxs) var(--space-xxs);
  -webkit-app-region: no-drag;
  transition: background var(--duration-instant) var(--ease-default), color var(--duration-instant) var(--ease-default);
  align-items: center;
}

.project-menu-trigger:hover {
  background: var(--color-chrome-hover);
  color: var(--color-chrome-text);
}

.project-menu-trigger svg {
  color: var(--color-chrome-text-muted);
  transition: color var(--duration-instant) var(--ease-default);
}

.project-menu-trigger:hover svg {
  color: var(--color-chrome-text-secondary);
}

/* Static title (home view) -- non-interactive */
.titlebar-center > :deep(h1) {
  pointer-events: none;
}

.titlebar-start,
.titlebar-end {
  -webkit-app-region: no-drag;
}

.traffic-lights {
  /* margin via .me-xxs utility */
}

.light {
  width: 12px; /* OS-native size, not on grid -- intentional */
  height: 12px;
  border-radius: 50%;
}

.light.close { background: var(--color-light-close); }
.light.minimize { background: var(--color-light-minimize); }
.light.maximize { background: var(--color-light-maximize); }

.key-popover {
  position: absolute;
  top: 100%;
  right: var(--space-xs); /* Physical direction for app chrome edge */
  z-index: 100;
  background: var(--color-chrome);
  border: 1px solid var(--color-chrome-border);
  border-radius: var(--radius-m);
  padding: var(--space-s);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: 280px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.key-popover__status {
  font-size: var(--font-size-s);
  color: var(--color-chrome-text-secondary);
}

.key-popover__input {
  font-size: var(--font-size-s);
  padding: var(--space-xxs) var(--space-xs);
  border: 1px solid var(--color-chrome-border);
  border-radius: var(--radius-s);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  background: var(--color-chrome-input, rgba(255, 255, 255, 0.08));
  color: var(--color-chrome-text);
}

.key-popover__input::placeholder {
  color: var(--color-chrome-text-muted);
}
</style>

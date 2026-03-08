<script setup lang="ts">
import { ref, computed } from 'vue'
import { category, chevronDown, moreVertical, wordpress, share, trash, backup, seen, dashboard, desktop, styles, symbolFilled, navigation, layout, page } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import ButtonSplit from '@/components/primitives/ButtonSplit.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'
import { useSites } from '@/data/useSites'

const openLabel = ref('Browser')
const openIconUrl = ref('/icons/chrome.svg')

function onOpenSelect(label: string, iconUrl: string) {
  openLabel.value = label
  openIconUrl.value = iconUrl
}

const props = defineProps<{
  title: string
  siteId?: string
  favicon?: string
  status?: 'running' | 'stopped' | 'loading'
  loadingTarget?: 'running' | 'stopped'
  sidebarHidden?: boolean
  isAllSites?: boolean
}>()

const emit = defineEmits<{
  'toggle-status': []
  'switch-site': [id: string]
  'duplicate': []
  'delete': []
}>()

const { sites } = useSites()

const sitePickerGroups = computed<FlyoutMenuGroup[]>(() => {
  return [{
    items: sites.value.map(p => ({
      label: p.name,
      iconUrl: p.favicon,
      checked: p.name === props.title,
      action: () => emit('switch-site', p.id),
    })),
  }]
})

const statusLabel = computed(() => {
  if (props.status === 'running') return 'Running'
  if (props.status === 'loading') return props.loadingTarget === 'stopped' ? 'Stopping…' : 'Starting…'
  return 'Stopped'
})

const statusTooltip = computed(() => {
  if (props.status === 'running') return 'Stop site'
  if (props.status === 'loading') return props.loadingTarget === 'stopped' ? 'Stopping…' : 'Starting…'
  return 'Start site'
})

const wpMenuGroups = computed<FlyoutMenuGroup[]>(() => [{
  items: [
    { label: 'WP admin', icon: dashboard },
    { label: 'Site Editor', icon: desktop },
    { label: 'Styles', icon: styles },
    { label: 'Patterns', icon: symbolFilled },
    { label: 'Navigation', icon: navigation },
    { label: 'Templates', icon: layout },
    { label: 'Pages', icon: page },
  ],
}])

const openMenuGroups = computed<FlyoutMenuGroup[]>(() => [
  {
    items: [
      { label: 'Browser', iconUrl: '/icons/chrome.svg', checked: openLabel.value === 'Browser', action: () => onOpenSelect('Browser', '/icons/chrome.svg') },
      { label: 'VS Code', iconUrl: '/icons/vscode.svg', checked: openLabel.value === 'VS Code', action: () => onOpenSelect('VS Code', '/icons/vscode.svg') },
      { label: 'Cursor', iconUrl: '/icons/cursor.svg', checked: openLabel.value === 'Cursor', action: () => onOpenSelect('Cursor', '/icons/cursor.svg') },
      { label: 'Claude', iconUrl: '/icons/claude.svg', checked: openLabel.value === 'Claude', action: () => onOpenSelect('Claude', '/icons/claude.svg') },
      { label: 'Codex', iconUrl: '/icons/codex-color.svg', checked: openLabel.value === 'Codex', action: () => onOpenSelect('Codex', '/icons/codex-color.svg') },
    ],
  },
  {
    items: [
      { label: 'Terminal', iconUrl: '/icons/terminal.svg', checked: openLabel.value === 'Terminal', action: () => onOpenSelect('Terminal', '/icons/terminal.svg') },
      { label: 'Finder', iconUrl: '/icons/finder.svg', checked: openLabel.value === 'Finder', action: () => onOpenSelect('Finder', '/icons/finder.svg') },
    ],
  },
])

const moreMenuGroups = computed<FlyoutMenuGroup[]>(() => {
  const groups: FlyoutMenuGroup[] = [{
    items: [
      { label: 'Share preview link', icon: share, action: () => alert('Generating share link…') },
      { label: 'Preview site', icon: seen, action: () => alert('Opening site preview…') },
    ],
  }, {
    items: [
      { label: 'Duplicate site', icon: backup, action: () => emit('duplicate') },
    ],
  }, {
    items: [
      { label: 'Delete site', icon: trash, destructive: true, action: () => emit('delete') },
    ],
  }]
  return groups
})
</script>

<template>
  <div class="site-toolbar" :class="{ 'has-lights': sidebarHidden }">
    <div class="toolbar-start">
      <!-- Site picker pill when sidebar hidden -->
      <FlyoutMenu v-if="sidebarHidden" :groups="sitePickerGroups" surface="dark" align="start">
        <template #trigger="{ toggle }">
          <button class="site-picker pill pill-with-icon" @click="toggle">
            <span class="pill-icon-start">
              <WPIcon v-if="isAllSites" :icon="category" :size="14" />
              <img v-else-if="favicon" class="site-picker-favicon" :src="favicon" alt="" />
            </span>
            <span class="pill-label">{{ title }}</span>
            <span class="pill-icon-end">
              <WPIcon :icon="chevronDown" :size="14" />
            </span>
          </button>
        </template>
      </FlyoutMenu>
      <span v-else class="site-title">
        <img v-if="favicon" class="site-title-favicon" :src="favicon" alt="" />
        {{ title }}
      </span>
    </div>
    <div class="toolbar-end">
      <template v-if="!isAllSites">
        <Tooltip :text="statusTooltip" placement="bottom">
          <button
            class="pill status-pill"
            :class="status ?? 'stopped'"
            :disabled="status === 'loading'"
            @click="emit('toggle-status')"
          >
            <span class="pill-label">{{ statusLabel }}</span>
            <span class="pill-icon-end">
              <svg v-if="status === 'loading'" class="status-spinner" viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="20 12" />
              </svg>
              <svg v-else class="status-shape" viewBox="0 0 10 10">
                <template v-if="(status ?? 'stopped') === 'stopped'">
                  <rect class="status-rect" x="1" y="1" width="8" height="8" rx="1.5" />
                  <path class="status-play" d="M3.5 1.8 L8.5 5 L3.5 8.2Z" />
                </template>
                <template v-else>
                  <circle class="status-circle" cx="5" cy="5" r="4.5" />
                  <rect class="status-stop" x="1" y="1" width="8" height="8" rx="1.5" />
                </template>
              </svg>
            </span>
          </button>
        </Tooltip>
        <FlyoutMenu :groups="wpMenuGroups" surface="dark" align="end">
          <template #trigger="{ toggle }">
            <Tooltip text="Open WordPress admin" placement="bottom">
              <ButtonSplit
                :icon="wordpress"
                label="WordPress"
                @click="alert('Opening WordPress admin…')"
                @secondary-click="toggle"
              />
            </Tooltip>
          </template>
        </FlyoutMenu>
        <FlyoutMenu :groups="openMenuGroups" surface="dark" align="end">
          <template #trigger="{ toggle }">
            <Tooltip :text="`Open in ${openLabel}`" placement="bottom">
              <ButtonSplit
                :iconUrl="openIconUrl"
                label="Open"
                @click="alert(`Opening in ${openLabel}…`)"
                @secondary-click="toggle"
              />
            </Tooltip>
          </template>
        </FlyoutMenu>
      </template>
      <FlyoutMenu :groups="moreMenuGroups" surface="dark" align="end">
        <template #trigger="{ toggle, open: menuOpen }">
          <Tooltip text="More options" placement="bottom">
            <button class="kebab" :class="{ 'is-active': menuOpen }" @click="toggle">
              <WPIcon :icon="moreVertical" :size="20" />
            </button>
          </Tooltip>
        </template>
      </FlyoutMenu>
    </div>
  </div>
</template>

<style scoped>
.site-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 8px 8px 16px;
  flex-shrink: 0;
  border-block-end: 1px solid var(--color-frame-border);
}

/* When sidebar hidden, leave room for traffic lights (16px offset + 52px dots + gap) */
.site-toolbar.has-lights {
  padding-inline-start: 86px;
}

.toolbar-start {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.site-title {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-m);
  font-weight: 600;
  line-height: 20px;
  color: var(--color-frame-fg);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-title-favicon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-s);
  object-fit: cover;
  flex-shrink: 0;
}

/* ── Site picker pill ── */

.site-picker-favicon {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  object-fit: cover;
  display: block;
}

/* ── Toolbar end ── */

.toolbar-end {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Pills ── */

.pill {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding-inline-start: 12px;
  padding-inline-end: 8px;
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--duration-instant) var(--ease-default);
}

.pill-with-icon {
  padding: 6px;
  gap: 4px;
}

.pill:hover {
  background: var(--color-frame-hover);
}

.pill-icon-start,
.pill-icon-end {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--color-frame-fg-muted);
}

.status-shape {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}

.status-shape rect,
.status-shape circle,
.status-shape path {
  transition: opacity 200ms var(--ease-default);
}

/* Stopped: grey rounded square */
.status-rect {
  fill: var(--color-status-stopped);
  opacity: 1;
}

.status-play {
  fill: var(--color-status-running);
  stroke: var(--color-status-running);
  stroke-width: 1;
  stroke-linejoin: round;
  opacity: 0;
}

.status-pill.stopped:hover:not(:disabled) .status-rect { opacity: 0; }
.status-pill.stopped:hover:not(:disabled) .status-play { opacity: 1; }

/* Running: green circle */
.status-circle {
  fill: var(--color-status-running);
  opacity: 1;
}

.status-stop {
  fill: var(--color-status-stop-hover);
  opacity: 0;
}

.status-pill.running:hover:not(:disabled) .status-circle { opacity: 0; }
.status-pill.running:hover:not(:disabled) .status-stop { opacity: 1; }

/* Loading: spinner */
.status-spinner {
  width: 14px;
  height: 14px;
  color: var(--color-frame-theme);
  animation: toolbar-spin 0.8s linear infinite;
}

@keyframes toolbar-spin {
  to { transform: rotate(360deg); }
}

.status-pill:disabled {
  cursor: default;
  opacity: 0.7;
}

.status-pill.running:hover:not(:disabled) {
  border-color: var(--color-status-stop-hover);
}

.status-pill.stopped:hover:not(:disabled) {
  border-color: var(--color-status-running);
}

.browser-icon {
  width: 14px;
  height: 14px;
  display: block;
}

/* ── Kebab ── */

.kebab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
              color var(--duration-instant) var(--ease-default);
}

.kebab:hover,
.kebab.is-active {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}
</style>

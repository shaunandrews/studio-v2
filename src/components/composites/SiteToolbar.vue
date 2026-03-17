<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { category, chevronDown, moreVertical, share, trash, backup, seen, plus } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import SiteIcon from '@/components/primitives/SiteIcon.vue'
import SiteItem from '@/components/composites/SiteItem.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import ButtonSplit from '@/components/primitives/ButtonSplit.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'
import { useOperatingSystem } from '@/data/useOperatingSystem'
import { useSites } from '@/data/useSites'
import { useConversations } from '@/data/useConversations'
import { useAddSite } from '@/data/useAddSite'

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
  'navigate-all-sites': []
  'add-site': []
  'duplicate': []
  'delete': []
}>()

const { isMac } = useOperatingSystem()
const { sites } = useSites()
const { conversations } = useConversations()
const { openAddSite } = useAddSite()

const currentSite = computed(() => sites.value.find(s => s.id === props.siteId))

/* ── Site picker panel ── */
const sitePickerOpen = ref(false)
const sitePickerEl = ref<HTMLElement | null>(null)

function toggleSitePicker() {
  sitePickerOpen.value = !sitePickerOpen.value
}

function closeSitePicker() {
  sitePickerOpen.value = false
}

function onPickerClickOutside(e: MouseEvent) {
  if (sitePickerEl.value && !sitePickerEl.value.contains(e.target as Node)) {
    closeSitePicker()
  }
}

onMounted(() => document.addEventListener('pointerdown', onPickerClickOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPickerClickOutside))

function getUnreadCount(siteId: string): number {
  return conversations.value.filter(c => c.siteId === siteId && c.unread && !c.archived).length
}

function selectSite(id: string) {
  closeSitePicker()
  emit('switch-site', id)
}

function goAllSites() {
  closeSitePicker()
  emit('navigate-all-sites')
}

function addSite() {
  closeSitePicker()
  openAddSite()
}

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
  <div class="site-toolbar" :class="{ 'has-lights': sidebarHidden && isMac }">
    <div class="toolbar-start">
      <!-- Site picker pill + dropdown panel when sidebar hidden -->
      <div v-if="sidebarHidden" ref="sitePickerEl" class="site-picker-anchor">
        <button class="site-picker pill pill-with-icon" @click="toggleSitePicker">
          <span class="pill-icon-start">
            <WPIcon v-if="isAllSites" :icon="category" :size="14" />
            <SiteIcon v-else :favicon="favicon" :site-name="title" :size="14" />
          </span>
          <span class="pill-label">{{ title }}</span>
          <span class="pill-icon-end">
            <WPIcon :icon="chevronDown" :size="14" />
          </span>
        </button>
        <Transition name="picker">
          <div v-if="sitePickerOpen" class="site-picker-panel">
            <button class="picker-row picker-all-sites" :class="{ active: isAllSites }" @click="goAllSites">
              <span class="picker-all-sites-icon">
                <WPIcon :icon="category" :size="20" />
              </span>
              <span class="picker-row-label">All Sites</span>
            </button>
            <div class="picker-divider" />
            <div class="picker-sites">
              <SiteItem
                v-for="site in sites"
                :key="site.id"
                :site="site"
                :active="site.id === siteId"
                :unread-count="getUnreadCount(site.id)"
                @select="selectSite"
              />
            </div>
            <div class="picker-divider" />
            <button class="picker-row picker-add-site" @click="addSite">
              <span class="picker-add-site-icon">
                <WPIcon :icon="plus" :size="16" />
              </span>
              <span class="picker-row-label">Add site</span>
            </button>
          </div>
        </Transition>
      </div>
      <span v-else class="site-title">
        <SiteIcon :favicon="favicon" :site-name="title" :size="32" />
        {{ title }}
      </span>
    </div>
    <div class="toolbar-end">
      <template v-if="!isAllSites">
        <span class="status-label" :class="status ?? 'stopped'">{{ statusLabel }}</span>
        <Tooltip :text="statusTooltip" placement="bottom">
          <button
            class="status-btn"
            :class="status ?? 'stopped'"
            :disabled="status === 'loading'"
            @click="emit('toggle-status')"
          >
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
          </button>
        </Tooltip>
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
    </div>
  </div>
</template>

<style scoped>
.site-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-xs);
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
  gap: var(--space-xs);
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

/* ── Site picker pill ── */

/* ── Toolbar end ── */

.toolbar-end {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
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

/* ── Site picker panel ── */

.site-picker-anchor {
  position: relative;
}

.site-picker-panel {
  position: absolute;
  inset-block-start: calc(100% + var(--space-xxs));
  inset-inline-start: 0;
  min-width: 220px;
  max-width: 280px;
  padding: var(--space-xxs);
  border-radius: var(--radius-m);
  background: var(--color-chrome-bg);
  border: 1px solid var(--color-chrome-border, rgba(255, 255, 255, 0.08));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.picker-sites {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 240px;
  overflow-y: auto;
}

.picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 4px 4px 4px;
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-chrome-fg-muted);
  font-family: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
  text-align: start;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.picker-row:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-chrome-fg);
}

.picker-row.active {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-chrome-fg);
}

.picker-all-sites-icon,
.picker-add-site-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.picker-row-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picker-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin-block: var(--space-xxxs);
}

/* Transition */
.picker-enter-active {
  transition: opacity var(--duration-quick) var(--ease-default),
    transform var(--duration-quick) var(--ease-default);
}
.picker-leave-active {
  transition: opacity var(--duration-instant) var(--ease-default),
    transform var(--duration-instant) var(--ease-default);
}
.picker-enter-from,
.picker-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Status label ── */

.status-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-frame-fg-muted);
}

.status-label.running {
  color: var(--color-status-running);
}

/* ── Status icon button ── */

.status-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
              border-color var(--duration-instant) var(--ease-default);
}

.status-btn:hover:not(:disabled) {
  background: var(--color-frame-hover);
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

.status-btn.stopped:hover:not(:disabled) .status-rect { opacity: 0; }
.status-btn.stopped:hover:not(:disabled) .status-play { opacity: 1; }

/* Running: green circle */
.status-circle {
  fill: var(--color-status-running);
  opacity: 1;
}

.status-stop {
  fill: var(--color-status-stop-hover);
  opacity: 0;
}

.status-btn.running:hover:not(:disabled) .status-circle { opacity: 0; }
.status-btn.running:hover:not(:disabled) .status-stop { opacity: 1; }

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

.status-btn:disabled {
  cursor: default;
  opacity: 0.7;
}

.status-btn.running:hover:not(:disabled) {
  border-color: var(--color-status-stop-hover);
}

.status-btn.stopped:hover:not(:disabled) {
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

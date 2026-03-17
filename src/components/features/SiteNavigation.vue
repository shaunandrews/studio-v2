<script setup lang="ts">
import { computed, ref, toRef, onMounted, onBeforeUnmount } from 'vue'
import { plus, archive, update, customLink, login, tool, home, chevronDown, category } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import SiteIcon from '@/components/primitives/SiteIcon.vue'
import SiteItem from '@/components/composites/SiteItem.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import Button from '@/components/primitives/Button.vue'

import ProgressiveBlur from '@/components/primitives/ProgressiveBlur.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'

import { useConversations } from '@/data/useConversations'
import { useSites } from '@/data/useSites'
import { useOperatingSystem } from '@/data/useOperatingSystem'
import { useAddSite } from '@/data/useAddSite'

const props = defineProps<{
  siteId: string
  selectedId: string | null
  activeScreen?: string
  siteFavicon?: string
  isAllSites?: boolean
  sidebarHidden?: boolean
}>()

const emit = defineEmits<{
  select: [conversationId: string]
  'new-task': []
  navigate: [screen: string]
  'switch-site': [id: string]
  'navigate-all-sites': []
}>()

const { isMac } = useOperatingSystem()
const { openAddSite } = useAddSite()
const { conversations, getConversations, messages, archiveConversation, unarchiveConversation } = useConversations()
const siteConvos = getConversations(toRef(props, 'siteId'))

const { sites: allSites } = useSites()
const currentSite = computed(() => allSites.value.find(s => s.id === props.siteId))
const siteName = computed(() => currentSite.value?.name ?? props.siteId)

/* ── Site picker ── */
const sitePickerOpen = ref(false)
const sitePickerEl = ref<HTMLElement | null>(null)

function toggleSitePicker() { sitePickerOpen.value = !sitePickerOpen.value }
function closeSitePicker() { sitePickerOpen.value = false }

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
const runningCount = computed(() => allSites.value.filter(p => p.status === 'running').length)
const stoppedCount = computed(() => allSites.value.filter(p => p.status === 'stopped').length)

const sortedConvos = computed(() =>
  [...siteConvos.value]
    .filter(c => !c.archived)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
)

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`
  if (diffDays < 7) return `${Math.floor(diffDays)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getLastTimestamp(convoId: string): string {
  const convoMsgs = messages.value
    .filter(m => m.conversationId === convoId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return convoMsgs[0]?.timestamp ?? ''
}

function onArchive(e: Event, convoId: string) {
  e.stopPropagation()
  archiveConversation(convoId)
}

const archiveMenuRef = ref<InstanceType<typeof FlyoutMenu> | null>(null)

const archivedConvos = computed(() =>
  [...siteConvos.value]
    .filter(c => c.archived)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
)

const archiveMenuGroups = computed<FlyoutMenuGroup[]>(() => {
  if (archivedConvos.value.length === 0) {
    return [{ items: [{ label: 'No archived tasks' }] }]
  }
  return [
    {
      label: 'Archived tasks',
      items: archivedConvos.value.map(c => ({
        label: c.title || 'New task',
        detail: formatTime(c.createdAt),
        action: () => unarchiveConversation(c.id),
      })),
    },
    {
      items: [{ label: 'View archives' }],
    },
  ]
})
</script>

<template>
  <div class="site-navigation">
    <!-- All Sites summary -->
    <div v-if="isAllSites" class="site-overview--all">
      <div class="summary__sites">
        <div class="summary__favicons">
          <SiteIcon
            v-for="site in allSites"
            :key="site.id"
            class="summary__favicon"
            :favicon="site.favicon"
            :site-name="site.name"
            :size="24"
          />
        </div>
        <span class="summary__count">{{ allSites.length }} sites</span>
      </div>
      <div class="summary__statuses">
        <span v-if="runningCount" class="summary__status">
          <span class="status-dot running" />
          {{ runningCount }} running
        </span>
        <span v-if="stoppedCount" class="summary__status">
          <span class="status-dot stopped" />
          {{ stoppedCount }} stopped
        </span>
      </div>
    </div>

    <!-- Site picker (when sidebar hidden) -->
    <Transition name="site-header">
      <div v-if="!isAllSites && sidebarHidden" ref="sitePickerEl" class="site-picker-anchor" :class="{ 'has-lights': isMac }">
        <button class="site-picker pill pill-with-icon" @click="toggleSitePicker">
          <span class="pill-icon-start">
            <SiteIcon :favicon="siteFavicon" :site-name="siteId" :size="14" />
          </span>
          <span class="pill-label">{{ siteName }}</span>
          <span class="pill-icon-end">
            <WPIcon :icon="chevronDown" :size="14" />
          </span>
        </button>
        <Transition name="picker">
          <div v-if="sitePickerOpen" class="site-picker-panel">
            <button class="picker-row picker-all-sites" @click="goAllSites">
              <span class="picker-all-sites-icon">
                <WPIcon :icon="category" :size="20" />
              </span>
              <span class="picker-row-label">All Sites</span>
            </button>
            <div class="picker-divider" />
            <div class="picker-sites">
              <SiteItem
                v-for="s in allSites"
                :key="s.id"
                :site="s"
                :active="s.id === siteId"
                :unread-count="getUnreadCount(s.id)"
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
    </Transition>

    <!-- Site nav -->
    <nav v-if="!isAllSites" class="site-sections">
      <button class="site-sections__item" :class="{ 'is-active': activeScreen === 'overview' }" @click="$emit('navigate', 'overview')">
        <WPIcon :icon="home" :size="20" class="site-sections__icon" />
        Overview
      </button>
      <button class="site-sections__item" :class="{ 'is-active': activeScreen === 'sync' }" @click="$emit('navigate', 'sync')">
        <WPIcon :icon="update" :size="20" class="site-sections__icon" />
        Sync
      </button>
      <button class="site-sections__item" :class="{ 'is-active': activeScreen === 'previews' }" @click="$emit('navigate', 'previews')">
        <WPIcon :icon="customLink" :size="20" class="site-sections__icon" />
        Previews
      </button>
      <button class="site-sections__item" :class="{ 'is-active': activeScreen === 'import-export' }" @click="$emit('navigate', 'import-export')">
        <WPIcon :icon="login" :size="20" class="site-sections__icon" />
        Import/Export
      </button>
      <button class="site-sections__item" :class="{ 'is-active': activeScreen === 'settings' }" @click="$emit('navigate', 'settings')">
        <WPIcon :icon="tool" :size="20" class="site-sections__icon" />
        Settings
      </button>
    </nav>

    <div class="site-tasks__header">
      <span class="site-tasks__title">Tasks</span>
      <div class="site-tasks__actions">
        <FlyoutMenu ref="archiveMenuRef" :groups="archiveMenuGroups" surface="dark" align="end" max-width="260px">
          <template #trigger="{ toggle, open }">
            <Tooltip text="Archived tasks" placement="top" :delay="300">
              <button class="site-tasks__icon-btn" :class="{ 'is-active': open }" @click="toggle">
                <WPIcon :icon="archive" :size="16" />
              </button>
            </Tooltip>
          </template>
        </FlyoutMenu>
        <Button :icon="plus" icon-only size="small" variant="tertiary" tooltip="New task" tooltip-placement="top" @click="$emit('new-task')" />
      </div>
    </div>

    <!-- Site tasks -->
    <div class="site-tasks__list">
      <div
        v-for="convo in sortedConvos"
        :key="convo.id"
        class="site-tasks__item"
        :class="{ 'is-selected': convo.id === selectedId }"
        @click="$emit('select', convo.id)"
      >
        <span v-if="convo.unread" class="site-tasks__unread-dot" />
        <span class="site-tasks__item-title">{{ convo.title || 'New task' }}</span>
        <span class="site-tasks__item-end">
          <template v-if="convo.status === 'running'">
            <svg class="site-tasks__spinner" width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="24 12" fill="none" />
            </svg>
          </template>
          <span v-else class="site-tasks__time">{{ formatTime(getLastTimestamp(convo.id) || convo.createdAt) }}</span>
          <Tooltip text="Archive" placement="right" :delay="300" class="site-tasks__archive-wrap">
            <button class="site-tasks__archive" @click.stop="onArchive($event, convo.id)">
              <WPIcon :icon="archive" :size="16" />
            </button>
          </Tooltip>
        </span>
      </div>
      <div v-if="sortedConvos.length === 0" class="site-tasks__empty">
        <div class="empty__illustration">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <!-- Chat bubble -->
            <rect x="6" y="8" width="36" height="24" rx="4" stroke="currentColor" stroke-width="1.5" opacity="0.25" />
            <path d="M14 36l4-4h0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.25" />
            <!-- Lines representing a message -->
            <rect x="12" y="15" width="20" height="2" rx="1" fill="currentColor" opacity="0.15" />
            <rect x="12" y="20" width="14" height="2" rx="1" fill="currentColor" opacity="0.15" />
            <rect x="12" y="25" width="18" height="2" rx="1" fill="currentColor" opacity="0.15" />
          </svg>
        </div>
        <p class="empty__heading">AI agents that work for you</p>
        <p class="empty__description">Tasks are conversations with AI agents that can edit your site, install plugins, write content, and more.</p>
        <Button label="Create your first task" variant="secondary" size="small" @click="$emit('new-task')" />
      </div>
    </div>

    <ProgressiveBlur v-if="sidebarHidden" class="nav-blur" height="80px" />
  </div>
</template>

<style scoped>
.site-navigation {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.nav-blur {
  z-index: 1;
}

/* ── Site picker ── */

.site-picker-anchor {
  position: relative;
  padding: 0 var(--space-xs);
  flex-shrink: 0;
}

.site-picker-anchor.has-lights {
  padding-block-start: 48px; /* Clear macOS traffic lights within the frame */
}

/* Site header animate in/out */
.site-header-enter-active {
  transition: opacity 300ms var(--ease-default),
    max-height 300ms var(--ease-default);
}
.site-header-leave-active {
  transition: opacity 200ms var(--ease-default),
    max-height 200ms var(--ease-default);
}
.site-header-enter-from,
.site-header-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}
.site-header-enter-to,
.site-header-leave-from {
  max-height: 80px;
  overflow: hidden;
}

/* ── Pill button ── */

.pill {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  width: 100%;
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

.pill-label {
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  text-align: start;
}

/* ── Picker panel ── */

.site-picker-panel {
  position: absolute;
  inset-block-start: calc(100% + var(--space-xxs));
  inset-inline-start: var(--space-xs);
  inset-inline-end: var(--space-xs);
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
  padding: 4px;
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

/* Picker panel transition */
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

/* ── Site sections nav ── */

.site-sections {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-xs);
  flex-shrink: 0;
}

.site-sections__item {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 var(--space-xxs);
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-m);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.site-sections__icon {
  flex-shrink: 0;
  color: var(--color-frame-fg-muted);
  transition: color var(--duration-instant) var(--ease-default);
}

.site-sections__item:hover .site-sections__icon,
.site-sections__item.is-active .site-sections__icon {
  color: var(--color-frame-fg-muted);
}

.site-sections__item:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.site-sections__item.is-active {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

/* ── Site tasks ── */

.site-tasks__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 8px 2px 20px;
  border-block-start: 1px solid var(--color-frame-border);
  flex-shrink: 0;
}

.site-tasks__title {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 16px;
}

.site-tasks__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.site-tasks__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.site-tasks__icon-btn:hover,
.site-tasks__icon-btn.is-active {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

/* ── Task list items ── */

.site-tasks__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--space-xs) var(--space-xxxl);
}

.site-tasks__item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  height: var(--space-xxl);
  padding: 0 var(--space-xxs) 0 var(--space-s);
  border-radius: var(--radius-s);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--duration-instant) var(--ease-default);
}

.site-tasks__item:hover {
  background: var(--color-frame-hover);
}

.site-tasks__item.is-selected {
  background: var(--color-frame-hover);
}

.site-tasks__item.is-selected .site-tasks__item-title {
  color: var(--color-frame-fg);
}

.site-tasks__unread-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-frame-theme);
  flex-shrink: 0;
}

.site-tasks__item-title {
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-m);
  line-height: 20px;
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.site-tasks__item-end {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.site-tasks__time {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg);
  opacity: 0.5;
  white-space: nowrap;
}

.site-tasks__archive {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.site-tasks__archive:hover {
  background: var(--color-frame-border);
  color: var(--color-frame-fg);
}

.site-tasks__spinner {
  color: var(--color-frame-theme);
  flex-shrink: 0;
  animation: task-spin 0.8s linear infinite;
}

@keyframes task-spin {
  to { transform: rotate(360deg); }
}

/* Hide archive by default, show on row hover */
.site-tasks__archive-wrap {
  display: none;
}

.site-tasks__item:hover .site-tasks__time,
.site-tasks__item:hover .site-tasks__spinner {
  display: none;
}

.site-tasks__item:hover .site-tasks__archive-wrap {
  display: flex;
}

.site-tasks__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl) var(--space-l);
  text-align: center;
}

/* ── Empty illustration ── */

.empty__illustration {
  margin-block-end: var(--space-m);
  color: var(--color-frame-fg);
}

.empty__heading {
  margin: 0 0 var(--space-xxs);
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  line-height: 1.3;
}

.empty__description {
  margin: 0 0 var(--space-m);
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.5;
  max-width: 240px;
}

/* ── All Sites summary ── */

.site-overview--all {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-s);
  flex-shrink: 0;
  border-block-end: 1px solid var(--color-frame-border);
}

.summary__sites {
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.summary__favicons {
  display: flex;
}

.summary__favicon {
  border: 2px solid var(--color-frame-bg);
}

.summary__favicon + .summary__favicon {
  margin-inline-start: -6px;
}

.summary__count {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
}

.summary__statuses {
  display: flex;
  gap: var(--space-s);
}

.summary__status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.running { background: var(--color-status-running); }
.status-dot.stopped { background: var(--color-status-stopped); }
</style>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { plus, archive, update, customLink, login, tool, home } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import SiteIcon from '@/components/primitives/SiteIcon.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import ProgressiveBlur from '@/components/primitives/ProgressiveBlur.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'
import SiteThumbnail from '@/components/composites/SiteThumbnail.vue'
import { useConversations } from '@/data/useConversations'
import { useSites } from '@/data/useSites'

const props = defineProps<{
  siteId: string
  selectedId: string | null
  activeScreen?: string
  siteName?: string
  siteFavicon?: string
  isAllSites?: boolean
  sidebarHidden?: boolean
}>()

defineEmits<{
  select: [conversationId: string]
  'new-task': []
  navigate: [screen: string]
}>()

const { getConversations, messages, archiveConversation, unarchiveConversation } = useConversations()
const siteConvos = getConversations(toRef(props, 'siteId'))

const { sites: allSites } = useSites()
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

const currentSite = computed(() => allSites.value.find(p => p.id === props.siteId))
const siteLayout = computed(() => currentSite.value?.mockLayout ?? 'cafe')
const localPath = computed(() => `/Users/shaun/Studio/${currentSite.value?.id ?? 'site'}`)

const copiedField = ref<string | null>(null)
let copiedTimeout: ReturnType<typeof setTimeout> | undefined

function copyToClipboard(text: string, field: string) {
  navigator.clipboard.writeText(text)
  copiedField.value = field
  clearTimeout(copiedTimeout)
  copiedTimeout = setTimeout(() => { copiedField.value = null }, 1500)
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

    <!-- Single-site overview -->
    <div v-else class="site-overview vstack align-center gap-xs px-s pt-l pb-m shrink-0">
      <Tooltip text="Open site in browser" placement="top">
        <SiteThumbnail :layout="siteLayout" :name="siteName" @click="alert('Opening site preview…')" />
      </Tooltip>
      <div class="vstack align-center gap-xxxxs">
        <Text variant="body" weight="semibold" class="overview__url">localhost:3920</Text>
        <span class="hstack gap-xxxs overview__creds">
          <Button variant="tertiary" size="mini" label="admin" :tooltip="copiedField === 'user' ? 'Copied!' : 'Copy username'" tooltip-placement="bottom" @click="copyToClipboard('admin', 'user')" />
          <span class="overview__creds-sep">/</span>
          <Button variant="tertiary" size="mini" label="••••••••" :tooltip="copiedField === 'pass' ? 'Copied!' : 'Copy password'" tooltip-placement="bottom" @click="copyToClipboard('password', 'pass')" />
        </span>
        <Button variant="tertiary" size="mini" :label="localPath" :tooltip="copiedField === 'path' ? 'Copied!' : 'Copy local path'" tooltip-placement="bottom" @click="copyToClipboard(localPath, 'path')" />
      </div>
    </div>

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
        <span class="site-tasks__item-title">{{ convo.title || 'New task' }}</span>
        <span class="site-tasks__item-end">
          <span class="site-tasks__time">{{ formatTime(getLastTimestamp(convo.id) || convo.createdAt) }}</span>
          <Tooltip text="Archive" placement="right" :delay="300">
            <button class="site-tasks__archive" @click="onArchive($event, convo.id)">
              <WPIcon :icon="archive" :size="16" />
            </button>
          </Tooltip>
        </span>
      </div>
      <div v-if="sortedConvos.length === 0" class="site-tasks__empty">
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

/* ── Site overview ── */

.site-overview {
  border-block-end: 1px solid var(--color-frame-border);
}

/* Override Tooltip's inline-flex trigger so thumb gets full width */
.site-overview > :deep(.tooltip-trigger) {
  display: flex;
  justify-content: center;
  width: 100%;
}

.overview__url {
  color: var(--color-frame-theme);
  text-decoration: underline;
  cursor: pointer;
}

.overview__creds {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
}

.overview__creds-sep {
  color: var(--color-frame-fg-muted);
  opacity: 0.5;
  margin: 0 1px;
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
  gap: 2px;
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 48px;
}

.site-tasks__item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 8px 0 12px;
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

/* Hide time, show archive on end-area hover */
.site-tasks__archive {
  display: none;
}

.site-tasks__item-end:hover .site-tasks__time {
  display: none;
}

.site-tasks__item-end:hover .site-tasks__archive {
  display: flex;
}

.site-tasks__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-xl) var(--space-l);
  text-align: center;
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

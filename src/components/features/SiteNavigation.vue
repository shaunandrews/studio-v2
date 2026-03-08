<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { plus, archive, update, customLink, login, tool } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import ProgressiveBlur from '@/components/primitives/ProgressiveBlur.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'
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

// -- Tilt effect --
const tiltX = ref(0)
const tiltY = ref(0)
const shineX = ref(50)
const shineY = ref(50)
const isTilting = ref(false)

const tiltStyle = computed(() => ({
  transform: isTilting.value
    ? `perspective(600px) rotateX(${tiltY.value}deg) rotateY(${tiltX.value}deg) scale(1.02)`
    : 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)',
}))

const shineStyle = computed(() => ({
  opacity: isTilting.value ? '1' : '0',
  background: `radial-gradient(circle at ${shineX.value}% ${shineY.value}%, rgba(255,255,255,0.07) 0%, transparent 60%)`,
}))

function onThumbMove(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height
  tiltX.value = (x - 0.5) * 10
  tiltY.value = (0.5 - y) * 8
  shineX.value = x * 100
  shineY.value = y * 100
  isTilting.value = true
}

function onThumbLeave() {
  isTilting.value = false
  tiltX.value = 0
  tiltY.value = 0
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
          <img
            v-for="site in allSites"
            :key="site.id"
            class="summary__favicon"
            :src="site.favicon"
            :alt="site.name"
            :title="site.name"
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
    <div v-else class="site-overview">
      <Tooltip text="Open site in browser" placement="top">
      <button
        class="overview__thumb"
        :style="tiltStyle"
        @mousemove="onThumbMove"
        @mouseleave="onThumbLeave"
        @click="alert('Opening site preview…')"
      >
        <div class="overview__thumb-shine" :style="shineStyle" />
        <!-- Café layout: warm tones, full-width hero, 3 menu cards -->
        <div v-if="siteLayout === 'cafe'" class="overview__mock mock--cafe">
          <div class="mock__nav">
            <span class="mock__logo">{{ siteName || 'My Site' }}</span>
            <div class="mock__links"><span /><span /><span /></div>
          </div>
          <div class="mock__hero">
            <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=400&fit=crop&q=80" alt="" />
            <div class="mock__hero-overlay"><strong>{{ siteName || 'My Site' }}</strong></div>
          </div>
          <div class="mock__grid-3">
            <div class="mock__card">
              <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&q=80" alt="" />
              <div class="mock__card-label" />
            </div>
            <div class="mock__card">
              <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&q=80" alt="" />
              <div class="mock__card-label" />
            </div>
            <div class="mock__card">
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&q=80" alt="" />
              <div class="mock__card-label" />
            </div>
          </div>
        </div>

        <!-- Blog layout: clean white, large featured post with sidebar -->
        <div v-else-if="siteLayout === 'blog'" class="overview__mock mock--blog">
          <div class="mock__nav">
            <span class="mock__logo">{{ siteName || 'My Site' }}</span>
            <div class="mock__links"><span /><span /><span /><span /></div>
          </div>
          <div class="mock__blog-layout">
            <div class="mock__blog-main">
              <div class="mock__blog-featured">
                <img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=300&fit=crop&q=80" alt="" />
              </div>
              <div class="mock__blog-title" />
              <div class="mock__blog-excerpt" />
              <div class="mock__blog-excerpt mock__blog-excerpt--short" />
            </div>
            <div class="mock__blog-sidebar">
              <div class="mock__blog-widget">
                <div class="mock__blog-widget-title" />
                <div class="mock__blog-widget-line" />
                <div class="mock__blog-widget-line" />
                <div class="mock__blog-widget-line mock__blog-widget-line--short" />
              </div>
              <div class="mock__blog-widget">
                <div class="mock__blog-widget-title" />
                <div class="mock__blog-widget-line" />
                <div class="mock__blog-widget-line mock__blog-widget-line--short" />
              </div>
            </div>
          </div>
        </div>

        <!-- Portfolio layout: dark, split hero with text left + image right, project grid -->
        <div v-else class="overview__mock mock--portfolio">
          <div class="mock__nav mock__nav--dark">
            <span class="mock__logo">{{ siteName || 'My Site' }}</span>
            <div class="mock__links"><span /><span /><span /></div>
          </div>
          <div class="mock__split-hero">
            <div class="mock__split-text">
              <div class="mock__split-heading" />
              <div class="mock__split-sub" />
              <div class="mock__split-sub mock__split-sub--short" />
              <div class="mock__split-btn" />
            </div>
            <div class="mock__split-img">
              <img src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=500&h=400&fit=crop&q=80" alt="" />
            </div>
          </div>
          <div class="mock__grid-2">
            <div class="mock__site">
              <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=350&fit=crop&q=80" alt="" />
            </div>
            <div class="mock__site">
              <img src="https://images.unsplash.com/photo-1545235617-9465d2a55698?w=500&h=350&fit=crop&q=80" alt="" />
            </div>
          </div>
        </div>
      </button>
      </Tooltip>
      <Text variant="body" weight="semibold" class="overview__url">localhost:3920</Text>
      <span class="overview__creds">
        <Button variant="tertiary" size="small" label="admin" :tooltip="copiedField === 'user' ? 'Copied!' : 'Copy username'" tooltip-placement="bottom" @click="copyToClipboard('admin', 'user')" />
        <span class="overview__creds-sep">/</span>
        <Button variant="tertiary" size="small" label="••••••••" :tooltip="copiedField === 'pass' ? 'Copied!' : 'Copy password'" tooltip-placement="bottom" @click="copyToClipboard('password', 'pass')" />
      </span>
      <Button variant="tertiary" size="small" :label="localPath" :tooltip="copiedField === 'path' ? 'Copied!' : 'Copy local path'" tooltip-placement="bottom" @click="copyToClipboard(localPath, 'path')" />
    </div>

    <!-- Site nav -->
    <nav v-if="!isAllSites" class="site-sections">
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
        <Button label="Create your first task" variant="primary" size="small" @click="$emit('new-task')" />
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxxs);
  padding: var(--space-l) var(--space-s) var(--space-m);
  flex-shrink: 0;
  border-block-end: 1px solid var(--color-frame-border);
}

/* Thumbnail */
.overview__thumb {
  position: relative;
  flex-shrink: 0;
  width: 90%;
  aspect-ratio: 16 / 10;
  border-radius: var(--radius-s);
  border: 1px solid var(--color-frame-border);
  overflow: hidden;
  background: white;
  cursor: pointer;
  padding: 0;
  font: inherit;
  color: inherit;
  transition: transform 120ms var(--ease-default), box-shadow 200ms var(--ease-default);
  will-change: transform;
  margin-block-end: var(--space-xs);
}

/* Override Tooltip's inline-flex trigger so thumb gets full width */
.site-overview > :deep(.tooltip-trigger) {
  display: flex;
  justify-content: center;
  width: 100%;
}

.overview__thumb:hover {
  box-shadow: 0 4px 16px var(--color-shadow);
}

.overview__thumb-shine {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 120ms var(--ease-default);
}

/* ── Shared mock styles ── */

.overview__mock {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  width: 1000px;
  transform-origin: top left;
  transform: scale(0.313);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  overflow: hidden;
}

.mock__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 32px;
  border-block-end: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
}

.mock__nav--dark {
  background: #1a1a1a;
  border-block-end-color: rgba(255, 255, 255, 0.08);
}

.mock__logo {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}

.mock__nav--dark .mock__logo {
  color: #fff;
}

.mock__links {
  display: flex;
  gap: 20px;
}

.mock__links span {
  display: block;
  width: 48px;
  height: 6px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.12);
}

.mock__nav--dark .mock__links span {
  background: rgba(255, 255, 255, 0.2);
}

/* ── Café layout ── */

.mock--cafe {
  background: #faf9f7;
  color: #1a1a1a;
}

.mock__hero {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.mock__hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mock__hero-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  color: white;
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.mock__grid-3 {
  display: flex;
  gap: 14px;
  padding: 20px;
}

.mock__card {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.mock__card img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}

.mock__card-label {
  height: 6px;
  margin: 8px 12px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.08);
  width: 60%;
}

/* ── Portfolio layout ── */

.mock--portfolio {
  background: #111;
  color: #fff;
}

.mock__split-hero {
  display: flex;
  padding: 40px 32px;
  gap: 32px;
  align-items: center;
}

.mock__split-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mock__split-heading {
  height: 28px;
  width: 70%;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
}

.mock__split-sub {
  height: 8px;
  width: 90%;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
}

.mock__split-sub--short {
  width: 60%;
}

.mock__split-btn {
  margin-block-start: 8px;
  width: 120px;
  height: 32px;
  border-radius: 6px;
  background: #fff;
}

.mock__split-img {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
}

.mock__split-img img {
  width: 100%;
  aspect-ratio: 5 / 4;
  object-fit: cover;
  display: block;
}

.mock__grid-2 {
  display: flex;
  gap: 14px;
  padding: 0 32px 32px;
}

.mock__site {
  flex: 1;
  border-radius: 10px;
  overflow: hidden;
}

.mock__site img {
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  display: block;
}

/* ── Blog layout ── */

.mock--blog {
  background: #fff;
  color: #1a1a1a;
}

.mock__blog-layout {
  display: flex;
  gap: 24px;
  padding: 24px 32px;
}

.mock__blog-main {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mock__blog-featured {
  border-radius: 8px;
  overflow: hidden;
}

.mock__blog-featured img {
  width: 100%;
  aspect-ratio: 2 / 1;
  object-fit: cover;
  display: block;
}

.mock__blog-title {
  height: 18px;
  width: 75%;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.12);
}

.mock__blog-excerpt {
  height: 8px;
  width: 100%;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
}

.mock__blog-excerpt--short {
  width: 65%;
}

.mock__blog-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mock__blog-widget {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mock__blog-widget-title {
  height: 10px;
  width: 50%;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.12);
  margin-block-end: 4px;
}

.mock__blog-widget-line {
  height: 7px;
  width: 100%;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.05);
}

.mock__blog-widget-line--short {
  width: 70%;
}

.overview__url {
  color: var(--color-frame-theme);
  text-decoration: underline;
  cursor: pointer;
}

.overview__creds {
  display: flex;
  align-items: center;
  gap: var(--space-xxxs);
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  margin-block: var(--space-xxs);
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
  width: 24px;
  height: 24px;
  border-radius: var(--radius-s);
  border: 2px solid var(--color-frame-bg);
  object-fit: cover;
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

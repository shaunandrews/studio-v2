<script setup lang="ts">
import { computed, ref, toRef, onMounted, onBeforeUnmount } from 'vue'
import { plus, update, customLink, tool, home, chevronDown, chevronRight, check, category, navigation, archive } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import SiteIcon from '@/components/primitives/SiteIcon.vue'
import SiteItem from '@/components/composites/SiteItem.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import Button from '@/components/primitives/Button.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'

import ProgressiveBlur from '@/components/primitives/ProgressiveBlur.vue'

import { useTasks } from '@/data/useTasks'
import { useSites } from '@/data/useSites'
import { useOperatingSystem } from '@/data/useOperatingSystem'
import { useAddSite } from '@/data/useAddSite'
import { useAllSitesView } from '@/data/useAllSitesView'

const props = defineProps<{
  siteId: string
  selectedId: string | null
  activeScreen?: string
  siteFavicon?: string
  isAllSites?: boolean
  sidebarHidden?: boolean
  surface?: 'chrome' | 'frame'
}>()

const emit = defineEmits<{
  select: [taskId: string]
  'new-task': []
  navigate: [screen: string]
  'switch-site': [id: string]
  'navigate-all-sites': []
}>()

const { isMac } = useOperatingSystem()
const { openAddSite } = useAddSite()
const { showAllSitesView } = useAllSitesView()
const { tasks, getTasksByStatus, messages, renameTask, startTask, archiveTask, isBusy, busyTaskIds } = useTasks()
const tasksByStatus = getTasksByStatus(toRef(props, 'siteId'))

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
  return tasks.value.filter(t => t.siteId === siteId && t.unread && !t.archived).length
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

const statusSections = [
  { key: 'in_progress' as const, label: 'In Progress' },
  { key: 'review' as const, label: 'Review' },
  { key: 'backlog' as const, label: 'Backlog' },
] as const

const visibleSections = computed(() =>
  statusSections.filter(s => tasksByStatus.value[s.key].length > 0)
)

const hasActiveTasks = computed(() => visibleSections.value.length > 0)

const mergedExpanded = ref(false)
const mergedTasks = computed(() => tasksByStatus.value.merged)

const archivedMenuGroups = computed<FlyoutMenuGroup[]>(() => [{
  items: mergedTasks.value.map(task => ({
    label: task.title || 'New task',
    detail: formatTime(getLastTimestamp(task.id) || task.createdAt),
    action: () => emit('select', task.id),
  })),
}])

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

function getLastTimestamp(taskId: string): string {
  const taskMsgs = messages.value
    .filter(m => m.taskId === taskId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return taskMsgs[0]?.timestamp ?? ''
}

function onStart(e: Event, taskId: string) {
  e.stopPropagation()
  startTask(taskId)
}

function onArchive(e: Event, taskId: string) {
  e.stopPropagation()
  archiveTask(taskId)
}

// ── Inline rename ──

const editingTaskId = ref<string | null>(null)
const editingTitle = ref('')

function startEditing(taskId: string, currentTitle: string) {
  editingTaskId.value = taskId
  editingTitle.value = currentTitle || ''
}

function commitEdit() {
  if (editingTaskId.value && editingTitle.value.trim()) {
    renameTask(editingTaskId.value, editingTitle.value.trim())
  }
  editingTaskId.value = null
  editingTitle.value = ''
}

function cancelEdit() {
  editingTaskId.value = null
  editingTitle.value = ''
}

function onEditKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    commitEdit()
  } else if (e.key === 'Escape') {
    cancelEdit()
  }
}

const vFocus = { mounted: (el: HTMLElement) => el.focus() }

/* ── Empty state carousel ── */
const carouselStep = ref(0)
const carouselSteps = [
  { label: 'Create a task', desc: 'Describe what you want built or changed.' },
  { label: 'Review changes', desc: 'See exactly what the AI did before you accept.' },
  { label: 'Merge to local', desc: 'Apply approved changes to your local site.' },
  { label: 'Push to staging', desc: 'Deploy when you\'re ready to go live.' },
]
let carouselTimer: ReturnType<typeof setInterval> | null = null

function startCarousel() {
  stopCarousel()
  carouselTimer = setInterval(() => {
    carouselStep.value = (carouselStep.value + 1) % carouselSteps.length
  }, 4000)
}

function stopCarousel() {
  if (carouselTimer) {
    clearInterval(carouselTimer)
    carouselTimer = null
  }
}

function goToStep(index: number) {
  carouselStep.value = index
  startCarousel() // reset timer on manual navigation
}

onMounted(() => {
  if (!hasActiveTasks.value) startCarousel()
})

onBeforeUnmount(() => stopCarousel())


</script>

<template>
  <div class="site-navigation" :class="{ 'surface-chrome': surface === 'chrome' }">
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

    <!-- Site picker (when sidebar hidden or in chrome surface) -->
    <Transition name="site-header">
      <div v-if="!isAllSites && (sidebarHidden || surface === 'chrome')" ref="sitePickerEl" class="site-picker-anchor" :class="{ 'has-lights': isMac && !surface }">
        <button class="site-picker pill" @click="toggleSitePicker">
          <span class="pill-icon-start">
            <SiteIcon :favicon="siteFavicon" :site-name="siteId" :size="28" />
          </span>
          <span class="pill-label">{{ siteName }}</span>
          <span class="pill-icon-end">
            <WPIcon :icon="chevronDown" :size="14" />
          </span>
        </button>
        <Transition name="picker">
          <div v-if="sitePickerOpen" class="site-picker-panel">
            <template v-if="showAllSitesView">
              <button class="picker-row picker-all-sites" @click="goAllSites">
                <span class="picker-all-sites-icon">
                  <WPIcon :icon="category" :size="20" />
                </span>
                <span class="picker-row-label">All Sites</span>
              </button>
              <div class="picker-divider" />
            </template>
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
      <button class="site-sections__item" :class="{ 'is-active': activeScreen === 'canvas' }" @click="$emit('navigate', 'canvas')">
        <WPIcon :icon="navigation" :size="20" class="site-sections__icon" />
        Canvas
      </button>
      <button class="site-sections__item" :class="{ 'is-active': activeScreen === 'sync' }" @click="$emit('navigate', 'sync')">
        <WPIcon :icon="update" :size="20" class="site-sections__icon" />
        Sync
      </button>
      <button class="site-sections__item" :class="{ 'is-active': activeScreen === 'sharing' }" @click="$emit('navigate', 'sharing')">
        <WPIcon :icon="customLink" :size="20" class="site-sections__icon" />
        Sharing
      </button>
      <button class="site-sections__item" :class="{ 'is-active': activeScreen === 'settings' }" @click="$emit('navigate', 'settings')">
        <WPIcon :icon="tool" :size="20" class="site-sections__icon" />
        Settings
      </button>
    </nav>

    <div class="site-tasks__header">
      <span class="site-tasks__title">Tasks</span>
      <div class="site-tasks__actions">
        <FlyoutMenu
          v-if="mergedTasks.length > 0"
          :groups="archivedMenuGroups"
          placement="below"
          align="end"
          min-width="200px"
          max-height="300px"
        >
          <template #trigger>
            <Button :icon="archive" icon-only size="small" variant="tertiary" tooltip="Archived tasks" tooltip-placement="top" />
          </template>
        </FlyoutMenu>
        <Button :icon="plus" icon-only size="small" variant="tertiary" tooltip="New task" tooltip-placement="top" @click="$emit('new-task')" />
      </div>
    </div>

    <!-- Site tasks -->
    <div class="site-tasks__list">
      <!-- Active status groups -->
      <template v-for="section in visibleSections" :key="section.key">
        <div class="site-tasks__group">
          <div class="site-tasks__group-label">{{ section.label }}</div>
          <div
            v-for="task in tasksByStatus[section.key]"
            :key="task.id"
            class="site-tasks__item"
            :class="{
              'is-selected': task.id === selectedId,
              'is-review': section.key === 'review',
            }"
            @click="$emit('select', task.id)"
            @dblclick.stop="startEditing(task.id, task.title || '')"
          >
            <span v-if="task.unread" class="site-tasks__unread-dot" />
            <input
              v-if="editingTaskId === task.id"
              v-model="editingTitle"
              class="site-tasks__item-edit"
              @blur="commitEdit"
              @keydown="onEditKeydown"
              @click.stop
              @dblclick.stop
              v-focus
            />
            <span v-else class="site-tasks__item-title">{{ task.title || 'New task' }}</span>
            <span class="site-tasks__item-end">
              <template v-if="busyTaskIds.has(task.id)">
                <svg class="site-tasks__spinner" width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="24 12" fill="none" />
                </svg>
              </template>
              <span v-else class="site-tasks__time">{{ formatTime(getLastTimestamp(task.id) || task.createdAt) }}</span>
              <!-- Backlog: Start action on hover -->
              <Tooltip v-if="section.key === 'backlog'" text="Start" placement="right" :delay="300" class="site-tasks__action-wrap">
                <button class="site-tasks__action-btn" @click.stop="onStart($event, task.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="7,4 20,12 7,20" /></svg>
                </button>
              </Tooltip>
              <!-- In Progress / Review: Archive action on hover -->
              <Tooltip v-else text="Archive" placement="right" :delay="300" class="site-tasks__action-wrap">
                <button class="site-tasks__action-btn" @click.stop="onArchive($event, task.id)">
                  <WPIcon :icon="archive" :size="16" />
                </button>
              </Tooltip>
            </span>
          </div>
        </div>
      </template>

      <!-- Merged section (collapsed by default) -->
      <div v-if="mergedTasks.length > 0" class="site-tasks__group">
        <button class="site-tasks__group-toggle" @click="mergedExpanded = !mergedExpanded">
          <WPIcon
            :icon="chevronRight"
            :size="14"
            class="site-tasks__group-chevron"
            :class="{ 'is-expanded': mergedExpanded }"
          />
          <span class="site-tasks__group-label">Merged</span>
          <span class="site-tasks__group-count">{{ mergedTasks.length }}</span>
        </button>
        <template v-if="mergedExpanded">
          <div
            v-for="task in mergedTasks"
            :key="task.id"
            class="site-tasks__item is-merged"
            :class="{ 'is-selected': task.id === selectedId }"
            @click="$emit('select', task.id)"
          >
            <WPIcon :icon="check" :size="14" class="site-tasks__merged-icon" />
            <span class="site-tasks__item-title">{{ task.title || 'New task' }}</span>
            <span class="site-tasks__item-end">
              <span class="site-tasks__time">{{ formatTime(getLastTimestamp(task.id) || task.createdAt) }}</span>
            </span>
          </div>
        </template>
      </div>

      <div v-if="!hasActiveTasks" class="site-tasks__empty">
        <!-- Carousel fills the space -->
        <div class="empty__carousel">
          <!-- Large illustration -->
          <div class="empty__illo-area">
            <!-- Step 1: Create — todo list -->
            <svg v-if="carouselStep === 0" class="empty__illo" viewBox="-2 -1 52 52" fill="none">
              <rect x="0" y="4" width="12" height="12" rx="3" fill="currentColor" opacity="0.12" />
              <path d="M3.5 10 L5.5 12.5 L9 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.25" />
              <rect x="17" y="8" width="28" height="3" rx="1.5" fill="currentColor" opacity="0.12" />
              <rect x="0" y="20" width="12" height="12" rx="3" fill="currentColor" opacity="0.12" />
              <path d="M3.5 26 L5.5 28.5 L9 23.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.25" />
              <rect x="17" y="24" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.12" />
              <rect x="0" y="36" width="12" height="12" rx="3" stroke="currentColor" stroke-width="2" opacity="0.12" />
              <rect x="17" y="40" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.08" />
            </svg>
            <!-- Step 2: Review — browser window -->
            <svg v-if="carouselStep === 1" class="empty__illo" viewBox="0 0 48 48" fill="none">
              <rect x="2" y="2" width="44" height="44" rx="4" stroke="currentColor" stroke-width="2" opacity="0.12" />
              <line x1="2" y1="12" x2="46" y2="12" stroke="currentColor" stroke-width="2" opacity="0.08" />
              <rect x="8" y="20" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.1" />
              <rect x="8" y="28" width="32" height="3" rx="1.5" fill="currentColor" opacity="0.08" />
              <rect x="8" y="36" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.08" />
            </svg>
            <!-- Step 3: Merge — bullseye -->
            <svg v-if="carouselStep === 2" class="empty__illo" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" opacity="0.1" />
              <circle cx="24" cy="24" r="13" stroke="currentColor" stroke-width="2" opacity="0.13" />
              <circle cx="24" cy="24" r="6" stroke="currentColor" stroke-width="2" opacity="0.16" />
              <circle cx="24" cy="24" r="2" fill="currentColor" opacity="0.25" />
            </svg>
            <!-- Step 4: Push — cloud with arrow -->
            <svg v-if="carouselStep === 3" class="empty__illo" viewBox="0 0 48 48" fill="none">
              <path d="M12 36 Q4 36 4 28 Q4 22 10 20 Q10 12 20 12 Q24 6 32 8 Q38 10 38 16 Q46 16 46 24 Q46 32 38 32" stroke="currentColor" stroke-width="2" opacity="0.15" fill="none" stroke-linecap="round" />
              <path d="M24 38 L24 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.2" />
              <path d="M18 27 L24 20 L30 27" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.2" />
            </svg>
          </div>
          <!-- Step text -->
          <div class="empty__slide-text" :key="carouselStep">
            <p class="empty__slide-label">{{ carouselSteps[carouselStep].label }}</p>
            <p class="empty__slide-desc">{{ carouselSteps[carouselStep].desc }}</p>
          </div>
        </div>
        <!-- Bottom: dots + button -->
        <div class="empty__bottom">
          <div class="empty__dots">
            <div
              v-for="(_, i) in carouselSteps"
              :key="i"
              class="empty__dot"
              :class="{ 'empty__dot--active': i === carouselStep }"
              @click="goToStep(i)"
            />
          </div>
          <Button label="Create your first task" variant="secondary" surface="dark" size="small" @click="$emit('new-task')" />
        </div>
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

/* Chrome surface: remap frame tokens to chrome equivalents */
.site-navigation.surface-chrome {
  --color-frame-fg: var(--color-chrome-fg);
  --color-frame-fg-muted: var(--color-chrome-fg-muted);
  --color-frame-hover: var(--color-chrome-hover);
  --color-frame-border: var(--color-chrome-border);
  --color-frame-fill: var(--color-chrome-fill);
  --color-frame-theme: var(--color-chrome-theme);
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
  gap: var(--space-xs);
  height: 40px;
  width: 100%;
  padding: var(--space-xxs);
  border: none;
  border-radius: var(--radius-s);
  background: none;
  color: var(--color-frame-fg);
  font-family: inherit;
  font-size: 14px;
  font-weight: 550;
  line-height: 20px;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--duration-instant) var(--ease-default);
}

.pill:hover {
  background: var(--color-frame-hover);
}

/* Chrome surface: equalise insets so left and right spacing match */
.surface-chrome .site-tasks__header {
  padding-inline-start: var(--space-xs);
}

.surface-chrome .site-tasks__item {
  padding-inline-start: var(--space-xxs);
}

.pill-icon-start {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.pill-icon-end {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
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
  width: 100%;
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


/* ── Status groups ── */

.site-tasks__group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.site-tasks__group + .site-tasks__group {
  margin-block-start: var(--space-xs);
}

.site-tasks__group-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 16px;
  padding: var(--space-xxs) var(--space-s) 0;
}

.site-tasks__group-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-xxxs);
  padding: var(--space-xxs) var(--space-s) 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-frame-fg-muted);
  font-family: inherit;
}

.site-tasks__group-toggle:hover {
  color: var(--color-frame-fg);
}

.site-tasks__group-chevron {
  flex-shrink: 0;
  transition: transform var(--duration-fast) var(--ease-default);
}

.site-tasks__group-chevron.is-expanded {
  transform: rotate(90deg);
}

.site-tasks__group-count {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  opacity: 0.6;
  margin-inline-start: var(--space-xxxs);
}

/* ── Merged items ── */

.site-tasks__item.is-merged .site-tasks__item-title {
  opacity: 0.5;
}

.site-tasks__merged-icon {
  flex-shrink: 0;
  color: var(--color-frame-fg-muted);
  opacity: 0.4;
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

.site-tasks__item-edit {
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-m);
  font-family: inherit;
  line-height: 20px;
  color: var(--color-frame-fg);
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-theme);
  border-radius: var(--radius-s);
  outline: none;
  padding: 0 var(--space-xxxs);
  margin: -1px 0;
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

.site-tasks__action-btn {
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

.site-tasks__action-btn:hover {
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

/* Hide action by default, show on row hover */
.site-tasks__action-wrap {
  display: none;
}

.site-tasks__item:hover .site-tasks__time,
.site-tasks__item:hover .site-tasks__spinner {
  display: none;
}

.site-tasks__item:hover .site-tasks__action-wrap {
  display: flex;
}

.site-tasks__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: var(--space-l) var(--space-s);
  gap: var(--space-xl);
}

/* ── Carousel ── */

.empty__carousel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-m);
}

.empty__illo-area {
  width: 96px;
  height: 96px;
  color: var(--color-frame-fg);
}

.empty__illo {
  display: block;
  width: 100%;
  height: 100%;
  animation: empty-illo-in var(--duration-moderate) var(--ease-out);
}

.empty__slide-text {
  text-align: center;
  animation: empty-text-in var(--duration-moderate) var(--ease-out);
}

.empty__slide-label {
  margin: 0 0 var(--space-xxxs);
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  line-height: var(--line-height-tight);
}

.empty__slide-desc {
  margin: 0;
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.4;
}

/* ── Bottom area ── */

.empty__bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-m);
}

/* ── Dot indicators ── */

.empty__dots {
  display: flex;
  gap: var(--space-xxs);
  align-items: center;
}

.empty__dot {
  position: relative;
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  border: none;
  padding: 0;
  background: color-mix(in srgb, var(--color-frame-fg) 12%, transparent);
  cursor: pointer;
  overflow: hidden;
  transition: width var(--duration-moderate) var(--ease-out), background var(--transition-hover);
}

.empty__dot:hover {
  background: color-mix(in srgb, var(--color-frame-fg) 20%, transparent);
}

.empty__dot--active {
  width: 24px;
}

.empty__dot--active::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-frame-fg) 35%, transparent);
  transform-origin: left center;
  transform: scaleX(0);
  animation: dot-progress 4s linear forwards;
}

@keyframes dot-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@keyframes empty-illo-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes empty-text-in {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .empty__illo,
  .empty__slide-text {
    animation: none;
  }
  .empty__dot--active::after {
    animation: none;
    transform: scaleX(1);
  }
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

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { drawerLeft } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import SiteList from '@/components/features/SiteList.vue'
import ShortcutsModal from '@/components/composites/ShortcutsModal.vue'
import SettingsPage from '@/components/composites/SettingsPage.vue'
import { useSettings } from '@/data/useSettings'
import GlobalMenu from '@/components/composites/GlobalMenu.vue'
import AddSitePage from '@/pages/AddSitePage.vue'
import WindowsTitlebar from '@/components/composites/WindowsTitlebar.vue'
import ResizeHandle from '@/components/primitives/ResizeHandle.vue'
import { useSidebarCollapse } from '@/data/useSidebarCollapse'
import { useAddSite } from '@/data/useAddSite'
import { useOperatingSystem } from '@/data/useOperatingSystem'
import { useResizablePane } from '@/data/useResizablePane'
import { useAuth } from '@/data/useAuth'

const { hidden, toggle: toggleSidebar } = useSidebarCollapse()

const { width: sidebarWidth, isDragging: isSidebarResizing, onPointerDown: onSidebarResizeStart, resetWidth: resetSidebarWidth } = useResizablePane({
  defaultWidth: 210,
  minWidth: 160,
  maxWidth: 360,
  storageKey: 'studio-sidebar-width',
})
const { isWindows } = useOperatingSystem()
const { shouldShowAddSite, hasSites, openAddSite } = useAddSite()
const { user } = useAuth()

const showShortcuts = ref(false)
const showGlobalMenu = ref(false)
const { isSettingsOpen, settingsTab, openSettings, closeSettings } = useSettings()

// Chrome backdrop: either add-site or settings slides sidebar/frame offscreen
const isBackdropActive = computed(() => shouldShowAddSite.value || isSettingsOpen.value)
const gravatarRef = ref<HTMLElement | null>(null)
const toggleRef = ref<HTMLElement | null>(null)

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === '/') {
    e.preventDefault()
    showShortcuts.value = !showShortcuts.value
  }
  if ((e.metaKey || e.ctrlKey) && e.key === ',') {
    e.preventDefault()
    if (isSettingsOpen.value) { closeSettings() } else { openSettings() }
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
    e.preventDefault()
    toggleSidebar()
    showGlobalMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
})

function handleNewSite() {
  openAddSite()
}
</script>

<template>
  <div class="main-layout" :class="{ 'is-windows': isWindows }" :style="{ '--sidebar-width': sidebarWidth + 'px' }">
    <!-- Windows titlebar -->
    <WindowsTitlebar v-if="isWindows" />

    <!-- Traffic lights: fixed window position, UI moves around them (macOS only) -->
    <div v-if="!isWindows" class="traffic-lights">
      <span class="light close"></span>
      <span class="light minimize"></span>
      <span class="light maximize"></span>
    </div>

    <!-- Floating footer buttons: persist outside sidebar so they survive collapse -->
    <button
      v-show="!isBackdropActive"
      ref="gravatarRef"
      class="floating-btn gravatar-btn"
      :class="{ 'is-sidebar-hidden': hidden }"
      @click="showGlobalMenu = !showGlobalMenu"
    >
      <img v-if="user" class="gravatar" :src="user.avatar" alt="User" />
      <span v-else class="gravatar gravatar--placeholder">?</span>
    </button>
    <button
      v-show="!isBackdropActive"
      ref="toggleRef"
      class="floating-btn sidebar-toggle"
      :class="{ 'is-sidebar-hidden': hidden, 'is-resizing': isSidebarResizing }"
      @click="toggleSidebar()"
    >
      <WPIcon :icon="drawerLeft" :size="20" />
    </button>
    <!-- Tooltips anchored to the absolutely-positioned buttons (hidden from layout) -->
    <Tooltip text="Account & settings" placement="top" :delay="300" :anchor="gravatarRef" class="anchored-tooltip" />
    <Tooltip :text="hidden ? 'Show sidebar' : 'Hide sidebar'" placement="top" :delay="300" :anchor="toggleRef" class="anchored-tooltip" />

    <div class="app-body">
      <!-- Add-site surface: lives behind sidebar + frame -->
      <AddSitePage
        v-show="shouldShowAddSite"
        class="backdrop-surface"
        :visible="shouldShowAddSite"
        :has-sites="hasSites"
      />

      <!-- Settings surface: lives behind sidebar + frame -->
      <SettingsPage
        v-if="isSettingsOpen"
        class="backdrop-surface"
        :open="isSettingsOpen"
        :initial-tab="settingsTab"
        @close="closeSettings"
      />

      <div
        class="sidebar vstack"
        :class="{ 'is-hidden': hidden, 'is-offscreen': isBackdropActive, 'is-resizing': isSidebarResizing }"
        :style="{ viewTransitionName: 'sidebar', width: hidden ? undefined : sidebarWidth + 'px' }"
      >
        <SiteList class="flex-1 min-h-0" @new-site="handleNewSite" />
      </div>

      <ResizeHandle
        v-show="!hidden && !isBackdropActive"
        class="sidebar-resize-handle"
        :is-dragging="isSidebarResizing"
        @pointerdown="onSidebarResizeStart"
        @dblclick="resetSidebarWidth"
      />

      <main
        class="frame"
        :class="{ 'is-full': hidden, 'is-offscreen': isBackdropActive, 'is-resizing': isSidebarResizing }"
        :style="{ viewTransitionName: 'site-frame' }"
      >
        <router-view name="main" v-slot="{ Component }">
          <component :is="Component" :sidebar-hidden="hidden" />
        </router-view>
      </main>
    </div>
    <ShortcutsModal :open="showShortcuts" @close="showShortcuts = false" />
    <GlobalMenu :open="showGlobalMenu" :anchor="gravatarRef" @close="showGlobalMenu = false" />
  </div>
</template>

<style scoped>
.main-layout {
  position: relative;
  height: 100vh;
  background: var(--color-chrome-bg);
  color: var(--color-chrome-fg);
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

/* ── Traffic lights: fixed at window position ── */

.traffic-lights {
  position: absolute;
  top: 18px;
  left: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: drag;
}

.light {
  width: 12px; /* OS-native size, not on grid — intentional */
  height: 12px;
  border-radius: 50%;
}

.light.close { background: var(--color-macos-close); }
.light.minimize { background: var(--color-macos-minimize); }
.light.maximize { background: var(--color-macos-maximize); }

.app-body {
  position: relative;
  height: 100%;
  overflow: hidden;
  padding: 8px; /* Figma: grid-unit-10 */
}

/* ── Sidebar ── */

/* ── Add-site surface ── */

.backdrop-surface {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.sidebar {
  position: relative;
  z-index: 1;
  width: 210px;
  flex-shrink: 0;
  height: 100%;
  overflow: hidden;
  padding-block-start: 36px; /* Clear traffic lights: 15px top + 12px dots + 9px gap */
  /* Return: slide open after frame insets restore (200ms delay) */
  transition:
    width 300ms cubic-bezier(0.4, 0, 0.2, 1) 200ms,
    transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar.is-resizing {
  transition: none;
}

.sidebar.is-hidden {
  width: 0;
  /* Hide: collapse immediately */
  transition:
    width 300ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.sidebar.is-offscreen {
  transform: translateX(calc(-100% - 16px)); /* Clear body padding */
  transition:
    width 300ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.gravatar {
  width: 28px;
  height: 28px;
  border-radius: 100px; /* Figma: fully circular */
  object-fit: cover;
}

.gravatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg-muted);
  background: var(--color-chrome-hover);
}

/* ── Frame ──
 *
 * Two-phase choreography using CSS transition direction trick:
 * - Transition on base class = how it animates BACK (showing sidebar)
 * - Transition on .is-full = how it animates TO full (hiding sidebar)
 */

.frame {
  position: absolute;
  inset-block-start: 8px;
  inset-block-end: 8px;
  inset-inline-start: calc(var(--sidebar-width, 210px) + 16px); /* sidebar + body padding + gap */
  inset-inline-end: 8px;
  border-radius: var(--radius-l);
  background: var(--color-frame-bg);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.12);
  color: var(--color-frame-fg);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  /* Show sequence: insets + radius first (200ms), then inline-start after (300ms, delayed 200ms) */
  transition:
    inset-block-start 200ms var(--ease-default),
    inset-block-end 200ms var(--ease-default),
    inset-inline-end 200ms var(--ease-default),
    inset-inline-start 300ms cubic-bezier(0.4, 0, 0.2, 1) 200ms,
    border-radius 200ms var(--ease-default),
    transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.frame.is-resizing {
  transition: none;
}

.frame.is-full {
  inset-block-start: 0;
  inset-block-end: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  border-radius: 0;

  /* Hide sequence: inline-start first (300ms), then insets + radius after (200ms, delayed 300ms) */
  transition:
    inset-block-start 200ms var(--ease-default) 300ms,
    inset-block-end 200ms var(--ease-default) 300ms,
    inset-inline-end 200ms var(--ease-default) 300ms,
    inset-inline-start 300ms cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 200ms var(--ease-default) 300ms,
    transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

.frame.is-offscreen {
  transform: translateX(calc(100% + 16px)); /* Clear body padding */
  transition:
    inset-block-start 200ms var(--ease-default),
    inset-block-end 200ms var(--ease-default),
    inset-inline-end 200ms var(--ease-default),
    inset-inline-start 300ms cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 200ms var(--ease-default),
    transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* ── Floating footer buttons ──
 *
 * Both the gravatar and sidebar toggle live outside the sidebar so they
 * survive the collapse. They use the same direction-trick choreography.
 *
 * Sidebar visible:
 *   gravatar  → left: 8px,   bottom: 8px  (sidebar footer, left)
 *   toggle    → left: 186px, bottom: 8px  (sidebar footer, right)
 *
 * Sidebar hidden (side-by-side in bottom-left corner):
 *   gravatar  → left: 8px,   bottom: 8px  (left of the pair)
 *   toggle    → left: 48px,  bottom: 8px  (right of the pair)
 */

.floating-btn {
  position: absolute;
  z-index: 10;
  box-sizing: border-box;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-chrome-fg-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: clip;
}

/* ── Gravatar button ── */

.gravatar-btn {
  bottom: 8px; /* Physical: body padding from window edge */
  left: 8px; /* Physical: body padding */
  /* Show: slide back into sidebar footer */
  transition:
    left 300ms cubic-bezier(0.4, 0, 0.2, 1) 200ms,
    bottom 300ms cubic-bezier(0.4, 0, 0.2, 1) 200ms,
    background 300ms var(--ease-default) 200ms,
    border-color 300ms var(--ease-default) 200ms;
}

.gravatar-btn:hover {
  background: var(--color-chrome-hover);
}

.gravatar-btn.is-sidebar-hidden {
  bottom: 8px;
  left: 8px;
  background: var(--color-frame-bg);
  border-color: var(--color-frame-border);
  /* Hide: slide up to stacked position */
  transition:
    left 300ms cubic-bezier(0.4, 0, 0.2, 1),
    bottom 300ms cubic-bezier(0.4, 0, 0.2, 1),
    background 300ms var(--ease-default),
    border-color 300ms var(--ease-default);
}

.gravatar-btn.is-sidebar-hidden:hover {
  background: var(--color-frame-hover);
}

/* ── Sidebar resize handle ── */

.sidebar-resize-handle {
  position: absolute;
  inset-block: 0;
  inset-inline-start: calc(var(--sidebar-width, 210px) + 15px); /* body padding (8px) + gap (8px) - 1px to sit on frame edge */
  z-index: 3;
  height: auto;
  background: transparent;
}

/* ── Sidebar toggle ── */

.sidebar-toggle {
  bottom: 8px; /* Physical: body padding from window edge */
  left: calc(var(--sidebar-width, 210px) + 8px - 32px); /* Physical: body padding + sidebar width - button width */
  /* Show: slide right with sidebar expansion (300ms, delayed 200ms) */
  transition:
    left 300ms cubic-bezier(0.4, 0, 0.2, 1) 200ms,
    bottom 300ms cubic-bezier(0.4, 0, 0.2, 1) 200ms,
    background 300ms var(--ease-default) 200ms,
    color 300ms var(--ease-default) 200ms,
    border-color 300ms var(--ease-default) 200ms;
}

.sidebar-toggle.is-resizing {
  transition: none;
}

.sidebar-toggle:hover {
  background: var(--color-chrome-hover);
  color: var(--color-chrome-fg);
}

.sidebar-toggle.is-sidebar-hidden {
  left: 48px;
  background: var(--color-frame-bg);
  border-color: var(--color-frame-border);
  color: var(--color-frame-fg-muted);
  /* Hide: slide left with sidebar collapse (300ms, immediate) */
  transition:
    left 300ms cubic-bezier(0.4, 0, 0.2, 1),
    bottom 300ms cubic-bezier(0.4, 0, 0.2, 1),
    background 300ms var(--ease-default),
    color 300ms var(--ease-default),
    border-color 300ms var(--ease-default);
}

.sidebar-toggle.is-sidebar-hidden:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

/* Anchor-only tooltips: no slot content, remove from layout flow */
.anchored-tooltip {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ── Windows overrides ── */

.main-layout.is-windows {
  display: flex;
  flex-direction: column;
}

.main-layout.is-windows .app-body {
  flex: 1;
  min-height: 0;
}

.main-layout.is-windows .sidebar {
  padding-block-start: 0;
}
</style>

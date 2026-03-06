<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { drawerLeft } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import ProjectList from '@/components/features/ProjectList.vue'
import ShortcutsModal from '@/components/composites/ShortcutsModal.vue'
import GlobalMenu from '@/components/composites/GlobalMenu.vue'
import SpotlightTour from '@/components/composites/SpotlightTour.vue'
import { useTour } from '@/data/useTour'
import { useSidebarCollapse } from '@/data/useSidebarCollapse'

const router = useRouter()
const { start: startTour } = useTour()
const { hidden, toggle: toggleSidebar } = useSidebarCollapse()

const showShortcuts = ref(false)
const showGlobalMenu = ref(false)
const gravatarRef = ref<HTMLElement | null>(null)

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === '/') {
    e.preventDefault()
    showShortcuts.value = !showShortcuts.value
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

function handleNewProject() {
  router.push({ name: 'add-site' })
}
</script>

<template>
  <div class="main-layout">
    <!-- Traffic lights: fixed window position, UI moves around them -->
    <div class="traffic-lights">
      <span class="light close"></span>
      <span class="light minimize"></span>
      <span class="light maximize"></span>
    </div>

    <!-- Floating footer buttons: persist outside sidebar so they survive collapse -->
    <button
      ref="gravatarRef"
      class="floating-btn gravatar-btn"
      :class="{ 'is-sidebar-hidden': hidden }"
      @click="showGlobalMenu = !showGlobalMenu"
    >
      <img class="gravatar" src="https://gravatar.com/avatar/b7fdd6477cc13ca16e8358a0725bc02c?s=64" alt="User" />
    </button>
    <button
      class="floating-btn sidebar-toggle"
      :class="{ 'is-sidebar-hidden': hidden }"
      @click="toggleSidebar()"
    >
      <WPIcon :icon="drawerLeft" :size="20" />
    </button>

    <div class="app-body">
      <div
        class="sidebar vstack"
        :class="{ 'is-hidden': hidden }"
        :style="{ viewTransitionName: 'sidebar' }"
      >
        <ProjectList class="flex-1 min-h-0" @new-project="handleNewProject" />
      </div>

      <main
        class="frame"
        :class="{ 'is-full': hidden }"
        :style="{ viewTransitionName: 'project-frame' }"
      >
        <router-view name="main" v-slot="{ Component }">
          <component :is="Component" :sidebar-hidden="hidden" />
        </router-view>
      </main>
    </div>
    <ShortcutsModal :open="showShortcuts" @close="showShortcuts = false" />
    <GlobalMenu :open="showGlobalMenu" :anchor="gravatarRef" @close="showGlobalMenu = false" />
    <SpotlightTour />
  </div>
</template>

<style scoped>
.main-layout {
  position: relative;
  height: 100vh;
  background: var(--color-chrome);
  color: var(--color-chrome-text);
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

.light.close { background: var(--color-light-close); }
.light.minimize { background: var(--color-light-minimize); }
.light.maximize { background: var(--color-light-maximize); }

.app-body {
  position: relative;
  height: 100%;
  overflow: hidden;
  padding: 8px; /* Figma: grid-unit-10 */
}

/* ── Sidebar ── */

.sidebar {
  position: relative;
  z-index: 1;
  width: 210px;
  height: 100%;
  overflow: hidden;
  padding-block-start: 36px; /* Clear traffic lights: 15px top + 12px dots + 9px gap */
  /* Return: slide open after frame insets restore (200ms delay) */
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1) 200ms;
}

.sidebar.is-hidden {
  width: 0;
  /* Hide: collapse immediately */
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.gravatar {
  width: 28px;
  height: 28px;
  border-radius: 100px; /* Figma: fully circular */
  object-fit: cover;
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
  inset-inline-start: calc(210px + 16px); /* sidebar + body padding + gap */
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
    border-radius 200ms var(--ease-default);
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
    border-radius 200ms var(--ease-default) 300ms;
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
  color: var(--color-chrome-text-muted);
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
  background: var(--color-frame-bg-secondary);
}

/* ── Sidebar toggle ── */

.sidebar-toggle {
  bottom: 8px; /* Physical: body padding from window edge */
  left: 186px; /* Physical: 8px body + 210px sidebar - 32px button */
  /* Show: slide right with sidebar expansion (300ms, delayed 200ms) */
  transition:
    left 300ms cubic-bezier(0.4, 0, 0.2, 1) 200ms,
    bottom 300ms cubic-bezier(0.4, 0, 0.2, 1) 200ms,
    background 300ms var(--ease-default) 200ms,
    color 300ms var(--ease-default) 200ms,
    border-color 300ms var(--ease-default) 200ms;
}

.sidebar-toggle:hover {
  background: var(--color-chrome-hover);
  color: var(--color-chrome-text);
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
  background: var(--color-frame-bg-secondary);
  color: var(--color-frame-fg);
}
</style>

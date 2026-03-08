<script lang="ts">
// ── Singleton: only one context menu open at a time (module-level) ──
let globalCloseCallback: (() => void) | null = null
</script>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { check, chevronRight } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import type { FlyoutMenuGroup, FlyoutMenuItem } from '@/components/primitives/FlyoutMenu.vue'

const props = withDefaults(defineProps<{
  groups: FlyoutMenuGroup[]
  surface?: 'light' | 'dark'
}>(), {
  surface: 'light',
})

const isOpen = ref(false)
const menuStyle = ref<Record<string, string>>({})
const menuRef = ref<HTMLElement | null>(null)

// ── Submenu state (mirrors FlyoutMenu pattern) ──
const activeParent = ref<string | null>(null)
const flyoutStyles = ref<Record<string, Record<string, string>>>({})
const flyoutRefs = ref<Record<string, HTMLElement | null>>({})
const itemRefs = ref<Record<string, HTMLElement | null>>({})

const GAP = 4
const EDGE_PADDING = 8

let leaveTimer: ReturnType<typeof setTimeout> | null = null
const LEAVE_DELAY = 100

function scheduleDeactivate() {
  leaveTimer = setTimeout(() => {
    activeParent.value = null
    leaveTimer = null
  }, LEAVE_DELAY)
}

function cancelDeactivate() {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
}

const surfaceClass = computed(() => props.surface === 'dark' ? 'flyout--dark' : 'flyout--light')

const hasCheckedItems = computed(() =>
  props.groups.some(g => g.items.some(i => i.checked !== undefined))
)

function open(e: MouseEvent) {
  e.preventDefault()

  // Close any other open context menu
  if (globalCloseCallback && globalCloseCallback !== close) {
    globalCloseCallback()
  }
  globalCloseCallback = close

  isOpen.value = true

  nextTick(() => {
    if (!menuRef.value) return
    const rect = menuRef.value.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    let x = e.clientX
    let y = e.clientY

    // Flip horizontally if needed
    if (x + rect.width > vw - EDGE_PADDING) {
      x = vw - EDGE_PADDING - rect.width
    }
    if (x < EDGE_PADDING) x = EDGE_PADDING

    // Flip vertically if needed
    if (y + rect.height > vh - EDGE_PADDING) {
      y = vh - EDGE_PADDING - rect.height
    }
    if (y < EDGE_PADDING) y = EDGE_PADDING

    // Physical properties intentional — cursor position is inherently physical
    menuStyle.value = {
      position: 'fixed',
      zIndex: '10001',
      left: `${x}px`,
      top: `${y}px`,
    }
  })
}

function close() {
  isOpen.value = false
  activeParent.value = null
  flyoutStyles.value = {}
  if (globalCloseCallback === close) {
    globalCloseCallback = null
  }
}

function onClickOutside(e: MouseEvent) {
  if (!isOpen.value) return
  const target = e.target as Node
  if (menuRef.value?.contains(target)) return
  // Check submenu flyouts
  for (const el of Object.values(flyoutRefs.value)) {
    if (el?.contains(target)) return
  }
  close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    close()
  }
}

function onScroll() {
  if (isOpen.value) close()
}

// ── Submenu positioning (same as FlyoutMenu) ──
function positionFlyout(key: string) {
  const itemEl = itemRefs.value[key]
  const flyoutEl = flyoutRefs.value[key]
  if (!itemEl || !flyoutEl || !menuRef.value) return

  const itemRect = itemEl.getBoundingClientRect()
  const menuRect = menuRef.value.getBoundingClientRect()
  const flyoutRect = flyoutEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  const style: Record<string, string> = {
    position: 'fixed',
    zIndex: '10002',
  }

  const rightSpace = vw - menuRect.right - GAP - EDGE_PADDING
  const leftSpace = menuRect.left - GAP - EDGE_PADDING

  if (rightSpace >= flyoutRect.width || rightSpace >= leftSpace) {
    style.left = `${menuRect.right + GAP}px`
  } else {
    style.left = `${menuRect.left - GAP - flyoutRect.width}px`
  }

  let top = itemRect.top - GAP
  if (top + flyoutRect.height > vh - EDGE_PADDING) {
    top = vh - EDGE_PADDING - flyoutRect.height
  }
  if (top < EDGE_PADDING) top = EDGE_PADDING
  style.top = `${top}px`

  flyoutStyles.value[key] = style
}

function onItemEnter(item: FlyoutMenuItem, groupIdx: number, itemIdx: number) {
  cancelDeactivate()
  if (!item.children?.length) {
    activeParent.value = null
    return
  }
  const key = `${groupIdx}-${itemIdx}`
  activeParent.value = key
  nextTick(() => positionFlyout(key))
}

function onItemClick(item: FlyoutMenuItem) {
  if (item.children?.length) return
  item.action?.()
  close()
}

function onChildClick(child: FlyoutMenuItem) {
  child.action?.()
  close()
}

function setItemRef(key: string, el: any) {
  itemRefs.value[key] = el as HTMLElement | null
}

function setFlyoutRef(key: string, el: any) {
  flyoutRefs.value[key] = el as HTMLElement | null
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('contextmenu', onClickOutside)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', onScroll, true)
})

onBeforeUnmount(() => {
  cancelDeactivate()
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('contextmenu', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onScroll, true)
  if (globalCloseCallback === close) {
    globalCloseCallback = null
  }
})
</script>

<template>
  <div class="context-menu-target" @contextmenu="open">
    <slot />
  </div>

  <Teleport to="body">
    <Transition name="context-menu">
      <div
        v-if="isOpen"
        ref="menuRef"
        class="flyout-menu context-menu-panel vstack"
        :class="surfaceClass"
        :style="menuStyle"
        @mouseleave="scheduleDeactivate"
      >
        <div
          v-for="(group, gi) in groups"
          :key="gi"
          class="flyout-group"
        >
          <span v-if="group.label" class="flyout-group-label">{{ group.label }}</span>
          <div
            v-for="(item, ii) in group.items"
            :key="item.label"
            :ref="(el) => setItemRef(`${gi}-${ii}`, el)"
            class="flyout-item hstack"
            :class="{
              'flyout-item--destructive': item.destructive,
              'flyout-item--active': activeParent === `${gi}-${ii}`,
              'flyout-item--parent': item.children?.length,
            }"
            @mouseenter="onItemEnter(item, gi, ii)"
            @click="onItemClick(item)"
          >
            <span v-if="item.detail" class="flyout-item-detail">{{ item.detail }}</span>
            <img v-if="item.iconUrl" :src="item.iconUrl" class="flyout-item-icon flyout-item-icon--img" />
            <WPIcon v-else-if="item.icon" :icon="item.icon" :size="18" class="flyout-item-icon" />
            <span class="flyout-item-label">{{ item.label }}</span>
            <WPIcon
              v-if="hasCheckedItems"
              :icon="check"
              :size="18"
              class="flyout-item-check"
              :class="{ 'flyout-item-check--hidden': !item.checked }"
            />
            <WPIcon
              v-if="item.children?.length"
              :icon="chevronRight"
              :size="16"
              class="flyout-item-chevron"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Submenu flyouts -->
    <template v-for="(group, gi) in groups" :key="`ctx-group-${gi}`">
      <template v-for="(item, ii) in group.items" :key="`ctx-flyout-${gi}-${ii}`">
        <Transition name="flyout-sub">
          <div
            v-if="isOpen && item.children?.length && activeParent === `${gi}-${ii}`"
            :ref="(el) => setFlyoutRef(`${gi}-${ii}`, el)"
            class="flyout-submenu vstack"
            :class="surfaceClass"
            :style="flyoutStyles[`${gi}-${ii}`] || {}"
            @mouseenter="cancelDeactivate(); activeParent = `${gi}-${ii}`"
            @mouseleave="scheduleDeactivate"
          >
            <button
              v-for="child in item.children"
              :key="child.label"
              class="flyout-item hstack"
              :class="{ 'flyout-item--destructive': child.destructive }"
              @click="onChildClick(child)"
            >
              <img v-if="child.iconUrl" :src="child.iconUrl" class="flyout-item-icon flyout-item-icon--img" />
              <WPIcon v-else-if="child.icon" :icon="child.icon" :size="18" class="flyout-item-icon" />
              <span class="flyout-item-label">{{ child.label }}</span>
            </button>
          </div>
        </Transition>
      </template>
    </template>
  </Teleport>
</template>

<style>
.context-menu-target {
  display: contents;
}

/* ── Context menu transition ── */
.context-menu-enter-active,
.context-menu-leave-active {
  transition: opacity var(--duration-instant) var(--ease-default),
    transform var(--duration-instant) var(--ease-default);
}

.context-menu-enter-from,
.context-menu-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>

<script setup lang="ts">
import { ref, nextTick, computed, onBeforeUnmount } from 'vue'
import { check, chevronRight } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Popover from '@/components/primitives/Popover.vue'

export interface FlyoutMenuItem {
  label: string
  detail?: string
  icon?: any
  iconUrl?: string
  shortcut?: string
  destructive?: boolean
  checked?: boolean
  children?: FlyoutMenuItem[]
  action?: () => void
}

export interface FlyoutMenuGroup {
  label?: string
  items: FlyoutMenuItem[]
}

const props = withDefaults(defineProps<{
  groups: FlyoutMenuGroup[]
  surface?: 'light' | 'dark'
  align?: 'start' | 'center' | 'end'
  placement?: 'above' | 'below'
  maxWidth?: string
  maxHeight?: string
}>(), {
  surface: 'light',
  align: 'center',
  placement: 'below',
})

const emit = defineEmits<{
  close: []
}>()

const popoverRef = ref<InstanceType<typeof Popover> | null>(null)

// Track which top-level item has its flyout open
const activeParent = ref<string | null>(null)
// Track flyout position styles per parent key
const flyoutStyles = ref<Record<string, Record<string, string>>>({})
// Track flyout refs
const flyoutRefs = ref<Record<string, HTMLElement | null>>({})
// Track item refs for flyout positioning
const itemRefs = ref<Record<string, HTMLElement | null>>({})

const GAP = 4
const EDGE_PADDING = 8

// Debounced mouseleave — gives the cursor time to cross the gap to the flyout
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

function toggle() {
  popoverRef.value?.toggle()
}

function close() {
  popoverRef.value?.close()
  activeParent.value = null
}

const open = computed(() => popoverRef.value?.open ?? false)

function onPopoverClose() {
  activeParent.value = null
  flyoutStyles.value = {}
  emit('close')
}

function onPopoverReposition() {
  if (activeParent.value) positionFlyout(activeParent.value)
}

// Tell Popover that submenu elements are "inside"
function containsTarget(target: Node): boolean {
  for (const el of Object.values(flyoutRefs.value)) {
    if (el?.contains(target)) return true
  }
  return false
}

function positionFlyout(key: string) {
  const itemEl = itemRefs.value[key]
  const flyoutEl = flyoutRefs.value[key]
  const panelEl = popoverRef.value?.panelRef
  if (!itemEl || !flyoutEl || !panelEl) return

  const itemRect = itemEl.getBoundingClientRect()
  const menuRect = panelEl.getBoundingClientRect()
  const flyoutRect = flyoutEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  const style: Record<string, string> = {
    position: 'fixed',
    zIndex: '10000',
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
  close()
  item.action?.()
}

function onChildClick(child: FlyoutMenuItem) {
  close()
  child.action?.()
}

function setItemRef(key: string, el: any) {
  itemRefs.value[key] = el as HTMLElement | null
}

function setFlyoutRef(key: string, el: any) {
  flyoutRefs.value[key] = el as HTMLElement | null
}

onBeforeUnmount(() => {
  cancelDeactivate()
})

const surfaceClass = computed(() => props.surface === 'dark' ? 'flyout--dark' : 'flyout--light')

const hasCheckedItems = computed(() =>
  props.groups.some(g => g.items.some(i => i.checked !== undefined))
)

function childrenHaveChecks(children?: FlyoutMenuItem[]): boolean {
  return children?.some(c => c.checked !== undefined) ?? false
}

defineExpose({ toggle, close, open })
</script>

<template>
  <Popover
    ref="popoverRef"
    :surface="surface"
    :align="align"
    :placement="placement"
    :max-width="maxWidth"
    :max-height="maxHeight"
    bare

    :contains-target="containsTarget"
    @close="onPopoverClose"
    @reposition="onPopoverReposition"
  >
    <template #trigger="{ toggle: t, open: o }">
      <slot name="trigger" :toggle="t" :open="o" />
    </template>

    <template #default="{ resolvedMaxHeight }">
    <div
      class="flyout-menu vstack"
      :class="surfaceClass"
      :style="resolvedMaxHeight ? { maxHeight: resolvedMaxHeight, overflowY: 'auto' } : {}"
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
          <span v-if="item.shortcut" class="flyout-item-shortcut">{{ item.shortcut }}</span>
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

    <!-- Flyout submenus (teleported separately) -->
    <Teleport to="body">
      <template v-for="(group, gi) in groups" :key="`flyout-group-${gi}`">
        <template v-for="(item, ii) in group.items" :key="`flyout-${gi}-${ii}`">
          <Transition name="flyout-sub">
            <div
              v-if="open && item.children?.length && activeParent === `${gi}-${ii}`"
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
                <WPIcon
                  v-if="childrenHaveChecks(item.children)"
                  :icon="check"
                  :size="18"
                  class="flyout-item-check"
                  :class="{ 'flyout-item-check--hidden': !child.checked }"
                />
              </button>
            </div>
          </Transition>
        </template>
      </template>
    </Teleport>
    </template>
  </Popover>
</template>

<!-- Unscoped styles for teleported content -->
<style>
/* ── Base menu panel ── */
.flyout-menu,
.flyout-submenu {
  width: max-content;
  min-width: 160px;
  border-radius: var(--radius-m);
  padding: 1px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.flyout-submenu {
  padding: var(--space-xxxs);
}

/* ── Group ── */
.flyout-group {
  padding: var(--space-xxxs);
}

/* ── Light surface ── */
.flyout--light {
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
}

.flyout--light .flyout-group + .flyout-group {
  border-block-start: 1px solid var(--color-frame-border);
}

.flyout--light .flyout-group-label {
  color: var(--color-frame-fg-muted);
}

.flyout--light .flyout-item {
  color: var(--color-frame-fg);
}

.flyout--light .flyout-item:hover,
.flyout--light .flyout-item--active {
  background: var(--color-frame-hover);
}

.flyout--light .flyout-item-icon {
  color: var(--color-frame-fg-muted);
}

.flyout--light .flyout-item:hover .flyout-item-icon,
.flyout--light .flyout-item--active .flyout-item-icon {
  color: var(--color-frame-fg-muted);
}

.flyout--light .flyout-item-chevron {
  color: var(--color-frame-fg-muted);
}

/* ── Dark surface ── */
.flyout--dark {
  background: var(--color-chrome-bg);
  border: 1px solid var(--color-chrome-border);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.flyout--dark .flyout-group + .flyout-group {
  border-block-start: 1px solid var(--color-chrome-border);
}

.flyout--dark .flyout-group-label {
  color: var(--color-chrome-fg-muted);
}

.flyout--dark .flyout-item {
  color: var(--color-chrome-fg);
}

.flyout--dark .flyout-item:hover,
.flyout--dark .flyout-item--active {
  background: var(--color-chrome-hover);
}

.flyout--dark .flyout-item-icon {
  color: var(--color-chrome-fg-muted);
}

.flyout--dark .flyout-item:hover .flyout-item-icon,
.flyout--dark .flyout-item--active .flyout-item-icon {
  color: var(--color-chrome-fg-muted);
}

.flyout--dark .flyout-item-chevron {
  color: var(--color-chrome-fg-muted);
}

/* ── Group label ── */
.flyout-group-label {
  display: block;
  padding: var(--space-xs) var(--space-s) 0;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Menu item ── */
.flyout-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--space-xs);
  height: 30px;
  padding: 0 var(--space-xs);
  background: none;
  border: none;
  border-radius: var(--radius-s);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-size-m);
  line-height: 20px;
  text-align: start;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.flyout-item-icon {
  flex-shrink: 0;
  transition: color var(--duration-instant) var(--ease-default);
}

.flyout-item-icon--img {
  width: 18px;
  height: 18px;
  border-radius: var(--radius-s);
  object-fit: cover;
}

.flyout-item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flyout-item-shortcut {
  flex-shrink: 0;
  margin-inline-start: var(--space-m);
  font-size: var(--font-size-xs);
  opacity: 0.4;
  letter-spacing: 0.02em;
}

.flyout-item-detail {
  flex-shrink: 0;
  min-width: 20px;
  font-size: var(--font-size-s);
  text-align: end;
  opacity: 0.55;
  order: 99;
  margin-inline-start: auto;
}

.flyout-item-check {
  flex-shrink: 0;
  margin-inline-start: var(--space-xs);
  opacity: 0.6;
}

.flyout-item-check--hidden {
  visibility: hidden;
}

.flyout-item-chevron {
  flex-shrink: 0;
  margin-inline-start: var(--space-xs);
}

/* ── Destructive variant — normal at rest, red on hover ── */
.flyout-item--destructive:hover,
.flyout--dark .flyout-item--destructive:hover,
.flyout--light .flyout-item--destructive:hover {
  background: rgba(214, 54, 56, 0.12);
  color: #f86368;
}

.flyout-item--destructive:hover .flyout-item-icon,
.flyout--dark .flyout-item--destructive:hover .flyout-item-icon,
.flyout--light .flyout-item--destructive:hover .flyout-item-icon {
  color: #f86368;
}

/* ── Submenu transitions ── */
.flyout-sub-enter-active,
.flyout-sub-leave-active {
  transition: opacity var(--duration-instant) var(--ease-default),
    transform var(--duration-instant) var(--ease-default);
}

.flyout-sub-enter-from,
.flyout-sub-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}
</style>

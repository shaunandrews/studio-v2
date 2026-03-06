<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount, computed } from 'vue'
import { check, chevronRight } from '@wordpress/icons'
import WPIcon from '@shared/primitives/WPIcon.vue'

export interface FlyoutMenuItem {
  label: string
  detail?: string
  icon?: any
  iconUrl?: string
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
}>(), {
  surface: 'light',
  align: 'center',
  placement: 'below',
})

const emit = defineEmits<{
  close: []
}>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

// Track which top-level item has its flyout open
const activeParent = ref<string | null>(null)
// Track flyout position styles per parent key
const flyoutStyles = ref<Record<string, Record<string, string>>>({})
// Track flyout refs
const flyoutRefs = ref<Record<string, HTMLElement | null>>({})
// Track item refs for flyout positioning
const itemRefs = ref<Record<string, HTMLElement | null>>({})

const resolvedPlacement = ref<'above' | 'below'>('below')

const EDGE_PADDING = 8
const GAP = 4

// Debounced mouseleave — gives the cursor time to cross the gap to the flyout
let leaveTimer: ReturnType<typeof setTimeout> | null = null
const LEAVE_DELAY = 100 // ms grace period

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
  open.value = !open.value
}

function close() {
  open.value = false
  activeParent.value = null
  emit('close')
}

function positionMenu() {
  const trigger = triggerRef.value
  const menu = menuRef.value
  if (!trigger || !menu) return

  const rect = trigger.getBoundingClientRect()
  const menuRect = menu.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  const spaceBelow = vh - rect.bottom - GAP - EDGE_PADDING
  const spaceAbove = rect.top - GAP - EDGE_PADDING

  // Resolve placement with flip
  let placeAbove = props.placement === 'above'
  if (placeAbove && spaceAbove < menuRect.height && spaceBelow > spaceAbove) {
    placeAbove = false
  } else if (!placeAbove && spaceBelow < menuRect.height && spaceAbove > spaceBelow) {
    placeAbove = true
  }
  resolvedPlacement.value = placeAbove ? 'above' : 'below'

  const style: Record<string, string> = {
    position: 'fixed',
    zIndex: '9999',
  }
  if (props.maxWidth) style.maxWidth = props.maxWidth

  if (placeAbove) {
    const bottom = vh - rect.top + GAP
    if (menuRect.height > spaceAbove) {
      style.maxHeight = `${spaceAbove}px`
      style.overflowY = 'auto'
    }
    style.bottom = `${bottom}px`
    style.top = 'auto'
  } else {
    style.top = `${rect.bottom + GAP}px`
    style.bottom = 'auto'
    if (menuRect.height > spaceBelow) {
      style.maxHeight = `${spaceBelow}px`
      style.overflowY = 'auto'
    }
  }

  // Horizontal alignment
  let left: number
  if (props.align === 'end') {
    left = rect.right - menuRect.width
  } else if (props.align === 'start') {
    left = rect.left
  } else {
    left = rect.left + rect.width / 2 - menuRect.width / 2
  }
  if (left + menuRect.width > vw - EDGE_PADDING) left = vw - EDGE_PADDING - menuRect.width
  if (left < EDGE_PADDING) left = EDGE_PADDING
  style.left = `${left}px`

  menuStyle.value = style
}

function positionFlyout(key: string) {
  const itemEl = itemRefs.value[key]
  const flyoutEl = flyoutRefs.value[key]
  const menu = menuRef.value
  if (!itemEl || !flyoutEl || !menu) return

  const itemRect = itemEl.getBoundingClientRect()
  const menuRect = menu.getBoundingClientRect()
  const flyoutRect = flyoutEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  const style: Record<string, string> = {
    position: 'fixed',
    zIndex: '10000',
  }

  // Horizontal: try placing to the right of the parent menu
  const rightSpace = vw - menuRect.right - GAP - EDGE_PADDING
  const leftSpace = menuRect.left - GAP - EDGE_PADDING

  if (rightSpace >= flyoutRect.width || rightSpace >= leftSpace) {
    // Place to the right
    style.left = `${menuRect.right + GAP}px`
  } else {
    // Place to the left
    style.left = `${menuRect.left - GAP - flyoutRect.width}px`
  }

  // Vertical: align top of flyout with the hovered item, but keep in viewport
  let top = itemRect.top - GAP // slight offset up so flyout overlaps with item row
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
  if (item.children?.length) return // parent items don't fire actions
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

watch(open, (val) => {
  if (val) {
    nextTick(() => {
      positionMenu()
      nextTick(positionMenu)
    })
  } else {
    menuStyle.value = {}
    activeParent.value = null
    flyoutStyles.value = {}
  }
})

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (
    triggerRef.value?.contains(target) ||
    menuRef.value?.contains(target)
  ) return
  // Check flyout refs
  for (const el of Object.values(flyoutRefs.value)) {
    if (el?.contains(target)) return
  }
  if (open.value) close()
}

function onScrollOrResize() {
  if (!open.value) return
  positionMenu()
  if (activeParent.value) positionFlyout(activeParent.value)
}

// Close on Escape
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})

onBeforeUnmount(() => {
  cancelDeactivate()
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})

// Surface class for the dropdown panels
const surfaceClass = computed(() => props.surface === 'dark' ? 'flyout--dark' : 'flyout--light')

// Whether any item has a `checked` field — reserve checkmark column for all items
const hasCheckedItems = computed(() =>
  props.groups.some(g => g.items.some(i => i.checked !== undefined))
)

defineExpose({ toggle, close, open })
</script>

<template>
  <div class="flyout-anchor" ref="triggerRef">
    <slot name="trigger" :toggle="toggle" :open="open" />
    <Teleport to="body">
      <Transition name="flyout">
        <div
          v-if="open"
          ref="menuRef"
          class="flyout-menu vstack"
          :class="[surfaceClass, { 'flyout-menu--above': resolvedPlacement === 'above' }]"
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

      <!-- Flyout submenus -->
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
              </button>
            </div>
          </Transition>
        </template>
      </template>
    </Teleport>
  </div>
</template>

<style scoped>
.flyout-anchor {
  position: relative;
}
</style>

<!-- Teleported styles (unscoped) -->
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
  background: var(--color-frame-bg-secondary);
}

.flyout--light .flyout-item-icon {
  color: var(--color-frame-fg-muted);
}

.flyout--light .flyout-item:hover .flyout-item-icon,
.flyout--light .flyout-item--active .flyout-item-icon {
  color: var(--color-frame-fg-secondary);
}

.flyout--light .flyout-item-chevron {
  color: var(--color-frame-fg-muted);
}

/* ── Dark surface ── */
.flyout--dark {
  background: var(--color-chrome);
  border: 1px solid var(--color-chrome-subtle);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

.flyout--dark .flyout-group + .flyout-group {
  border-block-start: 1px solid var(--color-chrome-border);
}

.flyout--dark .flyout-group-label {
  color: var(--color-chrome-text-muted);
}

.flyout--dark .flyout-item {
  color: var(--color-chrome-text);
}

.flyout--dark .flyout-item:hover,
.flyout--dark .flyout-item--active {
  background: var(--color-chrome-hover);
}

.flyout--dark .flyout-item-icon {
  color: var(--color-chrome-text-muted);
}

.flyout--dark .flyout-item:hover .flyout-item-icon,
.flyout--dark .flyout-item--active .flyout-item-icon {
  color: var(--color-chrome-text-secondary);
}

.flyout--dark .flyout-item-chevron {
  color: var(--color-chrome-text-muted);
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
  padding: 0 var(--space-s);
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

/* ── Transitions ── */
.flyout-enter-active,
.flyout-leave-active {
  transition: opacity var(--duration-instant) var(--ease-default),
    transform var(--duration-instant) var(--ease-default);
}

.flyout-enter-from,
.flyout-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.flyout-menu--above.flyout-enter-from,
.flyout-menu--above.flyout-leave-to {
  transform: translateY(4px);
}

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

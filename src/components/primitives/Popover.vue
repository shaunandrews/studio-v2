<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount, computed } from 'vue'

const props = withDefaults(defineProps<{
  surface?: 'light' | 'dark'
  align?: 'start' | 'center' | 'end'
  placement?: 'above' | 'below'
  maxWidth?: string
  maxHeight?: string
  bare?: boolean
  containsTarget?: (target: Node) => boolean
  anchor?: HTMLElement | null
  modelValue?: boolean
}>(), {
  surface: 'light',
  align: 'center',
  placement: 'below',
  bare: false,
  anchor: undefined,
  modelValue: undefined,
})

const emit = defineEmits<{
  close: []
  reposition: []
  'update:modelValue': [value: boolean]
}>()

const internalOpen = ref(false)

// When modelValue is provided, use controlled mode
const open = computed({
  get: () => props.modelValue !== undefined ? props.modelValue : internalOpen.value,
  set: (val: boolean) => {
    if (props.modelValue !== undefined) {
      emit('update:modelValue', val)
    } else {
      internalOpen.value = val
    }
  },
})

const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})
const resolvedMaxHeight = ref<string | null>(null)

const resolvedPlacement = ref<'above' | 'below'>('below')

const EDGE_PADDING = 8
const GAP = 4

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
  emit('close')
}

function reposition() {
  positionPanel()
}

function positionPanel() {
  const trigger = props.anchor ?? triggerRef.value
  const panel = panelRef.value
  if (!trigger || !panel) return

  const rect = trigger.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  const spaceBelow = vh - rect.bottom - GAP - EDGE_PADDING
  const spaceAbove = rect.top - GAP - EDGE_PADDING

  // Resolve placement with flip
  let placeAbove = props.placement === 'above'
  if (placeAbove && spaceAbove < panelRect.height && spaceBelow > spaceAbove) {
    placeAbove = false
  } else if (!placeAbove && spaceBelow < panelRect.height && spaceAbove > spaceBelow) {
    placeAbove = true
  }
  resolvedPlacement.value = placeAbove ? 'above' : 'below'

  const style: Record<string, string> = {
    position: 'fixed',
    zIndex: '9999',
  }
  if (props.maxWidth) style.maxWidth = props.maxWidth

  const propMax = props.maxHeight ? parseInt(props.maxHeight, 10) : Infinity

  if (placeAbove) {
    const bottom = vh - rect.top + GAP
    const cap = Math.min(spaceAbove, propMax)
    // Bare popovers delegate overflow to children via slot prop
    if (!props.bare) {
      style.maxHeight = `${cap}px`
      style.overflowY = 'auto'
    }
    resolvedMaxHeight.value = `${cap}px`
    style.bottom = `${bottom}px`
    style.top = 'auto'
  } else {
    style.top = `${rect.bottom + GAP}px`
    style.bottom = 'auto'
    const cap = Math.min(spaceBelow, propMax)
    if (!props.bare) {
      style.maxHeight = `${cap}px`
      style.overflowY = 'auto'
    }
    resolvedMaxHeight.value = `${cap}px`
  }

  // Horizontal alignment
  let left: number
  if (props.align === 'end') {
    left = rect.right - panelRect.width
  } else if (props.align === 'start') {
    left = rect.left
  } else {
    left = rect.left + rect.width / 2 - panelRect.width / 2
  }
  if (left + panelRect.width > vw - EDGE_PADDING) left = vw - EDGE_PADDING - panelRect.width
  if (left < EDGE_PADDING) left = EDGE_PADDING
  style.left = `${left}px`

  panelStyle.value = style
}

watch(open, (val) => {
  if (val) {
    nextTick(() => {
      positionPanel()
      nextTick(positionPanel)
    })
  } else {
    panelStyle.value = {}
    resolvedMaxHeight.value = null
  }
})

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  const anchorEl = props.anchor ?? triggerRef.value
  if (anchorEl?.contains(target) || panelRef.value?.contains(target)) return
  if (props.containsTarget?.(target)) return
  if (open.value) close()
}

function onScrollOrResize() {
  if (!open.value) return
  positionPanel()
  emit('reposition')
}

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
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})

const surfaceClass = computed(() => {
  if (props.bare) return ''
  return props.surface === 'dark' ? 'popover--dark' : 'popover--light'
})

defineExpose({ toggle, close, open, panelRef, reposition })
</script>

<template>
  <!-- Anchored mode: external anchor element, no wrapper needed -->
  <template v-if="anchor">
    <Teleport to="body">
      <Transition name="popover">
        <div
          v-if="open"
          ref="panelRef"
          class="popover-panel"
          :class="[surfaceClass, {
            'popover-panel--above': resolvedPlacement === 'above',
            'popover-panel--bare': bare,
          }]"
          :style="panelStyle"
        >
          <slot :close="close" :resolved-max-height="resolvedMaxHeight" />
        </div>
      </Transition>
    </Teleport>
  </template>

  <!-- Trigger mode: wraps trigger element -->
  <div v-else class="popover-anchor" ref="triggerRef">
    <slot name="trigger" :toggle="toggle" :open="open" />
    <Teleport to="body">
      <Transition name="popover">
        <div
          v-if="open"
          ref="panelRef"
          class="popover-panel"
          :class="[surfaceClass, {
            'popover-panel--above': resolvedPlacement === 'above',
            'popover-panel--bare': bare,
          }]"
          :style="panelStyle"
        >
          <slot :close="close" :resolved-max-height="resolvedMaxHeight" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.popover-anchor {
  position: relative;
}
</style>

<!-- Teleported styles (unscoped) -->
<style>
.popover-panel {
  width: max-content;
  min-width: 120px;
  border-radius: var(--radius-m);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  padding: var(--space-xs) var(--space-s);
}

.popover-panel--bare {
  padding: 0;
  box-shadow: none;
  min-width: 0;
  border-radius: 0;
  background: none;
  border: none;
}

/* ── Light surface ── */
.popover--light {
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  color: var(--color-frame-fg);
}

/* ── Dark surface ── */
.popover--dark {
  background: var(--color-chrome-bg);
  border: 1px solid var(--color-chrome-border);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  color: var(--color-chrome-fg);
}

/* ── Transitions ── */
.popover-enter-active,
.popover-leave-active {
  transition: opacity var(--duration-instant) var(--ease-default),
    transform var(--duration-instant) var(--ease-default);
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.popover-panel--above.popover-enter-from,
.popover-panel--above.popover-leave-to {
  transform: translateY(4px);
}
</style>

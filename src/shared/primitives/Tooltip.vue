<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { isWarm, markHide } from './tooltip-state'

const props = withDefaults(defineProps<{
  text?: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  multiline?: boolean
}>(), {
  placement: 'bottom',
  delay: 600,
  multiline: false,
})

const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const visible = ref(false)
const position = ref({ top: '0px', left: '0px' })
let showTimeout: ReturnType<typeof setTimeout> | null = null

function updatePosition() {
  if (!triggerRef.value || !tooltipRef.value) return
  const trigger = triggerRef.value.getBoundingClientRect()
  const tip = tooltipRef.value.getBoundingClientRect()
  const gap = 6
  const vw = window.innerWidth
  const vh = window.innerHeight

  let top = 0
  let left = 0
  let placement = props.placement

  // Calculate preferred position
  if (placement === 'top') {
    top = trigger.top - tip.height - gap
    left = trigger.left + (trigger.width - tip.width) / 2
  } else if (placement === 'bottom') {
    top = trigger.bottom + gap
    left = trigger.left + (trigger.width - tip.width) / 2
  } else if (placement === 'left') {
    top = trigger.top + (trigger.height - tip.height) / 2
    left = trigger.left - tip.width - gap
  } else if (placement === 'right') {
    top = trigger.top + (trigger.height - tip.height) / 2
    left = trigger.right + gap
  }

  // Flip if off-screen
  if (placement === 'top' && top < 4) {
    top = trigger.bottom + gap
  } else if (placement === 'bottom' && top + tip.height > vh - 4) {
    top = trigger.top - tip.height - gap
  } else if (placement === 'left' && left < 4) {
    left = trigger.right + gap
  } else if (placement === 'right' && left + tip.width > vw - 4) {
    left = trigger.left - tip.width - gap
  }

  // Clamp horizontal
  left = Math.max(4, Math.min(left, vw - tip.width - 4))
  // Clamp vertical
  top = Math.max(4, Math.min(top, vh - tip.height - 4))

  position.value = { top: `${top}px`, left: `${left}px` }
}

async function show() {
  if (!props.text) return
  visible.value = true
  await nextTick()
  updatePosition()
}

function scheduleShow() {
  if (!props.text) return
  const effectiveDelay = isWarm() ? 0 : props.delay
  showTimeout = setTimeout(show, effectiveDelay)
}

function hide() {
  if (showTimeout) {
    clearTimeout(showTimeout)
    showTimeout = null
  }
  if (visible.value) {
    visible.value = false
    markHide()
  }
}

onMounted(() => {
  // Hide on scroll anywhere
  window.addEventListener('scroll', hide, true)
})

onUnmounted(() => {
  hide()
  window.removeEventListener('scroll', hide, true)
})
</script>

<template>
  <span
    ref="triggerRef"
    class="tooltip-trigger"
    @pointerenter="scheduleShow"
    @pointerleave="hide"
    @pointerdown="hide"
    @focusin="scheduleShow"
    @focusout="hide"
  >
    <slot />
    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="visible && text"
          ref="tooltipRef"
          class="tooltip"
          :class="{ 'tooltip--multiline': multiline }"
          role="tooltip"
          :style="position"
        >
          {{ text }}
        </div>
      </Transition>
    </Teleport>
  </span>
</template>

<style scoped>
.tooltip-trigger {
  display: inline-flex;
}

.tooltip {
  position: fixed;
  z-index: 9999;
  padding: var(--space-xxs) var(--space-xs);
  background: #000;
  color: #fff;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  border-radius: var(--radius-s);
  white-space: nowrap;
  pointer-events: none;
  max-width: 240px;
}

.tooltip--multiline {
  white-space: normal;
  max-width: 280px;
  padding: var(--space-xxs) var(--space-xs);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: var(--line-height-normal);
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>

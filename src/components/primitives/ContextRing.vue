<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Tooltip from '@/components/primitives/Tooltip.vue'

const props = withDefaults(defineProps<{
  percent: number
  model?: string
  tokens?: string
  cost?: string
  messages?: number
  surface?: 'light' | 'dark'
}>(), {
  model: '',
  tokens: '',
  cost: '',
  messages: 0,
  surface: 'light',
})

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

const circumference = 37.70 // 2 * PI * 6 (radius)
const dashoffset = computed(() => circumference * (1 - props.percent / 100))

const isWarning = computed(() => props.percent >= 80)
const isCritical = computed(() => props.percent >= 95)

const hasDetails = computed(() =>
  props.model || props.tokens || props.cost || props.messages > 0
)

function toggle() {
  if (!hasDetails.value) return
  open.value = !open.value
  if (open.value) {
    nextTick(() => {
      positionMenu()
      nextTick(positionMenu)
    })
  }
}

function positionMenu() {
  const trigger = triggerRef.value
  const menu = menuRef.value
  if (!trigger || !menu) return

  const triggerRect = trigger.getBoundingClientRect()
  const menuRect = menu.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const gap = 4
  const edgePad = 8

  const style: Record<string, string> = { position: 'fixed' }

  // Place above the trigger
  const spaceAbove = triggerRect.top - gap

  if (spaceAbove >= menuRect.height || spaceAbove > vh - triggerRect.bottom - gap) {
    style.bottom = `${vh - triggerRect.top + gap}px`
    style.top = 'auto'
  } else {
    style.top = `${triggerRect.bottom + gap}px`
    style.bottom = 'auto'
  }

  // Horizontal: right-align to trigger
  let left = triggerRect.right - menuRect.width
  if (left < edgePad) left = edgePad
  if (left + menuRect.width > vw - edgePad) left = vw - edgePad - menuRect.width
  style.left = `${left}px`

  menuStyle.value = style
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (!triggerRef.value?.contains(target) && !menuRef.value?.contains(target)) {
    open.value = false
  }
}

function onScrollOrResize() {
  if (open.value) positionMenu()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})
</script>

<template>
  <div ref="triggerRef" class="context-ring-wrap" :class="[`surface-${surface}`]">
    <Tooltip :text="open ? undefined : `Context: ${percent}% used`" placement="bottom">
      <button
        class="context-ring-trigger"
        :class="{ active: open, warning: isWarning, critical: isCritical }"
        aria-label="Context window usage"
        @click.stop="toggle"
      >
        <svg width="16" height="16" viewBox="0 0 16 16">
          <circle class="context-ring__track" cx="8" cy="8" r="6" />
          <circle
            class="context-ring__fill"
            :class="{ warning: isWarning, critical: isCritical }"
            cx="8" cy="8" r="6"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashoffset"
          />
        </svg>
      </button>
    </Tooltip>

    <!-- Details popover -->
    <Teleport to="body">
      <Transition name="context-dropdown">
        <div
          v-if="open && hasDetails"
          ref="menuRef"
          class="context-dropdown"
          :style="menuStyle"
        >
          <div v-if="model" class="context-dropdown__row">
            <span class="context-dropdown__label">Model</span>
            <span class="context-dropdown__value">{{ model }}</span>
          </div>
          <div v-if="tokens" class="context-dropdown__row">
            <span class="context-dropdown__label">Tokens</span>
            <span class="context-dropdown__value">{{ tokens }}</span>
          </div>
          <div v-if="cost" class="context-dropdown__row">
            <span class="context-dropdown__label">Est. cost</span>
            <span class="context-dropdown__value">{{ cost }}</span>
          </div>
          <div v-if="messages > 0" class="context-dropdown__row">
            <span class="context-dropdown__label">Messages</span>
            <span class="context-dropdown__value">{{ messages }}</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.context-ring-wrap {
  display: inline-flex;
}

.context-ring-trigger {
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  border-radius: var(--radius-s);
  padding: var(--space-xxxs);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default);
}

.context-ring-trigger:hover {
  background: var(--color-frame-bg);
}

.context-ring-trigger.active {
  background: var(--color-frame-bg);
}

.context-ring-trigger svg {
  display: block;
  transform: rotate(-90deg); /* Start arc from 12 o'clock */
}

.context-ring__track {
  fill: none;
  stroke: var(--color-frame-border);
  stroke-width: 2.5;
}

.context-ring__fill {
  fill: none;
  stroke: var(--color-frame-fg-secondary);
  stroke-width: 2.5;
  stroke-linecap: round;
  transition:
    stroke-dashoffset var(--duration-moderate) var(--ease-default),
    stroke var(--duration-moderate) var(--ease-default);
}

.context-ring__fill.warning {
  stroke: #d63638;
}

.context-ring__fill.critical {
  stroke: #d63638;
  animation: context-pulse 1.5s ease-in-out infinite;
}

@keyframes context-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Dark surface variants */
.surface-dark .context-ring-trigger:hover,
.surface-dark .context-ring-trigger.active {
  background: var(--color-chrome-hover);
}

.surface-dark .context-ring__track {
  stroke: var(--color-chrome-border);
}

.surface-dark .context-ring__fill {
  stroke: var(--color-chrome-text-muted);
}

.surface-dark .context-ring__fill.warning,
.surface-dark .context-ring__fill.critical {
  stroke: #d63638;
}

/* Dark mode (system) */
@media (prefers-color-scheme: dark) {
  .surface-light .context-ring__fill {
    stroke: var(--color-frame-fg-muted);
  }

  .surface-light .context-ring__fill.warning,
  .surface-light .context-ring__fill.critical {
    stroke: #d63638;
  }
}
</style>

<!-- Context dropdown styles (unscoped -- teleported to body) -->
<style>
.context-dropdown {
  width: max-content;
  min-width: 200px;
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  padding: var(--space-xs);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.context-dropdown__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-m);
}

.context-dropdown__label {
  font-family: var(--font-family);
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  white-space: nowrap;
}

.context-dropdown__value {
  font-family: var(--font-family);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* Transition */
.context-dropdown-enter-active,
.context-dropdown-leave-active {
  transition: opacity var(--duration-instant) var(--ease-default), transform var(--duration-instant) var(--ease-default);
}

.context-dropdown-enter-from,
.context-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .context-dropdown {
    background: var(--color-frame-bg);
    border-color: var(--color-frame-border);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
</style>

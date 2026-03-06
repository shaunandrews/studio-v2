<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'

const props = defineProps<{
  icon?: any
  label?: string
  variant?: 'primary' | 'secondary' | 'tertiary'
  surface?: 'light' | 'dark'
  size?: 'small' | 'default'
  iconOnly?: boolean
  width?: 'hug' | 'full'
  shortcut?: string
  active?: boolean
  activeRotate?: boolean
  disabled?: boolean
  tooltip?: string
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
}>()

// No custom click emit — native click falls through via inheritAttrs

const btnRef = ref<HTMLButtonElement | null>(null)

function formatShortcut(shortcut: string): string {
  const isMac = navigator.platform.includes('Mac')
  return shortcut
    .replace('mod', isMac ? '⌘' : 'Ctrl')
    .replace('shift', isMac ? '⇧' : 'Shift')
    .replace('alt', isMac ? '⌥' : 'Alt')
    .replace('enter', '↵')
    .replace(/\+/g, '')
}

function onKeydown(e: KeyboardEvent) {
  if (!props.shortcut) return
  const parts = props.shortcut.toLowerCase().split('+')
  const needsMod = parts.includes('mod')
  const needsShift = parts.includes('shift')
  const needsAlt = parts.includes('alt')
  const key = parts.filter(p => !['mod', 'shift', 'alt'].includes(p))[0]

  const modPressed = e.metaKey || e.ctrlKey
  if (needsMod && !modPressed) return
  if (needsShift && !e.shiftKey) return
  if (needsAlt && !e.altKey) return
  if (e.key.toLowerCase() !== key) return

  e.preventDefault()
  btnRef.value?.click()
}

onMounted(() => {
  if (props.shortcut) document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  if (props.shortcut) document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Tooltip :text="tooltip" :placement="tooltipPlacement">
    <button
      ref="btnRef"
      class="btn"
      :class="[
        `btn--${variant || 'secondary'}`,
        `btn--${size || 'default'}`,
        `btn--on-${surface || 'light'}`,
        `btn--${width || 'hug'}`,
        { 'btn--icon-only': icon && !label, 'btn--active': active, 'btn--active-rotate': active && activeRotate }
      ]"
      :disabled="disabled"
    >
      <WPIcon v-if="icon" :icon="icon" :size="size === 'small' ? 16 : 20" />
      <span v-if="label" class="btn__label">{{ label }}</span>
      <span v-if="shortcut" class="btn__shortcut">{{ formatShortcut(shortcut) }}</span>
      <slot v-if="!icon && !label && !shortcut" />
    </button>
  </Tooltip>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--radius-s);
  font-family: inherit;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background var(--transition-hover), color var(--transition-hover), border-color var(--transition-hover);
  white-space: nowrap;
  flex-shrink: 0;
  outline: none;
  overflow: clip;
}

.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ── Sizes ── */

.btn--default {
  height: 32px;
  padding: 0 12px;
  gap: 4px;
  font-size: 13px;
  line-height: 20px;
  min-width: 70px;
}

.btn--small {
  height: 26px;
  padding: 0 8px;
  gap: 2px;
  font-size: 11px;
  line-height: 20px;
}

/* ── Icon-only (ButtonIcon pattern) ── */

.btn--icon-only.btn--default {
  width: 32px;
  min-width: 32px;
  padding: 0;
}

.btn--icon-only.btn--small {
  width: 26px;
  min-width: 26px;
  padding: 0;
}

/* ── Width ── */

.btn--hug { width: auto; }
.btn--full { width: 100%; }

/* ── Shortcut badges ── */

.btn__shortcut {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1;
  padding: 2px 4px;
  border-radius: var(--radius-s);
  margin-inline-start: 4px;
  flex-shrink: 0;
}

.btn--on-light .btn__shortcut {
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: inherit;
  opacity: 0.5;
}

.btn--on-dark .btn__shortcut {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: inherit;
  opacity: 0.5;
}

/* ============================================
   PRIMARY — frame (light) surface
   ============================================ */
.btn--primary.btn--on-light {
  background: var(--color-frame-theme);
  color: var(--color-primary-text);
  border-color: rgba(0, 0, 0, 0.1);
}

.btn--primary.btn--on-light:hover {
  background: var(--color-primary-hover);
}

/* ============================================
   PRIMARY — chrome (dark) surface
   ============================================ */
.btn--primary.btn--on-dark {
  background: var(--color-chrome-theme);
  color: var(--color-primary-text);
  border-color: rgba(255, 255, 255, 0.1);
}

.btn--primary.btn--on-dark:hover {
  background: var(--color-primary-hover);
}

/* ============================================
   SECONDARY — frame (light) surface
   ============================================ */
.btn--secondary.btn--on-light {
  background: var(--color-frame-bg);
  color: var(--color-frame-fg-muted);
  border-color: rgba(0, 0, 0, 0.1);
}

.btn--secondary.btn--on-light:hover {
  background: var(--color-frame-bg-secondary);
  color: var(--color-frame-fg);
}

/* ============================================
   SECONDARY — chrome (dark) surface
   ============================================ */
.btn--secondary.btn--on-dark {
  background: var(--color-chrome);
  color: var(--color-chrome-text-secondary);
  border-color: rgba(255, 255, 255, 0.1);
}

.btn--secondary.btn--on-dark:hover {
  background: var(--color-chrome-hover);
  color: var(--color-chrome-text);
}

.btn--secondary.btn--on-dark:focus-visible {
  outline-color: var(--color-chrome-subtle);
}

/* ============================================
   TERTIARY — frame (light) surface
   ============================================ */
.btn--tertiary.btn--on-light {
  background: transparent;
  color: var(--color-frame-fg-muted);
  border-color: transparent;
}

.btn--tertiary.btn--on-light:hover {
  background: var(--color-frame-bg-secondary);
  color: var(--color-frame-fg);
}

.btn--tertiary.btn--on-light.btn--active {
  background: var(--color-frame-fg);
  color: var(--color-frame-bg);
}

.btn--tertiary.btn--on-light.btn--active:hover {
  background: var(--color-frame-fg-secondary);
}

/* ============================================
   TERTIARY — chrome (dark) surface
   ============================================ */
.btn--tertiary.btn--on-dark {
  background: transparent;
  color: var(--color-chrome-text-muted);
  border-color: transparent;
}

.btn--tertiary.btn--on-dark:hover {
  background: var(--color-chrome-hover);
  color: var(--color-chrome-text);
}

.btn--tertiary.btn--on-dark.btn--active {
  background: var(--color-chrome-text);
  color: var(--color-chrome);
}

.btn--tertiary.btn--on-dark.btn--active:hover {
  background: var(--color-chrome-text-secondary);
}

.btn--tertiary.btn--on-dark:focus-visible {
  outline-color: var(--color-chrome-subtle);
}

/* ── Icon rotation for active state ── */

.btn :deep(svg) {
  transition: transform var(--duration-fast) var(--ease-default);
}

.btn--active-rotate :deep(svg) {
  transform: rotate(180deg);
}

/* ── Disabled ── */

.btn:disabled {
  opacity: 0.3;
  cursor: default;
  pointer-events: none;
}

.btn:disabled.btn--active {
  background: transparent;
  color: inherit;
  opacity: 0.3;
  pointer-events: none;
}
</style>

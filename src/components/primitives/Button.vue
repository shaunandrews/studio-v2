<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'

const props = defineProps<{
  icon?: any
  label?: string
  variant?: 'primary' | 'secondary' | 'tertiary'
  surface?: 'light' | 'dark'
  size?: 'mini' | 'small' | 'default' | 'large'
  iconOnly?: boolean
  width?: 'hug' | 'full'
  shortcut?: string
  active?: boolean
  activeRotate?: boolean
  destructive?: boolean
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
        { 'btn--icon-only': iconOnly || (icon && !label), 'btn--active': active, 'btn--active-rotate': active && activeRotate, 'btn--destructive': destructive }
      ]"
      :disabled="disabled"
      :aria-label="!label && tooltip ? tooltip : undefined"
    >
      <WPIcon v-if="icon" :icon="icon" :size="size === 'mini' ? 14 : size === 'small' ? 16 : size === 'large' ? 22 : 20" />
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
  outline: 2px solid var(--color-frame-theme);
  outline-offset: 2px;
}

/* ── Sizes ── */

.btn--large {
  height: 40px;
  padding: 0 var(--space-s);
  gap: var(--space-xxxs);
  font-size: var(--font-size-m);
  line-height: 20px;
  min-width: 70px;
}

.btn--default {
  height: 32px;
  padding: 0 var(--space-xs);
  gap: 4px; /* Optical: icon-label gap tighter than grid */
  font-size: var(--font-size-m);
  line-height: 20px;
  min-width: 70px;
}

.btn--small {
  height: 26px;
  padding: 0 var(--space-xxs);
  gap: 4px; /* Optical: tight fit at small size */
  font-size: var(--font-size-xs);
  line-height: 20px;
}

.btn--mini {
  height: 22px;
  padding: 0 var(--space-xxxs);
  gap: 4px; /* Optical: tight fit at mini size */
  font-size: var(--font-size-xs);
  line-height: 16px;
  border-radius: var(--radius-s);
}

/* ── Icon-only (ButtonIcon pattern) ── */

.btn--icon-only.btn--large {
  width: 40px;
  min-width: 40px;
  padding: 0;
}

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

.btn--icon-only.btn--mini {
  width: 22px;
  min-width: 22px;
  padding: 0;
}

/* ── Width ── */

.btn--hug { width: auto; }
.btn--full { width: 100%; }

/* ── Shortcut badges ── */

.btn__shortcut {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  line-height: 1;
  padding: 2px var(--space-xxxs); /* Optical: badge padding tighter than grid */
  border-radius: var(--radius-s);
  margin-inline-start: var(--space-xxxs);
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
  color: #fff;
  border-color: rgba(0, 0, 0, 0.1);
}

.btn--primary.btn--on-light:hover {
  background: var(--color-frame-theme);
}

/* ============================================
   PRIMARY — chrome (dark) surface
   ============================================ */
.btn--primary.btn--on-dark {
  background: var(--color-chrome-theme);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.1);
}

.btn--primary.btn--on-dark:hover {
  background: var(--color-frame-theme);
}

/* ============================================
   SECONDARY — frame (light) surface
   ============================================ */
.btn--secondary.btn--on-light {
  background: var(--color-frame-bg);
  color: var(--color-frame-fg-muted);
  border-color: var(--color-frame-border);
}

.btn--secondary.btn--on-light:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

/* ============================================
   SECONDARY — chrome (dark) surface
   ============================================ */
.btn--secondary.btn--on-dark {
  background: var(--color-chrome-bg);
  color: var(--color-chrome-fg-muted);
  border-color: rgba(255, 255, 255, 0.1);
}

.btn--secondary.btn--on-dark:hover {
  background: var(--color-chrome-hover);
  color: var(--color-chrome-fg);
}

.btn--secondary.btn--on-dark:focus-visible {
  outline-color: var(--color-chrome-border);
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
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.btn--tertiary.btn--on-light.btn--active {
  background: var(--color-frame-fg);
  color: var(--color-frame-bg);
}

.btn--tertiary.btn--on-light.btn--active:hover {
  background: var(--color-frame-fg-muted);
}

/* ============================================
   TERTIARY — chrome (dark) surface
   ============================================ */
.btn--tertiary.btn--on-dark {
  background: transparent;
  color: var(--color-chrome-fg-muted);
  border-color: transparent;
}

.btn--tertiary.btn--on-dark:hover {
  background: var(--color-chrome-hover);
  color: var(--color-chrome-fg);
}

.btn--tertiary.btn--on-dark.btn--active {
  background: var(--color-chrome-fg);
  color: var(--color-chrome-bg);
}

.btn--tertiary.btn--on-dark.btn--active:hover {
  background: var(--color-chrome-fg-muted);
}

.btn--tertiary.btn--on-dark:focus-visible {
  outline-color: var(--color-chrome-border);
}

/* ── Destructive modifier ── */

.btn--destructive.btn--secondary.btn--on-light {
  color: var(--color-frame-fg);
}

.btn--destructive.btn--secondary.btn--on-light:hover {
  color: #d63638;
  border-color: #d63638;
  background: rgba(214, 54, 56, 0.06);
}

.btn--destructive.btn--secondary.btn--on-dark:hover {
  color: #ff6b6b;
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

.btn--destructive.btn--primary.btn--on-light,
.btn--destructive.btn--primary.btn--on-dark {
  background: #d63638;
  color: #fff;
  border-color: transparent;
}

.btn--destructive.btn--primary.btn--on-light:hover,
.btn--destructive.btn--primary.btn--on-dark:hover {
  background: #b32d2e;
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

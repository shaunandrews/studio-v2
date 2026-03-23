<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount, useSlots } from 'vue'
import { close } from '@wordpress/icons'
import Text from '@/components/primitives/Text.vue'
import WPIcon from '@/components/primitives/WPIcon.vue'

const props = withDefaults(defineProps<{
  open: boolean
  width?: string
  title?: string
  closable?: boolean
  /** Render inline without Teleport/scrim — for design overviews */
  embedded?: boolean
}>(), {
  width: '480px',
  closable: true,
})

const emit = defineEmits<{
  close: []
}>()

const slots = useSlots()

const panelRef = ref<HTMLElement | null>(null)

function onScrimClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

function trapFocus(e: KeyboardEvent) {
  if (e.key !== 'Tab' || !panelRef.value) return
  const focusable = panelRef.value.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

let previouslyFocused: HTMLElement | null = null

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    previouslyFocused = document.activeElement as HTMLElement
    nextTick(() => {
      panelRef.value?.focus()
      updateScrollBorders()
    })
  } else {
    previouslyFocused?.focus()
    previouslyFocused = null
  }
})

const hasHeader = computed(() => props.title || slots.header)
const hasFooter = computed(() => !!slots.footer)

// Scroll border detection
const contentRef = ref<HTMLElement | null>(null)
const scrolledTop = ref(false)
const scrolledBottom = ref(false)

function updateScrollBorders() {
  const el = contentRef.value
  if (!el) return
  scrolledTop.value = el.scrollTop > 0
  scrolledBottom.value = el.scrollTop + el.clientHeight < el.scrollHeight - 1
}

/* scrollBorders handled by the focus-management watch above */

// For embedded mode, check scroll borders after mount
onMounted(() => {
  if (props.embedded) {
    nextTick(() => updateScrollBorders())
  }
})
</script>

<template>
  <!-- Embedded: render panel inline, no Teleport/scrim -->
  <div v-if="embedded" class="modal-panel modal-panel--embedded vstack" :style="{ width }">
    <button v-if="closable" class="modal-close" aria-label="Close" disabled>
      <WPIcon :icon="close" :size="20" />
    </button>
    <div v-if="hasHeader" class="modal-header hstack" :class="{ 'modal-header--bordered': scrolledTop }">
      <slot name="header">
        <Text variant="body" weight="semibold" class="flex-1 min-w-0">{{ title }}</Text>
      </slot>
    </div>
    <div ref="contentRef" class="modal-content" @scroll="updateScrollBorders">
      <slot />
    </div>
    <div v-if="hasFooter" class="modal-footer hstack" :class="{ 'modal-footer--bordered': scrolledBottom }">
      <slot name="footer" />
    </div>
  </div>

  <!-- Normal: Teleport with scrim -->
  <Teleport v-else to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-scrim" @click="onScrimClick">
        <div
          ref="panelRef"
          class="modal-panel vstack"
          role="dialog"
          :aria-label="title"
          tabindex="-1"
          :style="{ width }"
          @keydown="trapFocus"
        >

          <!-- Close button (absolutely positioned) -->
          <button v-if="closable" class="modal-close" aria-label="Close" @click="emit('close')">
            <WPIcon :icon="close" :size="20" />
          </button>

          <!-- Header -->
          <div v-if="hasHeader" class="modal-header hstack" :class="{ 'modal-header--bordered': scrolledTop }">
            <slot name="header">
              <Text variant="body" weight="semibold" class="flex-1 min-w-0">{{ title }}</Text>
            </slot>
          </div>

          <!-- Content -->
          <div ref="contentRef" class="modal-content" @scroll="updateScrollBorders">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="hasFooter" class="modal-footer hstack" :class="{ 'modal-footer--bordered': scrolledBottom }">
            <slot name="footer" />
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>

</template>

<style>
.modal-scrim {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
}

.modal-panel {
  position: relative;
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-l);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  max-height: 80vh;
  overflow: hidden;
}

.modal-panel--embedded {
  box-shadow: var(--shadow-m);
  max-height: none;
}

/* ── Header ── */
.modal-header {
  padding: var(--space-s) var(--space-xl);
  gap: var(--space-xs);
  flex-shrink: 0;
  border-block-end: 1px solid transparent;
  transition: border-color var(--duration-instant) var(--ease-default);
}

.modal-header--bordered {
  border-block-end-color: var(--color-frame-border);
}

/* ── Close button ── */
.modal-close {
  position: absolute;
  /* Physical offsets for app chrome edge positioning */
  top: 9px;
  right: 12px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: var(--radius-m);
  background: none;
  color: var(--color-frame-fg);
  cursor: pointer;
  transition: background var(--transition-hover);
}

.modal-close:hover {
  background: var(--color-frame-hover);
}

/* ── Content ── */
.modal-content {
  overflow-y: auto;
  padding-inline: var(--space-xl);
  padding-block-end: var(--space-s);
}

/* When there's no header, add top padding to content */
.modal-panel > .modal-content:first-child {
  padding-block-start: var(--space-s);
}

/* ── Footer ── */
.modal-footer {
  padding: var(--space-s) var(--space-xl);
  gap: var(--space-xs);
  justify-content: flex-end;
  flex-shrink: 0;
  border-block-start: 1px solid transparent;
  transition: border-color var(--duration-instant) var(--ease-default);
}

.modal-footer--bordered {
  border-block-start-color: var(--color-frame-border);
}

/* ── Transitions ── */
.modal-enter-active {
  transition: opacity var(--duration-fast) var(--ease-default);
}

.modal-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-panel {
  animation: modal-scale-in var(--duration-fast) var(--ease-default);
}

.modal-leave-active .modal-panel {
  animation: modal-scale-out var(--duration-fast) var(--ease-default);
}

@keyframes modal-scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes modal-scale-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
</style>

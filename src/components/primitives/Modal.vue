<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, useSlots } from 'vue'
import { close } from '@wordpress/icons'
import Text from '@/components/primitives/Text.vue'
import WPIcon from '@/components/primitives/WPIcon.vue'

const props = withDefaults(defineProps<{
  open: boolean
  width?: string
  title?: string
  closable?: boolean
}>(), {
  width: '480px',
  closable: true,
})

const emit = defineEmits<{
  close: []
}>()

const slots = useSlots()

function onScrimClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})

const hasHeader = computed(() => props.title || slots.header)
const hasFooter = computed(() => !!slots.footer)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-scrim" @click="onScrimClick">
        <div class="modal-panel vstack" :style="{ width }">

          <!-- Close button (absolutely positioned) -->
          <button v-if="closable" class="modal-close" @click="emit('close')">
            <WPIcon :icon="close" :size="20" />
          </button>

          <!-- Header -->
          <div v-if="hasHeader" class="modal-header hstack">
            <slot name="header">
              <Text variant="body" weight="semibold" class="flex-1 min-w-0">{{ title }}</Text>
            </slot>
          </div>

          <!-- Content -->
          <div class="modal-content">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="hasFooter" class="modal-footer hstack">
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
  z-index: 9000;
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

/* ── Header ── */
.modal-header {
  padding: var(--space-s) var(--space-xl);
  gap: var(--space-xs);
  flex-shrink: 0;
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

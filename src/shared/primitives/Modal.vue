<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  width?: string
}>(), {
  width: '480px',
})

const emit = defineEmits<{
  close: []
}>()

function onBackdropClick(e: MouseEvent) {
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
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-backdrop" @click="onBackdropClick">
        <div class="modal-panel vstack" :style="{ width }">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
}

.modal-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-surface-border);
  border-radius: var(--radius-l);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  max-height: 80vh;
  overflow: hidden;
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

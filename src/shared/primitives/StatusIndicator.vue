<script setup lang="ts">
const props = defineProps<{
  status: 'stopped' | 'loading' | 'running'
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <button
    class="status"
    :class="`status--${status}`"
    @click="emit('toggle')"
    :aria-label="status === 'running' ? 'Stop site' : status === 'stopped' ? 'Start site' : 'Loading'"
  >
    <!-- Loading: spinner ring -->
    <svg v-if="status === 'loading'" class="status__spinner" viewBox="0 0 16 16">
      <circle
        cx="8" cy="8" r="5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-dasharray="20 12"
      />
    </svg>

    <!-- Stopped / Running: single morphing shape -->
    <div v-else class="status__dot"></div>
  </button>
</template>

<style scoped>
.status {
  width: var(--space-m);
  height: var(--space-m);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-s);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  outline: none;
}
.status:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* The morphing dot */
.status__dot {
  width: 8px;
  height: 8px;
  transition: background-color var(--transition-fade), border-radius var(--transition-fade), clip-path 250ms var(--ease-default);
}

/* Stopped: grey circle → green play */
.status--stopped .status__dot {
  background: var(--color-status-stopped);
  border-radius: 50%;
  clip-path: circle(50% at 50% 50%);
}
.status--stopped:hover .status__dot {
  background: var(--color-status-running);
  border-radius: 0;
  clip-path: polygon(15% 0%, 100% 50%, 15% 100%);
}

/* Running: green circle → red square */
.status--running .status__dot {
  background: var(--color-status-running);
  border-radius: 50%;
  clip-path: circle(50% at 50% 50%);
}
.status--running:hover .status__dot {
  background: var(--color-status-stop-hover);
  border-radius: 2px;
  clip-path: polygon(10% 10%, 90% 10%, 90% 90%, 10% 90%);
}

/* Loading spinner */
.status--loading {
  cursor: default;
  color: var(--color-primary);
}

.status__spinner {
  width: 14px;
  height: 14px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

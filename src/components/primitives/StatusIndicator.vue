<script setup lang="ts">
import { computed } from 'vue'
import Tooltip from '@/components/primitives/Tooltip.vue'

const props = defineProps<{
  status: 'stopped' | 'loading' | 'running'
}>()

const emit = defineEmits<{
  toggle: []
}>()

const tooltipText = computed(() => {
  if (props.status === 'running') return 'Stop site'
  if (props.status === 'stopped') return 'Start site'
  return 'Loading…'
})
</script>

<template>
  <Tooltip :text="tooltipText" placement="top" :delay="300">
    <button
      class="status"
      :class="`status--${status}`"
      @click="emit('toggle')"
      :aria-label="tooltipText"
      :disabled="status === 'loading'"
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

      <!-- Stopped / Running: morphing shape -->
      <svg v-else class="status__shape" viewBox="0 0 10 10">
        <!-- Stopped: grey rounded square / hover: green play -->
        <!-- Running: green circle / hover: red stop square -->
        <rect v-if="status === 'stopped'" class="status__rect" x="1" y="1" width="8" height="8" rx="1.5" />
        <circle v-else class="status__circle" cx="5" cy="5" r="4.5" />
        <!-- Play triangle (visible on stopped hover) -->
        <path v-if="status === 'stopped'" class="status__play" d="M3.5 1.8 L8.5 5 L3.5 8.2Z" />
        <!-- Stop square (visible on running hover) -->
        <rect v-if="status === 'running'" class="status__stop" x="1" y="1" width="8" height="8" rx="1.5" />
      </svg>
    </button>
  </Tooltip>
</template>

<style scoped>
.status {
  width: var(--space-l);
  height: var(--space-l);
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

.status:disabled {
  cursor: default;
}

.status:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* The morphing shape */
.status__shape {
  width: 10px;
  height: 10px;
}

.status__shape rect,
.status__shape circle,
.status__shape path {
  transition: opacity 200ms var(--ease-default);
}

/* Stopped: grey rounded square */
.status__rect {
  fill: var(--color-status-stopped);
  opacity: 1;
}

.status__play {
  fill: var(--color-status-running);
  stroke: var(--color-status-running);
  stroke-width: 1;
  stroke-linejoin: round;
  opacity: 0;
}

.status--stopped:hover .status__rect {
  opacity: 0;
}

.status--stopped:hover .status__play {
  opacity: 1;
}

/* Running: green circle */
.status__circle {
  fill: var(--color-status-running);
  opacity: 1;
}

.status__stop {
  fill: var(--color-status-stop-hover);
  opacity: 0;
}

.status--running:hover .status__circle {
  opacity: 0;
}

.status--running:hover .status__stop {
  opacity: 1;
}

/* Loading spinner */
.status--loading {
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

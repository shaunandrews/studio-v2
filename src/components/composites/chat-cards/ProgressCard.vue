<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { check, chevronDown } from '@wordpress/icons'
import WPIcon from '../../primitives/WPIcon.vue'
import ChatCard from './ChatCard.vue'
import type { CardUiState, ProgressCardData } from '@/data/types'

const props = withDefaults(defineProps<{
  data: ProgressCardData
  compact?: boolean
  state?: CardUiState
}>(), {
  compact: false,
  state: 'default',
})

// Only animate cards added after initial render (not seed data on page load)
let _initialRenderDone = false
requestAnimationFrame(() => requestAnimationFrame(() => { _initialRenderDone = true }))

const animate = ref(_initialRenderDone)
onMounted(() => { animate.value = _initialRenderDone })

const allDone = computed(() => props.data.steps.every(s => s.status === 'done'))
const expanded = ref(!allDone.value)

function toggle() {
  expanded.value = !expanded.value
}
</script>

<template>
  <ChatCard :compact="compact" :state="state" :class="{ 'progress-card--collapsed': !expanded }">
    <template #header>
      <button class="progress-header" @click="toggle">
        <strong>{{ data.label }}</strong>
        <span class="progress-header-end">
          <span class="progress-count">{{ data.steps.length }} steps</span>
          <WPIcon
            :icon="chevronDown"
            :size="18"
            class="progress-chevron"
            :class="{ 'progress-chevron--open': expanded }"
          />
        </span>
      </button>
    </template>
    <ul v-if="expanded" class="progress-list">
      <li
        v-for="(step, idx) in data.steps"
        :key="step.name"
        class="progress-item"
        :class="[
          `progress-item--${step.status}`,
          { 'progress-item--animate': animate },
        ]"
        :style="animate ? { animationDelay: `${idx * 60}ms` } : undefined"
      >
        <span class="progress-check" :class="`progress-check--${step.status}`">
          <WPIcon v-if="step.status === 'done'" :icon="check" :size="16" />
          <svg v-else-if="step.status === 'running'" class="progress-spinner" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-dasharray="36 20" />
          </svg>
          <svg v-else-if="step.status === 'error'" class="progress-x" viewBox="0 0 16 16">
            <path d="M5 5l6 6M11 5l-6 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </span>
        <span class="progress-label">{{ step.name }}</span>
      </li>
    </ul>
  </ChatCard>
</template>

<style scoped>
.progress-card--collapsed :deep(.chat-card__header) {
  border-block-end: none;
}

:deep(.chat-card__header) {
  padding: 0;
}

.progress-card--collapsed :deep(.chat-card__body) {
  display: none;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: var(--space-xs);
  background: none;
  border: none;
  padding: var(--space-xs) var(--space-s);
  margin: 0;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: start;
}

.progress-header-end {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  flex-shrink: 0;
}

.progress-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.progress-chevron {
  color: var(--color-text-muted);
  transition: transform 0.15s ease;
}

.progress-chevron--open {
  transform: rotate(180deg);
}

.progress-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.progress-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xxs) 0;
}

.progress-item--animate {
  animation: progress-reveal 0.3s ease-out both;
}

@keyframes progress-reveal {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.progress-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.progress-check--done {
  border: 1px solid #00a32a;
  color: #00a32a;
}

.progress-check--running {
  color: var(--color-primary);
}

.progress-check--pending {
  border: 1px solid var(--color-surface-border);
}

.progress-check--error {
  border: 1px solid #d63638;
  color: #d63638;
}

.progress-label {
  font-size: var(--font-size-s);
  color: var(--color-text);
}

.progress-spinner {
  width: 20px;
  height: 20px;
  animation: spin 0.8s linear infinite;
}

.progress-x {
  width: 14px;
  height: 14px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

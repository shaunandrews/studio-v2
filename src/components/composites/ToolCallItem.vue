<script setup lang="ts">
import { ref } from 'vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { chevronRight } from '@wordpress/icons'
import type { ToolCallStatus } from '@/data/types'

defineProps<{
  label: string
  status: ToolCallStatus
  toolName?: string
  args?: string
  result?: string
  error?: string
}>()

const expanded = ref(false)

function toggle(status: ToolCallStatus) {
  if (status === 'running') return
  expanded.value = !expanded.value
}
</script>

<template>
  <div
    class="tool-call-item"
    :class="[
      `tool-call-item--${status}`,
      { 'is-expanded': expanded },
    ]"
    @click="toggle(status)"
  >
    <div class="tool-call-item__row hstack gap-xxs">
      <!-- Running: spinner leads -->
      <svg
        v-if="status === 'running'"
        class="tool-call-item__spinner"
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-dasharray="24 12"
          fill="none"
        />
      </svg>

      <span class="tool-call-item__label">{{ label }}</span>

      <!-- Done/Error: trailing chevron -->
      <WPIcon
        v-if="status !== 'running'"
        :icon="chevronRight"
        :size="14"
        class="tool-call-item__chevron"
      />
    </div>

    <!-- Expanded detail -->
    <div v-if="expanded && status !== 'running'" class="tool-call-item__detail">
      <div v-if="toolName" class="tool-call-detail__name">{{ toolName }}</div>
      <div v-if="args" class="tool-call-detail__args">{{ args }}</div>
      <div v-if="result" class="tool-call-detail__result">{{ result }}</div>
      <div v-if="error" class="tool-call-detail__error">{{ error }}</div>
    </div>
  </div>
</template>

<style scoped>
.tool-call-item {
  cursor: pointer;
  user-select: none;
}

.tool-call-item--running {
  cursor: default;
}

.tool-call-item__row {
  padding: var(--space-xxxs) 0;
}

.tool-call-item__label {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
}

.tool-call-item__chevron {
  color: var(--color-frame-border);
  flex-shrink: 0;
  transition: transform var(--duration-fast) var(--ease-default);
}

.tool-call-item.is-expanded .tool-call-item__chevron {
  transform: rotate(90deg);
}

/* Detail panel */
.tool-call-item__detail {
  padding: var(--space-xxs) 0 var(--space-xs) var(--space-xxxs);
  margin-inline-start: 0;
  border-inline-start: 2px solid var(--color-frame-border);
  padding-inline-start: var(--space-s);
}

.tool-call-detail__name {
  font-size: var(--font-size-xs);
  font-family: var(--font-family-mono);
  color: var(--color-frame-border);
  margin-block-end: var(--space-xxxs);
}

.tool-call-detail__args {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg-muted);
  line-height: var(--line-height-normal);
}

.tool-call-detail__result {
  font-size: var(--font-size-s);
  color: var(--color-status-running);
  margin-block-start: var(--space-xxxs);
}

.tool-call-detail__error {
  font-size: var(--font-size-s);
  color: var(--color-frame-danger);
  margin-block-start: var(--space-xxxs);
}

/* Error state */
.tool-call-item--error .tool-call-item__label {
  color: var(--color-frame-danger);
}

.tool-call-item--error .tool-call-item__chevron {
  color: var(--color-frame-danger);
}

.tool-call-item--error .tool-call-item__detail {
  border-inline-start-color: var(--color-frame-danger);
}

/* Spinner */
.tool-call-item__spinner {
  color: var(--color-frame-theme);
  flex-shrink: 0;
  animation: tool-call-spin 0.8s linear infinite;
}

@keyframes tool-call-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

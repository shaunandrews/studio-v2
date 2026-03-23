<script setup lang="ts">
import { ref } from 'vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import StreamingCode from '@/components/composites/StreamingCode.vue'
import { chevronRight } from '@wordpress/icons'
import type { ToolCallStatus } from '@/data/types'

const props = defineProps<{
  label: string
  status: ToolCallStatus
  toolName?: string
  args?: string
  result?: string
  error?: string
  code?: string
  changeId?: string
}>()

const emit = defineEmits<{
  undo: [changeId: string]
}>()

const expanded = ref(false)

function toggle() {
  expanded.value = !expanded.value
}

function onUndo(e: Event) {
  e.stopPropagation()
  if (props.changeId) emit('undo', props.changeId)
}
</script>

<template>
  <div
    class="tool-call-item"
    :class="[
      `tool-call-item--${status}`,
      { 'is-expanded': expanded },
    ]"
    role="button"
    tabindex="0"
    :aria-expanded="expanded"
    @click="toggle()"
    @keydown.enter="toggle()"
    @keydown.space.prevent="toggle()"
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

      <button
        v-if="status === 'done' && changeId"
        class="tool-call-item__undo"
        title="Undo this change"
        @click="onUndo"
      >
        Undo
      </button>

      <WPIcon
        :icon="chevronRight"
        :size="14"
        class="tool-call-item__chevron"
      />
    </div>

    <!-- Expanded detail (grid-row trick for animated height) -->
    <div class="tool-call-item__detail-wrapper">
      <div class="tool-call-item__detail" :class="{ 'tool-call-item__detail--code-only': code && !toolName && !args && !result && !error }">
        <div v-if="toolName" class="tool-call-detail__name">{{ toolName }}</div>
        <div v-if="args" class="tool-call-detail__args">{{ args }}</div>
        <div v-if="result" class="tool-call-detail__result">{{ result }}</div>
        <div v-if="error" class="tool-call-detail__error">{{ error }}</div>
        <StreamingCode
          v-if="code"
          :code="code"
          :active="expanded"
          :class="{ 'tool-call-detail__stream': true, 'tool-call-detail__stream--solo': !toolName && !args && !result && !error }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-call-item {
  cursor: pointer;
  user-select: none;
  margin-block-end: var(--space-xs);
}

.tool-call-item__row {
  padding: var(--space-xxxs) 0;
}

.tool-call-item__label {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
}

.tool-call-item__chevron {
  color: var(--color-frame-fg-muted);
  flex-shrink: 0;
  transition: transform var(--duration-fast) var(--ease-default);
}

.tool-call-item.is-expanded .tool-call-item__chevron {
  transform: rotate(90deg);
}

/* Detail panel — animated expand/collapse */
.tool-call-item__detail-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-moderate) var(--ease-default);
  overflow: hidden;
}

.tool-call-item.is-expanded .tool-call-item__detail-wrapper {
  grid-template-rows: 1fr;
}

.tool-call-item__detail {
  min-height: 0;
  padding: var(--space-s) var(--space-m);
  padding-inline-start: var(--space-s);
  border: 1px solid transparent;
  border-radius: var(--radius-m);
  margin-block-start: var(--space-xs);
  opacity: 0;
  transition:
    opacity var(--duration-fast) var(--ease-default),
    border-color var(--duration-moderate) var(--ease-default);
}

.tool-call-item.is-expanded .tool-call-item__detail {
  border-color: var(--color-frame-border);
  opacity: 1;
}

.tool-call-detail__stream {
  margin-block-start: var(--space-xs);
}

.tool-call-detail__stream--solo {
  margin-block-start: 0;
}

.tool-call-detail__name {
  font-size: var(--font-size-xs);
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg-muted);
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
  color: var(--color-frame-fg-muted);
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

/* Reverted state */
.tool-call-item--reverted .tool-call-item__label {
  text-decoration: line-through;
  color: var(--color-frame-fg-disabled);
}

.tool-call-item--reverted .tool-call-item__chevron {
  color: var(--color-frame-fg-disabled);
}

/* Undo button */
.tool-call-item__undo {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 var(--space-xxs);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-default);
}

.tool-call-item:hover .tool-call-item__undo {
  opacity: 1;
}

.tool-call-item__undo:hover {
  color: var(--color-frame-fg);
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

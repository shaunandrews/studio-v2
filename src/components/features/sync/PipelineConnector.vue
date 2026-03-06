<script setup lang="ts">
defineProps<{
  fromLabel: string
  toLabel: string
  toConnected: boolean
  dimmed?: boolean
}>()

defineEmits<{
  push: []
}>()
</script>

<template>
  <div class="connector" :class="{ 'connector--dimmed': dimmed }">
    <div class="connector__line" />
    <button
      class="connector__push-btn"
      :disabled="!toConnected"
      @click="$emit('push')"
    >
      Push {{ fromLabel }} to {{ toLabel }}
    </button>
    <svg class="connector__arrow" width="12" height="17" viewBox="0 0 12 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.8271 10.6963C11.12 10.9892 11.12 11.4649 10.8271 11.7578L6.05364 16.5303C5.76075 16.8232 5.28599 16.8232 4.9931 16.5303L0.21966 11.7578C-0.0732332 11.4649 -0.0732331 10.9892 0.21966 10.6963C0.512554 10.4034 0.98829 10.4034 1.28118 10.6963L4.77337 14.1895L4.77337 0L6.27337 0L6.27337 14.1895L9.76556 10.6963C10.0585 10.4034 10.5342 10.4034 10.8271 10.6963Z" fill="currentColor" />
    </svg>
  </div>
</template>

<style scoped>
.connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.connector__line {
  width: 1.5px;
  height: 16px;
  background: var(--color-frame-border);
}

.connector__push-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 26px;
  padding-inline: var(--space-xs);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg-secondary);
  font-family: inherit;
  font-size: var(--font-size-xs);
  line-height: 20px;
  cursor: pointer;
  white-space: nowrap;
  overflow: clip;
  transition:
    background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default),
    border-color var(--duration-instant) var(--ease-default);
}

.connector__push-btn:hover:not(:disabled) {
  background: var(--color-frame-bg-secondary);
  color: var(--color-frame-fg);
  border-color: var(--color-frame-fg-muted);
}

.connector__push-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.connector__arrow {
  color: var(--color-frame-border);
}

.connector--dimmed {
  opacity: 0.35;
}
</style>

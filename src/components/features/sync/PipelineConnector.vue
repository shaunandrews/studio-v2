<script setup lang="ts">
import Button from '@/components/primitives/Button.vue'

defineProps<{
  fromLabel: string
  toLabel: string
  fromConnected?: boolean
  toConnected: boolean
  dimmed?: boolean
}>()

defineEmits<{
  push: []
}>()
</script>

<template>
  <div class="connector" :class="{ 'connector--dimmed': dimmed }">
    <svg class="connector__arrow" width="12" height="17" viewBox="0 0 12 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.8271 10.6963C11.12 10.9892 11.12 11.4649 10.8271 11.7578L6.05364 16.5303C5.76075 16.8232 5.28599 16.8232 4.9931 16.5303L0.21966 11.7578C-0.0732332 11.4649 -0.0732331 10.9892 0.21966 10.6963C0.512554 10.4034 0.98829 10.4034 1.28118 10.6963L4.77337 14.1895L4.77337 0L6.27337 0L6.27337 14.1895L9.76556 10.6963C10.0585 10.4034 10.5342 10.4034 10.8271 10.6963Z" fill="currentColor" />
    </svg>
    <Button
      variant="secondary"
      size="small"
      :label="`Push ${fromLabel} to ${toLabel}`"
      :disabled="!toConnected || fromConnected === false"
      @click="$emit('push')"
    />
    <div class="connector__line" />
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

.connector__arrow {
  color: var(--color-frame-border);
  rotate: 180deg;
}

.connector--dimmed {
  opacity: 0.35;
}
</style>

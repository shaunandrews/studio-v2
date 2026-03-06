<script setup lang="ts">
import { chevronDownSmall } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'

defineProps<{
  label: string
  icon?: any
  iconUrl?: string
}>()

defineEmits<{
  click: []
  'secondary-click': []
}>()
</script>

<template>
  <div class="btn-split">
    <button class="btn-split__primary" @click="$emit('click')">
      <span v-if="iconUrl" class="btn-split__icon">
        <img :src="iconUrl" alt="" class="btn-split__icon-img" />
      </span>
      <WPIcon v-else-if="icon" :icon="icon" :size="16" class="btn-split__icon" />
      <span class="btn-split__label">{{ label }}</span>
    </button>
    <button class="btn-split__secondary" @click="$emit('secondary-click')">
      <WPIcon :icon="chevronDownSmall" :size="18" />
    </button>
  </div>
</template>

<style scoped>
.btn-split {
  display: inline-flex;
  align-items: stretch;
  height: 32px;
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  overflow: clip;
}

.btn-split__primary {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  padding-inline-start: 8px;
  padding-inline-end: 8px;
  border: none;
  background: none;
  color: var(--color-frame-fg);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--duration-instant) var(--ease-default);
}

.btn-split__primary:hover {
  background: var(--color-frame-bg-secondary);
}

.btn-split__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: var(--color-frame-fg-secondary);
}

.btn-split__icon-img {
  width: 16px;
  height: 16px;
  display: block;
}

.btn-split__label {
  padding-inline-end: 2px;
}

.btn-split__secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  border: none;
  border-inline-start: 1px solid var(--color-frame-border);
  background: none;
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--duration-instant) var(--ease-default);
}

.btn-split__secondary:hover {
  background: var(--color-frame-bg-secondary);
  color: var(--color-frame-fg-secondary);
}
</style>

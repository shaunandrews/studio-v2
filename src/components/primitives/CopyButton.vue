<script setup lang="ts">
import { ref } from 'vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { copy as copyIcon, check as checkIcon } from '@wordpress/icons'

const props = withDefaults(defineProps<{
  text: string
  label?: string
  size?: number
}>(), {
  label: 'Copy',
  size: 20,
})

const copied = ref(false)

function copy() {
  navigator.clipboard.writeText(props.text)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}
</script>

<template>
  <Tooltip :text="copied ? 'Copied!' : label" placement="top">
    <button class="copy-button" @click="copy">
      <WPIcon :icon="copied ? checkIcon : copyIcon" :size="size" />
    </button>
  </Tooltip>
</template>

<style scoped>
.copy-button {
  background: none;
  border: none;
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  padding: var(--space-xxxs);
  border-radius: var(--radius-s);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--duration-instant) var(--ease-default);
}

.copy-button:hover {
  color: var(--color-frame-fg);
}
</style>

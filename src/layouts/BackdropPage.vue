<script setup lang="ts">
import { close, chevronLeft } from '@wordpress/icons'
import Button from '@/components/primitives/Button.vue'
import { useOperatingSystem } from '@/data/useOperatingSystem'

const { isWindows } = useOperatingSystem()

withDefaults(defineProps<{
  /** Show a back button instead of close */
  showBack?: boolean
  /** Hide the header entirely */
  hideHeader?: boolean
}>(), {
  showBack: false,
  hideHeader: false,
})

defineEmits<{
  close: []
  back: []
}>()
</script>

<template>
  <div class="backdrop-page">
    <slot name="background" />

    <header v-if="!hideHeader" class="backdrop-header hstack" :class="{ 'has-traffic-lights': !isWindows }">
      <Button
        v-if="showBack"
        :icon="chevronLeft"
        label="Back"
        variant="tertiary"
        surface="dark"
        @click="$emit('back')"
      />
      <Button
        v-else
        :icon="close"
        variant="tertiary"
        surface="dark"
        @click="$emit('close')"
      />
    </header>

    <div class="backdrop-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.backdrop-page {
  position: absolute;
  inset: 0;
  background: var(--color-chrome-bg);
  color: var(--color-chrome-fg);
  overflow: hidden;
}

.backdrop-header {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  z-index: 2;
  height: 56px;
  padding: 0 var(--space-m);
  align-items: center;
  pointer-events: none;
}

/* macOS: position below traffic lights */
.backdrop-header.has-traffic-lights {
  inset-block-start: 40px; /* Physical: below traffic lights (18px top + 12px dots + 10px gap) */
  padding-inline-start: var(--space-m);
}

/* Let the button itself receive clicks */
.backdrop-header :deep(*) {
  pointer-events: auto;
}

.backdrop-content {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  /* Pages provide their own padding-top to clear the header area */
}
</style>

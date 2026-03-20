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
  /** Hide the close button (e.g. new user with no sites to go back to) */
  hideClose?: boolean
}>(), {
  showBack: false,
  hideHeader: false,
  hideClose: false,
})

defineEmits<{
  close: []
  back: []
}>()
</script>

<template>
  <div class="backdrop-page">
    <slot name="background" />

    <header v-if="!hideHeader" class="backdrop-header hstack" :class="{ 'has-traffic-lights': !isWindows, 'has-windows-titlebar': isWindows }">
      <Button
        v-if="showBack"
        :icon="chevronLeft"
        label="Back"
        variant="tertiary"
        surface="dark"
        @click="$emit('back')"
      />
      <Button
        v-else-if="!hideClose"
        :icon="close"
        label="Close"
        variant="tertiary"
        surface="dark"
        @click="$emit('close')"
      />
    </header>

    <div class="backdrop-content vstack">
      <slot />
    </div>

    <slot name="footer" />
  </div>
</template>

<style scoped>
.backdrop-page {
  position: absolute;
  inset: 0;
  background: var(--color-chrome-bg);
  color: var(--color-chrome-fg);
  overflow-y: auto;
}

.backdrop-header {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  z-index: 2;
  height: 56px;
  padding: 0 var(--space-m);
  pointer-events: none;
}

/* macOS: position below traffic lights */
.backdrop-header.has-traffic-lights {
  inset-block-start: 40px; /* Physical: below traffic lights (18px top + 12px dots + 10px gap) */
  padding-inline-start: var(--space-m);
}

/* Windows: position below titlebar */
.backdrop-header.has-windows-titlebar {
  inset-block-start: 36px; /* Physical: WindowsTitlebar height */
}

/* Let the button itself receive clicks */
.backdrop-header :deep(*) {
  pointer-events: auto;
}

.backdrop-content {
  position: relative;
  min-height: 100%;
  z-index: 1;
  /* Pages provide their own padding-top to clear the header area */
}
</style>

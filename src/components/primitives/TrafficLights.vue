<script setup lang="ts">
/**
 * macOS window traffic lights (close, minimize, maximize).
 * Decorative only — no click handlers. Positioning is the parent's job.
 */
withDefaults(defineProps<{
  /** Dim minimize/maximize to indicate non-functional state */
  dimmed?: boolean
}>(), {
  dimmed: false,
})
</script>

<template>
  <div class="traffic-lights" aria-hidden="true">
    <span class="traffic-light traffic-light--close" />
    <span class="traffic-light traffic-light--minimize" :class="{ 'traffic-light--dimmed': dimmed }" />
    <span class="traffic-light traffic-light--maximize" :class="{ 'traffic-light--dimmed': dimmed }" />
  </div>
</template>

<style scoped>
.traffic-lights {
  display: flex;
  align-items: center;
  gap: 8px; /* OS-native spacing — intentional, not on grid */
}

.traffic-light {
  width: 12px; /* OS-native size — intentional, not on grid */
  height: 12px;
  border-radius: 50%;
}

.traffic-light--close { background: var(--color-macos-close); }
.traffic-light--minimize { background: var(--color-macos-minimize); }
.traffic-light--maximize { background: var(--color-macos-maximize); }

.traffic-light--dimmed {
  background: var(--color-frame-border);
}
</style>

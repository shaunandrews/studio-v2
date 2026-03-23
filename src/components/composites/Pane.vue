<script setup lang="ts">
withDefaults(defineProps<{
  /** Enable vertical scrolling on the body */
  scrollable?: boolean
  /** Constrain content to max-width 680px, centered */
  centered?: boolean
  /** Add standard content padding (default true when centered) */
  padded?: boolean
}>(), {
  scrollable: true,
  centered: false,
  padded: undefined,
})
</script>

<template>
  <div class="pane">
    <div v-if="$slots.header" class="pane__header">
      <slot name="header" />
    </div>
    <div class="pane__body" :class="{ 'pane__body--scrollable': scrollable }">
      <div
        class="pane__content"
        :class="{
          'pane__content--centered': centered,
          'pane__content--padded': padded ?? centered,
        }"
      >
        <slot />
      </div>
    </div>
    <div v-if="$slots.footer" class="pane__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Header (fixed top) ── */

.pane__header {
  flex-shrink: 0;
}

/* ── Body (scrollable middle) ── */

.pane__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pane__body--scrollable {
  overflow-y: auto;
}

/* ── Content ── */

.pane__content {
  width: 100%;
  margin-block: auto;
}

.pane__body--scrollable .pane__content {
  margin-block: 0;
}

.pane__content--centered {
  max-width: 680px;
}

.pane__content--padded {
  padding: var(--space-m) var(--space-l) var(--space-l);
}

/* ── Footer (fixed bottom) ── */

.pane__footer {
  flex-shrink: 0;
}
</style>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** Enable vertical scrolling */
  scrollable?: boolean
  /** Constrain content to max-width 680px, centered */
  centered?: boolean
  /** Add standard content padding (default true when centered) */
  padded?: boolean
  /** Size to content instead of flex-growing */
  fit?: boolean
}>(), {
  scrollable: false,
  centered: false,
  padded: undefined,
  fit: false,
})

const hasWrapper = computed(() => props.centered || (props.padded ?? false))
</script>

<script lang="ts">
import { computed } from 'vue'
</script>

<template>
  <div
    class="pane"
    :class="{
      'pane--fit': fit,
      'pane--scrollable': scrollable,
    }"
  >
    <div
      v-if="hasWrapper"
      class="pane__content"
      :class="{
        'pane__content--centered': centered,
        'pane__content--padded': padded ?? centered,
      }"
    >
      <slot />
    </div>
    <slot v-else />
  </div>
</template>

<style scoped>
.pane {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.pane--fit {
  flex: none;
}

.pane--scrollable {
  overflow-y: auto;
}

/* ── Content wrapper (only when centered/padded) ── */

.pane__content {
  width: 100%;
  margin-block: auto;
}

.pane--scrollable .pane__content {
  margin-block: 0;
}

.pane__content--centered {
  max-width: 680px;
  margin-inline: auto;
}

.pane__content--padded {
  padding: var(--space-m) var(--space-l) var(--space-l);
}
</style>

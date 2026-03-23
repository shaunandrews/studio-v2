<script setup lang="ts">
withDefaults(defineProps<{
  /** Stack direction */
  direction?: 'horizontal' | 'vertical'
  /** Size to content instead of flex-growing */
  fit?: boolean
}>(), {
  direction: 'vertical',
  fit: false,
})
</script>

<template>
  <div class="pane-group" :class="[`pane-group--${direction}`, { 'pane-group--fit': fit }]">
    <slot />
  </div>
</template>

<style scoped>
.pane-group {
  display: flex;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.pane-group--vertical {
  flex-direction: column;
}

.pane-group--horizontal {
  flex-direction: row;
}

.pane-group--fit {
  flex: none;
}
</style>

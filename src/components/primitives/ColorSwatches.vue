<script setup lang="ts">
export interface SwatchColor {
  name?: string
  value?: string
  hex?: string
}

withDefaults(defineProps<{
  colors: SwatchColor[]
  size?: 'small' | 'medium'
  /** Border color for swatch outlines — defaults to semi-transparent black */
  borderColor?: string
  /** Max number of swatches to show */
  limit?: number
}>(), {
  size: 'small',
  borderColor: 'rgba(0, 0, 0, 0.15)',
  limit: 8,
})

function colorValue(color: SwatchColor): string {
  return color.value || color.hex || '#ccc'
}
</script>

<template>
  <div class="color-swatches" :class="`color-swatches--${size}`">
    <div
      v-for="(color, i) in colors.slice(0, limit)"
      :key="i"
      class="color-swatches__item"
    >
      <div
        class="color-swatches__dot"
        :style="{
          background: colorValue(color),
          borderColor: borderColor,
        }"
        :title="color.name ? `${color.name}: ${colorValue(color)}` : colorValue(color)"
      />
      <span v-if="size === 'medium' && color.name" class="color-swatches__label">
        {{ color.name }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xxxs);
}

/* --- Small (brief picker inline) --- */
.color-swatches--small .color-swatches__dot {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-s);
  border: 1px solid;
}

/* --- Medium (color palette card) --- */
.color-swatches--medium {
  gap: var(--space-xs);
}

.color-swatches--medium .color-swatches__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxxs);
}

.color-swatches--medium .color-swatches__dot {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-s);
  border: 1px solid;
}

.color-swatches__label {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-secondary);
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}
</style>

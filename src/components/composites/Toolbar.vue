<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  size?: 'default' | 'mini'
}>(), {
  size: 'default',
})
</script>

<template>
  <div class="toolbar hstack align-center" :class="`toolbar--${size}`">
    <div class="toolbar__start hstack align-center gap-xxs">
      <slot name="start">
        <span v-if="title" class="toolbar__title">{{ title }}</span>
      </slot>
    </div>
    <div v-if="$slots.center" class="toolbar__center hstack align-center" :style="{ height: '100%' }">
      <slot name="center" />
    </div>
    <div v-if="$slots.end" class="toolbar__end hstack align-center gap-xxs">
      <slot name="end" />
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  justify-content: space-between;
  padding-inline-start: var(--space-l);
  padding-inline-end: var(--space-xs);
  border-block-end: 1px solid var(--color-frame-border);
  flex-shrink: 0;
}

.toolbar__start,
.toolbar__end {
  flex: 1;
  min-width: 0;
}

.toolbar__end {
  justify-content: flex-end;
}

.toolbar--default {
  height: 56px;
}

.toolbar--mini {
  height: 48px;
}

.toolbar__title {
  font-size: var(--font-size-m);
  font-weight: 600;
  color: var(--color-frame-fg);
}
</style>

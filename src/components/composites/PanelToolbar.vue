<script setup lang="ts">
</script>

<template>
  <div class="panel-toolbar hstack gap-xxs px-xxs py-xxs">
    <div v-if="$slots.start" class="panel-toolbar-start hstack gap-xxxs min-w-0" :class="{ 'flex-1': !$slots.center }">
      <slot name="start" />
    </div>
    <div v-if="$slots.center" class="panel-toolbar-center hstack flex-1 min-w-0">
      <slot name="center" />
    </div>
    <div v-if="$slots.end" class="panel-toolbar-end hstack gap-xxxs">
      <slot name="end" />
    </div>
    <slot />
  </div>
</template>

<style scoped>
.panel-toolbar {
  border-block-end: 1px solid var(--color-frame-border);
  flex-shrink: 0;
  align-items: center;
}
</style>

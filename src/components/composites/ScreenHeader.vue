<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="screen-header">
    <div class="screen-header__row">
      <div class="screen-header__text">
        <p class="screen-header__title">{{ title }}</p>
        <p v-if="subtitle" class="screen-header__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="screen-header__actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.screen-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.screen-header__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-m);
}

.screen-header__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.screen-header__actions {
  flex-shrink: 0;
}

.screen-header__title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin: 0;
}

.screen-header__subtitle {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-secondary);
  margin: 0;
}
</style>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  surface?: 'light' | 'dark'
  /** Remove card padding/gap — use when card contains its own padded groups */
  grouped?: boolean
}>(), {
  surface: 'light',
  grouped: false,
})
</script>

<template>
  <section class="settings-section-wrap" :class="{ 'surface-dark': surface === 'dark' }">
    <div v-if="$slots.header || title" class="settings-section__header">
      <slot name="header">
        <h3 class="settings-section__title">{{ title }}</h3>
      </slot>
    </div>
    <div class="settings-section__card" :class="{ 'settings-section__card--grouped': grouped }">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.settings-section-wrap {
  background: var(--color-frame-fill);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  overflow: clip;
}

.settings-section-wrap.surface-dark {
  background: var(--color-chrome-fill);
  border-color: var(--color-chrome-border);
}

.settings-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px; /* Consistent height whether action button present or not */
  padding: 0 var(--space-m);
}

.settings-section__title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}

.surface-dark .settings-section__title {
  color: var(--color-chrome-fg-muted);
}

.settings-section__card {
  background: var(--color-frame-bg);
  border-block-start: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.07);
  padding: var(--space-m);
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.settings-section__card--grouped {
  padding: 0;
  gap: 0;
  overflow: hidden;
}

.surface-dark .settings-section__card {
  background: var(--color-chrome-bg);
  border-block-start-color: var(--color-chrome-border);
  box-shadow: none;
}
</style>

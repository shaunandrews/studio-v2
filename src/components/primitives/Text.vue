<script setup lang="ts">
defineProps<{
  variant?: 'body' | 'body-large' | 'caption' | 'label'
  tag?: string
  color?: 'default' | 'secondary' | 'muted' | 'inherit'
  weight?: 'regular' | 'medium' | 'semibold'
}>()
</script>

<template>
  <component
    :is="tag || 'span'"
    class="text"
    :class="[
      `text--${variant || 'body'}`,
      color ? `text--${color}` : '',
      weight ? `text--${weight}` : '',
    ]"
  >
    <slot />
  </component>
</template>

<style scoped>
.text { margin: 0; }

/* Variants */
.text--body {
  font-size: var(--font-size-l);
  line-height: var(--line-height-normal);
}

.text--body-large {
  font-size: var(--font-size-xl);
  line-height: var(--line-height-normal);
}

.text--caption {
  font-size: var(--font-size-s);
  line-height: var(--line-height-normal);
}

.text--label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: var(--line-height-tight);
}

/* Colors */
.text--default { color: var(--color-text); }
.text--secondary { color: var(--color-text-secondary); }
.text--muted { color: var(--color-text-muted); }
.text--inherit { color: inherit; }

/* Weights */
.text--regular { font-weight: var(--font-weight-regular); }
.text--medium { font-weight: var(--font-weight-medium); }
.text--semibold { font-weight: var(--font-weight-semibold); }
</style>

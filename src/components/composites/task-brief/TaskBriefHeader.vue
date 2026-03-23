<script setup lang="ts">
import Text from '@/components/primitives/Text.vue'

const props = defineProps<{
  branch?: string
  title: string
}>()
</script>

<template>
  <div class="brief-header hstack justify-between">
    <Text
      tag="h2"
      variant="body"
      weight="semibold"
      class="brief-title"
      :title="title"
    >{{ title }}</Text>

    <Text v-if="branch" variant="body-small" class="brief-branch" :title="branch">
      {{ branch }}
    </Text>
  </div>
</template>

<style scoped>
.brief-header {
  padding: var(--space-xs) var(--space-s);
  border-start-start-radius: var(--radius-m);
  border-start-end-radius: var(--radius-m);
}

.brief-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-inline-size: 0;
}

/* Branch name */
.brief-branch {
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg-muted);
  word-break: break-all;
}
</style>

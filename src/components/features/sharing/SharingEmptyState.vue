<script setup lang="ts">
import EmptyState from '@/components/composites/EmptyState.vue'

defineEmits<{
  create: []
}>()
</script>

<template>
  <EmptyState
    heading="Share your site"
    subtext="Get feedback from anyone, anywhere with a free hosted link powered by WordPress.com."
    action-label="Create share link"
    @action="$emit('create')"
  >
    <template #illustration>
      <div class="preview-card preview-card--back"></div>
      <div class="preview-card preview-card--front">
        <div class="preview-dot"></div>
        <div class="preview-line"></div>
      </div>
    </template>
  </EmptyState>
</template>

<style scoped>
.preview-card {
  position: absolute;
  width: 140px;
  height: 60px;
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.preview-card--back {
  inset-block-start: 15px;
  inset-inline-start: 40px;
  opacity: 0.5;
}

.preview-card--front {
  inset-block-end: 15px;
  inset-inline-end: 40px;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-s);
}

.preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-frame-theme);
  opacity: 0.6;
  flex-shrink: 0;
}

.preview-line {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--color-frame-border);
}
</style>

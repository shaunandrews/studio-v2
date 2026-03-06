<script setup lang="ts">
import Button from '@/components/primitives/Button.vue'

defineEmits<{
  create: []
}>()
</script>

<template>
  <div class="previews-empty">
    <div class="previews-empty__illustration">
      <div class="previews-empty__card previews-empty__card--back"></div>
      <div class="previews-empty__card previews-empty__card--front">
        <div class="previews-empty__dot"></div>
        <div class="previews-empty__line"></div>
      </div>
    </div>

    <div class="previews-empty__message">
      <div class="previews-empty__copy">
        <p class="previews-empty__heading">Share a preview of your site</p>
        <p class="previews-empty__subtext">
          Get feedback from anyone, anywhere with a free hosted preview powered by WordPress.com.
        </p>
      </div>

      <Button
        variant="primary"
        label="Create preview site"
        @click="$emit('create')"
      />
    </div>
  </div>
</template>

<style scoped>
.previews-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xxl);
  padding: var(--space-m) var(--space-l);
}

/* ── Illustration ── */

.previews-empty__illustration {
  position: relative;
  width: 320px;
  height: 114px;
  border-radius: var(--radius-l);
  background:
    radial-gradient(ellipse 320px 114px at center, transparent 60%, rgba(0, 0, 0, 0.06) 100%),
    rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.previews-empty__card {
  position: absolute;
  width: 140px;
  height: 60px;
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.previews-empty__card--back {
  inset-block-start: 15px;
  inset-inline-start: 40px;
  opacity: 0.5;
}

.previews-empty__card--front {
  inset-block-end: 15px;
  inset-inline-end: 40px;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-s);
}

.previews-empty__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
  opacity: 0.6;
  flex-shrink: 0;
}

.previews-empty__line {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--color-frame-border);
}

/* ── Message ── */

.previews-empty__message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-m);
  width: 100%;
}

.previews-empty__copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

.previews-empty__heading {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin: 0;
}

.previews-empty__subtext {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-secondary);
  margin: 0;
}
</style>

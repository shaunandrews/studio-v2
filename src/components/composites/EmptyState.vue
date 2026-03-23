<script setup lang="ts">
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'

defineProps<{
  heading: string
  subtext: string
  actionLabel: string
}>()

defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__illustration">
      <slot name="illustration" />
    </div>

    <div class="empty-state__message">
      <div class="empty-state__copy">
        <Text tag="p" variant="body-small" weight="semibold">{{ heading }}</Text>
        <Text tag="p" variant="body-small" color="muted">{{ subtext }}</Text>
      </div>

      <Button
        variant="primary"
        :label="actionLabel"
        @click="$emit('action')"
      />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xxl);
  padding: var(--space-m) var(--space-l);
}

.empty-state__illustration {
  position: relative;
  width: 320px;
  height: 114px;
  border-radius: var(--radius-l);
  background:
    radial-gradient(ellipse 320px 114px at center, transparent 60%, rgba(0, 0, 0, 0.06) 100%),
    rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.empty-state__message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-m);
  width: 100%;
  max-width: 400px;
}

.empty-state__copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  text-align: center;
}
</style>

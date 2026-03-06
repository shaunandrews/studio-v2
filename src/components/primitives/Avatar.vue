<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  size?: 'small' | 'default' | 'large'
  fallback?: string
}>(), {
  size: 'default',
})

const imgError = ref(false)

const sizeMap = { small: '20px', default: '32px', large: '48px' }
</script>

<template>
  <div class="avatar" :style="{ width: sizeMap[size], height: sizeMap[size] }">
    <img
      v-if="src && !imgError"
      :src="src"
      :alt="alt || ''"
      class="avatar__img"
      @error="imgError = true"
    />
    <span v-else class="avatar__fallback">{{ fallback || '?' }}</span>
  </div>
</template>

<style scoped>
.avatar {
  border-radius: var(--radius-s);
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-secondary);
}

.avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar__fallback {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
}
</style>

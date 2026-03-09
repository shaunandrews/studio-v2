<script setup lang="ts">
import { computed } from 'vue'
import { wordpress } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'

const props = withDefaults(defineProps<{
  favicon?: string
  siteName: string
  size?: number
}>(), {
  size: 24,
})

const palette = [
  '#E8D5B7', // warm sand
  '#B8D4E3', // sky blue
  '#D4C5E2', // soft lavender
  '#C5DEB8', // sage green
  '#F2D76B', // golden yellow
  '#E2B8B8', // dusty rose
  '#B8E6D4', // mint
  '#D4B8A0', // clay
  '#A8C8E8', // periwinkle
  '#E8C8A8', // peach
]

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

const bgColor = computed(() => palette[hashName(props.siteName) % palette.length])
const iconSize = computed(() => Math.round(props.size * 0.6))
</script>

<template>
  <div
    class="site-icon"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: 'var(--radius-s)',
    }"
  >
    <img
      v-if="favicon"
      class="site-icon-img"
      :src="favicon"
      :width="size"
      :height="size"
      alt=""
    />
    <div
      v-else
      class="site-icon-fallback"
      :style="{ background: bgColor }"
    >
      <WPIcon :icon="wordpress" :size="iconSize" />
    </div>
  </div>
</template>

<style scoped>
.site-icon {
  overflow: hidden;
  flex-shrink: 0;
}

.site-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.site-icon-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.6);
}
</style>

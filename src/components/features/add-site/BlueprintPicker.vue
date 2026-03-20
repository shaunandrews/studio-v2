<script setup lang="ts">
import { ref } from 'vue'
import { upload } from '@wordpress/icons'
import Button from '@/components/primitives/Button.vue'

export interface Blueprint {
  id: string
  title: string
  description: string
  thumbnail?: string
  preferredPhp?: string
  preferredWp?: string
}

defineProps<{
  blueprints: Blueprint[]
}>()

const emit = defineEmits<{
  select: [blueprint: Blueprint]
}>()

const selectedId = ref<string | null>(null)

function select(bp: Blueprint) {
  selectedId.value = bp.id
  emit('select', bp)
}
</script>

<template>
  <div class="blueprint-picker vstack gap-l">
    <div class="picker-top vstack gap-xs">
      <h1 class="picker-heading">Start from a Blueprint</h1>
      <p class="picker-subtitle">Create a new site from a featured Blueprint on your own. <a href="https://developer.wordpress.com/docs/developer-tools/studio/blueprints/" target="_blank" rel="noopener" class="picker-link">Learn more</a></p>
    </div>

    <div class="blueprint-grid">
      <button
        v-for="bp in blueprints"
        :key="bp.id"
        class="blueprint-card vstack"
        :class="{ 'is-selected': bp.id === selectedId }"
        @click="select(bp)"
      >
        <div class="blueprint-thumb">
          <img v-if="bp.thumbnail" :src="bp.thumbnail" :alt="bp.title" />
          <div v-else class="blueprint-thumb-placeholder" />
        </div>
        <div class="blueprint-info vstack gap-xs">
          <span class="blueprint-title">{{ bp.title }}</span>
          <span class="blueprint-desc">{{ bp.description }}</span>
        </div>
      </button>
    </div>

    <div class="picker-footer hstack justify-center">
      <Button
        :icon="upload"
        label="Choose Blueprint file"
        variant="secondary"
        surface="dark"
        size="small"
      />
    </div>
  </div>
</template>

<style scoped>
.blueprint-picker {
  width: 100%;
}

.picker-top {
  text-align: center;
}

.picker-heading {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg);
  margin: 0;
}

.picker-subtitle {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  margin: 0;
}

.picker-link {
  color: var(--color-chrome-theme);
  text-decoration: none;
}

.picker-link:hover {
  text-decoration: underline;
}

.blueprint-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-s);
}

.blueprint-card {
  background: var(--color-chrome-fill);
  border: 1px solid var(--color-chrome-border);
  border-radius: var(--radius-m);
  overflow: hidden;
  cursor: pointer;
  text-align: start;
  padding: 0;
  font-family: inherit;
  transition:
    border-color var(--transition-hover),
    box-shadow var(--transition-hover);
}


.blueprint-card.is-selected {
  border-color: transparent;
  box-shadow: 0 0 0 2px var(--color-chrome-theme);
}

.blueprint-thumb {
  aspect-ratio: 16 / 10;
  background: var(--color-chrome-hover);
  overflow: hidden;
}

.blueprint-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-fast) var(--ease-default);
}

.blueprint-card:hover .blueprint-thumb img {
  transform: scale(1.2);
}

.blueprint-thumb-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-chrome-hover) 0%, var(--color-chrome-border) 100%);
}

.blueprint-info {
  padding: var(--space-m);
}

.blueprint-title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg);
}

.blueprint-desc {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  line-height: 1.5;
}
</style>

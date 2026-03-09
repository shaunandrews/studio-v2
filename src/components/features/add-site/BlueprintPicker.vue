<script setup lang="ts">
import { ref, computed } from 'vue'
import { search } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'

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

const query = ref('')
const selectedId = ref<string | null>(null)

function select(bp: Blueprint) {
  selectedId.value = bp.id
  emit('select', bp)
}
</script>

<template>
  <div class="blueprint-picker vstack gap-m">
    <div class="search-bar">
      <WPIcon :icon="search" :size="20" class="search-icon" />
      <input
        v-model="query"
        class="search-input"
        type="text"
        placeholder="Search blueprints..."
      />
    </div>

    <div class="blueprint-grid">
      <button
        v-for="bp in blueprints.filter(b => !query || b.title.toLowerCase().includes(query.toLowerCase()))"
        :key="bp.id"
        class="blueprint-card"
        :class="{ 'is-selected': bp.id === selectedId }"
        @click="select(bp)"
      >
        <div class="blueprint-thumb">
          <img v-if="bp.thumbnail" :src="bp.thumbnail" :alt="bp.title" />
          <div v-else class="blueprint-thumb-placeholder" />
        </div>
        <div class="blueprint-info vstack gap-xxxs">
          <span class="blueprint-title">{{ bp.title }}</span>
          <span class="blueprint-desc">{{ bp.description }}</span>
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.blueprint-picker {
  width: 100%;
}

.search-bar {
  position: relative;
}

.search-icon {
  position: absolute;
  inset-inline-start: var(--space-xs);
  inset-block-start: 50%;
  transform: translateY(-50%);
  color: var(--color-chrome-fg-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-xs) 0 calc(var(--space-xs) + 24px);
  border: 1px solid var(--color-chrome-border);
  border-radius: var(--radius-s);
  background: var(--color-chrome-fill);
  color: var(--color-chrome-fg);
  font-family: inherit;
  font-size: var(--font-size-m);
  outline: none;
  transition: border-color var(--transition-hover);
}

.search-input:focus {
  border-color: var(--color-chrome-theme);
  box-shadow: 0 0 0 1px var(--color-chrome-theme);
}

.search-input::placeholder {
  color: var(--color-chrome-fg-muted);
}

.blueprint-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-s);
}

.blueprint-card {
  display: flex;
  flex-direction: column;
  background: var(--color-chrome-fill);
  border: 2px solid var(--color-chrome-border);
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

.blueprint-card:hover {
  border-color: var(--color-chrome-fg-muted);
}

.blueprint-card.is-selected {
  border-color: var(--color-chrome-theme);
  box-shadow: 0 0 0 1px var(--color-chrome-theme);
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
}

.blueprint-thumb-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-chrome-hover) 0%, var(--color-chrome-border) 100%);
}

.blueprint-info {
  padding: var(--space-xs) var(--space-s);
}

.blueprint-title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  color: var(--color-chrome-fg);
}

.blueprint-desc {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

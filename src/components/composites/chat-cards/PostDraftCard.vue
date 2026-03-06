<script setup lang="ts">
import { computed } from 'vue'
import Badge from '../../primitives/Badge.vue'
import ChatCard from './ChatCard.vue'
import type { CardUiState, PostDraftCardData } from '@/data/types'

const props = withDefaults(defineProps<{
  data: PostDraftCardData
  compact?: boolean
  state?: CardUiState
}>(), {
  compact: false,
  state: 'default',
})


const statusVariant = computed(() => {
  if (props.data.status === 'published') return 'success'
  if (props.data.status === 'pending') return 'warning'
  return 'default'
})

const statusLabel = computed(() => {
  const map: Record<PostDraftCardData['status'], string> = {
    draft: 'Draft',
    pending: 'Pending Review',
    published: 'Published',
  }
  return map[props.data.status]
})
</script>

<template>
  <ChatCard :compact="compact" :state="state">
    <template #header>
      <div class="hstack justify-between gap-xs">
        <strong class="post-title">{{ data.title }}</strong>
        <Badge :label="statusLabel" :variant="statusVariant" />
      </div>
    </template>

    <div v-if="!compact" class="vstack gap-xxs">
      <p class="post-excerpt">{{ data.excerpt }}</p>
      <div v-if="data.categories?.length || data.tags?.length" class="post-taxonomy hstack gap-xxs flex-wrap">
        <span v-for="cat in data.categories" :key="cat" class="taxonomy-pill taxonomy-pill--category">{{ cat }}</span>
        <span v-for="tag in data.tags" :key="tag" class="taxonomy-pill taxonomy-pill--tag">{{ tag }}</span>
      </div>
    </div>

  </ChatCard>
</template>

<style scoped>
.post-title {
  line-height: var(--line-height-tight);
}

.post-excerpt {
  color: var(--color-text-secondary);
  font-size: var(--font-size-s);
  line-height: var(--line-height-normal);
}

.taxonomy-pill {
  font-size: var(--font-size-xs);
  padding: 1px var(--space-xxs);
  border-radius: var(--radius-s);
  line-height: var(--line-height-normal);
}

.taxonomy-pill--category {
  background: var(--color-surface-secondary);
  color: var(--color-text-secondary);
}

.taxonomy-pill--tag {
  background: transparent;
  border: 1px solid var(--color-surface-border);
  color: var(--color-text-muted);
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import Badge from '../../primitives/Badge.vue'
import ChatCard from './ChatCard.vue'
import type { CardUiState, PageCardData } from '@/data/types'

const props = withDefaults(defineProps<{
  data: PageCardData
  state?: CardUiState
}>(), {
  state: 'default',
})

const displaySlug = computed(() => {
  const raw = props.data.slug
  return raw.startsWith('/') ? raw : `/${raw}`
})

const statusVariant = computed(() => {
  if (props.data.status === 'published') return 'success'
  if (props.data.status === 'scheduled') return 'warning'
  return 'default'
})

const statusLabel = computed(() => {
  const map: Record<PageCardData['status'], string> = {
    draft: 'Draft',
    published: 'Published',
    scheduled: 'Scheduled',
  }
  return map[props.data.status]
})
</script>

<template>
  <ChatCard :state="state">
    <template #header>
      <div class="hstack justify-between gap-xs">
        <div class="vstack gap-xxxs min-w-0">
          <strong class="page-title">{{ data.title }}</strong>
          <span class="page-slug">{{ displaySlug }}</span>
        </div>
        <Badge :label="statusLabel" :variant="statusVariant" />
      </div>
    </template>

    <div class="vstack gap-xxs">
      <span v-if="data.template" class="page-meta">Template: {{ data.template }}</span>
      <p v-if="data.excerpt" class="page-excerpt">{{ data.excerpt }}</p>
    </div>

  </ChatCard>
</template>

<style scoped>
.page-title {
  line-height: var(--line-height-tight);
}

.page-slug {
  color: var(--color-text-muted);
  font-size: var(--font-size-s);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
}

.page-meta {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.page-excerpt {
  color: var(--color-text-secondary);
  font-size: var(--font-size-s);
  line-height: var(--line-height-normal);
}
</style>

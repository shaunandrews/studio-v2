<script setup lang="ts">
import { computed } from 'vue'
import { page, post, plugins, blockDefault, navigation, settings, file, calendar, code, globe, plus, pencil, trash } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import type { ChangedFile, ChangedEntity } from '@/data/types'

const props = defineProps<{
  changedFiles?: ChangedFile[]
  changedEntities?: ChangedEntity[]
}>()

interface Chip {
  key: string
  label: string
  icon: any
  changeIcon: any
}

const entityIconMap: Record<string, any> = {
  page,
  post,
  plugin: plugins,
  block: blockDefault,
  menu: navigation,
  option: settings,
  event: calendar,
  endpoint: code,
}

const changeIconMap: Record<string, any> = {
  added: plus,
  created: plus,
  activated: plus,
  modified: pencil,
  updated: pencil,
  deleted: trash,
  deactivated: trash,
}

function fileBasename(path: string) {
  return path.split('/').pop() ?? path
}

const chips = computed<Chip[]>(() => {
  const result: Chip[] = []

  if (props.changedEntities) {
    for (const entity of props.changedEntities) {
      result.push({
        key: `entity-${entity.name}-${entity.entityType}`,
        label: entity.name,
        icon: entityIconMap[entity.entityType] ?? globe,
        changeIcon: changeIconMap[entity.action] ?? pencil,
      })
    }
  }

  if (props.changedFiles) {
    for (const f of props.changedFiles) {
      result.push({
        key: `file-${f.path}`,
        label: fileBasename(f.path),
        icon: file,
        changeIcon: changeIconMap[f.type] ?? pencil,
      })
    }
  }

  return result
})
</script>

<template>
  <div v-if="chips.length > 0" class="brief-chips hstack gap-xxs">
    <span
      v-for="chip in chips"
      :key="chip.key"
      class="brief-chip hstack gap-xxxs"
    >
      <WPIcon :icon="chip.icon" :size="14" class="brief-chip__icon" />
      <span class="brief-chip__label">{{ chip.label }}</span>
      <WPIcon :icon="chip.changeIcon" :size="14" class="brief-chip__change" />
    </span>
  </div>
  <span v-else class="brief-chips-empty">No changes yet</span>
</template>

<style scoped>
.brief-chips {
  flex-wrap: wrap;
}

.brief-chip {
  align-items: center;
  padding: var(--space-xxxs) var(--space-xxs);
  border-radius: var(--radius-s);
  background: var(--color-frame-fill);
  border: 1px solid var(--color-frame-border);
  font-size: var(--font-size-xs);
  line-height: 1;
  white-space: nowrap;
  color: var(--color-frame-fg);
}

.brief-chip__icon {
  flex-shrink: 0;
  color: var(--color-frame-fg-muted);
}

.brief-chip__label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.brief-chip__change {
  flex-shrink: 0;
  color: var(--color-frame-fg-muted);
}

.brief-chips-empty {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
}
</style>

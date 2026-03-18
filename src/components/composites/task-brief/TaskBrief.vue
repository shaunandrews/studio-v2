<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConversations } from '@/data/useConversations'
import TaskBriefHeader from './TaskBriefHeader.vue'
import TaskBriefStats from './TaskBriefStats.vue'
import TaskBriefActions from './TaskBriefActions.vue'
import Text from '@/components/primitives/Text.vue'

const props = defineProps<{
  conversationId: string
}>()

const emit = defineEmits<{
  'preview': [conversationId: string]
  'review': [conversationId: string]
}>()

const { conversations } = useConversations()

const conversation = computed(() =>
  conversations.value.find(c => c.id === props.conversationId)
)

const title = computed(() => conversation.value?.title ?? 'New task')
const status = computed(() => conversation.value?.status ?? 'idle')
const worktree = computed(() => conversation.value?.worktree)
const summary = computed(() => conversation.value?.summary)
const changedFiles = computed(() => conversation.value?.changedFiles)
const changedEntities = computed(() => conversation.value?.changedEntities)
const previewUrl = computed(() =>
  worktree.value ? `http://localhost:${worktree.value.port}` : undefined
)

const isExpanded = ref(false)

const cardAriaLabel = computed(() => `Task brief: ${title.value}`)

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    isExpanded.value = !isExpanded.value
  }
}

const isStampVisible = computed(() =>
  status.value === 'approved' || status.value === 'merged'
)

const stampLabel = computed(() =>
  status.value === 'merged' ? 'MERGED' : '✓'
)
</script>

<template>
  <div
    class="task-brief"
    :class="[`status-${status}`, { 'is-expanded': isExpanded }]"
    role="button"
    tabindex="0"
    :aria-expanded="isExpanded"
    :aria-label="cardAriaLabel"
    @click="isExpanded = !isExpanded"
    @keydown="handleKeydown"
  >
    <!-- Paper dog-ear (top-inline-end corner fold) -->
    <div class="brief-dog-ear" aria-hidden="true" />

    <!-- Header band -->
    <TaskBriefHeader :status="status" :branch="worktree?.branch" />

    <!-- Card body -->
    <div class="brief-body p-s">
      <!-- Title row: title + compact actions (visible when collapsed) -->
      <div class="brief-title-row hstack gap-xxs">
        <Text
          tag="h2"
          variant="body"
          weight="semibold"
          class="brief-title flex-1 min-w-0"
          :title="title"
        >{{ title }}</Text>

        <TaskBriefActions
          v-if="!isExpanded"
          compact
          :preview-url="previewUrl"
          :status="status"
          @preview="emit('preview', conversationId)"
          @review="emit('review', conversationId)"
        />
      </div>

      <!-- Summary -->
      <Text
        v-if="summary"
        variant="body-small"
        color="muted"
        class="brief-summary"
        :class="{ 'is-truncated': !isExpanded }"
      >{{ summary }}</Text>

      <!-- Stats -->
      <TaskBriefStats
        class="brief-stats"
        :changed-files="changedFiles"
        :changed-entities="changedEntities"
        :compact="!isExpanded"
      />

      <!-- Expandable section: full stats + footer actions -->
      <div class="brief-expand-wrap">
        <div class="brief-expand-inner">
          <div class="brief-rule" aria-hidden="true" />
          <TaskBriefActions
            :preview-url="previewUrl"
            :status="status"
            @preview="emit('preview', conversationId)"
            @review="emit('review', conversationId)"
          />
        </div>
      </div>
    </div>

    <!-- Approved / Merged stamp (decorative) -->
    <div v-if="isStampVisible" class="brief-stamp" aria-hidden="true">
      {{ stampLabel }}
    </div>

    <!-- Review watermark (decorative) -->
    <div v-if="status === 'review'" class="brief-watermark" aria-hidden="true">REVIEW</div>
  </div>
</template>

<style scoped>
/* ── Card container ── */

.task-brief {
  position: relative;
  background: var(--color-paper);
  border: 1px solid var(--color-paper-rule);
  border-radius: var(--radius-m);
  box-shadow:
    0 1px 2px var(--color-paper-shadow),
    0 4px 12px var(--color-paper-shadow);
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  transition:
    filter var(--duration-moderate) var(--ease-out),
    box-shadow var(--duration-moderate) var(--ease-out);
}

/* Desaturate done/rejected states */
.task-brief.status-merged,
.task-brief.status-rejected {
  filter: saturate(0.6);
}

.task-brief:focus-visible {
  outline: 2px solid var(--color-frame-theme);
  outline-offset: 2px; /* Intentional: optical separation from card border */
}

/* ── Dog-ear fold (top-inline-end corner) ── */

.brief-dog-ear {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  /* --space-s = 12px: closest grid value to desired ~10px fold */
  width: var(--space-s);
  height: var(--space-s);
  /* Two-triangle gradient: shows the darker paper underside */
  background: linear-gradient(
    225deg,
    var(--color-paper-dog-ear) 50%,
    transparent 50%
  );
  z-index: 1;
  pointer-events: none;
}

/* ── Card body ── */

.brief-body {
  position: relative;
}

/* ── Title ── */

.brief-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Summary ── */

.brief-summary {
  margin-block-start: var(--space-xxxs);
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.brief-summary.is-truncated {
  -webkit-line-clamp: 1;
  overflow: hidden;
}

/* ── Stats ── */

.brief-stats {
  margin-block-start: var(--space-xxxs);
}

/* ── Expand/collapse via grid-template-rows ── */

.brief-expand-wrap {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-moderate) var(--ease-out);
}

.is-expanded .brief-expand-wrap {
  grid-template-rows: 1fr;
}

.brief-expand-inner {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

/* ── Form-line divider ── */

.brief-rule {
  block-size: 1px;
  background: var(--color-paper-rule);
  margin-block-start: var(--space-xs);
}

/* ── Approved / Merged stamp ── */

.brief-stamp {
  position: absolute;
  inset-block-end: var(--space-s);
  inset-inline-end: var(--space-s);
  /* --space-xxl = 32px: intentional exception, sized for a readable stamp not as spacing */
  width: var(--space-xxl);
  height: var(--space-xxl);
  border-radius: 50%;
  border: 2px solid var(--color-brief-stamp);
  color: var(--color-brief-stamp);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  opacity: 0.35;
  transform: rotate(-12deg);
  pointer-events: none;
  transition: opacity var(--duration-moderate) var(--ease-out);
}

/* ── Review watermark ── */

.brief-watermark {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%) rotate(-20deg);
  font-size: 48px; /* Intentional exception: decorative watermark, no typography token at this size */
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.1em;
  color: var(--color-brief-watermark);
  opacity: 0.05;
  pointer-events: none;
  white-space: nowrap;
  user-select: none;
}
</style>

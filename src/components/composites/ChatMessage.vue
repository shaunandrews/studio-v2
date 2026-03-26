<script setup lang="ts">
import { ref, computed } from 'vue'
import { page as pageIcon, layout as templateIcon, columns as sectionIcon } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import MarkdownText from '@/components/composites/renderers/MarkdownText.vue'
import ToolCallItem from '@/components/composites/ToolCallItem.vue'
import { useSiteDocument } from '@/data/useSiteDocument'
import type { AgentId, ToolCall, TaskContextItem } from '@/data/types'

const VISIBLE_TAIL = 3

const props = defineProps<{
  role: 'user' | 'agent'
  content: string
  toolCalls?: ToolCall[]
  agentId?: AgentId
  siteId?: string
  context?: TaskContextItem[]
}>()

const { undoChange } = useSiteDocument()

const toolCallsExpanded = ref(false)

const hiddenCount = computed(() => {
  const total = props.toolCalls?.length ?? 0
  if (total <= VISIBLE_TAIL) return 0
  return total - VISIBLE_TAIL
})

const visibleToolCalls = computed(() => {
  if (!props.toolCalls) return []
  if (toolCallsExpanded.value || hiddenCount.value === 0) return props.toolCalls
  return props.toolCalls.slice(-VISIBLE_TAIL)
})

function onToolUndo(changeId: string) {
  if (!props.siteId) return
  undoChange(props.siteId, changeId)
  const tc = props.toolCalls?.find(t => t.changeId === changeId)
  if (tc) tc.status = 'reverted'
}
</script>

<template>
  <div
    class="chat-message vstack gap-xxs"
    :class="`chat-message--${role}`"
  >
    <!-- Context chips (user messages only) -->
    <div v-if="role === 'user' && context?.length" class="context-chips">
      <span v-for="(item, i) in context" :key="i" class="context-chip">
        <WPIcon :icon="item.type === 'page' ? pageIcon : item.type === 'template' ? templateIcon : sectionIcon" :size="14" />
        <template v-if="item.type === 'page'">
          <span class="context-chip__label">{{ item.pageTitle }}</span>
          <span class="context-chip__slug">{{ item.pageSlug }}</span>
        </template>
        <template v-else-if="item.type === 'section'">
          <span class="context-chip__label">{{ item.sectionId }}</span>
          <span class="context-chip__slug">on {{ item.pageTitle }}</span>
          <span v-if="item.shared" class="context-chip__badge">shared</span>
        </template>
        <template v-else-if="item.type === 'template'">
          <span class="context-chip__label">{{ item.templateLabel }}</span>
        </template>
      </span>
    </div>
    <div class="chat-message-body vstack gap-xxs">
      <div v-if="content === '...'" class="thinking-dots">
        <span class="thinking-dot" />
        <span class="thinking-dot" />
        <span class="thinking-dot" />
      </div>
      <template v-else>
        <MarkdownText
          v-if="content"
          class="chat-message-text"
          :text="content"
        />
        <div v-if="toolCalls?.length" class="tool-calls-group">
          <button
            v-if="hiddenCount > 0 && !toolCallsExpanded"
            class="tool-calls-expand"
            @click="toolCallsExpanded = true"
          >
            Show {{ hiddenCount }} more step{{ hiddenCount === 1 ? '' : 's' }}
          </button>
          <ToolCallItem
            v-for="tc in visibleToolCalls"
            :key="tc.id"
            :label="tc.label"
            :status="tc.status"
            :tool-name="tc.toolName"
            :args="tc.args"
            :result="tc.result"
            :error="tc.error"
            :code="tc.code"
            :change-id="tc.changeId"
            @undo="onToolUndo"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.chat-message {
  border-radius: var(--radius-m);
}

.chat-message-body {
  width: 100%;
}

.chat-message--user {
  align-items: flex-end;
}

.chat-message--user .chat-message-body {
  width: fit-content;
  max-width: min(100%, 620px);
  border-start-start-radius: var(--radius-xl);
  border-start-end-radius: var(--radius-xl);
  border-end-start-radius: var(--radius-xl);
  border-end-end-radius: var(--radius-s);
  background: var(--color-frame-hover);
  padding: var(--space-xs) var(--space-s);
}

.chat-message--agent .chat-message-body {
  width: 100%;
  padding: 0 var(--space-s);
}

.chat-message-text {
  color: var(--color-frame-fg);
  font-size: var(--font-size-l);
  line-height: var(--line-height-normal);
}

.thinking-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: var(--space-xxs) 0;
}

.thinking-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-frame-fg-muted);
  animation: thinking-pulse 1.4s ease-in-out infinite;
}

.thinking-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes thinking-pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

.tool-calls-group {
  padding: var(--space-xxs) 0;
}

.tool-calls-expand {
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  padding: var(--space-xxxs) 0;
  margin-block-end: var(--space-xs);
  font-family: inherit;
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  cursor: pointer;
  transition: color var(--duration-instant) var(--ease-default);
}

.tool-calls-expand:hover {
  color: var(--color-frame-theme);
}

/* ── Context chips ── */

.context-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xxxs);
  align-self: flex-end;
}

.context-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xxxs);
  padding: 2px var(--space-xs) 2px var(--space-xxs);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  font-size: var(--font-size-xs);
  line-height: 1;
  color: var(--color-frame-fg-muted);
}

.context-chip__label {
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
}

.context-chip__slug {
  font-family: var(--font-mono);
  opacity: 0.6;
}

.context-chip__badge {
  padding: 0 var(--space-xxxs);
  border-radius: var(--radius-s);
  background: var(--color-frame-hover);
  font-size: var(--font-size-xxs);
  font-weight: var(--font-weight-medium);
}
</style>

<script setup lang="ts">
import MarkdownText from '@/components/composites/renderers/MarkdownText.vue'
import ToolCallItem from '@/components/composites/ToolCallItem.vue'
import type { AgentId, ToolCall } from '@/data/types'

defineProps<{
  role: 'user' | 'agent'
  content: string
  toolCalls?: ToolCall[]
  agentId?: AgentId
  siteId?: string
}>()
</script>

<template>
  <div
    class="chat-message vstack gap-xxs"
    :class="`chat-message--${role}`"
  >
    <div class="chat-message-body vstack gap-xxs">
      <div v-if="content === '...'" class="thinking-dots">
        <span class="thinking-dot" />
        <span class="thinking-dot" />
        <span class="thinking-dot" />
      </div>
      <template v-else>
        <!-- Tool calls render above text content -->
        <div v-if="toolCalls?.length" class="tool-calls-group">
          <ToolCallItem
            v-for="tc in toolCalls"
            :key="tc.id"
            :label="tc.label"
            :status="tc.status"
            :tool-name="tc.toolName"
            :args="tc.args"
            :result="tc.result"
            :error="tc.error"
            :code="tc.code"
          />
        </div>
        <MarkdownText
          v-if="content"
          class="chat-message-text"
          :text="content"
        />
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
</style>

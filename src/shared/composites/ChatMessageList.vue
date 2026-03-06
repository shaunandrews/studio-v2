<script setup lang="ts">
import { nextTick, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import ChatMessage from '@/components/composites/ChatMessage.vue'
import type { Message } from '@/data/types'

const props = defineProps<{
  messages: Message[]
  projectId?: string
}>()

const scrollerRef = ref<HTMLDivElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function scrollToBottom() {
  if (!scrollerRef.value) return
  scrollerRef.value.scrollTop = scrollerRef.value.scrollHeight
}

// Scroll when messages change
watch(
  () => {
    // Track both message count and content of the last message for streaming updates
    const last = props.messages[props.messages.length - 1]
    return `${props.messages.length}:${last?.content.length ?? 0}`
  },
  async () => {
    await nextTick()
    scrollToBottom()
  },
  { immediate: true },
)

// Scroll when container resizes (e.g. input area grows/shrinks)
onMounted(() => {
  if (!scrollerRef.value) return
  resizeObserver = new ResizeObserver(() => scrollToBottom())
  resizeObserver.observe(scrollerRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div ref="scrollerRef" class="messages vstack flex-1 overflow-auto px-s py-m">
    <div class="messages-inner vstack gap-m">
      <ChatMessage
        v-for="msg in messages"
        :key="msg.id"
        :role="msg.role"
        :content="msg.content"
        :agent-id="msg.agentId"
        :project-id="projectId"
      />
    </div>
  </div>
</template>

<style scoped>
.messages-inner {
  max-width: 720px;
  width: 100%;
  margin-block-start: auto;
  margin-inline: auto;
}
</style>

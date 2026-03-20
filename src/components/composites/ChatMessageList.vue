<script setup lang="ts">
import { nextTick, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import ChatMessage from '@/components/composites/ChatMessage.vue'
import type { Message } from '@/data/types'

const props = defineProps<{
  messages: Message[]
  siteId?: string
}>()

const emit = defineEmits<{
  'scroll-state': [atBottom: boolean]
  'scroll-top': [atTop: boolean]
}>()

const scrollerRef = ref<HTMLDivElement | null>(null)
let resizeObserver: ResizeObserver | null = null

function checkScrollState() {
  if (!scrollerRef.value) return
  const el = scrollerRef.value
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20
  emit('scroll-state', atBottom)
  emit('scroll-top', el.scrollTop < 5)
}

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
  <div ref="scrollerRef" class="messages vstack flex-1 overflow-auto px-s py-m" @scroll="checkScrollState">
    <div class="messages-inner vstack gap-m">
      <ChatMessage
        v-for="msg in messages"
        :key="msg.id"
        :role="msg.role"
        :content="msg.content"
        :tool-calls="msg.toolCalls"
        :agent-id="msg.agentId"
        :site-id="siteId"
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

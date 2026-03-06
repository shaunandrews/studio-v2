<script setup lang="ts">
import { ref, computed } from 'vue'
import ChatMessageList from '@shared/composites/ChatMessageList.vue'
import InputChat from '@/components/composites/InputChat.vue'
import { useConversations } from '@/data/useConversations'
import type { AgentId } from '@/data/types'

const { getConversation, getMessages, ensureConversation, sendMessage } = useConversations()

const agentId = ref<AgentId>('assistant')
const conversation = getConversation(ref(null), agentId)
const conversationId = computed(() => conversation.value?.id ?? null)
const msgs = getMessages(conversationId)

function handleSend(text: string) {
  const conv = ensureConversation(null, agentId.value)
  sendMessage(conv.id, 'user', text, undefined, { source: 'typed' })
}
</script>

<template>
  <div class="home-chat vstack flex-1">
    <ChatMessageList :messages="msgs" />
    <div class="px-m pb-m shrink-0">
      <InputChat surface="dark" @send="handleSend" />
    </div>
  </div>
</template>

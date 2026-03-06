<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import PanelToolbar from '@/components/composites/PanelToolbar.vue'
import TabBar from '@/components/composites/TabBar.vue'
import ChatMessageList from '@shared/composites/ChatMessageList.vue'
import InputChat from '@/components/composites/InputChat.vue'
import { useConversations } from '@/data/useConversations'
import { useInputActions } from '@/data/useInputActions'
import AllChatsModal from '@shared/composites/AllChatsModal.vue'
import type { ActionButton, Conversation } from '@/data/types'
import type { Tab } from '@/components/composites/TabBar.vue'

const { conversations, messages, getMessages, ensureConversation, sendMessage, streamAgentMessage, archiveConversation, unarchiveConversation } = useConversations()
const { getActions, clearActions } = useInputActions()

const props = defineProps<{
  projectId?: string | null
}>()

// Per-project tab state: tracks open conversation IDs
const tabStateMap = ref<Record<string, { openConvoIds: string[], activeConvoId: string }>>({})

function getProjectKey(): string {
  return props.projectId ?? '__global__'
}

const projectConvos = computed(() =>
  conversations.value.filter(c => c.projectId === (props.projectId ?? null))
)

function ensureTabState(): { openConvoIds: string[], activeConvoId: string } {
  const key = getProjectKey()
  const existing = tabStateMap.value[key]
  if (existing) return existing

  const convoIds = projectConvos.value.filter(c => !c.archived).map(c => c.id)
  const openIds = convoIds.length > 0 ? convoIds : []
  if (openIds.length === 0) {
    const conv = ensureConversation(props.projectId ?? null, 'assistant')
    openIds.push(conv.id)
  }

  const activeId = openIds[0]
  if (!activeId) {
    throw new Error('Failed to initialize a conversation tab state')
  }
  tabStateMap.value[key] = { openConvoIds: openIds, activeConvoId: activeId }
  return tabStateMap.value[key]!
}

const openTabs = computed<Tab[]>(() => {
  const state = ensureTabState()
  return state.openConvoIds
    .map(id => {
      const convo = conversations.value.find(c => c.id === id)
      if (!convo) return null
      const convoMessages = messages.value
        .filter(m => m.conversationId === convo.id)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      const tab: Tab = {
        id: convo.id,
        label: convo.title || 'New chat',
      }
      if (convoMessages.length > 0) {
        tab.messageCount = convoMessages.length
      }
      return tab
    })
    .filter((t): t is Tab => !!t)
})

const activeConvoId = computed(() => ensureTabState().activeConvoId)
const inputActions = getActions(activeConvoId)

function setActiveTab(id: string) {
  ensureTabState().activeConvoId = id
  tabStateMap.value = { ...tabStateMap.value }
}

function streamGreeting(conversationId: string) {
  return streamAgentMessage(conversationId, 'New chat ready. What should we work on?', 'assistant')
}

function handleAddTab() {
  const state = ensureTabState()
  const conv: Conversation = {
    id: `conv-${Date.now()}`,
    projectId: props.projectId ?? null,
    agentId: 'assistant',
    createdAt: new Date().toISOString(),
  }
  conversations.value.push(conv)
  state.openConvoIds.push(conv.id)
  state.activeConvoId = conv.id
  tabStateMap.value = { ...tabStateMap.value }

  nextTick(() => inputChatRef.value?.focus())
}

function handleCloseTab(id: string) {
  const state = ensureTabState()
  const idx = state.openConvoIds.indexOf(id)
  if (idx === -1) return

  archiveConversation(id)
  state.openConvoIds.splice(idx, 1)

  if (state.openConvoIds.length === 0) {
    const conv: Conversation = {
      id: `conv-${Date.now()}`,
      projectId: props.projectId ?? null,
      agentId: 'assistant',
      createdAt: new Date().toISOString(),
    }
    conversations.value.push(conv)
    state.openConvoIds.push(conv.id)
    state.activeConvoId = conv.id
    streamGreeting(conv.id)
  } else if (state.activeConvoId === id) {
    const nextId = state.openConvoIds[Math.min(idx, state.openConvoIds.length - 1)]
    state.activeConvoId = nextId ?? state.openConvoIds[0] ?? state.activeConvoId
  }

  tabStateMap.value = { ...tabStateMap.value }
  nextTick(() => inputChatRef.value?.focus())
}

const msgs = getMessages(activeConvoId)
const inputChatRef = ref<InstanceType<typeof InputChat> | null>(null)

const showAllChats = ref(false)

function handleViewAllChats() {
  showAllChats.value = true
}

function handleSelectChat(conversationId: string) {
  const state = ensureTabState()
  unarchiveConversation(conversationId)

  if (!state.openConvoIds.includes(conversationId)) {
    state.openConvoIds.push(conversationId)
  }

  state.activeConvoId = conversationId
  tabStateMap.value = { ...tabStateMap.value }
  showAllChats.value = false
  nextTick(() => inputChatRef.value?.focus())
}

function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'k') {
    e.preventDefault()
    handleAddTab()
  }
}

onMounted(() => {
  nextTick(() => inputChatRef.value?.focus())
  document.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
})

const drafts = ref<Record<string, string>>({})

const currentDraft = computed({
  get: () => drafts.value[activeConvoId.value] ?? '',
  set: (val: string) => { drafts.value[activeConvoId.value] = val },
})

function handleSend(text: string) {
  clearActions(activeConvoId.value)
  sendMessage(
    activeConvoId.value,
    'user',
    text,
    undefined,
    { source: 'typed' },
  )
  drafts.value[activeConvoId.value] = ''
}

function handleAction(action: ActionButton) {
  clearActions(activeConvoId.value)
  sendMessage(
    activeConvoId.value,
    'user',
    action.action.message,
    undefined,
    {
      source: 'action',
      actionId: action.id,
      cardRef: action.action.cardRef,
      payload: action.action.payload,
    },
  )
}
</script>

<template>
  <div class="agent-panel vstack flex-1 overflow-hidden">
    <PanelToolbar>
      <template #start>
        <TabBar :tabs="openTabs" :active-id="activeConvoId" @update:active-id="setActiveTab" @add="handleAddTab" @close="handleCloseTab" @view-all="handleViewAllChats" />
      </template>
    </PanelToolbar>

    <ChatMessageList :messages="msgs" :project-id="projectId" data-tour="chat" />

    <div class="agent-panel__input shrink-0 px-s" data-tour="input">
      <div class="agent-panel__input-inner">
        <InputChat
          ref="inputChatRef"
          v-model="currentDraft"
          :project-id="projectId"
          placeholder="Ask anything..."
          :actions="inputActions"
          @send="handleSend"
          @action="handleAction"
        />
      </div>
    </div>

    <AllChatsModal
      v-if="projectId"
      :project-id="projectId"
      :open="showAllChats"
      :active-convo-id="activeConvoId"
      @close="showAllChats = false"
      @select="handleSelectChat"
    />
  </div>
</template>

<style scoped>
.agent-panel__input-inner {
  max-width: 720px;
  margin: 0 auto;
}
</style>

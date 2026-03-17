import { ref, computed, type Ref, unref } from 'vue'
import Anthropic from '@anthropic-ai/sdk'
import { seedConversations, seedMessages } from './seed-conversations'
import { isAIConfigured, getAPIKey, streamAI } from './ai-service'
import type { Conversation, Message, AgentId } from './types'

// Module-level state (singleton)
const conversations = ref<Conversation[]>(seedConversations.map(c => ({ ...c })))
const messages = ref<Message[]>(seedMessages.map(m => ({ ...m })))

let nextWorktreePort = 4001

function assignWorktree(conv: Conversation, nameSource: string) {
  const slug = nameSource
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  conv.worktree = {
    branch: `task/${slug}`,
    port: nextWorktreePort++,
  }
}

function appendMessage(
  conversationId: string,
  role: 'user' | 'agent',
  content: string,
  agentId?: AgentId,
) {
  messages.value.push({
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    conversationId,
    role,
    agentId,
    content,
    timestamp: new Date().toISOString(),
  })
}

function getConversationAgent(conversationId: string): AgentId | undefined {
  return conversations.value.find(c => c.id === conversationId)?.agentId
}

function queueAgentResponse(conversationId: string) {
  const agentId = getConversationAgent(conversationId)
  sendToAI(conversationId, agentId)
}

async function sendToAI(conversationId: string, agentId?: AgentId) {
  if (!isAIConfigured()) {
    window.setTimeout(() => {
      appendMessage(
        conversationId,
        'agent',
        "I'm not connected to an AI service yet. Add your Anthropic API key in settings to enable live responses.",
        agentId,
      )
    }, 500)
    return
  }

  // Add streaming message placeholder
  const streamingId = `msg-streaming-${Date.now()}`
  const streamingMsg: Message = {
    id: streamingId,
    conversationId,
    role: 'agent',
    agentId,
    content: '',
    timestamp: new Date().toISOString(),
  }
  messages.value.push(streamingMsg)

  // Build message history
  const history = messages.value
    .filter(m => m.conversationId === conversationId && m.id !== streamingId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map(m => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }))

  await streamAI(history, (text) => {
    const idx = messages.value.findIndex(m => m.id === streamingId)
    if (idx !== -1) {
      messages.value[idx]!.content = text
    }
  })
}

async function generateTaskTitle(conversationId: string, userMessage: string) {
  const conv = conversations.value.find(c => c.id === conversationId)
  if (!conv) return

  // Always assign a worktree on first message
  if (!conv.worktree) {
    assignWorktree(conv, userMessage)
  }

  if (!isAIConfigured()) return
  try {
    const client = new Anthropic({
      apiKey: getAPIKey(),
      dangerouslyAllowBrowser: true,
    })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 30,
      messages: [
        {
          role: 'user',
          content: `Generate a very short title (2-5 words, no quotes) for a task described as: "${userMessage}"`,
        },
      ],
    })
    const title = (response.content[0] as { type: 'text'; text: string }).text.trim()
    if (title) {
      conv.title = title
      // Update branch name to use the cleaner AI-generated title
      assignWorktree(conv, title)
    }
  } catch {
    // Silent fail — title stays as "New task"
  }
}

export function useConversations() {
  function getConversations(siteId: Ref<string | null> | string | null) {
    return computed(() =>
      conversations.value.filter(c => c.siteId === unref(siteId))
    )
  }

  function getConversation(siteId: Ref<string | null> | string | null, agentId: Ref<AgentId> | AgentId) {
    return computed(() =>
      conversations.value.find(c => c.siteId === unref(siteId) && c.agentId === unref(agentId)) ?? null
    )
  }

  function getMessages(conversationId: Ref<string | null> | string | null) {
    return computed(() => {
      const id = unref(conversationId)
      if (!id) return []
      return messages.value
        .filter(m => m.conversationId === id)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    })
  }

  function ensureConversation(siteId: string | null, agentId: AgentId): Conversation {
    const existing = conversations.value.find(c => c.siteId === siteId && c.agentId === agentId)
    if (existing) return existing
    const conv: Conversation = {
      id: `conv-${Date.now()}`,
      siteId,
      agentId,
      createdAt: new Date().toISOString(),
    }
    conversations.value.push(conv)
    return conv
  }

  function sendMessage(conversationId: string, content: string) {
    appendMessage(conversationId, 'user', content)
    queueAgentResponse(conversationId)
  }

  /**
   * Push an agent message that "types in" over ~400ms.
   */
  function streamAgentMessage(
    conversationId: string,
    text: string,
    agentId?: AgentId,
  ): Promise<void> {
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const msg: Message = {
      id: msgId,
      conversationId,
      role: 'agent',
      agentId,
      content: '',
      timestamp: new Date().toISOString(),
    }
    messages.value.push(msg)

    return new Promise(resolve => {
      const chars = [...text]
      const total = chars.length
      const duration = Math.min(400, total * 8)
      const interval = duration / total
      let i = 0

      function tick() {
        const chunkSize = Math.max(1, Math.ceil(total / 50))
        const end = Math.min(i + chunkSize, total)
        const partial = chars.slice(0, end).join('')
        i = end

        const idx = messages.value.findIndex(m => m.id === msgId)
        if (idx !== -1) {
          messages.value[idx]!.content = partial
        }

        if (i < total) {
          setTimeout(tick, interval * chunkSize)
        } else {
          resolve()
        }
      }

      setTimeout(tick, 80)
    })
  }

  function postMessage(
    conversationId: string,
    role: 'user' | 'agent',
    content: string,
    agentId?: AgentId,
  ) {
    appendMessage(conversationId, role, content, agentId)
  }

  function removeMessage(messageId: string) {
    const idx = messages.value.findIndex(m => m.id === messageId)
    if (idx !== -1) messages.value.splice(idx, 1)
  }

  function markRead(id: string) {
    const conv = conversations.value.find(c => c.id === id)
    if (conv) conv.unread = false
  }

  function archiveConversation(id: string) {
    const conv = conversations.value.find(c => c.id === id)
    if (conv) conv.archived = true
  }

  function unarchiveConversation(id: string) {
    const conv = conversations.value.find(c => c.id === id)
    if (conv) conv.archived = false
  }

  function resetConversations(newConvos: Conversation[], newMessages: Message[]) {
    conversations.value = newConvos.map(c => ({ ...c }))
    messages.value = newMessages.map(m => ({ ...m }))
    nextWorktreePort = 4001
  }

  return {
    conversations,
    messages,
    getConversations,
    getConversation,
    getMessages,
    ensureConversation,
    sendMessage,
    postMessage,
    removeMessage,
    streamAgentMessage,
    markRead,
    archiveConversation,
    unarchiveConversation,
    generateTaskTitle,
    resetConversations,
  }
}

# Chat System Simplification

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip the chat system down to plain text messaging by removing cards, action buttons, input actions, and legacy agents.

**Architecture:** Messages become plain strings instead of `ContentBlock[]`. AI service drops card-fence parsing entirely. Seed data converts card-heavy messages to markdown text. Legacy agent IDs stay in the type union (seed data still references them) but legacy agent objects leave `agents.ts`.

**Tech Stack:** Vue 3, TypeScript, Vite

---

## File Map

**Delete:**
- `src/components/composites/chat-cards/ChatCard.vue`
- `src/components/composites/chat-cards/PluginCard.vue`
- `src/components/composites/chat-cards/SettingsCard.vue`
- `src/components/composites/chat-cards/ProgressCard.vue`
- `src/components/composites/chat-cards/PageCard.vue`
- `src/components/composites/chat-cards/PostDraftCard.vue`
- `src/data/useInputActions.ts`
- `src/pages/components/ChatCardsPage.vue`

**Modify:**
- `src/data/types.ts` — Remove card types, ActionButton, simplify ContentBlock and Message
- `src/data/ai-service.ts` — Remove card parsing, simplify to plain text streaming
- `src/data/ai-system-prompt.ts` — Remove card type instructions
- `src/data/useConversations.ts` — Remove content block cloning, simplify message handling
- `src/data/seed-conversations.ts` — Convert all card content to markdown strings
- `src/components/composites/ChatMessage.vue` — Remove card imports/rendering, just render MarkdownText
- `src/components/composites/InputChat.vue` — Remove action strips, ActionButton imports
- `src/pages/SitePage.vue` — Remove useInputActions, onAction handler, action prop
- `src/pages/Components.vue` — Remove Chat Cards nav category
- `src/router.ts` — Remove chat-cards route
- `src/data/agents.ts` — Remove legacy agent entries

---

## Chunk 1: Types and Data Layer

### Task 1: Simplify types.ts

**Files:**
- Modify: `src/data/types.ts:89-183`

- [ ] **Step 1: Replace Message.content type and remove card/action types**

Change `Message` to use `string` content. Remove everything from line 99 (`MessageContext`) through line 183 (`PostDraftCardData`), except keep `MessageContext` but simplified.

```typescript
export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'agent'
  agentId?: AgentId
  content: string
  timestamp: string
}
```

Delete these types entirely:
- `MessageContext`
- `CardUiState`
- `ActionButton`
- `BaseCardBlock`
- `CardBlock`
- `ContentBlock`
- `PluginCardData`
- `SettingsCardData`
- `ProgressCardData`
- `PageCardData`
- `PostDraftCardData`

- [ ] **Step 2: Verify the file compiles**

Run: `npx vue-tsc --noEmit 2>&1 | head -40`
Expected: Errors in downstream files (expected — we'll fix those next). No errors in `types.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "refactor: simplify Message to plain string content, remove card types"
```

### Task 2: Simplify ai-service.ts

**Files:**
- Modify: `src/data/ai-service.ts`

- [ ] **Step 1: Strip card parsing, simplify to plain text streaming**

Replace the entire file with:

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { AI_SYSTEM_PROMPT } from './ai-system-prompt'

const STORAGE_KEY = 'anthropic-api-key'

export function isAIConfigured(): boolean {
  return !!localStorage.getItem(STORAGE_KEY)?.trim()
}

export function getAPIKey(): string {
  return localStorage.getItem(STORAGE_KEY)?.trim() ?? ''
}

export function setAPIKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key.trim())
}

/**
 * Stream an AI response. Calls onUpdate with accumulated text as it arrives.
 */
export async function streamAI(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onUpdate: (text: string) => void,
  systemPrompt?: string,
): Promise<string> {
  const apiKey = getAPIKey()
  if (!apiKey) {
    const fallback = "I'm not connected to an AI service yet. Add your Anthropic API key in settings to enable live responses."
    onUpdate(fallback)
    return fallback
  }

  try {
    const client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    })

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt ?? AI_SYSTEM_PROMPT,
      messages,
    })

    let accumulated = ''

    stream.on('text', (text) => {
      accumulated += text
      onUpdate(accumulated)
    })

    await stream.finalMessage()
    onUpdate(accumulated)
    return accumulated
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error calling AI service'
    const errorText = `AI error: ${message}`
    onUpdate(errorText)
    return errorText
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/ai-service.ts
git commit -m "refactor: strip card parsing from AI service, return plain text"
```

### Task 3: Simplify ai-system-prompt.ts

**Files:**
- Modify: `src/data/ai-system-prompt.ts`

- [ ] **Step 1: Remove card type instructions**

Replace with:

```typescript
export const AI_SYSTEM_PROMPT = `You are Kit, a WordPress assistant embedded in WordPress Studio. You help users with their WordPress sites through conversation.

## Guidelines
- Be concise and practical
- Use markdown formatting for structure (lists, bold, code blocks)
- You're working on a local WordPress development environment
`
```

- [ ] **Step 2: Commit**

```bash
git add src/data/ai-system-prompt.ts
git commit -m "refactor: simplify AI system prompt, remove card instructions"
```

### Task 4: Simplify useConversations.ts

**Files:**
- Modify: `src/data/useConversations.ts`

- [ ] **Step 1: Rewrite for string content**

Remove `cloneContentBlock`, `cloneMessage`, `normalizeContent`, `textBlocks`. Simplify `appendMessage`, `sendMessage`, `postMessage`, `streamAgentMessage` to work with plain strings. Remove `ContentBlock` and `MessageContext` imports.

```typescript
import { ref, computed, type Ref, unref } from 'vue'
import Anthropic from '@anthropic-ai/sdk'
import { seedConversations, seedMessages } from './seed-conversations'
import { isAIConfigured, getAPIKey, streamAI } from './ai-service'
import type { Conversation, Message, AgentId } from './types'

// Module-level state (singleton)
const conversations = ref<Conversation[]>(seedConversations.map(c => ({ ...c })))
const messages = ref<Message[]>(seedMessages.map(m => ({ ...m })))

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
    const conv = conversations.value.find(c => c.id === conversationId)
    if (conv && title) conv.title = title
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

  function archiveConversation(id: string) {
    const conv = conversations.value.find(c => c.id === id)
    if (conv) conv.archived = true
  }

  function unarchiveConversation(id: string) {
    const conv = conversations.value.find(c => c.id === id)
    if (conv) conv.archived = false
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
    archiveConversation,
    unarchiveConversation,
    generateTaskTitle,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/useConversations.ts
git commit -m "refactor: simplify useConversations for plain string messages"
```

### Task 5: Delete useInputActions.ts

**Files:**
- Delete: `src/data/useInputActions.ts`

- [ ] **Step 1: Delete the file**

```bash
rm src/data/useInputActions.ts
```

- [ ] **Step 2: Commit**

```bash
git add -u src/data/useInputActions.ts
git commit -m "refactor: remove useInputActions composable"
```

---

## Chunk 2: Components

### Task 6: Simplify ChatMessage.vue

**Files:**
- Modify: `src/components/composites/ChatMessage.vue`

- [ ] **Step 1: Remove all card imports and rendering, just use MarkdownText**

Replace the entire file with:

```vue
<script setup lang="ts">
import MarkdownText from '@/components/composites/renderers/MarkdownText.vue'
import type { AgentId } from '@/data/types'

defineProps<{
  role: 'user' | 'agent'
  content: string
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
      <MarkdownText
        v-else
        class="chat-message-text"
        :text="content"
      />
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
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/composites/ChatMessage.vue
git commit -m "refactor: simplify ChatMessage to render plain text via MarkdownText"
```

### Task 7: Simplify ChatMessageList.vue

**Files:**
- Modify: `src/components/composites/ChatMessageList.vue`

- [ ] **Step 1: Update the content-length watcher for string content**

In the `watch` callback, change the tracker from `last?.content.length` to `last?.content.length` (this already works since strings have `.length` — no change needed to the watcher logic, but verify).

The only change: the `:content` prop binding stays as-is since `msg.content` is now a string and `ChatMessage` expects a string. Verify the component compiles.

Run: `npx vue-tsc --noEmit 2>&1 | grep ChatMessageList`
Expected: No errors.

- [ ] **Step 2: Commit (if any changes were needed)**

### Task 8: Simplify InputChat.vue

**Files:**
- Modify: `src/components/composites/InputChat.vue`

- [ ] **Step 1: Remove action strips and ActionButton references**

Remove from the script:
- The `ActionButton` import from types
- The `actions` prop
- The `hasCardActions` computed
- The `buttonVariant` function
- The `actionLabel` function
- The `action` emit
- The number-key action trigger in `onKeydown`

Remove from the template:
- The entire `<!-- Card actions -->` div (lines 120-133)
- The entire `<!-- Regular text actions -->` div (lines 136-151)

Remove from the style:
- `.input-actions-cards`, `.input-actions` styles
- `.action-enter` animation
- `@keyframes action-pop`
- `.action-card` and all `.action-card__*` styles

Updated props:
```typescript
const props = withDefaults(defineProps<{
  surface?: 'light' | 'dark'
  siteId?: string | null
  modelValue?: string
  placeholder?: string
  elevated?: boolean
}>(), {
  surface: 'light',
  modelValue: '',
  placeholder: 'Ask anything...',
})
```

Updated emits:
```typescript
const emit = defineEmits<{
  send: [message: string]
  'update:modelValue': [value: string]
  'manage-agents': []
}>()
```

Updated `onKeydown` — remove the number-key action block (lines 82-89).

- [ ] **Step 2: Commit**

```bash
git add src/components/composites/InputChat.vue
git commit -m "refactor: remove action strips from InputChat"
```

### Task 9: Delete chat-cards directory

**Files:**
- Delete: `src/components/composites/chat-cards/` (entire directory)

- [ ] **Step 1: Delete the directory**

```bash
rm -rf src/components/composites/chat-cards
```

- [ ] **Step 2: Commit**

```bash
git add -u src/components/composites/chat-cards/
git commit -m "refactor: delete chat-cards components"
```

---

## Chunk 3: Pages, Routes, and Seed Data

### Task 10: Update SitePage.vue

**Files:**
- Modify: `src/pages/SitePage.vue`

- [ ] **Step 1: Remove useInputActions and action handling**

Remove from imports:
- `import { useInputActions } from '@/data/useInputActions'`
- `import type { ActionButton, Conversation } from '@/data/types'` → `import type { Conversation } from '@/data/types'`

Remove from setup:
- `const { getActions, clearActions } = useInputActions()`
- `const inputActions = getActions(selectedConvoId)`
- The entire `onAction` function (lines 164-179)

In `onSend`, remove the `clearActions` call:
```typescript
function onSend(text: string) {
  if (!selectedConvoId.value) return
  const isFirst = isNewTask.value
  sendMessage(selectedConvoId.value, text)
  draft.value = ''
  if (isFirst) {
    generateTaskTitle(selectedConvoId.value, text)
  }
}
```

Note: `sendMessage` signature changed — it's now `sendMessage(conversationId, content)` without role/agentId/messageContext params.

In template, remove from `<InputChat>`:
- `:actions="inputActions"`
- `@action="onAction"`

- [ ] **Step 2: Commit**

```bash
git add src/pages/SitePage.vue
git commit -m "refactor: remove action handling from SitePage"
```

### Task 11: Remove Chat Cards from Components page and router

**Files:**
- Delete: `src/pages/components/ChatCardsPage.vue`
- Modify: `src/pages/Components.vue`
- Modify: `src/router.ts`

- [ ] **Step 1: Delete ChatCardsPage.vue**

```bash
rm src/pages/components/ChatCardsPage.vue
```

- [ ] **Step 2: Remove Chat Cards category from Components.vue**

Remove the entire fourth category object (lines 59-71) from the `categories` array — the one with `label: 'Chat Cards'`.

- [ ] **Step 3: Remove chat-cards route from router.ts**

Remove line 71:
```typescript
{ name: 'dev-components-chat-cards', path: 'chat-cards', component: () => import('@/pages/components/ChatCardsPage.vue') },
```

- [ ] **Step 4: Commit**

```bash
git add -u src/pages/components/ChatCardsPage.vue
git add src/pages/Components.vue src/router.ts
git commit -m "refactor: remove Chat Cards dev page and route"
```

### Task 12: Convert seed-conversations.ts to plain text

**Files:**
- Modify: `src/data/seed-conversations.ts`

- [ ] **Step 1: Rewrite all messages to use string content**

Convert every message from `content: [{ type: 'text', text: '...' }]` to `content: '...'`. Convert card blocks to readable markdown equivalents. Remove `messageContext` from all messages.

Key conversions:
- `{ type: 'text', text: 'foo' }` → `'foo'`
- ProgressCard data → markdown checklist (`- [x] Step name`)
- PluginCard data → bold text with status (`**Plugin: Jetpack** — Active`)
- PageCard data → bold text with slug (`**Page: About Us** — /about — Draft`)

The full rewrite of this file is the largest single task. Every `content:` field changes from an array to a string.

- [ ] **Step 2: Verify the app loads**

Run: `npm run dev`
Navigate to a site with conversations, verify messages render correctly.

- [ ] **Step 3: Commit**

```bash
git add src/data/seed-conversations.ts
git commit -m "refactor: convert seed conversations to plain text messages"
```

### Task 13: Clean up legacy agents

**Files:**
- Modify: `src/data/agents.ts:65-80`

- [ ] **Step 1: Remove legacy agent entries**

Remove the three legacy agent objects (assistant, code, design) from the `agents` array — lines 66-80 (the ones with the `// Legacy agents` comment).

Do NOT remove `'assistant' | 'code' | 'design'` from the `AgentId` type in `types.ts` — seed conversations still reference these IDs, they just don't need agent objects with labels/descriptions anymore.

- [ ] **Step 2: Commit**

```bash
git add src/data/agents.ts
git commit -m "refactor: remove legacy agent entries from agents list"
```

### Task 14: Final verification

- [ ] **Step 1: Run type check**

Run: `npx vue-tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Run dev server and test**

Run: `npm run dev`

Verify:
- Home page loads
- Site page loads with conversations
- Messages render as markdown
- New task creation works
- Sending a message works (with or without API key)
- Agent picker in InputChat still works
- Preferences modal still shows Skills and Agents tabs
- Dev components page loads without Chat Cards section

- [ ] **Step 3: Final commit if any fixes needed**

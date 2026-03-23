import { ref, computed, type Ref, unref } from 'vue'
import { streamAI, streamAIWithTools, generateTitle } from './ai-service'
import { siteTools, buildSystemPrompt } from './ai-tools'
import { executeToolCall } from './ai-tool-executor'
import { useSiteDocument } from './useSiteDocument'
import { usePreviewSync } from './usePreviewSync'
import { db, isDbAvailable } from './db'
import { toSerializable } from './utils'
import type { Task, Message, AgentId, ToolCall } from './types'

// Module-level state (singleton)
const tasks = ref<Task[]>([])
const messages = ref<Message[]>([])
const busyTaskIds = ref<Set<string>>(new Set())

let nextWorktreePort = 4001

function assignWorktree(task: Task, nameSource: string) {
  const slug = nameSource
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  task.worktree = {
    branch: `task/${slug}`,
    port: nextWorktreePort++,
  }
}

async function persistTask(task: Task) {
  try {
    if (await isDbAvailable()) {
      await db.tasks.put(toSerializable(task))
    }
  } catch (e) {
    console.error('[persistTask] DB write failed:', e)
  }
}

async function persistMessage(msg: Message) {
  try {
    if (await isDbAvailable()) {
      await db.messages.put(toSerializable(msg))
    }
  } catch (e) {
    console.error('[persistMessage] DB write failed:', e)
  }
}

function appendMessage(
  taskId: string,
  role: 'user' | 'agent',
  content: string,
  agentId?: AgentId,
) {
  const msg: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    taskId,
    role,
    agentId,
    content,
    timestamp: new Date().toISOString(),
  }
  messages.value.push(msg)
  persistMessage(msg)
}

function getTaskAgent(taskId: string): AgentId | undefined {
  return tasks.value.find(t => t.id === taskId)?.agentId
}

function queueAgentResponse(taskId: string) {
  const agentId = getTaskAgent(taskId)
  sendToAI(taskId, agentId)
}

function markBusy(taskId: string) {
  busyTaskIds.value = new Set([...busyTaskIds.value, taskId])
}

function markIdle(taskId: string) {
  const next = new Set(busyTaskIds.value)
  next.delete(taskId)
  busyTaskIds.value = next
}

async function sendToAISimple(taskId: string, agentId?: AgentId) {
  markBusy(taskId)
  const streamingId = `msg-streaming-${Date.now()}`
  const streamingMsg: Message = {
    id: streamingId,
    taskId,
    role: 'agent',
    agentId,
    content: '',
    timestamp: new Date().toISOString(),
  }
  messages.value.push(streamingMsg)

  const history = messages.value
    .filter(m => m.taskId === taskId && m.id !== streamingId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map(m => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    }))

  await streamAI(history, (text) => {
    const idx = messages.value.findIndex(m => m.id === streamingId)
    if (idx !== -1) {
      if (messages.value[idx]) messages.value[idx].content = text
    }
  })

  const finalMsg = messages.value.find(m => m.id === streamingId)
  if (finalMsg) persistMessage(finalMsg)
  markIdle(taskId)
}

async function sendToAI(taskId: string, agentId?: AgentId) {
  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return

  const { getContent } = useSiteDocument()
  const { pushSectionUpdate, pushThemeUpdate, pushPageUpdate } = usePreviewSync()

  // Fall back to simple streaming if no site content
  if (!getContent(task.siteId).value) {
    return sendToAISimple(taskId, agentId)
  }

  markBusy(taskId)
  let looping = true
  while (looping) {
    const currentContent = getContent(task.siteId).value!
    const system = buildSystemPrompt(currentContent)

    // Build API message history from task messages
    const apiMessages: Array<{ role: string; content: any }> = []
    const history = messages.value
      .filter(m => m.taskId === taskId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    for (const m of history) {
      if (m.role === 'user') {
        apiMessages.push({ role: 'user', content: m.content })
      } else {
        if (m.toolCalls?.length) {
          const contentBlocks: any[] = []
          if (m.content) contentBlocks.push({ type: 'text', text: m.content })
          for (const tc of m.toolCalls) {
            contentBlocks.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.toolName ?? tc.label,
              input: tc.args ? JSON.parse(tc.args) : {},
            })
          }
          apiMessages.push({ role: 'assistant', content: contentBlocks })
          const toolResults = m.toolCalls.map(tc => ({
            type: 'tool_result',
            tool_use_id: tc.id,
            content: tc.result ?? tc.error ?? '',
            ...(tc.error ? { is_error: true } : {}),
          }))
          apiMessages.push({ role: 'user', content: toolResults })
        } else {
          apiMessages.push({ role: 'assistant', content: m.content })
        }
      }
    }

    // Create streaming placeholder
    const streamingId = `msg-streaming-${Date.now()}`
    const streamingMsg: Message = {
      id: streamingId,
      taskId,
      role: 'agent',
      agentId,
      content: '',
      toolCalls: [],
      timestamp: new Date().toISOString(),
    }
    messages.value.push(streamingMsg)

    const pendingToolCalls: ToolCall[] = []

    const result = await streamAIWithTools(apiMessages, siteTools, system, {
      onText: (text) => {
        const idx = messages.value.findIndex(m => m.id === streamingId)
        if (idx !== -1) messages.value[idx]!.content = text
      },
      onToolUseStart: (id, name) => {
        const tc: ToolCall = {
          id,
          label: `Running ${name}...`,
          status: 'running',
          toolName: name,
        }
        pendingToolCalls.push(tc)
        const idx = messages.value.findIndex(m => m.id === streamingId)
        if (idx !== -1) {
          messages.value[idx]!.toolCalls = [...pendingToolCalls]
        }
      },
      onToolUseComplete: (toolUse) => {
        const execResult = executeToolCall(task.siteId, toolUse.name, toolUse.input, toolUse.id)

        // Push to preview
        if (execResult.change && !execResult.isError) {
          const updatedContent = getContent(task.siteId).value
          if (updatedContent) {
            switch (toolUse.name) {
              case 'update_section':
              case 'create_section': {
                const section = updatedContent.sections[toolUse.input.section_id]
                if (section) {
                  const page = updatedContent.pages.find(p => p.sections.includes(section.id))
                  const order = page ? page.sections.indexOf(section.id) : undefined
                  pushSectionUpdate(section.id, section.html, section.css, order)
                }
                break
              }
              case 'remove_section':
                pushPageUpdate(updatedContent, toolUse.input.page_slug)
                break
              case 'update_theme':
                pushThemeUpdate(toolUse.input.variables)
                break
            }
          }
        }

        // Update tool call in message
        const tc = pendingToolCalls.find(t => t.id === toolUse.id)
        if (tc) {
          tc.status = execResult.isError ? 'error' : 'done'
          tc.label = execResult.result
          tc.args = JSON.stringify(toolUse.input, null, 2)
          tc.result = execResult.isError ? undefined : execResult.result
          tc.error = execResult.isError ? execResult.result : undefined
          tc.changeId = execResult.change?.id
        }
        const idx = messages.value.findIndex(m => m.id === streamingId)
        if (idx !== -1) {
          messages.value[idx]!.toolCalls = [...pendingToolCalls]
        }
      },
    })

    const finalMsg = messages.value.find(m => m.id === streamingId)
    if (finalMsg) persistMessage(finalMsg)

    if (result.stopReason === 'tool_use') {
      continue
    } else {
      looping = false
    }
  }
  markIdle(taskId)
}

async function generateTaskTitle(taskId: string, userMessage: string) {
  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return

  // Always assign a worktree on first message
  if (!task.worktree) {
    assignWorktree(task, userMessage)
  }

  const title = await generateTitle(userMessage)
  if (title) {
    task.title = title
    // Update branch name to use the cleaner AI-generated title
    assignWorktree(task, title)
    task.updatedAt = new Date().toISOString()
    persistTask(task)
  }
}

export function useTasks() {
  function getTasksForSite(siteId: Ref<string | null> | string | null) {
    return computed(() =>
      tasks.value
        .filter(t => t.siteId === unref(siteId) && !t.archived)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    )
  }

  function getTask(taskId: Ref<string | null> | string | null) {
    return computed(() => {
      const id = unref(taskId)
      if (!id) return null
      return tasks.value.find(t => t.id === id) ?? null
    })
  }

  function getMessages(taskId: Ref<string | null> | string | null) {
    return computed(() => {
      const id = unref(taskId)
      if (!id) return []
      return messages.value
        .filter(m => m.taskId === id)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    })
  }

  async function createTask(opts: {
    siteId: string
    agentId?: AgentId
    title?: string
  }): Promise<Task> {
    const now = new Date().toISOString()
    const task: Task = {
      id: `task-${Date.now()}`,
      siteId: opts.siteId,
      agentId: opts.agentId ?? 'wpcom',
      title: opts.title,
      createdAt: now,
      updatedAt: now,
    }
    assignWorktree(task, opts.title ?? 'new-task')
    tasks.value.push(task)
    await persistTask(task)
    return task
  }

  async function updateTask(taskId: string, updates: Partial<Pick<Task, 'title' | 'archived' | 'unread'>>) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return
    Object.assign(task, updates, { updatedAt: new Date().toISOString() })
    await persistTask(task)
  }

  function sendMessage(taskId: string, content: string) {
    appendMessage(taskId, 'user', content)
    queueAgentResponse(taskId)
  }

  /**
   * Push an agent message that "types in" over ~400ms.
   */
  function streamAgentMessage(
    taskId: string,
    text: string,
    agentId?: AgentId,
  ): Promise<void> {
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const msg: Message = {
      id: msgId,
      taskId,
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
          // Persist final message after streaming completes
          const finalMsg = messages.value.find(m => m.id === msgId)
          if (finalMsg) persistMessage(finalMsg)
          resolve()
        }
      }

      setTimeout(tick, 80)
    })
  }

  function postMessage(
    taskId: string,
    role: 'user' | 'agent',
    content: string,
    agentId?: AgentId,
  ) {
    appendMessage(taskId, role, content, agentId)
  }

  function removeMessage(messageId: string) {
    const idx = messages.value.findIndex(m => m.id === messageId)
    if (idx !== -1) messages.value.splice(idx, 1)
  }

  async function markRead(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.unread = false
      await persistTask(task)
    }
  }

  async function archiveTask(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.archived = true
      task.updatedAt = new Date().toISOString()
      await persistTask(task)
    }
  }

  async function unarchiveTask(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.archived = false
      task.updatedAt = new Date().toISOString()
      await persistTask(task)
    }
  }

  async function resetTasks(newTasks: Task[], newMessages: Message[]) {
    if (await isDbAvailable()) {
      await db.transaction('rw', db.tasks, db.messages, async () => {
        await db.tasks.clear()
        await db.messages.clear()
        if (newTasks.length) await db.tasks.bulkPut(newTasks)
        if (newMessages.length) await db.messages.bulkPut(newMessages)
      })
    }
    tasks.value = newTasks.map(t => ({ ...t }))
    messages.value = newMessages.map(m => ({ ...m }))
    nextWorktreePort = 4001
  }

  /** Hydration setter — sets refs without touching DB */
  function _setTasks(newTasks: Task[], newMessages: Message[]) {
    tasks.value = newTasks
    messages.value = newMessages
    nextWorktreePort = 4001
    for (const t of newTasks) {
      if (t.worktree && t.worktree.port >= nextWorktreePort) {
        nextWorktreePort = t.worktree.port + 1
      }
    }
  }

  function isBusy(taskId: string | null) {
    return computed(() => taskId ? busyTaskIds.value.has(taskId) : false)
  }

  return {
    tasks,
    messages,
    busyTaskIds,
    getTasksForSite,
    getTask,
    getMessages,
    isBusy,
    createTask,
    updateTask,
    sendMessage,
    postMessage,
    removeMessage,
    streamAgentMessage,
    markRead,
    archiveTask,
    unarchiveTask,
    generateTaskTitle,
    resetTasks,
    _setTasks,
  }
}

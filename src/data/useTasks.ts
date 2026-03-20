import { ref, computed, toRaw, type Ref, unref } from 'vue'
import { streamAI, generateTitle } from './ai-service'
import { db, isDbAvailable } from './db'
import type { Task, Message, AgentId, TaskOrigin, TaskStatus } from './types'

// Module-level state (singleton)
const tasks = ref<Task[]>([])
const messages = ref<Message[]>([])

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
  if (await isDbAvailable()) {
    const raw = JSON.parse(JSON.stringify(toRaw(task)))
    await db.tasks.put(raw)
  }
}

async function persistMessage(msg: Message) {
  if (await isDbAvailable()) {
    const raw = JSON.parse(JSON.stringify(toRaw(msg)))
    await db.messages.put(raw)
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

async function sendToAI(taskId: string, agentId?: AgentId) {
  // Add streaming message placeholder
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

  // Build message history
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
      messages.value[idx]!.content = text
    }
  })

  // Persist final message to DB after streaming completes
  const finalMsg = messages.value.find(m => m.id === streamingId)
  if (finalMsg) {
    persistMessage(finalMsg)
  }
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

/** Load tasks + messages from IndexedDB into reactive refs */
async function hydrate() {
  if (await isDbAvailable()) {
    const [dbTasks, dbMessages] = await Promise.all([
      db.tasks.toArray(),
      db.messages.toArray(),
    ])
    tasks.value = dbTasks
    messages.value = dbMessages
    // Set next worktree port past any existing
    for (const t of dbTasks) {
      if (t.worktree && t.worktree.port >= nextWorktreePort) {
        nextWorktreePort = t.worktree.port + 1
      }
    }
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
    origin: TaskOrigin
    title?: string
    status?: TaskStatus
  }): Promise<Task> {
    const now = new Date().toISOString()
    const task: Task = {
      id: `task-${Date.now()}`,
      siteId: opts.siteId,
      agentId: opts.agentId ?? 'wpcom',
      title: opts.title,
      status: opts.status ?? 'queued',
      createdAt: now,
      updatedAt: now,
      origin: opts.origin,
    }
    assignWorktree(task, opts.title ?? 'new-task')
    tasks.value.push(task)
    await persistTask(task)
    return task
  }

  async function updateTask(taskId: string, updates: Partial<Pick<Task, 'title' | 'status' | 'summary' | 'changedFiles' | 'changedEntities' | 'archived' | 'unread'>>) {
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

  return {
    tasks,
    messages,
    hydrate,
    getTasksForSite,
    getTask,
    getMessages,
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

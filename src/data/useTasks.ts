import { ref, computed, type Ref, unref } from 'vue'
import { streamAI, streamAIWithTools, generateTitle } from './ai-service'
import { siteTools, taskTools, buildSystemPrompt } from './ai-tools'
import { executeToolCall } from './ai-tool-executor'
import { useSiteDocument } from './useSiteDocument'
import { usePreviewSync } from './usePreviewSync'
import { useRevisions } from './useRevisions'
import { useBranches, contentKey } from './useBranches'
import { db, isDbAvailable } from './db'
import { toSerializable } from './utils'
import type { Task, TaskStatus, Message, AgentId, ToolCall, TaskContextItem } from './types'
import type { RevisionChange } from './site-types'

// Module-level state (singleton)
const tasks = ref<Task[]>([])
const messages = ref<Message[]>([])
const busyTaskIds = ref<Set<string>>(new Set())
const abortControllers = new Map<string, AbortController>()

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
  context?: TaskContextItem[],
) {
  const msg: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    taskId,
    role,
    agentId,
    content,
    context,
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
  const controller = new AbortController()
  abortControllers.set(taskId, controller)

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

  try {
    await streamAI(history, (text) => {
      const idx = messages.value.findIndex(m => m.id === streamingId)
      if (idx !== -1) {
        if (messages.value[idx]) messages.value[idx].content = text
      }
    }, undefined, controller.signal)
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      // Stopped by user — keep partial content
    } else {
      throw e
    }
  } finally {
    abortControllers.delete(taskId)
  }

  const finalMsg = messages.value.find(m => m.id === streamingId)
  if (finalMsg) persistMessage(finalMsg)
  markIdle(taskId)
}

async function sendToAI(taskId: string, agentId?: AgentId) {
  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return

  const { getContent } = useSiteDocument()
  const { pushSectionUpdate, pushThemeUpdate, pushPageUpdate } = usePreviewSync()
  const branchKey = contentKey(task.siteId, task.id)

  // Fall back to simple streaming if no site content
  if (!getContent(branchKey).value) {
    return sendToAISimple(taskId, agentId)
  }

  markBusy(taskId)
  const controller = new AbortController()
  abortControllers.set(taskId, controller)

  let looping = true
  while (looping) {
    if (controller.signal.aborted) break

    const currentContent = getContent(branchKey).value!
    const system = buildSystemPrompt(currentContent, task?.context)

    // Build API message history from task messages
    const apiMessages: Array<{ role: string; content: any }> = []
    const history = messages.value
      .filter(m => m.taskId === taskId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    const allTools = [...siteTools, ...taskTools]
    const validToolNames = new Set(allTools.map(t => t.name))

    for (const m of history) {
      if (m.role === 'user') {
        let userContent = m.content
        if (m.context?.length) {
          const labels = m.context.map(item => {
            if (item.type === 'page') return `Page "${item.pageTitle}" (${item.pageSlug})`
            if (item.type === 'section') return `Section "${item.sectionId}" on "${item.pageTitle}" (${item.pageSlug})`
            return `Template "${item.templateLabel}"`
          })
          userContent = `[Context: ${labels.join(', ')}]\n${m.content}`
        }
        apiMessages.push({ role: 'user', content: userContent })
      } else {
        // Only include tool calls that reference valid API tools with parseable args
        const apiToolCalls = (m.toolCalls ?? []).filter(tc => {
          const name = tc.toolName ?? tc.label
          if (!validToolNames.has(name)) return false
          if (tc.args) {
            try { JSON.parse(tc.args) } catch { return false }
          }
          return true
        })

        if (apiToolCalls.length) {
          const contentBlocks: any[] = []
          if (m.content) contentBlocks.push({ type: 'text', text: m.content })
          for (const tc of apiToolCalls) {
            contentBlocks.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.toolName ?? tc.label,
              input: tc.args ? JSON.parse(tc.args) : {},
            })
          }
          apiMessages.push({ role: 'assistant', content: contentBlocks })
          const toolResults = apiToolCalls.map(tc => ({
            type: 'tool_result',
            tool_use_id: tc.id,
            content: tc.result ?? tc.error ?? '',
            ...(tc.error ? { is_error: true } : {}),
          }))
          apiMessages.push({ role: 'user', content: toolResults })
        } else {
          // Fall back to text-only if no valid tool calls
          const text = m.content || '(completed actions)'
          apiMessages.push({ role: 'assistant', content: text })
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
    const turnChangeRecords: RevisionChange[] = []
    let shouldStopLoop = false

    let result
    try {
      result = await streamAIWithTools(apiMessages, allTools, system, {
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
          // Handle task workflow tools (not site-editing tools)
          if (toolUse.name === 'request_review' || toolUse.name === 'complete_task') {
            const tc = pendingToolCalls.find(t => t.id === toolUse.id)
            if (tc) {
              tc.status = 'done'
              tc.args = JSON.stringify(toolUse.input, null, 2)

              if (toolUse.name === 'request_review') {
                tc.label = 'Requesting your review'
                tc.result = 'Moved task to review'
                task.status = 'review'
                task.unread = true
                task.updatedAt = new Date().toISOString()
                persistTask(task)
              } else {
                // complete_task
                if (task.skipReview) {
                  tc.label = 'Task complete — merged'
                  tc.result = 'Auto-merged to site'
                  const { mergeTask: branchMerge, applyMerge } = useBranches()
                  const mergeResult = branchMerge(task.id)
                  if (mergeResult && mergeResult.conflicts.length === 0) {
                    applyMerge(task.id, mergeResult)
                  }
                  task.status = 'merged'
                  task.unread = true
                  task.updatedAt = new Date().toISOString()
                  persistTask(task)
                } else {
                  tc.label = 'Task complete'
                  tc.result = 'Ready for review'
                  task.status = 'review'
                  task.unread = true
                  task.updatedAt = new Date().toISOString()
                  persistTask(task)
                }
              }

              const idx = messages.value.findIndex(m => m.id === streamingId)
              if (idx !== -1) messages.value[idx]!.toolCalls = [...pendingToolCalls]
            }
            shouldStopLoop = true
            return
          }

          const execResult = executeToolCall(branchKey, toolUse.name, toolUse.input, toolUse.id, taskId)

          // Push to preview
          if (execResult.change && !execResult.isError) {
            const updatedContent = getContent(branchKey).value
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
                case 'update_page':
                  pushPageUpdate(updatedContent, toolUse.input.new_slug ?? toolUse.input.slug)
                  break
                case 'restore_revision':
                  // Full rebuild — push all pages
                  for (const page of updatedContent.pages) {
                    pushPageUpdate(updatedContent, page.slug)
                  }
                  pushThemeUpdate(updatedContent.theme.variables)
                  break
              }
            }
          }

          // Track for revision snapshot
          if (execResult.change && !execResult.isError) {
            turnChangeRecords.push({
              toolCallId: toolUse.id,
              toolName: toolUse.name,
              label: execResult.change.label,
            })
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
      }, controller.signal)
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // Stopped by user — keep partial content, mark running tool calls as done
        for (const tc of pendingToolCalls) {
          if (tc.status === 'running') tc.status = 'done'
        }
        const idx = messages.value.findIndex(m => m.id === streamingId)
        if (idx !== -1) messages.value[idx]!.toolCalls = [...pendingToolCalls]
        // Snapshot revision for partial turn
        if (turnChangeRecords.length > 0) {
          const abortMsg = messages.value.find(m => m.id === streamingId)
          if (abortMsg) {
            persistMessage(abortMsg)
            const { createRevision } = useRevisions()
            await createRevision(task.siteId, taskId, abortMsg.id, turnChangeRecords)
          }
        }
        break
      }
      throw e
    }

    const finalMsg = messages.value.find(m => m.id === streamingId)
    if (finalMsg) persistMessage(finalMsg)

    // Snapshot revision if this turn made changes
    if (turnChangeRecords.length > 0 && finalMsg) {
      const { createRevision } = useRevisions()
      await createRevision(task.siteId, taskId, finalMsg.id, turnChangeRecords)
    }

    if (shouldStopLoop || result.stopReason !== 'tool_use') {
      looping = false
    }
  }
  abortControllers.delete(taskId)
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
        .filter(t => t.siteId === unref(siteId) && t.status !== 'merged')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    )
  }

  function getTasksByStatus(siteId: Ref<string | null> | string | null) {
    return computed(() => {
      const grouped: Record<TaskStatus, Task[]> = {
        backlog: [],
        in_progress: [],
        review: [],
        merged: [],
      }
      for (const t of tasks.value) {
        if (t.siteId === unref(siteId)) {
          grouped[t.status].push(t)
        }
      }
      for (const key of Object.keys(grouped) as TaskStatus[]) {
        grouped[key].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      }
      return grouped
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
    context?: TaskContextItem[]
  }): Promise<Task> {
    const now = new Date().toISOString()
    const task: Task = {
      id: `task-${Date.now()}`,
      siteId: opts.siteId,
      agentId: opts.agentId ?? 'wpcom',
      title: opts.title,
      context: opts.context,
      status: 'backlog',
      createdAt: now,
      updatedAt: now,
    }
    assignWorktree(task, opts.title ?? 'new-task')
    tasks.value.push(task)
    await persistTask(task)

    // Fork site content for this task's isolated branch
    const { forkForTask } = useBranches()
    await forkForTask(opts.siteId, task.id)

    return task
  }

  function sendMessage(taskId: string, content: string, context?: TaskContextItem[]) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task && (task.status === 'backlog' || task.status === 'review')) {
      task.status = 'in_progress'
      task.updatedAt = new Date().toISOString()
      persistTask(task)
    }
    appendMessage(taskId, 'user', content, undefined, context)
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
      task.status = 'merged'
      task.updatedAt = new Date().toISOString()
      await persistTask(task)
    }
  }

  async function renameTask(id: string, title: string) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.title = title
      task.updatedAt = new Date().toISOString()
      await persistTask(task)
    }
  }

  async function unarchiveTask(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.archived = false
      task.status = 'in_progress'
      task.updatedAt = new Date().toISOString()
      await persistTask(task)
    }
  }

  async function startTask(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.status = 'in_progress'
      task.updatedAt = new Date().toISOString()
      await persistTask(task)
    }
  }

  async function moveToReview(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.status = 'review'
      task.updatedAt = new Date().toISOString()
      await persistTask(task)
    }
  }

  async function mergeTask(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.status = 'merged'
      task.updatedAt = new Date().toISOString()
      await persistTask(task)
    }
  }

  async function reopenTask(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.status = 'in_progress'
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

  function stopTask(taskId: string) {
    const controller = abortControllers.get(taskId)
    if (controller) controller.abort()
  }

  return {
    tasks,
    messages,
    busyTaskIds,
    getTasksForSite,
    getTasksByStatus,
    getMessages,
    isBusy,
    stopTask,
    createTask,
    sendMessage,
    postMessage,
    streamAgentMessage,
    markRead,
    renameTask,
    archiveTask,
    unarchiveTask,
    startTask,
    moveToReview,
    mergeTask,
    reopenTask,
    generateTaskTitle,
    resetTasks,
    _setTasks,
  }
}

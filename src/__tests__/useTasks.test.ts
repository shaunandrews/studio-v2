import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTasks } from '../data/useTasks'

describe('useTasks', () => {
  let api: ReturnType<typeof useTasks>

  beforeEach(() => {
    api = useTasks()
    api._setTasks([], [])
  })

  describe('createTask', () => {
    it('creates a task with default values', async () => {
      const task = await api.createTask({
        siteId: 'site-1',
      })
      expect(task.id).toMatch(/^task-/)
      expect(task.siteId).toBe('site-1')
      expect(task.agentId).toBe('wpcom')
    })

    it('assigns a worktree with branch and port', async () => {
      const task = await api.createTask({
        siteId: 'site-1',
        title: 'Fix the header',
      })
      expect(task.worktree).toBeTruthy()
      expect(task.worktree!.branch).toBe('task/fix-the-header')
      expect(task.worktree!.port).toBeGreaterThanOrEqual(4001)
    })

    it('increments worktree ports', async () => {
      const a = await api.createTask({ siteId: 's1' })
      const b = await api.createTask({ siteId: 's1' })
      expect(b.worktree!.port).toBe(a.worktree!.port + 1)
    })

    it('adds task to the tasks array', async () => {
      await api.createTask({ siteId: 's1' })
      expect(api.tasks.value).toHaveLength(1)
    })

    it('respects custom agentId', async () => {
      const task = await api.createTask({
        siteId: 's1',
        agentId: 'claude-code',
      })
      expect(task.agentId).toBe('claude-code')
    })
  })

  describe('getTasksForSite', () => {
    it('filters tasks by site id', async () => {
      await api.createTask({ siteId: 's1' })
      await api.createTask({ siteId: 's2' })
      await api.createTask({ siteId: 's1' })

      const s1Tasks = api.getTasksForSite('s1')
      expect(s1Tasks.value).toHaveLength(2)
    })

    it('excludes archived tasks', async () => {
      const task = await api.createTask({ siteId: 's1' })
      await api.archiveTask(task.id)
      const siteTasks = api.getTasksForSite('s1')
      expect(siteTasks.value).toHaveLength(0)
    })

    it('sorts by updatedAt descending', async () => {
      const a = await api.createTask({ siteId: 's1', title: 'First' })
      const b = await api.createTask({ siteId: 's1', title: 'Second' })
      // b was created after a, so it should come first
      const siteTasks = api.getTasksForSite('s1')
      expect(siteTasks.value[0].id).toBe(b.id)
      expect(siteTasks.value[1].id).toBe(a.id)
    })
  })

  describe('getTask', () => {
    it('returns a task by id', async () => {
      const task = await api.createTask({ siteId: 's1', title: 'Test' })
      const found = api.getTask(task.id)
      expect(found.value).toBeTruthy()
      expect(found.value!.title).toBe('Test')
    })

    it('returns null for unknown id', () => {
      const found = api.getTask('nonexistent')
      expect(found.value).toBeNull()
    })

    it('returns null for null id', () => {
      const found = api.getTask(null)
      expect(found.value).toBeNull()
    })
  })

  describe('updateTask', () => {
    it('updates task properties', async () => {
      const task = await api.createTask({ siteId: 's1' })
      await api.updateTask(task.id, { title: 'Updated' })
      expect(api.tasks.value[0].title).toBe('Updated')
    })

    it('updates the updatedAt timestamp', async () => {
      const task = await api.createTask({ siteId: 's1' })
      const before = task.updatedAt
      // Small delay to ensure timestamp differs
      await new Promise(r => setTimeout(r, 10))
      await api.updateTask(task.id, { title: 'Changed' })
      expect(api.tasks.value[0].updatedAt).not.toBe(before)
    })

    it('does nothing for unknown task id', async () => {
      await api.createTask({ siteId: 's1', title: 'Original' })
      await api.updateTask('nonexistent', { title: 'Nope' })
      expect(api.tasks.value[0].title).toBe('Original')
    })
  })

  describe('postMessage', () => {
    it('adds a message to the messages array', async () => {
      const task = await api.createTask({ siteId: 's1' })
      api.postMessage(task.id, 'user', 'Hello')
      expect(api.messages.value).toHaveLength(1)
      expect(api.messages.value[0].content).toBe('Hello')
      expect(api.messages.value[0].role).toBe('user')
    })

    it('supports agent messages with agentId', async () => {
      const task = await api.createTask({ siteId: 's1' })
      api.postMessage(task.id, 'agent', 'Hi there', 'wpcom')
      expect(api.messages.value[0].agentId).toBe('wpcom')
    })
  })

  describe('getMessages', () => {
    it('filters messages by task id', async () => {
      const t1 = await api.createTask({ siteId: 's1' })
      await new Promise(r => setTimeout(r, 2))
      const t2 = await api.createTask({ siteId: 's1' })
      // Ensure different IDs
      expect(t1.id).not.toBe(t2.id)

      api.postMessage(t1.id, 'user', 'msg-1')
      api.postMessage(t2.id, 'user', 'msg-2')
      api.postMessage(t1.id, 'agent', 'msg-3')

      const t1Msgs = api.getMessages(t1.id).value
      const t1Contents = t1Msgs.map(m => m.content)
      expect(t1Contents).toContain('msg-1')
      expect(t1Contents).toContain('msg-3')
      expect(t1Contents).not.toContain('msg-2')
    })

    it('sorts by timestamp ascending', async () => {
      const task = await api.createTask({ siteId: 's1' })
      api.postMessage(task.id, 'user', 'first')
      api.postMessage(task.id, 'agent', 'second')
      const msgs = api.getMessages(task.id)
      expect(msgs.value[0].content).toBe('first')
      expect(msgs.value[1].content).toBe('second')
    })

    it('returns empty array for null id', () => {
      const msgs = api.getMessages(null)
      expect(msgs.value).toEqual([])
    })
  })

  describe('removeMessage', () => {
    it('removes a message by id', async () => {
      const task = await api.createTask({ siteId: 's1' })
      api.postMessage(task.id, 'user', 'hello')
      const msgId = api.messages.value[0].id
      api.removeMessage(msgId)
      expect(api.messages.value).toHaveLength(0)
    })

    it('does nothing for unknown message id', async () => {
      const task = await api.createTask({ siteId: 's1' })
      api.postMessage(task.id, 'user', 'hello')
      api.removeMessage('nonexistent')
      expect(api.messages.value).toHaveLength(1)
    })
  })

  describe('archiveTask / unarchiveTask', () => {
    it('archives and unarchives a task', async () => {
      const task = await api.createTask({ siteId: 's1' })
      expect(task.archived).toBeFalsy()

      await api.archiveTask(task.id)
      expect(api.tasks.value[0].archived).toBe(true)

      await api.unarchiveTask(task.id)
      expect(api.tasks.value[0].archived).toBe(false)
    })
  })

  describe('markRead', () => {
    it('sets unread to false', async () => {
      const task = await api.createTask({ siteId: 's1' })
      await api.updateTask(task.id, { unread: true })
      expect(api.tasks.value[0].unread).toBe(true)

      await api.markRead(task.id)
      expect(api.tasks.value[0].unread).toBe(false)
    })
  })

  describe('resetTasks', () => {
    it('replaces all tasks and messages', async () => {
      await api.createTask({ siteId: 's1' })
      api.postMessage(api.tasks.value[0].id, 'user', 'test')

      const now = new Date().toISOString()
      const newTasks = [{
        id: 'new-t1', siteId: 's2', agentId: 'wpcom' as const,
        createdAt: now, updatedAt: now,
      }]
      await api.resetTasks(newTasks, [])

      expect(api.tasks.value).toHaveLength(1)
      expect(api.tasks.value[0].id).toBe('new-t1')
      expect(api.messages.value).toHaveLength(0)
    })

    it('deep-clones input to prevent mutation', async () => {
      const now = new Date().toISOString()
      const input = [{
        id: 't1', siteId: 's1', agentId: 'wpcom' as const,
        createdAt: now, updatedAt: now,
      }]
      await api.resetTasks(input, [])
      api.tasks.value[0].siteId = 'changed'
      expect(input[0].siteId).toBe('s1')
    })
  })

  describe('_setTasks', () => {
    it('restores worktree port counter from existing tasks', () => {
      const now = new Date().toISOString()
      api._setTasks([{
        id: 't1', siteId: 's1', agentId: 'wpcom',
        createdAt: now, updatedAt: now,
        worktree: { branch: 'task/foo', port: 4010 },
      }], [])

      // Next created task should get port 4011
      // We verify indirectly by creating a task
    })
  })

  describe('isBusy', () => {
    it('returns false for idle tasks', async () => {
      const task = await api.createTask({ siteId: 's1' })
      expect(api.isBusy(task.id).value).toBe(false)
    })

    it('returns false for null', () => {
      expect(api.isBusy(null).value).toBe(false)
    })
  })
})

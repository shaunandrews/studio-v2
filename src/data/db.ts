import Dexie, { type Table } from 'dexie'
import type { Site, Task, Message, PreviewSite } from './types'
import type { SiteContent, Revision, TaskBranch } from './site-types'

class StudioDatabase extends Dexie {
  sites!: Table<Site, string>
  tasks!: Table<Task, string>
  messages!: Table<Message, string>
  previews!: Table<PreviewSite, string>
  siteContent!: Table<SiteContent, string>
  revisions!: Table<Revision, string>
  taskBranches!: Table<TaskBranch, string>

  constructor() {
    super('studio-v2')
    this.version(1).stores({
      sites: 'id',
      tasks: 'id, siteId, status, updatedAt, [siteId+archived]',
      messages: 'id, taskId, timestamp',
    })
    this.version(2).stores({
      sites: 'id',
      tasks: 'id, siteId, status, updatedAt, [siteId+archived]',
      messages: 'id, taskId, timestamp',
      previews: 'id, siteId, status',
    })
    this.version(3).stores({
      sites: 'id',
      tasks: 'id, siteId, status, updatedAt, [siteId+archived]',
      messages: 'id, taskId, timestamp',
      previews: 'id, siteId, status',
      siteContent: 'siteId',
    })
    this.version(4).stores({
      sites: 'id',
      tasks: 'id, siteId, status, updatedAt, [siteId+archived]',
      messages: 'id, taskId, timestamp',
      previews: 'id, siteId, status',
      siteContent: 'siteId',
      revisions: 'id, siteId, taskId, timestamp',
    })
    // v5: Section refactor — shared sections, proper CSS, roles.
    // Clear siteContent to force re-transform from templates on next hydration.
    this.version(5).stores({
      sites: 'id',
      tasks: 'id, siteId, status, updatedAt, [siteId+archived]',
      messages: 'id, taskId, timestamp',
      previews: 'id, siteId, status',
      siteContent: 'siteId',
      revisions: 'id, siteId, taskId, timestamp',
    }).upgrade(tx => {
      return tx.table('siteContent').clear()
    })
    // v6: Task branching — per-task forks of site content with base snapshots.
    this.version(6).stores({
      sites: 'id',
      tasks: 'id, siteId, status, updatedAt, [siteId+archived]',
      messages: 'id, taskId, timestamp',
      previews: 'id, siteId, status',
      siteContent: 'siteId',
      revisions: 'id, siteId, taskId, timestamp',
      taskBranches: 'taskId, siteId',
    })
    // v7: WP templates — clear siteContent to re-transform with wpTemplates data.
    this.version(7).stores({
      sites: 'id',
      tasks: 'id, siteId, status, updatedAt, [siteId+archived]',
      messages: 'id, taskId, timestamp',
      previews: 'id, siteId, status',
      siteContent: 'siteId',
      revisions: 'id, siteId, taskId, timestamp',
      taskBranches: 'taskId, siteId',
    }).upgrade(tx => {
      return tx.table('siteContent').clear()
    })
  }
}

export const db = new StudioDatabase()

let _dbAvailable: boolean | null = null

export async function isDbAvailable(): Promise<boolean> {
  if (_dbAvailable !== null) return _dbAvailable
  try {
    await db.open()
    _dbAvailable = true
  } catch {
    _dbAvailable = false
  }
  return _dbAvailable
}

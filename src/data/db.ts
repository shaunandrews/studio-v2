import Dexie, { type Table } from 'dexie'
import type { Site, Task, Message, PreviewSite } from './types'

class StudioDatabase extends Dexie {
  sites!: Table<Site, string>
  tasks!: Table<Task, string>
  messages!: Table<Message, string>
  previews!: Table<PreviewSite, string>

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

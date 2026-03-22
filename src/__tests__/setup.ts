import { vi } from 'vitest'

// Mock IndexedDB (not available in happy-dom)
// All DB operations are guarded by isDbAvailable() which will return false
vi.mock('../data/db', () => ({
  db: {
    sites: { put: vi.fn(), clear: vi.fn(), bulkPut: vi.fn(), toArray: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0), delete: vi.fn() },
    tasks: { put: vi.fn(), clear: vi.fn(), bulkPut: vi.fn(), toArray: vi.fn().mockResolvedValue([]) },
    messages: { put: vi.fn(), clear: vi.fn(), bulkPut: vi.fn(), toArray: vi.fn().mockResolvedValue([]) },
    previews: { put: vi.fn(), clear: vi.fn(), bulkPut: vi.fn(), toArray: vi.fn().mockResolvedValue([]), delete: vi.fn() },
    transaction: vi.fn((_mode: string, ..._tables: unknown[]) => {
      const fn = _tables[_tables.length - 1]
      if (typeof fn === 'function') return fn()
    }),
  },
  isDbAvailable: vi.fn().mockResolvedValue(false),
}))

// Mock AI service (no network in tests)
vi.mock('../data/ai-service', () => ({
  streamAI: vi.fn().mockResolvedValue('mock AI response'),
  generateTitle: vi.fn().mockResolvedValue('Mock Title'),
}))

// Mock localStorage
const storage = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
})

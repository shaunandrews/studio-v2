import { computed, ref } from 'vue'
import type { PreviewSite, PreviewOperation, PreviewOperationType } from './types'
import { seedPreviews } from './seed-previews'
import { db, isDbAvailable } from './db'
import { toSerializable } from './utils'

// --- Helpers ---

function randomId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function randomSlug(length = 5): string {
  return Math.random().toString(36).slice(2, 2 + length)
}

const PREVIEW_LIFETIME_DAYS = 30

const ADJECTIVES = [
  'calm', 'bright', 'swift', 'gentle', 'bold',
  'quiet', 'warm', 'crisp', 'deep', 'soft',
  'keen', 'pure', 'wild', 'cool', 'fair',
  'glad', 'clear', 'steady', 'kind', 'fine',
]

const ANIMALS = [
  'fox', 'owl', 'heron', 'panda', 'otter',
  'finch', 'hawk', 'lynx', 'robin', 'crane',
  'wolf', 'bear', 'dove', 'wren', 'seal',
  'newt', 'lark', 'moth', 'fawn', 'toad',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generatePreviewUrl(siteSlug: string): string {
  return `${siteSlug}-${pick(ADJECTIVES)}-${pick(ANIMALS)}.wp.build`
}

// --- Persistence ---

async function persistPreview(preview: PreviewSite) {
  try {
    if (await isDbAvailable()) {
      await db.previews.put(toSerializable(preview))
    }
  } catch (e) {
    console.error('[persistPreview] DB write failed:', e)
  }
}

async function deletePreviewFromDb(previewId: string) {
  try {
    if (await isDbAvailable()) {
      await db.previews.delete(previewId)
    }
  } catch (e) {
    console.error('[deletePreview] DB write failed:', e)
  }
}

// --- Module-level state (singleton) ---

const previews = ref<PreviewSite[]>([...seedPreviews])
const operations = ref<PreviewOperation[]>([])

// --- Progress simulation ---

interface StageConfig {
  label: string
  start: number
  end: number
}

const CREATE_STAGES: StageConfig[] = [
  { label: 'Packing your site...', start: 0, end: 20 },
  { label: 'Uploading to the cloud...', start: 20, end: 50 },
  { label: 'Setting up your preview...', start: 50, end: 80 },
  { label: 'Almost there...', start: 80, end: 100 },
]

const UPDATE_STAGES: StageConfig[] = [
  { label: 'Creating archive...', start: 0, end: 30 },
  { label: 'Uploading archive...', start: 30, end: 70 },
  { label: 'Updating preview site...', start: 70, end: 100 },
]

const DELETE_STAGES: StageConfig[] = [
  { label: 'Removing preview site...', start: 0, end: 60 },
  { label: 'Cleaning up...', start: 60, end: 100 },
]

function getStagesForType(type: PreviewOperationType): { stages: StageConfig[]; durationMs: number } {
  switch (type) {
    case 'create': return { stages: CREATE_STAGES, durationMs: 5000 }
    case 'update': return { stages: UPDATE_STAGES, durationMs: 3000 }
    case 'delete': return { stages: DELETE_STAGES, durationMs: 2000 }
  }
}

const activeIntervals = new Map<string, ReturnType<typeof setInterval>>()

function simulateProgress(op: PreviewOperation, onComplete: () => void) {
  const { stages, durationMs } = getStagesForType(op.type)
  const tickMs = 100
  const totalTicks = durationMs / tickMs
  let tick = 0

  const interval = setInterval(() => {
    tick++
    const progress = Math.min(Math.round((tick / totalTicks) * 100), 100)

    // Find current stage
    const stage = stages.find(s => progress >= s.start && progress < s.end)
      ?? stages[stages.length - 1]

    const opRef = operations.value.find(o => o.id === op.id)
    if (!opRef) {
      clearInterval(interval)
      activeIntervals.delete(op.id)
      return
    }

    opRef.progress = progress
    opRef.detail = stage.label

    if (progress >= 100) {
      clearInterval(interval)
      activeIntervals.delete(op.id)
      opRef.status = 'fulfilled'
      onComplete()
    }
  }, tickMs)

  activeIntervals.set(op.id, interval)
}

// --- Expiration ---

function getExpiration(updatedAt: string): { isExpired: boolean; countdown: string; expiresAt: string } {
  const updated = new Date(updatedAt)
  const expires = new Date(updated)
  expires.setDate(expires.getDate() + PREVIEW_LIFETIME_DAYS)
  const expiresAt = expires.toISOString()

  const now = Date.now()
  const diff = expires.getTime() - now

  if (diff <= 0) {
    return { isExpired: true, countdown: 'Expired', expiresAt }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  let countdown: string
  if (days > 1) {
    countdown = `${days} days`
  } else if (days === 1) {
    countdown = '1 day'
  } else if (hours > 1) {
    countdown = `${hours} hours`
  } else {
    countdown = 'Less than an hour'
  }

  return { isExpired: false, countdown, expiresAt }
}

// --- Relative time ---

function relativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  return `${months} month${months === 1 ? '' : 's'} ago`
}

// --- Composable ---

export function usePreviews() {
  function getPreviews(siteId: string) {
    return computed(() =>
      previews.value.filter(p => p.siteId === siteId)
    )
  }

  function activeOperation(siteId: string) {
    return computed(() =>
      operations.value.find(o => o.siteId === siteId && o.status === 'pending') ?? null
    )
  }

  function operationForPreview(previewId: string) {
    return computed(() =>
      operations.value.find(o => o.previewId === previewId && o.status === 'pending') ?? null
    )
  }

  function createPreview(siteId: string, name: string) {
    const opId = `op-${randomId()}`
    const previewId = `prev-${randomId()}`
    const slug = siteId.replace(/[^a-z0-9-]/g, '')

    // Add preview immediately in 'creating' state
    const preview: PreviewSite = {
      id: previewId,
      siteId,
      name,
      url: generatePreviewUrl(slug),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'creating',
      views: 0,
      uniqueVisitors: 0,
      invites: [],
    }
    previews.value.unshift(preview)

    const op: PreviewOperation = {
      id: opId,
      type: 'create',
      previewId,
      siteId,
      progress: 0,
      detail: CREATE_STAGES[0].label,
      status: 'pending',
    }

    operations.value.push(op)

    simulateProgress(op, () => {
      const p = previews.value.find(p => p.id === previewId)
      if (p) {
        p.status = 'active'
        p.updatedAt = new Date().toISOString()
        persistPreview(p)
      }
    })

    return opId
  }

  function updatePreview(previewId: string) {
    const preview = previews.value.find(p => p.id === previewId)
    if (!preview) return null

    const opId = `op-${randomId()}`
    const op: PreviewOperation = {
      id: opId,
      type: 'update',
      previewId,
      siteId: preview.siteId,
      progress: 0,
      detail: UPDATE_STAGES[0].label,
      status: 'pending',
    }

    operations.value.push(op)

    simulateProgress(op, () => {
      const p = previews.value.find(p => p.id === previewId)
      if (p) {
        p.updatedAt = new Date().toISOString()
        persistPreview(p)
      }
    })

    return opId
  }

  function deletePreview(previewId: string) {
    const preview = previews.value.find(p => p.id === previewId)
    if (!preview) return null

    const opId = `op-${randomId()}`
    const op: PreviewOperation = {
      id: opId,
      type: 'delete',
      previewId,
      siteId: preview.siteId,
      progress: 0,
      detail: DELETE_STAGES[0].label,
      status: 'pending',
    }

    operations.value.push(op)

    simulateProgress(op, () => {
      const p = previews.value.find(p => p.id === previewId)
      if (p) {
        p.status = 'deleted'
        deletePreviewFromDb(previewId)
      }
    })

    return opId
  }

  function renamePreview(previewId: string, name: string) {
    const preview = previews.value.find(p => p.id === previewId)
    if (preview) {
      preview.name = name
      persistPreview(preview)
    }
  }

  function extendPreview(previewId: string, days = 30) {
    const preview = previews.value.find(p => p.id === previewId)
    if (preview) {
      const d = new Date()
      d.setDate(d.getDate() + days - PREVIEW_LIFETIME_DAYS)
      preview.updatedAt = d.toISOString()
      persistPreview(preview)
    }
  }

  function clearPreview(previewId: string) {
    const idx = previews.value.findIndex(p => p.id === previewId)
    if (idx !== -1) {
      previews.value.splice(idx, 1)
      deletePreviewFromDb(previewId)
    }
  }

  function updateNote(previewId: string, note: string) {
    const preview = previews.value.find(p => p.id === previewId)
    if (preview) {
      preview.note = note || undefined
      persistPreview(preview)
    }
  }

  function addInvite(previewId: string, email: string) {
    const preview = previews.value.find(p => p.id === previewId)
    if (!preview) return
    if (preview.invites.some(i => i.email === email)) return
    preview.invites.push({
      email,
      sentAt: new Date().toISOString(),
    })
    persistPreview(preview)
  }

  function removeInvite(previewId: string, email: string) {
    const preview = previews.value.find(p => p.id === previewId)
    if (!preview) return
    const idx = preview.invites.findIndex(i => i.email === email)
    if (idx !== -1) {
      preview.invites.splice(idx, 1)
      persistPreview(preview)
    }
  }

  async function resetPreviews(newPreviews: PreviewSite[]) {
    for (const interval of activeIntervals.values()) clearInterval(interval)
    activeIntervals.clear()
    if (await isDbAvailable()) {
      await db.previews.clear()
      if (newPreviews.length) await db.previews.bulkPut(newPreviews)
    }
    previews.value = newPreviews.map(p => ({ ...p }))
    operations.value = []
  }

  function _setPreviews(newPreviews: PreviewSite[]) {
    for (const interval of activeIntervals.values()) clearInterval(interval)
    activeIntervals.clear()
    previews.value = newPreviews
    operations.value = []
  }

  return {
    previews,
    operations,
    getPreviews,
    activeOperation,
    operationForPreview,
    createPreview,
    updatePreview,
    deletePreview,
    renamePreview,
    clearPreview,
    extendPreview,
    updateNote,
    addInvite,
    removeInvite,
    getExpiration,
    relativeTime,
    resetPreviews,
    _setPreviews,
  }
}

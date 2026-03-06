import { computed, ref } from 'vue'
import type { PreviewSite, PreviewInvite, PreviewOperation, PreviewOperationType } from './types'

// --- Helpers ---

function randomId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function randomSlug(length = 5): string {
  return Math.random().toString(36).slice(2, 2 + length)
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

const PREVIEW_LIFETIME_DAYS = 7

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

// --- Seed data ---

const seedPreviews: PreviewSite[] = [
  {
    id: 'prev-cafe-1',
    siteId: 'downstreet-cafe',
    name: 'Preview',
    url: 'downstreet-cafe-warm-heron.wp.build',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3),
    status: 'active',
    views: 0,
    uniqueVisitors: 0,
    invites: [],
  },
  {
    id: 'prev-cafe-2',
    siteId: 'downstreet-cafe',
    name: 'Preview',
    url: 'downstreet-cafe-bold-finch.wp.build',
    createdAt: daysAgo(8),
    updatedAt: daysAgo(6),
    status: 'active',
    note: 'Updated menu for Sarah to review',
    views: 14,
    uniqueVisitors: 3,
    lastVisitedAt: daysAgo(0),
    invites: [
      { email: 'sarah@downstreet.co', sentAt: daysAgo(4), visitedAt: daysAgo(1) },
      { email: 'james@designstudio.com', sentAt: daysAgo(3) },
    ],
  },
  {
    id: 'prev-cafe-3',
    siteId: 'downstreet-cafe',
    name: 'Preview',
    url: 'downstreet-cafe-keen-crane.wp.build',
    createdAt: daysAgo(21),
    updatedAt: daysAgo(10),
    status: 'active',
    views: 10293,
    uniqueVisitors: 3339,
    lastVisitedAt: daysAgo(7),
    invites: [],
  },
]

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
      return
    }

    opRef.progress = progress
    opRef.detail = stage.label

    if (progress >= 100) {
      clearInterval(interval)
      opRef.status = 'fulfilled'
      onComplete()
    }
  }, tickMs)
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
      const slug = siteId.replace(/[^a-z0-9-]/g, '')
      const preview: PreviewSite = {
        id: previewId,
        siteId,
        name,
        url: generatePreviewUrl(slug),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        views: 0,
        uniqueVisitors: 0,
        invites: [],
      }
      previews.value.push(preview)
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
      }
    })

    return opId
  }

  function renamePreview(previewId: string, name: string) {
    const preview = previews.value.find(p => p.id === previewId)
    if (preview) {
      preview.name = name
    }
  }

  function extendPreview(previewId: string) {
    const preview = previews.value.find(p => p.id === previewId)
    if (preview) {
      // Reset the expiry clock by bumping updatedAt to now
      preview.updatedAt = new Date().toISOString()
    }
  }

  function clearPreview(previewId: string) {
    const idx = previews.value.findIndex(p => p.id === previewId)
    if (idx !== -1) {
      previews.value.splice(idx, 1)
    }
  }

  function updateNote(previewId: string, note: string) {
    const preview = previews.value.find(p => p.id === previewId)
    if (preview) {
      preview.note = note || undefined
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
  }

  function removeInvite(previewId: string, email: string) {
    const preview = previews.value.find(p => p.id === previewId)
    if (!preview) return
    const idx = preview.invites.findIndex(i => i.email === email)
    if (idx !== -1) preview.invites.splice(idx, 1)
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
  }
}

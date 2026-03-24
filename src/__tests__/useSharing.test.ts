import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useSharing } from '../data/useSharing'
import type { PreviewSite } from '../data/types'

function makePreview(overrides: Partial<PreviewSite> = {}): PreviewSite {
  return {
    id: `prev-${Math.random().toString(36).slice(2, 8)}`,
    siteId: 'site-1',
    name: 'Test Preview',
    url: 'test-preview.wp.build',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    views: 0,
    uniqueVisitors: 0,
    invites: [],
    ...overrides,
  }
}

describe('useSharing', () => {
  let api: ReturnType<typeof useSharing>

  beforeEach(() => {
    vi.useFakeTimers()
    api = useSharing()
    api._setPreviews([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getPreviews', () => {
    it('filters previews by site id', () => {
      const p1 = makePreview({ siteId: 'site-1' })
      const p2 = makePreview({ siteId: 'site-2' })
      api._setPreviews([p1, p2])

      const result = api.getPreviews('site-1')
      expect(result.value).toHaveLength(1)
      expect(result.value[0].id).toBe(p1.id)
    })
  })

  describe('createPreview', () => {
    it('adds a preview in creating state', () => {
      api.createPreview('site-1', 'My Preview')
      expect(api.previews.value).toHaveLength(1)
      expect(api.previews.value[0].status).toBe('creating')
      expect(api.previews.value[0].name).toBe('My Preview')
    })

    it('creates an associated pending operation', () => {
      api.createPreview('site-1', 'My Preview')
      expect(api.operations.value).toHaveLength(1)
      expect(api.operations.value[0].type).toBe('create')
      expect(api.operations.value[0].status).toBe('pending')
    })

    it('transitions to active after simulation completes', () => {
      api.createPreview('site-1', 'My Preview')
      // Fast-forward past the 5000ms create duration
      vi.advanceTimersByTime(6000)
      expect(api.previews.value[0].status).toBe('active')
      expect(api.operations.value[0].status).toBe('fulfilled')
    })

    it('generates a url containing the site slug', () => {
      api.createPreview('my-cool-site', 'Preview')
      expect(api.previews.value[0].url).toContain('my-cool-site')
      expect(api.previews.value[0].url).toContain('.wp.build')
    })
  })

  describe('deletePreview', () => {
    it('marks preview as deleted after simulation', () => {
      const preview = makePreview()
      api._setPreviews([preview])

      api.deletePreview(preview.id)
      vi.advanceTimersByTime(3000)
      expect(api.previews.value[0].status).toBe('deleted')
    })

    it('returns null for unknown preview', () => {
      expect(api.deletePreview('nonexistent')).toBeNull()
    })
  })

  describe('clearPreview', () => {
    it('removes the preview from the array', () => {
      const preview = makePreview()
      api._setPreviews([preview])

      api.clearPreview(preview.id)
      expect(api.previews.value).toHaveLength(0)
    })
  })

  describe('updateNote', () => {
    it('sets a note on the preview', () => {
      const preview = makePreview()
      api._setPreviews([preview])

      api.updateNote(preview.id, 'Check this out')
      expect(api.previews.value[0].note).toBe('Check this out')
    })

    it('clears note when empty string', () => {
      const preview = makePreview({ note: 'old note' })
      api._setPreviews([preview])

      api.updateNote(preview.id, '')
      expect(api.previews.value[0].note).toBeUndefined()
    })
  })

  describe('invites', () => {
    it('adds an invite', () => {
      const preview = makePreview()
      api._setPreviews([preview])

      api.addInvite(preview.id, 'test@example.com')
      expect(api.previews.value[0].invites).toHaveLength(1)
      expect(api.previews.value[0].invites[0].email).toBe('test@example.com')
    })

    it('does not add duplicate email', () => {
      const preview = makePreview()
      api._setPreviews([preview])

      api.addInvite(preview.id, 'test@example.com')
      api.addInvite(preview.id, 'test@example.com')
      expect(api.previews.value[0].invites).toHaveLength(1)
    })

    it('removes an invite', () => {
      const preview = makePreview()
      api._setPreviews([preview])

      api.addInvite(preview.id, 'test@example.com')
      api.removeInvite(preview.id, 'test@example.com')
      expect(api.previews.value[0].invites).toHaveLength(0)
    })
  })

  describe('getExpiration', () => {
    it('returns not expired for recent preview', () => {
      const result = api.getExpiration(new Date().toISOString())
      expect(result.isExpired).toBe(false)
      expect(result.countdown).toMatch(/\d+ days/)
    })

    it('returns expired for old preview', () => {
      const old = new Date()
      old.setDate(old.getDate() - 31)
      const result = api.getExpiration(old.toISOString())
      expect(result.isExpired).toBe(true)
      expect(result.countdown).toBe('Expired')
    })

    it('returns "1 day" when exactly 1 day remains', () => {
      const almostExpired = new Date()
      almostExpired.setDate(almostExpired.getDate() - 29)
      const result = api.getExpiration(almostExpired.toISOString())
      expect(result.isExpired).toBe(false)
      expect(result.countdown).toBe('1 day')
    })
  })

  describe('relativeTime', () => {
    it('returns "Just now" for recent timestamps', () => {
      expect(api.relativeTime(new Date().toISOString())).toBe('Just now')
    })

    it('returns minutes for recent past', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      expect(api.relativeTime(fiveMinAgo)).toBe('5 min ago')
    })

    it('returns hours for same-day past', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      expect(api.relativeTime(threeHoursAgo)).toBe('3 hours ago')
    })

    it('returns days for recent past', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      expect(api.relativeTime(twoDaysAgo)).toBe('2 days ago')
    })
  })

  describe('resetPreviews', () => {
    it('replaces all previews and clears operations', async () => {
      api.createPreview('site-1', 'Old')
      expect(api.operations.value.length).toBeGreaterThan(0)

      const newPreview = makePreview({ name: 'Fresh' })
      await api.resetPreviews([newPreview])

      expect(api.previews.value).toHaveLength(1)
      expect(api.previews.value[0].name).toBe('Fresh')
      expect(api.operations.value).toHaveLength(0)
    })
  })

  describe('activeOperation', () => {
    it('returns pending operation for a site', () => {
      api.createPreview('site-1', 'Test')
      const op = api.activeOperation('site-1')
      expect(op.value).toBeTruthy()
      expect(op.value!.status).toBe('pending')
    })

    it('returns null when no pending operation', () => {
      const op = api.activeOperation('site-1')
      expect(op.value).toBeNull()
    })
  })
})

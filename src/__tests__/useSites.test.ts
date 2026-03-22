import { describe, it, expect, beforeEach } from 'vitest'
import { useSites } from '../data/useSites'

describe('useSites', () => {
  let api: ReturnType<typeof useSites>

  beforeEach(() => {
    api = useSites()
    // Reset to empty state
    api._setSites([])
  })

  describe('initial state', () => {
    it('starts with empty sites after reset', () => {
      expect(api.sites.value).toEqual([])
    })

    it('has no active site', () => {
      expect(api.activeSiteId.value).toBeNull()
    })

    it('activeProject is null when no site is selected', () => {
      expect(api.activeProject.value).toBeNull()
    })
  })

  describe('createUntitledSite', () => {
    it('creates a site with default values', async () => {
      const site = await api.createUntitledSite()
      expect(site.name).toBe('Untitled site')
      expect(site.status).toBe('stopped')
      expect(site.id).toMatch(/^site-/)
      expect(site.mockLayout).toBe('default')
      expect(site.themeType).toBe('block')
    })

    it('adds the site to the sites array', async () => {
      await api.createUntitledSite()
      expect(api.sites.value).toHaveLength(1)
    })

    it('generates unique ids across time', async () => {
      const a = await api.createUntitledSite()
      // Ensure Date.now() advances
      await new Promise(r => setTimeout(r, 2))
      const b = await api.createUntitledSite()
      expect(a.id).not.toBe(b.id)
    })
  })

  describe('setStatus', () => {
    it('changes site status', async () => {
      const site = await api.createUntitledSite()
      api.setStatus(site.id, 'running')
      expect(api.sites.value[0].status).toBe('running')
    })

    it('does nothing for unknown site id', async () => {
      await api.createUntitledSite()
      api.setStatus('nonexistent', 'running')
      expect(api.sites.value[0].status).toBe('stopped')
    })
  })

  describe('updateSite', () => {
    it('updates site properties', async () => {
      const site = await api.createUntitledSite()
      await api.updateSite(site.id, { name: 'My Site', description: 'A great site' })
      expect(api.sites.value[0].name).toBe('My Site')
      expect(api.sites.value[0].description).toBe('A great site')
    })

    it('does nothing for unknown site id', async () => {
      await api.createUntitledSite()
      await api.updateSite('nonexistent', { name: 'Nope' })
      expect(api.sites.value[0].name).toBe('Untitled site')
    })
  })

  describe('activeProject', () => {
    it('returns the active site when id is set', async () => {
      const site = await api.createUntitledSite()
      api.activeSiteId.value = site.id
      expect(api.activeProject.value).toBeTruthy()
      expect(api.activeProject.value!.id).toBe(site.id)
    })

    it('returns null for invalid active id', () => {
      api.activeSiteId.value = 'bogus'
      expect(api.activeProject.value).toBeNull()
    })
  })

  describe('resetSites', () => {
    it('replaces all sites and clears active id', async () => {
      await api.createUntitledSite()
      api.activeSiteId.value = api.sites.value[0].id

      const newSites = [{
        id: 'new-1', name: 'Fresh', status: 'stopped' as const,
        url: '', createdAt: new Date().toISOString(),
      }]
      await api.resetSites(newSites)

      expect(api.sites.value).toHaveLength(1)
      expect(api.sites.value[0].name).toBe('Fresh')
      expect(api.activeSiteId.value).toBeNull()
    })

    it('deep-clones input to prevent mutation', async () => {
      const input = [{
        id: 's1', name: 'Test', status: 'stopped' as const,
        url: '', createdAt: new Date().toISOString(),
      }]
      await api.resetSites(input)
      api.sites.value[0].name = 'Changed'
      expect(input[0].name).toBe('Test')
    })
  })

  describe('_setSites', () => {
    it('sets sites directly and clears active id', () => {
      const newSites = [{
        id: 's1', name: 'Direct', status: 'running' as const,
        url: '', createdAt: new Date().toISOString(),
      }]
      api._setSites(newSites)
      expect(api.sites.value).toHaveLength(1)
      expect(api.sites.value[0].id).toBe('s1')
      expect(api.activeSiteId.value).toBeNull()
    })
  })
})

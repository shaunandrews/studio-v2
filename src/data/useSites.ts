import { ref, computed } from 'vue'
import { seedProjects } from './seed-sites'
import type { Site, SiteStatus } from './types'

export const ALL_SITES_ID = '__all-sites__'

// Module-level state (singleton — shared across all components)
const sites = ref<Site[]>(structuredClone(seedProjects))
const activeSiteId = ref<string | null>(null)

const activeProject = computed(() =>
  sites.value.find(p => p.id === activeSiteId.value) ?? null
)

export function useSites() {
  function setStatus(siteId: string, status: SiteStatus) {
    const p = sites.value.find(p => p.id === siteId)
    if (p) p.status = status
  }

  function createUntitledSite(): Site {
    const id = `site-${Date.now()}`
    const newSite: Site = {
      id,
      name: 'Untitled site',
      status: 'stopped',
      url: '',
      createdAt: new Date().toISOString(),
      mockLayout: 'default',
      themeType: 'block',
    }
    sites.value.push(newSite)
    return newSite
  }

  function updateSite(id: string, updates: Partial<Pick<Site, 'name' | 'favicon' | 'description'>>) {
    const p = sites.value.find(p => p.id === id)
    if (p) Object.assign(p, updates)
  }

  function resetSites(newSites: Site[]) {
    sites.value = structuredClone(newSites)
    activeSiteId.value = null
  }

  return {
    sites,
    activeSiteId,
    activeProject,
    setStatus,
    createUntitledSite,
    updateSite,
    resetSites,
  }
}

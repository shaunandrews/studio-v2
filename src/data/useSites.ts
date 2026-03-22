import { ref, computed, toRaw } from 'vue'
import { seedProjects } from './seed-sites'
import { db, isDbAvailable } from './db'
import { toSerializable } from './utils'
import type { Site, SiteStatus } from './types'

export const ALL_SITES_ID = '__all-sites__'

// Module-level state (singleton — shared across all components)
const sites = ref<Site[]>(structuredClone(seedProjects))
const activeSiteId = ref<string | null>(null)

const activeProject = computed(() =>
  sites.value.find(p => p.id === activeSiteId.value) ?? null
)

async function persistSite(site: Site) {
  try {
    if (await isDbAvailable()) {
      await db.sites.put(toSerializable(site))
    }
  } catch (e) {
    console.error('[persistSite] DB write failed:', e)
  }
}

export function useSites() {
  function setStatus(siteId: string, status: SiteStatus) {
    const p = sites.value.find(p => p.id === siteId)
    if (p) p.status = status
  }

  async function createUntitledSite(): Promise<Site> {
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
    await persistSite(newSite)
    return newSite
  }

  async function updateSite(id: string, updates: Partial<Pick<Site, 'name' | 'favicon' | 'description'>>) {
    const p = sites.value.find(p => p.id === id)
    if (p) {
      Object.assign(p, updates)
      await persistSite(p)
    }
  }

  async function resetSites(newSites: Site[]) {
    if (await isDbAvailable()) {
      await db.sites.clear()
      if (newSites.length) await db.sites.bulkPut(newSites)
    }
    sites.value = structuredClone(newSites)
    activeSiteId.value = null
  }

  async function reorderSites(fromIndex: number, toIndex: number) {
    const list = [...sites.value]
    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)
    list.forEach((s, i) => { s.sortOrder = i })
    sites.value = list
    if (await isDbAvailable()) {
      await Promise.all(list.map(s => {
        const raw = JSON.parse(JSON.stringify(toRaw(s)))
        return db.sites.put(raw)
      }))
    }
  }

  /** Hydration setter — sets refs without touching DB */
  function _setSites(newSites: Site[]) {
    sites.value = newSites
    activeSiteId.value = null
  }

  return {
    sites,
    activeSiteId,
    activeProject,
    setStatus,
    createUntitledSite,
    updateSite,
    reorderSites,
    resetSites,
    _setSites,
  }
}

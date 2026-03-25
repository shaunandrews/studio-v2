import { ref, computed } from 'vue'
import { personas, getPersona } from './personas'
import { useSites } from './useSites'
import { useTasks } from './useTasks'
import { useSharing } from './useSharing'
import { useAddSite } from './useAddSite'
import { useSettings } from './useSettings'
import { useAuth } from './useAuth'
import { useOnboarding } from './useOnboarding'
import { useHydration } from './useHydration'
import { useSiteDocument } from './useSiteDocument'
import { useRevisions } from './useRevisions'
import { useBranches } from './useBranches'
import { db, isDbAvailable } from './db'
import { generateSeedRevisions } from './seed-revisions'
import type { SiteContent } from './site-types'
import { discardUnsavedSiteSettings } from './useSiteSettings'
import type { Router } from 'vue-router'

const STORAGE_KEY = 'studio-persona'
const URL_PARAM = 'persona'

const activePersonaId = ref<string | null>(null)

// True once a persona has been chosen (either from URL, localStorage, or chooser)
const personaChosen = computed(() => activePersonaId.value !== null)

export function getInitialPersonaId(): string | null {
  // URL param takes precedence
  const urlParams = new URLSearchParams(window.location.search)
  const fromUrl = urlParams.get(URL_PARAM)
  if (fromUrl && getPersona(fromUrl)) return fromUrl

  // Then localStorage
  const fromStorage = localStorage.getItem(STORAGE_KEY)
  if (fromStorage && getPersona(fromStorage)) return fromStorage

  // No persona — show chooser
  return null
}

export function usePersona() {
  async function activatePersona(id: string, router?: Router) {
    const persona = getPersona(id)
    if (!persona) return

    // Reset all state
    const { resetSites } = useSites()
    const { resetTasks } = useTasks()
    const { resetPreviews } = useSharing()
    const { resetAddSite } = useAddSite()
    const { resetSettings } = useSettings()
    const { reset: resetAuth } = useAuth()
    const { reset: resetOnboarding } = useOnboarding()

    // Clear DB and re-seed from persona
    if (await isDbAvailable()) {
      await db.transaction('rw', db.sites, db.tasks, db.messages, db.previews, db.siteContent, db.revisions, db.taskBranches, async () => {
        await db.sites.clear()
        await db.tasks.clear()
        await db.messages.clear()
        await db.previews.clear()
        await db.siteContent.clear()
        await db.revisions.clear()
        await db.taskBranches.clear()
        if (persona.sites.length) await db.sites.bulkPut(persona.sites)
        if (persona.tasks.length) await db.tasks.bulkPut(persona.tasks)
        if (persona.messages.length) await db.messages.bulkPut(persona.messages)
        if (persona.previews.length) await db.previews.bulkPut(persona.previews)
      })
    }

    const { _setContent, initFromTemplate } = useSiteDocument()
    _setContent([])
    const { resetRevisions, _setRevisions } = useRevisions()
    await resetRevisions()
    const { resetBranches } = useBranches()
    await resetBranches()
    await resetSites(persona.sites)
    // Initialize site content from templates so views (e.g. Canvas) have data immediately
    const { getContent } = useSiteDocument()
    for (const site of persona.sites) {
      if (site.mockLayout) {
        await initFromTemplate(site.id, site.mockLayout)
      }
    }
    // Generate seed revisions so Site Timeline has data immediately
    if (persona.messages.length > 0) {
      const contentMap: Record<string, SiteContent> = {}
      for (const site of persona.sites) {
        const c = getContent(site.id).value
        if (c) contentMap[site.id] = c
      }
      const seedRevs = generateSeedRevisions(persona.messages, persona.tasks, contentMap)
      if (seedRevs.length) {
        if (await isDbAvailable()) {
          await db.revisions.bulkPut(seedRevs)
        }
        _setRevisions(seedRevs)
      }
    }
    await resetTasks(persona.tasks, persona.messages)
    // Fork site content for each seeded task so task previews render immediately
    const { forkForTask } = useBranches()
    for (const task of persona.tasks) {
      await forkForTask(task.siteId, task.id)
    }
    await resetPreviews(persona.previews)
    resetAddSite()
    resetSettings()
    resetAuth(persona.auth)
    resetOnboarding(persona.onboardingCompleted)

    activePersonaId.value = id
    localStorage.setItem(STORAGE_KEY, id)

    // Mark hydration as ready
    const { ready } = useHydration()
    ready.value = true

    // Navigate to the right starting point
    if (router) {
      if (!persona.onboardingCompleted) {
        router.push('/welcome')
      } else if (persona.sites.length > 0) {
        router.push(`/sites/${persona.sites[0].id}`)
      } else {
        router.push('/add-site')
      }
    }
  }

  async function clearPersona(router?: Router) {
    // Navigate to chooser FIRST so current-page components unmount
    // before we clear state (avoids render errors from empty refs)
    activePersonaId.value = null
    localStorage.removeItem(STORAGE_KEY)
    discardUnsavedSiteSettings()

    if (router) {
      await router.replace('/choose')
    }

    // Now safe to clear all state — PersonaChooser uses static data only
    const { resetSites } = useSites()
    const { resetTasks } = useTasks()
    const { resetPreviews } = useSharing()
    const { resetAddSite } = useAddSite()
    const { resetSettings } = useSettings()
    const { reset: resetAuth } = useAuth()
    const { reset: resetOnboarding } = useOnboarding()

    // Clear DB
    if (await isDbAvailable()) {
      await db.transaction('rw', db.sites, db.tasks, db.messages, db.previews, db.siteContent, db.revisions, db.taskBranches, async () => {
        await db.sites.clear()
        await db.tasks.clear()
        await db.messages.clear()
        await db.previews.clear()
        await db.siteContent.clear()
        await db.revisions.clear()
        await db.taskBranches.clear()
      })
    }

    const { _setContent } = useSiteDocument()
    _setContent([])
    const { resetRevisions } = useRevisions()
    await resetRevisions()
    const { resetBranches: resetBranches2 } = useBranches()
    await resetBranches2()
    await resetSites([])
    await resetTasks([], [])
    await resetPreviews([])
    resetAddSite()
    resetSettings()
    resetAuth(null)
    resetOnboarding(false)

    const { ready } = useHydration()
    ready.value = false
  }

  return {
    activePersonaId,
    personaChosen,
    personas,
    activatePersona,
    clearPersona,
  }
}

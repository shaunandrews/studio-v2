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
import { db, isDbAvailable } from './db'
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
      await db.transaction('rw', db.sites, db.tasks, db.messages, db.previews, db.siteContent, db.revisions, async () => {
        await db.sites.clear()
        await db.tasks.clear()
        await db.messages.clear()
        await db.previews.clear()
        await db.siteContent.clear()
        await db.revisions.clear()
        if (persona.sites.length) await db.sites.bulkPut(persona.sites)
        if (persona.tasks.length) await db.tasks.bulkPut(persona.tasks)
        if (persona.messages.length) await db.messages.bulkPut(persona.messages)
        if (persona.previews.length) await db.previews.bulkPut(persona.previews)
      })
    }

    const { _setContent } = useSiteDocument()
    _setContent([])
    const { resetRevisions } = useRevisions()
    await resetRevisions()
    await resetSites(persona.sites)
    await resetTasks(persona.tasks, persona.messages)
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
      if (persona.onboardingCompleted) {
        router.push('/all-sites')
      } else {
        router.push('/welcome')
      }
    }
  }

  async function clearPersona(router?: Router) {
    activePersonaId.value = null
    localStorage.removeItem(STORAGE_KEY)

    // Clear DB
    if (await isDbAvailable()) {
      await db.transaction('rw', db.sites, db.tasks, db.messages, db.previews, db.siteContent, db.revisions, async () => {
        await db.sites.clear()
        await db.tasks.clear()
        await db.messages.clear()
        await db.previews.clear()
        await db.siteContent.clear()
        await db.revisions.clear()
      })
    }

    const { _setContent } = useSiteDocument()
    _setContent([])
    const { resetRevisions } = useRevisions()
    await resetRevisions()

    const { ready } = useHydration()
    ready.value = false

    if (router) {
      router.push('/choose')
    }
  }

  return {
    activePersonaId,
    personaChosen,
    personas,
    activatePersona,
    clearPersona,
  }
}

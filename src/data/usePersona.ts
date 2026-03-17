import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { personas, getPersona } from './personas'
import { useSites } from './useSites'
import { useConversations } from './useConversations'
import { useAddSite } from './useAddSite'
import { useSettings } from './useSettings'
import { useSidebarCollapse } from './useSidebarCollapse'
import { useAuth } from './useAuth'
import { useOnboarding } from './useOnboarding'

const STORAGE_KEY = 'studio-persona'
const URL_PARAM = 'persona'

const activePersonaId = ref<string | null>(null)

// True once a persona has been chosen (either from URL, localStorage, or chooser)
const personaChosen = computed(() => activePersonaId.value !== null)

function getInitialPersonaId(): string | null {
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
  function activatePersona(id: string) {
    const persona = getPersona(id)
    if (!persona) return

    // Reset all state
    const { resetSites } = useSites()
    const { resetConversations } = useConversations()
    const { resetAddSite } = useAddSite()
    const { resetSettings } = useSettings()
    const { show } = useSidebarCollapse()
    const { reset: resetAuth } = useAuth()
    const { reset: resetOnboarding } = useOnboarding()

    resetSites(persona.sites)
    resetConversations(persona.conversations, persona.messages)
    resetAddSite()
    resetSettings()
    show() // Reset sidebar to visible
    resetAuth(persona.auth)
    resetOnboarding(persona.onboardingCompleted)

    activePersonaId.value = id
    localStorage.setItem(STORAGE_KEY, id)

    // Reset route so we don't land on a stale route after persona switch
    try {
      const router = useRouter()
      router.push('/')
    } catch {
      // useRouter() throws outside setup context (e.g. during initialize)
    }
  }

  function initialize() {
    const id = getInitialPersonaId()
    if (id) {
      activatePersona(id)
    }
    // If null, personaChosen stays false → chooser shows
  }

  function clearPersona() {
    activePersonaId.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    activePersonaId,
    personaChosen,
    personas,
    activatePersona,
    initialize,
    clearPersona,
  }
}

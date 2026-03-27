import { ref } from 'vue'
import type { WpcomSite } from './types'

// Module-level state (singleton — shared across all components)
const wpcomSites = ref<WpcomSite[]>([])

export function useWpcomSites() {
  function resetWpcomSites(sites: WpcomSite[]) {
    wpcomSites.value = structuredClone(sites)
  }

  function addWpcomSite(site: WpcomSite) {
    wpcomSites.value.push(site)
  }

  /** Hydration setter — populates from persona without side effects */
  function _setWpcomSites(sites: WpcomSite[]) {
    wpcomSites.value = sites
  }

  return { wpcomSites, resetWpcomSites, addWpcomSite, _setWpcomSites }
}

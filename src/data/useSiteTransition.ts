import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

// Module-level state (singleton — shared across all components)
const transitionSiteId = ref<string | null>(null)

/**
 * View Transitions composable for home ↔ site navigation.
 * @param siteRouteName — the route name for site views (e.g. 'site')
 */
export function useSiteTransition(siteRouteName = 'site') {
  const router = useRouter()

  async function navigateToSite(siteId: string) {
    // Already viewing a project — just swap, no transition
    const currentMode = router.currentRoute.value.meta.mode
    if (currentMode === 'site') {
      router.push({ name: siteRouteName, params: { id: siteId } })
      return
    }

    transitionSiteId.value = siteId

    if (!(document as any).startViewTransition) {
      router.push({ name: siteRouteName, params: { id: siteId } })
      return
    }

    await nextTick() // card gets view-transition-name before capture

    const transition = (document as any).startViewTransition(async () => {
      await router.push({ name: siteRouteName, params: { id: siteId } })
      await nextTick()
    })

    transition.finished.then(() => {
      transitionSiteId.value = null
    })
  }

  async function navigateHome() {
    const currentId = router.currentRoute.value.params.id as string
    transitionSiteId.value = currentId

    if (!(document as any).startViewTransition) {
      router.push({ name: 'home' })
      return
    }

    const transition = (document as any).startViewTransition(async () => {
      await router.push({ name: 'home' })
      await nextTick()
    })

    transition.finished.then(() => {
      transitionSiteId.value = null
    })
  }

  return { transitionSiteId, navigateToSite, navigateHome }
}

export { transitionSiteId }

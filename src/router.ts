import { createRouter, createWebHistory } from 'vue-router'
import { useSites } from '@/data/useSites'
import { usePersona, getInitialPersonaId } from '@/data/usePersona'
import { useOnboarding } from '@/data/useOnboarding'
import { useAllSitesView } from '@/data/useAllSitesView'
import { useHydration } from '@/data/useHydration'
import { hasUnsavedSiteSettings, discardUnsavedSiteSettings } from '@/data/useSiteSettings'
import { confirm } from '@/data/useConfirm'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: () => {
        const { personaChosen } = usePersona()
        if (!personaChosen.value) return '/choose'
        const { needsOnboarding } = useOnboarding()
        if (needsOnboarding.value) return '/welcome'
        const { showAllSitesView } = useAllSitesView()
        if (showAllSitesView.value) return '/all-sites'
        const { sites } = useSites()
        if (sites.value.length > 0) return `/site/${sites.value[0].id}`
        return '/all-sites'
      },
    },

    // Persona chooser
    {
      name: 'choose',
      path: '/choose',
      component: () => import('@/components/features/PersonaChooser.vue'),
      meta: { layout: 'bare', setup: true },
    },

    // Onboarding — single page with overlay steps
    {
      path: '/welcome',
      component: () => import('@/pages/OnboardingPage.vue'),
      meta: { layout: 'bare', setup: true },
      children: [
        { name: 'welcome', path: '', component: { render: () => null } },
        { name: 'oauth', path: '/oauth', component: { render: () => null } },
        { name: 'permissions', path: '/permissions', component: { render: () => null } },
      ],
    },

    // Add site flow — full-page routes
    {
      path: '/add-site',
      component: () => import('@/pages/AddSitePage.vue'),
      meta: { layout: 'bare' },
      children: [
        { name: 'add-site', path: '', component: { render: () => null } },
        { name: 'add-site-blueprint', path: 'blueprint', component: { render: () => null } },
        { name: 'add-site-pull', path: 'pull', component: { render: () => null } },
        { name: 'add-site-import', path: 'import', component: { render: () => null } },
        { name: 'add-site-details', path: 'details', component: { render: () => null } },
      ],
    },

    // App routes
    {
      name: 'site',
      path: '/sites/:id',
      components: {
        main: () => import('@/pages/SitePage.vue'),
      },
      meta: { layout: 'main', mode: 'site' },
      redirect: to => ({ name: 'site-overview', params: to.params }),
      beforeEnter: (to) => {
        const { sites } = useSites()
        const exists = sites.value.some(p => p.id === to.params.id)
        if (!exists) {
          const firstSite = sites.value[0]
          if (!firstSite) return '/settings'
          return { name: 'site-overview', params: { id: firstSite.id } }
        }
      },
      children: [
        { name: 'site-overview', path: 'overview', component: { render: () => null } },
        { name: 'site-sitemap', path: 'sitemap', component: { render: () => null } },
        { name: 'site-tasks', path: 'tasks', component: { render: () => null } },
        { name: 'site-task', path: 'tasks/:taskId', component: { render: () => null } },
        { name: 'site-sync', path: 'sync', component: { render: () => null } },
        { name: 'site-previews', path: 'previews', component: { render: () => null } },
        { name: 'site-settings', path: 'settings', component: { render: () => null } },
      ],
    },
    {
      name: 'all-sites',
      path: '/all-sites',
      components: {
        main: () => import('@/pages/SitePage.vue'),
      },
      meta: { layout: 'main', mode: 'site' },
    },
    {
      name: 'settings',
      path: '/settings',
      component: { render: () => null },
      meta: { layout: 'main', mode: 'site' },
    },
    // Dev pages — inside main layout frame
    {
      path: '/dev',
      components: {
        main: () => import('@/pages/DevPage.vue'),
      },
      meta: { layout: 'main', mode: 'dev' },
      redirect: '/dev/design-system',
      children: [
        { name: 'dev-design-system', path: 'design-system', component: () => import('@/pages/DesignSystem.vue') },
        {
          name: 'dev-components',
          path: 'components',
          component: () => import('@/pages/Components.vue'),
          redirect: '/dev/components/primitives',
          children: [
            { name: 'dev-components-primitives', path: 'primitives', component: () => import('@/pages/components/PrimitivesPage.vue') },
            { name: 'dev-components-composites', path: 'composites', component: () => import('@/pages/components/CompositesPage.vue') },
            { name: 'dev-components-features', path: 'features', component: () => import('@/pages/components/FeaturesPage.vue') },
          ],
        },
        { name: 'dev-architecture', path: 'architecture', component: () => import('@/pages/ArchitecturePage.vue') },
        { name: 'dev-jtbd', path: 'jtbd', component: () => import('@/pages/JtbdPage.vue') },
      ],
    },
    // Design overviews — bare layout, no app chrome
    {
      name: 'overviews',
      path: '/overviews',
      component: () => import('@/pages/DesignOverviewsPage.vue'),
      meta: { layout: 'bare' },
    },
    // Catch-all
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// Initialize persona from URL param or localStorage on first navigation
let initialized = false

router.beforeEach(async (to) => {
  if (!initialized) {
    initialized = true
    const id = getInitialPersonaId()
    if (id) {
      // Hydrate from DB (persisted data) rather than re-seeding from persona
      const { hydrate } = useHydration()
      await hydrate(id)
      // Mark persona as chosen
      const { activePersonaId } = usePersona()
      activePersonaId.value = id
      // After activation, onboarding state is set — redirect if landing on / or /choose
      if (to.path === '/' || to.path === '/choose') {
        const { needsOnboarding } = useOnboarding()
        if (needsOnboarding.value) return '/welcome'
        const { showAllSitesView: showAll } = useAllSitesView()
        if (showAll.value) return '/all-sites'
        const { sites: allSites } = useSites()
        if (allSites.value.length > 0) return `/site/${allSites.value[0].id}`
        return '/all-sites'
      }
    }
  }

  // Redirect away from /all-sites when the setting is off
  if (to.name === 'all-sites') {
    const { showAllSitesView: showAll } = useAllSitesView()
    if (!showAll.value) {
      const { sites: allSites } = useSites()
      if (allSites.value.length > 0) return `/site/${allSites.value[0].id}`
    }
  }

  const isSetupRoute = to.meta.setup === true
  const { personaChosen } = usePersona()

  // No persona chosen? Must go to /choose
  if (!personaChosen.value && to.path !== '/choose') {
    return '/choose'
  }

  // Persona chosen but needs onboarding? Block app routes
  if (personaChosen.value && !isSetupRoute) {
    const { needsOnboarding } = useOnboarding()
    if (needsOnboarding.value) {
      return '/welcome'
    }
  }

  // Onboarding flow guards — prevent skipping ahead
  if (to.name === 'oauth' || to.name === 'permissions') {
    const { canAccess } = useOnboarding()
    const step = to.name as 'oauth' | 'permissions'
    if (!canAccess(step)) {
      return '/welcome'
    }
  }

  // Warn when leaving site settings with unsaved changes
  if (hasUnsavedSiteSettings()) {
    const leave = await confirm({
      title: 'Unsaved changes',
      message: 'You have settings changes that haven\'t been saved. If you leave now, those changes will be lost.',
      confirmLabel: 'Discard & Leave',
      cancelLabel: 'Stay',
      destructive: true,
    })
    if (!leave) return false
    discardUnsavedSiteSettings()
  }
})

export default router

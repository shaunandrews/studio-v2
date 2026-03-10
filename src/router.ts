import { createRouter, createWebHistory } from 'vue-router'
import { useSites } from '@/data/useSites'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/all-sites',
    },
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
        { name: 'site-tasks', path: 'tasks', component: { render: () => null } },
        { name: 'site-task', path: 'tasks/:convoId', component: { render: () => null } },
        { name: 'site-sync', path: 'sync', component: { render: () => null } },
        { name: 'site-previews', path: 'previews', component: { render: () => null } },
        { name: 'site-import-export', path: 'import-export', component: { render: () => null } },
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
    // Catch-all
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import { useProjects } from '@/data/useProjects'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/all-sites',
    },
    {
      name: 'project',
      path: '/projects/:id',
      components: {
        main: () => import('@/pages/ProjectPage.vue'),
      },
      meta: { layout: 'main', mode: 'project' },
      redirect: to => ({ name: 'project-tasks', params: to.params }),
      beforeEnter: (to) => {
        const { projects } = useProjects()
        const exists = projects.value.some(p => p.id === to.params.id)
        if (!exists) {
          const firstProject = projects.value[0]
          if (!firstProject) return '/settings'
          return { name: 'project-tasks', params: { id: firstProject.id } }
        }
      },
      children: [
        { name: 'project-tasks', path: 'tasks', component: { render: () => null } },
        { name: 'project-task', path: 'tasks/:convoId', component: { render: () => null } },
        { name: 'project-sync', path: 'sync', component: { render: () => null } },
        { name: 'project-previews', path: 'previews', component: { render: () => null } },
        { name: 'project-import-export', path: 'import-export', component: { render: () => null } },
        { name: 'project-settings', path: 'settings', component: { render: () => null } },
      ],
    },
    {
      name: 'all-sites',
      path: '/all-sites',
      components: {
        main: () => import('@/pages/ProjectPage.vue'),
      },
      meta: { layout: 'main', mode: 'project' },
    },
    {
      name: 'settings',
      path: '/settings',
      component: { render: () => null },
      meta: { layout: 'main', mode: 'project' },
    },
    {
      name: 'add-site',
      path: '/add-site',
      component: () => import('@/pages/AddSitePage.vue'),
      meta: { layout: 'bare' },
    },
    // Dev pages — bare layout (no app chrome)
    {
      name: 'design-system',
      path: '/design-system',
      component: () => import('@/pages/DesignSystem.vue'),
      meta: { layout: 'bare' },
    },
    {
      name: 'components',
      path: '/components',
      component: () => import('@/pages/Components.vue'),
      meta: { layout: 'bare' },
      redirect: '/components/primitives',
      children: [
        { name: 'components-primitives', path: 'primitives', component: () => import('@/pages/components/PrimitivesPage.vue'), meta: { layout: 'bare' } },
        { name: 'components-composites', path: 'composites', component: () => import('@/pages/components/CompositesPage.vue'), meta: { layout: 'bare' } },
        { name: 'components-features', path: 'features', component: () => import('@/pages/components/FeaturesPage.vue'), meta: { layout: 'bare' } },
        { name: 'components-chat-cards', path: 'chat-cards', component: () => import('@/pages/components/ChatCardsPage.vue'), meta: { layout: 'bare' } },
      ],
    },
    {
      name: 'architecture',
      path: '/architecture',
      component: () => import('@/pages/ArchitecturePage.vue'),
      meta: { layout: 'bare' },
    },
    // Catch-all
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router

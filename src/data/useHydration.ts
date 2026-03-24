import { ref } from 'vue'
import { db, isDbAvailable } from './db'
import { useSites } from './useSites'
import { useTasks } from './useTasks'
import { useSharing } from './useSharing'
import { useAuth } from './useAuth'
import { useOnboarding } from './useOnboarding'
import { getPersona } from './personas'
import type { SiteContent } from './site-types'
import { useSiteDocument } from './useSiteDocument'
import { useRevisions } from './useRevisions'
import { generateSeedRevisions } from './seed-revisions'

const ready = ref(false)

export function useHydration() {
  async function hydrate(personaId: string) {
    const persona = getPersona(personaId)
    if (!persona) {
      ready.value = true
      return
    }

    // Restore auth + onboarding from persona (not persisted in DB)
    const { reset: resetAuth } = useAuth()
    const { reset: resetOnboarding } = useOnboarding()
    resetAuth(persona.auth)
    resetOnboarding(persona.onboardingCompleted)

    const dbOk = await isDbAvailable()

    if (dbOk) {
      const count = await db.sites.count()

      if (count === 0) {
        // First load — seed from persona
        await db.transaction('rw', db.sites, db.tasks, db.messages, db.previews, db.siteContent, async () => {
          if (persona.sites.length) await db.sites.bulkPut(persona.sites)
          if (persona.tasks.length) await db.tasks.bulkPut(persona.tasks)
          if (persona.messages.length) await db.messages.bulkPut(persona.messages)
          if (persona.previews.length) await db.previews.bulkPut(persona.previews)
        })
      }

      // Load from DB into refs
      const [dbSites, dbTasks, dbMessages, dbPreviews, dbRevisions] = await Promise.all([
        db.sites.toArray(),
        db.tasks.toArray(),
        db.messages.toArray(),
        db.previews.toArray(),
        db.revisions.toArray(),
      ])

      const { _setSites } = useSites()
      dbSites.sort((a, b) => {
        // Use sortOrder if available, fall back to createdAt
        const aOrder = a.sortOrder ?? Infinity
        const bOrder = b.sortOrder ?? Infinity
        if (aOrder !== bOrder) return aOrder - bOrder
        return a.createdAt.localeCompare(b.createdAt)
      })
      _setSites(dbSites)

      const { _setTasks } = useTasks()
      _setTasks(dbTasks, dbMessages)

      const { _setPreviews } = useSharing()
      _setPreviews(dbPreviews)

      // Hydrate site content
      const { initFromTemplate, _setContent, getContent } = useSiteDocument()
      const dbContent = await db.siteContent.toArray()
      if (dbContent.length > 0) {
        _setContent(dbContent)
      } else {
        for (const site of dbSites) {
          if (site.mockLayout) {
            await initFromTemplate(site.id, site.mockLayout)
          }
        }
      }

      // Hydrate revisions — generate seed data if table is empty
      const { _setRevisions } = useRevisions()
      if (dbRevisions.length > 0) {
        _setRevisions(dbRevisions)
      } else if (persona.messages.length > 0) {
        const contentMap: Record<string, SiteContent> = {}
        for (const site of dbSites) {
          const c = getContent(site.id).value
          if (c) contentMap[site.id] = c
        }
        const seedRevs = generateSeedRevisions(persona.messages, persona.tasks, contentMap)
        if (seedRevs.length) {
          await db.revisions.bulkPut(seedRevs)
          _setRevisions(seedRevs)
        }
      }
    } else {
      // No IndexedDB — in-memory only from persona
      const { _setSites } = useSites()
      _setSites(structuredClone(persona.sites))

      const { _setTasks } = useTasks()
      _setTasks(
        persona.tasks.map(t => ({ ...t })),
        persona.messages.map(m => ({ ...m })),
      )

      const { _setPreviews } = useSharing()
      _setPreviews(persona.previews.map(p => ({ ...p })))

      // Hydrate site content from templates in memory
      const { initFromTemplate, getContent } = useSiteDocument()
      for (const site of persona.sites) {
        if (site.mockLayout) {
          await initFromTemplate(site.id, site.mockLayout ?? 'default')
        }
      }

      // Generate seed revisions in memory
      if (persona.messages.length > 0) {
        const contentMap: Record<string, SiteContent> = {}
        for (const site of persona.sites) {
          const c = getContent(site.id).value
          if (c) contentMap[site.id] = c
        }
        const { _setRevisions } = useRevisions()
        _setRevisions(generateSeedRevisions(persona.messages, persona.tasks, contentMap))
      }
    }

    ready.value = true
  }

  return { ready, hydrate }
}

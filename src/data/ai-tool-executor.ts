import { useSiteDocument } from './useSiteDocument'
import { useRevisions } from './useRevisions'
import type { Change } from './site-types'

interface ExecutionResult {
  result: string
  isError: boolean
  change: Change | null
}

export function executeToolCall(
  siteId: string,
  toolName: string,
  args: Record<string, any>,
  toolCallId: string,
  taskId?: string,
): ExecutionResult {
  const {
    getContent,
    updateSection,
    createSection,
    removeSection,
    updateTheme,
    addPage,
    removePage,
    reorderSections,
    updatePage,
  } = useSiteDocument()

  let change: Change | null = null

  try {
    switch (toolName) {
      case 'update_section':
        change = updateSection(siteId, args.section_id, {
          html: args.html,
          css: args.css,
        })
        if (!change) return { result: `Section "${args.section_id}" not found`, isError: true, change: null }
        change.toolCallId = toolCallId
        return { result: `Updated section "${args.section_id}"`, isError: false, change }

      case 'create_section':
        change = createSection(siteId, args.page_slug, {
          sectionId: args.section_id,
          html: args.html,
          css: args.css,
          role: args.role,
          position: args.position,
        })
        if (!change) return { result: `Page "${args.page_slug}" not found`, isError: true, change: null }
        change.toolCallId = toolCallId
        return { result: `Created section "${args.section_id}" on page "${args.page_slug}"`, isError: false, change }

      case 'remove_section': {
        // Check if section is shared before attempting removal
        const content = getContent(siteId).value
        const targetSection = content?.sections[args.section_id]
        if (targetSection?.shared) {
          return { result: `Cannot remove shared section "${args.section_id}" — it appears on all pages. Use update_section to modify it instead.`, isError: true, change: null }
        }
        change = removeSection(siteId, args.page_slug, args.section_id)
        if (!change) return { result: 'Section or page not found', isError: true, change: null }
        change.toolCallId = toolCallId
        return { result: `Removed section "${args.section_id}"`, isError: false, change }
      }

      case 'update_theme':
        change = updateTheme(siteId, args.variables)
        if (!change) return { result: 'Site not found', isError: true, change: null }
        change.toolCallId = toolCallId
        return { result: 'Updated theme variables', isError: false, change }

      case 'add_page':
        change = addPage(siteId, { slug: args.slug, title: args.title })
        if (!change) return { result: 'Site not found', isError: true, change: null }
        change.toolCallId = toolCallId
        return { result: `Added page "${args.title}" at ${args.slug}`, isError: false, change }

      case 'remove_page':
        change = removePage(siteId, args.slug)
        if (!change) return { result: `Page "${args.slug}" not found`, isError: true, change: null }
        change.toolCallId = toolCallId
        return { result: `Removed page "${args.slug}"`, isError: false, change }

      case 'reorder_sections':
        change = reorderSections(siteId, args.page_slug, args.section_ids)
        if (!change) return { result: `Page "${args.page_slug}" not found`, isError: true, change: null }
        change.toolCallId = toolCallId
        return { result: `Reordered sections on "${args.page_slug}"`, isError: false, change }

      case 'update_page':
        change = updatePage(siteId, args.slug, { title: args.title, newSlug: args.new_slug })
        if (!change) return { result: `Page "${args.slug}" not found`, isError: true, change: null }
        change.toolCallId = toolCallId
        return { result: `Updated page "${args.slug}"`, isError: false, change }

      case 'get_section': {
        const content = getContent(siteId).value
        const section = content?.sections[args.section_id]
        if (!section) return { result: `Section "${args.section_id}" not found`, isError: true, change: null }
        return {
          result: JSON.stringify({ id: section.id, html: section.html, css: section.css, role: section.role, shared: section.shared ?? false }),
          isError: false,
          change: null,
        }
      }

      case 'get_page': {
        const content = getContent(siteId).value
        const page = content?.pages.find(p => p.slug === args.page_slug)
        if (!page) return { result: `Page "${args.page_slug}" not found`, isError: true, change: null }
        const sections = page.sections.map(id => {
          const s = content!.sections[id]
          return s ? { id: s.id, role: s.role, shared: s.shared ?? false } : { id, missing: true }
        })
        return {
          result: JSON.stringify({ slug: page.slug, title: page.title, template: page.template, sections }),
          isError: false,
          change: null,
        }
      }

      case 'get_revision_history': {
        const { getRevisionsForTask } = useRevisions()
        if (!taskId) return { result: 'No task context available', isError: true, change: null }
        const revs = getRevisionsForTask(taskId).value
        const limit = args.limit ?? 10
        const summary = revs.slice(0, limit).map(r => ({
          id: r.id,
          label: r.label,
          timestamp: r.timestamp,
          changeCount: r.changes.length,
        }))
        return { result: JSON.stringify(summary), isError: false, change: null }
      }

      case 'restore_revision': {
        const { getRevisionSnapshot } = useRevisions()
        const { _setContentForKey } = useSiteDocument()
        const snapshot = getRevisionSnapshot(args.revision_id)
        if (!snapshot) return { result: `Revision "${args.revision_id}" not found`, isError: true, change: null }

        // Capture current state for undo
        const currentContent = getContent(siteId).value
        const prevSnapshot = currentContent ? JSON.parse(JSON.stringify(currentContent)) : null

        // Replace content with revision snapshot
        const restored = { ...JSON.parse(JSON.stringify(snapshot)), siteId }
        _setContentForKey(siteId, restored)

        change = {
          id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          siteId,
          toolCallId,
          toolName: 'restore_revision',
          label: `Restored revision "${args.revision_id}"`,
          timestamp: new Date().toISOString(),
          undo: () => {
            if (prevSnapshot) _setContentForKey(siteId, prevSnapshot)
          },
        }
        return { result: `Restored to revision "${args.revision_id}"`, isError: false, change }
      }

      default:
        return { result: `Unknown tool: ${toolName}`, isError: true, change: null }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { result: `Error executing ${toolName}: ${msg}`, isError: true, change: null }
  }
}

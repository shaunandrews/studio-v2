import { useSiteDocument } from './useSiteDocument'
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

      default:
        return { result: `Unknown tool: ${toolName}`, isError: true, change: null }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { result: `Error executing ${toolName}: ${msg}`, isError: true, change: null }
  }
}

import type { SiteContent } from './site-types'
import type { TaskContextItem } from './types'

export const siteTools = [
  {
    name: 'update_section',
    description: 'Update the HTML and/or CSS of an existing section on the site. Provide complete HTML/CSS, not partial diffs.',
    input_schema: {
      type: 'object' as const,
      properties: {
        section_id: { type: 'string', description: 'The ID of the section to update' },
        html: { type: 'string', description: 'New HTML content for the section' },
        css: { type: 'string', description: 'New CSS styles for the section' },
      },
      required: ['section_id'],
    },
  },
  {
    name: 'create_section',
    description: 'Create a new section on a page. Provide complete HTML and CSS.',
    input_schema: {
      type: 'object' as const,
      properties: {
        page_slug: { type: 'string', description: 'The page slug (e.g., "/" for home, "/about")' },
        section_id: { type: 'string', description: 'A unique ID for the new section (e.g., "testimonials")' },
        html: { type: 'string', description: 'HTML content for the section' },
        css: { type: 'string', description: 'CSS styles for the section' },
        role: { type: 'string', description: 'Optional semantic role (e.g., "header", "footer", "hero")' },
        position: { type: 'number', description: 'Insert position (0-based index). Omit to append at end.' },
      },
      required: ['page_slug', 'section_id', 'html', 'css'],
    },
  },
  {
    name: 'remove_section',
    description: 'Remove a section from a page.',
    input_schema: {
      type: 'object' as const,
      properties: {
        page_slug: { type: 'string', description: 'The page slug' },
        section_id: { type: 'string', description: 'The section ID to remove' },
      },
      required: ['page_slug', 'section_id'],
    },
  },
  {
    name: 'update_theme',
    description: 'Update theme CSS custom properties (colors, fonts, spacing). Provide the variables to change — unchanged variables are preserved.',
    input_schema: {
      type: 'object' as const,
      properties: {
        variables: {
          type: 'object',
          description: 'CSS custom properties to set, e.g., {"--bg": "#fff", "--accent": "#3b82f6"}',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['variables'],
    },
  },
  {
    name: 'add_page',
    description: 'Add a new page to the site.',
    input_schema: {
      type: 'object' as const,
      properties: {
        slug: { type: 'string', description: 'URL slug for the page (e.g., "/services")' },
        title: { type: 'string', description: 'Page title' },
      },
      required: ['slug', 'title'],
    },
  },
  {
    name: 'remove_page',
    description: 'Remove a page from the site.',
    input_schema: {
      type: 'object' as const,
      properties: {
        slug: { type: 'string', description: 'URL slug of the page to remove' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'reorder_sections',
    description: 'Reorder sections on a page.',
    input_schema: {
      type: 'object' as const,
      properties: {
        page_slug: { type: 'string', description: 'The page slug' },
        section_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Section IDs in the desired order',
        },
      },
      required: ['page_slug', 'section_ids'],
    },
  },
  {
    name: 'update_page',
    description: 'Update a page\'s title and/or URL slug.',
    input_schema: {
      type: 'object' as const,
      properties: {
        slug: { type: 'string', description: 'Current URL slug of the page to update' },
        title: { type: 'string', description: 'New title for the page' },
        new_slug: { type: 'string', description: 'New URL slug for the page' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'get_section',
    description: 'Returns the full HTML and CSS of a section. Use this to inspect a section before making changes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        section_id: { type: 'string', description: 'The ID of the section to inspect' },
      },
      required: ['section_id'],
    },
  },
  {
    name: 'get_page',
    description: 'Returns the page structure including all section IDs, their roles, and whether they are shared.',
    input_schema: {
      type: 'object' as const,
      properties: {
        page_slug: { type: 'string', description: 'The page slug (e.g., "/" for home, "/about")' },
      },
      required: ['page_slug'],
    },
  },
  {
    name: 'get_revision_history',
    description: 'Lists recent revisions for the current task, showing what changed and when.',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Maximum number of revisions to return (default 10)' },
      },
      required: [],
    },
  },
  {
    name: 'restore_revision',
    description: 'Restores the site to the state captured in a previous revision. Use get_revision_history to find revision IDs.',
    input_schema: {
      type: 'object' as const,
      properties: {
        revision_id: { type: 'string', description: 'The ID of the revision to restore' },
      },
      required: ['revision_id'],
    },
  },
]

// Set of page slugs and section IDs that have full content in the Focus section
interface FocusSet {
  pageSlugs: Set<string>
  sectionIds: Set<string>
}

function buildFocusSet(context?: TaskContextItem[]): FocusSet {
  const pageSlugs = new Set<string>()
  const sectionIds = new Set<string>()
  if (!context) return { pageSlugs, sectionIds }
  for (const item of context) {
    if (item.type === 'page') pageSlugs.add(item.pageSlug)
    if (item.type === 'section') sectionIds.add(item.sectionId)
  }
  return { pageSlugs, sectionIds }
}

function formatSectionSummary(id: string, s: { html: string; role?: string; shared?: boolean } | undefined): string {
  if (!s) return `  - ${id} (missing)`
  if (s.shared) return `  - ${id} [${s.role}] (shared)`
  const role = s.role ? ` [${s.role}]` : ''
  const preview = s.html.replace(/<[^>]*>/g, '').trim().slice(0, 80)
  return `  - ${id}${role}: "${preview}..."`
}

function formatSectionFull(id: string, s: { html: string; css: string; role?: string; shared?: boolean }): string {
  const role = s.role ? ` [${s.role}]` : ''
  const shared = s.shared ? ' (shared — changes apply site-wide)' : ''
  return `  ### ${id}${role}${shared}\n  HTML:\n  ${s.html}\n\n  CSS:\n  ${s.css}`
}

export function buildSystemPrompt(content: SiteContent, context?: TaskContextItem[]): string {
  const themeVars = Object.entries(content.theme.variables)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n')

  const focus = buildFocusSet(context)

  // Separate shared sections from page-specific ones
  const sharedSections = Object.values(content.sections).filter(s => s.shared)
  const sharedDesc = sharedSections.length > 0
    ? sharedSections.map(s => {
        const preview = s.html.replace(/<[^>]*>/g, '').trim().slice(0, 80)
        return `  - ${s.id} [${s.role}] (shared): "${preview}..."`
      }).join('\n')
    : '  (none)'

  const pagesDesc = content.pages.map(page => {
    const isFocusedPage = focus.pageSlugs.has(page.slug)
    const sectionList = page.sections
      .map(id => {
        const s = content.sections[id]
        if (!s) return `  - ${id} (missing)`
        // Full content for focused pages or individually focused sections
        if (isFocusedPage || focus.sectionIds.has(id)) {
          return formatSectionFull(id, s)
        }
        return formatSectionSummary(id, s)
      })
      .join('\n')
    return `### ${page.title} (${page.slug})\n${sectionList}`
  }).join('\n\n')

  // Build focus header if context exists
  let focusSection = ''
  if (context && context.length > 0) {
    const labels = context.map(item => {
      if (item.type === 'page') return `Page "${item.pageTitle}" (${item.pageSlug})`
      if (item.type === 'section') return `Section "${item.sectionId}" on page "${item.pageTitle}" (${item.pageSlug})${item.shared ? ' (shared)' : ''}`
      return `Template "${item.templateLabel}" (${item.templateSlug})`
    })
    focusSection = `\n\n## Focus\nThe user is working on: ${labels.join(', ')}.\nFull HTML and CSS for focused areas are included inline above.`
  }

  return `You are Kit, a WordPress assistant in WordPress Studio. You can edit this site using the tools provided.

## Site: ${content.name}

## Theme Variables
${themeVars}

## Shared Sections
These sections appear on every page. Updating one applies the change site-wide.
${sharedDesc}

## Pages & Sections
${pagesDesc}${focusSection}

## Guidelines
- Use the provided tools to make changes. Always execute changes with tools rather than just describing them.
- When updating a section, provide COMPLETE HTML and CSS — not partial diffs or snippets.
- Use the site's theme variables (e.g., var(--bg), var(--accent)) in your CSS.
- Keep the existing design language unless explicitly asked to change it.
- Sections marked (shared) appear on every page. Updating one updates all pages. Do not use remove_section on shared sections.
- Be concise in your text responses. The tools do the work.`
}

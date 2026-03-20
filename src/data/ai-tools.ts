import type { SiteContent } from './site-types'

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
]

export function buildSystemPrompt(content: SiteContent): string {
  const themeVars = Object.entries(content.theme.variables)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n')

  const pagesDesc = content.pages.map(page => {
    const sectionList = page.sections
      .map(id => {
        const s = content.sections[id]
        if (!s) return `  - ${id} (missing)`
        const role = s.role ? ` [${s.role}]` : ''
        const preview = s.html.replace(/<[^>]*>/g, '').trim().slice(0, 80)
        return `  - ${id}${role}: "${preview}..."`
      })
      .join('\n')
    return `### ${page.title} (${page.slug})\n${sectionList}`
  }).join('\n\n')

  return `You are Kit, a WordPress assistant in WordPress Studio. You can edit this site using the tools provided.

## Site: ${content.name}

## Theme Variables
${themeVars}

## Pages & Sections
${pagesDesc}

## Guidelines
- Use the provided tools to make changes. Always execute changes with tools rather than just describing them.
- When updating a section, provide COMPLETE HTML and CSS — not partial diffs or snippets.
- Use the site's theme variables (e.g., var(--bg), var(--accent)) in your CSS.
- Keep the existing design language unless explicitly asked to change it.
- Be concise in your text responses. The tools do the work.`
}

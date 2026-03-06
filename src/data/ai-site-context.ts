import type { Site } from '@shared/data/site-types'

/**
 * Build a site context string for the AI system prompt.
 * Gives the AI awareness of the current theme variables,
 * page structure, and section layout.
 */
export function buildSiteContext(site: Site): string {
  const lines: string[] = []

  lines.push('## Your Current Site')
  lines.push('')
  lines.push(`Name: ${site.name}`)
  if (site.description) {
    lines.push(`Description: ${site.description}`)
  }

  // Theme variables
  lines.push('')
  lines.push('### Theme (CSS Custom Properties)')
  lines.push('These are the actual variable names used in the site. When proposing color changes via card:themeUpdate, use palette slugs that match these variable suffixes (e.g. --color-primary → slug "primary").')
  lines.push('')
  for (const [key, value] of Object.entries(site.theme.variables)) {
    lines.push(`${key}: ${value}`)
  }

  // Fonts
  if (site.theme.fonts.length > 0) {
    lines.push('')
    lines.push(`Fonts: ${site.theme.fonts.join(', ')}`)
  }

  // Dark mode variables
  if (site.theme.darkVariables) {
    lines.push('')
    lines.push('### Dark Mode Variables')
    lines.push('This site has dark mode. To change dark mode colors, use `"mode": "dark"` in your card:themeUpdate. The dark mode uses these variables (same keys, different values):')
    lines.push('')
    for (const [key, value] of Object.entries(site.theme.darkVariables)) {
      lines.push(`${key}: ${value}`)
    }
  }

  // Pages and sections
  lines.push('')
  lines.push('### Pages & Sections')
  for (const page of site.pages) {
    const sectionList = page.sections
      .map(id => {
        const section = site.sections[id]
        return section?.role ? `${id} (${section.role})` : id
      })
      .join(', ')
    lines.push(`${page.slug} (${page.title}): ${sectionList}`)
  }

  // Explicit slug list for duplicate detection
  lines.push('')
  lines.push(`Existing page slugs: ${site.pages.map(p => p.slug).join(', ')}`)

  // Include HTML/CSS for shared sections (used on 2+ pages) so AI can propose edits
  const sectionPageCount: Record<string, number> = {}
  for (const page of site.pages) {
    for (const sid of page.sections) {
      sectionPageCount[sid] = (sectionPageCount[sid] || 0) + 1
    }
  }
  const sharedIds = Object.entries(sectionPageCount)
    .filter(([, count]) => count >= 2)
    .map(([id]) => id)

  if (sharedIds.length > 0) {
    lines.push('')
    lines.push('### Shared Section Content')
    lines.push('These sections appear on multiple pages. When editing them (e.g. updating navigation links), use their current HTML and CSS as the base for your card:sectionEdit.')
    for (const id of sharedIds) {
      const section = site.sections[id]
      if (!section) continue
      lines.push('')
      lines.push(`#### ${id}`)
      lines.push('```html')
      lines.push(section.html)
      lines.push('```')
      lines.push('```css')
      lines.push(section.css)
      lines.push('```')
    }
  }

  return lines.join('\n')
}

import { ref, computed } from 'vue'
import type { SiteContent, SiteContentSection, SiteContentPage, Change } from './site-types'
import type { SiteFiles } from './useSiteTemplates'
import { db, isDbAvailable } from './db'
import { toSerializable } from './utils'

// Module-level state (singleton)
const contentMap = ref<Record<string, SiteContent>>({})
const changeStacks = ref<Record<string, Change[]>>({})

// ---- Persistence ----

async function persistContent(content: SiteContent) {
  try {
    if (await isDbAvailable()) {
      await db.siteContent.put(toSerializable(content))
    }
  } catch (e) {
    console.error('[persistContent] DB write failed:', e)
  }
}

// ---- Template Transformation Helpers ----

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * Extract <style> blocks from HTML, returning cleaned HTML and concatenated CSS.
 * CSS is returned as-is — scoping is implicit via the renderer's
 * per-section <style> tags and descriptive class names.
 */
function extractStyles(html: string): { html: string; css: string } {
  const styleBlocks: string[] = []
  const cleaned = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, content: string) => {
    styleBlocks.push(content.trim())
    return ''
  })

  if (styleBlocks.length === 0) return { html: cleaned.trim(), css: '' }

  return { html: cleaned.trim(), css: styleBlocks.join('\n') }
}

/**
 * Extract sections from template HTML by finding top-level <div data-section="..."> wrappers.
 * Returns the innerHTML of each wrapper along with its section name and role.
 * If no data-section wrappers are found, the entire template is returned as one "content" section.
 */
function extractSections(html: string): { name: string; role?: string; html: string }[] {
  const sectionRegex = /<div\s+data-section="([^"]+)"(?:\s+data-role="([^"]+)")?\s*>/gi
  const matches: { name: string; role?: string; outerStart: number }[] = []

  let match
  while ((match = sectionRegex.exec(html)) !== null) {
    matches.push({
      name: match[1],
      role: match[2] || undefined,
      outerStart: match.index,
    })
  }

  if (matches.length === 0) {
    return [{ name: 'content', html: html.trim() }]
  }

  const result: { name: string; role?: string; html: string }[] = []

  for (const m of matches) {
    // Find the opening tag's end
    const openTagEnd = html.indexOf('>', m.outerStart) + 1

    // Find the matching closing </div> by counting depth
    let depth = 1
    let pos = openTagEnd
    while (depth > 0 && pos < html.length) {
      const nextOpen = html.indexOf('<div', pos)
      const nextClose = html.indexOf('</div>', pos)
      if (nextClose === -1) break
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++
        pos = nextOpen + 4
      } else {
        depth--
        if (depth === 0) {
          const innerHTML = html.slice(openTagEnd, nextClose).trim()
          result.push({ name: m.name, role: m.role, html: innerHTML })
        }
        pos = nextClose + 6
      }
    }
  }

  return result.length > 0 ? result : [{ name: 'content', html: html.trim() }]
}

// ---- Template Transformation ----

function transformSiteFiles(siteId: string, files: SiteFiles): SiteContent {
  const { config, parts, templates } = files
  const variables: Record<string, string> = {}
  const fonts: string[] = []

  for (const [key, value] of Object.entries(config.theme.colors)) {
    variables[`--${key}`] = value
  }
  for (const [key, value] of Object.entries(config.theme.fonts)) {
    variables[`--font-${key}`] = value
    const family = value.split(',')[0].trim().replace(/^'|'$/g, '')
    if (!fonts.includes(family) && !family.includes('-apple-system')) {
      fonts.push(family)
    }
  }
  for (const [key, value] of Object.entries(config.theme.spacing)) {
    variables[`--${key}`] = value
  }

  const sections: Record<string, SiteContentSection> = {}

  // Create shared sections from parts (header, footer, etc.)
  const sharedSectionIds: Record<string, string> = {} // part name → section id
  for (const partName of config.parts) {
    const partHtml = parts[partName]
    if (!partHtml) continue
    const sectionId = `shared-${partName}`
    const { html, css } = extractStyles(partHtml)
    sections[sectionId] = {
      id: sectionId,
      html,
      css,
      role: partName,
      shared: true,
    }
    sharedSectionIds[partName] = sectionId
  }

  // Process each page template
  const pages = config.pages.map(page => {
    const templateHtml = templates[page.template] ?? ''

    // Strip {{part}} placeholders — these become shared section references
    const stripped = templateHtml
      .replace(/^\s*\{\{(\w+)\}\}\s*$/gm, '')
      .trim()

    // Extract sections from data-section wrapper divs
    const extracted = extractSections(stripped)

    // Build page-specific sections
    const pageSectionIds: string[] = []

    // Add shared header at the start (if exists)
    if (sharedSectionIds['header']) {
      pageSectionIds.push(sharedSectionIds['header'])
    }

    for (const chunk of extracted) {
      const sectionId = chunk.name
      const { html, css } = extractStyles(chunk.html)
      sections[sectionId] = {
        id: sectionId,
        html,
        css,
        role: chunk.role || slugify(chunk.name),
      }
      pageSectionIds.push(sectionId)
    }

    // Add shared footer at the end (if exists)
    if (sharedSectionIds['footer']) {
      pageSectionIds.push(sharedSectionIds['footer'])
    }

    return {
      slug: page.slug,
      title: page.title,
      sections: pageSectionIds,
    }
  })

  return {
    siteId,
    name: config.name,
    theme: { fonts, variables },
    pages,
    sections,
  }
}

// ---- Change helpers ----

function makeChangeId(): string {
  return `change-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function pushChange(siteId: string, change: Change) {
  if (!changeStacks.value[siteId]) changeStacks.value[siteId] = []
  changeStacks.value[siteId].push(change)
}

// ---- Mutation functions ----

function updateSection(
  siteId: string,
  sectionId: string,
  updates: { html?: string; css?: string },
): Change | null {
  const content = contentMap.value[siteId]
  if (!content) return null
  const section = content.sections[sectionId]
  if (!section) return null

  const prevHtml = section.html
  const prevCss = section.css

  if (updates.html !== undefined) section.html = updates.html
  if (updates.css !== undefined) section.css = updates.css
  persistContent(content)

  const change: Change = {
    id: makeChangeId(),
    siteId,
    toolName: 'update_section',
    label: `Updated section "${sectionId}"`,
    timestamp: new Date().toISOString(),
    undo: () => {
      const c = contentMap.value[siteId]
      if (!c) return
      const s = c.sections[sectionId]
      if (!s) return
      s.html = prevHtml
      s.css = prevCss
      persistContent(c)
    },
  }

  pushChange(siteId, change)
  return change
}

function createSection(
  siteId: string,
  pageSlug: string,
  opts: { sectionId: string; html: string; css: string; role?: string; position?: number },
): Change | null {
  const content = contentMap.value[siteId]
  if (!content) return null
  const page = content.pages.find(p => p.slug === pageSlug)
  if (!page) return null

  const section: SiteContentSection = {
    id: opts.sectionId,
    html: opts.html,
    css: opts.css,
    role: opts.role,
  }
  content.sections[opts.sectionId] = section

  if (opts.position !== undefined && opts.position < page.sections.length) {
    page.sections.splice(opts.position, 0, opts.sectionId)
  } else {
    page.sections.push(opts.sectionId)
  }
  persistContent(content)

  const change: Change = {
    id: makeChangeId(),
    siteId,
    toolName: 'create_section',
    label: `Created section "${opts.sectionId}"`,
    timestamp: new Date().toISOString(),
    undo: () => {
      const c = contentMap.value[siteId]
      if (!c) return
      const p = c.pages.find(pg => pg.slug === pageSlug)
      if (p) {
        const idx = p.sections.indexOf(opts.sectionId)
        if (idx !== -1) p.sections.splice(idx, 1)
      }
      delete c.sections[opts.sectionId]
      persistContent(c)
    },
  }

  pushChange(siteId, change)
  return change
}

function removeSection(
  siteId: string,
  pageSlug: string,
  sectionId: string,
): Change | null {
  const content = contentMap.value[siteId]
  if (!content) return null
  const section = content.sections[sectionId]
  if (!section) return null
  // Guard: shared sections cannot be removed from individual pages
  if (section.shared) return null
  const page = content.pages.find(p => p.slug === pageSlug)
  if (!page) return null
  const idx = page.sections.indexOf(sectionId)
  if (idx === -1) return null

  const prevSection = { ...section }
  const prevPosition = idx

  page.sections.splice(idx, 1)
  delete content.sections[sectionId]
  persistContent(content)

  const change: Change = {
    id: makeChangeId(),
    siteId,
    toolName: 'remove_section',
    label: `Removed section "${sectionId}"`,
    timestamp: new Date().toISOString(),
    undo: () => {
      const c = contentMap.value[siteId]
      if (!c) return
      c.sections[sectionId] = { ...prevSection }
      const p = c.pages.find(pg => pg.slug === pageSlug)
      if (p) p.sections.splice(prevPosition, 0, sectionId)
      persistContent(c)
    },
  }

  pushChange(siteId, change)
  return change
}

function updateTheme(
  siteId: string,
  variables: Record<string, string>,
): Change | null {
  const content = contentMap.value[siteId]
  if (!content) return null

  const prevVariables = { ...content.theme.variables }

  Object.assign(content.theme.variables, variables)
  persistContent(content)

  const change: Change = {
    id: makeChangeId(),
    siteId,
    toolName: 'update_theme',
    label: 'Updated theme variables',
    timestamp: new Date().toISOString(),
    undo: () => {
      const c = contentMap.value[siteId]
      if (!c) return
      c.theme.variables = prevVariables
      persistContent(c)
    },
  }

  pushChange(siteId, change)
  return change
}

function addPage(
  siteId: string,
  opts: { slug: string; title: string },
): Change | null {
  const content = contentMap.value[siteId]
  if (!content) return null

  const page: SiteContentPage = {
    slug: opts.slug,
    title: opts.title,
    sections: [],
  }
  content.pages.push(page)
  persistContent(content)

  const change: Change = {
    id: makeChangeId(),
    siteId,
    toolName: 'add_page',
    label: `Added page "${opts.title}"`,
    timestamp: new Date().toISOString(),
    undo: () => {
      const c = contentMap.value[siteId]
      if (!c) return
      const i = c.pages.findIndex(p => p.slug === opts.slug)
      if (i !== -1) c.pages.splice(i, 1)
      persistContent(c)
    },
  }

  pushChange(siteId, change)
  return change
}

function removePage(
  siteId: string,
  slug: string,
): Change | null {
  const content = contentMap.value[siteId]
  if (!content) return null
  const idx = content.pages.findIndex(p => p.slug === slug)
  if (idx === -1) return null

  const prevPage = { ...content.pages[idx], sections: [...content.pages[idx].sections] }
  const prevSections: Record<string, SiteContentSection> = {}
  for (const sid of prevPage.sections) {
    if (content.sections[sid]) prevSections[sid] = { ...content.sections[sid] }
  }

  for (const sid of prevPage.sections) {
    // Don't delete shared sections — they belong to other pages too
    if (!content.sections[sid]?.shared) {
      delete content.sections[sid]
    }
  }
  content.pages.splice(idx, 1)
  persistContent(content)

  const change: Change = {
    id: makeChangeId(),
    siteId,
    toolName: 'remove_page',
    label: `Removed page "${prevPage.title}"`,
    timestamp: new Date().toISOString(),
    undo: () => {
      const c = contentMap.value[siteId]
      if (!c) return
      c.pages.splice(idx, 0, prevPage)
      Object.assign(c.sections, prevSections)
      persistContent(c)
    },
  }

  pushChange(siteId, change)
  return change
}

function reorderSections(
  siteId: string,
  pageSlug: string,
  sectionIds: string[],
): Change | null {
  const content = contentMap.value[siteId]
  if (!content) return null
  const page = content.pages.find(p => p.slug === pageSlug)
  if (!page) return null

  // Ensure shared sections maintain their positions (header first, footer last)
  const sharedHeader = page.sections.find(id => content.sections[id]?.shared && content.sections[id]?.role === 'header')
  const sharedFooter = page.sections.find(id => content.sections[id]?.shared && content.sections[id]?.role === 'footer')
  const nonShared = sectionIds.filter(id => !content.sections[id]?.shared)
  const reordered = [
    ...(sharedHeader ? [sharedHeader] : []),
    ...nonShared,
    ...(sharedFooter ? [sharedFooter] : []),
  ]

  const prevOrder = [...page.sections]
  page.sections = reordered
  persistContent(content)

  const change: Change = {
    id: makeChangeId(),
    siteId,
    toolName: 'reorder_sections',
    label: `Reordered sections on "${pageSlug}"`,
    timestamp: new Date().toISOString(),
    undo: () => {
      const c = contentMap.value[siteId]
      if (!c) return
      const p = c.pages.find(pg => pg.slug === pageSlug)
      if (p) p.sections = prevOrder
      persistContent(c)
    },
  }

  pushChange(siteId, change)
  return change
}

function undoChange(siteId: string, changeId: string) {
  const stack = changeStacks.value[siteId]
  if (!stack) return
  const idx = stack.findIndex(c => c.id === changeId)
  if (idx === -1) return
  stack[idx].undo()
  stack.splice(idx, 1)
}

// ---- Composable ----

export function useSiteDocument() {
  function getContent(siteId: string) {
    return computed(() => contentMap.value[siteId] ?? null)
  }

  /** Direct read from contentMap — safe to call inside other computeds. */
  function readContent(siteId: string): SiteContent | null {
    return contentMap.value[siteId] ?? null
  }

  async function initFromTemplate(siteId: string, mockLayout: string) {
    if (await isDbAvailable()) {
      const existing = await db.siteContent.get(siteId)
      if (existing) {
        contentMap.value[siteId] = existing
        return
      }
    }
    const { sites } = await import('./sites/index')
    const files = sites[mockLayout]
    if (!files) return
    const content = transformSiteFiles(siteId, files)
    contentMap.value[siteId] = content
    await persistContent(content)
  }

  function _setContent(records: SiteContent[]) {
    const map: Record<string, SiteContent> = {}
    for (const r of records) map[r.siteId] = r
    contentMap.value = map
  }

  function _setContentForKey(key: string, content: SiteContent) {
    contentMap.value[key] = content
  }

  function _removeContent(key: string) {
    delete contentMap.value[key]
  }

  return {
    getContent,
    readContent,
    updateSection,
    createSection,
    removeSection,
    updateTheme,
    addPage,
    removePage,
    reorderSections,
    undoChange,
    initFromTemplate,
    _setContent,
    _setContentForKey,
    _removeContent,
  }
}

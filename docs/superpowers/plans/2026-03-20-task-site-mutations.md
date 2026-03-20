# Task-Driven Site Mutations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow AI tasks to make real, live changes to site content via Claude's native tool_use.

**Architecture:** New `useSiteContent` composable holds mutable site content (separate from the lightweight `Site` record). Claude receives tool definitions (update_section, create_section, etc.) and returns structured tool_use blocks. A client-side agentic loop executes tools against the content store and pushes changes to the preview iframe via postMessage. Each change is individually undoable.

**Tech Stack:** Vue 3 + TypeScript, Dexie (IndexedDB), Anthropic SDK (`@anthropic-ai/sdk`), Express proxy

**Spec:** `docs/superpowers/specs/2026-03-20-task-site-mutations-design.md`

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `src/data/site-types.ts` | Shared types: `SiteDocument`, `SiteContent`, `SiteContentTheme`, `SiteContentPage`, `SiteContentSection`, `Change` |
| `src/data/useSiteContent.ts` | Mutable site content store: CRUD mutations, undo stack, IndexedDB persistence |
| `src/data/ai-tools.ts` | Tool definitions array for Claude API, `buildSystemPrompt()` |
| `src/data/ai-tool-executor.ts` | Maps tool names → `useSiteContent` mutations, returns result + Change |
| `src/data/usePreviewSync.ts` | Composable to register/access preview iframe ref + push changes via postMessage |

### Modified Files

| File | Changes |
|------|---------|
| `src/data/db.ts` | Add `siteContent` table (version 3) |
| `src/data/types.ts` | Add `changeId` to ToolCall, `'reverted'` to ToolCallStatus |
| `src/data/useHydration.ts` | Initialize SiteContent for each site on hydration |
| `server.ts` | Accept `tools`, increase `max_tokens`, stream tool_use events |
| `src/data/ai-service.ts` | New `streamAIWithTools()` that handles text + tool_use SSE events |
| `src/data/useTasks.ts` | Agentic loop in `sendMessage()`: stream → execute tools → loop |
| `src/components/composites/ToolCallItem.vue` | Reverted status styling, undo button |
| `src/pages/SitePage.vue` | Preview iframe pane for task view |

---

## Task 1: Shared Types (`site-types.ts`)

**Files:**
- Create: `src/data/site-types.ts`

This file is already imported by `site-renderer.ts` (line 8: `import type { Site } from './site-types'`) but doesn't exist yet. Creating it unblocks the renderer and provides the foundation for everything else.

**Important:** The renderer imports `Site` from this file, but `src/data/types.ts` already exports a different `Site` (the lightweight record with `id`, `status`, `mockLayout`). To avoid a naming collision, we name the content-rich type `SiteDocument` here and re-export it as `Site` for the renderer's existing import. All new code should import `SiteDocument` directly.

- [ ] **Step 1: Create `src/data/site-types.ts`**

```typescript
export interface SiteContentTheme {
  fonts: string[]
  variables: Record<string, string>
  darkVariables?: Record<string, string>
}

export interface SiteContentPage {
  slug: string
  title: string
  sections: string[]
}

export interface SiteContentSection {
  id: string
  html: string
  css: string
  role?: string
}

// The content-rich site type (pages, sections, theme).
// Re-exported as `Site` for backward compat with site-renderer.ts import.
export interface SiteDocument {
  name: string
  theme: SiteContentTheme
  pages: SiteContentPage[]
  sections: Record<string, SiteContentSection>
}

// Backward-compat alias — site-renderer.ts does `import type { Site } from './site-types'`
export type Site = SiteDocument

export interface SiteContent extends SiteDocument {
  siteId: string
}

export interface Change {
  id: string
  siteId: string
  toolCallId?: string
  toolName: string
  label: string
  timestamp: string
  undo: () => void
}
```

- [ ] **Step 2: Update `src/data/types.ts`**

Add `changeId` and `'reverted'` status:

```typescript
// In ToolCallStatus union, add 'reverted':
export type ToolCallStatus = 'running' | 'done' | 'error' | 'reverted'

// In ToolCall interface, add:
changeId?: string
```

- [ ] **Step 3: Verify build**

Run: `npx vue-tsc --noEmit`
Expected: No new type errors (the renderer already expects this import to exist).

- [ ] **Step 4: Commit**

```bash
git add src/data/site-types.ts src/data/types.ts
git commit -m "feat: add site content types and Change interface"
```

---

## Task 2: Database Schema Update (`db.ts`)

**Files:**
- Modify: `src/data/db.ts`

Add the `siteContent` table as a new Dexie version.

- [ ] **Step 1: Add version 3 to `db.ts`**

After the existing `this.version(2).stores(...)` block, add:

```typescript
this.version(3).stores({
  sites: 'id',
  tasks: 'id, siteId, status, updatedAt, [siteId+archived]',
  messages: 'id, taskId, timestamp',
  previews: 'id, siteId, status',
  siteContent: 'siteId',
})
```

Also add the table declaration in the class body:

```typescript
siteContent!: Table<import('./site-types').SiteContent, string>
```

And add the import at the top:

```typescript
import type { SiteContent } from './site-types'
```

- [ ] **Step 2: Verify dev server starts**

Run: `npm run dev`
Expected: No errors. IndexedDB auto-upgrades to version 3.

- [ ] **Step 3: Commit**

```bash
git add src/data/db.ts
git commit -m "feat: add siteContent table to IndexedDB schema"
```

---

## Task 3: Site Content Store (`useSiteContent.ts`)

**Files:**
- Create: `src/data/useSiteContent.ts`

This is the core data layer. It holds mutable site content, persists to IndexedDB, and provides mutation functions that return `Change` objects for undo.

**Key reference files:**
- `src/data/useSites.ts` — follow the same singleton pattern (module-level refs, write-through persistence)
- `src/data/useSiteTemplates.ts` — `SiteTheme` interface (colors/fonts/spacing as Records), `resolveParts()` for template `{{placeholder}}` resolution
- `src/data/sites/cafe/site.json` — example of `SiteConfig.theme` structure
- `src/data/sites/cafe/index.ts` — example of `SiteFiles` structure
- `src/data/utils.ts` — `toSerializable()` for DB writes
- `src/data/site-types.ts` (from Task 1) — `SiteContent`, `Change` types

- [ ] **Step 1: Create `src/data/useSiteContent.ts`**

Module-level state:

```typescript
import { ref, computed } from 'vue'
import type { SiteContent, SiteContentSection, Change } from './site-types'
import type { SiteFiles } from './useSiteTemplates'
import { db, isDbAvailable } from './db'
import { toSerializable } from './utils'

const contentMap = ref<Record<string, SiteContent>>({})
const changeStacks = ref<Record<string, Change[]>>({})
```

- [ ] **Step 2: Implement `initFromTemplate()`**

This transforms static `SiteFiles` → `SiteContent`. Key transformation logic:

- `config.theme.colors` entries → `variables` as `--key: value`
- `config.theme.fonts` entries → `variables` as `--font-key: value`; values into `fonts` array
- `config.theme.spacing` entries → `variables` as `--key: value`
- Template HTML: resolve `{{header}}`/`{{footer}}` via parts, then treat the full resolved HTML as a single section per page (section ID = `{pageTemplate}-content`, role = undefined)

For the prototype, each page's resolved template becomes one big section. This is the simplest transformation — we're not parsing HTML comments to split into multiple sections. The AI can later use `create_section` to break pages into finer-grained pieces.

```typescript
function transformSiteFiles(siteId: string, files: SiteFiles): SiteContent {
  const { config, parts, templates } = files
  const variables: Record<string, string> = {}
  const fonts: string[] = []

  // Flatten theme into CSS variables
  for (const [key, value] of Object.entries(config.theme.colors)) {
    variables[`--${key}`] = value
  }
  for (const [key, value] of Object.entries(config.theme.fonts)) {
    variables[`--font-${key}`] = value
    // Extract unique font family names for Google Fonts
    const family = value.split(',')[0].trim().replace(/^'|'$/g, '')
    if (!fonts.includes(family) && !family.includes('-apple-system')) {
      fonts.push(family)
    }
  }
  for (const [key, value] of Object.entries(config.theme.spacing)) {
    variables[`--${key}`] = value
  }

  // Build sections and pages
  const sections: Record<string, SiteContentSection> = {}
  const pages = config.pages.map(page => {
    const templateHtml = templates[page.template] ?? ''
    const resolved = templateHtml.replace(/\{\{(\w+)\}\}/g, (_, name) => parts[name] ?? '')
    const sectionId = `${page.template}-content`
    sections[sectionId] = {
      id: sectionId,
      html: resolved,
      css: '',
    }
    return {
      slug: page.slug,
      title: page.title,
      sections: [sectionId],
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
```

- [ ] **Step 3: Implement persistence helpers**

```typescript
async function persistContent(content: SiteContent) {
  try {
    if (await isDbAvailable()) {
      await db.siteContent.put(toSerializable(content))
    }
  } catch (e) {
    console.error('[persistContent] DB write failed:', e)
  }
}
```

- [ ] **Step 4: Implement mutation functions**

Each mutation: (1) captures previous state in closure, (2) mutates the ref, (3) persists to DB, (4) returns a `Change`.

Example for `updateSection`:

```typescript
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
    id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

  if (!changeStacks.value[siteId]) changeStacks.value[siteId] = []
  changeStacks.value[siteId].push(change)
  return change
}
```

Implement all seven mutations following this same pattern:
- `updateSection(siteId, sectionId, { html?, css? })`
- `createSection(siteId, pageSlug, { sectionId, html, css, role?, position? })`
- `removeSection(siteId, pageSlug, sectionId)`
- `updateTheme(siteId, variables)`
- `addPage(siteId, { slug, title, sections? })`
- `removePage(siteId, slug)`
- `reorderSections(siteId, pageSlug, sectionIds)`

- [ ] **Step 5: Implement undo**

```typescript
function undoChange(siteId: string, changeId: string) {
  const stack = changeStacks.value[siteId]
  if (!stack) return
  const idx = stack.findIndex(c => c.id === changeId)
  if (idx === -1) return
  stack[idx].undo()
  stack.splice(idx, 1)
}
```

- [ ] **Step 6: Implement composable export**

```typescript
export function useSiteContent() {
  function getContent(siteId: string) {
    return computed(() => contentMap.value[siteId] ?? null)
  }

  function getChanges(siteId: string) {
    return computed(() => changeStacks.value[siteId] ?? [])
  }

  async function initFromTemplate(siteId: string, mockLayout: string) {
    // Check DB first
    if (await isDbAvailable()) {
      const existing = await db.siteContent.get(siteId)
      if (existing) {
        contentMap.value[siteId] = existing
        return
      }
    }
    // Transform from static files
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

  return {
    getContent,
    getChanges,
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
  }
}
```

- [ ] **Step 7: Verify build**

Run: `npx vue-tsc --noEmit`

- [ ] **Step 8: Commit**

```bash
git add src/data/useSiteContent.ts
git commit -m "feat: add mutable site content store with undo"
```

---

## Task 4: Hydration Integration

**Files:**
- Modify: `src/data/useHydration.ts`

On app load, initialize `SiteContent` for each site.

- [ ] **Step 1: Add siteContent hydration**

After loading sites from DB and calling `_setSites()`, add:

```typescript
import { useSiteContent } from './useSiteContent'

// Inside hydrate(), after _setSites(dbSites):
const { initFromTemplate, _setContent } = useSiteContent()

if (dbOk) {
  const dbContent = await db.siteContent.toArray()
  if (dbContent.length > 0) {
    _setContent(dbContent)
  } else {
    // First load — transform templates for each site
    for (const site of dbSites) {
      if (site.mockLayout) {
        await initFromTemplate(site.id, site.mockLayout)
      }
    }
  }
} else {
  // No DB — transform templates in memory
  for (const site of persona.sites) {
    if (site.mockLayout) {
      await initFromTemplate(site.id, site.mockLayout ?? 'default')
    }
  }
}
```

Also update the transaction table list in the first-load seed block (line 33 of `useHydration.ts`):

```typescript
// Change from:
await db.transaction('rw', db.sites, db.tasks, db.messages, db.previews, async () => {
// To:
await db.transaction('rw', db.sites, db.tasks, db.messages, db.previews, db.siteContent, async () => {
```

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`, open the app, check DevTools → Application → IndexedDB → studio-v2 → siteContent.
Expected: Records exist for each site, with `siteId`, `name`, `theme`, `pages`, `sections`.

- [ ] **Step 3: Commit**

```bash
git add src/data/useHydration.ts
git commit -m "feat: hydrate site content from templates on first load"
```

---

## Task 5: Preview Sync Composable (`usePreviewSync.ts`)

**Files:**
- Create: `src/data/usePreviewSync.ts`

A simple composable that holds a reference to the preview iframe so data-layer code can push changes to it. Components register the iframe ref; the tool execution loop reads it.

- [ ] **Step 1: Create `src/data/usePreviewSync.ts`**

```typescript
import { ref, type Ref } from 'vue'
import { sendSectionUpdate, sendThemeUpdate, sendPageUpdate } from './site-renderer'
import type { SiteContent, Change } from './site-types'

const iframeRef = ref<HTMLIFrameElement | null>(null)

export function usePreviewSync() {
  function registerIframe(el: Ref<HTMLIFrameElement | null> | HTMLIFrameElement | null) {
    if (el && 'value' in el) {
      iframeRef.value = el.value
    } else {
      iframeRef.value = el
    }
  }

  function unregisterIframe() {
    iframeRef.value = null
  }

  function pushSectionUpdate(sectionId: string, html: string, css: string, order?: number) {
    if (!iframeRef.value) return
    sendSectionUpdate(iframeRef.value, sectionId, html, css, order)
  }

  function pushThemeUpdate(variables: Record<string, string>) {
    if (!iframeRef.value) return
    sendThemeUpdate(iframeRef.value, variables)
  }

  function pushPageUpdate(content: SiteContent, pageSlug: string) {
    if (!iframeRef.value) return
    // sendPageUpdate expects a Site, which SiteContent extends
    sendPageUpdate(iframeRef.value, content, pageSlug, { preserveScroll: true })
  }

  return {
    iframeRef,
    registerIframe,
    unregisterIframe,
    pushSectionUpdate,
    pushThemeUpdate,
    pushPageUpdate,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/usePreviewSync.ts
git commit -m "feat: add preview sync composable for iframe postMessage"
```

---

## Task 6: Tool Definitions & System Prompt (`ai-tools.ts`)

**Files:**
- Create: `src/data/ai-tools.ts`

- [ ] **Step 1: Create `src/data/ai-tools.ts`**

Define the 7 tools as a plain array. These get sent to the server in the request body.

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/data/ai-tools.ts
git commit -m "feat: add Claude tool definitions and dynamic system prompt"
```

---

## Task 7: Tool Executor (`ai-tool-executor.ts`)

**Files:**
- Create: `src/data/ai-tool-executor.ts`

Maps tool names from Claude's `tool_use` blocks to `useSiteContent` mutations.

- [ ] **Step 1: Create `src/data/ai-tool-executor.ts`**

```typescript
import { useSiteContent } from './useSiteContent'
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
    updateSection,
    createSection,
    removeSection,
    updateTheme,
    addPage,
    removePage,
    reorderSections,
  } = useSiteContent()

  let change: Change | null = null

  try {
    switch (toolName) {
      case 'update_section':
        change = updateSection(siteId, args.section_id, {
          html: args.html,
          css: args.css,
        })
        if (!change) return { result: `Section "${args.section_id}" not found`, isError: true, change: null }
        if (change) change.toolCallId = toolCallId
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
        if (change) change.toolCallId = toolCallId
        return { result: `Created section "${args.section_id}" on page "${args.page_slug}"`, isError: false, change }

      case 'remove_section':
        change = removeSection(siteId, args.page_slug, args.section_id)
        if (!change) return { result: `Section or page not found`, isError: true, change: null }
        if (change) change.toolCallId = toolCallId
        return { result: `Removed section "${args.section_id}"`, isError: false, change }

      case 'update_theme':
        change = updateTheme(siteId, args.variables)
        if (!change) return { result: `Site not found`, isError: true, change: null }
        if (change) change.toolCallId = toolCallId
        return { result: `Updated theme variables`, isError: false, change }

      case 'add_page':
        change = addPage(siteId, { slug: args.slug, title: args.title })
        if (!change) return { result: `Site not found`, isError: true, change: null }
        if (change) change.toolCallId = toolCallId
        return { result: `Added page "${args.title}" at ${args.slug}`, isError: false, change }

      case 'remove_page':
        change = removePage(siteId, args.slug)
        if (!change) return { result: `Page "${args.slug}" not found`, isError: true, change: null }
        if (change) change.toolCallId = toolCallId
        return { result: `Removed page "${args.slug}"`, isError: false, change }

      case 'reorder_sections':
        change = reorderSections(siteId, args.page_slug, args.section_ids)
        if (!change) return { result: `Page "${args.page_slug}" not found`, isError: true, change: null }
        if (change) change.toolCallId = toolCallId
        return { result: `Reordered sections on "${args.page_slug}"`, isError: false, change }

      default:
        return { result: `Unknown tool: ${toolName}`, isError: true, change: null }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { result: `Error executing ${toolName}: ${msg}`, isError: true, change: null }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/ai-tool-executor.ts
git commit -m "feat: add tool executor mapping Claude tool_use to site mutations"
```

---

## Task 8: Server Streaming Update (`server.ts`)

**Files:**
- Modify: `server.ts`

Update the Express proxy to accept tools, increase max_tokens, and stream tool_use events alongside text.

**Backward compatibility:** The new event handlers must still emit `{ type: 'text', text }` events for text deltas — the existing `streamAI` client in `ai-service.ts` parses this format and is used for non-tool conversations and title generation. Do NOT change the SSE format for text events.

- [ ] **Step 1: Update `/api/chat` endpoint**

The current endpoint only listens for `stream.on('text', ...)`. Replace with full event streaming.

Read `server.ts` fully before editing. Key changes:

1. Accept `tools` and `max_tokens` from request body
2. Pass `tools` to `client.messages.stream()` if present
3. Use `max_tokens` from request or default to `16000` (up from `4096`)
4. Replace `stream.on('text', ...)` with event listeners for all content block types:

```typescript
// Replace the existing stream event handlers with:
res.setHeader('Content-Type', 'text/event-stream')
res.setHeader('Cache-Control', 'no-cache')
res.setHeader('Connection', 'keep-alive')

stream.on('contentBlockStart', (event) => {
  if (event.content_block.type === 'tool_use') {
    res.write(`data: ${JSON.stringify({
      type: 'tool_use_start',
      id: event.content_block.id,
      name: event.content_block.name,
    })}\n\n`)
  }
})

stream.on('contentBlockDelta', (event) => {
  if (event.delta.type === 'text_delta') {
    res.write(`data: ${JSON.stringify({ type: 'text', text: event.delta.text })}\n\n`)
  } else if (event.delta.type === 'input_json_delta') {
    res.write(`data: ${JSON.stringify({
      type: 'tool_use_delta',
      partial_json: event.delta.partial_json,
    })}\n\n`)
  }
})

stream.on('contentBlockStop', (event) => {
  // We just need to signal block end; the client accumulates JSON
  res.write(`data: ${JSON.stringify({ type: 'content_block_stop' })}\n\n`)
})

const finalMessage = await stream.finalMessage()
res.write(`data: ${JSON.stringify({
  type: 'done',
  stop_reason: finalMessage.stop_reason,
})}\n\n`)
res.end()
```

Also update the `client.messages.stream()` call:

```typescript
const stream = client.messages.stream({
  model: model ?? 'claude-sonnet-4-6',
  max_tokens: max_tokens ?? 16000,
  system: system ?? '',
  messages,
  ...(tools?.length ? { tools } : {}),
})
```

- [ ] **Step 2: Test with curl**

```bash
curl -X POST http://localhost:3025/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```
Expected: SSE stream with `data: {"type":"text","text":"..."}` events, ending with `data: {"type":"done","stop_reason":"end_turn"}`.

- [ ] **Step 3: Commit**

```bash
git add server.ts
git commit -m "feat: stream tool_use events from server proxy"
```

---

## Task 9: AI Service — Tool-Aware Streaming (`ai-service.ts`)

**Files:**
- Modify: `src/data/ai-service.ts`

Add `streamAIWithTools()` that parses text + tool_use SSE events and calls callbacks.

- [ ] **Step 1: Add `streamAIWithTools()` to `ai-service.ts`**

Keep existing `streamAI` and `generateTitle` unchanged. Add new function:

```typescript
export interface ToolUseResult {
  id: string
  name: string
  input: Record<string, any>
}

export interface StreamCallbacks {
  onText: (accumulated: string) => void
  onToolUseStart: (id: string, name: string) => void
  onToolUseComplete: (toolUse: ToolUseResult) => void
}

export interface StreamResult {
  stopReason: string
  text: string
  toolUses: ToolUseResult[]
}

export async function streamAIWithTools(
  messages: Array<{ role: string; content: any }>,
  tools: any[],
  system: string,
  callbacks: StreamCallbacks,
): Promise<StreamResult> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, tools, system }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }))
    const errorText = `AI error: ${err.error ?? response.statusText}`
    callbacks.onText(errorText)
    return { stopReason: 'error', text: errorText, toolUses: [] }
  }

  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onText('AI error: No response stream')
    return { stopReason: 'error', text: '', toolUses: [] }
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let accumulatedText = ''
  let stopReason = 'end_turn'

  // Tool use tracking
  const toolUses: ToolUseResult[] = []
  let currentToolId = ''
  let currentToolName = ''
  let currentToolJson = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6))

        switch (event.type) {
          case 'text':
            accumulatedText += event.text
            callbacks.onText(accumulatedText)
            break

          case 'tool_use_start':
            currentToolId = event.id
            currentToolName = event.name
            currentToolJson = ''
            callbacks.onToolUseStart(event.id, event.name)
            break

          case 'tool_use_delta':
            currentToolJson += event.partial_json
            break

          case 'content_block_stop':
            if (currentToolId) {
              const input = currentToolJson ? JSON.parse(currentToolJson) : {}
              const toolUse = { id: currentToolId, name: currentToolName, input }
              toolUses.push(toolUse)
              callbacks.onToolUseComplete(toolUse)
              currentToolId = ''
              currentToolName = ''
              currentToolJson = ''
            }
            break

          case 'done':
            stopReason = event.stop_reason ?? 'end_turn'
            break
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }

  return { stopReason, text: accumulatedText, toolUses }
}
```

- [ ] **Step 2: Verify build**

Run: `npx vue-tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/data/ai-service.ts
git commit -m "feat: add tool-aware AI streaming with tool_use event parsing"
```

---

## Task 10: Agentic Loop in `useTasks.ts`

**Files:**
- Modify: `src/data/useTasks.ts`

Replace the current `sendToAI()` with an agentic loop that streams, executes tools, syncs the preview, and loops until done.

- [ ] **Step 1: Update `sendToAI()` with agentic loop**

Read `src/data/useTasks.ts` fully before editing. Key changes:

1. Import new dependencies at the top
2. Replace the `sendToAI()` function body

```typescript
import { streamAIWithTools, type ToolUseResult } from './ai-service'
import { siteTools, buildSystemPrompt } from './ai-tools'
import { executeToolCall } from './ai-tool-executor'
import { useSiteContent } from './useSiteContent'
import { usePreviewSync } from './usePreviewSync'
import type { ToolCall } from './types'
```

The new `sendToAI` function:

```typescript
async function sendToAI(taskId: string, agentId?: AgentId) {
  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return

  const { getContent } = useSiteContent()
  const { pushSectionUpdate, pushThemeUpdate, pushPageUpdate } = usePreviewSync()

  // If no site content (non-tool conversation), fall back to simple streaming
  if (!getContent(task.siteId).value) {
    // ... keep existing simple streaming logic as fallback
    return
  }

  // Build full message history for Claude (all messages in this task)
  const apiMessages: Array<{ role: string; content: any }> = []

  // Agentic loop
  let looping = true
  while (looping) {
    // Rebuild system prompt each iteration so Claude sees latest state after mutations
    const currentContent = getContent(task.siteId).value!
    const system = buildSystemPrompt(currentContent)
    // Build history from task messages (excluding any current streaming placeholder)
    const history = messages.value
      .filter(m => m.taskId === taskId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    apiMessages.length = 0
    for (const m of history) {
      if (m.role === 'user') {
        apiMessages.push({ role: 'user', content: m.content })
      } else {
        // For agent messages with tool calls, reconstruct the content blocks
        if (m.toolCalls?.length) {
          const contentBlocks: any[] = []
          if (m.content) contentBlocks.push({ type: 'text', text: m.content })
          for (const tc of m.toolCalls) {
            contentBlocks.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.toolName ?? tc.label,
              input: tc.args ? JSON.parse(tc.args) : {},
            })
          }
          apiMessages.push({ role: 'assistant', content: contentBlocks })
          // Add tool results as user message
          const toolResults = m.toolCalls.map(tc => ({
            type: 'tool_result',
            tool_use_id: tc.id,
            content: tc.result ?? tc.error ?? '',
            ...(tc.error ? { is_error: true } : {}),
          }))
          apiMessages.push({ role: 'user', content: toolResults })
        } else {
          apiMessages.push({ role: 'assistant', content: m.content })
        }
      }
    }

    // Create streaming message placeholder
    const streamingId = `msg-streaming-${Date.now()}`
    const streamingMsg: Message = {
      id: streamingId,
      taskId,
      role: 'agent',
      agentId,
      content: '',
      toolCalls: [],
      timestamp: new Date().toISOString(),
    }
    messages.value.push(streamingMsg)

    const pendingToolCalls: ToolCall[] = []

    const result = await streamAIWithTools(apiMessages, siteTools, system, {
      onText: (text) => {
        const idx = messages.value.findIndex(m => m.id === streamingId)
        if (idx !== -1) messages.value[idx]!.content = text
      },
      onToolUseStart: (id, name) => {
        const tc: ToolCall = {
          id,
          label: `Running ${name}...`,
          status: 'running',
          toolName: name,
        }
        pendingToolCalls.push(tc)
        const idx = messages.value.findIndex(m => m.id === streamingId)
        if (idx !== -1) {
          messages.value[idx]!.toolCalls = [...pendingToolCalls]
        }
      },
      onToolUseComplete: (toolUse) => {
        // Execute the tool
        const execResult = executeToolCall(task.siteId, toolUse.name, toolUse.input, toolUse.id)

        // Push to preview
        if (execResult.change && !execResult.isError) {
          const updatedContent = getContent(task.siteId).value
          if (updatedContent) {
            switch (toolUse.name) {
              case 'update_section':
              case 'create_section': {
                const section = updatedContent.sections[toolUse.input.section_id]
                if (section) {
                  const page = updatedContent.pages.find(p => p.sections.includes(section.id))
                  const order = page ? page.sections.indexOf(section.id) : undefined
                  pushSectionUpdate(section.id, section.html, section.css, order)
                }
                break
              }
              case 'remove_section':
                // Re-render the full page to remove the section
                pushPageUpdate(updatedContent, toolUse.input.page_slug)
                break
              case 'update_theme':
                pushThemeUpdate(toolUse.input.variables)
                break
              case 'add_page':
              case 'remove_page':
              case 'reorder_sections':
                // These structural changes don't need immediate preview push
                // (user navigates to see them)
                break
            }
          }
        }

        // Update tool call in the message
        const tc = pendingToolCalls.find(t => t.id === toolUse.id)
        if (tc) {
          tc.status = execResult.isError ? 'error' : 'done'
          tc.label = execResult.result
          tc.args = JSON.stringify(toolUse.input, null, 2)
          tc.result = execResult.isError ? undefined : execResult.result
          tc.error = execResult.isError ? execResult.result : undefined
          tc.changeId = execResult.change?.id
        }
        const idx = messages.value.findIndex(m => m.id === streamingId)
        if (idx !== -1) {
          messages.value[idx]!.toolCalls = [...pendingToolCalls]
        }
      },
    })

    // Persist the final message
    const finalMsg = messages.value.find(m => m.id === streamingId)
    if (finalMsg) persistMessage(finalMsg)

    // Continue looping if Claude wants to call more tools
    if (result.stopReason === 'tool_use') {
      continue
    } else {
      looping = false
    }
  }
}
```

- [ ] **Step 2: Keep existing `sendMessage()` API unchanged**

The public `sendMessage(taskId, content)` function stays the same — it calls `appendMessage()` then `queueAgentResponse()` which calls `sendToAI()`. No changes to the external API.

- [ ] **Step 3: Verify build**

Run: `npx vue-tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/data/useTasks.ts
git commit -m "feat: add agentic loop with tool execution and preview sync"
```

---

## Task 11: Preview Iframe in SitePage

**Files:**
- Modify: `src/pages/SitePage.vue`
- Modify: `src/data/site-renderer.ts` (may need `role` param on `sendSectionUpdate`)

Add a preview iframe to the task view in SitePage, and register it with `usePreviewSync`.

- [ ] **Step 1: Add preview iframe to SitePage**

In the `<script setup>`, add `onMounted` to the existing Vue import (line 2), then add:

```typescript
import { useSiteContent } from '@/data/useSiteContent'
import { usePreviewSync } from '@/data/usePreviewSync'
import { renderSite } from '@/data/site-renderer'

const { getContent } = useSiteContent()
const { registerIframe, unregisterIframe } = usePreviewSync()

const previewIframeRef = ref<HTMLIFrameElement | null>(null)
const currentPageSlug = ref('/')

const previewHtml = computed(() => {
  if (!activeSiteId.value) return ''
  const content = getContent(activeSiteId.value).value
  if (!content) return ''
  return renderSite(content, currentPageSlug.value)
})

watch(previewIframeRef, (el) => {
  if (el) registerIframe(el)
})

onBeforeUnmount(() => {
  unregisterIframe()
})
```

In the `<template>`, add a preview pane next to the task chat when a task is selected. After the `pane-detail` div (which contains the chat), add:

```html
<div v-if="currentScreen === 'tasks' && selectedTaskId" class="pane pane-preview">
  <iframe
    ref="previewIframeRef"
    :srcdoc="previewHtml"
    class="preview-iframe"
    sandbox="allow-same-origin allow-scripts"
  />
</div>
```

Add CSS for the preview pane:

```css
.pane-preview {
  flex: 1;
  min-width: 0;
  border-inline-start: 1px solid var(--color-frame-border);
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
```

The `pane-detail` needs a `flex` value to share space. Update:

```css
.pane-detail {
  flex: 1;
  /* ... existing styles ... */
}
```

- [ ] **Step 2: Handle iframe navigation messages**

The renderer's listener script sends `postMessage({type: 'navigate', page: ...})` for internal links. Listen for these:

```typescript
function onIframeMessage(event: MessageEvent) {
  if (event.data?.type === 'navigate') {
    currentPageSlug.value = event.data.page
  }
}

onMounted(() => window.addEventListener('message', onIframeMessage))
onBeforeUnmount(() => window.removeEventListener('message', onIframeMessage))
```

- [ ] **Step 3: Verify visually**

Run: `npm run dev`, navigate to a site → tasks → select a task.
Expected: Chat on left, preview iframe on right showing the site's home page.

- [ ] **Step 4: Commit**

```bash
git add src/pages/SitePage.vue
git commit -m "feat: add preview iframe pane to task view"
```

---

## Task 12: Undo Button on ToolCallItem

**Files:**
- Modify: `src/components/composites/ToolCallItem.vue`

- [ ] **Step 1: Add `reverted` status and undo button**

Update props to accept `changeId` and emit `undo`:

```typescript
const props = defineProps<{
  label: string
  status: ToolCallStatus
  toolName?: string
  args?: string
  result?: string
  error?: string
  code?: string
  changeId?: string
}>()

const emit = defineEmits<{
  undo: [changeId: string]
}>()

function onUndo(e: Event) {
  e.stopPropagation()
  if (props.changeId) emit('undo', props.changeId)
}
```

In the template, after the label `<span>`, add an undo button:

```html
<button
  v-if="status === 'done' && changeId"
  class="tool-call-item__undo"
  title="Undo this change"
  @click="onUndo"
>
  Undo
</button>
```

Add `reverted` styling in `<style scoped>`:

```css
.tool-call-item--reverted .tool-call-item__label {
  text-decoration: line-through;
  color: var(--color-frame-fg-disabled);
}

.tool-call-item--reverted .tool-call-item__chevron {
  color: var(--color-frame-fg-disabled);
}

.tool-call-item__undo {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 var(--space-xxs);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-default);
}

.tool-call-item:hover .tool-call-item__undo {
  opacity: 1;
}

.tool-call-item__undo:hover {
  color: var(--color-frame-fg);
}
```

- [ ] **Step 2: Wire up undo in ChatMessage**

In `ChatMessage.vue`, which receives `siteId` as a prop:

1. Pass `changeId` from each tool call through to `ToolCallItem` as a prop
2. Listen for the `@undo` event on `ToolCallItem`
3. In the handler, call `useSiteContent().undoChange(props.siteId, changeId)` and set the tool call's `status` to `'reverted'` on the message object

```typescript
import { useSiteContent } from '@/data/useSiteContent'

const { undoChange } = useSiteContent()

function onToolUndo(changeId: string) {
  if (!props.siteId) return
  undoChange(props.siteId, changeId)
  // Find and update the tool call status on the message
  const tc = props.toolCalls?.find(t => t.changeId === changeId)
  if (tc) tc.status = 'reverted'
}
```

In the template, for each `ToolCallItem`:
```html
<ToolCallItem
  :change-id="tc.changeId"
  @undo="onToolUndo"
  ... other existing props
/>
```

- [ ] **Step 3: Verify visually**

Run: `npm run dev`, trigger a tool call, hover over a completed tool call.
Expected: Undo button appears on hover, clicking it marks the tool call as reverted.

- [ ] **Step 4: Commit**

```bash
git add src/components/composites/ToolCallItem.vue src/components/composites/ChatMessage.vue
git commit -m "feat: add undo button to tool call items"
```

---

## Task 13: End-to-End Test

Manual verification that the full flow works.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Navigate to a site task**

Open a site (e.g., Downstreet Cafe) → Tasks → create a new task.

- [ ] **Step 3: Send a message that triggers tool use**

Type: "Change the hero section to have a blue gradient background instead of the image"

Expected:
1. Chat shows the message streaming
2. A tool call appears (e.g., `update_section`) with running → done status
3. The preview iframe updates to show the new hero
4. The tool call shows an undo button on hover

- [ ] **Step 4: Test undo**

Click the undo button on the tool call.
Expected: Preview reverts to previous state, tool call shows strikethrough/reverted styling.

- [ ] **Step 5: Test multi-turn**

Send another message: "Also change the accent color to blue"
Expected: Theme update tool call fires, preview updates theme colors.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: end-to-end fixes for task site mutations"
```

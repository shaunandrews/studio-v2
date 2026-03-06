# Phase 2: AI Generation Pipeline

Phase 2 wires Claude to generate sections (from Phase 1's section system) instead of monolithic HTML. It introduces progressive rendering — sections appear in the preview as they stream from the AI.

**Depends on:** Phase 1 (section types, renderers, `Section`, `PageTemplate`, and `SiteTheme` all exist and work).

---

## 1. AI Output Format

### Section Blocks

The AI returns section data using the same fenced-block convention as the existing card system. Instead of ` ```card:TYPE `, sections use ` ```section:TYPE `:

````
Here's the hero for your café homepage:

```section:hero-split
{
  "heading": "Downstreet Cafe",
  "tagline": "Your neighborhood coffee spot since 2019",
  "image": { "src": "/images/downstreet/hero-interior.png", "alt": "Cafe interior with morning light" },
  "hours": ["Mon–Fri: 7am–6pm", "Sat–Sun: 8am–4pm"]
}
```

And the menu highlights:

```section:content-cards
{
  "heading": "What We're Known For",
  "cards": [
    { "title": "Single Origin Pour-Over", "body": "Rotating selection from small farms", "image": "/images/downstreet/pour-over.png" },
    { "title": "House-Baked Pastries", "body": "Fresh every morning at 6am", "image": "/images/downstreet/pastries.png" }
  ]
}
```
````

This mirrors the card parser but targets the section system. Text between section blocks is treated as chat commentary (displayed in the chat panel, not in the preview).

### Template Parts and Theme

Template parts and theme data use their own fence types:

````
```theme
{
  "color": {
    "palette": [
      { "slug": "primary", "name": "Terracotta", "hex": "#C2703E" },
      { "slug": "secondary", "name": "Sage", "hex": "#A8B5A0" },
      { "slug": "base", "name": "Cream", "hex": "#FFF8F0" },
      { "slug": "contrast", "name": "Espresso", "hex": "#3B2314" }
    ],
    "background": "#FFF8F0",
    "text": "#3B2314"
  },
  "typography": {
    "fontFamily": { "heading": "Playfair Display", "body": "Source Sans 3" },
    "fontSize": { "hero": "4rem", "xlarge": "2.5rem", "large": "1.5rem", "medium": "1.125rem", "small": "0.875rem" }
  }
}
```

```templatePart:header
{
  "navItems": [
    { "label": "Home", "page": "homepage" },
    { "label": "Menu", "page": "menu" },
    { "label": "About", "page": "about" },
    { "label": "Events", "page": "events" },
    { "label": "Contact", "page": "contact" }
  ]
}
```

```templatePart:footer
{
  "address": "123 Main St, Portland, OR 97201",
  "phone": "(503) 555-0142",
  "email": "hello@downstreet.cafe",
  "tagline": "Made with WordPress",
  "social": [
    { "platform": "instagram", "url": "https://instagram.com/downstreetcafe" }
  ],
  "copyright": "© 2025 Downstreet Cafe"
}
```
````

### TypeScript Types

```ts
/** What the AI actually returns for a theme — a minimal subset of SiteTheme */
interface AIThemeOutput {
  color: {
    palette: Array<{ slug: string; name: string; hex: string }>
    background: string
    text: string
  }
  typography: {
    fontFamily: { heading: string; body: string }
    fontSize: { hero: string; xlarge: string; large: string; medium: string; small: string }
  }
}

/**
 * Converts the AI's minimal theme output into a full SiteTheme with sensible defaults.
 * The AI shouldn't need to specify spacing scales and layout widths every time.
 */
function normalizeTheme(raw: AIThemeOutput): SiteTheme {
  return {
    name: 'custom',
    settings: {
      color: {
        palette: raw.color.palette,
        background: raw.color.background,
        text: raw.color.text,
      },
      typography: {
        fontFamily: raw.typography.fontFamily,
        fontSize: raw.typography.fontSize,
        lineHeight: { tight: '1.2', normal: '1.5', relaxed: '1.75' },
      },
      spacing: { unit: 'rem', scale: [0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8] },
      layout: { contentWidth: '800px', wideWidth: '1200px' },
    },
  }
}

/** Fence types the AI can return */
type AIFenceType =
  | { kind: 'section'; sectionType: string; data: Record<string, unknown> }
  | { kind: 'theme'; data: AIThemeOutput }
  | { kind: 'templatePart'; partType: 'header' | 'footer'; data: Record<string, unknown> }

/** A parsed block from the AI response stream */
type ParsedAIBlock =
  | { type: 'text'; text: string }
  | { type: 'section'; sectionType: string; data: Record<string, unknown>; valid: boolean }
  | { type: 'theme'; data: SiteTheme }  // normalized via normalizeTheme() at parse time
  | { type: 'templatePart'; partType: string; data: Record<string, unknown> }
  | { type: 'error'; fenceType: string; raw: string; error: string }
```

### Multi-Section Responses

The AI can return multiple section blocks in a single response. Each block is parsed independently. The pipeline assigns `order` values based on the order they appear in the response. This is the default mode — asking the AI for a full page yields one response with several section blocks.

For one-section-per-response mode (used when regenerating a single failed section), the pipeline sends a targeted prompt asking for exactly one section.

### Error Handling

| Error | Handling |
|-------|----------|
| Malformed JSON | Parse error → block becomes `type: 'error'`. Log the raw content. Show a subtle error indicator on the corresponding skeleton slot in the preview. Queue for retry. |
| Unknown section type | Block parsed but `sectionType` doesn't match any registered renderer → `type: 'error'`. Chat shows a warning. |
| Missing required fields | Renderer validates `data` against the section schema. If required fields are missing, the section renders in a degraded state (showing what it can) with a visual indicator that it's incomplete. |
| Empty response | Pipeline marks the generation step as failed, retries once. |

Validation function:

```ts
/**
 * Simple required-field validation — no JSON Schema, just a registry of
 * required field names per section type. Prototype tradeoff: we trust the AI
 * to produce roughly correct shapes and just check for the must-have fields.
 * After validation, cast with `as SectionDataMap[T]`.
 */

const REQUIRED_FIELDS: Record<string, string[]> = {
  'hero-split': ['heading', 'tagline', 'image'],
  'hero-fullwidth': ['image'],
  'hero-simple': ['heading'],
  'image-strip': ['images'],
  'image-gallery': ['images'],
  'menu-list': ['variant', 'categories'],
  'content-prose': ['body'],
  'content-cards': ['cards'],
  'team-grid': ['members'],
  'event-list': ['events'],
  'event-recurring': ['events'],
  'contact-info': [],
  'cta-banner': ['text'],
  'order-menu': ['categories'],
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  sectionType: string
  data: Record<string, unknown>
}

function validateSection(type: string, data: Record<string, unknown>): ValidationResult {
  const required = REQUIRED_FIELDS[type]
  if (!required) {
    return { valid: false, errors: [`Unknown section type: ${type}`], sectionType: type, data }
  }
  const errors: string[] = []
  for (const field of required) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`)
    }
  }
  return { valid: errors.length === 0, errors, sectionType: type, data }
}
```

---

## 2. Generation Pipeline

### Orchestration Flow

```
User triggers site creation (creative brief from onboarding)
  │
  ▼
PipelineOrchestrator.start(brief)
  │
  ├─ Step 1: Generate theme ──────────────────── one API call
  │    └─ on complete → apply theme CSS to preview
  │
  ├─ Step 2: Generate template parts ─────────── one API call (header + footer)
  │    └─ on complete → render header/footer in preview
  │
  └─ Step 3: Generate page sections ──────────── one API call per page
       ├─ Homepage sections  ─┐
       ├─ Menu page sections  ├── parallel (up to 3 concurrent)
       ├─ About page sections ─┘
       ├─ Events page sections ── next batch
       └─ Contact page sections
```

Steps 1 and 2 are sequential (sections need the theme; template parts need the theme). Step 3 pages run in parallel — each page is an independent API call that returns all sections for that page.

### Pipeline State

```ts
type StepStatus = 'pending' | 'generating' | 'complete' | 'error' | 'retrying'

interface PipelineStep {
  id: string                          // "theme", "templateParts", "page:homepage", etc.
  status: StepStatus
  label: string                       // human-readable: "Homepage", "Menu Page"
  artifacts: ParsedAIBlock[]          // parsed results
  error?: string
  retryCount: number
}

interface PipelineState {
  status: 'idle' | 'running' | 'complete' | 'error'
  steps: PipelineStep[]
  brief: CreativeBrief                // from onboarding
  theme?: SiteTheme                   // set after step 1
  templateParts: Record<string, Record<string, unknown>>  // set after step 2
  pages: Map<string, Section[]>       // sections per page, built up progressively
}

interface CreativeBrief {
  siteType: string                    // "restaurant", "portfolio", etc.
  siteName: string
  description: string                 // the one-sentence description from onboarding
  additionalContext?: Record<string, string>  // address, phone, hours — collected during build
}
```

### The Orchestrator

```ts
class PipelineOrchestrator {
  private state: PipelineState
  private onStateChange: (state: PipelineState) => void

  constructor(brief: CreativeBrief, onStateChange: (state: PipelineState) => void) {
    this.state = {
      status: 'idle',
      steps: [],
      brief,
      templateParts: {},
      pages: new Map(),
    }
    this.onStateChange = onStateChange
  }

  async start(): Promise<void> {
    this.state.status = 'running'

    // Step 1: Theme
    const themeStep = this.addStep('theme', 'Design theme')
    await this.executeStep(themeStep, this.buildThemePrompt())
    if (themeStep.status === 'error') return this.fail()

    // Step 2: Template parts
    const partsStep = this.addStep('templateParts', 'Header & footer')
    await this.executeStep(partsStep, this.buildTemplatePartsPrompt())
    if (partsStep.status === 'error') return this.fail()

    // Step 3: Pages (parallel, max 3 concurrent)
    const pageConfigs = this.determinePages()
    const pageSteps = pageConfigs.map(p => this.addStep(`page:${p.slug}`, p.title))
    await this.executeParallel(
      pageSteps.map((step, i) => () => this.executeStep(step, this.buildPagePrompt(pageConfigs[i]))),
      3 // concurrency limit
    )

    this.state.status = this.state.steps.every(s => s.status === 'complete') ? 'complete' : 'error'
    this.onStateChange(this.state)
  }

  /** Execute a single pipeline step with streaming */
  private async executeStep(step: PipelineStep, prompt: string): Promise<void> {
    step.status = 'generating'
    this.onStateChange(this.state)

    const messages = [{ role: 'user' as const, content: prompt }]
    const systemPrompt = this.buildSystemPrompt()

    try {
      const blocks = await streamAI(messages, (streamingBlocks) => {
        // Process completed section blocks as they arrive
        this.processStreamingBlocks(step, streamingBlocks)
      }, systemPrompt)

      step.artifacts = blocks as unknown as ParsedAIBlock[]
      step.status = 'complete'
    } catch (err) {
      step.error = err instanceof Error ? err.message : 'Unknown error'
      step.status = 'error'
      if (step.retryCount < 2) {
        step.retryCount++
        step.status = 'retrying'
        this.onStateChange(this.state)
        await this.executeStep(step, prompt)
      }
    }

    this.onStateChange(this.state)
  }

  private async executeParallel(tasks: (() => Promise<void>)[], concurrency: number): Promise<void> {
    const executing = new Set<Promise<void>>()
    for (const task of tasks) {
      // Wrap each task so it removes itself from the set when settled
      const p = task().finally(() => executing.delete(p))
      executing.add(p)
      if (executing.size >= concurrency) {
        await Promise.race(executing)
      }
    }
    await Promise.all(executing)
  }

  // ... prompt builders covered in Section 4
}
```

### Retry Strategy

- Each step retries up to **2 times** on failure.
- Retry uses the same prompt. The pipeline doesn't re-send prior successful steps' outputs (they're already applied to state).
- If a page step fails after retries, the pipeline continues with other pages. The failed page shows an error state in the preview with a "Retry" button.
- Theme or template part failure is fatal — the pipeline stops (downstream steps depend on them).

### Feeding New Context Mid-Build

When the user provides new information during the build (e.g., answers "What's your address?"), the orchestrator updates `brief.additionalContext` and the information is included in prompts for any steps that haven't started yet. Steps already complete are not regenerated automatically — the user can request updates via chat after the build.

```ts
orchestrator.updateContext({ address: '123 Main St, Portland, OR 97201' })
```

---

## 3. Progressive Rendering

### What the User Sees

| Pipeline State | Preview Shows |
|---|---|
| Idle | Empty preview with "Your site will appear here" message |
| Theme generating | Blank page with a subtle loading shimmer |
| Theme complete | Page background color updates to theme background. Typography loads. |
| Template parts generating | Theme-colored page. Skeleton header bar at top. |
| Template parts complete | Real header renders with nav items. Footer appears at bottom. |
| Page sections generating | Skeleton placeholders appear between header and footer, one per expected section. Each skeleton has a subtle pulse animation. |
| Each section completes | Skeleton replaced with rendered section. Fade-in transition (200ms opacity). |
| All complete | Full page. No skeletons. |

### Skeleton Slots

Before page sections generate, the pipeline knows how many sections to expect (from the page config). It renders that many skeleton placeholders:

```ts
interface SkeletonSlot {
  id: string
  expectedType?: string  // if known from page plan
  status: 'pending' | 'generating' | 'complete' | 'error'
  section?: Section      // populated when generation completes
}
```

Skeleton visual: a light gray rectangle (using `var(--color-surface-secondary)`) with rounded corners, matching the approximate height of the expected section type. A CSS shimmer animation runs across it:

```css
.section-skeleton {
  background: var(--color-surface-secondary);
  border-radius: var(--radius-m);
  min-block-size: 200px;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

.section-skeleton[data-type="hero-split"],
.section-skeleton[data-type="hero-fullwidth"] {
  min-block-size: 500px;
}

.section-skeleton[data-type="menu-list"] {
  min-block-size: 400px;
}

@keyframes skeleton-shimmer {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
```

### Section Arrival Transitions

When a section's data arrives and passes validation:

1. The skeleton slot's status changes to `'complete'`
2. The section HTML is rendered off-screen (or via a hidden element)
3. The skeleton fades out (100ms) and the section fades in (200ms):

```css
.section-enter {
  animation: section-fade-in 200ms ease-out;
}

@keyframes section-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Scroll Behavior

- **During generation:** The preview auto-scrolls to keep the most recently completed section visible, but only if the user hasn't manually scrolled. Track a `userHasScrolled` flag, reset it when a new page is selected.
- **After user scrolls:** Stay where they are. Don't steal scroll position.
- **On error:** Don't scroll to the error. Show a toast-like notification instead.

### Partial Page Renderer (`renderProgressivePage`)

Distinct from Phase 1's `renderPage()` (which renders a complete page from finalized `SiteData`), `renderProgressivePage()` handles incomplete/in-progress state during builds:

```ts
function renderProgressivePage(
  theme: SiteTheme | null,
  templateParts: { header?: string; footer?: string },
  slots: SkeletonSlot[],
): string {
  const parts: string[] = []

  // Document shell (always present)
  parts.push('<!DOCTYPE html><html><head>')
  parts.push('<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">')

  if (theme) {
    parts.push(`<style>${themeToCSS(theme)}</style>`)
    parts.push(`<style>${componentLibraryCSS()}</style>`)
    // Font imports
    const fonts = [theme.typography?.fontFamily?.heading, theme.typography?.fontFamily?.body].filter(Boolean)
    if (fonts.length) {
      parts.push(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts.map(f => `family=${encodeURIComponent(f!)}`).join('&')}&display=swap">`)
    }
  }

  parts.push('</head><body>')
  parts.push(templateParts.header ?? '')

  parts.push('<main>')
  for (const slot of slots) {
    if (slot.status === 'complete' && slot.section) {
      parts.push(`<div class="section section-enter" data-section-id="${slot.id}">${renderSection(slot.section)}</div>`)
    } else if (slot.status === 'error') {
      parts.push(`<div class="section-skeleton section-error" data-section-id="${slot.id}"><span>Failed to generate</span></div>`)
    } else {
      parts.push(`<div class="section-skeleton" data-type="${slot.expectedType ?? ''}" data-section-id="${slot.id}"></div>`)
    }
  }
  parts.push('</main>')

  parts.push(templateParts.footer ?? '')
  parts.push('</body></html>')

  return parts.join('\n')
}
```

### Two Rendering Modes

The preview uses two distinct rendering approaches:

- **Full render (`renderProgressivePage`)** — Rebuilds the entire iframe `srcdoc`. Used for initial page load, page navigation, and major structural changes (theme swap, page add/remove). This is the `renderProgressivePage()` function from the partial page renderer above.
- **Incremental update (postMessage)** — Patches individual sections in-place without reloading the iframe. Used for adding sections during build and for section edits (Phase 4). Faster, no scroll reset, no flash.

**Rule of thumb:** Use full render when the document structure changes (new page, theme change). Use incremental postMessage when content within an existing structure changes (section added to a slot, section data updated).

### Incremental Updates via postMessage

Rather than re-rendering the entire iframe on each section arrival, use `postMessage` to send section updates to the iframe:

```ts
// Parent (app) → iframe
interface SectionUpdateMessage {
  type: 'section-update'
  slotId: string
  html: string   // rendered section HTML
}

interface ThemeUpdateMessage {
  type: 'theme-update'
  css: string    // themeToCSS() output
}

// Inside the iframe, a small script listens:
window.addEventListener('message', (event) => {
  const msg = event.data
  if (msg.type === 'section-update') {
    const slot = document.querySelector(`[data-section-id="${msg.slotId}"]`)
    if (slot) {
      const wrapper = document.createElement('div')
      wrapper.className = 'section section-enter'
      wrapper.dataset.sectionId = msg.slotId
      wrapper.innerHTML = msg.html
      slot.replaceWith(wrapper)
    }
  }
  if (msg.type === 'theme-update') {
    document.getElementById('theme-css')!.textContent = msg.css
  }
})
```

---

## 4. System Prompt Design

### Prompt Structure

The generation system prompt has three parts:

1. **Role & format instructions** — How to return data (fence syntax)
2. **Available section types** — Auto-generated from the section registry
3. **Creative brief** — The specific site being built

```ts
function buildGenerationSystemPrompt(
  sectionTypes: SectionTypeDefinition[],
  brief: CreativeBrief,
  currentTheme?: SiteTheme,
): string {
  return `You are a website builder AI. You create websites by generating structured section data.

## Output Format

Return structured data in fenced blocks. Available fence types:

### Theme
\`\`\`theme
{ ... SiteTheme JSON ... }
\`\`\`

### Template Parts
\`\`\`templatePart:header
{ "navItems": [{ "label": "...", "page": "..." }, ...] }
\`\`\`

\`\`\`templatePart:footer
{ "address": "...", "phone": "...", "email": "...", "tagline": "..." }
\`\`\`

### Sections
\`\`\`section:TYPE
{ ... section data matching the TYPE's schema ... }
\`\`\`

You may include brief conversational text between blocks to explain your creative choices. Keep it short.

## Available Section Types

${sectionTypes.map(s => `### ${s.type}
${s.description}
Schema:
\`\`\`json
${JSON.stringify(s.schema, null, 2)}
\`\`\`
`).join('\n')}

## Creative Brief

- **Site type:** ${brief.siteType}
- **Name:** ${brief.siteName}
- **Description:** ${brief.description}
${brief.additionalContext ? Object.entries(brief.additionalContext).map(([k, v]) => `- **${k}:** ${v}`).join('\n') : ''}

${currentTheme ? `## Current Theme
\`\`\`json
${JSON.stringify(currentTheme, null, 2)}
\`\`\`` : ''}

## Guidelines

- Generate realistic, specific content — not lorem ipsum. Invent plausible details for the business type.
- Use Unsplash URLs for images: \`https://images.unsplash.com/photo-ID?w=800&h=600&fit=crop\`
- Match the tone and style to the business type.
- Each section's data must conform exactly to its schema.
- Return sections in the order they should appear on the page (top to bottom).
`
}
```

### Step-Specific Prompts

**Theme prompt:**
```ts
function buildThemePrompt(brief: CreativeBrief): string {
  return `Create a design theme for this website. Return a single \`\`\`theme block.

Choose colors, fonts, and sizing that match the vibe of: "${brief.description}"

For a ${brief.siteType} called "${brief.siteName}", consider what feeling the visitor should have. Pick a cohesive palette — usually 4 colors (primary, secondary, base/background, contrast/text). Choose complementary Google Fonts for headings and body.`
}
```

**Template parts prompt:**
```ts
function buildTemplatePartsPrompt(brief: CreativeBrief, pages: PageConfig[]): string {
  return `Create the header and footer for this website. Return a \`\`\`templatePart:header block and a \`\`\`templatePart:footer block.

The site has these pages: ${pages.map(p => p.title).join(', ')}.
The navigation should link to all pages.
${brief.additionalContext?.address ? `Business address: ${brief.additionalContext.address}` : 'Invent a plausible address for the business.'}
${brief.additionalContext?.phone ? `Phone: ${brief.additionalContext.phone}` : ''}`
}
```

**Page sections prompt:**
```ts
function buildPagePrompt(page: PageConfig, brief: CreativeBrief): string {
  return `Generate all sections for the "${page.title}" page. Return one \`\`\`section:TYPE block for each section, in top-to-bottom order.

Suggested sections for this page: ${page.suggestedSections.join(', ')}
You may adjust — add, remove, or reorder sections if it makes sense for the content. But stay close to the suggestion.

Page purpose: ${page.description}`
}
```

### Page Configs (What Pages to Create)

The orchestrator determines pages based on site type:

```ts
interface PageConfig {
  slug: string
  title: string
  description: string
  suggestedSections: string[]
}

const PAGE_PRESETS: Record<string, PageConfig[]> = {
  restaurant: [
    {
      slug: '/',
      title: 'Home',
      description: 'Landing page — hero, highlights, location/hours teaser',
      suggestedSections: ['hero-split', 'content-cards', 'cta-banner', 'contact-info'],
    },
    {
      slug: '/menu',
      title: 'Menu',
      description: 'Full food and drink menu organized by category',
      suggestedSections: ['hero-simple', 'menu-list', 'menu-list', 'cta-banner'],
    },
    {
      slug: '/about',
      title: 'About',
      description: 'Story of the business, team, values',
      suggestedSections: ['hero-fullwidth', 'content-prose', 'team-grid'],
    },
    {
      slug: '/events',
      title: 'Events',
      description: 'Upcoming events and happenings',
      suggestedSections: ['hero-simple', 'event-list', 'cta-banner'],
    },
    {
      slug: '/contact',
      title: 'Contact',
      description: 'Location, hours, contact form',
      suggestedSections: ['hero-simple', 'contact-info'],
    },
  ],
  // ... other site types
}
```

### Example: Café Homepage

**Prompt sent:**
> Generate all sections for the "Home" page. Return one ```section:TYPE block for each section, in top-to-bottom order.
> Suggested sections for this page: hero-split, content-cards, cta-banner, contact-info
> Page purpose: Landing page — hero, highlights, location/hours teaser

**Expected response:**

````
I'll create a warm, inviting homepage for Downstreet Cafe.

```section:hero-split
{
  "heading": "Downstreet Cafe",
  "tagline": "Where every cup tells a story. Craft coffee and house-baked goods in the heart of Portland's Pearl District.",
  "image": { "src": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop", "alt": "Cozy cafe interior" },
  "hours": ["Mon–Fri: 7am–6pm", "Sat–Sun: 8am–4pm"]
}
```

```section:content-cards
{
  "heading": "What We're Known For",
  "cards": [
    {
      "title": "Single Origin Pour-Over",
      "body": "Rotating selection sourced directly from small farms in Colombia, Ethiopia, and Guatemala.",
      "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop"
    },
    {
      "title": "House-Baked Pastries",
      "body": "Croissants, scones, and seasonal treats — fresh from our kitchen every morning at 6am.",
      "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop"
    },
    {
      "title": "Community Space",
      "body": "Free wifi, big tables, and a quiet corner for deep work. Stay as long as you like.",
      "image": "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=300&fit=crop"
    }
  ]
}
```

```section:cta-banner
{
  "heading": "Join Us This Weekend",
  "text": "Live jazz every Saturday from 7–9pm. Grab a table and a cortado.",
  "linkText": "See Events",
  "linkPage": "events"
}
```

```section:contact-info
{
  "heading": "Find Us",
  "address": "248 NW Davis St, Portland, OR 97209",
  "phone": "(503) 555-0142",
  "email": "hello@downstreet.cafe",
  "hours": [
    { "label": "Monday–Friday", "value": "7:00 AM – 6:00 PM" },
    { "label": "Saturday–Sunday", "value": "8:00 AM – 4:00 PM" }
  ]
}
```
````

---

## 5. Chat Integration

### Generation Status in Chat

When the pipeline starts, the AI posts a message to the chat with a `card:progress` block showing pipeline status. This card updates in real-time:

```json
{
  "label": "Building Downstreet Cafe",
  "steps": [
    { "name": "Design theme", "status": "done" },
    { "name": "Header & footer", "status": "done" },
    { "name": "Homepage", "status": "running" },
    { "name": "Menu", "status": "pending" },
    { "name": "About", "status": "pending" },
    { "name": "Events", "status": "pending" },
    { "name": "Contact", "status": "pending" }
  ]
}
```

This is a **live-updating card** — the same message is updated as steps complete. The existing `ProgressCardData` type and `card:progress` renderer handle this; the pipeline just calls an update function:

```ts
function updateProgressCard(step: PipelineStep): void {
  // Find the progress message in the conversation
  // Update the steps array with current pipeline state
  // Trigger reactivity so the card re-renders
}
```

### Mid-Build Chat

The chat conversation and the generation pipeline share the **same Claude conversation thread** for context continuity — but generation steps use **separate API calls** with their own system prompt.

Flow:
1. User creates site → chat conversation starts with the creative brief
2. Pipeline starts → separate API calls for theme, template parts, pages (each with the generation system prompt)
3. Meanwhile, the chat continues with the conversational system prompt for Q&A
4. User answers "What's your address?" → answer stored in `brief.additionalContext`
5. If the contact page hasn't generated yet, the address is included in its prompt
6. If the contact page already generated, the AI notes it'll update the page after the build completes

The chat and pipeline are **parallel but connected** through the shared `CreativeBrief` object.

### Context Extraction via `card:context`

No separate NLP or extraction step. The same AI call that generates the conversational chat response also extracts structured business details when it detects them. The AI includes a `card:context` fenced block alongside its text response:

````
Great, I'll add that to your site!

```card:context
{
  "address": "123 Main St, Portland, OR 97201",
  "phone": "(503) 555-0142",
  "hours": ["Mon–Fri: 7am–6pm", "Sat–Sun: 8am–4pm"]
}
```
````

The `ContextData` type:

```ts
interface ContextData {
  address?: string
  phone?: string
  email?: string
  hours?: string[]
  businessName?: string
  description?: string
  [key: string]: unknown   // extensible for site-type-specific fields
}
```

The chat handler parses `card:context` blocks from the AI response and feeds them into the pipeline:

```ts
function handleChatMessage(message: string, pipeline: PipelineOrchestrator): void {
  // Send to AI — the response may contain both text and card:context blocks
  const response = await sendChatMessage(message)

  // Parse any context blocks from the AI's response
  const contextBlocks = response.blocks.filter(b => b.type === 'context')
  for (const block of contextBlocks) {
    pipeline.updateContext(block.data as ContextData)
  }
}
```

### Post-Build Transition

When the pipeline completes, the chat AI posts a summary:

> ✅ Your site is ready! I built 5 pages:
> - **Home** — Hero, highlights, call to action, location
> - **Menu** — Full menu with categories
> - **About** — Story and team
> - **Events** — Upcoming events
> - **Contact** — Location, hours, contact details
>
> Take a look at the preview. What would you like to change?

This transitions the conversation from build mode to edit mode (Phase 4).

---

## 6. Performance Considerations

### Expected Generation Times

Build times are uncertain and depend heavily on the model used, whether we stream responses, and how aggressively we parallelize API calls.

- **Single section:** Seconds (one API call, small JSON payload).
- **Full multi-page site:** Potentially minutes, depending on parallelism and model speed.

With 3-page parallelism in step 3, wall-clock time drops significantly — but the exact numbers depend on model latency and rate limits. The progressive rendering system (§3) ensures the user sees results immediately regardless of total build time.

### Token Usage

| Component | Input Tokens (est.) | Output Tokens (est.) |
|-----------|--------------------|--------------------|
| System prompt (with schemas) | ~2,000 | — |
| Theme generation | ~2,500 | ~500 |
| Template parts | ~2,500 | ~800 |
| Per page | ~2,500 | ~2,000 |
| **Full site (5 pages)** | **~17,500** | **~11,300** |

Total per site: ~30,000 tokens. At Claude Sonnet pricing ($3/$15 per 1M input/output tokens): **~$0.22 per site**.

### API Call Strategy

**Multiple parallel calls** (not one long conversation). Reasons:
- Theme, template parts, and each page are independent generation tasks
- Parallel calls reduce wall-clock time
- A failure in one page doesn't affect others
- Each call gets a focused prompt (less noise, better output quality)
- Keeps individual responses short (less chance of truncation or drift)

Each call gets the full system prompt (with section schemas and creative brief) but only the specific generation task as the user message.

### Caching & Retry Context

- **On retry:** Re-send the same prompt to the same model. Don't re-include outputs from other successful steps (they're independent).
- **Theme and template parts** are included as context in page generation prompts (the theme as JSON, not the full generation conversation).
- **No response caching** across sessions. Each site generation is fresh.
- **Within a session:** If the user asks to regenerate a specific page, reuse the current theme and template parts as context but generate fresh sections.

### Streaming Parser Updates

Extend the existing `parseStreamingText` function to handle the new fence types:

```ts
const FENCE_REGEX = /```(section:[\w-]+|theme|templatePart:[\w-]+)\s*\n([\s\S]*?)```/g
const PARTIAL_FENCE_REGEX = /```(section:[\w-]+|theme|templatePart:[\w-]+)\s*\n[^]*$/

function parseGenerationStream(raw: string): ParsedAIBlock[] {
  const blocks: ParsedAIBlock[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = FENCE_REGEX.exec(raw)) !== null) {
    const before = raw.slice(lastIndex, match.index).trim()
    if (before) blocks.push({ type: 'text', text: before })

    const fenceType = match[1]
    const jsonStr = match[2].trim()

    try {
      const data = JSON.parse(jsonStr)

      if (fenceType === 'theme') {
        blocks.push({ type: 'theme', data })
      } else if (fenceType.startsWith('templatePart:')) {
        const partType = fenceType.split(':')[1]
        blocks.push({ type: 'templatePart', partType, data })
      } else if (fenceType.startsWith('section:')) {
        const sectionType = fenceType.split(':')[1]
        const validation = validateSection(sectionType, data)
        blocks.push({ type: 'section', sectionType, data, valid: validation.valid })
      }
    } catch {
      blocks.push({ type: 'error', fenceType, raw: jsonStr, error: 'Invalid JSON' })
    }

    lastIndex = match.index + match[0].length
  }

  // Handle remaining text (hide partial fences, show text)
  const remaining = raw.slice(lastIndex)
  if (!PARTIAL_FENCE_REGEX.test(remaining)) {
    const trimmed = remaining.trim()
    if (trimmed) blocks.push({ type: 'text', text: trimmed })
  }

  return blocks
}
```

---

## Open Questions

1. **Image strategy.** This spec uses Unsplash URLs as placeholders. Phase 1's section renderers need to handle these gracefully (lazy loading, fallback on 404). A future phase may introduce AI image generation.

2. **Section type discovery.** The section registry is hardcoded in page presets. Should the AI be able to propose new section types not in the registry, or is the fixed set sufficient for v1?

3. **Conversation memory.** If the user leaves and comes back, should the pipeline resume? Or does it start fresh? For v1, the pipeline runs to completion in one session — no persistence.

4. **Rate limiting.** With parallel API calls, hitting Anthropic rate limits is possible. The orchestrator should respect `429` responses and back off. The `executeParallel` concurrency limit of 3 helps, but may need tuning.

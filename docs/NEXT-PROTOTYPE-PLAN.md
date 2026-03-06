# Next Prototype: Free-Form Section System

The i0 prototype proved the layout, chat, card system, and theme architecture work. What doesn't work is the rigid section type system — 14 predefined types with fixed HTML and shared CSS that produce generic output regardless of site personality.

This plan inverts the model: **sections are containers, the AI writes the HTML and CSS.**

---

## Core Concept

The current system asks the AI to fill in data fields for predefined templates. The new system asks the AI to *design* each section — full creative control over markup and styling, with theme variables as a shared design language.

### Current (i0)
```
AI → { type: "hero-split", data: { heading: "...", image: "..." } }
  → Fixed renderer produces fixed HTML
  → Shared componentCSS styles it
  → Every hero looks the same
```

### Proposed
```
AI → { id: "hero", html: "<div class='hero'>...</div>", css: ".hero { ... }" }
  → HTML injected directly into page
  → CSS scoped to this section
  → Every hero can look different
```

---

## 1. Data Model

### Section
```ts
interface Section {
  id: string          // unique within the site, e.g. "hero", "menu-grid", "footer"
  html: string        // full HTML for this section
  css: string         // CSS scoped to this section (rendered in a <style> block)
  role?: SectionRole  // semantic hint — not a template, just metadata
}

type SectionRole =
  | 'header'    // site navigation
  | 'footer'    // site footer
  | 'hero'      // primary visual section
  | 'content'   // general content
  | 'gallery'   // image-heavy
  | 'contact'   // contact info / form
  | 'cta'       // call to action
  // extensible — AI can use any string, these are just common ones
```

### Page
```ts
interface Page {
  slug: string        // "/" for homepage, "/about", "/menu", etc.
  title: string
  sections: string[]  // ordered list of section IDs to render on this page
}
```

### Site
```ts
interface Site {
  name: string
  theme: Theme
  sections: Record<string, Section>   // all sections keyed by ID
  pages: Page[]
}
```

Sections are **site-level, not page-level.** A section like "header" can appear on multiple pages. The page just references section IDs in order. This is how shared elements (nav, footer) work — they're just sections that appear on every page. No special "template parts" system.

### Theme
```ts
interface Theme {
  name: string
  variables: Record<string, string>   // CSS custom properties
  fonts: string[]                      // Google Font names to load
}
```

That's it. No nested settings objects, no typography/spacing/layout hierarchy. Just a flat map of CSS variables that the AI's section CSS can reference:

```css
/* Theme variables (generated) */
:root {
  --color-primary: #2563eb;
  --color-secondary: #7c3aed;
  --color-bg: #ffffff;
  --color-text: #1e293b;
  --color-muted: #6b7280;
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;
  --space-unit: 0.5rem;
  --radius: 8px;
  /* ... AI decides what variables to define */
}
```

The AI defines the variables AND references them. This means the AI can create any design vocabulary it wants — it's not constrained to our predefined token names.

---

## 2. Rendering

Dead simple. A page renders as:

```html
<!DOCTYPE html>
<html>
<head>
  <link href="fonts..." rel="stylesheet">
  <style id="theme">{theme variables as :root block}</style>
  <style id="section-hero">{section.css}</style>
  <style id="section-menu">{section.css}</style>
  ...
</head>
<body>
  <div data-section="header">{header.html}</div>
  <div data-section="hero">{hero.html}</div>
  <div data-section="menu">{menu.html}</div>
  <div data-section="footer">{footer.html}</div>
</body>
</html>
```

Each section's CSS is in its own `<style>` block with an ID. Each section's HTML is in a `<div>` wrapper with a `data-section` attribute. This makes individual section updates trivial via postMessage — replace the HTML div and the style block.

### Section Scoping

The AI is instructed to scope its CSS to the section. The wrapping `<div data-section="hero">` provides a natural scoping boundary:

```css
/* AI writes this for the hero section */
[data-section="hero"] {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 80vh;
}
[data-section="hero"] h1 {
  font-family: var(--font-heading);
  font-size: 3.5rem;
  color: var(--color-primary);
}
```

No Shadow DOM, no CSS modules, no build step. Just attribute selectors. Simple, debuggable, and the AI can write it naturally.

---

## 3. Generation Pipeline

### The Approach: Parallel Section Generation

Instead of one monolithic API call that generates an entire site, break it into independent calls that run in parallel:

```
Step 1: Theme generation (single call)
  → Produces theme variables + font selections
  → Preview shows empty page with theme colors applied to background

Step 2: Shared sections — header + footer (can run in parallel)
  → Each is an independent API call
  → Preview shows nav and footer as soon as they land

Step 3: Page sections (parallel per section)
  → "Generate a hero section for a café called Downstreet"
  → "Generate a menu section for a café"
  → "Generate an about section for a café"
  → Each call runs independently
  → Preview assembles them as they arrive
```

### Section Generation Prompt

Each section generation call gets:

```
You are generating a single section for a website.

Site: {name} — {description}
Theme variables available: {list of --var-name: value pairs}
Section role: hero
Page context: This is the homepage. Other sections on this page: [header, menu-teaser, footer]

Generate a visually striking, well-designed hero section.

Return your response as:
```section:hero
<CSS>
---
<HTML>
```​

Rules:
- Scope all CSS to [data-section="hero"]
- Use theme variables (var(--color-primary), etc.) for consistency
- You have FULL creative control over layout, structure, and styling
- Use real-looking placeholder content (not lorem ipsum)
- Include responsive considerations (@media queries as needed)
- Images: use Unsplash URLs with specific search terms for relevant imagery
```

The AI returns raw HTML and CSS. No JSON parsing, no data schemas, no type validation. The output IS the section.

### Progressive Assembly

As sections land, they're injected into the preview via postMessage:

```ts
// Section arrives from API
function onSectionGenerated(section: Section) {
  // Store it
  site.sections[section.id] = section

  // Update preview
  iframe.contentWindow.postMessage({
    type: 'section-ready',
    id: section.id,
    html: section.html,
    css: section.css
  }, '*')
}
```

Inside the iframe, a listener inserts the section:

```js
window.addEventListener('message', (e) => {
  if (e.data.type === 'section-ready') {
    // Add CSS
    const style = document.createElement('style')
    style.id = `section-${e.data.id}`
    style.textContent = e.data.css
    document.head.appendChild(style)

    // Add or replace HTML
    const existing = document.querySelector(`[data-section="${e.data.id}"]`)
    if (existing) {
      existing.innerHTML = e.data.html
    } else {
      // Find the right position based on page section order
      const wrapper = document.createElement('div')
      wrapper.dataset.section = e.data.id
      wrapper.innerHTML = e.data.html
      document.body.appendChild(wrapper) // simplified — real impl uses ordering
    }
  }
})
```

The user sees the page build up piece by piece. Header appears. Then hero. Then content sections fill in. The preview is never blank for long — sections arrive in 3-8 seconds each, and multiple are generating simultaneously.

### Placeholder Slots

While sections are generating, show lightweight placeholders:

```html
<div data-section="hero" class="section-pending">
  <div class="pulse-bar" style="height: 400px"></div>
</div>
<div data-section="menu" class="section-pending">
  <div class="pulse-bar" style="height: 300px"></div>
</div>
```

When a section arrives, its placeholder is replaced. Simple CSS animation (shimmer/pulse) so the user knows something is happening. No skeleton system, no slot management — just placeholder divs that get swapped out.

---

## 4. Editing (Self-Contained Cards)

Carries forward from the Phase 4 plan with one key simplification: **edits are just section rewrites.**

Since sections are raw HTML/CSS, every edit is the same operation: replace a section's HTML and/or CSS. No need for 9 edit types, data field mappings, or type conversions.

### Edit Types (simplified)

| User Request | What Happens |
|---|---|
| "Change the hero headline" | AI rewrites hero section HTML (preserves CSS unless layout changes) |
| "Make the colors warmer" | AI regenerates theme variables. All sections update via CSS cascade. |
| "Make the hero full-width" | AI rewrites hero section HTML + CSS |
| "Add a testimonials section" | AI generates a new section. Page section list updated. |
| "Remove the gallery" | Section removed from page list. (Section data kept for undo.) |
| "Move testimonials above menu" | Page section order updated. No AI call needed. |
| "Update the nav links" | AI rewrites header section. Change propagates to all pages. |

### The Card

One card type handles most edits: **SectionEditCard**.

```ts
interface SectionEditCard {
  label: string                    // "Update hero section"
  sectionId: string
  changeSummary: string            // "New headline, adjusted layout"
  before: { html: string; css: string }  // for undo/comparison
  after: { html: string; css: string }   // proposed change
}
```

The card shows a brief summary of what's changing. "Try it" temporarily swaps the section in the preview. "Apply" commits it. The card manages its own lifecycle — no chat messages generated.

For theme changes: **ThemeEditCard** — same pattern but updates the theme variables instead of a section.

For structural changes (add/remove/reorder sections): handled directly, no AI call needed, no card needed. These are instant operations on the page's section list.

### Edit Flow

```
User: "Change the hero headline to Welcome Home"
  → AI receives: current hero section HTML/CSS + request
  → AI returns: text + SectionEditCard with new HTML
  → Card appears in chat
  → User clicks Apply → card swaps the section → done
```

```
User: "Add a testimonials section after the hero"
  → AI receives: page structure + theme + request
  → AI generates: new section HTML/CSS
  → Card appears with preview of new section
  → User clicks Add → section inserted → done
```

For complex edits ("rebrand everything"), the AI returns multiple cards — one for theme, one per affected section. Each card is independent. User applies them individually or all at once.

---

## 5. What We Keep from i0

### Keep (the good stuff)
- **App shell** — MainLayout, Sidebar, ProjectPage two-panel split
- **Chat system** — useConversations, message rendering, content blocks
- **Card system** — ChatCard component, card rendering in messages, content block model
- **Theme system** — simplified (flat variables instead of nested settings), but same concept
- **Preview component** — SitePreview with iframe, postMessage bridge, BrowserBar
- **Design system** — Button, Text, Panel, PanelToolbar, all the primitives
- **AI service** — Anthropic SDK integration, streaming, fence block parsing
- **Project management** — useProjects, sidebar, project switching

### Kill
- **14 section types** — types.ts, section-renderers.ts, components.ts. All of it.
- **Mock site data files** — downstreet-cafe.ts, shauns-blog.ts, etc. Replace with 2-3 pre-built sites using the new Section format.
- **Pipeline orchestrator** — pipeline.ts, usePipeline.ts, ai-pipeline-types.ts. Replace with simpler parallel generation.
- **Progressive renderer** — progressive-renderer.ts, skeleton slots. Replace with the placeholder → swap approach.
- **Generation prompts** — generation-prompts.ts. Replace with new section-level prompts.
- **Build progress system** — useBuildProgress.ts. Replace with simpler per-section tracking.
- **Onboarding modal** — NewProjectModal.vue, OnboardingChat.vue. Revisit later with fresh UX.
- **Theme defaults/normalization** — theme-defaults.ts, normalizeTheme. Theme is now a flat variable map, no normalization needed.

### Rewrite
- **renderer.ts** — new simple renderer (concatenate theme + sections)
- **SitePreview.vue** — simplified srcdoc generation, section-level postMessage handling
- **AI system prompt** — rewritten for free-form section generation
- **Seed data** — 2-3 hand-crafted example sites in the new format

---

## 6. Seed Sites

Instead of 7 AI-generated mock sites, hand-craft 2-3 that look genuinely good. These serve as:
- Proof that the system can produce quality
- Test fixtures for the editing UX
- Examples for the AI to learn from (few-shot prompting)

**Suggested sites:**
1. **Downstreet Cafe** — warm, editorial, food photography. (Rework the existing one.)
2. **A portfolio/agency site** — clean, minimal, lots of whitespace.
3. **A small e-commerce/product brand** — bold, colorful, product-focused.

Each is a `Site` object with hand-written HTML/CSS sections. No generators, no templates. Just good design, written by hand (or by AI with human curation).

---

## 7. Generation Speed

Back-of-napkin math for parallel generation:

| Step | API Calls | Time (parallel) |
|---|---|---|
| Theme | 1 | ~3s |
| Header + Footer | 2 (parallel) | ~4s |
| Homepage sections (3-4) | 3-4 (parallel) | ~6s |
| Additional pages (2-3 pages × 2-3 sections) | 4-9 (parallel, batched) | ~8s |

**Total: ~20s for a full site** (with aggressive parallelism). The user sees the first section within 5-7 seconds. Compare to i0's 8-10+ minutes.

The tradeoff: more API calls = higher cost per generation. But each call is small (one section), so individual call cost is low. And the UX improvement (seeing your site build in real time vs. staring at a spinner for 10 minutes) is massive.

### Rate Limiting

Anthropic rate limits apply. For parallel calls:
- Tier 1: 50 requests/minute — plenty for 10-15 section calls
- Token throughput: each section is ~500-1000 tokens output, well within limits
- Stagger calls slightly (100ms gaps) to avoid burst throttling

---

## 8. What This Enables

### Better AI Output
The AI has full creative control. It can use CSS grid, flexbox, animations, gradients, backdrop-filter — whatever makes the design look good. No more mapping creative intent through rigid data schemas.

### Faster Iteration
Section-level edits are section-level API calls. "Change the hero" regenerates one section in 3-5 seconds, not the whole site.

### Simpler Codebase
No section type registry. No renderers. No component CSS. No data validation. The system is: theme variables + raw HTML/CSS sections + a simple page assembler.

### Better Editing UX
Since sections are self-contained HTML/CSS, the AI can see exactly what it's editing. "Here's the current hero HTML/CSS. The user wants to change the headline." The AI rewrites the HTML. Done. No data→template→HTML translation layer.

### Progressive Building Still Works
Parallel generation + postMessage injection = the user watches their site assemble in real time. Same UX goal as i0's progressive rendering, but without the skeleton slot infrastructure.

---

## 9. Risks

### AI Output Consistency
Without predefined templates, the AI might produce inconsistent quality across sections. Mitigation: strong system prompt with design principles, theme variables for consistency, and few-shot examples from the seed sites.

### CSS Conflicts
Sections might have conflicting styles if the AI doesn't scope properly. Mitigation: the `[data-section="id"]` wrapper provides natural scoping, and the system prompt emphasizes scoping rules.

### Token Cost
More API calls per site. Each section call includes the theme + page context in the prompt. Mitigation: keep prompts lean, cache theme context, use smaller models for simple sections.

### Editing Complexity
When editing a section, the AI needs to see the current HTML/CSS to know what to change. For large sections, this could be a lot of tokens in the prompt. Mitigation: sections should be reasonably sized (one concern per section), and the edit prompt only includes the target section, not the whole site.

### Loss of Structure
Without typed section data, features like "reorder sections" are easy (just move HTML blocks), but "extract all menu items across the site" becomes hard (no structured data to query). This is fine for a prototype — structured data extraction is a future concern.

---

## 10. Implementation Plan

### Phase A: Strip and Scaffold
- Delete the kill list (section types, renderers, pipeline, mock sites, etc.)
- Create new data model (Site, Page, Section, Theme interfaces)
- Create new simple renderer (theme + sections → srcdoc)
- Verify the app still loads with an empty state

### Phase B: Seed Sites
- Hand-craft 2-3 example sites in the new Section format
- Each section is real HTML/CSS, designed to look good
- Wire into the existing project/preview system

### Phase C: Generation
- New section-level generation prompts
- Parallel generation with per-section API calls
- Progressive assembly in preview (postMessage injection)
- Simple placeholder slots during generation

### Phase D: Editing
- SectionEditCard component (self-contained lifecycle)
- ThemeEditCard component
- AI edit prompt (receives current section + request, returns new section)
- Section add/remove/reorder (direct manipulation, no AI needed)
- Basic undo (snapshot before each edit)

Each phase is independently demoable. Phase B gives you beautiful seed sites to show. Phase C gives you real-time generation. Phase D gives you the editing loop.

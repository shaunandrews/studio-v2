# Site Content Refactor

## What we did

### Problem

The site content system had degraded from its intended architecture. Pages were supposed to be composed of discrete sections (hero, features, info, etc.) with their own HTML and CSS. Instead:

- Each page was a single monolithic section — `transformSiteFiles()` flattened entire templates into one blob
- Headers and footers were string-replaced into every page via `{{header}}`/`{{footer}}` — no true sharing, editing one didn't affect others
- All styling was inline (`style="..."`) — the section `css` field was always empty
- Section roles were never assigned from templates
- The canvas had no concept of shared site elements

### Changes

**Data model** (`src/data/site-types.ts`)
- Added `shared?: boolean` to `SiteContentSection` — marks sections that appear on every page (header, footer)

**Template system** (`src/data/sites/*/`)
- Converted all 60 template files (8 sites) from inline styles to class-based HTML with `<style>` blocks
- Each section wrapped in `<div data-section="ID" data-role="ROLE">` — explicit, no parsing ambiguity
- Section IDs are prefixed with the template name (e.g., `home-hero`, `about-content`, `post-featured-image`)
- `{{header}}` and `{{footer}}` placeholders sit outside section wrappers

**Transform** (`src/data/useSiteDocument.ts`)
- Rewrote `transformSiteFiles()` with helpers:
  - `extractStyles()` — strips `<style>` blocks from HTML into the `css` field
  - `extractSections()` — finds `<div data-section="...">` wrappers and extracts innerHTML + metadata
- Parts (header/footer) become shared sections with `shared: true` and `role` set to the part name
- Section IDs and roles come directly from `data-section` and `data-role` attributes
- Pages reference `["shared-header", ...page-sections..., "shared-footer"]`

**Renderer** (`src/data/site-renderer.ts`)
- Section wrapper divs use `display: contents` — layout-transparent, sections compose naturally in the body flow without extra block boxes
- Applied to static rendering, dynamic section creation (section-update), and page swaps (page-update)

**Mutation guards** (`src/data/useSiteDocument.ts`)
- `removeSection` — blocks removal of shared sections
- `removePage` — skips deleting shared sections (they belong to other pages)
- `reorderSections` — pins shared header to first position, shared footer to last

**AI awareness** (`src/data/ai-tools.ts`, `src/data/ai-tool-executor.ts`)
- `buildSystemPrompt()` lists shared sections separately, marks them in page listings
- `remove_section` executor returns error for shared sections with guidance to use `update_section` instead

**DB migration** (`src/data/db.ts`)
- Version 5: clears `siteContent` table to force re-transform from templates

### How section definition works

Templates use `data-section` wrapper divs to define section boundaries:

```html
{{header}}

<div data-section="home-hero" data-role="hero">
<div class="hero">...</div>
<style>.hero { ... }</style>
</div>

<div data-section="home-feature-cards" data-role="features">
<div class="feature-cards">...</div>
<style>.feature-cards { ... }</style>
</div>

{{footer}}
```

The transform finds these wrappers, extracts innerHTML as the section HTML, reads the `data-section` attribute as the section ID, and `data-role` as the semantic role. No depth tracking or comment parsing needed.

Templates with a single logical section (sidebar layouts, simple pages) wrap everything in one `data-section` div.

**Current coverage:** 69 sections across 44 templates (1.6 avg). 20 templates have multiple sections, 24 have a single section.

### Section isolation

The renderer wraps each section in `<div data-section="X" style="display:contents">`. The `display: contents` makes the wrapper invisible to layout — child elements participate directly in the body's flow.

Each section's CSS lives in its own `<style id="section-X">` tag in the rendered document. There is no programmatic scoping — isolation is implicit via descriptive class names. This was a deliberate choice: regex-based CSS scoping breaks on media queries, keyframes, and multi-line selectors that the AI might generate.

## What still needs work

### Canvas shared elements UI

The canvas (`CanvasScreen.vue`) currently only shows pages. Shared sections (header, footer) should appear as "site elements" — a separate visual group connected to all pages. The data model supports this (shared sections have `shared: true` and `role`), but the UI hasn't been built.

### Dark mode variables

`site.json` defines theme colors but has no mechanism for dark mode overrides. The type system supports `darkVariables` on `SiteContentTheme`, but no template populates it. Would need a `darkColors` key in `site.json` and transform logic to generate `darkVariables`.

### CSS scoping at render time

If cross-section class name collisions become a problem, proper scoping could be added at the renderer level — wrapping each section's CSS content in `[data-section="X"] { ... }` using CSS nesting (widely supported) rather than trying to regex-transform selectors. This would be a change in `site-renderer.ts` when injecting `<style>` tags, not in the transform.

### Section-aware AI editing

The AI now sees sections with roles in the system prompt, but could be smarter about:
- Suggesting section creation when asked to add content (hero, testimonials, etc.)
- Understanding that shared sections affect all pages before making changes

# Plan: Migrate All Mock Sites to Section System

Phase 1 proved the section system works with Downstreet Cafe. This plan migrates the remaining 6 sites, then removes the backward-compatibility layer.

---

## Current State

- **Downstreet Cafe** — ✅ Migrated. Uses `SiteData` → `renderPage()` with backward-compatible wrapper exports.
- **Shaun's Blog** — ❌ Monolithic. 6 pages (homepage, post, about, archive, post2, projects).
- **UI Portfolio** — ❌ Monolithic. 6 pages (homepage, work, casestudy, casestudy2, process, contact).
- **Flavor Records** — ❌ Monolithic. 6 pages (homepage, artist, releases, catalog, shows, labelAbout).
- **Mise en Place** — ❌ Monolithic. 6 pages (homepage, recipe, mealplan, browse, groceries, settings).
- **Ledger** — ❌ Monolithic. 6 pages (homepage, invoice, clients, reports, settings, clientDetail).
- **Fuego Collective** — ❌ Monolithic. 3 pages (homepage, shop, product).

## The Problem With Shared Files

The current section system has shared files:
- `src/data/sections/types.ts` — section type union, data interfaces
- `src/data/sections/section-renderers.ts` — render functions + dispatcher
- `src/data/sections/components.ts` — shared CSS

If 6 agents all edit these simultaneously, we get merge conflicts. Each site needs new section types that Downstreet doesn't have.

## New Section Types Needed (by site)

### Shaun's Blog
- `blog-archive` — Post list with excerpts, dates, read-more links
- `blog-post` — Full blog post with title, date, author, body HTML, maybe featured image
- `blog-hero` — Blog-specific hero with author info / tagline

### UI Portfolio
- `project-grid` — Portfolio project cards with thumbnails, titles, descriptions
- `case-study` — Long-form case study with mixed content (images, text, stats, process steps)
- `process-steps` — Design process visualization (numbered steps with descriptions)

### Flavor Records
- `release-grid` — Album/release cards with cover art, artist, genre
- `artist-profile` — Artist bio with image, discography links
- `shows-list` — Upcoming shows with dates, venues, ticket links
- `featured-release` — Hero-style featured album with large artwork

### Mise en Place
- `recipe-detail` — Full recipe with ingredients, steps, timing, servings
- `recipe-grid` — Recipe card browse grid with images, tags, difficulty
- `meal-plan` — Weekly meal plan grid/calendar
- `grocery-list` — Categorized shopping list with checkboxes
- `app-settings` — Settings form layout (toggles, selects, inputs)

### Ledger
- `dashboard-stats` — Stat cards with numbers, labels, trends
- `data-table` — Tabular data (invoices, clients) with columns
- `invoice-detail` — Invoice view with line items, totals, status
- `chart` — CSS-based bar/line charts (reports page)
- `client-detail` — Client CRM view with contact info, history

### Fuego Collective
- `product-grid` — E-commerce product cards with images, prices, "Add to cart"
- `product-detail` — Single product page with image gallery, description, price, variants
- `hero-product` — Hero with product image + CTA (already exists as a pattern in Fuego's homepage)

## Strategy: Per-Site Section Files

Each site gets its own section types and renderers in a separate file. No shared-file conflicts.

```
src/data/sections/
  types.ts                      — base types + Downstreet section types (existing)
  components.ts                 — shared + Downstreet CSS (existing)
  section-renderers.ts          — Downstreet renderers (existing)
  renderer.ts                   — renderPage() (existing, shared by all)
  index.ts                      — barrel exports (existing)

  sites/
    shauns-blog.types.ts        — blog-specific section types
    shauns-blog.renderers.ts    — blog-specific render functions
    shauns-blog.css.ts          — blog-specific component CSS

    ui-portfolio.types.ts
    ui-portfolio.renderers.ts
    ui-portfolio.css.ts

    flavor-records.types.ts
    flavor-records.renderers.ts
    flavor-records.css.ts

    mise-en-place.types.ts
    mise-en-place.renderers.ts
    mise-en-place.css.ts

    ledger.types.ts
    ledger.renderers.ts
    ledger.css.ts

    fuego-collective.types.ts
    fuego-collective.renderers.ts
    fuego-collective.css.ts
```

### How Per-Site Sections Integrate

Each site's renderers file exports a `renderSiteSection(section): string | null` function. Returns HTML if it handles the type, `null` if not.

The main `renderSection()` dispatcher tries the base renderers first, then falls through to site-specific ones. OR — simpler for now — each site's `SiteData` module imports its own renderers and the page renderer accepts a custom render function.

**Simplest approach:** Extend `renderPage()` to accept an optional custom section renderer:

```ts
export function renderPage(
  page: PageTemplate,
  site: SiteData,
  activePage: string,
  themeCSSOverride?: string,
  customCSS?: string,
  customRenderer?: (section: Section) => string | null
): string
```

The renderer tries `customRenderer` first, falls back to the base `renderSection`. The site's CSS gets appended after the shared component CSS.

Each mock-site module:
```ts
// src/data/mock-sites/shauns-blog.ts
import { renderPage } from '../sections/renderer'
import { renderBlogSection } from '../sections/sites/shauns-blog.renderers'
import { blogCSS } from '../sections/sites/shauns-blog.css'

export const siteData: SiteData = { /* ... */ }

export function homepage(themeCSS: string): string {
  return renderPage(siteData.pages[0], siteData, 'homepage', themeCSS, blogCSS, renderBlogSection)
}
```

### Component CSS Strategy

- **Shared CSS** (`components.ts`) — Reset, base body/heading styles, and truly generic patterns (`.site-nav`, `footer`, `.page-header`). During Wave 2 consolidation, we'll pull out the Downstreet-specific classes and move them to a Downstreet CSS file.
- **Per-site CSS** — Each site's unique component styles. Injected as a third `<style>` block after shared components.

## Execution Plan

### Wave 1: Migrate Sites (6 agents in parallel)

Each agent:
1. Reads the current monolithic site file
2. Creates per-site section types, renderers, and CSS in `src/data/sections/sites/`
3. Rewrites the mock-site file to use `SiteData` + backward-compatible wrappers
4. Commits independently

**Agents don't touch shared files** (`types.ts`, `section-renderers.ts`, `components.ts`, `renderer.ts`). They only create new files and rewrite their own mock-site file.

### Wave 2: Consolidation (1 agent)

After all 6 sites are migrated:

1. **Update `renderPage()`** — Add `customCSS` and `customRenderer` parameters if not already done in Wave 1.

2. **Refactor shared types** — Create a unified `SectionType` union that includes all site-specific types. Move truly shared section types (hero-split, hero-simple, content-prose, etc.) into the base `types.ts`. Keep site-specific types in their own files but register them in the union.

3. **Refactor `components.ts`** — Extract Downstreet-specific CSS into `sites/downstreet-cafe.css.ts`. Keep only truly generic CSS in the shared file.

4. **Rewrite `mock-sites/index.ts`** — Replace the 50+ named imports with clean `SiteData` imports:
   ```ts
   import { siteData as downstreetCafe } from './downstreet-cafe'
   import { siteData as shaunsBlog } from './shauns-blog'
   // ...
   export const sites: Record<string, SiteData> = {
     'downstreet-cafe': downstreetCafe,
     'shauns-blog': shaunsBlog,
     // ...
   }
   ```

5. **Update `SitePreview.vue`** — Consume `SiteData` directly instead of calling wrapper functions. The preview calls `renderPage()` itself with the current page, color mode, and site-specific CSS/renderer. This eliminates all backward-compatible wrappers.

6. **Kill wrapper functions** — Remove all `homepage(themeCSS)` exports from every mock-site file. The `MockSite` interface is replaced by `SiteData`.

7. **Update `mock-sites/index.ts` types** — Replace `MockSite` with `SiteData` export. Update any components that reference `MockSite`.

### Wave 3: Verify

- TypeScript compiles clean
- All 7 sites render correctly in the preview
- Dark mode works on all sites that support it
- Navigation between pages works on all sites
- No visual regressions

## Files Changed Summary

**New files (Wave 1):**
- 6 × `src/data/sections/sites/{site}.types.ts`
- 6 × `src/data/sections/sites/{site}.renderers.ts`
- 6 × `src/data/sections/sites/{site}.css.ts`

**Rewritten (Wave 1):**
- 6 × `src/data/mock-sites/{site}.ts` — monolithic → SiteData

**Refactored (Wave 2):**
- `src/data/sections/renderer.ts` — add customCSS + customRenderer params
- `src/data/sections/types.ts` — unified SectionType union
- `src/data/sections/components.ts` — extract site-specific CSS
- `src/data/mock-sites/index.ts` — clean SiteData exports
- `src/data/mock-sites/downstreet-cafe.ts` — remove wrappers
- `src/components/features/SitePreview.vue` — consume SiteData directly

**Deleted (Wave 2):**
- `MockSite` interface (replaced by `SiteData`)
- All backward-compatible wrapper functions

## Estimated Scope

- Wave 1: 6 agents, each handles ~200-800 lines of content transcription + section type/renderer creation
- Wave 2: 1 agent, medium complexity refactor touching ~8 files
- Wave 3: Verification pass

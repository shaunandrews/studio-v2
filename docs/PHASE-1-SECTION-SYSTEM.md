# Phase 1: Section System — Complete ✅

The foundation layer. Structured section data + renderers replace monolithic HTML page functions. Every site owns its full page structure.

> See [SITE-BUILDER-SYSTEM.md](./SITE-BUILDER-SYSTEM.md) for the overarching architecture.

---

## Architecture

### Core Principle

**No defaults.** Every site defines 100% of its own structure — header, footer, sections, CSS. The renderer assembles what the site provides; it never injects its own chrome.

### Data Model

```
src/data/sections/
  types.ts              — Section, PageTemplate, SiteData, shared section data interfaces
  components.ts         — componentCSS (shared base styles: reset, headings, layout patterns)
  renderer.ts           — renderPage() assembler
  section-renderers.ts  — renderSection() dispatcher + 14 shared render functions
  index.ts              — re-exports

  sites/                — per-site types, renderers, and CSS
    downstreet-cafe.css.ts
    fuego-collective.{types,renderers,css}.ts
    mise-en-place.{types,renderers,css}.ts
    ledger.{types,renderers,css}.ts
    flavor-records.{types,renderers,css}.ts
    shauns-blog.{types,renderers,css}.ts
    ui-portfolio.{types,renderers,css}.ts
```

### Key Types

```ts
interface Section {
  id: string
  type: string              // open string — shared types OR site-specific (e.g. 'fuego-hero')
  data: Record<string, any> // structured content; renderers cast internally
}

interface PageTemplate {
  id: string
  title: string
  slug: string
  sections: Section[]       // ordered top-to-bottom, includes header/footer as sections
}

interface SiteData {
  name: string
  theme: SiteTheme
  fonts: FontImport[]
  pages: PageTemplate[]     // no header/footer fields — those live in sections
}
```

### Rendering Pipeline

`renderPage(page, site, activePage, themeCSSOverride?, customCSS?, customRenderer?)`:

1. Document shell (doctype, head, meta, title)
2. Font `<link>` tags from `site.fonts`
3. Theme CSS `<style>` (override or `themeToCSS(site.theme)`)
4. Shared component CSS `<style>`
5. Site-specific custom CSS `<style>` (if provided)
6. `<body>` → render each section in order → `</body>`

The `customRenderer` callback `(section, activePage) => string | null` handles site-specific section types. Returns `null` to fall through to the shared `renderSection()` dispatcher.

### Per-Site Pattern

Each mock site exports:
- `siteData: SiteData` — the structured site definition
- `renderSitePage(slug, themeCSSOverride?) → string` — convenience wrapper that finds the page, calls `renderPage()` with the site's custom CSS and renderer

The `mockSites` index exposes `SiteModule { siteData, renderSitePage }` per site. Vue components call `renderSitePage()` directly.

### 14 Shared Section Types

hero-split, hero-fullwidth, hero-simple, image-strip, image-gallery, menu-list, content-prose, content-cards, team-grid, event-list, event-recurring, contact-info, cta-banner, order-menu

### Site-Specific Section Types

Each site defines its own types for patterns that don't generalize:
- **Fuego Collective** — 14 types (fuego-hero, fuego-product-lineup, fuego-product-detail, etc.)
- **Mise en Place** — 11 types (mise-app-bar, mise-recipe-grid, mise-meal-plan, etc.)
- **Ledger** — ~20 types (ledger-dashboard-stats, ledger-invoice-detail, ledger-topbar, etc.)
- **UI Portfolio** — 25 types (portfolio-intro, project-grid, case-study-*, etc.)
- **Flavor Records** — header/footer + site-specific hero, featured, catalog types
- **Shaun's Blog** — header/footer + blog-specific post, archive, project types
- **Downstreet Cafe** — uses only shared types + site-owned header/footer

### What Was Removed

- `TemplatePart`, `HeaderData`, `FooterData` interfaces — headers/footers are now regular sections
- Default `renderHeader()` / `renderFooter()` in renderer.ts
- `.site-nav` and `footer` styles from shared `componentCSS`
- Backward-compatible `homepage(themeCSS)` / `pages` record exports
- `MockSite` / `MockSitePage` interfaces from the index
- All `as any` type casts and `display: none` CSS hacks

---

## Completed Work

1. ✅ Defined section types and data model (`types.ts`)
2. ✅ Extracted shared component CSS (`components.ts`)
3. ✅ Built 14 shared section renderers + `renderPage()` assembler
4. ✅ Refactored Downstreet Cafe from monolithic HTML to `SiteData`
5. ✅ Dark mode support via `themeCSSOverride` parameter
6. ✅ Migrated all 7 mock sites with site-specific types, renderers, and CSS
7. ✅ Removed default header/footer — every site owns its full structure
8. ✅ Removed backward-compat wrappers — clean `SiteData` + `renderSitePage()` API
9. ✅ Updated Vue components (`ProjectItem`, `SitePreview`) to use new API

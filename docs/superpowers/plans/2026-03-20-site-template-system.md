# Site Template System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inline page mock templates with a WordPress-inspired file system where each site is a self-contained folder of theme tokens, reusable HTML parts, and page templates — rendered as scaled iframes.

**Architecture:** Each site lives in `src/data/sites/{layout}/` with a `site.json` manifest, `parts/*.html` for shared fragments (header, footer), and `templates/*.html` for page content. A composable (`useSiteTemplates`) loads these at build time via Vite `?raw` imports, assembles complete HTML documents by injecting theme CSS variables and resolving `{{part}}` placeholders, and exposes a tree + page renderer. `SitePageThumb.vue` renders each assembled document in a scaled iframe. `SiteMapScreen.vue` consumes the tree and thumb component, replacing all inline mock templates.

**Tech Stack:** Vue 3 + TypeScript, Vite `?raw` imports for HTML/JSON, iframe `srcdoc` for rendering

**Spec:** `docs/superpowers/specs/2026-03-20-site-template-system-design.md`

---

## File Map

### New Files

| File | Responsibility |
|---|---|
| `src/data/sites/cafe/site.json` | Café site manifest (name, theme, pages) |
| `src/data/sites/cafe/parts/header.html` | Café shared nav bar |
| `src/data/sites/cafe/parts/footer.html` | Café shared footer |
| `src/data/sites/cafe/templates/home.html` | Café home page |
| `src/data/sites/cafe/templates/menu.html` | Café menu page |
| `src/data/sites/cafe/templates/about.html` | Café about page |
| `src/data/sites/cafe/templates/blog.html` | Café blog listing |
| `src/data/sites/cafe/templates/post.html` | Café single blog post |
| `src/data/sites/cafe/templates/reservations.html` | Café reservations form |
| `src/data/sites/cafe/templates/contact.html` | Café contact page |
| `src/data/sites/cafe/index.ts` | Café barrel file — raw imports + export |
| `src/data/sites/index.ts` | Site registry — maps layout strings to site modules |
| `src/data/useSiteTemplates.ts` | Composable: loads site data, derives tree, assembles pages |
| `src/components/composites/SitePageThumb.vue` | Renders assembled HTML in a scaled iframe |

### Modified Files

| File | Change |
|---|---|
| `src/components/features/SiteMapScreen.vue` | Replace inline page mocks with `SitePageThumb` + `useSiteTemplates`. Remove all `pm-*` CSS for sub-pages. Keep canvas/connector/toolbar/selection infrastructure. |

### Deleted Files (after café is working)

| File | Replaced By |
|---|---|
| `src/data/sitemap-content.ts` | `site.json` pages arrays |
| `src/data/site-types.ts` | Types in `useSiteTemplates.ts` |

---

## Task 1: Site Data Types and Assembly Function

**Files:**
- Create: `src/data/useSiteTemplates.ts`

This is the core engine. Types for site config, the assembly pipeline, and tree derivation.

- [ ] **Step 1: Create the types and assembly function**

```ts
// src/data/useSiteTemplates.ts

export interface SiteTheme {
  colors: Record<string, string>
  fonts: Record<string, string>
  spacing: Record<string, string>
}

export interface SitePageDef {
  slug: string
  title: string
  template: string
  collection?: {
    slug: string
    title: string
    template: string
    count: number
  }
}

export interface SiteConfig {
  name: string
  description: string
  favicon?: string
  theme: SiteTheme
  parts: string[]
  pages: SitePageDef[]
}

export interface SiteFiles {
  config: SiteConfig
  parts: Record<string, string>      // partName → HTML string
  templates: Record<string, string>  // templateName → HTML string
}

export interface SiteMapNode {
  label: string
  template: string
  isCollection?: boolean
  collectionCount?: number
  children?: SiteMapNode[]
}

/**
 * Convert theme tokens to a CSS :root block.
 */
function buildThemeCSS(theme: SiteTheme): string {
  const vars: string[] = []
  for (const [key, value] of Object.entries(theme.colors)) {
    vars.push(`  --${key}: ${value};`)
  }
  for (const [key, value] of Object.entries(theme.fonts)) {
    vars.push(`  --font-${key}: ${value};`)
  }
  for (const [key, value] of Object.entries(theme.spacing)) {
    vars.push(`  --${key}: ${value};`)
  }
  return `:root {\n${vars.join('\n')}\n}`
}

/**
 * Build Google Fonts <link> tags from theme font families.
 */
function buildFontLinks(fonts: Record<string, string>): string {
  const families = [...new Set(Object.values(fonts))]
    .filter(f => !f.includes('-apple-system') && !f.includes('sans-serif'))
    .map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`)
  if (families.length === 0) return ''
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${families.join('&')}&display=swap">`
}

/**
 * Replace {{partName}} placeholders with part HTML.
 */
function resolveParts(html: string, parts: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, name) => parts[name] ?? '')
}

/**
 * Assemble a complete HTML document for a page template.
 */
export function assemblePage(site: SiteFiles, templateName: string): string {
  const template = site.templates[templateName]
  if (!template) return ''

  const body = resolveParts(template, site.parts)
  const themeCSS = buildThemeCSS(site.config.theme)
  const fontLinks = buildFontLinks(site.config.theme.fonts)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${fontLinks}
<style>
${themeCSS}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif); color: var(--text, #1a1a1a); background: var(--bg, #fff); }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }
</style>
</head>
<body>
${body}
</body>
</html>`
}

/**
 * Derive a sitemap tree from the flat pages array.
 */
export function deriveSiteMapTree(config: SiteConfig): SiteMapNode {
  const root: SiteMapNode = {
    label: config.pages.find(p => p.slug === '/')?.title ?? 'Home',
    template: config.pages.find(p => p.slug === '/')?.template ?? 'home',
  }

  const children: SiteMapNode[] = []
  for (const page of config.pages) {
    if (page.slug === '/') continue
    const node: SiteMapNode = {
      label: page.title,
      template: page.template,
    }
    if (page.collection) {
      node.children = [{
        label: page.collection.title,
        template: page.collection.template,
        isCollection: true,
        collectionCount: page.collection.count,
      }]
    }
    children.push(node)
  }

  root.children = children
  return root
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx vue-tsc --noEmit`
Expected: Clean, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/useSiteTemplates.ts
git commit -m "feat(sites): add site template assembly engine and tree derivation"
```

---

## Task 2: Café Site Data (site.json + parts + templates)

**Files:**
- Create: `src/data/sites/cafe/site.json`
- Create: `src/data/sites/cafe/parts/header.html`
- Create: `src/data/sites/cafe/parts/footer.html`
- Create: `src/data/sites/cafe/templates/home.html`
- Create: `src/data/sites/cafe/templates/menu.html`
- Create: `src/data/sites/cafe/templates/about.html`
- Create: `src/data/sites/cafe/templates/blog.html`
- Create: `src/data/sites/cafe/templates/post.html`
- Create: `src/data/sites/cafe/templates/reservations.html`
- Create: `src/data/sites/cafe/templates/contact.html`

This is the creative work — authoring realistic HTML pages for Downstreet Café. Each template should look like an actual café website when rendered at 800px wide. Use Unsplash images, warm earthy colors from the theme, Playfair Display for headings, Inter for body text. Every page should feel like it belongs to the same site.

**Guidelines for authoring templates:**
- All styles inline (these render in iframes, no external CSS)
- Reference theme tokens via `var(--token)` — they'll be injected as CSS custom properties
- Use `{{header}}` at the top and `{{footer}}` at the bottom
- The mock renders at 800px intrinsic width scaled to 160px (0.2x), so use font sizes and spacing that look good at that scale. Text at 14px renders at ~3px visible — it will read as "real text" even if illegible. Headlines at 28-40px will be clearly readable.
- Use real Unsplash images with appropriate `w=` and `q=` params for small file sizes
- Fill the vertical space — these render at 3:4 aspect ratio (800x1066px visible area). Pages should have enough content to fill most of this height.

- [ ] **Step 1: Create site.json**

```json
{
  "name": "Downstreet Café",
  "description": "A cozy neighborhood coffee shop in Brooklyn",
  "favicon": "☕",
  "theme": {
    "colors": {
      "bg": "#faf9f7",
      "text": "#1a1a1a",
      "accent": "#8b6f47",
      "muted": "#888",
      "border": "rgba(0,0,0,0.08)",
      "surface": "#f0ece6"
    },
    "fonts": {
      "heading": "'Playfair Display', Georgia, serif",
      "body": "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    "spacing": {
      "content": "640px",
      "wide": "800px"
    }
  },
  "parts": ["header", "footer"],
  "pages": [
    { "slug": "/", "title": "Home", "template": "home" },
    { "slug": "/menu", "title": "Menu", "template": "menu" },
    { "slug": "/about", "title": "About", "template": "about" },
    {
      "slug": "/blog", "title": "Blog", "template": "blog",
      "collection": { "slug": "/blog/:slug", "title": "Post", "template": "post", "count": 12 }
    },
    { "slug": "/reservations", "title": "Reservations", "template": "reservations" },
    { "slug": "/contact", "title": "Contact", "template": "contact" }
  ]
}
```

- [ ] **Step 2: Create parts/header.html**

The café nav bar — warm, elegant, matching the home page style. Logo on the left (Playfair Display), nav links on the right (Inter). Use the same Unsplash café images that SiteThumbnail uses for visual consistency.

- [ ] **Step 3: Create parts/footer.html**

Simple footer with address, hours, and copyright. Earthy surface background color.

- [ ] **Step 4: Create templates/home.html**

Port the existing café home mock from SiteThumbnail into this format. Hero image with overlay text, three feature cards (Espresso Bar, Kitchen, Private Events), info section with hours/address. Use the same Unsplash images as the current SiteThumbnail café mock.

- [ ] **Step 5: Create templates/menu.html**

Real café menu. Categories (Coffee, Food, Pastries, Drinks) with items and prices. Styled like an elegant café menu — dotted leaders between item names and prices, category headers in muted uppercase.

- [ ] **Step 6: Create templates/about.html**

Hero image of the café interior, "Our Story" heading, two paragraphs of history, a pull quote, team section with names/roles.

- [ ] **Step 7: Create templates/blog.html**

"From the Kitchen" heading, featured post with large image, 2-3 smaller post previews below with thumbnails. Sidebar with categories/newsletter signup.

- [ ] **Step 8: Create templates/post.html**

Full article layout — large featured image, article title, date/read time meta, body paragraphs, author byline at bottom.

- [ ] **Step 9: Create templates/reservations.html**

Reservation form with date, time, party size, name, email, special requests fields. Small image of the dining room, descriptive text about private events.

- [ ] **Step 10: Create templates/contact.html**

Split layout — left side has address, hours, phone, email info. Right side has a simple contact form. Map placeholder at the bottom.

- [ ] **Step 11: Commit**

```bash
git add src/data/sites/cafe/
git commit -m "feat(sites): add Downstreet Café site data, parts, and templates"
```

---

## Task 3: Site Registry and Barrel Imports

**Files:**
- Create: `src/data/sites/cafe/index.ts`
- Create: `src/data/sites/index.ts`

Wire up the Vite `?raw` imports so the composable can access site files.

- [ ] **Step 1: Create café barrel file**

```ts
// src/data/sites/cafe/index.ts
import config from './site.json'
import header from './parts/header.html?raw'
import footer from './parts/footer.html?raw'
import home from './templates/home.html?raw'
import menu from './templates/menu.html?raw'
import about from './templates/about.html?raw'
import blog from './templates/blog.html?raw'
import post from './templates/post.html?raw'
import reservations from './templates/reservations.html?raw'
import contact from './templates/contact.html?raw'

import type { SiteFiles } from '@/data/useSiteTemplates'

export default {
  config,
  parts: { header, footer },
  templates: { home, menu, about, blog, post, reservations, contact },
} satisfies SiteFiles
```

- [ ] **Step 2: Create site registry**

```ts
// src/data/sites/index.ts
import type { SiteFiles } from '@/data/useSiteTemplates'

// Lazy imports — only loaded when a site is accessed
const siteModules: Record<string, () => Promise<{ default: SiteFiles }>> = {
  cafe: () => import('./cafe/index'),
}

export async function loadSite(layout: string): Promise<SiteFiles | null> {
  const loader = siteModules[layout]
  if (!loader) return null
  const mod = await loader()
  return mod.default
}

// Synchronous version for sites that are already bundled
// (we'll use static imports for now since there are only 7 sites)
import cafe from './cafe/index'

export const sites: Record<string, SiteFiles> = {
  cafe,
}
```

- [ ] **Step 3: Add TypeScript declaration for ?raw imports**

Check if `src/vite-env.d.ts` already handles `?raw`. If not, add:

```ts
declare module '*.html?raw' {
  const content: string
  export default content
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx vue-tsc --noEmit`
Expected: Clean.

- [ ] **Step 5: Commit**

```bash
git add src/data/sites/cafe/index.ts src/data/sites/index.ts
git commit -m "feat(sites): add site registry and Vite raw imports"
```

---

## Task 4: SitePageThumb Component

**Files:**
- Create: `src/components/composites/SitePageThumb.vue`

A focused component that renders an HTML document string in a scaled iframe.

- [ ] **Step 1: Create the component**

```vue
<script setup lang="ts">
defineProps<{
  html: string
}>()
</script>

<template>
  <div class="site-page-thumb">
    <iframe
      :srcdoc="html"
      class="site-page-thumb__iframe"
      sandbox="allow-same-origin"
      loading="lazy"
      tabindex="-1"
    />
  </div>
</template>

<style scoped>
.site-page-thumb {
  width: 160px;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  position: relative;
}

.site-page-thumb__iframe {
  width: 800px;
  height: 1066px;
  border: none;
  transform-origin: top left;
  transform: scale(0.2);
  pointer-events: none;
}
</style>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx vue-tsc --noEmit`
Expected: Clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/composites/SitePageThumb.vue
git commit -m "feat(sites): add SitePageThumb iframe renderer component"
```

---

## Task 5: Wire SiteMapScreen to Use New System

**Files:**
- Modify: `src/components/features/SiteMapScreen.vue`

Replace the inline page mock templates with `SitePageThumb` for sites that have template data. Fall back to the old system for sites not yet migrated.

- [ ] **Step 1: Update imports and composable usage**

Add imports for `SitePageThumb`, `useSiteTemplates` types, and the sites registry. Add a computed that loads the current site's template data and derives the tree.

Replace the `sitemap-content` import:
```ts
import { sites } from '@/data/sites/index'
import { assemblePage, deriveSiteMapTree } from '@/data/useSiteTemplates'
import type { SiteMapNode } from '@/data/useSiteTemplates'
import SitePageThumb from '@/components/composites/SitePageThumb.vue'
```

Replace the tree computed:
```ts
const siteFiles = computed(() => sites[layout.value] ?? null)
const tree = computed(() => {
  if (siteFiles.value) return deriveSiteMapTree(siteFiles.value.config)
  return null // fallback: no tree if site not migrated
})
```

Add a helper to get assembled HTML for a template name:
```ts
function getPageHtml(templateName: string): string {
  if (!siteFiles.value) return ''
  return assemblePage(siteFiles.value, templateName)
}
```

- [ ] **Step 2: Replace page-thumb rendering in template**

For the **root node**, replace the inline `page-mock` div with:
```vue
<SitePageThumb v-if="siteFiles" :html="getPageHtml(tree.template)" />
```

For **level 1 child nodes**, replace the `<div class="page-thumb"><div class="page-mock">...` block with:
```vue
<SitePageThumb v-if="siteFiles" :html="getPageHtml(child.template)" />
```

For **level 2 grandchild nodes**, same pattern:
```vue
<SitePageThumb v-if="siteFiles" :html="getPageHtml(gc.template)" />
```

- [ ] **Step 3: Update SitePageThumb to respect zoom-scaled borders/shadows**

The `page-thumb` class on SiteMapScreen currently applies zoom-compensated borders and shadows. Either move those styles into `SitePageThumb.vue` or keep them on a wrapper. The simplest approach: `SitePageThumb` is just the iframe container, and SiteMapScreen wraps it in the existing `.page-thumb` div that already handles borders/shadows/radius.

Adjust `SitePageThumb.vue` to NOT include the outer border/shadow/radius — let the parent handle that:
```vue
<style scoped>
.site-page-thumb {
  width: 160px;
  aspect-ratio: 3 / 4;
  overflow: hidden;
}

.site-page-thumb__iframe {
  width: 800px;
  height: 1066px;
  border: none;
  transform-origin: top left;
  transform: scale(0.2);
  pointer-events: none;
}
</style>
```

The SiteMapScreen wrapping stays as-is:
```vue
<div class="page-thumb">
  <SitePageThumb :html="getPageHtml(child.template)" />
</div>
```

- [ ] **Step 4: Remove old inline mock templates**

Delete the massive `<template v-if="child.pageType === 'content'">` through `</template>` blocks for all page types (content, listing, single, form, product-grid, product-single, menu, services, pricing, gallery, docs, cart). These are replaced by the iframe approach.

Also delete the duplicate set for level 2 grandchild nodes.

Keep the home page inline templates (cafe home, blog home, portfolio home, etc.) for now as a fallback — or replace them too if the site has templates.

- [ ] **Step 5: Remove unused CSS**

Delete all the `pm-*` CSS classes that were used by the old inline page mock templates:
- `.pm-heading`, `.pm-meta`, `.pm-body-text`, `.pm-item-*`, `.pm-menu-*`, `.pm-service-*`, `.pm-pricing-*`, `.pm-product-name`, `.pm-product-price`, `.pm-product-price-lg`, `.pm-product-hero`, `.pm-field-label`, `.pm-form-row`, `.pm-docs-section-label`, `.pm-docs-nav-item`, `.pm-page-body--center`, `.pm-page-body--tight`

Keep CSS that's still used by the home page inline templates (`pm-hero`, `pm-card-row`, `pm-line`, etc.) and the overall page-thumb/page-mock scaling infrastructure.

- [ ] **Step 6: Verify it compiles and renders**

Run: `npx vue-tsc --noEmit`
Then check the dev server — navigate to a café site's Site Map. The home page should still render (inline template) and the sub-pages should render via iframes with the template content.

- [ ] **Step 7: Commit**

```bash
git add src/components/features/SiteMapScreen.vue src/components/composites/SitePageThumb.vue
git commit -m "feat(sites): wire SiteMapScreen to template system for café"
```

---

## Task 6: Delete Old Sitemap Content System

**Files:**
- Delete: `src/data/sitemap-content.ts`
- Delete: `src/data/site-types.ts`
- Modify: any files that import from the deleted files

Only do this after verifying the café site map works end-to-end with the new system.

- [ ] **Step 1: Search for imports of deleted files**

```bash
grep -r "sitemap-content\|site-types" src/ --include="*.ts" --include="*.vue" -l
```

Update or remove each import.

- [ ] **Step 2: Delete the files**

```bash
rm src/data/sitemap-content.ts src/data/site-types.ts
```

- [ ] **Step 3: Verify it compiles**

Run: `npx vue-tsc --noEmit`
Expected: Clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(sites): remove old sitemap-content and site-types modules"
```

---

## Task 7: Build Remaining Sites (one per commit)

**Files:** Repeat the Task 2 + Task 3 pattern for each remaining site.

Each site needs: `site.json`, `parts/header.html`, `parts/footer.html`, `templates/*.html`, and `index.ts` barrel. Then add it to `src/data/sites/index.ts`.

- [ ] **Step 1: Portfolio (Studio Meridian)** — Dark theme, design agency feel. Pages: home, work, project, about, services, contact.
- [ ] **Step 2: Store (Thread & Co.)** — E-commerce. Pages: home, shop, product, cart, about, contact.
- [ ] **Step 3: Blog (Arlo Writes)** — Personal blog. Pages: home, blog, post, about, contact.
- [ ] **Step 4: Landing (Launchpad)** — SaaS landing. Pages: home, features, pricing, about, contact.
- [ ] **Step 5: Docs (DevRef)** — API docs. Pages: home, docs, article, blog, post, about.
- [ ] **Step 6: Gallery (Wild Lens)** — Photography, dark theme. Pages: home, gallery, album, about, contact.
- [ ] **Step 7: Default** — Twenty Twenty-Five style. Pages: home, about, blog, post, contact.
- [ ] **Step 8: Commit each site individually**

```bash
git add src/data/sites/portfolio/ && git commit -m "feat(sites): add Studio Meridian site templates"
# ... repeat for each
```

---

## Task 8: Clean Up Home Page Fallback

**Files:**
- Modify: `src/components/features/SiteMapScreen.vue`

Once all 8 sites have template data, the home page can also render via iframe instead of the inline SiteThumbnail-style HTML. This removes the last of the inline mock templates from SiteMapScreen.

- [ ] **Step 1: Replace root node inline home mock with SitePageThumb**

The root node currently has a big `<template v-if="layout === 'cafe'">` block with inline HTML. Replace with:

```vue
<SitePageThumb v-if="siteFiles" :html="getPageHtml(tree.template)" />
```

- [ ] **Step 2: Remove all inline home page CSS**

Delete `.pm-hero`, `.pm-card-row`, `.pm-card`, `.pm-blog-layout`, `.pm-split-hero`, `.pm-portfolio-grid`, `.pm-product-grid`, `.pm-landing-hero`, `.pm-feature-row`, `.pm-gallery-grid`, `.pm-docs-layout`, `.pm-line`, `.pm-tag`, and all related home-page-specific CSS.

- [ ] **Step 3: Remove the `pm-nav`, `pm-logo`, `pm-nav-links` CSS**

These were only used by inline mocks. The iframe pages have their own nav styling.

- [ ] **Step 4: Verify and commit**

Run: `npx vue-tsc --noEmit` and check dev server.

```bash
git add src/components/features/SiteMapScreen.vue
git commit -m "refactor(sites): remove all inline page mocks, fully iframe-rendered"
```

# Site Template System

## Problem

Site map page mocks are currently rendered via inline Vue templates with skeleton placeholders and hardcoded HTML. The result looks generic — every page uses the same handful of layout templates regardless of site. Content is scattered across `sitemap-content.ts` (page trees), `seed-sites.ts` (site identity), `site-types.ts` (unused rendering types), and `SiteThumbnail.vue` (hardcoded home page mocks).

## Solution

A WordPress block-theme-inspired file system where each site is a self-contained folder with a manifest, theme tokens, reusable parts, and page templates as plain HTML. A renderer assembles these into full HTML documents displayed in scaled iframes.

## File Structure

```
src/data/sites/
  cafe/
    site.json
    parts/
      header.html
      footer.html
    templates/
      home.html
      menu.html
      about.html
      blog.html
      post.html
      reservations.html
      contact.html
  portfolio/
    site.json
    parts/
      header.html
      footer.html
    templates/
      home.html
      work.html
      project.html
      about.html
      services.html
      contact.html
  store/
    site.json
    parts/...
    templates/...
  blog/
    ...
  landing/
    ...
  docs/
    ...
  gallery/
    ...
  default/
    ...
```

## site.json

Single source of truth for site identity, theme, and page structure.

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
      "muted": "#666",
      "border": "rgba(0,0,0,0.08)",
      "surface": "#f5f3f0"
    },
    "fonts": {
      "heading": "Playfair Display",
      "body": "Inter"
    },
    "spacing": {
      "content": "680px",
      "wide": "1000px"
    }
  },
  "parts": ["header", "footer"],
  "pages": [
    { "slug": "/", "title": "Home", "template": "home" },
    { "slug": "/menu", "title": "Menu", "template": "menu" },
    { "slug": "/about", "title": "About", "template": "about" },
    {
      "slug": "/blog", "title": "Blog", "template": "blog",
      "collection": {
        "slug": "/blog/:slug",
        "title": "Post",
        "template": "post",
        "count": 12
      }
    },
    { "slug": "/reservations", "title": "Reservations", "template": "reservations" },
    { "slug": "/contact", "title": "Contact", "template": "contact" }
  ]
}
```

## Template HTML

Plain HTML files. Reference theme tokens as CSS variables. Include parts with `{{partName}}` placeholders.

Example `templates/menu.html`:
```html
{{header}}
<div class="page-content" style="max-width: var(--content); margin: 0 auto; padding: 40px 32px;">
  <h1 style="font-family: var(--font-heading); font-size: 32px; margin: 0 0 8px;">Our Menu</h1>
  <p style="color: var(--muted); font-size: 14px; margin: 0 0 32px;">Roasted in-house, served with care.</p>

  <div style="margin-bottom: 28px;">
    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); border-bottom: 1px solid var(--border); padding-bottom: 6px; margin: 0 0 8px;">Coffee</h3>
    <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
      <span>Espresso</span><span style="font-weight: 600;">$3.50</span>
    </div>
    <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px;">
      <span>Cortado</span><span style="font-weight: 600;">$4.50</span>
    </div>
    <!-- ... -->
  </div>
</div>
{{footer}}
```

Parts are the same format — plain HTML with inline styles referencing theme variables.

Example `parts/header.html`:
```html
<nav style="display: flex; align-items: center; justify-content: space-between; padding: 14px 32px; border-bottom: 1px solid var(--border); background: var(--bg);">
  <span style="font-family: var(--font-heading); font-size: 18px; font-weight: 700;">Downstreet Café</span>
  <div style="display: flex; gap: 24px; font-size: 13px; color: var(--muted);">
    <a>Menu</a><a>About</a><a>Blog</a><a>Reservations</a><a>Contact</a>
  </div>
</nav>
```

## Assembly Pipeline

1. **Read** site.json, all parts, all templates (Vite `?raw` imports at build time)
2. **Generate theme CSS** — Convert `theme.colors` + `theme.fonts` + `theme.spacing` into a `:root { --bg: #faf9f7; --text: #1a1a1a; ... }` style block
3. **Resolve parts** — For each template, replace `{{header}}` with `parts/header.html` content, `{{footer}}` with `parts/footer.html` content
4. **Build document** — Wrap in HTML document shell: `<!DOCTYPE html>`, `<meta charset>`, Google Fonts `<link>`, theme `<style>`, assembled body HTML
5. **Return** — Full HTML document string ready for iframe `srcdoc`

This pipeline lives in a utility function: `assemblePage(site, templateName) → string`

## Rendering

`SitePageThumb.vue` — A small component that:
- Accepts an HTML document string
- Renders a `<div class="page-thumb">` containing an `<iframe srcdoc="...">`
- The iframe is sized at the mock's intrinsic width (800px)
- The parent div is 160px wide with `overflow: hidden`
- The iframe is scaled via CSS `transform: scale(0.2)` with `transform-origin: top left`
- `pointer-events: none` on the iframe so clicks pass through to the sitemap node

## Sitemap Tree Derivation

The flat `pages` array in site.json is converted to a tree for the sitemap:

- Pages without `/` in their slug (after the leading `/`) are top-level children of home
- Pages with a `collection` field get a child node with the stack treatment + count badge
- The home page (`"/"`) is the root node

This happens in `useSiteTemplates` composable. SiteMapScreen receives a typed tree and doesn't know about the file system.

## Composable: useSiteTemplates

```ts
function useSiteTemplates(layout: string) → {
  site: SiteConfig          // parsed site.json
  tree: SiteMapNode         // derived sitemap tree
  assemblePage(template: string): string  // returns full HTML document
}
```

SiteMapScreen calls `assemblePage('menu')` for each node and passes the result to `SitePageThumb`.

## What Gets Deleted

- `src/data/sitemap-content.ts` — Replaced by site.json pages arrays
- `src/data/site-types.ts` — Replaced by new types in useSiteTemplates
- Inline page mock templates in SiteMapScreen.vue (the `pm-*` CSS and `<template>` blocks for content/listing/single/form/menu/services/pricing/etc.)
- The café-specific page types we just added (`cafe-menu`, `cafe-about`, etc.)

## What Gets Kept

- `src/data/site-renderer.ts` — Adapted to work with the new assembly pipeline (or replaced by the simpler `assemblePage` function if the postMessage features aren't needed)
- `SiteThumbnail.vue` — Still used on the site overview screen. Could eventually migrate to this system but not in scope now.
- `seed-sites.ts` — Still provides runtime state (status, url, pipeline). The `mockLayout` field becomes the key to look up the site folder. Could rename to `siteId` or similar.
- Sitemap canvas/connector/toolbar infrastructure in SiteMapScreen.vue — All kept, just the page rendering swapped out.

## Migration Path

1. Build the site folder system and composable (café first as proof of concept)
2. Create `SitePageThumb.vue` with iframe rendering
3. Wire SiteMapScreen to use the new system for café
4. Verify it looks good, then build out the remaining 6 sites
5. Delete the old inline mock templates and sitemap-content.ts

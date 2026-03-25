# Site Template System

WordPress-inspired file system for rendering realistic miniature page previews in the Canvas.

## How It Works

Each site is a self-contained folder with a manifest, theme tokens, reusable HTML parts, and page templates. At build time, Vite imports everything as raw strings. At render time, the assembly pipeline injects theme CSS variables, resolves part placeholders, and wraps the result in a complete HTML document displayed in a scaled iframe.

## Folder Structure

```
sites/
  cafe/
    site.json              ← manifest: identity, theme tokens, page list
    parts/
      header.html          ← reusable nav bar
      footer.html          ← reusable footer
    templates/
      home.html            ← one file per page
      menu.html
      about.html
      ...
    index.ts               ← barrel file with ?raw imports
  index.ts                 ← registry mapping layout names to site data
```

## site.json

The manifest defines three things:

**Identity** — name, description, favicon.

**Theme** — design tokens that become CSS custom properties:
- `theme.colors` → `--bg`, `--text`, `--accent`, `--muted`, `--border`, `--surface`
- `theme.fonts` → `--font-heading`, `--font-body`
- `theme.spacing` → `--content`, `--wide`

**Pages** — flat list of pages with slugs and template references. Collections (like blog posts) are nested on their parent page:

```json
{
  "slug": "/blog", "title": "Blog", "template": "blog",
  "collection": { "slug": "/blog/:slug", "title": "Post", "template": "post", "count": 12 }
}
```

## Writing Templates

Templates are plain HTML with inline styles. They reference theme tokens via CSS variables and include parts with `{{partName}}` placeholders.

```html
{{header}}
<div style="max-width: var(--content); margin: 0 auto; padding: 32px;">
  <h1 style="font-family: var(--font-heading); font-size: 32px;">Page Title</h1>
  <p style="color: var(--muted); font-size: 14px;">Body text here.</p>
</div>
{{footer}}
```

### Guidelines

- **All styles must be inline.** Templates render in isolated iframes — external stylesheets don't apply.
- **Use CSS variables for theme values.** Colors, fonts, and spacing should reference `var(--token)` so they come from the theme. Hardcode only image URLs, rgba overlays, and precise pixel measurements.
- **Design for 800px wide, ~1066px tall.** Templates render at 800px and get scaled to 160px (0.2x). Use generous font sizes (14-40px) and spacing. Text at 14px renders at ~3px visible — it reads as "real text" even if illegible at thumbnail scale.
- **Fill the viewport.** Pages should have enough content to fill most of the 800×1066 area. No huge empty white space.
- **Use real Unsplash images** with `w=` and `q=` params for appropriate file sizes.
- **Start every template with `{{header}}` and end with `{{footer}}`.**

## Adding a New Site

1. Create a folder: `src/data/sites/{name}/`
2. Add `site.json` with theme and pages
3. Add `parts/header.html` and `parts/footer.html`
4. Add a template file for each page in `templates/`
5. Create `index.ts` barrel:

```ts
import config from './site.json'
import header from './parts/header.html?raw'
import footer from './parts/footer.html?raw'
import home from './templates/home.html?raw'
// ... import all templates

import type { SiteFiles } from '@/data/useSiteTemplates'

export default {
  config,
  parts: { header, footer },
  templates: { home, /* ... */ },
} satisfies SiteFiles
```

6. Add to the registry in `src/data/sites/index.ts`:

```ts
import newSite from './newsite/index'
export const sites: Record<string, SiteFiles> = {
  cafe,
  newsite: newSite,
}
```

## Assembly Pipeline

`useSiteTemplates.ts` provides:

- **`assemblePage(site, templateName)`** — Takes a SiteFiles object and template name, returns a complete HTML document string ready for iframe `srcdoc`. Injects theme CSS variables, Google Fonts links, base reset styles, and resolves `{{part}}` placeholders.
- **`deriveCanvasTree(config)`** — Converts the flat pages array from site.json into a hierarchical tree for the Canvas. Collections become child nodes with stack treatment.

## Rendering

`SitePageThumb.vue` renders an assembled HTML string in a sandboxed iframe scaled from 800px to 160px. The parent `CanvasScreen.vue` wraps each thumb in a `.page-thumb` div that handles borders, shadows, selection outlines, and zoom compensation.

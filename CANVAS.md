# Canvas

An interactive canvas that visualizes a site's page hierarchy. It lives in `CanvasScreen.vue` and appears as one of the site navigation screens.

## Data flow

The canvas has two data sources:

- **Tree structure** — derived from the static `site.json` config via `deriveCanvasTree()` in `useSiteTemplates.ts`. This provides the page hierarchy, labels, slugs, and collection metadata (e.g., blog posts with a count badge). The tree is a `CanvasNode` with nested children.

- **Page thumbnails** — rendered from the live `SiteContent` in IndexedDB via `renderSite()` from `site-renderer.ts`. This is the same rendering path the browser preview uses, so thumbnails reflect AI edits and all other changes.

```
site.json (static)              IndexedDB (live)
      │                               │
deriveCanvasTree()              getContent(siteId)
      │                               │
  CanvasNode tree              SiteContent
  (labels, slugs,                     │
   collections)              renderSite(content, slug)
      │                               │
      └──────────┬────────────────────┘
                 │
          CanvasScreen.vue
          ├── tree layout + connectors
          └── SitePageThumb iframes
```

## Tree structure

`CanvasNode` represents one node in the hierarchy:

```typescript
interface CanvasNode {
  label: string           // Display name ("Home", "Blog")
  slug: string            // Page slug ("/", "/blog")
  template: string        // Template name ("home", "blog")
  isCollection?: boolean  // True for paginated content (blog posts, products)
  collectionCount?: number // Number of items in the collection
  children?: CanvasNode[]
}
```

The tree has up to 3 levels:
- **Root** — the home page
- **Level 1** — all other pages (Menu, About, Blog, Contact, etc.)
- **Level 2** — collection items (e.g., "Post" under "Blog" with a count badge)

Collection slugs contain route params (e.g., `/blog/:slug`). Since these don't correspond to real pages in `SiteContent`, the thumbnail renderer strips the param and falls back to the parent page (`/blog`).

## Canvas

The canvas uses an infinite-pan/zoom canvas:

- **Pan** — pointer drag (any button except right-click)
- **Zoom** — Ctrl+wheel or pinch; clamped to 0.15×–6×
- **Fit** — double-click a node to zoom-to-fit; toolbar button fits entire tree
- **Transform** — CSS `translate + scale` on the canvas div, `transform-origin: 0 0`

The zoom percent shown in the toolbar accounts for the thumbnail scale factor (0.2×), so "100%" means the page thumbnails are at actual pixel size.

## Connectors

SVG paths connect parent nodes to children. Built by `buildTreePaths()` which:
- Draws a vertical trunk from parent center to a horizontal rail
- Rail sits halfway between parent bottom and nearest child top
- Each child gets a vertical drop from the rail with rounded corners (`CORNER_RADIUS = 8`)
- Single-child connections use an L-shaped path instead of a rail

Connectors are recomputed on mount, resize, zoom settle, and tree changes.

## Selection and task creation

Clicking a page node selects it. A floating `InputChatMini` appears below the selected node. Typing and sending creates a new task scoped to that page:

- Task title: `"{page name}: {message preview}"`
- Message prefixed with: `[Canvas → {page name} page]`
- Agent: `claude-code`

## Thumbnail rendering

Each node contains a `SitePageThumb` component — a scaled-down iframe (`160px` wide, `3:4` aspect ratio) showing the full rendered page. The iframe receives the same HTML that the browser preview would show, produced by `renderSite(siteContent, pageSlug)`.

## Key files

| File | Role |
|------|------|
| `src/components/features/CanvasScreen.vue` | Canvas, tree layout, connectors, selection, task input |
| `src/components/composites/SitePageThumb.vue` | Scaled iframe wrapper for a single page |
| `src/data/useSiteTemplates.ts` | `deriveCanvasTree()` — builds tree from `site.json` config |
| `src/data/site-renderer.ts` | `renderSite()` — produces HTML from live `SiteContent` |
| `src/data/useSiteDocument.ts` | `getContent()` — provides DB-backed `SiteContent` |
| `src/data/sites/*/site.json` | Static page hierarchy, collections, theme config |

## Known limitations

- **Tree structure is static.** `deriveCanvasTree` reads from `site.json`, not from `SiteContent.pages`. If the AI adds or removes a page, the tree won't update — only the thumbnails reflect changes. The tree should eventually be derived from `SiteContent.pages` directly.

- **No shared elements.** Shared sections (header, footer) don't appear on the canvas. They should eventually show as a separate "site elements" group.

- **Collection thumbnails are approximate.** Collection nodes (e.g., blog posts) show the parent page's thumbnail since the collection slug pattern doesn't correspond to a real page.

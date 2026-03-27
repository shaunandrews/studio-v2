# Lessons from gutenberg-canvas

Source: [draganescu/gutenberg-canvas](https://github.com/draganescu/gutenberg-canvas) by Andrei Draganescu.

An infinite canvas app (React + Zustand + Vite) where Claude creates WordPress block themes by placing artboards, editing theme.json, and exporting installable `.zip` themes. No server, no persistence — everything is in-memory until you export.

---

## 1. Artboards as Theme Pieces

Each artboard on the canvas maps 1:1 to a WordPress theme file:

```typescript
interface Artboard {
  id: string;
  label: string;                                    // "Header", "Hero Section"
  type: 'template' | 'template-part' | 'pattern';  // What kind of WP piece
  slug: string;                                     // "header", "front-page"
  position: { x: number; y: number };               // Canvas placement
  size: { width: number; height: number };
  blockContent: string;                              // Raw Gutenberg block markup
  createdBy: 'user' | 'agent';
}
```

The AI creates artboards by type — a `template-part` with slug `header`, a `template` with slug `front-page`, a `pattern` with slug `pricing-table`. Each is independently editable and independently exportable.

**What this means for Studio:** Studio's `SiteContent` treats the site as a single blob — one `html` string for the whole page. Andrei's model decomposes a theme into its natural WordPress pieces. If Studio moved toward per-piece editing, the AI could work on a header independently from a footer, revisions could be per-piece rather than whole-site, and users could mix-and-match pieces across sites. The artboard type system (`template` / `template-part` / `pattern`) directly mirrors WordPress's own theme file hierarchy, which means export to a real theme is trivial — each artboard just becomes a file.

---

## 2. theme.json as Live Design System

The app keeps a `ThemeJson` object in the Zustand store that acts as the single source of truth for design tokens:

```typescript
interface ThemeJson {
  settings: {
    color: { palette: Array<{ slug: string; color: string; name: string }> };
    typography: {
      fontFamilies: Array<{ slug: string; fontFamily: string; name: string }>;
      fontSizes: Array<{ slug: string; size: string; name: string }>;
    };
    spacing: { units: string[]; blockGap: string };
    layout: { contentSize: string; wideSize: string };
  };
  styles: {
    color: { background: string; text: string };
    typography: { fontFamily: string; fontSize: string; lineHeight: string };
    elements: {
      link: { color: { text: string } };
      heading: { typography: { fontFamily: string; fontWeight: string } };
    };
  };
}
```

This powers three things simultaneously:

1. **Live CSS generation** — `generateThemeCss()` converts the object into CSS custom properties (`--wp--preset--color--primary`) and utility classes (`.has-primary-color`, `.has-primary-background-color`) that mirror what WordPress would produce at runtime.

2. **Editor settings** — `themeJsonToEditorSettings()` maps the data into the shape `BlockEditorProvider` expects, so the block editor UI (color pickers, font selectors) reflects the current theme tokens.

3. **Theme export** — `generateThemeJsonFile()` produces a valid WordPress `theme.json` v3 file with the full schema.

The AI has an `update_theme_json` tool that deep-merges partial updates:

```json
{
  "settings": {
    "color": {
      "palette": [{ "slug": "primary", "color": "#e63946", "name": "Primary" }]
    }
  }
}
```

And the system prompt instructs the AI: "In your block markup, use WordPress preset classes (`has-primary-color`, `has-heading-font-family`) instead of hardcoded values." This means content and design stay decoupled — changing a palette color instantly updates every block that references it.

**What this means for Studio:** Studio already has `SiteTheme` with design tokens (colors, fonts, spacing), but the connection between tokens and rendered content is loose — Kit generates CSS with hardcoded values. Andrei's approach creates a tighter loop: tokens live in theme.json format, content references tokens by slug, and CSS is mechanically generated from the token definitions. If Studio adopted this pattern, changing a brand color would propagate everywhere without the AI needing to find-and-replace hex values in generated HTML/CSS. It also means the theme data is always in a shape that WordPress understands natively.

---

## 3. Block Markup Normalization

AI-generated Gutenberg block markup is unreliable — wrong nesting, invalid attributes, malformed HTML. The app runs a fix pipeline:

1. `fixNestedParagraphs()` — fixes `<p>` inside `<p>` (common AI mistake)
2. `parse()` from `@wordpress/blocks` — converts markup to block objects
3. `createBlock()` for each block — recreates it through WordPress's own block API, which runs the block's `save()` function and produces canonical output
4. `serialize()` — back to HTML

This guarantees the markup is exactly what WordPress would produce, regardless of what the AI wrote.

**What this means for Studio:** If Studio ever renders real Gutenberg block markup (rather than generic HTML), this parse-recreate-serialize pipeline is essential. It turns the AI's approximate output into valid WordPress output. Even without full block rendering, the principle applies: don't trust AI markup directly, run it through a normalization layer that enforces the target system's rules.

---

## 4. Template Part Resolution

Templates can reference template-parts by slug:

```html
<!-- wp:template-part {"slug":"header"} /-->
<!-- wp:group -->
  <!-- page content -->
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer"} /-->
```

For **live preview**, `resolveTemplateParts()` regex-matches these references and inlines the matching artboard's `blockContent`. For **export**, references stay as-is — WordPress resolves them at runtime.

**What this means for Studio:** This is a clean pattern for composable sites. A header is defined once and referenced everywhere. Studio could adopt something similar — define reusable sections (header, footer, sidebar) that templates reference by slug, with inlining only for preview rendering.

---

## 5. Selective Theme Export

The "Collect to Theme" flow:

1. Modal shows all artboards grouped by type (template-parts, templates, patterns) with checkboxes
2. User selects which pieces to include and names the theme
3. `buildThemeFiles()` generates the file tree:

| Path | Content |
|------|---------|
| `style.css` | Theme header comment |
| `theme.json` | Generated from live ThemeJson |
| `templates/{slug}.html` | Block markup from template artboards |
| `parts/{slug}.html` | Block markup from template-part artboards |
| `patterns/{slug}.php` | Block markup wrapped in PHP header |
| `functions.php` | Minimal bootstrap |

4. JSZip packages everything into `{theme-slug}.zip` for download

**What this means for Studio:** Studio's export story could work similarly. The key insight is that if data is stored in WordPress-native shapes from the start (block markup + theme.json), export is trivial — it's just file assembly, not transformation. No build step, no compilation, no conversion. The selective export (checkboxes per piece) is also a nice UX — users might want to export just a header pattern they liked, not an entire theme.

---

## 6. What gutenberg-canvas Doesn't Have

Things Studio already does better or has that this project lacks entirely:

- **No persistence** — refresh the page and everything is gone. Studio has IndexedDB via Dexie.
- **No revision history** — Studio tracks revisions per AI turn with full snapshots.
- **No multi-site** — one canvas, one theme. Studio manages multiple sites.
- **No real preview** — artboards render through `BlockEditorProvider` which is an approximation. Studio renders in an actual browser frame.
- **No collaboration or sync** — purely local, single-user.
- **No iterative refinement** — the AI creates and updates, but there's no concept of "undo this change" or "go back to that version."

The project is more "design tool that outputs a WordPress artifact" than "WordPress site management." But the data modeling — artboard types mirroring theme file types, theme.json as live design system, preset classes for token-content decoupling — those patterns are solid foundations Studio could build on.

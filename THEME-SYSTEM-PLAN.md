# Theme System Plan

Mock sites currently use hardcoded inline styles. This plan introduces a `theme.json` per project that defines design tokens — colors, typography, spacing — which the mock site templates consume as CSS custom properties. The AI can then modify `theme.json` and the preview updates live.

This mirrors how WordPress block themes work: `theme.json` is the source of truth, and everything else derives from it.

---

## theme.json Schema

Each project gets a `theme.json`-like object. Not a full WordPress theme.json — a simplified subset covering what the mock sites actually use.

```ts
interface SiteTheme {
  name: string
  settings: {
    color: {
      palette: { slug: string; name: string; hex: string }[]
      background: string   // hex
      text: string         // hex
    }
    typography: {
      fontFamily: {
        heading: string    // CSS font-family value
        body: string       // CSS font-family value
      }
      fontSize: {
        small: string      // e.g. "14px"
        medium: string     // e.g. "16px"
        large: string      // e.g. "20px"
        xlarge: string     // e.g. "32px"
        hero: string       // e.g. "48px"
      }
      lineHeight: {
        tight: string      // e.g. "1.2"
        normal: string     // e.g. "1.6"
      }
    }
    spacing: {
      unit: string         // e.g. "8px"
      scale: number[]      // multipliers, e.g. [1, 2, 3, 4, 6, 8]
    }
    layout: {
      contentWidth: string  // e.g. "720px"
      wideWidth: string     // e.g. "1100px"
    }
  }
}
```

### Example: Downstreet Cafe

```json
{
  "name": "Downstreet Cafe",
  "settings": {
    "color": {
      "palette": [
        { "slug": "primary", "name": "Terracotta", "hex": "#C2703E" },
        { "slug": "secondary", "name": "Sage", "hex": "#A8B5A0" },
        { "slug": "accent", "name": "Espresso", "hex": "#3B2314" },
        { "slug": "surface", "name": "Cream", "hex": "#FFF8F0" }
      ],
      "background": "#FFF8F0",
      "text": "#3B2314"
    },
    "typography": {
      "fontFamily": {
        "heading": "Georgia, 'Times New Roman', serif",
        "body": "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      },
      "fontSize": {
        "small": "14px",
        "medium": "16px",
        "large": "20px",
        "xlarge": "32px",
        "hero": "48px"
      },
      "lineHeight": {
        "tight": "1.2",
        "normal": "1.6"
      }
    },
    "spacing": {
      "unit": "8px",
      "scale": [1, 2, 3, 4, 6, 8]
    },
    "layout": {
      "contentWidth": "720px",
      "wideWidth": "1100px"
    }
  }
}
```

---

## CSS Custom Property Generation

A function converts `SiteTheme` → a CSS string of custom properties:

```ts
function themeToCSS(theme: SiteTheme): string {
  const vars: string[] = []

  // Colors
  vars.push(`--color-background: ${theme.settings.color.background}`)
  vars.push(`--color-text: ${theme.settings.color.text}`)
  for (const color of theme.settings.color.palette) {
    vars.push(`--color-${color.slug}: ${color.hex}`)
  }

  // Typography
  vars.push(`--font-heading: ${theme.settings.typography.fontFamily.heading}`)
  vars.push(`--font-body: ${theme.settings.typography.fontFamily.body}`)
  for (const [key, value] of Object.entries(theme.settings.typography.fontSize)) {
    vars.push(`--font-size-${key}: ${value}`)
  }
  for (const [key, value] of Object.entries(theme.settings.typography.lineHeight)) {
    vars.push(`--line-height-${key}: ${value}`)
  }

  // Spacing
  for (const multiplier of theme.settings.spacing.scale) {
    vars.push(`--space-${multiplier}: calc(${theme.settings.spacing.unit} * ${multiplier})`)
  }

  // Layout
  vars.push(`--content-width: ${theme.settings.layout.contentWidth}`)
  vars.push(`--wide-width: ${theme.settings.layout.wideWidth}`)

  return `:root {\n  ${vars.join(';\n  ')};\n}`
}
```

---

## Mock Site Template Refactor

Current mock sites use hardcoded values:
```css
.hero { background: #C2703E; color: #FFF8F0; }
h1 { font-family: Georgia, serif; font-size: 48px; }
```

Refactored to consume CSS variables:
```css
.hero { background: var(--color-primary); color: var(--color-surface); }
h1 { font-family: var(--font-heading); font-size: var(--font-size-hero); }
```

The mock site HTML no longer contains any color, font, or spacing values directly. All visual properties come from custom properties defined by the theme.

### Template Structure

Each mock site becomes a function instead of a static string:

```ts
// Before
export const homepage = `<!DOCTYPE html>...`

// After
export function homepage(themeCSS: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <style>${themeCSS}</style>
  <style>
    /* Template styles using only var() references */
    .hero { background: var(--color-primary); }
  </style>
</head>
<body>...</body>
</html>`
}
```

The theme CSS is injected as a separate `<style>` block before the template styles. This means you can swap themes by regenerating just that first block.

---

## Reactive State

Each project holds a reactive `SiteTheme` object:

```ts
// src/data/useSiteThemes.ts
const themes = ref<Record<string, SiteTheme>>({
  'downstreet-cafe': downstreetCafeTheme,
  'shauns-blog': shaunsBlogTheme,
  'ui-portfolio': uiPortfolioTheme,
  'flavor-records': flavorRecordsTheme,
})

function updateTheme(projectId: string, patch: Partial<SiteTheme['settings']>) { ... }
function updateColors(projectId: string, palette: SiteTheme['settings']['color']) { ... }
```

SitePreview computes the srcdoc from the current theme + template:

```ts
const srcdoc = computed(() => {
  const theme = themes.value[props.projectId]
  const site = mockSites[props.projectId]
  if (!theme || !site) return undefined
  return site.homepage(themeToCSS(theme))
})
```

When the theme changes, the computed re-evaluates, and the iframe re-renders.

---

## AI Integration

The AI system prompt gets updated to know about `theme.json`. When the AI wants to change the site's appearance, it returns a theme update card:

```
```card:themeUpdate
{
  "changes": {
    "color": {
      "palette": [
        { "slug": "primary", "name": "Marine", "hex": "#4D6FA3" },
        { "slug": "surface", "name": "Cloud", "hex": "#F2F6FB" }
      ],
      "background": "#F2F6FB",
      "text": "#2F3A4A"
    }
  }
}
```​
```

This gets parsed into a `themeUpdate` card type that shows a before/after comparison and an "Apply" action. Clicking Apply calls `updateTheme()` which updates the reactive state, which re-renders the preview.

### New Card Type: ThemeUpdateCard

```ts
interface ThemeUpdateCardData {
  label: string
  changes: Partial<SiteTheme['settings']>
  preview?: { before: Record<string, string>; after: Record<string, string> }
}
```

This could replace or augment the existing ColorPalette card — or ColorPalette could become a convenience wrapper that generates a theme update under the hood.

---

## Implementation Order

1. **Define the SiteTheme type and create theme objects for all 4 projects** — extract current hardcoded values into structured data
2. **Build `themeToCSS()` converter** — pure function, easy to test
3. **Refactor mock site templates** — replace hardcoded values with `var()` references, change exports from strings to functions
4. **Create `useSiteThemes` composable** — reactive state, update methods
5. **Wire SitePreview** — compute srcdoc from theme + template
6. **Verify** — all 4 sites render identically to before (visual regression check)
7. **Add ThemeUpdateCard** — new card type for the AI to return
8. **Update AI system prompt** — document theme.json schema and themeUpdate card
9. **Wire action** — clicking "Apply" on a ThemeUpdateCard calls updateTheme, preview updates

Steps 1-6 are the foundation (no AI changes, just refactoring to a token-based system). Steps 7-9 add the AI loop. The refactor should produce visually identical results — if the sites look different after step 6, something's wrong.

---

## What This Enables

- **AI changes colors → preview updates instantly** — the demo moment
- **AI changes fonts → preview updates** — same mechanism
- **AI changes spacing/layout → preview updates** — same mechanism
- **Multiple theme variations** — save/restore themes, A/B comparison
- **Undo via theme snapshots** — store previous theme state, restore on demand

## What This Doesn't Cover

- Dynamic page creation (still requires HTML template changes)
- Plugin/block rendering in preview
- Navigation changes
- Content changes (post titles, text, images)

Those remain hard problems that need different solutions. This plan focuses purely on the visual theming layer.

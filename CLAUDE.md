# CLAUDE.md — Studio v2

## What is this

Interactive prototype for Studio's AI interface concepts. Vue 3 + Vite + TypeScript.

## Dev server

```bash
npm run dev  # http://localhost:3025
```

## Design system rules

Read `DESIGN-SYSTEM.md` before touching any component. Key rules:

- **Spacing:** 4px grid only. Use `--space-xxxs` through `--space-xxxl`. No magic numbers.
- **Radius:** `--radius-s`, `--radius-m`, `--radius-l`. No custom values.
- **Colors:** All from CSS variables in `src/styles/colors.css`. No hardcoded hex/rgb.
- **Icons:** `@wordpress/icons` via `WPIcon` component. No inline SVGs.
- **Directions:** Use logical properties (`start`/`end`, `block`/`inline`) not physical (`left`/`right`, `top`/`bottom`). Exception: physical directions for app chrome edges (documented with comments).
- **Dark mode:** Supported via `prefers-color-scheme`. All page styles must use token variables, never hardcode light-only colors.

## Structure

```
src/
  styles/            # CSS tokens (colors, space, radius, typography, layout, motion) + overrides
  components/
    primitives/      # Badge, Button, ButtonSplit, ContextMenu, ContextRing, Dropdown, FlyoutMenu, Modal, StatusIndicator, Text, TextInput, Toggle, Tooltip, WPIcon
    composites/      # ChatMessage, ChatMessageList, GlobalMenu, InputChat, ScreenHeader, ScreenLayout, SettingsPage, ShortcutsModal, SiteItem, SiteToolbar, chat-cards/, renderers/
    features/        # SiteNavigation, SiteList, SiteSettingsScreen, SyncScreen, PreviewsScreen, ImportExportScreen, add-site/, sync/
  layouts/           # MainLayout (app shell), BareLayout (standalone pages)
  pages/             # SitePage, AddSitePage, DesignSystem, Components, Settings, Architecture
  data/              # State composables, AI service, seed data, types, site-types, site-renderer, useSiteTransition
  router.ts
```

## Key components

- **Button** — `variant` (primary/secondary/tertiary), `surface` (light/dark), `size` (default/small), `width` (hug/full), `icon`, `label`, `tooltip`, `disabled`
- **Tooltip** — `text`, `placement` (top/bottom/left/right), `delay` (ms, default 600). Smart viewport flipping. Warm state skips delay between consecutive tooltips. Note: wraps content in `span.tooltip-trigger` with `inline-flex` — override to `flex` if parent needs it to fill width.
- **WPIcon** — Vue wrapper for `@wordpress/icons`. Props: `icon`, `size`
- **StatusIndicator** — `status` (stopped/loading/running). Emits `toggle`. Clip-path morph animation on hover.
- **Titlebar** — App titlebar with traffic lights, sidebar toggle, greeting, settings/help
- **ContextMenu** — `groups` (FlyoutMenuGroup[]), `surface` (light/dark). Wraps slot content with right-click menu at cursor position. Reuses FlyoutMenu CSS classes. Singleton (one open at a time). Supports submenus.
- **InputChat** — Chat input with model selector and action strip. Three action rendering modes: brief cards, card actions, text buttons.

## View transitions (home <> site)

Navigation between home and site uses the View Transitions API via `useSiteTransition.ts`. Site-to-site navigation skips transitions.

## Collapsible sidebar

210px sidebar collapses to 50px icon rail. `useSidebarCollapse()` composable with localStorage persistence. `Cmd+B` toggle.

## AI site editing

Kit (AI assistant) proposes changes via cards, user confirms via input actions, changes apply to site preview live.

## Deployment (Vercel)

```bash
npm run deploy  # vercel --prod
```

## Don't

- Don't rewrite entire files when Shaun has made edits. Surgical edits only.
- Don't use `left`/`right`/`top`/`bottom` in CSS. Use `start`/`end`/`block-start`/`block-end`.
- Don't add spacing values that aren't in the 4px grid system.
- Don't hardcode colors — add to the system first.

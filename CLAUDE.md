# CLAUDE.md — Studio v2

## What is this

Interactive prototype for Studio's AI interface concepts. Vue 3 + Vite + TypeScript.

## Shared components (`src/shared/`)

Shared design tokens, primitives, composites, and data utilities live in `src/shared/`. They're imported via the `@shared` Vite alias.

**Imports:** `import Text from '@shared/primitives/Text.vue'`, `import { type Site } from '@shared/data/site-types'`, etc.

## Dev server

```bash
npm run dev  # http://localhost:3025
```

## Design system rules

Read `DESIGN-SYSTEM.md` before touching any component. Key rules:

- **Spacing:** 5px grid only. Use `--space-xxxs` through `--space-xxxl`. No magic numbers.
- **Radius:** `--radius-s`, `--radius-m`, `--radius-l`. No custom values.
- **Colors:** All from CSS variables in `src/shared/styles/colors.css`. No hardcoded hex/rgb.
- **Icons:** `@wordpress/icons` via `WPIcon` component. No inline SVGs.
- **Directions:** Use logical properties (`start`/`end`, `block`/`inline`) not physical (`left`/`right`, `top`/`bottom`). Exception: physical directions for app chrome edges (documented with comments).
- **Dark mode:** Supported via `prefers-color-scheme`. All page styles must use token variables, never hardcode light-only colors.

## Structure

```
src/
  shared/            # Design tokens, shared primitives, composites, data
    styles/          # CSS tokens (colors, space, radius, typography, layout, motion)
    primitives/      # Avatar, Badge, Modal, StatusIndicator, Text, Tooltip, WPIcon
    composites/      # AllChatsModal, ChatMessageList, Panel, chat-cards/, renderers/
    data/            # site-types, site-renderer, useProjectTransition
  styles/            # Local CSS overrides (motion-overrides, radius-overrides)
  components/
    primitives/      # Button, ContextRing, Dropdown, FlyoutMenu, Titlebar, etc.
    composites/      # ChatMessage, InputChat, ProjectItem, TabBar, Panel, chat-cards/
    features/        # ProjectList, AgentPanel, SyncScreen, PreviewsScreen, add-site/
  layouts/           # MainLayout (app shell), BareLayout (standalone pages)
  pages/             # ProjectPage, DesignSystem, Components, Settings, Architecture
  data/              # State composables, AI service, seed data, types
  router.ts
```

## Key components

- **Button** — `variant` (primary/secondary/tertiary), `surface` (light/dark), `size` (default/small), `width` (hug/full), `icon`, `label`, `tooltip`, `disabled`
- **Tooltip** — `text`, `placement` (top/bottom/left/right), `delay` (ms, default 600). Smart viewport flipping. Warm state skips delay between consecutive tooltips. Note: wraps content in `span.tooltip-trigger` with `inline-flex` — override to `flex` if parent needs it to fill width.
- **WPIcon** — Vue wrapper for `@wordpress/icons`. Props: `icon`, `size`
- **StatusIndicator** — `status` (stopped/loading/running). Emits `toggle`. Clip-path morph animation on hover.
- **Titlebar** — App titlebar with traffic lights, sidebar toggle, greeting, settings/help
- **InputChat** — Chat input with model selector and action strip. Three action rendering modes: brief cards, card actions, text buttons.

## View transitions (home <> project)

Navigation between home and project uses the View Transitions API via `useProjectTransition.ts`. Project-to-project navigation skips transitions.

## Collapsible sidebar

210px sidebar collapses to 50px icon rail. `useSidebarCollapse()` composable with localStorage persistence. `Cmd+B` toggle.

## AI site editing

Kit (AI assistant) proposes changes via cards, user confirms via input actions, changes apply to site preview live.

## Deployment (Vercel)

```bash
npm run deploy  # vercel --prod
```

`@shared` alias points to `src/shared/` — everything is self-contained, no copy tricks needed.

## Don't

- Don't rewrite entire files when Shaun has made edits. Surgical edits only.
- Don't use `left`/`right`/`top`/`bottom` in CSS. Use `start`/`end`/`block-start`/`block-end`.
- Don't add spacing values that aren't in the 5px grid system.
- Don't hardcode colors — add to the system first.

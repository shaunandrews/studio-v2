# Studio v2

Interactive prototype for Studio's AI interface concepts. Built with Vue 3, TypeScript, and Vite.

This is a design prototype — not a production app. It explores AI-assisted site management workflows, chat-driven editing, and multi-agent panel interfaces for WordPress Studio.

## Getting started

```bash
npm install
npm run dev
```

Dev server runs at [http://localhost:3025](http://localhost:3025).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Deploy to Vercel |

## Stack

- **Vue 3** with `<script setup>` SFCs
- **TypeScript**
- **Vite** for dev/build
- **vue-router** for page routing
- **@wordpress/icons** for iconography
- **@anthropic-ai/sdk** for AI chat features

## Project structure

```
src/
  styles/          CSS tokens (colors, spacing, radius, typography, motion, layout)
  components/
    primitives/    Low-level UI (Button, Tooltip, Modal, Dropdown, etc.)
    composites/    Assembled components (ChatMessage, InputChat, TabBar, etc.)
    features/      Full feature panels (ProjectList, AgentPanel, SyncScreen, etc.)
  layouts/         App shells (MainLayout, BareLayout)
  pages/           Route-level views
  data/            State composables, seed data, types
  router.ts        Route definitions
```

## Design system

See [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) for the full token reference, component docs, and usage rules.

Key constraints: 5px spacing grid, CSS variable tokens for all colors, `@wordpress/icons` only, logical CSS properties (`start`/`end` not `left`/`right`).

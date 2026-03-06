# Help System Design

## Overview

Wire up the existing help button (`?` icon in the titlebar) with a three-layer help system: guided tour, keyboard shortcuts reference, and external support links.

## Help Dropdown Menu

Clicking the help button opens a dropdown menu (same `Dropdown`/`FlyoutMenu` pattern as the Settings button). Two groups separated by a divider:

```
┌──────────────────────────┐
│  Take a Tour             │
│  Keyboard Shortcuts   ⌘/ │
├──────────────────────────┤
│  Help                 ↗  │
│  Community            ↗  │
│  Report a Bug         ↗  │
└──────────────────────────┘
```

- **Take a Tour** — launches the spotlight guided tour
- **Keyboard Shortcuts** — opens the shortcuts modal (also triggered by `⌘/`)
- **Help** — external link (placeholder URL)
- **Community** — external link (placeholder URL)
- **Report a Bug** — external link (placeholder URL)

External links indicated by an external-link icon (`↗`). Shortcut hint shown right-aligned for Keyboard Shortcuts.

## Spotlight Guided Tour

A step-by-step interactive walkthrough that highlights key UI elements with a spotlight cutout overlay.

### Prerequisites

The tour requires a project to be open (project view). If triggered from the home view, navigate to a seed project first.

### Tour Steps

| # | Target Element | Title | Description |
|---|---------------|-------|-------------|
| 1 | Sidebar / Project List | Your projects | Your projects live here. Click to switch between them. |
| 2 | Chat area | Chat with Kit | Chat with Kit to build and customize your site. Ask anything. |
| 3 | Input area + action strip | Type or tap | Type here or use the numbered shortcuts. Kit suggests actions as you go. |
| 4 | Site Preview | Live preview | Live preview of your site. Changes appear here in real time. |
| 5 | Skills icon (puzzle piece) | Skills | Enable skills to give Kit new abilities — SEO, security, design, and more. |
| 6 | Model selector | AI model | Choose which AI model powers Kit. Different models, different strengths. |

### Spotlight Mechanics

- **Overlay:** `position: fixed` full-screen element with semi-transparent dark backdrop (`rgba(0,0,0,0.6)`)
- **Cutout:** CSS `clip-path` (polygon with inset rectangle) to reveal the target element. Rounded corners matching `--radius-m`, padding `--space-xs` around the target bounding rect
- **Target detection:** Each step specifies a CSS selector or `data-tour` attribute. `getBoundingClientRect()` positions the cutout. `ResizeObserver` updates on layout changes
- **Tooltip card:** Floating card anchored to the cutout edge (auto-positioned above/below/left/right based on available space):
  - Step title (bold)
  - Description (1-2 sentences)
  - Step indicator: "2 of 6" (muted text)
  - Buttons: **Back** (tertiary) | **Next** (primary). Last step shows **Done** instead of Next
  - **Skip tour** text link below buttons
- **Transitions:** Cutout position/size animates between steps (CSS transition on clip-path). Tooltip fades and repositions
- **Keyboard:** Right arrow / Enter = next, Left arrow = back, Escape = skip
- **Click overlay:** Clicking the dimmed area skips the tour (ends immediately, no confirmation)

### Component Structure

- `SpotlightTour.vue` — the overlay + cutout + tooltip, teleported to `<body>`
- `useTour.ts` — composable managing tour state (current step, start/stop/next/back), step definitions, target element resolution

## Keyboard Shortcuts Modal

A centered modal listing all working keyboard shortcuts.

### Layout

```
┌─────────────────────────────────────────────┐
│  Keyboard Shortcuts                      ✕  │
├─────────────────────────────────────────────┤
│                                             │
│  Chat                                       │
│  ────────────────────────────────────────    │
│  Send message                ↵              │
│  New line                    ⇧ ↵            │
│  Quick actions               1 – 9          │
│  Slash command               /              │
│  New chat                    ⌘ ⇧ K         │
│                                             │
│  Navigation                                 │
│  ────────────────────────────────────────    │
│  Keyboard shortcuts          ⌘ /            │
│                                             │
└─────────────────────────────────────────────┘
```

### Mechanics

- **Trigger:** `⌘/` globally, or via the help dropdown menu item
- **Component:** `ShortcutsModal.vue` — uses a generic `Modal.vue` primitive (overlay + centered card + close button + Escape to dismiss)
- **Key display:** `<kbd>` elements styled with subtle border/background, matching the app's dark surface aesthetic
- **Categories:** Section headers with separator lines. Only categories that have shortcuts are shown
- **Only real shortcuts:** Every shortcut listed must actually function in the prototype. No aspirational items

### Modal Primitive

If `Modal.vue` doesn't already exist as a general-purpose modal, create one:
- Fixed overlay with centered content card
- Close button (top-right `✕`)
- Escape to dismiss
- Click-outside to dismiss
- Focus trap (tab cycles within modal)
- Teleported to `<body>`

Note: A `Modal.vue` primitive already exists in the codebase.

## New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SpotlightTour.vue` | `components/composites/` | Tour overlay with cutout, tooltip, and step controls |
| `ShortcutsModal.vue` | `components/composites/` | Keyboard shortcuts reference modal |
| `useTour.ts` | `data/` | Tour state management composable |

## Modified Components

| Component | Change |
|-----------|--------|
| `Titlebar.vue` | Replace static help Button with Dropdown, wire tour + modal triggers |
| `MainLayout.vue` | Mount `SpotlightTour` and `ShortcutsModal` (app-level, teleported) |

## Data Attributes

Add `data-tour="step-id"` attributes to target elements for reliable tour targeting:
- Sidebar container → `data-tour="sidebar"`
- Chat message area → `data-tour="chat"`
- Input area → `data-tour="input"`
- Site preview → `data-tour="preview"`
- Skills button → `data-tour="skills"`
- Model selector → `data-tour="model"`

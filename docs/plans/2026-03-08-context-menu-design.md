# Context Menu Design

## Overview

Reusable right-click context menu primitive that positions a FlyoutMenu at the cursor. Designed for use throughout the app — site items, chat messages, file lists, etc.

## ContextMenu Primitive

### API

```vue
<ContextMenu :groups="menuGroups" surface="dark">
  <SiteItem :site="site" />
</ContextMenu>
```

**Props:**
- `groups` — `FlyoutMenuGroup[]` (reuses existing FlyoutMenu types)
- `surface` — `'light' | 'dark'` (passed through to FlyoutMenu)

**Slot:** Default slot wraps the right-click target.

### Behavior

- `@contextmenu.prevent` on wrapper captures right-click
- Stores click `{ x, y }` coordinates
- Creates invisible anchor at those coordinates (fixed-position, zero-size element)
- Opens FlyoutMenu positioned relative to that anchor
- Click-outside and Escape close (handled by FlyoutMenu/Popover)
- Submenus supported (FlyoutMenu handles them)
- Only one context menu open at a time — opening a new one closes any existing one

### Implementation

Teleported, fixed-position approach:
1. Renders slot content normally
2. On right-click, teleports FlyoutMenu to `<body>` at cursor position
3. Manages open/close state
4. Decoupled from Popover's anchor logic

## First Consumer: SiteItem

SiteNavigation wraps each SiteItem in ContextMenu with these groups:

```
── Open in Browser
── Copy Site URL
─────────────
── Open in Finder
── Open in VS Code
── Open in Terminal
─────────────
── Start / Stop
── Site Settings
── Duplicate Site
─────────────
── Delete Site          (destructive)
```

Four groups separated by dividers. Dynamic Start/Stop label based on site state. Delete flagged as `destructive`.

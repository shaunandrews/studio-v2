# Collapsible Sidebar Design

## Goal

Allow users to collapse the project sidebar to an icon rail, giving more horizontal space to the chat + preview frame.

## State

New singleton composable `useSidebarCollapse()`:

- `collapsed: Ref<boolean>` — persisted to `localStorage` key `sidebar-collapsed`
- `toggle()`, `collapse()`, `expand()`

Collapse only applies in project mode. Home mode (grid view) is unaffected.

## Dimensions

| State | Sidebar width | Content |
|-------|--------------|---------|
| Expanded | `210px` | Back chevron + label, project rows (favicon + name + status), "New project" button |
| Collapsed | `50px` | Back chevron only, favicons (28px, centered), "+" icon button |

Both widths on the 5px grid (50px = 10 units). CSS classes `is-sidebar` + `is-collapsed` on the left column drive both sidebar width and frame offset via `:has()`.

## Collapse toggle

A `chevronLeft` icon button at the inline-end of the "All projects" back row. Always visible (not hover-gated). Regular flex child with `flex-shrink: 0`, not absolutely positioned.

When collapsed, clicking the back-chevron area expands the sidebar (not go home — home is reachable via titlebar breadcrumb).

## Collapsed state

- **Back button:** `chevronLeft` icon only, centered. Click expands sidebar.
- **Project items:** Favicon (28px) centered. Active item gets `--color-chrome-active` background. Tooltip on hover shows project name (via Tooltip wrapper on ProjectItem).
- **New project:** `+` icon-only Button (35px square, secondary/dark) replacing the full-width text button.
- **Status indicator:** Hidden when collapsed (too cramped at this density).
- **Text/name/url:** Conditionally hidden via `v-if="!collapsed"`.

## Tooltip wrapper gotcha

Tooltip wraps ProjectItem in a `span.tooltip-trigger` with `inline-flex`, which breaks width constraints in the sidebar. ProjectList overrides this with `.items-stack :deep(.tooltip-trigger) { display: flex; }`.

## Animation

CSS transition on sidebar width:

```css
transition: width var(--duration-slow) cubic-bezier(0.4, 0, 0.2, 1);
```

Text labels transition `opacity` with `--duration-fast`. Favicons reposition via flex alignment change. Frame's `left` calc references `--sidebar-w` and transitions automatically.

## Keyboard shortcut

`Cmd+B` (standard sidebar toggle) — wired in MainLayout's global keydown handler.

## Files touched

1. **New:** `src/data/useSidebarCollapse.ts` — singleton composable
2. **Edit:** `src/layouts/MainLayout.vue` — CSS variable, collapsed class, Cmd+B handler
3. **Edit:** `src/components/features/ProjectList.vue` — collapsed prop, icon-only mode
4. **Edit:** `src/components/composites/ProjectItem.vue` — collapsed prop, favicon-only mode with tooltip

## Not changing

- Home mode grid view
- View transitions (home ↔ project)
- Titlebar (no toggle there)

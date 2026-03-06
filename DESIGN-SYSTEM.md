# Design System Rules

## Spacing

- **All spacing uses the 5px grid.** Use `--space-xxxs` through `--space-xxxl` exclusively.
- **No magic numbers.** No `padding: 12px` or `gap: 7px`. If it's not on the grid, it doesn't ship.
- **Exception:** Only with explicit logic and permission (e.g., optical alignment, icon sizing, border widths). Document the reason in a comment.

### Scale

| Token          | Value |
|----------------|-------|
| `--space-xxxs` | 5px   |
| `--space-xxs`  | 10px  |
| `--space-xs`   | 15px  |
| `--space-s`    | 20px  |
| `--space-m`    | 25px  |
| `--space-l`    | 30px  |
| `--space-xl`   | 40px  |
| `--space-xxl`  | 50px  |
| `--space-xxxl` | 60px  |

## Border Radius

- **Use `--radius-s`, `--radius-m`, or `--radius-l`** from `styles/radius.css`.
- **Exception:** `border-radius: 50%` for circles (avatars, status dots) is fine.

## Motion

All transition timing flows through tokens in `styles/motion.css`. No raw duration or easing values in component styles.

### Durations

| Token | Value | Use for |
|-------|-------|---------|
| `--duration-instant` | 100ms | Near-instant feedback, micro hover states |
| `--duration-fast` | 150ms | Hover, focus, button states |
| `--duration-moderate` | 200ms | Resize, status changes, fade |
| `--duration-slow` | 300ms | Layout transitions, panel morph, frame slide |

### Easing

| Token | Value | Use for |
|-------|-------|---------|
| `--ease-default` | ease | General purpose |
| `--ease-in-out` | ease-in-out | Symmetrical transitions |
| `--ease-out` | ease-out | Elements entering/appearing |
| `--ease-in` | ease-in | Elements leaving/disappearing |

### Composed Shortcuts

Pre-composed `duration + easing` pairs. Use after the property name in `transition` shorthand:

| Token | Expands to | Use for |
|-------|-----------|---------|
| `--transition-hover` | 150ms ease | Hover & active states |
| `--transition-focus` | 150ms ease | Focus rings, input borders |
| `--transition-fade` | 200ms ease | Opacity, resize, status |
| `--transition-layout` | 300ms ease | Panel morph, frame slide |

### Usage

```css
/* Property + composed shortcut */
transition: background var(--transition-hover), color var(--transition-hover);

/* Property + individual tokens */
transition: opacity var(--duration-instant) var(--ease-default);
```

## Colors

- **All colors use CSS variables** from `styles/colors.css`.
- **No hex/rgb values in components.** If you need a new color, add it to the system first.
- **Status colors are distinct from traffic light colors.** Running green (`#4ab866`) ≠ maximize green (`#28c840`). Stop-hover red (`#e65054`) ≠ close red (`#ff5f57`).

## Icons

- **Use `@wordpress/icons`** via the `WPIcon` component.
- **No inline SVGs** unless the icon doesn't exist in the WP set.

---

## Utility Classes

All utilities are global (unscoped) and imported via `style.css`. Use them on elements directly. Keep component-specific styles (colors, borders, transitions, etc.) in scoped `<style>`.

### Layout (`styles/layout.css`)

#### Stacks

| Class    | Effect                                           |
|----------|--------------------------------------------------|
| `.hstack` | `display: flex; align-items: center`             |
| `.vstack` | `display: flex; flex-direction: column`          |

#### Gap

Maps directly to space tokens:

`.gap-xxxs` · `.gap-xxs` · `.gap-xs` · `.gap-s` · `.gap-m` · `.gap-l` · `.gap-xl` · `.gap-xxl` · `.gap-xxxl`

#### Justify

`.justify-start` · `.justify-center` · `.justify-end` · `.justify-between`

#### Align

`.align-start` · `.align-center` · `.align-end` · `.align-stretch`

**Note:** `.hstack` defaults to `align-items: center`. Use `.align-stretch` when children should fill the cross axis (e.g., `app-body` needing full-height sidebar and frame).

#### Flex Sizing

| Class      | Effect             |
|------------|--------------------|
| `.flex-1`   | `flex: 1`          |
| `.flex-none` | `flex: none`       |
| `.shrink-0`  | `flex-shrink: 0`   |
| `.min-w-0`   | `min-width: 0`     |

#### Wrap

`.flex-wrap` · `.flex-nowrap`

#### Overflow

`.overflow-hidden` · `.overflow-auto`

#### Dimensions

`.w-full` · `.h-full`

### Spacing (`styles/spacing.css`)

Padding and margin utilities mapped to space tokens. Naming convention:

- **Direction prefix:** `p` (padding), `m` (margin)
- **Axis modifier:** `x` (inline), `y` (block), `t` (block-start), `b` (block-end), `s` (inline-start), `e` (inline-end)
- **Size suffix:** token name (`xxxs` through `xxxl`)

#### Padding

| Pattern | Example | Effect |
|---------|---------|--------|
| `.p-{size}` | `.p-xs` | `padding: var(--space-xs)` |
| `.px-{size}` | `.px-xxs` | `padding-inline: var(--space-xxs)` |
| `.py-{size}` | `.py-xxxs` | `padding-block: var(--space-xxxs)` |
| `.pt-{size}` | `.pt-xxs` | `padding-block-start: var(--space-xxs)` |
| `.pb-{size}` | `.pb-xs` | `padding-block-end: var(--space-xs)` |
| `.ps-{size}` | `.ps-s` | `padding-inline-start: var(--space-s)` |
| `.pe-{size}` | `.pe-xxs` | `padding-inline-end: var(--space-xxs)` |

All sizes from `0` through `xxxl` (uniform), `xxxs` through `xl` (axis), `xxxs` through `s` (individual sides).

#### Margin

Same pattern as padding: `.m-{size}`, `.mx-{size}`, `.my-{size}`, `.mt-{size}`, `.mb-{size}`, `.me-{size}`

Plus `.mx-auto` for centering.

Margin utilities cover `0` through `s` (uniform), `xxxs` through `xs` (axis/sides).

### Usage Pattern

Combine utility classes on the element, keep visual styles in scoped CSS:

```html
<div class="sidebar vstack shrink-0">
<div class="app-body hstack align-stretch gap-xs flex-1 min-w-0 p-xs">
<div class="project-list-item hstack gap-xs p-xs">
<div class="input-chat p-xxs">
<button class="dropdown-trigger hstack gap-xxxs px-xxs py-xxxs">
```

### What stays in scoped CSS

- **Button padding** — variant-dependent (`0 var(--space-s)` vs `0`) doesn't map to utilities
- **Asymmetric padding** like Titlebar's `0 xs 0 s` — no clean utility match
- **Contextual spacing** like `.dropdown-group + .dropdown-group` separator margin/padding
- **Anything with transitions, colors, borders, shadows, cursor, etc.**

---

## Typography

All typography values flow through tokens in `styles/typography.css`. No raw `font-size`, `font-weight`, `font-family`, or `line-height` values in component styles.

### Font Stacks

| Token | Value |
|-------|-------|
| `--font-family` | -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif |
| `--font-family-mono` | 'SF Mono', 'Fira Code', monospace |

### Font Sizes

| Token | Value | Use for |
|-------|-------|---------|
| `--font-size-xs` | 11px | Labels, shortcut hints |
| `--font-size-s` | 12px | Captions, small controls |
| `--font-size-m` | 13px | Default UI text, buttons |
| `--font-size-l` | 14px | Body text, inputs |
| `--font-size-xl` | 16px | Body-large, chat messages |

### Font Weights

| Token | Value |
|-------|-------|
| `--font-weight-regular` | 400 |
| `--font-weight-medium` | 500 |
| `--font-weight-semibold` | 600 |

### Line Heights

| Token | Value | Use for |
|-------|-------|---------|
| `--line-height-tight` | 1.2 | Labels, single-line elements |
| `--line-height-normal` | 1.4 | Body text, multi-line content |

### Text Component

Use the `<Text>` component for all text rendering. It maps to the tokens above.

#### Variants

| Variant | Size token | Weight | Extras | Use for |
|---------|------------|--------|--------|---------|
| `body` | `--font-size-l` | regular | — | Default UI text, descriptions |
| `body-large` | `--font-size-xl` | regular | line-height normal | Input text, longer content |
| `caption` | `--font-size-s` | regular | — | Secondary info, small labels |
| `label` | `--font-size-xs` | semibold | uppercase, letter-spacing 0.05em | Section headings, group labels |

#### Colors

`default` · `secondary` · `muted` · `inherit`

#### Weight overrides

`regular` · `medium` · `semibold`

#### Polymorphic tag

Use `tag` prop to control the rendered element: `<Text variant="label" tag="h2">` renders an `<h2>` with label styles.

---

## Components

### AgentPanel
- **Structure:** PanelToolbar with scrolling tabs + ChatMessage list + InputChat
- Tabs represent different agent chats (Site Assistant, Code Agent, Design Agent)
- Messages area is max-width constrained and auto-scrolls
- InputChat wrapped in `p-xs` for breathing room

### ChatMessage
- **Props:** `role` (user/agent), `content` (string), `agentName` (string, optional)
- Agent messages: left-aligned, show agent name label above, thumbs up/down + copy actions on hover
- User messages: right-aligned with `surface-secondary` background bubble, copy action on hover
- Actions are invisible until hover (opacity transition)
- Uses `body-large` Text for message content

### Button
- **Props:** `variant` (primary/secondary/tertiary), `surface` (light/dark), `size` (default/small), `width` (hug/full), `icon`, `label`, `shortcut`
- `shortcut` — e.g. `"mod+enter"` — registers global keydown listener and displays formatted badge (⌘↵ on Mac, Ctrl↵ on Windows). Supports `mod`, `shift`, `alt` modifiers.
- Icon-only buttons auto-square to match height
- Surface controls color scheme, not a separate variant
- Keeps its own inline-flex + padding styles (variant-coupled, not utility-friendly)

### Dropdown
- **Props:** `modelValue` (string, v-model), `groups` ({ label, options[] }[]), `placement` ('above' | 'below')
- Grouped option picker with labeled sections and dividers
- Click-outside to dismiss, animated open/close (slide + fade)
- Above/below placement (default: above, natural for bottom-anchored inputs)
- Active option highlighted in primary color

### InputChat
- **Events:** `send` (message: string, model: string)
- Entire component looks like a single large textarea
- Click anywhere to focus the textarea (unless clicking a button)
- Auto-growing textarea via `field-sizing: content`, capped at ~7 lines
- Bottom toolbar with Dropdown (model selector) and send Button
- Hover darkens border, focus-within shows primary ring
- Enter to send, Shift+Enter for newline

### ProjectListItem
- **Props:** `name` (string), `favicon` (string URL), `status` (stopped/loading/running), `active` (boolean)
- **Events:** `select`, `toggle`
- Single sidebar row: favicon + name + status indicator
- Uses `hstack gap-xs p-xs`, `flex-1 min-w-0` on name for truncation

### Sidebar
- **Structure:** heading + project list + footer with add button
- Uses `vstack shrink-0` for vertical layout
- Fixed width: 210px (42 grid units)
- Project list uses `vstack gap-xxxs flex-1 overflow-auto`

### StatusIndicator
- **Props:** `status` (stopped/loading/running)
- **Events:** `toggle`
- Single-element `clip-path` morphing for smooth shape transitions
- Stopped → grey circle, hover → green play triangle
- Running → green circle, hover → red stop square
- Loading → spinning blue ring (not interactive)
- Fixed container size (`--space-m`)

### Text
- **Props:** `variant` (body/body-large/caption/label), `tag` (string, default 'span'), `color` (default/secondary/muted/inherit), `weight` (regular/medium/semibold)
- Polymorphic — renders as any HTML element via `tag`
- Use for all UI text; replaces raw font-size/weight in component styles
- `label` variant includes uppercase + letter-spacing (section headings, group labels)

### Titlebar
- **Regions:** `titlebar-start` (traffic lights), `titlebar-center` (app title), `titlebar-end` (settings/help)
- Center is absolutely positioned for true centering
- All regions use `hstack` utility; traffic lights use `me-xxs` for margin
- `-webkit-app-region: drag` on titlebar, `no-drag` on interactive regions
- Traffic lights: 12px circles (OS-native size — intentional exception)

### WPIcon
- **Props:** `icon` (from @wordpress/icons), `size` (number, default 24)
- Resolves React element trees to native SVG for Vue compatibility

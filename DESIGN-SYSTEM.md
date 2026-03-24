# Design System Rules

## Spacing

- **All spacing uses the 4px grid.** Use `--space-xxxs` through `--space-xxxl` exclusively.
- **No magic numbers.** No `padding: 12px` or `gap: 7px`. If it's not on the grid, it doesn't ship.
- **Exception:** Only with explicit logic and permission (e.g., optical alignment, icon sizing, border widths). Document the reason in a comment.

### Scale

| Token          | Value | Grid units |
|----------------|-------|------------|
| `--space-xxxs` | 2px   | 0.5        |
| `--space-xxs`  | 4px   | 1          |
| `--space-xs`   | 8px   | 2          |
| `--space-s`    | 12px  | 3          |
| `--space-m`    | 16px  | 4          |
| `--space-l`    | 20px  | 5          |
| `--space-xl`   | 24px  | 6          |
| `--space-xxl`  | 32px  | 8          |
| `--space-xxxl` | 48px  | 12         |

## Border Radius

- **Use `--radius-s` (4px), `--radius-m` (8px), `--radius-l` (12px), or `--radius-full` (9999px)** from `styles/radius.css`.
- `--radius-full` creates pill shapes for badges, avatars, etc.
- **Exception:** `border-radius: 50%` for circles (status dots) is fine.

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
| `.min-h-0`   | `min-height: 0`    |

#### Wrap

`.flex-wrap` · `.flex-nowrap`

#### Overflow

`.overflow-hidden` · `.overflow-auto`

#### Dimensions

`.w-full` · `.h-full`

### Spacing (`styles/space.css`)

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

All sizes from `0` through `xxxl` (uniform), `0` through `xl` (axis), `xxxs` through `xxxl` (block-start/end), `xxxs` through `xl` (inline-start/end).

#### Margin

Same pattern as padding: `.m-{size}`, `.mx-{size}`, `.my-{size}`, `.mt-{size}`, `.mb-{size}`, `.ms-{size}`, `.me-{size}`

Plus `.mx-auto` for centering.

Margin utilities cover `0` through `s` (uniform), `xxxs` through `xs` (axis), `xxxs` through `xl` (block-start/end), `xxxs` through `l` (inline-start/end).

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
| `--font-size-xxs` | 10px | Heading-small variant, tiny labels |
| `--font-size-xs` | 11px | Labels, shortcut hints |
| `--font-size-s` | 12px | Captions, small controls |
| `--font-size-m` | 13px | Default UI text, buttons |
| `--font-size-l` | 14px | Body text, inputs |
| `--font-size-xl` | 16px | Body-large, chat messages |
| `--font-size-xxl` | 24px | Page headings |

### Font Weights

| Token | Value |
|-------|-------|
| `--font-weight-regular` | 400 |
| `--font-weight-medium` | 500 |
| `--font-weight-semibold` | 550 |

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
| `body-small` | `--font-size-s` | regular | — | Secondary info, descriptions |
| `heading-small` | `--font-size-xxs` | semibold | uppercase, letter-spacing 0.025em | Section headings, group labels |

#### Colors

`default` · `secondary` · `muted` · `inherit`

#### Weight overrides

`regular` · `medium` · `semibold`

#### Surface

`light` · `dark` — Controls whether text colors map to frame (light) or chrome (dark) context.

#### Polymorphic tag

Use `tag` prop to control the rendered element: `<Text variant="heading-small" tag="h2">` renders an `<h2>` with heading-small styles.

---

## Components

### Button
- **Props:** `variant` (primary/secondary/tertiary), `surface` (light/dark), `size` (mini/small/default/large), `width` (hug/full), `icon`, `label`, `shortcut`, `iconOnly`, `active`, `activeRotate`, `destructive`, `disabled`, `tooltip`, `tooltipPlacement`
- `shortcut` — e.g. `"mod+enter"` — registers global keydown listener and displays formatted badge (⌘↵ on Mac, Ctrl↵ on Windows). Supports `mod`, `shift`, `alt` modifiers.
- Icon-only buttons auto-square to match height
- Surface controls color scheme, not a separate variant
- Keeps its own inline-flex + padding styles (variant-coupled, not utility-friendly)

### ChatMessage
- **Props:** `role` (user/agent), `content` (string), `toolCalls` (ToolCall[], optional), `agentId` (AgentId, optional), `siteId` (string, optional)
- Agent messages: left-aligned, show agent name label above, thumbs up/down + copy actions on hover
- User messages: right-aligned with `surface-secondary` background bubble, copy action on hover
- Actions are invisible until hover (opacity transition)
- Uses `body-large` Text for message content

### Dropdown
- **Props:** `modelValue` (string, v-model), `groups` (DropdownGroup[]), `placement` ('above' | 'below'), `align` ('start' | 'center' | 'end'), `triggerIcon`, `showChevron` (default true), `surface` (light/dark), `menuSurface` (light/dark), `size` (small/default), `variant` (inline/field), `width` (hug/fill), `tooltip`, `maxHeight`
- Grouped option picker with labeled sections and dividers
- Click-outside to dismiss, animated open/close (slide + fade)
- Above/below placement (default: above, natural for bottom-anchored inputs)
- Active option highlighted in primary color

### InputChat
- **Props:** `surface` (light/dark), `siteId`, `modelValue` (v-model), `placeholder`, `elevated`, `streaming`
- **Events:** `send` (message: string), `stop`, `update:modelValue`, `manage-agents`
- Entire component looks like a single large textarea
- Click anywhere to focus the textarea (unless clicking a button)
- Auto-growing textarea via `field-sizing: content`, capped at ~7 lines
- Hover darkens border, focus-within shows primary ring
- Enter to send, Shift+Enter for newline

### SiteItem
- **Props:** `site` (Site), `active` (boolean, optional), `unreadCount` (number, optional), `surface` ('chrome' | 'frame', optional)
- **Events:** `select` (id: string)
- Single sidebar row: favicon + name + status indicator
- Uses `hstack gap-xs p-xs`, `flex-1 min-w-0` on name for truncation

### StatusIndicator
- **Props:** `status` (stopped/loading/running)
- **Events:** `toggle`
- Single-element `clip-path` morphing for smooth shape transitions
- Stopped → grey circle, hover → green play triangle
- Running → green circle, hover → red stop square
- Loading → spinning blue ring (not interactive)
- Fixed container size (`--space-m`)

### Text
- **Props:** `variant` (body/body-large/body-small/heading-small), `tag` (string, default 'span'), `color` (default/secondary/muted/inherit), `weight` (regular/medium/semibold), `surface` (light/dark)
- Polymorphic — renders as any HTML element via `tag`
- Use for all UI text; replaces raw font-size/weight in component styles
- `heading-small` variant includes uppercase + letter-spacing (section headings, group labels)
- `surface` switches color context between frame (light) and chrome (dark)

### WPIcon
- **Props:** `icon` (from @wordpress/icons), `size` (number, default 24)
- Resolves React element trees to native SVG for Vue compatibility

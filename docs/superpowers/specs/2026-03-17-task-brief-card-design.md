# Task Brief Card

## Overview

Replace the current `TaskToolbar` (a thin bar showing task name, worktree branch, and preview button) with an expanded "Brief" card — a skeuomorphic, paper-inspired task definition card that sits above the chat messages. The card displays the task title, an AI-generated summary of work done and to-be-done, structured lists of changed files and WordPress entities, and actions for previewing and reviewing changes. Its appearance shifts based on conversation status, making it a living artifact that reflects the task's lifecycle.

## Design Goals

- **Orientation at a glance:** A user switching between tasks immediately understands what this task is, what's happened, and what's next.
- **Tactile identity:** The card should feel like a printed project brief — professional but clearly a physical object sitting on the interface. Not flat UI, not full craft-project skeuomorphism. Think: layered shadow, warm off-white background, a dog-ear fold, printed-form dividers.
- **Status as personality:** The card's visual treatment changes per status — not just a badge swap, but a shift in feel (pulse, watermark, stamp).
- **Compact by default:** The card has collapsed and expanded states. Collapsed shows enough to orient (~80px). Expanded reveals full file/entity lists and complete summary.

## Card Structure

### Container

Replaces the current `TaskToolbar` position — between the site toolbar area and the chat message list. Always visible.

The card does **not** scroll with messages — it stays fixed at the top of the panel (same position contract as the current `TaskToolbar`). The chat message list scrolls independently below it. This means the expanded state should be kept reasonably compact; the file/entity sub-lists handle overflow with their own expand/collapse rather than letting the card grow unbounded.

**Collapsed state (height determined by content and padding, not a fixed value):**
- Header band with status badge and branch name
- Title and single-line truncated AI summary
- Compact stats line: "3 files · 2 posts · 1 option"
- Action icon buttons (preview, review) near top-right

**Expanded state (grows to fit):**
- Full header band
- Title and full AI summary paragraph
- File and entity lists (expandable sub-sections)
- Action buttons in a footer area

**Toggle:** Click the card body or a small chevron to expand/collapse. Actions remain clickable without triggering toggle.

**Paper treatment:**
- Background: warm off-white, slightly warmer than the message area background. New CSS variable (`--color-paper` or similar), with a dark-mode equivalent that's a slightly warm dark tone.
- Border: 1px solid, slightly darker than background — card stock edge feel.
- Shadow: layered `box-shadow` — a tight shadow (1-2px) for thickness, a softer spread (8-12px) for lift. Card rests on the surface.
- Dog-ear: CSS triangle in top-right corner, `--space-xxs` (10px). A small fold where paper turns over, showing a slightly darker underside. Achieved with `clip-path` or CSS border trick on a pseudo-element.
- No texture images. Warmth comes from color and shadow.

**Spacing:**
- Internal padding: `--space-m` to `--space-l`.
- Flush with panel edges horizontally (no side margin, or minimal margin matching the message area).
- Subtle gap below before messages start (`--space-s`).

### Header Band

A slightly darker strip across the top of the card. Height is determined by its content and padding (`--space-xs` block padding) rather than a fixed pixel value.

- **Left:** Status badge — small rounded element with icon and label text. Color and icon vary per status (see Status Treatments below).
- **Right:** Branch name in monospace, muted color. Shows the worktree branch (e.g., `task/hero-section-redesign`).
- **Band color:** Desaturated tint tied to status. Not a bold stripe — more like the card was printed on tinted stock at the top.

### Title & Summary

Below the header band.

- **Title:** AI-generated task name. Medium-weight font, slightly larger than body text. Single line, truncated with ellipsis.
- **AI Summary:** Below title, muted body text. One line truncated when collapsed, full content when expanded. Content evolves as the conversation progresses — starts as intent ("Redesign the hero section with new imagery"), becomes a done/next report ("Updated hero layout and typography. Next: responsive breakpoints.").
- **Divider:** Thin horizontal rule below summary, styled lighter than a standard border — printed form line feel.

### Files & Entities

Below the divider. Two sub-sections displayed side-by-side (two columns).

**When card is collapsed:** A single compact stats line replaces this section — "3 files · 2 posts · 1 option". Uses muted text and interpuncts as separators.

**When card is expanded:**

- **Files column:**
  - Header: "3 files changed" (clickable to expand/collapse the list).
  - Expanded list: file names with small file-type indicators. E.g., `hero.html`, `style.css`, `header.php`.

- **Content column:**
  - Header: "2 posts updated, 1 option changed" (clickable to expand/collapse).
  - Expanded list: entity names with type labels. E.g., `"Welcome to Our Site" (post)`, `"site_tagline" (option)`.

### Actions Footer

Below the file/entity section, separated by another form-line divider. Only fully visible when expanded.

- **Preview Site:** Opens the worktree dev server URL. Secondary/tertiary button style with eye icon. Tooltip shows the URL.
- **Review Changes:** Opens a diff/changelog view. More prominent styling when status is "review."
- **Alignment:** Buttons align to the inline-end.

**When collapsed:** Preview and Review appear as small icon buttons positioned near the top-right of the card (near the dog-ear), always accessible without expanding.

### Status Treatments

Status determines the header band color and adds a unique visual treatment to the card:

| Status | Band Color | Treatment |
|--------|-----------|-----------|
| **Idle** | Neutral grey | No extra treatment. A blank brief. |
| **Running** | Warm amber | Slow pulse animation on the header band — a gentle opacity shift suggesting active work. |
| **Review** | Blue | Faint diagonal "REVIEW" watermark across the card body, ~10% opacity, slightly rotated — implemented as a `::after` pseudo-element with `content: 'REVIEW'`, positioned absolutely over the card body. Like a rubber-stamped document. "Review Changes" button becomes primary-styled. |
| **Approved** | Green | Small circular seal in the bottom-right — checkmark inside a circle with a slightly rough edge (rubber stamp feel). CSS-only using border-radius and a subtle filter. |
| **Merged** | Green | Seal shifts to "MERGED" text stamp. Card slightly desaturates — work is done. |
| **Rejected** | Muted red | Card gets subtle desaturation. Quiet "this didn't land" feel. No dramatic treatment. |

## Data Model Changes

The existing `Conversation` interface needs minor additions to support the card content:

```typescript
export interface Conversation {
  // ... existing fields ...
  summary?: string              // AI-generated summary, updated as work progresses
  changedFiles?: ChangedFile[]  // Files modified during the task
  changedEntities?: ChangedEntity[]  // WordPress data modified
}

export interface ChangedFile {
  path: string                  // e.g., "hero.html"
  type: 'added' | 'modified' | 'deleted'
}

export interface ChangedEntity {
  name: string                  // e.g., "Welcome to Our Site"
  entityType: string            // e.g., "post", "page", "option", "plugin"
  action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated'
}
```

Summary generation: Kit updates `conversation.summary` as the conversation progresses, similar to how `generateTaskTitle()` works today. Triggered after meaningful exchanges, not every message.

File and entity tracking: Built up programmatically from tool calls and actions during the conversation. When Kit edits a file or modifies WordPress data, the corresponding arrays are updated.

## Component Architecture

All TaskBrief components live in `src/components/composites/task-brief/`, following the existing subdirectory pattern (`chat-cards/`, `renderers/`).

- **TaskBrief.vue** — Root component replacing `TaskToolbar`. Owns the card layout, collapsed/expanded state, paper styling, and status treatments.
- **TaskBriefHeader.vue** — The header band with status badge and branch name. Branch icon uses `WPIcon` (not inline SVG).
- **TaskBriefStats.vue** — The files and entities section. Handles both compact (counts) and expanded (lists) display. Owns the expand/collapse state of individual sub-sections.
- **TaskBriefActions.vue** — Preview and Review buttons. Adapts layout for collapsed vs expanded card.
- **PanelToolbar.vue** — Remains unchanged. TaskBrief does not extend it; it's a new component with its own layout.

## New CSS Variables

Added to the design system:

```css
/* Paper surface — light mode defaults */
--color-paper: /* warm off-white */;
--color-paper-header: /* slightly darker band */;
--color-paper-rule: /* form-line divider color */;
--color-paper-shadow-tight: /* close shadow */;
--color-paper-shadow-soft: /* spread shadow */;

/* Task brief status band tints (namespaced to avoid collision with existing --color-status-* vars) */
--color-brief-idle: /* neutral grey */;
--color-brief-running: /* warm amber */;
--color-brief-review: /* blue */;
--color-brief-approved: /* green */;
--color-brief-merged: /* green */;
--color-brief-rejected: /* muted red */;

/* Dark mode — redefine same variables inside @media (prefers-color-scheme: dark), per project convention */
@media (prefers-color-scheme: dark) {
  :root {
    --color-paper: /* slightly warm dark tone, not pure grey */;
    --color-paper-header: /* adjusted for dark surface */;
    --color-paper-rule: /* lighter rule for dark backgrounds */;
    --color-paper-shadow-tight: /* more subtle */;
    --color-paper-shadow-soft: /* more subtle */;
    --color-brief-idle: /* desaturated for dark */;
    --color-brief-running: /* desaturated for dark */;
    --color-brief-review: /* desaturated for dark */;
    --color-brief-approved: /* desaturated for dark */;
    --color-brief-merged: /* desaturated for dark */;
    --color-brief-rejected: /* desaturated for dark */;
  }
}
```

## Dark Mode

All paper and status variables are redefined inside `@media (prefers-color-scheme: dark)` per project convention (see CSS Variables section above). Key adaptation notes:

- Paper background becomes a slightly warm dark tone (not pure dark grey).
- Shadows become more subtle (less spread, darker color).
- Dog-ear fold uses adjusted colors for dark surfaces.
- Status band tints desaturate further to avoid glowing on dark backgrounds.
- Watermarks and stamps use lighter opacity values to remain visible without being harsh.

## Interactions

- **Collapse/expand:** Click card body or chevron. Use `grid-template-rows: 0fr` / `1fr` with `overflow: hidden` on the inner wrapper for smooth height animation (avoids the `max-height` hack's timing issues). Transition uses `--duration-moderate` and `--ease-out` from motion tokens.
- **Status transitions:** When status changes, the header band color cross-fades using `--duration-moderate` and `--ease-out`. Stamps/watermarks fade in. Use CSS transitions rather than JS animation.
- **Hover on collapsed actions:** Icon buttons show tooltips (existing Tooltip component).
- **Expand file/entity lists:** Click the count header to reveal individual items. Independent of card expand — card must be expanded first, then sub-lists can expand.

## Accessibility

- Card expand/collapse is keyboard-accessible (Enter/Space on a focusable trigger).
- Status is communicated via text label in the badge, not color alone.
- Watermarks and stamps are decorative (`aria-hidden`).
- Action buttons have clear labels and tooltips.

## Scope Boundaries

**In scope:**
- TaskBrief component and sub-components
- Card styling with paper treatment and status visuals
- Collapsed/expanded states
- New CSS variables for paper and status
- Data model additions (types only — seed data updated)

**Out of scope (for now):**
- Actual AI summary generation logic (will use placeholder/seed data)
- Actual file/entity tracking from tool calls (will use seed data)
- The "Review Changes" diff view itself (button exists, destination is future work)
- Animations beyond CSS transitions (no JS animation libraries)

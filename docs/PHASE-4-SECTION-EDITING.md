# Phase 4: Section Editing

The editing loop — user asks for a change via chat, AI generates a targeted update, preview reflects the change. This is where the product lives day-to-day after initial creation.

Phase 4 assumes Phases 1–3 are complete: the section system exists, the AI generation pipeline works, and sites can be created end-to-end.

---

## 1. Edit Taxonomy

Every user request maps to one of these edit operations. The AI classifies the request and returns the appropriate card type.

### Edit Types

| Type | Scope | What Changes | Example |
|------|-------|-------------|---------|
| **Theme** | Global | `SiteTheme` settings | "Make the colors warmer" |
| **Section Content** | Single section | Section `data` fields | "Change the hero headline" |
| **Section Style** | Single section | Section `type` (preserves `data`) | "Make the hero full-width" |
| **Section Reorder** | Page template | Section `order` values | "Move testimonials above menu" |
| **Section Add** | Page template | New section inserted | "Add a testimonials section" |
| **Section Remove** | Page template | Section deleted | "Remove the gallery" |
| **Page Add/Remove** | Site | Page template created/deleted | "Add a blog page" |
| **Template Part** | Global | Header/footer template part | "Add a Shop link to the nav" |
| **Image** | Single section | Image generation + data update | "Change the hero image" |

### TypeScript Representation

```ts
type EditOperation =
  | { type: 'theme'; patch: Partial<SiteTheme['settings']> }
  | { type: 'section-content'; pageId: string; sectionId: string; data: Record<string, any> }
  | { type: 'section-style'; pageId: string; sectionId: string; newType: string; data: Record<string, any> }
  | { type: 'section-reorder'; pageId: string; order: string[] } // array of section IDs in new order
  | { type: 'section-add'; pageId: string; section: Section; position: number }
  | { type: 'section-remove'; pageId: string; sectionId: string }
  | { type: 'page-add'; page: PageTemplate }
  | { type: 'page-remove'; pageId: string }
  | { type: 'template-part'; partId: string; data: Record<string, any> }
  | { type: 'image'; pageId: string; sectionId: string; field: string; prompt: string; url?: string }
```

### Compound Edits

Some requests produce multiple operations. "Rebrand to a modern look" might yield a theme change + image changes + section style changes. The AI returns these as an ordered list of `EditOperation`s, each rendered as its own card in the chat. The user can apply or dismiss each individually.

---

## 2. AI Interaction Model

### Edit Mode System Prompt

When a site exists, the AI receives an **editing context** appended to the system prompt. This tells the AI what it's working with:

```ts
interface EditingContext {
  theme: SiteTheme
  templateParts: Record<string, TemplatePart>
  pages: {
    id: string
    title: string
    slug: string
    sections: {
      id: string
      type: string
      data: Record<string, any>
    }[]
  }[]
  availableSectionTypes: {
    type: string
    description: string
    schema: Record<string, any> // JSON Schema for the section's data
  }[]
}
```

The system prompt addition:

```
You are now in editing mode for an existing site. The current site structure is provided below.

When the user requests a change:
1. Determine which edit type applies (theme, section-content, section-style, section-reorder, section-add, section-remove, page-add, page-remove, template-part, image).
2. Return one or more edit cards using the ```card:TYPE``` fence format.
3. Preserve all data that the user didn't ask to change.
4. For section style changes, map existing data fields to the new section type's schema. Drop fields that don't apply; add sensible defaults for new required fields.

Current site structure:
<site>
{serialized EditingContext}
</site>
```

### Classification Flow

```
User message
  → AI reads editing context + message
  → Determines edit type(s)
  → Generates structured card(s) with proposed changes
  → Returns text explanation + card block(s)
```

The AI doesn't need explicit routing logic — the system prompt and editing context give it enough information to classify naturally. The structured card output (fenced JSON) ensures the client can parse and act on the result.

### Ambiguous Requests

For vague requests like "make it better" or "I don't like it," the AI should:

1. Ask a clarifying question if the scope is truly unclear: "What specifically would you like to improve? The colors, layout, content, or something else?"
2. If the user has been discussing a specific section, assume the request applies to that section.
3. If a previous change was just applied, assume "I don't like it" refers to that change and offer to revert or try alternatives.

The AI maintains conversational context — it knows what was just discussed and what was just changed.

---

## 3. New Card Types for Editing

All editing cards follow the existing `ChatCard` pattern: a card component rendered inline in the chat, with action buttons that emit events handled by the conversation system.

### Card Type Registration

Add to `CARD_TYPES` in `ai-service.ts`:

```ts
const CARD_TYPES = [
  'plugin', 'colorPalette', 'settings', 'progress',
  'themePicker', 'page', 'postDraft', 'themeUpdate',
  // Phase 4
  'sectionUpdate', 'sectionAdd', 'sectionRemove',
  'sectionReorder', 'pageUpdate',
] as const
```

### SectionUpdateCard

For content changes and style changes to an existing section.

```ts
export interface SectionUpdateCardData {
  label: string
  pageId: string
  sectionId: string
  /** 'content' when data changes, 'style' when type changes */
  changeType: 'content' | 'style'
  /** Current section state (for before/after display) */
  before: {
    type: string
    data: Record<string, any>
  }
  /** Proposed section state */
  after: {
    type: string
    data: Record<string, any>
  }
  /** Human-readable summary of what changed */
  changeSummary: string[]
  action?: ActionButton
}
```

**UI:** Shows the section name, a list of changed fields (before → after), and "Try it" (secondary) / "Apply" (primary) buttons. For style changes, shows "hero-split → hero-fullwidth" as the primary change. The card manages its own lifecycle — Apply does not send a chat message.

**Card fence format:**
```
```card:sectionUpdate
{
  "label": "Update hero headline",
  "pageId": "homepage",
  "sectionId": "hero-1",
  "changeType": "content",
  "before": { "type": "hero-split", "data": { "heading": "Downstreet Cafe", ... } },
  "after": { "type": "hero-split", "data": { "heading": "Welcome to Downstreet", ... } },
  "changeSummary": ["heading: \"Downstreet Cafe\" → \"Welcome to Downstreet\""]
}
```​
```

### SectionAddCard

For adding new sections.

```ts
export interface SectionAddCardData {
  label: string
  pageId: string
  /** The new section to insert */
  section: {
    type: string
    data: Record<string, any>
  }
  /** Position in the page (0-indexed). -1 means append to end. */
  position: number
  /** What comes before/after for context */
  context?: {
    before?: string  // section type above
    after?: string   // section type below
  }
  action?: ActionButton
}
```

**UI:** Shows the proposed section type, a preview snippet of its content, and where it will be inserted ("After the hero, before the menu"). "Add" button inserts it. "Try it" button shows it in the preview temporarily.

### SectionRemoveCard

For removing sections.

```ts
export interface SectionRemoveCardData {
  label: string
  pageId: string
  sectionId: string
  /** What's being removed, for confirmation */
  sectionType: string
  sectionSummary: string
  action?: ActionButton
}
```

**UI:** Shows what will be removed with a brief summary of its content. Red "Remove" button with destructive variant. Deliberately minimal — removal should feel deliberate.

### SectionReorderCard

For reordering sections within a page.

```ts
export interface SectionReorderCardData {
  label: string
  pageId: string
  /** Current order: array of { id, type, label } */
  currentOrder: { id: string; type: string; label: string }[]
  /** Proposed order: same items, different sequence */
  proposedOrder: { id: string; type: string; label: string }[]
  action?: ActionButton
}
```

**UI:** Two columns — "Current" and "Proposed" — showing the section order as a numbered list. Moved sections are highlighted. "Apply" button commits the reorder.

### PageUpdateCard

For page-level operations (add/remove pages, update nav).

```ts
export interface PageUpdateCardData {
  label: string
  changeType: 'add' | 'remove' | 'update'
  /** For 'add': the new page definition */
  page?: {
    id: string
    title: string
    slug: string
    sections: { type: string; data: Record<string, any> }[]
  }
  /** For 'remove': which page */
  pageId?: string
  pageSummary?: string
  action?: ActionButton
}
```

**UI:** For page addition, shows the page title and section lineup. For removal, shows a confirmation with page name. "Add Page" / "Remove Page" button.

### Updated CardBlock Union

```ts
export type CardBlock =
  | (BaseCardBlock & { card: 'plugin'; data: PluginCardData })
  | (BaseCardBlock & { card: 'colorPalette'; data: ColorPaletteData })
  | (BaseCardBlock & { card: 'settings'; data: SettingsCardData })
  | (BaseCardBlock & { card: 'progress'; data: ProgressCardData })
  | (BaseCardBlock & { card: 'themePicker'; data: ThemePickerCardData })
  | (BaseCardBlock & { card: 'page'; data: PageCardData })
  | (BaseCardBlock & { card: 'postDraft'; data: PostDraftCardData })
  | (BaseCardBlock & { card: 'themeUpdate'; data: ThemeUpdateCardData })
  // Phase 4
  | (BaseCardBlock & { card: 'sectionUpdate'; data: SectionUpdateCardData })
  | (BaseCardBlock & { card: 'sectionAdd'; data: SectionAddCardData })
  | (BaseCardBlock & { card: 'sectionRemove'; data: SectionRemoveCardData })
  | (BaseCardBlock & { card: 'sectionReorder'; data: SectionReorderCardData })
  | (BaseCardBlock & { card: 'pageUpdate'; data: PageUpdateCardData })
```

### Card → EditOperation Mapping

Each edit card carries the `EditOperation` directly in its action payload. The `before`/`after` fields on cards like `SectionUpdateCard` are **display-only** — they exist so the card UI can show a human-readable diff. The actual mutation comes from constructing an `EditOperation` from the card data:

| Card Type | EditOperation Type | Mapping |
|---|---|---|
| `sectionUpdate` (content) | `section-content` | `{ pageId, sectionId, data: card.after.data }` |
| `sectionUpdate` (style) | `section-style` | `{ pageId, sectionId, newType: card.after.type, data: card.after.data }` |
| `sectionAdd` | `section-add` | `{ pageId, section: card.section, position: card.position }` |
| `sectionRemove` | `section-remove` | `{ pageId, sectionId }` |
| `sectionReorder` | `section-reorder` | `{ pageId, order: card.proposedOrder.map(s => s.id) }` |
| `pageUpdate` (add) | `page-add` | `{ page: card.page }` |
| `pageUpdate` (remove) | `page-remove` | `{ pageId: card.pageId }` |

The card's `action` button handler extracts the `EditOperation` and passes it to `applyEditOperation()`.

### Self-Contained Card Lifecycle

**Key principle:** The card owns the entire edit lifecycle. Clicking "Apply" does NOT send a new message into the chat or trigger an AI response. The card handles everything internally — progress, mutation, preview update, completion — and the chat stream stays clean.

Each edit card manages its own state machine:

```ts
type CardState =
  | 'proposed'    // Card just appeared. Shows summary + action buttons.
  | 'trying'      // "Try it" active — preview shows temporary change.
  | 'applying'    // User clicked Apply. Card shows progress internally.
  | 'complete'    // Done. Checkmark, buttons disabled.
  | 'error'       // Something failed. Shows retry option.
  | 'dismissed'   // User dismissed the proposal.
```

#### Simple edits (instant)

For operations where the data is already in the card (section-content, section-reorder, section-remove, template-part):

```
User clicks "Apply"
  → Card state: 'proposed' → 'applying'
  → Card shows subtle progress indicator (spinner replaces button)
  → captureSnapshot() for undo
  → Mutation applied to site store (synchronous)
  → Preview updated via postMessage (instant)
  → Card state: 'applying' → 'complete'
  → Card shows ✓, buttons disabled
```

Total time: <100ms. The "applying" state is barely visible but exists for consistency.

#### Complex edits (AI-powered)

For operations that need AI generation (section-add with new content, image generation, page-add):

```
User clicks "Apply"
  → Card state: 'proposed' → 'applying'
  → Card shows progress: "Generating testimonials section..."
  → Card internally spawns AI generation (its own API call, not through the chat)
  → As data arrives, card updates its progress display
  → On completion: mutation applied, preview updated
  → Card state: 'applying' → 'complete'
```

The card acts as a **self-contained subagent** — it owns its own AI call, manages its own progress UI, and reports completion by updating itself. The chat conversation is not involved. No new messages appear.

#### Implementation

```ts
interface EditCardController {
  /** Current card state */
  state: Ref<CardState>
  
  /** Progress message shown during 'applying' state */
  progressMessage: Ref<string>
  
  /** Try-it: temporarily apply the change in preview */
  tryIt(): void
  
  /** Revert try-it preview */
  dismiss(): void
  
  /** Commit the edit — handles the full lifecycle internally */
  apply(): Promise<void>
}

/**
 * Each card component creates its own controller.
 * The controller calls applyEditOperation() directly — 
 * no event emission, no conversation handler, no new messages.
 */
function useEditCard(operation: EditOperation): EditCardController {
  const state = ref<CardState>('proposed')
  const progressMessage = ref('')

  async function apply() {
    state.value = 'applying'
    progressMessage.value = 'Applying...'
    
    try {
      const snapshot = captureSnapshot()
      
      // For operations needing AI generation, do it here
      if (needsGeneration(operation)) {
        progressMessage.value = getProgressLabel(operation)
        const generated = await generateContent(operation) // card's own API call
        operation = { ...operation, ...generated }
      }
      
      // Apply mutation to store
      applyEditOperation(operation)
      
      // Update preview via postMessage
      updatePreview(operation)
      
      state.value = 'complete'
    } catch (err) {
      state.value = 'error'
      progressMessage.value = 'Failed — try again?'
    }
  }

  return { state, progressMessage, tryIt, dismiss, apply }
}
```

#### Why this matters

The old model (card click → new chat message → AI response → new card) has several problems:

1. **Chat pollution.** Every edit creates 2+ new messages. After 5 edits, the chat is a wall of "Applied hero update" / "Sure, I've updated..." noise.
2. **Broken mental model.** The user clicked a button to do a thing. They don't expect a conversation about it — they expect the thing to happen.
3. **Unnecessary latency.** Simple edits (reorder, remove, content swap) don't need AI involvement at all. The data is already in the card.
4. **Lost context.** The chat scrolls past the original card. The user loses the before/after context that was right there.

The self-contained model keeps the chat as a conversation layer and the cards as an action layer. They don't bleed into each other.

---

## 4. Preview Interaction

### Live Preview of Proposed Changes

When an edit card appears in chat, the preview should show the proposed change **before** the user commits it. This is the "Try it" interaction.

#### Try-It Mode

Each edit card has two buttons: **"Try it"** (secondary) and **"Apply"** (primary).

- **Try it** temporarily applies the change in the preview. The card shows a "Trying…" state with a pulsing indicator. The user can scroll the preview, see the change in context, then either "Apply" or "Dismiss."
- **Apply** commits the change permanently (pushes to undo history).
- **Dismiss** (or clicking "Try it" again) reverts the preview to the committed state.

Only one "Try it" can be active at a time. Starting a new one reverts the previous.

```ts
interface PreviewState {
  /** The committed site state */
  committed: SiteState
  /** A temporary overlay for try-it mode. Null when not trying. */
  tryingEdit: EditOperation | null
}
```

The preview renderer composes the final state:

```ts
function getPreviewState(state: PreviewState): SiteState {
  if (!state.tryingEdit) return state.committed
  return applyEditToState(state.committed, state.tryingEdit)
}
```

#### Section Highlighting

When the user hovers over an edit card in chat, the corresponding section in the preview gets a subtle highlight — a faint blue outline with a slight glow. This uses `postMessage` to communicate between the chat panel and the preview iframe:

```ts
// Chat panel → Preview iframe
window.previewFrame.contentWindow.postMessage({
  type: 'highlight-section',
  sectionId: 'hero-1',
  pageId: 'homepage',
}, '*')

// Clear highlight
window.previewFrame.contentWindow.postMessage({
  type: 'clear-highlight',
}, '*')
```

Inside the preview, the section renderer wraps each section in a `<div data-section-id="...">`. The highlight handler adds/removes a CSS class:

```css
[data-section-id].highlighted {
  outline: 2px solid rgba(var(--studio-accent-rgb), 0.4);
  outline-offset: -2px;
  transition: outline-color 150ms ease;
}
```

#### Click-to-Edit from Preview

The user can click any section in the preview to initiate an edit. The preview sends a message back to the chat:

```ts
// Preview iframe → Chat panel
parent.postMessage({
  type: 'section-clicked',
  sectionId: 'hero-1',
  pageId: 'homepage',
  sectionType: 'hero-split',
}, '*')
```

The chat panel receives this and:

1. Scrolls to show the relevant section context (if the user has scrolled away).
2. Inserts a system-generated user message: *"What would you like to change about the hero?"* — or opens a focused input with the section pre-selected.
3. The AI's next response is scoped to that section (the editing context highlights which section is focused).

**Implementation:** Add a `focusedSection` to the conversation state:

```ts
interface ConversationState {
  // ... existing fields
  focusedSection?: {
    pageId: string
    sectionId: string
    sectionType: string
  }
}
```

When set, the system prompt gets an addition: `"The user is focused on the ${sectionType} section (id: ${sectionId}) on the ${pageId} page. Respond with changes scoped to this section unless they ask about something else."`

---

## 5. Undo/History

### Snapshot-Based Undo

Every committed edit (clicking "Apply") captures a snapshot of the site state *before* the change. These form an undo stack.

```ts
interface SiteSnapshot {
  id: string
  timestamp: number
  label: string            // "Updated hero headline", "Added testimonials section"
  editOperation: EditOperation
  state: SiteState         // full site state at that point
}

interface EditHistory {
  snapshots: SiteSnapshot[]
  currentIndex: number     // points to the current state (-1 = initial)
}
```

#### Undo/Redo

- **Undo:** Restore `snapshots[currentIndex].state`, decrement `currentIndex`.
- **Redo:** Increment `currentIndex`, apply the operation at that index.
- **Depth:** Keep the last 20 snapshots for the prototype. Oldest are discarded when the limit is hit. (Future optimization: diff-based storage instead of full snapshots to reduce memory usage.)

#### UI

A simple **undo button** in the chat toolbar (not a full timeline). Clicking it:

1. Reverts the site to the previous state.
2. Posts a system message in chat: *"Undone: Updated hero headline"*
3. The corresponding card in chat transitions to `state: 'default'` (can be re-applied).

Redo is available via a redo button that appears after an undo. Standard undo/redo semantics — performing a new edit after undoing clears the redo stack.

#### Why Not a Visual Timeline

A timeline adds significant UI complexity for marginal value at this stage. The undo button is discoverable, fast, and handles the 90% case ("I don't like that, go back"). A timeline could be a future enhancement if users need to jump to arbitrary points.

---

## 6. Conflict Resolution

### In-Progress Generation

If the AI is generating a response and the user sends another message:

- **Queue it.** The new message enters a queue. When the current generation completes, the queued message is sent with full context (including any cards the AI just produced).
- The UI shows a subtle indicator that the message is queued: the send button becomes a "Queued" state, and the message appears in chat with a pending indicator.

```ts
interface MessageQueue {
  pending: { content: string; timestamp: number }[]
  isGenerating: boolean
}
```

### Rapid Sequential Edits

If the user applies multiple changes in quick succession (clicking "Apply" on several cards):

- For instant edits (content, reorder, remove): each apply is independent and synchronous. Patches the site state and pushes to the undo stack immediately.
- For AI-powered edits (section-add, image): each card manages its own API call. Multiple cards can be in 'applying' state simultaneously — they don't block each other. Each resolves independently.
- If the user *sends multiple chat messages* requesting changes, they queue and process sequentially. Each AI response sees the state after all previously applied changes.

### Conflicting Edits

If a "Try it" is active and the user applies a *different* card:

1. The "Try it" preview reverts.
2. The applied change commits.
3. The "Try it" card's proposed data may now be stale (e.g., it referenced a section that was reordered). The card shows a warning: *"This change was based on an older version of the page. Try regenerating."* with a "Regenerate" button that re-asks the AI for the same edit against the current state.

---

## 7. Performance

### Single-Section Regeneration

The section system's primary performance advantage: changing one section only re-renders that section's HTML.

```ts
function renderPage(page: PageTemplate, theme: SiteTheme): string {
  const parts = [
    renderDocumentHead(theme),
    renderTemplatePart(siteData.templateParts.header),
    ...page.sections.map(s => renderSection(s, theme)),
    renderTemplatePart(siteData.templateParts.footer),
  ]
  return parts.join('\n')
}
```

For editing, the preview iframe doesn't need a full page reload. Instead:

1. Re-render only the changed section's HTML.
2. Send the new HTML to the iframe via `postMessage`.
3. The iframe replaces the section in-place.

Uses the same iframe communication protocol defined in Phase 2 (`section-update` and `theme-update` message types).

```ts
// Chat panel → Preview iframe
previewFrame.contentWindow.postMessage({
  type: 'section-update',
  slotId: 'hero-1',
  html: renderSection(updatedSection, theme),
}, '*')
```

Inside the preview (same listener as Phase 2's progressive rendering):

```ts
window.addEventListener('message', (event) => {
  const msg = event.data
  if (msg.type === 'section-update') {
    const slot = document.querySelector(`[data-section-id="${msg.slotId}"]`)
    if (slot) {
      const wrapper = document.createElement('div')
      wrapper.className = 'section'
      wrapper.dataset.sectionId = msg.slotId
      wrapper.innerHTML = msg.html
      slot.replaceWith(wrapper)
    }
  }
})
```

This makes section updates feel instant — no flash, no scroll reset, no re-layout of unaffected sections.

### Theme Changes

Theme changes update CSS custom properties, which cascade automatically. No section re-rendering needed:

```ts
previewFrame.contentWindow.postMessage({
  type: 'theme-update',
  css: themeToCSS(updatedTheme),
}, '*')
```

The preview replaces the `<style id="theme-css">` block. The browser re-paints instantly.

### Section Caching

The page renderer caches section HTML keyed by `sectionId + JSON.stringify(data) + themeHash`:

```ts
const sectionCache = new Map<string, string>()

function renderSectionCached(section: Section, theme: SiteTheme): string {
  const key = `${section.id}:${JSON.stringify(section.data)}:${themeHash(theme)}`
  if (sectionCache.has(key)) return sectionCache.get(key)!
  const html = renderSection(section, theme)
  sectionCache.set(key, html)
  return html
}
```

On a full page render (e.g., switching pages), unchanged sections are served from cache. Only modified sections are re-rendered.

### AI Response Speed

Section-level edits are fast because:

- The AI produces a small JSON payload (section data), not full HTML.
- The system prompt includes only the relevant section's current data, not the entire page's HTML.
- `max_tokens` can be reduced for edit operations (most section data is <500 tokens).

For single-section content edits, target response time is **2–4 seconds**. For section additions (more data to generate), **4–8 seconds**. Theme changes are near-instant on the rendering side; the AI response is the only latency.

---

## Interaction Flow Summary

### Happy Path: Content Edit (instant — no AI needed)

```
User: "Change the hero headline to Welcome Home"
  → AI classifies: section-content edit
  → AI returns: text + SectionUpdateCard (with before/after data already populated)
  → Card appears in chat with before/after summary
  → User clicks "Try it"
    → Card state: 'trying'. Preview temporarily shows new headline.
  → User clicks "Apply"
    → Card state: 'applying' → 'complete' (~instant)
    → Card shows ✓. No new chat messages.
    → Preview updated in-place via postMessage.
    → Undo button becomes available.
```

### Happy Path: Section Addition (AI-powered — card owns the generation)

```
User: "Add a testimonials section after the about section"
  → AI classifies: section-add
  → AI returns: text + SectionAddCard (with section type + position, but data may be a stub)
  → Card appears in chat showing proposed section type and position
  → User clicks "Add"
    → Card state: 'applying'. Card shows "Generating testimonials..."
    → Card internally calls AI to generate section data (its own API call)
    → On completion: section inserted, preview updates
    → Card state: 'complete'. Card shows ✓ with final section summary.
    → No new chat messages. Chat stays clean.
```

### Happy Path: Click-to-Edit (preview → chat)

```
User clicks the menu section in the preview
  → Preview sends 'section-clicked' postMessage
  → Chat input focuses with section context pre-loaded
  → User types: "Add a new category for desserts"
  → AI generates SectionUpdateCard scoped to that section
  → User clicks "Apply" on card → card handles it internally
```

### Compound Edit: "Rebrand to a modern look"

```
User: "Rebrand to a modern look"
  → AI returns: text + ThemeUpdateCard + SectionUpdateCard × N
  → Multiple cards appear in chat, each self-contained
  → User can Apply/Dismiss each independently
  → Each card manages its own lifecycle
  → No cascading messages — just cards resolving one by one
```

---

## File Changes Summary

Files to create or modify for Phase 4:

**New files:**
- `src/data/types.ts` — Add `SectionUpdateCardData`, `SectionAddCardData`, `SectionRemoveCardData`, `SectionReorderCardData`, `PageUpdateCardData`, `EditOperation`, `SiteSnapshot`, `EditHistory`, `CardState`
- `src/composables/useEditCard.ts` — Self-contained card lifecycle controller (state machine, try-it, apply, progress)
- `src/composables/useEditHistory.ts` — Undo/redo stack management
- `src/composables/usePreviewBridge.ts` — `postMessage` communication with preview iframe
- `src/components/composites/chat-cards/SectionUpdateCard.vue`
- `src/components/composites/chat-cards/SectionAddCard.vue`
- `src/components/composites/chat-cards/SectionRemoveCard.vue`
- `src/components/composites/chat-cards/SectionReorderCard.vue`
- `src/components/composites/chat-cards/PageUpdateCard.vue`

**Modified files:**
- `src/data/ai-service.ts` — Add new card types to `CARD_TYPES`, editing context generation
- `src/data/ai-system-prompt.ts` — Editing mode prompt additions
- `src/data/types.ts` — Extended `CardBlock` union
- Preview iframe template — Section `data-section-id` attributes, message listeners for highlight/update/theme

# Task-Driven Site Mutations

## Summary

Allow AI tasks to make real changes to site content. Claude uses native `tool_use` to execute structured mutations (update sections, change themes, add/remove pages) against a mutable site content store. Changes apply live to the preview iframe as Claude works. Each change is individually undoable.

## Architecture

### Data Flow

```
User message
  → useTasks.sendMessage()
  → ai-service.streamAIWithTools()  (agentic loop)
      → POST /api/chat (Express proxy)
          → client.messages.stream({ tools, messages, system })
          ← SSE: text deltas + tool_use blocks + stop_reason
      ← parsed events
  → on tool_use:
      → ai-tool-executor.executeToolCall()
          → useSiteContent mutation (Vue ref + IndexedDB)
          ← Change object + tool result string
      → SitePage pushes change to iframe via sendSectionUpdate/sendThemeUpdate/sendPageUpdate
      → append tool_result to history
      → if stop_reason === "tool_use": loop (call API again)
      → if stop_reason === "end_turn": done
```

### Key Decision: Client-Side Tool Execution

Tools mutate client-side state (SiteContent in browser IndexedDB/Vue refs), so tool execution happens in the browser. The Express server stays stateless — it proxies messages and tool definitions to the Claude API and streams events back. The client manages the full message history and agentic loop.

### Type Unification: `SiteContent` = Renderer's `Site`

The renderer (`site-renderer.ts`) already imports a `Site` type from `./site-types` with the exact shape we need: `name`, `theme` (fonts, variables, darkVariables), `pages` (slug, title, sections), `sections` (id, html, css, role). Rather than creating a parallel type, `SiteContent` **is** this type plus a `siteId` field. Define it once in `src/data/site-types.ts` and use it in both the renderer and the content store.

## New Files

### `src/data/site-types.ts` — Shared Site Content Types

Defines the content-rich site type used by both the renderer and the content store. This file is already imported by `site-renderer.ts` but doesn't exist on main yet.

```typescript
export interface SiteContentTheme {
  fonts: string[]                         // font family names (for Google Fonts links)
  variables: Record<string, string>       // flat map of all CSS custom properties
  darkVariables?: Record<string, string>  // dark mode overrides
}

export interface SiteContentPage {
  slug: string
  title: string
  sections: string[]  // ordered section IDs
}

export interface SiteContentSection {
  id: string
  html: string
  css: string
  role?: string
}

// Used by site-renderer.ts (as `Site`) and useSiteContent.ts
export interface Site {
  name: string
  theme: SiteContentTheme
  pages: SiteContentPage[]
  sections: Record<string, SiteContentSection>
}

// Extends Site with a persistence key for IndexedDB
export interface SiteContent extends Site {
  siteId: string
}
```

### `src/data/useSiteContent.ts` — Site Content Store

Mutable site content, separate from the lightweight `Site` record in `types.ts`.

**Initialization:** On first load, static `SiteFiles` (from `src/data/sites/{layout}/index.ts`) are transformed into `SiteContent`. The transformation flattens the template-based `SiteTheme` into the renderer's format:

- `SiteTheme.colors` → merged into `variables` as `--key: value`
- `SiteTheme.fonts` (Record) → font family values extracted into `fonts` array; keys become `--font-key: value` in `variables`
- `SiteTheme.spacing` → merged into `variables` as `--key: value`
- Template HTML (`{{header}}`, `{{footer}}`) → resolved via `resolveParts()`, then parsed into sections

Persisted to `db.siteContent` IndexedDB table (primary key: `siteId`). On return visits, loads from DB.

**Composable API:**

```typescript
function useSiteContent() {
  getContent(siteId: string): ComputedRef<SiteContent | null>

  // Each mutation returns a Change for the undo stack
  updateSection(siteId, sectionId, { html?, css? }): Change
  createSection(siteId, pageSlug, { sectionId, html, css, role?, position? }): Change
  removeSection(siteId, pageSlug, sectionId): Change
  updateTheme(siteId, variables: Record<string, string>): Change
  addPage(siteId, { slug, title, sections? }): Change
  removePage(siteId, slug): Change
  reorderSections(siteId, pageSlug, sectionIds: string[]): Change

  // Undo
  undoChange(siteId, changeId): void
  getChanges(siteId): Change[]

  // Lifecycle
  initFromTemplate(siteId, mockLayout): Promise<void>
  _setContent(records: SiteContent[]): void
}
```

**Change object:**

```typescript
interface Change {
  id: string
  siteId: string
  toolCallId?: string    // links to ToolCall in message
  toolName: string
  label: string          // human-readable
  timestamp: string
  undo: () => void       // closure that restores previous state
}
```

Changes are stored in a per-site array (newest last) **in memory only** — closures can't be serialized to IndexedDB, so the undo stack is ephemeral and lost on refresh. This is acceptable for a prototype.

Each mutation captures previous state in a closure so `undo()` restores it exactly. Changes can be undone in any order since each captures its own snapshot. **Caveat:** if two tool calls modify the same section, undoing the earlier one restores pre-A state, which also reverts B's changes. This is a known tradeoff of snapshot-based undo; acceptable for now.

### `src/data/ai-tools.ts` — Tool Definitions & System Prompt

**Tool definitions** (passed to Claude API as `tools` array):

| Tool | Purpose | Required Args |
|------|---------|---------------|
| `update_section` | Edit HTML/CSS of an existing section | `section_id`; optional `html`, `css` |
| `create_section` | Add a new section to a page | `page_slug`, `section_id`, `html`, `css`; optional `role`, `position` |
| `remove_section` | Delete a section from a page | `page_slug`, `section_id` |
| `update_theme` | Change theme CSS variables | `variables` (Record<string, string>) |
| `add_page` | Create a new page | `slug`, `title`; optional `sections` |
| `remove_page` | Delete a page | `slug` |
| `reorder_sections` | Change section order | `page_slug`, `section_ids` (new order) |

**Dynamic system prompt** — `buildSystemPrompt(siteContent: SiteContent): string`:

Assembled per request from current `SiteContent` state. Includes:
- Site name
- Theme variables list
- Pages with their section IDs
- Brief section summaries (role + first ~100 chars)
- Guidelines: use tools to make changes, provide complete HTML/CSS not diffs, use existing theme variables

Rebuilt before each API call so Claude sees the latest state, including changes from earlier turns.

### `src/data/ai-tool-executor.ts` — Tool Executor

Maps tool names to `useSiteContent` mutations. Bridge between Claude's `tool_use` blocks and site state.

```typescript
function executeToolCall(
  siteId: string,
  toolName: string,
  args: Record<string, any>,
  toolCallId: string,
): { result: string; change: Change }
```

**The executor only mutates data.** It does NOT push changes to the preview iframe directly — it has no access to the iframe DOM element. Instead, the calling code (in `useTasks.sendMessage()`) takes the returned `Change` and calls the appropriate `sendSectionUpdate()` / `sendThemeUpdate()` / `sendPageUpdate()` on the iframe ref held by the SitePage component. The SitePage component provides the iframe ref via a shared composable or callback registered during mount.

On error (nonexistent section/page), returns error result (`is_error: true`) so Claude can recover.

## Modified Files

### `server.ts` — Express Proxy

- Accept `tools` array in `/api/chat` request body, pass to `client.messages.stream({ tools })`
- Increase `max_tokens` to `16000` (or accept from request body) — current `4096` is too small for HTML-generating tool calls
- Listen on SDK stream events: `contentBlockStart`, `contentBlockDelta`, `contentBlockStop`, `message` (for stop_reason)
- Forward as SSE events the client can parse: `tool_use_start` (id + name), `tool_use_delta` (input JSON chunks), `tool_use_done`, `stop` (with stop_reason)
- Server stays stateless. Each round-trip is a separate HTTP request. Client manages message history.

### `src/data/ai-service.ts` — AI Service

Replace text-only `streamAI` with tool-aware streaming:

```typescript
async function streamAIWithTools(
  messages: Anthropic.MessageParam[],
  tools: Anthropic.Tool[],
  system: string,
  callbacks: {
    onText: (text: string) => void
    onToolUse: (toolUse: { id: string; name: string; input: any }) => void
    onStopReason: (reason: string) => void
  }
): Promise<{ content: Anthropic.ContentBlock[]; stopReason: string }>
```

Existing `streamAI` stays for backward compatibility (title generation, non-tool conversations).

### `src/data/useTasks.ts` — Task Composable

`sendMessage()` gets the agentic loop:

1. Build system prompt from current `SiteContent`
2. Call `streamAIWithTools()` — text streams to chat message, `onToolUse` fires for each tool
3. On `onToolUse`: execute via `executeToolCall()`, collect results, update chat UI tool calls
4. If `stopReason === "tool_use"`: append assistant content + tool results, call again
5. If `stopReason === "end_turn"`: done

Existing `streamAgentMessage()` typing effect stays for seed/demo messages.

### `src/data/types.ts` — Types

- Add optional `changeId?: string` to `ToolCall` interface (links tool calls to undoable changes)
- Add `'reverted'` to `ToolCallStatus` union

### `src/data/db.ts` — Database

- Add `siteContent` table to Dexie schema with `siteId` as primary key: `siteContent: 'siteId'`

### `src/data/useHydration.ts` — Hydration

- On app load, initialize `SiteContent` for each site from templates (first visit) or DB (return visit)

### Chat UI (`ToolCallItem` component)

- Handle new `reverted` status — greyed out styling, strikethrough label
- Show undo/revert button on hover for `done` status tool calls
- Button calls `undoChange()` and marks status as `reverted`

## Known Limitations

- **Context window growth** — each round-trip sends full message history including tool results with HTML. Long sessions with many tool calls could fill the context window. Future optimization: summarize tool results ("Section updated successfully") instead of echoing full HTML back.

## What This Does NOT Cover

- **Collaboration/conflict resolution** — single user editing assumed
- **Version history beyond undo** — no named snapshots or branching
- **Diffing** — undo restores full previous state, no merge
- **Server-side persistence** — all state is client-side (IndexedDB)
- **Template ↔ SiteContent round-tripping** — once content is mutable, it doesn't write back to static template files

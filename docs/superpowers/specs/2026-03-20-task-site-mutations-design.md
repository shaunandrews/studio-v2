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
          → sendSectionUpdate/sendThemeUpdate/sendPageUpdate (iframe postMessage)
          ← Change object (captures undo closure)
          ← tool result string
      → append tool_result to history
      → if stop_reason === "tool_use": loop (call API again)
      → if stop_reason === "end_turn": done
```

### Key Decision: Client-Side Tool Execution

Tools mutate client-side state (SiteContent in browser IndexedDB/Vue refs), so tool execution happens in the browser. The Express server stays stateless — it proxies messages and tool definitions to the Claude API and streams events back. The client manages the full message history and agentic loop.

## New Files

### `src/data/useSiteContent.ts` — Site Content Store

Mutable site content, separate from the lightweight `Site` record.

**Data model:**

```typescript
interface SiteContentTheme {
  fonts: string[]
  variables: Record<string, string>
  darkVariables?: Record<string, string>
}

interface SiteContentPage {
  slug: string
  title: string
  sections: string[]  // ordered section IDs
}

interface SiteContentSection {
  id: string
  html: string
  css: string
  role?: string
}

interface SiteContent {
  siteId: string
  name: string
  theme: SiteContentTheme
  pages: SiteContentPage[]
  sections: Record<string, SiteContentSection>
}
```

**Initialization:** On first load, static `SiteFiles` (from `src/data/sites/{layout}/index.ts`) are transformed into `SiteContent`. The template system (parts + `{{header}}` placeholders) gets flattened into the section-based model the renderer uses. Persisted to a new `db.siteContent` IndexedDB table. On return visits, loads from DB.

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

Changes are stored in a per-site array (newest last). Each mutation captures previous state in a closure so `undo()` restores it exactly. Changes can be undone in any order since each captures its own state independently.

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

After mutating `SiteContent`, the executor pushes changes to the preview iframe using existing `sendSectionUpdate()` / `sendThemeUpdate()` / `sendPageUpdate()`. Returns a result string for Claude's next turn.

On error (nonexistent section/page), returns error result so Claude can recover.

## Modified Files

### `server.ts` — Express Proxy

- Accept `tools` array in `/api/chat` request body, pass to `client.messages.stream({ tools })`
- Stream new event types: `tool_use_start` (id + name), `tool_use_delta` (input JSON chunks), `tool_use_done`
- Stream `stop_reason` so client knows when Claude wants tool results vs. finished
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

- Add `siteContent` table to Dexie schema

### `src/data/useHydration.ts` — Hydration

- On app load, initialize `SiteContent` for each site from templates (first visit) or DB (return visit)

### Chat UI (`ToolCallItem` component)

- Handle new `reverted` status — greyed out styling, strikethrough label
- Show undo/revert button on hover for `done` status tool calls
- Button calls `undoChange()` and marks status as `reverted`

## What This Does NOT Cover

- **Collaboration/conflict resolution** — single user editing assumed
- **Version history beyond undo** — no named snapshots or branching
- **Diffing** — undo restores full previous state, no merge
- **Server-side persistence** — all state is client-side (IndexedDB)
- **Template ↔ SiteContent round-tripping** — once content is mutable, it doesn't write back to static template files

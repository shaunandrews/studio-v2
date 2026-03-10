# Tool Call Rendering & Seed Data Rewrite

## Goal

Add inline tool call rendering to chat messages and rewrite seed conversations to be realistic, showing Kit (one agent) doing real work with visible tool activity.

## Architecture

Messages stay as plain strings — tool calls are a new content block type rendered by a new component. The Message type gains an optional `toolCalls` array alongside the string `content`. ChatMessage renders tool calls inline between text segments. Seed data is rewritten to use a single agent (`wpcom`) and include tool calls where Kit takes actions.

## Design Decisions

These were explored and validated visually during brainstorming:

- **Tool calls as collapsible inline activity** — compact items in the text flow, no heavy container
- **Description-first labels** — "Installed Jetpack plugin" not `install_plugin`
- **Tool name on expand only** — chevron expands to show tool name, args, result
- **No checkmark for completed** — muted text + right chevron is enough
- **Spinner for in-progress** — same line format, spinner replaces chevron
- **Error items in red** — red text, red chevron, red detail border
- **Always show all items** — no collapsing or truncation regardless of count
- **One agent in seed data** — all conversations use `wpcom` (Kit)
- **Same conversation count** — ~18 conversations across 8 sites, rewritten for realism

---

## 1. Data Model

### New types in `types.ts`

```typescript
export type ToolCallStatus = 'running' | 'done' | 'error'

export interface ToolCall {
  id: string
  label: string            // Human-readable: "Installed Jetpack plugin"
  status: ToolCallStatus
  toolName?: string        // Technical name: "install_plugin" (shown on expand)
  args?: string            // Displayed in detail: 'slug: "jetpack"'
  result?: string          // Success detail: "Jetpack 14.3 installed and activated"
  error?: string           // Error detail: "STRIPE_API_KEY not found"
}
```

### Updated Message type

```typescript
export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'agent'
  agentId?: AgentId
  content: string
  toolCalls?: ToolCall[]   // NEW — rendered inline between text segments
  timestamp: string
}
```

Tool calls render between the message text and the final response. When `content` has text before and after tool calls, the component splits on a `---` separator or renders tool calls after the first paragraph.

Simpler approach for seed data: messages with tool calls put the "I'll do X" text in one message, then the tool calls + summary in the next message. No need for intra-message splitting — tool calls render above the text content.

## 2. ToolCallItem Component

**File:** `src/components/composites/ToolCallItem.vue`

A single tool call line. Three visual states:

### Done (default)
- Muted text label
- Right-pointing chevron after label
- Click toggles expanded state
- Expanded: left border, tool name (monospace, extra muted), args, optional result (green)
- Chevron rotates 90° when expanded

### Running
- Spinner icon before label (replaces chevron position — spinner leads, no trailing chevron)
- Same muted text color
- Not clickable/expandable

### Error
- Label text in error color
- Chevron in error color
- Expanded detail border in error color
- Optional `error` field shown in error color

### Design tokens used
- Text: `--color-frame-fg-muted` for labels, `--color-frame-fg` for expanded detail
- Error: `--color-status-error` (or the system error color)
- Spinner: `--color-frame-theme`
- Border: `--color-frame-border` for expanded left border
- Font: system monospace for tool name and args
- Sizes: `--font-size-s` for labels, `--font-size-xs` for detail
- Spacing: `--space-xxs`, `--space-xs` for padding
- Radius: none (these are inline items, not cards)
- Animation: chevron rotation `0.15s ease`, spinner `0.8s linear infinite`

## 3. ChatMessage Changes

ChatMessage currently renders a single `MarkdownText` for `content`. Updated behavior:

- If `toolCalls` exists and is non-empty, render them above the text content
- Tool calls render as a `<div>` containing `<ToolCallItem>` for each entry
- Text content renders below via `MarkdownText` as before

```
┌─────────────────────────────────┐
│ ToolCallItem (done)             │
│ ToolCallItem (done)             │
│ ToolCallItem (error)            │
│ ToolCallItem (done)             │
│                                 │
│ MarkdownText (summary response) │
└─────────────────────────────────┘
```

No changes to user messages — only agent messages can have tool calls.

## 4. Seed Data Rewrite

### Agent consolidation

All `agentId` values change to `'wpcom'`. Remove `'assistant' | 'code' | 'design'` from the `AgentId` type union since nothing references them anymore. Remove the `agentId` from conversation definitions where it was `'assistant'`, `'code'`, or `'design'` — they all become `'wpcom'`.

### Content changes

Rewrite messages to:
- Use tool calls where Kit takes actions (install plugin, create page, edit theme, etc.)
- Sound more natural — Kit can ask clarifying questions, express uncertainty, suggest alternatives
- Show realistic tool call patterns — sometimes 1-2 calls, sometimes 6-8 for bigger tasks
- Include at least one error scenario in seed data (e.g. the Fuego Stripe setup)
- Remove the markdown checklists that were card conversions — replace with actual tool calls

### Conversation structure stays the same
- Same ~18 conversations across the same sites
- Same general topics and flow
- Just more realistic content and tool call data

## 5. File Map

**Create:**
- `src/components/composites/ToolCallItem.vue` — single tool call line component

**Modify:**
- `src/data/types.ts` — add `ToolCall`, `ToolCallStatus`, update `Message`, clean `AgentId`
- `src/components/composites/ChatMessage.vue` — render tool calls above text
- `src/data/seed-conversations.ts` — rewrite all content, add tool calls, consolidate agents
- `src/data/agents.ts` — already cleaned, no further changes needed

**No changes to:**
- `InputChat.vue` — tool calls are display-only, no input changes
- `ChatMessageList.vue` — just renders ChatMessage, no prop changes
- `useConversations.ts` — Message type change is compatible
- `ai-service.ts` — tool calls in seed data only for now, not AI-generated

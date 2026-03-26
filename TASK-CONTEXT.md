# Task Context System

How structured context flows through the AI editing pipeline — from user intent to AI prompt to chat display.

## TaskContextItem type

Defined in `src/data/types.ts`. A discriminated union with three variants:

```typescript
type TaskContextItem =
  | { type: 'page'; pageSlug: string; pageTitle: string }
  | { type: 'section'; pageSlug: string; pageTitle: string; sectionId: string; sectionRole?: string; shared?: boolean }
  | { type: 'template'; templateSlug: string; templateLabel: string }
```

Stored as `context?: TaskContextItem[]` on both `Task` and `Message`. Array supports multiple attachments. `undefined` means no context (sidebar tasks, follow-up messages without explicit context).

No DB migration needed — Dexie stores extra properties on non-indexed fields automatically.

## Where context is created

### From Canvas (`CanvasScreen.vue`)

- **Page tasks** (`sendTask`): Clicking a page node and typing a message creates `[{ type: 'page', pageSlug, pageTitle }]`
- **Section tasks** (`onSectionTask`): Entering section view and clicking a section creates `[{ type: 'section', ... }]` with `shared` flag looked up from site content

### From chat input (`InputChat.vue`)

The **+** (Attach) button opens a FlyoutMenu with:
- **Current page** — one-click shortcut for whichever page is in the browser preview
- **Add page...** — submenu listing all site pages
- **Add template...** — submenu listing WP templates
- **Upload file...** — native file picker (prototype stub)

Multiple items can be attached. Each appears as a removable chip above the textarea. Context is emitted with the message on send and cleared after.

### Default context

On the first message of a new task, if no context was manually attached, the current page is auto-included (`SitePage.vue` → `onSend`).

## How context flows

```
User attaches context (Canvas or chat input)
  ↓
createTask({ context }) + sendMessage(taskId, text, context)
  ↓
Task.context — drives preview navigation + AI system prompt
Message.context — drives chat chip display + API message hints
  ↓
buildSystemPrompt(content, task.context) — full HTML/CSS for focused areas
  ↓
API message history — [Context: Page "About" (/about)] prepended to user content
```

## AI system prompt behavior

`buildSystemPrompt(content, context?)` in `src/data/ai-tools.ts`:

- **Without context**: All pages/sections get 80-char text previews (existing behavior)
- **With context**: Focused pages get **full HTML + CSS** for every section. Focused sections get full content individually. A `## Focus` header tells the AI what the user is working on. Non-focused pages keep 80-char previews.
- Shared sections are flagged with `(shared — changes apply site-wide)` in the focus area

## Preview navigation

`SitePage.vue` watches `selectedTaskId`. When a task is selected, the browser preview navigates to the first page/section context item's `pageSlug`. Template context has no page — preview stays on current page.

## Chat UI

`ChatMessage.vue` renders context chips above user messages:
- **Page**: page icon + title + slug in muted mono
- **Section**: section icon + ID + "on" + page title, with "(shared)" badge
- **Template**: template icon + label

`ChatMessageList.vue` passes `msg.context` through to each ChatMessage.

---

# AI Tools

All tools defined in `src/data/ai-tools.ts`, executed in `src/data/ai-tool-executor.ts`, mutations in `src/data/useSiteDocument.ts`.

## Write tools

| Tool | Description | Executor |
|------|-------------|----------|
| `update_section` | Update HTML/CSS of an existing section | `updateSection()` |
| `create_section` | Add a new section to a page | `createSection()` |
| `remove_section` | Remove a section (blocks shared sections) | `removeSection()` |
| `reorder_sections` | Reorder sections on a page | `reorderSections()` |
| `update_theme` | Change CSS custom properties (partial updates) | `updateTheme()` |
| `add_page` | Create a new page | `addPage()` |
| `remove_page` | Delete a page | `removePage()` |
| `update_page` | Rename a page (change title and/or slug) | `updatePage()` |
| `restore_revision` | Restore site to a previous revision snapshot | Replaces content via `_setContentForKey` |

## Read tools

| Tool | Description |
|------|-------------|
| `get_section` | Returns full HTML, CSS, role, shared flag for a section |
| `get_page` | Returns page structure with all section IDs, roles, shared flags |
| `get_revision_history` | Lists recent revisions for the current task (id, label, timestamp, change count) |

Read tools return `{ change: null }` — no preview sync, no revision tracking.

## Tool execution flow

In `useTasks.ts` → `sendToAI()`:

1. System prompt rebuilt each loop iteration with fresh content + task context
2. AI streams response with tool calls
3. Each tool call executed via `executeToolCall(branchKey, name, input, id, taskId)`
4. Write tools → preview sync via `usePreviewSync` + tracked in `turnChangeRecords`
5. After message persists, if changes occurred → `createRevision()` snapshots current state
6. If AI continues (tool_use stop reason) → loop back to step 1

## Revision system

- `useRevisions.ts` — creates snapshots after AI turns with changes
- One revision per AI turn (one turn with 5 tool calls = one revision)
- AI can read revisions via `get_revision_history` and restore via `restore_revision`
- UI access: `TaskRevisions.vue` (per-task dropdown), `SiteTimeline.vue` (site-wide timeline)

---

# Merge system

When a task is merged (`useBranches.ts` → `applyMerge`):
1. Three-way merge: base (fork point) vs. main vs. task
2. Conflicts shown in `MergeConflictModal` for user resolution
3. Main content overwritten with merged result
4. Task re-forked from updated main for continued work
5. A merge message is posted to the task's chat showing "Merged N changes to main site"

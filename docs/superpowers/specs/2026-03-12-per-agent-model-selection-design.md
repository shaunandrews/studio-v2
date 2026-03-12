# Per-Agent Model Selection

## Problem

Users can pick an agent in the chat input but have no way to select which model they're using. Available models vary by agent.

## Design

### Data: Agent models

Add `models` array to the `Agent` type. First model is the default.

```ts
// types.ts
export interface AgentModel {
  id: string
  label: string
}

// Agent type addition:
models?: AgentModel[]
```

Per-agent model assignments in `agents.ts`:

| Agent | Models |
|-------|--------|
| Kit (wpcom) | Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5 |
| Claude Code | Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5 |
| Codex | GPT-4.1, o3, o4-mini |
| Cursor | Claude Sonnet 4.6, GPT-4.1, Gemini 2.5 Pro |
| OpenCode | Claude Sonnet 4.6, GPT-4.1, Gemini 2.5 Pro |

Selected model persisted per-agent in localStorage (key: `model-for-{agentId}`). Falls back to first model in array.

### FlyoutMenu changes

1. **Clickable parent items**: Remove `if (item.children?.length) return` guard in `onItemClick`. Parent items fire their action and close the menu.
2. **Submenu check marks**: Add `checked` property support to submenu item rendering, matching the parent item pattern (check icon with visibility toggle).

### InputChat changes

- `selectedModelId` ref tracked alongside `selectedAgentId`.
- `agentMenuGroups` builds each installed agent with `children` from its `models` array. Each child has `checked` on the active model, `action` sets both agent and model.
- Parent item `action` sets the agent using last-used or default model.
- ContextRing `model` prop reads from selected model label (no longer hardcoded).
- Picker button label remains agent name only.

### Out of scope

- No changes to conversations, messages, or AI service — purely UI state.
- No changes to PreferencesModal default model setting.

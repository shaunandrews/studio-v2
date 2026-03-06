import type { Agent } from './types'

export const agents: Agent[] = [
  {
    id: 'codex',
    label: 'Codex',
    description: 'OpenAI\'s terminal agent. Code generation and shell commands.',
    icon: '/icons/codex-outline.svg',
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    description: 'Anthropic\'s coding agent. Builds features, fixes bugs, refactors code.',
    icon: '/icons/claude.svg',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    description: 'AI-powered code editor with deep codebase understanding.',
    icon: '/icons/cursor.svg',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    description: 'Open-source coding agent. Supports multiple LLM providers.',
    icon: '/icons/opencode.svg',
  },
  // Legacy agents (kept for backward compat with seed data)
  {
    id: 'assistant',
    label: 'Site Assistant',
    description: 'General WordPress help — content, settings, plugins, troubleshooting.',
  },
  {
    id: 'code',
    label: 'Code Agent',
    description: 'Theme and plugin development, custom code, PHP/JS/CSS.',
  },
  {
    id: 'design',
    label: 'Design Agent',
    description: 'Visual design, layout, typography, colors, block styling.',
  },
]

/** The coding agents available for the task input picker (order matches menu) */
const codingAgentOrder = ['codex', 'claude-code', 'cursor', 'opencode']
export const codingAgents: Agent[] = codingAgentOrder
  .map(id => agents.find(a => a.id === id)!)
  .filter(Boolean)

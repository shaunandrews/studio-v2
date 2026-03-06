import type { Agent } from './types'

export const agents: Agent[] = [
  {
    id: 'wpcom',
    label: 'WordPress.com',
    description: 'The default agent. Site editing, content, plugins, and settings.',
    icon: '/icons/wpcom.svg',
    installed: true,
  },
  {
    id: 'codex',
    label: 'Codex',
    description: 'OpenAI\'s terminal agent. Code generation and shell commands via the CLI.',
    icon: '/icons/codex-outline.svg',
    url: 'https://openai.com/index/introducing-codex/',
    installHint: 'Install via npm: npm install -g @openai/codex',
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    description: 'Anthropic\'s coding agent. Builds features, fixes bugs, and refactors across your codebase.',
    icon: '/icons/claude.svg',
    url: 'https://docs.anthropic.com/en/docs/claude-code',
    installHint: 'Install via npm: npm install -g @anthropic-ai/claude-code',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    description: 'AI-powered code editor with deep codebase understanding and inline editing.',
    icon: '/icons/cursor.svg',
    url: 'https://cursor.com',
    installHint: 'Download the Cursor editor from cursor.com',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    description: 'Open-source coding agent. Supports multiple LLM providers and runs in the terminal.',
    icon: '/icons/opencode.svg',
    url: 'https://github.com/opencode-ai/opencode',
    installHint: 'Install via npm: npm install -g opencode',
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
const codingAgentOrder = ['wpcom', 'codex', 'claude-code', 'cursor', 'opencode']
export const codingAgents: Agent[] = codingAgentOrder
  .map(id => agents.find(a => a.id === id)!)
  .filter(Boolean)

/** Built-in agent (always installed) */
export const builtInAgent: Agent = agents.find(a => a.id === 'wpcom')!

/** Third-party ACP agents */
export const thirdPartyAgents: Agent[] = ['codex', 'claude-code', 'cursor', 'opencode']
  .map(id => agents.find(a => a.id === id)!)
  .filter(Boolean)

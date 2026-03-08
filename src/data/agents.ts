import { reactive } from 'vue'
import type { Agent } from './types'

const INSTALLED_KEY = 'installed-agents'

function getInstalledIds(): Set<string> {
  try {
    const stored = localStorage.getItem(INSTALLED_KEY)
    return new Set(stored ? JSON.parse(stored) : ['wpcom'])
  } catch {
    return new Set(['wpcom'])
  }
}

function saveInstalledIds(ids: Set<string>) {
  localStorage.setItem(INSTALLED_KEY, JSON.stringify([...ids]))
}

const installedIds = getInstalledIds()

export const agents: Agent[] = reactive([
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
    installed: installedIds.has('codex'),
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    description: 'Anthropic\'s coding agent. Builds features, fixes bugs, and refactors across your codebase.',
    icon: '/icons/claude.svg',
    url: 'https://docs.anthropic.com/en/docs/claude-code',
    installHint: 'Install via npm: npm install -g @anthropic-ai/claude-code',
    installed: installedIds.has('claude-code'),
  },
  {
    id: 'cursor',
    label: 'Cursor',
    description: 'AI-powered code editor with deep codebase understanding and inline editing.',
    icon: '/icons/cursor.svg',
    url: 'https://cursor.com',
    installHint: 'Download the Cursor editor from cursor.com',
    installed: installedIds.has('cursor'),
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    description: 'Open-source coding agent. Supports multiple LLM providers and runs in the terminal.',
    icon: '/icons/opencode.svg',
    url: 'https://github.com/opencode-ai/opencode',
    installHint: 'Install via npm: npm install -g opencode',
    installed: installedIds.has('opencode'),
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
])

/** Install an agent (fake async flow) */
export function installAgent(id: string): Promise<void> {
  const agent = agents.find(a => a.id === id)
  if (!agent) return Promise.resolve()

  return new Promise((resolve) => {
    setTimeout(() => {
      agent.installed = true
      const ids = getInstalledIds()
      ids.add(id)
      saveInstalledIds(ids)
      resolve()
    }, 2000)
  })
}

/** The coding agents available for the task input picker (order matches menu) */
const codingAgentOrder = ['wpcom', 'codex', 'claude-code', 'cursor', 'opencode']
export const codingAgents = agents.filter(a => codingAgentOrder.includes(a.id))

/** Built-in agent (always installed) */
export const builtInAgent: Agent = agents.find(a => a.id === 'wpcom')!

/** Third-party ACP agents */
export const thirdPartyAgents = agents.filter(a =>
  codingAgentOrder.includes(a.id) && a.id !== 'wpcom'
)

export type SiteStatus = 'running' | 'stopped' | 'loading'

export type MockLayout = 'cafe' | 'portfolio' | 'blog' | 'store' | 'landing' | 'docs' | 'gallery'

export type ThemeType = 'block' | 'classic'

export interface Site {
  id: string
  name: string
  favicon?: string
  status: SiteStatus
  url: string
  createdAt: string
  description?: string
  mockLayout?: MockLayout
  themeType?: ThemeType
  features?: string[]
  pipeline?: PipelineStage[]
}

export type EnvironmentType = 'staging' | 'qa' | 'review' | 'production' | 'custom'

export interface ConnectedSite {
  id: string
  name: string
  url: string
  provider: 'wpcom' | 'pressable'
  lastPullAt?: string
  lastPushAt?: string
}

export interface DeployedCommit {
  sha: string
  message: string
  author: string
  timestamp: string
}

export interface PipelineStage {
  id: string
  label: string
  environment: EnvironmentType
  site?: ConnectedSite
  order: number
  branch?: string
  deployedCommit?: DeployedCommit
  aheadCount?: number
}

export type AgentId = 'wpcom' | 'claude-code' | 'codex' | 'cursor' | 'opencode' | 'assistant' | 'code' | 'design'

export interface Agent {
  id: AgentId
  label: string
  description: string
  icon?: string
  avatar?: string
  installed?: boolean
  url?: string
  installHint?: string
}

export interface Conversation {
  id: string
  siteId: string | null
  agentId: AgentId
  title?: string
  createdAt: string
  archived?: boolean
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'agent'
  agentId?: AgentId
  content: string
  timestamp: string
}

// --- Previews ---

export type PreviewStatus = 'creating' | 'active' | 'expired' | 'deleted'

export interface PreviewInvite {
  email: string
  sentAt: string
  visitedAt?: string
}

export interface PreviewSite {
  id: string
  siteId: string
  name: string
  url: string
  createdAt: string
  updatedAt: string
  status: PreviewStatus
  note?: string
  views: number
  uniqueVisitors: number
  lastVisitedAt?: string
  invites: PreviewInvite[]
}

export type PreviewOperationType = 'create' | 'update' | 'delete'

export interface PreviewOperation {
  id: string
  type: PreviewOperationType
  previewId?: string
  siteId: string
  progress: number
  detail: string
  status: 'pending' | 'fulfilled' | 'rejected'
  error?: string
}

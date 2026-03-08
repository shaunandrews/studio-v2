export type SiteStatus = 'running' | 'stopped' | 'loading'

export type MockLayout = 'cafe' | 'portfolio' | 'blog'

export interface Site {
  id: string
  name: string
  favicon: string
  status: SiteStatus
  url: string
  createdAt: string
  description?: string
  mockLayout?: MockLayout
  pipeline?: PipelineStage[]
  repo?: GitRepo
  localGit?: LocalGitState
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

export interface GitRepo {
  provider: 'github' | 'gitlab' | 'bitbucket'
  owner: string
  name: string
  defaultBranch: string
  url: string
}

export interface LocalGitState {
  branch: string
  uncommittedChanges: number
  latestCommit?: DeployedCommit
  aheadOfStaging?: number
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
  content: ContentBlock[]
  messageContext?: MessageContext
  timestamp: string
}

export interface MessageContext {
  source: 'typed' | 'action'
  actionId?: string
  cardRef?: string
  payload?: Record<string, string>
}

export type CardUiState = 'default' | 'loading' | 'complete' | 'error' | 'disabled'

export interface ActionButton {
  id: string
  label: string
  variant?: 'primary' | 'secondary' | 'destructive'
  icon?: any
  card?: {
    style: Record<string, string>
    content: string
  }
  action: {
    type: 'send-message'
    message: string
    cardRef?: string
    payload?: Record<string, string>
  }
}

interface BaseCardBlock {
  type: 'card'
  id?: string
  state?: CardUiState
  compact?: boolean
}

export type CardBlock =
  | (BaseCardBlock & { card: 'plugin'; data: PluginCardData })
  | (BaseCardBlock & { card: 'settings'; data: SettingsCardData })
  | (BaseCardBlock & { card: 'progress'; data: ProgressCardData })
  | (BaseCardBlock & { card: 'page'; data: PageCardData })
  | (BaseCardBlock & { card: 'postDraft'; data: PostDraftCardData })

export type ContentBlock =
  | { type: 'text'; text: string }
  | CardBlock
  | { type: 'actions'; actions: ActionButton[] }

export interface PluginCardData {
  name: string
  slug: string
  description: string
  icon?: string
  rating?: number
  activeInstalls?: string
  status: 'available' | 'installing' | 'installed' | 'active' | 'error'
  action?: ActionButton
}

export interface SettingsCardData {
  label: string
  settings: { key: string; current: string; proposed: string }[]
  actions?: ActionButton[]
}

export interface ProgressCardData {
  label: string
  steps: { name: string; status: 'pending' | 'running' | 'done' | 'error' }[]
}

export interface PageCardData {
  title: string
  slug: string
  template?: string
  status: 'draft' | 'published' | 'scheduled'
  excerpt?: string
  actions?: ActionButton[]
}

export interface PostDraftCardData {
  title: string
  excerpt: string
  categories?: string[]
  tags?: string[]
  featuredImage?: string
  status: 'draft' | 'pending' | 'published'
  actions?: ActionButton[]
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

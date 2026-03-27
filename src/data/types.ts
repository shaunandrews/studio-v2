export type SiteStatus = 'running' | 'stopped' | 'loading'

export type MockLayout = 'default' | 'cafe' | 'portfolio' | 'blog' | 'store' | 'landing' | 'docs' | 'gallery'

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
  sortOrder?: number
  features?: string[]
  pipeline?: PipelineStage[]
  skillOverrides?: Record<string, 'enabled' | 'disabled'>
  // Admin credentials
  adminEmail?: string
  adminUsername?: string
  adminPassword?: string
  // Server-config settings (require restart to apply)
  phpVersion?: string
  wpVersion?: string
  useCustomDomain?: boolean
  customDomain?: string
  xdebug?: boolean
  debugLog?: boolean
  showErrors?: boolean
}

export type EnvironmentType = 'staging' | 'qa' | 'review' | 'production' | 'custom'

interface ConnectedSite {
  id: string
  name: string
  url: string
  provider: 'wpcom' | 'pressable'
  lastPullAt?: string
  lastPushAt?: string
}

interface DeployedCommit {
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

export type AgentId = 'wpcom' | 'claude-code' | 'codex' | 'cursor' | 'opencode'

interface AgentModel {
  id: string
  label: string
}

export interface Agent {
  id: AgentId
  label: string
  description: string
  icon?: string
  avatar?: string
  installed?: boolean
  url?: string
  installHint?: string
  models?: AgentModel[]
}

// --- Task Context ---

export type TaskContextItem =
  | { type: 'page'; pageSlug: string; pageTitle: string }
  | { type: 'section'; pageSlug: string; pageTitle: string; sectionId: string; sectionRole?: string; shared?: boolean }
  | { type: 'template'; templateSlug: string; templateLabel: string }

export type ToolCallStatus = 'running' | 'done' | 'error' | 'reverted'

export interface ToolCall {
  id: string
  label: string            // Human-readable: "Installed Jetpack plugin"
  status: ToolCallStatus
  toolName?: string        // Technical name: "install_plugin" (shown on expand)
  args?: string            // Displayed in detail: 'slug: "jetpack"'
  result?: string          // Success detail: "Jetpack 14.3 installed and activated"
  error?: string           // Error detail: "STRIPE_API_KEY not found"
  code?: string            // Code output shown in expandable detail (streams when running)
  changeId?: string        // Links to undoable Change in useSiteContent
}

interface TaskWorktree {
  branch: string
  port: number
}

export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'merged'

export interface Task {
  id: string
  siteId: string
  agentId: AgentId
  title?: string
  createdAt: string
  updatedAt: string
  status: TaskStatus
  skipReview?: boolean
  archived?: boolean
  unread?: boolean
  worktree?: TaskWorktree
  context?: TaskContextItem[]
}

export interface Message {
  id: string
  taskId: string
  role: 'user' | 'agent'
  agentId?: AgentId
  content: string
  toolCalls?: ToolCall[]   // Rendered inline above text content
  context?: TaskContextItem[]
  timestamp: string
}

// --- Previews ---

type PreviewStatus = 'creating' | 'active' | 'expired' | 'deleted'

interface PreviewInvite {
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

// --- Wpcom Sites ---

export interface WpcomSite {
  id: string
  name: string
  url: string
  provider: 'wpcom' | 'pressable'
  environmentType: 'production' | 'staging' | 'development'
  status: 'syncable' | 'already-connected' | 'needs-upgrade' | 'needs-transfer' | 'missing-permissions'
}

// --- Personas ---

export interface AuthUser {
  name: string
  email: string
  avatar: string
}

export interface Persona {
  id: string
  name: string
  description: string
  icon: string
  auth: AuthUser | null
  onboardingCompleted: boolean
  sites: Site[]
  tasks: Task[]
  messages: Message[]
  previews: PreviewSite[]
  wpcomSites: WpcomSite[]
}

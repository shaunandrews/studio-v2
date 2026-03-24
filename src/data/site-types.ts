export interface SiteContentTheme {
  fonts: string[]
  variables: Record<string, string>
  darkVariables?: Record<string, string>
}

export interface SiteContentPage {
  slug: string
  title: string
  sections: string[]
}

export interface SiteContentSection {
  id: string
  html: string
  css: string
  role?: string
}

// The content-rich site type (pages, sections, theme).
// Re-exported as `Site` for backward compat with site-renderer.ts import.
export interface SiteDocument {
  name: string
  theme: SiteContentTheme
  pages: SiteContentPage[]
  sections: Record<string, SiteContentSection>
}

// Backward-compat alias — site-renderer.ts does `import type { Site } from './site-types'`
export type Site = SiteDocument

export interface SiteContent extends SiteDocument {
  siteId: string
}

export interface Change {
  id: string
  siteId: string
  toolCallId?: string
  toolName: string
  label: string
  timestamp: string
  undo: () => void
}

export interface RevisionChange {
  toolCallId: string
  toolName: string
  label: string
}

export interface Revision {
  id: string
  siteId: string
  taskId: string
  messageId: string
  changes: RevisionChange[]
  label: string
  snapshot: SiteContent
  timestamp: string
}

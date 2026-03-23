import type { Task, Message } from './types'

export const seedTasks: Task[] = [
  // Arlo Writes
  { id: 'blog-assistant-1', siteId: 'arlo-blog', agentId: 'wpcom', title: 'Hero section redesign', createdAt: '2026-02-12T10:00:00Z', updatedAt: '2026-02-12T10:02:30Z', unread: true, worktree: { branch: 'task/hero-section-redesign', port: 3941 } },
  { id: 'blog-code-1', siteId: 'arlo-blog', agentId: 'wpcom', title: 'Project showcase block', createdAt: '2026-02-11T14:00:00Z', updatedAt: '2026-02-11T14:01:30Z', worktree: { branch: 'task/project-showcase-block', port: 3942 } },

  // Downstreet Cafe
  { id: 'cafe-onboarding', siteId: 'downstreet-cafe', agentId: 'wpcom', title: 'Setting up Downstreet Cafe', createdAt: '2026-02-24T10:00:00Z', updatedAt: '2026-02-24T10:10:45Z', worktree: { branch: 'task/setting-up-downstreet-cafe', port: 3951 } },
  { id: 'cafe-hero-tweak', siteId: 'downstreet-cafe', agentId: 'wpcom', title: 'Homepage hero updates', createdAt: '2026-02-25T09:00:00Z', updatedAt: '2026-02-25T09:01:02Z', worktree: { branch: 'task/homepage-hero-updates', port: 3952 } },
  { id: 'cafe-photos', siteId: 'downstreet-cafe', agentId: 'wpcom', title: 'Menu photo updates', createdAt: '2026-02-26T14:00:00Z', updatedAt: '2026-02-26T14:03:28Z', worktree: { branch: 'task/menu-photo-updates', port: 3953 } },
  { id: 'cafe-reservations', siteId: 'downstreet-cafe', agentId: 'wpcom', title: 'Online reservations', createdAt: '2026-02-27T11:00:00Z', updatedAt: '2026-02-27T11:04:50Z', worktree: { branch: 'task/online-reservations', port: 3954 } },
  { id: 'cafe-seo', siteId: 'downstreet-cafe', agentId: 'wpcom', title: 'SEO & analytics setup', createdAt: '2026-02-28T10:00:00Z', updatedAt: '2026-02-28T10:04:17Z', worktree: { branch: 'task/seo-analytics-setup', port: 3955 } },
  { id: 'cafe-events', siteId: 'downstreet-cafe', agentId: 'wpcom', title: 'Events page', createdAt: '2026-03-03T13:00:00Z', updatedAt: '2026-03-03T13:04:22Z', unread: true, worktree: { branch: 'task/events-page', port: 3956 } },

  // Studio Meridian
  { id: 'portfolio-onboarding', siteId: 'portfolio', agentId: 'wpcom', title: 'Setting up Studio Meridian', createdAt: '2026-01-20T09:00:00Z', updatedAt: '2026-01-20T09:06:00Z', worktree: { branch: 'task/setting-up-studio-meridian', port: 3961 } },
  { id: 'portfolio-assistant-1', siteId: 'portfolio', agentId: 'wpcom', title: 'Oura case study', createdAt: '2026-02-15T14:00:00Z', updatedAt: '2026-02-15T14:03:30Z', worktree: { branch: 'task/oura-case-study', port: 3962 } },

  // Wild Lens
  { id: 'records-design-1', siteId: 'wild-lens', agentId: 'wpcom', title: 'Photo gallery layout', createdAt: '2026-02-05T13:00:00Z', updatedAt: '2026-02-05T13:02:00Z', worktree: { branch: 'task/photo-gallery-layout', port: 3971 } },

  // Thread & Co
  { id: 'mise-assistant-1', siteId: 'thread-and-co', agentId: 'wpcom', title: 'Product card layout', createdAt: '2026-02-08T11:30:00Z', updatedAt: '2026-02-08T11:31:30Z', worktree: { branch: 'task/product-card-layout', port: 3981 } },

  // Launchpad
  { id: 'ledger-assistant-1', siteId: 'launchpad', agentId: 'wpcom', title: 'Landing page template', createdAt: '2026-02-10T09:30:00Z', updatedAt: '2026-02-10T09:31:30Z', worktree: { branch: 'task/landing-page-template', port: 3991 } },
  { id: 'ledger-code-1', siteId: 'launchpad', agentId: 'wpcom', title: 'Signup flow API', createdAt: '2026-02-11T10:00:00Z', updatedAt: '2026-02-11T10:01:30Z', worktree: { branch: 'task/signup-flow-api', port: 3992 } },

  // DevRef
  { id: 'fuego-assistant-1', siteId: 'devref', agentId: 'wpcom', title: 'Setting up the docs', createdAt: '2026-02-14T12:30:00Z', updatedAt: '2026-02-14T12:35:30Z', worktree: { branch: 'task/setting-up-the-docs', port: 3995 } },
]

// Messages — all conversationId renamed to taskId, filtered to only tasks that exist above
export { seedMessages } from './seed-messages'

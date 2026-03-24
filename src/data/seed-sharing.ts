import type { PreviewSite } from './types'

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export const seedPreviews: PreviewSite[] = [
  {
    id: 'prev-cafe-1',
    siteId: 'downstreet-cafe',
    name: 'Preview',
    url: 'downstreet-cafe-warm-heron.wp.build',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3),
    status: 'active',
    views: 0,
    uniqueVisitors: 0,
    invites: [],
  },
  {
    id: 'prev-cafe-2',
    siteId: 'downstreet-cafe',
    name: 'Preview',
    url: 'downstreet-cafe-bold-finch.wp.build',
    createdAt: daysAgo(8),
    updatedAt: daysAgo(6),
    status: 'active',
    note: 'Updated menu for Sarah to review',
    views: 14,
    uniqueVisitors: 3,
    lastVisitedAt: daysAgo(0),
    invites: [
      { email: 'sarah@downstreet.co', sentAt: daysAgo(4), visitedAt: daysAgo(1) },
      { email: 'james@designstudio.com', sentAt: daysAgo(3) },
    ],
  },
  {
    id: 'prev-cafe-3',
    siteId: 'downstreet-cafe',
    name: 'Preview',
    url: 'downstreet-cafe-keen-crane.wp.build',
    createdAt: daysAgo(21),
    updatedAt: daysAgo(10),
    status: 'active',
    views: 10293,
    uniqueVisitors: 3339,
    lastVisitedAt: daysAgo(7),
    invites: [],
  },
  {
    id: 'prev-cafe-4',
    siteId: 'downstreet-cafe',
    name: 'Preview',
    url: 'downstreet-cafe-quiet-owl.wp.build',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(45),
    status: 'active',
    views: 487,
    uniqueVisitors: 82,
    lastVisitedAt: daysAgo(35),
    invites: [],
  },
]

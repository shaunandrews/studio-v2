import type { Site } from './types'

export const seedProjects: Site[] = [
  {
    id: 'downstreet-cafe',
    name: 'Downstreet Café',
    favicon: 'https://api.dicebear.com/9.x/shapes/svg?seed=cafe',
    status: 'running',
    url: 'https://downstreet.cafe',
    createdAt: '2025-11-15T10:00:00Z',
    description: 'A cozy neighborhood coffee shop website.',
    mockLayout: 'cafe',
    repo: {
      provider: 'github',
      owner: 'downstreet-cafe',
      name: 'downstreet-theme',
      defaultBranch: 'main',
      url: 'https://github.com/downstreet-cafe/downstreet-theme',
    },
    localGit: {
      branch: 'feature/menu-redesign',
      uncommittedChanges: 2,
      latestCommit: {
        sha: 'f3a8b21',
        message: 'Add seasonal menu section',
        author: 'shaun',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      aheadOfStaging: 3,
    },
    pipeline: [
      {
        id: 'stage-staging',
        label: 'Staging',
        environment: 'staging',
        order: 1,
        branch: 'staging',
        deployedCommit: {
          sha: 'a1b2c3f',
          message: 'Fix nav spacing',
          author: 'shaun',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        aheadCount: 1,
        site: {
          id: 'ds-staging',
          name: 'Downstreet Café Staging',
          url: 'https://staging.downstreet.cafe',
          provider: 'pressable',
          lastPushAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
      },
      {
        id: 'stage-production',
        label: 'Production',
        environment: 'production',
        order: 2,
        branch: 'main',
        deployedCommit: {
          sha: 'e4d5f6a',
          message: 'v2.1 launch',
          author: 'shaun',
          timestamp: '2026-02-28T16:00:00Z',
        },
        aheadCount: 0,
      },
    ],
  },
  {
    id: 'portfolio',
    name: 'Studio Meridian',
    favicon: 'https://api.dicebear.com/9.x/shapes/svg?seed=meridian',
    status: 'running',
    url: 'https://studiomeridian.com',
    createdAt: '2026-01-20T09:00:00Z',
    description: 'A design studio portfolio.',
    mockLayout: 'portfolio',
  },
]

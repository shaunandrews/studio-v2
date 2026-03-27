export type Screen = 'overview' | 'canvas' | 'tasks' | 'sync' | 'sharing' | 'settings'

export const ROUTE_TO_SCREEN: Record<string, Screen> = {
  'site-overview': 'overview',
  'site-canvas': 'canvas',
  'site-tasks': 'tasks',
  'site-task': 'tasks',
  'site-sync': 'sync',
  'site-sharing': 'sharing',
  'site-settings': 'settings',
}

export const SCREEN_LABELS: Record<Screen, string> = {
  overview: 'Overview',
  canvas: 'Canvas',
  tasks: 'Tasks',
  sync: 'Sync',
  sharing: 'Sharing',
  settings: 'Settings',
}

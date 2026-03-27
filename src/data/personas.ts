import type { Persona } from './types'
import { seedProjects, emptySite } from './seed-sites'
import { seedTasks } from './seed-tasks'
import { seedMessages } from './seed-messages'
import { seedPreviews } from './seed-sharing'
import { seedWpcomSites } from './seed-wpcom-sites'

export const personas: Persona[] = [
  {
    id: 'new-user',
    name: 'New User',
    description: 'First launch. No sites, no account. Goes through onboarding.',
    icon: '👤',
    auth: null,
    onboardingCompleted: false,
    sites: [],
    tasks: [],
    messages: [],
    previews: [],
    wpcomSites: [],
  },
  {
    id: 'single-site',
    name: 'Jamie',
    description: '1 empty site, signed in, just finished onboarding.',
    icon: '👋',
    auth: {
      name: 'Jamie Rivera',
      email: 'jamie@example.com',
      avatar: 'https://gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=64',
    },
    onboardingCompleted: true,
    sites: [emptySite],
    tasks: [],
    messages: [],
    previews: [],
    wpcomSites: [],
  },
  {
    id: 'existing-user',
    name: 'Shaun',
    description: '7 sites, active tasks, fully set up.',
    icon: 'https://gravatar.com/avatar/b7fdd6477cc13ca16e8358a0725bc02c?s=64',
    auth: {
      name: 'Shaun Andrews',
      email: 'shaun@automattic.com',
      avatar: 'https://gravatar.com/avatar/b7fdd6477cc13ca16e8358a0725bc02c?s=64',
    },
    onboardingCompleted: true,
    sites: seedProjects,
    tasks: seedTasks,
    messages: seedMessages,
    previews: seedPreviews,
    wpcomSites: seedWpcomSites,
  },
]

export function getPersona(id: string): Persona | undefined {
  return personas.find(p => p.id === id)
}

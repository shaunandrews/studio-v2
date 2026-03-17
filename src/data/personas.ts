import type { Persona } from './types'
import { seedProjects } from './seed-sites'
import { seedConversations, seedMessages } from './seed-conversations'

export const personas: Persona[] = [
  {
    id: 'new-user',
    name: 'New User',
    description: 'First launch. No sites, no account. Goes through onboarding.',
    icon: '👤',
    auth: null,
    onboardingCompleted: false,
    sites: [],
    conversations: [],
    messages: [],
  },
  {
    id: 'existing-user',
    name: 'Shaun',
    description: '7 sites, active conversations, fully set up.',
    icon: 'https://gravatar.com/avatar/b7fdd6477cc13ca16e8358a0725bc02c?s=64',
    auth: {
      name: 'Shaun Andrews',
      email: 'shaun@automattic.com',
      avatar: 'https://gravatar.com/avatar/b7fdd6477cc13ca16e8358a0725bc02c?s=64',
    },
    onboardingCompleted: true,
    sites: seedProjects,
    conversations: seedConversations,
    messages: seedMessages,
  },
]

export function getPersona(id: string): Persona | undefined {
  return personas.find(p => p.id === id)
}

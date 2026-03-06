import { agents } from './agents'
import type { Agent, AgentId } from './types'

export function useAgents() {
  function getAgent(id: AgentId): Agent | undefined {
    return agents.find(a => a.id === id)
  }

  return {
    agents,
    getAgent,
  }
}

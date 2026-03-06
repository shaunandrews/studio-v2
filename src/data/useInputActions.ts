/**
 * Input Actions Composable
 *
 * Centralizes action buttons (onboarding chips, brief picks, card actions)
 * into a strip above the chat textarea. Actions live here instead of inline
 * in messages or card footers.
 *
 * Module-level singleton (same pattern as useConversations).
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { ActionButton } from './types'

export interface InputActionSet {
  id: string                  // dedup key ('onboarding-type', 'brief-pick')
  conversationId: string
  actions: ActionButton[]
  sourceRef?: string          // which feature produced these
}

// Module-level singleton
const actionSets = ref<InputActionSet[]>([])

export function useInputActions() {
  /** Add or replace an action set (deduped by id) */
  function pushActions(set: InputActionSet): void {
    const idx = actionSets.value.findIndex(s => s.id === set.id)
    if (idx >= 0) {
      actionSets.value[idx] = set
    } else {
      actionSets.value.push(set)
    }
    actionSets.value = [...actionSets.value]
  }

  /** Remove all action sets for a conversation */
  function clearActions(conversationId: string): void {
    actionSets.value = actionSets.value.filter(s => s.conversationId !== conversationId)
  }

  /** Remove action sets matching a sourceRef */
  function clearBySource(sourceRef: string): void {
    actionSets.value = actionSets.value.filter(s => s.sourceRef !== sourceRef)
  }

  /** Flatten all action sets for a conversation into a single ActionButton[] */
  function getActions(conversationId: Ref<string>): ComputedRef<ActionButton[]> {
    return computed(() =>
      actionSets.value
        .filter(s => s.conversationId === conversationId.value)
        .flatMap(s => s.actions)
    )
  }

  return { pushActions, clearActions, clearBySource, getActions }
}

import { ref, computed } from 'vue'

const completed = ref(true)

// Track which onboarding routes have been visited/completed
const visitedWelcome = ref(false)
const visitedAuth = ref(false)
const visitedPermissions = ref(false)

export function useOnboarding() {
  const needsOnboarding = computed(() => !completed.value)

  function markVisited(step: 'welcome' | 'oauth' | 'permissions') {
    if (step === 'welcome') visitedWelcome.value = true
    if (step === 'oauth') visitedAuth.value = true
    if (step === 'permissions') visitedPermissions.value = true
  }

  function canAccess(step: 'welcome' | 'oauth' | 'permissions'): boolean {
    if (step === 'welcome') return true
    if (step === 'oauth') return visitedWelcome.value
    if (step === 'permissions') return visitedWelcome.value
    return false
  }

  function complete() {
    completed.value = true
  }

  function reset(isCompleted: boolean) {
    completed.value = isCompleted
    visitedWelcome.value = false
    visitedAuth.value = false
    visitedPermissions.value = false
  }

  return {
    completed,
    needsOnboarding,
    visitedWelcome,
    visitedAuth,
    visitedPermissions,
    markVisited,
    canAccess,
    complete,
    reset,
  }
}

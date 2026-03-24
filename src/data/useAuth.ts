import { ref, computed } from 'vue'
import type { AuthUser } from './types'

const user = ref<AuthUser | null>(null)

export function useAuth() {
  const isAuthenticated = computed(() => user.value !== null)

  function login(authUser: AuthUser) {
    user.value = { ...authUser }
  }

  function reset(authUser: AuthUser | null) {
    user.value = authUser ? { ...authUser } : null
  }

  return {
    user,
    isAuthenticated,
    login,
    reset,
  }
}

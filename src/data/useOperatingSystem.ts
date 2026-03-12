import { ref, computed } from 'vue'

export type OSMode = 'macos' | 'windows'
const OS_KEY = 'os-mode'

function getStoredOS(): OSMode {
  return (localStorage.getItem(OS_KEY) as OSMode) || 'macos'
}

function applyOS(mode: OSMode) {
  document.documentElement.setAttribute('data-os', mode)
}

const os = ref<OSMode>(getStoredOS())

// Apply on load
applyOS(os.value)

export function useOperatingSystem() {
  const isMac = computed(() => os.value === 'macos')
  const isWindows = computed(() => os.value === 'windows')
  const mod = computed(() => isMac.value ? '⌘' : 'Ctrl+')
  const modKey = computed(() => isMac.value ? '⌘' : 'Ctrl')

  function setOS(mode: OSMode) {
    os.value = mode
    localStorage.setItem(OS_KEY, mode)
    applyOS(mode)
  }

  return { os, isMac, isWindows, mod, modKey, setOS }
}

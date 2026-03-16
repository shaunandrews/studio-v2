import { ref } from 'vue'

type SettingsTab = 'general' | 'agents' | 'skills' | 'account'

const isOpen = ref(false)
const initialTab = ref<SettingsTab>('general')

export function useSettings() {
  function openSettings(tab?: SettingsTab) {
    initialTab.value = tab || 'general'
    isOpen.value = true
  }

  function closeSettings() {
    isOpen.value = false
    initialTab.value = 'general'
  }

  return {
    isSettingsOpen: isOpen,
    settingsTab: initialTab,
    openSettings,
    closeSettings,
  }
}

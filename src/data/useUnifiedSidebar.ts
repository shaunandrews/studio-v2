import { ref, watch } from 'vue'

const STORAGE_KEY = 'proto-unified-sidebar'
const enabled = ref(localStorage.getItem(STORAGE_KEY) !== 'false')

watch(enabled, (v) => {
  localStorage.setItem(STORAGE_KEY, String(v))
})

export function useUnifiedSidebar() {
  return { unifiedSidebar: enabled }
}

import { ref, watch } from 'vue'

const STORAGE_KEY = 'sidebar-hidden'

const hidden = ref<boolean>(
  localStorage.getItem(STORAGE_KEY) === 'true'
)

watch(hidden, (val) => {
  localStorage.setItem(STORAGE_KEY, String(val))
})

export function useSidebarCollapse() {
  function toggle() { hidden.value = !hidden.value }
  function hide() { hidden.value = true }
  function show() { hidden.value = false }

  return { hidden, toggle, hide, show }
}

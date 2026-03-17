import { ref, computed } from 'vue'
import { useSites } from '@/data/useSites'

const isAddingSite = ref(false)

export function useAddSite() {
  const { sites } = useSites()

  const shouldShowAddSite = computed(() => isAddingSite.value || sites.value.length === 0)
  const hasSites = computed(() => sites.value.length > 0)

  function openAddSite() {
    isAddingSite.value = true
  }

  function closeAddSite() {
    isAddingSite.value = false
  }

  function resetAddSite() {
    isAddingSite.value = false
  }

  return { isAddingSite, shouldShowAddSite, hasSites, openAddSite, closeAddSite, resetAddSite }
}

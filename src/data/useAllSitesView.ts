import { ref } from 'vue'

const ALL_SITES_KEY = 'pref-show-all-sites'

const showAllSitesView = ref(localStorage.getItem(ALL_SITES_KEY) !== 'false')

export function useAllSitesView() {
  function setShowAllSites(val: boolean) {
    showAllSitesView.value = val
    localStorage.setItem(ALL_SITES_KEY, String(val))
  }

  return {
    showAllSitesView,
    setShowAllSites,
  }
}

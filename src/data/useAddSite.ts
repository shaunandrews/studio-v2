import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Blueprint } from '@/components/features/add-site/BlueprintPicker.vue'
import type { RemoteSite } from '@/components/features/add-site/PullSitePicker.vue'
import type { SelectedFile } from '@/components/features/add-site/ImportDropZone.vue'

export type AddSitePath = 'blank' | 'blueprint' | 'pull' | 'import'

// Shared state across route transitions
const currentPath = ref<AddSitePath | null>(null)
const selectedBlueprint = ref<Blueprint | null>(null)
const selectedRemoteSite = ref<RemoteSite | null>(null)
const selectedFile = ref<SelectedFile | null>(null)

export function useAddSite() {
  const router = useRouter()

  function openAddSite() {
    resetState()
    router.push('/add-site')
  }

  function closeAddSite() {
    resetState()
    router.push('/all-sites')
  }

  function resetState() {
    currentPath.value = null
    selectedBlueprint.value = null
    selectedRemoteSite.value = null
    selectedFile.value = null
  }

  function choosePath(path: AddSitePath) {
    currentPath.value = path
    if (path === 'blank') {
      router.push('/add-site/details')
    } else {
      router.push(`/add-site/${path}`)
    }
  }

  function goToDetails() {
    router.push('/add-site/details')
  }

  function initialName(): string | undefined {
    if (currentPath.value === 'blueprint' && selectedBlueprint.value) return selectedBlueprint.value.title
    if (currentPath.value === 'pull' && selectedRemoteSite.value) return selectedRemoteSite.value.name
    return undefined
  }

  return {
    currentPath,
    selectedBlueprint,
    selectedRemoteSite,
    selectedFile,
    openAddSite,
    closeAddSite,
    resetAddSite: resetState,
    choosePath,
    goToDetails,
    initialName,
  }
}

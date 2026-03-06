import { ref, computed, type Ref } from 'vue'

export type ImportPhase = 'idle' | 'importing' | 'done' | 'error'
export type ExportPhase = 'idle' | 'exporting' | 'done' | 'error'

interface ImportState {
  phase: ImportPhase
  progress: number
  statusMessage: string
  fileName: string
}

interface ExportState {
  phase: ExportPhase
  progress: number
  statusMessage: string
  exportType: 'full' | 'database'
}

const ACCEPTED_FILE_TYPES = ['.zip', '.gz', '.gzip', '.tar', '.tar.gz', '.wpress', '.sql']

// Module-level singleton state
const importStates = ref<Record<string, ImportState>>({})
const exportStates = ref<Record<string, ExportState>>({})

const importMessages = [
  { progress: 5, message: 'Extracting backup...' },
  { progress: 25, message: 'Extracting backup...' },
  { progress: 50, message: 'Extracting backup...' },
  { progress: 60, message: 'Importing database...' },
  { progress: 70, message: 'Importing database...' },
  { progress: 80, message: 'Importing WordPress content...' },
  { progress: 90, message: 'Importing plugins and themes...' },
  { progress: 100, message: 'Import complete!' },
]

const exportFullMessages = [
  { progress: 10, message: 'Creating backup...' },
  { progress: 30, message: 'Backing up files...' },
  { progress: 50, message: 'Backing up files...' },
  { progress: 70, message: 'Exporting database...' },
  { progress: 90, message: 'Compressing archive...' },
  { progress: 100, message: 'Export complete! File saved to ~/Downloads' },
]

const exportDbMessages = [
  { progress: 20, message: 'Exporting database...' },
  { progress: 50, message: 'Exporting database...' },
  { progress: 80, message: 'Writing SQL file...' },
  { progress: 100, message: 'Database exported! File saved to ~/Downloads' },
]

function simulateProgress(
  steps: { progress: number; message: string }[],
  onStep: (progress: number, message: string) => void,
  onDone: () => void,
) {
  let i = 0
  const tick = () => {
    if (i >= steps.length) {
      onDone()
      return
    }
    const step = steps[i]
    onStep(step.progress, step.message)
    i++
    setTimeout(tick, 400 + Math.random() * 600)
  }
  setTimeout(tick, 300)
}

export function useImportExport(projectId: Ref<string | null>) {
  const importState = computed(() =>
    projectId.value ? importStates.value[projectId.value] ?? null : null
  )
  const exportState = computed(() =>
    projectId.value ? exportStates.value[projectId.value] ?? null : null
  )

  const isImporting = computed(() => importState.value?.phase === 'importing')
  const isExporting = computed(() => exportState.value?.phase === 'exporting')
  const isImportDone = computed(() => importState.value?.phase === 'done')
  const isExportDone = computed(() => exportState.value?.phase === 'done')

  function isValidFile(fileName: string): boolean {
    const lower = fileName.toLowerCase()
    return ACCEPTED_FILE_TYPES.some(ext => lower.endsWith(ext))
  }

  function startImport(fileName: string) {
    const id = projectId.value
    if (!id || isImporting.value || isExporting.value) return

    importStates.value[id] = {
      phase: 'importing',
      progress: 0,
      statusMessage: 'Preparing import...',
      fileName,
    }

    simulateProgress(
      importMessages,
      (progress, message) => {
        if (importStates.value[id]) {
          importStates.value[id].progress = progress
          importStates.value[id].statusMessage = message
        }
      },
      () => {
        if (importStates.value[id]) {
          importStates.value[id].phase = 'done'
        }
      },
    )
  }

  function startExport(type: 'full' | 'database') {
    const id = projectId.value
    if (!id || isImporting.value || isExporting.value) return

    exportStates.value[id] = {
      phase: 'exporting',
      progress: 0,
      statusMessage: 'Preparing export...',
      exportType: type,
    }

    const steps = type === 'full' ? exportFullMessages : exportDbMessages

    simulateProgress(
      steps,
      (progress, message) => {
        if (exportStates.value[id]) {
          exportStates.value[id].progress = progress
          exportStates.value[id].statusMessage = message
        }
      },
      () => {
        if (exportStates.value[id]) {
          exportStates.value[id].phase = 'done'
        }
      },
    )
  }

  function clearImport() {
    const id = projectId.value
    if (id) delete importStates.value[id]
  }

  function clearExport() {
    const id = projectId.value
    if (id) delete exportStates.value[id]
  }

  return {
    importState,
    exportState,
    isImporting,
    isExporting,
    isImportDone,
    isExportDone,
    isValidFile,
    startImport,
    startExport,
    clearImport,
    clearExport,
    ACCEPTED_FILE_TYPES,
  }
}

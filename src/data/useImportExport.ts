import { ref, computed, type Ref } from 'vue'

export type ImportPhase = 'idle' | 'confirm' | 'importing' | 'done' | 'error'
export type ExportPhase = 'idle' | 'exporting' | 'done' | 'error'

interface ImportState {
  phase: ImportPhase
  progress: number
  statusMessage: string
  fileName: string
  fileSize: number
  currentStage: number
}

interface ExportState {
  phase: ExportPhase
  progress: number
  statusMessage: string
  exportType: 'full' | 'database'
  currentStage: number
}

const ACCEPTED_FILE_TYPES = ['.zip', '.gz', '.gzip', '.tar', '.tar.gz', '.wpress', '.sql']

const IMPORT_STAGES = [
  { label: 'Extracting', key: 'extract' },
  { label: 'Database', key: 'database' },
  { label: 'Content', key: 'content' },
  { label: 'Finishing', key: 'finish' },
] as const

const EXPORT_STAGES_FULL = [
  { label: 'Files', key: 'files' },
  { label: 'Database', key: 'database' },
  { label: 'Compressing', key: 'compress' },
] as const

const EXPORT_STAGES_DB = [
  { label: 'Exporting', key: 'export' },
  { label: 'Writing', key: 'write' },
] as const

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

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
  numStages: number,
  onStep: (progress: number, message: string, stage: number) => void,
  onDone: () => void,
) {
  let i = 0
  const tick = () => {
    if (i >= steps.length) {
      onDone()
      return
    }
    const step = steps[i]
    const stage = Math.min(
      Math.floor((step.progress / 100) * numStages),
      numStages - 1,
    )
    onStep(step.progress, step.message, stage)
    i++
    setTimeout(tick, 400 + Math.random() * 600)
  }
  setTimeout(tick, 300)
}

export function useImportExport(siteId: Ref<string | null>) {
  const importState = computed(() =>
    siteId.value ? importStates.value[siteId.value] ?? null : null
  )
  const exportState = computed(() =>
    siteId.value ? exportStates.value[siteId.value] ?? null : null
  )

  const isConfirming = computed(() => importState.value?.phase === 'confirm')
  const isImporting = computed(() => importState.value?.phase === 'importing')
  const isExporting = computed(() => exportState.value?.phase === 'exporting')
  const isImportDone = computed(() => importState.value?.phase === 'done')
  const isExportDone = computed(() => exportState.value?.phase === 'done')

  function isValidFile(fileName: string): boolean {
    const lower = fileName.toLowerCase()
    return ACCEPTED_FILE_TYPES.some(ext => lower.endsWith(ext))
  }

  function startImport(fileName: string, fileSize: number) {
    const id = siteId.value
    if (!id || isImporting.value || isExporting.value) return

    importStates.value[id] = {
      phase: 'confirm',
      progress: 0,
      statusMessage: '',
      fileName,
      fileSize,
      currentStage: 0,
    }
  }

  function confirmImport() {
    const id = siteId.value
    if (!id || importStates.value[id]?.phase !== 'confirm') return

    importStates.value[id].phase = 'importing'
    importStates.value[id].statusMessage = 'Preparing import...'

    simulateProgress(
      importMessages,
      IMPORT_STAGES.length,
      (progress, message, stage) => {
        if (importStates.value[id]) {
          importStates.value[id].progress = progress
          importStates.value[id].statusMessage = message
          importStates.value[id].currentStage = stage
        }
      },
      () => {
        if (importStates.value[id]) {
          importStates.value[id].phase = 'done'
        }
      },
    )
  }

  function cancelImport() {
    const id = siteId.value
    if (id) delete importStates.value[id]
  }

  function startExport(type: 'full' | 'database') {
    const id = siteId.value
    if (!id || isImporting.value || isExporting.value) return

    exportStates.value[id] = {
      phase: 'exporting',
      progress: 0,
      statusMessage: 'Preparing export...',
      exportType: type,
      currentStage: 0,
    }

    const steps = type === 'full' ? exportFullMessages : exportDbMessages
    const stages = type === 'full' ? EXPORT_STAGES_FULL : EXPORT_STAGES_DB

    simulateProgress(
      steps,
      stages.length,
      (progress, message, stage) => {
        if (exportStates.value[id]) {
          exportStates.value[id].progress = progress
          exportStates.value[id].statusMessage = message
          exportStates.value[id].currentStage = stage
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
    const id = siteId.value
    if (id) delete importStates.value[id]
  }

  function clearExport() {
    const id = siteId.value
    if (id) delete exportStates.value[id]
  }

  return {
    importState,
    exportState,
    isConfirming,
    isImporting,
    isExporting,
    isImportDone,
    isExportDone,
    isValidFile,
    startImport,
    confirmImport,
    cancelImport,
    startExport,
    clearImport,
    clearExport,
    formatFileSize,
    ACCEPTED_FILE_TYPES,
    IMPORT_STAGES,
    EXPORT_STAGES_FULL,
    EXPORT_STAGES_DB,
  }
}

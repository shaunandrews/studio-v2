import { ref, onUnmounted } from 'vue'

interface ResizablePaneOptions {
  /** Starting width in pixels */
  defaultWidth?: number
  /** Minimum width in pixels */
  minWidth?: number
  /** Maximum width in pixels */
  maxWidth?: number
  /** localStorage key to persist width */
  storageKey?: string
}

export function useResizablePane(options: ResizablePaneOptions = {}) {
  const {
    defaultWidth = 275,
    minWidth = 180,
    maxWidth = 480,
    storageKey,
  } = options

  const stored = storageKey ? localStorage.getItem(storageKey) : null
  const width = ref(stored ? Number(stored) : defaultWidth)
  const isDragging = ref(false)

  let startX = 0
  let startWidth = 0

  function onPointerDown(e: PointerEvent) {
    e.preventDefault()
    isDragging.value = true
    startX = e.clientX
    startWidth = width.value
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
  }

  function onPointerMove(e: PointerEvent) {
    const delta = e.clientX - startX
    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta))
    width.value = newWidth
  }

  function onPointerUp() {
    isDragging.value = false
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
    if (storageKey) {
      localStorage.setItem(storageKey, String(width.value))
    }
  }

  function resetWidth() {
    width.value = defaultWidth
    if (storageKey) {
      localStorage.setItem(storageKey, String(defaultWidth))
    }
  }

  onUnmounted(() => {
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', onPointerUp)
  })

  return {
    width,
    isDragging,
    onPointerDown,
    resetWidth,
  }
}

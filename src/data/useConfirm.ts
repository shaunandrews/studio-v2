import { ref, type Component } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

const visible = ref(false)
const options = ref<ConfirmOptions>({
  title: '',
  message: '',
})

let resolvePromise: ((value: boolean) => void) | null = null

/**
 * Show a confirm dialog and return a promise that resolves to true (confirm) or false (cancel).
 * Used by the router guard and anywhere else that needs async confirmation.
 */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  options.value = opts
  visible.value = true
  return new Promise<boolean>((resolve) => {
    resolvePromise = resolve
  })
}

export function useConfirm() {
  function handleConfirm() {
    visible.value = false
    resolvePromise?.(true)
    resolvePromise = null
  }

  function handleCancel() {
    visible.value = false
    resolvePromise?.(false)
    resolvePromise = null
  }

  return {
    visible,
    options,
    handleConfirm,
    handleCancel,
  }
}

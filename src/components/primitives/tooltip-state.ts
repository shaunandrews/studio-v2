// Shared state across all Tooltip instances
export let lastGlobalHide = 0
export const WARM_WINDOW = 500

export function markHide() {
  lastGlobalHide = Date.now()
}

export function isWarm(): boolean {
  return (Date.now() - lastGlobalHide) < WARM_WINDOW
}

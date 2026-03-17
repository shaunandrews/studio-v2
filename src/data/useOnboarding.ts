import { ref } from 'vue'

const completed = ref(true)
const currentStep = ref(0)
const totalSteps = 2 // 0 = welcome, 1 = permissions (auth is a modal overlay, not a step)

export function useOnboarding() {
  function completeStep() {
    if (currentStep.value < totalSteps - 1) {
      currentStep.value++
    } else {
      completed.value = true
    }
  }

  function skipToApp() {
    completed.value = true
  }

  function reset(isCompleted: boolean) {
    completed.value = isCompleted
    currentStep.value = 0
  }

  return {
    completed,
    currentStep,
    totalSteps,
    completeStep,
    skipToApp,
    reset,
  }
}

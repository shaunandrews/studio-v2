<script setup lang="ts">
import { ref } from 'vue'
import { useOnboarding } from '@/data/useOnboarding'
import WelcomeScreen from './onboarding/WelcomeScreen.vue'
import AuthSimulation from './onboarding/AuthSimulation.vue'
import PermissionPrep from './onboarding/PermissionPrep.vue'

const { currentStep, completeStep } = useOnboarding()

const showAuthModal = ref(false)

function handleLogin() {
  showAuthModal.value = true
}

function handleAuthComplete() {
  showAuthModal.value = false
  completeStep() // step 0 → step 1 (permissions)
}

function handleSkip() {
  completeStep() // step 0 → step 1 (permissions), no auth
}

function handlePermissionComplete() {
  completeStep() // step 1 → completed
}
</script>

<template>
  <div class="onboarding-flow">
    <!-- Step 0: Welcome -->
    <WelcomeScreen
      v-if="currentStep === 0"
      @login="handleLogin"
      @skip="handleSkip"
    />

    <!-- Step 1: Permission prep -->
    <PermissionPrep
      v-if="currentStep === 1"
      @complete="handlePermissionComplete"
    />

    <!-- Auth modal overlays on top of welcome step -->
    <AuthSimulation
      v-if="showAuthModal"
      @complete="handleAuthComplete"
    />
  </div>
</template>

<style scoped>
.onboarding-flow {
  position: fixed;
  inset: 0;
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
}
</style>

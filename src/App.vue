<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import PersonaChooser from '@/components/features/PersonaChooser.vue'
import OnboardingFlow from '@/components/features/OnboardingFlow.vue'
import { usePersona } from '@/data/usePersona'
import { useOnboarding } from '@/data/useOnboarding'

const route = useRoute()
const layoutName = computed(() => (route.meta.layout as string) || 'bare')
const { personaChosen, activatePersona, initialize } = usePersona()
const { completed: onboardingCompleted } = useOnboarding()

onMounted(() => { initialize() })

function handlePersonaSelect(id: string) { activatePersona(id) }
</script>

<template>
  <!-- Tier 1: Persona chooser (no persona selected yet) -->
  <PersonaChooser
    v-if="!personaChosen"
    @select="handlePersonaSelect"
  />

  <!-- Tier 2: Onboarding flow (persona active but onboarding not complete) -->
  <OnboardingFlow
    v-else-if="!onboardingCompleted"
  />

  <!-- Tier 3: Normal app -->
  <template v-else>
    <MainLayout v-if="layoutName === 'main'" />
    <template v-else>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </template>
  </template>
</template>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity var(--transition-hover);
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>

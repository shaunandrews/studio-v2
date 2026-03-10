<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { chevronLeft, close } from '@wordpress/icons'
import { illustrations } from '@/components/features/add-site/illustrations'
import Button from '@/components/primitives/Button.vue'
import SiteDetailsForm from '@/components/features/add-site/SiteDetailsForm.vue'
import BlueprintPicker from '@/components/features/add-site/BlueprintPicker.vue'
import ImportDropZone from '@/components/features/add-site/ImportDropZone.vue'
import PullSitePicker from '@/components/features/add-site/PullSitePicker.vue'
import type { Blueprint } from '@/components/features/add-site/BlueprintPicker.vue'
import type { RemoteSite } from '@/components/features/add-site/PullSitePicker.vue'
import type { SelectedFile } from '@/components/features/add-site/ImportDropZone.vue'
import { useSites } from '@/data/useSites'
import { useSiteTransition } from '@/data/useSiteTransition'
import { useAddSite } from '@/data/useAddSite'

const props = defineProps<{
  visible: boolean
  hasSites: boolean
}>()

type Path = 'blank' | 'blueprint' | 'pull' | 'import'
type Step = 'choose' | 'picker' | 'details'

const { createUntitledSite, updateSite } = useSites()
const { navigateToSite } = useSiteTransition('site')
const { closeAddSite } = useAddSite()

const currentPath = ref<Path | null>(null)
const currentStep = ref<Step>('choose')

// Path-specific state
const selectedBlueprint = ref<Blueprint | null>(null)
const selectedRemoteSite = ref<RemoteSite | null>(null)
const selectedFile = ref<SelectedFile | null>(null)
const isAuthenticated = ref(true) // Prototype: pretend logged in

// Reset state when opened
watch(() => props.visible, (visible) => {
  if (visible) {
    currentPath.value = null
    currentStep.value = 'choose'
    selectedBlueprint.value = null
    selectedRemoteSite.value = null
    selectedFile.value = null
  }
})

const heading = computed(() => {
  if (currentStep.value === 'choose') return 'Add a new site'
  if (currentStep.value === 'details') return 'Site details'
  switch (currentPath.value) {
    case 'blueprint': return 'Choose a blueprint'
    case 'pull': return 'Pull an existing site'
    case 'import': return 'Import a backup'
    default: return 'Add a new site'
  }
})

const canGoBack = computed(() => currentStep.value !== 'choose')

const pathOptions = [
  { id: 'blank' as Path, illustration: illustrations.blank, label: 'Blank site', desc: 'Start fresh with a clean WordPress install' },
  { id: 'blueprint' as Path, illustration: illustrations.blueprint, label: 'Blueprint', desc: 'Choose a pre-configured site template' },
  { id: 'pull' as Path, illustration: illustrations.pull, label: 'Pull existing', desc: 'Download from WordPress.com or Pressable' },
  { id: 'import' as Path, illustration: illustrations.import, label: 'Import backup', desc: 'Import a Jetpack backup or full-site export' },
]

// Seed data
const blueprints: Blueprint[] = [
  { id: 'developer-blog', title: 'Developer Blog', description: 'A developer-focused blog with code syntax highlighting and dark theme.' },
  { id: 'business', title: 'Business Site', description: 'Professional business site with services, team, and contact pages.' },
  { id: 'portfolio', title: 'Portfolio', description: 'Showcase your work with a grid portfolio and project detail pages.' },
  { id: 'restaurant', title: 'Restaurant', description: 'Menu display, reservations, and location info for restaurants.' },
  { id: 'ecommerce', title: 'Online Store', description: 'WooCommerce-ready storefront with product pages and checkout.' },
  { id: 'landing', title: 'Landing Page', description: 'Single-page site with hero, features, and call-to-action sections.' },
]

const remoteSites: RemoteSite[] = [
  { id: 'rs-1', name: 'My Travel Blog', url: 'mytravelblog.wordpress.com' },
  { id: 'rs-2', name: 'Acme Corp', url: 'acmecorp.com' },
  { id: 'rs-3', name: 'Design Portfolio', url: 'janedesigns.art' },
  { id: 'rs-4', name: 'Downtown Bakery', url: 'downtownbakery.com' },
]

function choosePath(path: Path) {
  currentPath.value = path
  currentStep.value = path === 'blank' ? 'details' : 'picker'
}

function goBack() {
  if (currentStep.value === 'details' && currentPath.value !== 'blank') {
    currentStep.value = 'picker'
  } else {
    currentPath.value = null
    currentStep.value = 'choose'
  }
}

function dismiss() {
  closeAddSite()
}

// Picker handlers
function onBlueprintSelect(bp: Blueprint) { selectedBlueprint.value = bp }
function onBlueprintContinue() { if (selectedBlueprint.value) currentStep.value = 'details' }
function onRemoteSiteSelect(site: RemoteSite) { selectedRemoteSite.value = site }
function onRemoteSiteContinue() { if (selectedRemoteSite.value) currentStep.value = 'details' }
function onFileSelect(file: SelectedFile) { selectedFile.value = file }
function onFileContinue() { if (selectedFile.value) currentStep.value = 'details' }

function initialName(): string | undefined {
  if (currentPath.value === 'blueprint' && selectedBlueprint.value) return selectedBlueprint.value.title
  if (currentPath.value === 'pull' && selectedRemoteSite.value) return selectedRemoteSite.value.name
  return undefined
}

async function onSubmit(data: { name: string }) {
  const site = createUntitledSite()
  updateSite(site.id, { name: data.name })
  closeAddSite()
  // Small delay so chrome slides back before navigating
  setTimeout(async () => {
    await navigateToSite(site.id)
  }, 100)
}
</script>

<template>
  <div class="add-site-page">
    <!-- Accent glow -->
    <div class="accent-glow" />

    <!-- Header: cancel/back button (left-aligned) -->
    <header class="page-header hstack">
      <Button
        v-if="canGoBack"
        :icon="chevronLeft"
        label="Back"
        variant="tertiary"
        surface="dark"
        @click="goBack"
      />
      <Button
        v-else-if="hasSites"
        :icon="close"
        label="Cancel"
        variant="tertiary"
        surface="dark"
        @click="dismiss"
      />
    </header>

    <!-- Content -->
    <div class="page-content">
      <Transition name="step-fade" mode="out-in">

        <!-- Step: Choose path -->
        <div v-if="currentStep === 'choose'" key="choose" class="step-content">
          <div class="options-grid">
            <button
              v-for="(opt, idx) in pathOptions"
              :key="opt.id"
              class="option-card vstack gap-xl"
              :style="{ '--card-index': idx }"
              @click="choosePath(opt.id)"
            >
              <div class="option-illustration">
                <component :is="opt.illustration" />
              </div>
              <div class="option-text vstack gap-xxxs">
                <span class="option-label">{{ opt.label }}</span>
                <span class="option-desc">{{ opt.desc }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Step: Blueprint picker -->
        <div v-else-if="currentStep === 'picker' && currentPath === 'blueprint'" key="blueprint" class="step-content step-content--wide">
          <BlueprintPicker :blueprints="blueprints" @select="onBlueprintSelect" />
          <div class="picker-footer hstack gap-xs">
            <Button label="Continue" variant="primary" surface="dark" :disabled="!selectedBlueprint" @click="onBlueprintContinue" />
          </div>
        </div>

        <!-- Step: Pull site picker -->
        <div v-else-if="currentStep === 'picker' && currentPath === 'pull'" key="pull" class="step-content step-content--medium">
          <PullSitePicker
            :authenticated="isAuthenticated"
            :sites="remoteSites"
            @select="onRemoteSiteSelect"
            @login="isAuthenticated = true"
          />
          <div v-if="isAuthenticated" class="picker-footer hstack gap-xs">
            <Button label="Continue" variant="primary" surface="dark" :disabled="!selectedRemoteSite" @click="onRemoteSiteContinue" />
          </div>
        </div>

        <!-- Step: Import file picker -->
        <div v-else-if="currentStep === 'picker' && currentPath === 'import'" key="import" class="step-content step-content--medium">
          <ImportDropZone @select="onFileSelect" @clear="selectedFile = null" />
          <div class="picker-footer hstack gap-xs">
            <Button label="Continue" variant="primary" surface="dark" :disabled="!selectedFile" @click="onFileContinue" />
          </div>
        </div>

        <!-- Step: Site details form -->
        <div v-else-if="currentStep === 'details'" key="details" class="step-content step-content--narrow">
          <SiteDetailsForm
            :initial-name="initialName()"
            @submit="onSubmit"
          />
        </div>

      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* ── Page shell ── */

.add-site-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-chrome-bg);
  color: var(--color-chrome-fg);
  overflow: hidden;
}

/* ── Accent glow ── */

.accent-glow {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  width: 1400px;
  height: 1400px;
  background: radial-gradient(ellipse at center, var(--color-chrome-theme) 0%, transparent 60%);
  opacity: 0.08;
  pointer-events: none;
  z-index: 0;
  animation: glow-wander 20s ease-in-out infinite, glow-pulse 8s ease-in-out infinite;
}

@keyframes glow-wander {
  0% { transform: translate(-50%, -50%) translate(0, 0); }
  15% { transform: translate(-50%, -50%) translate(200px, -150px); }
  30% { transform: translate(-50%, -50%) translate(-180px, -80px); }
  50% { transform: translate(-50%, -50%) translate(120px, 180px); }
  65% { transform: translate(-50%, -50%) translate(-250px, 100px); }
  80% { transform: translate(-50%, -50%) translate(150px, -200px); }
  100% { transform: translate(-50%, -50%) translate(0, 0); }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.06; }
  50% { opacity: 0.12; }
}

/* ── Header ── */

.page-header {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  height: 56px;
  padding: 0 var(--space-m);
  align-items: center;
}

/* ── Content ── */

.page-content {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-m);
}

.step-content {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.step-content--wide { max-width: 800px; }
.step-content--medium { max-width: 480px; }
.step-content--narrow { max-width: 480px; }

/* ── Options grid ── */

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 380px);
  justify-content: center;
  gap: var(--space-s);
}

.option-card {
  position: relative;
  padding: var(--space-xl);
  border: 1px solid var(--color-chrome-border);
  border-radius: var(--radius-m);
  background: var(--color-chrome-fill);
  cursor: pointer;
  text-align: start;
  font-family: inherit;
  align-items: flex-start;
  overflow: hidden;
  transition:
    border-color var(--duration-fast) var(--ease-default),
    box-shadow var(--duration-fast) var(--ease-default);

  /* Staggered entrance */
  animation: card-enter 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--card-index) * 50ms + 200ms);
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

.option-card:hover {
  border-color: var(--color-chrome-theme);
  box-shadow: 0 0 0 1px var(--color-chrome-theme);
}

/* Illustration */

.option-illustration {
  display: flex;
  color: var(--color-chrome-fg);
}

/* Text */

.option-label {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg);
}

.option-desc {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  line-height: 1.4;
}

/* ── Picker footer ── */

.picker-footer {
  justify-content: flex-end;
  padding-block-start: var(--space-xs);
}

/* ── Step transitions ── */

.step-fade-enter-active {
  transition: opacity 150ms var(--ease-out);
}

.step-fade-leave-active {
  transition: opacity 100ms var(--ease-in);
}

.step-fade-enter-from,
.step-fade-leave-to {
  opacity: 0;
}
</style>

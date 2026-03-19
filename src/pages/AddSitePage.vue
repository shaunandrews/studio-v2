<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { illustrations } from '@/components/features/add-site/illustrations'
import BackdropPage from '@/layouts/BackdropPage.vue'
import Button from '@/components/primitives/Button.vue'
import SiteDetailsForm from '@/components/features/add-site/SiteDetailsForm.vue'
import BlueprintPicker from '@/components/features/add-site/BlueprintPicker.vue'
import ImportDropZone from '@/components/features/add-site/ImportDropZone.vue'
import PullSitePicker from '@/components/features/add-site/PullSitePicker.vue'
import type { Blueprint } from '@/components/features/add-site/BlueprintPicker.vue'
import type { RemoteSite } from '@/components/features/add-site/PullSitePicker.vue'
import WindowsTitlebar from '@/components/composites/WindowsTitlebar.vue'
import { useSites } from '@/data/useSites'
import { useSiteTransition } from '@/data/useSiteTransition'
import { useAddSite } from '@/data/useAddSite'
import { useOperatingSystem } from '@/data/useOperatingSystem'

const route = useRoute()
const router = useRouter()
const { createUntitledSite, updateSite, setStatus, sites } = useSites()
const { navigateToSite } = useSiteTransition('site')
const { isWindows } = useOperatingSystem()
const {
  currentPath,
  selectedBlueprint,
  selectedRemoteSite,
  selectedFile,
  closeAddSite,
  choosePath,
  goToDetails,
  initialName,
} = useAddSite()

const hasSites = computed(() => sites.value.length > 0)

// Building step state (transient, no route)
const isBuilding = ref(false)
const buildingSiteName = ref('')
const buildingProgress = ref(0)
const buildingStatus = ref('')

const step = computed(() => {
  if (isBuilding.value) return 'building'
  switch (route.name) {
    case 'add-site': return 'choose'
    case 'add-site-blueprint': return 'picker'
    case 'add-site-pull': return 'picker'
    case 'add-site-import': return 'picker'
    case 'add-site-details': return 'details'
    default: return 'choose'
  }
})

const heading = computed(() => {
  if (step.value === 'choose') return 'Add a new site'
  if (step.value === 'details') return 'Site details'
  switch (currentPath.value) {
    case 'blueprint': return 'Choose a blueprint'
    case 'pull': return 'Pull an existing site'
    case 'import': return 'Import a backup'
    default: return 'Add a new site'
  }
})

const canGoBack = computed(() => step.value !== 'choose')

const pathOptions = [
  { id: 'blank' as const, illustration: illustrations.blank, label: 'Blank site', desc: 'Start fresh with a clean WordPress install' },
  { id: 'blueprint' as const, illustration: illustrations.blueprint, label: 'Blueprint', desc: 'Choose a pre-configured site template' },
  { id: 'pull' as const, illustration: illustrations.pull, label: 'Pull existing', desc: 'Download from WordPress.com or Pressable' },
  { id: 'import' as const, illustration: illustrations.import, label: 'Import backup', desc: 'Import a Jetpack backup or full-site export' },
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

const isAuthenticated = ref(true)

// Picker handlers
function onBlueprintSelect(bp: Blueprint) { selectedBlueprint.value = bp }
function onBlueprintContinue() { if (selectedBlueprint.value) goToDetails() }
function onRemoteSiteSelect(site: RemoteSite) { selectedRemoteSite.value = site }
function onRemoteSiteContinue() { if (selectedRemoteSite.value) goToDetails() }
function onFileSelect(file: any) { selectedFile.value = file }
function onFileContinue() { if (selectedFile.value) goToDetails() }

function goBack() {
  router.back()
}

function dismiss() {
  closeAddSite()
}

const buildSteps: { progress: number; status: string; duration: number }[] = [
  { progress: 15, status: 'Setting up site directory…', duration: 600 },
  { progress: 35, status: 'Downloading WordPress…', duration: 900 },
  { progress: 55, status: 'Configuring PHP runtime…', duration: 700 },
  { progress: 75, status: 'Starting WordPress server and applying Blueprint…', duration: 1200 },
  { progress: 90, status: 'Running initial setup…', duration: 500 },
  { progress: 100, status: 'Ready!', duration: 400 },
]

async function onSubmit(data: { name: string }) {
  const site = createUntitledSite()
  updateSite(site.id, { name: data.name })

  buildingSiteName.value = data.name
  buildingProgress.value = 0
  buildingStatus.value = 'Preparing…'
  isBuilding.value = true

  for (const s of buildSteps) {
    await new Promise(r => setTimeout(r, s.duration))
    buildingProgress.value = s.progress
    buildingStatus.value = s.status
  }

  await new Promise(r => setTimeout(r, 600))
  setStatus(site.id, 'running')
  isBuilding.value = false
  await navigateToSite(site.id)
}
</script>

<template>
  <div class="add-site-page" :class="{ 'is-windows': isWindows }">
    <WindowsTitlebar v-if="isWindows" />
    <div v-else class="traffic-lights">
      <span class="light close" />
      <span class="light minimize" />
      <span class="light maximize" />
    </div>

  <BackdropPage
    :show-back="canGoBack"
    :hide-header="step === 'building'"
    :hide-close="!hasSites"
    @close="dismiss"
    @back="goBack"
  >
    <template #background>
      <div class="accent-glow" />
    </template>

    <!-- Content -->
    <div class="page-content">
      <Transition name="step-fade" mode="out-in">

        <!-- Step: Choose path -->
        <div v-if="step === 'choose'" key="choose" class="step-content">
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
        <div v-else-if="step === 'picker' && currentPath === 'blueprint'" key="blueprint" class="step-content step-content--wide">
          <BlueprintPicker :blueprints="blueprints" @select="onBlueprintSelect" />
          <div class="picker-footer hstack gap-xs">
            <Button label="Continue" variant="primary" surface="dark" :disabled="!selectedBlueprint" @click="onBlueprintContinue" />
          </div>
        </div>

        <!-- Step: Pull site picker -->
        <div v-else-if="step === 'picker' && currentPath === 'pull'" key="pull" class="step-content step-content--medium">
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
        <div v-else-if="step === 'picker' && currentPath === 'import'" key="import" class="step-content step-content--medium">
          <ImportDropZone @select="onFileSelect" @clear="selectedFile = null" />
          <div class="picker-footer hstack gap-xs">
            <Button label="Continue" variant="primary" surface="dark" :disabled="!selectedFile" @click="onFileContinue" />
          </div>
        </div>

        <!-- Step: Site details form -->
        <div v-else-if="step === 'details'" key="details" class="step-content step-content--narrow">
          <SiteDetailsForm
            :initial-name="initialName()"
            @submit="onSubmit"
          />
        </div>

        <!-- Step: Building / setup -->
        <div v-else-if="step === 'building'" key="building" class="step-content step-content--narrow building-step">
          <h2 class="building-site-name">{{ buildingSiteName }}</h2>
          <div class="building-progress-track">
            <div class="building-progress-bar" :style="{ width: buildingProgress + '%' }" />
          </div>
          <p class="building-status">{{ buildingStatus }}</p>
        </div>

      </Transition>
    </div>
  </BackdropPage>
  </div>
</template>

<style scoped>
.add-site-page {
  position: fixed;
  inset: 0;
  background: var(--color-chrome-bg);
  overflow: hidden;
}

.add-site-page :deep(.windows-titlebar) {
  position: relative;
  z-index: 100;
}

/* ── Traffic lights (macOS) ── */

.traffic-lights {
  position: absolute;
  top: 18px; /* Physical: fixed window position */
  left: 16px; /* Physical: fixed window position */
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: drag;
}

.light {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-full);
}

.light.close { background: var(--color-macos-close); }
.light.minimize { background: var(--color-macos-minimize); }
.light.maximize { background: var(--color-macos-maximize); }

/* ── Windows overrides ── */


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

/* ── Content ── */

.page-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 56px var(--space-m) var(--space-m); /* Clear header height */
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

/* ── Building step ── */

.building-step {
  align-items: center;
  text-align: center;
  gap: var(--space-s);
}

.building-site-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg);
  margin: 0;
}

.building-progress-track {
  width: 100%;
  max-width: 320px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-chrome-border);
  overflow: hidden;
}

.building-progress-bar {
  height: 100%;
  background: var(--color-chrome-fg);
  border-radius: 2px;
  transition: width 400ms var(--ease-out);
}

.building-status {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  margin: 0;
}
</style>

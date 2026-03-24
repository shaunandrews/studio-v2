<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
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
import TrafficLights from '@/components/primitives/TrafficLights.vue'
import { useSites } from '@/data/useSites'
import { useSiteDocument } from '@/data/useSiteDocument'
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
const detailsFormRef = ref<InstanceType<typeof SiteDetailsForm> | null>(null)
const pageContentRef = ref<HTMLElement | null>(null)
const isScrolled = ref(false)

function onScroll() {
  if (!pageContentRef.value) return
  const el = pageContentRef.value
  isScrolled.value = el.scrollTop + el.clientHeight < el.scrollHeight - 2
}

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

watch(step, () => { nextTick(onScroll) })
onMounted(() => { nextTick(onScroll) })

const showBottomBar = computed(() => step.value !== 'building')

const steps = computed(() => {
  if (step.value === 'choose') return []
  if (!currentPath.value || currentPath.value === 'empty') {
    return ['Site name & details']
  }
  const pickerLabels: Record<string, string> = {
    blueprint: 'Choose blueprint',
    pull: 'Pull site',
    import: 'Import backup',
  }
  return [pickerLabels[currentPath.value], 'Site name & details']
})

const currentStepIndex = computed(() => {
  if (step.value === 'details') return steps.value.length - 1
  return 0
})

const canContinue = computed(() => {
  if (step.value === 'picker') {
    if (currentPath.value === 'blueprint') return !!selectedBlueprint.value
    if (currentPath.value === 'pull') return !!selectedRemoteSite.value
    if (currentPath.value === 'import') return !!selectedFile.value
  }
  if (step.value === 'details') return detailsFormRef.value?.canSubmit ?? false
  return false
})

const primaryLabel = computed(() => {
  if (step.value === 'details') return 'Create site'
  return 'Continue'
})

function onPrimaryAction() {
  if (step.value === 'picker') {
    if (currentPath.value === 'blueprint') onBlueprintContinue()
    else if (currentPath.value === 'pull') onRemoteSiteContinue()
    else if (currentPath.value === 'import') onFileContinue()
  } else if (step.value === 'details') {
    detailsFormRef.value?.submit()
  }
}

const pathOptions = [
  { id: 'empty' as const, illustration: illustrations.empty, label: 'Empty site', desc: 'Start fresh with a clean WordPress install' },
  { id: 'blueprint' as const, illustration: illustrations.blueprint, label: 'Blueprint', desc: 'Choose a pre-configured site template' },
  { id: 'pull' as const, illustration: illustrations.pull, label: 'Pull existing', desc: 'Download from WordPress.com or Pressable' },
  { id: 'import' as const, illustration: illustrations.import, label: 'Import backup', desc: 'Import a Jetpack backup or full-site export' },
]

// Seed data
const blueprints: Blueprint[] = [
  { id: 'quick-start', title: 'Quick Start', description: 'Start quickly with a WordPress.com-like environment, which includes all plugins and themes that come pre-installed on a Business plan.', thumbnail: 'https://blueprintlibrary.wordpress.com/wp-content/uploads/2025/07/studio-blueprint-quick-start-3.png' },
  { id: 'development', title: 'Development', description: 'Building a WordPress theme or plugin? Use this blueprint to streamline your development workflow and ship with confidence.', thumbnail: 'https://blueprintlibrary.wordpress.com/wp-content/uploads/2025/07/studio-blueprint-development-2.png' },
  { id: 'commerce', title: 'Commerce', description: 'Create your next online store with WooCommerce and its companion plugins pre-installed and ready to go.', thumbnail: 'https://blueprintlibrary.wordpress.com/wp-content/uploads/2025/07/studio-blueprint-commerce-1.png' },
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
  const site = await createUntitledSite()
  await updateSite(site.id, { name: data.name })
  const { initFromTemplate } = useSiteDocument()
  if (site.mockLayout) {
    await initFromTemplate(site.id, site.mockLayout)
  }

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
    <TrafficLights v-else class="traffic-lights" />

  <BackdropPage
    hide-header
  >
    <template #background>
      <div class="accent-glow" />
    </template>

    <!-- Content -->
    <div ref="pageContentRef" class="page-content" @scroll="onScroll">
      <Transition name="step-fade" mode="out-in">

        <!-- Step: Choose path -->
        <div v-if="step === 'choose'" key="choose" class="step-content vstack gap-l">
          <div class="page-header vstack gap-xs">
            <h1 class="page-heading">{{ hasSites ? 'Add a new site' : 'Add your first site' }}</h1>
            <p class="page-subtitle">{{ hasSites ? 'Choose how you\'d like to get started.' : 'Choose how you\'d like to create your first local WordPress site.' }}</p>
          </div>
          <div class="options-grid">
            <button
              v-for="(opt, idx) in pathOptions"
              :key="opt.id"
              class="option-card vstack gap-xl align-start"
              :style="{ '--card-index': idx }"
              @click="choosePath(opt.id)"
            >
              <div class="option-illustration hstack">
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
        <div v-else-if="step === 'picker' && currentPath === 'blueprint'" key="blueprint" class="step-content step-content--wide vstack gap-l">
          <BlueprintPicker :blueprints="blueprints" @select="onBlueprintSelect" />
        </div>

        <!-- Step: Pull site picker -->
        <div v-else-if="step === 'picker' && currentPath === 'pull'" key="pull" class="step-content step-content--medium vstack gap-l">
          <PullSitePicker
            :authenticated="isAuthenticated"
            :sites="remoteSites"
            @select="onRemoteSiteSelect"
            @login="isAuthenticated = true"
          />
        </div>

        <!-- Step: Import file picker -->
        <div v-else-if="step === 'picker' && currentPath === 'import'" key="import" class="step-content step-content--medium vstack gap-l">
          <ImportDropZone @select="onFileSelect" @clear="selectedFile = null" />
        </div>

        <!-- Step: Site details form -->
        <div v-else-if="step === 'details'" key="details" class="step-content step-content--narrow vstack gap-l align-center">
          <SiteDetailsForm
            ref="detailsFormRef"
            :initial-name="initialName()"
            @submit="onSubmit"
          />
        </div>

        <!-- Step: Building / setup -->
        <div v-else-if="step === 'building'" key="building" class="step-content step-content--narrow building-step vstack gap-s align-center">
          <h2 class="building-site-name">{{ buildingSiteName }}</h2>
          <div class="building-progress-track">
            <div class="building-progress-bar" :style="{ width: buildingProgress + '%' }" />
          </div>
          <p class="building-status">{{ buildingStatus }}</p>
        </div>

      </Transition>
    </div>

    <template #footer>
      <Transition name="bottom-bar">
        <div v-if="showBottomBar" class="bottom-bar hstack justify-between" :class="{ 'is-scrolled': isScrolled }">
          <div class="stepper hstack gap-m">
            <TransitionGroup name="stepper-item">
              <div
                v-for="(label, idx) in steps"
                :key="label"
                class="stepper-item hstack gap-xxs"
                :class="{ 'is-current': idx === currentStepIndex, 'is-complete': idx < currentStepIndex }"
              >
                <span class="stepper-number hstack align-center justify-center shrink-0">{{ idx + 1 }}</span>
                <span class="stepper-label">{{ label }}</span>
              </div>
            </TransitionGroup>
          </div>
          <div class="bottom-bar-actions hstack gap-xs">
            <Transition name="btn-fade">
              <Button
                v-if="canGoBack"
                label="Back"
                variant="tertiary"
                surface="dark"
                @click="goBack"
              />
              <Button
                v-else-if="hasSites"
                label="Cancel"
                variant="tertiary"
                surface="dark"
                @click="dismiss"
              />
            </Transition>
            <Transition name="btn-swap" mode="out-in">
              <Button
                v-if="step !== 'choose'"
                :key="primaryLabel"
                :label="primaryLabel"
                variant="primary"
                surface="dark"
                :disabled="!canContinue"
                @click="onPrimaryAction"
              />
            </Transition>
          </div>
        </div>
      </Transition>
    </template>
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
  -webkit-app-region: drag;
}

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
  align-items: safe center;
  padding: 56px var(--space-m) 120px var(--space-m); /* Clear header + bottom bar + scroll breathing room */
}

.step-content {
  width: 100%;
  max-width: 800px;
}

.step-content--wide { max-width: 800px; }
.step-content--medium { max-width: 480px; }
.step-content--narrow {
  max-width: 480px;
}

.page-header {
  text-align: center;
}

.page-heading {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg);
  margin: 0;
}

.page-subtitle {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  margin: 0;
  margin-block-end: var(--space-s);
}

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

/* ── Bottom bar ── */

.bottom-bar {
  position: absolute;
  inset-block-end: 0;
  inset-inline-start: 0;
  inset-inline-end: 0;
  z-index: 10;
  padding: var(--space-xxxl);
  padding-block-start: var(--space-xl);
  backdrop-filter: blur(12px);
  border-block-start: 1px solid transparent;
  transition: border-color var(--duration-fast) var(--ease-default);
}

.bottom-bar.is-scrolled {
  border-block-start-color: var(--color-chrome-border);
}

.stepper {
  gap: var(--space-l);
}

.stepper-item {
  gap: var(--space-xs);
  opacity: 0.4;
  transition: opacity var(--duration-fast) var(--ease-default);
}

.stepper-item.is-current {
  opacity: 1;
}

.stepper-item.is-complete {
  opacity: 0.6;
}

.stepper-number {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-chrome-fg-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg-muted);
  transition: border-color var(--duration-moderate) var(--ease-default),
              color var(--duration-moderate) var(--ease-default);
}

.stepper-item.is-current .stepper-number {
  border-color: var(--color-chrome-fg);
  color: var(--color-chrome-fg);
}

.stepper-label {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  white-space: nowrap;
  transition: color var(--duration-moderate) var(--ease-default);
}

.stepper-item.is-current .stepper-label {
  color: var(--color-chrome-fg);
}

.bottom-bar-actions {
  flex-shrink: 0;
}

/* ── Bottom bar transitions ── */

.bottom-bar-enter-active {
  transition: opacity var(--duration-moderate) var(--ease-out),
              transform var(--duration-moderate) var(--ease-out);
}

.bottom-bar-leave-active {
  transition: opacity var(--duration-fast) var(--ease-in),
              transform var(--duration-fast) var(--ease-in);
}

.bottom-bar-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.bottom-bar-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Stepper items animate in/out individually */

.stepper-item-enter-active {
  transition: opacity var(--duration-moderate) var(--ease-out),
              transform var(--duration-moderate) var(--ease-out);
}

.stepper-item-leave-active {
  transition: opacity var(--duration-fast) var(--ease-in),
              transform var(--duration-fast) var(--ease-in);
}

.stepper-item-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}

.stepper-item-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

.stepper-item-move {
  transition: transform var(--duration-moderate) var(--ease-default);
}

/* Back button fade */

.btn-fade-enter-active {
  transition: opacity var(--duration-moderate) var(--ease-out);
}

.btn-fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-in);
}

.btn-fade-enter-from,
.btn-fade-leave-to {
  opacity: 0;
}

/* Primary button label swap */

.btn-swap-enter-active {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.btn-swap-leave-active {
  transition: opacity var(--duration-instant) var(--ease-in);
}

.btn-swap-enter-from,
.btn-swap-leave-to {
  opacity: 0;
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
  text-align: center;
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

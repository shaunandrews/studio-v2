<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { wordpress, page, download, backup, chevronLeft, close } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'
import SiteDetailsForm from '@/components/features/add-site/SiteDetailsForm.vue'
import BlueprintPicker from '@/components/features/add-site/BlueprintPicker.vue'
import ImportDropZone from '@/components/features/add-site/ImportDropZone.vue'
import PullSitePicker from '@/components/features/add-site/PullSitePicker.vue'
import type { Blueprint } from '@/components/features/add-site/BlueprintPicker.vue'
import type { RemoteSite } from '@/components/features/add-site/PullSitePicker.vue'
import type { SelectedFile } from '@/components/features/add-site/ImportDropZone.vue'
import { useProjects } from '@/data/useProjects'
import { useProjectTransition } from '@/data/useProjectTransition'

type Path = 'blank' | 'blueprint' | 'pull' | 'import'
type Step = 'choose' | 'picker' | 'details'

const router = useRouter()
const { createUntitledProject, updateProject } = useProjects()
const { navigateToProject } = useProjectTransition('project')

const currentPath = ref<Path | null>(null)
const currentStep = ref<Step>('choose')

// Path-specific state
const selectedBlueprint = ref<Blueprint | null>(null)
const selectedRemoteSite = ref<RemoteSite | null>(null)
const selectedFile = ref<SelectedFile | null>(null)
const isAuthenticated = ref(true) // Prototype: pretend logged in
const leaving = ref(false)

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
  { id: 'blank' as Path, icon: wordpress, label: 'Blank site', desc: 'Start fresh with a clean WordPress install' },
  { id: 'blueprint' as Path, icon: page, label: 'Blueprint', desc: 'Choose a pre-configured site template' },
  { id: 'pull' as Path, icon: download, label: 'Pull existing', desc: 'Download from WordPress.com or Pressable' },
  { id: 'import' as Path, icon: backup, label: 'Import backup', desc: 'Import a Jetpack backup or full-site export' },
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
  leaving.value = true
  setTimeout(() => router.back(), 250)
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
  leaving.value = true
  const project = createUntitledProject()
  updateProject(project.id, { name: data.name })
  setTimeout(async () => {
    await navigateToProject(project.id)
  }, 250)
}
</script>

<template>
  <div class="add-site-page" :class="{ 'is-leaving': leaving }">
    <!-- Accent glow -->
    <div class="accent-glow" />

    <!-- Header: always back (left) + title (center) + close (right) -->
    <header class="page-header hstack">
      <div class="header-start">
        <Button
          v-if="canGoBack"
          :icon="chevronLeft"
          variant="tertiary"
          tooltip="Back"
          @click="goBack"
        />
      </div>
      <h1 class="page-title">{{ heading }}</h1>
      <div class="header-end">
        <Button :icon="close" variant="tertiary" tooltip="Close" @click="dismiss" />
      </div>
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
              class="option-card vstack gap-s"
              :style="{ '--card-index': idx }"
              @click="choosePath(opt.id)"
            >
              <div class="option-icon">
                <WPIcon :icon="opt.icon" :size="24" />
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
            <Button label="Continue" variant="primary" :disabled="!selectedBlueprint" @click="onBlueprintContinue" />
          </div>
        </div>

        <!-- Step: Pull site picker -->
        <div v-else-if="currentStep === 'picker' && currentPath === 'pull'" key="pull" class="step-content">
          <PullSitePicker
            :authenticated="isAuthenticated"
            :sites="remoteSites"
            @select="onRemoteSiteSelect"
            @login="isAuthenticated = true"
          />
          <div v-if="isAuthenticated" class="picker-footer hstack gap-xs">
            <Button label="Continue" variant="primary" :disabled="!selectedRemoteSite" @click="onRemoteSiteContinue" />
          </div>
        </div>

        <!-- Step: Import file picker -->
        <div v-else-if="currentStep === 'picker' && currentPath === 'import'" key="import" class="step-content">
          <ImportDropZone @select="onFileSelect" @clear="selectedFile = null" />
          <div class="picker-footer hstack gap-xs">
            <Button label="Continue" variant="primary" :disabled="!selectedFile" @click="onFileContinue" />
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
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
  overflow: hidden;
  animation: page-enter 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.add-site-page.is-leaving {
  animation: page-leave 300ms cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  60% {
    opacity: 1;
  }
}

@keyframes page-leave {
  to {
    opacity: 0;
    transform: translateY(40px) scale(0.98);
  }
}

/* ── Accent glow ── */

.accent-glow {
  position: absolute;
  inset-block-start: -200px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 500px;
  background: radial-gradient(ellipse at center, var(--color-primary) 0%, transparent 70%);
  opacity: 0.06;
  pointer-events: none;
  z-index: 0;
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

.header-start,
.header-end {
  width: 80px;
  display: flex;
}

.header-end {
  justify-content: flex-end;
}

.page-title {
  flex: 1;
  text-align: center;
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  margin: 0;
  opacity: 0.6;
}

/* ── Content ── */

.page-content {
  position: relative;
  z-index: 1;
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: var(--space-xxxl) var(--space-m);
}

.step-content {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: var(--space-l);
}

.step-content--wide { max-width: 720px; }
.step-content--narrow { max-width: 400px; }

/* ── Options grid ── */

.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-s);
}

.option-card {
  position: relative;
  padding: var(--space-l);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  background: var(--color-frame-bg);
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
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

/* Icon */

.option-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-m);
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-frame-bg));
  color: var(--color-primary);
}

/* Text */

.option-label {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
}

.option-desc {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
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

<script setup lang="ts">
import { toRef, ref, watch, computed } from 'vue'
import Pane from '@/components/composites/Pane.vue'
import SiteSettingsGeneral from '@/components/features/site-settings/SiteSettingsGeneral.vue'
import SiteSettingsAdmin from '@/components/features/site-settings/SiteSettingsAdmin.vue'
import SiteSettingsSkills from '@/components/features/site-settings/SiteSettingsSkills.vue'
import SiteSettingsDebugging from '@/components/features/site-settings/SiteSettingsDebugging.vue'
import SiteSettingsImport from '@/components/features/site-settings/SiteSettingsImport.vue'
import SiteSettingsExport from '@/components/features/site-settings/SiteSettingsExport.vue'
import SiteSettingsActions from '@/components/features/site-settings/SiteSettingsActions.vue'
import Button from '@/components/primitives/Button.vue'
import { useSiteSettings, provideSiteSettings } from '@/data/useSiteSettings'

const props = defineProps<{
  siteId: string
}>()

const emit = defineEmits<{
  'manage-global-skills': []
}>()

const settings = useSiteSettings(toRef(props, 'siteId'))
provideSiteSettings(settings)

// ── Save flow state machine ──
type SavePhase = 'idle' | 'saving' | 'done'
const phase = ref<SavePhase>('idle')
const showBar = ref(false)
const savedNeedsRestart = ref(false)

// Progress state for restart simulation
const saveProgress = ref(0)
const saveStatus = ref('')

watch(() => settings.isDirty.value, (dirty) => {
  if (dirty) {
    showBar.value = true
    phase.value = 'idle'
  } else if (phase.value === 'idle') {
    // User manually undid all changes — dismiss
    showBar.value = false
  }
})

// Hint text explains what will happen on save
const hintText = computed(() => {
  if (!settings.needsRestart.value) return ''
  return 'The site will restart to apply server changes.'
})

// Build restart steps from what actually changed
function buildRestartSteps() {
  const steps: { progress: number; status: string; duration: number }[] = []
  const changes = settings.changeDescriptions.value

  steps.push({ progress: 15, status: 'Stopping server…', duration: 400 })

  const restartChanges = changes.filter(c => c.needsRestart)
  const totalRestart = restartChanges.length
  let i = 0
  for (const change of restartChanges) {
    i++
    const progress = 15 + Math.round((70 / totalRestart) * i)
    steps.push({ progress, status: `Applying ${change.label.toLowerCase()}…`, duration: 500 })
  }

  steps.push({ progress: 95, status: 'Starting server…', duration: 600 })
  steps.push({ progress: 100, status: 'Running', duration: 300 })
  return steps
}

async function handleSave() {
  savedNeedsRestart.value = settings.needsRestart.value
  phase.value = 'saving'
  saveProgress.value = 0

  await settings.save()

  if (savedNeedsRestart.value) {
    const steps = buildRestartSteps()
    for (const step of steps) {
      await new Promise(r => setTimeout(r, step.duration))
      saveProgress.value = step.progress
      saveStatus.value = step.status
    }
  } else {
    saveProgress.value = 100
    saveStatus.value = 'Saved'
    await new Promise(r => setTimeout(r, 300))
  }

  phase.value = 'done'

  // Hold done state, then dismiss
  setTimeout(() => {
    showBar.value = false
    setTimeout(() => {
      phase.value = 'idle'
      saveProgress.value = 0
      saveStatus.value = ''
    }, 400)
  }, 1000)
}

function handleDiscard() {
  settings.discard()
  requestAnimationFrame(() => {
    showBar.value = false
    setTimeout(() => { phase.value = 'idle' }, 400)
  })
}

// ── Save bar height transition hooks ──

function onBarEnter(el: Element, done: () => void) {
  const htmlEl = el as HTMLElement
  htmlEl.style.overflow = 'hidden'
  htmlEl.style.height = '0'
  htmlEl.style.opacity = '0'
  void htmlEl.offsetHeight
  htmlEl.style.transition = `height var(--duration-slow) var(--ease-out), opacity var(--duration-moderate) var(--ease-out)`
  htmlEl.style.height = htmlEl.scrollHeight + 'px'
  htmlEl.style.opacity = '1'
  htmlEl.addEventListener('transitionend', done, { once: true })
}

function onBarAfterEnter(el: Element) {
  const htmlEl = el as HTMLElement
  htmlEl.style.height = ''
  htmlEl.style.overflow = ''
  htmlEl.style.transition = ''
}

function onBarLeave(el: Element, done: () => void) {
  const htmlEl = el as HTMLElement
  htmlEl.style.overflow = 'hidden'
  htmlEl.style.height = htmlEl.scrollHeight + 'px'
  void htmlEl.offsetHeight
  htmlEl.style.transition = `height var(--duration-slow) var(--ease-in), opacity var(--duration-moderate) var(--ease-in)`
  htmlEl.style.height = '0'
  htmlEl.style.opacity = '0'
  htmlEl.addEventListener('transitionend', done, { once: true })
}
</script>

<template>
  <Pane scrollable centered>
    <div class="settings-sections">
      <SiteSettingsGeneral :site-id="siteId" />
      <SiteSettingsAdmin :site-id="siteId" />
      <SiteSettingsSkills :site-id="siteId" @manage-global-skills="emit('manage-global-skills')" />
      <SiteSettingsDebugging :site-id="siteId" />
      <SiteSettingsImport :site-id="siteId" />
      <SiteSettingsExport :site-id="siteId" />
      <SiteSettingsActions :site-id="siteId" />
    </div>

    <template #footer>
      <Transition @enter="onBarEnter" @after-enter="onBarAfterEnter" @leave="onBarLeave" @after-leave="onBarAfterLeave" :css="false">
        <div
          v-if="showBar"
          class="save-bar"
          :class="`save-bar--${phase}`"
        >
          <div class="save-bar__inner">
          <Transition name="content-crossfade" mode="out-in">
            <!-- IDLE: info left, actions right -->
            <div v-if="phase === 'idle'" key="idle" class="hstack align-stretch gap-l">
              <div class="vstack gap-xxs flex-1 min-w-0 save-bar__left">
                <span class="save-bar__heading">{{ settings.changeDescriptions.value.length }} unsaved {{ settings.changeDescriptions.value.length === 1 ? 'change' : 'changes' }}</span>
                <ul class="save-bar__changes">
                  <TransitionGroup name="change-item">
                    <li
                      v-for="change in settings.changeDescriptions.value"
                      :key="change.label"
                      class="save-bar__change"
                    >
                      <span class="save-bar__change-label">{{ change.label }}</span>
                      <span class="save-bar__change-value">{{ change.description }}</span>
                    </li>
                  </TransitionGroup>
                </ul>
              </div>
              <div class="vstack gap-xs shrink-0 save-bar__right">
                <div class="hstack gap-xs">
                  <Button variant="secondary" label="Discard" @click="handleDiscard" />
                  <Button variant="primary" :label="settings.needsRestart.value ? 'Save & Restart' : 'Save'" @click="handleSave" />
                </div>
                <span v-if="hintText" class="save-bar__hint">{{ hintText }}</span>
              </div>
            </div>

            <!-- SAVING: progress bar + status -->
            <div v-else-if="phase === 'saving'" key="saving" class="vstack gap-xs align-center save-bar__progress-state">
              <div class="save-bar__progress-track">
                <div class="save-bar__progress-fill" :style="{ width: saveProgress + '%' }" />
              </div>
              <span class="save-bar__progress-status">{{ saveStatus }}</span>
            </div>

            <!-- DONE: success -->
            <div v-else key="done" class="hstack gap-xs justify-center save-bar__done-state">
              <svg class="save-bar__check" viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path class="save-bar__check-path" d="M4 12.5l5.5 5.5L20 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="save-bar__done-text">
                {{ savedNeedsRestart ? 'Server running' : 'Changes saved' }}
              </span>
            </div>
          </Transition>
          </div>
        </div>
      </Transition>
    </template>
  </Pane>
</template>

<style scoped>
.settings-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

/* ══════════════════════════════════════
   Save bar container
   ══════════════════════════════════════ */

.save-bar {
  flex-shrink: 0;
  border-block-start: 1px solid var(--color-status-warning-border);
  background: var(--color-status-warning-bg);
  transition: background var(--duration-slow) var(--ease-default),
              border-color var(--duration-slow) var(--ease-default);
}

.save-bar__inner {
  max-width: 680px;
  margin-inline: auto;
  width: 100%;
  padding: var(--space-m) var(--space-l);
}

/* ── Idle: change list ── */

.save-bar__heading {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
}

.save-bar__changes {
  list-style: none;
  margin: 0;
  padding: 0;
}

.save-bar__change {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  font-size: var(--font-size-s);
  line-height: 1.5;
}

.save-bar__change-label {
  color: var(--color-frame-fg);
  font-weight: var(--font-weight-medium);
}

.save-bar__change-value {
  color: var(--color-frame-fg-muted);
}

.save-bar__left {
  justify-content: center;
}

.save-bar__right {
  align-items: flex-end;
  justify-content: flex-end;
}

.save-bar__hint {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  text-align: end;
}

/* Change item transitions */
.change-item-enter-active {
  transition: opacity var(--duration-moderate) var(--ease-out),
              transform var(--duration-moderate) var(--ease-out);
}

.change-item-leave-active {
  transition: opacity var(--duration-fast) var(--ease-in),
              transform var(--duration-fast) var(--ease-in);
}

.change-item-enter-from {
  opacity: 0;
  transform: translateX(calc(-1 * var(--space-xs)));
}

.change-item-leave-to {
  opacity: 0;
  transform: translateX(calc(-1 * var(--space-xxxs)));
}

/* ── Done: green bg ── */

.save-bar--done {
  background: var(--color-status-running-bg);
  border-block-start-color: var(--color-status-running-border);
}

/* ── Progress bar (matches ProgressCard) ── */

.save-bar__progress-state {
  padding: var(--space-xs) 0;
}

.save-bar__progress-track {
  width: 100%;
  max-width: 320px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-frame-border);
  overflow: hidden;
}

.save-bar__progress-fill {
  height: 100%;
  background: var(--color-frame-fg);
  border-radius: 2px;
  transition: width 400ms var(--ease-out);
}

.save-bar__progress-status {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
}

/* ── Done: success ── */

.save-bar__done-state {
  padding: var(--space-s) 0;
}

.save-bar__check {
  color: var(--color-status-running);
  flex-shrink: 0;
}

.save-bar__check-path {
  stroke-dasharray: 28;
  stroke-dashoffset: 28;
  animation: check-draw 0.35s cubic-bezier(0.65, 0, 0.35, 1) 0.05s forwards;
}

@keyframes check-draw {
  to { stroke-dashoffset: 0; }
}

.save-bar__done-text {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
}

/* ══════════════════════════════════════
   Content crossfade between phases
   ══════════════════════════════════════ */

.content-crossfade-enter-active {
  transition: opacity var(--duration-moderate) var(--ease-out),
              transform var(--duration-moderate) var(--ease-out);
}

.content-crossfade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-in),
              transform var(--duration-fast) var(--ease-in);
}

.content-crossfade-enter-from {
  opacity: 0;
  transform: translateY(var(--space-xxxs));
}

.content-crossfade-leave-to {
  opacity: 0;
  transform: translateY(calc(-1 * var(--space-xxxs)));
}

/* ══════════════════════════════════════
   Reduced motion
   ══════════════════════════════════════ */

@media (prefers-reduced-motion: reduce) {
  .content-crossfade-enter-active,
  .content-crossfade-leave-active,
  .change-item-enter-active,
  .change-item-leave-active {
    transition-duration: 0.01ms !important;
  }

  .save-bar__check-path {
    animation-duration: 0.01ms !important;
  }

  .save-bar__progress-fill {
    transition-duration: 0.01ms !important;
  }
}
</style>

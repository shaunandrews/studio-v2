<script setup lang="ts">
import { useRouter } from 'vue-router'
import { personas } from '@/data/personas'
import { usePersona } from '@/data/usePersona'
import type { Persona } from '@/data/types'
import DotGrid from '@/components/features/onboarding/DotGrid.vue'

const router = useRouter()
const { activatePersona, clearPersona } = usePersona()

function isUrl(str: string): boolean {
  return str.startsWith('http') || str.startsWith('/')
}

function selectPersona(persona: Persona) {
  activatePersona(persona.id, router)
}

async function resetAll() {
  await clearPersona(router)
}

</script>

<template>
  <div class="persona-chooser">
    <DotGrid />
    <div class="persona-chooser__content">
      <div class="persona-chooser__intro">
        <div class="persona-chooser__header">
          <h1 class="persona-chooser__title">
            <svg class="persona-chooser__wp-logo" xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 24 24" width="28" height="28" fill="currentColor"><path d="M20 10c0-5.51-4.49-10-10-10C4.48 0 0 4.49 0 10c0 5.52 4.48 10 10 10 5.51 0 10-4.48 10-10zM7.78 15.37L4.37 6.22c.55-.02 1.17-.08 1.17-.08.5-.06.44-1.13-.06-1.11 0 0-1.45.11-2.37.11-.18 0-.37 0-.58-.01C4.12 2.69 6.87 1.11 10 1.11c2.33 0 4.45.87 6.05 2.34-.68-.11-1.65.39-1.65 1.58 0 .74.45 1.36.9 2.1.35.61.55 1.36.55 2.46 0 1.49-1.4 5-1.4 5l-3.03-8.37c.54-.02.82-.17.82-.17.5-.05.44-1.25-.06-1.22 0 0-1.44.12-2.38.12-.87 0-2.33-.12-2.33-.12-.5-.03-.56 1.2-.06 1.22l.92.08 1.26 3.41zM17.41 10c.24-.64.74-1.87.43-4.25.7 1.29 1.05 2.71 1.05 4.25 0 3.29-1.73 6.24-4.4 7.78.97-2.59 1.94-5.2 2.92-7.78zM6.1 18.09C3.12 16.65 1.11 13.53 1.11 10c0-1.3.23-2.48.72-3.59C3.25 10.3 4.67 14.2 6.1 18.09zm4.03-6.63l2.58 6.98c-.86.29-1.76.45-2.71.45-.79 0-1.57-.11-2.29-.33.81-2.38 1.62-4.74 2.42-7.1z"/></svg>
            Studio
          </h1>
          <p class="persona-chooser__lede">
            An interactive prototype exploring what a local WordPress development
            environment looks like when AI is a first-class collaborator — not a
            bolt-on feature, but a core part of how sites get built, edited, and managed.
          </p>
        </div>

        <div class="persona-chooser__ideas">
          <h2 class="persona-chooser__section-title">What we're exploring</h2>
          <ul class="persona-chooser__list">
            <li>AI-assisted site editing with live preview — propose, review, apply</li>
            <li>Task-based workflows that track what the AI did and why</li>
            <li>Revisions and undo tied to AI turns, not just file saves</li>
            <li>Syncing local sites to WordPress.com and sharing previews</li>
            <li>Information architecture for managing multiple sites and tasks</li>
            <li>A visual site map for understanding and navigating site structure</li>
          </ul>
        </div>
      </div>

      <div class="persona-chooser__personas">
        <div class="persona-chooser__personas-intro">
          <h2 class="persona-chooser__section-title">Choose a scenario</h2>
          <p class="persona-chooser__personas-description">
            Each scenario loads the app with different seed data — sites, tasks,
            and history — so you can experience Studio from different starting
            points. Switch anytime with <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>.
          </p>
        </div>

        <div class="persona-chooser__slots">
          <button
            v-for="persona in personas"
            :key="persona.id"
            class="persona-slot"
            @click="selectPersona(persona)"
          >
            <div class="persona-slot__icon">
              <img
                v-if="isUrl(persona.icon)"
                :src="persona.icon"
                :alt="persona.name"
                class="persona-slot__avatar"
              />
              <span v-else class="persona-slot__emoji">{{ persona.icon }}</span>
            </div>
            <div class="persona-slot__info">
              <span class="persona-slot__name">{{ persona.name }}</span>
              <span class="persona-slot__description">{{ persona.description }}</span>
            </div>
            <div class="persona-slot__meta">
              <span class="persona-slot__sites">
                {{ persona.sites.length }} {{ persona.sites.length === 1 ? 'site' : 'sites' }}
              </span>
              <span class="persona-slot__auth">
                {{ persona.auth ? 'Authenticated' : 'Not signed in' }}
              </span>
            </div>
          </button>
        </div>

        <button class="persona-chooser__reset" @click="resetAll">
          Reset local data
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.persona-chooser {
  position: fixed;
  inset: 0;
  background: #0a0a0a;
  color: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: start;
  justify-content: center;
  overflow-y: auto;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

.persona-chooser__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxl);
  max-width: 520px;
  width: 100%;
  padding: 80px var(--space-xl) var(--space-xxl);
  color: #fff;
}

/* Two-column layout on wider screens */
@media (min-width: 960px) {
  .persona-chooser {
    align-items: center;
  }

  .persona-chooser__content {
    max-width: 880px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-xxxl);
    align-items: start;
    align-content: start;
    padding-block: var(--space-xxl);
  }
}

/* --- Intro column (header + ideas) --- */

.persona-chooser__intro {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxl);
  backdrop-filter: blur(2px);
}

@media (min-width: 960px) {
  .persona-chooser__intro {
    position: sticky;
    inset-block-start: 80px;
  }
}

/* --- Header --- */

.persona-chooser__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.persona-chooser__title {
  font-size: 28px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.02em;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-s);
}

.persona-chooser__wp-logo {
  flex-shrink: 0;
  opacity: 0.85;
}

.persona-chooser__lede {
  font-size: var(--font-size-l);
  line-height: var(--line-height-normal);
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

/* --- Ideas --- */

.persona-chooser__ideas {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.persona-chooser__section-title {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.persona-chooser__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  font-size: var(--font-size-m);
  line-height: var(--line-height-normal);
  color: rgba(255, 255, 255, 0.8);
}

.persona-chooser__list li {
  padding-inline-start: var(--space-m);
  position: relative;
}

.persona-chooser__list li::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 7px;
  width: 4px;
  height: 4px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.4);
}

/* --- Personas column --- */

.persona-chooser__personas {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
  backdrop-filter: blur(2px);
}

.persona-chooser__personas-intro {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.persona-chooser__personas-description {
  font-size: var(--font-size-m);
  line-height: var(--line-height-normal);
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
}

.persona-chooser__personas-description kbd {
  display: inline-block;
  font-family: var(--font-family);
  font-size: var(--font-size-xs);
  line-height: 1;
  padding: 2px 5px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  vertical-align: baseline;
}

.persona-chooser__slots {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  width: 100%;
}

.persona-slot {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-m) var(--space-l);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-m);
  cursor: pointer;
  text-align: start;
  color: #fff;
  transition:
    background 150ms ease,
    border-color 150ms ease;
}

.persona-slot:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.persona-slot__icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.persona-slot__avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.persona-slot__emoji {
  font-size: 24px;
  line-height: 1;
}

.persona-slot__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.persona-slot__name {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
}

.persona-slot__description {
  font-size: var(--font-size-s);
  color: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.persona-chooser__reset {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.35);
  font-size: var(--font-size-s);
  cursor: pointer;
  padding: var(--space-xs) var(--space-s);
  border-radius: var(--radius-s);
  transition: color 150ms ease;
  align-self: center;
}

.persona-chooser__reset:hover {
  color: rgba(255, 255, 255, 0.6);
}

.persona-slot__meta {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 2px;
  font-size: var(--font-size-xs);
  color: rgba(255, 255, 255, 0.4);
}
</style>

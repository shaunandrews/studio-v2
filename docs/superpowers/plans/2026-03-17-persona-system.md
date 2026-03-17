# Persona System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persona system that lets you switch between new-user and existing-user experiences, with an onboarding flow for new users.

**Architecture:** A `usePersona()` composable manages which persona is active and resets all app state when switching. `App.vue` gates rendering into three tiers: startup chooser, onboarding flow, or the normal app. New `useAuth()` and `useOnboarding()` composables handle auth and onboarding state respectively.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), TypeScript, CSS custom properties, existing design system tokens.

**Spec:** `docs/superpowers/specs/2026-03-17-persona-system-design.md`

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/data/personas.ts` | Persona definitions (new user, existing user) and `Persona` type |
| `src/data/usePersona.ts` | Active persona state, `activatePersona()`, URL param + localStorage handling |
| `src/data/useAuth.ts` | Auth state (`isAuthenticated`, `user`, `login`, `logout`) |
| `src/data/useOnboarding.ts` | Onboarding progress (`completed`, `currentStep`, `completeStep`) |
| `src/components/features/PersonaChooser.vue` | Full-screen save-file-style persona launcher |
| `src/components/features/OnboardingFlow.vue` | Multi-step onboarding container (steps 1-3) |
| `src/components/features/onboarding/WelcomeScreen.vue` | Step 1: welcome + login CTA |
| `src/components/features/onboarding/AuthSimulation.vue` | Step 2: fake OAuth modal |
| `src/components/features/onboarding/PermissionPrep.vue` | Step 3: permission explanation + simulated prompt |

### Modified files
| File | Change |
|------|--------|
| `src/data/useSites.ts` | Add `resetSites()` function |
| `src/data/useConversations.ts` | Add `resetConversations()` function, reset `nextWorktreePort` |
| `src/data/useAddSite.ts` | Add `resetAddSite()` function |
| `src/data/useSettings.ts` | Add `resetSettings()` function |
| `src/data/types.ts` | Add `AuthUser` and `Persona` types |
| `src/App.vue` | Three-tier conditional: chooser → onboarding → app |
| `src/layouts/MainLayout.vue` | Use `useAuth()` for gravatar, add persona switcher trigger |
| `src/components/composites/GlobalMenu.vue` | Use `useAuth()` for avatar/email, add persona switch option |

---

## Chunk 1: Data Layer — Types, Auth, Onboarding, Reset Functions

### Task 1: Add types

**Files:**
- Modify: `src/data/types.ts`

- [ ] **Step 1: Add AuthUser and Persona types to types.ts**

Add at the end of the file:

```typescript
// --- Personas ---

export interface AuthUser {
  name: string
  email: string
  avatar: string
}

export interface Persona {
  id: string
  name: string
  description: string
  icon: string
  auth: AuthUser | null
  onboardingCompleted: boolean
  sites: Site[]
  conversations: Conversation[]
  messages: Message[]
}
```

- [ ] **Step 2: Verify dev server compiles**

Run: `npm run dev` (should already be running at localhost:3025)
Expected: No TypeScript errors in terminal

- [ ] **Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "feat(persona): add AuthUser and Persona types"
```

---

### Task 2: Create useAuth composable

**Files:**
- Create: `src/data/useAuth.ts`

- [ ] **Step 1: Create the useAuth composable**

```typescript
import { ref, computed } from 'vue'
import type { AuthUser } from './types'

const user = ref<AuthUser | null>(null)

export function useAuth() {
  const isAuthenticated = computed(() => user.value !== null)

  function login(authUser: AuthUser) {
    user.value = { ...authUser }
  }

  function logout() {
    user.value = null
  }

  function reset(authUser: AuthUser | null) {
    user.value = authUser ? { ...authUser } : null
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
    reset,
  }
}
```

- [ ] **Step 2: Verify compiles**

Check dev server terminal — no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/useAuth.ts
git commit -m "feat(persona): add useAuth composable"
```

---

### Task 3: Create useOnboarding composable

**Files:**
- Create: `src/data/useOnboarding.ts`

- [ ] **Step 1: Create the useOnboarding composable**

```typescript
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
```

- [ ] **Step 2: Verify compiles**

- [ ] **Step 3: Commit**

```bash
git add src/data/useOnboarding.ts
git commit -m "feat(persona): add useOnboarding composable"
```

---

### Task 4: Add reset functions to existing composables

**Files:**
- Modify: `src/data/useSites.ts`
- Modify: `src/data/useConversations.ts`
- Modify: `src/data/useAddSite.ts`
- Modify: `src/data/useSettings.ts`

- [ ] **Step 1: Add resetSites to useSites.ts**

Add this function inside `useSites()` and include it in the return object:

```typescript
function resetSites(newSites: Site[]) {
  sites.value = structuredClone(newSites)
  activeSiteId.value = null
}
```

Return becomes: `return { sites, activeSiteId, activeProject, setStatus, createUntitledSite, updateSite, resetSites }`

- [ ] **Step 2: Add resetConversations to useConversations.ts**

Add this function inside `useConversations()` and include it in the return. Also needs access to reset `nextWorktreePort`, so add a module-level reset:

At module level (after `let nextWorktreePort = 4001`), no change needed — the function inside `useConversations` can reference it since it's in the same module.

Inside `useConversations()`:

```typescript
function resetConversations(newConvos: Conversation[], newMessages: Message[]) {
  conversations.value = newConvos.map(c => ({ ...c }))
  messages.value = newMessages.map(m => ({ ...m }))
  nextWorktreePort = 4001
}
```

Add `resetConversations` to the return object.

- [ ] **Step 3: Add resetAddSite to useAddSite.ts**

Inside `useAddSite()`, add the function and include `resetAddSite` in the return object:

```typescript
function resetAddSite() {
  isAddingSite.value = false
}
```

Updated return: `return { isAddingSite, shouldShowAddSite, hasSites, openAddSite, closeAddSite, resetAddSite }`

- [ ] **Step 4: Add resetSettings to useSettings.ts**

Inside `useSettings()`, add the function and include `resetSettings` in the return object:

```typescript
function resetSettings() {
  isOpen.value = false
  initialTab.value = 'general'
}
```

Updated return: `return { isSettingsOpen: isOpen, settingsTab: initialTab, openSettings, closeSettings, resetSettings }`

- [ ] **Step 5: Verify compiles, app still works**

Check dev server — no errors. Click around the app to make sure nothing broke.

- [ ] **Step 6: Commit**

```bash
git add src/data/useSites.ts src/data/useConversations.ts src/data/useAddSite.ts src/data/useSettings.ts
git commit -m "feat(persona): add reset functions to existing composables"
```

---

### Task 5: Create persona definitions

**Files:**
- Create: `src/data/personas.ts`

- [ ] **Step 1: Create personas.ts with new-user and existing-user personas**

```typescript
import type { Persona } from './types'
import { seedProjects } from './seed-sites'
import { seedConversations, seedMessages } from './seed-conversations'

export const personas: Persona[] = [
  {
    id: 'new-user',
    name: 'New User',
    description: 'First launch. No sites, no account. Goes through onboarding.',
    icon: '👤',
    auth: null,
    onboardingCompleted: false,
    sites: [],
    conversations: [],
    messages: [],
  },
  {
    id: 'existing-user',
    name: 'Shaun',
    description: '7 sites, active conversations, fully set up.',
    icon: 'https://gravatar.com/avatar/b7fdd6477cc13ca16e8358a0725bc02c?s=64',
    auth: {
      name: 'Shaun Andrews',
      email: 'shaun@automattic.com',
      avatar: 'https://gravatar.com/avatar/b7fdd6477cc13ca16e8358a0725bc02c?s=64',
    },
    onboardingCompleted: true,
    sites: seedProjects,
    conversations: seedConversations,
    messages: seedMessages,
  },
]

export function getPersona(id: string): Persona | undefined {
  return personas.find(p => p.id === id)
}
```

- [ ] **Step 2: Verify compiles**

- [ ] **Step 3: Commit**

```bash
git add src/data/personas.ts
git commit -m "feat(persona): add persona definitions for new and existing user"
```

---

### Task 6: Create usePersona composable

**Files:**
- Create: `src/data/usePersona.ts`

- [ ] **Step 1: Create the usePersona composable**

```typescript
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { personas, getPersona } from './personas'
import { useSites } from './useSites'
import { useConversations } from './useConversations'
import { useAddSite } from './useAddSite'
import { useSettings } from './useSettings'
import { useSidebarCollapse } from './useSidebarCollapse'
import { useAuth } from './useAuth'
import { useOnboarding } from './useOnboarding'

const STORAGE_KEY = 'studio-persona'
const URL_PARAM = 'persona'

const activePersonaId = ref<string | null>(null)

// True once a persona has been chosen (either from URL, localStorage, or chooser)
const personaChosen = computed(() => activePersonaId.value !== null)

function getInitialPersonaId(): string | null {
  // URL param takes precedence
  const urlParams = new URLSearchParams(window.location.search)
  const fromUrl = urlParams.get(URL_PARAM)
  if (fromUrl && getPersona(fromUrl)) return fromUrl

  // Then localStorage
  const fromStorage = localStorage.getItem(STORAGE_KEY)
  if (fromStorage && getPersona(fromStorage)) return fromStorage

  // No persona — show chooser
  return null
}

export function usePersona() {
  function activatePersona(id: string) {
    const persona = getPersona(id)
    if (!persona) return

    // Reset all state
    const { resetSites } = useSites()
    const { resetConversations } = useConversations()
    const { resetAddSite } = useAddSite()
    const { resetSettings } = useSettings()
    const { show } = useSidebarCollapse()
    const { reset: resetAuth } = useAuth()
    const { reset: resetOnboarding } = useOnboarding()

    resetSites(persona.sites)
    resetConversations(persona.conversations, persona.messages)
    resetAddSite()
    resetSettings()
    show() // Reset sidebar to visible
    resetAuth(persona.auth)
    resetOnboarding(persona.onboardingCompleted)

    activePersonaId.value = id
    localStorage.setItem(STORAGE_KEY, id)

    // Reset route so we don't land on a stale route after persona switch
    try {
      const router = useRouter()
      router.push('/')
    } catch {
      // useRouter() throws outside setup context (e.g. during initialize)
    }
  }

  function initialize() {
    const id = getInitialPersonaId()
    if (id) {
      activatePersona(id)
    }
    // If null, personaChosen stays false → chooser shows
  }

  function clearPersona() {
    activePersonaId.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    activePersonaId,
    personaChosen,
    personas,
    activatePersona,
    initialize,
    clearPersona,
  }
}
```

- [ ] **Step 2: Verify compiles**

- [ ] **Step 3: Commit**

```bash
git add src/data/usePersona.ts
git commit -m "feat(persona): add usePersona composable with URL param and localStorage support"
```

---

## Chunk 2: Persona Chooser UI

### Task 7: Create PersonaChooser component

**Files:**
- Create: `src/components/features/PersonaChooser.vue`

This is the full-screen "save file select" launcher. It should feel like a video game save slot screen — dark background, cards for each persona, atmospheric but self-contained.

- [ ] **Step 1: Create PersonaChooser.vue**

```vue
<script setup lang="ts">
import { personas } from '@/data/personas'
import type { Persona } from '@/data/types'

const emit = defineEmits<{
  select: [id: string]
}>()

function isUrl(str: string): boolean {
  return str.startsWith('http') || str.startsWith('/')
}

function selectPersona(persona: Persona) {
  emit('select', persona.id)
}
</script>

<template>
  <div class="persona-chooser">
    <div class="persona-chooser__content">
      <div class="persona-chooser__header">
        <h1 class="persona-chooser__title">WordPress Studio</h1>
        <p class="persona-chooser__subtitle">Choose a scenario</p>
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
    </div>
  </div>
</template>

<style scoped>
.persona-chooser {
  position: fixed;
  inset: 0;
  background: #0a0a0a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

.persona-chooser__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxl);
  max-width: 560px;
  width: 100%;
  padding: var(--space-xl);
}

.persona-chooser__header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.persona-chooser__title {
  font-size: 28px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.02em;
  margin: 0;
}

.persona-chooser__subtitle {
  font-size: var(--font-size-m);
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
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
```

- [ ] **Step 2: Verify compiles**

- [ ] **Step 3: Commit**

```bash
git add src/components/features/PersonaChooser.vue
git commit -m "feat(persona): add PersonaChooser save-file-style launcher"
```

---

## Chunk 3: Onboarding Flow — Welcome, Auth, Permissions

### Task 8: Create WelcomeScreen component

**Files:**
- Create: `src/components/features/onboarding/WelcomeScreen.vue`

Modeled on the real Studio app's onboarding: branding + benefits + login CTA.

- [ ] **Step 1: Create WelcomeScreen.vue**

```vue
<script setup lang="ts">
import Button from '@/components/primitives/Button.vue'

const emit = defineEmits<{
  login: []
  skip: []
}>()
</script>

<template>
  <div class="welcome-screen">
    <div class="welcome-screen__content">
      <div class="welcome-screen__brand">
        <h1 class="welcome-screen__title">Welcome to<br />WordPress Studio</h1>
        <p class="welcome-screen__pitch">
          Start by connecting your WordPress.com account to unlock the full power of Studio.
        </p>
      </div>

      <ul class="welcome-screen__benefits">
        <li>Share preview sites with clients and colleagues</li>
        <li>Seamlessly sync with WordPress.com and Pressable</li>
        <li>Get smart suggestions from the Studio Assistant</li>
      </ul>

      <div class="welcome-screen__actions">
        <Button
          variant="primary"
          label="Log in to WordPress.com"
          width="full"
          @click="emit('login')"
        />
        <Button
          variant="tertiary"
          label="Skip"
          width="full"
          @click="emit('skip')"
        />
      </div>

      <p class="welcome-screen__signup">
        New to WordPress.com?
        <a href="#" class="welcome-screen__link" @click.prevent="emit('login')">Create a free account</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.welcome-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

.welcome-screen__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xl);
  max-width: 400px;
  width: 100%;
  padding: var(--space-xl);
  text-align: center;
}

.welcome-screen__brand {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
}

.welcome-screen__title {
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0;
  color: var(--color-frame-fg);
}

.welcome-screen__pitch {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  margin: 0;
  line-height: 1.5;
}

.welcome-screen__benefits {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  text-align: start;
  width: 100%;
}

.welcome-screen__benefits li {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  padding-inline-start: var(--space-l);
  position: relative;
}

.welcome-screen__benefits li::before {
  content: '✓';
  position: absolute;
  inset-inline-start: 0;
  color: var(--color-status-running);
  font-weight: var(--font-weight-semibold);
}

.welcome-screen__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: 100%;
}

.welcome-screen__signup {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  margin: 0;
}

.welcome-screen__link {
  color: var(--color-frame-theme);
  text-decoration: none;
}

.welcome-screen__link:hover {
  text-decoration: underline;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/features/onboarding/WelcomeScreen.vue
git commit -m "feat(persona): add WelcomeScreen onboarding component"
```

---

### Task 9: Create AuthSimulation component

**Files:**
- Create: `src/components/features/onboarding/AuthSimulation.vue`

A modal-style overlay that looks like a WordPress.com OAuth screen. Fake form, fake login.

- [ ] **Step 1: Create AuthSimulation.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/primitives/Button.vue'
import { useAuth } from '@/data/useAuth'

const emit = defineEmits<{
  complete: []
}>()

const { login } = useAuth()

const email = ref('user@example.com')
const password = ref('••••••••')
const isLoading = ref(false)

async function handleLogin() {
  isLoading.value = true
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))
  login({
    name: 'Studio User',
    email: email.value,
    avatar: 'https://gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=64',
  })
  isLoading.value = false
  emit('complete')
}
</script>

<template>
  <div class="auth-simulation">
    <div class="auth-simulation__backdrop" />
    <div class="auth-simulation__modal">
      <div class="auth-simulation__header">
        <svg class="auth-simulation__logo" viewBox="0 0 24 24" width="36" height="36">
          <circle cx="12" cy="12" r="12" fill="#0675C4" />
          <path d="M12 3.3c-4.8 0-8.7 3.9-8.7 8.7 0 4.8 3.9 8.7 8.7 8.7 4.8 0 8.7-3.9 8.7-8.7 0-4.8-3.9-8.7-8.7-8.7zm-1.2 13.4L7 12.9l1.2-2.7 2.1 1 3.5-7.1 1.5 2.8-4.5 7.8z" fill="white" />
        </svg>
        <h2 class="auth-simulation__title">Log in to WordPress.com</h2>
      </div>

      <div class="auth-simulation__form">
        <label class="auth-simulation__field">
          <span class="auth-simulation__label">Email address</span>
          <input
            v-model="email"
            type="email"
            class="auth-simulation__input"
            placeholder="you@example.com"
          />
        </label>
        <label class="auth-simulation__field">
          <span class="auth-simulation__label">Password</span>
          <input
            v-model="password"
            type="password"
            class="auth-simulation__input"
          />
        </label>

        <Button
          variant="primary"
          :label="isLoading ? 'Logging in...' : 'Log in'"
          width="full"
          :disabled="isLoading"
          @click="handleLogin"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-simulation {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

.auth-simulation__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
}

.auth-simulation__modal {
  position: relative;
  background: var(--color-frame-bg);
  border-radius: var(--radius-l);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
  padding: var(--space-xxl);
  width: 380px;
  max-width: 90vw;
}

.auth-simulation__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-m);
  margin-block-end: var(--space-xl);
}

.auth-simulation__title {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin: 0;
}

.auth-simulation__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.auth-simulation__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.auth-simulation__label {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
}

.auth-simulation__input {
  height: 40px;
  padding: 0 var(--space-s);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg);
  font-size: var(--font-size-m);
  font-family: var(--font-family);
  outline: none;
  transition: border-color 150ms ease;
}

.auth-simulation__input:focus {
  border-color: var(--color-frame-theme);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/features/onboarding/AuthSimulation.vue
git commit -m "feat(persona): add AuthSimulation fake OAuth component"
```

---

### Task 10: Create PermissionPrep component

**Files:**
- Create: `src/components/features/onboarding/PermissionPrep.vue`

Explains what permissions are needed, then simulates the system prompt.

- [ ] **Step 1: Create PermissionPrep.vue**

```vue
<script setup lang="ts">
import Button from '@/components/primitives/Button.vue'

const emit = defineEmits<{
  complete: []
}>()

function handleContinue() {
  // Simulate a system permission dialog
  const granted = window.confirm(
    'WordPress Studio wants to access files on your computer to create and manage WordPress sites.\n\nAllow access?'
  )
  if (granted) {
    emit('complete')
  }
}
</script>

<template>
  <div class="permission-prep">
    <div class="permission-prep__content">
      <div class="permission-prep__icon">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
          <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" stroke-width="2" />
          <path d="M4 16h40" stroke="currentColor" stroke-width="2" />
          <circle cx="10" cy="12" r="1.5" fill="currentColor" />
          <circle cx="16" cy="12" r="1.5" fill="currentColor" />
          <circle cx="22" cy="12" r="1.5" fill="currentColor" />
          <path d="M16 28l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <h2 class="permission-prep__title">Studio needs access to your files</h2>
      <p class="permission-prep__description">
        To create and manage WordPress sites on your computer, Studio needs permission to read and write files in your projects folder.
      </p>

      <ul class="permission-prep__details">
        <li>Create local WordPress installations</li>
        <li>Manage themes, plugins, and site files</li>
        <li>Import and export site backups</li>
      </ul>

      <div class="permission-prep__actions">
        <Button
          variant="primary"
          label="Continue"
          width="full"
          @click="handleContinue"
        />
      </div>

      <p class="permission-prep__note">
        You can change these permissions later in System Settings.
      </p>
    </div>
  </div>
</template>

<style scoped>
.permission-prep {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
}

.permission-prep__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-l);
  max-width: 400px;
  width: 100%;
  padding: var(--space-xl);
  text-align: center;
}

.permission-prep__icon {
  color: var(--color-frame-fg-muted);
}

.permission-prep__title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin: 0;
}

.permission-prep__description {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  margin: 0;
  line-height: 1.5;
}

.permission-prep__details {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  text-align: start;
  width: 100%;
}

.permission-prep__details li {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  padding-inline-start: var(--space-l);
  position: relative;
}

.permission-prep__details li::before {
  content: '•';
  position: absolute;
  inset-inline-start: var(--space-xs);
  color: var(--color-frame-fg-muted);
}

.permission-prep__actions {
  width: 100%;
}

.permission-prep__note {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  margin: 0;
  opacity: 0.7;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/features/onboarding/PermissionPrep.vue
git commit -m "feat(persona): add PermissionPrep screen component"
```

---

### Task 11: Create OnboardingFlow container

**Files:**
- Create: `src/components/features/OnboardingFlow.vue`

Container that renders the correct step based on `useOnboarding().currentStep`.

- [ ] **Step 1: Create OnboardingFlow.vue**

Step mapping: 0 = Welcome, 1 = Permissions. Auth is a modal overlay on the welcome step, not its own step.

- "Log in" on welcome → auth modal opens over welcome → auth completes → advance to step 1 (permissions)
- "Skip" on welcome → advance to step 1 (permissions), skip auth entirely
- "Continue" on permissions → simulated system dialog → onboarding complete

```vue
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/features/OnboardingFlow.vue
git commit -m "feat(persona): add OnboardingFlow multi-step container"
```

---

## Chunk 4: App.vue Integration & Auth Wiring

### Task 12: Wire up App.vue with three-tier rendering

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Update App.vue to gate rendering**

Replace the entire `App.vue` content:

```vue
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

onMounted(() => {
  initialize()
})

function handlePersonaSelect(id: string) {
  activatePersona(id)
}
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
```

- [ ] **Step 2: Verify the app loads**

Open `http://localhost:3025` — you should see the PersonaChooser. Click "Shaun" to get the existing experience. Add `?persona=existing` to bypass the chooser.

- [ ] **Step 3: Commit**

```bash
git add src/App.vue
git commit -m "feat(persona): wire App.vue with three-tier persona/onboarding/app rendering"
```

---

### Task 13: Update MainLayout to use useAuth

**Files:**
- Modify: `src/layouts/MainLayout.vue`

- [ ] **Step 1: Replace hardcoded gravatar with useAuth**

In the `<script setup>` section, add the import:

```typescript
import { useAuth } from '@/data/useAuth'
```

And destructure:

```typescript
const { user, isAuthenticated } = useAuth()
```

Then in the template, replace the hardcoded gravatar `<img>`:

Change:
```html
<img class="gravatar" src="https://gravatar.com/avatar/b7fdd6477cc13ca16e8358a0725bc02c?s=64" alt="User" />
```

To:
```html
<img v-if="user" class="gravatar" :src="user.avatar" alt="User" />
<span v-else class="gravatar gravatar--placeholder">?</span>
```

Add CSS for the placeholder:

```css
.gravatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg-muted);
  background: var(--color-chrome-hover);
}
```

- [ ] **Step 2: Verify the avatar shows correctly for existing user persona**

Open `http://localhost:3025?persona=existing` — Shaun's gravatar should appear.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/MainLayout.vue
git commit -m "feat(persona): use useAuth for dynamic gravatar in MainLayout"
```

---

### Task 14: Update GlobalMenu to use useAuth

**Files:**
- Modify: `src/components/composites/GlobalMenu.vue`

- [ ] **Step 1: Replace hardcoded avatar and email**

In `<script setup>`, add:

```typescript
import { useAuth } from '@/data/useAuth'
import { usePersona } from '@/data/usePersona'

const { user } = useAuth()
const { clearPersona } = usePersona()
```

Add a function:

```typescript
function switchPersona() {
  close()
  clearPersona()
}
```

In the template, replace the hardcoded account section:

Change:
```html
<img
  class="global-menu__avatar"
  src="https://gravatar.com/avatar/b7fdd6477cc13ca16e8358a0725bc02c?s=64"
  alt="User"
/>
<span class="global-menu__email">shaun@automattic.com</span>
```

To:
```html
<img
  v-if="user"
  class="global-menu__avatar"
  :src="user.avatar"
  alt="User"
/>
<span class="global-menu__email">{{ user?.email ?? 'Not signed in' }}</span>
```

Also add a "Switch persona" item in the nav section, before the existing items:

```html
<div class="global-menu__item" @click="switchPersona">
  Switch persona
</div>
```

- [ ] **Step 2: Verify both the avatar and "Switch persona" work**

Open the app with `?persona=existing`, click the gravatar, verify the menu shows Shaun's email. Click "Switch persona" — should return to the chooser.

- [ ] **Step 3: Commit**

```bash
git add src/components/composites/GlobalMenu.vue
git commit -m "feat(persona): dynamic auth in GlobalMenu, add persona switcher"
```

---

### Task 15: Test the full new-user flow

This is a manual verification task — no code changes.

- [ ] **Step 1: Test new user via URL param**

Open `http://localhost:3025?persona=new-user`

Expected flow:
1. Onboarding welcome screen appears
2. Click "Log in to WordPress.com" → auth modal opens
3. Click "Log in" in the modal → loading state → auth completes
4. Permission prep screen appears
5. Click "Continue" → browser confirm dialog
6. Click "OK" → app loads with empty state → AddSitePage backdrop visible

- [ ] **Step 2: Test new user via chooser**

Open `http://localhost:3025` (clear localStorage first if needed: `localStorage.removeItem('studio-persona')`)

Expected: persona chooser appears. Click "New User" → same flow as above.

- [ ] **Step 3: Test skipping auth**

On the welcome screen, click "Skip" → should go straight to the app with empty state.

- [ ] **Step 4: Test existing user**

From the chooser, click "Shaun" → app loads with all 7 sites, Shaun's gravatar in the sidebar.

- [ ] **Step 5: Test persona switching**

Inside the app, click gravatar → GlobalMenu → "Switch persona" → chooser appears. Select a different persona → state resets correctly.

- [ ] **Step 6: Test URL param precedence**

Set localStorage persona to "existing-user", then open `?persona=new-user` → should show new user flow, not existing.

---

## Summary

**9 new files created:**
- `src/data/useAuth.ts`, `src/data/useOnboarding.ts`, `src/data/usePersona.ts`, `src/data/personas.ts`
- `src/components/features/PersonaChooser.vue`, `src/components/features/OnboardingFlow.vue`
- `src/components/features/onboarding/WelcomeScreen.vue`, `src/components/features/onboarding/AuthSimulation.vue`, `src/components/features/onboarding/PermissionPrep.vue`

**5 files modified:**
- `src/data/types.ts`, `src/data/useSites.ts`, `src/data/useConversations.ts`, `src/data/useAddSite.ts`, `src/data/useSettings.ts`
- `src/App.vue`, `src/layouts/MainLayout.vue`, `src/components/composites/GlobalMenu.vue`

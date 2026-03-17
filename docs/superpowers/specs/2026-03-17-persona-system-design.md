# Persona System — Simulate New & Existing User Experiences

**Date:** 2026-03-17

## Summary

A persona system that lets you switch between different user scenarios (new user, existing user, and more in the future) to prototype and demo different experiences. Each persona defines a starting state — auth status, sites, conversations, onboarding completion — and the app hydrates from it.

## Personas

### New User
- Not authenticated
- No sites, no conversations
- Onboarding not completed
- Flow: startup chooser → onboarding screen → auth simulation → permission prep → AddSitePage (existing)

### Existing User (current default)
- Authenticated (Shaun, with gravatar)
- 7 seed sites with conversations
- Onboarding completed
- Flow: startup chooser → straight into app as it works today

### Future Personas (not in scope now)
- Returning user with expired auth
- User with one site
- Agency user with many sites
- User mid-onboarding (skipped auth)
- etc.

## Entry Points

Three ways to select a persona:

### 1. Startup Chooser
- Full-screen launcher that replaces the app until a persona is picked
- Styled like a video game save file select screen
- Each persona is a "save slot" showing: name, avatar/icon, site count, auth status, brief description
- Self-contained — does not depend on or bleed into the main app shell
- Shows on app load (unless a URL param overrides it)
- **Rendering:** Conditional in `App.vue` that gates rendering before the router. When no persona is active (and no URL param), `App.vue` renders the chooser instead of any layout. This avoids a flash of the chooser route before redirect.

### 2. URL Parameter
- `?persona=new` or `?persona=existing` (and future persona slugs)
- Bypasses the startup chooser, goes directly into that persona's experience
- Useful for bookmarking and sharing specific scenarios
- **Precedence:** URL param always wins over localStorage. If `?persona=new` is in the URL but localStorage says `existing`, the URL param takes effect.

### 3. Dev Toolbar Toggle
- A control within the running app to switch personas without reloading
- Resets all state (sites, conversations, auth, onboarding) to the selected persona's starting state
- Location TBD — could be in settings, a floating button, or a keyboard shortcut

## Onboarding Flow (New User)

After selecting the "New User" persona, the user goes through these steps in sequence.

**Rendering:** Onboarding steps 1-3 are a multi-step component rendered conditionally in `App.vue`, gated by `useOnboarding()` state. They render instead of the main app layout (not as overlays or routes). This keeps them self-contained and outside the router entirely.

### Step 1: Welcome / Onboarding Screen
- "Welcome to WordPress Studio" branding
- Modeled on the real Studio app's onboarding screen
- Two-column or centered layout with branding on one side, action on the other
- Key benefits listed (preview sites, sync, AI assistant)
- Two CTAs: "Log in to WordPress.com" (primary), "Skip" (secondary)
- "New to WordPress.com? Create a free account" link

### Step 2: Auth Simulation
- Clicking "Log in" opens something resembling a WordPress.com OAuth screen
- This is a local modal/overlay, not a real OAuth redirect
- User sees a fake login form, clicks "Log in", transitions to authenticated state
- On completion: user state updated with fake user info (name, avatar, email)
- Skipping auth at step 1 skips this step

### Step 3: Permission Prep
- A screen that explains what permissions Studio needs and why
- Purpose: prepare the user so the system dialog isn't surprising
- Content: "Studio needs access to your file system to create and manage WordPress sites"
- CTA: "Continue" → triggers a simulated system permission dialog (browser alert or styled modal)
- After granting: proceed to the app

### Step 4: App with Empty State
- Onboarding complete, user lands in the app
- No sites exist → `shouldShowAddSite` triggers automatically (existing logic)
- The existing AddSitePage backdrop appears — no custom first-site wizard needed

## State Architecture

### Persona Definition
Each persona is a plain object defining its starting state:

```typescript
interface Persona {
  id: string
  name: string           // Display name for chooser
  description: string    // Brief description for chooser
  icon: string          // Gravatar URL, emoji, or icon name — rendered as <img> if URL, text otherwise
  auth: null | { name: string; email: string; avatar: string }
  onboardingCompleted: boolean
  sites: Site[]
  conversations: Conversation[]
  messages: Message[]
}
```

### Composable: `usePersona()`
- Holds the active persona ID in reactive state
- Provides `activatePersona(id)` — resets all app state to that persona's definition
- Reads URL param on init; if present, activates that persona immediately. Otherwise, falls back to localStorage. If neither, shows the startup chooser (`personaChosen === false`).
- Persists last-used persona to localStorage (so refresh keeps you in the same scenario)

### Composable: `useAuth()`
- New composable holding auth state: `isAuthenticated` (ref boolean), `user` (ref with name/email/avatar or null)
- `login(user)` and `logout()` functions
- Initialized from `persona.auth` on activation
- MainLayout consumes this to show the correct avatar (replacing the current hardcoded gravatar URL)

### Composable: `useOnboarding()`
- New composable holding onboarding progress: `completed` (ref boolean), `currentStep` (ref number)
- `completeStep()` advances through steps, `reset()` starts over
- Initialized from `persona.onboardingCompleted` on activation
- `App.vue` checks `onboarding.completed` to decide whether to render onboarding screens or the app

### Integration with Existing Composables
Each existing composable that holds data state gets a `reset(data)` function added to its public API:

- **`useSites()`** — add `resetSites(newSites: Site[])` that sets `sites.value = structuredClone(newSites)` and clears `activeSiteId`
- **`useConversations()`** — add `resetConversations(newConvos, newMessages)` that sets both `conversations.value` and `messages.value`, and resets `nextWorktreePort` to its default
- **`useAddSite()`** — reset `isAddingSite` to false
- **`useSettings()`** — reset `isOpen` to false
- **`useSidebarCollapse()`** — reset to default (not collapsed)

This approach keeps the existing singleton pattern intact — composables still own their refs, they just expose a way to reinitialize them.

### State Reset on Persona Switch
When `activatePersona()` is called:
1. Calls `resetSites()`, `resetConversations()`, `useAuth().login/logout()`, `useOnboarding().reset()`, and resets all UI state composables
2. If `persona.onboardingCompleted === false`, `App.vue` renders onboarding flow
3. If onboarding is complete, router navigates to `/all-sites` (or first site)

### App.vue Rendering Hierarchy
`App.vue` renders one of three things, checked in order:
1. **Startup chooser** — if no persona is active (`!personaChosen`)
2. **Onboarding flow** — if persona is active but `!onboarding.completed`
3. **App layout** — the existing MainLayout/BareLayout router-based rendering

## What's NOT in Scope
- Custom first-site creation wizard (reuse existing AddSitePage)
- Assistant welcome messages for new users
- "What's New" modal for returning users
- Real authentication or API calls
- Data persistence beyond localStorage persona selection

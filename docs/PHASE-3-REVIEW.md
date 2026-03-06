# Phase 3 Code Review

Critical review of the parallel agent outputs for the New Project Flow.

---

## 1. Critical Issues — Must Fix

### 1.1 `createProject` does NOT call `startBuild` — Integration Gap

**The biggest problem.** `MainLayout.onProjectCreated()` calls `createProject(brief)` and then navigates, but **nobody ever calls `useBuildProgress().startBuild()`**. The project gets created with `status: 'loading'` and stays there forever. The build never starts.

**Where it should happen:** Either in `MainLayout.onProjectCreated()` after `createProject()`, or inside `createProject()` itself. The spec (§7 State Management) says `createProject` should "initialize BuildState via `useBuildProgress`, and start the pipeline."

```ts
// MainLayout.vue — onProjectCreated should be:
function onProjectCreated(brief: ProjectBrief) {
  const project = createProject(brief)
  const { startBuild } = useBuildProgress()
  startBuild(project.id, brief)
  showNewProjectModal.value = false
  router.push({ name: 'project', params: { id: project.id } })
}
```

### 1.2 Duplicate `ProjectBrief` Type Definition

`ProjectBrief` is defined in **two places**:
- `src/data/types.ts` (used by modal agent: `OnboardingChat`, `NewProjectModal`, `MainLayout`)
- `src/data/useBuildProgress.ts` (used by build agent)

These are identical today but will drift. The build agent should import from `types.ts` instead of redeclaring.

### 1.3 `SitePreview` Doesn't Render From `BuildState`

`SitePreview` imports `useBuildProgress` and reads `buildState`/`isBuildMode`, but **only uses it for the `pages` computed** (BrowserBar dimming). The actual `srcdoc` rendering still goes through `pipelineState` props and `mockSites` — it never reads `BuildState.theme`, `BuildState.templateParts`, or `BuildState.pages[slug].sections`.

The spec (§7) says: "When a project has an active BuildState, the preview renders from BuildState data instead of mockSites."

Currently, `SitePreview` receives `pipelineState` and `skeletonSlots` as **props** from `ProjectPage`. But `useBuildProgress.startBuild()` calls `pipeline.startBuild()` internally, and the pipeline's singleton state updates — but `ProjectPage` would need to wire `usePipeline().pipelineState` into `SitePreview`'s props. This is fragile and unclear. **The data path from build → preview is incomplete.**

### 1.4 `usePipeline` is a Singleton — Multiple Simultaneous Builds Will Collide

`usePipeline` uses module-level singleton state (`pipelineState`, `skeletonSlots`, `activePage`, `currentOrchestrator`). If you create two projects rapidly, the second `startBuild` overwrites the first's orchestrator and state. The spec (§6) says multiple simultaneous builds should be supported.

`useBuildProgress` correctly uses a `Map<string, BuildState>`, but it delegates to `usePipeline` which can only track one build at a time. The `onProgress`/`onComplete`/`onError` callbacks in `usePipeline` are global arrays — they don't scope to a project ID.

### 1.5 `useBuildProgress.updateBuildFromPipeline` Reads Global Pipeline State

```ts
function updateBuildFromPipeline(projectId: string) {
  const ps = pipeline.pipelineState.value  // ← global singleton!
```

This assumes the global `pipelineState` corresponds to `projectId`. With multiple builds, this is wrong. The `onProgress` callback receives a `ProgressCardData`, not the raw `PipelineState`, so the build composable can't even get the right data.

---

## 2. Significant Concerns — Should Fix

### 2.1 All User Messages During Build Are Treated as Edit Queues

In `AgentPanel.handleSend()`, if `isBuilding(projectId)` is true, **every** user message gets routed to `queueEdit()` instead of the AI. This means:
- The user can't answer the AI's questions (address, hours, etc.)
- The user can't have any conversation during build
- The spec (§4) envisions a rich back-and-forth where user answers feed into `BuildState.chatAnswers`

The build agent implemented `queueEdit` but not the question-asking or answer-parsing flow at all. The entire §4 "Build-Time Chat" feature (questions, adaptive strategy, silence handling) is **unimplemented**.

### 2.2 `useBuildProgress.postBuildMessage` Directly Pushes to `messages` Array

```ts
messages.value.push({...})
```

This bypasses `useConversations.sendMessage()` and `appendMessage()`. While intentional (to avoid triggering AI responses), it creates a parallel message-insertion path. If `useConversations` ever adds middleware, validation, or persistence, build messages will bypass it.

### 2.3 `OnboardingChat` Creates Its Own Messages Array — Doesn't Use `ChatMessage` Properly

`OnboardingChat` passes a plain `content: string` to `ChatMessage`, but looking at the component's likely interface (it takes `ContentBlock[]` based on `Message.content`), this may not render correctly. The chat message component probably expects structured content blocks, not a raw string.

### 2.4 No Loading State Between "Let's build it" and Workspace

The spec (§2) says the transition should be < 500ms and feel seamless. Currently:
1. User clicks "Let's build it"
2. `onConfirm()` emits after a 200ms close animation
3. `MainLayout.onProjectCreated()` creates project + navigates
4. But the build hasn't started (see §1.1), so the workspace appears with no build progress

Even if the build did start, there's no indication in the preview that anything is happening until pipeline data arrives. The spec's "Stage 1: Skeleton" (centered project name + "Setting up...") is not implemented.

### 2.5 `BrowserBar` Page Dimming Works But Navigation to Unbuilt Pages Doesn't

`BrowserBar` correctly shows `dimmed` class for incomplete pages. But when the user clicks a dimmed page, `SitePreview.navigateTo()` sets `currentPage` — and the preview has no handling for showing "Working on this page…" for pages without sections. It would either show nothing or the previous page's content.

### 2.6 Reactive Map Gotcha

`builds` is `reactive(new Map())`. Vue's reactivity with `Map` is supported in Vue 3, but computed properties that call `builds.get(projectId)` inside `useBuildProgress` return a non-reactive value — mutations to the BuildState object's nested properties (like `bs.status = 'complete'`) may not trigger reactive updates in consuming components. Should use `ref` + spread pattern, or ensure deep reactivity with `reactive` on the BuildState objects themselves.

---

## 3. Minor Notes — Nice to Fix

### 3.1 Modal Close Animation Conflicts

`NewProjectModal` has both CSS `@keyframes` animations AND Vue `<Transition>` hooks on the same element. The `modal-closing` class triggers `fadeOut`/`scaleOut` keyframes, but the `<Transition name="modal">` also applies opacity transitions. These may fight each other.

### 3.2 Missing `aria-modal` and Focus Trap

The modal has no `role="dialog"`, `aria-modal="true"`, or focus trap. Keyboard users can tab behind the modal. Minor for a prototype but worth noting.

### 3.3 `OnboardingChat.start()` Called at Module Evaluation

`start()` is called immediately in `<script setup>`, which means it runs when the component is created — even if the modal isn't visible yet. Should be `onMounted(start)`.

### 3.4 `shakeInput` Timing

The shake animation lasts 400ms but the ref resets after 500ms. The 100ms gap is fine, but if the user rapidly hits Enter on an empty name field, the animation won't re-trigger because `shakeInput` is still `true`.

### 3.5 Message IDs Could Collide

Both `useBuildProgress` and `AgentPanel` generate IDs with `msg-${Date.now()}-${random}`. The `Date.now()` component has millisecond resolution — rapid messages in the same ms could collide. Low risk but the pattern is duplicated in 3+ places.

### 3.6 `ChatMessage` Content Prop Mismatch

`OnboardingChat` passes `content` as a string to `ChatMessage`. The actual `ChatMessage` component likely expects `ContentBlock[]` based on the `Message` type. Need to verify the component's actual props interface.

### 3.7 `useBuildProgress` Doesn't Clean Up Pipeline Listeners on Error Retry

`retryBuild` deletes the build state and calls `startBuild` again, but the previous pipeline callbacks from the failed build were already unsubscribed in the error handler, so this is fine. However, if `startBuild` throws synchronously (e.g., `getPagesForSiteType` fails), the listeners are never cleaned up.

---

## 4. What's Good — Preserve This

### 4.1 Modal Conversational UX
The three-exchange flow in `OnboardingChat` is clean and well-structured. The chip selection → dismissal animation is satisfying. The step state machine is simple and correct. The delay timing (300ms for agent responses) feels natural.

### 4.2 Type-Specific Copy
The per-type message maps (`nameMessages`, `descMessages`) match the spec's tone precisely — casual, concise, forward-moving.

### 4.3 `useProjects.createProject` ID Generation
The slugify + collision-avoidance suffix pattern is exactly what the spec calls for and is implemented correctly.

### 4.4 `useBuildProgress` Architecture
The overall design — `Map<string, BuildState>`, separate chat state tracking, progress/completion/error message templates — is sound. The page-complete reporting with dedup (`pagesReportedComplete`) is a nice touch.

### 4.5 `BrowserBar` Enhancement
The `dimmed` prop and `⋯` indicator for unbuilt pages is a thoughtful addition that matches the spec's "subtle indicator next to pages that haven't been built yet."

### 4.6 Build Progress Calculation
`totalProgress` with weighted theme/structure/pages is a reasonable heuristic and the composable exposes it cleanly.

### 4.7 Edit Queue During Build
The `queueEdit` pattern with user-facing acknowledgment message is the right approach — it just needs to be one of several message handling paths, not the only one.

---

## Summary

The two agents' work is individually solid but **not integrated**. The critical gap is that `createProject` never triggers `startBuild`, and even if it did, the `SitePreview` doesn't know how to render from `BuildState`. The pipeline singleton also can't support the multi-build architecture that `useBuildProgress` was designed for.

**Estimated effort to fix critical issues:** 2-3 hours
- Wire `startBuild` call in `MainLayout` (15 min)
- Remove duplicate `ProjectBrief` type (5 min)
- Connect `SitePreview` to `BuildState` for rendering (1-2 hours)
- Scope pipeline state per-project or accept single-build limitation (1 hour)

# Phase 3: New Project Flow

The onboarding experience — from clicking "Add project" to watching a site build in front of you.

Phase 3 is the UX layer on top of the section system (Phase 1) and AI generation pipeline (Phase 2). It owns the modal, the transition, the progressive preview during build, and the build-time chat that keeps users engaged while their site takes shape.

---

## 1. The Modal Experience

### Trigger

The modal opens when the user clicks:
- The **"Add project"** button in the sidebar footer
- The **"Add project"** card on the home grid (if present)

Both produce the same modal. The rest of the app dims behind a backdrop overlay (`rgba(0,0,0,0.5)`).

### Structure

The modal is a **conversational mini-chat**, not a form. It looks like a stripped-down version of the AgentPanel — same bubble style, same input area, same personality — but focused and ephemeral. The user is having a quick three-exchange conversation with the AI before it goes off to build.

**Layout:**
- Centered on screen, max-width `480px`, max-height `600px`
- Rounded corners (`--radius-l`)
- Background: `--color-surface`
- Border: `1px solid var(--color-surface-border)`
- Shadow: large elevation shadow (modal-level)
- Interior: vertical stack with messages area (scrollable) and input area at bottom
- Close button (×) in the top-right corner, tertiary style

### The Three Exchanges

Each exchange is a pair: an AI message (left-aligned, same style as `ChatMessage` with `role="agent"`) and a user response.

#### Exchange 1: "What are you building?"

**AI message:**

> Hey! What are you building today?

Below the message, **quick-reply buttons** appear as a row of pill chips:

| Label | Icon | Maps to |
|-------|------|---------|
| Restaurant | 🍽️ | `restaurant` |
| Portfolio | 🎨 | `portfolio` |
| Online Store | 🛍️ | `store` |
| Blog | ✍️ | `blog` |
| Something else | ✨ | `custom` |

**Pill chip design:**
- `--font-size-m`, `--font-weight-medium`
- Background: `--color-surface-secondary`
- Border: `1px solid var(--color-surface-border)`
- Border-radius: `--radius-m` (full pill)
- Padding: `--space-xxxs` block, `--space-xs` inline
- Hover: border color shifts to `--color-accent`
- Wrap to second row if needed (flex-wrap)

Clicking a chip:
1. The chip highlights (accent background, white text)
2. A user bubble appears with the selection text (e.g., "Restaurant")
3. Other chips disappear
4. The next AI message appears after a brief pause (`300ms`)

**Free text alternative:** The input area at the bottom is always visible. The user can type instead of clicking a chip. Typing anything and pressing Enter skips the chips. The AI infers the type from the free text.

#### Exchange 2: "What's it called?"

**AI message (varies by type):**

- Restaurant: *"Nice — what's the restaurant called?"*
- Portfolio: *"Love it. What's your name, or what should we call the site?"*
- Store: *"Great choice. What's the store called?"*
- Blog: *"Fun. What do you want to call it?"*
- Custom: *"Cool! What's it called?"*

The user types a name and presses Enter. It appears as a user bubble.

**Validation:** The name field is required. If the user sends an empty message, the input shakes briefly (CSS animation) and the placeholder text reads "Give it a name…"

#### Exchange 3: "Describe it in a sentence."

**AI message (varies by type):**

- Restaurant: *"Last thing — describe it in a sentence. What kind of food, what's the vibe?"*
- Portfolio: *"Almost there. In a sentence — what kind of work do you do?"*
- Store: *"One more — what do you sell, and who's it for?"*
- Blog: *"Last one — what do you write about?"*
- Custom: *"Describe it in a sentence — who's it for and what does it do?"*

The user types their description. On Enter:
1. User bubble appears
2. Input area transforms — the text input is replaced by a **"Let's build it"** primary button (full width)
3. Brief AI confirmation appears: *"Got it. Let's go."*

**Skipping the description:** If the user sends an empty message or something very short (< 5 characters), the AI proceeds anyway with a more generic brief. It doesn't block.

### Data Collected

On submit, the modal produces a `ProjectBrief`:

```ts
interface ProjectBrief {
  type: 'restaurant' | 'portfolio' | 'store' | 'blog' | 'custom'
  name: string
  description: string        // the user's sentence — becomes the AI creative brief
  freeTextType?: string      // if they typed instead of clicking a chip
}
```

This is passed to the generation pipeline (Phase 2) to begin site creation.

### AI Personality

The modal AI is the same personality that appears in the project chat. It's:
- **Casual but competent.** Lowercase-friendly, short sentences, no corporate speak.
- **Responsive to what the user said.** The follow-up messages reference their choices, not generic templates.
- **Quick.** Three exchanges, no fluff, no "Great choice! I'm so excited to help you build your dream website!" — just forward motion.

The tone should feel like texting someone competent, not filling out a wizard.

---

## 2. The Transition

The moment the user confirms, the experience should feel like a **seamless handoff** from the modal to the project workspace. No loading screens, no "please wait" interstitials.

### Sequence (< 500ms total)

1. **Project created.** A new `Project` record is added to the store with status `"loading"` and a generated `id` (slugified name + short random suffix if needed).

2. **Modal closes.** Fade out backdrop + scale-down modal (`transform: scale(0.95)`, `opacity: 0`, `--duration-slow`). No abrupt disappear.

3. **Sidebar updates.** The new project appears at the top of the sidebar project list with:
   - Auto-generated favicon (DiceBear `shapes` with the project name as seed, matching existing pattern)
   - The project name
   - `StatusIndicator` in `"loading"` state (spinning blue ring)

4. **Router navigates.** `router.push({ name: 'project', params: { id: newProject.id } })`. This triggers `ProjectPage.vue` to mount.

5. **Workspace appears.** The two-panel layout (chat + preview) renders. Both panels are immediately visible — no staggered loading.

### What the User Sees

The modal shrinks away and the full project workspace is behind it, already laid out. The sidebar shows their new project with the blue spinner. The chat has the AI's first message. The preview shows the initial build state. It feels like lifting a curtain.

---

## 3. Preview During Build

The preview panel (`SitePreview`) shows the site assembling progressively. This is the visual payoff — watching your site come to life.

### Build Stages

Each stage corresponds to data arriving from the Phase 2 generation pipeline.

#### Stage 1: Skeleton ("Setting up…")

**Trigger:** Project created, no generated data yet.

The preview iframe renders a minimal HTML document with:
- The site's theme CSS already applied (background color, font imports loading)
- A centered message: the project name in the site's chosen heading font, with a subtle pulse animation
- No nav, no content, no footer

This stage lasts only seconds — just long enough to feel intentional, not broken.

```
┌─────────────────────────────┐
│                             │
│                             │
│                             │
│       Downstreet Cafe       │
│       Setting up...         │
│                             │
│                             │
│                             │
└─────────────────────────────┘
```

#### Stage 2: Theme Applied

**Trigger:** `SiteTheme` generated.

The preview updates with the full theme CSS — background color, heading and body fonts, accent colors via custom properties. The skeleton message now displays in the real fonts with the real colors. This is the first moment the site feels *theirs*.

#### Stage 3: Header Arrives

**Trigger:** Header template part generated.

The navigation bar renders at the top of the page. It shows the site name and nav links (even though some pages don't exist yet — links are present but non-functional during build). The skeleton message below it can shift to a more compact state or disappear.

```
┌─────────────────────────────┐
│ Downstreet Cafe    Menu  About│
│─────────────────────────────│
│                             │
│                             │
│       Building your site... │
│                             │
│                             │
└─────────────────────────────┘
```

#### Stage 4: Sections Stream In

**Trigger:** Each section's data is generated and rendered.

Sections appear one by one in document order. Each new section **fades in** (`opacity 0→1`, `translateY 10px→0`, `--duration-slow`, `--ease-out`). The hero section arrives first (highest visual impact), then subsequent sections top-to-bottom.

The "Building your site…" placeholder disappears when the first section arrives.

If the user is scrolled down, new sections append below without disrupting scroll position. If they're at the top, they see each section push content down naturally.

#### Stage 5: Footer Arrives

**Trigger:** Footer template part generated.

The footer renders at the bottom. By this point, the page looks substantially complete.

#### Stage 6: Complete

**Trigger:** All sections for all pages generated.

- `StatusIndicator` switches from `"loading"` to `"running"`
- The sidebar's spinner becomes a green dot
- The AI sends a completion message in chat (see §4)

### User Interaction During Build

The preview is **fully interactive during build.** The user can:
- **Scroll** through generated content
- **Click nav links** to switch pages (if that page has content; see below)
- **Hover** over elements (cursor changes, hover states work)
- **Resize** the chat/preview split (existing drag handle works normally)

What they **can't** do during build:
- Nothing is explicitly disabled. If they click a nav link to a page that hasn't been built yet, the preview shows that page's skeleton state (theme + header + "Building this page…" message).

### Unbuilt Pages

If the user navigates to a page via the nav or `BrowserBar` before that page's sections have been generated:

- The preview shows the header (already built, shared across pages)
- Below the header: a single centered line — *"Working on this page…"* — in the body font, muted color
- The footer (if built) appears at the bottom
- When sections for that page start arriving, they stream in using the same fade-in animation

The `BrowserBar` page dropdown shows all planned pages from the start, with a subtle indicator (e.g., a small spinner icon or dimmed text) next to pages that haven't been built yet.

---

## 4. Build-Time Chat

The build takes time. The chat makes that time productive and engaging instead of empty.

### First Message

Immediately after the workspace appears, the AI sends its opening message. This acknowledges the project and sets expectations:

**Restaurant example:**
> *Setting up Downstreet Cafe — I'm building you a warm, inviting site with a homepage, menu, about page, and contact info.*
>
> *This'll take a few minutes. While I work, I'll have some questions that'll make your site way better.*

**Portfolio example:**
> *Building out your portfolio site — clean layout, work showcase, about page, and contact. Hang tight while I put it together.*
>
> *Got a few questions while I work that'll help me nail it.*

The tone: confident, specific (mentions what pages are being built), and sets up the back-and-forth that follows.

### Adaptive Chat Strategy

Build times are unpredictable — a fast model with parallelism might finish in under a minute, while a slower setup could take several minutes. The chat strategy must adapt:

- **If the build finishes quickly** (before the AI has asked more than one question), the AI pivots immediately: *"Your site is ready! Here's what I built."* It does not awkwardly continue asking questions after the build is done.
- **If the build takes longer**, the AI fills the time with questions and progress updates as described below.
- The AI tracks build completion events. When the pipeline signals `complete`, the AI interrupts its question flow and delivers the completion message, regardless of where it is in the question sequence.

### Structured Information Gathering

The AI asks questions in a natural conversational flow, interspersed with build progress updates. Questions are **never fired in a batch** — one at a time, with space for the user to respond.

The question sequence adapts to the project type. For a restaurant:

**Question 1 — After the hero section is built (~30s in):**

> *Your homepage is starting to come together — take a look at the preview.*
>
> *Quick question: what's the address? I'll get it on the site and set up a map.*

**Question 2 — After the user responds (or after ~2 minutes if they don't):**

> *Do you have your hours? Like Mon–Fri 7am–6pm, that kind of thing.*

**Question 3 — After menu sections start building:**

> *I'm working on the menu page now. Do you have a menu I can reference — a PDF, a link, or even just the highlights?*

**Question 4 — Conversational / content-gathering:**

> *Tell me a bit about what makes this place special. The backstory, the vibe, anything you want people to know. I'll work it into the about page.*

**Question 5 — Brand assets:**

> *Got a logo? You can drop an image here and I'll add it to the header.*

Each answer the user provides **feeds back into the generation pipeline.** If the contact-info section hasn't been generated yet, the address goes directly into the section data. If it has been generated, the AI triggers a section update (Phase 2 re-generates that section with the new data). The user sees the preview update.

### Progress Updates

Interspersed with questions, the AI reports build milestones:

> *Your homepage is looking good — the hero and about section are done. Working on the menu now.*

> *Menu page is ready. Take a peek — I used your hours for the banner at the top.*

> *Almost there — just finishing up the contact page.*

Progress updates reference the preview explicitly, encouraging the user to look. They're specific (name the page or section) not generic ("making progress!").

### Commercial Opportunities

At natural points in the conversation — never before the site has visible progress — the AI can mention:

> *By the way, when you're ready to go live, I can help you connect a custom domain — like downstreetcafe.com.*

> *Want a matching email address? Like hello@downstreetcafe.com — I can set that up.*

These are **one-time mentions**, presented as helpful suggestions, not sales pitches. If the user doesn't engage, the AI moves on and doesn't bring it up again.

### Handling Silence

If the user doesn't respond to questions:

- **After 1 unanswered question:** The AI waits. It continues with build progress updates but doesn't ask another question immediately.
- **After 2 unanswered questions:** The AI stops asking and shifts to progress-only updates: *"Menu page is done. About page is next."*
- **When the build completes:** The AI gives the final summary (see below) regardless of whether the user engaged in the chat. The unanswered questions don't block anything — the AI builds with sensible defaults.

The AI is **never pushy.** No "Hey, you still there?" or "Don't forget to answer my question!" If the user is just watching the preview and vibing, that's fine.

### Build Complete Message

When all pages are generated:

> *Your site is ready! Here's what I built:*
>
> *🏠 **Home** — Hero, about section, hours*
> *📋 **Menu** — Full menu with categories*
> *ℹ️ **About** — Your story and team*
> *📅 **Events** — Upcoming events*
> *📍 **Contact** — Address, hours, map*
>
> *Click around the preview to explore. Tell me what you'd like to change — I can update anything.*

The message lists all pages built, giving the user a clear picture of what they have. It ends with an invitation to direct edits, transitioning into Phase 4 territory.

---

## 5. Data Flow

### Modal → Project Creation

When the user confirms in the modal:

1. **Generate project ID.** Slugify the name (e.g., "Downstreet Cafe" → `downstreet-cafe`). If the ID already exists, append a numeric suffix (`downstreet-cafe-2`).

2. **Create `Project` record:**

```ts
const newProject: Project = {
  id: generatedId,
  name: brief.name,
  favicon: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(brief.name)}`,
  status: 'loading',
  url: '',                    // no URL until build produces something previewable
  createdAt: new Date().toISOString(),
  description: brief.description,
}
```

3. **Create `BuildState` record** (new type, see below).

4. **Add to project store.** The reactive store update triggers the sidebar to show the new project.

5. **Start generation pipeline.** Pass the `ProjectBrief` to the Phase 2 AI generation system.

### Build State

`BuildState` is the in-progress version of `SiteData`. It tracks partially-generated site data as it streams in from the pipeline. When the build completes, `BuildState` collapses into a final `SiteData` object that the rest of the system uses.

For the prototype, all state lives in memory (reactive Vue state). No localStorage persistence. If the user refreshes during a build, they lose progress — acceptable for a prototype.

```ts
interface BuildState {
  projectId: string
  status: 'queued' | 'generating-theme' | 'generating-structure' | 'generating-sections' | 'complete' | 'error'
  brief: ProjectBrief
  theme: SiteTheme | null
  templateParts: {
    header: string | null      // rendered HTML
    footer: string | null
  }
  pages: {
    [pageId: string]: {
      title: string
      slug: string
      planned: boolean         // true once AI decides this page should exist
      sections: Section[]      // populated as they're generated
      complete: boolean
    }
  }
  chatAnswers: {
    address?: string
    phone?: string
    hours?: string[]
    email?: string
    logoUrl?: string
    referenceUrl?: string
    description?: string       // extended description from chat
    [key: string]: any
  }
  error?: string
}
```

### How Chat Answers Update the Build

When the user answers a question in chat:

1. **Parse the answer.** The AI extracts structured data from the conversational response (e.g., "We're at 123 Main St, open 7-6 weekdays" → `address: "123 Main St"`, `hours: ["Mon–Fri: 7am–6pm"]`).

2. **Update `BuildState.chatAnswers`.** The structured data is stored.

3. **Check pending sections.** If a section that would use this data hasn't been generated yet (e.g., `contact-info`), the data is included in the generation prompt for that section.

4. **Update generated sections.** If the relevant section already exists, the AI re-generates just that section's data with the new information. The renderer updates the preview.

### Building → Ready Transition

When the last section of the last page is generated:

1. `BuildState.status` → `'complete'`
2. `Project.status` → `'running'`
3. `StatusIndicator` in sidebar switches from spinning blue to green dot
4. The AI sends the build-complete message in chat
5. `BuildState` is retained (for potential future reference) but the project is now in normal editing mode

---

## 6. Edge Cases

### User closes the modal mid-flow

- **At exchange 1 or 2 (no name yet):** Modal closes, nothing is created. No project, no side effects. Clean dismiss.
- **At exchange 3 (name entered, no description):** Modal closes, nothing is created. The name is lost. If the user reopens the modal, it starts fresh.
- **Dismiss methods:** Click backdrop, click ×, press Escape. All behave the same.

The modal has no "save draft" concept. It's quick enough that re-doing it isn't painful.

### User navigates away during build

The build **continues in the background.** The `BuildState` is in the store, not tied to the component lifecycle.

- Sidebar continues showing the project with the loading spinner
- If the user returns to the project, the preview shows the current build state (whatever sections have arrived so far)
- Chat shows the full message history, including any progress updates the AI sent while the user was away
- The AI does **not** ask questions while the user is on a different page — it queues them and resumes when the user returns

### Build fails partway through

If the generation pipeline errors:

- **Partial success:** Whatever was generated stays. The preview shows the completed sections. The AI sends an error message: *"I ran into a problem building the events page. The rest of your site is ready — want me to try that page again?"*
- **Total failure (no sections generated):** The preview shows the skeleton state. The AI: *"Something went wrong and I couldn't build the site. Want to try again?"* A "Retry" button appears in the chat.
- `Project.status` stays `'loading'` — it does not switch to `'running'` until the user either retries successfully or manually accepts the partial state.
- `BuildState.status` → `'error'` with `BuildState.error` describing what failed.

### User gives edit instructions before build is complete

This is expected and welcomed. The AI handles it by:

1. **Acknowledging the request:** *"Got it — I'll make the header text bigger once I finish building the page."*
2. **Queueing the edit.** The edit is stored and applied after the relevant section is generated.
3. **If the section already exists:** The edit is applied immediately, same as a normal Phase 4 edit. The user sees the preview update.

The AI doesn't say "please wait until the build is done." Interleaving edits with the build is part of the co-creation feeling.

### Multiple projects being built simultaneously

Supported but not encouraged:

- Each project has its own `BuildState`
- The sidebar shows multiple projects with loading spinners
- The generation pipeline processes them independently (potentially in parallel if the backend supports it)
- The chat for each project runs independently — switching projects switches chat context
- The AI for each project is unaware of other builds in progress

---

## 7. Component Architecture

### New Components

#### `NewProjectModal`

Top-level modal component. Manages the three-exchange flow.

- **Props:** none (triggered via a shared `useNewProject()` composable or event bus)
- **Emits:** `created(project: Project)` when the flow completes
- **Contains:** `OnboardingChat`, backdrop overlay, close button
- **State:** Current exchange step (1/2/3/done), collected brief data
- **Transition:** Fade-in backdrop + scale-up modal on open; reverse on close

#### `OnboardingChat`

The conversational interface inside the modal. A simplified version of `AgentPanel` without tabs, toolbars, or history.

- **Props:** none
- **Emits:** `complete(brief: ProjectBrief)`
- **Contains:** Message list (same `ChatMessage` component), `QuickReplyChips`, `InputChat` (reused)
- **State:** Messages array, current step, collected data
- **Behavior:** After each user response, adds the AI's next message with a brief delay for natural pacing

#### `QuickReplyChips`

A row of selectable pill buttons for the "What are you building?" step.

- **Props:** `options: { label: string, icon: string, value: string }[]`
- **Emits:** `select(value: string)`
- **Layout:** `hstack flex-wrap gap-xxs`
- **States:** default, hover, selected, dismissed (fades out unselected chips)

#### `BuildProgress`

Not a visible component — a composable (`useBuildProgress`) that tracks and exposes the build state for a given project.

- **Returns:** Reactive `BuildState`, computed helpers like `isBuilding`, `completedPages`, `currentStage`
- **Used by:** `SitePreview` (to know what to render), `AgentPanel` (to drive chat behavior), `Sidebar` (to show building indicator)

### Modifications to Existing Components

#### `Sidebar`

- Projects with `status: 'loading'` show `StatusIndicator` in loading state (already supported)
- New project appears at the top of the list (sorted by `createdAt` descending, or insert at position 0)
- The "Add project" button triggers `NewProjectModal`

#### `ProjectPage`

- Detects whether the current project is in build mode (`BuildState.status !== 'complete'`) or ready mode
- **Build mode:** `AgentPanel` operates in build-time chat behavior (progress updates, questions, accepts edits)
- **Ready mode:** `AgentPanel` operates in normal edit mode (Phase 4)
- No visual difference in layout — both modes use the same two-panel split. The difference is in chat behavior and preview content.

#### `SitePreview`

The most significant changes. Currently renders from `mockSites` and `srcdoc`. Needs to support progressive rendering from `BuildState`.

- **New data source:** When a project has an active `BuildState`, the preview renders from `BuildState` data instead of `mockSites`
- **Progressive `srcdoc`:** A computed that assembles the HTML document from available pieces:
  - Always: document shell + theme CSS + component library CSS
  - If `templateParts.header`: render the header
  - For the current page: render available `sections` in order
  - If `templateParts.footer`: render the footer
  - If no sections yet: render the skeleton/building message
- **Section transitions:** New sections trigger a CSS animation. The renderer tracks which sections are new (by comparing previous and current section lists) and adds a `section-enter` class that triggers the fade-in.
- **Page availability:** `BrowserBar` page list derived from `BuildState.pages` keys. Pages without sections show an indicator.

#### `AgentPanel`

- Build-time behavior: The first messages and question flow are driven by `BuildState` progress, not just user input
- Needs to coordinate with `useBuildProgress` to know when to send progress updates and questions
- Chat history persists in the project's store — navigating away and back shows the full conversation

### State Management

**`useBuildProgress` composable** (new):
- Owns the `BuildState` for active builds
- Stored in a reactive `Map<string, BuildState>` (project ID → build state)
- Exposes methods: `startBuild(brief)`, `updateTheme(theme)`, `addSection(pageId, section)`, `setError(msg)`, `markComplete()`
- Stored in reactive Vue state (in-memory only for the prototype — no localStorage persistence)

**`useProjects` composable** (existing):
- Gains a `createProject(brief: ProjectBrief): Project` method
- Handles ID generation, adding to the store, triggering the build

**Flow:**
1. `NewProjectModal` calls `useProjects().createProject(brief)`
2. `createProject` creates the `Project`, initializes `BuildState` via `useBuildProgress`, and starts the pipeline
3. `SitePreview` reads from `useBuildProgress` when a build is active
4. `AgentPanel` reads from `useBuildProgress` to drive chat behavior
5. When complete, `useBuildProgress` updates the `Project` status to `'running'`

---

## What This Doesn't Cover

- **The actual AI prompts** for generating onboarding chat messages. The exact copy in this doc is directional — the real AI will vary its responses.
- **Image generation or selection** during build. Sections reference placeholder images until a future phase handles real image sourcing.
- **Phase 4 editing.** Build-complete is the handoff point. Everything after "What would you like to change?" is Phase 4.
- **Authentication or accounts.** Projects are local to the browser session.
- **Mobile/responsive modal layout.** The modal spec assumes desktop viewport. Mobile adaptation is a separate concern.

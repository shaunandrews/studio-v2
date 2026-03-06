# TODO

## Extract Loop Architecture (Current Direction)

### Done ✅
- [x] Phase A: Extraction proof — messy CSS → clean design system (tested with real API)
- [x] Phase B: New data model (Site/Page/Section/Theme), simple renderer, seed sites, store
- [x] Phase C: Generation loop (design brief → parallel sections → extraction → review)
- [x] Phase D: Editing cards (self-contained lifecycle, undo/redo, SectionEditCard, ThemeEditCard)

### Done (Conversational Build) ✅
- [x] Test seed sites rendering in the preview — fixed slug mismatch, nav links, font flash, body margin
- [x] Wire generation loop into new project flow — useBuildProgress bridges ProjectBrief → generateSite()
- [x] Conversational build UX — agent narrates generation in chat, ProgressCard tracks steps live
- [x] Generation event callbacks — `onEvent` param on `generateSite` fires brief-done/section-done/page-start/complete/error
- [x] Preview auto-open with animation — hidden during brief, slides open when first section lands
- [x] Section fade-in — new sections created with `opacity:0` → CSS transition in iframe listener
- [x] Diff-based section rendering — SitePreview tracks rendered sections in a Set, sends individual updates
- [x] Section ordering — `data-order` attribute ensures sections insert at correct DOM position during parallel gen
- [x] Streaming agent messages — `streamAgentMessage()` types text in over ~400ms like real AI responses
- [x] ProgressCard running state — homepage sections marked `running` immediately (parallel), subsequent pages on `page-start`

### Done (Generation Resilience) ✅
- [x] **Per-section error boundaries** — `generateSectionWithRetry()` wraps each section in try/catch so one failure doesn't kill the page
- [x] **Retry with reprompt** — on parse failure, retries once with a stripped-down prompt asking for only CSS + HTML blocks
- [x] **Skip-and-continue** — failed sections marked as `error` in ProgressCard, build continues. Completion message reports what failed
- [x] **section-error event** — new event type lets orchestrator track failures without stopping the build
- [x] **Non-fatal extraction & review** — design system extraction and CSS review wrapped in try/catch so they can't kill the build
- [x] **Design brief progress** — "Crafting the design brief..." thinking indicator shown while brief generates, removed when brief arrives
- [x] **Design brief chat card** — new `designBrief` card type showing direction, fonts, and color swatches extracted from CSS variables

### Done (Inline Onboarding) ✅
- [x] **Kill the modal** — replaced `NewProjectModal` / `OnboardingChat` / `QuickReplyChips` with inline chat-based onboarding
- [x] **`useOnboarding.ts`** — singleton state machine with promise-based input waiting, same pattern as `useBuildProgress`
- [x] **`postMessage()`** — new `useConversations` export: append messages without triggering AI responses (for onboarding flow)
- [x] **`createUntitledProject()`** — timestamp-based ID, dicebear favicon, adds to bottom of project list
- [x] **`updateProject()`** — partial updates for name/favicon/description; sidebar updates live as user names the project
- [x] **Seamless build transition** — onboarding collects type/name/description, then calls `startBuild()` directly — no modal dismiss, no page reload
- [x] **Preview hidden during onboarding** — `hide(projectId)` called at onboarding start, preview stays hidden until first section is built
- [x] **Enter to send** — Enter sends message, Cmd+Enter for newline (InputChat keydown handler)
- [x] **Dynamic placeholder** — InputChat placeholder changes per onboarding step ("Or type what you're building...", "Give it a name...", etc.)
- [x] **Thinking dots** — pulsing three-dot animation while design briefs generate, removed when briefs arrive
- [x] **ProgressCard spinners** — running items show animated spinner ring instead of "RUNNING" text
- [x] **Card width consistency** — DesignBriefPickerCard aligned to same width/margins as ChatCard
- [x] **Consume stale action buttons** — type/skip buttons stripped from chat after use, step guards prevent out-of-order clicks

### Next
- [ ] **Input-anchored responses** — Move predefined response options (type chips, design brief picks, color palettes) from inline chat messages to a slot above the chat input, visually connected to it. Generalizes to any "choose one" interaction — makes options feel like user choices rather than agent output. Explore as a reusable pattern across onboarding, brief selection, and theme picking.
- [ ] Graceful API key check — warn user when no Anthropic key is configured instead of silently failing to 'stopped'
- [ ] Graceful API error handling — parse Anthropic error responses and show human-readable messages in chat (e.g. "Your API credits have run out" instead of raw JSON dumps)

### Prompt Quality & Design Variety
Designs are coming out very similar across projects. The `design-brief-prompt.ts` says "complete creative freedom" but gives no variety signal, so Sonnet defaults to safe corporate palettes every time. To fix:
- [ ] **Define expected CSS variable schema** — specify the variable names the system expects (--color-primary, --color-bg, --font-heading, etc.) so sections can reliably use them, while leaving values entirely to the AI
- [ ] **Push for distinctiveness** — add variety prompting: "be bold, avoid generic corporate blues, surprise me"
- [ ] **Test different models** — Opus may be slower but produce more creative, higher-quality results. Add model selection to the generation config
- [ ] **Temperature tuning** — experiment with temperature > 1.0 for the design brief (creative divergence) vs lower temperature for sections (consistent execution)
- [ ] **Section prompt quality** — the section prompt is bare-bones; richer context about content expectations and design intent would improve output

### Known Failure: Section Parse Errors
The AI sometimes returns sections in unexpected formats that `parseSectionResponse()` can't parse. Root causes:
- **Token exhaustion** — later sections (especially footer) hit `max_tokens: 3072`, truncating the response mid-format
- **Format drift** — AI returns prose + code instead of the expected `\`\`\`section:role` fenced block
- **Promise.all cascade** — one parse failure rejects the entire parallel batch, killing all in-flight sections

Fix strategy: error boundaries per section + retry + skip-and-continue (see items above).

### Later
- [ ] Design pass on the app UI (chat, cards, preview chrome)
- [ ] Iterate on generation prompt quality (the actual output needs to look good)
- [ ] Test a real AI-generated site end-to-end with all pages completing

---

## Legacy (from rigid section system — archived)

## Design Pass
- [ ] Full visual audit of every screen and component — spacing, alignment, typography, color usage
- [ ] Chat message layout and rhythm — how text, cards, and actions flow together
- [ ] Card visual design — borders, shadows, padding, information hierarchy within each card type
- [ ] Chat input area — sizing, placement, relationship to message list
- [ ] Titlebar and toolbar design — icon sizing, spacing, dropdown styling
- [ ] Tab bar — active/inactive states, close button positioning, overflow behavior
- [ ] Sidebar project list — row density, hover/active states, status indicator placement
- [ ] Site preview panel — toolbar balance, iframe loading states, empty/error states
- [ ] Home screen — what the user sees with no project selected (currently bare)
- [ ] Transitions and motion — page transitions, panel resize feel, hover states
- [ ] Responsive behavior — how everything degrades as panels get narrower
- [ ] Dark surface consistency — chrome elements (titlebar, sidebar) vs light surfaces (chat, preview)
- [ ] Mock site quality — do the 4 homepages hold up on close inspection?

## Polish
- [ ] Card entrance animations (fade-in text, staggered card entrance, actions appear last)
- [ ] Smooth scroll-to-bottom on new messages
- [x] Thinking indicator design — pulsing three-dot animation, spinner rings in ProgressCard

## Bugs / Minor
- [ ] ProgressCard `done` color should use a design token (currently hardcoded `#00a32a`)
- [ ] `ChatCard` wrapper border doesn't adapt on dark surfaces

## Section System (Phase 1 — Complete ✅)
- [x] Define section types and data model
- [x] Extract component CSS library
- [x] Build 14 shared section renderers + page renderer
- [x] Refactor Downstreet Cafe to use section system
- [x] Dark mode support via themeCSSOverride
- [x] Migrate all 7 mock sites to section system (site-specific types, renderers, CSS)
- [x] Remove default header/footer — every site owns its full structure
- [x] Remove backward-compat wrappers — clean SiteData + renderSitePage() API
- [x] Remove all `as any` casts and `display: none` CSS hacks

## AI Theme Integration (Complete ✅)
- [x] Add ThemeUpdateCard type — before/after comparison, "Apply" action
- [x] Update AI system prompt with theme.json schema and themeUpdate card format
- [x] Wire "Apply" action to call updateTheme() → reactive preview update

## Phase 2 — AI Generation Pipeline (Complete ✅)
- [x] AI output format (fenced section blocks) — parser handles section:TYPE, theme, templatePart:TYPE, card:context
- [x] Generation pipeline orchestration — PipelineOrchestrator with theme→parts→parallel pages, retry, abort
- [x] Progressive rendering (skeleton → sections stream in) — renderProgressivePage, postMessage incremental updates
- [x] System prompt for section generation — auto-generated schemas from Phase 1 types, page presets
- [x] Vue composable (usePipeline) — reactive state, skeleton slots, progress card, mock mode
- [x] Generated site persistence — survives navigation via generated-sites store
- [x] Incremental streaming — sections appear as they arrive, not batch-per-page

## Phase 3 — New Project Flow (Complete ✅)
- [x] ~~Onboarding modal (conversational mini-chat)~~ → replaced with inline chat onboarding via `useOnboarding.ts`
- [x] Project creation — timestamp ID, DiceBear favicons, sidebar integration, live name updates
- [x] Build-time chat — first message, progress updates, completion summary, error handling
- [x] Progressive preview during build — hidden until first section → slides open → complete
- [x] Pipeline integration — useBuildProgress composable wires onboarding → pipeline → preview
- [x] BrowserBar shows planned pages with dimmed unbuilt indicators
- [x] Deleted: `NewProjectModal.vue`, `OnboardingChat.vue`, `QuickReplyChips.vue`

## Next: Phase 4 — Section Editing
- [ ] Edit taxonomy (9 edit types)
- [ ] New card types (SectionUpdate, SectionAdd, etc.)
- [ ] Try-it preview mode
- [ ] Undo/history

## Future
- [ ] Test live AI card rendering end-to-end — verify Claude returns well-formed cards consistently

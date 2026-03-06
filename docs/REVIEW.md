# Spec Review: Site Builder System

## 1. Overall Assessment

This is a strong spec set for a prototype — well-structured, phased thoughtfully, and grounded in a real existing codebase. The overarching architecture doc is clear and the phase breakdown is logical. However, there are meaningful gaps at the boundaries between phases, several type system contradictions across docs, and some areas where the spec oscillates between prototype-appropriate simplicity and production-grade complexity. The biggest risk is Phase 2's data model diverging from Phase 1's types in ways that would require rework, and the build-time chat UX relying on timing assumptions that don't hold.

---

## 2. Critical Issues

### 2.1 SiteTheme shape mismatch between Phase 1 and Phase 2

**Phase 1** (`types.ts` in the spec, and the existing `src/data/themes/types.ts`) defines `SiteTheme` as:
```ts
interface SiteTheme {
  name: string
  settings: {
    color: ColorSettings & { defaultMode?: ...; modes?: ... }
    typography: { fontFamily: {...}; fontSize: {...}; lineHeight: {...} }
    spacing: { unit: string; scale: number[] }
    layout: { contentWidth: string; wideWidth: string }
  }
}
```

**Phase 2** shows the AI generating a theme like:
```json
{
  "color": { "palette": [...], "background": "...", "text": "..." },
  "typography": { "fontFamily": {...}, "fontSize": {...} }
}
```

No `name`, no `settings` wrapper, no `spacing`, no `layout`, no `lineHeight`. The AI output is a flat structure that doesn't match `SiteTheme` at all. Either the AI needs to produce the full nested structure (including `settings.spacing`, `settings.layout`), or there needs to be a transform layer that fills in defaults. Neither is documented.

**Fix:** Define a `AIThemeOutput` type that represents what the AI actually returns, and a `normalizeTheme(raw: AIThemeOutput): SiteTheme` function with sensible defaults for `spacing`, `layout`, etc.

### 2.2 TemplatePart data types diverge between Phase 1 and Phase 2

**Phase 1** defines:
```ts
interface HeaderData {
  navItems: Array<{ label: string; page: string }>
}
interface FooterData {
  address: string; phone: string; email: string; tagline?: string
}
```

**Phase 2** shows the AI generating:
```json
// header
{ "siteName": "...", "logo": "...", "nav": [{ "label": "...", "href": "..." }] }
// footer
{ "siteName": "...", "address": "...", "social": [...], "copyright": "..." }
```

These are completely different shapes. Phase 1's header has `navItems[].page` (slug-based internal nav). Phase 2's has `nav[].href` (URL-based). Phase 1's footer has no `siteName`, no `social`, no `copyright`. Phase 2's footer has no `tagline`.

**Fix:** Decide which shape is canonical. The AI output format must match what the renderers expect, or an explicit mapping layer is needed.

### 2.3 Section data schemas don't match between Phase 1 types and Phase 2 AI examples

Several Phase 2 AI output examples include fields that don't exist in Phase 1's section data interfaces:

- **`hero-split`**: Phase 2 example includes `"cta": { "label": "View Menu", "href": "/menu" }`. Phase 1's `HeroSplitData` has no `cta` field — it has `extras?: string[]`.
- **`content-cards`**: Phase 2 example includes `"image"` on each card. Phase 1's `ContentCardsData.cards` only has `{ title: string; body: string }` — no `image`.
- **`contact-info`**: Phase 2 example has `"hours"` as `[{ "days": "...", "time": "..." }]`. Phase 1's `ContactInfoData` has `hours?: Array<{ label: string; value: string }>` — different field names (`days`/`time` vs `label`/`value`).
- **`cta-banner`**: Phase 2 example has `"heading"` and `"cta"` object. Phase 1's `CtaBannerData` has `text`, `linkText`, `linkPage` — completely different structure.

This is the most dangerous class of issue. The AI will produce data that passes JSON parsing but fails silently at render time because the renderer looks for fields that don't exist.

**Fix:** The Phase 2 AI examples need to be rewritten to match Phase 1's schemas exactly, OR Phase 1's schemas need to be updated and the renderers adjusted. Either way, there should be one source of truth, and the system prompt's "Available Section Types" should be auto-generated from the actual TypeScript interfaces.

### 2.4 No `order` field in Phase 1's Section interface

The overarching doc (`SITE-BUILDER-SYSTEM.md`) defines `Section` with an `order: number` field. Phase 1 drops it — sections are ordered by array position in `PageTemplate.sections`. Phase 4 references `order` values in `section-reorder` edit operations: `order: string[]`. 

The array-position approach (Phase 1) and the explicit-order approach (overarching doc) are different strategies with different implications for reordering, insertion, and the edit operation format.

**Fix:** Pick one. Array position is simpler for a prototype. If using array position, Phase 4's `section-reorder` operation is just a reordered array of IDs, which it already is. Remove `order: number` from the overarching doc to avoid confusion.

### 2.5 Phase 2's `ParsedAIBlock` section type uses `Record<string, unknown>` but renderers expect typed data

Phase 2's parser produces `{ type: 'section'; sectionType: string; data: Record<string, unknown> }`. Phase 1's renderers expect `HeroSplitData`, `MenuListData`, etc. — strongly typed interfaces.

There's a `validateSectionData` function sketched that checks for required fields, but it references `sectionRegistry` and `definition.schema.required` — a JSON Schema-based validation approach that's never defined in Phase 1. Phase 1 has TypeScript interfaces, not JSON Schemas.

**Fix:** Either (a) define JSON Schemas for each section type alongside the TypeScript interfaces, or (b) use a simpler runtime validation approach (check for known fields, cast with `as`). For a prototype, option (b) is fine — but document the decision and the risk.

---

## 3. Significant Concerns

### 3.1 Build time estimate is wildly inconsistent

The overarching doc says "8-10+ minutes for a full site." Phase 2's performance section estimates "20-40 seconds total" with parallelism. Phase 3 builds its entire chat UX around the 8-10 minute assumption (structured question sequences, commercial opportunities mid-build, progress updates at ~30s intervals).

If the build actually takes 30 seconds, the build-time chat is nonsensical — you'd get one question asked before the build completes. If it takes 10 minutes, the 20-40 second estimate is wrong.

**Impact:** The build-time chat strategy (Phase 3 §4) is the emotional core of the onboarding experience. If timing is wrong, it's either a frantic rush or an awkward silence.

**Fix:** Run actual benchmarks with Claude on the prompt sizes described. Update the overarching doc and Phase 3 chat strategy to match reality. Consider that the chat questions could be asked *after* the build if it's fast.

### 3.2 Two different rendering pipelines in Phase 2

Phase 2 describes two approaches to updating the preview:

1. **Full `srcdoc` re-render** via `renderPage()` that returns a complete HTML string (§3, "Partial Page Renderer")
2. **Incremental `postMessage` updates** that patch individual sections in the iframe (§3, "Incremental Updates")

Both are described but the relationship between them isn't clear. When does the app use approach 1 vs 2? Is `renderPage()` used for the initial load and `postMessage` for updates? If so, the initial skeleton rendering and the incremental section updates need careful coordination — the initial HTML must include the `data-section-id` attributes and the message listener script.

Phase 4 also describes its own `postMessage` protocol for section updates, section highlighting, and theme updates — largely duplicating Phase 2's approach but with different message type names (`update-section` vs `section-update`).

**Fix:** Define one unified iframe communication protocol used by both Phase 2 (build) and Phase 4 (edit). Document when full re-render vs incremental update is used.

### 3.3 State management across page navigation is hand-waved

Phase 3 says `BuildState` is "stored in a reactive `Map<string, BuildState>`" and "persisted to `localStorage`." But `BuildState.pages` contains `Section[]` objects with potentially large HTML content (via `sampleCart` in `order-menu`, `body` HTML in `content-prose`, etc.), plus the full `SiteTheme`.

Questions:
- How large can a serialized `BuildState` get? For a 5-page site, it could easily be 50-100KB of JSON.
- Is `localStorage` (5MB limit) appropriate?
- When does serialization happen — on every section arrival? That's a lot of writes during build.
- The `SiteData` from Phase 1 and `BuildState` from Phase 3 seem to overlap. Is `BuildState` a superset that eventually collapses into `SiteData`?

**Fix:** Clarify the relationship between `BuildState` (Phase 3) and `SiteData` (Phase 1). Define when/how `BuildState` becomes `SiteData`. Consider `IndexedDB` instead of `localStorage` if persistence is important.

### 3.4 Phase 4's `EditOperation` type doesn't match the card data types

Phase 4 defines `EditOperation` as a union type with specific fields per operation. But the card types (`SectionUpdateCardData`, `SectionAddCardData`, etc.) have different structures. For example:

- `EditOperation` for `section-content` has `{ pageId, sectionId, data }` — the *new* data only.
- `SectionUpdateCardData` has `{ before, after }` — both old and new state.

There's no documented function that converts a card's data into an `EditOperation`. The `applyEditOperation` function takes `EditOperation`, but the cards emit `ActionButton` actions. Who does the conversion?

**Fix:** Document the mapping from card action → `EditOperation`. Or simplify: have the card carry the `EditOperation` directly and use the `before`/`after` only for display.

### 3.5 The component library approach will hit CSS conflicts for new site types

Phase 1's component library is a single CSS string extracted from Downstreet Cafe. Class names like `.community`, `.story`, `.values-grid` are semantically specific to a café site. When the AI generates a portfolio site, it can't reuse `.community` for a different purpose without confusion.

The overarching doc mentions "reusable HTML/CSS patterns shared across all sections" but the actual CSS classes in Phase 1 are Downstreet-specific. There's no abstraction layer — `.menu-card` is literally a café menu card.

**Fix:** Acknowledge this explicitly. For the prototype, it's fine — Phase 1 is specifically about proving the architecture with Downstreet. But document that the component library needs generalization before it can serve other site types, and sketch what that looks like (e.g., semantic class names like `.card-grid`, `.item-list` instead of `.menu-card`, `.event-card`).

### 3.6 Snapshot-based undo stores full site state — 50 snapshots could be huge

Phase 4's `SiteSnapshot` contains `state: SiteState` — the *full* site state at each point. 50 snapshots × a multi-page site = significant memory.

**Fix:** Consider storing diffs/patches instead of full snapshots. Or use a more modest limit (10-20) for the prototype. Or document that this is an intentional tradeoff for simplicity.

### 3.7 `extractBusinessDetails` is a black box

Phase 2 §5 references `extractBusinessDetails(message)` — a function that parses conversational user responses to extract structured data like addresses and phone numbers. This is non-trivial NLP. Is it regex-based? Does it use the AI? If AI, that's another API call per chat message.

Phase 2 also mentions "the chat AI can also return a `card:context` block" — but this card type isn't defined anywhere in the card system.

**Fix:** Define how context extraction works. The simplest approach: the chat AI includes a `card:context` block in its response when it detects business details. Define the `ContextCardData` type.

---

## 4. Minor Notes

### 4.1 Inconsistent section type names

- Overarching doc: `hero-fullwidth`. Phase 1 and Phase 2 page presets: `hero-fullwidth`. Phase 1 SectionType union: `hero-image`. These seem like the same thing but have different names. Phase 1's `HeroImageData` is a full-width cover image.

### 4.2 Phase 1 `Section` has no `order` but overarching doc does

Already covered in Critical Issues, but noting the inconsistency.

### 4.3 `hero-split` data field naming

Phase 1: `extras?: string[]` for hours display. The overarching doc example uses `hours: [...]`. Renderers reference `.hours-brief` CSS class. Should the field be called `hours` or `extras`? `extras` is more generic but less clear.

### 4.4 Phase 2 FENCE_REGEX won't match section types with hyphens

```ts
const FENCE_REGEX = /```(section:\w+|theme|templatePart:\w+)\s*\n([\s\S]*?)```/g
```

`\w+` matches word characters (letters, digits, underscore). Section types use hyphens: `hero-split`, `content-cards`. This regex won't match them.

**Fix:** Change `\w+` to `[\w-]+` in the section fence pattern.

### 4.5 Phase 3 says "3 exchanges" but there's actually a 4th interaction

The modal flow: (1) What are you building? (2) What's it called? (3) Describe it. (4) Click "Let's build it" button. The button click is a 4th interaction step, not part of exchange 3.

### 4.6 `renderPage` signature differs between Phase 1 and Phase 2

Phase 1: `renderPage(page: PageTemplate, site: SiteData, activePage: string): string`
Phase 2: `renderPage(theme: SiteTheme | null, templateParts: {...}, slots: SkeletonSlot[]): string`

These are clearly different functions for different purposes (complete render vs progressive render), but they share the same name. This will cause confusion during implementation.

**Fix:** Name them differently. `renderCompletePage()` and `renderProgressivePage()`, or similar.

### 4.7 Phase 4 references `page.parts.header` but Phase 1 moved parts to SiteData

Phase 4 §7 shows: `renderTemplatePart(page.parts.header)`. But Phase 1 explicitly says "Pages don't store header/footer references directly — those come from SiteData." `PageTemplate` has no `parts` field.

### 4.8 `themeId` in Phase 4's EditOperation

```ts
{ type: 'theme'; themeId: string; patch: Partial<SiteTheme['settings']> }
```

There's no concept of `themeId` anywhere else. Each site has one theme. This field is unnecessary.

### 4.9 Phase 2's `executeParallel` has a bug

The settled-promise detection logic:
```ts
const settled = await Promise.race([executing[i].then(() => true), Promise.resolve(false)])
```
This always returns `false` because `Promise.resolve(false)` resolves immediately and wins the race unless the executing promise is *already* settled. The intent is to check if a promise has settled, but this approach doesn't work reliably.

**Fix:** Use a wrapper that marks promises as settled via a side-effect flag, or use `Promise.allSettled` with a different pattern.

---

## 5. What's Good

- **The phased approach is genuinely well-sequenced.** Each phase delivers standalone value and the dependencies are clear. Phase 1's "prove it with Downstreet" strategy is smart — no AI required to validate the architecture.

- **The section data model is the right call.** Separating content (structured data) from presentation (renderers) is the key insight. The AI producing JSON instead of HTML is dramatically more reliable, faster, and editable. This is the right architecture for an AI-powered builder.

- **Phase 1's refactoring plan is practical.** The backward-compatible wrapper strategy means the existing preview keeps working throughout the refactor. No big-bang migration. The validation plan (visual comparison) is appropriate.

- **Phase 4's edit taxonomy is thorough.** The nine edit types cover the realistic edit space well. The "Try it" / "Apply" two-step interaction is a good UX pattern that reduces commit anxiety.

- **The progressive rendering concept is compelling.** Skeleton → theme → header → sections → footer is a smart reveal sequence that gives the user something to look at quickly. The auto-scroll behavior respecting manual scroll is a nice detail.

- **Phase 3's silence handling is realistic.** "After 2 unanswered questions, stop asking" is the right call. Most AI chat UIs don't handle disengagement gracefully. This does.

- **Cost estimate in Phase 2.** ~$0.22 per site at current Sonnet pricing is a useful grounding number. Shows someone did the math.

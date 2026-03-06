# Phase 2 Code Review: AI Generation Pipeline

**Reviewer:** Claude (automated review)
**Date:** 2025-02-16
**Files reviewed:** `ai-pipeline-types.ts`, `generation-prompts.ts`, `pipeline.ts`, `progressive-renderer.ts`, `ai-service.ts` (updated), `SitePreview.vue` (updated)

---

## 1. Critical Issues

### 1.1 Pipeline has no integration point — it's floating code

**Severity:** 🔴 Blocking

The `PipelineOrchestrator` is fully implemented but **nothing calls it**. `AgentPanel.vue` (the chat panel) has no import of the pipeline, no reference to `PipelineOrchestrator`, no `CreativeBrief` construction. `SitePreview.vue` accepts `pipelineState` and `skeletonSlots` as props but **no parent component passes them**.

There is no composable (e.g., `usePipeline()`) that would wire the orchestrator's state to Vue reactivity and provide it to both `AgentPanel` and `SitePreview`.

**Impact:** The entire Phase 2 implementation is dead code until someone writes the glue layer.

**Fix:** Create a `usePipeline.ts` composable that:
- Instantiates `PipelineOrchestrator` with a reactive `onStateChange` callback
- Exposes `pipelineState` as a `ref<PipelineState>`
- Exposes `skeletonSlots` computed from the current page's step
- Is consumed by the parent layout component and passed to both `AgentPanel` and `SitePreview`

### 1.2 `normalizeTheme()` produces an incomplete `SiteTheme` — missing `lineHeight.relaxed`

**File:** `ai-pipeline-types.ts:94`

```ts
lineHeight: { tight: '1.2', normal: '1.5' },
```

The spec defines three lineHeight values: `tight`, `normal`, `relaxed`. The actual `SiteTheme` type in `themes/types.ts` only has `tight` and `normal` — so this is actually **fine** against the real type. However, the spec's `normalizeTheme()` included `relaxed: '1.75'`, meaning the spec itself was inconsistent with the types. The implementation correctly follows the types, not the spec. **Not a bug — just noting the spec divergence was handled correctly.**

### 1.3 `streamAndCapture` in pipeline.ts duplicates Anthropic client instantiation

**File:** `pipeline.ts:134-164`

The pipeline creates its own `Anthropic` client instance with `dangerouslyAllowBrowser: true` rather than using `streamAI()` from `ai-service.ts`. This means:

1. **Two separate Anthropic client patterns** — maintenance burden, easy to diverge
2. **No streaming callbacks to the UI** — `streamAndCapture` collects all text then parses at the end. The spec explicitly requires progressive section arrival during streaming ("sections appear in the preview as they stream"). Currently, the user sees nothing until each full API call completes.
3. **No streaming block processing** — the `processStreamingBlocks` method from the spec is absent

```ts
// pipeline.ts — current behavior
stream.on('text', (text) => {
  rawText += text  // Just accumulates — no progressive callbacks
})
await stream.finalMessage()
return parseGenerationResponse(rawText)  // All-or-nothing parse
```

**Impact:** Progressive rendering is spec'd but not implemented. Sections won't appear one-by-one during streaming — they all pop in when the API call finishes.

**Fix:** Add a streaming callback that calls `parseGenerationStream(rawText)` on each `text` event and diffs against previously-seen blocks to emit new sections incrementally. Wire this to slot updates.

### 1.4 Missing API key returns a text block instead of throwing

**File:** `pipeline.ts:140-142`

```ts
if (!apiKey) {
  return [{ type: 'text', text: 'No API key configured.' }]
}
```

When there's no API key, `streamAndCapture` returns a text block. The caller (`executeStep`) then sets `step.artifacts = rawBlocks` and `step.status = 'complete'`. The theme step "completes" with no theme block. Then `start()` looks for a theme block, doesn't find one, `this.state.theme` stays `undefined`, and the pipeline continues to template parts and pages **without a theme**.

**Impact:** Missing API key silently produces a broken site with no theme instead of failing clearly.

**Fix:** Throw an error when API key is missing so the retry/error handling in `executeStep` kicks in. Or check for a theme block after step 1 and fail explicitly.

### 1.5 `SitePreview.vue` never creates skeleton slots

**File:** `SitePreview.vue:121-125`

```ts
return renderProgressivePage(
  props.pipelineState.theme ?? null,
  props.pipelineState.templateParts,
  props.skeletonSlots ?? [],  // Always [] unless parent provides them
)
```

`skeletonSlots` is an optional prop that defaults to `[]`. There is no code anywhere that creates skeleton slots from pipeline state. The `createSkeletonSlots()` helper exists in `progressive-renderer.ts` but nobody calls it. The pipeline doesn't create slots either — `PipelineState` has `pages` (completed sections) but no slot tracking.

**Impact:** During generation, the preview will show an empty `<main></main>` — no skeletons, no progressive section appearance. The core progressive rendering UX doesn't work.

**Fix:** The integration layer (composable from 1.1) needs to:
1. Create skeleton slots from `PageConfig.suggestedSections` when a page step starts
2. Update slots as sections arrive from the pipeline
3. Pass slots to `SitePreview`

---

## 2. Significant Concerns

### 2.1 No `card:progress` integration for build status in chat

**Spec §5** says the pipeline posts a `card:progress` message to chat that live-updates as steps complete. This is completely absent. There's no code that creates or updates a progress card in the conversation. The `ProgressCardData` type exists in `types.ts` but the pipeline doesn't interact with the conversation system at all.

**Impact:** Users see nothing in chat during the build — no status indicator, no step tracking.

### 2.2 No `card:context` extraction from chat responses

**Spec §5** defines context extraction via `card:context` blocks. The parser in `ai-service.ts` correctly handles `card:context` (skips it in chat display, parses it in generation response), but there's no code that feeds extracted context back to the pipeline via `pipeline.updateContext()`.

The `handleChatMessage` function from the spec doesn't exist.

### 2.3 `createMockPipeline` is a no-op

**File:** `pipeline.ts:177-182`

```ts
export function createMockPipeline(
  brief: CreativeBrief,
  onStateChange: (state: PipelineState) => void,
): PipelineOrchestrator {
  const orchestrator = new PipelineOrchestrator(brief, onStateChange)
  return orchestrator
}
```

This just creates a real orchestrator. There's no mock data, no simulated delays, no way to test without an API key. The spec mentions testability but the implementation doesn't deliver it.

**Fix:** Either populate mock state with fake theme/sections/template parts on a timer, or remove the function until it's real.

### 2.4 Pipeline state is not Vue-reactive

**File:** `pipeline.ts`

`PipelineOrchestrator` uses a plain object for `this.state`. The `onStateChange` callback receives `{ ...this.state }` (shallow spread). But `state.pages` is a `Record<string, Section[]>` — the spread copies the reference, not the contents. If a consumer wraps this in a `ref()`, Vue might miss nested mutations.

More importantly, the orchestrator **mutates** step objects in-place (`step.status = 'generating'`) before calling `this.notify()`. This works if the consumer replaces their ref value entirely on each `onStateChange`, but it's fragile.

**Fix:** Either deep-clone in `notify()`, or make the orchestrator Vue-aware (use `reactive()`/`ref()` internally).

### 2.5 Retry logic recurses — can stack overflow on rapid failures

**File:** `pipeline.ts:118-125`

```ts
if (step.retryCount < MAX_RETRIES) {
  step.retryCount++
  step.status = 'retrying'
  this.notify()
  await this.executeStep(step, buildPrompt)  // recursive call
  return
}
```

If the API fails instantly (e.g., invalid key, network down), this recurses 2 levels deep synchronously. For MAX_RETRIES=2 this is fine, but the pattern is fragile. Also, there's no delay between retries — failures will hammer the API immediately.

**Fix:** Add a delay (e.g., 1-2 seconds) between retries. Consider a loop instead of recursion.

### 2.6 `PipelineState.pages` is `Record<string, Section[]>` but spec says `Map<string, Section[]>`

**File:** `ai-pipeline-types.ts:115`

Minor divergence, but `Record` is the right call for Vue reactivity (Maps aren't reactive by default in Vue 3 without `reactive(new Map())`). This is a good deviation from spec.

### 2.7 Post-build summary message not implemented

**Spec §5** says the chat AI posts a summary when the pipeline completes ("✅ Your site is ready!"). No code for this exists.

### 2.8 `themeToCSS` is called with one argument but may expect two

**File:** `progressive-renderer.ts:116`

```ts
parts.push(`<style id="theme-css">${themeToCSS(theme)}</style>`)
```

`themeToCSS` in `theme-utils.ts` accepts `(theme: SiteTheme, mode?: 'light' | 'dark')`. Calling without mode defaults to light, which is correct for progressive rendering. Not a bug, but the color mode toggle in `SitePreview.vue` won't work during progressive mode since the mode isn't passed through.

---

## 3. Minor Notes

### 3.1 Section ID generation uses page slug which may contain `/`

**File:** `pipeline.ts:149`

```ts
id: `${pageConfig.slug}-section-${sectionIndex++}`,
```

For the homepage, slug is `'/'`, producing IDs like `/-section-0`. This gets used in `data-section-id` attributes and CSS selectors. The `/` in an attribute value is technically fine in HTML, but using it in `querySelector('[data-section-id="/-section-0"]')` works but is ugly.

**Fix:** Sanitize the slug: `pageConfig.slug.replace(/\//g, '') || 'home'`

### 3.2 `renderHeader` uses inline `onclick` handlers

**File:** `progressive-renderer.ts:87`

```ts
return `<a href="#" onclick="window.parent.postMessage({type:'navigate',page:'${item.page}'},'*');return false">${item.label}</a>`
```

Works but is XSS-vulnerable if `item.page` contains quotes (it comes from AI output). Should escape the value.

### 3.3 Generation prompts explicitly remind AI about schema gotchas

**File:** `generation-prompts.ts:197-200`

```ts
- For contact-info: hours must use { "label": "...", "value": "..." } format.
- For cta-banner: use "text" field for the message, "linkText" and "linkPage" for the link.
- For hero-split: no "cta" field exists. Use "hours" for business hours display.
```

This is good — directly addresses the schema mismatches flagged in REVIEW.md §2.3. The prompts were updated to match Phase 1's actual types.

### 3.4 `content-cards` schema includes `image` field

**File:** `generation-prompts.ts:78`

The schema doc shows `"image": "string? (URL)"` on cards. REVIEW.md §2.3 flagged this as missing from Phase 1. Checking `sections/types.ts`:

```ts
export interface ContentCardsData {
  cards: Array<{ title: string; body: string; image?: string }>
}
```

`image` IS present in the actual type. The review doc was wrong — the type already had it. ✅

### 3.5 Hardcoded model name in pipeline

**File:** `pipeline.ts:152`

```ts
model: 'claude-sonnet-4-20250514',
```

Same hardcoded model in `ai-service.ts:118`. Should be a shared constant.

### 3.6 Only `restaurant` and `portfolio` site types have page presets

**File:** `generation-prompts.ts:117-156`

The fallback is a single home page. Any other `siteType` gets a minimal site. This is fine for prototype scope but should be documented.

---

## 4. What's Good

1. **Schema documentation in prompts matches Phase 1 types.** The `SECTION_SCHEMAS` in `generation-prompts.ts` accurately reflect the TypeScript interfaces in `sections/types.ts`. The REVIEW.md §2.3 issues (mismatched field names) are fixed in the prompts — `contact-info` uses `label`/`value`, `cta-banner` uses `text`/`linkText`/`linkPage`, `hero-split` has no `cta` field. This is the most important correctness win.

2. **Unified fence regex with `[\w-]+`.** The REVIEW.md §4.4 bug (regex not matching hyphenated section types) is fixed. Both `UNIFIED_FENCE_REGEX` and `UNIFIED_PARTIAL_FENCE_REGEX` use `[\w-]+`.

3. **Clean separation between chat parsing and generation parsing.** `parseAIResponse()` for chat display silently drops `section:*`/`theme`/`templatePart:*` blocks (they're pipeline artifacts, not chat content). `parseGenerationResponse()` handles all fence types. No cross-contamination.

4. **`normalizeTheme()` correctly bridges AI output → SiteTheme.** REVIEW.md §2.1 flagged the flat-vs-nested mismatch. The implementation adds `settings` wrapper, defaults for `spacing`, `layout`, `lineHeight`. Output matches `SiteTheme` type exactly.

5. **`renderProgressivePage()` is correctly named distinct from `renderPage()`.** REVIEW.md §4.6 flagged the naming collision. Fixed.

6. **Incremental postMessage protocol is consistent.** The listener script in the iframe and the `sendSectionUpdate`/`sendThemeUpdate` helpers use matching message types (`section-update`, `theme-update`). The `data-section-id` attributes are consistent between skeleton rendering and message-based updates.

7. **`executeParallel` is correct.** Unlike the buggy version in the spec (REVIEW.md §4.9), this implementation uses the Set-based pattern that actually works.

8. **Validation covers all 14 section types.** `REQUIRED_FIELDS` has entries for every type in `SectionType` union. No missing types.

---

## Summary

The implementation is **architecturally sound** but **not yet wired up**. The individual pieces (parser, prompts, pipeline orchestrator, progressive renderer) are well-built and correctly address the schema mismatch issues from REVIEW.md. But the critical integration layer — connecting the pipeline to the Vue component tree — is entirely missing. The progressive rendering UX (the core feature of Phase 2) doesn't work because:

1. No composable creates/manages the pipeline
2. No code creates skeleton slots
3. Streaming doesn't emit sections progressively (waits for full response)
4. No progress card appears in chat
5. No post-build summary

**Priority order for fixes:**
1. Create `usePipeline.ts` composable (unblocks everything)
2. Add streaming section callbacks in pipeline (enables progressive UX)
3. Create skeleton slots from page configs
4. Wire progress card to chat
5. Fix missing API key silent failure
6. Add retry delay

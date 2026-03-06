# The Extract Loop: Design-First Generation

## The Insight

Real design doesn't start with a system. It starts with a design. You sketch, you explore, you find what works — then you extract patterns from what you made. The system emerges from the work, not the other way around.

Current approach (i0): Define a rigid system → force AI to fill it in → generic output.
Free-form approach: No system → AI does whatever → inconsistent output.

**This approach: AI designs freely → extract the system from what it made → use the system to build more → repeat.**

---

## The Loop

```
1. GENERATE  — AI creates the first page freely (HTML/CSS sections)
2. EXTRACT   — Agent analyzes the output, pulls out the design system
3. BUILD     — AI generates more pages using the extracted system
4. REVIEW    — Design review agent checks quality and consistency
5. REPEAT    — Refine system + pages until requirements are met
```

This mirrors how a real designer works. You don't start with a Figma token library — you start with a comp, then extract the tokens.

---

## 1. Section Model (Simple)

Same as the free-form proposal — sections are containers, AI writes HTML/CSS:

```ts
interface Section {
  id: string
  html: string
  css: string
  role?: string   // semantic hint: 'header', 'hero', 'content', etc.
}

interface Page {
  slug: string
  title: string
  sections: string[]  // section IDs in order
}

interface Site {
  name: string
  pages: Page[]
  sections: Record<string, Section>
  designSystem?: DesignSystem  // extracted after first generation
}
```

The key difference from the pure free-form plan: `designSystem` starts as `undefined`. It gets populated after the first page is generated, by analyzing what the AI actually produced.

---

## 2. CSS Architecture Rules

To prevent cascade conflicts and ensure consistent extraction, sections must follow explicit scoping rules:

### Variable Scoping
- **Global variables (`:root`):** Only defined in the design brief/theme. Colors, fonts, base spacing unit.
- **Section-local variables:** Use prefixes to avoid conflicts: `--hero-button-radius`, `--about-card-shadow`
- **Promotion rule:** Extraction promotes section-local variables to global when the same pattern appears in multiple sections

### CSS Scoping
- **Section styles:** ALL CSS must be scoped to `[data-section="section-id"]` ONLY
- **No global selectors:** Sections cannot define bare element selectors (`h1`, `p`, `button`)
- **Theme-only globals:** Only the design brief/theme can define global styles and `:root` variables

### Selector Patterns
```css
/* ✅ CORRECT - Scoped to section */
[data-section="hero"] h1 {
  font-size: var(--font-size-hero);
  color: var(--color-primary);
}

[data-section="hero"] .hero-button {
  --hero-button-radius: 8px; /* section-local variable */
  border-radius: var(--hero-button-radius);
}

/* ❌ WRONG - Global selector from section */
h1 { font-size: 3rem; } 

/* ❌ WRONG - Unscoped class */
.button { padding: 1rem; }
```

### Conflict Detection
The CSS build process validates:
- No global selectors from sections
- No variable name collisions between sections
- All section styles properly scoped
- `:root` variables only in theme

This architecture ensures sections are truly self-contained and extraction can operate on clean, predictable CSS structures.

---

## 3. Generate (Structured Creative Freedom)

The AI generates the homepage using the **design brief pattern** — first establishing a design foundation, then generating all sections in parallel using that foundation.

### Step 1A: Design Brief Generation (~3-5 seconds)

AI generates a complete design brief with structured technical constraints but full creative freedom over design decisions:

**Design brief prompt:**
```
You are establishing the design foundation for a website. You have complete creative freedom over design decisions (colors, fonts, personality, layout style) but must express them through structured CSS conventions.

REQUIRED CSS STRUCTURE:
- All colors as CSS custom properties: var(--color-primary), var(--color-secondary), etc.
- All spacing as rem multiples of 0.5: 0.5rem, 1rem, 1.5rem, 2rem, etc.
- All font-sizes from scale: 0.875rem, 1rem, 1.25rem, 1.5rem, 2rem, 3rem, 4rem
- Font-family as custom properties: var(--font-heading), var(--font-body)
- Define all custom properties on :root

CREATIVE FREEDOM:
- Choose any color palette (but express as custom properties)
- Choose any fonts (but express as custom properties)
- Choose any spacing relationships (but use the rem scale)
- Design any personality, mood, visual style you want

Return:
1. Complete :root CSS variables defining the design system
2. 2-3 sentence design direction describing the personality/mood

Site: {site name} — {description}
```

**Example output:**
```css
:root {
  --color-primary: #8B4513;
  --color-secondary: #D2B48C;
  --color-accent: #F4A460;
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Source Sans Pro', sans-serif;
  --spacing-unit: 0.5rem;
}

/* Design direction: Warm, artisanal, community-focused. 
   Think hand-crafted signage and natural materials. */
```

### Step 1B: Parallel Section Generation (~8-10 seconds)

All homepage sections generate simultaneously using the established design brief:

**Section generation prompt:**
```
You're building a section for {site name} using the established design foundation.

Design Brief: {design direction from step 1A}
CSS Variables: {:root variables from step 1A}

Build this page section: {section role} (e.g., hero, about, features)

Technical requirements:
- CSS scoped to [data-section="{section-id}"] ONLY
- Use the established CSS custom properties
- Follow the design direction and mood
- Express the section's content through the established visual language

Return:
```section:{id}
{css}
---
{html}
```​
```

This ensures consistency (same design foundation) while enabling parallel generation (no dependency between sections). Total homepage generation: ~12 seconds instead of 30+.

---

## 4. Extract (Interpretive Consolidation)

After the first page generates, an extraction agent analyzes the CSS and **consolidates it into a robust, reusable design system**. This is interpretive analysis, not literal cataloging — the agent solves problems and infers missing patterns.

**What extraction produces:**

```ts
interface DesignSystem {
  // Colors — consolidated and normalized
  colors: {
    variable: string   // --color-primary
    value: string      // #2563eb (normalized format)
    usage: string      // "headings, buttons, links"
  }[]

  // Typography — complete scale with inferred missing sizes
  typography: {
    fonts: string[]                    // Normalized font declarations
    scale: Record<string, string>      // Complete scale with inferred steps
    lineHeights: Record<string, string>
  }

  // Spacing — complete scale with inferred missing values
  spacing: {
    unit: string          // Base unit (normalized to rem)
    scale: string[]       // Complete scale including inferred values
  }

  // Patterns — generalized reusable components
  patterns: {
    name: string          // "card", "button", "section-header"
    html: string          // Generalized HTML template
    css: string           // Cleaned, reusable CSS
    variations: string[]  // Different variants found
  }[]

  // Layout — common patterns
  layout: {
    maxWidth: string      // Most common max-width
    gutters: string       // Standard spacing
    breakpoints: string[] // Responsive breakpoints
  }

  // Regeneration tasks — problems that need fixing
  regenerationTasks: {
    section: string       // Which section needs work
    issue: string         // What's wrong
    instruction: string   // How to fix it
  }[]
}
```

**The interpretive extraction prompt:**

```
Analyze this CSS and extract a ROBUST design system. Be interpretive, not literal:

1. CONSOLIDATE similar values:
   - #2563eb and rgb(37, 99, 235) → same color, pick hex format
   - 3.5rem and 56px → same size (assuming 16px base), normalize to rem
   - 'Inter' and Inter → normalize to quoted format

2. INFER missing scale points:
   - Spacing: if you see 1rem, 1.5rem, 3rem → infer full scale: 0.5, 1, 1.5, 2, 2.5, 3
   - Typography: if you see headings at 2rem, 1.5rem → create complete h1-h6 scale

3. IDENTIFY reusable components:
   - Button patterns (normalize variants into one flexible component)
   - Card/container patterns  
   - Typography patterns that can generalize

4. NORMALIZE units and formats:
   - Convert px to rem where appropriate
   - Standardize color formats to hex
   - Clean up font-family declarations

5. FLAG problems for regeneration:
   - Hardcoded values that should be CSS variables
   - Colors that fail contrast requirements
   - Components too section-specific to reuse
   - CSS conflicts or redundancies

Return: Clean design system + specific regeneration tasks

CSS to analyze:
{all section CSS concatenated}
```

This is still fast (~3-5 seconds) but produces a **cleaned, enhanced design system** rather than raw cataloging. The regeneration tasks ensure quality problems get fixed automatically.

### What This Gives Us

The extracted system is **prescriptive and robust** — it tells subsequent generation "here's the cleaned-up version of what you established." Any quality issues flagged during extraction trigger targeted section regeneration before building additional pages.

---

## 5. Build (Guided by Extracted System)

Now subsequent pages generate with the extracted design system as context. The AI is told: "You already established this design language. Use it."

**Subsequent page prompt:**

```
You're building additional pages for {site name}.

You already designed the homepage. Here's the design system you established:

Colors: {extracted colors}
Typography: {extracted type scale}
Spacing: {extracted spacing}
Patterns you used: {extracted patterns with HTML/CSS}
CSS variables on :root: {extracted variables}

Now generate the {page title} page. Maintain the design language you established.
Reuse patterns where appropriate — don't reinvent components you already built.
The header and footer sections are shared: {header section ID}, {footer section ID}.

For new section types, stay consistent with your established patterns but
design for the content. A menu page should feel different from a gallery page,
while clearly belonging to the same site.
```

This is where parallel generation works well — each page section gets the same extracted system as context, ensuring consistency. Multiple pages can generate simultaneously.

### Shared Sections

Header and footer are just sections marked as shared. When generating page 2+, the prompt says "reuse these sections, don't regenerate them." The page's section list references the existing IDs.

---

## 6. Review (Technical Validation)

A review agent validates generated pages against **technical criteria only**. Visual/aesthetic review is skipped in v1 to keep the system simple and fast.

**Technical validation criteria:**

```
Review the generated website for technical quality:

1. CSS SYNTAX: Valid CSS with no syntax errors or unknown properties
   Check: CSS parses without errors, all properties are valid

2. COLOR CONTRAST: Text meets WCAG AA contrast requirements (4.5:1 minimum)
   Check: All text/background combinations, flag failures with specific ratios

3. HEADING STRUCTURE: Proper semantic heading hierarchy (h1 → h2 → h3, no skips)
   Check: Each page has one h1, headings follow logical order

4. CASCADE CONFLICTS: No CSS conflicts between sections
   Check: Scoping rules followed, no global selectors from sections

5. REASONABLE SIZE: CSS and HTML size within reasonable limits
   Check: Total CSS < 100KB, HTML < 50KB per section, flag bloat

Rate: PASS / FAIL (no warnings, just binary)
For FAIL, provide specific fix instructions: "Section hero: h1 color #999 on #ccc background fails contrast (2.1:1), use --color-primary instead"
```

This catches real technical problems without subjective design judgment. Fast (~3-5 seconds) and actionable.

### Future Enhancement: Visual Review
Screenshot-based visual review (personality, flow, visual hierarchy) is valuable but complex. Add in v2 once the core generation loop is proven reliable.

---

## 7. The Full Generation Flow

```
User creates a new site: "Downstreet Cafe — cozy neighborhood café"

[GENERATE] Design Brief (~3-5s)
  → AI establishes color palette, fonts, spacing scale, personality
  → :root CSS variables + design direction defined
  → User sees design foundation applied to page background/chrome

[GENERATE] Homepage sections (parallel, 4-5 sections, ~8-10s)
  → Hero, about teaser, menu preview, events, footer
  → All sections generate simultaneously using the design brief
  → Sections stream into preview as they complete
  → User sees first content visible in ~5 seconds

[EXTRACT] Design system consolidation (~3-5s)
  → Normalize colors, complete spacing scales, identify reusable components
  → Flag any problems for regeneration
  → Cleaned design system stored on Site object

[REGENERATE] Fix flagged sections if needed (~5-8s)
  → Only runs if extraction found technical issues
  → Targeted fixes, not full regeneration

[BUILD] Remaining pages (parallel, using extracted system)
  → Menu page: 3 sections (parallel) ~8s
  → About page: 3 sections (parallel) ~8s
  → Events page: 3 sections (parallel) ~8s
  → All pages generate simultaneously
  → Shared header/footer reused from homepage

[REVIEW] Technical validation (~3-5s)
  → CSS syntax, contrast, heading structure, cascade conflicts
  → Targeted regeneration of failed sections if needed

Total: ~35-45 seconds for a full multi-page site
User sees design foundation in ~5 seconds
User sees complete homepage in ~15-20 seconds
```

---

## 8. Editing

Editing stays simple. Since the design system is extracted, edits can be scoped appropriately:

### Section Edit
"Change the hero headline" → AI receives the hero section's HTML/CSS + request → returns updated section. Self-contained card lifecycle.

### Theme/System Edit
"Make the colors warmer" → AI receives the extracted design system + request → returns updated CSS variables + any sections that need color adjustments. The design system updates, and affected sections get a quick re-pass.

### Structural Edit
"Add a testimonials section" → AI receives the design system + page context → generates a new section consistent with the established patterns. No template needed — the AI's own patterns guide it.

### Cross-Section Edit
"Make all headings bigger" → Update the typography scale in the design system → re-extract the relevant CSS variable → sections that reference the variable update via cascade. Sections with hardcoded values get flagged for a quick re-pass.

The self-contained card model from the Phase 4 update applies here. Cards own their lifecycle. No chat message spam.

---

## 9. What Changes from i0

### Kill
- 14 section types (types, renderers, component CSS)
- Pipeline orchestrator
- Progressive renderer (skeleton slots, etc.)
- Mock site data files (replace with 2-3 seed sites)
- Theme defaults/normalization layer
- Generation prompts (section-type-specific)

### Keep
- App shell, layout, sidebar, project switching
- Chat system (useConversations, messages, content blocks)
- Card system (ChatCard, card rendering, content block model)
- SitePreview component (iframe, postMessage bridge, BrowserBar)
- Design system primitives (Button, Text, Panel, etc.)
- AI service (Anthropic SDK, streaming)
- Project management (useProjects)

### New
- `DesignSystem` type and extraction logic
- Simple page renderer (concatenate theme + section CSS/HTML)
- Section-level generation prompts (creative, not template-filling)
- Extraction agent prompt
- Review agent prompt
- Parallel generation coordinator (simpler than i0's pipeline — just fan-out/fan-in)
- Section postMessage injection (replace → swap, no skeleton slot tracking)

### Rewrite
- Site/Page/Section data model (much simpler)
- SitePreview srcdoc generation
- New project flow (simplified — brief → generate → extract → build)

---

## 10. Seed Sites

Hand-craft 2 sites in the new format to prove quality and serve as few-shot examples:

1. **Downstreet Cafe** — warm editorial aesthetic, food photography, community feel
2. **A portfolio site** — clean, minimal, lots of whitespace, strong typography

Each is a `Site` object with hand-written HTML/CSS sections AND an extracted `DesignSystem`. The extraction is done by hand (or by running the extraction prompt on the hand-crafted CSS) to establish the pattern.

These seed sites serve double duty:
- Demo data for the prototype UI
- Few-shot examples in generation prompts ("here's what good output looks like")

---

## 11. Implementation Phases

**Reordered to prove extraction works before building infrastructure around it.**

### Phase A: Extraction Proof (2-3 weeks)
- Hand-craft messy AI-like CSS from 3 different mock sites (varied units, formats, patterns)
- Build extraction agent with interpretive consolidation logic
- Validate extraction produces clean, coherent design systems
- Test generation using extracted system — does it maintain consistency?
- **Milestone:** Reliable extraction that turns CSS chaos into usable design systems

### Phase B: Data Model + Renderer + Seed Sites (2-3 weeks)
- Define Site, Page, Section, DesignSystem types with CSS architecture rules
- Build renderer with conflict detection (theme + sections → srcdoc)
- Hand-craft 2 beautiful seed sites using proven extraction patterns
- Strip old section system, pipeline, renderers
- **Milestone:** Beautiful sites that demonstrate the target quality

### Phase C: Generation Loop (3-4 weeks)
- Design brief generation (structured creative freedom prompts)
- Parallel section generation using design briefs
- Integration with proven extraction agent
- Technical review agent (CSS syntax, contrast, cascade validation)
- End-to-end flow: brief → sections → extraction → additional pages
- **Milestone:** Complete generation pipeline producing consistent multi-page sites

### Phase D: Editing Cards (2-3 weeks)
- SectionEditCard (self-contained lifecycle)
- ThemeEditCard (updates design system + cascades to affected sections)
- Component extraction/promotion system
- Section add/remove/reorder with design system consistency
- **Milestone:** Full editing capability with design system integrity

**Total realistic timeline: 9-13 weeks**

Each phase proves a critical assumption before building the next layer. Phase A derisk the core extraction concept. If extraction doesn't work reliably, the whole approach fails — better to discover that in week 2 than week 8.

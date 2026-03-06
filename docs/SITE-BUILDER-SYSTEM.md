# Site Builder System

The architecture that turns Studio from a prototype with mock data into an AI-powered site builder that creates real sites in real time.

---

## The Problem

Today, each mock site is a monolithic HTML string — a single function that returns the entire page. This has compounding problems:

- **Slow generation.** The AI must produce the complete HTML document in one shot. For a realistic page, this takes minutes.
- **Duplicated markup.** Every page repeats the nav, footer, font imports, and base styles. Change the nav? Change it in every page function.
- **No incremental rendering.** The preview is blank until the full document arrives. The user stares at a spinner.
- **No targeted editing.** "Change the hero image" requires regenerating the entire page. The AI must reproduce everything it didn't change, introducing drift and inconsistencies.
- **No shared design language.** Each page brings its own CSS. Colors, spacing, and component styles can diverge across pages of the same site.

## The Solution

A **section-based template system** with four layers:

```
Design Tokens  →  Component Library  →  Sections  →  Templates
(theme.json)      (reusable HTML/CSS)   (content blocks)  (page assembly)
```

### Layer 1: Design Tokens (exists today)

The `SiteTheme` type and `themeToCSS()` function. Colors, typography, spacing, and layout values defined once and consumed everywhere via CSS custom properties. This layer is done.

### Layer 2: Component Library

Reusable HTML/CSS patterns shared across all sections:

- **Navigation** — The site header/nav. Defined once, used on every page.
- **Footer** — Site footer. Same.
- **Button** — Primary, secondary, ghost variants.
- **Card** — Content container with optional image, title, text, action.
- **Image** — Responsive image with optional caption, aspect ratio, object-fit.
- **Menu item** — Name + price with dotted leader.
- **Event item** — Date badge + event details.
- **Team member** — Avatar + name + role + bio.

Components are CSS classes + HTML patterns. They reference only `var(--theme-*)` tokens, never hardcoded values. They're injected into every page via a shared `<style>` block, so sections can use them without re-declaring styles.

### Layer 3: Sections

The building blocks of a page. Each section is:

```ts
interface Section {
  id: string                    // unique within the page
  type: string                  // "hero-split", "image-strip", "menu-list", etc.
  data: Record<string, any>     // structured content for this section type
}
// Sections are ordered by their position in the page's sections array.
```

A section type defines:
- A **schema** — what data it accepts (title, images, items, etc.)
- A **renderer** — a function that takes the data + theme CSS and returns an HTML string
- **Component dependencies** — which components from Layer 2 it uses

The AI doesn't write HTML. It produces section data:

```json
{
  "type": "hero-split",
  "data": {
    "heading": "Downstreet Cafe",
    "tagline": "Your neighborhood coffee spot",
    "image": "/images/downstreet/hero-interior.png",
    "hours": ["Mon–Fri: 7am–6pm", "Sat–Sun: 8am–4pm"]
  }
}
```

The renderer turns this into HTML using the component library and theme tokens. The AI focuses on content and creative decisions. The system handles consistency.

**Section types for a café site might include:**
- `hero-split` — Image + text side by side
- `hero-fullwidth` — Full-width image with overlay text
- `hero-simple` — Text-only centered header
- `image-strip` — Row of images with captions
- `image-gallery` — Grid of images (various aspect ratios)
- `menu-list` — Category + items with prices
- `content-prose` — Long-form text (about page, blog post)
- `content-cards` — Grid of cards (values, features, services)
- `team-grid` — Team member cards
- `event-list` — Upcoming events with date badges
- `cta-banner` — Call-to-action block
- `contact-info` — Hours, location, phone, email
- `form-order` — Order interface with cart sidebar

### Layer 4: Templates

A template defines a page's structure:

```ts
interface PageTemplate {
  id: string               // "homepage", "menu", "about", etc.
  title: string
  slug: string
  sections: Section[]      // ordered list — includes header, content, and footer sections
}
```

The page renderer:
1. Outputs the HTML document shell (doctype, head, meta, font imports)
2. Injects theme CSS (`themeToCSS()`)
3. Injects the shared component library CSS
4. Injects site-specific custom CSS (if any)
5. Renders each section in order (header, content sections, footer)

**No default chrome.** Every site defines its own header and footer as sections. This means each site fully owns its page structure — a hot sauce e-commerce site and a recipe app can have completely different navigation patterns without fighting a "default" header.

---

## How the AI Interacts

### Creating a site

The AI receives a creative brief (from the onboarding chat) and produces:

1. **Theme choices** — Color palette, fonts, spacing. Stored as `SiteTheme`.
2. **Page definitions** — Which pages to create, what section types each uses, including header/footer sections.
3. **Section data** — The actual content for each section on each page.

Each of these can be generated independently and incrementally. The theme comes first (sets the visual foundation), then sections (page content) — potentially in parallel across pages.

### Editing a site

The AI receives a user request and determines what to change:

- **"Change the colors to blue"** → Update the `SiteTheme`. All pages re-render automatically.
- **"Update the hero image"** → Generate new data for the `hero-split` section. Only that section re-renders.
- **"Add a testimonials section"** → Generate a new section, insert it at the right position in the template.
- **"Remove the events page"** → Delete the page template. Nav updates automatically.
- **"Change the nav to include a Shop link"** → Update the header section data. All pages using that header reflect the change.

The scope of each change is clear and minimal. No full-page regeneration.

### AI System Prompt

The AI's system prompt defines:
- Available section types and their schemas
- Available components and how to reference them
- The current site's theme, template parts, and page structure
- How to return structured section data (fenced JSON blocks, similar to the card system)

---

## Progressive Rendering

When building a new site, the preview shows the page growing:

1. **Skeleton state** — Page loads with the document shell, theme CSS, and component CSS. Placeholder regions indicate where sections will appear.
2. **Header appears** — Nav renders as the first section streams in.
3. **Sections stream in** — Each section appears as its data arrives. The hero loads first (it's the most visually impactful), then content sections top-to-bottom.
4. **Footer appears** — Renders as the last section.

Between steps, the preview is functional — it's a real page that happens to be incomplete, not a loading screen. Sections could fade in or slide in as they arrive.

For editing, only the affected section re-renders. The rest of the page stays stable.

---

## New Project Flow

### The Modal (Onboarding)

A conversational mini-chat inside a modal:

1. **"What are you building?"** — Quick-reply buttons: Restaurant, Portfolio, Online Store, Blog, Something else. Clicking one pre-fills context; "Something else" opens free text.
2. **"What's it called?"** — Free text input for the site/business name.
3. **"Describe it in a sentence."** — Free text. This becomes the AI's creative brief. A short helper prompt: "Who's it for and what does it do?"

Three exchanges. The AI has enough to start building.

### The Transition

Modal closes. The sidebar shows the new project with a building indicator (the `StatusIndicator` component in "loading" state). The project view opens:

- **Chat panel** — The AI's first message acknowledges what it's building: "Setting up Downstreet Cafe — a neighborhood coffee shop site with a warm, inviting feel. I'll have something for you in a few minutes."
- **Preview panel** — Shows the progressive build state. Skeleton → header → hero → sections → footer.

### The Build-Time Chat

While sections generate (build time varies — could be a minute with fast models and parallelism, or several minutes for larger sites), the chat keeps the user productive:

- **Business details** — "What's the address? Phone number? Hours?" These feed directly into the contact-info section and footer.
- **Brand assets** — "Do you have a logo? An existing website I can reference?"
- **Content** — "Tell me about what makes this place special." This informs the about page prose.
- **Commercial** — "Want to connect a custom domain?" / "Need an email address for the business?"
- **Progress updates** — "Your homepage is looking good — take a peek. Working on the menu page next."

Every answer improves the site. The user isn't waiting — they're co-creating.

### Post-Build

Once all pages are generated, the AI signals completion: "Your site is ready. Here's what I built: 5 pages — Home, Menu, About, Events, Contact. What would you like to change?"

Now the user directs edits. The section system makes changes fast — modifying a single section instead of regenerating a page.

---

## Phases

This is a large project. Each phase builds on the previous one and delivers standalone value.

- **[Phase 1: Section System](./PHASE-1-SECTION-SYSTEM.md)** — Define section types, build the renderer, refactor Downstreet Cafe to use it. Prove the architecture.
- **[Phase 2: AI Generation Pipeline](./PHASE-2-AI-PIPELINE.md)** — Wire Claude to generate sections. Build progressive rendering. One end-to-end flow: describe a site → AI generates sections → site appears piece by piece.
- **[Phase 3: New Project Flow](./PHASE-3-NEW-PROJECT-FLOW.md)** — The onboarding modal, build-time chat, and project creation experience.
- **[Phase 4: Section Editing](./PHASE-4-SECTION-EDITING.md)** — User directs changes via chat. AI generates targeted section updates. Preview reflects changes in real time.

---

## What This Doesn't Cover

- **Real WordPress integration.** This system generates HTML for preview iframes, not actual WordPress blocks or theme files. The section types are inspired by WordPress patterns but aren't block markup. A future phase could map sections to actual Gutenberg blocks.
- **Image generation.** The system assumes images exist at URLs. How images are generated (AI, stock, upload) is a separate concern.
- **Hosting and deployment.** Building the site in the preview is step one. Getting it to a live URL is a separate pipeline.
- **Multi-user editing.** One user, one AI, one site at a time.

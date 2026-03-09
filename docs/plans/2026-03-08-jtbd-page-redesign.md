# JTBD Page Redesign

## Goal

Redesign the dev JTBD page from a whitepaper-style reference doc into a polished, visual, deck-like microsite that tells the story of why people hire Studio. Audience: the Studio team and Automattic leadership.

## Design direction

Polished microsite/deck feel inside the app chrome. Big type, generous whitespace, visual storytelling. Scrolls vertically like a one-pager presentation. CSS-only illustrations — no external images.

## Sections (scroll order)

### 1. Hero — "Why people hire Studio"

Big headline, short tagline. No academic preamble. Sets the product story tone immediately.

### 2. The Spectrum — our audience

Visual showing the range of WordPress builders:

- Agency Engineer — writes PHP, manages client sites, needs speed and reliability
- Freelance Dev — juggles projects solo, needs efficiency and professionalism
- Solo Builder — knows WordPress well, less comfortable with infrastructure
- No-Code Creator — uses blocks and page builders, wants results without code

Key insight displayed prominently: "Different people, same jobs."

### 3. What is JTBD? (compact)

Brief framework explainer:
- We use the Christensen/Moesta school (jobs as progress, not Ulwick/ODI)
- The milkshake story as a concrete example
- Three dimensions: functional, emotional, social
- Job story format: "When [situation], I want to [motivation], so I can [outcome]"

Compact presentation — important for context but not the star. Could use a callout/aside treatment.

### 4. Forces of Progress

Visual 2x2 diagram of the four forces acting on the switching decision:

- **Push** (top-left): Frustrations driving people away from current tools — slow setup, config file hell, fear of breaking production, screenshot-based feedback loops
- **Pull** (top-right): What attracts people to Studio — instant sites, AI assistance, visual sync pipeline, live preview sharing
- **Habit** (bottom-left): Inertia keeping people on current tools — familiar workflows, existing configs, team already uses Local/MAMP/Docker
- **Anxiety** (bottom-right): Fears about switching — will my sites migrate? can I trust AI changes? is this mature enough?

One diagram for Studio's overall switching story. Directional arrows showing push+pull must overcome habit+anxiety.

### 5. Studio's Jobs — the main event

Four groups: Local Development, AI-Assisted Editing, Collaboration, Data Management.

Each job rendered as a visual card (not dl/dt/dd walls of text):
- Job title (big, bold)
- Job story as a styled blockquote
- Three dimension pills/badges (Functional / Emotional / Social) with short one-line descriptions
- Visual separator between jobs

Jobs per group (same content as current, just better presented):

**Local Development:**
- Spin up a new site
- Clone an existing environment
- Manage multiple sites
- Configure a site's environment

**AI-Assisted Editing:**
- Describe what I want, not how to build it
- See changes before they land
- Iterate quickly

**Collaboration:**
- Share work-in-progress
- Push to staging or production
- Pull remote changes locally

**Data Management:**
- Import an existing site
- Export for backup or handoff

### 6. What we're replacing

Competing solutions reframed through the hire/fire lens. Three groups:

**Local development:** Local by WP Engine, DevKinsta, MAMP/XAMPP/Docker, wp-env/Lando/VVV, editing on production

**Sharing & feedback:** Screenshots/recordings, staging servers, video calls with screen share

**AI-assisted building:** ChatGPT/Claude with copy-paste, GitHub Copilot/Cursor, page builders (Elementor, Divi)

Each competitor gets a short "what they get right / where they fall short" framing rather than just a description.

## Visual elements

- CSS-only geometric illustrations (circles, lines, grids) using design system tokens
- Accent-colored borders and backgrounds for visual rhythm
- Background color shifts between major sections
- Pull quotes for key insights
- WPIcon usage where appropriate
- Dimension pills/badges with subtle color coding
- The forces diagram as a styled 2x2 CSS grid with arrows

## Technical

- Single Vue SFC: `src/pages/JtbdPage.vue` (rewrite of existing)
- Uses `dev-docs.css` for shared nav styles
- All design system tokens (colors, spacing, radius, type)
- No external dependencies or images
- Route: `/dev/jtbd` (already wired up)

<script setup lang="ts">
import '@/pages/dev-docs.css'

const sections = [
  { id: 'framework', label: 'The Framework' },
  { id: 'job-stories', label: 'Job Stories' },
  { id: 'local-dev', label: 'Local Development' },
  { id: 'ai-editing', label: 'AI-Assisted Editing' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'data-management', label: 'Data Management' },
  { id: 'competing', label: 'Competing Solutions' },
]

function scrollTo(e: Event, id: string) {
  e.preventDefault()
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="dev-layout hstack">
    <nav class="dev-nav">
      <h2 class="nav-heading">Jobs to Be Done</h2>
      <ul class="vstack gap-xxxs">
        <li v-for="item in sections" :key="item.id">
          <a :href="'#' + item.id" class="nav-link" @click="scrollTo($event, item.id)">{{ item.label }}</a>
        </li>
      </ul>
    </nav>
    <div class="jtbd-main">

      <!-- ═══════════════════════ -->
      <!-- THE FRAMEWORK           -->
      <!-- ═══════════════════════ -->

      <section id="framework">
        <h2>The Framework</h2>
        <p class="jtbd-intro">People don't buy products — they hire them to make progress in their lives. A "job" is the progress someone is trying to make in a particular circumstance. It's not a feature list, a persona, or a use case. It's the underlying motivation that drives someone to pull a product into their life.</p>

        <p class="jtbd-body">Clayton Christensen's Jobs to Be Done framework flips product thinking from "what should we build?" to "what are people struggling with?" When you understand the job, the right features become obvious — and the wrong ones become easy to cut.</p>

        <h3>Three dimensions of every job</h3>
        <dl class="jtbd-defs">
          <dt>Functional</dt>
          <dd>The practical outcome. "I need a local WordPress site running in under a minute."</dd>

          <dt>Emotional</dt>
          <dd>How it makes them feel. "I want to feel confident that my changes won't break production."</dd>

          <dt>Social</dt>
          <dd>How others perceive them. "I want my team to see polished work, not half-finished experiments."</dd>
        </dl>
      </section>

      <!-- ═══════════════════════ -->
      <!-- JOB STORIES             -->
      <!-- ═══════════════════════ -->

      <section id="job-stories">
        <h2>Job Stories</h2>
        <p class="jtbd-intro">A job story captures the situation, motivation, and expected outcome in one sentence. It's more useful than a user story because it focuses on the circumstance — not a persona.</p>

        <div class="jtbd-format">
          <div class="jtbd-format-label">Format</div>
          <div class="jtbd-format-template">When <span class="jtbd-slot">situation</span>, I want to <span class="jtbd-slot">motivation</span>, so I can <span class="jtbd-slot">outcome</span>.</div>
        </div>

        <h3>Example</h3>
        <blockquote class="jtbd-example">
          When I'm starting a new client project and need to match their existing site's setup, I want to pull their live environment into a local copy, so I can start developing immediately without manual configuration.
        </blockquote>

        <p class="jtbd-body">Notice there's no persona ("As a developer…"). The situation does the work. The same person might have completely different jobs depending on their circumstance — and different people in the same circumstance share the same job.</p>
      </section>

      <!-- ═══════════════════════ -->
      <!-- LOCAL DEVELOPMENT       -->
      <!-- ═══════════════════════ -->

      <section id="local-dev">
        <h2>Local Development</h2>
        <p class="jtbd-intro">The foundational jobs — creating, running, and managing WordPress sites on your machine.</p>

        <div class="jtbd-job">
          <h3>Spin up a new site</h3>
          <blockquote class="jtbd-example">When I have a new idea or project to start, I want to create a working WordPress site instantly, so I can start building without fighting infrastructure.</blockquote>
          <dl class="jtbd-defs">
            <dt>Functional</dt>
            <dd>Site runs locally with correct PHP/WP versions in under 60 seconds.</dd>
            <dt>Emotional</dt>
            <dd>Zero friction. The tool disappears — I'm just building.</dd>
            <dt>Social</dt>
            <dd>I look efficient to my team. No "still setting up my environment" excuses.</dd>
          </dl>
        </div>

        <div class="jtbd-job">
          <h3>Clone an existing environment</h3>
          <blockquote class="jtbd-example">When I need to reproduce a bug or match a client's setup, I want to pull their live site into a local copy, so I can work against real data without risk.</blockquote>
          <dl class="jtbd-defs">
            <dt>Functional</dt>
            <dd>Full site clone — database, uploads, plugins, theme, configuration.</dd>
            <dt>Emotional</dt>
            <dd>Confidence that my local environment matches reality.</dd>
          </dl>
        </div>

        <div class="jtbd-job">
          <h3>Manage multiple sites</h3>
          <blockquote class="jtbd-example">When I'm juggling several projects, I want to see all my sites at a glance and switch between them quickly, so I don't lose context or accidentally work on the wrong one.</blockquote>
          <dl class="jtbd-defs">
            <dt>Functional</dt>
            <dd>Site list with status, quick switching, start/stop controls.</dd>
            <dt>Emotional</dt>
            <dd>Feeling organized, not overwhelmed.</dd>
          </dl>
        </div>

        <div class="jtbd-job">
          <h3>Configure a site's environment</h3>
          <blockquote class="jtbd-example">When a project requires a specific PHP version, WordPress release, or debugging setup, I want to change those settings without leaving the app, so I don't have to mess with config files or terminal commands.</blockquote>
          <dl class="jtbd-defs">
            <dt>Functional</dt>
            <dd>PHP version, WP version, debug mode, domain — all in one place.</dd>
            <dt>Emotional</dt>
            <dd>I'm in control without needing to be a sysadmin.</dd>
          </dl>
        </div>
      </section>

      <!-- ═══════════════════════ -->
      <!-- AI-ASSISTED EDITING     -->
      <!-- ═══════════════════════ -->

      <section id="ai-editing">
        <h2>AI-Assisted Editing</h2>
        <p class="jtbd-intro">Jobs around Kit — the AI agent that proposes and applies changes to sites through conversation.</p>

        <div class="jtbd-job">
          <h3>Describe what I want, not how to build it</h3>
          <blockquote class="jtbd-example">When I know what outcome I want but not the technical steps, I want to describe it in plain language and see a proposed solution, so I can iterate on the result instead of the implementation.</blockquote>
          <dl class="jtbd-defs">
            <dt>Functional</dt>
            <dd>Natural language → concrete changes, shown before applied.</dd>
            <dt>Emotional</dt>
            <dd>Empowered, not dependent. I'm directing, not delegating blindly.</dd>
            <dt>Social</dt>
            <dd>I can produce professional results even in areas outside my expertise.</dd>
          </dl>
        </div>

        <div class="jtbd-job">
          <h3>See changes before they land</h3>
          <blockquote class="jtbd-example">When Kit proposes a change to my site, I want to review what will change before it's applied, so I stay in control and can catch mistakes early.</blockquote>
          <dl class="jtbd-defs">
            <dt>Functional</dt>
            <dd>Card-based proposals with clear descriptions. Accept/reject per change.</dd>
            <dt>Emotional</dt>
            <dd>Trust. I'm collaborating with the AI, not being railroaded by it.</dd>
          </dl>
        </div>

        <div class="jtbd-job">
          <h3>Iterate quickly</h3>
          <blockquote class="jtbd-example">When the first result isn't quite right, I want to refine it through conversation — "make the header bigger," "try a different color" — so I can explore options without starting over each time.</blockquote>
          <dl class="jtbd-defs">
            <dt>Functional</dt>
            <dd>Conversational back-and-forth with live preview updates.</dd>
            <dt>Emotional</dt>
            <dd>Creative flow. Ideas move at the speed of thought, not the speed of code.</dd>
          </dl>
        </div>
      </section>

      <!-- ═══════════════════════ -->
      <!-- COLLABORATION           -->
      <!-- ═══════════════════════ -->

      <section id="collaboration">
        <h2>Collaboration</h2>
        <p class="jtbd-intro">Jobs about sharing work, getting feedback, and moving code between environments.</p>

        <div class="jtbd-job">
          <h3>Share work-in-progress</h3>
          <blockquote class="jtbd-example">When I want feedback on something I'm building, I want to share a live preview link with a colleague or client, so they can see real work — not screenshots — and respond with context.</blockquote>
          <dl class="jtbd-defs">
            <dt>Functional</dt>
            <dd>Shareable URL, access controls, view tracking.</dd>
            <dt>Emotional</dt>
            <dd>Pride. I'm showing real, working progress.</dd>
            <dt>Social</dt>
            <dd>Stakeholders see polish, not chaos. The preview is the presentation.</dd>
          </dl>
        </div>

        <div class="jtbd-job">
          <h3>Push to staging or production</h3>
          <blockquote class="jtbd-example">When my local changes are ready, I want to push them to a staging or production environment, so I can ship without switching tools or running manual deploy scripts.</blockquote>
          <dl class="jtbd-defs">
            <dt>Functional</dt>
            <dd>One-click push to connected environments. Visual pipeline.</dd>
            <dt>Emotional</dt>
            <dd>Shipping feels good, not scary. The pipeline shows me where things stand.</dd>
          </dl>
        </div>

        <div class="jtbd-job">
          <h3>Pull remote changes locally</h3>
          <blockquote class="jtbd-example">When someone else has made changes on staging or production, I want to pull those changes into my local site, so I'm always working against the latest version.</blockquote>
          <dl class="jtbd-defs">
            <dt>Functional</dt>
            <dd>Pull from any connected environment. Conflict-aware.</dd>
            <dt>Emotional</dt>
            <dd>Confidence I'm not working on stale data.</dd>
          </dl>
        </div>
      </section>

      <!-- ═══════════════════════ -->
      <!-- DATA MANAGEMENT         -->
      <!-- ═══════════════════════ -->

      <section id="data-management">
        <h2>Data Management</h2>
        <p class="jtbd-intro">Jobs around moving site data in and out of Studio.</p>

        <div class="jtbd-job">
          <h3>Import an existing site</h3>
          <blockquote class="jtbd-example">When I have a Jetpack backup or a full-site export, I want to drag it into Studio and get a working local site, so I can pick up where someone else left off.</blockquote>
          <dl class="jtbd-defs">
            <dt>Functional</dt>
            <dd>Drag-and-drop import. Supports Jetpack backups and WP exports.</dd>
            <dt>Emotional</dt>
            <dd>Relief. Migration isn't a project — it's a gesture.</dd>
          </dl>
        </div>

        <div class="jtbd-job">
          <h3>Export for backup or handoff</h3>
          <blockquote class="jtbd-example">When I need to hand a site to someone else or archive my work, I want to export everything as a single file, so the recipient can restore it without chasing down pieces.</blockquote>
          <dl class="jtbd-defs">
            <dt>Functional</dt>
            <dd>One-click export. Complete site bundle.</dd>
            <dt>Emotional</dt>
            <dd>Clean handoff. Nothing lost, nothing forgotten.</dd>
          </dl>
        </div>
      </section>

      <!-- ═══════════════════════ -->
      <!-- COMPETING SOLUTIONS     -->
      <!-- ═══════════════════════ -->

      <section id="competing">
        <h2>Competing Solutions</h2>
        <p class="jtbd-intro">Understanding what people "fire" when they "hire" Studio. These aren't just competitor products — they're any existing behavior that gets the job done, however poorly.</p>

        <div class="jtbd-job">
          <h3>Local development</h3>
          <dl class="jtbd-defs">
            <dt>Local by WP Engine</dt>
            <dd>The closest direct competitor. Polished GUI, one-click site creation, live links for sharing. Strong on the functional and emotional jobs — but no AI assistance, no sync pipeline, and tied to WP Engine's ecosystem for cloud features.</dd>

            <dt>DevKinsta</dt>
            <dd>Kinsta's local dev tool. Docker-based, clean interface, tight integration with Kinsta hosting. Similar to Local in scope but smaller community. Cloud features locked to Kinsta customers.</dd>

            <dt>MAMP / XAMPP / Docker</dt>
            <dd>Gets the functional job done but with heavy setup cost. Fails the emotional job — developers feel like sysadmins instead of builders.</dd>

            <dt>wp-env / Lando / VVV</dt>
            <dd>Better developer experience, but still CLI-heavy. Requires comfort with terminal workflows and config files.</dd>

            <dt>Editing on production</dt>
            <dd>The most common "competitor" — and the most dangerous. Zero setup, but the emotional cost of a mistake is catastrophic.</dd>
          </dl>
        </div>

        <div class="jtbd-job">
          <h3>Sharing & feedback</h3>
          <dl class="jtbd-defs">
            <dt>Screenshots and screen recordings</dt>
            <dd>Low effort to create, but strips all interactivity. Stakeholders can't click around, scroll, or test responsiveness.</dd>

            <dt>Staging servers</dt>
            <dd>Full fidelity, but manual setup and deploy cycles slow the feedback loop.</dd>

            <dt>Video calls with screen share</dt>
            <dd>Real-time but synchronous. Everyone has to be available at the same time.</dd>
          </dl>
        </div>

        <div class="jtbd-job">
          <h3>AI-assisted building</h3>
          <dl class="jtbd-defs">
            <dt>ChatGPT / Claude with copy-paste</dt>
            <dd>Gets answers but requires manual application. The gap between "here's the code" and "it's live on my site" is still the developer's problem.</dd>

            <dt>GitHub Copilot / Cursor</dt>
            <dd>Great for code-level assistance, but operates at the file level, not the site level. No awareness of WordPress context, plugins, or site state.</dd>

            <dt>Page builders (Elementor, Divi)</dt>
            <dd>Visual editing without code, but locked into their ecosystem. The job of "describe and iterate" is done through menus, not conversation.</dd>
          </dl>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
/* ── Main content area ── */

.jtbd-main {
  flex: 1;
  min-width: 0;
  padding: var(--space-l) var(--space-xl);
  overflow-y: auto;
  scroll-behavior: smooth;
  max-width: 720px;
}

.jtbd-main section {
  margin-block-end: var(--space-xxxl);
}

.jtbd-main h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin-block-end: var(--space-xxs);
}

.jtbd-main h3 {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin: var(--space-l) 0 var(--space-xs);
}

/* ── Text ── */

.jtbd-intro {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  margin-block-end: var(--space-l);
  line-height: 1.6;
}

.jtbd-body {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  line-height: 1.6;
}

/* ── Job story blocks ── */

.jtbd-example {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg);
  line-height: 1.6;
  margin: 0 0 var(--space-s) 0;
  padding: var(--space-s) var(--space-m);
  border-inline-start: 3px solid var(--color-frame-border);
  background: var(--color-frame-hover);
  border-radius: 0 var(--radius-s) var(--radius-s) 0;
  font-style: italic;
}

/* ── Job format display ── */

.jtbd-format {
  background: var(--color-frame-hover);
  border-radius: var(--radius-m);
  padding: var(--space-s) var(--space-m);
  margin-block-end: var(--space-l);
}

.jtbd-format-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-frame-fg-muted);
  margin-block-end: var(--space-xxs);
}

.jtbd-format-template {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg);
  line-height: 1.6;
}

.jtbd-slot {
  color: var(--color-accent);
  font-style: italic;
}

/* ── Job cards ── */

.jtbd-job {
  margin-block-end: var(--space-l);
  padding-block-end: var(--space-l);
  border-block-end: 1px solid var(--color-frame-border);
}

.jtbd-job:last-child {
  border-block-end: none;
}

/* ── Definition lists ── */

.jtbd-defs {
  margin: 0;
}

.jtbd-defs dt {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin-block-start: var(--space-s);
}

.jtbd-defs dd {
  margin: var(--space-xxs) 0 0 0;
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  line-height: 1.6;
}
</style>

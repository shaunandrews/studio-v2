<script setup lang="ts">
import '@/pages/dev-docs.css'
import WPIcon from '@/components/primitives/WPIcon.vue'
import { wordpress, globe, people, backup, brush, cog } from '@wordpress/icons'
</script>

<template>
  <div class="jtbd-page">

    <!-- ═══════════════════════════════════════════ -->
    <!-- HERO                                        -->
    <!-- ═══════════════════════════════════════════ -->

    <section class="hero">
      <div class="hero-inner">
        <h1 class="hero-title">Why people hire Studio</h1>
        <p class="hero-subtitle">People don't buy products — they <em>hire</em> them to make progress. Studio exists because WordPress developers deserve better tools for the jobs they already do every day.</p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════ -->
    <!-- THE SPECTRUM                                -->
    <!-- ═══════════════════════════════════════════ -->

    <section class="spectrum">
      <div class="section-inner section-inner--wide">
        <h2 class="section-label">Our audience</h2>
        <h3 class="section-title">Four builders, one set of jobs</h3>

        <div class="spectrum-grid">
          <div class="spectrum-card">
            <div class="spectrum-icon spectrum-icon--engineer">
              <span>&lt;/&gt;</span>
            </div>
            <h4 class="spectrum-name">Agency Engineer</h4>
            <p class="spectrum-desc">Ships client sites with a team. Needs shared environments, reliable handoffs between developers, and workflows that scale across projects and people.</p>
          </div>

          <div class="spectrum-card">
            <div class="spectrum-icon spectrum-icon--inhouse">
              <span>&#9881;</span>
            </div>
            <h4 class="spectrum-name">In-House Dev</h4>
            <p class="spectrum-desc">Maintains the company's WordPress presence alongside designers, marketers, and content teams. Needs to share progress, get approvals, and keep non-technical stakeholders in the loop.</p>
          </div>

          <div class="spectrum-card">
            <div class="spectrum-icon spectrum-icon--solo">
              <span>W</span>
            </div>
            <h4 class="spectrum-name">Solo Builder</h4>
            <p class="spectrum-desc">Knows WordPress deeply but isn't a server admin. Comfortable with themes and plugins, less so with terminal commands and config files.</p>
          </div>

          <div class="spectrum-card">
            <div class="spectrum-icon spectrum-icon--nocode">
              <span>&#9632;</span>
            </div>
            <h4 class="spectrum-name">No-Code Creator</h4>
            <p class="spectrum-desc">Builds with blocks and page builders. Wants results, not code. The site editor is their IDE.</p>
          </div>
        </div>

        <div class="spectrum-insight">
          <span class="spectrum-insight-line"></span>
          <p class="spectrum-insight-text">Different people, same jobs.</p>
          <span class="spectrum-insight-line"></span>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════ -->
    <!-- WHAT IS JTBD                                -->
    <!-- ═══════════════════════════════════════════ -->

    <div class="framework-note">
      <div class="section-inner section-inner--wide">
        <div class="framework-note-inner">
          <div class="framework-note-block">
            <strong>Jobs to Be Done</strong> — People don't buy products for features, they <strong>hire</strong> them to make progress. Every job has three dimensions: <span class="dim-inline dim-inline--functional">Functional</span> (the practical outcome), <span class="dim-inline dim-inline--emotional">Emotional</span> (how it feels), and <span class="dim-inline dim-inline--social">Social</span> (how others perceive them).
          </div>
          <div class="framework-note-block">
            <strong>Job story format</strong> — When <span class="slot">situation</span>, I want to <span class="slot">motivation</span>, so I can <span class="slot">outcome</span>.
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- FORCES OF PROGRESS                          -->
    <!-- ═══════════════════════════════════════════ -->

    <section class="forces">
      <div class="section-inner">
        <h2 class="section-label">Switching behavior</h2>
        <h3 class="section-title">Forces of Progress</h3>
        <p class="forces-intro">Four forces act on every decision to switch tools. Push and pull drive change. Habit and anxiety resist it. Both push <em>and</em> pull must overcome habit <em>and</em> anxiety for someone to hire Studio.</p>

        <div class="forces-diagram">
          <div class="forces-row">
            <div class="force force--push">
              <div class="force-header">
                <span class="force-arrow">&#8599;</span>
                <span class="force-name">Push</span>
              </div>
              <div class="force-subtitle">Frustrations with current tools</div>
              <ul class="force-list">
                <li>Slow, manual environment setup</li>
                <li>Config file hell across projects</li>
                <li>Fear of breaking production</li>
                <li>Screenshot-based feedback loops</li>
                <li>Context-switching between CLI, browser, editor</li>
              </ul>
            </div>
            <div class="force force--pull">
              <div class="force-header">
                <span class="force-arrow">&#8600;</span>
                <span class="force-name">Pull</span>
              </div>
              <div class="force-subtitle">Attraction of Studio</div>
              <ul class="force-list">
                <li>Instant site creation, zero config</li>
                <li>AI that understands WordPress context</li>
                <li>Visual sync pipeline to staging/prod</li>
                <li>Live preview links for real feedback</li>
                <li>Everything in one window</li>
              </ul>
            </div>
          </div>

          <div class="forces-divider">
            <span class="forces-divider-label forces-divider-label--drive">Drives change</span>
            <span class="forces-divider-line"></span>
            <span class="forces-divider-label forces-divider-label--resist">Resists change</span>
          </div>

          <div class="forces-row">
            <div class="force force--habit">
              <div class="force-header">
                <span class="force-arrow">&#8601;</span>
                <span class="force-name">Habit</span>
              </div>
              <div class="force-subtitle">Inertia of current workflow</div>
              <ul class="force-list">
                <li>"I already know how MAMP works"</li>
                <li>Existing Docker configs and scripts</li>
                <li>Team already standardized on Local</li>
                <li>Muscle memory for terminal workflows</li>
              </ul>
            </div>
            <div class="force force--anxiety">
              <div class="force-header">
                <span class="force-arrow">&#8598;</span>
                <span class="force-name">Anxiety</span>
              </div>
              <div class="force-subtitle">Fears about switching</div>
              <ul class="force-list">
                <li>"Will my existing sites migrate cleanly?"</li>
                <li>"Can I trust AI to change my code?"</li>
                <li>"Is this mature enough for client work?"</li>
                <li>"What if Automattic discontinues it?"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════ -->
    <!-- STUDIO'S JOBS                               -->
    <!-- ═══════════════════════════════════════════ -->

    <section class="jobs">
      <div class="section-inner">
        <h2 class="section-label">The main event</h2>
        <h3 class="section-title">Studio's Jobs</h3>

        <!-- Local Development -->
        <div class="job-group">
          <div class="job-group-header">
            <div class="job-group-icon">
              <WPIcon :icon="wordpress" :size="20" />
            </div>
            <h4 class="job-group-name">Local Development</h4>
            <p class="job-group-desc">Creating, running, and managing WordPress sites on your machine.</p>
          </div>

          <div class="job-cards">
            <div class="job-card">
              <h5 class="job-card-title">Spin up a new site</h5>
              <blockquote class="job-card-story">When I have a new idea or project to start, I want to create a working WordPress site instantly, so I can start building without fighting infrastructure.</blockquote>
              <div class="job-card-dimensions">
                <div class="dim dim--functional">
                  <span class="dim-label">Functional</span>
                  <span class="dim-text">Site runs locally with correct PHP/WP versions in under 60 seconds.</span>
                </div>
                <div class="dim dim--emotional">
                  <span class="dim-label">Emotional</span>
                  <span class="dim-text">Zero friction. The tool disappears — I'm just building.</span>
                </div>
                <div class="dim dim--social">
                  <span class="dim-label">Social</span>
                  <span class="dim-text">No "still setting up my environment" excuses.</span>
                </div>
              </div>
            </div>

            <div class="job-card">
              <h5 class="job-card-title">Clone an existing environment</h5>
              <blockquote class="job-card-story">When I need to reproduce a bug or match a client's setup, I want to pull their live site into a local copy, so I can work against real data without risk.</blockquote>
              <div class="job-card-dimensions">
                <div class="dim dim--functional">
                  <span class="dim-label">Functional</span>
                  <span class="dim-text">Full site clone — database, uploads, plugins, theme, configuration.</span>
                </div>
                <div class="dim dim--emotional">
                  <span class="dim-label">Emotional</span>
                  <span class="dim-text">Confidence that my local environment matches reality.</span>
                </div>
              </div>
            </div>

            <div class="job-card">
              <h5 class="job-card-title">Manage multiple sites</h5>
              <blockquote class="job-card-story">When I'm juggling several projects, I want to see all my sites at a glance and switch between them quickly, so I don't lose context or accidentally work on the wrong one.</blockquote>
              <div class="job-card-dimensions">
                <div class="dim dim--functional">
                  <span class="dim-label">Functional</span>
                  <span class="dim-text">Site list with status, quick switching, start/stop controls.</span>
                </div>
                <div class="dim dim--emotional">
                  <span class="dim-label">Emotional</span>
                  <span class="dim-text">Feeling organized, not overwhelmed.</span>
                </div>
              </div>
            </div>

            <div class="job-card">
              <h5 class="job-card-title">Configure a site's environment</h5>
              <blockquote class="job-card-story">When a project requires a specific PHP version, WordPress release, or debugging setup, I want to change those settings without leaving the app, so I don't have to mess with config files or terminal commands.</blockquote>
              <div class="job-card-dimensions">
                <div class="dim dim--functional">
                  <span class="dim-label">Functional</span>
                  <span class="dim-text">PHP version, WP version, debug mode, domain — all in one place.</span>
                </div>
                <div class="dim dim--emotional">
                  <span class="dim-label">Emotional</span>
                  <span class="dim-text">I'm in control without needing to be a sysadmin.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI-Assisted Editing -->
        <div class="job-group">
          <div class="job-group-header">
            <div class="job-group-icon">
              <WPIcon :icon="brush" :size="20" />
            </div>
            <h4 class="job-group-name">AI-Assisted Editing</h4>
            <p class="job-group-desc">Kit proposes and applies changes to your site through conversation.</p>
          </div>

          <div class="job-cards">
            <div class="job-card">
              <h5 class="job-card-title">Describe what I want, not how to build it</h5>
              <blockquote class="job-card-story">When I know what outcome I want but not the technical steps, I want to describe it in plain language and see a proposed solution, so I can iterate on the result instead of the implementation.</blockquote>
              <div class="job-card-dimensions">
                <div class="dim dim--functional">
                  <span class="dim-label">Functional</span>
                  <span class="dim-text">Natural language to concrete changes, shown before applied.</span>
                </div>
                <div class="dim dim--emotional">
                  <span class="dim-label">Emotional</span>
                  <span class="dim-text">Empowered, not dependent. I'm directing, not delegating blindly.</span>
                </div>
                <div class="dim dim--social">
                  <span class="dim-label">Social</span>
                  <span class="dim-text">Professional results even in areas outside my expertise.</span>
                </div>
              </div>
            </div>

            <div class="job-card">
              <h5 class="job-card-title">See changes before they land</h5>
              <blockquote class="job-card-story">When Kit proposes a change to my site, I want to review what will change before it's applied, so I stay in control and can catch mistakes early.</blockquote>
              <div class="job-card-dimensions">
                <div class="dim dim--functional">
                  <span class="dim-label">Functional</span>
                  <span class="dim-text">Card-based proposals with clear descriptions. Accept/reject per change.</span>
                </div>
                <div class="dim dim--emotional">
                  <span class="dim-label">Emotional</span>
                  <span class="dim-text">Trust. I'm collaborating with the AI, not being railroaded by it.</span>
                </div>
              </div>
            </div>

            <div class="job-card">
              <h5 class="job-card-title">Iterate quickly</h5>
              <blockquote class="job-card-story">When the first result isn't quite right, I want to refine it through conversation — "make the header bigger," "try a different color" — so I can explore options without starting over each time.</blockquote>
              <div class="job-card-dimensions">
                <div class="dim dim--functional">
                  <span class="dim-label">Functional</span>
                  <span class="dim-text">Conversational back-and-forth with live preview updates.</span>
                </div>
                <div class="dim dim--emotional">
                  <span class="dim-label">Emotional</span>
                  <span class="dim-text">Creative flow. Ideas move at the speed of thought, not the speed of code.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Collaboration -->
        <div class="job-group">
          <div class="job-group-header">
            <div class="job-group-icon">
              <WPIcon :icon="people" :size="20" />
            </div>
            <h4 class="job-group-name">Collaboration</h4>
            <p class="job-group-desc">Sharing work, getting feedback, and moving code between environments.</p>
          </div>

          <div class="job-cards">
            <div class="job-card">
              <h5 class="job-card-title">Share work-in-progress</h5>
              <blockquote class="job-card-story">When I want feedback on something I'm building, I want to share a live preview link with a colleague or client, so they can see real work — not screenshots — and respond with context.</blockquote>
              <div class="job-card-dimensions">
                <div class="dim dim--functional">
                  <span class="dim-label">Functional</span>
                  <span class="dim-text">Shareable URL, access controls, view tracking.</span>
                </div>
                <div class="dim dim--emotional">
                  <span class="dim-label">Emotional</span>
                  <span class="dim-text">Pride. I'm showing real, working progress.</span>
                </div>
                <div class="dim dim--social">
                  <span class="dim-label">Social</span>
                  <span class="dim-text">Stakeholders see polish, not chaos. The preview is the presentation.</span>
                </div>
              </div>
            </div>

            <div class="job-card">
              <h5 class="job-card-title">Push to staging or production</h5>
              <blockquote class="job-card-story">When my local changes are ready, I want to push them to a staging or production environment, so I can ship without switching tools or running manual deploy scripts.</blockquote>
              <div class="job-card-dimensions">
                <div class="dim dim--functional">
                  <span class="dim-label">Functional</span>
                  <span class="dim-text">One-click push to connected environments. Visual pipeline.</span>
                </div>
                <div class="dim dim--emotional">
                  <span class="dim-label">Emotional</span>
                  <span class="dim-text">Shipping feels good, not scary.</span>
                </div>
              </div>
            </div>

            <div class="job-card">
              <h5 class="job-card-title">Pull remote changes locally</h5>
              <blockquote class="job-card-story">When someone else has made changes on staging or production, I want to pull those changes into my local site, so I'm always working against the latest version.</blockquote>
              <div class="job-card-dimensions">
                <div class="dim dim--functional">
                  <span class="dim-label">Functional</span>
                  <span class="dim-text">Pull from any connected environment. Conflict-aware.</span>
                </div>
                <div class="dim dim--emotional">
                  <span class="dim-label">Emotional</span>
                  <span class="dim-text">Confidence I'm not working on stale data.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Management -->
        <div class="job-group">
          <div class="job-group-header">
            <div class="job-group-icon">
              <WPIcon :icon="backup" :size="20" />
            </div>
            <h4 class="job-group-name">Data Management</h4>
            <p class="job-group-desc">Moving site data in and out of Studio.</p>
          </div>

          <div class="job-cards">
            <div class="job-card">
              <h5 class="job-card-title">Import an existing site</h5>
              <blockquote class="job-card-story">When I have a Jetpack backup or a full-site export, I want to drag it into Studio and get a working local site, so I can pick up where someone else left off.</blockquote>
              <div class="job-card-dimensions">
                <div class="dim dim--functional">
                  <span class="dim-label">Functional</span>
                  <span class="dim-text">Drag-and-drop import. Supports Jetpack backups and WP exports.</span>
                </div>
                <div class="dim dim--emotional">
                  <span class="dim-label">Emotional</span>
                  <span class="dim-text">Relief. Migration isn't a project — it's a gesture.</span>
                </div>
              </div>
            </div>

            <div class="job-card">
              <h5 class="job-card-title">Export for backup or handoff</h5>
              <blockquote class="job-card-story">When I need to hand a site to someone else or archive my work, I want to export everything as a single file, so the recipient can restore it without chasing down pieces.</blockquote>
              <div class="job-card-dimensions">
                <div class="dim dim--functional">
                  <span class="dim-label">Functional</span>
                  <span class="dim-text">One-click export. Complete site bundle.</span>
                </div>
                <div class="dim dim--emotional">
                  <span class="dim-label">Emotional</span>
                  <span class="dim-text">Clean handoff. Nothing lost, nothing forgotten.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════ -->
    <!-- WHAT WE'RE REPLACING                        -->
    <!-- ═══════════════════════════════════════════ -->

    <section class="competing">
      <div class="section-inner">
        <h2 class="section-label">What we're replacing</h2>
        <h3 class="section-title">Hired vs. Fired</h3>
        <p class="competing-intro">Every time someone hires Studio, they fire something else. Understanding what gets fired — and why — reveals where our real advantages lie.</p>

        <div class="competing-group">
          <h4 class="competing-group-name">Local development tools</h4>
          <div class="competing-table">
            <div class="competing-row competing-row--header">
              <div class="competing-cell competing-cell--tool">Tool</div>
              <div class="competing-cell competing-cell--right">What they get right</div>
              <div class="competing-cell competing-cell--short">Where they fall short</div>
            </div>
            <div class="competing-row">
              <div class="competing-cell competing-cell--tool">
                <strong>Local</strong>
                <span class="competing-by">WP Engine</span>
              </div>
              <div class="competing-cell competing-cell--right">Polished GUI, one-click sites, live links for sharing. The closest to Studio's experience.</div>
              <div class="competing-cell competing-cell--short">No AI assistance. No sync pipeline. Cloud features locked to WP Engine's ecosystem.</div>
            </div>
            <div class="competing-row">
              <div class="competing-cell competing-cell--tool">
                <strong>DevKinsta</strong>
                <span class="competing-by">Kinsta</span>
              </div>
              <div class="competing-cell competing-cell--right">Clean interface, tight hosting integration. Solid Docker-based architecture.</div>
              <div class="competing-cell competing-cell--short">Docker overhead. Smaller community. Cloud features locked to Kinsta customers.</div>
            </div>
            <div class="competing-row">
              <div class="competing-cell competing-cell--tool">
                <strong>MAMP / XAMPP</strong>
              </div>
              <div class="competing-cell competing-cell--right">Mature, well-known, gets the job done.</div>
              <div class="competing-cell competing-cell--short">Heavy setup. Feels like sysadmin work, not building.</div>
            </div>
            <div class="competing-row">
              <div class="competing-cell competing-cell--tool">
                <strong>wp-env / Lando</strong>
              </div>
              <div class="competing-cell competing-cell--right">Developer-friendly, config-as-code, reproducible environments.</div>
              <div class="competing-cell competing-cell--short">CLI-heavy. Requires terminal comfort. Not accessible to non-code builders.</div>
            </div>
            <div class="competing-row">
              <div class="competing-cell competing-cell--tool">
                <strong>Editing on prod</strong>
              </div>
              <div class="competing-cell competing-cell--right">Zero setup. Instant results. Surprisingly common.</div>
              <div class="competing-cell competing-cell--short">One mistake = broken live site. The emotional cost is catastrophic.</div>
            </div>
          </div>
        </div>

        <div class="competing-group">
          <h4 class="competing-group-name">Sharing &amp; feedback</h4>
          <div class="competing-table">
            <div class="competing-row competing-row--header">
              <div class="competing-cell competing-cell--tool">Tool</div>
              <div class="competing-cell competing-cell--right">What they get right</div>
              <div class="competing-cell competing-cell--short">Where they fall short</div>
            </div>
            <div class="competing-row">
              <div class="competing-cell competing-cell--tool"><strong>Screenshots</strong></div>
              <div class="competing-cell competing-cell--right">Low effort to create. Everyone knows how.</div>
              <div class="competing-cell competing-cell--short">No interactivity. Can't click, scroll, or test responsiveness.</div>
            </div>
            <div class="competing-row">
              <div class="competing-cell competing-cell--tool"><strong>Staging servers</strong></div>
              <div class="competing-cell competing-cell--right">Full fidelity. Stakeholders see the real thing.</div>
              <div class="competing-cell competing-cell--short">Manual setup and deploy cycles slow the feedback loop.</div>
            </div>
            <div class="competing-row">
              <div class="competing-cell competing-cell--tool"><strong>Screen share calls</strong></div>
              <div class="competing-cell competing-cell--right">Real-time discussion with context.</div>
              <div class="competing-cell competing-cell--short">Synchronous. Everyone has to be available at the same time.</div>
            </div>
          </div>
        </div>

        <div class="competing-group">
          <h4 class="competing-group-name">AI-assisted building</h4>
          <div class="competing-table">
            <div class="competing-row competing-row--header">
              <div class="competing-cell competing-cell--tool">Tool</div>
              <div class="competing-cell competing-cell--right">What they get right</div>
              <div class="competing-cell competing-cell--short">Where they fall short</div>
            </div>
            <div class="competing-row">
              <div class="competing-cell competing-cell--tool"><strong>ChatGPT / Claude</strong></div>
              <div class="competing-cell competing-cell--right">Great answers. Broad knowledge. Conversational.</div>
              <div class="competing-cell competing-cell--short">Copy-paste gap. "Here's the code" ≠ "it's live on my site."</div>
            </div>
            <div class="competing-row">
              <div class="competing-cell competing-cell--tool"><strong>Copilot / Cursor</strong></div>
              <div class="competing-cell competing-cell--right">Excellent code-level assistance. Context-aware.</div>
              <div class="competing-cell competing-cell--short">File-level, not site-level. No WordPress or plugin awareness.</div>
            </div>
            <div class="competing-row">
              <div class="competing-cell competing-cell--tool"><strong>Page builders</strong></div>
              <div class="competing-cell competing-cell--right">Visual editing without code. Accessible to non-devs.</div>
              <div class="competing-cell competing-cell--short">Locked ecosystem. "Describe and iterate" done through menus, not conversation.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
/* ══════════════════════════════════════════
   PAGE SHELL
   ══════════════════════════════════════════ */

.jtbd-page {
  height: 100%;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.section-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--space-xl);
}

.section-inner--wide {
  max-width: none;
}

.section-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-frame-theme);
  margin-block-end: var(--space-xxs);
}

.section-title {
  font-size: 28px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin-block-end: var(--space-m);
  line-height: 1.2;
  letter-spacing: -0.01em;
}

/* ══════════════════════════════════════════
   HERO
   ══════════════════════════════════════════ */

.hero {
  padding: var(--space-xxxl) var(--space-xl);
  background: var(--color-frame-bg);
  border-block-end: 1px solid var(--color-frame-border);
}

.hero-inner {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-size: 40px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin-block-end: var(--space-m);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: var(--font-size-xl);
  color: var(--color-frame-fg-muted);
  line-height: 1.6;
}

.hero-subtitle em {
  color: var(--color-frame-fg);
  font-style: normal;
  font-weight: var(--font-weight-semibold);
}

/* ══════════════════════════════════════════
   THE SPECTRUM
   ══════════════════════════════════════════ */

.spectrum {
  padding: var(--space-xxxl) 0;
  background: var(--color-frame-fill);
}

.spectrum-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-m);
  margin-block-end: var(--space-xl);
}

.spectrum-card {
  padding: var(--space-l);
  background: var(--color-frame-bg);
  border-radius: var(--radius-m);
  border: 1px solid var(--color-frame-border);
}

.spectrum-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-m);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  margin-block-end: var(--space-s);
  font-family: var(--font-family-mono);
}

.spectrum-icon--engineer {
  background: #e8edfd;
  color: #3858e9;
}

.spectrum-icon--inhouse {
  background: #fef3cd;
  color: #8a6d3b;
}

.spectrum-icon--solo {
  background: #d4edda;
  color: #155724;
}

.spectrum-icon--nocode {
  background: #f0ddf5;
  color: #6f3381;
}

.spectrum-name {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin-block-end: var(--space-xxs);
}

.spectrum-desc {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.5;
}

.spectrum-insight {
  display: flex;
  align-items: center;
  gap: var(--space-m);
}

.spectrum-insight-line {
  flex: 1;
  height: 1px;
  background: var(--color-frame-border);
}

.spectrum-insight-text {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  font-style: italic;
  white-space: nowrap;
}

/* ══════════════════════════════════════════
   FRAMEWORK NOTE
   ══════════════════════════════════════════ */

.framework-note {
  padding: var(--space-m) 0;
  background: var(--color-frame-bg);
  border-block-end: 1px solid var(--color-frame-border);
}

.framework-note-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  max-width: 600px;
  margin: 0 auto;
}

.framework-note-block {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.6;
}

.framework-note-block strong {
  color: var(--color-frame-fg);
}

.dim-inline {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.dim-inline--functional { color: var(--color-frame-theme); }
.dim-inline--emotional { color: #d35e33; }
.dim-inline--social { color: #7b61ad; }

.slot {
  color: var(--color-frame-theme);
  font-style: italic;
}

/* ══════════════════════════════════════════
   FORCES OF PROGRESS
   ══════════════════════════════════════════ */

.forces {
  padding: var(--space-xxxl) 0;
  background: var(--color-chrome-bg);
  color: var(--color-chrome-fg);
}

.forces .section-label {
  color: var(--color-chrome-theme);
}

.forces .section-title {
  color: var(--color-chrome-fg);
}

.forces-intro {
  font-size: var(--font-size-m);
  color: var(--color-chrome-fg-muted);
  line-height: 1.7;
  margin-block-end: var(--space-xl);
  max-width: 600px;
}

.forces-intro em {
  color: var(--color-chrome-fg);
  font-style: italic;
}

.forces-diagram {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.forces-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-m);
}

.force {
  padding: var(--space-l);
  border-radius: var(--radius-m);
  background: var(--color-chrome-hover);
  border: 1px solid var(--color-chrome-border);
}

.force-header {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-block-end: var(--space-xxs);
}

.force-arrow {
  font-size: 18px;
  line-height: 1;
}

.force-name {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
}

.force-subtitle {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  margin-block-end: var(--space-s);
}

.force-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.force-list li {
  font-size: var(--font-size-s);
  color: var(--color-chrome-fg-muted);
  line-height: 1.5;
  padding-inline-start: var(--space-s);
  position: relative;
}

.force-list li::before {
  content: '';
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: 7px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-chrome-fg-muted);
}

/* Force color accents */

.force--push {
  border-color: rgba(232, 93, 84, 0.3);
}

.force--push .force-arrow,
.force--push .force-name {
  color: #e85d54;
}

.force--pull {
  border-color: rgba(40, 200, 64, 0.3);
}

.force--pull .force-arrow,
.force--pull .force-name {
  color: #28c840;
}

.force--habit {
  border-color: rgba(255, 189, 46, 0.3);
}

.force--habit .force-arrow,
.force--habit .force-name {
  color: #ffbd2e;
}

.force--anxiety {
  border-color: rgba(88, 123, 243, 0.3);
}

.force--anxiety .force-arrow,
.force--anxiety .force-name {
  color: #587bf3;
}

/* Divider */

.forces-divider {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-s) 0;
}

.forces-divider-line {
  flex: 1;
  height: 1px;
  background: var(--color-chrome-border);
}

.forces-divider-label {
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.forces-divider-label--drive {
  color: var(--color-chrome-fg-muted);
}

.forces-divider-label--resist {
  color: var(--color-chrome-fg-muted);
}

/* ══════════════════════════════════════════
   STUDIO'S JOBS
   ══════════════════════════════════════════ */

.jobs {
  padding: var(--space-xxxl) 0;
  background: var(--color-frame-bg);
  border-block-end: 1px solid var(--color-frame-border);
}

.job-group {
  margin-block-end: var(--space-xxxl);
}

.job-group:last-child {
  margin-block-end: 0;
}

.job-group-header {
  margin-block-end: var(--space-l);
}

.job-group-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-m);
  background: var(--color-frame-fill);
  border: 1px solid var(--color-frame-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-frame-theme);
  margin-block-end: var(--space-s);
}

.job-group-name {
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin-block-end: var(--space-xxs);
}

.job-group-desc {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  line-height: 1.5;
}

.job-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.job-card {
  padding: var(--space-l);
  background: var(--color-frame-fill);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
}

.job-card-title {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin-block-end: var(--space-xs);
}

.job-card-story {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg);
  line-height: 1.6;
  margin: 0 0 var(--space-m) 0;
  padding: var(--space-s) var(--space-m);
  border-inline-start: 3px solid var(--color-frame-theme);
  background: var(--color-frame-bg);
  border-radius: 0 var(--radius-s) var(--radius-s) 0;
  font-style: italic;
}

.job-card-dimensions {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.dim {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
}

.dim-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
  width: 72px;
}

.dim--functional .dim-label { color: var(--color-frame-theme); }
.dim--emotional .dim-label { color: #d35e33; }
.dim--social .dim-label { color: #7b61ad; }

.dim-text {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.5;
}

/* ══════════════════════════════════════════
   WHAT WE'RE REPLACING
   ══════════════════════════════════════════ */

.competing {
  padding: var(--space-xxxl) 0;
  background: var(--color-frame-fill);
}

.competing-intro {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  line-height: 1.7;
  margin-block-end: var(--space-xl);
  max-width: 600px;
}

.competing-group {
  margin-block-end: var(--space-xl);
}

.competing-group:last-child {
  margin-block-end: 0;
}

.competing-group-name {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin-block-end: var(--space-s);
}

.competing-table {
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  overflow: hidden;
  background: var(--color-frame-bg);
}

.competing-row {
  display: grid;
  grid-template-columns: 140px 1fr 1fr;
  border-block-end: 1px solid var(--color-frame-border);
}

.competing-row:last-child {
  border-block-end: none;
}

.competing-row--header {
  background: var(--color-frame-fill);
}

.competing-row--header .competing-cell {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-frame-fg-muted);
}

.competing-cell {
  padding: var(--space-s) var(--space-m);
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
  line-height: 1.5;
}

.competing-cell--tool {
  border-inline-end: 1px solid var(--color-frame-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.competing-cell--tool strong {
  color: var(--color-frame-fg);
  font-weight: var(--font-weight-semibold);
}

.competing-by {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
}

.competing-cell--right {
  border-inline-end: 1px solid var(--color-frame-border);
}
</style>

<script setup lang="ts">
import Text from '@shared/primitives/Text.vue'

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'screens', label: 'Screens & States' },
  { id: 'data-layer', label: 'Data Layer' },
  { id: 'routing', label: 'Routing' },
  { id: 'components', label: 'Components' },
]
</script>

<template>
  <div class="arch-layout hstack">
    <nav class="arch-nav">
      <h2 class="nav-heading">Architecture</h2>
      <ul class="vstack gap-xxxs">
        <li v-for="item in sections" :key="item.id">
          <a :href="'#' + item.id" class="nav-link">{{ item.label }}</a>
        </li>
      </ul>
      <div class="nav-docs vstack gap-xxxs mt-m">
        <Text variant="label" color="muted">Plan docs</Text>
        <a href="/DATA-LAYER.md" class="nav-link" target="_blank">DATA-LAYER.md</a>
        <a href="/ROUTING.md" class="nav-link" target="_blank">ROUTING.md</a>
        <a href="/COMPONENTS.md" class="nav-link" target="_blank">COMPONENTS.md</a>
      </div>
    </nav>
    <div class="arch-content flex-1 min-w-0">

      <section id="overview">
        <h2>Overview</h2>
        <p class="section-desc">Architecture plans for the projects-i0 prototype. This page summarizes the key decisions; full details live in the linked plan docs.</p>

        <div class="card vstack gap-xs p-m mt-m">
          <Text variant="body" weight="medium">Status: Plans Complete ✅</Text>
          <Text variant="body" color="secondary">All three architecture plans (data layer, routing, components) are finalized. See summaries below or read the full MD files linked in the sidebar.</Text>
        </div>
      </section>

      <section id="screens">
        <h2>Screens &amp; States</h2>
        <p class="section-desc">The app has three primary screens, plus dev/documentation pages.</p>

        <h3>Home <code>/</code></h3>
        <div class="screen-desc vstack gap-xxs">
          <Text variant="body" color="secondary">Landing page. Grid of projects, global cross-project chat, onboarding for new users without projects.</Text>
        </div>

        <h3>Project <code>/projects/:id</code></h3>
        <div class="screen-desc vstack gap-xxs">
          <Text variant="body" color="secondary">The working view. Sidebar with project list, agent chat panel with tabs, site preview. This is what the current app-shell demo represents.</Text>
        </div>

        <h3>Settings <code>/settings</code></h3>
        <div class="screen-desc vstack gap-xxs">
          <Text variant="body" color="secondary">App configuration. Details TBD.</Text>
        </div>

        <h3>Dev Pages</h3>
        <div class="screen-desc vstack gap-xxs">
          <Text variant="body" color="secondary">Design System, Components, and this Architecture page. Accessible during development, not part of the user-facing app.</Text>
        </div>
      </section>

      <section id="data-layer">
        <h2>Data Layer</h2>
        <p class="section-desc">How the app manages state — models, stores, and seed data.</p>

        <h3>Approach</h3>
        <div class="card vstack gap-xs p-m">
          <Text variant="body"><strong>Vue composables with reactive state + typed seed data.</strong> No Pinia, no JSON server, no localStorage. Module-level <code>ref</code>/<code>reactive</code> state initialized from TypeScript seed objects acts as a singleton store shared across components.</Text>
          <Text variant="body" color="secondary">Refreshing resets to seed state — a feature for demos, not a limitation. Zero new dependencies.</Text>
        </div>

        <h3>Core Models</h3>
        <div class="card vstack gap-xs p-m">
          <Text variant="body"><code>Project</code> — id, name, favicon, status (<code>running</code> | <code>stopped</code> | <code>loading</code>), url, description</Text>
          <Text variant="body"><code>Agent</code> — id (<code>assistant</code> | <code>code</code> | <code>design</code>), label, description</Text>
          <Text variant="body"><code>Conversation</code> — ties a project (or <code>null</code> for global) to an agent</Text>
          <Text variant="body"><code>Message</code> — role (<code>user</code> | <code>agent</code>), content, timestamp, linked to conversation</Text>
        </div>

        <h3>File Structure</h3>
        <div class="card vstack gap-xs p-m">
          <Text variant="body"><code>src/data/types.ts</code> — TypeScript interfaces</Text>
          <Text variant="body"><code>src/data/agents.ts</code> — Static agent definitions</Text>
          <Text variant="body"><code>src/data/seed-projects.ts</code> — 4 demo projects</Text>
          <Text variant="body"><code>src/data/seed-conversations.ts</code> — Conversations + messages</Text>
          <Text variant="body"><code>src/data/useProjects.ts</code> — Project CRUD composable</Text>
          <Text variant="body"><code>src/data/useConversations.ts</code> — Conversation/message composable</Text>
          <Text variant="body"><code>src/data/useAgents.ts</code> — Agent list composable</Text>
        </div>
      </section>

      <section id="routing">
        <h2>Routing</h2>
        <p class="section-desc">Route structure, layouts, and navigation patterns.</p>

        <h3>Approach</h3>
        <div class="card vstack gap-xs p-m">
          <Text variant="body"><strong>Layout wrapper pattern via <code>route.meta.layout</code>.</strong> Each route declares its layout; <code>App.vue</code> dynamically renders the correct layout component wrapping <code>&lt;router-view&gt;</code>.</Text>
          <Text variant="body" color="secondary">Two real layouts + bare for dev pages. Simpler than nested routes since layouts don't share sub-routes. Project switching is a route change (<code>/projects/:id</code>) so URLs are shareable and back-button works.</Text>
        </div>

        <h3>Layouts</h3>
        <div class="card vstack gap-xs p-m">
          <Text variant="body"><code>AppLayout</code> — Titlebar + full-width content (Home, Settings)</Text>
          <Text variant="body"><code>ProjectLayout</code> — Titlebar + Sidebar + panel area (extracted from AppShell)</Text>
          <Text variant="body"><code>BareLayout</code> — No chrome, just <code>&lt;slot /&gt;</code> (dev pages)</Text>
        </div>

        <h3>Route Table</h3>
        <div class="card vstack gap-xs p-m">
          <Text variant="body"><code>/</code> → <code>HomePage</code> · AppLayout — project grid + global chat</Text>
          <Text variant="body"><code>/projects/:id</code> → <code>ProjectPage</code> · ProjectLayout — sidebar + agent chat + preview</Text>
          <Text variant="body"><code>/settings</code> → <code>SettingsPage</code> · AppLayout</Text>
          <Text variant="body"><code>/design-system</code>, <code>/components</code>, <code>/architecture</code> → BareLayout (dev pages)</Text>
        </div>
      </section>

      <section id="components">
        <h2>Components</h2>
        <p class="section-desc">Component organization, decomposition, and new components needed.</p>

        <h3>Approach</h3>
        <div class="card vstack gap-xs p-m">
          <Text variant="body"><strong>Three-tier component organization:</strong> <code>primitives/</code> (atomic, no business logic), <code>composites/</code> (multi-primitive combos, still generic), and <code>features/</code> (screen-specific, business-aware). Layouts live separately in <code>layouts/</code>.</Text>
          <Text variant="body" color="secondary">Key refactor: AgentPanel is decomposed into TabBar + ChatMessageList + InputChat, with state extracted into composables (<code>useChat</code>, <code>useAgentTabs</code>, <code>useProjects</code>).</Text>
        </div>

        <h3>New Components</h3>
        <div class="card vstack gap-xs p-m">
          <Text variant="body"><strong>Primitives:</strong> <code>Avatar</code>, <code>Badge</code></Text>
          <Text variant="body"><strong>Composites:</strong> <code>TabBar</code>, <code>ChatMessageList</code>, <code>ProjectCard</code></Text>
          <Text variant="body"><strong>Features:</strong> <code>ProjectGrid</code>, <code>HomeChat</code>, <code>OnboardingEmpty</code></Text>
          <Text variant="body"><strong>Layouts:</strong> <code>AppChrome</code> (titlebar + chrome background), <code>SplitLayout</code> (resizable two-pane)</Text>
        </div>

        <h3>Implementation Order</h3>
        <div class="card vstack gap-xs p-m">
          <Text variant="body" color="secondary">1. Create folder structure + move files → 2. Extract types + composables → 3. Split AgentPanel → 4. Build layouts → 5. Refactor ProjectPage → 6. Build Home components → 7. Build HomePage → 8. Stub Settings → 9. Update router. Steps 1–5 are refactors (no visual change); 6–9 add new screens.</Text>
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.arch-layout {
  min-height: 100vh;
  scroll-behavior: smooth;
  font-family: var(--font-family);
  color: var(--color-text);
}

.arch-nav {
  position: sticky;
  top: 0;
  align-self: flex-start;
  width: 200px;
  padding: var(--space-xxxl) var(--space-m);
  border-inline-end: 1px solid var(--color-surface-border);
}

.nav-heading {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-xs);
}

.arch-nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  display: block;
  padding: var(--space-xxs) var(--space-xs);
  border-radius: var(--radius-s);
  font-size: var(--font-size-m);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: background var(--duration-instant) var(--ease-default), color var(--duration-instant) var(--ease-default);
}

.nav-link:hover {
  background: var(--color-surface-secondary);
  color: var(--color-text);
}

.arch-content {
  max-width: 960px;
  padding: var(--space-xxxl) var(--space-xl);
}

section {
  margin-block-end: var(--space-xxxl);
}

h2 {
  font-size: 20px; /* Section heading — intentional, outside type scale */
  font-weight: var(--font-weight-semibold);
  margin-block-end: var(--space-xxxs);
  padding-block-end: var(--space-xs);
  border-block-end: 1px solid var(--color-surface-border);
}

h3 {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: var(--space-m) 0 var(--space-xxs);
}

h3 code {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  background: var(--color-surface-secondary);
  padding: var(--space-xxxs) var(--space-xxs);
  border-radius: var(--radius-s);
  font-weight: var(--font-weight-regular);
  margin-inline-start: var(--space-xxs);
}

.section-desc {
  font-size: var(--font-size-m);
  color: var(--color-text-secondary);
  margin-block-end: var(--space-s);
}

.card {
  background: var(--color-surface-secondary);
  border-radius: var(--radius-m);
  border: 1px solid var(--color-surface-border);
}

.screen-desc {
  padding-inline-start: var(--space-s);
  border-inline-start: 2px solid var(--color-surface-border);
}
</style>

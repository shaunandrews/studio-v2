<script setup lang="ts">
import '@/pages/dev-docs.css'

const sections = [
  { id: 'layout', label: 'App Layout' },
  { id: 'screens', label: 'Screens' },
  { id: 'navigation', label: 'Navigation' },
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
      <h2 class="nav-heading">Architecture</h2>
      <ul class="vstack gap-xxxs">
        <li v-for="item in sections" :key="item.id">
          <a :href="'#' + item.id" class="nav-link" @click="scrollTo($event, item.id)">{{ item.label }}</a>
        </li>
      </ul>
    </nav>
    <div class="arch-main">

      <!-- ═══════════════════════ -->
      <!-- APP LAYOUT              -->
      <!-- ═══════════════════════ -->

      <section id="layout">
        <h2>App Layout</h2>
        <p class="arch-intro">The app is a dark chrome shell containing a sidebar and a content frame.</p>

        <div class="bp">
          <div class="bp-chrome">
            <div class="bp-sidebar">Sidebar</div>
            <div class="bp-frame">
              <div class="bp-toolbar">Toolbar</div>
              <div class="bp-content">
                <div class="bp-nav">Nav</div>
                <div class="bp-detail">Detail</div>
              </div>
            </div>
          </div>
        </div>

        <dl class="arch-defs">
          <dt>Chrome</dt>
          <dd>Dark background filling the viewport. Everything else sits on top of it.</dd>

          <dt>Sidebar</dt>
          <dd><code>SiteList</code> — 210px, left edge. Lists all sites. Collapsible via <code>Cmd+B</code>. When collapsed, the frame expands to fill the full viewport and a site-picker pill appears in the toolbar.</dd>

          <dt>Frame</dt>
          <dd>Inset panel with rounded corners. Holds the active screen. Contains three zones:</dd>

          <dt class="arch-sub">Toolbar</dt>
          <dd><code>SiteToolbar</code> — site name, status, action buttons. Top of the frame.</dd>

          <dt class="arch-sub">Nav</dt>
          <dd><code>SiteNavigation</code> — left column within the frame. Site overview, task list, and section links.</dd>

          <dt class="arch-sub">Detail</dt>
          <dd>Right column. Changes based on the active screen (chat, sync pipeline, previews, etc).</dd>
        </dl>
      </section>

      <!-- ═══════════════════════ -->
      <!-- SCREENS                 -->
      <!-- ═══════════════════════ -->

      <section id="screens">
        <h2>Screens</h2>
        <p class="arch-intro">Every screen shares the same sidebar + toolbar + nav + detail structure, except Add Site which uses a standalone full-screen layout.</p>

        <h3>All Sites <code>/all-sites</code></h3>
        <p class="arch-body">Landing view. Nav pane shows an all-sites summary (favicon stack, running/stopped counts) and a cross-site task list. Detail pane shows the selected conversation or an empty state. Toolbar has no status pill or site-specific actions.</p>

        <h3>Tasks <code>/sites/:id/tasks/:convoId?</code></h3>
        <p class="arch-body">The primary working view. Nav pane has three zones: site overview (thumbnail, URL, credentials), task list (conversations with archive), and section nav links. Detail pane shows the selected conversation as a chat — messages rendered as <code>MarkdownText</code> or structured cards (plugin, settings, progress, page, post draft). <code>InputChat</code> pins to the bottom with a model selector and action strip.</p>

        <h3>Sync <code>/sites/:id/sync</code></h3>
        <p class="arch-body">Detail pane switches to <code>SyncScreen</code>. A horizontal pipeline of stage cards connected by arrows. Each stage can link to a remote environment. Push/pull actions open <code>SyncModal</code>.</p>

        <h3>Previews <code>/sites/:id/previews</code></h3>
        <p class="arch-body">Detail pane shows <code>PreviewsScreen</code>. Shareable preview link cards with invite management, view counts, and expiry. Progress card shown during create/delete operations.</p>

        <h3>Import / Export <code>/sites/:id/import-export</code></h3>
        <p class="arch-body">Detail pane shows <code>ImportExportScreen</code>. Drag-and-drop import zone accepting Jetpack backups and full-site exports. Export download button. Both show progress states.</p>

        <h3>Settings <code>/sites/:id/settings</code></h3>
        <p class="arch-body">Detail pane shows <code>SiteSettingsScreen</code>. Four groups: general (name, PHP, WP version, domain), admin credentials, debugging, and git repository.</p>

        <h3>Add Site <code>/add-site</code></h3>
        <p class="arch-body">Standalone full-screen flow — no sidebar, no chrome. Three steps: choose a path (Blank, Blueprint, Pull, Import), select from a picker, then name and create. Uses <code>BareLayout</code>.</p>
      </section>

      <!-- ═══════════════════════ -->
      <!-- NAVIGATION              -->
      <!-- ═══════════════════════ -->

      <section id="navigation">
        <h2>Navigation</h2>
        <p class="arch-intro">How users move through the app.</p>

        <dl class="arch-defs">
          <dt>SiteList</dt>
          <dd>Sidebar. "All Sites" at top, then individual sites. Click to focus a site. "+" at bottom for site creation.</dd>

          <dt>SiteToolbar</dt>
          <dd>Top of the frame. Site name, start/stop status pill, and three flyout menus: <strong>WordPress</strong> (admin links via split button), <strong>Open In</strong> (Browser, VS Code, Cursor, Claude, Codex, Terminal, Finder), and <strong>More</strong> (copy URLs, share, duplicate, delete). When sidebar is collapsed, a site-picker pill appears here too.</dd>

          <dt>SiteNavigation</dt>
          <dd>Nav pane within the frame. Section links at the bottom switch the detail pane between Tasks, Sync, Previews, Import/Export, and Settings.</dd>

          <dt>GlobalMenu</dt>
          <dd>Opens upward from the gravatar button in the bottom-left corner. Account info, usage meters, links to Preferences and dev pages.</dd>

          <dt>Modals</dt>
          <dd><strong>Preferences</strong> (global settings), <strong>Shortcuts</strong> (keyboard reference), <strong>SyncModal</strong> (push/pull confirmation), <strong>ConnectSiteModal</strong> (link environment to pipeline stage).</dd>
        </dl>
      </section>

    </div>
  </div>
</template>

<style scoped>
/* ── Main content area (overrides dev-docs defaults for better spacing) ── */

.arch-main {
  flex: 1;
  min-width: 0;
  padding: var(--space-l) var(--space-xl);
  overflow-y: auto;
  scroll-behavior: smooth;
  max-width: 720px;
}

.arch-main section {
  margin-block-end: var(--space-xxxl);
}

.arch-main h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin-block-end: var(--space-xxs);
}

.arch-main h3 {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin: var(--space-l) 0 var(--space-xs);
}

.arch-main h3 code {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  background: var(--color-frame-hover);
  padding: var(--space-xxxs) var(--space-xxs);
  border-radius: var(--radius-s);
  font-weight: var(--font-weight-regular);
  margin-inline-start: var(--space-xxs);
}

.arch-main h4 {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg-muted);
  margin: var(--space-m) 0 var(--space-xs);
}

/* ── Text ── */

.arch-intro {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  margin-block-end: var(--space-l);
  line-height: 1.6;
}

.arch-body {
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  line-height: 1.6;
}

.arch-body code {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  background: var(--color-frame-hover);
  padding: 1px var(--space-xxxs);
  border-radius: var(--radius-s);
}

/* ── Definition lists ── */

.arch-defs {
  margin: 0;
}

.arch-defs dt {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  margin-block-start: var(--space-m);
}

.arch-defs dt.arch-sub {
  padding-inline-start: var(--space-m);
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
}

.arch-defs dd {
  margin: var(--space-xxs) 0 0 0;
  font-size: var(--font-size-m);
  color: var(--color-frame-fg-muted);
  line-height: 1.6;
}

.arch-defs dt.arch-sub + dd {
  padding-inline-start: var(--space-m);
}

.arch-defs dd code {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  background: var(--color-frame-hover);
  padding: 1px var(--space-xxxs);
  border-radius: var(--radius-s);
}

/* ══════════════════════════
   BLUEPRINT — the one diagram
   ══════════════════════════ */

.bp {
  margin-block-end: var(--space-l);
}

.bp-chrome {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-xs);
  background: var(--color-chrome-bg);
  border-radius: var(--radius-l);
  height: 280px;
}

.bp-sidebar {
  width: 80px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-chrome-fg-muted);
  letter-spacing: 0.02em;
}

.bp-frame {
  flex: 1;
  background: var(--color-frame-bg);
  border-radius: var(--radius-m);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bp-toolbar {
  padding: var(--space-xs) var(--space-s);
  border-block-end: 1px solid var(--color-frame-border);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg-muted);
}

.bp-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

.bp-nav {
  width: 100px;
  flex-shrink: 0;
  border-inline-end: 1px solid var(--color-frame-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg-muted);
}

.bp-detail {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg-muted);
}
</style>

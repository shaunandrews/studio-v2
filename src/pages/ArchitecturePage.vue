<script setup lang="ts">
import { ref } from 'vue'
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

const sidebarOpen = ref(true)
const platform = ref<'mac' | 'windows'>('mac')
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

        <div class="bp-controls">
          <button class="bp-toggle" :class="{ 'is-active': sidebarOpen }" @click="sidebarOpen = !sidebarOpen">
            {{ sidebarOpen ? 'Sidebar open' : 'Sidebar closed' }}
          </button>
          <div class="bp-platform-toggle">
            <button :class="{ 'is-active': platform === 'mac' }" @click="platform = 'mac'">Mac</button>
            <button :class="{ 'is-active': platform === 'windows' }" @click="platform = 'windows'">Windows</button>
          </div>
        </div>

        <div class="bp" :class="[`bp--${platform}`, { 'bp--collapsed': !sidebarOpen }]">
          <!-- Windows titlebar -->
          <div v-if="platform === 'windows'" class="bp-titlebar">
            <div class="bp-titlebar-start">
              <span class="bp-titlebar-icon">W</span>
              <span class="bp-titlebar-label">Studio</span>
              <span class="bp-titlebar-menus">File&ensp;Edit&ensp;View&ensp;Help</span>
            </div>
            <div class="bp-titlebar-controls">
              <span class="bp-win-btn">&#x2013;</span>
              <span class="bp-win-btn">&#9633;</span>
              <span class="bp-win-btn bp-win-close">&times;</span>
            </div>
          </div>
          <div class="bp-chrome">
            <div v-if="sidebarOpen" class="bp-sidebar">Sidebar</div>
            <div class="bp-frame" :class="{ 'bp-frame--full': !sidebarOpen }">
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

        <h3>Platform differences</h3>
        <dl class="arch-defs">
          <dt>Mac</dt>
          <dd>Traffic light buttons (close, minimize, maximize) are integrated into the top-left of the sidebar. The sidebar and frame share a single chrome background with inset padding on all sides.</dd>

          <dt>Windows</dt>
          <dd>Window controls (minimize, maximize, close) sit in a dedicated titlebar row above the chrome area. The titlebar also holds the app icon, name, and menu bar (File, Edit, View, Help). The sidebar and frame sit below it.</dd>
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

        <h3>Tasks <code>/sites/:id/tasks/:taskId?</code></h3>
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
/* ── Main content area ── */

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
   BLUEPRINT CONTROLS
   ══════════════════════════ */

.bp-controls {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  margin-block-end: var(--space-s);
}

.bp-toggle {
  padding: var(--space-xxs) var(--space-s);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  background: var(--color-frame-bg);
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-s);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.bp-toggle:hover {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
}

.bp-toggle.is-active {
  color: var(--color-frame-fg);
}

.bp-platform-toggle {
  display: flex;
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-s);
  overflow: hidden;
}

.bp-platform-toggle button {
  padding: var(--space-xxs) var(--space-s);
  border: none;
  background: var(--color-frame-bg);
  color: var(--color-frame-fg-muted);
  font-family: inherit;
  font-size: var(--font-size-s);
  cursor: pointer;
  transition: background var(--duration-instant) var(--ease-default),
    color var(--duration-instant) var(--ease-default);
}

.bp-platform-toggle button + button {
  border-inline-start: 1px solid var(--color-frame-border);
}

.bp-platform-toggle button:hover {
  background: var(--color-frame-hover);
}

.bp-platform-toggle button.is-active {
  background: var(--color-frame-hover);
  color: var(--color-frame-fg);
  font-weight: var(--font-weight-medium);
}

/* ══════════════════════════
   BLUEPRINT DIAGRAM
   ══════════════════════════ */

.bp {
  margin-block-end: var(--space-l);
  border-radius: var(--radius-l);
  overflow: hidden;
  transition: height 300ms var(--ease-default);
}

/* ── Chrome shell ── */

.bp-chrome {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-xs);
  background: var(--color-chrome-bg);
  height: 280px;
  /* No transition on padding — layout property; collapse snaps */
}

.bp--collapsed .bp-chrome {
  padding: 0;
}

/* ── Sidebar ── */

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

/* ── Frame ── */

.bp-frame {
  flex: 1;
  background: var(--color-frame-bg);
  border-radius: var(--radius-m);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: border-radius 300ms var(--ease-default);
}

.bp-frame--full {
  border-radius: 0;
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

/* ══════════════════════════
   WINDOWS TITLEBAR
   ══════════════════════════ */

.bp-titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 var(--space-xxs) 0 var(--space-s);
  background: var(--color-chrome-bg);
  border-block-end: 1px solid var(--color-chrome-border);
  flex-shrink: 0;
}

.bp-titlebar-start {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.bp-titlebar-icon {
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg);
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-chrome-hover);
  border-radius: var(--radius-s);
}

.bp-titlebar-label {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-chrome-fg);
}

.bp-titlebar-menus {
  font-size: var(--font-size-xs);
  color: var(--color-chrome-fg-muted);
  margin-inline-start: var(--space-xs);
}

.bp-titlebar-controls {
  display: flex;
  align-items: stretch;
  height: 100%;
}

.bp-win-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  font-size: 14px;
  color: var(--color-chrome-fg-muted);
  cursor: default;
  transition: background var(--duration-instant) var(--ease-default);
}

.bp-win-btn:hover {
  background: var(--color-chrome-hover);
}

.bp-win-close:hover {
  background: #c42b1c;
  color: white;
}
</style>

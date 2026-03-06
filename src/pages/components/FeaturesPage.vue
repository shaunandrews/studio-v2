<script setup lang="ts">
import SiteList from '@/components/features/SiteList.vue'
import SiteNavigation from '@/components/features/SiteNavigation.vue'
import SiteSettingsScreen from '@/components/features/SiteSettingsScreen.vue'
import ImportExportScreen from '@/components/features/ImportExportScreen.vue'
import PreviewsScreen from '@/components/features/PreviewsScreen.vue'
import Text from '@/components/primitives/Text.vue'
import '@/pages/dev-docs.css'
</script>

<template>
  <section id="site-list">
    <h2>SiteList</h2>
    <p class="section-desc">Sidebar site list for switching active site conversations.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>collapsed</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Condensed sidebar mode</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section example-section--dark" style="max-width: 240px; min-height: 200px; border-radius: var(--radius-m); overflow: hidden;">
      <SiteList />
    </div>
  </section>

  <section id="site-navigation">
    <h2>SiteNavigation</h2>
    <p class="section-desc">Site navigation pane with overview thumbnail, task list, archive management, and screen navigation.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>siteId</code></td><td><code>string</code></td><td>—</td><td>ID of the current site</td></tr>
          <tr><td><code>selectedId</code></td><td><code>string | null</code></td><td>—</td><td>ID of the selected conversation</td></tr>
          <tr><td><code>activeScreen</code></td><td><code>string</code></td><td><code>undefined</code></td><td>Current active screen name</td></tr>
          <tr><td><code>siteName</code></td><td><code>string</code></td><td><code>undefined</code></td><td>Site name</td></tr>
          <tr><td><code>siteFavicon</code></td><td><code>string</code></td><td><code>undefined</code></td><td>Site favicon URL</td></tr>
          <tr><td><code>isAllSites</code></td><td><code>boolean</code></td><td><code>undefined</code></td><td>Whether showing all sites view</td></tr>
          <tr><td><code>sidebarHidden</code></td><td><code>boolean</code></td><td><code>undefined</code></td><td>Whether sidebar is hidden</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>select</code></td><td>Conversation selected (conversationId: string)</td></tr>
          <tr><td><code>new-task</code></td><td>New task creation requested</td></tr>
          <tr><td><code>navigate</code></td><td>Navigate to another screen (screen: string)</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section" style="max-width: 320px; height: 400px; border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden;">
      <SiteNavigation site-id="1" :selected-id="null" />
    </div>
  </section>

  <section id="site-settings">
    <h2>SiteSettings</h2>
    <p class="section-desc">Settings panel for configuring site environment — PHP/WordPress versions, admin credentials, debugging, and Git repo connection.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>siteId</code></td><td><code>string</code></td><td>—</td><td>ID of the site to configure</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section" style="height: 500px; border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden;">
      <SiteSettingsScreen site-id="1" />
    </div>
  </section>

  <section id="import-export">
    <h2>Import / Export</h2>
    <p class="section-desc">Two-panel screen for importing site backups and exporting site or database archives.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>siteId</code></td><td><code>string</code></td><td>—</td><td>Site ID</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section" style="height: 400px; border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden;">
      <ImportExportScreen site-id="1" />
    </div>
  </section>

  <section id="previews">
    <h2>Previews</h2>
    <p class="section-desc">Screen for managing hosted preview instances — create, delete, extend, and share preview links.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>siteId</code></td><td><code>string</code></td><td>—</td><td>Site ID</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section" style="height: 400px; border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden;">
      <PreviewsScreen site-id="1" />
    </div>
  </section>

  <section id="sync">
    <h2>Sync</h2>
    <p class="section-desc">Deployment pipeline with Local → Staging → Production stages, push/pull sync, and progress tracking.</p>

    <div class="props-table">
      <h3>Sub-components</h3>
      <table>
        <thead><tr><th>Component</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>SyncPipeline</code></td><td>Full pipeline view with stage cards, connectors, and sync controls</td></tr>
          <tr><td><code>StageCard</code></td><td>Individual stage card with environment badge, URL, status, and actions</td></tr>
          <tr><td><code>PipelineConnector</code></td><td>Visual connector line with push button between stages</td></tr>
          <tr><td><code>SyncModal</code></td><td>Sync config modal with push/pull toggle, scope selection, and file picker</td></tr>
          <tr><td><code>ConnectSiteModal</code></td><td>Modal for connecting a WordPress.com/Pressable site to a pipeline stage</td></tr>
          <tr><td><code>SyncEmptyState</code></td><td>Empty state with setup call-to-action</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section">
      <div class="card p-s">
        <Text variant="body" color="secondary">The sync pipeline requires full app context and multiple connected components. See it live on a site page via the Sync screen.</Text>
      </div>
    </div>
  </section>

  <section id="add-site">
    <h2>Add Site</h2>
    <p class="section-desc">Multi-step site creation flow with blueprint selection, file import, remote site pulling, and site details form.</p>

    <div class="props-table">
      <h3>Sub-components</h3>
      <table>
        <thead><tr><th>Component</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>BlueprintPicker</code></td><td>Grid-based blueprint selector with search</td></tr>
          <tr><td><code>ImportDropZone</code></td><td>Drag-and-drop file uploader for backup archives</td></tr>
          <tr><td><code>PullSitePicker</code></td><td>Searchable list of remote WordPress.com/Pressable sites</td></tr>
          <tr><td><code>SiteDetailsForm</code></td><td>Form for site name and PHP/WordPress version selection</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section">
      <div class="card p-s">
        <Text variant="body" color="secondary">The add site flow is a full-page wizard. See it live at <code>/add-site</code>.</Text>
      </div>
    </div>
  </section>
</template>

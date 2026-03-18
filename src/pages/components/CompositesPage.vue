<script setup lang="ts">
import { ref } from 'vue'
import TaskBrief from '@/components/composites/task-brief/TaskBrief.vue'
import ChatMessage from '@/components/composites/ChatMessage.vue'
import ChatMessageList from '@/components/composites/ChatMessageList.vue'
import GlobalMenu from '@/components/composites/GlobalMenu.vue'
import InputChat from '@/components/composites/InputChat.vue'
import SettingsPage from '@/components/composites/SettingsPage.vue'
import PanelToolbar from '@/components/composites/PanelToolbar.vue'
import SiteItem from '@/components/composites/SiteItem.vue'
import ScreenLayout from '@/components/composites/ScreenLayout.vue'
import ShortcutsModal from '@/components/composites/ShortcutsModal.vue'
import SiteToolbar from '@/components/composites/SiteToolbar.vue'
import ContentSelector from '@/components/composites/ContentSelector.vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import { cog, chevronDown } from '@wordpress/icons'
import type { Site } from '@/data/types'
import '@/pages/dev-docs.css'

const sampleSites: Site[] = [
  { id: '1', name: 'Downstreet Cafe', status: 'running', url: 'downstreetcafe.local', createdAt: '2025-01-01', description: 'A cozy cafe site' },
  { id: '2', name: "Shaun's Blog", status: 'running', url: 'shaunsblog.local', createdAt: '2025-01-02' },
  { id: '3', name: 'UI Portfolio', status: 'stopped', url: 'portfolio.local', createdAt: '2025-01-03' },
]

const prefsOpen = ref(false)
const shortcutsOpen = ref(false)

</script>

<template>
  <!-- ChatMessage -->
  <section id="chat-message">
    <h2>ChatMessage</h2>
    <p class="section-desc">A single chat message with role-based styling, copy action, and agent feedback (thumbs up/down). Supports plain text and rich content blocks including cards and action buttons.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>role</code></td><td><code>'user' | 'agent'</code></td><td>—</td><td>Message sender</td></tr>
          <tr><td><code>content</code></td><td><code>string | ContentBlock[]</code></td><td>—</td><td>Message content — plain text string or array of content blocks (text, cards, actions)</td></tr>
          <tr><td><code>agentId</code></td><td><code>AgentId</code></td><td>—</td><td>Agent identifier for styling</td></tr>
          <tr><td><code>selected</code></td><td><code>boolean</code></td><td>—</td><td>Whether this message is selected (shows action bar)</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>select</code></td><td>Emitted when the message is clicked</td></tr>
          <tr><td><code>action</code></td><td>Emitted when a card or inline action button is clicked</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Agent message</h3>
    <div class="example-section" style="max-width: 640px;">
      <ChatMessage role="agent" agent-id="assistant" content="I'll update your hero section with a gradient background and increase the heading size." />
    </div>

    <h3>User message</h3>
    <div class="example-section" style="max-width: 640px;">
      <ChatMessage role="user" content="I want to change the hero section on my homepage." />
    </div>
  </section>

  <!-- ChatMessageList -->
  <section id="chat-message-list">
    <h2>ChatMessageList</h2>
    <p class="section-desc">Scrolling container for chat messages with auto-scroll to bottom on new messages.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>messages</code></td><td><code>Message[]</code></td><td>—</td><td>Array of messages to display</td></tr>
          <tr><td><code>siteId</code></td><td><code>string</code></td><td><code>undefined</code></td><td>Optional site ID passed to child messages</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section" style="max-width: 640px; height: 200px; border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden;">
      <ChatMessageList :messages="[
        { id: '1', conversationId: 'c1', role: 'user', content: 'Can you update the homepage hero?', timestamp: '' },
        { id: '2', conversationId: 'c1', role: 'agent', content: 'Sure! I will update the hero section with a new gradient background.', timestamp: '' },
      ]" />
    </div>
  </section>

  <!-- ContentSelector -->
  <section id="content-selector">
    <h2>ContentSelector</h2>
    <p class="section-desc">Inline panel for selecting site content to export or sync. Toggle files and database independently, with optional granular selection via scope dropdowns and tree/table pickers.</p>

    <div class="props-table">
      <h3>Exposed State</h3>
      <table>
        <thead><tr><th>Property</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>exportType</code></td><td><code>'full' | 'database' | 'files'</code></td><td>Derived from toggle states</td></tr>
          <tr><td><code>canExport</code></td><td><code>boolean</code></td><td>True when at least one toggle is on</td></tr>
          <tr><td><code>filesEnabled</code></td><td><code>boolean</code></td><td>Files toggle state</td></tr>
          <tr><td><code>databaseEnabled</code></td><td><code>boolean</code></td><td>Database toggle state</td></tr>
          <tr><td><code>reset()</code></td><td><code>function</code></td><td>Reset all selections to defaults</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section" style="max-width: 480px;">
      <ContentSelector />
    </div>
  </section>

  <!-- GlobalMenu -->
  <section id="global-menu">
    <h2>GlobalMenu</h2>
    <p class="section-desc">Teleported account menu showing user profile, usage meters, and navigation links. Positioned below a trigger element.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>open</code></td><td><code>boolean</code></td><td>—</td><td>Controls menu visibility</td></tr>
          <tr><td><code>anchor</code></td><td><code>HTMLElement | null</code></td><td>—</td><td>DOM element to position menu below</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>close</code></td><td>Menu close requested</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section">
      <div class="card p-s">
        <Text variant="body" color="secondary">GlobalMenu uses Teleport and requires a positioned anchor element. See it live in the app titlebar.</Text>
      </div>
    </div>
  </section>

  <!-- InputChat -->
  <section id="input-chat">
    <h2>InputChat</h2>
    <p class="section-desc">Chat input with auto-growing textarea, send button, and model picker dropdown.</p>

    <div class="props-table">
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Payload</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>send</code></td><td><code>(message: string, model: string)</code></td><td>Emitted on send (click or Enter)</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section" style="max-width: 500px;">
      <InputChat />
    </div>
  </section>

  <!-- PanelToolbar -->
  <section id="panel-toolbar">
    <h2>PanelToolbar</h2>
    <p class="section-desc">Horizontal toolbar with start/center/end slots, used at the top of panels. Has a bottom border separator.</p>

    <div class="props-table">
      <h3>Slots</h3>
      <table>
        <thead><tr><th>Slot</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>start</code></td><td>Left-aligned content (flex-1 when no center slot)</td></tr>
          <tr><td><code>center</code></td><td>Center content (takes flex-1)</td></tr>
          <tr><td><code>end</code></td><td>Right-aligned content</td></tr>
        </tbody>
      </table>
    </div>

    <h3>With start and end</h3>
    <div class="example-section" style="border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden;">
      <PanelToolbar>
        <template #start><Text variant="body-small" color="secondary">Left content</Text></template>
        <template #end><Button variant="tertiary" :icon="cog" size="small" /></template>
      </PanelToolbar>
    </div>

    <h3>With all three slots</h3>
    <div class="example-section" style="border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden;">
      <PanelToolbar>
        <template #start><Button variant="tertiary" :icon="chevronDown" size="small" /></template>
        <template #center><Text variant="body-small" color="muted">https://example.local</Text></template>
        <template #end><Button variant="tertiary" :icon="cog" size="small" /></template>
      </PanelToolbar>
    </div>
  </section>

  <!-- SettingsPage -->
  <section id="preferences-modal">
    <h2>SettingsPage</h2>
    <p class="section-desc">Multi-tab settings modal covering appearance, agents, skills, and account configuration.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>open</code></td><td><code>boolean</code></td><td>—</td><td>Controls modal visibility</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>close</code></td><td>Modal close requested</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section">
      <Button variant="secondary" label="Open Preferences" @click="prefsOpen = true" />
      <SettingsPage v-if="prefsOpen" :open="prefsOpen" @close="prefsOpen = false" />
    </div>
  </section>

  <!-- SiteItem -->
  <section id="site-item">
    <h2>SiteItem</h2>
    <p class="section-desc">A single site entry that renders in card or row mode. Used by SiteList for grid/list layouts.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>site</code></td><td><code>Site</code></td><td>—</td><td>Site data object</td></tr>
          <tr><td><code>mode</code></td><td><code>'card' | 'row'</code></td><td>—</td><td>Display mode</td></tr>
          <tr><td><code>active</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Whether this site is currently selected (row mode highlight)</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>select</code></td><td>Emitted when the item is clicked</td></tr>
          <tr><td><code>toggle-status</code></td><td>Emitted when the status indicator is toggled</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Card mode</h3>
    <div class="example-section example-section--dark">
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-m);">
        <SiteItem v-for="p in sampleSites" :key="p.id" :site="p" mode="card" />
      </div>
    </div>

    <h3>Row mode</h3>
    <div class="example-section example-section--dark" style="max-width: 240px;">
      <SiteItem :site="sampleSites[0]!" mode="row" />
      <SiteItem :site="sampleSites[1]!" mode="row" :active="true" />
      <SiteItem :site="sampleSites[2]!" mode="row" />
    </div>
  </section>

  <!-- ScreenLayout -->
  <section id="screen-layout">
    <h2>ScreenLayout</h2>
    <p class="section-desc">Full-screen layout with centered, scrollable body area.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>scrollable</code></td><td><code>boolean</code></td><td><code>undefined</code></td><td>Enable vertical scrolling in body</td></tr>
        </tbody>
      </table>
      <h3>Slots</h3>
      <table>
        <thead><tr><th>Slot</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>default</code></td><td>Body content</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section" style="height: 200px; border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden;">
      <ScreenLayout :scrollable="true">
        <div class="p-m">
          <Text color="secondary">Scrollable body content goes here.</Text>
        </div>
      </ScreenLayout>
    </div>
  </section>

  <!-- ShortcutsModal -->
  <section id="shortcuts-modal">
    <h2>ShortcutsModal</h2>
    <p class="section-desc">Read-only modal displaying keyboard shortcuts organized by category.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>open</code></td><td><code>boolean</code></td><td>—</td><td>Controls modal visibility</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>close</code></td><td>Modal close requested</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section">
      <Button variant="secondary" label="Open Shortcuts" @click="shortcutsOpen = true" />
      <ShortcutsModal v-if="shortcutsOpen" :open="shortcutsOpen" @close="shortcutsOpen = false" />
    </div>
  </section>

  <!-- SiteToolbar -->
  <section id="site-toolbar">
    <h2>SiteToolbar</h2>
    <p class="section-desc">Top toolbar showing site name, status indicator, WordPress/open buttons, and action menu with duplicate/delete options.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>title</code></td><td><code>string</code></td><td>—</td><td>Site name</td></tr>
          <tr><td><code>siteId</code></td><td><code>string</code></td><td><code>undefined</code></td><td>Site ID</td></tr>
          <tr><td><code>favicon</code></td><td><code>string</code></td><td><code>undefined</code></td><td>Site favicon URL</td></tr>
          <tr><td><code>status</code></td><td><code>'running' | 'stopped' | 'loading'</code></td><td><code>undefined</code></td><td>Site run status</td></tr>
          <tr><td><code>loadingTarget</code></td><td><code>'running' | 'stopped'</code></td><td><code>undefined</code></td><td>Target state when loading</td></tr>
          <tr><td><code>sidebarHidden</code></td><td><code>boolean</code></td><td><code>undefined</code></td><td>Shows site picker pill when sidebar is hidden</td></tr>
          <tr><td><code>isAllSites</code></td><td><code>boolean</code></td><td><code>undefined</code></td><td>Shows category icon instead of favicon</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>toggle-status</code></td><td>Start/stop button clicked</td></tr>
          <tr><td><code>switch-site</code></td><td>Site selected from picker (id: string)</td></tr>
          <tr><td><code>duplicate</code></td><td>Duplicate site requested</td></tr>
          <tr><td><code>delete</code></td><td>Delete site requested</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Running site</h3>
    <div class="example-section" style="border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden;">
      <SiteToolbar title="Downstreet Cafe" status="running" />
    </div>

    <h3>Stopped site</h3>
    <div class="example-section" style="border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden;">
      <SiteToolbar title="UI Portfolio" status="stopped" />
    </div>
  </section>

  <!-- TaskBrief -->
  <section id="task-brief">
    <h2>TaskBrief</h2>
    <p class="section-desc">Skeuomorphic paper card summarising the active task. Shows status, branch, title, AI summary, and changed files/entities. Collapses to a compact title row and expands to full detail with Preview/Review actions. Lives above the chat in SitePage.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>conversationId</code></td><td><code>string</code></td><td>—</td><td>Looks up the conversation from the store — drives all derived state</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Payload</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>preview</code></td><td><code>conversationId: string</code></td><td>Preview button clicked</td></tr>
          <tr><td><code>review</code></td><td><code>conversationId: string</code></td><td>Review button clicked</td></tr>
        </tbody>
      </table>
      <h3>Sub-components</h3>
      <table>
        <thead><tr><th>Component</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>TaskBriefHeader</code></td><td>Status band — tinted by status, animated pulse dot for running, monospace branch name</td></tr>
          <tr><td><code>TaskBriefStats</code></td><td>Changed files and entities — compact single-line or expanded two-column grid with expandable sub-lists</td></tr>
          <tr><td><code>TaskBriefActions</code></td><td>Preview + Review buttons — compact (icon-only) or expanded (labelled); Review is primary when status is <code>review</code></td></tr>
        </tbody>
      </table>
    </div>

    <h3>Running</h3>
    <div class="example-section" style="max-width: 400px;">
      <TaskBrief conversation-id="cafe-hero-tweak" />
    </div>

    <h3>In Review</h3>
    <div class="example-section" style="max-width: 400px;">
      <TaskBrief conversation-id="blog-assistant-1" />
    </div>

    <h3>Approved</h3>
    <div class="example-section" style="max-width: 400px;">
      <TaskBrief conversation-id="cafe-photos" />
    </div>

    <h3>Merged</h3>
    <div class="example-section" style="max-width: 400px;">
      <TaskBrief conversation-id="blog-code-1" />
    </div>
  </section>


</template>

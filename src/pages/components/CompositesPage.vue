<script setup lang="ts">
import { ref } from 'vue'
import ChatMessage from '@/components/composites/ChatMessage.vue'
import InputChat from '@/components/composites/InputChat.vue'
import Panel from '@shared/composites/Panel.vue'
import PanelToolbar from '@/components/composites/PanelToolbar.vue'
import ProjectItem from '@/components/composites/ProjectItem.vue'
import TabBar from '@/components/composites/TabBar.vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@shared/primitives/Text.vue'
import { cog, chevronDown } from '@wordpress/icons'
import type { Project } from '@/data/types'
import '@/pages/components/components-docs.css'

const sampleProjects: Project[] = [
  { id: '1', name: 'Downstreet Cafe', favicon: 'https://api.dicebear.com/9.x/shapes/svg?seed=cafe', status: 'running', url: 'downstreetcafe.local', createdAt: '2025-01-01', description: 'A cozy cafe site' },
  { id: '2', name: "Shaun's Blog", favicon: 'https://api.dicebear.com/9.x/shapes/svg?seed=blog', status: 'running', url: 'shaunsblog.local', createdAt: '2025-01-02' },
  { id: '3', name: 'UI Portfolio', favicon: 'https://api.dicebear.com/9.x/shapes/svg?seed=portfolio', status: 'stopped', url: 'portfolio.local', createdAt: '2025-01-03' },
]

const activeTabId = ref('tab-1')
const tabBarTabs = [
  { id: 'tab-1', label: 'Site Assistant' },
  { id: 'tab-2', label: 'Code Agent' },
  { id: 'tab-3', label: 'Design Agent' },
]
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

  <!-- Panel -->
  <section id="panel">
    <h2>Panel</h2>
    <p class="section-desc">Generic content panel with a left border separator. Used as the main layout container within the app body — panels sit side by side (e.g. AgentPanel + SitePreview).</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>title</code></td><td><code>string</code></td><td>—</td><td>Optional panel title (unused currently, reserved)</td></tr>
        </tbody>
      </table>
      <h3>Slots</h3>
      <table>
        <thead><tr><th>Slot</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>default</code></td><td>Panel content</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section hstack" style="height: 120px; border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden;">
      <Panel><div class="p-s"><Text color="secondary">Panel A</Text></div></Panel>
      <Panel><div class="p-s"><Text color="secondary">Panel B</Text></div></Panel>
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
        <template #start><Text variant="caption" color="secondary">Left content</Text></template>
        <template #end><Button variant="tertiary" :icon="cog" size="small" /></template>
      </PanelToolbar>
    </div>

    <h3>With all three slots</h3>
    <div class="example-section" style="border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden;">
      <PanelToolbar>
        <template #start><Button variant="tertiary" :icon="chevronDown" size="small" /></template>
        <template #center><Text variant="caption" color="muted">https://example.local</Text></template>
        <template #end><Button variant="tertiary" :icon="cog" size="small" /></template>
      </PanelToolbar>
    </div>
  </section>

  <!-- ProjectItem -->
  <section id="project-item">
    <h2>ProjectItem</h2>
    <p class="section-desc">A single project entry that renders in card or row mode. Used by ProjectList for grid/list layouts.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>project</code></td><td><code>Project</code></td><td>—</td><td>Project data object</td></tr>
          <tr><td><code>mode</code></td><td><code>'card' | 'row'</code></td><td>—</td><td>Display mode</td></tr>
          <tr><td><code>active</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Whether this project is currently selected (row mode highlight)</td></tr>
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
        <ProjectItem v-for="p in sampleProjects" :key="p.id" :project="p" mode="card" />
      </div>
    </div>

    <h3>Row mode</h3>
    <div class="example-section example-section--dark" style="max-width: 240px;">
      <ProjectItem :project="sampleProjects[0]!" mode="row" />
      <ProjectItem :project="sampleProjects[1]!" mode="row" :active="true" />
      <ProjectItem :project="sampleProjects[2]!" mode="row" />
    </div>
  </section>

  <!-- TabBar -->
  <section id="tab-bar">
    <h2>TabBar</h2>
    <p class="section-desc">Horizontal tab strip with scrollable overflow, fade edges, close buttons on the active tab, and an add button. Used for switching between agent conversations.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>tabs</code></td><td><code>Tab[]</code></td><td>—</td><td>Array of <code>{ id: string, label: string }</code></td></tr>
          <tr><td><code>activeId</code></td><td><code>string</code></td><td>—</td><td>Currently active tab id</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>update:activeId</code></td><td>Emitted when a tab is clicked</td></tr>
          <tr><td><code>close</code></td><td>Emitted when a tab's close button is clicked</td></tr>
          <tr><td><code>add</code></td><td>Emitted when the add button is clicked</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section" style="border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden; padding: var(--space-xxs);">
      <TabBar :tabs="tabBarTabs" :active-id="activeTabId" @update:active-id="activeTabId = $event" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChatCard from '@/components/composites/chat-cards/ChatCard.vue'
import PluginCard from '@/components/composites/chat-cards/PluginCard.vue'
import SettingsCard from '@/components/composites/chat-cards/SettingsCard.vue'
import ProgressCard from '@/components/composites/chat-cards/ProgressCard.vue'
import PageCard from '@/components/composites/chat-cards/PageCard.vue'
import PostDraftCard from '@/components/composites/chat-cards/PostDraftCard.vue'
import MarkdownText from '@/components/composites/renderers/MarkdownText.vue'
import Text from '@/components/primitives/Text.vue'
import type { PluginCardData, SettingsCardData, ProgressCardData, PageCardData, PostDraftCardData, CardUiState } from '@/data/types'
import '@/pages/dev-docs.css'

const pluginAvailable: PluginCardData = {
  name: 'WooCommerce',
  slug: 'woocommerce/woocommerce.php',
  description: 'An open-source eCommerce plugin for WordPress. Build any commerce solution you can imagine.',
  rating: 4.5,
  activeInstalls: '5M+',
  status: 'available',
  action: { id: 'install-woo', label: 'Install', action: { type: 'send-message', message: 'Install WooCommerce' } },
}

const pluginActive: PluginCardData = {
  name: 'Jetpack',
  slug: 'jetpack/jetpack.php',
  description: 'Security, performance, marketing, and design tools — Jetpack is made by the WordPress experts.',
  rating: 3.9,
  activeInstalls: '5M+',
  status: 'active',
}

const pluginInstalled: PluginCardData = {
  name: 'Akismet Anti-spam',
  slug: 'akismet/akismet.php',
  description: 'Used by millions, Akismet is quite possibly the best way in the world to protect your blog from spam.',
  rating: 4.7,
  activeInstalls: '5M+',
  status: 'installed',
}

const settingsData: SettingsCardData = {
  label: 'PHP Configuration',
  settings: [
    { key: 'memory_limit', current: '128M', proposed: '256M' },
    { key: 'max_execution_time', current: '30', proposed: '120' },
    { key: 'upload_max_filesize', current: '2M', proposed: '64M' },
  ],
  actions: [
    { id: 'apply-settings', label: 'Apply changes', variant: 'primary', action: { type: 'send-message', message: 'Apply PHP settings' } },
    { id: 'cancel-settings', label: 'Cancel', variant: 'secondary', action: { type: 'send-message', message: 'Cancel settings change' } },
  ],
}

const progressData: ProgressCardData = {
  label: 'Site Migration',
  steps: [
    { name: 'Export database', status: 'done' },
    { name: 'Transfer media files', status: 'done' },
    { name: 'Update site URLs', status: 'running' },
    { name: 'Verify permalinks', status: 'pending' },
    { name: 'Clear cache', status: 'pending' },
  ],
}

const pageData: PageCardData = {
  title: 'About Us',
  slug: 'about',
  template: 'Full Width',
  status: 'draft',
  excerpt: 'Learn about our story, our team, and our passion for great coffee and community.',
  actions: [
    { id: 'view-page', label: 'View', variant: 'secondary', action: { type: 'send-message', message: 'View About page' } },
    { id: 'edit-page', label: 'Edit', variant: 'secondary', action: { type: 'send-message', message: 'Edit About page' } },
    { id: 'delete-page', label: 'Delete', variant: 'destructive', action: { type: 'send-message', message: 'Delete About page' } },
  ],
}

const pagePublished: PageCardData = {
  title: 'Contact',
  slug: 'contact',
  template: 'Default',
  status: 'published',
}

const postDraftData: PostDraftCardData = {
  title: 'Welcome to Downstreet Cafe — We\'re Open!',
  excerpt: 'After months of preparation, Downstreet Cafe is officially open for business. Stop by for handcrafted espresso drinks and fresh pastries.',
  categories: ['Announcements', 'News'],
  tags: ['grand opening', 'coffee', 'downtown'],
  status: 'draft',
  actions: [
    { id: 'edit-post', label: 'Edit', variant: 'secondary', action: { type: 'send-message', message: 'Edit post' } },
    { id: 'publish-post', label: 'Publish', variant: 'primary', action: { type: 'send-message', message: 'Publish post' } },
  ],
}

const postPublishedData: PostDraftCardData = {
  title: 'Our Favorite Summer Drinks',
  excerpt: 'Beat the heat with our refreshing lineup of iced lattes, cold brews, and fruit smoothies.',
  categories: ['Menu'],
  tags: ['summer', 'drinks'],
  status: 'published',
}

const cardStates: CardUiState[] = ['default', 'loading', 'complete', 'error', 'disabled']
</script>

<template>
  <!-- ChatCard -->
  <section id="chat-card">
    <h2>ChatCard</h2>
    <p class="section-desc">Wrapper component providing consistent card chrome for all chat card types. Manages visual state (border color, opacity) and compact mode padding.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>compact</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Reduces padding for inline use</td></tr>
          <tr><td><code>state</code></td><td><code>CardUiState</code></td><td><code>'default'</code></td><td>Visual state: <code>'default' | 'loading' | 'complete' | 'error' | 'disabled'</code></td></tr>
        </tbody>
      </table>
      <h3>Slots</h3>
      <table>
        <thead><tr><th>Slot</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>default</code></td><td>Card content</td></tr>
        </tbody>
      </table>
    </div>

    <h3>All states</h3>
    <div class="example-section">
      <div class="vstack gap-s">
        <div v-for="s in cardStates" :key="s">
          <Text variant="body-small" color="muted" style="margin-bottom: 4px; display: block;">{{ s }}</Text>
          <ChatCard :state="s">
            <Text color="secondary">Card content in <strong>{{ s }}</strong> state</Text>
          </ChatCard>
        </div>
      </div>
    </div>

    <h3>Compact</h3>
    <div class="example-section">
      <ChatCard :compact="true">
        <Text color="secondary">Compact card with reduced padding</Text>
      </ChatCard>
    </div>
  </section>

  <!-- PluginCard -->
  <section id="plugin-card">
    <h2>PluginCard</h2>
    <p class="section-desc">Displays a WordPress plugin with name, slug, description, status badge, ratings, install count, and an optional action button.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>data</code></td><td><code>PluginCardData</code></td><td>—</td><td>Plugin info: <code>name</code>, <code>slug</code>, <code>description</code>, <code>status</code>, <code>rating?</code>, <code>activeInstalls?</code>, <code>action?</code></td></tr>
          <tr><td><code>state</code></td><td><code>CardUiState</code></td><td><code>'default'</code></td><td>Visual state</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>action</code></td><td>Emitted when the action button is clicked, with the <code>ActionButton</code> payload</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Available plugin (with action)</h3>
    <div class="example-section">
      <PluginCard :data="pluginAvailable" />
    </div>

    <h3>Active plugin</h3>
    <div class="example-section">
      <PluginCard :data="pluginActive" />
    </div>

    <h3>Installed plugin</h3>
    <div class="example-section">
      <PluginCard :data="pluginInstalled" />
    </div>
  </section>

  <!-- SettingsCard -->
  <section id="settings-card">
    <h2>SettingsCard</h2>
    <p class="section-desc">Displays a comparison of current → proposed settings values, with optional action buttons to apply or cancel changes.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>data</code></td><td><code>SettingsCardData</code></td><td>—</td><td>Settings info: <code>label</code>, <code>settings[]</code> (key, current, proposed), <code>actions?</code></td></tr>
          <tr><td><code>compact</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Compact mode</td></tr>
          <tr><td><code>state</code></td><td><code>CardUiState</code></td><td><code>'default'</code></td><td>Visual state</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>action</code></td><td>Emitted when an action button is clicked</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Settings with actions</h3>
    <div class="example-section">
      <SettingsCard :data="settingsData" />
    </div>
  </section>

  <!-- ProgressCard -->
  <section id="progress-card">
    <h2>ProgressCard</h2>
    <p class="section-desc">Displays a multi-step progress list with status indicators for each step: done, running, pending, or error.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>data</code></td><td><code>ProgressCardData</code></td><td>—</td><td>Progress info: <code>label</code>, <code>steps[]</code> (name, status: 'pending' | 'running' | 'done' | 'error')</td></tr>
          <tr><td><code>compact</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Compact mode</td></tr>
          <tr><td><code>state</code></td><td><code>CardUiState</code></td><td><code>'default'</code></td><td>Visual state</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Migration progress</h3>
    <div class="example-section">
      <ProgressCard :data="progressData" />
    </div>

    <h3>Loading state</h3>
    <div class="example-section">
      <ProgressCard :data="progressData" state="loading" />
    </div>
  </section>

  <!-- PageCard -->
  <section id="page-card">
    <h2>PageCard</h2>
    <p class="section-desc">Displays a WordPress page with title, slug, template, status badge, optional excerpt, and action buttons for view/edit/delete.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>data</code></td><td><code>PageCardData</code></td><td>—</td><td>Page info: <code>title</code>, <code>slug</code>, <code>template?</code>, <code>status</code>, <code>excerpt?</code>, <code>actions?</code></td></tr>
          <tr><td><code>state</code></td><td><code>CardUiState</code></td><td><code>'default'</code></td><td>Visual state</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>action</code></td><td>Emitted when an action button is clicked</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Draft page with actions</h3>
    <div class="example-section">
      <PageCard :data="pageData" />
    </div>

    <h3>Published page</h3>
    <div class="example-section">
      <PageCard :data="pagePublished" />
    </div>
  </section>

  <!-- PostDraftCard -->
  <section id="post-draft-card">
    <h2>PostDraftCard</h2>
    <p class="section-desc">Displays a blog post draft with title, excerpt preview, category/tag pills, status badge, and action buttons for editing and publishing.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>data</code></td><td><code>PostDraftCardData</code></td><td>—</td><td>Post info: <code>title</code>, <code>excerpt</code>, <code>categories?</code>, <code>tags?</code>, <code>status</code>, <code>actions?</code></td></tr>
          <tr><td><code>compact</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Title + status only</td></tr>
          <tr><td><code>state</code></td><td><code>CardUiState</code></td><td><code>'default'</code></td><td>Visual state</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>action</code></td><td>Emitted when an action button is clicked</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Draft post with actions</h3>
    <div class="example-section">
      <PostDraftCard :data="postDraftData" />
    </div>

    <h3>Published post</h3>
    <div class="example-section">
      <PostDraftCard :data="postPublishedData" state="complete" />
    </div>

    <h3>Compact mode</h3>
    <div class="example-section">
      <PostDraftCard :data="postDraftData" :compact="true" />
    </div>
  </section>

  <!-- MarkdownText -->
  <section id="markdown-text">
    <h2>MarkdownText</h2>
    <p class="section-desc">Lightweight Markdown renderer that converts text with bold, italic, inline code, links, lists, and fenced code blocks into HTML. Used inside ChatMessage for agent responses.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>text</code></td><td><code>string</code></td><td>—</td><td>Markdown source text</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Inline formatting</h3>
    <div class="example-section">
      <MarkdownText text="This has **bold text**, *italic text*, and `inline code` in a paragraph." />
    </div>

    <h3>Links</h3>
    <div class="example-section">
      <MarkdownText text="Check out the [WordPress Developer Resources](https://developer.wordpress.org) for more info." />
    </div>

    <h3>Unordered list</h3>
    <div class="example-section">
      <MarkdownText text="Here are the changes I made:

- Updated the hero section background
- Increased heading font size to 48px
- Added a call-to-action button
- Adjusted mobile responsive breakpoints" />
    </div>

    <h3>Ordered list</h3>
    <div class="example-section">
      <MarkdownText text="To set up your development environment:

1. Install Node.js 18 or later
2. Clone the repository
3. Run `npm install` to install dependencies
4. Start the dev server with `npm run dev`" />
    </div>

    <h3>Fenced code block</h3>
    <div class="example-section">
      <MarkdownText :text="`Here's the updated CSS:\n\n\`\`\`css\n.hero-section {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n  padding: 4rem 2rem;\n  text-align: center;\n}\n\`\`\`\n\nThis adds a purple gradient background to the hero.`" />
    </div>
  </section>
</template>

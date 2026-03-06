<script setup lang="ts">
import AgentPanel from '@/components/features/AgentPanel.vue'
import ProjectList from '@/components/features/ProjectList.vue'
import '@/pages/components/components-docs.css'
</script>

<template>
  <section id="agent-panel">
    <h2>AgentPanel</h2>
    <p class="section-desc">Chat-focused panel with tabbed conversations, message list, and input actions.</p>

    <h3>Preview</h3>
    <div class="example-section" style="height: 400px; border: 1px solid var(--color-frame-border); border-radius: var(--radius-m); overflow: hidden;">
      <AgentPanel />
    </div>
  </section>

  <section id="project-list">
    <h2>ProjectList</h2>
    <p class="section-desc">Sidebar project list for switching active project conversations.</p>

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
      <ProjectList />
    </div>
  </section>
</template>

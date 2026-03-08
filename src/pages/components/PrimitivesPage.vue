<script setup lang="ts">
import { ref } from 'vue'
import * as wpIcons from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'
import Button from '@/components/primitives/Button.vue'
import ButtonSplit from '@/components/primitives/ButtonSplit.vue'
import StatusIndicator from '@/components/primitives/StatusIndicator.vue'
import Text from '@/components/primitives/Text.vue'
import Dropdown from '@/components/primitives/Dropdown.vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import Modal from '@/components/primitives/Modal.vue'
import Badge from '@/components/primitives/Badge.vue'
import Tooltip from '@/components/primitives/Tooltip.vue'
import ContextRing from '@/components/primitives/ContextRing.vue'
import Toggle from '@/components/primitives/Toggle.vue'
import { cog, plus, upload, external, trash, pencil, chevronDown } from '@wordpress/icons'
import '@/pages/dev-docs.css'

const modalOpen = ref(false)
const toggleA = ref(false)
const toggleB = ref(true)
const toggleC = ref(true)

const icons = Object.entries(wpIcons)
  .filter(([key, val]) => key !== 'Icon' && typeof val === 'object' && val !== null && (val as any)?.props)
  .map(([name, icon]) => ({ name, icon }))
  .sort((a, b) => a.name.localeCompare(b.name))
</script>

<template>
  <!-- Badge -->
  <section id="badge">
    <h2>Badge</h2>
    <p class="section-desc">Small status label with four color variants for inline status indicators.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>label</code></td><td><code>string</code></td><td>—</td><td>Badge text</td></tr>
          <tr><td><code>variant</code></td><td><code>'default' | 'success' | 'warning' | 'error'</code></td><td><code>'default'</code></td><td>Color variant</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Variants</h3>
    <div class="example-section">
      <div class="hstack gap-xs">
        <Badge label="Default" variant="default" />
        <Badge label="Active" variant="success" />
        <Badge label="Installing" variant="warning" />
        <Badge label="Error" variant="error" />
      </div>
    </div>
  </section>

  <!-- Button -->
  <section id="button">
    <h2>Button</h2>
    <p class="section-desc">Flexible button with three variants, two sizes, two surfaces, and optional icon/label.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>variant</code></td><td><code>'primary' | 'secondary' | 'tertiary'</code></td><td><code>'secondary'</code></td><td>Visual style</td></tr>
          <tr><td><code>surface</code></td><td><code>'light' | 'dark'</code></td><td><code>'light'</code></td><td>Background context the button sits on</td></tr>
          <tr><td><code>size</code></td><td><code>'default' | 'small'</code></td><td><code>'default'</code></td><td>36px or 28px height</td></tr>
          <tr><td><code>icon</code></td><td><code>WPIcon</code></td><td>—</td><td>WordPress icon object. Icon-only when no label.</td></tr>
          <tr><td><code>label</code></td><td><code>string</code></td><td>—</td><td>Button text. Omit for icon-only.</td></tr>
          <tr><td><code>width</code></td><td><code>'hug' | 'full'</code></td><td><code>'hug'</code></td><td>Hug content or fill container width</td></tr>
        </tbody>
      </table>
    </div>

    <div class="example-section">
      <h3>Width</h3>
      <h4>Hug (default)</h4>
      <div class="example-row hstack flex-wrap gap-xxs">
        <Button variant="primary" label="Hug content" />
        <Button variant="secondary" label="Hug content" />
      </div>
      <h4>Full</h4>
      <div class="example-row hstack flex-wrap gap-xxs" style="max-width: 300px;">
        <Button variant="primary" label="Full width" width="full" />
        <Button variant="secondary" label="Full width" width="full" />
      </div>
    </div>

    <div class="example-section">
      <h3>On light surface</h3>
      <h4>Primary</h4>
      <div class="example-row hstack flex-wrap gap-xxs">
        <Button variant="primary" label="Publish site" />
        <Button variant="primary" label="Publish" :icon="upload" />
        <Button variant="primary" :icon="plus" />
        <Button variant="primary" label="Small" size="small" />
        <Button variant="primary" label="Small" size="small" :icon="plus" />
        <Button variant="primary" :icon="plus" size="small" />
      </div>
      <h4>Secondary</h4>
      <div class="example-row hstack flex-wrap gap-xxs">
        <Button variant="secondary" label="Open site" />
        <Button variant="secondary" label="Open site" :icon="external" />
        <Button variant="secondary" :icon="cog" />
        <Button variant="secondary" label="Small" size="small" />
        <Button variant="secondary" label="Small" size="small" :icon="pencil" />
        <Button variant="secondary" :icon="cog" size="small" />
      </div>
      <h4>Tertiary</h4>
      <div class="example-row hstack flex-wrap gap-xxs">
        <Button variant="tertiary" label="Cancel" />
        <Button variant="tertiary" label="Delete" :icon="trash" />
        <Button variant="tertiary" :icon="chevronDown" />
        <Button variant="tertiary" label="Small" size="small" />
        <Button variant="tertiary" label="Small" size="small" :icon="trash" />
        <Button variant="tertiary" :icon="chevronDown" size="small" />
      </div>
    </div>

    <div class="example-section example-section--dark">
      <h3>On dark surface</h3>
      <h4>Primary</h4>
      <div class="example-row hstack flex-wrap gap-xxs">
        <Button variant="primary" surface="dark" label="Publish site" />
        <Button variant="primary" surface="dark" label="Publish" :icon="upload" />
        <Button variant="primary" surface="dark" :icon="plus" />
        <Button variant="primary" surface="dark" label="Small" size="small" />
        <Button variant="primary" surface="dark" label="Small" size="small" :icon="plus" />
        <Button variant="primary" surface="dark" :icon="plus" size="small" />
      </div>
      <h4>Secondary</h4>
      <div class="example-row hstack flex-wrap gap-xxs">
        <Button variant="secondary" surface="dark" label="Add site" />
        <Button variant="secondary" surface="dark" label="Add site" :icon="plus" />
        <Button variant="secondary" surface="dark" :icon="cog" />
        <Button variant="secondary" surface="dark" label="Small" size="small" />
        <Button variant="secondary" surface="dark" label="Small" size="small" :icon="pencil" />
        <Button variant="secondary" surface="dark" :icon="cog" size="small" />
      </div>
      <h4>Tertiary</h4>
      <div class="example-row hstack flex-wrap gap-xxs">
        <Button variant="tertiary" surface="dark" label="Stop all" />
        <Button variant="tertiary" surface="dark" label="Settings" :icon="cog" />
        <Button variant="tertiary" surface="dark" :icon="chevronDown" />
        <Button variant="tertiary" surface="dark" label="Small" size="small" />
        <Button variant="tertiary" surface="dark" label="Small" size="small" :icon="trash" />
        <Button variant="tertiary" surface="dark" :icon="chevronDown" size="small" />
      </div>
    </div>
  </section>

  <!-- ButtonSplit -->
  <section id="button-split">
    <h2>ButtonSplit</h2>
    <p class="section-desc">Split button with primary action and secondary dropdown trigger.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>label</code></td><td><code>string</code></td><td>—</td><td>Button text label</td></tr>
          <tr><td><code>icon</code></td><td><code>any</code></td><td><code>undefined</code></td><td>WordPress icon component</td></tr>
          <tr><td><code>iconUrl</code></td><td><code>string</code></td><td><code>undefined</code></td><td>Image URL for custom icon (takes precedence over icon)</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>click</code></td><td>Primary button clicked</td></tr>
          <tr><td><code>secondary-click</code></td><td>Dropdown arrow button clicked</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section">
      <div class="hstack gap-s">
        <ButtonSplit label="Create site" />
        <ButtonSplit label="Add" :icon="plus" />
      </div>
    </div>
  </section>

  <!-- ContextRing -->
  <section id="context-ring">
    <h2>ContextRing</h2>
    <p class="section-desc">SVG ring indicator showing context window usage as a percentage arc. Click to reveal a popover with model, token, cost, and message stats. Turns red at 80% and pulses at 95%.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>percent</code></td><td><code>number</code></td><td>&mdash;</td><td>Context window usage (0-100)</td></tr>
          <tr><td><code>model</code></td><td><code>string</code></td><td><code>''</code></td><td>Model name shown in popover</td></tr>
          <tr><td><code>tokens</code></td><td><code>string</code></td><td><code>''</code></td><td>Token usage string (e.g. "42,000 / 100,000")</td></tr>
          <tr><td><code>cost</code></td><td><code>string</code></td><td><code>''</code></td><td>Estimated cost string</td></tr>
          <tr><td><code>messages</code></td><td><code>number</code></td><td><code>0</code></td><td>Message count</td></tr>
          <tr><td><code>surface</code></td><td><code>'light' | 'dark'</code></td><td><code>'light'</code></td><td>Background surface for theming</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Normal (~30%)</h3>
    <div class="example-section">
      <div class="hstack gap-m align-center">
        <ContextRing
          :percent="30"
          model="Claude Sonnet 4.5"
          tokens="30,000 / 100,000"
          cost="$0.08"
          :messages="12"
        />
        <Text variant="caption" color="muted">Neutral ring color, click for details</Text>
      </div>
    </div>

    <h3>Warning (~80%)</h3>
    <div class="example-section">
      <div class="hstack gap-m align-center">
        <ContextRing
          :percent="80"
          model="Claude Opus 4.6"
          tokens="80,000 / 100,000"
          cost="$0.52"
          :messages="47"
        />
        <Text variant="caption" color="muted">Red ring at 80% capacity</Text>
      </div>
    </div>

    <h3>Critical (~95%)</h3>
    <div class="example-section">
      <div class="hstack gap-m align-center">
        <ContextRing
          :percent="95"
          model="Claude Opus 4.6"
          tokens="95,000 / 100,000"
          cost="$0.68"
          :messages="63"
        />
        <Text variant="caption" color="muted">Red pulsing ring at 95% capacity</Text>
      </div>
    </div>

    <h3>On dark surface</h3>
    <div class="example-section example-section--dark">
      <div class="hstack gap-l align-center" style="padding: var(--space-xs) 0;">
        <ContextRing :percent="30" model="Sonnet 4.5" tokens="30k / 100k" cost="$0.08" :messages="12" surface="dark" />
        <ContextRing :percent="80" model="Opus 4.6" tokens="80k / 100k" cost="$0.52" :messages="47" surface="dark" />
        <ContextRing :percent="95" model="Opus 4.6" tokens="95k / 100k" cost="$0.68" :messages="63" surface="dark" />
      </div>
    </div>
  </section>

  <!-- Dropdown -->
  <section id="dropdown">
    <h2>Dropdown</h2>
    <p class="section-desc">Single-value selector built on FlyoutMenu. Adds <code>v-model</code> binding for form-style option picking. Use FlyoutMenu directly for action menus.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>modelValue</code></td><td><code>string</code></td><td>—</td><td>Currently selected value (v-model)</td></tr>
          <tr><td><code>groups</code></td><td><code>{ label, options[] }[]</code></td><td>—</td><td>Grouped options</td></tr>
          <tr><td><code>placement</code></td><td><code>'above' | 'below'</code></td><td><code>'above'</code></td><td>Menu direction</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section">
      <Dropdown
        model-value="Sonnet 4.5"
        :groups="[{ label: 'Anthropic', options: ['Opus 4.6', 'Sonnet 4.5', 'Haiku 4.5'] }, { label: 'OpenAI', options: ['GPT-4.5', 'GPT-4'] }]"
        placement="below"
      />
    </div>
  </section>

  <!-- FlyoutMenu -->
  <section id="flyout-menu">
    <h2>FlyoutMenu</h2>
    <p class="section-desc">Hierarchical dropdown menu with nested submenus, icons, checkmarks, and smart positioning.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>groups</code></td><td><code>FlyoutMenuGroup[]</code></td><td>—</td><td>Array of menu groups with items</td></tr>
          <tr><td><code>surface</code></td><td><code>'light' | 'dark'</code></td><td><code>'light'</code></td><td>Color scheme</td></tr>
          <tr><td><code>align</code></td><td><code>'start' | 'center' | 'end'</code></td><td><code>'center'</code></td><td>Horizontal alignment relative to trigger</td></tr>
          <tr><td><code>placement</code></td><td><code>'above' | 'below'</code></td><td><code>'below'</code></td><td>Preferred vertical placement (auto-flips)</td></tr>
          <tr><td><code>maxWidth</code></td><td><code>string</code></td><td><code>undefined</code></td><td>Max width constraint</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>close</code></td><td>Menu closed</td></tr>
        </tbody>
      </table>
      <h3>Slots</h3>
      <table>
        <thead><tr><th>Slot</th><th>Scoped Props</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>trigger</code></td><td><code>{ toggle, open }</code></td><td>Element that toggles the menu</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section">
      <FlyoutMenu
        align="start"
        :groups="[
          { items: [
            { label: 'Edit', icon: pencil, action: () => {} },
            { label: 'Settings', icon: cog, action: () => {} },
          ]},
          { items: [
            { label: 'Delete', icon: trash, destructive: true, action: () => {} },
          ]},
        ]"
      >
        <template #trigger="{ toggle }">
          <Button variant="secondary" label="Actions" @click="toggle" />
        </template>
      </FlyoutMenu>
    </div>
  </section>

  <!-- Modal -->
  <section id="modal">
    <h2>Modal</h2>
    <p class="section-desc">Centered dialog overlay with backdrop dismiss and Escape key support.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>open</code></td><td><code>boolean</code></td><td>—</td><td>Controls modal visibility</td></tr>
          <tr><td><code>width</code></td><td><code>string</code></td><td><code>'480px'</code></td><td>Modal panel width</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>close</code></td><td>Backdrop clicked or Escape pressed</td></tr>
        </tbody>
      </table>
      <h3>Slots</h3>
      <table>
        <thead><tr><th>Slot</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>default</code></td><td>Modal content</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Preview</h3>
    <div class="example-section">
      <Button variant="secondary" label="Open modal" @click="modalOpen = true" />
      <Modal :open="modalOpen" title="Modal title" @close="modalOpen = false">
        <Text variant="body" color="secondary">This is a modal dialog. Click the backdrop or press Escape to close.</Text>
        <template #footer>
          <Text variant="caption" color="muted" class="flex-1">Short helpful text.</Text>
          <Button variant="secondary" label="Cancel" @click="modalOpen = false" />
          <Button variant="primary" label="Confirm" @click="modalOpen = false" />
        </template>
      </Modal>
    </div>
  </section>

  <!-- StatusIndicator -->
  <section id="status-indicator">
    <h2>StatusIndicator</h2>
    <p class="section-desc">Shows site state with animated hover transitions. Click to toggle start/stop.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>status</code></td><td><code>'stopped' | 'loading' | 'running'</code></td><td>—</td><td>Current site state</td></tr>
        </tbody>
      </table>
      <h3>Events</h3>
      <table>
        <thead><tr><th>Event</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>toggle</code></td><td>Emitted on click (start/stop)</td></tr>
        </tbody>
      </table>
    </div>

    <h3>States</h3>
    <div class="example-section example-section--dark" style="padding: 24px 32px;">
      <div class="status-demo-row hstack gap-xxl">
        <div class="vstack align-center gap-xxs">
          <StatusIndicator status="stopped" />
          <span class="status-demo-label">Stopped</span>
        </div>
        <div class="vstack align-center gap-xxs">
          <StatusIndicator status="loading" />
          <span class="status-demo-label">Loading</span>
        </div>
        <div class="vstack align-center gap-xxs">
          <StatusIndicator status="running" />
          <span class="status-demo-label">Running</span>
        </div>
      </div>
      <p class="status-demo-hint">Hover stopped or running to see the transition.</p>
    </div>
  </section>

  <!-- Text -->
  <section id="text">
    <h2>Text</h2>
    <p class="section-desc">Typographic primitive with variant, color, weight, and polymorphic tag.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>variant</code></td><td><code>'body' | 'body-large' | 'caption' | 'label'</code></td><td><code>'body'</code></td><td>Text style preset</td></tr>
          <tr><td><code>tag</code></td><td><code>string</code></td><td><code>'span'</code></td><td>HTML element to render</td></tr>
          <tr><td><code>color</code></td><td><code>'default' | 'secondary' | 'muted' | 'inherit'</code></td><td>—</td><td>Text color</td></tr>
          <tr><td><code>weight</code></td><td><code>'regular' | 'medium' | 'semibold'</code></td><td>—</td><td>Override font weight</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Variants</h3>
    <div class="example-section">
      <div class="vstack gap-xxxs">
        <Text variant="label" color="muted">Label — 11px / 600 / uppercase</Text>
        <Text variant="caption" color="secondary">Caption — 12px</Text>
        <Text variant="body">Body — 14px (default)</Text>
        <Text variant="body-large">Body Large — 16px</Text>
      </div>
    </div>

    <h3>Colors</h3>
    <div class="example-section">
      <div class="vstack gap-xxxs">
        <Text color="default">Default</Text>
        <Text color="secondary">Secondary</Text>
        <Text color="muted">Muted</Text>
      </div>
    </div>

    <h3>Weights</h3>
    <div class="example-section">
      <div class="hstack gap-m">
        <Text weight="regular">Regular (400)</Text>
        <Text weight="medium">Medium (500)</Text>
        <Text weight="semibold">Semibold (600)</Text>
      </div>
    </div>

    <h3>Polymorphic tag</h3>
    <div class="example-section">
      <div class="vstack gap-xxxs">
        <Text variant="label" color="muted" tag="h2">Rendered as h2</Text>
        <Text variant="body" tag="p">Rendered as p</Text>
        <Text variant="caption" tag="small">Rendered as small</Text>
      </div>
    </div>
  </section>

  <!-- Toggle -->
  <section id="toggle">
    <h2>Toggle</h2>
    <p class="section-desc">Boolean switch with optional label. Used for enabling/disabling features inline.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>modelValue</code></td><td><code>boolean</code></td><td>—</td><td>Checked state (v-model)</td></tr>
          <tr><td><code>label</code></td><td><code>string</code></td><td>—</td><td>Optional text label beside the switch</td></tr>
        </tbody>
      </table>
    </div>

    <h3>States</h3>
    <div class="example-section">
      <div class="vstack gap-m">
        <div class="hstack gap-m align-center">
          <Toggle v-model="toggleA" />
          <Text variant="caption" color="muted">Off (no label)</Text>
        </div>
        <div class="hstack gap-m align-center">
          <Toggle v-model="toggleB" />
          <Text variant="caption" color="muted">On (no label)</Text>
        </div>
        <Toggle v-model="toggleC" label="Files and folders" />
      </div>
    </div>
  </section>

  <!-- Tooltip -->
  <section id="tooltip">
    <h2>Tooltip</h2>
    <p class="section-desc">Small contextual label that appears on hover after a short delay. Smart positioning avoids viewport edges. Warm state skips delay when moving between tooltipped elements.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>text</code></td><td><code>string</code></td><td>—</td><td>Tooltip content. No tooltip if empty.</td></tr>
          <tr><td><code>placement</code></td><td><code>'top' | 'bottom' | 'left' | 'right'</code></td><td><code>'top'</code></td><td>Preferred position (auto-flips if clipped)</td></tr>
          <tr><td><code>delay</code></td><td><code>number</code></td><td><code>600</code></td><td>Delay in ms before showing</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Placements</h3>
    <div class="example-section">
      <div class="hstack gap-m justify-center" style="padding: 40px 0;">
        <Tooltip text="I'm on top" placement="top">
          <Button variant="secondary" label="Top" />
        </Tooltip>
        <Tooltip text="I'm on the bottom" placement="bottom">
          <Button variant="secondary" label="Bottom" />
        </Tooltip>
        <Tooltip text="I'm on the left" placement="left">
          <Button variant="secondary" label="Left" />
        </Tooltip>
        <Tooltip text="I'm on the right" placement="right">
          <Button variant="secondary" label="Right" />
        </Tooltip>
      </div>
    </div>

    <h3>Button tooltip prop</h3>
    <p class="section-desc">Buttons accept a <code>tooltip</code> prop directly — useful for icon-only buttons.</p>
    <div class="example-section">
      <div class="hstack gap-xxs" style="padding: 20px 0;">
        <Button variant="tertiary" :icon="cog" tooltip="Settings" />
        <Button variant="tertiary" :icon="pencil" tooltip="Edit" />
        <Button variant="tertiary" :icon="trash" tooltip="Delete" />
        <Button variant="tertiary" :icon="external" tooltip="Open in browser" />
      </div>
    </div>

    <h3>Warm state</h3>
    <p class="section-desc">After dismissing one tooltip, hovering another shows instantly (no delay). Try moving between the buttons above quickly.</p>
  </section>

  <!-- WPIcon -->
  <section id="wpicon">
    <h2>WPIcon</h2>
    <p class="section-desc">Vue wrapper for <code>@wordpress/icons</code>. Resolves React element trees to native SVG.</p>

    <div class="props-table">
      <h3>Props</h3>
      <table>
        <thead><tr><th>Prop</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>icon</code></td><td><code>object</code></td><td>—</td><td>Icon object from <code>@wordpress/icons</code></td></tr>
          <tr><td><code>size</code></td><td><code>number</code></td><td><code>24</code></td><td>Width and height in px</td></tr>
        </tbody>
      </table>
    </div>

    <h3>Usage</h3>
    <pre class="code-block"><code>import { cog } from '@wordpress/icons'
&lt;WPIcon :icon="cog" :size="24" /&gt;</code></pre>

    <h3>All icons ({{ icons.length }})</h3>
    <div class="icon-grid">
      <div class="icon-cell vstack align-center gap-xxs" v-for="item in icons" :key="item.name">
        <WPIcon :icon="item.icon" :size="24" />
        <span class="icon-name">{{ item.name }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Text from '@/components/primitives/Text.vue'
import '@/pages/dev-docs.css'

const dsNav = [
  { id: 'typography', label: 'Typography' },
  { id: 'space', label: 'Space' },
  { id: 'border-radius', label: 'Border Radius' },
  { id: 'chrome', label: 'Chrome' },
  { id: 'frame', label: 'Frame' },
  { id: 'menu', label: 'Menu' },
  { id: 'macos', label: 'macOS Controls' },
  { id: 'status', label: 'Status' },
  { id: 'layout-utilities', label: 'Layout Utilities' },
  { id: 'motion', label: 'Motion' },
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
      <h2 class="nav-heading">Design System</h2>
      <ul class="vstack gap-xxxs">
        <li v-for="item in dsNav" :key="item.id">
          <a :href="'#' + item.id" class="nav-link" @click="scrollTo($event, item.id)">{{ item.label }}</a>
        </li>
      </ul>
    </nav>
    <div class="dev-main flex-1 min-w-0">

    <!-- Typography -->
    <section id="typography">
      <h2>Typography</h2>
      <p class="section-desc">Typography tokens in <code>styles/typography.css</code>. All font values flow through tokens — no raw px in component styles.</p>

      <div class="subsection">
        <h3>Font Stacks</h3>
        <div class="utility-grid mt-xs">
          <div class="utility-item">
            <code>--font-family</code>
            <Text variant="body-small" color="secondary">-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif</Text>
          </div>
          <div class="utility-item">
            <code>--font-family-mono</code>
            <Text variant="body-small" color="secondary" style="font-family: var(--font-family-mono)">'SF Mono', 'Fira Code', monospace</Text>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Font Sizes</h3>
        <table class="token-table mt-xs">
          <thead>
            <tr><th>Token</th><th>Value</th><th>Use for</th><th>Sample</th></tr>
          </thead>
          <tbody>
            <tr v-for="t in [
              { token: '--font-size-xs', val: '11px', use: 'Labels, shortcut hints' },
              { token: '--font-size-s', val: '12px', use: 'Captions, small controls' },
              { token: '--font-size-m', val: '13px', use: 'Default UI text, buttons' },
              { token: '--font-size-l', val: '14px', use: 'Body text, inputs' },
              { token: '--font-size-xl', val: '16px', use: 'Body-large, chat messages' },
            ]" :key="t.token">
              <td><code>{{ t.token }}</code></td>
              <td class="token-val">{{ t.val }}</td>
              <td><Text variant="body-small" color="secondary">{{ t.use }}</Text></td>
              <td :style="{ fontSize: `var(${t.token})` }">The quick brown fox</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="subsection">
        <h3>Font Weights</h3>
        <div class="hstack gap-l mt-xs">
          <div class="vstack gap-xxxs">
            <Text weight="regular">Regular</Text>
            <Text variant="body-small" color="muted">--font-weight-regular (400)</Text>
          </div>
          <div class="vstack gap-xxxs">
            <Text weight="medium">Medium</Text>
            <Text variant="body-small" color="muted">--font-weight-medium (500)</Text>
          </div>
          <div class="vstack gap-xxxs">
            <Text weight="semibold">Semibold</Text>
            <Text variant="body-small" color="muted">--font-weight-semibold (600)</Text>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Line Heights</h3>
        <div class="utility-grid mt-xs">
          <div class="utility-item">
            <code>--line-height-tight</code>
            <Text variant="body-small" color="secondary">1.2 — labels, single-line</Text>
          </div>
          <div class="utility-item">
            <code>--line-height-normal</code>
            <Text variant="body-small" color="secondary">1.4 — body text, multi-line</Text>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Text Component Variants</h3>
        <div class="type-samples vstack gap-m mt-xs">
          <div class="type-sample hstack gap-m">
            <div class="type-meta">
              <code>body</code>
              <span class="type-spec">--font-size-l / regular</span>
            </div>
            <Text variant="body">The quick brown fox jumps over the lazy dog</Text>
          </div>
          <div class="type-sample hstack gap-m">
            <div class="type-meta">
              <code>body-large</code>
              <span class="type-spec">--font-size-xl / regular</span>
            </div>
            <Text variant="body-large">The quick brown fox jumps over the lazy dog</Text>
          </div>
          <div class="type-sample hstack gap-m">
            <div class="type-meta">
              <code>caption</code>
              <span class="type-spec">--font-size-s / regular</span>
            </div>
            <Text variant="body-small" color="secondary">The quick brown fox jumps over the lazy dog</Text>
          </div>
          <div class="type-sample hstack gap-m">
            <div class="type-meta">
              <code>label</code>
              <span class="type-spec">--font-size-xs / semibold / uppercase</span>
            </div>
            <Text variant="heading-small" color="muted">The quick brown fox jumps over the lazy dog</Text>
          </div>
        </div>
      </div>

    </section>

    <!-- Space -->
    <section id="space">
      <h2>Space</h2>
      <p class="section-desc">4px grid. All spacing must use these tokens. No magic numbers.</p>
      <div class="space-list">
        <div class="space-item" v-for="t in [
          { name: 'xxxs', val: '2px', units: 0.5 },
          { name: 'xxs', val: '4px', units: 1 },
          { name: 'xs', val: '8px', units: 2 },
          { name: 's', val: '12px', units: 3 },
          { name: 'm', val: '16px', units: 4 },
          { name: 'l', val: '20px', units: 5 },
          { name: 'xl', val: '24px', units: 6 },
          { name: 'xxl', val: '32px', units: 8 },
          { name: 'xxxl', val: '48px', units: 12 },
        ]" :key="t.name">
          <code class="space-token">{{ t.name }}</code>
          <div class="space-bar" :style="{ width: `var(--space-${t.name})` }"></div>
          <span class="space-value">{{ t.val }}</span>
          <span class="space-units">{{ t.units }} {{ t.units === 1 ? 'unit' : 'units' }}</span>
        </div>
      </div>
    </section>

    <!-- Border Radius -->
    <section id="border-radius">
      <h2>Border Radius</h2>
      <p class="section-desc">On the 4px grid. Use for consistent rounding across components.</p>
      <div class="radius-list">
        <div class="radius-item" v-for="r in [
          { name: 's', val: '4px', desc: 'Buttons, inputs, tags' },
          { name: 'm', val: '8px', desc: 'Cards, panels, dropdowns' },
          { name: 'l', val: '12px', desc: 'Modals, large containers' },
        ]" :key="r.name">
          <div class="radius-preview" :style="{ borderRadius: `var(--radius-${r.name})` }"></div>
          <div class="radius-info">
            <code>--radius-{{ r.name }}</code>
            <span class="radius-val">{{ r.val }}</span>
            <span class="radius-desc">{{ r.desc }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Chrome -->
    <section id="chrome">
      <h2>Chrome</h2>
      <p class="section-desc">App frame, sidebar, and titlebar colors.</p>
      <div class="swatches">
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-chrome-bg)"></div>
          <span class="swatch-name">chrome-bg</span>
          <code class="swatch-value">#1e1e1e</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-chrome-theme)"></div>
          <span class="swatch-name">chrome-theme</span>
          <code class="swatch-value">#3858e9</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-chrome-fg)"></div>
          <span class="swatch-name">chrome-fg</span>
          <code class="swatch-value">#fff</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-chrome-fg-muted)"></div>
          <span class="swatch-name">chrome-fg-muted</span>
          <code class="swatch-value">rgba(255,255,255,0.7)</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-chrome-border)"></div>
          <span class="swatch-name">chrome-border</span>
          <code class="swatch-value">rgba(255,255,255,0.1)</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-chrome-hover)"></div>
          <span class="swatch-name">chrome-hover</span>
          <code class="swatch-value">rgba(255,255,255,0.05)</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-chrome-fill)"></div>
          <span class="swatch-name">chrome-fill</span>
          <code class="swatch-value">rgba(255,255,255,0.02)</code>
        </div>
      </div>
    </section>

    <!-- Frame -->
    <section id="frame">
      <h2>Frame</h2>
      <p class="section-desc">Content panels, inputs, cards — the light-surface content area.</p>
      <div class="swatches">
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-frame-bg)"></div>
          <span class="swatch-name">frame-bg</span>
          <code class="swatch-value">#fff</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-frame-theme)"></div>
          <span class="swatch-name">frame-theme</span>
          <code class="swatch-value">#3858e9</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-frame-fg)"></div>
          <span class="swatch-name">frame-fg</span>
          <code class="swatch-value">#000</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-frame-fg-muted)"></div>
          <span class="swatch-name">frame-fg-muted</span>
          <code class="swatch-value">rgba(0,0,0,0.7)</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-frame-border)"></div>
          <span class="swatch-name">frame-border</span>
          <code class="swatch-value">rgba(0,0,0,0.1)</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-frame-hover)"></div>
          <span class="swatch-name">frame-hover</span>
          <code class="swatch-value">rgba(0,0,0,0.05)</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-frame-fill)"></div>
          <span class="swatch-name">frame-fill</span>
          <code class="swatch-value">rgba(0,0,0,0.02)</code>
        </div>
      </div>
    </section>

    <!-- Menu -->
    <section id="menu">
      <h2>Menu</h2>
      <p class="section-desc">Flyout menus, dropdowns — dark surface context.</p>
      <div class="swatches">
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-menu-bg)"></div>
          <span class="swatch-name">menu-bg</span>
          <code class="swatch-value">#111</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-menu-fg)"></div>
          <span class="swatch-name">menu-fg</span>
          <code class="swatch-value">#fff</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-menu-fg-muted)"></div>
          <span class="swatch-name">menu-fg-muted</span>
          <code class="swatch-value">rgba(255,255,255,0.7)</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-menu-border)"></div>
          <span class="swatch-name">menu-border</span>
          <code class="swatch-value">rgba(255,255,255,0.15)</code>
        </div>
      </div>
    </section>

    <!-- macOS Window Controls -->
    <section id="macos">
      <h2>macOS Window Controls</h2>
      <p class="section-desc">Native window control colors.</p>
      <div class="swatches">
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-macos-close)"></div>
          <span class="swatch-name">macos-close</span>
          <code class="swatch-value">#ff5f57</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-macos-minimize)"></div>
          <span class="swatch-name">macos-minimize</span>
          <code class="swatch-value">#ffbd2e</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-macos-maximize)"></div>
          <span class="swatch-name">macos-maximize</span>
          <code class="swatch-value">#28c840</code>
        </div>
      </div>
    </section>

    <!-- Status -->
    <section id="status">
      <h2>Status</h2>
      <p class="section-desc">Site running state indicators.</p>
      <div class="swatches">
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-status-running)"></div>
          <span class="swatch-name">status-running</span>
          <code class="swatch-value">#1fd15b</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-status-stopped)"></div>
          <span class="swatch-name">status-stopped</span>
          <code class="swatch-value">#646970</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-status-stop-hover)"></div>
          <span class="swatch-name">status-stop-hover</span>
          <code class="swatch-value">#e65054</code>
        </div>
      </div>
    </section>

    <!-- Layout Utilities -->
    <section id="layout-utilities">
      <h2>Layout Utilities</h2>
      <p class="section-desc">Global utility classes for flex layout. Use instead of writing <code>display: flex</code> in scoped styles.</p>

      <h3>Stacks</h3>
      <div class="utility-grid mt-xs">
        <div class="utility-item">
          <code>.hstack</code>
          <Text variant="body-small" color="secondary">flex + align-items: center</Text>
        </div>
        <div class="utility-item">
          <code>.vstack</code>
          <Text variant="body-small" color="secondary">flex + flex-direction: column</Text>
        </div>
      </div>

      <h3>Gap</h3>
      <div class="gap-demo vstack gap-xxs mt-xs">
        <div v-for="g in ['xxxs','xxs','xs','s','m','l','xl','xxl','xxxl']" :key="g" class="hstack gap-xs">
          <code class="gap-label">.gap-{{ g }}</code>
          <div class="hstack" :class="`gap-${g}`">
            <div class="gap-dot"></div>
            <div class="gap-dot"></div>
            <div class="gap-dot"></div>
          </div>
        </div>
      </div>

      <h3>Spacing Utilities</h3>
      <Text variant="body-small" color="secondary" tag="p" class="mt-xs">Padding and margin mapped to space tokens. Pattern: <code>.p-xs</code>, <code>.px-xxs</code>, <code>.py-xxxs</code>, <code>.pt-s</code>, <code>.mb-xs</code>, <code>.me-xxs</code>, <code>.mx-auto</code></Text>
      <div class="utility-grid mt-xs">
        <div class="utility-item">
          <code>.p-{size}</code>
          <Text variant="body-small" color="secondary">Uniform padding</Text>
        </div>
        <div class="utility-item">
          <code>.px-{size}</code> / <code>.py-{size}</code>
          <Text variant="body-small" color="secondary">Inline / block axis</Text>
        </div>
        <div class="utility-item">
          <code>.pt-</code> <code>.pb-</code> <code>.ps-</code> <code>.pe-</code>
          <Text variant="body-small" color="secondary">Individual sides</Text>
        </div>
        <div class="utility-item">
          <code>.m-{size}</code> / <code>.mx-</code> / <code>.my-</code>
          <Text variant="body-small" color="secondary">Margin (same pattern)</Text>
        </div>
      </div>

      <h3>Flex</h3>
      <div class="utility-grid mt-xs">
        <div class="utility-item">
          <code>.flex-1</code>
          <Text variant="body-small" color="secondary">flex: 1</Text>
        </div>
        <div class="utility-item">
          <code>.shrink-0</code>
          <Text variant="body-small" color="secondary">flex-shrink: 0</Text>
        </div>
        <div class="utility-item">
          <code>.min-w-0</code>
          <Text variant="body-small" color="secondary">min-width: 0</Text>
        </div>
        <div class="utility-item">
          <code>.flex-wrap</code>
          <Text variant="body-small" color="secondary">flex-wrap: wrap</Text>
        </div>
      </div>

      <h3>Alignment</h3>
      <div class="utility-grid mt-xs">
        <div class="utility-item">
          <code>.justify-between</code>
          <Text variant="body-small" color="secondary">space-between</Text>
        </div>
        <div class="utility-item">
          <code>.justify-center</code>
          <Text variant="body-small" color="secondary">center</Text>
        </div>
        <div class="utility-item">
          <code>.align-stretch</code>
          <Text variant="body-small" color="secondary">Override hstack's center</Text>
        </div>
        <div class="utility-item">
          <code>.align-center</code>
          <Text variant="body-small" color="secondary">center (for vstack)</Text>
        </div>
      </div>
    </section>

    <!-- Motion -->
    <section id="motion">
      <h2>Motion</h2>
      <p class="section-desc">Motion tokens in <code>styles/motion.css</code>. All transition durations and easing flow through tokens — no raw timing values in component styles.</p>

      <div class="subsection">
        <h3>Duration Scale</h3>
        <p class="section-desc">Hover each bar to see the transition in action.</p>
        <div class="motion-list vstack gap-xxs mt-xs">
          <div class="motion-item hstack gap-m" v-for="d in [
            { token: '--duration-instant', val: '100ms', use: 'Near-instant feedback, micro hover states' },
            { token: '--duration-fast', val: '150ms', use: 'Hover, focus, button states' },
            { token: '--duration-moderate', val: '200ms', use: 'Resize, status changes, fade' },
            { token: '--duration-slow', val: '300ms', use: 'Layout transitions, panel morph, frame slide' },
          ]" :key="d.token">
            <code class="motion-token">{{ d.token }}</code>
            <div class="motion-demo-track">
              <div class="motion-demo-bar" :style="{ transitionDuration: `var(${d.token})` }"></div>
            </div>
            <span class="motion-val">{{ d.val }}</span>
            <Text variant="body-small" color="muted">{{ d.use }}</Text>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Easing Functions</h3>
        <div class="utility-grid mt-xs">
          <div class="utility-item">
            <code>--ease-default</code>
            <Text variant="body-small" color="secondary">ease — general purpose</Text>
          </div>
          <div class="utility-item">
            <code>--ease-in-out</code>
            <Text variant="body-small" color="secondary">ease-in-out — symmetrical transitions</Text>
          </div>
          <div class="utility-item">
            <code>--ease-out</code>
            <Text variant="body-small" color="secondary">ease-out — elements entering/appearing</Text>
          </div>
          <div class="utility-item">
            <code>--ease-in</code>
            <Text variant="body-small" color="secondary">ease-in — elements leaving/disappearing</Text>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Composed Shortcuts</h3>
        <p class="section-desc">Pre-composed <code>duration + easing</code> pairs for common patterns. Use in <code>transition</code> shorthand after the property name.</p>
        <div class="utility-grid mt-xs">
          <div class="utility-item">
            <code>--transition-hover</code>
            <Text variant="body-small" color="secondary">150ms ease — hover &amp; active states</Text>
          </div>
        </div>
      </div>
    </section>
    </div>
  </div>
</template>

<style scoped>
.subsection {
  margin-block-end: var(--space-xl);
}

/* Color swatches */
.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-s);
}

.swatch {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.swatch-color {
  width: 100%;
  height: 64px;
  border-radius: var(--radius-m);
  border: 1px solid var(--color-frame-border);
}

.swatch-name {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  color: var(--color-frame-fg);
}

.swatch-value {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  font-family: var(--font-family-mono);
  background: var(--color-frame-hover);
  padding: var(--space-xxxs) var(--space-xxs);
  border-radius: var(--radius-s);
  width: fit-content;
}

/* Space */
.space-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
}

.space-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.space-token {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg);
  width: 120px;
  flex-shrink: 0;
}

.space-bar {
  height: var(--space-m);
  background: var(--color-frame-theme);
  border-radius: var(--radius-s);
  opacity: 0.2;
}

.space-value {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg-muted);
  width: 40px;
  flex-shrink: 0;
}

.space-units {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-muted);
}

/* Radius */
.radius-list {
  display: flex;
  gap: var(--space-l);
}

.radius-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.radius-preview {
  width: 80px;
  height: 80px;
  background: var(--color-frame-hover);
  border: 1px solid var(--color-frame-border);
}

.radius-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xxxs);
}

.radius-info code {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
}

.radius-val {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg-muted);
}

.radius-desc {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
}

/* Typography */
.type-sample {
  padding-block-end: var(--space-m);
  border-block-end: 1px solid var(--color-frame-hover);
}

.type-meta {
  width: 120px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
}

.type-meta code {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg);
}

.type-spec {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
}

/* Layout utilities */
.utility-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-xs);
}

.utility-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxxs);
  padding: var(--space-xs);
  background: var(--color-frame-hover);
  border-radius: var(--radius-m);
}

.utility-item code {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg);
}

.gap-label {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg-muted);
  width: 80px;
  flex-shrink: 0;
}

.gap-dot {
  width: var(--space-xxs);
  height: var(--space-xxs);
  border-radius: 50%;
  background: var(--color-frame-theme);
  opacity: 0.4;
}

/* Motion */
.motion-token {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg);
  width: 160px;
  flex-shrink: 0;
}

.motion-demo-track {
  width: 120px;
  height: var(--space-m);
  background: var(--color-frame-hover);
  border-radius: var(--radius-s);
  overflow: hidden;
  flex-shrink: 0;
}

.motion-demo-bar {
  width: 30%;
  height: 100%;
  background: var(--color-frame-theme);
  opacity: 0.3;
  border-radius: var(--radius-s);
  transition-property: width;
  transition-timing-function: var(--ease-default);
}

.motion-demo-track:hover .motion-demo-bar {
  width: 100%;
  opacity: 0.5;
}

.motion-val {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-frame-fg-muted);
  width: 50px;
  flex-shrink: 0;
}
</style>

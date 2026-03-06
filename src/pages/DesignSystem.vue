<script setup lang="ts">
import Text from '@/components/primitives/Text.vue'

const dsNav = [
  { id: 'typography', label: 'Typography' },
  { id: 'space', label: 'Space' },
  { id: 'border-radius', label: 'Border Radius' },
  { id: 'chrome', label: 'Chrome' },
  { id: 'traffic-lights', label: 'Traffic Lights' },
  { id: 'status', label: 'Status' },
  { id: 'surface', label: 'Surface' },
  { id: 'text-colors', label: 'Text Colors' },
  { id: 'interactive', label: 'Interactive' },
  { id: 'layout-utilities', label: 'Layout Utilities' },
  { id: 'motion', label: 'Motion' },
]
</script>

<template>
  <div class="ds-layout hstack">
    <nav class="ds-nav">
      <h2 class="nav-heading">Design System</h2>
      <ul class="vstack gap-xxxs">
        <li v-for="item in dsNav" :key="item.id">
          <a :href="'#' + item.id" class="nav-link">{{ item.label }}</a>
        </li>
      </ul>
    </nav>
    <div class="ds flex-1 min-w-0">

    <!-- Typography -->
    <section id="typography">
      <h2>Typography</h2>
      <p class="section-desc">Typography tokens in <code>styles/typography.css</code>. All font values flow through tokens — no raw px in component styles.</p>

      <div class="subsection">
        <h3>Font Stacks</h3>
        <div class="utility-grid mt-xs">
          <div class="utility-item">
            <code>--font-family</code>
            <Text variant="caption" color="secondary">-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif</Text>
          </div>
          <div class="utility-item">
            <code>--font-family-mono</code>
            <Text variant="caption" color="secondary" style="font-family: var(--font-family-mono)">'SF Mono', 'Fira Code', monospace</Text>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Font Sizes</h3>
        <div class="type-scale vstack gap-xxs mt-xs">
          <div class="type-scale-item hstack gap-m" v-for="t in [
            { token: '--font-size-xs', val: '11px', use: 'Labels, shortcut hints' },
            { token: '--font-size-s', val: '12px', use: 'Captions, small controls' },
            { token: '--font-size-m', val: '13px', use: 'Default UI text, buttons' },
            { token: '--font-size-l', val: '14px', use: 'Body text, inputs' },
            { token: '--font-size-xl', val: '16px', use: 'Body-large, chat messages' },
          ]" :key="t.token">
            <code class="type-scale-token">{{ t.token }}</code>
            <span class="type-scale-sample" :style="{ fontSize: `var(${t.token})` }">The quick brown fox</span>
            <span class="type-scale-val">{{ t.val }}</span>
            <Text variant="caption" color="muted">{{ t.use }}</Text>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Font Weights</h3>
        <div class="hstack gap-l mt-xs">
          <div class="vstack gap-xxxs">
            <Text weight="regular">Regular</Text>
            <Text variant="caption" color="muted">--font-weight-regular (400)</Text>
          </div>
          <div class="vstack gap-xxxs">
            <Text weight="medium">Medium</Text>
            <Text variant="caption" color="muted">--font-weight-medium (500)</Text>
          </div>
          <div class="vstack gap-xxxs">
            <Text weight="semibold">Semibold</Text>
            <Text variant="caption" color="muted">--font-weight-semibold (600)</Text>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Line Heights</h3>
        <div class="utility-grid mt-xs">
          <div class="utility-item">
            <code>--line-height-tight</code>
            <Text variant="caption" color="secondary">1.2 — labels, single-line</Text>
          </div>
          <div class="utility-item">
            <code>--line-height-normal</code>
            <Text variant="caption" color="secondary">1.4 — body text, multi-line</Text>
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
            <Text variant="caption" color="secondary">The quick brown fox jumps over the lazy dog</Text>
          </div>
          <div class="type-sample hstack gap-m">
            <div class="type-meta">
              <code>label</code>
              <span class="type-spec">--font-size-xs / semibold / uppercase</span>
            </div>
            <Text variant="label" color="muted">The quick brown fox jumps over the lazy dog</Text>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Text Colors</h3>
        <div class="hstack gap-l mt-xs">
          <div class="vstack align-center gap-xxxs">
            <Text color="default">Default</Text>
            <Text variant="caption" color="muted">--color-text</Text>
          </div>
          <div class="vstack align-center gap-xxxs">
            <Text color="secondary">Secondary</Text>
            <Text variant="caption" color="muted">--color-text-secondary</Text>
          </div>
          <div class="vstack align-center gap-xxxs">
            <Text color="muted">Muted</Text>
            <Text variant="caption" color="muted">--color-text-muted</Text>
          </div>
        </div>
      </div>
    </section>

    <!-- Space -->
    <section id="space">
      <h2>Space</h2>
      <p class="section-desc">5px grid. All spacing must use these tokens. No magic numbers.</p>
      <div class="space-list">
        <div class="space-item" v-for="t in [
          { name: 'xxxs', val: '2.5px', units: 0.5 },
          { name: 'xxs', val: '5px', units: 1 },
          { name: 'xs', val: '10px', units: 2 },
          { name: 's', val: '15px', units: 3 },
          { name: 'm', val: '20px', units: 4 },
          { name: 'l', val: '25px', units: 5 },
          { name: 'xl', val: '30px', units: 6 },
          { name: 'xxl', val: '40px', units: 8 },
          { name: 'xxxl', val: '50px', units: 10 },
        ]" :key="t.name">
          <code class="space-token">--space-{{ t.name }}</code>
          <div class="space-bar" :style="{ width: `var(--space-${t.name})` }"></div>
          <span class="space-value">{{ t.val }}</span>
          <span class="space-units">{{ t.units }} {{ t.units === 1 ? 'unit' : 'units' }}</span>
        </div>
      </div>
    </section>

    <!-- Border Radius -->
    <section id="border-radius">
      <h2>Border Radius</h2>
      <p class="section-desc">On the 5px grid. Use for consistent rounding across components.</p>
      <div class="radius-list">
        <div class="radius-item" v-for="r in [
          { name: 's', val: '5px', desc: 'Buttons, inputs, tags' },
          { name: 'm', val: '10px', desc: 'Cards, panels, dropdowns' },
          { name: 'l', val: '15px', desc: 'Modals, large containers' },
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
          <div class="swatch-color" style="background: var(--color-chrome)"></div>
          <span class="swatch-name">chrome</span>
          <code class="swatch-value">#1e1e1e</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-chrome-text)"></div>
          <span class="swatch-name">chrome-text</span>
          <code class="swatch-value">#fff</code>
        </div>
        <div class="swatch">
          <div class="swatch-color border" style="background: var(--color-chrome-text-secondary)"></div>
          <span class="swatch-name">chrome-text-secondary</span>
          <code class="swatch-value">rgba(255,255,255,0.7)</code>
        </div>
        <div class="swatch">
          <div class="swatch-color border" style="background: var(--color-chrome-text-muted)"></div>
          <span class="swatch-name">chrome-text-muted</span>
          <code class="swatch-value">rgba(255,255,255,0.5)</code>
        </div>
        <div class="swatch">
          <div class="swatch-color border" style="background: var(--color-chrome-text-faint)"></div>
          <span class="swatch-name">chrome-text-faint</span>
          <code class="swatch-value">rgba(255,255,255,0.4)</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-chrome); outline: 2px solid var(--color-chrome-border); outline-offset: -2px;"></div>
          <span class="swatch-name">chrome-border</span>
          <code class="swatch-value">rgba(255,255,255,0.1)</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-chrome-hover)"></div>
          <span class="swatch-name">chrome-hover</span>
          <code class="swatch-value">rgba(255,255,255,0.1)</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-chrome-active)"></div>
          <span class="swatch-name">chrome-active</span>
          <code class="swatch-value">rgba(255,255,255,0.15)</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-chrome-subtle)"></div>
          <span class="swatch-name">chrome-subtle</span>
          <code class="swatch-value">rgba(255,255,255,0.2)</code>
        </div>
      </div>
    </section>

    <!-- Traffic Lights -->
    <section id="traffic-lights">
      <h2>Traffic Lights</h2>
      <p class="section-desc">macOS window controls.</p>
      <div class="swatches">
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-light-close)"></div>
          <span class="swatch-name">light-close</span>
          <code class="swatch-value">#ff5f57</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-light-minimize)"></div>
          <span class="swatch-name">light-minimize</span>
          <code class="swatch-value">#ffbd2e</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-light-maximize)"></div>
          <span class="swatch-name">light-maximize</span>
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
          <code class="swatch-value">#069e08</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-status-stopped)"></div>
          <span class="swatch-name">status-stopped</span>
          <code class="swatch-value">#646970</code>
        </div>
      </div>
    </section>

    <!-- Surface -->
    <section id="surface">
      <h2>Surface</h2>
      <p class="section-desc">Main content area backgrounds and borders.</p>
      <div class="swatches">
        <div class="swatch">
          <div class="swatch-color border" style="background: var(--color-surface)"></div>
          <span class="swatch-name">surface</span>
          <code class="swatch-value">#fff</code>
        </div>
        <div class="swatch">
          <div class="swatch-color border" style="background: var(--color-surface-secondary)"></div>
          <span class="swatch-name">surface-secondary</span>
          <code class="swatch-value">#f6f7f7</code>
        </div>
        <div class="swatch">
          <div class="swatch-color border" style="background: var(--color-surface-border)"></div>
          <span class="swatch-name">surface-border</span>
          <code class="swatch-value">#dcdcde</code>
        </div>
      </div>
    </section>

    <!-- Text Colors -->
    <section id="text-colors">
      <h2>Text Colors</h2>
      <p class="section-desc">Content typography colors.</p>
      <div class="swatches">
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-text)"></div>
          <span class="swatch-name">text</span>
          <code class="swatch-value">#1d2327</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-text-secondary)"></div>
          <span class="swatch-name">text-secondary</span>
          <code class="swatch-value">#646970</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-text-muted)"></div>
          <span class="swatch-name">text-muted</span>
          <code class="swatch-value">#a7aaad</code>
        </div>
      </div>
    </section>

    <!-- Interactive -->
    <section id="interactive">
      <h2>Interactive</h2>
      <p class="section-desc">Primary actions and links.</p>
      <div class="swatches">
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-primary)"></div>
          <span class="swatch-name">primary</span>
          <code class="swatch-value">#3858e9</code>
        </div>
        <div class="swatch">
          <div class="swatch-color" style="background: var(--color-primary-hover)"></div>
          <span class="swatch-name">primary-hover</span>
          <code class="swatch-value">#2a46ce</code>
        </div>
        <div class="swatch">
          <div class="swatch-color border" style="background: var(--color-primary-text)"></div>
          <span class="swatch-name">primary-text</span>
          <code class="swatch-value">#fff</code>
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
          <Text variant="caption" color="secondary">flex + align-items: center</Text>
        </div>
        <div class="utility-item">
          <code>.vstack</code>
          <Text variant="caption" color="secondary">flex + flex-direction: column</Text>
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
      <Text variant="caption" color="secondary" tag="p" class="mt-xs">Padding and margin mapped to space tokens. Pattern: <code>.p-xs</code>, <code>.px-xxs</code>, <code>.py-xxxs</code>, <code>.pt-s</code>, <code>.mb-xs</code>, <code>.me-xxs</code>, <code>.mx-auto</code></Text>
      <div class="utility-grid mt-xs">
        <div class="utility-item">
          <code>.p-{size}</code>
          <Text variant="caption" color="secondary">Uniform padding</Text>
        </div>
        <div class="utility-item">
          <code>.px-{size}</code> / <code>.py-{size}</code>
          <Text variant="caption" color="secondary">Inline / block axis</Text>
        </div>
        <div class="utility-item">
          <code>.pt-</code> <code>.pb-</code> <code>.ps-</code> <code>.pe-</code>
          <Text variant="caption" color="secondary">Individual sides</Text>
        </div>
        <div class="utility-item">
          <code>.m-{size}</code> / <code>.mx-</code> / <code>.my-</code>
          <Text variant="caption" color="secondary">Margin (same pattern)</Text>
        </div>
      </div>

      <h3>Flex</h3>
      <div class="utility-grid mt-xs">
        <div class="utility-item">
          <code>.flex-1</code>
          <Text variant="caption" color="secondary">flex: 1</Text>
        </div>
        <div class="utility-item">
          <code>.shrink-0</code>
          <Text variant="caption" color="secondary">flex-shrink: 0</Text>
        </div>
        <div class="utility-item">
          <code>.min-w-0</code>
          <Text variant="caption" color="secondary">min-width: 0</Text>
        </div>
        <div class="utility-item">
          <code>.flex-wrap</code>
          <Text variant="caption" color="secondary">flex-wrap: wrap</Text>
        </div>
      </div>

      <h3>Alignment</h3>
      <div class="utility-grid mt-xs">
        <div class="utility-item">
          <code>.justify-between</code>
          <Text variant="caption" color="secondary">space-between</Text>
        </div>
        <div class="utility-item">
          <code>.justify-center</code>
          <Text variant="caption" color="secondary">center</Text>
        </div>
        <div class="utility-item">
          <code>.align-stretch</code>
          <Text variant="caption" color="secondary">Override hstack's center</Text>
        </div>
        <div class="utility-item">
          <code>.align-center</code>
          <Text variant="caption" color="secondary">center (for vstack)</Text>
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
            <Text variant="caption" color="muted">{{ d.use }}</Text>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Easing Functions</h3>
        <div class="utility-grid mt-xs">
          <div class="utility-item">
            <code>--ease-default</code>
            <Text variant="caption" color="secondary">ease — general purpose</Text>
          </div>
          <div class="utility-item">
            <code>--ease-in-out</code>
            <Text variant="caption" color="secondary">ease-in-out — symmetrical transitions</Text>
          </div>
          <div class="utility-item">
            <code>--ease-out</code>
            <Text variant="caption" color="secondary">ease-out — elements entering/appearing</Text>
          </div>
          <div class="utility-item">
            <code>--ease-in</code>
            <Text variant="caption" color="secondary">ease-in — elements leaving/disappearing</Text>
          </div>
        </div>
      </div>

      <div class="subsection">
        <h3>Composed Shortcuts</h3>
        <p class="section-desc">Pre-composed <code>duration + easing</code> pairs for common patterns. Use in <code>transition</code> shorthand after the property name.</p>
        <div class="utility-grid mt-xs">
          <div class="utility-item">
            <code>--transition-hover</code>
            <Text variant="caption" color="secondary">150ms ease — hover &amp; active states</Text>
          </div>
          <div class="utility-item">
            <code>--transition-focus</code>
            <Text variant="caption" color="secondary">150ms ease — focus rings, input borders</Text>
          </div>
          <div class="utility-item">
            <code>--transition-fade</code>
            <Text variant="caption" color="secondary">200ms ease — opacity, resize, status</Text>
          </div>
          <div class="utility-item">
            <code>--transition-layout</code>
            <Text variant="caption" color="secondary">300ms ease — panel morph, frame slide</Text>
          </div>
        </div>
      </div>
    </section>
    </div>
  </div>
</template>

<style scoped>
/* Two-column layout matching Components.vue */
.ds-layout {
  min-height: 100vh;
  scroll-behavior: smooth;
  font-family: var(--font-family);
  color: var(--color-text);
}

.ds-nav {
  position: sticky;
  top: 0;
  align-self: flex-start;
  width: 200px;
  padding: var(--space-xxxl) var(--space-m);
  border-inline-end: 1px solid var(--color-surface-border);
}

.nav-heading {
  /* 11px — intentional, matches Components.vue nav heading outside type scale */
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-xs);
}

.ds-nav ul {
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

/* Main content area */
.ds {
  max-width: 960px;
  padding: var(--space-xxxl) var(--space-xl);
}

section {
  margin-block-end: var(--space-xxxl);
}

h2 {
  /* 20px — intentional, section heading outside type scale */
  font-size: 20px;
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

.section-desc {
  font-size: var(--font-size-m);
  color: var(--color-text-secondary);
  margin-block-end: var(--space-m);
}

.section-desc code {
  font-size: var(--font-size-s);
  background: var(--color-surface-secondary);
  padding: var(--space-xxxs) var(--space-xxs);
  border-radius: var(--radius-s);
  font-family: var(--font-family-mono);
}

/* Typography subsections — extra breathing room */
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
}

.swatch-color.border {
  border: 1px solid var(--color-surface-border);
}

.swatch-name {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.swatch-value {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
  background: var(--color-surface-secondary);
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
  color: var(--color-text);
  width: 120px;
  flex-shrink: 0;
}

.space-bar {
  height: 20px;
  background: var(--color-primary);
  border-radius: var(--radius-s);
  opacity: 0.2;
}

.space-value {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-text-secondary);
  width: 40px;
  flex-shrink: 0;
}

.space-units {
  font-size: var(--font-size-s);
  color: var(--color-text-muted);
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
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-surface-border);
}

.radius-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.radius-info code {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
}

.radius-val {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-text-secondary);
}

.radius-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Typography */
.type-sample {
  padding-block-end: var(--space-m);
  border-block-end: 1px solid var(--color-surface-secondary);
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
  color: var(--color-text);
}

.type-spec {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* Type scale demo */
.type-scale-token {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-text);
  width: 140px;
  flex-shrink: 0;
}

.type-scale-sample {
  flex: 1;
  min-width: 0;
  color: var(--color-text);
}

.type-scale-val {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-text-secondary);
  width: 40px;
  flex-shrink: 0;
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
  background: var(--color-surface-secondary);
  border-radius: var(--radius-m);
}

.utility-item code {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-text);
}

.gap-label {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-text-secondary);
  width: 80px;
  flex-shrink: 0;
}

.gap-dot {
  width: var(--space-xxs);
  height: var(--space-xxs);
  border-radius: 50%;
  background: var(--color-primary);
  opacity: 0.4;
}

/* Motion */
.motion-token {
  font-size: var(--font-size-s);
  font-family: var(--font-family-mono);
  color: var(--color-text);
  width: 160px;
  flex-shrink: 0;
}

.motion-demo-track {
  width: 120px;
  height: 20px;
  background: var(--color-surface-secondary);
  border-radius: var(--radius-s);
  overflow: hidden;
  flex-shrink: 0;
}

.motion-demo-bar {
  width: 30%;
  height: 100%;
  background: var(--color-primary);
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
  color: var(--color-text-secondary);
  width: 50px;
  flex-shrink: 0;
}
</style>

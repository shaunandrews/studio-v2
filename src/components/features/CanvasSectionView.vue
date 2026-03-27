<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { chevronLeft } from '@wordpress/icons'
import InputChatMini from '@/components/composites/InputChatMini.vue'
import PaneGroup from '@/components/composites/PaneGroup.vue'
import Pane from '@/components/composites/Pane.vue'
import Toolbar from '@/components/composites/Toolbar.vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import { useSiteDocument } from '@/data/useSiteDocument'
import { renderSite } from '@/data/site-renderer'
import type { SiteContentSection } from '@/data/site-types'

const props = defineProps<{
  siteId: string
  pageSlug: string
  pageTitle: string
}>()

const emit = defineEmits<{
  back: []
  'create-task': [context: { sectionId: string; role: string; htmlPreview: string; message: string }]
}>()

const { getContent } = useSiteDocument()
const siteContent = computed(() => getContent(props.siteId).value)

const iframeRef = ref<HTMLIFrameElement | null>(null)
const selectedSection = ref<{ id: string; role: string; htmlPreview: string } | null>(null)
const taskMessage = ref('')
const taskInputRef = ref<InstanceType<typeof InputChatMini> | null>(null)

/** Render the page with section-highlight script injected */
const pageHtml = computed(() => {
  if (!siteContent.value) return ''
  const baseHtml = renderSite(siteContent.value, props.pageSlug)
  // Inject the section highlight script before </body>
  return baseHtml.replace('</body>', `${SECTION_HIGHLIGHT_SCRIPT}</body>`)
})

function onMessage(e: MessageEvent) {
  if (!e.data?.type) return
  if (e.data.type === 'section-select') {
    selectedSection.value = {
      id: e.data.sectionId,
      role: e.data.role || '',
      htmlPreview: e.data.htmlPreview || '',
    }
    taskMessage.value = ''
    setTimeout(() => taskInputRef.value?.focus(), 50)
  }
  if (e.data.type === 'section-deselect') {
    selectedSection.value = null
  }
}

function sendTask(text: string) {
  if (!text || !selectedSection.value) return
  emit('create-task', {
    sectionId: selectedSection.value.id,
    role: selectedSection.value.role,
    htmlPreview: selectedSection.value.htmlPreview,
    message: text,
  })
  taskMessage.value = ''
  selectedSection.value = null
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (selectedSection.value) {
      selectedSection.value = null
    } else {
      emit('back')
    }
  }
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('message', onMessage)
  window.removeEventListener('keydown', onKeyDown)
})

/** Get the selected section's data for display */
const sectionData = computed<SiteContentSection | null>(() => {
  if (!selectedSection.value || !siteContent.value) return null
  return siteContent.value.sections[selectedSection.value.id] ?? null
})

const SECTION_HIGHLIGHT_SCRIPT = `
<style>
  [data-section] {
    position: relative;
  }
  [data-section]::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    border: 2px solid transparent;
    transition: border-color 0.15s ease;
    z-index: 9999;
  }
  [data-section]:hover::after {
    border-color: rgba(59, 130, 246, 0.5);
  }
  [data-section].section-selected::after {
    border-color: rgba(59, 130, 246, 0.8);
  }
  .section-label-overlay {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: 10000;
    padding: 2px 8px;
    background: rgba(59, 130, 246, 0.9);
    color: white;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-weight: 500;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    border-end-end-radius: 4px;
  }
  [data-section]:hover .section-label-overlay,
  [data-section].section-selected .section-label-overlay {
    opacity: 1;
  }
</style>
<script>
(function() {
  // Override display:contents so sections have dimensions for the overlay
  document.querySelectorAll('[data-section]').forEach(function(el) {
    el.style.display = 'block';
    el.style.position = 'relative';
    // Add label overlay
    var label = document.createElement('div');
    label.className = 'section-label-overlay';
    var sectionId = el.getAttribute('data-section');
    var role = el.getAttribute('data-role');
    label.textContent = role ? sectionId + ' [' + role + ']' : sectionId;
    el.prepend(label);
  });

  var selected = null;

  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();

    var sectionEl = e.target.closest('[data-section]');
    if (!sectionEl) {
      if (selected) {
        selected.classList.remove('section-selected');
        selected = null;
        window.parent.postMessage({ type: 'section-deselect' }, '*');
      }
      return;
    }

    if (selected) selected.classList.remove('section-selected');
    selected = sectionEl;
    sectionEl.classList.add('section-selected');

    var sectionId = sectionEl.getAttribute('data-section');
    var role = sectionEl.getAttribute('data-role') || '';
    var text = sectionEl.textContent || '';
    var preview = text.replace(/\\s+/g, ' ').trim().slice(0, 200);

    window.parent.postMessage({
      type: 'section-select',
      sectionId: sectionId,
      role: role,
      htmlPreview: preview
    }, '*');
  }, true);
})();
<\/script>
`
</script>

<template>
  <PaneGroup class="section-view">
    <Pane fit>
      <Toolbar size="mini">
        <template #start>
          <Button variant="tertiary" :icon="chevronLeft" label="Back to Canvas" @click="emit('back')" />
          <Text variant="body-small" color="muted">{{ pageTitle }}</Text>
        </template>
      </Toolbar>
    </Pane>
    <Pane>
      <iframe
        ref="iframeRef"
        :srcdoc="pageHtml"
        class="section-view-iframe"
        sandbox="allow-same-origin allow-scripts"
      />
    </Pane>

    <!-- Section info + task input (floats at bottom when section selected) -->
    <Transition name="section-panel">
      <div v-if="selectedSection" class="section-panel" @click.stop>
        <div class="section-panel-info">
          <span class="section-panel-id">{{ selectedSection.id }}</span>
          <span v-if="selectedSection.role" class="section-panel-role">{{ selectedSection.role }}</span>
        </div>
        <InputChatMini
          ref="taskInputRef"
          v-model="taskMessage"
          placeholder="Start a task for this section..."
          elevated
          @send="sendTask"
        />
      </div>
    </Transition>
  </PaneGroup>
</template>

<style scoped>
.section-view {
  position: relative;
}

.section-view-iframe {
  flex: 1;
  width: 100%;
  border: none;
}

/* ── Section panel ── */

.section-panel {
  position: absolute;
  inset-block-end: var(--space-m);
  inset-inline-start: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: 360px;
  padding: var(--space-s);
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  box-shadow: 0 4px 16px var(--color-shadow);
}

.section-panel-info {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.section-panel-id {
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
  font-family: var(--font-mono);
}

.section-panel-role {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
  padding: var(--space-xxxs) var(--space-xxs);
  background: var(--color-frame-hover);
  border-radius: var(--radius-s);
}

/* ── Transition ── */

.section-panel-enter-active,
.section-panel-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default),
    transform var(--duration-fast) var(--ease-default);
}

.section-panel-enter-from,
.section-panel-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(var(--space-xs));
}
</style>

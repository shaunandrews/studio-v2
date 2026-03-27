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
  animating?: boolean
}>()

const emit = defineEmits<{
  back: []
  'create-task': [context: { sectionId: string; role: string; htmlPreview: string; message: string }]
}>()

const { getContent } = useSiteDocument()
const siteContent = computed(() => getContent(props.siteId).value)

const iframeRef = ref<HTMLIFrameElement | null>(null)
const selectedSection = ref<{ id: string; role: string; htmlPreview: string } | null>(null)
const sectionRect = ref<{ top: number; left: number; width: number; height: number } | null>(null)
const taskMessage = ref('')
const taskInputRef = ref<InstanceType<typeof InputChatMini> | null>(null)

/** Screen-space position of the task input, anchored below the selected section */
const taskInputPos = computed(() => {
  if (!sectionRect.value || !iframeRef.value) return null
  const iframeEl = iframeRef.value
  const iframeRect = iframeEl.getBoundingClientRect()
  const parentRect = iframeEl.closest('.section-view')?.getBoundingClientRect()
  if (!parentRect) return null

  const sr = sectionRect.value
  // Section rect is relative to iframe viewport, translate to parent-relative coords
  const x = iframeRect.left - parentRect.left + sr.left + sr.width / 2
  const y = iframeRect.top - parentRect.top + sr.top + sr.height + 8

  return { x, y }
})

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
    sectionRect.value = e.data.rect || null
    taskMessage.value = ''
    setTimeout(() => taskInputRef.value?.focus(), 50)
  }
  if (e.data.type === 'section-rect-update') {
    if (selectedSection.value && e.data.sectionId === selectedSection.value.id) {
      sectionRect.value = e.data.rect || null
    }
  }
  if (e.data.type === 'section-deselect') {
    selectedSection.value = null
    sectionRect.value = null
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

    var rect = sectionEl.getBoundingClientRect();
    window.parent.postMessage({
      type: 'section-select',
      sectionId: sectionId,
      role: role,
      htmlPreview: preview,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
    }, '*');
  }, true);

  // Update position on scroll so the floating input follows the section
  window.addEventListener('scroll', function() {
    if (!selected) return;
    var rect = selected.getBoundingClientRect();
    window.parent.postMessage({
      type: 'section-rect-update',
      sectionId: selected.getAttribute('data-section'),
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
    }, '*');
  }, true);
})();
<\/script>
`
</script>

<template>
  <PaneGroup class="section-view">
    <Pane fit class="section-toolbar" :class="{ 'is-animating': animating }">
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

    <!-- Floating task input anchored to selected section -->
    <Transition name="section-panel">
      <div v-if="selectedSection && taskInputPos" class="section-panel" :style="{ left: taskInputPos.x + 'px', top: taskInputPos.y + 'px' }" @click.stop>
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

.section-toolbar {
  transition: opacity var(--duration-moderate) var(--ease-out);
}

.section-toolbar.is-animating {
  opacity: 0;
}

.section-view-iframe {
  flex: 1;
  width: 100%;
  border: none;
}

/* ── Floating section panel ── */

.section-panel {
  position: absolute;
  z-index: 10;
  transform: translateX(-50%);
  width: 240px;
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
  transform: translateX(-50%) translateY(calc(-1 * var(--space-xs)));
}
</style>

/**
 * Tour Composable
 *
 * Manages guided tour state — step progression, target element tracking,
 * and reactive bounding rect updates for the spotlight overlay.
 *
 * Module-level singleton (same pattern as useInputActions).
 */

import { ref, computed } from 'vue'

export interface TourStep {
  id: string
  selector: string           // CSS selector like [data-tour="..."]
  title: string
  description: string
}

const STEPS: TourStep[] = [
  {
    id: 'sidebar',
    selector: '.project-list.mode-list .project-item',
    title: 'Your projects',
    description: 'Your projects live here. Click to switch between them.',
  },
  {
    id: 'chat',
    selector: '[data-tour="chat"]',
    title: 'Chat with Kit',
    description: 'Chat with Kit to build and customize your site. Ask anything.',
  },
  {
    id: 'input',
    selector: '[data-tour="input"]',
    title: 'Type or tap',
    description: 'Type here or use the numbered shortcuts. Kit suggests actions as you go.',
  },
  {
    id: 'preview',
    selector: '[data-tour="preview"]',
    title: 'Live preview',
    description: 'Live preview of your site. Changes appear here in real time.',
  },
  {
    id: 'skills',
    selector: '[data-tour="skills"]',
    title: 'Skills',
    description: 'Enable skills to give Kit new abilities — SEO, security, design, and more.',
  },
  {
    id: 'model',
    selector: '[data-tour="model"]',
    title: 'AI model',
    description: 'Choose which AI model powers Kit. Different models, different strengths.',
  },
]

// Singleton state (module-level, shared across all consumers)
const active = ref(false)
const currentIndex = ref(0)
const targetRect = ref<DOMRect | null>(null)

let resizeObserver: ResizeObserver | null = null
let targetEl: Element | null = null

function updateTargetRect() {
  if (!targetEl) {
    targetRect.value = null
    return
  }
  targetRect.value = targetEl.getBoundingClientRect()
}

function observeTarget(el: Element | null) {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  targetEl = el
  if (!el) {
    targetRect.value = null
    return
  }
  updateTargetRect()
  resizeObserver = new ResizeObserver(updateTargetRect)
  resizeObserver.observe(el)
}

function resolveStep() {
  const step = STEPS[currentIndex.value]
  if (!step) return
  const el = document.querySelector(step.selector)
  if (!el) {
    // Element not visible -- skip forward
    if (currentIndex.value < STEPS.length - 1) {
      currentIndex.value++
      resolveStep()
    } else {
      stop()
    }
    return
  }
  observeTarget(el)
}

function start() {
  currentIndex.value = 0
  active.value = true
  resolveStep()
  window.addEventListener('scroll', updateTargetRect, true)
  window.addEventListener('resize', updateTargetRect)
}

function stop() {
  active.value = false
  observeTarget(null)
  window.removeEventListener('scroll', updateTargetRect, true)
  window.removeEventListener('resize', updateTargetRect)
}

function next() {
  if (currentIndex.value < STEPS.length - 1) {
    currentIndex.value++
    resolveStep()
  } else {
    stop()
  }
}

function back() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    resolveStep()
  }
}

export function useTour() {
  const currentStep = computed(() => STEPS[currentIndex.value] ?? null)
  const totalSteps = STEPS.length
  const isFirst = computed(() => currentIndex.value === 0)
  const isLast = computed(() => currentIndex.value === STEPS.length - 1)

  return {
    active,
    currentStep,
    currentIndex,
    totalSteps,
    targetRect,
    isFirst,
    isLast,
    start,
    stop,
    next,
    back,
  }
}

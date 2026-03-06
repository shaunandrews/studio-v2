<script setup lang="ts">
/**
 * SpotlightTour — guided tour overlay with spotlight cutout and tooltip card.
 *
 * Teleported to <body>. Uses useTour() for all state.
 *
 * The "cutout" trick: a transparent div sits at the target's position with a
 * massive box-shadow (9999px) that covers the entire viewport, creating a
 * dimming effect everywhere EXCEPT over the target element.
 */
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import Button from '@/components/primitives/Button.vue'
import { useTour } from '@/data/useTour'

const { active, currentStep, currentIndex, totalSteps, targetRect, isFirst, isLast, next, back, stop } = useTour()

const PAD = 8   // px padding around target element in the cutout
const GAP = 12  // px gap between cutout edge and tooltip
const EDGE = 16 // px minimum distance from viewport edges
const TOOLTIP_W = 320

// Measure the actual tooltip height after render
const tooltipRef = ref<HTMLElement | null>(null)
const tooltipH = ref(180) // sensible default before first measure

watch([currentIndex, active], () => {
  nextTick(() => {
    if (tooltipRef.value) {
      tooltipH.value = tooltipRef.value.offsetHeight
    }
  })
})

// Cutout position derived from targetRect
const cutoutStyle = computed(() => {
  if (!targetRect.value) return {}
  const r = targetRect.value
  return {
    position: 'fixed' as const,
    top: `${r.top - PAD}px`,
    left: `${r.left - PAD}px`,
    width: `${r.width + PAD * 2}px`,
    height: `${r.height + PAD * 2}px`,
    borderRadius: 'var(--radius-m)',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
    background: 'transparent',
    pointerEvents: 'none' as const,
    zIndex: '10000',
    transition: 'top var(--duration-slow) var(--ease-in-out), left var(--duration-slow) var(--ease-in-out), width var(--duration-slow) var(--ease-in-out), height var(--duration-slow) var(--ease-in-out)',
  }
})

type Placement = 'bottom' | 'top' | 'right' | 'left'

/**
 * Pick the best side for the tooltip: bottom → right → top → left.
 * Uses the first side where the tooltip actually fits. If none fit,
 * picks whichever has the most relative room.
 */
function bestPlacement(r: DOMRect): Placement {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const th = tooltipH.value

  const candidates: { p: Placement; space: number; needed: number }[] = [
    { p: 'bottom', space: vh - r.bottom - PAD,  needed: th + GAP },
    { p: 'right',  space: vw - r.right - PAD,   needed: TOOLTIP_W + GAP },
    { p: 'top',    space: r.top - PAD,           needed: th + GAP },
    { p: 'left',   space: r.left - PAD,          needed: TOOLTIP_W + GAP },
  ]

  const fits = candidates.find(c => c.space >= c.needed)
  if (fits) return fits.p

  // Nothing fits perfectly — pick the one with the best ratio
  candidates.sort((a, b) => (b.space / b.needed) - (a.space / a.needed))
  return candidates[0].p
}

/** Clamp a value between min and max */
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }

// Tooltip position — tries all 4 sides, picks the best fit
const tooltipStyle = computed(() => {
  if (!targetRect.value) return {}
  const r = targetRect.value
  const vw = window.innerWidth
  const vh = window.innerHeight
  const th = tooltipH.value
  const placement = bestPlacement(r)

  const style: Record<string, string> = {
    position: 'fixed',
    zIndex: '10001',
    width: `${TOOLTIP_W}px`,
    transition: 'top var(--duration-slow) var(--ease-in-out), left var(--duration-slow) var(--ease-in-out)',
  }

  if (placement === 'bottom') {
    style.top = `${r.bottom + PAD + GAP}px`
    style.left = `${clamp(r.left + r.width / 2 - TOOLTIP_W / 2, EDGE, vw - EDGE - TOOLTIP_W)}px`
  } else if (placement === 'top') {
    style.top = `${clamp(r.top - PAD - GAP - th, EDGE, vh - EDGE - th)}px`
    style.left = `${clamp(r.left + r.width / 2 - TOOLTIP_W / 2, EDGE, vw - EDGE - TOOLTIP_W)}px`
  } else if (placement === 'right') {
    style.left = `${r.right + PAD + GAP}px`
    style.top = `${clamp(r.top + r.height / 2 - th / 2, EDGE, vh - EDGE - th)}px`
  } else {
    // left
    style.left = `${clamp(r.left - PAD - GAP - TOOLTIP_W, EDGE, vw - EDGE - TOOLTIP_W)}px`
    style.top = `${clamp(r.top + r.height / 2 - th / 2, EDGE, vh - EDGE - th)}px`
  }

  return style
})

function onKeydown(e: KeyboardEvent) {
  if (!active.value) return
  if (e.key === 'ArrowRight' || e.key === 'Enter') {
    e.preventDefault()
    next()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    back()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    stop()
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="tour">
      <div v-if="active && targetRect" class="tour-overlay" @click.self="stop">
        <div class="tour-cutout" :style="cutoutStyle" />
        <div ref="tooltipRef" class="tour-tooltip vstack gap-xs" :style="tooltipStyle">
          <div class="tour-tooltip__title">{{ currentStep?.title }}</div>
          <div class="tour-tooltip__desc">{{ currentStep?.description }}</div>
          <div class="tour-tooltip__footer hstack justify-between align-center">
            <span class="tour-tooltip__step">{{ currentIndex + 1 }} of {{ totalSteps }}</span>
            <div class="hstack gap-xxs">
              <Button v-if="isFirst" variant="tertiary" label="Skip" size="small" @click="stop" />
              <Button v-else variant="tertiary" label="Back" size="small" @click="back" />
              <Button variant="primary" :label="isLast ? 'Done' : 'Next'" size="small" @click="next" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tour-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  /* Overlay is transparent — the cutout's box-shadow IS the dimming effect */
}

.tour-tooltip {
  background: var(--color-frame-bg);
  border: 1px solid var(--color-frame-border);
  border-radius: var(--radius-m);
  padding: var(--space-m);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: top var(--duration-slow) var(--ease-in-out),
    left var(--duration-slow) var(--ease-in-out);
}

.tour-tooltip__title {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-frame-fg);
}

.tour-tooltip__desc {
  font-size: var(--font-size-s);
  color: var(--color-frame-fg-secondary);
  line-height: 1.5;
}

.tour-tooltip__footer {
  padding-block-start: var(--space-xxs);
}

.tour-tooltip__step {
  font-size: var(--font-size-xs);
  color: var(--color-frame-fg-muted);
}

/* Entry/exit transition for the entire overlay */
.tour-enter-active,
.tour-leave-active {
  transition: opacity var(--duration-fast) var(--ease-default);
}

.tour-enter-from,
.tour-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  opacity?: number
  repulsion?: number
  rippleStrength?: number
  spacing?: number
  crossSize?: number
  crossThickness?: number
}>(), {
  opacity: 1,
  repulsion: 6,
  rippleStrength: 6,
  spacing: 32,
  crossSize: 5,
  crossThickness: 0.75,
})

const canvas = ref<HTMLCanvasElement | null>(null)
const SPRING_K = 0.07
const DAMPING = 0.8
const SLEEP_EPS = 0.08

const RADIUS_BASE = 150
const RADIUS_EXPANDED = 30
const RADIUS_EXPAND_SPEED = 0.28
const RADIUS_CONTRACT_SPEED = 0.10

const RIPPLE_SPEED = 9
const RIPPLE_HALF_WIDTH = 32

const INTRO_SPEED = 18
const INTRO_FADE_WIDTH = 80

const TARGET_MS = 1000 / 60

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
}

let ctx: CanvasRenderingContext2D | null = null
let color = ''
let mouseX = -9999
let mouseY = -9999
let rafId: number | null = null
let lastTimestamp = 0

let currentRadius = RADIUS_BASE
let targetRadius = RADIUS_BASE
let ripples: Ripple[] = []

let introRadius = 0
let introComplete = false

let cols = 0
let rows = 0
let ox: Float32Array
let oy: Float32Array
let vx: Float32Array
let vy: Float32Array

function readColor() {
  if (!canvas.value) return
  color = getComputedStyle(canvas.value).color
}

function initDots() {
  if (!canvas.value) return
  cols = Math.ceil(canvas.value.offsetWidth / props.spacing) + 1
  rows = Math.ceil(canvas.value.offsetHeight / props.spacing) + 1
  const n = cols * rows
  ox = new Float32Array(n)
  oy = new Float32Array(n)
  vx = new Float32Array(n)
  vy = new Float32Array(n)
}

function tick(timestamp: number): boolean {
  if (!ctx || !canvas.value) return false
  const rawDt = lastTimestamp === 0 ? TARGET_MS : timestamp - lastTimestamp
  lastTimestamp = timestamp
  const dt = Math.min(rawDt / TARGET_MS, 3)

  const cssW = canvas.value.offsetWidth
  const cssH = canvas.value.offsetHeight
  ctx.clearRect(0, 0, cssW, cssH)
  ctx.fillStyle = color

  const expandFactor = 1 - Math.pow(1 - RADIUS_EXPAND_SPEED, dt)
  const contractFactor = 1 - Math.pow(1 - RADIUS_CONTRACT_SPEED, dt)
  const lerpFactor = currentRadius < targetRadius ? expandFactor : contractFactor
  currentRadius += (targetRadius - currentRadius) * lerpFactor
  const radiusAnimating = Math.abs(currentRadius - targetRadius) > 0.3

  if (!introComplete) {
    introRadius += INTRO_SPEED * dt
    const diag = Math.sqrt(cssW * cssW + cssH * cssH)
    if (introRadius > diag + INTRO_FADE_WIDTH) {
      introComplete = true
      ctx.globalAlpha = 1
    }
  }

  const dampFactor = Math.pow(DAMPING, dt)
  const cursorActive = mouseX > -9998
  let anyActive = false

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const rx = c * props.spacing
      const ry = r * props.spacing

      let dvx = vx[i]
      let dvy = vy[i]
      let dox = ox[i]
      let doy = oy[i]

      // Hover / drag repulsion
      if (cursorActive) {
        const cx = rx + dox
        const cy = ry + doy
        const ddx = cx - mouseX
        const ddy = cy - mouseY
        const dist = Math.sqrt(ddx * ddx + ddy * ddy)
        if (dist < currentRadius && dist > 0.5) {
          const force = props.repulsion * (1 - dist / currentRadius) / dist
          dvx += force * ddx * dt
          dvy += force * ddy * dt
        }
      }

      // Ripple wavefronts
      for (const ripple of ripples) {
        const cx = rx + dox
        const cy = ry + doy
        const ddx = cx - ripple.x
        const ddy = cy - ripple.y
        const dist = Math.sqrt(ddx * ddx + ddy * ddy)
        if (dist > 0.5) {
          const delta = dist - ripple.radius
          const falloff = Math.exp(-0.5 * (delta / RIPPLE_HALF_WIDTH) ** 2)
          const force = props.rippleStrength * falloff / dist
          dvx += force * ddx * dt
          dvy += force * ddy * dt
        }
      }

      // Spring toward rest position
      dvx += SPRING_K * -dox * dt
      dvy += SPRING_K * -doy * dt

      // Framerate-independent damping
      dvx *= dampFactor
      dvy *= dampFactor

      // Integrate
      dox += dvx * dt
      doy += dvy * dt

      ox[i] = dox
      oy[i] = doy
      vx[i] = dvx
      vy[i] = dvy

      if (
        Math.abs(dvx) > SLEEP_EPS ||
        Math.abs(dvy) > SLEEP_EPS ||
        Math.abs(dox) > SLEEP_EPS ||
        Math.abs(doy) > SLEEP_EPS
      ) {
        anyActive = true
      }
    }
  }

  // Draw dotted connecting lines between adjacent crosses
  ctx.strokeStyle = color
  ctx.lineWidth = props.crossThickness
  ctx.setLineDash([1, 4])
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const x = c * props.spacing + ox[i]
      const y = r * props.spacing + oy[i]

      if (!introComplete) {
        const distFromCorner = Math.sqrt((c * props.spacing) ** 2 + (r * props.spacing) ** 2)
        ctx.globalAlpha = Math.max(0, Math.min(1, (introRadius - distFromCorner) / INTRO_FADE_WIDTH))
      }

      // Horizontal line to right neighbor
      if (c < cols - 1) {
        const ni = r * cols + (c + 1)
        const nx = (c + 1) * props.spacing + ox[ni]
        const ny = r * props.spacing + oy[ni]
        ctx.beginPath()
        ctx.moveTo(x + props.crossSize, y)
        ctx.lineTo(nx - props.crossSize, ny)
        ctx.stroke()
      }
      // Vertical line to bottom neighbor
      if (r < rows - 1) {
        const ni = (r + 1) * cols + c
        const nx = c * props.spacing + ox[ni]
        const ny = (r + 1) * props.spacing + oy[ni]
        ctx.beginPath()
        ctx.moveTo(x, y + props.crossSize)
        ctx.lineTo(nx, ny - props.crossSize)
        ctx.stroke()
      }
    }
  }
  ctx.setLineDash([])

  // Draw crosses on top
  ctx.fillStyle = color
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const x = c * props.spacing + ox[i]
      const y = r * props.spacing + oy[i]

      if (!introComplete) {
        const distFromCorner = Math.sqrt((c * props.spacing) ** 2 + (r * props.spacing) ** 2)
        ctx.globalAlpha = Math.max(0, Math.min(1, (introRadius - distFromCorner) / INTRO_FADE_WIDTH))
      }

      ctx.fillRect(x - props.crossSize, y - props.crossThickness / 2, props.crossSize * 2, props.crossThickness)
      ctx.fillRect(x - props.crossThickness / 2, y - props.crossSize, props.crossThickness, props.crossSize * 2)
    }
  }

  if (!introComplete) ctx.globalAlpha = 1

  for (const ripple of ripples) ripple.radius += RIPPLE_SPEED * dt
  ripples = ripples.filter(rip => rip.radius < rip.maxRadius)

  return anyActive || cursorActive || radiusAnimating || ripples.length > 0 || !introComplete
}

function loop(timestamp: number) {
  if (tick(timestamp)) {
    rafId = requestAnimationFrame(loop)
  } else {
    rafId = null
    lastTimestamp = 0
  }
}

function ensureLoop() {
  if (rafId === null) {
    lastTimestamp = 0
    rafId = requestAnimationFrame(loop)
  }
}

function resize() {
  if (!canvas.value) return
  const dpr = window.devicePixelRatio || 1
  canvas.value.width = Math.round(canvas.value.offsetWidth * dpr)
  canvas.value.height = Math.round(canvas.value.offsetHeight * dpr)
  ctx = canvas.value.getContext('2d')!
  ctx.scale(dpr, dpr)
  readColor()
  initDots()
  ensureLoop()
}

function onMouseMove(e: MouseEvent) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height
  mouseX = inside ? x : -9999
  mouseY = inside ? y : -9999
  ensureLoop()
}

function onMouseDown(e: MouseEvent) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
    targetRadius = RADIUS_EXPANDED
    ensureLoop()
  }
}

function onMouseUp(e: MouseEvent) {
  if (!canvas.value) return
  targetRadius = RADIUS_BASE
  if (mouseX > -9998) {
    const rect = canvas.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const diag = Math.sqrt(rect.width ** 2 + rect.height ** 2)
    ripples.push({
      x,
      y,
      radius: currentRadius * 0.85,
      maxRadius: diag + RIPPLE_HALF_WIDTH * 4,
    })
  }
  ensureLoop()
}

let resizeObserver: ResizeObserver | null = null
let themeObserver: MutationObserver | null = null
let mediaQuery: MediaQueryList | null = null

onMounted(() => {
  if (!canvas.value) return
  resize()

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mousedown', onMouseDown)
  document.addEventListener('mouseup', onMouseUp)

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas.value)

  themeObserver = new MutationObserver(readColor)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', readColor)
})

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mousedown', onMouseDown)
  document.removeEventListener('mouseup', onMouseUp)
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  mediaQuery?.removeEventListener('change', readColor)
})
</script>

<template>
  <canvas ref="canvas" class="dot-grid" :style="{ opacity: props.opacity }" />
</template>

<style scoped>
.dot-grid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>

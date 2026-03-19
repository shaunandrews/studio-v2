<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animId = 0
let running = false
let mouse = { x: -1000, y: -1000 }
let dots: { baseX: number; baseY: number; x: number; y: number; vx: number; vy: number }[] = []

const props = defineProps<{
  restColor?: string
  activeColor?: string
}>()

const SPACING = 28
const DOT_RADIUS = 2
const INFLUENCE = 100
const PUSH_STRENGTH = 18
const RETURN_SPEED = 0.08
const DAMPING = 0.85
const REST_THRESHOLD = 0.1
const GLOW_RADIUS = 180 // Radius for the light-up glow around cursor

function parseRGBA(color: string): { r: number; g: number; b: number; a: number } {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (match) {
    return { r: +match[1], g: +match[2], b: +match[3], a: match[4] != null ? +match[4] : 1 }
  }
  return { r: 255, g: 255, b: 255, a: 0.15 }
}

function initDots(w: number, h: number) {
  dots = []
  const cols = Math.ceil(w / SPACING) + 2
  const rows = Math.ceil(h / SPACING) + 2
  const offsetX = (w - (cols - 1) * SPACING) / 2
  const offsetY = (h - (rows - 1) * SPACING) / 2

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offsetX + c * SPACING
      const y = offsetY + r * SPACING
      dots.push({ baseX: x, baseY: y, x, y, vx: 0, vy: 0 })
    }
  }
}

function resize() {
  if (!canvas.value) return
  const el = canvas.value.parentElement!
  const dpr = window.devicePixelRatio || 1
  const w = el.clientWidth
  const h = el.clientHeight
  canvas.value.width = w * dpr
  canvas.value.height = h * dpr
  canvas.value.style.width = w + 'px'
  canvas.value.style.height = h + 'px'
  ctx = canvas.value.getContext('2d')!
  ctx.scale(dpr, dpr)
  initDots(w, h)
  if (running) return // loop will redraw on next tick
  drawStatic()
}

function startLoop() {
  if (running) return
  running = true
  tick()
}

function getColors() {
  const rest = props.restColor ?? 'rgba(255, 255, 255, 0.15)'
  const active = props.activeColor ?? 'rgba(255, 255, 255, 0.8)'
  return { rest, active }
}

function drawGrid(color: string) {
  if (!ctx || !canvas.value) return
  const w = canvas.value.clientWidth
  const h = canvas.value.clientHeight
  const cols = Math.ceil(w / SPACING) + 2
  const rows = Math.ceil(h / SPACING) + 2
  const offsetX = (w - (cols - 1) * SPACING) / 2
  const offsetY = (h - (rows - 1) * SPACING) / 2

  // Parse color for line use at lower opacity
  const parsed = parseRGBA(color)
  const lineColor = `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${parsed.a * 1.2})`

  ctx.setLineDash([2, 4])
  ctx.lineWidth = 1
  ctx.strokeStyle = lineColor

  // Horizontal lines
  for (let r = 0; r < rows; r++) {
    const y = offsetY + r * SPACING
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // Vertical lines
  for (let c = 0; c < cols; c++) {
    const x = offsetX + c * SPACING
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }

  ctx.setLineDash([])
}

function drawStatic() {
  if (!ctx || !canvas.value) return
  const w = canvas.value.clientWidth
  const h = canvas.value.clientHeight
  const { rest } = getColors()
  ctx.clearRect(0, 0, w, h)
  drawGrid(rest)
  for (const dot of dots) {
    ctx.beginPath()
    ctx.arc(dot.baseX, dot.baseY, DOT_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = rest
    ctx.fill()
  }
}

function tick() {
  if (!ctx || !canvas.value) return
  const w = canvas.value.clientWidth
  const h = canvas.value.clientHeight

  ctx.clearRect(0, 0, w, h)

  const { rest, active } = getColors()
  drawGrid(rest)
  // Parse rgba values for interpolation
  const restParsed = parseRGBA(rest)
  const activeParsed = parseRGBA(active)

  let totalEnergy = 0

  for (const dot of dots) {
    // Mouse repulsion
    const dx = dot.x - mouse.x
    const dy = dot.y - mouse.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < INFLUENCE && dist > 0) {
      const force = (1 - dist / INFLUENCE) * PUSH_STRENGTH
      const angle = Math.atan2(dy, dx)
      dot.vx += Math.cos(angle) * force * 0.3
      dot.vy += Math.sin(angle) * force * 0.3
    }

    // Spring back to base
    dot.vx += (dot.baseX - dot.x) * RETURN_SPEED
    dot.vy += (dot.baseY - dot.y) * RETURN_SPEED

    // Damping
    dot.vx *= DAMPING
    dot.vy *= DAMPING

    // Integrate
    dot.x += dot.vx
    dot.y += dot.vy

    // Track energy (velocity + displacement)
    const displacement = Math.sqrt(
      (dot.x - dot.baseX) ** 2 + (dot.y - dot.baseY) ** 2
    )
    totalEnergy += Math.abs(dot.vx) + Math.abs(dot.vy) + displacement

    // Proximity glow: blend rest→active based on distance to cursor
    const glowDist = Math.sqrt(
      (dot.baseX - mouse.x) ** 2 + (dot.baseY - mouse.y) ** 2
    )
    const glow = glowDist < GLOW_RADIUS ? 1 - glowDist / GLOW_RADIUS : 0
    const t = Math.max(glow, Math.min(displacement * 0.03, 1))

    const r = Math.round(restParsed.r + (activeParsed.r - restParsed.r) * t)
    const g = Math.round(restParsed.g + (activeParsed.g - restParsed.g) * t)
    const b = Math.round(restParsed.b + (activeParsed.b - restParsed.b) * t)
    const a = restParsed.a + (activeParsed.a - restParsed.a) * t

    // Draw
    const scale = Math.min(1 + displacement * 0.04, 2.5)

    ctx.beginPath()
    ctx.arc(dot.x, dot.y, DOT_RADIUS * scale, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
    ctx.fill()
  }

  // Stop loop when settled
  if (totalEnergy < REST_THRESHOLD && mouse.x === -1000) {
    // Snap to grid and draw one clean frame
    for (const dot of dots) {
      dot.x = dot.baseX
      dot.y = dot.baseY
      dot.vx = 0
      dot.vy = 0
    }
    drawStatic()
    running = false
    return
  }

  animId = requestAnimationFrame(tick)
}

function onPointerMove(e: PointerEvent) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  mouse.x = e.clientX - rect.left
  mouse.y = e.clientY - rect.top
  startLoop()
}

function onPointerLeave() {
  mouse.x = -1000
  mouse.y = -1000
  // Keep running so dots settle back
}

onMounted(() => {
  resize()
  drawStatic() // Draw initial resting state without starting the loop
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <canvas
    ref="canvas"
    class="dot-grid"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  />
</template>

<style scoped>
.dot-grid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>

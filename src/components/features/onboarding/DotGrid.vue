<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animId = 0
let mouse = { x: -1000, y: -1000 }
let dots: { baseX: number; baseY: number; x: number; y: number; vx: number; vy: number }[] = []

const SPACING = 28
const DOT_RADIUS = 2
const INFLUENCE = 120
const PUSH_STRENGTH = 40
const RETURN_SPEED = 0.08
const DAMPING = 0.85

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
}

function tick() {
  if (!ctx || !canvas.value) return
  const w = canvas.value.clientWidth
  const h = canvas.value.clientHeight

  ctx.clearRect(0, 0, w, h)

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

    // Draw
    const displacement = Math.sqrt(
      (dot.x - dot.baseX) ** 2 + (dot.y - dot.baseY) ** 2
    )
    const scale = Math.min(1 + displacement * 0.04, 2.5)
    const alpha = 0.2 + Math.min(displacement * 0.02, 0.6)

    ctx.beginPath()
    ctx.arc(dot.x, dot.y, DOT_RADIUS * scale, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.fill()
  }

  animId = requestAnimationFrame(tick)
}

function onPointerMove(e: PointerEvent) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  mouse.x = e.clientX - rect.left
  mouse.y = e.clientY - rect.top
}

function onPointerLeave() {
  mouse.x = -1000
  mouse.y = -1000
}

onMounted(() => {
  resize()
  tick()
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

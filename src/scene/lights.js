import { CanvasTexture } from 'three'

const clamp = (x, a, b) => Math.min(b, Math.max(a, x))

// Light rects are in photo UV, origin top-left.
export function lightRectToPixels({ x, y, w, h }, width, height) {
  const x0 = clamp(Math.floor(x * width), 0, width - 1), y0 = clamp(Math.floor(y * height), 0, height - 1)
  return {
    x0, y0,
    x1: clamp(Math.max(Math.round((x + w) * width), x0 + 1), 0, width),
    y1: clamp(Math.max(Math.round((y + h) * height), y0 + 1), 0, height),
  }
}

function seeded(a) {
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
}
const r4 = v => Math.round(v * 1e4) / 1e4

// Catalog lights: plain rects, facade zones split into window grids, or floodlit monuments.
// About a third of windows stay dark; the choice is seeded so a scene always looks the same.
export function expandLights(lights = [], rand = seeded(7)) {
  const out = []
  const maybe = rect => { const k = rand(); if (k >= .3) out.push({ ...rect, level: .45 + .55 * k }) }
  for (const { x, y, w, h, grid, flood } of lights) {
    if (flood) out.push({ x, y, w, h, level: 1, flood: true })
    else if (grid) {
      const [cols, rows] = grid, cw = w / cols, ch = h / rows
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        maybe({ x: r4(x + c * cw + cw * .275), y: r4(y + r * ch + ch * .225), w: r4(cw * .45), h: r4(ch * .55) })
      }
    } else maybe({ x, y, w, h })
  }
  return out
}

// Mask of what lights up at night, softly blurred: windows and lamps in red, floodlit stone in green.
export function lightsToMask(lights, width = 512, height = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const g = canvas.getContext('2d')
  g.fillStyle = '#000'; g.fillRect(0, 0, width, height)
  g.globalCompositeOperation = 'lighter'
  for (const r of expandLights(lights)) {
    const b = lightRectToPixels(r, width, height)
    // Floodlight beams fade out at their edges; windows stay crisp.
    g.filter = r.flood ? `blur(${Math.round(width / 50)}px)` : 'blur(2px)'
    g.fillStyle = r.flood ? 'rgb(0,255,0)' : `rgb(${Math.round(255 * r.level)},0,0)`
    g.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0)
  }
  const texture = new CanvasTexture(canvas)
  texture.flipY = true
  return texture
}

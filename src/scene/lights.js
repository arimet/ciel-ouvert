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

// Mask of the windows and lamps that light up at night (brightness in red), softly blurred.
export function lightsToMask(lights, width = 512, height = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const g = canvas.getContext('2d')
  g.fillStyle = '#000'; g.fillRect(0, 0, width, height)
  g.filter = 'blur(2px)'
  // Not every window is lit, and lit ones differ: deterministic so a scene always looks the same.
  lights.forEach((r, i) => {
    const k = Math.sin(i * 12.9898) * 43758.5453 % 1
    if (Math.abs(k) < .3) return
    const b = lightRectToPixels(r, width, height)
    g.fillStyle = `rgb(${Math.round(255 * (.45 + .55 * Math.abs(k)))},0,0)`
    g.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0)
  })
  const texture = new CanvasTexture(canvas)
  texture.flipY = true
  return texture
}

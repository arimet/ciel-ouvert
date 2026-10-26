import { CanvasTexture } from 'three'

// Distant lightning: short, thin, from under the clouds toward the horizon.
function makeBolt(W, H) {
  const top = H * (.12 + Math.random() * .1)
  const pts = [[W * (.2 + Math.random() * .6), top]], end = top + H * (.14 + Math.random() * .08)
  while (pts.at(-1)[1] < end) { const [x, y] = pts.at(-1); pts.push([x + (Math.random() - .5) * 14, y + 4 + Math.random() * 6]) }
  const k = 1 + (Math.random() * (pts.length - 3) | 0), branch = [pts[k]]
  for (let i = 0; i < 4; i++) { const [x, y] = branch.at(-1); branch.push([x + 3 + Math.random() * 8, y + 3 + Math.random() * 5]) }
  return [pts, branch]
}

// Birds and lightning drawn in 2D; the photo shader shows them in the sky only.
export function createOverlay() {
  const canvas = document.createElement('canvas')
  const g = canvas.getContext('2d')
  const texture = new CanvasTexture(canvas)
  const birds = Array.from({ length: 7 }, (_, i) => ({ x: -.1 - i * .05, y: .1 + Math.random() * .12, ph: Math.random() * 6, v: .03 + Math.random() * .01 }))
  let flash = 0, nextFlash = 2, bolt = null

  return {
    texture,
    resize(w, h) { canvas.width = w; canvas.height = h },
    // Returns the flash brightness for this frame (0 when no lightning).
    draw(dt, t, effects) {
      const W = canvas.width, H = canvas.height
      g.clearRect(0, 0, W, H)
      if (effects.birds > .5) {
        g.strokeStyle = 'rgba(20,20,25,1)'; g.lineWidth = 1.6; g.beginPath()
        for (const b of birds) {
          b.x += b.v * dt
          if (b.x > 1.15) { b.x = -.15 - Math.random() * .3; b.y = .08 + Math.random() * .14 }
          const x = b.x * W, y = (b.y + Math.sin(t * .7 + b.ph) * .01) * H, f = Math.sin(t * 9 + b.ph) * 4, s = 7
          g.moveTo(x - s, y - f); g.quadraticCurveTo(x - s / 2, y - f / 2 - 2, x, y); g.quadraticCurveTo(x + s / 2, y - f / 2 - 2, x + s, y - f)
        }
        g.stroke()
      }
      if (effects.storm > .5 && t > nextFlash) { flash = 1; nextFlash = t + 3 + Math.random() * 6 }
      flash = Math.max(0, flash - dt * 2.5)
      if (effects.storm > .5 && flash > .35) {
        bolt ??= makeBolt(W, H)
        g.save(); g.strokeStyle = '#f4f6ff'; g.shadowColor = '#b9c8ff'; g.shadowBlur = 6; g.lineJoin = 'round'
        bolt.forEach((line, i) => { g.lineWidth = i ? .6 : 1.2; g.beginPath(); line.forEach(([x, y], j) => j ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke() })
        g.restore()
      } else bolt = null
      texture.needsUpdate = true
      return flash > 0 ? flash * (Math.random() < .7 ? 1 : .2) : 0
    },
  }
}

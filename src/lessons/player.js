import { ANCHORS } from '../weather/anchors.js'
import { lerpParams } from '../weather/blend.js'
import { sunElevationDeg } from '../sky/sun.js'

// Production shows only what Anthony reviewed; dev shows drafts too.
export function listPublished(items, isProd) {
  return isProd ? items.filter(i => i.reviewed) : items
}

function merge(base, patch = {}) {
  const out = { ...base }
  for (const [k, v] of Object.entries(patch)) out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(base[k], v) : v
  return out
}

export function stepParams(step) {
  const a = ANCHORS[step.anchor ?? 'clear']
  return { sky: merge(a.sky, step.sky), effects: merge(a.effects, step.effects) }
}

// Runs a lesson over the live scene: each step tweens the sky to its own parameters.
export function createLessonPlayer({ apply, onStep, onStop }) {
  let lesson = null, index = 0, from = null, to = null, current = null, elapsed = 0, duration = 2

  const go = i => {
    index = Math.max(0, Math.min(lesson.steps.length - 1, i))
    const step = lesson.steps[index]
    from = current
    to = stepParams(step)
    elapsed = 0
    duration = from ? step.transition ?? 2 : 0
    onStep(step, index, lesson)
  }

  return {
    get index() { return index },
    get lesson() { return lesson },
    start(l) { lesson = l; current = null; go(0) },
    next() { if (lesson) go(index + 1) },
    prev() { if (lesson) go(index - 1) },
    stop() {
      if (!lesson) return
      lesson = null; current = null
      onStop()
    },
    tick(dt) {
      if (!lesson) return
      elapsed += dt
      const t = duration ? Math.min(1, elapsed / duration) : 1
      current = from ? lerpParams(from, to, t * t * (3 - 2 * t)) : to
      apply(current)
    },
  }
}

// Lesson moments: noon, midnight, or the sun 2° above the horizon (dawn rising, dusk setting),
// computed for the commune so a "dawn" step looks like dawn wherever it is.
export function lessonDate(time, lat, lon, base = new Date()) {
  const midnight = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()) - lon / 15 * 3600e3
  const at = hours => new Date(midnight + hours * 3600e3)
  if (time === 'day') return at(12)
  if (time === 'night') return at(24)
  const rising = time === 'dawn'
  for (let m = rising ? 0 : 12 * 60; m < (rising ? 12 * 60 : 24 * 60); m += 5) {
    const e = sunElevationDeg(at(m / 60), lat, lon)
    if (rising ? e >= 2 : e <= 2) return at(m / 60)
  }
  return at(rising ? 7 : 17)
}

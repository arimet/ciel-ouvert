const LEVELS = ['high', 'medium', 'low', 'low-half', 'photo-only']
const EPS = 1e-6

// Steps the cloud quality down until the frame rate holds; never steps back up (no oscillation).
export function createQualityController({ target = 30, floor = 20, window = 2, warmup = 1 } = {}) {
  let index = 0, warm = 0, time = 0, frames = 0
  return {
    get level() { return LEVELS[index] },
    frame(dt, hidden) {
      if (hidden || dt > .5 || index === LEVELS.length - 1) return null
      if (warm < warmup - EPS) { warm += dt; return null }
      time += dt; frames++
      if (time < window - EPS) return null
      const fps = frames / time
      time = 0; frames = 0
      const limit = LEVELS[index] === 'low-half' ? floor : target
      if (fps >= limit) return null
      index++
      return LEVELS[index]
    },
  }
}

export function hasWebGL2() {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

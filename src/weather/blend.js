import { ANCHORS } from './anchors.js'

const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }

export function lerpParams(a, b, t) {
  if (typeof a === 'number') return a + (b - a) * t
  if (Array.isArray(a)) return a.map((v, i) => lerpParams(v, b[i], t))
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  return Object.fromEntries([...keys].map(k => [k, k in a && k in b ? lerpParams(a[k], b[k], t) : k in b ? b[k] : a[k]]))
}

const isRain = w => (w.weatherCode >= 51 && w.weatherCode <= 67) || (w.weatherCode >= 80 && w.weatherCode <= 82) || w.precipitation > 0
const isSnow = w => (w.weatherCode >= 71 && w.weatherCode <= 77) || w.weatherCode === 85 || w.weatherCode === 86
const isStorm = w => w.weatherCode >= 95 && w.weatherCode <= 99

// Sequential lerps from the clear anchor keep every result between validated skies.
export function blendWeather(w, sunElevation) {
  let s = ANCHORS.cloudy
  if (w) {
    s = lerpParams(ANCHORS.clear, ANCHORS.cloudy, smoothstep(30, 80, Math.max(w.cloudLow, w.cloudMid, w.cloudHigh)))
    const snow = isSnow(w)
    if (snow || isRain(w)) {
      s = lerpParams(s, ANCHORS.rain, clamp(w.precipitation / 2, .3, 1))
      if (snow) s = { ...s, effects: { ...s.effects, rain: 0, snow: clamp(w.snowfall, .3, 1) } }
    }
    if (isStorm(w)) s = lerpParams(s, ANCHORS.storm, 1)
    const fog = w.weatherCode === 45 || w.weatherCode === 48 ? 1 : w.visibility != null ? clamp((2000 - w.visibility) / 1500, 0, 1) : 0
    s = lerpParams(s, ANCHORS.fog, fog)
  }

  // Time of day only touches the photo's light, never the clouds.
  const sunsetF = sunElevation >= -2 && sunElevation <= 8 ? 1 - Math.abs(sunElevation - 3) / 5 : 0
  const nightF = clamp(-sunElevation / 6, 0, 1)
  const sky = { ...s.sky }
  let effects = s.effects
  for (const [target, f] of [[ANCHORS.sunset, sunsetF], [ANCHORS.night, nightF]]) {
    if (f <= 0) continue
    effects = { ...effects, tint: lerpParams(effects.tint, target.effects.tint, f), night: lerpParams(effects.night, target.effects.night, f), birds: lerpParams(effects.birds, target.effects.birds, f) }
    sky.exposure = lerpParams(sky.exposure, target.sky.exposure, f)
  }

  if (w) {
    const toward = (w.windDirection + 180) * Math.PI / 180
    const speed = clamp(w.windSpeed / 20, .3, 3)
    sky.velocity = [Math.sin(toward) * speed, Math.cos(toward) * speed]
  }
  return { sky, effects }
}

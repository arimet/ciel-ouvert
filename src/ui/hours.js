import { weatherLabel } from './caption.js'

// Open-Meteo hours are local wall-clock times of the commune ("2026-10-27T18:00").
export function hourDate(time, utcOffset) {
  return new Date(Date.parse(`${time}:00Z`) - utcOffset * 1000)
}

export function hourLabel(time) {
  return `${Number(time.slice(11, 13))} h`
}

export function iconKind(code, isDay) {
  if (code === 0) return isDay ? 'sun' : 'moon'
  if (code <= 2) return isDay ? 'partly-day' : 'partly-night'
  if (code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'rain'
}

const CLOUD = '<path d="M7 19h10.5a4 4 0 0 0 .4-7.98A6 6 0 0 0 6.3 11.6 3.7 3.7 0 0 0 7 19z"/>'
const SMALL_CLOUD = '<path d="M9 20h9a3.3 3.3 0 0 0 .3-6.6 5 5 0 0 0-9.6.9A2.9 2.9 0 0 0 9 20z"/>'
const SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>'
const MOON = '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>'
const ICONS = {
  sun: SUN,
  moon: MOON,
  'partly-day': '<g transform="translate(-3 -4) scale(.75)">' + SUN + '</g>' + SMALL_CLOUD,
  'partly-night': '<g transform="translate(-3 -4) scale(.75)">' + MOON + '</g>' + SMALL_CLOUD,
  cloud: CLOUD,
  fog: '<path d="M4 8h16M3 12h18M5 16h14M8 20h8"/>',
  rain: '<g transform="translate(0 -3)">' + CLOUD + '</g><path d="M8 19l-1 3M12 19l-1 3M16 19l-1 3"/>',
  snow: '<g transform="translate(0 -3)">' + CLOUD + '</g><path d="M8 20.5h.01M12 21.5h.01M16 20.5h.01"/>',
  storm: '<g transform="translate(0 -3)">' + CLOUD + '</g><path d="M13 15l-3 4h4l-2 3.5"/>',
}

export function iconSvg(kind) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[kind]}</svg>`
}

// The day ahead, hour by hour. Picking an hour shows its forecast sky; the first one is "Maintenant".
export function renderHours(el, { hours, selected, onPick }) {
  el.replaceChildren(...hours.map((h, i) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.setAttribute('aria-pressed', String(i === selected))
    b.ariaLabel = `${i ? hourLabel(h.time) : 'Maintenant'}, ${Math.round(h.temperature)} degrés, ${weatherLabel(h.weatherCode)}`
    const rain = h.precipitationProbability >= 20 ? `${h.precipitationProbability} %` : ''
    b.innerHTML = `<span class="when">${i ? hourLabel(h.time) : 'Maintenant'}</span>${iconSvg(iconKind(h.weatherCode, h.isDay))}<span class="temp">${Math.round(h.temperature)}°</span><span class="pop">${rain}</span>`
    b.onclick = () => onPick(i)
    return b
  }))
}

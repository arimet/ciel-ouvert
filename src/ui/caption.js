const LABELS = [
  [[0], 'ciel dégagé'], [[1], 'peu nuageux'], [[2], 'partiellement nuageux'], [[3], 'couvert'],
  [[45, 48], 'brouillard'], [[51, 53, 55], 'bruine'], [[56, 57], 'bruine verglaçante'],
  [[61, 63, 65], 'pluie'], [[66, 67], 'pluie verglaçante'], [[71, 73, 75, 77], 'neige'],
  [[80, 81, 82], 'averses'], [[85, 86], 'averses de neige'], [[95], 'orage'], [[96, 99], 'orage avec grêle'],
]

export function weatherLabel(code) {
  return LABELS.find(([codes]) => codes.includes(code))?.[1] ?? ''
}

export function localTime(now, utcOffset) {
  const d = new Date(now.getTime() + utcOffset * 1000)
  return `${d.getUTCHours()} h ${String(d.getUTCMinutes()).padStart(2, '0')}`
}

export function captionText({ name, weather, error, now = new Date() }) {
  if (error) return `${name} · météo indisponible`
  if (!weather) return name
  return [name, localTime(now, weather.utcOffset), `${Math.round(weather.temperature)} °C`, weatherLabel(weather.weatherCode)].filter(Boolean).join(' · ')
}

export function showCaption(el, state) {
  el.textContent = captionText(state)
}

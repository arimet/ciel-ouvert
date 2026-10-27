// The page state lives in the URL: home, ?commune=<INSEE code>, or ?comprendre[=<lesson id>].
export function parseRoute(search) {
  const p = new URLSearchParams(search)
  const code = p.get('commune')
  if (code && /^[0-9AB]{5}$/i.test(code)) return { view: 'meteo', code: code.toUpperCase() }
  if (p.has('comprendre')) return { view: 'comprendre', lesson: p.get('comprendre') || null }
  return { view: 'home' }
}

export function routeSearch(route) {
  if (route.view === 'meteo') return `?commune=${route.code}`
  if (route.view === 'comprendre') return route.lesson ? `?comprendre=${encodeURIComponent(route.lesson)}` : '?comprendre'
  return ''
}

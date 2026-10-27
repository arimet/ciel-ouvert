import * as THREE from 'three'
import catalog from './places/catalog.json'
import { fetchCommune, resolveScene } from './places/communes.js'
import { createQualityController, hasWebGL2 } from './perf/quality.js'
import { createOverlay } from './scene/overlay.js'
import { createPhotoLayer } from './scene/photoLayer.js'
import { createSky } from './sky/sky.js'
import { sunElevationDeg } from './sky/sun.js'
import { creditHtml, showCaption } from './ui/caption.js'
import { renderLesson, renderLessons, renderSkyOfTheMoment } from './ui/comprendre.js'
import { hourDate, renderHours } from './ui/hours.js'
import { parseRoute, routeSearch } from './ui/route.js'
import { drawDiagrams } from './lessons/diagrams.js'
import { createLessonPlayer, lessonDate, listPublished } from './lessons/player.js'
import { LESSONS, SKY_TEXTS } from './lessons/content/index.js'
import { mountSearch } from './ui/search.js'
import { ANCHORS } from './weather/anchors.js'
import { blendWeather } from './weather/blend.js'
import { probableCloudFamilies, RULES_REVIEWED } from './weather/cloudFamily.js'
import { loadWeather } from './weather/openMeteo.js'

const $ = id => document.getElementById(id)
const view = $('view')
const BASE = import.meta.env.BASE_URL

// Review URL: ?scene=<id>&anchor=<key>&hour=<UTC hour on 26 Oct 2026>&snow=<0..1>&sign=<name>&tornado=<disparity>&quality=<level>
const params = new URLSearchParams(location.search)
const ANCHOR_HOURS = { clear: 13.5, cloudy: 12, rain: 11, storm: 15, fog: 8.6, sunset: 16.15, night: 21 }
const forcedAnchor = params.get('anchor')
const forcedHour = params.has('hour') || forcedAnchor ? Number(params.get('hour') ?? ANCHOR_HOURS[forcedAnchor]) : null
const forcedEntry = catalog.find(e => e.id === params.get('scene'))
const forcedQuality = params.get('quality')

// The home page and the lessons share one landscape, under its own sky.
const PLAIN_ENTRY = catalog.find(e => e.kind === 'plain')
const PLAIN = { code: 'plaine', name: PLAIN_ENTRY.name, lat: PLAIN_ENTRY.lat, lon: PLAIN_ENTRY.lon }
// Fair weather for the plain outside lessons: a few clouds, the real time of day.
const FAIR = { weatherCode: 1, cloudLow: 35, cloudMid: 10, cloudHigh: 25, precipitation: 0, snowfall: 0, visibility: 30000, windSpeed: 12, windDirection: 250 }

const storage = {
  get() { try { return JSON.parse(localStorage.getItem('commune')) } catch { return null } },
  set(c) { try { localStorage.setItem('commune', JSON.stringify(c)) } catch { /* private browsing */ } },
}

const state = { route: { view: 'home' }, commune: null, weather: null, error: false, families: null, hour: 0, why: false, effects: ANCHORS.cloudy.effects, token: 0, scene: null }
const published = items => listPublished(items, import.meta.env.PROD)

function setView(route) {
  state.route = route
  document.body.dataset.view = route.view
  const last = storage.get()
  for (const a of document.querySelectorAll('[data-route]')) {
    const target = a.dataset.route === 'meteo' && last ? { view: 'meteo', code: last.code } : { view: a.dataset.route, lesson: null }
    a.href = routeSearch(target) || location.pathname
    if (a.closest('.tabs')) a.ariaCurrent = a.dataset.route === route.view ? 'page' : null
  }
  $('home-last').replaceChildren(...(last ? [link(`Revenir à ${last.name} →`, { view: 'meteo', code: last.code })] : []))
}

function link(text, route) {
  const a = Object.assign(document.createElement('a'), { textContent: text, href: routeSearch(route) || location.pathname })
  a.onclick = e => { e.preventDefault(); go(route) }
  return a
}

// three.js needs WebGL2: without it, the photo alone with its own sky, still searchable and credited.
if (!hasWebGL2()) {
  const img = document.createElement('img')
  img.alt = ''
  img.style.objectFit = 'cover'
  view.append(img)
  const showPhoto = c => {
    const { entry } = c ? resolveScene(c, catalog) : { entry: PLAIN_ENTRY }
    img.src = BASE + entry.photo
    $('credit').innerHTML = creditHtml(entry.credit)
    $('caption').textContent = c?.name ?? ''
  }
  const pick = c => { storage.set(c); setView({ view: 'meteo', code: c.code }); showPhoto(c) }
  setView({ view: 'home' })
  showPhoto(null)
  mountSearch($('q'), $('suggestions'), pick)
  mountSearch($('home-q'), $('home-suggestions'), pick)
  throw new Error('WebGL2 unavailable: photo only')
}

const renderer = new THREE.WebGLRenderer({ depth: false })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.toneMapping = THREE.NoToneMapping
view.prepend(renderer.domElement)

const overlay = createOverlay()
const photo = createPhotoLayer(renderer, overlay.texture)
const sky = createSky(renderer, PLAIN_ENTRY)

const now = () => forcedHour == null ? new Date() : new Date(Date.UTC(2026, 9, 26, Math.floor(forcedHour), (forcedHour % 1) * 60))

function applySky() {
  const c = state.commune
  if (!c || player.lesson) return
  const meteo = state.route.view === 'meteo'
  const hour = meteo && state.hour ? state.weather?.hours[state.hour] : null
  const date = hour ? hourDate(hour.time, state.weather.utcOffset) : now()
  const { sky: skyParams, effects } = forcedAnchor
    ? ANCHORS[forcedAnchor]
    : blendWeather(meteo ? hour ?? state.weather : FAIR, sunElevationDeg(date, c.lat, c.lon))
  state.effects = { ...effects, ...(params.has('snow') && { snow: Number(params.get('snow')), rain: 0 }) }
  sky.setParams(skyParams)
  sky.setDate(date)
  photo.setEffects(state.effects)
  if (meteo) {
    const weather = hour ? { ...hour, utcOffset: state.weather.utcOffset } : state.weather
    showCaption($('caption'), { name: c.name, weather, error: state.error, now: date, forecast: !!hour })
  }
}

function renderPanel() {
  const panel = $('panel')
  if (state.route.view === 'meteo') {
    panel.hidden = !state.why
    $('why').ariaExpanded = String(state.why)
    const texts = Object.fromEntries(Object.entries(SKY_TEXTS).filter(([, t]) => !import.meta.env.PROD || t.reviewed))
    const families = import.meta.env.PROD && !RULES_REVIEWED && state.families ? [] : state.families
    renderSkyOfTheMoment(panel, { families, texts })
  } else if (state.route.view === 'comprendre') {
    panel.hidden = false
    if (!player.lesson) renderLessons(panel, { lessons: published(LESSONS), onLesson: l => go({ view: 'comprendre', lesson: l.id }) })
  } else panel.hidden = true
}

function renderDay() {
  const hours = state.route.view === 'meteo' ? state.weather?.hours ?? [] : []
  renderHours($('hours'), { hours, selected: state.hour, onPick: i => { state.hour = i; applySky(); renderDay() } })
}

const player = createLessonPlayer({
  apply({ sky: skyParams, effects }) {
    state.effects = effects
    sky.setParams(skyParams)
    photo.setEffects(effects)
  },
  onStep(step, index, lesson) {
    const c = state.commune
    // Lesson skies are daytime unless a step says otherwise, whatever the hour of the visit.
    sky.setDate(lessonDate(step.time ?? 'day', c.lat, c.lon))
    drawDiagrams($('diagrams'), step.diagrams, step.inset)
    photo.setTornado(step.tornado ?? null)
    const list = () => go({ view: 'comprendre', lesson: null })
    renderLesson($('panel'), { step, index, lesson, onPrev: () => player.prev(), onNext: () => player.next(), onStop: list })
  },
  onStop() {
    drawDiagrams($('diagrams'), [])
    photo.setTornado(null)
    applySky()
    renderPanel()
  },
})
addEventListener('keydown', e => {
  if (!player.lesson || e.target.closest?.('input')) return
  if (e.key === 'Escape') go({ view: 'comprendre', lesson: null })
  else if (e.key === 'ArrowRight') player.next()
  else if (e.key === 'ArrowLeft') player.prev()
})

async function refreshWeather() {
  const c = state.commune, token = state.token
  const { weather, error } = await loadWeather(c.lat, c.lon)
  if (token !== state.token) return
  // A failed refresh keeps the last good forecast rather than blanking the scene.
  if (weather || !state.weather) Object.assign(state, { weather, error, families: weather ? probableCloudFamilies(weather) : null, hour: 0 })
  applySky()
  renderDay()
  renderPanel()
}

// Loads a scene unless it is already on screen. Resolves false when a newer navigation took over.
async function showScene(entry, commune, signText) {
  const token = ++state.token
  const key = `${entry.id}|${signText}`
  Object.assign(state, { commune, weather: null, error: false, families: null, hour: 0 })
  applySky()
  if (state.scene !== key) {
    try {
      if (!await photo.load(entry, signText)) return false
    } catch {
      // Keep the previous photo rather than a half-switched scene.
      if (token === state.token) $('caption').textContent = `${commune.name} · photo indisponible`
      return false
    }
    if (token !== state.token) return false
    state.scene = key
    // Regional squares stand in for the commune: the sky (sun, time) is the commune's own.
    state.view = entry.kind === 'region' ? { ...entry, lat: commune.lat, lon: commune.lon } : entry
    placeSky()
    // On wide screens the caption and the day move to the side away from the town sign.
    document.body.dataset.sign = entry.sign && signText ? (entry.sign.foot[0] < .5 ? 'left' : 'right') : ''
    $('credit').innerHTML = creditHtml(entry.credit)
  }
  return token === state.token
}

async function render(route) {
  if (route.view !== 'comprendre' || route.lesson !== player.lesson?.id) player.stop()
  setView(route)
  $('caption').textContent = ''
  if (route.view === 'meteo') {
    let commune = state.commune?.code === route.code ? state.commune : storage.get()?.code === route.code ? storage.get() : null
    if (!commune) {
      $('caption').textContent = 'Chargement…'
      commune = await fetchCommune(route.code).catch(() => null)
      if (state.route !== route) return
      if (!commune) return go({ view: 'home' }, { replace: true })
    }
    const { entry, signText } = resolveScene(commune, catalog)
    renderPanel()
    renderDay()
    if (await showScene(entry, commune, signText)) refreshWeather()
    return
  }
  renderDay()
  renderPanel()
  if (!await showScene(PLAIN_ENTRY, PLAIN, null)) return
  const lesson = route.view === 'comprendre' && route.lesson && published(LESSONS).find(l => l.id === route.lesson)
  if (lesson && player.lesson !== lesson) player.start(lesson)
  else if (route.lesson && !lesson) go({ view: 'comprendre', lesson: null }, { replace: true })
}

function go(route, { replace = false } = {}) {
  history[replace ? 'replaceState' : 'pushState'](null, '', routeSearch(route) || location.pathname)
  return render(route)
}
addEventListener('popstate', () => render(parseRoute(location.search)))
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-route]')
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return
  e.preventDefault()
  go(parseRoute(new URL(a.href).search))
})

// The camera looks up further when the photo's sky reaches below the catalog pitch's horizon.
function placeSky() {
  if (state.view) sky.setView({ ...state.view, pitch: photo.pitchFor(state.view.pitch) })
}

function resize() {
  const w = view.clientWidth, h = view.clientHeight
  renderer.setSize(w, h, false)
  sky.resize(w, h)
  photo.resize(w, h)
  overlay.resize(w, h)
  placeSky()
}
addEventListener('resize', resize)
resize()

const pick = c => { storage.set(c); go({ view: 'meteo', code: c.code }) }
mountSearch($('q'), $('suggestions'), pick)
mountSearch($('home-q'), $('home-suggestions'), pick)
$('home-lessons').replaceChildren(...published(LESSONS).map(l => {
  const li = document.createElement('li')
  li.append(link(l.title, { view: 'comprendre', lesson: l.id }))
  return li
}))
$('why').onclick = () => { state.why = !state.why; renderPanel() }
setInterval(() => state.route.view === 'meteo' && state.commune && refreshWeather(), 15 * 60 * 1000)
setInterval(applySky, 60 * 1000)

const quality = createQualityController()
const clock = new THREE.Clock()
let first
if (forcedEntry) {
  const c = { code: forcedEntry.code, name: forcedEntry.name, region: forcedEntry.code, lat: forcedEntry.lat ?? 46.6, lon: forcedEntry.lon ?? 2.4 }
  setView({ view: forcedEntry.kind === 'plain' ? 'home' : 'meteo', code: c.code })
  first = showScene(forcedEntry, c, params.get('sign'))
} else first = render(parseRoute(location.search))
if (params.has('tornado')) first.then(() => photo.setTornado({ x: .55, disparity: Number(params.get('tornado')), intensity: 1 }))
// A sky that fails to load degrades to the photo alone; the loop always starts.
if (forcedQuality) sky.setQuality(forcedQuality)
Promise.all([sky.ready.catch(() => { photo.fallback = true }), first.catch(() => {})]).then(() => renderer.setAnimationLoop(() => {
  const raw = clock.getDelta(), dt = Math.min(raw, .05), t = clock.elapsedTime
  const level = forcedQuality ? null : quality.frame(raw, document.hidden)
  if (level === 'photo-only') photo.fallback = true
  else if (level) sky.setQuality(level)
  player.tick(dt)
  photo.setFlash(overlay.draw(dt, t, state.effects))
  if (!photo.fallback) sky.render(dt)
  photo.render(t)
}))

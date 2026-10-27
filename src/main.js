import * as THREE from 'three'
import catalog from './places/catalog.json'
import { resolveScene } from './places/communes.js'
import { createQualityController, hasWebGL2 } from './perf/quality.js'
import { createOverlay } from './scene/overlay.js'
import { createPhotoLayer } from './scene/photoLayer.js'
import { createSky } from './sky/sky.js'
import { sunElevationDeg } from './sky/sun.js'
import { creditHtml, showCaption } from './ui/caption.js'
import { renderComprendre, renderLesson } from './ui/comprendre.js'
import { drawDiagrams } from './lessons/diagrams.js'
import { createLessonPlayer, lessonDate, listPublished } from './lessons/player.js'
import { LESSONS, SKY_TEXTS } from './lessons/content/index.js'
import { mountSearch } from './ui/search.js'
import { mountTabs } from './ui/tabs.js'
import { ANCHORS } from './weather/anchors.js'
import { blendWeather } from './weather/blend.js'
import { probableCloudFamilies, RULES_REVIEWED } from './weather/cloudFamily.js'
import { loadWeather } from './weather/openMeteo.js'

const $ = id => document.getElementById(id)
const view = $('view')
const BASE = import.meta.env.BASE_URL
const NANCY = { code: '54395', name: 'Nancy', department: '54', region: '44', lat: 48.6937, lon: 6.1834, population: 104000 }

// Review URL: ?scene=<id>&anchor=<key>&hour=<UTC hour on 26 Oct 2026>&snow=<0..1>&sign=<name>&tornado=<disparity>&quality=<level>
const params = new URLSearchParams(location.search)
const ANCHOR_HOURS = { clear: 13.5, cloudy: 12, rain: 11, storm: 15, fog: 8.6, sunset: 16.15, night: 21 }
const forcedAnchor = params.get('anchor')
const forcedHour = params.has('hour') || forcedAnchor ? Number(params.get('hour') ?? ANCHOR_HOURS[forcedAnchor]) : null
const forcedEntry = catalog.find(e => e.id === params.get('scene'))
const forcedQuality = params.get('quality')

const storage = {
  get() { try { return JSON.parse(localStorage.getItem('commune')) } catch { return null } },
  set(c) { try { localStorage.setItem('commune', JSON.stringify(c)) } catch { /* private browsing */ } },
}

const state = { commune: null, weather: null, error: false, families: null, effects: ANCHORS.cloudy.effects, token: 0 }

// three.js needs WebGL2: without it, the photo alone with its own sky, still searchable and credited.
if (!hasWebGL2()) {
  const img = document.createElement('img')
  img.alt = ''
  img.style.objectFit = 'cover'
  view.append(img)
  const showPhoto = c => {
    const { entry } = resolveScene(c, catalog)
    img.src = BASE + entry.photo
    $('credit').innerHTML = creditHtml(entry.credit)
    $('caption').textContent = c.name
  }
  showPhoto(storage.get() ?? NANCY)
  mountSearch($('q'), $('suggestions'), c => { storage.set(c); showPhoto(c) })
  throw new Error('WebGL2 unavailable: photo only')
}

const renderer = new THREE.WebGLRenderer({ depth: false })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.toneMapping = THREE.NoToneMapping
view.prepend(renderer.domElement)

const overlay = createOverlay()
const photo = createPhotoLayer(renderer, overlay.texture)
const sky = createSky(renderer, catalog.find(e => e.id === 'nancy'))

const now = () => forcedHour == null ? new Date() : new Date(Date.UTC(2026, 9, 26, Math.floor(forcedHour), (forcedHour % 1) * 60))

function applySky() {
  const c = state.commune
  if (!c || player.lesson) return
  const date = now()
  const { sky: skyParams, effects } = forcedAnchor
    ? ANCHORS[forcedAnchor]
    : blendWeather(state.weather, sunElevationDeg(date, c.lat, c.lon))
  state.effects = { ...effects, ...(params.has('snow') && { snow: Number(params.get('snow')), rain: 0 }) }
  sky.setParams(skyParams)
  sky.setDate(date)
  photo.setEffects(state.effects)
  showCaption($('caption'), { name: c.name, weather: state.weather, error: state.error, now: date })
  renderPanel()
}

const isProd = import.meta.env.PROD
const published = items => listPublished(items, isProd)

function renderPanel() {
  if (player.lesson) return
  const texts = Object.fromEntries(Object.entries(SKY_TEXTS).filter(([, t]) => !isProd || t.reviewed))
  const families = isProd && !RULES_REVIEWED && state.families ? [] : state.families
  renderComprendre($('panel'), { families, texts, lessons: published(LESSONS), onLesson: l => player.start(l) })
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
    renderLesson($('panel'), { step, index, lesson, onPrev: () => player.prev(), onNext: () => player.next(), onStop: () => player.stop() })
  },
  onStop() {
    drawDiagrams($('diagrams'), [])
    photo.setTornado(null)
    applySky()
  },
})
addEventListener('keydown', e => {
  if (!player.lesson) return
  if (e.key === 'Escape') player.stop()
  else if (e.key === 'ArrowRight') player.next()
  else if (e.key === 'ArrowLeft') player.prev()
})

async function refreshWeather() {
  const c = state.commune, token = state.token
  const { weather, error } = await loadWeather(c.lat, c.lon)
  if (token !== state.token) return
  Object.assign(state, { weather, error, families: weather ? probableCloudFamilies(weather) : null })
  applySky()
}

async function show(commune, entryOverride) {
  const token = ++state.token
  const { entry, signText } = entryOverride ? { entry: entryOverride, signText: params.get('sign') } : resolveScene(commune, catalog)
  Object.assign(state, { commune, weather: null, error: false, families: null })
  applySky()
  try {
    if (!await photo.load(entry, signText)) return
  } catch {
    // Keep the previous photo rather than a half-switched scene.
    if (token === state.token) $('caption').textContent = `${commune.name} · photo indisponible`
    return
  }
  if (token !== state.token) return
  // Regional squares stand in for the commune: the sky (sun, time) is the commune's own.
  state.view = entry.kind === 'city' ? entry : { ...entry, lat: commune.lat, lon: commune.lon }
  placeSky()
  $('credit').innerHTML = creditHtml(entry.credit)
  refreshWeather()
}

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

mountSearch($('q'), $('suggestions'), c => { storage.set(c); show(c) })
mountTabs(document.querySelectorAll('.tabs button'), $('panel'), tab => {
  $('caption').hidden = tab === 'comprendre'
  if (tab === 'meteo') player.stop()
})
setInterval(() => state.commune && refreshWeather(), 15 * 60 * 1000)
setInterval(applySky, 60 * 1000)

const quality = createQualityController()
const clock = new THREE.Clock()
const first = forcedEntry
  ? show({ code: forcedEntry.code, name: forcedEntry.name, region: forcedEntry.code, lat: forcedEntry.lat ?? 46.6, lon: forcedEntry.lon ?? 2.4 }, forcedEntry)
  : show(storage.get() ?? NANCY)
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

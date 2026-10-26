import * as THREE from 'three'
import catalog from './places/catalog.json'
import { createPhotoLayer } from './scene/photoLayer.js'
import { createOverlay } from './scene/overlay.js'
import { createSky } from './sky/sky.js'
import { createQualityController, hasWebGL2 } from './perf/quality.js'
import { ANCHORS } from './weather/anchors.js'

// Debug/review URL: ?scene=<id>&anchor=<key>&hour=<UTC hour on 26 Oct 2026>
const params = new URLSearchParams(location.search)
const ANCHOR_HOURS = { clear: 13.5, cloudy: 12, rain: 11, storm: 15, fog: 8.6, sunset: 16.15, night: 21 }
const anchorKey = params.get('anchor') ?? 'clear'
const hour = Number(params.get('hour') ?? ANCHOR_HOURS[anchorKey])
const entry = catalog.find(e => e.id === (params.get('scene') ?? 'nancy'))

const view = document.getElementById('view')
// three.js needs WebGL2: without it, the photo alone with its own sky.
if (!hasWebGL2()) {
  view.innerHTML = `<img src="${import.meta.env.BASE_URL + entry.photo}" alt="" style="width:100%;height:100%;object-fit:cover">`
  throw new Error('WebGL2 unavailable: photo only')
}
const renderer = new THREE.WebGLRenderer({ depth: false })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.toneMapping = THREE.NoToneMapping
view.prepend(renderer.domElement)

const overlay = createOverlay()
const photo = createPhotoLayer(renderer, overlay.texture)
const sky = createSky(renderer, entry)
const { sky: skyParams } = ANCHORS[anchorKey]
const effects = { ...ANCHORS[anchorKey].effects, ...(params.has('snow') && { snow: Number(params.get('snow')), rain: 0 }) }
sky.setParams(skyParams)
sky.setDate(new Date(Date.UTC(2026, 9, 26, Math.floor(hour), (hour % 1) * 60)))
photo.setEffects(effects)

function resize() {
  const w = view.clientWidth, h = view.clientHeight
  renderer.setSize(w, h, false)
  sky.resize(w, h)
  photo.resize(w, h)
  overlay.resize(w, h)
}
addEventListener('resize', resize)
resize()

const quality = createQualityController()
const clock = new THREE.Clock()
Promise.all([sky.ready, photo.load(entry)]).then(() => renderer.setAnimationLoop(() => {
  const raw = clock.getDelta(), dt = Math.min(raw, .05), t = clock.elapsedTime
  const level = quality.frame(raw, document.hidden)
  if (level === 'photo-only') photo.fallback = true
  else if (level) sky.setQuality(level)
  photo.setFlash(overlay.draw(dt, t, effects))
  if (!photo.fallback) sky.render(dt)
  photo.render(t)
}))

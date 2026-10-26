import * as THREE from 'three'
import catalog from './places/catalog.json'
import { createPhotoLayer } from './scene/photoLayer.js'
import { createOverlay } from './scene/overlay.js'
import { createSky } from './sky/sky.js'
import { ANCHORS } from './weather/anchors.js'

// Debug/review URL: ?scene=<id>&anchor=<key>&hour=<UTC hour on 26 Oct 2026>
const params = new URLSearchParams(location.search)
const ANCHOR_HOURS = { clear: 13.5, cloudy: 12, rain: 11, storm: 15, fog: 8.6, sunset: 16.15, night: 21 }
const anchorKey = params.get('anchor') ?? 'clear'
const hour = Number(params.get('hour') ?? ANCHOR_HOURS[anchorKey])
const entry = catalog.find(e => e.id === (params.get('scene') ?? 'nancy'))

const view = document.getElementById('view')
const renderer = new THREE.WebGLRenderer({ depth: false })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.toneMapping = THREE.NoToneMapping
view.prepend(renderer.domElement)

const overlay = createOverlay()
const photo = createPhotoLayer(renderer, overlay.texture)
const sky = createSky(renderer, entry)
const { sky: skyParams, effects } = ANCHORS[anchorKey]
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

const clock = new THREE.Clock()
Promise.all([sky.ready, photo.load(entry)]).then(() => renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime
  photo.setFlash(overlay.draw(dt, t, effects))
  sky.render(dt)
  photo.render(t)
}))

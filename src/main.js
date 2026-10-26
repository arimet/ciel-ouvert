import * as THREE from 'three'
import { createSky } from './sky/sky.js'

const view = document.getElementById('view')
const renderer = new THREE.WebGLRenderer({ depth: false })
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
renderer.toneMapping = THREE.NoToneMapping
view.prepend(renderer.domElement)

const sky = createSky(renderer, { lat: 48.6937, lon: 6.1834, azimuth: 180, pitch: 7 })
sky.setParams({
  coverage: .3,
  low: { altitude: 900, height: 1300, densityScale: .2, coverageFilterWidth: .6 },
  mid: { altitude: 1000, height: 1200, densityScale: .2, coverageFilterWidth: .6 },
  exposure: 10,
  velocity: [1, 0],
})
sky.setDate(new Date())

function resize() {
  const w = view.clientWidth, h = view.clientHeight
  renderer.setSize(w, h, false)
  sky.resize(w, h)
}
addEventListener('resize', resize)
resize()

const clock = new THREE.Clock()
sky.ready.then(() => renderer.setAnimationLoop(() => sky.render(Math.min(clock.getDelta(), .05))))

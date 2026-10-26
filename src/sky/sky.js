import { EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { AerialPerspectiveEffect, getMoonDirectionECEF, getSunDirectionECEF, PrecomputedTexturesGenerator } from '@takram/three-atmosphere'
import { CLOUD_SHAPE_DETAIL_TEXTURE_SIZE, CloudsEffect, CloudShape } from '@takram/three-clouds'
import { DataTextureLoader, Ellipsoid, Geodetic, parseUint8Array, radians, STBNLoader } from '@takram/three-geospatial'

// Base timelapse speeds validated in the prototype; SkyParams.velocity scales and orients them.
const LOCAL_WEATHER_SPEED = .004
const SHAPE_SPEED = .03
const SHAPE_DETAIL_SPEED = .08

const asset = path => import.meta.env.BASE_URL + path

function load(loader, url) {
  return new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject))
}

export function createSky(renderer, { lat, lon, azimuth, pitch }) {
  const position = new Geodetic(radians(lon), radians(lat), 210).toECEF()
  const east = new THREE.Vector3(), north = new THREE.Vector3(), up = new THREE.Vector3()
  Ellipsoid.WGS84.getEastNorthUpVectors(position, east, north, up)

  const camera = new THREE.PerspectiveCamera(50, 1, 1, 1e6)
  camera.position.copy(position)
  camera.up.copy(up)
  const az = radians(azimuth), p = radians(pitch)
  const dir = north.clone().multiplyScalar(Math.cos(az) * Math.cos(p))
    .addScaledVector(east, Math.sin(az) * Math.cos(p))
    .addScaledVector(up, Math.sin(p))
  camera.lookAt(position.clone().add(dir))

  const aerial = new AerialPerspectiveEffect(camera)
  aerial.sky = true
  aerial.moon = true

  const clouds = new CloudsEffect(camera)
  clouds.events.addEventListener('change', e => {
    if (e.property === 'atmosphereOverlay') aerial.overlay = clouds.atmosphereOverlay
    if (e.property === 'atmosphereShadow') aerial.shadow = clouds.atmosphereShadow
    if (e.property === 'atmosphereShadowLength') aerial.shadowLength = clouds.atmosphereShadowLength
  })

  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType, multisampling: 0 })
  composer.addPass(new RenderPass(new THREE.Scene(), camera))
  composer.addPass(new EffectPass(camera, clouds, aerial))
  composer.addPass(new EffectPass(camera, new ToneMappingEffect({ mode: ToneMappingMode.AGX })))

  const repeat = t => {
    t.wrapS = t.wrapT = t.wrapR = THREE.RepeatWrapping
    t.colorSpace = THREE.NoColorSpace
    t.needsUpdate = true
    return t
  }
  const bin = size => new DataTextureLoader(THREE.Data3DTexture, parseUint8Array, { width: size, height: size, depth: size })

  const ready = Promise.all([
    new PrecomputedTexturesGenerator(renderer).update().then(textures => {
      Object.assign(aerial, textures)
      Object.assign(clouds, textures)
    }),
    load(new THREE.TextureLoader(), asset('clouds/local_weather.png')).then(t => {
      t.minFilter = THREE.LinearMipMapLinearFilter
      clouds.localWeatherTexture = repeat(t)
    }),
    load(new THREE.TextureLoader(), asset('clouds/turbulence.png')).then(t => {
      t.minFilter = THREE.LinearMipMapLinearFilter
      clouds.turbulenceTexture = repeat(t)
    }),
    load(bin(CLOUD_SHAPE_DETAIL_TEXTURE_SIZE), asset('clouds/shape_detail.bin')).then(t => {
      t.format = THREE.RedFormat
      t.minFilter = t.magFilter = THREE.LinearFilter
      clouds.shapeDetailTexture = repeat(t)
    }),
    load(new STBNLoader(), asset('core/stbn.bin')).then(t => {
      aerial.stbnTexture = t
      clouds.stbnTexture = t
    }),
  ]).then(() => {})

  // Generated on the GPU rather than downloading shape.bin (2.1 MB), to keep the first load under 5 MB.
  clouds.shapeTexture = new CloudShape()

  const defaults = [{ ...clouds.cloudLayers[0] }, { ...clouds.cloudLayers[1] }]

  return {
    ready,
    setParams(sky) {
      clouds.coverage = sky.coverage
      clouds.cloudLayers[0].set({ ...defaults[0], ...sky.low })
      clouds.cloudLayers[1].set({ ...defaults[1], ...sky.mid })
      renderer.toneMappingExposure = sky.exposure
      const [vx, vy] = sky.velocity
      clouds.localWeatherVelocity.set(LOCAL_WEATHER_SPEED * vx, LOCAL_WEATHER_SPEED * vy)
      clouds.shapeVelocity.set(SHAPE_SPEED * vx, 0, SHAPE_SPEED * vy)
      clouds.shapeDetailVelocity.set(SHAPE_DETAIL_SPEED * vx, 0, SHAPE_DETAIL_SPEED * vy)
    },
    setDate(date) {
      getSunDirectionECEF(date, aerial.sunDirection)
      getMoonDirectionECEF(date, aerial.moonDirection)
      clouds.sunDirection.copy(aerial.sunDirection)
    },
    setQuality(level) {
      clouds.qualityPreset = level === 'low-half' ? 'low' : level
      clouds.resolutionScale = level === 'low-half' ? .5 : 1
    },
    resize(w, h) {
      composer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    },
    render(dt) {
      composer.render(dt)
    },
  }
}

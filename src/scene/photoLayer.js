import * as THREE from 'three'
import { lightsToMask } from './lights.js'
import { drawSign, homography } from './sign.js'
import { cropWindow } from './crop.js'
import { createLatest } from './latest.js'

const vertexShader = /* glsl */ `
  varying vec2 vUv; varying vec2 sUv; uniform vec2 scale, offset;
  void main(){ sUv = uv; vUv = offset + (uv - .5) * scale; gl_Position = vec4(position.xy, 0., 1.); }`

// Depth map = disparity from Depth Anything: 1 near, 0 at infinity (the sky).
const fragmentShader = /* glsl */ `
  uniform sampler2D map, depth, overlay, lights, signMap;
  uniform mat3 signH;
  uniform float hasSign, signDisp;
  uniform vec3 tint, fogCol;
  uniform float aspect, time, fog, rain, snow, flash, night, maskThreshold, fallback;
  uniform vec3 tornado; // x on screen, disparity, intensity
  varying vec2 vUv; varying vec2 sUv;
  float h1(float x){ return fract(sin(x * 91.7) * 43758.5453); }
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p), u = f*f*(3.-2.*f);
    return mix(mix(h(i), h(i+vec2(1,0)), u.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), u.x), u.y); }
  float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a * n(p); p = p * 2.1 + vec2(1.7, 9.2); a *= .5; } return v; }
  // One drop per column, looping down; slanted.
  float rainLayer(vec2 uv, float cols, float speed, float len){
    uv.x = uv.x * aspect + uv.y * .2;
    float c = floor(uv.x * cols), r = h1(c);
    float cyc = uv.y * 1.3 + time * speed * (.8 + .4 * r) + r * 7.;
    float y = fract(cyc);
    float w = smoothstep(.08, 0., abs(fract(uv.x * cols) - .5));
    float on = step(.35, h1(c + floor(cyc) * 13.1));
    return w * on * smoothstep(0., len * .3, y) * smoothstep(len, len * .5, y);
  }
  // Round flakes drifting sideways, slower than rain.
  float snowLayer(vec2 uv, float cells, float speed, float size){
    uv.x = uv.x * aspect + sin(uv.y * 6. + time * .8) * .02;
    uv.y += time * speed;
    vec2 g = uv * cells, id = floor(g), f = fract(g) - .5;
    vec2 off = vec2(h(id), h(id + 7.)) - .5;
    return step(.45, h(id + 3.)) * smoothstep(size, size * .3, length(f - off * .6));
  }
  void main(){
    vec3 photo = texture2D(map, vUv).rgb * tint * (1. + flash * .8);
    // Windows and lamps light up at night, with a warm glow.
    photo += vec3(1., .74, .4) * texture2D(lights, vUv).r * night * .9;
    float disp = texture2D(depth, vUv).r;
    // Town sign: projected through its homography, in front of whatever is farther than it.
    if (hasSign > .5) {
      vec3 q = signH * vec3(vUv, 1.);
      vec2 su = q.xy / q.z;
      if (all(greaterThanEqual(su, vec2(0.))) && all(lessThanEqual(su, vec2(1.))) && disp <= signDisp + .02) {
        vec4 sc = texture2D(signMap, su);
        photo = mix(photo, sc.rgb * tint * (1. - night * .5), sc.a);
        disp = signDisp;
      }
    }
    float m = max(smoothstep(maskThreshold, maskThreshold + .035, disp), fallback);
    float dist = 1. / (disp + .04);
    // Fog follows real distance; far wisps drift slower.
    float wisps = fbm(vec2(vUv.x * 3. * aspect + time * .05 / (1. + dist * .15), vUv.y * 7. + dist * .3 - time * .01));
    float fogF = 1. - exp(-fog * dist * .22 * (.6 + .8 * wisps));
    float fogSky = fog * (.9 + .1 * wisps);
    vec3 fc = fogCol * (.92 + .16 * wisps);
    float a = m + (1. - m) * fogSky;
    vec3 col = mix(photo, fc, fogF) * m + fc * (1. - m) * fogSky;
    // Tornado: a rotating funnel from the cloud base to the ground, hidden by anything nearer than it.
    if (tornado.z > 0.) {
      float near = smoothstep(.05, .35, tornado.y);
      float ground = mix(.42, .1, near);
      float y = sUv.y - ground;
      float cx = tornado.x + sin(sUv.y * 7. + time * 1.3) * .012 * (1. + y * 3.);
      float halfW = (.005 + pow(max(y, 0.), 1.8) * .3) * (1. + near * 1.4) / aspect;
      float u = (sUv.x - cx) / halfW;
      float swirl = fbm(vec2(u * 2.5 + time * 3.5, sUv.y * (24. + near * 30.) - time * .8));
      float body = smoothstep(1., .25, abs(u)) * step(0., y) * (.3 + .7 * swirl * swirl * 1.6) * smoothstep(1., .55, sUv.y);
      float debris = smoothstep(1.3, 0., length(vec2((sUv.x - cx) * aspect * 7. / (1. + near * 2.), y * 22.))) * (.4 + .6 * fbm(vec2(sUv.x * 60. + time * 4., sUv.y * 40.)));
      float ta = clamp(body + debris * .8, 0., 1.) * tornado.z * step(disp, tornado.y + .01);
      vec3 tc = mix(mix(vec3(.24, .25, .27), vec3(.5, .52, .55), swirl), vec3(.36, .3, .24), debris) * tint;
      col = tc * ta + col * (1. - ta);
      a = ta + a * (1. - ta);
      col *= 1. - tornado.z * .25;
    }
    // Each rain layer shows only in front of what is farther than it.
    if (rain > 0.) {
      float r = rainLayer(sUv, 45., 1.7, .12) * step(disp, .6) * .22
              + rainLayer(sUv, 110., 1.3, .06) * step(disp, .3) * .18
              + rainLayer(sUv, 260., 1., .03) * step(disp, .12) * .14;
      col += vec3(.75, .8, .88) * r * rain;
    }
    if (snow > 0.) {
      float s = snowLayer(sUv, 16., .22, .07) * step(disp, .6)
              + snowLayer(sUv, 34., .15, .06) * step(disp, .3) * .7
              + snowLayer(sUv, 70., .1, .05) * step(disp, .12) * .5;
      col += vec3(.95) * s * snow * .85;
    }
    // Lightning and birds live in the sky, so behind the buildings.
    vec4 o = texture2D(overlay, sUv);
    col = mix(col, o.rgb, o.a * (1. - m) * (1. - fogSky * .7));
    col += vec3(.55, .6, .75) * flash * .35 * (1. - m);
    // Stars, fixed on screen since the camera never moves.
    vec2 sc = sUv * vec2(aspect, 1.) * 260.;
    float st = step(.9975, h(floor(sc))) * smoothstep(.35, 0., length(fract(sc) - .5)) * (.6 + .4 * sin(time * 2. + h(floor(sc) + 3.) * 20.));
    col += vec3(st) * night * (1. - m);
    gl_FragColor = vec4(col, a);
  }`

export function createPhotoLayer(renderer, overlayTexture) {
  const material = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      map: { value: null }, depth: { value: null }, overlay: { value: overlayTexture }, lights: { value: null }, signMap: { value: null }, signH: { value: new THREE.Matrix3() }, hasSign: { value: 0 }, signDisp: { value: 0 }, tornado: { value: new THREE.Vector3() },
      scale: { value: new THREE.Vector2(1, 1) }, offset: { value: new THREE.Vector2(.5, .5) }, aspect: { value: 1.5 }, time: { value: 0 },
      tint: { value: new THREE.Vector3(1, 1, 1) }, fogCol: { value: new THREE.Vector3(.8, .82, .84) },
      fog: { value: 0 }, rain: { value: 0 }, snow: { value: 0 }, flash: { value: 0 }, night: { value: 0 },
      maskThreshold: { value: .015 }, fallback: { value: 0 },
    },
    vertexShader, fragmentShader,
  })
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  quad.frustumCulled = false
  const scene = new THREE.Scene()
  scene.add(quad)
  const camera = new THREE.Camera()
  const loader = new THREE.TextureLoader()
  const u = material.uniforms
  let photoAspect = 1.5, viewAspect = 1, focusX = .5, tornado = null
  const latest = createLatest()

  const fit = () => {
    const { scale, offset } = cropWindow(viewAspect, photoAspect, focusX)
    u.scale.value.set(...scale)
    u.offset.value.set(...offset)
  }

  return {
    get fallback() { return u.fallback.value > .5 },
    set fallback(v) { u.fallback.value = v ? 1 : 0 },
    // Resolves false when a newer load started meanwhile: its textures are dropped, nothing changes on screen.
    async load(entry, signText = null) {
      const token = latest.begin()
      const base = import.meta.env.BASE_URL
      const [map, depth] = await Promise.all([loader.loadAsync(base + entry.photo), loader.loadAsync(base + entry.depth)])
      if (!latest.isCurrent(token)) {
        map.dispose(); depth.dispose()
        return false
      }
      u.map.value?.dispose(); u.depth.value?.dispose(); u.lights.value?.dispose()
      u.map.value = map
      u.depth.value = depth
      u.lights.value = lightsToMask(entry.lights)
      u.maskThreshold.value = entry.maskThreshold ?? .015
      // Regional squares keep their sign in view on narrow screens.
      focusX = entry.sign && signText ? (entry.sign.corners[0][0] + entry.sign.corners[1][0]) / 2 : entry.focusX ?? .5
      u.signMap.value?.dispose()
      u.hasSign.value = entry.sign && signText ? 1 : 0
      if (u.hasSign.value) {
        u.signMap.value = new THREE.CanvasTexture(drawSign(signText))
        // Catalog corners are photo UV with origin top-left (TL, TR, BR, BL); the shader's UV starts bottom-left.
        const photoPts = entry.sign.corners.map(([x, y]) => [x, 1 - y])
        u.signH.value.set(...homography(photoPts, [[0, 1], [1, 1], [1, 0], [0, 0]]))
        u.signDisp.value = entry.sign.disparity
      }
      photoAspect = map.image.width / map.image.height
      u.aspect.value = photoAspect
      fit()
      return true
    },
    setEffects(e) {
      u.tint.value.set(...e.tint)
      u.fog.value = e.fog
      u.rain.value = e.rain
      u.snow.value = e.snow
      u.night.value = e.night
    },
    setFlash(v) { u.flash.value = v },
    // t: { x, disparity: number | [from, to], intensity, duration } — disparity grows as the tornado comes closer.
    setTornado(t) {
      tornado = t && { ...t, start: u.time.value }
      if (!t) u.tornado.value.set(0, 0, 0)
    },
    resize(w, h) { viewAspect = w / h; fit() },
    render(t) {
      u.time.value = t
      if (tornado) {
        const [from, to] = [].concat(tornado.disparity, tornado.disparity)
        const k = Math.min(1, (t - tornado.start) / (tornado.duration ?? 8))
        u.tornado.value.set(tornado.x, from + (to - from) * k, tornado.intensity)
      }
      renderer.autoClear = false
      renderer.render(scene, camera)
    },
  }
}

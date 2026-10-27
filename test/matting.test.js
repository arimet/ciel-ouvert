import { expect, test } from 'vitest'
import { decontaminate, fillSkyHoles, guidedFilter, refineMask } from '../tools/matting.mjs'

const W = 40, H = 20
const at = (x, y) => y * W + x

test('a uniform mask stays uniform', () => {
  const guide = new Float32Array(W * H).map((_, i) => (i % W) / W)
  const q = guidedFilter(guide, new Float32Array(W * H).fill(.7), W, H, 4, 1e-3)
  expect(Math.max(...q.map(v => Math.abs(v - .7)))).toBeLessThan(1e-6)
})

test('a blocky sky mask snaps to the real skyline by colour', () => {
  // Sky (light blue) left of x = 20, wall (brown) right; the coarse mask edge is 3 px off, at x = 23.
  const rgb = new Float32Array(W * H * 3)
  for (let i = 0; i < W * H; i++) rgb.set(i % W < 20 ? [.6, .75, .95] : [.5, .35, .25], i * 3)
  const coarse = new Float32Array(W * H).map((_, i) => (i % W < 23 ? 1 : 0))
  const a = refineMask(rgb, coarse, W, H, 6)
  expect(a[at(21, 10)]).toBeLessThan(.2)
  expect(a[at(18, 10)]).toBeGreaterThan(.8)
  expect(a[at(2, 10)]).toBeGreaterThan(.95)
  expect(a[at(38, 10)]).toBeLessThan(.05)
})

test('a pixel half sky, half wall gets its wall colour back', () => {
  const wall = [.8, .4, .3], sky = [.3, .5, .9]
  const rgb = new Float32Array([.55, .45, .6]) // 50 % of each
  const out = decontaminate(rgb, new Float32Array([.5]), new Float32Array(sky), 1, 1)
  expect([...out].map(v => +v.toFixed(3))).toEqual(wall)
})

test('pure wall and pure sky pixels are left alone', () => {
  const rgb = new Float32Array([.8, .4, .3, .3, .5, .9])
  const out = decontaminate(rgb, new Float32Array([0, 1]), new Float32Array([.3, .5, .9, .3, .5, .9]), 2, 1)
  expect([...out]).toEqual([...rgb])
})

test('sky seen through a far lattice becomes sky, near pale walls stay', () => {
  const sky = [.85, .87, .9], steel = [.4, .4, .45]
  const rgb = new Float32Array(W * H * 3), alpha = new Float32Array(W * H), depth = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const tower = i % W >= 15 && i % W < 25
    rgb.set(tower ? steel : sky, i * 3)
    alpha[i] = tower ? 0 : 1
  }
  rgb.set(sky, at(20, 5) * 3) // a gap in the far lattice
  rgb.set(sky, at(20, 15) * 3); depth[at(20, 15)] = .8 // a pale wall close to the camera
  const a = fillSkyHoles(rgb, alpha, depth, W, H)
  expect(a[at(20, 5)]).toBeGreaterThan(.9)
  expect(a[at(18, 5)]).toBeLessThan(.1)
  expect(a[at(20, 15)]).toBeLessThan(.1)
})

test('a pixel that is almost all sky does not blow up into a saturated colour', () => {
  const rgb = new Float32Array([.32, .5, .9]) // sky plus a little noise
  const out = decontaminate(rgb, new Float32Array([.95]), new Float32Array([.3, .5, .9]), 1, 1)
  expect(Math.max(...[...out].map((v, c) => Math.abs(v - rgb[c])))).toBeLessThan(.1)
})

import { expect, test } from 'vitest'
import { cropWindow, horizonPitch, lowestSky } from '../src/scene/crop.js'

test('a wide photo in a portrait view keeps the focus point visible', () => {
  const { scale, offset } = cropWindow(.5, 1.5, .1)
  expect(scale[0]).toBeCloseTo(1 / 3)
  expect(offset[0]).toBeCloseTo(1 / 6) // left edge of the photo, the sign at x .1 stays inside
})

test('the crop never leaves the photo', () => {
  expect(cropWindow(.5, 1.5, .95).offset[0]).toBeCloseTo(5 / 6)
  expect(cropWindow(.5, 1.5, .5).offset[0]).toBeCloseTo(.5)
})

test('a view wider than the photo crops vertically, centred', () => {
  const { scale, offset } = cropWindow(3, 1.5, .1)
  expect(scale).toEqual([1, .5])
  expect(offset).toEqual([.5, .5])
})

const maskOf = (W, H, isSky) => {
  const data = new Uint8ClampedArray(W * H * 4).fill(255)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isSky(x, y)) data[(y * W + x) * 4] = 0
  return { data, width: W, height: H }
}

test('the lowest sky counts a gap in a monument but not a stray pixel', () => {
  const arch = maskOf(400, 100, (x, y) => y < 30 || (y < 70 && x >= 200 && x < 210))
  expect(lowestSky(arch)).toBeCloseTo(.7)
  const stray = maskOf(400, 100, (x, y) => y < 30 || (y === 80 && x === 5))
  expect(lowestSky(stray)).toBeCloseTo(.3)
})

const horizonOnScreen = pitch => .5 + Math.tan(pitch * Math.PI / 180) / (2 * Math.tan(25 * Math.PI / 180))

test('sky high in the photo keeps the chosen pitch', () => {
  expect(horizonPitch(.4, 1, 7)).toBe(7)
})

test('sky reaching low in the photo raises the camera so the 3D horizon stays out of sight', () => {
  for (const scaleY of [1, .96, .7]) {
    const skyOnScreen = (.83 - .5) / scaleY + .5
    const pitch = horizonPitch(.83, scaleY, 7)
    expect(Math.min(1, horizonOnScreen(pitch))).toBeGreaterThan(Math.min(1, skyOnScreen))
  }
})

test('a view wider than the photo keeps a low point (a sign foot) in view, cropping the top instead', () => {
  const { scale, offset } = cropWindow(16 / 9, 4 / 3, .5, .95)
  const visibleBottom = 1 - (offset[1] - scale[1] / 2) // photo y, top-left origin
  expect(visibleBottom).toBeGreaterThanOrEqual(.95)
  expect(offset[1] - scale[1] / 2).toBeGreaterThanOrEqual(0)
  expect(cropWindow(16 / 9, 4 / 3).offset[1]).toBe(.5)
})

test('the horizon follows a crop that is not centred', () => {
  // Window showing photo y .25 to 1: its centre is at .625.
  const centred = horizonPitch(.83, .75, 7), shifted = horizonPitch(.83, .75, 7, 50, .625)
  expect(shifted).toBeLessThan(centred)
})

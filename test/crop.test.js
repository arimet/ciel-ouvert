import { expect, test } from 'vitest'
import { cropWindow } from '../src/scene/crop.js'

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

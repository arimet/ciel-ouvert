import { expect, test } from 'vitest'
import { lightRectToPixels } from '../src/scene/lights.js'

test('a light rect in photo UV maps to a pixel box', () => {
  expect(lightRectToPixels({ x: .5, y: .5, w: .1, h: .1 }, 100, 100)).toEqual({ x0: 50, y0: 50, x1: 60, y1: 60 })
})

test('rects are clamped to the mask', () => {
  expect(lightRectToPixels({ x: .95, y: -.05, w: .1, h: .1 }, 200, 100)).toEqual({ x0: 190, y0: 0, x1: 200, y1: 5 })
})

test('a tiny lamp still covers at least one pixel', () => {
  const b = lightRectToPixels({ x: .3, y: .3, w: .001, h: .001 }, 100, 100)
  expect(b.x1 - b.x0).toBeGreaterThanOrEqual(1)
  expect(b.y1 - b.y0).toBeGreaterThanOrEqual(1)
})

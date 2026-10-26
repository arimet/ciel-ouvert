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

test('a facade zone splits into a grid of windows', async () => {
  const { expandLights } = await import('../src/scene/lights.js')
  const out = expandLights([{ x: 0, y: 0, w: 1, h: .5, grid: [2, 1] }], () => .9)
  expect(out).toEqual([
    { x: .1375, y: .1125, w: .225, h: .275, level: expect.any(Number) },
    { x: .6375, y: .1125, w: .225, h: .275, level: expect.any(Number) },
  ])
})

test('floodlit monuments are always lit, softer', async () => {
  const { expandLights } = await import('../src/scene/lights.js')
  expect(expandLights([{ x: .1, y: .1, w: .2, h: .2, flood: true }], () => 0)).toEqual([{ x: .1, y: .1, w: .2, h: .2, level: .55 }])
})

test('roughly a third of windows stay dark', async () => {
  const { expandLights } = await import('../src/scene/lights.js')
  let i = 0
  const out = expandLights([{ x: 0, y: 0, w: 1, h: 1, grid: [10, 10] }], () => (i++ % 10) / 10)
  expect(out.length).toBe(70)
})

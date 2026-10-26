import { expect, test, vi } from 'vitest'
import { createLessonPlayer, listPublished, stepParams } from '../src/lessons/player.js'

const lesson = {
  id: 'demo', title: 'Démo', reviewed: true, sources: [],
  steps: [{ title: 'a', text: 'A', anchor: 'clear' }, { title: 'b', text: 'B', anchor: 'cloudy' }, { title: 'c', text: 'C', anchor: 'storm' }],
}

test('production hides unreviewed items, dev keeps them', () => {
  const items = [{ id: 1, reviewed: true }, { id: 2, reviewed: false }]
  expect(listPublished(items, true).map(i => i.id)).toEqual([1])
  expect(listPublished(items, false).map(i => i.id)).toEqual([1, 2])
})

test('a step patches its anchor', () => {
  const p = stepParams({ anchor: 'storm', sky: { coverage: .7 } })
  expect(p.sky.low.height).toBe(5000)
  expect(p.sky.coverage).toBe(.7)
  expect(p.effects.storm).toBe(1)
})

test('a step can patch a single cloud layer field', () => {
  const p = stepParams({ anchor: 'clear', sky: { low: { height: 8000 } } })
  expect(p.sky.low.height).toBe(8000)
  expect(p.sky.low.altitude).toBe(900)
})

function player() {
  const apply = vi.fn(), onStep = vi.fn(), onStop = vi.fn()
  return { p: createLessonPlayer({ apply, onStep, onStop }), apply, onStep, onStop }
}

test('next past the last step stays on the last', () => {
  const { p } = player()
  p.start(lesson)
  p.next(); p.next(); p.next()
  expect(p.index).toBe(2)
})

test('prev at the first step stays there', () => {
  const { p } = player()
  p.start(lesson)
  p.prev()
  expect(p.index).toBe(0)
})

test('stop restores live weather exactly once', () => {
  const { p, onStop } = player()
  p.start(lesson)
  p.stop(); p.stop()
  expect(onStop).toHaveBeenCalledTimes(1)
})

test('steps tween toward their sky over the transition', () => {
  const { p, apply } = player()
  p.start(lesson)
  p.tick(5)
  expect(apply.mock.lastCall[0].sky.coverage).toBeCloseTo(.3)
  p.next()
  p.tick(1)
  const mid = apply.mock.lastCall[0].sky.coverage
  expect(mid).toBeGreaterThan(.3)
  expect(mid).toBeLessThan(.5)
  p.tick(5)
  expect(apply.mock.lastCall[0].sky.coverage).toBeCloseTo(.5)
})

test('each step is announced with its position', () => {
  const { p, onStep } = player()
  p.start(lesson)
  p.next()
  expect(onStep).toHaveBeenLastCalledWith(lesson.steps[1], 1, lesson)
})

test('lesson times follow the commune solar time', async () => {
  const { lessonDate } = await import('../src/lessons/player.js')
  const { sunElevationDeg } = await import('../src/sky/sun.js')
  const base = new Date('2026-10-26T12:00:00Z')
  for (const [lat, lon] of [[48.69, 6.18], [-20.88, 55.45]]) {
    expect(sunElevationDeg(lessonDate('day', lat, lon, base), lat, lon)).toBeGreaterThan(20)
    expect(sunElevationDeg(lessonDate('night', lat, lon, base), lat, lon)).toBeLessThan(-12)
    const dawn = sunElevationDeg(lessonDate('dawn', lat, lon, base), lat, lon)
    expect(dawn).toBeGreaterThan(-6); expect(dawn).toBeLessThan(10)
  }
})

test('a field only the next step sets survives the tween', () => {
  const { p, apply } = player()
  p.start({ ...lesson, steps: [{ anchor: 'clear' }, { anchor: 'clear', sky: { mid: { shapeAmount: .4 } } }] })
  p.tick(1)
  p.next()
  p.tick(5)
  expect(apply.mock.lastCall[0].sky.mid.shapeAmount).toBe(.4)
})

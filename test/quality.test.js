import { expect, test } from 'vitest'
import { createQualityController } from '../src/perf/quality.js'

// Feeds `seconds` of frames at `fps`; returns every level change in order.
function run(q, fps, seconds, hidden = false) {
  const changes = []
  for (let i = 0; i < fps * seconds; i++) {
    const c = q.frame(1 / fps, hidden)
    if (c) changes.push(c)
  }
  return changes
}

test('a fast device stays on high', () => {
  const q = createQualityController()
  expect(run(q, 60, 5)).toEqual([])
  expect(q.level).toBe('high')
})

test('20 fps steps down one level per 2 s window after warmup', () => {
  const q = createQualityController()
  expect(run(q, 20, 3)).toEqual(['medium'])
  expect(run(q, 20, 2)).toEqual(['low'])
})

test('a very slow device ends in photo-only', () => {
  const q = createQualityController()
  run(q, 12, 12)
  expect(q.level).toBe('photo-only')
})

test('a resume after sleep (huge dt) changes nothing', () => {
  const q = createQualityController()
  run(q, 60, 2)
  expect(q.frame(30, false)).toBe(null)
  expect(run(q, 60, 3)).toEqual([])
  expect(q.level).toBe('high')
})

test('hidden frames are ignored', () => {
  const q = createQualityController()
  expect(run(q, 1, 10, true)).toEqual([])
  expect(q.level).toBe('high')
})

test('never steps back up', () => {
  const q = createQualityController()
  run(q, 20, 3)
  expect(run(q, 60, 10)).toEqual([])
  expect(q.level).toBe('medium')
})

test('25 fps on low-half is kept rather than dropping the sky', () => {
  const q = createQualityController()
  run(q, 25, 20)
  expect(q.level).toBe('low-half')
})

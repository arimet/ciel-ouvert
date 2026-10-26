import { expect, test } from 'vitest'
import { createLatest } from '../src/scene/latest.js'

test('only the most recent request is current', () => {
  const latest = createLatest()
  const a = latest.begin(), b = latest.begin()
  expect(latest.isCurrent(a)).toBe(false)
  expect(latest.isCurrent(b)).toBe(true)
})

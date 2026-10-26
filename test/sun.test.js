import { expect, test } from 'vitest'
import { sunElevationDeg } from '../src/sky/sun.js'

test('Nancy noon in October is daytime, 23:00 UTC is night', () => {
  expect(sunElevationDeg(new Date('2026-10-26T11:30:00Z'), 48.6937, 6.1834)).toBeGreaterThan(25)
  expect(sunElevationDeg(new Date('2026-10-26T23:00:00Z'), 48.6937, 6.1834)).toBeLessThan(-20)
})

test('Saint-Denis (Réunion) uses its own position, not the browser zone', () => {
  expect(sunElevationDeg(new Date('2026-10-26T08:00:00Z'), -20.8789, 55.4481)).toBeGreaterThan(50)
})

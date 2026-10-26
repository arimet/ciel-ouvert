import { expect, test } from 'vitest'
import { blendWeather } from '../src/weather/blend.js'

const base = { cloudLow: 0, cloudMid: 0, cloudHigh: 0, precipitation: 0, snowfall: 0, weatherCode: 0, visibility: 30000, windSpeed: 10, windDirection: 270 }

test('clear day equals clear anchor', () => expect(blendWeather(base, 40).sky.coverage).toBeCloseTo(.3))

test('overcast reaches cloudy', () => expect(blendWeather({ ...base, cloudLow: 90 }, 40).sky.coverage).toBeCloseTo(.5))

test('thunderstorm code gives storm sky and lightning', () => {
  const r = blendWeather({ ...base, weatherCode: 95, precipitation: 5 }, 30)
  expect(r.sky.low.height).toBeCloseTo(5000)
  expect(r.effects.storm).toBe(1)
})

test('fog from visibility', () => expect(blendWeather({ ...base, visibility: 500 }, 20).effects.fog).toBeCloseTo(1))

test('missing visibility is not fog', () => expect(blendWeather({ ...base, visibility: null }, 20).effects.fog).toBe(0))

test('snow replaces rain', () => {
  const r = blendWeather({ ...base, weatherCode: 73, snowfall: 1, precipitation: 1 }, 20)
  expect(r.effects.snow).toBeGreaterThan(0)
  expect(r.effects.rain).toBe(0)
})

test('night at -12°', () => expect(blendWeather(base, -12).effects.night).toBeCloseTo(1))

test('no weather falls back to cloudy', () => expect(blendWeather(null, 40).sky.coverage).toBeCloseTo(.5))

test('west wind pushes clouds east', () => expect(blendWeather(base, 40).sky.velocity[0]).toBeGreaterThan(0))

test('sunset tints warm without changing the clouds', () => {
  const r = blendWeather(base, 3)
  expect(r.effects.tint[2]).toBeCloseTo(.62)
  expect(r.sky.coverage).toBeCloseTo(.3)
})

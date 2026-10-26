import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { fetchCurrent, loadWeather } from '../src/weather/openMeteo.js'

const fixture = JSON.parse(readFileSync(new URL('./fixtures/open-meteo-nancy.json', import.meta.url)))
const okFetch = async () => ({ ok: true, json: async () => fixture })

test('maps the current block to WeatherNow', async () => {
  const w = await fetchCurrent(48.69, 6.18, okFetch)
  expect(w).toEqual({
    time: '2026-10-26T15:30', utcOffset: 3600, temperature: 11.6, weatherCode: 3,
    cloudLow: 23, cloudMid: 93, cloudHigh: 61, precipitation: 0, snowfall: 0,
    visibility: 37100, windSpeed: 10.9, windDirection: 186,
  })
})

test('asks for the commune position and its own time zone', async () => {
  let url
  await fetchCurrent(-20.88, 55.45, async u => { url = u; return okFetch() })
  expect(url).toContain('latitude=-20.88')
  expect(url).toContain('longitude=55.45')
  expect(url).toContain('timezone=auto')
})

test('an unreachable API never rejects', async () => {
  expect(await loadWeather(48.69, 6.18, async () => { throw new TypeError('offline') })).toEqual({ weather: null, error: true })
})

test('an HTTP error is reported as unavailable', async () => {
  expect(await loadWeather(48.69, 6.18, async () => ({ ok: false, status: 429 }))).toEqual({ weather: null, error: true })
})

import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { fetchCurrent, loadWeather } from '../src/weather/openMeteo.js'

const fixture = JSON.parse(readFileSync(new URL('./fixtures/open-meteo-nancy.json', import.meta.url)))
const okFetch = async () => ({ ok: true, json: async () => fixture })

test('maps the current block to WeatherNow', async () => {
  const w = await fetchCurrent(48.69, 6.18, okFetch)
  expect(w).toMatchObject({
    time: '2026-10-26T15:30', utcOffset: 3600, temperature: 11.6, weatherCode: 3,
    cloudLow: 23, cloudMid: 93, cloudHigh: 61, precipitation: 0, snowfall: 0,
    visibility: 37100, windSpeed: 10.9, windDirection: 186,
  })
})

test('the next 24 hours come with the same fields, plus rain probability and daylight', async () => {
  const { hours } = await fetchCurrent(48.69, 6.18, okFetch)
  expect(hours).toHaveLength(24)
  expect(Object.keys(hours[0]).sort()).toEqual(['cloudHigh', 'cloudLow', 'cloudMid', 'isDay', 'precipitation', 'precipitationProbability',
    'snowfall', 'temperature', 'time', 'visibility', 'weatherCode', 'windDirection', 'windSpeed'])
  expect(hours[0].time).toBe(fixture.hourly.time[0])
  expect(hours[5].precipitationProbability).toBe(fixture.hourly.precipitation_probability[5])
  expect(typeof hours[0].isDay).toBe('boolean')
})

test('a forecast without hours still gives the current weather', async () => {
  const { hourly, ...noHours } = fixture
  const w = await fetchCurrent(48.69, 6.18, async () => ({ ok: true, json: async () => noHours }))
  expect(w.weatherCode).toBe(3)
  expect(w.hours).toEqual([])
})

test('asks for the commune position and its own time zone', async () => {
  let url
  await fetchCurrent(-20.88, 55.45, async u => { url = u; return okFetch() })
  expect(url).toContain('latitude=-20.88')
  expect(url).toContain('longitude=55.45')
  expect(url).toContain('timezone=auto')
  expect(url).toContain('forecast_hours=24')
})

test('an unreachable API never rejects', async () => {
  expect(await loadWeather(48.69, 6.18, async () => { throw new TypeError('offline') })).toEqual({ weather: null, error: true })
})

test('an HTTP error is reported as unavailable', async () => {
  expect(await loadWeather(48.69, 6.18, async () => ({ ok: false, status: 429 }))).toEqual({ weather: null, error: true })
})

test('works on browsers without AbortSignal.timeout (iOS 15)', async () => {
  const original = AbortSignal.timeout
  AbortSignal.timeout = undefined
  try {
    expect((await fetchCurrent(48.69, 6.18, okFetch)).weatherCode).toBe(3)
  } finally {
    AbortSignal.timeout = original
  }
})

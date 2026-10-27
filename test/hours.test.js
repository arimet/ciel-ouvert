import { expect, test } from 'vitest'
import { hourDate, hourLabel, iconKind } from '../src/ui/hours.js'
import { captionText } from '../src/ui/caption.js'

test('an hour of the forecast is read in the commune time zone', () => {
  expect(hourDate('2026-10-27T18:00', 3600).toISOString()).toBe('2026-10-27T17:00:00.000Z')
  expect(hourDate('2026-10-27T18:00', 4 * 3600).toISOString()).toBe('2026-10-27T14:00:00.000Z')
  expect(hourLabel('2026-10-27T08:00')).toBe('8 h')
})

test('each weather code gets an icon, day and night apart for clear skies', () => {
  expect(iconKind(0, true)).toBe('sun')
  expect(iconKind(0, false)).toBe('moon')
  expect(iconKind(2, true)).toBe('partly-day')
  expect(iconKind(1, false)).toBe('partly-night')
  expect(iconKind(3, true)).toBe('cloud')
  expect(iconKind(48, true)).toBe('fog')
  expect(iconKind(61, true)).toBe('rain')
  expect(iconKind(81, false)).toBe('rain')
  expect(iconKind(73, true)).toBe('snow')
  expect(iconKind(86, true)).toBe('snow')
  expect(iconKind(96, true)).toBe('storm')
})

test('a previewed hour says it is a forecast', () => {
  const hour = { temperature: 9.4, weatherCode: 61, utcOffset: 3600 }
  expect(captionText({ name: 'Nancy', weather: hour, now: hourDate('2026-10-27T18:00', 3600), forecast: true }))
    .toBe('Nancy · prévision pour 18 h 00 · 9 °C · pluie')
})

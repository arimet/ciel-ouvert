import { expect, test } from 'vitest'
import { captionText, localTime, weatherLabel } from '../src/ui/caption.js'

test('WMO codes get a short French label', () => {
  expect(weatherLabel(0)).toBe('ciel dégagé')
  expect(weatherLabel(3)).toBe('couvert')
  expect(weatherLabel(45)).toBe('brouillard')
  expect(weatherLabel(63)).toBe('pluie')
  expect(weatherLabel(73)).toBe('neige')
  expect(weatherLabel(81)).toBe('averses')
  expect(weatherLabel(95)).toBe('orage')
  expect(weatherLabel(99)).toBe('orage avec grêle')
})

test('local time uses the commune offset, not the browser zone', () => {
  const now = new Date('2026-10-26T08:05:00Z')
  expect(localTime(now, 3600)).toBe('9 h 05')
  expect(localTime(now, 4 * 3600)).toBe('12 h 05')
})

test('caption with weather', () => {
  const weather = { temperature: 11.6, weatherCode: 3, utcOffset: 3600 }
  expect(captionText({ name: 'Nancy', weather, error: false, now: new Date('2026-10-26T14:32:00Z') })).toBe('Nancy · 15 h 32 · 12 °C · couvert')
})

test('caption when the weather is unavailable', () => {
  expect(captionText({ name: 'Nancy', weather: null, error: true })).toBe('Nancy · météo indisponible')
})

test('caption while loading', () => {
  expect(captionText({ name: 'Nancy', weather: null, error: false })).toBe('Nancy')
})

test('credit links the licence and says the photo was modified', async () => {
  const { creditHtml } = await import('../src/ui/caption.js')
  expect(creditHtml({ author: 'Krzysztof Golik', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:X.jpg' })).toBe(
    'Photo : <a href="https://commons.wikimedia.org/wiki/File:X.jpg" target="_blank" rel="noopener">Krzysztof Golik</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr" target="_blank" rel="noopener">CC BY-SA 4.0</a>, modifiée')
  expect(creditHtml({ author: 'A', license: 'CC0', url: 'u' })).toContain('https://creativecommons.org/publicdomain/zero/1.0/deed.fr')
  expect(creditHtml({ author: '<b>', license: 'CC BY 2.0', url: 'u' })).toContain('&lt;b&gt;')
})

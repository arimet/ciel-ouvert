import { expect, test } from 'vitest'
import { parseRoute, routeSearch } from '../src/ui/route.js'

test('no parameter is the home page', () => {
  expect(parseRoute('')).toEqual({ view: 'home' })
})

test('a commune code opens its weather', () => {
  expect(parseRoute('?commune=54395')).toEqual({ view: 'meteo', code: '54395' })
})

test('comprendre opens the lesson list, or a lesson by its id', () => {
  expect(parseRoute('?comprendre')).toEqual({ view: 'comprendre', lesson: null })
  expect(parseRoute('?comprendre=orages')).toEqual({ view: 'comprendre', lesson: 'orages' })
})

test('a malformed commune code falls back to the home page', () => {
  expect(parseRoute('?commune=<script>')).toEqual({ view: 'home' })
})

test('routes round-trip through the URL', () => {
  for (const r of [{ view: 'home' }, { view: 'meteo', code: '2A004' }, { view: 'comprendre', lesson: null }, { view: 'comprendre', lesson: 'tornades' }]) {
    expect(parseRoute(routeSearch(r))).toEqual(r)
  }
})

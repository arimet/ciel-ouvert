import { readFileSync } from 'node:fs'
import { expect, test, vi } from 'vitest'
import { resolveScene, searchCommunes } from '../src/places/communes.js'

const saintDenis = JSON.parse(readFileSync(new URL('./fixtures/geo-saint-denis.json', import.meta.url)))
const fakeFetch = body => async () => ({ ok: true, json: async () => body })

test('homonyms keep their department', async () => {
  const r = await searchCommunes('Saint-Denis', fakeFetch(saintDenis))
  expect(r.map(c => c.department)).toEqual(expect.arrayContaining(['93', '974']))
})

test('maps API Géo fields to a Commune', async () => {
  const [c] = await searchCommunes('Saint-Denis', fakeFetch(saintDenis))
  expect(c).toEqual({ code: '97411', name: 'Saint-Denis', department: '974', region: '04', lat: c.lat, lon: c.lon, population: 155634 })
  expect(c.lat).toBeLessThan(-20)
})

test('one-letter query does not call the API', async () => {
  const f = vi.fn()
  expect(await searchCommunes('N', f)).toEqual([])
  expect(f).not.toHaveBeenCalled()
})

test('the query is URL-encoded', async () => {
  let url
  await searchCommunes('Œuilly & co', async u => { url = u; return { ok: true, json: async () => [] } })
  expect(url).toContain('nom=%C5%92uilly%20%26%20co')
})

const catalog = [
  { id: 'nancy', kind: 'city', code: '54395' },
  { id: 'region-44', kind: 'region', code: '44' },
  { id: 'region-11', kind: 'region', code: '11' },
]
const nancy = { code: '54395', name: 'Nancy', region: '44' }
const laxou = { code: '54304', name: 'Laxou', region: '44' }

test('city by INSEE code, others by region with sign', () => {
  expect(resolveScene(nancy, catalog)).toEqual({ entry: catalog[0], signText: null })
  expect(resolveScene(laxou, catalog)).toEqual({ entry: catalog[1], signText: 'LAXOU' })
})

test('Saint-Denis 974 never gets the scene of Saint-Denis 93', () => {
  const r = resolveScene({ code: '97411', name: 'Saint-Denis', region: '04' }, catalog)
  expect(r.entry.id).not.toBe('region-11')
})

test('a region without its own scene still gets a regional scene with the sign', () => {
  const r = resolveScene({ code: '97411', name: 'Saint-Denis', region: '04' }, catalog)
  expect(r.entry.kind).toBe('region')
  expect(r.signText).toBe('SAINT-DENIS')
})

test('with no regional scene at all, any commune still gets a scene', () => {
  const r = resolveScene({ code: '54304', name: 'Laxou', region: '44' }, [{ id: 'nancy', kind: 'city', code: '54395' }])
  expect(r.entry.id).toBe('nancy')
})

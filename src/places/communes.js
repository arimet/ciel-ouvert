const FIELDS = 'nom,code,codeDepartement,codeRegion,centre,population'

export async function searchCommunes(q, fetchFn = fetch) {
  if (q.trim().length < 2) return []
  const res = await fetchFn(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q.trim())}&fields=${FIELDS}&boost=population&limit=8`)
  if (!res.ok) throw new Error(`API Géo ${res.status}`)
  return (await res.json()).map(toCommune)
}

// For a shared link: the URL only carries the INSEE code.
export async function fetchCommune(code, fetchFn = fetch) {
  const res = await fetchFn(`https://geo.api.gouv.fr/communes/${encodeURIComponent(code)}?fields=${FIELDS}`)
  if (!res.ok) throw new Error(`API Géo ${res.status}`)
  return toCommune(await res.json())
}

const toCommune = c => ({
  code: c.code, name: c.nom, department: c.codeDepartement, region: c.codeRegion,
  lat: c.centre.coordinates[1], lon: c.centre.coordinates[0], population: c.population,
})

// A known city gets its own scene; any other commune gets its region's square with a town sign.
export function resolveScene(c, catalog) {
  const city = catalog.find(e => e.kind === 'city' && e.code === c.code)
  if (city) return { entry: city, signText: null }
  const region = catalog.find(e => e.kind === 'region' && e.code === c.region) ?? catalog.find(e => e.kind === 'region') ?? catalog[0]
  return { entry: region, signText: c.name.toUpperCase() }
}

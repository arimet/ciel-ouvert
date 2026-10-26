// Prints the communes over 100 000 inhabitants, largest first: node tools/list-cities.mjs
const res = await fetch('https://geo.api.gouv.fr/communes?fields=nom,code,population,centre,codeRegion&format=json')
const cities = (await res.json())
  .filter(c => c.population > 100_000)
  .sort((a, b) => b.population - a.population)
  .map(c => ({ name: c.nom, code: c.code, population: c.population, region: c.codeRegion, lat: c.centre.coordinates[1], lon: c.centre.coordinates[0] }))
console.log(JSON.stringify(cities, null, 1))

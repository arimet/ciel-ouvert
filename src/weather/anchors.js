// The 7 skies validated by eye on the prototype. Live weather is always a blend of these.
const LOW = { altitude: 750, height: 650, densityScale: .2, coverageFilterWidth: .6, shapeAmount: 1, shapeDetailAmount: 1 }
const MID = { altitude: 1000, height: 1200, densityScale: .2, coverageFilterWidth: .6, shapeAmount: 1, shapeDetailAmount: 1 }
const EFFECTS = { tint: [1, 1, 1], fog: 0, rain: 0, snow: 0, storm: 0, night: 0, birds: 0 }

function anchor({ coverage, low = {}, mid = {}, exposure = 10, ...effects }) {
  return {
    sky: { coverage, low: { ...LOW, ...low }, mid: { ...MID, ...mid }, exposure, velocity: [1, 0] },
    effects: { ...EFFECTS, ...effects },
  }
}

export const ANCHORS = {
  clear: anchor({ coverage: .3, low: { altitude: 900, height: 1300 }, birds: 1 }),
  cloudy: anchor({ coverage: .5, low: { altitude: 800, height: 1500, densityScale: .25 }, tint: [.95, .95, .97] }),
  rain: anchor({
    coverage: .6, low: { altitude: 700, height: 1800, densityScale: .5, coverageFilterWidth: .3 },
    mid: { altitude: 1600, height: 1500, densityScale: .3 }, exposure: 6, tint: [.62, .64, .7], rain: .7,
  }),
  storm: anchor({
    coverage: .62, low: { altitude: 600, height: 5000, densityScale: .7, coverageFilterWidth: .3 },
    mid: { altitude: 1600, height: 1500, densityScale: .3 }, exposure: 3.5, tint: [.4, .42, .48], rain: 1, storm: 1,
  }),
  fog: anchor({ coverage: .6, low: { altitude: 300, height: 900, densityScale: .3 }, tint: [.9, .9, .9], fog: 1 }),
  sunset: anchor({ coverage: .35, low: { altitude: 1200, height: 1200 }, tint: [1.02, .8, .62] }),
  night: anchor({ coverage: .2, low: { altitude: 1200, height: 1000 }, tint: [.32, .34, .48], night: 1 }),
}

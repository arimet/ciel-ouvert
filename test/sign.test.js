import { expect, test } from 'vitest'
import { homography, layoutSignText, signCorners, signSize } from '../src/scene/sign.js'

const apply = (H, [x, y]) => {
  const w = H[6] * x + H[7] * y + H[8]
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w]
}

test('homography maps the source corners onto the destination corners', () => {
  const src = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const dst = [[.2, .3], [.35, .32], [.34, .4], [.21, .41]]
  const H = homography(src, dst)
  src.forEach((p, i) => {
    const [x, y] = apply(H, p)
    expect(x).toBeCloseTo(dst[i][0], 9)
    expect(y).toBeCloseTo(dst[i][1], 9)
  })
})

test('homography keeps perspective: the centre maps to the diagonals crossing', () => {
  const H = homography([[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0], [2, 0], [1.5, 1], [.5, 1]])
  const [x, y] = apply(H, [.5, .5])
  expect(x).toBeCloseTo(1, 9)
  expect(y).toBeCloseTo(2 / 3, 9)
})

test('long names shrink then wrap', () => {
  const r = layoutSignText('Saint-Rémy-en-Bouzemont-Saint-Genest-et-Isson')
  expect(r.lines.length).toBe(2)
  expect(r.lines.every(l => l.length <= 32)).toBe(true)
  expect(r.lines.join('')).toBe('SAINT-RÉMY-EN-BOUZEMONT-SAINT-GENEST-ET-ISSON')
  expect(r.scale).toBeLessThan(1)
})

test('short names stay on one line at full scale', () => expect(layoutSignText('Laxou')).toEqual({ lines: ['LAXOU'], scale: 1 }))

test('medium names shrink on one line', () => expect(layoutSignText('Vandœuvre-lès-Nancy')).toEqual({ lines: ['VANDŒUVRE-LÈS-NANCY'], scale: 16 / 19 }))

test('a long name without hyphen still fits', () => {
  const r = layoutSignText('Abcdefghijklmnopqrstuvwxyzabcdefghij')
  expect(r.scale).toBeGreaterThanOrEqual(.5)
  expect(r.lines.length).toBeLessThanOrEqual(2)
})

test('long names split after the hyphen nearest the middle', () => {
  for (const name of ['Saint-Rémy-en-Bouzemont-Saint-Genest-et-Isson', 'Saint-Germain-de-la-Grange-sur-Marne-et-Loire']) {
    const { lines } = layoutSignText(name)
    expect(lines[0].endsWith('-')).toBe(true)
    expect(lines[1].startsWith('-')).toBe(false)
    expect(lines.join('')).toBe(name.toUpperCase())
  }
})

test('a hyphenated name past 20 letters goes on two lines, as on real signs', () => {
  expect(layoutSignText('Saint-Germain-sur-Morin').lines).toEqual(['SAINT-GERMAIN-', 'SUR-MORIN'])
})

// A 1.2 m × 1.5 m sign standing at (.8, .9) of a 3:2 photo whose horizon (eye level, 1.6 m) is at .7.
const place = { foot: [.8, .9], horizon: .7 }
const size = { width: 1.2, height: 1.5 }

test('facing the camera, the sign stands on its foot at the scale of the scene', () => {
  const [tl, tr, br, bl] = signCorners(place, size, 1.5, 0)
  const metre = (.9 - .7) / 1.6 // photo heights per metre at the foot
  expect(bl[1]).toBeCloseTo(.9, 6)
  expect(br[1]).toBeCloseTo(.9, 6)
  expect(bl[1] - tl[1]).toBeCloseTo(1.5 * metre, 6)
  expect((br[0] - bl[0]) * 1.5).toBeCloseTo(1.2 * metre, 6)
  expect((bl[0] + br[0]) / 2).toBeCloseTo(.8, 6)
})

test('turned toward the road, its near edge is taller than its far edge', () => {
  const [tl, tr, br, bl] = signCorners(place, size, 1.5, 15)
  expect(br[1] - tr[1]).toBeGreaterThan(bl[1] - tl[1])
})

test('the panel grows with the name, and a second line makes it taller', () => {
  const short = signSize(['LAXOU']), long = signSize(['MONTLOUIS-SUR-LOIRE']), two = signSize(['SAINT-GERMAIN-', 'SUR-MORIN'])
  expect(long.panel[0]).toBeGreaterThan(short.panel[0])
  expect(two.panel[1]).toBeGreaterThan(short.panel[1])
  expect(short.height).toBeCloseTo(short.post + short.panel[1], 6)
})

import { expect, test } from 'vitest'
import { homography, layoutSignText } from '../src/scene/sign.js'

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

// 3×3 projective transform (row-major) mapping the 4 src points onto the 4 dst points.
export function homography(src, dst) {
  const A = [], b = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u)
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v)
  }
  // Gaussian elimination with partial pivoting on the 8×8 system.
  for (let c = 0; c < 8; c++) {
    let p = c
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]]
    for (let r = 0; r < 8; r++) {
      if (r === c) continue
      const f = A[r][c] / A[c][c]
      for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]
      b[r] -= f * b[c]
    }
  }
  return [...b.map((v, i) => v / A[i][i]), 1]
}

const MAX = 16

// Sign text: up to 16 characters at full size, then smaller, or on two lines when there is a hyphen to cut at.
export function layoutSignText(name, maxChars = MAX) {
  const text = name.toUpperCase()
  if (text.length <= maxChars) return { lines: [text], scale: 1 }
  if (text.length <= maxChars * 2 && !text.includes('-')) return { lines: [text], scale: maxChars / text.length }
  // Cut after the hyphen nearest the middle (the hyphen stays on line 1); the middle if there is none.
  const mid = text.length / 2
  let cut = -1
  for (let i = 0; i < text.length; i++) if (text[i] === '-' && (cut < 0 || Math.abs(i + 1 - mid) < Math.abs(cut - mid))) cut = i + 1
  if (cut < 0) cut = Math.round(mid)
  const lines = [text.slice(0, cut), text.slice(cut)]
  return { lines, scale: Math.max(.5, maxChars / Math.max(...lines.map(l => l.length))) }
}

// Real-world size of the sign in metres: an EB10 panel as wide as the name needs, on posts 1 m high.
export function signSize(lines) {
  // Capitals are .24 m (one line) or .2 m (two lines) high, about half as wide.
  const chars = Math.max(...lines.map(l => l.length)), letter = lines.length > 1 ? .104 : .125
  const panel = [Math.min(2.4, Math.max(.9, .3 + letter * chars)), lines.length > 1 ? .8 : .5]
  const post = 1
  return { panel, post, width: panel[0], height: post + panel[1] }
}

// Where the sign's corners land in the photo (UV, origin top-left: TL, TR, BR, BL). It stands on `foot`, on the ground;
// `horizon` is the eye level of the photo, taken as 1.6 m above the ground, which gives the scale at that spot.
// yaw (degrees) turns it toward the road: its right edge comes closer. f is the focal length in photo heights.
export function signCorners({ foot: [fx, fy], horizon }, { width, height }, aspect, yaw = 15, f = 1.2, eye = 1.6) {
  const metre = (fy - horizon) / eye
  const z0 = f / metre, x0 = (fx - .5) * aspect * z0 / f
  const c = Math.cos(yaw * Math.PI / 180), s = Math.sin(yaw * Math.PI / 180)
  const project = (along, up) => {
    const x = x0 + along * c, z = z0 - along * s
    return [(.5 * aspect + f * x / z) / aspect, horizon + f * (eye - up) / z]
  }
  const corners = [project(-width / 2, height), project(width / 2, height), project(width / 2, 0), project(-width / 2, 0)]
  // A long name makes a wide panel: rather than leave the photo, the sign steps inward along the same ground line.
  const over = Math.max(...corners.map(c => c[0])) - .97
  return over > 1e-9 ? signCorners({ foot: [fx - over, fy], horizon }, { width, height }, aspect, yaw, f, eye) : corners
}

const FONT = '"Barlow Semi Condensed", "Arial Narrow", sans-serif'
const PX = 400 // canvas pixels per metre

// French town entry sign (EB10) as it stands in the street: aluminium edge, white rim, red border, retroreflective
// white field with black capitals, two galvanised posts, a little road grime. Light and grain come from the photo.
export async function drawSign(name) {
  const { lines } = layoutSignText(name)
  const size = signSize(lines)
  const em = (lines.length > 1 ? .2 : .24) * PX
  await document.fonts?.load(`700 ${em}px ${FONT}`, lines.join('')).catch(() => {})
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(size.width * PX); canvas.height = Math.round(size.height * PX)
  const g = canvas.getContext('2d')
  const [pw, ph] = size.panel.map(v => Math.round(v * PX))
  const rand = seeded(name.length * 97 + name.charCodeAt(0))
  const round = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r) }

  // Posts: zinc tubes lit from the sky, mottled, dirtier near the ground.
  const tube = .06 * PX
  for (const cx of [-1, 1].map(k => pw / 2 + k * Math.min(pw / 2 - .18 * PX, pw * .32))) {
    const x = cx - tube / 2
    const shade = g.createLinearGradient(x, 0, x + tube, 0)
    shade.addColorStop(0, '#5f6366'); shade.addColorStop(.3, '#c6c9ca'); shade.addColorStop(.55, '#9a9ea1'); shade.addColorStop(1, '#4e5255')
    g.fillStyle = shade; g.fillRect(x, ph * .2, tube, canvas.height - ph * .2)
    for (let i = 0; i < 160; i++) {
      g.fillStyle = rand() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'
      g.fillRect(x + rand() * tube, ph + rand() * (canvas.height - ph), 2 + rand() * 4, 2 + rand() * 6)
    }
    const dirt = g.createLinearGradient(0, canvas.height - .25 * PX, 0, canvas.height)
    dirt.addColorStop(0, 'rgba(45,38,28,0)'); dirt.addColorStop(1, 'rgba(45,38,28,.55)')
    g.fillStyle = dirt; g.fillRect(x, canvas.height - .25 * PX, tube, .25 * PX)
  }

  // Panel: edge, rim, border, field.
  const r = ph * .04, b0 = ph * .028, b1 = b0 + ph * .07
  round(0, 0, pw, ph, r); g.fillStyle = '#8e9194'; g.fill()
  round(2, 2, pw - 4, ph - 4, r - 1); g.fillStyle = '#ecece7'; g.fill()
  const red = g.createLinearGradient(0, 0, 0, ph)
  red.addColorStop(0, '#c0242d'); red.addColorStop(1, '#a51f28')
  round(b0, b0, pw - 2 * b0, ph - 2 * b0, r * .8); g.fillStyle = red; g.fill()
  const field = g.createLinearGradient(0, b1, 0, ph - b1)
  field.addColorStop(0, '#f3f3ef'); field.addColorStop(.6, '#e9e9e4'); field.addColorStop(1, '#dcdbd4')
  round(b1, b1, pw - 2 * b1, ph - 2 * b1, r * .45); g.fillStyle = field; g.fill()

  // Capitals.
  g.fillStyle = '#151515'
  g.font = `700 ${em}px ${FONT}`
  g.textAlign = 'center'; g.textBaseline = 'middle'
  if ('letterSpacing' in g) g.letterSpacing = `${em * .02}px`
  lines.forEach((l, i) => g.fillText(l, pw / 2, ph / 2 + em * .04 + (i - (lines.length - 1) / 2) * em * 1.02, pw - 2 * b1 - .08 * PX))

  // Wear over the whole face: a soft sheen from the sky, grime settling at the bottom, streaks and specks.
  g.save()
  round(0, 0, pw, ph, r); g.clip()
  const sheen = g.createLinearGradient(0, 0, pw * .6, ph)
  sheen.addColorStop(0, 'rgba(255,255,255,.10)'); sheen.addColorStop(.5, 'rgba(255,255,255,0)')
  g.fillStyle = sheen; g.fillRect(0, 0, pw, ph)
  const grime = g.createLinearGradient(0, ph * .55, 0, ph)
  grime.addColorStop(0, 'rgba(80,70,50,0)'); grime.addColorStop(1, 'rgba(80,70,50,.16)')
  g.fillStyle = grime; g.fillRect(0, 0, pw, ph)
  for (let i = 0; i < 14; i++) {
    g.fillStyle = `rgba(90,80,60,${.03 + rand() * .04})`
    g.fillRect(rand() * pw, rand() * ph * .3, 1 + rand() * 3, ph * (.2 + rand() * .6))
  }
  for (let i = 0; i < 700; i++) {
    g.fillStyle = `rgba(60,55,45,${.02 + rand() * .06})`
    g.fillRect(rand() * pw, rand() * ph, 1 + rand() * 2, 1 + rand() * 2)
  }
  g.restore()
  return { canvas, size }
}

function seeded(seed) {
  let s = seed >>> 0
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32
}

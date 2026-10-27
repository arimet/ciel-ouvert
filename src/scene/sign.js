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

// Sign text: up to 16 characters at full size, then smaller, then on two lines (past 20 if there is a hyphen to cut at).
export function layoutSignText(name, maxChars = MAX) {
  const text = name.toUpperCase()
  if (text.length <= maxChars) return { lines: [text], scale: 1 }
  if (text.length <= maxChars * 2 && (text.length <= 20 || !text.includes('-'))) return { lines: [text], scale: maxChars / text.length }
  // Cut after the hyphen nearest the middle (the hyphen stays on line 1); the middle if there is none.
  const mid = text.length / 2
  let cut = -1
  for (let i = 0; i < text.length; i++) if (text[i] === '-' && (cut < 0 || Math.abs(i + 1 - mid) < Math.abs(cut - mid))) cut = i + 1
  if (cut < 0) cut = Math.round(mid)
  const lines = [text.slice(0, cut), text.slice(cut)]
  return { lines, scale: Math.max(.5, maxChars / Math.max(...lines.map(l => l.length))) }
}

// French town entry sign (EB10): white field, red border inside a thin white rim, rounded corners, black capitals,
// on two galvanised posts. The canvas is 600×420: panel on top, posts below, transparent around, so the catalog
// corners span panel and posts. Light and grain come from the photo, in the shader.
export function drawSign(name) {
  const canvas = document.createElement('canvas')
  canvas.width = 600; canvas.height = 420
  const g = canvas.getContext('2d')
  const round = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r) }

  // Posts: round tubes, lit from the sky, darker toward the ground.
  for (const x of [150, 436]) {
    const tube = g.createLinearGradient(x, 0, x + 14, 0)
    tube.addColorStop(0, '#5d6165'); tube.addColorStop(.35, '#b9bdc0'); tube.addColorStop(1, '#4a4d50')
    g.fillStyle = tube; g.fillRect(x, 180, 14, 240)
    const ground = g.createLinearGradient(0, 330, 0, 420)
    ground.addColorStop(0, 'rgba(0,0,0,0)'); ground.addColorStop(1, 'rgba(0,0,0,.35)')
    g.fillStyle = ground; g.fillRect(x, 330, 14, 90)
  }

  // Panel: rim, border, field. The field is lit from above (overcast) and a little grimy at the bottom.
  g.fillStyle = '#ecebe6'; round(0, 0, 600, 200, 14); g.fill()
  g.fillStyle = '#b81a2c'; round(5, 5, 590, 190, 11); g.fill()
  const field = g.createLinearGradient(0, 20, 0, 180)
  field.addColorStop(0, '#f4f3ee'); field.addColorStop(.7, '#e9e8e2'); field.addColorStop(1, '#d9d7cf')
  g.fillStyle = field; round(19, 19, 562, 162, 6); g.fill()
  // Fine dust so the field is not a flat colour.
  for (let i = 0; i < 900; i++) {
    const x = 19 + Math.random() * 562, y = 19 + Math.random() * 162
    g.fillStyle = `rgba(60,55,45,${.03 + Math.random() * .05 * (y / 180)})`
    g.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }

  // Capitals about 45 % of the field height, narrowed rather than shrunk when the name is long.
  const { lines, scale } = layoutSignText(name)
  const size = lines.length > 1 ? 66 : 96 * Math.max(scale, .62)
  g.fillStyle = '#16171a'
  g.font = `700 ${size}px "Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif`
  g.textAlign = 'center'; g.textBaseline = 'middle'
  lines.forEach((l, i) => g.fillText(l, 300, 104 + (i - (lines.length - 1) / 2) * size * 1.02, 520))
  return canvas
}

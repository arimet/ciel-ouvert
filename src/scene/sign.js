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

// Sign text: up to 16 characters at full size, then smaller, then on two lines.
export function layoutSignText(name, maxChars = MAX) {
  const text = name.toUpperCase()
  if (text.length <= maxChars) return { lines: [text], scale: 1 }
  if (text.length <= maxChars * 2) return { lines: [text], scale: maxChars / text.length }
  // Cut after the hyphen nearest the middle (the hyphen stays on line 1); the middle if there is none.
  const mid = text.length / 2
  let cut = -1
  for (let i = 0; i < text.length; i++) if (text[i] === '-' && (cut < 0 || Math.abs(i + 1 - mid) < Math.abs(cut - mid))) cut = i + 1
  if (cut < 0) cut = Math.round(mid)
  const lines = [text.slice(0, cut), text.slice(cut)]
  return { lines, scale: Math.max(.5, maxChars / Math.max(...lines.map(l => l.length))) }
}

// French town entry sign on its post: white panel, red border, black capitals, 3:1.
// The canvas is 600×420: panel on top, post below, transparent around, so the catalog corners span panel and post.

export function drawSign(name) {
  const canvas = document.createElement('canvas')
  canvas.width = 600; canvas.height = 420
  const g = canvas.getContext('2d')
  g.fillStyle = '#7d8084'; g.fillRect(288, 190, 24, 230)
  g.fillStyle = '#c8102e'; g.fillRect(0, 0, 600, 200)
  g.fillStyle = '#fff'; g.fillRect(12, 12, 576, 176)
  const { lines, scale } = layoutSignText(name)
  const size = 64 * scale
  g.fillStyle = '#111'
  g.font = `700 ${size}px "Arial Narrow", "Helvetica Neue", Arial, sans-serif`
  g.textAlign = 'center'; g.textBaseline = 'middle'
  lines.forEach((l, i) => g.fillText(l, 300, 100 + (i - (lines.length - 1) / 2) * size * 1.1, 560))
  return canvas
}

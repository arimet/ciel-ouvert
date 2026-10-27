// Sky matting helpers for prepare-scene: refine a coarse sky mask and remove the old sky's tint from edge pixels.

// Mean over a (2r+1)² window, clamped at the borders, via an integral image.
function boxMean(src, W, H, r) {
  const S = new Float64Array((W + 1) * (H + 1))
  for (let y = 0; y < H; y++) {
    let row = 0
    for (let x = 0; x < W; x++) {
      row += src[y * W + x]
      S[(y + 1) * (W + 1) + x + 1] = S[y * (W + 1) + x + 1] + row
    }
  }
  const out = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1)
    for (let x = 0; x < W; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(W, x + r + 1)
      const sum = S[y1 * (W + 1) + x1] - S[y0 * (W + 1) + x1] - S[y1 * (W + 1) + x0] + S[y0 * (W + 1) + x0]
      out[y * W + x] = sum / ((y1 - y0) * (x1 - x0))
    }
  }
  return out
}

// Guided filter (He et al.): smooths p while following the edges of guide. Both in [0, 1], length W·H.
export function guidedFilter(guide, p, W, H, r, eps) {
  const mul = (a, b) => a.map((v, i) => v * b[i])
  const mI = boxMean(guide, W, H, r), mP = boxMean(p, W, H, r)
  const cII = boxMean(mul(guide, guide), W, H, r), cIP = boxMean(mul(guide, p), W, H, r)
  const a = new Float32Array(W * H), b = new Float32Array(W * H)
  for (let i = 0; i < W * H; i++) {
    a[i] = (cIP[i] - mI[i] * mP[i]) / (cII[i] - mI[i] * mI[i] + eps)
    b[i] = mP[i] - a[i] * mI[i]
  }
  const mA = boxMean(a, W, H, r), mB = boxMean(b, W, H, r)
  return guide.map((v, i) => Math.min(1, Math.max(0, mA[i] * v + mB[i])))
}

// Edge pixels mix wall and old sky: I = (1 − a)·F + a·B. Solve for the wall colour F.
// rgb and skyRgb are interleaved RGB in [0, 1]; alphaSky is the sky share per pixel.
// The solve divides by 1 − a, so a is capped: past it, noise would be amplified into false colours.
export function decontaminate(rgb, alphaSky, skyRgb, W, H, maxAlpha = .6) {
  const out = Float32Array.from(rgb)
  for (let i = 0; i < W * H; i++) {
    const a = Math.min(alphaSky[i], maxAlpha)
    if (a <= .02 || alphaSky[i] >= .98) continue
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.min(1, Math.max(0, (rgb[i * 3 + c] - a * skyRgb[i * 3 + c]) / (1 - a)))
  }
  return out
}

// Average colour around each pixel of the pixels where `which` > .9 (e.g. confident sky).
export function localColour(rgb, which, W, H, r) {
  const sure = which.map(a => (a > .9 ? 1 : 0))
  const weight = boxMean(sure, W, H, r)
  let total = [0, 0, 0], n = 0
  const channels = [0, 1, 2].map(c => {
    const ch = new Float32Array(W * H)
    for (let i = 0; i < W * H; i++) {
      ch[i] = rgb[i * 3 + c] * sure[i]
      if (sure[i]) { total[c] += rgb[i * 3 + c]; if (c === 0) n++ }
    }
    return boxMean(ch, W, H, r)
  })
  const mean = total.map(t => t / Math.max(1, n))
  const out = new Float32Array(W * H * 3)
  for (let i = 0; i < W * H; i++) {
    for (let c = 0; c < 3; c++) out[i * 3 + c] = weight[i] > .01 ? channels[c][i] / weight[i] : mean[c]
  }
  return out
}

// Segmentation misses sky seen through lattices and arches. Pixels the depth model puts at infinity, near confident sky,
// whose colour matches it become sky, softly by colour distance. depth is disparity in [0, 1].
export function fillSkyHoles(rgb, alpha, depth, W, H, { reach = 120, tol = .2, far = .03 } = {}) {
  const skyC = localColour(rgb, alpha, W, H, reach)
  const nearSky = boxMean(alpha.map(a => (a > .9 ? 1 : 0)), W, H, reach)
  const out = Float32Array.from(alpha)
  for (let i = 0; i < W * H; i++) {
    if (alpha[i] > .5 || depth[i] > far || nearSky[i] === 0) continue
    let d = 0
    for (let c = 0; c < 3; c++) d += (rgb[i * 3 + c] - skyC[i * 3 + c]) ** 2
    out[i] = Math.max(alpha[i], Math.min(1, Math.max(0, 1 - Math.sqrt(d) / tol)))
  }
  return out
}

// Snaps a coarse sky mask (1 = sky) to the real skyline: within `band` px of the coarse edge,
// each pixel is re-classified by colour, between the local sky colour and the local wall colour.
export function refineMask(rgb, coarse, W, H, band) {
  const near = boxMean(coarse, W, H, band)
  const inBand = near.map(v => (v > .001 && v < .999 ? 1 : 0))
  const sky = coarse.map((c, i) => (c > .5 && !inBand[i] ? 1 : 0))
  const wall = coarse.map((c, i) => (c <= .5 && !inBand[i] ? 1 : 0))
  const skyC = localColour(rgb, sky, W, H, band * 4)
  const wallC = localColour(rgb, wall, W, H, band * 4)
  const out = Float32Array.from(coarse)
  for (let i = 0; i < W * H; i++) {
    if (!inBand[i]) continue
    let ds = 0, dw = 0
    for (let c = 0; c < 3; c++) {
      ds += (rgb[i * 3 + c] - skyC[i * 3 + c]) ** 2
      dw += (rgb[i * 3 + c] - wallC[i * 3 + c]) ** 2
    }
    // Where sky and wall colours are alike (white stone under a white sky), trust the coarse mask more.
    const confidence = Math.abs(dw - ds) / (ds + dw + 1e-9)
    out[i] = confidence * dw / (ds + dw + 1e-9) + (1 - confidence) * near[i]
  }
  return out
}

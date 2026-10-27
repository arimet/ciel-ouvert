// Turns a photo into a scene: node tools/prepare-scene.mjs <id> <photoPathOrUrl>
// Writes into public/scenes/<id>/:
//   photo.webp  1600 px, with the old sky's tint removed from skyline pixels
//   mask.png    full resolution, white = photo, black = sky (soft edges)
//   depth.png   800 px disparity (white = near, black = far), for fog, rain and lights
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { pipeline, RawImage } from '@huggingface/transformers'
import { decontaminate, fillSkyHoles, localColour, refineMask } from './matting.mjs'

const [id, source] = process.argv.slice(2)
if (!id || !source) {
  console.error('usage: node tools/prepare-scene.mjs <id> <photoPathOrUrl>')
  process.exit(2)
}

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'ciel-ouvert/0.1 (https://github.com/arimet/ciel-ouvert)' } })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}
const original = /^https?:/.test(source) ? await download(source) : await readFile(source)

const dir = new URL(`../public/scenes/${id}/`, import.meta.url)
await mkdir(dir, { recursive: true })

const { data: raw, info } = await sharp(original).rotate().resize({ width: 1600, withoutEnlargement: true }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height
const png = await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer()
const image = await RawImage.fromBlob(new Blob([png]))

// Depth: disparity, used for fog/rain/lights and to veto "sky" on near surfaces.
const estimate = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', { dtype: 'fp32' })
const { depth } = await estimate(image)
const depthFull = await sharp(Buffer.from(depth.data), { raw: { width: depth.width, height: depth.height, channels: depth.channels } })
  .resize(W, H).grayscale().raw().toBuffer()
await writeFile(new URL('depth.png', dir), await sharp(Buffer.from(depth.data), { raw: { width: depth.width, height: depth.height, channels: depth.channels } })
  .resize({ width: 800 }).grayscale().png({ compressionLevel: 9 }).toBuffer())

// Sky: semantic segmentation (ADE20K "sky"), vetoed where depth says it is near, snapped to the skyline by colour,
// then extended to the sky seen through lattices and arches.
const segment = await pipeline('image-segmentation', 'Xenova/segformer-b2-finetuned-ade-512-512')
const skyPart = (await segment(image)).find(p => p.label === 'sky')
const coarse = new Float32Array(W * H)
if (skyPart) for (let i = 0; i < W * H; i++) coarse[i] = skyPart.mask.data[i] > 127 && depthFull[i] < 40 ? 1 : 0
const rgb = Float32Array.from(raw, v => v / 255)
const alpha = fillSkyHoles(rgb, refineMask(rgb, coarse, W, H, 5), Float32Array.from(depthFull, v => v / 255), W, H)

const clean = decontaminate(rgb, alpha, localColour(rgb, alpha, W, H, 24), W, H)
const photo = await sharp(Buffer.from(clean.map(v => Math.round(v * 255))), { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 82 }).toBuffer()
await writeFile(new URL('photo.webp', dir), photo)
const mask = Buffer.from(alpha.map(a => Math.round((1 - a) * 255)))
const maskPng = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).png({ compressionLevel: 9 }).toBuffer()
await writeFile(new URL('mask.png', dir), maskPng)

const kb = b => `${(b.length / 1024).toFixed(0)} kB`
console.log(`${id}: ${W}×${H}, photo ${kb(photo)}, mask ${kb(maskPng)}, sky ${(alpha.reduce((s, a) => s + a, 0) / (W * H) * 100).toFixed(0)} %`)

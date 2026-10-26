// Turns a photo into a scene: node tools/prepare-scene.mjs <id> <photoPathOrUrl>
// Writes public/scenes/<id>/photo.webp (1600 px) and depth.png (800 px, disparity: white = near, black = sky).
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { pipeline, RawImage } from '@huggingface/transformers'

const [id, source] = process.argv.slice(2)
if (!id || !source) {
  console.error('usage: node tools/prepare-scene.mjs <id> <photoPathOrUrl>')
  process.exit(2)
}

const original = /^https?:/.test(source)
  ? Buffer.from(await (await fetch(source, { headers: { 'User-Agent': 'ciel-ouvert/0.1 (https://github.com/arimet/ciel-ouvert)' } })).arrayBuffer())
  : await readFile(source)

const dir = new URL(`../public/scenes/${id}/`, import.meta.url)
await mkdir(dir, { recursive: true })

const photo = await sharp(original).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer()
await writeFile(new URL('photo.webp', dir), photo)

const estimate = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', { dtype: 'fp32' })
const png = await sharp(photo).png().toBuffer()
const { depth } = await estimate(await RawImage.fromBlob(new Blob([png])))
const depthPng = await sharp(Buffer.from(depth.data), { raw: { width: depth.width, height: depth.height, channels: depth.channels } })
  .resize({ width: 800 }).grayscale().png({ compressionLevel: 9 }).toBuffer()
await writeFile(new URL('depth.png', dir), depthPng)

const meta = await sharp(photo).metadata()
console.log(`${id}: photo ${meta.width}×${meta.height} ${(photo.length / 1024).toFixed(0)} kB, depth ${(depthPng.length / 1024).toFixed(0)} kB`)

// Panel photo for a lesson step or a cloud: node tools/prepare-photo.mjs <key> <photoPathOrUrl> [top|center|bottom]
// Writes public/insets/<key>.webp, 800×450 (16:9, as shown in the panels).
import { mkdir, readFile } from 'node:fs/promises'
import sharp from 'sharp'

const [key, source, position = 'center'] = process.argv.slice(2)
if (!key || !source) {
  console.error('usage: node tools/prepare-photo.mjs <key> <photoPathOrUrl> [top|center|bottom]')
  process.exit(2)
}
const original = /^https?:/.test(source)
  ? Buffer.from(await (await fetch(source, { headers: { 'User-Agent': 'ciel-ouvert/0.1 (https://github.com/arimet/ciel-ouvert)' } })).arrayBuffer())
  : await readFile(source)
const dir = new URL('../public/insets/', import.meta.url)
await mkdir(dir, { recursive: true })
const out = new URL(`${key}.webp`, dir).pathname
const { size } = await sharp(original).rotate().resize(800, 450, { fit: 'cover', position }).webp({ quality: 78 }).toFile(out)
console.log(`${key}: ${(size / 1024).toFixed(0)} kB`)

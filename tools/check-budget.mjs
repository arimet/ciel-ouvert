// Builds the site and sums what a visitor downloads before the first frame. Fails above 5 MB.
import { execSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const LIMIT = 5_000_000
execSync('npx vite build', { stdio: 'ignore' })
const dist = new URL('../dist/', import.meta.url).pathname
const files = [
  'index.html',
  ...readdirSync(join(dist, 'assets')).map(f => join('assets', f)),
  ...readdirSync(join(dist, 'clouds')).map(f => join('clouds', f)),
  'core/stbn.bin', 'scenes/nancy/photo.webp', 'scenes/nancy/depth.png',
]
let total = 0
for (const f of files) {
  const size = statSync(join(dist, f)).size
  total += size
  console.log(`${(size / 1e6).toFixed(2).padStart(6)} MB  ${f}`)
}
console.log(`${(total / 1e6).toFixed(2).padStart(6)} MB  total (limit ${LIMIT / 1e6} MB)`)
process.exit(total > LIMIT ? 1 : 0)

import { existsSync } from 'node:fs'
import { expect, test } from 'vitest'
import { LESSONS, SKY_TEXTS } from '../src/lessons/content/index.js'
import { PHOTOS } from '../src/lessons/photos.js'

test('every lesson step shows a photo', () => {
  for (const lesson of LESSONS) for (const step of lesson.steps) expect(PHOTOS[step.photo], `${lesson.id}: ${step.title}`).toBeDefined()
})

test('every sky explanation shows the photo of its cloud', () => {
  for (const key of Object.keys(SKY_TEXTS)) expect(PHOTOS[key], key).toBeDefined()
})

test('every photo is on disk, described and credited', () => {
  for (const [key, p] of Object.entries(PHOTOS)) {
    expect(existsSync(new URL(`../public/${p.src}`, import.meta.url)), key).toBe(true)
    expect(p.alt.length, key).toBeGreaterThan(10)
    expect(p.credit.author && p.credit.license && p.credit.url.startsWith('https://commons.wikimedia.org/wiki/File:'), key).toBeTruthy()
  }
})

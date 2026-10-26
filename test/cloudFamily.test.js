import { expect, test } from 'vitest'
import { probableCloudFamilies } from '../src/weather/cloudFamily.js'

const base = { cloudLow: 0, cloudMid: 0, cloudHigh: 0, precipitation: 0, weatherCode: 0 }
const keys = w => probableCloudFamilies({ ...base, ...w }).map(f => f.key)

test('thunderstorm means cumulonimbus', () => expect(keys({ weatherCode: 95, cloudLow: 90 })).toEqual(['cumulonimbus']))
test('fog code means fog', () => expect(keys({ weatherCode: 45 })).toEqual(['fog']))
test('thick low layer with rain is nimbostratus', () => expect(keys({ cloudLow: 90, precipitation: 2, weatherCode: 63 })).toEqual(['nimbostratus']))
test('drizzle under a low layer is stratus', () => expect(keys({ cloudLow: 70, weatherCode: 53 })).toEqual(['stratus']))
test('dry low layer is stratocumulus', () => expect(keys({ cloudLow: 70 })).toEqual(['stratocumulus']))
test('scattered low and high clouds', () => expect(keys({ cloudLow: 30, cloudHigh: 40 })).toEqual(['cumulus', 'cirrus']))
test('mid layers', () => {
  expect(keys({ cloudMid: 90 })).toEqual(['altostratus'])
  expect(keys({ cloudMid: 50 })).toEqual(['altocumulus'])
})
test('high veil is cirrostratus', () => expect(keys({ cloudHigh: 80 })).toEqual(['cirrostratus']))
test('clear sky', () => expect(keys({})).toEqual(['clear']))
test('every phrase is a probability, never a certainty', () => {
  for (const w of [{ weatherCode: 95 }, { cloudLow: 30, cloudMid: 50, cloudHigh: 40 }, {}]) {
    for (const f of probableCloudFamilies({ ...base, ...w })) expect(f.phrase).toMatch(/^Probablement /)
  }
})

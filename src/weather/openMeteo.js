const FIELDS = 'temperature_2m,weather_code,cloud_cover_low,cloud_cover_mid,cloud_cover_high,precipitation,snowfall,visibility,wind_speed_10m,wind_direction_10m'

export async function fetchCurrent(lat, lon, fetchFn = fetch) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${FIELDS}&timezone=auto`
  // AbortController rather than AbortSignal.timeout, missing before Safari 16 (iOS 15).
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  const res = await fetchFn(url, { signal: controller.signal }).finally(() => clearTimeout(timer))
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const { current: c, utc_offset_seconds } = await res.json()
  return {
    time: c.time, utcOffset: utc_offset_seconds, temperature: c.temperature_2m, weatherCode: c.weather_code,
    cloudLow: c.cloud_cover_low, cloudMid: c.cloud_cover_mid, cloudHigh: c.cloud_cover_high,
    precipitation: c.precipitation, snowfall: c.snowfall, visibility: c.visibility ?? null,
    windSpeed: c.wind_speed_10m, windDirection: c.wind_direction_10m,
  }
}

export async function loadWeather(lat, lon, fetchFn = fetch) {
  try {
    return { weather: await fetchCurrent(lat, lon, fetchFn), error: false }
  } catch {
    return { weather: null, error: true }
  }
}

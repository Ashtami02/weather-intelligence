import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from 'lucide-react'

export type Location = {
  name: string
  country: string
  state?: string | null
  latitude: number
  longitude: number
}

export type Current = {
  temperature_2m: number | null
  apparent_temperature: number | null
  relative_humidity_2m: number | null
  wind_speed_10m: number | null
  precipitation: number | null
  weather_code: number | null
}

export type Forecast = {
  time: string[]
  temperature_2m_min: (number | null)[]
  temperature_2m_max: (number | null)[]
  precipitation_sum: (number | null)[]
  weather_code: (number | null)[]
  sunrise: (string | null)[]
  sunset: (string | null)[]
}

export type History = {
  id: number
  city: string
  country: string
  latitude: number
  longitude: number
  temperature: number
  searched_at: string
}

export const api = (import.meta.env.VITE_API_URL?.trim() || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')).replace(/\/+$/, '')

export function placeName(place: Location) {
  return [place.name, place.state, place.country].filter(Boolean).join(', ')
}

export function coordinates(place: Location) {
  return new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
  })
}

export function condition(code: number | null) {
  if (code === 0) return { label: 'Clear sky', Icon: Sun }
  if (code === 1) return { label: 'Mainly clear', Icon: CloudSun }
  if (code === 2) return { label: 'Partly cloudy', Icon: CloudSun }
  if (code === 3) return { label: 'Overcast', Icon: Cloud }
  if (code === 45 || code === 48) return { label: 'Fog', Icon: CloudFog }
  if (code === 51 || code === 53 || code === 55) return { label: 'Drizzle', Icon: CloudDrizzle }
  if (code === 56 || code === 57) return { label: 'Freezing drizzle', Icon: CloudDrizzle }
  if (code === 61 || code === 63 || code === 65) return { label: 'Rain', Icon: CloudRain }
  if (code === 66 || code === 67) return { label: 'Freezing rain', Icon: CloudRain }
  if (code === 71 || code === 73 || code === 75 || code === 77) return { label: 'Snow', Icon: CloudSnow }
  if (code === 80 || code === 81 || code === 82) return { label: 'Rain showers', Icon: CloudRain }
  if (code === 85 || code === 86) return { label: 'Snow showers', Icon: CloudSnow }
  if (code === 95) return { label: 'Thunderstorm', Icon: CloudLightning }
  if (code === 96 || code === 99) return { label: 'Thunderstorm with hail', Icon: CloudLightning }
  return { label: 'Condition unavailable', Icon: Cloud }
}

export function reading(value: number | null, unit: string) {
  return value == null ? '—' : `${value}${unit}`
}

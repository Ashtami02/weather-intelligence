import { useState } from 'react'
import { Columns2 } from 'lucide-react'
import CitySearch from './CitySearch'
import { api, coordinates, placeName, reading } from './weather'
import type { Current, Location } from './weather'

type CityWeather = {
  place: Location | null
  weather: Current | null
  loading: boolean
  error: string
}

const emptyCity: CityWeather = { place: null, weather: null, loading: false, error: '' }

const metrics = [
  { label: 'Temperature', key: 'temperature_2m', unit: '°C' },
  { label: 'Feels like', key: 'apparent_temperature', unit: '°C' },
  { label: 'Humidity', key: 'relative_humidity_2m', unit: '%' },
  { label: 'Wind speed', key: 'wind_speed_10m', unit: ' km/h' },
  { label: 'Precipitation', key: 'precipitation', unit: ' mm' },
] as const

export default function CityComparison() {
  const [first, setFirst] = useState(emptyCity)
  const [second, setSecond] = useState(emptyCity)
  const firstTemperature = first.weather?.temperature_2m
  const secondTemperature = second.weather?.temperature_2m

  async function loadCity(place: Location, city: number) {
    const setCity = city === 1 ? setFirst : setSecond
    setCity({ place, weather: null, loading: true, error: '' })
    try {
      const response = await fetch(`${api}/api/weather/current?${coordinates(place)}`)
      if (!response.ok) throw new Error()
      const weather: Current = await response.json()
      setCity({ place, weather, loading: false, error: '' })
    } catch {
      setCity({ place, weather: null, loading: false, error: 'Could not load this city’s weather. Try again.' })
    }
  }

  return (
    <section className="panel comparison-panel" id="compare" aria-labelledby="compare-title">
      <div className="panel-heading">
        <span className="section-icon"><Columns2 size={19} /></span>
        <h2 id="compare-title">Compare cities</h2>
      </div>
      <div className="comparison-searches">
        {[first, second].map((city, index) => (
          <div className="comparison-search" key={index}>
            <p className="comparison-label">City {index + 1}</p>
            <CitySearch label={`Comparison city ${index + 1}`} onSelect={(place) => void loadCity(place, index + 1)} disabled={city.loading} />
            {city.loading && <p className="muted search-message" role="status">Loading weather…</p>}
            {city.error && <p className="error-text search-message" role="status">{city.error}</p>}
          </div>
        ))}
      </div>
      {(first.weather || second.weather) ? (
        <>
          <table className="comparison-table">
            <thead>
              <tr>
                <th scope="col">Reading</th>
                <th scope="col">{first.place ? placeName(first.place) : 'City 1'}</th>
                <th scope="col">{second.place ? placeName(second.place) : 'City 2'}</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(({ label, key, unit }) => (
                <tr key={key}>
                  <th scope="row">{label}</th>
                  <td>{reading(first.weather?.[key] ?? null, unit)}</td>
                  <td>{reading(second.weather?.[key] ?? null, unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {firstTemperature != null && secondTemperature != null && (
            <p className="comparison-difference" role="status">
              Temperature difference <strong>{Math.abs(firstTemperature - secondTemperature).toFixed(1)}°C</strong>
            </p>
          )}
        </>
      ) : <p className="muted panel-message">Select two cities to compare their current conditions.</p>}
    </section>
  )
}

import { BarChart3, CalendarDays, CloudSun, Droplet, LineChart as LineIcon, MapPin, Sunrise, Sunset, Thermometer, Wind } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { condition, reading } from './weather'
import type { Current, Forecast, Location } from './weather'

export function CurrentWeather({ place, weather, loading, error }: {
  place: Location | null
  weather: Current | null
  loading: boolean
  error: string
}) {
  const { label, Icon } = condition(weather?.weather_code ?? null)
  const metrics = weather ? [
    { label: 'Feels like', value: reading(weather.apparent_temperature, '°C'), Icon: Thermometer },
    { label: 'Humidity', value: reading(weather.relative_humidity_2m, '%'), Icon: Droplet },
    { label: 'Wind speed', value: reading(weather.wind_speed_10m, ' km/h'), Icon: Wind },
    { label: 'Precipitation', value: reading(weather.precipitation, ' mm'), Icon: Droplet },
  ] : []

  return (
    <section className="panel current-panel" aria-labelledby="current-title">
      <div className="panel-heading">
        <span className="section-icon"><CloudSun size={20} /></span>
        <h2 id="current-title">Current conditions</h2>
      </div>
      {place && (
        <div className="place-label">
          <MapPin size={16} aria-hidden="true" />
          {[place.name, place.state, place.country].filter(Boolean).join(', ')}
        </div>
      )}
      {weather ? (
        <>
          <div className="current-reading">
            <div>
              <p className="temperature">{reading(weather.temperature_2m, '°C')}</p>
              <p className="condition">{label}</p>
            </div>
            <Icon className="current-icon" size={88} strokeWidth={1.35} aria-hidden="true" />
          </div>
          <dl className="metrics-grid">
            {metrics.map(({ label, value, Icon }) => (
              <div className="metric" key={label}>
                <dt><Icon size={16} aria-hidden="true" /> {label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <div className="weather-empty" role="status">
          <CloudSun size={48} strokeWidth={1.35} aria-hidden="true" />
          <p className={error ? 'error-text' : ''}>
            {error || (loading ? 'Loading current conditions…' : 'Search for a city to see the current weather.')}
          </p>
        </div>
      )}
    </section>
  )
}

export function ForecastWeather({ forecast, loading, error }: {
  forecast: Forecast | null
  loading: boolean
  error: string
}) {
  const days = forecast?.time.map((date, index) => {
    const day = new Date(`${date}T00:00:00Z`)
    return {
      date,
      day: day.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }),
      label: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      low: forecast.temperature_2m_min[index],
      high: forecast.temperature_2m_max[index],
      rain: forecast.precipitation_sum[index],
      code: forecast.weather_code[index],
      sunrise: forecast.sunrise[index]?.slice(11, 16),
      sunset: forecast.sunset[index]?.slice(11, 16),
    }
  }) ?? []

  const ticks = { fill: '#526780', fontSize: 12 }
  const tooltipStyle = { background: '#fff', border: '1px solid #d4e0ed', borderRadius: 10 }

  return (
    <>
      <section className="panel" id="forecast" aria-labelledby="forecast-title">
        <div className="panel-heading">
          <span className="section-icon"><CalendarDays size={19} /></span>
          <h2 id="forecast-title">Five-day forecast</h2>
        </div>
        {days.length > 0 ? (
          <ul className="forecast-grid">
            {days.map((day) => {
              const { label, Icon } = condition(day.code)
              return (
                <li className="forecast-day" key={day.date}>
                  <time dateTime={day.date}><strong>{day.day}</strong><span>{day.label}</span></time>
                  <Icon size={28} strokeWidth={1.65} aria-hidden="true" />
                  <p className="forecast-condition">{label}</p>
                  <p className="forecast-temps">
                    <span aria-label="High temperature">{reading(day.high, '°')}</span>
                    <span aria-label="Low temperature">{reading(day.low, '°')}</span>
                  </p>
                  <p className="rain-reading"><Droplet size={14} aria-label="Precipitation" />{reading(day.rain, ' mm')}</p>
                  <div className="sun-times">
                    <span><Sunrise size={15} aria-label="Sunrise" />{day.sunrise || '—'}</span>
                    <span><Sunset size={15} aria-label="Sunset" />{day.sunset || '—'}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className={error ? 'error-text panel-message' : 'muted panel-message'} role="status">
            {error || (loading ? 'Loading the forecast…' : 'A five-day forecast will appear here when you select a city.')}
          </p>
        )}
      </section>

      <div className="charts-grid">
        <section className="panel chart-panel" aria-label="Temperature chart">
          <div className="panel-heading">
            <span className="section-icon"><LineIcon size={19} /></span>
            <h2>Temperature trend</h2>
          </div>
          {days.length > 0 ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <LineChart data={days} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e1eaf3" vertical={false} />
                  <XAxis dataKey="day" tick={ticks} tickLine={false} axisLine={false} />
                  <YAxis width={42} unit="°" tick={ticks} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#182e48' }} />
                  <Legend />
                  <Line dataKey="high" name="High" unit=" °C" stroke="#a95a21" strokeWidth={2.5} isAnimationActive={false} />
                  <Line dataKey="low" name="Low" unit=" °C" stroke="#306caf" strokeWidth={2.5} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="muted panel-message">{loading && !error ? 'Loading chart…' : 'No temperature data to chart.'}</p>}
        </section>

        <section className="panel chart-panel" aria-label="Precipitation chart">
          <div className="panel-heading">
            <span className="section-icon"><BarChart3 size={19} /></span>
            <h2>Daily precipitation</h2>
          </div>
          {days.length > 0 ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={days} margin={{ top: 10, right: 12, left: 0, bottom: 10 }}>
                  <CartesianGrid stroke="#e1eaf3" vertical={false} />
                  <XAxis dataKey="day" tick={ticks} tickLine={false} axisLine={false} />
                  <YAxis width={49} unit=" mm" tick={ticks} tickLine={false} axisLine={false} domain={[0, (max: number) => Math.max(1, max)]} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#182e48' }} cursor={{ fill: '#eaf3fd' }} />
                  <Bar dataKey="rain" name="Precipitation" unit=" mm" fill="#306caf" radius={[5, 5, 0, 0]} maxBarSize={32} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="muted panel-message">{loading && !error ? 'Loading chart…' : 'No precipitation data to chart.'}</p>}
        </section>
      </div>
    </>
  )
}

import { useEffect, useState } from 'react'
import { CloudSun, Droplet, History as HistoryIcon, MapPin, Trash2 } from 'lucide-react'
import CityComparison from './CityComparison'
import CityMap from './CityMap'
import CitySearch from './CitySearch'
import { CurrentWeather, ForecastWeather } from './WeatherPanels'
import { api, coordinates, reading } from './weather'
import type { Current, Forecast, History, Location } from './weather'

export default function App() {
  const [place, setPlace] = useState<Location | null>(null)
  const [current, setCurrent] = useState<Current | null>(null)
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentError, setCurrentError] = useState('')
  const [forecastError, setForecastError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [history, setHistory] = useState<History[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState('')
  const [historyVersion, setHistoryVersion] = useState(0)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [downloading, setDownloading] = useState('')
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadHistory() {
      setHistoryLoading(true)
      setHistoryError('')
      try {
        const response = await fetch(`${api}/api/history`, { signal: controller.signal })
        if (!response.ok) throw new Error()
        const records: History[] = await response.json()
        if (!controller.signal.aborted) {
          records.sort((a, b) => Date.parse(b.searched_at) - Date.parse(a.searched_at) || b.id - a.id)
          setHistory(records)
        }
      } catch {
        if (!controller.signal.aborted) setHistoryError('Could not load search history.')
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false)
      }
    }

    void loadHistory()
    return () => controller.abort()
  }, [historyVersion])

  async function loadWeather(location: Location, save: boolean) {
    if (loading) return
    setPlace(location)
    setCurrent(null)
    setForecast(null)
    setCurrentError('')
    setForecastError('')
    setSaveMessage('')
    setLoading(true)
    const query = coordinates(location)

    const currentRequest = fetch(`${api}/api/weather/current?${query}`)
      .then(async (response) => {
        if (!response.ok) throw new Error()
        const weather: Current = await response.json()
        setCurrent(weather)
        return weather
      })
      .catch(() => {
        setCurrentError('Current weather is unavailable. Try selecting the city again.')
        return null
      })

    const forecastRequest = fetch(`${api}/api/weather/forecast?${query}`)
      .then(async (response) => {
        if (!response.ok) throw new Error()
        const weather: Forecast = await response.json()
        setForecast(weather)
      })
      .catch(() => setForecastError('The forecast is unavailable. Try selecting the city again.'))

    const weather = await currentRequest
    if (save && weather) {
      if (weather.temperature_2m == null) {
        setSaveMessage('Search could not be saved because the temperature was unavailable.')
      } else {
        try {
          const response = await fetch(`${api}/api/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              city: location.name,
              country: location.country,
              latitude: location.latitude,
              longitude: location.longitude,
              temperature: weather.temperature_2m,
            }),
          })
          if (!response.ok) throw new Error()
          setHistoryVersion((version) => version + 1)
        } catch {
          setSaveMessage('Could not save this search to history.')
        }
      }
    }
    await forecastRequest
    setLoading(false)
  }

  async function deleteRecord(id: number) {
    if (deleting !== null) return
    setDeleting(id)
    setHistoryError('')
    try {
      const response = await fetch(`${api}/api/history/${id}`, { method: 'DELETE' })
      if (!response.ok && response.status !== 404) throw new Error()
      setHistory((records) => records.filter((record) => record.id !== id))
      setHistoryVersion((version) => version + 1)
    } catch {
      setHistoryError('Could not delete this search. Try again.')
    } finally {
      setDeleting(null)
    }
  }

  async function downloadHistory(format: 'csv' | 'json') {
    setDownloading(format)
    setDownloadError('')
    try {
      const response = await fetch(`${api}/api/history/export/${format}`)
      const mediaType = format === 'csv' ? 'text/csv' : 'application/json'
      if (!response.ok || !response.headers.get('content-type')?.startsWith(mediaType)) throw new Error()
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = `weather-searches.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setDownloadError('Could not download search history. Try again.')
    } finally {
      setDownloading('')
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="shell flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
          <a className="brand flex items-center gap-3" href="#dashboard">
            <span className="brand-icon"><CloudSun size={23} /></span>
            Weather Intelligence
          </a>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Main navigation">
            <a href="#dashboard">Overview</a>
            <a href="#forecast">Forecast</a>
            <a href="#compare">Compare</a>
            <a href="#history">History</a>
            <a href="#about">About</a>
          </nav>
        </div>
      </header>

      <main id="dashboard" className="shell dashboard">
        <div className="dashboard-heading">
          <h1>Weather dashboard</h1>
          <p>Current conditions and a five-day outlook for any city.</p>
        </div>

        <div className="dashboard-search">
          <CitySearch
            key={place && `${place.name}-${place.latitude}-${place.longitude}`}
            label="City name"
            initialName={place?.name}
            onSelect={(location) => void loadWeather(location, true)}
            disabled={loading}
          />
        </div>

        <div className="dashboard-grid">
          <div className="weather-column">
            <CurrentWeather place={place} weather={current} loading={loading} error={currentError} />
            {saveMessage && <p className="error-text" role="status">{saveMessage}</p>}
            <ForecastWeather forecast={forecast} loading={loading} error={forecastError} />
          </div>

          <div className="sidebar">
            <CityMap place={place} />
            <aside className="panel history-panel" id="history" aria-labelledby="history-title">
              <div className="panel-heading">
                <span className="section-icon"><HistoryIcon size={19} /></span>
                <h2 id="history-title">Recent searches</h2>
              </div>
              <div className="history-downloads">
                <button disabled={Boolean(downloading)} onClick={() => void downloadHistory('csv')}>
                  {downloading === 'csv' ? 'Downloading…' : 'Download CSV'}
                </button>
                <button disabled={Boolean(downloading)} onClick={() => void downloadHistory('json')}>
                  {downloading === 'json' ? 'Downloading…' : 'Download JSON'}
                </button>
              </div>
              {downloadError && <p className="error-text history-message" role="status">{downloadError}</p>}
              {historyLoading && <p className="muted history-message" role="status">Loading history…</p>}
              {historyError && (
                <div className="history-message" role="status">
                  <p className="error-text">{historyError}</p>
                  <button className="text-button" onClick={() => setHistoryVersion((version) => version + 1)}>Refresh history</button>
                </div>
              )}
              {!historyLoading && !historyError && history.length === 0 && (
                <div className="history-empty"><MapPin size={24} /><p>Saved cities will appear here after your first search.</p></div>
              )}
              {history.length > 0 && (
                <ul className="history-list">
                  {history.map((record) => (
                    <li key={record.id} className="history-row">
                      <button
                        className="history-location"
                        disabled={loading || deleting === record.id}
                        onClick={() => void loadWeather({
                          name: record.city,
                          country: record.country,
                          latitude: record.latitude,
                          longitude: record.longitude,
                        }, false)}
                      >
                        <strong>{record.city}</strong>
                        <span>{record.country}</span>
                        <time dateTime={record.searched_at}>
                          {new Date(record.searched_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </time>
                      </button>
                      <span className="history-temp">{reading(record.temperature, '°C')}</span>
                      <button
                        className="icon-button"
                        aria-label={`Delete search for ${record.city}`}
                        disabled={deleting !== null}
                        onClick={() => void deleteRecord(record.id)}
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        </div>
        <CityComparison />
        <section className="panel about-panel" id="about" aria-labelledby="about-title">
          <div className="panel-heading"><h2 id="about-title">About PM Accelerator</h2></div>
          <p className="muted">
            Product Manager Accelerator supports aspiring and experienced product management professionals in developing their product management and leadership skills. Its programs and community help people at different stages of their careers, from students pursuing entry-level opportunities to experienced professionals.
          </p>
          <a className="text-button" href="https://www.linkedin.com/school/pmaccelerator/">PM Accelerator on LinkedIn</a>
        </section>
        <footer className="footer">
          <span>Built by Ashtami Choudhary</span>
          <span className="flex items-center gap-1.5"><Droplet size={15} /> Weather data from Open-Meteo</span>
        </footer>
      </main>
    </>
  )
}

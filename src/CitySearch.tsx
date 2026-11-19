import { useState } from 'react'
import type { FormEvent } from 'react'
import { MapPin, Search } from 'lucide-react'
import { api } from './weather'
import type { Location } from './weather'

export default function CitySearch({ label, onSelect, disabled = false, initialName = '' }: {
  label: string
  onSelect: (location: Location) => void
  disabled?: boolean
  initialName?: string
}) {
  const [query, setQuery] = useState(initialName)
  const [matches, setMatches] = useState<Location[]>([])
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (searching || disabled) return
    const name = query.trim()
    setMatches([])
    if (!name) {
      setMessage('Enter a city name to search.')
      return
    }
    setSearching(true)
    setMessage('')
    try {
      const response = await fetch(`${api}/api/locations/search?${new URLSearchParams({ name })}`)
      if (!response.ok) throw new Error()
      const locations: Location[] = await response.json()
      setMatches(locations)
      if (locations.length === 0) setMessage('No cities found. Try a different city name.')
    } catch {
      setMessage('City search is unavailable. Try again.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="search-area">
      <form className="search-form" onSubmit={search} role="search" aria-label={`${label} search`}>
        <Search size={20} aria-hidden="true" />
        <input
          aria-label={label}
          placeholder="Search for a city"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setMatches([])
            setMessage('')
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setMatches([])
          }}
          disabled={searching || disabled}
        />
        <button className="primary-button" disabled={searching || disabled}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>
      {message && <p className="search-message" role="status">{message}</p>}
      {matches.length > 0 && (
        <ul className="matches" aria-label="Matching locations">
          {matches.map((location, index) => (
            <li key={`${location.latitude}-${location.longitude}-${index}`}>
              <button disabled={disabled} onClick={() => {
                setQuery(location.name)
                setMatches([])
                onSelect(location)
              }}>
                <MapPin size={18} aria-hidden="true" />
                <span>
                  <strong>{location.name}</strong>
                  <small>{[location.state, location.country].filter(Boolean).join(', ')}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

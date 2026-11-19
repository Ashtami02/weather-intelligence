import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { icon, map, marker, tileLayer } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerImage from 'leaflet/dist/images/marker-icon.png'
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { placeName } from './weather'
import type { Location } from './weather'

const pin = icon({
  iconUrl: markerImage,
  iconRetinaUrl: markerRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
  popupAnchor: [1, -34],
})

export default function CityMap({ place }: { place: Location | null }) {
  const container = useRef<HTMLDivElement>(null)
  const [tileError, setTileError] = useState(false)
  const hasCoordinates = place && Number.isFinite(place.latitude) && Number.isFinite(place.longitude)

  useEffect(() => {
    if (!place || !hasCoordinates || !container.current) return
    setTileError(false)
    const position: [number, number] = [place.latitude, place.longitude]
    const cityMap = map(container.current, { scrollWheelZoom: false }).setView(position, 11)
    tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })
      .on('tileerror', () => setTileError(true))
      .on('tileload', () => setTileError(false))
      .addTo(cityMap)
    const label = document.createElement('span')
    label.textContent = placeName(place)
    marker(position, { icon: pin, alt: place.name, title: place.name }).addTo(cityMap).bindPopup(label)
    const observer = new ResizeObserver(() => cityMap.invalidateSize({ pan: false }))
    observer.observe(container.current)
    return () => {
      observer.disconnect()
      cityMap.remove()
    }
  }, [place, hasCoordinates])

  return (
    <section className="panel" aria-labelledby="map-title">
      <div className="panel-heading">
        <span className="section-icon"><MapPin size={19} /></span>
        <h2 id="map-title">City map</h2>
      </div>
      {hasCoordinates ? (
        <>
          <div className="city-map" ref={container} role="region" aria-label={`Map of ${place.name}`} />
          <p className="map-caption">{Math.abs(place.latitude).toFixed(3)}° {place.latitude < 0 ? 'S' : 'N'} · {Math.abs(place.longitude).toFixed(3)}° {place.longitude < 0 ? 'W' : 'E'}</p>
          {tileError && <p className="error-text map-caption" role="status">Some map tiles could not load.</p>}
        </>
      ) : (
        <p className="muted panel-message">{place ? 'Coordinates are unavailable for this city.' : 'Select a city to see it on the map.'}</p>
      )}
    </section>
  )
}

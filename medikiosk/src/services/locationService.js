/**
 * Location Service for MediKiosk
 * Handles real-time HTML5 Geolocation, reverse geocoding via OpenStreetMap Nominatim,
 * place/pincode search, and distance calculation.
 */

// Default fallback location: New Delhi central healthcare zone
export const DEFAULT_FALLBACK_LOCATION = {
  lat: 28.6139,
  lon: 77.2090,
  city: 'New Delhi',
  area: 'Connaught Place / Central Delhi',
  postcode: '110001',
  displayName: 'Central Healthcare Zone, Connaught Place, New Delhi',
  source: 'fallback',
}

/**
 * Calculates straight-line distance in kilometers using the Haversine formula
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10 // 1 decimal place
}

/**
 * Estimates driving/transit travel time based on distance in km
 */
export function estimateTravelTime(distanceKm) {
  if (!distanceKm || distanceKm <= 0.2) return '2 mins away'
  // Average urban speed ~22 km/h accounting for signals and traffic
  const mins = Math.max(3, Math.round((distanceKm / 22) * 60))
  if (mins < 60) {
    return `${mins} mins away`
  }
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins > 0 ? `${remainingMins}m` : ''} away`
}

/**
 * Fetches the user's real-time GPS coordinates via HTML5 Geolocation API
 * @param {Object} options - Geolocation options
 * @returns {Promise<{lat: number, lon: number, accuracy: number}>}
 */
export function getCurrentCoordinates(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        })
      },
      (error) => {
        let msg = 'Could not retrieve your location.'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied. You can manually enter your area or pincode.'
            break
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information is currently unavailable.'
            break
          case error.TIMEOUT:
            msg = 'Location request timed out.'
            break
          default:
            msg = error.message || msg
        }
        reject(new Error(msg))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options,
      }
    )
  })
}

/**
 * Reverse geocodes coordinates to a human-readable location using OpenStreetMap Nominatim
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<Object>}
 */
export async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })
    if (!res.ok) {
      throw new Error(`Reverse geocoding failed: ${res.statusText}`)
    }
    const data = await res.json()
    const address = data.address || {}

    const area =
      address.suburb ||
      address.neighbourhood ||
      address.residential ||
      address.commercial ||
      address.road ||
      address.county ||
      'Local Area'

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.state_district ||
      address.state ||
      'Nearby City'

    const postcode = address.postcode || ''
    const state = address.state || ''

    return {
      lat,
      lon,
      area,
      city,
      state,
      postcode,
      displayName: `${area}, ${city}${postcode ? ` - ${postcode}` : ''}`,
      source: 'gps',
      raw: data,
    }
  } catch (err) {
    console.warn('Reverse geocode error, using coordinate representation:', err)
    return {
      lat,
      lon,
      area: `Lat: ${lat.toFixed(3)}`,
      city: `Lon: ${lon.toFixed(3)}`,
      displayName: `GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      source: 'gps_raw',
    }
  }
}

/**
 * Full real-time patient location fetch: GPS + Reverse Geocoding
 */
export async function fetchPatientRealtimeLocation() {
  const coords = await getCurrentCoordinates()
  const locationDetails = await reverseGeocode(coords.lat, coords.lon)
  return {
    ...locationDetails,
    accuracy: coords.accuracy,
    fetchedAt: new Date().toISOString(),
  }
}

/**
 * Searches places/pincodes using OpenStreetMap Nominatim
 * @param {string} query - Pincode or City name
 */
export async function searchPlaces(query) {
  if (!query || query.trim().length < 2) return []

  try {
    const cleanQuery = encodeURIComponent(query.trim() + (/\d{6}/.test(query) ? ' India' : ''))
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${cleanQuery}&countrycodes=in&limit=5&addressdetails=1`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) throw new Error('Search failed')
    const results = await res.json()

    return results.map((item) => {
      const addr = item.address || {}
      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.road ||
        addr.residential ||
        item.name ||
        ''
      const city = addr.city || addr.town || addr.village || addr.state_district || addr.state || ''
      const postcode = addr.postcode || ''
      return {
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        area: area || city,
        city,
        state: addr.state || '',
        postcode,
        displayName: item.display_name,
        source: 'manual',
      }
    })
  } catch (err) {
    console.error('Place search error:', err)
    return []
  }
}

/**
 * Creates Google Maps navigation URL
 */
export function getDirectionsUrl(userLat, userLon, hospLat, hospLon, hospitalName = '') {
  if (userLat && userLon && hospLat && hospLon) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${hospLat},${hospLon}&travelmode=driving`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospitalName)}`
}

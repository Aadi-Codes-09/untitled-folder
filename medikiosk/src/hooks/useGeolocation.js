import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Haversine formula — calculates the great-circle distance (km) between two GPS coordinates.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
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
  return R * c
}

/**
 * Estimate travel time from distance (rough, city traffic average ~20 km/h)
 */
export function estimateTravelTime(distanceKm, lang = 'en') {
  const minutes = Math.max(1, Math.round((distanceKm / 20) * 60))
  if (lang === 'hi') {
    return minutes <= 1 ? '1 मिनट' : `${minutes} मिनट`
  }
  return minutes <= 1 ? '1 min away' : `${minutes} mins away`
}

/**
 * useGeolocation — Real-time browser location hook
 * 
 * Returns:
 *  - coords: { latitude, longitude, accuracy } or null
 *  - status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable' | 'error'
 *  - error: string or null
 *  - refresh: function to re-request location
 *  - isLoading: boolean
 */
export function useGeolocation(options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000, // Cache for 1 minute
    watchPosition = false,
  } = options

  const [coords, setCoords] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const watchIdRef = useRef(null)

  const handleSuccess = useCallback((position) => {
    setCoords({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    })
    setStatus('granted')
    setError(null)
  }, [])

  const handleError = useCallback((err) => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        setStatus('denied')
        setError('Location permission denied by user')
        break
      case err.POSITION_UNAVAILABLE:
        setStatus('unavailable')
        setError('Location information is unavailable')
        break
      case err.TIMEOUT:
        setStatus('error')
        setError('Location request timed out')
        break
      default:
        setStatus('error')
        setError('An unknown error occurred')
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable')
      setError('Geolocation is not supported by this browser')
      return
    }

    setStatus('requesting')
    setError(null)

    const geoOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }

    if (watchPosition) {
      // Clear any existing watcher
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geoOptions
      )
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geoOptions
      )
    }
  }, [enableHighAccuracy, timeout, maximumAge, watchPosition, handleSuccess, handleError])

  // Auto-request on mount
  useEffect(() => {
    requestLocation()

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, []) // Only run on mount

  return {
    coords,
    status,
    error,
    refresh: requestLocation,
    isLoading: status === 'requesting' || status === 'idle',
  }
}

/**
 * Enrich hospitals list with real distance from user's coordinates.
 * Returns a new sorted array (nearest first).
 */
export function sortHospitalsByDistance(hospitals, userLat, userLon, lang = 'en') {
  return hospitals
    .map((hospital) => {
      if (!hospital.lat || !hospital.lon) return { ...hospital, realDistance: null }
      const distKm = haversineDistance(userLat, userLon, hospital.lat, hospital.lon)
      return {
        ...hospital,
        realDistance: distKm,
        distance: distKm < 1
          ? `${Math.round(distKm * 1000)} m`
          : `${distKm.toFixed(1)} km`,
        travelTime: estimateTravelTime(distKm, lang),
      }
    })
    .sort((a, b) => {
      if (a.realDistance === null) return 1
      if (b.realDistance === null) return -1
      return a.realDistance - b.realDistance
    })
}

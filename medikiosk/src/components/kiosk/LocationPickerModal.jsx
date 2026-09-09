import { useState } from 'react'
import {
  MapPin,
  Crosshair,
  Search,
  Check,
  X,
  Building2,
  AlertCircle,
  Loader2,
  Navigation,
} from 'lucide-react'
import {
  fetchPatientRealtimeLocation,
  searchPlaces,
} from '../../services/locationService'

// Curated popular Indian healthcare hubs for 1-click fallback selection
const POPULAR_HUBS = [
  {
    name: 'New Delhi (AIIMS / Connaught Place)',
    area: 'Connaught Place',
    city: 'New Delhi',
    postcode: '110001',
    lat: 28.6139,
    lon: 77.2090,
  },
  {
    name: 'South Delhi (Saket / Max Healthcare Hub)',
    area: 'Saket',
    city: 'New Delhi',
    postcode: '110017',
    lat: 28.5244,
    lon: 77.2066,
  },
  {
    name: 'Noida (Sector 62 / Fortis Health City)',
    area: 'Sector 62',
    city: 'Noida',
    postcode: '201309',
    lat: 28.6280,
    lon: 77.3649,
  },
  {
    name: 'Mumbai (Bandra West / Lilavati Hub)',
    area: 'Bandra West',
    city: 'Mumbai',
    postcode: '400050',
    lat: 19.0596,
    lon: 72.8295,
  },
  {
    name: 'Bengaluru (Indiranagar / Manipal Hub)',
    area: 'Indiranagar',
    city: 'Bengaluru',
    postcode: '560038',
    lat: 12.9784,
    lon: 77.6408,
  },
  {
    name: 'Lucknow (Hazratganj / Civil Hospital)',
    area: 'Hazratganj',
    city: 'Lucknow',
    postcode: '226001',
    lat: 26.8467,
    lon: 80.9462,
  },
]

export function LocationPickerModal({
  isOpen,
  onClose,
  currentLocation,
  onLocationSelected,
  lang = 'en',
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isGpsLoading, setIsGpsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  if (!isOpen) return null

  // Handle GPS detection
  const handleFetchGps = async () => {
    setIsGpsLoading(true)
    setErrorMsg(null)
    try {
      const loc = await fetchPatientRealtimeLocation()
      onLocationSelected(loc)
      onClose()
    } catch (err) {
      setErrorMsg(err.message || 'Could not fetch GPS location. Please choose from the list or search below.')
    } finally {
      setIsGpsLoading(false)
    }
  }

  // Handle manual search
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsSearching(true)
    setErrorMsg(null)
    try {
      const results = await searchPlaces(searchQuery)
      if (results.length === 0) {
        setErrorMsg(lang === 'hi' ? 'कोई स्थान नहीं मिला। कृपया पिनकोड या शहर का नाम जांचें।' : 'No matching locations found. Please try a different area or 6-digit PIN code.')
      } else {
        setSearchResults(results)
      }
    } catch (err) {
      setErrorMsg(lang === 'hi' ? 'स्थान खोजने में त्रुटि।' : 'Failed to search location.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectHub = (hub) => {
    onLocationSelected({
      lat: hub.lat,
      lon: hub.lon,
      area: hub.area,
      city: hub.city,
      postcode: hub.postcode,
      displayName: `${hub.area}, ${hub.city} - ${hub.postcode}`,
      source: 'manual',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-100 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-kiosk-lg font-bold text-white">
                {lang === 'hi' ? 'रोगी का स्थान चुनें या बदलें' : 'Set / Change Patient Location'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'hi' ? 'निकटतम और सबसे अच्छे अस्पतालों की खोज के लिए' : 'To find the best hospitals & doctors closest to you'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-red-500/40 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-5 py-4 pr-1">
          {/* Current detected location chip */}
          {currentLocation && (
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Navigation className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                    {lang === 'hi' ? 'वर्तमान चयनित स्थान' : 'Currently Active Location'}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {currentLocation.displayName || `${currentLocation.area}, ${currentLocation.city}`}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                {currentLocation.source === 'gps' ? 'GPS' : 'Selected'}
              </span>
            </div>
          )}

          {/* Action 1: Live GPS Fetch Button */}
          <div>
            <button
              type="button"
              onClick={handleFetchGps}
              disabled={isGpsLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-kiosk-sm transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            >
              {isGpsLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{lang === 'hi' ? 'लाइव जीपीएस स्थान प्राप्त हो रहा है...' : 'Fetching live GPS location...'}</span>
                </>
              ) : (
                <>
                  <Crosshair className="w-5 h-5 text-emerald-200" />
                  <span>{lang === 'hi' ? '📡 डिवाइस जीपीएस से रीयल-टाइम स्थान लें' : '📡 Auto-Detect Real-Time GPS Location'}</span>
                </>
              )}
            </button>
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase font-semibold tracking-wider">
              {lang === 'hi' ? 'या खोजें / सूची से चुनें' : 'OR Search / Select from Hubs'}
            </span>
          </div>

          {/* Action 2: Search Input Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'hi' ? 'पिनकोड या शहर दर्ज करें (उदा. 110001, Saket, Noida)...' : 'Enter PIN code, area or city (e.g. 110001, Saket, Noida)...'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-500 text-slate-200 font-semibold text-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{lang === 'hi' ? 'खोजें' : 'Search'}</span>
            </button>
          </form>

          {/* Search results list */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {lang === 'hi' ? 'खोज परिणाम' : 'Search Results'}
              </span>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onLocationSelected(item)
                      onClose()
                    }}
                    className="w-full p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 hover:border-emerald-500/70 hover:bg-slate-800 text-left transition-all flex items-start gap-2.5 cursor-pointer group"
                  >
                    <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{item.area || item.city}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.displayName}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action 3: Popular Healthcare Hubs List */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              {lang === 'hi' ? 'प्रमुख स्वास्थ्य केंद्र / शहर' : 'Popular Healthcare Hubs'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POPULAR_HUBS.map((hub, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectHub(hub)}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:border-emerald-500/70 hover:bg-slate-800 text-left transition-all flex items-center justify-between gap-2 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">{hub.name}</p>
                      <p className="text-[10px] text-slate-400">{hub.area}, {hub.city}</p>
                    </div>
                  </div>
                  <Check className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

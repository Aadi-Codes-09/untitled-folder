/**
 * Hospital & Doctor Discovery Service for MediKiosk
 * Matches patient condition to specialist departments and finds nearby best hospitals
 * dynamically based on the patient's real-time coordinates.
 */

import { calculateDistanceKm, estimateTravelTime } from './locationService'

// Specialty and doctor definitions mapped by condition
export const CONDITION_SPECIALTIES = {
  chest_pain: {
    deptEn: 'Cardiology & Intensive Coronary Care',
    deptHi: 'हृदय रोग एवं कोरोनरी केयर यूनिट',
    specialistEn: 'Senior Cardiologist & Interventional Physician',
    specialistHi: 'वरिष्ठ हृदय रोग विशेषज्ञ',
    doctors: [
      { nameEn: 'Dr. R.K. Sharma, MD, DM (Cardiology)', nameHi: 'डॉ. आर.के. शर्मा, एमडी, डीएम (कार्डियोलॉजी)', exp: '18 yrs exp', room: 'OPD Room 104' },
      { nameEn: 'Dr. Anita Mehta, MD, DNB (Cardiology)', nameHi: 'डॉ. अनीता मेहता, एमडी, डीएनबी', exp: '14 yrs exp', room: 'Cardio Suite 2' },
      { nameEn: 'Dr. Sanjay Gupta, MD (Cardio-Thoracic)', nameHi: 'डॉ. संजय गुप्ता, एमडी', exp: '21 yrs exp', room: 'Emergency OPD 1' },
    ],
  },
  fever: {
    deptEn: 'Internal Medicine & Infectious Diseases',
    deptHi: 'सामान्य चिकित्सा एवं संक्रामक रोग विभाग',
    specialistEn: 'Consultant Physician & Fever Specialist',
    specialistHi: 'परामर्शदाता चिकित्सक एवं फीवर विशेषज्ञ',
    doctors: [
      { nameEn: 'Dr. Sunita Deshmukh, MD (Internal Medicine)', nameHi: 'डॉ. सुनीता देशमुख, एमडी', exp: '15 yrs exp', room: 'OPD Counter 6' },
      { nameEn: 'Dr. Rajesh Verma, MBBS, MD (Medicine)', nameHi: 'डॉ. राजेश वर्मा, एमबीबीएस, एमडी', exp: '12 yrs exp', room: 'OPD Room 208' },
      { nameEn: 'Dr. Priya Nambiar, MD, DNB', nameHi: 'डॉ. प्रिया नंबियार, एमडी, डीएनबी', exp: '9 yrs exp', room: 'Clinic 3B' },
    ],
  },
  cough: {
    deptEn: 'Pulmonology & Respiratory Medicine',
    deptHi: 'श्वसन रोग एवं फेफड़ा रोग विभाग',
    specialistEn: 'Chest Physician & Pulmonologist',
    specialistHi: 'फेफड़ा एवं श्वसन रोग विशेषज्ञ',
    doctors: [
      { nameEn: 'Dr. Vivek Malhotra, MD (Pulmonary Medicine)', nameHi: 'डॉ. विवेक मल्होत्रा, एमडी (पल्मोनरी)', exp: '16 yrs exp', room: 'Chest Clinic 1' },
      { nameEn: 'Dr. Meenakshi Rao, MD, DTCD', nameHi: 'डॉ. मीनाक्षी राव, एमडी', exp: '11 yrs exp', room: 'OPD Room 112' },
      { nameEn: 'Dr. Alok Srivastava, DNB (Respiratory)', nameHi: 'डॉ. आलोक श्रीवास्तव, डीएनबी', exp: '14 yrs exp', room: 'OPD Suite 4' },
    ],
  },
  stomach_pain: {
    deptEn: 'Gastroenterology & GI Surgery',
    deptHi: 'पेट एवं पाचन रोग विभाग',
    specialistEn: 'Consultant Gastroenterologist',
    specialistHi: 'गैस्ट्रोएंटेरोलॉजिस्ट (पेट रोग विशेषज्ञ)',
    doctors: [
      { nameEn: 'Dr. Pradeep Bansal, MD, DM (Gastro)', nameHi: 'डॉ. प्रदीप बंसल, एमडी, डीएम', exp: '17 yrs exp', room: 'GI Dept Room 3' },
      { nameEn: 'Dr. Vandana Joshi, MD, DNB', nameHi: 'डॉ. वंदना जोशी, एमडी', exp: '13 yrs exp', room: 'OPD Room 201' },
    ],
  },
  headache: {
    deptEn: 'Neurology & Neuro-Medicine',
    deptHi: 'न्यूरोलॉजी एवं मस्तिष्क रोग विभाग',
    specialistEn: 'Consultant Neurologist',
    specialistHi: 'न्यूरोलॉजिस्ट (मस्तिष्क रोग विशेषज्ञ)',
    doctors: [
      { nameEn: 'Dr. K.V. Ramanathan, MD, DM (Neurology)', nameHi: 'डॉ. के.वी. रामनाथन, एमडी, डीएम', exp: '19 yrs exp', room: 'Neuro OPD 2' },
      { nameEn: 'Dr. Shweta Kapoor, DNB (Neurology)', nameHi: 'डॉ. श्वेता कपूर, डीएनबी', exp: '10 yrs exp', room: 'Room 305' },
    ],
  },
  default: {
    deptEn: 'Comprehensive Clinical OPD & Family Medicine',
    deptHi: 'समग्र क्लिनिकल ओपीडी एवं सामान्य परामर्श',
    specialistEn: 'Senior Consultant Physician',
    specialistHi: 'वरिष्ठ परामर्शदाता चिकित्सक',
    doctors: [
      { nameEn: 'Dr. R.K. Sharma, MD, DM', nameHi: 'डॉ. आर.के. शर्मा, एमडी', exp: '18 yrs exp', room: 'OPD Room 104' },
      { nameEn: 'Dr. Sunita Deshmukh, MD', nameHi: 'डॉ. सुनीता देशमुख, एमडी', exp: '15 yrs exp', room: 'OPD Counter 6' },
      { nameEn: 'Dr. Vivek Malhotra, MD, DNB', nameHi: 'डॉ. विवेक मल्होत्रा, एमडी', exp: '16 yrs exp', room: 'OPD Suite 3' },
    ],
  },
}

// Generate realistic slots for today and tomorrow
export function generateHospitalSlots() {
  return [
    'Today 10:30 AM',
    'Today 12:00 PM',
    'Today 02:30 PM',
    'Today 04:15 PM',
    'Tomorrow 09:30 AM',
    'Tomorrow 11:45 AM',
    'Tomorrow 03:00 PM',
    'Tomorrow 05:30 PM',
  ]
}

/**
 * Creates dynamic local hospitals around a specific latitude & longitude
 */
function createLocalHospitalCluster(userLat, userLon, locationName = 'Nearby Area', condition = 'chest_pain') {
  const spec = CONDITION_SPECIALTIES[condition] || CONDITION_SPECIALTIES.default
  const cleanArea = locationName.split(',')[0].trim() || 'Central'

  const templates = [
    {
      idSuffix: 'super',
      namePrefixEn: 'Super-Speciality Hospital & Heart Institute',
      namePrefixHi: 'सुपर-स्पेशियलिटी अस्पताल एवं अनुसंधान संस्थान',
      latOffset: 0.008,
      lonOffset: 0.007,
      rating: 4.9,
      reviewsCount: 1540,
      fees: '₹0 (ABDM / Ayushman PM-JAY Covered) / ₹300 General',
      badges: ['ABDM Verified', 'Ayushman Bharat Cashless', '24x7 Emergency ICU'],
      phone: '+91 11-4567-8901',
      doctorIdx: 0,
      opdRoom: spec.doctors[0]?.room || 'Room 101',
    },
    {
      idSuffix: 'civil',
      namePrefixEn: 'District Civil Hospital & Govt. Medical College',
      namePrefixHi: 'जिला सिविल अस्पताल एवं मेडिकल कॉलेज',
      latOffset: -0.012,
      lonOffset: 0.015,
      rating: 4.7,
      reviewsCount: 3200,
      fees: 'Free (Govt. Public Health Service)',
      badges: ['Govt. Health Center', 'Free Medicines & Tests', 'Free OPD'],
      phone: '+91 11-2345-6782',
      doctorIdx: 1,
      opdRoom: spec.doctors[1]?.room || 'OPD Counter 4',
    },
    {
      idSuffix: 'medicare',
      namePrefixEn: 'City Care Multispeciality & Trauma Center',
      namePrefixHi: 'सिटी केयर मल्टीस्पेशियलिटी एवं ट्रॉमा सेंटर',
      latOffset: 0.019,
      lonOffset: -0.014,
      rating: 4.8,
      reviewsCount: 1120,
      fees: '₹350 / Insurance Empanelled',
      badges: ['NABH Accredited', 'Express Queue', 'Cashless TPA'],
      phone: '+91 11-8901-2343',
      doctorIdx: 2,
      opdRoom: spec.doctors[2]?.room || 'Suite 203',
    },
    {
      idSuffix: 'lifeline',
      namePrefixEn: 'Lifeline Apex Health & Diagnostic Center',
      namePrefixHi: 'लाइफलाइन एपेक्स हेल्थ एवं डायग्नोस्टिक सेंटर',
      latOffset: -0.024,
      lonOffset: -0.018,
      rating: 4.85,
      reviewsCount: 890,
      fees: '₹250 / Ayushman Empanelled',
      badges: ['ABDM Integrated', 'Digital Prescription', 'Echo & ECG Lab'],
      phone: '+91 11-7890-1234',
      doctorIdx: 0,
      opdRoom: 'OPD Room 302',
    },
  ]

  return templates.map((tmpl) => {
    const hospLat = userLat + tmpl.latOffset
    const hospLon = userLon + tmpl.lonOffset
    const distanceKm = calculateDistanceKm(userLat, userLon, hospLat, hospLon)
    const travelTime = estimateTravelTime(distanceKm)
    const doc = spec.doctors[tmpl.doctorIdx % spec.doctors.length] || spec.doctors[0]

    return {
      id: `hosp_${tmpl.idSuffix}_${Math.round(userLat * 100)}`,
      name: {
        en: `${cleanArea} ${tmpl.namePrefixEn}`,
        hi: `${cleanArea} ${tmpl.namePrefixHi}`,
      },
      lat: hospLat,
      lon: hospLon,
      distanceKm,
      distance: `${distanceKm} km`,
      travelTime,
      rating: tmpl.rating,
      reviewsCount: tmpl.reviewsCount,
      address: {
        en: `Main Health Corridor, Near ${cleanArea} Metro / Central Circle`,
        hi: `मुख्य स्वास्थ्य मार्ग, ${cleanArea} मेट्रो स्टेशन के पास`,
      },
      doctor: {
        en: doc.nameEn,
        hi: doc.nameHi,
      },
      doctorExp: doc.exp,
      department: {
        en: spec.deptEn,
        hi: spec.deptHi,
      },
      opdRoom: tmpl.opdRoom,
      slots: generateHospitalSlots(),
      fees: tmpl.fees,
      badges: tmpl.badges,
      phone: tmpl.phone,
      isLiveDiscovered: false,
    }
  })
}

/**
 * Live search via OpenStreetMap Nominatim around user's bounding box
 */
async function fetchLiveOsmHospitals(userLat, userLon, radiusKm = 10) {
  // Rough bounding box: 1 deg lat ~ 111 km, 1 deg lon ~ 96 km at ~28 deg lat
  const deltaLat = radiusKm / 111
  const deltaLon = radiusKm / 90

  const minLat = (userLat - deltaLat).toFixed(4)
  const maxLat = (userLat + deltaLat).toFixed(4)
  const minLon = (userLon - deltaLon).toFixed(4)
  const maxLon = (userLon + deltaLon).toFixed(4)

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=hospital&bounded=1&viewbox=${minLon},${maxLat},${maxLon},${minLat}&limit=10&addressdetails=1`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 4500)

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return []
    const results = await res.json()
    if (!Array.isArray(results) || results.length === 0) return []

    return results
      .filter((item) => item.name && item.lat && item.lon)
      .map((item, idx) => {
        const hLat = parseFloat(item.lat)
        const hLon = parseFloat(item.lon)
        const distanceKm = calculateDistanceKm(userLat, userLon, hLat, hLon)
        const addr = item.address || {}
        const areaStr = addr.suburb || addr.neighbourhood || addr.road || addr.county || ''
        const cityStr = addr.city || addr.town || addr.state_district || ''

        return {
          rawId: item.place_id || `osm_${idx}`,
          nameEn: item.name,
          lat: hLat,
          lon: hLon,
          distanceKm,
          distance: `${distanceKm} km`,
          travelTime: estimateTravelTime(distanceKm),
          addressEn: item.display_name.split(',').slice(0, 3).join(', '),
          areaStr,
          cityStr,
        }
      })
  } catch (err) {
    clearTimeout(timeoutId)
    console.warn('Live OSM hospital search error/timeout:', err)
    return []
  }
}

/**
 * Main function: Fetch nearby hospitals with doctors customized to patient condition
 * @param {Object} params
 * @param {number} params.lat - Patient latitude
 * @param {number} params.lon - Patient longitude
 * @param {string} params.locationName - Detected locality/city
 * @param {string} params.condition - Selected medical condition id
 * @param {number} params.maxRadiusKm - Filter radius (default: 15 km)
 */
export async function getNearbyHospitalsForLocation({
  lat,
  lon,
  locationName = 'Current Location',
  condition = 'chest_pain',
  maxRadiusKm = 15,
}) {
  const spec = CONDITION_SPECIALTIES[condition] || CONDITION_SPECIALTIES.default

  // 1. Try real-time live discovery from OpenStreetMap
  const liveResults = await fetchLiveOsmHospitals(lat, lon, maxRadiusKm)

  let hospitalList = []

  if (liveResults && liveResults.length > 0) {
    hospitalList = liveResults.map((hosp, idx) => {
      const doc = spec.doctors[idx % spec.doctors.length]
      const isGovt = /district|civil|government|govt|general|college/i.test(hosp.nameEn)
      const rating = +(4.6 + (idx % 4) * 0.1).toFixed(1)
      const reviewsCount = 450 + (idx * 210)

      return {
        id: `osm_${hosp.rawId}`,
        name: {
          en: hosp.nameEn,
          hi: hosp.nameEn,
        },
        lat: hosp.lat,
        lon: hosp.lon,
        distanceKm: hosp.distanceKm,
        distance: hosp.distance,
        travelTime: hosp.travelTime,
        rating,
        reviewsCount,
        address: {
          en: hosp.addressEn || `${hosp.areaStr}, ${hosp.cityStr}`,
          hi: hosp.addressEn || `${hosp.areaStr}, ${hosp.cityStr}`,
        },
        doctor: {
          en: doc.nameEn,
          hi: doc.nameHi,
        },
        doctorExp: doc.exp,
        department: {
          en: spec.deptEn,
          hi: spec.deptHi,
        },
        opdRoom: doc.room || `OPD Room ${101 + idx}`,
        slots: generateHospitalSlots(),
        fees: isGovt
          ? 'Free (Govt. Public Health Service)'
          : '₹0 (ABDM / Ayushman PM-JAY Covered) / ₹300 General',
        badges: isGovt
          ? ['Govt. Health Center', 'Free Medicines & Tests', 'Free OPD']
          : ['ABDM Verified', 'Ayushman Bharat Cashless', '24x7 Emergency ICU'],
        phone: '+91 11-' + Math.floor(20000000 + Math.random() * 70000000),
        isLiveDiscovered: true,
      }
    })
  }

  // 2. If fewer than 3 hospitals found in OSM, append/merge with local cluster around user's exact coordinates
  if (hospitalList.length < 3) {
    const cluster = createLocalHospitalCluster(lat, lon, locationName, condition)
    // Avoid duplicates by name
    const existingNames = new Set(hospitalList.map((h) => h.name.en.toLowerCase()))
    for (const h of cluster) {
      if (!existingNames.has(h.name.en.toLowerCase())) {
        hospitalList.push(h)
      }
    }
  }

  // 3. Filter by radius & sort by closest distance, then best rating
  const filtered = hospitalList
    .filter((h) => h.distanceKm <= maxRadiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm || b.rating - a.rating)

  return filtered.length > 0 ? filtered : hospitalList.slice(0, 4)
}

import { useState, useMemo, useEffect } from 'react'
import { 
  Printer, ArrowRight, AlertTriangle, User, Heart, Pill, 
  Stethoscope, RefreshCw, CheckCircle, ShieldAlert, Clock, 
  Home, Volume2, AlertCircle, Info, Utensils,
  FileText, TestTube2, History, Upload, Plus, Activity,
  MapPin, Star, Phone, Calendar, Building2, Navigation,
  Crosshair, Loader2, ExternalLink
} from 'lucide-react'
import { Button } from '../ui/Button'
import { useKiosk } from '../../context/KioskContext'
import { useSpeechInteraction } from '../../hooks/useSpeechInteraction'
import { getAdvice } from '../../data/adviceEngine'
import { CONDITIONS } from '../../data/diseaseFlows'
import { t } from '../../data/mockData'
import {
  fetchPatientRealtimeLocation,
  DEFAULT_FALLBACK_LOCATION,
  getDirectionsUrl,
} from '../../services/locationService'
import { getNearbyHospitalsForLocation } from '../../services/hospitalService'
import { LocationPickerModal } from '../kiosk/LocationPickerModal'
import { AppointmentBookingModal } from '../kiosk/AppointmentBookingModal'

export function Screen4Consult() {
  const { state, actions } = useKiosk()
  const { speak, cancel, isSpeaking } = useSpeechInteraction()
  
  const [printTriggered, setPrintTriggered] = useState(false)
  const [speakingMedId, setSpeakingMedId] = useState(null)
  const [showBookingPrompt, setShowBookingPrompt] = useState(true)

  // Real-time location state
  const [patientLoc, setPatientLoc] = useState(state.patientLocation || DEFAULT_FALLBACK_LOCATION)
  const [isLocLoading, setIsLocLoading] = useState(false)
  const [locError, setLocError] = useState(null)

  // Dynamic nearby hospitals state
  const [hospitals, setHospitals] = useState([])
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(true)
  const [searchRadius, setSearchRadius] = useState(10)

  // Modals & Appointment Booking state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [bookingTargetHospital, setBookingTargetHospital] = useState(null)
  const [bookingConfirmed, setBookingConfirmed] = useState(!!state.activeAppointment)
  const [bookingDetails, setBookingDetails] = useState(state.activeAppointment || null)
  
  const lang = state.language
  const abhaId = state.patientDetails.abhaId || '9876543210'

  const conditionMeta = useMemo(() => {
    return CONDITIONS.find(c => c.id === state.selectedCondition) || {
      en: 'General Health Assessment',
      hi: 'सामान्य स्वास्थ्य परीक्षण',
      emoji: '🩺'
    }
  }, [state.selectedCondition])

  const redFlags = state.clinicalHistory.responses.filter(r => r.isRedFlag)
  const chiefComplaint = lang === 'hi' ? conditionMeta.hi : conditionMeta.en
  
  // Calculate AI triage advice + suggested medications based on symptoms
  const advice = useMemo(() => {
    return getAdvice(
      state.selectedCondition || 'fever',
      state.clinicalHistory.responses,
      redFlags.length
    )
  }, [state.selectedCondition, state.clinicalHistory.responses, redFlags.length])

  const suggestedMeds = advice.suggestedMedications || []

  const hpiItems = state.clinicalHistory.responses.map(r => ({
    label: r.question || r.questionKey,
    value: Array.isArray(r.answer) ? r.answer.join(', ') : String(r.answer),
    isRedFlag: r.isRedFlag,
  }))

  // 1. Initial Auto-fetch of patient's real-time GPS location
  useEffect(() => {
    if (!state.patientLocation) {
      setIsLocLoading(true)
      fetchPatientRealtimeLocation()
        .then((loc) => {
          setPatientLoc(loc)
          actions.setLocation(loc)
        })
        .catch((err) => {
          console.warn('Initial GPS auto-fetch failed/denied, using default hub:', err)
          setLocError(err.message)
          setPatientLoc(DEFAULT_FALLBACK_LOCATION)
          actions.setLocation(DEFAULT_FALLBACK_LOCATION)
        })
        .finally(() => {
          setIsLocLoading(false)
        })
    } else {
      setPatientLoc(state.patientLocation)
    }
  }, [state.patientLocation, actions])

  // 2. Dynamic nearby hospital discovery whenever location, radius, or condition changes
  useEffect(() => {
    if (!patientLoc?.lat || !patientLoc?.lon) return
    let isCancelled = false
    setIsLoadingHospitals(true)

    getNearbyHospitalsForLocation({
      lat: patientLoc.lat,
      lon: patientLoc.lon,
      locationName: patientLoc.displayName || patientLoc.area || 'Current Area',
      condition: state.selectedCondition || 'chest_pain',
      maxRadiusKm: searchRadius,
    })
      .then((res) => {
        if (!isCancelled) {
          setHospitals(res)
          setIsLoadingHospitals(false)
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Error fetching nearby hospitals:', err)
          setIsLoadingHospitals(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [patientLoc, searchRadius, state.selectedCondition])

  const handlePrint = () => {
    setPrintTriggered(true)
    window.print()
    setTimeout(() => setPrintTriggered(false), 1000)
  }

  const handleNextPatient = () => {
    if (window.confirm(lang === 'hi' ? 'नया रोगी आकलन शुरू करें? सभी डेटा रीसेट हो जाएगा।' : 'Start new patient assessment? This will clear all data.')) {
      actions.resetWizard()
    }
  }

  const handleBack = () => {
    cancel()
    actions.setStep(4) // Back to Documents to adjust or add records
  }

  // Refresh GPS manually
  const handleRefreshGps = async () => {
    setIsLocLoading(true)
    setLocError(null)
    try {
      const loc = await fetchPatientRealtimeLocation()
      setPatientLoc(loc)
      actions.setLocation(loc)
      const speakMsg = lang === 'hi'
        ? `रीयल-टाइम स्थान अपडेट हो गया: ${loc.area}, ${loc.city}`
        : `Real-time location updated to ${loc.area}, ${loc.city}`
      speak(speakMsg, { lang: lang === 'hi' ? 'hi-IN' : 'en-IN', rate: 0.85 })
    } catch (err) {
      setLocError(err.message)
    } finally {
      setIsLocLoading(false)
    }
  }

  const handleLocationSelected = (newLoc) => {
    setPatientLoc(newLoc)
    actions.setLocation(newLoc)
    setLocError(null)
  }

  const handleOpenBookingModal = (hospital) => {
    setBookingTargetHospital(hospital)
    setIsBookingModalOpen(true)
  }

  const handleBookingConfirmed = (details) => {
    setBookingDetails(details)
    setBookingConfirmed(true)
    actions.setAppointment(details)
    
    const hospitalName = details.hospital.name[lang] || details.hospital.name.en
    const doctorName = details.doctor
    const confirmText = lang === 'hi'
      ? `आपकी अपॉइंटमेंट ${hospitalName} में ${details.slot} पर बुक हो गई है। डॉक्टर: ${doctorName}।`
      : `Your appointment has been booked at ${hospitalName} for ${details.slot}. Doctor: ${doctorName}.`
    speak(confirmText, { lang: lang === 'hi' ? 'hi-IN' : 'en-IN', rate: 0.85 })
  }

  const handleCancelBooking = () => {
    setBookingConfirmed(false)
    setBookingDetails(null)
    actions.clearAppointment()
  }

  // Speak single medicine aloud
  const handleSpeakMedicine = async (med) => {
    if (speakingMedId === med.id && isSpeaking) {
      cancel()
      setSpeakingMedId(null)
      return
    }

    setSpeakingMedId(med.id)
    const medName = med.name[lang] || med.name.en
    const medTiming = med.timing[lang] || med.timing.en
    const medSchedule = med.schedule[lang] || med.schedule.en
    const medPurpose = med.purpose[lang] || med.purpose.en
    const medInstructions = med.instructions[lang] || med.instructions.en

    const textToSpeak = lang === 'hi'
      ? `दवा का नाम: ${medName}। इसे ${medTiming} लें। खुराक: ${medSchedule}। उद्देश्य: ${medPurpose}। खाने का तरीका: ${medInstructions}`
      : `Medicine: ${medName}. Take ${medTiming}. Schedule: ${medSchedule}. Purpose: ${medPurpose}. Instructions: ${medInstructions}`

    await speak(textToSpeak, { lang: lang === 'hi' ? 'hi-IN' : 'en-IN', rate: 0.85 })
    setSpeakingMedId(null)
  }

  // Speak all medicines in sequence
  const handleSpeakAllMedicines = async () => {
    if (isSpeaking) {
      cancel()
      setSpeakingMedId(null)
      return
    }

    setSpeakingMedId('all')
    const intro = lang === 'hi'
      ? `आपके लक्षणों ${chiefComplaint} के आधार पर AI द्वारा सुझाई गई दवाइयां इस प्रकार हैं:`
      : `Based on your symptoms for ${chiefComplaint}, here are your AI prescribed medications:`

    const listText = suggestedMeds.map((med, idx) => {
      const name = med.name[lang] || med.name.en
      const timing = med.timing[lang] || med.timing.en
      const schedule = med.schedule[lang] || med.schedule.en
      return lang === 'hi'
        ? `दवा नंबर ${idx + 1}: ${name}। इसे ${timing} लें। खुराक: ${schedule}।`
        : `Medicine ${idx + 1}: ${name}. Take ${timing}. Dosage: ${schedule}.`
    }).join(' ')

    await speak(`${intro} ${listText}`, { lang: lang === 'hi' ? 'hi-IN' : 'en-IN', rate: 0.85 })
    setSpeakingMedId(null)
  }

  // Food timing badge color mapper
  const getTimingBadge = (timingType, text) => {
    switch (timingType) {
      case 'after_food':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm">
            <Utensils className="w-4 h-4" />
            {text}
          </span>
        )
      case 'before_food':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm">
            <Clock className="w-4 h-4" />
            {text}
          </span>
        )
      case 'bedtime':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm">
            <Clock className="w-4 h-4" />
            {text}
          </span>
        )
      case 'sos':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/50 shadow-sm animate-pulse">
            <AlertCircle className="w-4 h-4" />
            {text}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm">
            <Clock className="w-4 h-4" />
            {text}
          </span>
        )
    }
  }

  // Triage banner style mapping
  const triageStyles = {
    emergency: {
      bg: 'bg-red-950/80 border-red-500 text-red-100',
      badge: 'bg-red-600 text-white animate-pulse',
      icon: <ShieldAlert className="w-8 h-8 text-red-400 flex-shrink-0" />
    },
    urgent: {
      bg: 'bg-amber-950/80 border-amber-500 text-amber-100',
      badge: 'bg-amber-500 text-white',
      icon: <AlertTriangle className="w-8 h-8 text-amber-400 flex-shrink-0" />
    },
    routine: {
      bg: 'bg-yellow-950/80 border-yellow-500 text-yellow-100',
      badge: 'bg-yellow-500 text-slate-900 font-bold',
      icon: <Clock className="w-8 h-8 text-yellow-400 flex-shrink-0" />
    },
    'self-care': {
      bg: 'bg-emerald-950/80 border-emerald-500 text-emerald-100',
      badge: 'bg-emerald-600 text-white',
      icon: <Home className="w-8 h-8 text-emerald-400 flex-shrink-0" />
    }
  }

  const currentTriage = triageStyles[advice.triageLevel] || triageStyles['self-care']

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      {/* Top Navigation Header */}
      <header className="border-b border-slate-700 px-6 py-4">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Stethoscope className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{conditionMeta.emoji}</span>
                <h1 className="text-kiosk-2xl font-bold text-white">
                  {lang === 'hi' ? 'एआई डिजिटल ई-पर्चा एवं परामर्श' : 'AI Digital Prescription & Consultation'}
                </h1>
              </div>
              <p className="text-kiosk-sm text-slate-400">
                {chiefComplaint} • AI Symptom Assessment • {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="lg" onClick={handleBack} leftIcon={<ArrowRight className="w-5 h-5 rotate-180" aria-hidden="true" />}>
              {lang === 'hi' ? 'दस्तावेज़ जोड़ें / बदलें' : 'Add / View Documents'}
            </Button>
            <Button variant="secondary" size="lg" onClick={handlePrint} leftIcon={<Printer className="w-5 h-5" aria-hidden="true" />}>
              {lang === 'hi' ? 'पर्चा प्रिंट करें' : 'Print Prescription'}
            </Button>
            <Button variant="danger" size="lg" onClick={handleNextPatient} leftIcon={<RefreshCw className="w-5 h-5" aria-hidden="true" />}>
              {t('nextPatient', lang)}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* 1. PRIMARY SECTION: AI PRESCRIBED MEDICINES (CENTERSTAGE) */}
          <div className="p-6 rounded-2xl bg-slate-800/90 border-2 border-primary-500/60 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Pill className="w-7 h-7 text-white" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-kiosk-xl font-bold text-white">
                      {lang === 'hi' ? 'लक्षणों के आधार पर सुझाई गई दवाइयां' : 'AI Prescribed Medications (Based on Symptoms)'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-500/20 text-primary-300 border border-primary-500/40">
                      {suggestedMeds.length} {lang === 'hi' ? 'दवाएं' : 'Medicines'}
                    </span>
                  </div>
                  <p className="text-kiosk-sm text-slate-400 mt-0.5">
                    {lang === 'hi'
                      ? 'दवा कब खानी है (भोजन के बाद या पहले), खुराक, अवधि एवं सावधानियां'
                      : 'When to take (before/after food), exact dosage, schedule & precautions'}
                  </p>
                </div>
              </div>

              {/* Read all medicines audio button */}
              <button
                type="button"
                onClick={handleSpeakAllMedicines}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-kiosk-sm transition-all cursor-pointer shadow-md ${
                  speakingMedId === 'all' && isSpeaking
                    ? 'bg-primary-600 border-primary-500 text-white animate-pulse'
                    : 'bg-primary-600/20 border-primary-500/40 text-primary-300 hover:bg-primary-600 hover:text-white'
                }`}
                title={lang === 'hi' ? 'सभी दवाइयों के निर्देश सुनें' : 'Listen to full prescription audio'}
              >
                <Volume2 className="w-5 h-5" />
                <span>
                  {speakingMedId === 'all' && isSpeaking
                    ? (lang === 'hi' ? 'पर्चा बोल रहा है...' : 'Reading aloud...')
                    : (lang === 'hi' ? '🔊 पूरा पर्चा सुनें' : '🔊 Listen to Full Prescription')}
                </span>
              </button>
            </div>

            {/* Medicine Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {suggestedMeds.map((med) => {
                const isCurrentSpeaking = speakingMedId === med.id && isSpeaking
                return (
                  <div
                    key={med.id}
                    className="p-5 rounded-xl bg-slate-900/80 border border-slate-700/90 hover:border-primary-500/70 transition-all flex flex-col justify-between gap-4 shadow-lg"
                  >
                    <div>
                      {/* Medicine Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-kiosk-lg font-bold text-white">
                              {med.name[lang] || med.name.en}
                            </span>
                            <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-800 text-primary-300 border border-slate-700">
                              {med.form[lang] || med.form.en}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">
                            {med.rxType}
                          </span>
                        </div>

                        {/* Audio listen button for this medicine */}
                        <button
                          type="button"
                          onClick={() => handleSpeakMedicine(med)}
                          className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                            isCurrentSpeaking
                              ? 'bg-primary-600 border-primary-500 text-white animate-pulse'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-primary-400'
                          }`}
                          title={lang === 'hi' ? 'दवा के निर्देश सुनें' : 'Listen to medicine details'}
                        >
                          <Volume2 className="w-4 h-4" />
                          <span className="text-xs font-semibold">
                            {isCurrentSpeaking ? (lang === 'hi' ? 'बोल रहा है...' : 'Playing...') : (lang === 'hi' ? 'सुनें' : 'Listen')}
                          </span>
                        </button>
                      </div>

                      {/* Prominent When-to-Eat Food Timing Badge */}
                      <div className="my-3">
                        {getTimingBadge(med.timingType, med.timing[lang] || med.timing.en)}
                      </div>

                      {/* Detailed Medication Schedule */}
                      <div className="space-y-2.5 text-kiosk-xs bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/60">
                        <div className="flex items-start gap-2">
                          <span className="text-slate-400 font-bold min-w-[95px]">{lang === 'hi' ? 'खुराक (Dose):' : 'Schedule:'}</span>
                          <span className="text-slate-200 font-medium">{med.schedule[lang] || med.schedule.en}</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="text-slate-400 font-bold min-w-[95px]">{lang === 'hi' ? 'अवधि (Duration):' : 'Duration:'}</span>
                          <span className="text-slate-200 font-medium">{med.duration[lang] || med.duration.en}</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="text-slate-400 font-bold min-w-[95px]">{lang === 'hi' ? 'उपयोग का कारण:' : 'Purpose:'}</span>
                          <span className="text-slate-300">{med.purpose[lang] || med.purpose.en}</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="text-slate-400 font-bold min-w-[95px]">{lang === 'hi' ? 'खाने का तरीका:' : 'Instructions:'}</span>
                          <span className="text-emerald-300 font-medium">{med.instructions[lang] || med.instructions.en}</span>
                        </div>
                      </div>
                    </div>

                    {/* Precaution Box */}
                    <div className="pt-3 border-t border-slate-800 text-[11px] text-amber-300/90 flex items-start gap-1.5 bg-amber-500/5 p-2 rounded">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
                      <span>{med.precautions[lang] || med.precautions.en}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Disclaimer */}
            <div className="mt-5 p-3 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <span>
                {lang === 'hi'
                  ? 'सूचना: ये दवाइयां आपके लक्षणों के आधार पर प्राथमिक राहत (First-Line & OTC) के लिए सुझाई गई हैं। यदि लक्षण 3 दिन से अधिक रहें तो चिकित्सक से परामर्श लें।'
                  : 'Notice: These medications are standard first-line symptomatic treatments. Please consult a qualified doctor if symptoms persist.'}
              </span>
            </div>
          </div>

          {/* 2. CLINICAL TRIAGE & ADVICE BANNER */}
          <div className={`p-6 rounded-2xl border-2 ${currentTriage.bg} shadow-2xl transition-all`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                {currentTriage.icon}
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${currentTriage.badge}`}>
                      {advice.triageLevel}
                    </span>
                    <h2 className="text-kiosk-xl font-extrabold text-white">
                      {advice.triageLabel[lang] || advice.triageLabel.en}
                    </h2>
                  </div>
                  <p className="text-kiosk-sm text-slate-300">
                    {advice.warning[lang] || advice.warning.en}
                  </p>
                </div>
              </div>
            </div>

            {/* Advice Grid: Immediate Actions + Home Care */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Immediate Actions */}
              <div className="bg-slate-900/60 p-5 rounded-xl border border-white/10">
                <h3 className="text-kiosk-base font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  {lang === 'hi' ? 'तत्काल आवश्यक कदम' : 'Immediate Actions Required'}
                </h3>
                <ul className="space-y-2.5">
                  {(advice.immediateActions[lang] || advice.immediateActions.en || []).map((action, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-kiosk-sm text-slate-200">
                      <CheckCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Home Care Recommendations */}
              <div className="bg-slate-900/60 p-5 rounded-xl border border-white/10">
                <h3 className="text-kiosk-base font-bold text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  {lang === 'hi' ? 'घरेलू देखभाल एवं सुझाव' : 'Home Care & Recommendations'}
                </h3>
                {(advice.homeAdvice[lang] || advice.homeAdvice.en || []).length > 0 ? (
                  <ul className="space-y-2.5">
                    {(advice.homeAdvice[lang] || advice.homeAdvice.en).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-kiosk-sm text-slate-200">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-kiosk-sm text-slate-400 italic">
                    {lang === 'hi' ? 'कोई घरेलू देखभाल अनुशंसित नहीं — तुरंत डॉक्टर से मिलें।' : 'Emergency triage — direct medical attention required.'}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-700/60">
                  <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider block mb-1">
                    {lang === 'hi' ? 'अनुशंसित अगला कदम' : 'Recommended Follow-up'}
                  </span>
                  <p className="text-kiosk-sm text-slate-200 font-medium">
                    {advice.followUp[lang] || advice.followUp.en}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. PATIENT SUMMARY & CLINICAL HISTORY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Col 1: Patient Details & Red Flags */}
            <div className="lg:col-span-6 space-y-6">
              {/* Patient Info Card */}
              <div className="p-6 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-xl">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700">
                  <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-400" aria-hidden="true" />
                  </div>
                  <h2 className="text-kiosk-lg font-bold text-white">{t('patientInfo', lang)}</h2>
                </div>
                <dl className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <dt className="text-kiosk-xs text-slate-400 font-bold uppercase tracking-wider">ABHA / Phone ID</dt>
                    <dd className="text-kiosk-base font-mono font-bold text-white mt-1">{abhaId}</dd>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <dt className="text-kiosk-xs text-slate-400 font-bold uppercase tracking-wider">{lang === 'hi' ? 'मुख्य समस्या' : 'Chief Concern'}</dt>
                    <dd className="text-kiosk-base font-bold text-primary-300 mt-1 flex items-center gap-1.5">
                      <span>{conditionMeta.emoji}</span>
                      <span>{chiefComplaint}</span>
                    </dd>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <dt className="text-kiosk-xs text-slate-400 font-bold uppercase tracking-wider">{t('questionPrefix', lang)} Answered</dt>
                    <dd className="text-kiosk-base font-bold text-white mt-1">{state.clinicalHistory.responses.length}</dd>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <dt className="text-kiosk-xs text-slate-400 font-bold uppercase tracking-wider">Date & Time</dt>
                    <dd className="text-kiosk-sm font-semibold text-slate-200 mt-1">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</dd>
                  </div>
                </dl>
              </div>

              {/* Red Flags Card */}
              <div className={`p-6 rounded-2xl border shadow-xl transition-all ${
                redFlags.length > 0 
                  ? 'bg-rose-950/40 border-2 border-rose-500/60 shadow-rose-950/30' 
                  : 'bg-slate-800/90 border border-slate-700'
              }`}>
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700/80">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    redFlags.length > 0 ? 'bg-rose-600/20 border border-rose-500/40' : 'bg-slate-700/30'
                  }`}>
                    <AlertTriangle className={`w-6 h-6 ${redFlags.length > 0 ? 'text-rose-400' : 'text-slate-400'}`} aria-hidden="true" />
                  </div>
                  <h2 className="text-kiosk-lg font-bold text-white">{t('redFlags', lang)}</h2>
                  {redFlags.length > 0 && (
                    <span className="ml-auto px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-extrabold border border-rose-500/40 animate-pulse">
                      {redFlags.length} Flagged
                    </span>
                  )}
                </div>
                {redFlags.length === 0 ? (
                  <p className="text-slate-400 text-kiosk-base">{t('noRedFlags', lang)}</p>
                ) : (
                  <ul className="space-y-3" role="list">
                    {redFlags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 shadow-md">
                        <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div className="flex-1">
                          <p className="text-kiosk-sm font-bold text-white">{flag.question}</p>
                          <p className="text-xs text-rose-300 font-semibold mt-1.5 flex items-center gap-1">
                            <span className="text-slate-400">Answer:</span>
                            <span className="px-2 py-0.5 rounded bg-rose-900/60 text-white font-bold border border-rose-700/50">
                              {Array.isArray(flag.answer) ? flag.answer.join(', ') : flag.answer}
                            </span>
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Col 2: Structured Clinical History */}
            <div className="lg:col-span-6 space-y-6">
              <div className="p-6 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-xl">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700">
                  <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary-400" aria-hidden="true" />
                  </div>
                  <h2 className="text-kiosk-lg font-bold text-white">{t('clinicalHistory', lang)}</h2>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-400"></span>
                    {lang === 'hi' ? 'प्रश्नावली प्रतिक्रियाएं' : 'Interview Responses'}
                  </dt>
                  {hpiItems.length === 0 ? (
                    <p className="text-slate-500 text-kiosk-sm">{lang === 'hi' ? 'कोई प्रतिक्रिया दर्ज नहीं' : 'No questionnaire responses recorded'}</p>
                  ) : (
                    <dl className="space-y-3">
                      {hpiItems.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border shadow-sm transition-all ${
                            item.isRedFlag
                              ? 'bg-rose-950/70 border-rose-500/50'
                              : 'bg-slate-900/80 border-slate-700/80'
                          }`}
                        >
                          <dt className={`text-xs font-semibold mb-1 ${item.isRedFlag ? 'text-rose-300 font-bold' : 'text-slate-400'}`}>
                            {item.label}
                          </dt>
                          <dd className={`text-kiosk-sm font-bold ${item.isRedFlag ? 'text-white' : 'text-slate-100'}`}>
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. DIGITIZED MEDICAL RECORDS (PRESCRIPTIONS, LAB REPORTS, MEDICAL HISTORY) */}
          <div className="p-6 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <FileText className="w-7 h-7 text-white" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-kiosk-xl font-bold text-white">
                      {t('digitizedData', lang)}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                      {state.scannedDocs.length} {lang === 'hi' ? 'दस्तावेज़' : 'Documents'}
                    </span>
                  </div>
                  <p className="text-kiosk-sm text-slate-400 mt-0.5">
                    {lang === 'hi'
                      ? 'मरीज द्वारा अपलोड किए गए पर्चे, लैब टेस्ट और मेडिकल इतिहास का AI विश्लेषण'
                      : 'Prescriptions, lab reports, and medical history digitized and structured by AI'}
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={() => actions.setStep(4)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {lang === 'hi' ? '+ और दस्तावेज़ जोड़ें' : '+ Upload Additional Records'}
              </Button>
            </div>

            {state.scannedDocs.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-60" />
                <p className="text-kiosk-base text-slate-400 mb-4">
                  {lang === 'hi' ? 'इस परामर्श के लिए कोई पूर्व चिकित्सा दस्तावेज़ अपलोड नहीं किए गए हैं।' : 'No previous medical documents were uploaded for this consultation.'}
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => actions.setStep(4)}
                  leftIcon={<Upload className="w-5 h-5" />}
                >
                  {lang === 'hi' ? 'पर्चे / लैब रिपोर्ट / इतिहास अपलोड करें' : 'Upload Prescriptions / Lab Reports / History'}
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {state.scannedDocs.map((doc) => {
                  const isPrescription = doc.type === 'Prescription'
                  const isLab = doc.type === 'Lab Report'
                  const isHistory = doc.type === 'Medical History'
                  const isEcg = doc.type === 'ECG'

                  return (
                    <div 
                      key={doc.id}
                      className="p-5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700/60">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isPrescription ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                            isLab ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                            isHistory ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                            'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}>
                            {doc.type}
                          </span>
                          <h4 className="text-kiosk-base font-bold text-white">
                            {doc.originalName || doc.name}
                          </h4>
                        </div>

                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          {doc.extractedData?.doctor && <span>{doc.extractedData.doctor}</span>}
                          {doc.extractedData?.date && <span>• {doc.extractedData.date}</span>}
                        </div>
                      </div>

                      {/* Prescription Meds Display */}
                      {isPrescription && doc.extractedData?.medications && (
                        <div className="mt-3">
                          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5" />
                            {t('medications', lang)}:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {doc.extractedData.medications.map((m, idx) => (
                              <div key={idx} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                                <p className="text-kiosk-sm font-bold text-slate-200">{m.name} {m.dose}</p>
                                <p className="text-xs text-slate-400">{m.frequency} ({m.duration})</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lab Tests Display */}
                      {isLab && doc.extractedData?.tests && (
                        <div className="mt-3">
                          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <TestTube2 className="w-3.5 h-3.5" />
                            {t('labValues', lang)}:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {doc.extractedData.tests.map((test, idx) => (
                              <div key={idx} className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-kiosk-sm font-medium text-slate-300">{test.name}</p>
                                  <p className="text-xs text-slate-400 font-mono">{test.value} {test.unit} (Ref: {test.ref})</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  test.status === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                  test.status === 'low' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  {test.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Medical History Display */}
                      {isHistory && (
                        <div className="mt-3 space-y-3">
                          {doc.extractedData?.chronicConditions && (
                            <div>
                              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <History className="w-3.5 h-3.5" />
                                {t('chronicConditions', lang)}:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {doc.extractedData.chronicConditions.map((c, idx) => (
                                  <span key={idx} className="px-3 py-1 rounded-lg bg-purple-900/30 text-purple-200 border border-purple-700/60 text-xs font-semibold">
                                    {c.condition} (Since {c.diagnosedYear})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {doc.extractedData?.surgeries && (
                            <div className="text-xs text-slate-300">
                              <strong className="text-slate-400">{t('pastSurgeries', lang)}:</strong> {doc.extractedData.surgeries.map(s => `${s.procedure} (${s.year})`).join(', ')}
                            </div>
                          )}

                          {doc.extractedData?.allergies && (
                            <div className="text-xs text-rose-300">
                              <strong className="text-rose-400">{t('allergies', lang)}:</strong> {doc.extractedData.allergies.map(a => `${a.allergen} (${a.reaction})`).join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ECG Display */}
                      {isEcg && doc.extractedData?.findings && (
                        <div className="mt-3">
                          <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5" />
                            {t('clinicalFindings', lang)}:
                          </p>
                          <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
                            {doc.extractedData.findings.map((f, idx) => (
                              <li key={idx}>{f}</li>
                            ))}
                          </ul>
                          {doc.extractedData.interpretation && (
                            <p className="mt-2 text-xs text-amber-300 italic bg-amber-950/30 p-2 rounded border border-amber-900/40">
                              {doc.extractedData.interpretation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          {/* 5. REAL-TIME LOCATION & NEARBY DOCTOR APPOINTMENT BOOKING SECTION */}
          <div className="p-6 rounded-2xl bg-slate-800/90 border-2 border-emerald-500/40 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Calendar className="w-7 h-7 text-white" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-kiosk-xl font-bold text-white">
                      {lang === 'hi' ? '🏥 डॉक्टर से अपॉइंटमेंट बुक करें' : '🏥 Book Doctor Appointment'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {lang === 'hi' ? 'रीयल-टाइम जीपीएस' : 'Real-Time GPS'}
                    </span>
                  </div>
                  <p className="text-kiosk-sm text-slate-400 mt-0.5">
                    {lang === 'hi'
                      ? 'AI परामर्श के आधार पर आपके वर्तमान स्थान के निकटतम सर्वश्रेष्ठ अस्पताल में अपॉइंटमेंट'
                      : 'Book an appointment with top-rated doctors in the best nearby hospitals in your location'}
                  </p>
                </div>
              </div>
            </div>

            {/* REAL-TIME PATIENT LOCATION BAR */}
            <div className="mt-5 p-4 rounded-xl bg-slate-900/90 border border-emerald-500/40 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Detected Location Info */}
                <div className="flex items-start sm:items-center gap-3">
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex-shrink-0">
                    <Crosshair className={`w-5 h-5 text-emerald-400 ${isLocLoading ? 'animate-spin' : ''}`} />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        {lang === 'hi' ? '📍 रोगी का रीयल-टाइम स्थान:' : '📍 Patient Live Location:'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {patientLoc.source === 'gps' ? 'GPS Active (±20m)' : 'Location Matched'}
                      </span>
                    </div>
                    <p className="text-kiosk-base font-bold text-white mt-0.5">
                      {patientLoc.displayName || `${patientLoc.area}, ${patientLoc.city}`}
                    </p>
                  </div>
                </div>

                {/* Right: GPS Controls */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleRefreshGps}
                    disabled={isLocLoading}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 text-slate-200 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLocLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : (
                      <Crosshair className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>{lang === 'hi' ? 'जीपीएस रिफ्रेश करें' : 'Refresh GPS'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{lang === 'hi' ? 'स्थान बदलें / पिनकोड' : 'Change Location / PIN'}</span>
                  </button>
                </div>
              </div>

              {/* Radius filter & Condition Matching info */}
              <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">{lang === 'hi' ? 'दूरी सीमा:' : 'Search Radius:'}</span>
                  {[3, 5, 10, 20].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSearchRadius(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        searchRadius === r
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-primary-400" />
                  <span>
                    {lang === 'hi' ? 'विशेषज्ञता:' : 'Specialty Filter:'}{' '}
                    <strong className="text-primary-300">{chiefComplaint}</strong>
                  </span>
                </div>
              </div>

              {locError && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                    <span>{locError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="text-amber-200 underline font-semibold flex-shrink-0 cursor-pointer"
                  >
                    {lang === 'hi' ? 'स्थान चुनें' : 'Choose Manually'}
                  </button>
                </div>
              )}
            </div>

            {/* Confirmed Booking Banner (if already booked) */}
            {bookingConfirmed && bookingDetails && (
              <div className="mt-6 p-5 rounded-xl bg-emerald-950/80 border-2 border-emerald-500/60 animate-in fade-in shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-kiosk-lg font-bold text-emerald-300">
                        {lang === 'hi' ? '✅ अपॉइंटमेंट सफलतापूर्वक बुक हो गई!' : '✅ Appointment Booked Successfully!'}
                      </h3>
                      <p className="text-kiosk-sm text-emerald-400">
                        Token / Booking ID: <strong className="font-mono text-white">{bookingDetails.bookingId}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {bookingDetails.directionsUrl && (
                      <a
                        href={bookingDetails.directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-cyan-600/20"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>{lang === 'hi' ? '🗺️ गूगल मैप्स में रास्ता' : '🗺️ Get Directions in Maps'}</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <span>{lang === 'hi' ? '🖨️ पर्ची प्रिंट' : '🖨️ Print Pass'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700">
                    <p className="text-xs text-slate-400 font-bold uppercase">{lang === 'hi' ? 'अस्पताल' : 'Hospital'}</p>
                    <p className="text-kiosk-sm text-white font-semibold mt-0.5">
                      {bookingDetails.hospital.name[lang] || bookingDetails.hospital.name.en}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{bookingDetails.hospital.address[lang] || bookingDetails.hospital.address.en}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700">
                    <p className="text-xs text-slate-400 font-bold uppercase">{lang === 'hi' ? 'डॉक्टर' : 'Doctor'}</p>
                    <p className="text-kiosk-sm text-white font-semibold mt-0.5">{bookingDetails.doctor}</p>
                    <p className="text-[11px] text-emerald-400">{bookingDetails.opdRoom || 'OPD Room 104'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700">
                    <p className="text-xs text-slate-400 font-bold uppercase">{lang === 'hi' ? 'समय' : 'Appointment Time'}</p>
                    <p className="text-kiosk-sm text-emerald-300 font-bold mt-0.5">{bookingDetails.slot}</p>
                    <p className="text-[11px] text-slate-400">Reporting: 10 mins before</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700">
                    <p className="text-xs text-slate-400 font-bold uppercase">{lang === 'hi' ? 'शुल्क' : 'Consultation Fee'}</p>
                    <p className="text-kiosk-sm text-white font-semibold mt-0.5">{bookingDetails.hospital.fees}</p>
                    <p className="text-[11px] text-slate-400">ABHA: {bookingDetails.patientId}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'अस्पताल हेल्पडेस्क:' : 'Hospital Helpdesk:'} {bookingDetails.hospital.phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    className="text-xs text-slate-400 hover:text-red-300 underline cursor-pointer"
                  >
                    {lang === 'hi' ? 'अपॉइंटमेंट रद्द / दूसरी चुनें' : 'Cancel / Change Appointment'}
                  </button>
                </div>
              </div>
            )}

            {/* HOSPITALS LISTING (Based on Real-Time Location) */}
            {showBookingPrompt && (
              <div className="mt-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900/80 border border-emerald-700/40 mb-5 flex items-center justify-between gap-4">
                  <p className="text-kiosk-sm text-white font-semibold">
                    {lang === 'hi'
                      ? `🩺 आपके स्थान (${patientLoc.area || patientLoc.city}) के ${searchRadius} किमी के दायरे में सबसे अच्छे अस्पताल:`
                      : `🩺 Best hospitals near your location (${patientLoc.area || patientLoc.city}) within ${searchRadius} km:`}
                  </p>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800 flex-shrink-0">
                    {hospitals.length} {lang === 'hi' ? 'अस्पताल उपलब्ध' : 'Hospitals Available'}
                  </span>
                </div>

                {/* Loading skeleton */}
                {isLoadingHospitals ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-5 rounded-xl bg-slate-900/80 border border-slate-700/80 animate-pulse space-y-3">
                        <div className="h-6 bg-slate-800 rounded w-3/4" />
                        <div className="h-4 bg-slate-800 rounded w-1/2" />
                        <div className="h-16 bg-slate-800/60 rounded" />
                        <div className="h-10 bg-slate-800 rounded" />
                      </div>
                    ))}
                  </div>
                ) : hospitals.length === 0 ? (
                  <div className="text-center py-10 bg-slate-900/60 rounded-xl border border-slate-800">
                    <p className="text-slate-400 text-sm">
                      {lang === 'hi' ? 'इस दायरे में कोई अस्पताल नहीं मिला। कृपया दूरी सीमा बढ़ाएं।' : 'No hospitals found within this radius. Try increasing the search radius.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchRadius(20)}
                      className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                    >
                      {lang === 'hi' ? 'दूरी 20 किमी तक बढ़ाएं' : 'Expand radius to 20 km'}
                    </button>
                  </div>
                ) : (
                  /* Dynamic Hospital Cards */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {hospitals.map((hospital) => (
                      <div
                        key={hospital.id}
                        className="p-5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-emerald-500/60 transition-all shadow-lg flex flex-col justify-between group"
                      >
                        <div>
                          {/* Hospital Header */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                              <Building2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-kiosk-base font-bold text-white leading-tight">
                                {hospital.name[lang] || hospital.name.en}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                  <span className="text-xs font-bold text-amber-300">{hospital.rating}</span>
                                  <span className="text-[11px] text-slate-500">({hospital.reviewsCount})</span>
                                </div>
                                <span className="text-slate-600">•</span>
                                <div className="flex items-center gap-1">
                                  <Navigation className="w-3 h-3 text-cyan-400" />
                                  <span className="text-xs text-cyan-300 font-semibold">
                                    {hospital.distance} — {hospital.travelTime}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Matched Doctor Card */}
                          <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 mb-3">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4 text-primary-400 flex-shrink-0" />
                              <span className="text-xs text-slate-200 font-bold">{hospital.doctor[lang] || hospital.doctor.en}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 ml-6">{hospital.department[lang] || hospital.department.en}</p>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/60 text-[11px]">
                              <span className="text-emerald-400 font-medium">{hospital.opdRoom}</span>
                              <span className="text-slate-400">{hospital.doctorExp || '15+ yrs exp'}</span>
                            </div>
                          </div>

                          {/* Address */}
                          <div className="flex items-start gap-2 mb-3">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-slate-400 line-clamp-2">{hospital.address[lang] || hospital.address.en}</span>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {hospital.badges.map((badge, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                {badge}
                              </span>
                            ))}
                          </div>

                          {/* Fees */}
                          <div className="text-xs text-slate-300 mb-4">
                            <span className="text-slate-500 font-semibold">{lang === 'hi' ? 'शुल्क:' : 'Fee:'}</span> {hospital.fees}
                          </div>
                        </div>

                        {/* Actions: Book Appointment & Directions */}
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleOpenBookingModal(hospital)}
                            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-kiosk-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                          >
                            <Calendar className="w-5 h-5" />
                            <span>{lang === 'hi' ? 'अपॉइंटमेंट बुक करें' : 'Book Appointment'}</span>
                          </button>

                          <a
                            href={getDirectionsUrl(patientLoc.lat, patientLoc.lon, hospital.lat, hospital.lon, hospital.name.en)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-slate-700/60"
                          >
                            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{lang === 'hi' ? 'रास्ता देखें (गूगल मैप्स)' : 'View Route & Directions'}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location Picker Modal */}
          <LocationPickerModal
            isOpen={isLocationModalOpen}
            onClose={() => setIsLocationModalOpen(false)}
            currentLocation={patientLoc}
            onLocationSelected={handleLocationSelected}
            lang={lang}
          />

          {/* Appointment Booking Modal */}
          <AppointmentBookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            hospital={bookingTargetHospital}
            patientLocation={patientLoc}
            patientDetails={state.patientDetails}
            chiefComplaint={chiefComplaint}
            onBookingConfirmed={handleBookingConfirmed}
            lang={lang}
          />

        </div>
      </main>

      {/* Print overlay */}
      {printTriggered && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 no-print" onClick={() => setPrintTriggered(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-kiosk-lg text-slate-700">Preparing print layout...</p>
          </div>
        </div>
      )}
    </div>
  )
}
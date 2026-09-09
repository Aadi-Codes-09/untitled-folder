import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Home,
  ShieldAlert,
  FileText,
  Stethoscope,
  Calendar,
  ClipboardList,
  Search,
  Mic,
  MicOff,
  Hand,
  FileUp,
  MapPin,
  CalendarCheck,
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  Clock,
  Building2,
  Navigation,
  QrCode,
  User,
  HeartPulse,
  Activity,
  PhoneCall
} from 'lucide-react'
import { useKiosk } from '../../context/KioskContext'
import { useSpeechInteraction } from '../../hooks/useSpeechInteraction'
import { CONDITIONS } from '../../data/diseaseFlows'
import { HOSPITALS_DATABASE } from '../../data/mockData'
import { LocationPickerModal } from '../kiosk/LocationPickerModal'
import { AppointmentBookingModal } from '../kiosk/AppointmentBookingModal'

export function KioskDashboard() {
  const { state, actions } = useKiosk()
  const {
    speak,
    cancel,
    isSpeaking,
    isListening,
    startListening,
    stopListening,
    transcript,
    resetTranscript,
    isSupported: sttSupported
  } = useSpeechInteraction()

  const [activeTab, setActiveTab] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false)
  const [showHealthRecordModal, setShowHealthRecordModal] = useState(false)
  const [voiceGreetingActive, setVoiceGreetingActive] = useState(false)
  const [voiceTranscriptFeedback, setVoiceTranscriptFeedback] = useState('')
  const [selectedHospitalForBooking, setSelectedHospitalForBooking] = useState(null)

  const lang = state.language
  const searchInputRef = useRef(null)

  // Live real-time clock updating every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Format date and time according to design: e.g. "Mon, 8 Sep 2025  10:24 AM"
  const formattedDateTime = useMemo(() => {
    const optionsDate = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
    const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true }
    const dateStr = currentTime.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', optionsDate)
    const timeStr = currentTime.toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-US', optionsTime)
    return `${dateStr}  ${timeStr}`
  }, [currentTime, lang])

  // Filter symptoms and conditions for the interactive search bar
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return []
    return CONDITIONS.filter(c =>
      c.en.toLowerCase().includes(q) ||
      c.hi.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    ).slice(0, 6)
  }, [searchQuery])

  // Voice command handler
  useEffect(() => {
    if (!transcript) return
    const text = transcript.toLowerCase().trim()
    setVoiceTranscriptFeedback(transcript)

    // Check for matching symptoms
    const matchedCond = CONDITIONS.find(c =>
      text.includes(c.en.toLowerCase()) ||
      text.includes(c.hi.toLowerCase()) ||
      (c.id === 'fever' && (text.includes('fever') || text.includes('बुखार') || text.includes('bukhar'))) ||
      (c.id === 'chest_pain' && (text.includes('chest') || text.includes('सीने') || text.includes('heart'))) ||
      (c.id === 'headache' && (text.includes('head') || text.includes('सिर') || text.includes('sir'))) ||
      (c.id === 'cough' && (text.includes('cough') || text.includes('खांसी') || text.includes('khasi')))
    )

    if (matchedCond) {
      actions.setCondition(matchedCond.id)
      actions.setStep(2) // Jump to symptom picker or direct converse
      stopListening()
      return
    }

    if (text.includes('start') || text.includes('begin') || text.includes('शुरू') || text.includes('aage')) {
      handleTouchToStart()
      stopListening()
      return
    }

    if (text.includes('hospital') || text.includes('अस्पताल') || text.includes('doctor') || text.includes('डॉक्टर')) {
      setShowLocationModal(true)
      stopListening()
      return
    }

    if (text.includes('upload') || text.includes('report') || text.includes('दस्तावेज़') || text.includes('पर्चा')) {
      actions.setStep(4)
      stopListening()
      return
    }

    if (text.includes('appointment') || text.includes('अपॉइंटमेंट')) {
      handleOpenBooking()
      stopListening()
      return
    }
  }, [transcript])

  // Toggle language with speech confirmation
  const handleToggleLanguage = (newLang) => {
    actions.setLanguage(newLang)
    cancel()
    if (newLang === 'hi') {
      speak('नमस्ते! मेडीकियोस्क में आपका स्वागत है। बोलें या स्क्रीन पर स्पर्श करें।', {
        lang: 'hi-IN',
        rate: 0.9
      })
    } else {
      speak('Welcome to MediKiosk. Speak now or touch the screen to start.', {
        lang: 'en-IN',
        rate: 0.9
      })
    }
  }

  // MediBot voice greeting
  const handleBotGreeting = () => {
    cancel()
    setVoiceGreetingActive(true)
    const text = lang === 'hi'
      ? 'नमस्ते! मैं मेडीबॉट हूँ, आपका AI स्वास्थ्य सहायक। अपनी जांच शुरू करने के लिए "टच टू स्टार्ट" दबाएं या बोलकर बताएं।'
      : 'Hello! I am MediBot, your AI healthcare companion. Tap Touch to Start or press Speak Now to tell me your symptoms!'
    speak(text, { lang: lang === 'hi' ? 'hi-IN' : 'en-IN', rate: 0.9 })
    setTimeout(() => setVoiceGreetingActive(false), 5000)
  }

  // Voice button trigger
  const handleVoiceTrigger = () => {
    if (isListening) {
      stopListening()
      setVoiceTranscriptFeedback('')
    } else {
      resetTranscript()
      setVoiceTranscriptFeedback(
        lang === 'hi'
          ? 'सुन रहा हूँ... अपनी बीमारी बताएं या "डॉक्टर खोजें" कहें'
          : 'Listening... say your symptom or "Find Doctor"'
      )
      startListening(lang === 'hi' ? 'hi-IN' : 'en-IN')
    }
  }

  // Touch to Start action
  const handleTouchToStart = () => {
    // Navigate to Step 1 (Patient Identification & ABHA verification)
    actions.setStep(1)
  }

  // Quick assessment launcher
  const handleQuickAssessment = () => {
    actions.setStep(2) // Direct to symptom picker
  }

  // Upload reports launcher
  const handleUploadReports = () => {
    actions.setStep(4) // Direct to document OCR screen
  }

  // Open hospital finder
  const handleFindHospitals = () => {
    setShowLocationModal(true)
  }

  // Open booking modal
  const handleOpenBooking = (hospital = null) => {
    const targetHospital = hospital || HOSPITALS_DATABASE[0]
    setSelectedHospitalForBooking(targetHospital)
    setShowBookingModal(true)
  }

  // Handle location selected from modal
  const handleLocationSelect = (loc) => {
    actions.setLocation(loc)
    setShowLocationModal(false)
    // After location is selected, offer hospital booking or doctor search
    setSelectedHospitalForBooking(HOSPITALS_DATABASE[0])
    setShowBookingModal(true)
  }

  // Handle sidebar navigation
  const handleNavClick = (tabId) => {
    setActiveTab(tabId)
    if (tabId === 'home') {
      // Stay on dashboard
    } else if (tabId === 'assessment') {
      handleQuickAssessment()
    } else if (tabId === 'upload') {
      handleUploadReports()
    } else if (tabId === 'doctor') {
      handleFindHospitals()
    } else if (tabId === 'appointments') {
      setShowAppointmentsModal(true)
    } else if (tabId === 'records') {
      setShowHealthRecordModal(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f7fc] flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT SIDEBAR NAVIGATION                                   */}
        {/* ========================================================= */}
        <aside className="w-72 bg-white/90 backdrop-blur-md border-r border-slate-200/80 flex flex-col justify-between py-6 px-4 shrink-0 shadow-sm z-20">
          <div>
            {/* MediKiosk Brand Header */}
            <div className="flex items-center space-x-3.5 px-3 mb-8 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white font-black text-2xl">
                <span className="leading-none select-none">+</span>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  MediKiosk
                </h1>
                <p className="text-xs font-medium text-slate-400 leading-tight">
                  Your Health Our Support
                </p>
              </div>
            </div>

            {/* Sidebar Menu Items */}
            <nav className="space-y-2">
              {[
                { id: 'home', labelEn: 'Home', labelHi: 'होम', icon: Home },
                { id: 'assessment', labelEn: 'Health Assessment', labelHi: 'स्वास्थ्य मूल्यांकन', icon: ShieldAlert },
                { id: 'upload', labelEn: 'Upload Documents', labelHi: 'दस्तावेज़ अपलोड करें', icon: FileText },
                { id: 'doctor', labelEn: 'Find Doctor', labelHi: 'डॉक्टर खोजें', icon: Stethoscope },
                { id: 'appointments', labelEn: 'My Appointments', labelHi: 'मेरे अपॉइंटमेंट्स', icon: Calendar },
                { id: 'records', labelEn: 'My Health Record', labelHi: 'मेरा स्वास्थ्य रिकॉर्ड', icon: ClipboardList },
              ].map((item) => {
                const IconComponent = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-xl font-semibold text-base transition-all duration-200 text-left ${
                      isActive
                        ? 'bg-[#1e2e4a] text-white shadow-md shadow-slate-900/10'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 ${isActive ? 'text-cyan-300' : 'text-slate-500'}`} />
                    <span className="tracking-wide">
                      {lang === 'hi' ? item.labelHi : item.labelEn}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Sidebar Footer / System Badge */}
          <div className="px-3 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700">ABHA & ABDM Active</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kiosk Terminal #01 • OPD Online
              </p>
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* MAIN DASHBOARD CONTENT AREA                               */}
        {/* ========================================================= */}
        <main className="flex-1 flex flex-col overflow-y-auto px-8 py-6 max-w-7xl mx-auto w-full">
          {/* Top Header: Language Switcher & Live Clock */}
          <header className="flex items-center justify-end space-x-6 mb-6">
            {/* Language Toggle Pill */}
            <div className="bg-white p-1 rounded-full border border-slate-200 shadow-sm flex items-center space-x-1">
              <button
                onClick={() => handleToggleLanguage('en')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-[#1e3a8a] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => handleToggleLanguage('hi')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  lang === 'hi'
                    ? 'bg-[#1e3a8a] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Live Clock & Date */}
            <div className="text-right">
              <span className="text-sm font-semibold text-slate-600 tracking-wide font-mono">
                {formattedDateTime}
              </span>
            </div>
          </header>

          {/* ========================================================= */}
          {/* HERO WELCOME CARD                                         */}
          {/* ========================================================= */}
          <section className="bg-white/95 backdrop-blur rounded-3xl p-8 lg:p-10 shadow-xl shadow-slate-200/60 border border-slate-100 relative overflow-hidden mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Greeting, Search & Action Buttons */}
              <div className="lg:col-span-8 flex flex-col justify-center">
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {lang === 'hi' ? 'मेडीकियोस्क में आपका स्वागत है' : 'Welcome to MediKiosk'}
                </h2>
                <p className="text-lg font-medium text-slate-500 mt-1 mb-6">
                  {lang === 'hi' ? 'एआई-संचालित स्मार्ट हेल्थकेयर कियोस्क' : 'AI-Powered Healthcare Kiosk'}
                </p>

                {/* Interactive Search Bar */}
                <div className="relative mb-6">
                  <div className="flex items-center bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white border border-slate-200 focus-within:border-blue-500 rounded-2xl px-5 py-3.5 shadow-sm transition-all">
                    <Search className="w-5 h-5 text-blue-500 shrink-0 mr-3.5" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setShowSearchDropdown(true)
                      }}
                      onFocus={() => setShowSearchDropdown(true)}
                      placeholder={
                        lang === 'hi'
                          ? 'आज हम आपकी क्या मदद कर सकते हैं? (लक्षण, डॉक्टर, जांच)'
                          : 'How can we help you today?'
                      }
                      className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-base font-medium outline-none"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setShowSearchDropdown(false)
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Suggestions */}
                  {showSearchDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-30 max-h-60 overflow-y-auto">
                      <div className="px-4 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {lang === 'hi' ? 'सुझाए गए लक्षण' : 'Suggested Symptoms & Services'}
                      </div>
                      {searchResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            actions.setCondition(item.id)
                            setShowSearchDropdown(false)
                            actions.setStep(2)
                          }}
                          className="flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{item.emoji}</span>
                            <span className="font-semibold text-slate-800">
                              {lang === 'hi' ? item.hi : item.en}
                            </span>
                          </div>
                          <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-1 rounded-full">
                            {lang === 'hi' ? 'जांचें' : 'Assess'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Voice Transcript Bubble if active */}
                {voiceTranscriptFeedback && (
                  <div className="mb-4 bg-sky-50 border border-sky-200 text-sky-900 rounded-xl px-4 py-2 text-sm flex items-center space-x-2 animate-in fade-in duration-200">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping shrink-0" />
                    <span className="font-medium">{voiceTranscriptFeedback}</span>
                  </div>
                )}

                {/* Dual Primary Large Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Speak Now Button */}
                  <button
                    onClick={handleVoiceTrigger}
                    className={`flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl font-bold text-white shadow-lg transition-all transform active:scale-98 cursor-pointer ${
                      isListening
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 ring-4 ring-red-200 animate-pulse'
                        : 'bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600 hover:from-sky-500 hover:to-blue-700 shadow-blue-500/25'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      {isListening ? (
                        <MicOff className="w-6 h-6 text-white" />
                      ) : (
                        <Mic className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-lg leading-tight font-extrabold">
                        {isListening
                          ? (lang === 'hi' ? 'सुन रहे हैं...' : 'Listening...')
                          : (lang === 'hi' ? 'अभी बोलें' : 'Speak Now')}
                      </div>
                      <div className="text-xs text-blue-100 font-medium opacity-90">
                        (English / हिन्दी)
                      </div>
                    </div>
                  </button>

                  {/* Touch to Start Button */}
                  <button
                    onClick={handleTouchToStart}
                    className="flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-98 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Hand className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-lg leading-tight font-extrabold">
                        {lang === 'hi' ? 'शुरू करने के लिए स्पर्श करें' : 'Touch to Start'}
                      </div>
                      <div className="text-xs text-emerald-100 font-medium opacity-90">
                        {lang === 'hi' ? 'त्वरित पहचान एवं जांच' : 'Rapid Patient Check-In'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Right Column: 3D Robot Assistant Companion */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center relative">
                <div
                  onClick={handleBotGreeting}
                  title="Click to talk with MediBot"
                  className="group relative cursor-pointer flex flex-col items-center"
                >
                  {/* Soft Radial Ambient Glow */}
                  <div className="absolute inset-0 bg-blue-100/60 rounded-3xl filter blur-xl -z-10 group-hover:bg-blue-200/80 transition-all" />

                  {/* Robot Image Container */}
                  <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden bg-gradient-to-b from-sky-50 to-blue-100/60 p-2 shadow-inner border border-blue-100 transition-transform group-hover:scale-105 duration-300 flex items-center justify-center">
                    <img
                      src="/medibot.jpg"
                      alt="MediBot AI Assistant"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>

                  {/* Interactive Voice Badge on Robot */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-3 py-1 shadow-md border border-slate-200 flex items-center space-x-1.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Volume2 className="w-3.5 h-3.5 text-blue-600 group-hover:text-white" />
                    <span className="text-[11px] font-bold text-slate-700 group-hover:text-white">
                      {lang === 'hi' ? 'नमस्ते कहें' : 'Say Hi!'}
                    </span>
                  </div>
                </div>

                {/* Subtitle Badge below robot */}
                <p className="mt-3.5 text-xs font-bold text-slate-700 tracking-wide text-center uppercase tracking-wider">
                  {lang === 'hi'
                    ? 'स्वस्थ भारत के लिए सुलभ स्वास्थ्य सेवा'
                    : 'Accessible Healthcare for a Healthier India'}
                </p>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* BOTTOM 4 QUICK-LAUNCHER ACTION CARDS                      */}
          {/* ========================================================= */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Quick Assessment */}
            <div
              onClick={handleQuickAssessment}
              className="bg-white hover:bg-slate-50/90 rounded-2xl p-6 border border-slate-200/70 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col items-center text-center group active:scale-98"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-1">
                {lang === 'hi' ? 'त्वरित मूल्यांकन' : 'Quick Assessment'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'hi' ? '15 बीमारियों की AI ट्राइएज' : '15-Disease Clinical AI Triage'}
              </p>
            </div>

            {/* 2. Upload Reports */}
            <div
              onClick={handleUploadReports}
              className="bg-white hover:bg-slate-50/90 rounded-2xl p-6 border border-slate-200/70 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col items-center text-center group active:scale-98"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <FileUp className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-1">
                {lang === 'hi' ? 'रिपोर्ट्स अपलोड करें' : 'Upload Reports'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'hi' ? 'पर्चा, ईसीजी व लैब टेस्ट OCR' : 'Scan Prescriptions & Lab OCR'}
              </p>
            </div>

            {/* 3. Find Nearby Hospitals */}
            <div
              onClick={handleFindHospitals}
              className="bg-white hover:bg-slate-50/90 rounded-2xl p-6 border border-slate-200/70 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex flex-col items-center text-center group active:scale-98"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-1">
                {lang === 'hi' ? 'नज़दीकी अस्पताल खोजें' : 'Find Nearby Hospitals'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'hi' ? 'जीपीएस आधारित दूरी व दिशा' : 'Real-time GPS Distance & Maps'}
              </p>
            </div>

            {/* 4. Book Appointment */}
            <div
              onClick={() => handleOpenBooking()}
              className="bg-white hover:bg-slate-50/90 rounded-2xl p-6 border border-slate-200/70 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col items-center text-center group active:scale-98"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <CalendarCheck className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-1">
                {lang === 'hi' ? 'अपॉइंटमेंट बुक करें' : 'Book Appointment'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'hi' ? 'तत्काल ओपीडी टोकन व स्लॉट' : 'Instant OPD Slip & Doctor Slots'}
              </p>
            </div>
          </section>
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL: LOCATION / NEARBY HOSPITALS                        */}
      {/* ========================================================= */}
      {showLocationModal && (
        <LocationPickerModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          currentLocation={state.patientLocation}
          onLocationSelect={handleLocationSelect}
          lang={lang}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: APPOINTMENT BOOKING                                */}
      {/* ========================================================= */}
      {showBookingModal && (
        <AppointmentBookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          hospital={selectedHospitalForBooking || HOSPITALS_DATABASE[0]}
          patientLocation={state.patientLocation}
          patientDetails={state.patientDetails}
          chiefComplaint={state.selectedCondition || 'General Consultation'}
          onBookingConfirmed={(bookingData) => {
            actions.setAppointment(bookingData)
            setShowBookingModal(false)
            setShowAppointmentsModal(true)
          }}
          lang={lang}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: MY APPOINTMENTS VIEW                               */}
      {/* ========================================================= */}
      {showAppointmentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {lang === 'hi' ? 'आपके सक्रिय अपॉइंटमेंट्स' : 'My Active Appointments'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'hi' ? 'ओपीडी टोकन एवं अस्पताल विवरण' : 'OPD Slips and Doctor Visits'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAppointmentsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5">
              {state.activeAppointment ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                      Confirmed • {state.activeAppointment.bookingId}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {state.activeAppointment.slot}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {state.activeAppointment.doctor}
                    </h4>
                    <p className="text-xs text-blue-600 font-semibold">
                      {state.activeAppointment.department} • OPD Room {state.activeAppointment.opdRoom}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {typeof state.activeAppointment.hospital?.name === 'object'
                        ? (state.activeAppointment.hospital.name[lang] || state.activeAppointment.hospital.name.en)
                        : state.activeAppointment.hospital?.name}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
                    <span className="text-slate-500">
                      ABHA ID: <strong className="text-slate-800">{state.activeAppointment.patientId}</strong>
                    </span>
                    {state.activeAppointment.directionsUrl && (
                      <a
                        href={state.activeAppointment.directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 font-bold hover:underline"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Maps</span>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">
                    {lang === 'hi' ? 'कोई सक्रिय अपॉइंटमेंट नहीं है' : 'No Active Appointments Found'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    {lang === 'hi' ? 'आप किसी भी समय नया स्लॉट बुक कर सकते हैं।' : 'You can book a new hospital visit anytime.'}
                  </p>
                  <button
                    onClick={() => {
                      setShowAppointmentsModal(false)
                      handleOpenBooking()
                    }}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm"
                  >
                    {lang === 'hi' ? 'नया अपॉइंटमेंट बुक करें' : 'Book New Appointment'}
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowAppointmentsModal(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
              >
                {lang === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MY HEALTH RECORD                                   */}
      {/* ========================================================= */}
      {showHealthRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {lang === 'hi' ? 'डिजिटल स्वास्थ्य रिकॉर्ड' : 'Digital Health Record (ABDM)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'hi' ? 'आयुष्मान भारत डिजिटल मिशन' : 'Ayushman Bharat Health Account'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHealthRecordModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              {/* Patient Card Preview */}
              <div className="bg-gradient-to-br from-[#1e3a8a] to-blue-800 text-white rounded-2xl p-5 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-xs font-black">
                      +
                    </div>
                    <span className="text-xs font-bold tracking-wider">ABHA CARD</span>
                  </div>
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-200 font-semibold px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
                <div className="text-lg font-extrabold tracking-wide mb-1">
                  {state.patientDetails.name || 'Aditya Sharma'}
                </div>
                <div className="font-mono text-xs text-blue-200 tracking-wider mb-3">
                  ABHA: {state.patientDetails.abhaId || '91-4589-2041-8930'}
                </div>
                <div className="flex items-center justify-between text-[11px] text-blue-200 border-t border-blue-700/50 pt-2">
                  <span>Phone: {state.patientDetails.phone || '+91 98765 43210'}</span>
                  <span>Consent: {state.patientDetails.consentGiven ? 'Granted' : 'Pending'}</span>
                </div>
              </div>

              {/* Scanned Docs Count */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Digitized Prescriptions & Reports</div>
                  <div className="text-xs text-slate-500">
                    {state.scannedDocs.length} document(s) uploaded
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowHealthRecordModal(false)
                    handleUploadReports()
                  }}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                >
                  View / Add
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowHealthRecordModal(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
              >
                {lang === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import {
  Home, ShieldCheck, FileUp, MapPin, CalendarCheck, HeartPulse,
  Search, Mic, Hand, FileText, Upload, Navigation, CalendarPlus,
  Volume2, VolumeX, Clock,
} from 'lucide-react'
import { useKiosk } from '../../context/KioskContext'
import { useSpeechSynthesis, useSpeechRecognition } from '../../hooks/useSpeechInteraction'
import { CONDITIONS } from '../../data/diseaseFlows'
import { MediBotAvatar } from './MediBotAvatar'

const STR = {
  en: {
    tagline: 'Your Health\nOur Support',
    welcome: 'Welcome to MediKiosk',
    subtitle: 'AI-Powered Healthcare Kiosk',
    searchPh: 'How can we help you today?',
    searchHint: 'Try: fever, chest pain, cough…',
    speak: 'Speak Now',
    speakSub: '(English / हिंदी)',
    touch: 'Touch\nto Start',
    caption: 'Accessible Healthcare\nfor a Healthier India',
    tiles: ['Quick Assessment', 'Upload Reports', 'Find Nearby Hospitals', 'Book Appointment'],
    nav: ['Home', 'Health Assessment', 'Upload Documents', 'Find Doctor', 'My Appointments', 'My Health Record'],
    greeting: 'Welcome to MediKiosk. Tap Touch to Start, or press Speak Now and tell me your symptoms.',
    listening: 'Listening... please speak your symptoms',
    heard: 'I heard you say',
    tapTile: 'Tap a service below to begin',
  },
  hi: {
    tagline: 'आपका स्वास्थ्य\nहमारा सहयोग',
    welcome: 'मेडीकियोस्क में स्वागत है',
    subtitle: 'AI-संचालित हेल्थकेयर कियोस्क',
    searchPh: 'आज हम आपकी कैसे मदद करें?',
    searchHint: 'लिखें: बुखार, सीने में दर्द, खांसी…',
    speak: 'अभी बोलें',
    speakSub: '(English / हिंदी)',
    touch: 'स्पर्श\nकरके शुरू करें',
    caption: 'स्वस्थ भारत के लिए\nसुलभ स्वास्थ्य सेवा',
    tiles: ['त्वरित आकलन', 'रिपोर्ट अपलोड', 'नजदीकी अस्पताल', 'अपॉइंटमेंट बुक करें'],
    nav: ['होम', 'स्वास्थ्य आकलन', 'दस्तावेज़ अपलोड', 'डॉक्टर खोजें', 'मेरी अपॉइंटमेंट', 'मेरा हेल्थ रिकॉर्ड'],
    greeting: 'मेडीकियोस्क में आपका स्वागत है। शुरू करने के लिए स्पर्श करें, या अभी बोलें दबाकर अपने लक्षण बताएं।',
    listening: 'सुन रहा हूं... कृपया अपने लक्षण बताएं',
    heard: 'मैंने सुना',
    tapTile: 'शुरू करने के लिए नीचे कोई सेवा चुनें',
  },
}

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

export function PatientDashboard() {
  const { state, actions } = useKiosk()
  const lang = state.language === 'hi' ? 'hi' : 'en'
  const s = STR[lang]
  const now = useClock()

  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [voiceMsg, setVoiceMsg] = useState('')

  const { speak, cancel, isSpeaking } = useSpeechSynthesis()
  const { startListening, stopListening, isListening, transcript, isSupported: sttSupported } = useSpeechRecognition()

  const dateStr = now.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
  const timeStr = now.toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    hour: 'numeric', minute: '2-digit',
  })

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return CONDITIONS.filter(
      (c) => c.en.toLowerCase().includes(q) || c.hi.includes(query.trim()) || c.id.includes(q.replace(/\s+/g, '_'))
    ).slice(0, 6)
  }, [query])

  const quickPicks = useMemo(() => CONDITIONS.slice(0, 6), [])

  useEffect(() => () => cancel(), [cancel])

  const greet = async () => {
    if (isSpeaking) { cancel(); return }
    await speak(s.greeting, { lang: lang === 'hi' ? 'hi-IN' : 'en-IN', rate: 0.9 })
  }

  const handleSpeak = () => {
    if (isListening) { stopListening(); return }
    setVoiceMsg(s.listening)
    cancel()
    speak(s.listening, { lang: lang === 'hi' ? 'hi-IN' : 'en-IN', rate: 0.9 }).catch(() => {})
    startListening(lang === 'hi' ? 'hi-IN' : 'en-IN')
  }

  // When transcript arrives and listening stops, show it + jump to assessment
  useEffect(() => {
    if (!isListening && transcript) {
      setVoiceMsg(`${s.heard}: “${transcript}”`)
      setQuery(transcript)
    }
  }, [isListening, transcript]) // eslint-disable-line react-hooks/exhaustive-deps

  const goStep = (step, entry = null) => {
    if (entry) actions.setConsultEntry(entry)
    else if (step !== 5) actions.setConsultEntry('full')
    // step 5 without explicit entry keeps current entry (hospital-only stays hospital-only)
    actions.setStep(step)
  }

  const pickCondition = (id) => {
    actions.setCondition(id)
    setQuery('')
    setFocused(false)
    actions.setConsultEntry('full')
    actions.setStep(3) // jump straight to SOCRATES interview
  }

  const navItems = [
    { icon: Home, step: 0, entry: null },
    { icon: ShieldCheck, step: 2, entry: 'full' },
    { icon: FileUp, step: 4, entry: 'full' },
    { icon: MapPin, step: 5, entry: 'hospitals' },
    { icon: CalendarCheck, step: 5, entry: 'appointment' },
    { icon: HeartPulse, step: 4, entry: 'full' },
  ]

  const tiles = [
    { icon: FileText, color: 'text-sky-600 bg-sky-50', step: 2, entry: 'full' },
    { icon: Upload, color: 'text-emerald-600 bg-emerald-50', step: 4, entry: 'full' },
    { icon: Navigation, color: 'text-orange-500 bg-orange-50', step: 5, entry: 'hospitals' },
    { icon: CalendarPlus, color: 'text-blue-700 bg-blue-50', step: 5, entry: 'appointment' },
  ]

  return (
    <div className="min-h-screen bg-[#eef3f8] flex text-slate-800">
      {/* ── Left Sidebar ─────────────────────────────── */}
      <aside className="w-[228px] shrink-0 bg-white/80 backdrop-blur border-r border-slate-200 flex flex-col py-5 px-4 gap-1">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center shadow-md">
            <span className="text-white text-3xl font-black leading-none">+</span>
          </div>
          <h1 className="mt-2 text-[26px] font-extrabold tracking-tight text-slate-900">MediKiosk</h1>
          <p className="text-[13px] leading-tight text-slate-500 whitespace-pre-line">{s.tagline}</p>
        </div>

        <nav className="flex flex-col gap-1.5" aria-label="Primary">
          {navItems.map((n, i) => {
            const Icon = n.icon
            const active = i === 0
            return (
              <button
                key={i}
                onClick={() => goStep(n.step, n.entry)}
                className={`min-h-[56px] flex items-center gap-3 px-4 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${
                  active
                    ? 'bg-[#1e3a5f] text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={22} strokeWidth={2.2} />
                <span className="text-left leading-tight">{s.nav[i]}</span>
              </button>
            )
          })}
        </nav>

        {/* appointment mini-status */}
        <div className="mt-auto rounded-2xl bg-slate-50 border border-slate-200 p-3">
          <div className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
            <Clock size={15} /> {state.activeAppointment ? (lang === 'hi' ? 'अपॉइंटमेंट पक्का' : 'Appointment confirmed') : (lang === 'hi' ? 'कोई अपॉइंटमेंट नहीं' : 'No appointment yet')}
          </div>
          <p className="mt-1 text-[12px] text-slate-500 leading-snug">
            {state.activeAppointment
              ? `${state.activeAppointment.tokenId || 'OPD-PASS'} • ${state.activeAppointment.doctorName || ''}`
              : (lang === 'hi' ? 'नीचे से बुक करें — टोकन तुरंत मिलेगा' : 'Book below — get instant OPD token')}
          </p>
        </div>
      </aside>

      {/* ── Main column ──────────────────────────────── */}
      <main className="flex-1 flex flex-col px-6 py-4 gap-4 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-end gap-4">
          <div className="flex bg-white rounded-full p-1 shadow-sm border border-slate-200" role="group" aria-label="Language">
            {['en', 'hi'].map((l) => (
              <button
                key={l}
                onClick={() => {
                  actions.setLanguage(l)
                  cancel()
                  speak(l === 'hi' ? 'भाषा हिंदी चुनी गई' : 'Language set to English', {
                    lang: l === 'hi' ? 'hi-IN' : 'en-IN', rate: 0.95,
                  }).catch(() => {})
                }}
                className={`min-h-[40px] px-5 rounded-full text-[15px] font-bold transition-all ${
                  (lang === l) ? 'bg-[#1e3a5f] text-white shadow' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {l === 'en' ? 'EN' : 'हिंदी'}
              </button>
            ))}
          </div>
          <div className="text-right leading-tight">
            <div className="text-[14px] font-semibold text-slate-700">{dateStr}</div>
            <div className="text-[15px] font-bold text-slate-900 tabular-nums">{timeStr}</div>
          </div>
        </div>

        {/* Hero row */}
        <div className="grid grid-cols-[1fr_210px] gap-4 items-stretch">
          {/* Hero card */}
          <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-7 relative overflow-hidden">
            <h2 className="text-[32px] font-extrabold text-[#16283f] tracking-tight">{s.welcome}</h2>
            <p className="text-[18px] text-slate-500 -mt-1">{s.subtitle}</p>

            {/* Search */}
            <div className="relative mt-5">
              <div className="flex items-center gap-3 bg-white border-2 border-slate-100 shadow-[0_8px_24px_rgba(30,58,95,0.08)] rounded-2xl px-5 min-h-[64px] focus-within:border-sky-400 transition-colors">
                <Search className="text-sky-500 shrink-0" size={24} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 150)}
                  placeholder={s.searchPh}
                  aria-label="Search symptoms"
                  className="w-full bg-transparent outline-none text-[18px] placeholder:text-slate-400"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-700 text-xl px-2" aria-label="Clear">×</button>
                )}
              </div>

              {/* dropdown results */}
              {(focused || query) && (
                <div className="absolute z-20 left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  {results.length > 0 ? (
                    results.map((c) => (
                      <button
                        key={c.id}
                        onMouseDown={() => pickCondition(c.id)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 min-h-[60px] hover:bg-sky-50 text-left transition-colors"
                      >
                        <span className="text-2xl">{c.emoji}</span>
                        <span className="font-bold text-[16px]">{lang === 'hi' ? c.hi : c.en}</span>
                        <span className="ml-auto text-sky-600 text-sm font-bold">Start →</span>
                      </button>
                    ))
                  ) : query ? (
                    <div className="px-5 py-4 text-slate-500 text-[15px]">
                      {s.searchHint}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {quickPicks.map((c) => (
                          <button
                            key={c.id}
                            onMouseDown={() => pickCondition(c.id)}
                            className="px-3 py-2 rounded-full bg-slate-100 hover:bg-sky-100 text-[14px] font-semibold transition-colors"
                          >
                            {c.emoji} {lang === 'hi' ? c.hi : c.en}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 py-3 flex flex-wrap gap-2">
                      {quickPicks.map((c) => (
                        <button
                          key={c.id}
                          onMouseDown={() => pickCondition(c.id)}
                          className="px-3 py-2 rounded-full bg-slate-100 hover:bg-sky-100 text-[14px] font-semibold transition-colors"
                        >
                          {c.emoji} {lang === 'hi' ? c.hi : c.en}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CTA buttons */}
            <div className="mt-5 flex gap-4">
              <button
                onClick={handleSpeak}
                className={`flex-1 min-h-[84px] rounded-2xl font-extrabold text-white text-[20px] flex items-center justify-center gap-3 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${
                  isListening ? 'bg-red-500 animate-pulse' : 'bg-[#2f8ff0] hover:bg-[#237fe0]'
                }`}
              >
                <Mic size={34} className={isListening ? 'animate-bounce' : ''} />
                <span className="leading-tight text-left">
                  {isListening ? (lang === 'hi' ? 'सुन रहा हूं…' : 'Listening…') : s.speak}
                  <span className="block text-[14px] font-semibold opacity-90">{s.speakSub}</span>
                </span>
              </button>
              <button
                onClick={() => goStep(2, 'full')}
                className="flex-1 min-h-[84px] rounded-2xl font-extrabold text-white text-[20px] bg-[#34a853] hover:bg-[#2d9448] shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
              >
                <Hand size={32} />
                <span className="leading-tight whitespace-pre-line text-left">{s.touch}</span>
              </button>
            </div>

            {(voiceMsg || isSpeaking) && (
              <p className="mt-3 text-[14px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 rounded-xl px-4 py-2" role="status">
                {voiceMsg || (lang === 'hi' ? 'बोल रहा है…' : 'Speaking…')}
              </p>
            )}
          </section>

          {/* MediBot card */}
          <section className="bg-gradient-to-b from-white to-sky-50/60 rounded-3xl shadow-sm border border-slate-100 p-4 flex flex-col items-center justify-center gap-2 text-center">
            <button onClick={greet} className="transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 rounded-3xl" aria-label="Ask MediBot to greet">
              <MediBotAvatar speaking={isSpeaking} listening={isListening} />
            </button>
            <p className="text-[14px] font-bold text-slate-600 leading-snug whitespace-pre-line">{s.caption}</p>
            <button
              onClick={greet}
              className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-sky-600 hover:text-sky-800 min-h-[36px] px-3 rounded-full hover:bg-sky-100 transition-colors"
            >
              {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              {lang === 'hi' ? 'नमस्ते सुनें' : 'Hear greeting'}
            </button>
          </section>
        </div>

        {/* Bottom launcher tiles */}
        <p className="text-[14px] font-semibold text-slate-400 -mb-1">{s.tapTile}</p>
        <section className="grid grid-cols-4 gap-4">
          {tiles.map((t, i) => {
            const Icon = t.icon
            return (
              <button
                key={i}
                onClick={() => goStep(t.step, t.entry)}
                className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[132px] flex flex-col items-center justify-center gap-2 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-sky-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 group"
              >
                <span className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${t.color}`}>
                  <Icon size={26} strokeWidth={2.2} />
                </span>
                <span className="text-[15px] font-bold text-slate-700 leading-tight text-center px-2">{s.tiles[i]}</span>
              </button>
            )
          })}
        </section>
      </main>
    </div>
  )
}

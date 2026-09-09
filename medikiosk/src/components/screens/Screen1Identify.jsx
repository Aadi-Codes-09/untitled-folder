import { useState, useEffect } from 'react'
import {
  Mic, ArrowRight, ChevronRight, ShieldCheck, Globe,
  FileCheck2, Users, Info, Zap, User,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { useKiosk } from '../../context/KioskContext'
import { useSpeechInteraction } from '../../hooks/useSpeechInteraction'
import { t } from '../../data/mockData'

const STEPS = [
  { en: 'Identify', hi: 'पहचान' },
  { en: 'Symptoms', hi: 'लक्षण' },
  { en: 'Questions', hi: 'प्रश्न' },
  { en: 'Documents', hi: 'दस्तावेज़' },
  { en: 'Consultation', hi: 'परामर्श' },
]

const STR = {
  en: {
    subtitle: 'AI-Powered Clinical History Kiosk',
    leftLines: ['Accessible', 'Affordable', 'Smarter Healthcare', 'for Every Indian'],
    betterCare: ['Better', 'Care', 'Brighter', 'Lives'],
    peopleFirst: ['People First', 'Technology for Impact'],
    welcome: 'Welcome to',
    assistant: ['Your AI-powered', 'health assistant'],
    speakOrTouch: ['You can speak', 'or touch'],
    speakDesc: ['Tell us what you\u2019re feeling', 'in your own words.'],
    speakBegin: 'Speak to begin',
    speaking: 'Speaking…',
    speakHint: 'You can speak in Hindi or English',
    formTitle: 'Let\u2019s get you started',
    formSub: ['Enter your ABHA ID or mobile number', 'to continue.'],
    idLabel: 'ABHA ID / Mobile Number',
    idPh: 'e.g., 12-3456-7890-1234 or 9876543210',
    consent: 'I consent to share my health information under ABDM guidelines for this consultation.',
    learnMore: 'ⓘ Learn more',
    continue: 'Continue',
    demo: 'Try Demo Mode',
    demoSub: 'Explore the full application without real data',
    trust: [
      { title: 'Secure & Private', sub: 'Your data, your consent' },
      { title: 'Bilingual Support', sub: 'English & हिन्दी' },
      { title: 'ABDM Compliant', sub: 'Standards-based' },
      { title: 'For Every Indian', sub: 'Accessible & Inclusive' },
    ],
    quote: ['❝ Technology', 'that listens, cares', 'and connects..”'],
    footerMid: 'AI for Accessible Healthcare',
    footerRight: '🇮🇳 Viksit Bharat through Digital Health',
    instructions: 'Instructions',
    listen: 'Listen',
    stop: 'Stop',
  },
  hi: {
    subtitle: 'AI-संचालित क्लिनिकल हिस्ट्री कियोस्क',
    leftLines: ['सुलभ', 'किफायती', 'स्मार्ट स्वास्थ्य सेवा', 'हर भारतीय के लिए'],
    betterCare: ['बेहतर', 'देखभाल', 'उज्ज्वल', 'जीवन'],
    peopleFirst: ['लोग पहले', 'प्रभाव के लिए तकनीक'],
    welcome: 'स्वागत है',
    assistant: ['आपका AI-संचालित', 'स्वास्थ्य सहायक'],
    speakOrTouch: ['आप बोल सकते हैं', 'या स्पर्श करें'],
    speakDesc: ['बताएं आपको कैसा महसूस', 'हो रहा है, अपने शब्दों में।'],
    speakBegin: 'बोलना शुरू करें',
    speaking: 'बोल रहा है…',
    speakHint: 'आप हिंदी या अंग्रेजी में बोल सकते हैं',
    formTitle: 'आइए शुरू करते हैं',
    formSub: ['जारी रखने के लिए अपना', 'ABHA ID या मोबाइल नंबर दर्ज करें।'],
    idLabel: 'ABHA ID / मोबाइल नंबर',
    idPh: 'जैसे, 12-3456-7890-1234 या 9876543210',
    consent: 'मैं इस परामर्श के लिए ABDM दिशानिर्देशों के तहत अपनी स्वास्थ्य जानकारी साझा करने की सहमति देता/देती हूं।',
    learnMore: 'ⓘ और जानें',
    continue: 'आगे बढ़ें',
    demo: 'डेमो मोड आज़माएं',
    demoSub: 'बिना असली डेटा के पूरा ऐप देखें',
    trust: [
      { title: 'सुरक्षित व निजी', sub: 'आपका डेटा, आपकी सहमति' },
      { title: 'द्विभाषी सहायता', sub: 'English व हिन्दी' },
      { title: 'ABDM अनुपालन', sub: 'मानक-आधारित' },
      { title: 'हर भारतीय के लिए', sub: 'सुलभ व समावेशी' },
    ],
    quote: ['❝ तकनीक जो सुनती है,', 'परवाह करती है', 'और जोड़ती है..”'],
    footerMid: 'सुलभ स्वास्थ्य सेवा के लिए AI',
    footerRight: '🇮🇳 डिजिटल स्वास्थ्य से विकसित भारत',
    instructions: 'निर्देश',
    listen: 'सुनें',
    stop: 'रोकें',
  },
}

export function Screen1Identify() {
  const { state, actions } = useKiosk()
  const { speak, cancel, isSpeaking, isSupported: ttsSupported } = useSpeechInteraction()
  const [showInstructions, setShowInstructions] = useState(false)
  const [idError, setIdError] = useState('')

  const lang = state.language
  const s = STR[lang === 'hi' ? 'hi' : 'en']

  const instructionsText = lang === 'hi'
    ? 'मेडीकियोस्क में आपका स्वागत है। अपनी भाषा चुनें। फिर अपना ABHA ID, आधार या फोन नंबर दर्ज करें। सहमति चेकबॉक्स पर टिक करें। फिर "आकलन शुरू करें" दबाएं।'
    : 'Welcome to MediKiosk. Select your language. Then enter your ABHA ID, Aadhaar, or phone number. Check the consent box. Then press Start Assessment.'

  const readInstructions = async () => {
    if (isSpeaking) {
      cancel()
    } else {
      await speak(instructionsText, { lang: lang === 'hi' ? 'hi-IN' : 'en-IN', rate: 0.8 })
    }
  }

  useEffect(() => {
    return () => cancel()
  }, [cancel])

  const handleIdChange = (e) => {
    actions.setPatientId(e.target.value)
    setIdError('')
  }

  const handleDemoLogin = () => {
    actions.setPatientId('9876543210')
    actions.setConsent(true)
    setIdError('')
    actions.setStep(0)
  }

  const handleConsentChange = (e) => {
    actions.setConsent(e.target.checked)
  }

  const handleStart = () => {
    if (!state.patientDetails.abhaId.trim()) {
      setIdError(t('idRequired', lang))
      return
    }
    if (!state.patientDetails.consentGiven) {
      setIdError(t('consentRequired', lang))
      return
    }
    actions.setStep(0)
  }

  const handleLanguageChange = (newLang) => {
    actions.setLanguage(newLang)
    cancel()
    if (newLang === 'hi') {
      speak('नमस्ते, भाषा हिंदी चुनी गई है। कृपया अपना विवरण दर्ज करें।', { lang: 'hi-IN', rate: 0.85 }).catch(() => {})
    } else {
      speak('Language set to English. Please enter your details.', { lang: 'en-IN', rate: 0.85 }).catch(() => {})
    }
  }

  const canContinue = state.patientDetails.consentGiven && state.patientDetails.abhaId.trim()

  return (
    <div className="min-h-screen bg-[#f2f6fb] flex flex-col text-slate-800">
      {/* ── Header: logo + stepper ── */}
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-600 to-emerald-500 shadow">
            <span className="text-white text-2xl font-black">+</span>
          </div>
          <div>
            <p className="text-[22px] font-extrabold leading-none tracking-tight">
              <span className="text-[#1e3a8a]">Medi</span><span className="text-[#34a853]">Kiosk</span>
            </p>
            <p className="text-[12px] text-slate-500 font-medium">{s.subtitle}</p>
          </div>
        </div>

        {/* Stepper */}
        <ol className="hidden md:flex items-center gap-0 flex-1 justify-center max-w-2xl" aria-label="Progress">
          {STEPS.map((s, i) => {
            const n = i + 1
            const active = n === 1
            const label = lang === 'hi' ? s.hi : s.en
            return (
              <li key={n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1 min-w-[76px]">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[15px] font-bold transition-all ${
                    active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}>
                    {n}
                  </span>
                  <span className={`text-[12px] font-semibold ${active ? 'text-blue-700' : 'text-slate-400'}`}>{label}</span>
                </div>
                {n < 5 && <div className={`h-[2px] flex-1 mx-1 -mt-5 rounded ${n < 1 ? 'bg-blue-500' : 'bg-slate-200'}`} />}
              </li>
            )
          })}
        </ol>
        <div className="w-[120px] hidden lg:block" />
      </header>

      {/* ── Main 3-column ── */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-4 grid grid-cols-1 xl:grid-cols-[300px_1fr_1fr] gap-4 items-stretch">

        {/* Left: brand panel */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 via-white to-blue-200 border border-white shadow-sm hidden xl:flex flex-col">
          <div className="p-5 pt-6">
            <p className="text-[17px] leading-snug font-medium text-slate-500">
              {s.leftLines.map((l, i) => (<span key={i}>{l}<br /></span>))}
            </p>
            <div className="w-8 h-[3px] bg-blue-800 rounded mt-3" />
          </div>
          {/* Kiosk illustration (CSS) */}
          <div className="flex-1 flex items-center justify-center px-6 relative">
            <div className="absolute right-4 top-0 bottom-0 w-24 bg-gradient-to-b from-sky-200/70 to-blue-300/50 rounded-l-[2rem] flex flex-col items-center justify-center gap-2 p-2 text-center">
              <p className="text-white font-bold text-[15px] leading-tight drop-shadow">{s.betterCare.map((l, i) => (<span key={i}>{l}<br /></span>))}</p>
              <span className="text-white/90 text-xl">♡</span>
            </div>
            <div className="relative bg-white rounded-2xl border-[6px] border-slate-800 w-40 shadow-2xl overflow-hidden mr-16">
              <div className="bg-gradient-to-b from-sky-200 to-sky-50 p-3 flex flex-col items-center gap-1.5 min-h-[190px]">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
                  <span className="text-white font-black">+</span>
                </div>
                <p className="text-[13px] font-extrabold text-blue-900">MediKiosk</p>
                <p className="text-[9px] text-slate-500 text-center leading-tight">Your Health<br />Our Support</p>
                <div className="mt-1 w-full h-10 rounded-lg bg-white/80 border border-sky-200" />
                <div className="w-16 h-5 rounded-full bg-blue-600/90" />
              </div>
              <div className="bg-slate-100 h-8 flex items-center justify-center">
                <div className="w-10 h-1.5 bg-slate-800 rounded" />
              </div>
            </div>
          </div>
          {/* bottom wave */}
          <div className="relative mt-2 bg-gradient-to-r from-emerald-500 to-blue-700 text-white px-5 py-4 rounded-t-[2rem]">
            <p className="italic font-medium text-[15px] leading-snug">{s.peopleFirst.map((l, i) => (<span key={i}>{l}<br /></span>))}</p>
          </div>
        </section>

        {/* Center: welcome + language + voice */}
        <section className="bg-[#eaf3fe] rounded-3xl border border-white shadow-sm p-6 sm:p-8 flex flex-col">
          <h1 className="text-[30px] leading-tight font-extrabold text-slate-900">
            {s.welcome}<br />
            <span className="text-[#1e3a8a]">Medi</span><span className="text-[#34a853]">Kiosk</span>
          </h1>
          <p className="mt-1 text-[19px] text-slate-700 font-medium leading-snug">{s.assistant.map((l, i) => (<span key={i}>{l}<br /></span>))}</p>

          {/* Language */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`min-h-[60px] rounded-2xl font-bold text-[17px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
                lang === 'en' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-300'
              }`}
            >
              <span className="text-xl">🇬🇧</span> English
            </button>
            <button
              onClick={() => handleLanguageChange('hi')}
              className={`min-h-[60px] rounded-2xl font-bold text-[17px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 ${
                lang === 'hi' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-700 border border-slate-200 hover:border-orange-300'
              }`}
            >
              <span className="text-xl">🇮🇳</span> हिन्दी
            </button>
          </div>

          {/* Speak or touch */}
          <div className="mt-6 flex items-start gap-4">
            <div className="w-20 h-20 shrink-0 rounded-full bg-white border border-sky-100 shadow flex items-center justify-center text-5xl" aria-hidden="true">👨‍⚕️</div>
            <div>
              <p className="text-[19px] font-extrabold text-[#1e3a8a] leading-tight">{s.speakOrTouch.map((l, i) => (<span key={i}>{l}<br /></span>))}</p>
              <p className="text-[15px] text-slate-500 mt-1">{s.speakDesc.map((l, i) => (<span key={i}>{l}<br /></span>))}</p>
            </div>
          </div>

          {/* Mic */}
          <div className="mt-6 flex flex-col items-center">
            <button
              onClick={() => { setShowInstructions(true); readInstructions() }}
              aria-label="Speak to begin"
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
                isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Mic size={34} />
            </button>
            <p className="mt-3 font-extrabold text-[17px] text-slate-900">{isSpeaking ? s.speaking : s.speakBegin}</p>
            <p className="text-[13px] text-slate-500">{s.speakHint}</p>
          </div>
        </section>

        {/* Right: form card */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[26px] font-extrabold text-slate-900 leading-tight">{s.formTitle}</h2>
              <p className="text-[15px] text-slate-500 mt-1">{s.formSub.map((l, i) => (<span key={i}>{l}<br /></span>))}</p>
            </div>
            {/* ABHA badge */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-b from-orange-400 to-emerald-600 flex items-center justify-center text-white font-black" aria-hidden="true">♀</div>
              <div className="leading-none">
                <p className="font-extrabold text-[#1e3a8a] text-[18px]">ABHA</p>
                <p className="text-[10px] text-slate-500 font-semibold">Ayushman Bharat<br />Health Account</p>
              </div>
            </div>
          </div>

          <label htmlFor="patient-id" className="mt-6 flex items-center gap-2 text-[15px] font-bold text-slate-800">
            <User size={18} className="text-blue-600" /> {s.idLabel}
          </label>
          <input
            id="patient-id"
            type="text"
            value={state.patientDetails.abhaId}
            onChange={handleIdChange}
            placeholder={s.idPh}
            autoComplete="off"
            maxLength={30}
            autoFocus
            className={`mt-2 w-full min-h-[60px] px-5 rounded-2xl border-2 text-[16px] outline-none transition-colors bg-white placeholder:text-slate-400 ${
              idError ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
            }`}
          />

          {/* Consent */}
          <label htmlFor="consent-checkbox" className="mt-4 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="consent-checkbox"
              checked={state.patientDetails.consentGiven}
              onChange={handleConsentChange}
              className="w-6 h-6 mt-0.5 rounded-md border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0"
            />
            <span className="text-[14px] leading-snug text-slate-600">
              {s.consent}
              <span className="block mt-1 text-blue-600 font-semibold text-[13px]">{s.learnMore}</span>
            </span>
          </label>

          {idError && (
            <p className="mt-3 text-[14px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2" role="alert">{idError}</p>
          )}

          <button
            onClick={handleStart}
            disabled={!canContinue}
            className={`mt-5 w-full min-h-[60px] rounded-2xl font-bold text-[19px] flex items-center justify-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
              canContinue ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 active:scale-[0.99]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {s.continue} <ArrowRight size={22} />
          </button>

          {/* OR divider */}
          <div className="my-4 flex items-center gap-3 text-slate-400 text-[13px] font-semibold">
            <div className="h-px flex-1 bg-slate-200" /> OR <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            onClick={handleDemoLogin}
            className="w-full min-h-[68px] rounded-2xl bg-blue-50/70 hover:bg-blue-50 border border-blue-100 flex items-center gap-3 px-5 text-left transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          >
            <Zap size={22} className="text-blue-600 shrink-0" />
            <span className="flex-1">
              <span className="block font-bold text-blue-700 text-[16px]">{s.demo}</span>
              <span className="block text-[13px] text-slate-500">{s.demoSub}</span>
            </span>
            <ChevronRight size={22} className="text-blue-600" />
          </button>
        </section>
      </main>

      {/* ── Trust bar ── */}
      <section className="w-full max-w-[1400px] mx-auto px-4 pb-2">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-3 flex flex-wrap items-center gap-x-8 gap-y-2">
          {s.trust.map((b, i) => {
            const icons = [ShieldCheck, Globe, FileCheck2, Users]
            const bgs = ['bg-emerald-500', 'bg-blue-600', 'bg-emerald-600', 'bg-blue-500']
            const Icon = icons[i % icons.length]
            return (
              <div key={i} className="flex items-center gap-2.5">
                <span className={`w-9 h-9 rounded-full ${bgs[i % bgs.length]} text-white flex items-center justify-center shrink-0`}>
                  <Icon size={18} />
                </span>
                <span>
                  <span className="block text-[14px] font-bold text-slate-800 leading-none">{b.title}</span>
                  <span className="block text-[12px] text-slate-500 mt-0.5">{b.sub}</span>
                </span>
              </div>
            )
          })}
          <p className="ml-auto hidden lg:block text-right italic text-[14px] text-slate-500 leading-snug">
            {s.quote.map((l, i) => (<span key={i}>{l}<br /></span>))}
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-2 bg-[#1e3a8a] text-white/90 text-[12px] font-medium px-6 py-2 flex items-center justify-center gap-3 flex-wrap">
        <span>MediKiosk</span><span className="opacity-50">|</span>
        <span>{s.footerMid}</span><span className="opacity-50">|</span>
        <span>SIH 2026</span>
        <span className="sm:ml-auto flex items-center gap-1.5">{s.footerRight}</span>
      </footer>

      <ModalInstructions
        isOpen={showInstructions}
        onClose={() => {
          cancel()
          setShowInstructions(false)
        }}
        lang={lang}
        text={instructionsText}
        onSpeak={readInstructions}
        isSpeaking={isSpeaking}
        ttsSupported={ttsSupported}
      />
    </div>
  )
}

function ModalInstructions({ isOpen, onClose, lang, text, onSpeak, isSpeaking, ttsSupported }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructions-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 id="instructions-title" className="text-xl font-bold text-slate-900">
            {STR[lang === 'hi' ? 'hi' : 'en'].instructions}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-6">
          <p className="text-lg text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap flex gap-2">
            <Info size={20} className="shrink-0 mt-1 text-blue-600" />{text}
          </p>
          <div className="flex justify-center">
            <Button
              variant={isSpeaking ? 'danger' : 'primary'}
              size="lg"
              onClick={onSpeak}
              disabled={!ttsSupported}
            >
              {isSpeaking ? STR[lang === 'hi' ? 'hi' : 'en'].stop : STR[lang === 'hi' ? 'hi' : 'en'].listen}
            </Button>
          </div>
          {!ttsSupported && (
            <p className="text-center text-sm text-amber-700 mt-4 bg-amber-50 px-4 py-2 rounded-lg">
              Text-to-speech not supported in this browser.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

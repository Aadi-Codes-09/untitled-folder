import { useState, useEffect } from 'react'
import { Globe, Shield, Volume2, HelpCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { ProgressBar } from '../ui/ProgressBar'
import { useKiosk } from '../../context/KioskContext'
import { useSpeechInteraction } from '../../hooks/useSpeechInteraction'
import { t } from '../../data/mockData'

export function Screen1Identify() {
  const { state, actions } = useKiosk()
  const { speak, cancel, isSpeaking, isSupported: ttsSupported } = useSpeechInteraction()
  const [showInstructions, setShowInstructions] = useState(false)
  const [idError, setIdError] = useState('')

  const lang = state.language

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
    actions.setStep(2)
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
    actions.setStep(2)
  }

  const handleLanguageChange = (newLang) => {
    actions.setLanguage(newLang)
    cancel()
    if (newLang === 'hi') {
      speak('नमस्ते, भाषा हिंदी चुनी गई है। कृपया अपना विवरण दर्ज करें।', { lang: 'hi-IN', rate: 0.85 })
    } else {
      speak('Language set to English. Please enter your details.', { lang: 'en-IN', rate: 0.85 })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ProgressBar 
        currentStep={1} 
        totalSteps={5} 
        stepLabels={lang === 'hi' ? ['पहचान', 'लक्षण', 'प्रश्न', 'दस्तावेज़', 'दवाई व सलाह'] : ['Identify', 'Symptom', 'Questions', 'Documents', 'Prescription']}
        hideOnStep={5} 
      />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-600 mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-kiosk-3xl font-bold text-slate-900 mb-2">{t('appName', lang)}</h1>
            <p className="text-kiosk-xl text-slate-600">{t('tagline', lang)}</p>
          </div>

          <Card className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={lang === 'en' ? 'primary' : 'secondary'}
                size="xl"
                fullWidth
                onClick={() => handleLanguageChange('en')}
                className="min-h-[80px] text-kiosk-lg"
              >
                <Globe className="w-6 h-6" aria-hidden="true" />
                English
              </Button>
              <Button
                variant={lang === 'hi' ? 'primary' : 'secondary'}
                size="xl"
                fullWidth
                onClick={() => handleLanguageChange('hi')}
                className="min-h-[80px] text-kiosk-lg"
              >
                <Globe className="w-6 h-6" aria-hidden="true" />
                हिंदी
              </Button>
            </div>
          </Card>

          <Card className="mb-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="patient-id" className="block text-kiosk-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t('enterId', lang)}
                </label>
                <Input
                  id="patient-id"
                  type="text"
                  placeholder={t('idPlaceholder', lang)}
                  value={state.patientDetails.abhaId}
                  onChange={handleIdChange}
                  error={idError}
                  autoComplete="off"
                  maxLength={30}
                  autoFocus
                />
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="consent-checkbox"
                  checked={state.patientDetails.consentGiven}
                  onChange={handleConsentChange}
                  className="w-6 h-6 mt-1 text-primary-600 border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer"
                  aria-describedby="consent-text"
                />
                <label htmlFor="consent-checkbox" id="consent-text" className="text-kiosk-base text-slate-700 leading-relaxed cursor-pointer">
                  {t('consentText', lang)}
                </label>
              </div>

              {idError && (
                <div className="flex items-center gap-2 text-medical-red text-kiosk-sm" role="alert">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {idError}
                </div>
              )}
            </div>
          </Card>

          {/* Demo Login Banner */}
          <div className="mb-4 p-4 rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-100 text-primary-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              <div>
                <p className="font-semibold text-primary-900 text-sm">{lang === 'hi' ? 'डेमो मोड' : 'Demo Mode'}</p>
                <p className="text-primary-700 text-xs">{lang === 'hi' ? 'एक क्लिक में पूरा ऐप आज़माएं' : 'Try the full app in one click — no typing needed'}</p>
              </div>
            </div>
            <button
              type="button"
              id="demo-login-btn"
              onClick={handleDemoLogin}
              className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-sm shadow-md transition-all duration-150 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
              </svg>
              {lang === 'hi' ? 'डेमो लॉगिन' : 'Demo Login'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="secondary"
              size="xl"
              fullWidth={false}
              onClick={() => {
                setShowInstructions(true)
                readInstructions()
              }}
              className="min-h-[72px]"
              leftIcon={<Volume2 className={`w-7 h-7 ${isSpeaking ? 'text-primary-600 animate-pulse' : ''}`} aria-hidden="true" />}
            >
              {isSpeaking ? (lang === 'hi' ? 'बोल रहा है...' : 'Speaking...') : t('listenInstructions', lang)}
            </Button>
            <Button
              variant="primary"
              size="xxl"
              fullWidth={false}
              onClick={handleStart}
              disabled={!state.patientDetails.consentGiven || !state.patientDetails.abhaId.trim()}
              className="min-h-[88px] animate-bounce-subtle flex-1"
              leftIcon={<Shield className="w-8 h-8" aria-hidden="true" />}
            >
              {t('startBtn', lang)}
            </Button>
          </div>

          <p className="text-center text-kiosk-sm text-slate-500 mt-8 max-w-2xl mx-auto">
            <HelpCircle className="w-5 h-5 inline-block align-middle mr-1" aria-hidden="true" />
            This is a demo prototype. No real data is stored.
          </p>
        </div>
      </main>

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructions-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 id="instructions-title" className="text-kiosk-xl font-bold text-slate-900">
            {lang === 'hi' ? 'निर्देश' : 'Instructions'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <p className="text-kiosk-lg text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap">{text}</p>
          <div className="flex justify-center">
            <Button
              variant={isSpeaking ? 'danger' : 'primary'}
              size="lg"
              onClick={onSpeak}
              disabled={!ttsSupported}
              leftIcon={isSpeaking ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1zm30 5h-3.414a1 1 0 01-.707-.293l-5.414-5.414a1 1 0 00-.707-.293H6a1 1 0 01-1-1v-4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1z"/></svg>}
            >
              {isSpeaking ? (lang === 'hi' ? 'रोकें' : 'Stop') : (lang === 'hi' ? 'सुनें' : 'Listen')}
            </Button>
          </div>
          {!ttsSupported && (
            <p className="text-center text-kiosk-sm text-amber-700 mt-4 bg-amber-50 px-4 py-2 rounded-lg">
              Text-to-speech not supported in this browser.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
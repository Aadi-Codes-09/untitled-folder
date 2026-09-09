import { useState, useMemo, useEffect } from 'react'
import { Search, ArrowLeft, Activity, Volume2 } from 'lucide-react'
import { useKiosk } from '../../context/KioskContext'
import { CONDITIONS } from '../../data/diseaseFlows'
import { ProgressBar } from '../ui/ProgressBar'
import { useSpeechInteraction } from '../../hooks/useSpeechInteraction'

const COLOR_MAP = {
  red:    'bg-red-50    border-red-200    text-red-700    hover:bg-red-100    hover:border-red-400    shadow-red-100',
  orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-400 shadow-orange-100',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-400 shadow-yellow-100',
  green:  'bg-green-50  border-green-200  text-green-700  hover:bg-green-100  hover:border-green-400  shadow-green-100',
  blue:   'bg-blue-50   border-blue-200   text-blue-700   hover:bg-blue-100   hover:border-blue-400   shadow-blue-100',
  indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 shadow-indigo-100',
  slate:  'bg-slate-100 border-slate-200  text-slate-700  hover:bg-slate-200  hover:border-slate-400  shadow-slate-100',
  pink:   'bg-pink-50   border-pink-200   text-pink-700   hover:bg-pink-100   hover:border-pink-400   shadow-pink-100',
  teal:   'bg-teal-50   border-teal-200   text-teal-700   hover:bg-teal-100   hover:border-teal-400   shadow-teal-100',
  rose:   'bg-rose-50   border-rose-200   text-rose-700   hover:bg-rose-100   hover:border-rose-400   shadow-rose-100',
  cyan:   'bg-cyan-50   border-cyan-200   text-cyan-700   hover:bg-cyan-100   hover:border-cyan-400   shadow-cyan-100',
  sky:    'bg-sky-50    border-sky-200    text-sky-700    hover:bg-sky-100    hover:border-sky-400    shadow-sky-100',
  violet: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100 hover:border-violet-400 shadow-violet-100',
  amber:  'bg-amber-50  border-amber-200  text-amber-700  hover:bg-amber-100  hover:border-amber-400  shadow-amber-100',
  purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-400 shadow-purple-100',
}

export function Screen2SymptomPicker() {
  const { state, actions } = useKiosk()
  const { speak, cancel, isSpeaking } = useSpeechInteraction()
  const lang = state.language
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return CONDITIONS
    return CONDITIONS.filter(c =>
      c.en.toLowerCase().includes(q) || c.hi.includes(q)
    )
  }, [search])

  const handleSelect = (condition) => {
    setSelected(condition.id)
    const nameToSpeak = lang === 'hi' ? condition.hi : condition.en
    speak(nameToSpeak, { lang: lang === 'hi' ? 'hi-IN' : 'en-IN', rate: 0.9 })
  }

  const handleConfirm = () => {
    if (!selected) return
    actions.setCondition(selected)
    actions.setStep(3)
  }

  const handleBack = () => {
    actions.setStep(1)
  }

  const selectedCondition = CONDITIONS.find(c => c.id === selected)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ProgressBar 
        currentStep={2} 
        totalSteps={5} 
        stepLabels={lang === 'hi' ? ['पहचान', 'लक्षण', 'प्रश्न', 'दस्तावेज़', 'दवाई व सलाह'] : ['Identify', 'Symptom', 'Questions', 'Documents', 'Prescription']}
        hideOnStep={5} 
      />

      <main className="flex-1 flex flex-col items-center justify-start p-4 pb-32">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8 mt-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4 shadow-lg shadow-primary-200">
              <Activity className="w-9 h-9 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-kiosk-2xl font-bold text-slate-900 mb-2">
              {lang === 'hi' ? 'आपकी मुख्य समस्या क्या है?' : 'What is your main concern?'}
            </h1>
            <p className="text-kiosk-base text-slate-500">
              {lang === 'hi'
                ? 'नीचे दिए गए लक्षणों में से एक चुनें'
                : 'Select the symptom that best describes what you are feeling'}
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              id="symptom-search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'hi' ? 'लक्षण खोजें...' : 'Search symptoms...'}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-200 bg-white text-slate-800 text-kiosk-base placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              aria-label="Search symptoms"
            />
          </div>

          {/* Condition Grid */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6"
            role="radiogroup"
            aria-label="Select your symptom"
          >
            {filtered.map(condition => {
              const isSelected = selected === condition.id
              const colorClass = COLOR_MAP[condition.color] || COLOR_MAP.slate
              return (
                <button
                  key={condition.id}
                  type="button"
                  id={`condition-${condition.id}`}
                  onClick={() => handleSelect(condition)}
                  aria-pressed={isSelected}
                  className={`
                    relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 
                    transition-all duration-200 cursor-pointer text-center shadow-sm
                    ${isSelected
                      ? 'border-primary-500 bg-primary-50 shadow-primary-200 shadow-lg scale-105 ring-2 ring-primary-300'
                      : `${colorClass} shadow-sm hover:shadow-md hover:scale-102`
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <span className="text-4xl" aria-hidden="true">{condition.emoji}</span>
                  <span className={`font-semibold text-sm leading-tight ${isSelected ? 'text-primary-800' : ''}`}>
                    {lang === 'hi' ? condition.hi : condition.en}
                  </span>
                </button>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p className="text-kiosk-base">
                {lang === 'hi' ? 'कोई लक्षण नहीं मिला' : 'No symptoms found. Try a different search.'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-4 shadow-xl z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            {lang === 'hi' ? 'वापस' : 'Back'}
          </button>

          {selectedCondition ? (
            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500">{lang === 'hi' ? 'चुना गया:' : 'Selected:'}</p>
                <p className="font-bold text-slate-800">
                  {selectedCondition.emoji} {lang === 'hi' ? selectedCondition.hi : selectedCondition.en}
                </p>
              </div>
              <button
                type="button"
                id="start-assessment-btn"
                onClick={handleConfirm}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-kiosk-base shadow-lg shadow-primary-200 transition-all cursor-pointer animate-bounce-subtle"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {lang === 'hi' ? 'जाँच शुरू करें' : 'Start Assessment'}
              </button>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">
              {lang === 'hi' ? 'जारी रखने के लिए एक लक्षण चुनें' : 'Select a symptom to continue'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

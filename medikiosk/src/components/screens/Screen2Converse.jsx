import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ArrowLeft, ArrowRight, AlertTriangle, Volume2, X, CheckCircle, Send, Sparkles, MessageSquare } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ProgressBar } from '../ui/ProgressBar'
import { OptionGrid, ScaleInput } from '../ui/OptionCard'
import { MicrophoneButton, VoiceStatusIndicator } from '../ui/MicrophoneButton'
import { useKiosk } from '../../context/KioskContext'
import { useSpeechInteraction } from '../../hooks/useSpeechInteraction'
import { DISEASE_FLOWS, CONDITIONS } from '../../data/diseaseFlows'
import { chestPainInterviewFlow, t } from '../../data/mockData'

function detectRedFlagInSpeech(text) {
  if (!text || typeof text !== 'string') return false
  const lower = text.toLowerCase()
  const redFlagKeywords = [
    // English keywords
    'severe', 'unbearable', 'crushing', 'faint', 'fainting', 'passed out', 'unconscious',
    'blood', 'bleeding', 'vomiting blood', 'coughing blood', 'hemoptysis',
    'cannot breathe', "can't breathe", 'breathless', 'dyspnea', 'choking', 'suffocating',
    'radiating to arm', 'radiating to jaw', 'jaw pain', 'left arm pain', 'back pain',
    'worst headache', 'thunderclap', 'sudden weakness', 'paralysis', 'slurred speech',
    'blackout', 'seizure', 'convulsion', 'high fever', 'rigors', 'cold sweat', 'stiff neck',
    'chest tightness', 'chest heaviness', 'pressure', 'stabbing pain', 'dizziness', 'giddiness',
    // Hindi keywords
    'असहनीय', 'बहुत तेज', 'बहुत ज़्यादा', 'खून', 'रक्त', 'उल्टी में खून', 'खांसी में खून',
    'बेहोश', 'बेहोशी', 'चक्कर', 'गिर पड़ा', 'सांस फूलना', 'सांस नहीं', 'सांस लेने में तकलीफ',
    'दम घुट रहा', 'छाती में भारीपन', 'सीने में जकड़न', 'बांह में दर्द', 'हाथ में दर्द', 'जबड़े में दर्द',
    'अचानक', 'दौरा', 'ठंडा पसीना', 'कांपना', 'गर्दन में अकड़न', 'तेज बुखार'
  ]
  return redFlagKeywords.some(keyword => lower.includes(keyword))
}

export function Screen2Converse() {
  const { state, actions } = useKiosk()
  const { 
    speak, 
    cancel, 
    isSpeaking, 
    isSupported: ttsSupported,
    startListening,
    stopListening,
    abortListening,
    getLatestTranscript,
    isListening,
    transcript,
    error: sttError,
    isSupported: sttSupported,
  } = useSpeechInteraction()

  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [showRedFlagAlert, setShowRedFlagAlert] = useState(false)
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false)
  const [micState, setMicState] = useState('idle')
  const [multiSelectedValues, setMultiSelectedValues] = useState([])
  const [selectedScaleValue, setSelectedScaleValue] = useState(null)
  const [customText, setCustomText] = useState('')
  const [recognizedFeedback, setRecognizedFeedback] = useState(null)
  const questionRef = useRef(0)
  const hasSpokenQuestion = useRef(false)
  const wasListeningRef = useRef(false)

  const lang = state.language
  
  // Choose interview flow based on selectedCondition
  const questions = useMemo(() => {
    return DISEASE_FLOWS[state.selectedCondition] || chestPainInterviewFlow
  }, [state.selectedCondition])

  const conditionMeta = useMemo(() => {
    return CONDITIONS.find(c => c.id === state.selectedCondition) || {
      en: 'Assessment',
      hi: 'आकलन',
      emoji: '🩺'
    }
  }, [state.selectedCondition])

  const questionIndex = state.clinicalHistory.currentQuestionIndex

  useEffect(() => {
    if (questionIndex < questions.length) {
      const q = questions[questionIndex]
      setCurrentQuestion(q)
      questionRef.current = questionIndex
      hasSpokenQuestion.current = false
      setMultiSelectedValues([])
      setSelectedScaleValue(null)
      setShowRedFlagAlert(state.clinicalHistory.redFlagCount >= 2)
    } else {
      actions.setClinicalComplete()
      actions.setStep(4) // Step 4 is Scan
    }
  }, [questionIndex, questions, state.clinicalHistory.redFlagCount, actions])

  useEffect(() => {
    if (currentQuestion && !hasSpokenQuestion.current) {
      const text = typeof currentQuestion.question === 'object'
        ? (currentQuestion.question[lang] || currentQuestion.question.en)
        : currentQuestion.question
      hasSpokenQuestion.current = true
      speak(text, { 
        lang: lang === 'hi' ? 'hi-IN' : 'en-IN', 
        rate: 0.85 
      })
    }
  }, [currentQuestion?.id, lang, speak])

  useEffect(() => {
    return () => cancel()
  }, [cancel])

  const handleOptionSelect = useCallback((option) => {
    if (isProcessingAnswer || !currentQuestion) return
    setIsProcessingAnswer(true)
    cancel()

    const qText = typeof currentQuestion.question === 'object'
      ? (currentQuestion.question[lang] || currentQuestion.question.en)
      : currentQuestion.question

    const optLabel = typeof option.label === 'object'
      ? (option.label[lang] || option.label.en)
      : (option.label || option.value)

    const response = {
      questionId: currentQuestion.id,
      questionKey: currentQuestion.key,
      question: qText,
      answer: optLabel || option.value,
      isRedFlag: option.isRedFlag || false,
      timestamp: new Date().toISOString(),
    }

    actions.addResponse(response)
    
    if (option.isRedFlag) {
      actions.incrementRedFlag()
    }

    setTimeout(() => {
      setIsProcessingAnswer(false)
    }, 400)
  }, [currentQuestion, lang, actions, cancel, isProcessingAnswer])

  const handleMultiToggle = useCallback((option) => {
    setMultiSelectedValues(prev => {
      if (option.exclusive) {
        return [option.value]
      }
      const filtered = prev.filter(v => v !== 'None' && v !== option.value)
      if (prev.includes(option.value)) {
        return filtered
      } else {
        return [...filtered, option.value]
      }
    })
  }, [])

  const handleMultiSubmit = useCallback(() => {
    if (isProcessingAnswer || !currentQuestion) return
    setIsProcessingAnswer(true)
    cancel()

    const qText = typeof currentQuestion.question === 'object'
      ? (currentQuestion.question[lang] || currentQuestion.question.en)
      : currentQuestion.question

    const chosenValues = multiSelectedValues.length > 0 ? multiSelectedValues : ['None']
    const hasRedFlag = currentQuestion.options?.some(opt => 
      opt.isRedFlag && chosenValues.includes(opt.value)
    )

    const response = {
      questionId: currentQuestion.id,
      questionKey: currentQuestion.key,
      question: qText,
      answer: chosenValues,
      isRedFlag: !!hasRedFlag,
      timestamp: new Date().toISOString(),
    }

    actions.addResponse(response)
    if (hasRedFlag) actions.incrementRedFlag()

    setTimeout(() => {
      setIsProcessingAnswer(false)
    }, 400)
  }, [currentQuestion, lang, multiSelectedValues, actions, cancel, isProcessingAnswer])

  const handleScaleChange = useCallback((value) => {
    if (isProcessingAnswer || !currentQuestion) return
    setSelectedScaleValue(value)
    setIsProcessingAnswer(true)
    cancel()

    const qText = typeof currentQuestion.question === 'object'
      ? (currentQuestion.question[lang] || currentQuestion.question.en)
      : currentQuestion.question

    const response = {
      questionId: currentQuestion.id,
      questionKey: currentQuestion.key,
      question: qText,
      answer: value,
      isRedFlag: value >= 8,
      timestamp: new Date().toISOString(),
    }

    actions.addResponse(response)
    if (value >= 8) actions.incrementRedFlag()

    setTimeout(() => {
      setIsProcessingAnswer(false)
    }, 400)
  }, [currentQuestion, lang, actions, cancel, isProcessingAnswer])

  // Sync live speech into input box
  useEffect(() => {
    if (transcript) {
      setCustomText(transcript)
    }
  }, [transcript])

  const handleVoiceStart = useCallback(() => {
    setMicState('listening')
    setCustomText('')
    setRecognizedFeedback(null)
    startListening(lang === 'hi' ? 'hi-IN' : 'en-IN')
  }, [startListening, lang])

  const handleVoiceEnd = useCallback(async () => {
    setMicState('processing')
    stopListening()
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const textHeard = (getLatestTranscript?.() || transcript || customText || '').trim()
    
    if (textHeard && currentQuestion) {
      const qText = typeof currentQuestion.question === 'object'
        ? (currentQuestion.question[lang] || currentQuestion.question.en)
        : currentQuestion.question

      // 1. Try matching against existing options
      let matchedOption = null
      if (currentQuestion.options && currentQuestion.options.length > 0) {
        const clean = textHeard.toLowerCase()
        matchedOption = currentQuestion.options.find(opt => {
          const enLabel = typeof opt.label === 'object' ? opt.label.en : opt.label
          const hiLabel = typeof opt.label === 'object' ? opt.label.hi : opt.label
          const val = opt.value || ''
          return (
            (enLabel && (clean.includes(enLabel.toLowerCase()) || enLabel.toLowerCase().includes(clean))) ||
            (hiLabel && (clean.includes(hiLabel.toLowerCase()) || hiLabel.toLowerCase().includes(clean))) ||
            (val && clean.includes(val.toLowerCase()))
          )
        })
      }

      if (matchedOption) {
        // Matched an option!
        handleOptionSelect(matchedOption)
      } else {
        // User spoke something that is NOT in the options!
        // We recognize it, detect red-flags, record it, and proceed further!
        setIsProcessingAnswer(true)
        const isRedFlag = detectRedFlagInSpeech(textHeard)

        setRecognizedFeedback({
          text: textHeard,
          isRedFlag,
        })

        const response = {
          questionId: currentQuestion.id,
          questionKey: currentQuestion.key,
          question: qText,
          answer: textHeard,
          isRedFlag: isRedFlag,
          inputMethod: 'voice_freeform',
          timestamp: new Date().toISOString(),
        }

        actions.addResponse(response)
        if (isRedFlag) {
          actions.incrementRedFlag()
          setShowRedFlagAlert(true)
        }

        setTimeout(() => {
          setCustomText('')
          setRecognizedFeedback(null)
          setIsProcessingAnswer(false)
        }, 1200)
      }
    }
    
    setMicState('idle')
  }, [stopListening, getLatestTranscript, transcript, customText, currentQuestion, lang, actions, handleOptionSelect])

  // Automatically evaluate speech when recognition ends on pause
  useEffect(() => {
    if (wasListeningRef.current && !isListening && micState === 'listening') {
      handleVoiceEnd()
    }
    wasListeningRef.current = isListening
  }, [isListening, micState, handleVoiceEnd])

  const handleCustomSubmit = useCallback(() => {
    if (isProcessingAnswer || !currentQuestion) return
    const textToSubmit = (customText || '').trim()
    if (!textToSubmit) return

    setIsProcessingAnswer(true)
    cancel()

    const qText = typeof currentQuestion.question === 'object'
      ? (currentQuestion.question[lang] || currentQuestion.question.en)
      : currentQuestion.question

    const isRedFlag = detectRedFlagInSpeech(textToSubmit)

    setRecognizedFeedback({
      text: textToSubmit,
      isRedFlag,
    })

    const response = {
      questionId: currentQuestion.id,
      questionKey: currentQuestion.key,
      question: qText,
      answer: textToSubmit,
      isRedFlag: isRedFlag,
      inputMethod: 'custom_text',
      timestamp: new Date().toISOString(),
    }

    actions.addResponse(response)
    if (isRedFlag) {
      actions.incrementRedFlag()
      setShowRedFlagAlert(true)
    }

    setTimeout(() => {
      setCustomText('')
      setRecognizedFeedback(null)
      setIsProcessingAnswer(false)
    }, 1000)
  }, [customText, currentQuestion, lang, actions, cancel, isProcessingAnswer])

  const handleReplaySpeech = useCallback(async () => {
    if (isSpeaking) {
      cancel()
    } else if (currentQuestion) {
      const text = typeof currentQuestion.question === 'object'
        ? (currentQuestion.question[lang] || currentQuestion.question.en)
        : currentQuestion.question
      await speak(text, { 
        lang: lang === 'hi' ? 'hi-IN' : 'en-IN', 
        rate: 0.85 
      })
    }
  }, [currentQuestion, lang, isSpeaking, cancel, speak])

  const handleBack = () => {
    cancel()
    actions.setStep(2) // Back to Symptom Picker
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-kiosk-lg text-slate-600">{lang === 'hi' ? 'प्रश्न लोड हो रहे हैं...' : 'Loading questions...'}</p>
        </div>
      </div>
    )
  }

  const questionTitle = typeof currentQuestion.question === 'object'
    ? (currentQuestion.question[lang] || currentQuestion.question.en)
    : currentQuestion.question

  return (
    <div className="compact-screen min-h-screen bg-slate-50 flex flex-col">
      {showRedFlagAlert && (
        <div className="w-full bg-medical-red text-white px-4 py-3" role="alert" aria-live="assertive">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
            <AlertTriangle className="w-7 h-7 flex-shrink-0" aria-hidden="true" />
            <span className="text-kiosk-lg font-semibold">{t('redFlagAlert', lang)}</span>
          </div>
        </div>
      )}
      
      <ProgressBar 
        currentStep={3} 
        totalSteps={5} 
        stepLabels={lang === 'hi' ? ['पहचान', 'लक्षण', 'प्रश्न', 'दस्तावेज़', 'दवाई व सलाह'] : ['Identify', 'Symptom', 'Questions', 'Documents', 'Prescription']}
        hideOnStep={5} 
      />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header indicator */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary-50 border border-primary-200 mb-2">
              <span className="text-2xl" aria-hidden="true">{conditionMeta.emoji}</span>
              <span className="font-bold text-primary-800 text-kiosk-base">
                {lang === 'hi' ? conditionMeta.hi : conditionMeta.en}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-primary-700 font-medium text-kiosk-sm">
                {t('questionPrefix', lang)} {questionIndex + 1} {t('ofText', lang)} {questions.length}
              </span>
            </div>
          </div>

          <Card className="mb-6 py-6 px-6 relative">
            <div className="flex items-center justify-between gap-4">
              <p className="flex-1 text-kiosk-2xl font-semibold text-slate-900 leading-relaxed text-balance text-left">
                {questionTitle}
              </p>
              <button
                type="button"
                onClick={handleReplaySpeech}
                className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                  isSpeaking 
                    ? 'bg-primary-600 border-primary-600 text-white animate-pulse shadow-lg shadow-primary-200' 
                    : 'bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100 hover:border-primary-400'
                }`}
                title={lang === 'hi' ? 'फिर से सुनें' : 'Listen again'}
                aria-label={lang === 'hi' ? 'प्रश्न सुनें' : 'Listen to question'}
              >
                <Volume2 className="w-6 h-6 flex-shrink-0" />
                <span className="text-sm font-bold hidden sm:inline">
                  {isSpeaking ? (lang === 'hi' ? 'बोल रहा है...' : 'Speaking...') : (lang === 'hi' ? 'सुनें' : 'Listen')}
                </span>
              </button>
            </div>
          </Card>

          <Card className="mb-6">
            <VoiceStatusIndicator 
              isListening={isListening} 
              isSupported={sttSupported}
              transcript={transcript}
              error={sttError}
            />
            
            <div className="mt-4 flex justify-center">
              <MicrophoneButton
                isListening={isListening}
                isProcessing={micState === 'processing'}
                isSupported={sttSupported}
                onStart={handleVoiceStart}
                onEnd={handleVoiceEnd}
                disabled={isProcessingAnswer}
              />
            </div>
          </Card>

          <Card className="mb-6">
            {/* Feedback notification when speech is recognized */}
            {recognizedFeedback && (
              <div className={`p-4 rounded-xl mb-5 border flex items-center gap-3 animate-in fade-in ${
                recognizedFeedback.isRedFlag ? 'bg-red-50 border-red-300 text-red-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}>
                <CheckCircle className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-kiosk-base font-bold truncate">
                    {lang === 'hi' ? '✅ आवाज़ पहचानी गई:' : '✅ Speech Recognized:'} &ldquo;{recognizedFeedback.text}&rdquo;
                  </p>
                  <p className="text-kiosk-sm opacity-80">
                    {lang === 'hi' ? 'उत्तर दर्ज कर लिया गया है, अगले प्रश्न पर जा रहे हैं...' : 'Recorded answer successfully. Moving to next question...'}
                  </p>
                </div>
              </div>
            )}

            {currentQuestion.type === 'scale' ? (
              <ScaleInput
                min={currentQuestion.min}
                max={currentQuestion.max}
                value={selectedScaleValue}
                onChange={handleScaleChange}
                labels={currentQuestion.labels}
                lang={lang}
              />
            ) : currentQuestion.type === 'multi' ? (
              <div className="space-y-4">
                <OptionGrid
                  options={currentQuestion.options}
                  multiSelect
                  selectedValues={multiSelectedValues}
                  onSelect={handleMultiToggle}
                  columns={2}
                  lang={lang}
                />
                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleMultiSubmit}
                    disabled={isProcessingAnswer}
                    rightIcon={<ArrowRight className="w-5 h-5" aria-hidden="true" />}
                  >
                    {lang === 'hi' ? 'पुष्टि करें और आगे बढ़ें' : 'Confirm & Continue'}
                  </Button>
                </div>
              </div>
            ) : (
              <OptionGrid
                options={currentQuestion.options}
                selectedValue={null}
                onSelect={handleOptionSelect}
                columns={2}
                lang={lang}
              />
            )}

            {/* Freeform Spoken / Custom Answer Box */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary-600" />
                <label className="text-kiosk-sm font-bold text-slate-700">
                  {lang === 'hi' 
                    ? 'विकल्पों में नहीं मिला? कुछ भी बोलें या यहाँ लिखें:' 
                    : "Not in the options? Speak anything you feel or type here:"}
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={lang === 'hi' 
                    ? 'उदा: 3 दिन से पेट में तेज़ जलन है और चक्कर भी आ रहे हैं...' 
                    : "e.g. Having severe burning sensation since 2 days, radiating to back..."}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-kiosk-base focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCustomSubmit()
                    }
                  }}
                  disabled={isProcessingAnswer}
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleCustomSubmit}
                  disabled={!customText.trim() || isProcessingAnswer}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  {lang === 'hi' ? 'दर्ज करें' : 'Proceed'}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                {lang === 'hi' 
                  ? '💡 आप माइक दबाकर कुछ भी बोल सकते हैं — सिस्टम आपकी आवाज़ पहचानकर खुद आगे बढ़ जाएगा।'
                  : '💡 You can speak anything into the microphone — the AI will understand your exact words and advance.'}
              </p>
            </div>
          </Card>

          <div className="flex gap-4 justify-between">
            <Button
              variant="secondary"
              size="xl"
              onClick={handleBack}
              disabled={isProcessingAnswer}
              className="min-h-[64px]"
              leftIcon={<ArrowLeft className="w-6 h-6" aria-hidden="true" />}
            >
              {lang === 'hi' ? 'लक्षण बदलें' : 'Change Symptom'}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                cancel()
                actions.setStep(4)
              }}
              className="text-slate-500 hover:text-slate-700"
            >
              {lang === 'hi' ? 'प्रश्नावली छोड़ें →' : 'Skip questionnaire →'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
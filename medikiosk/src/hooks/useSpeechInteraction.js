import { useState, useCallback, useRef, useEffect } from 'react'

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [voices, setVoices] = useState([])
  const voicesRef = useRef([])
  const utteranceRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true)
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices() || []
        if (availableVoices.length > 0) {
          voicesRef.current = availableVoices
          setVoices(prev => (prev.length === availableVoices.length ? prev : availableVoices))
        }
      }
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices

      const t1 = setTimeout(loadVoices, 250)
      const t2 = setTimeout(loadVoices, 1000)

      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  const speak = useCallback((text, options = {}) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported')
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      try {
        window.speechSynthesis.cancel()
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume()
        }

        const utterance = new SpeechSynthesisUtterance(text)
        utteranceRef.current = utterance

        const {
          lang = 'en-IN',
          rate = 0.85,
          pitch = 1,
          volume = 1,
          voice = null,
        } = options

        const targetLang = (lang || 'en-IN').toLowerCase().replace('_', '-')
        const isHindi = targetLang.startsWith('hi')

        utterance.lang = isHindi ? 'hi-IN' : 'en-IN'
        utterance.rate = rate
        utterance.pitch = pitch
        utterance.volume = volume

        // Get voices from ref or window directly
        const availableVoices = (voicesRef.current && voicesRef.current.length > 0)
          ? voicesRef.current
          : window.speechSynthesis.getVoices() || []

        if (voice) {
          utterance.voice = voice
        } else if (isHindi) {
          // Priority for Hindi voices:
          // 1. Lekha (macOS Hindi)
          // 2. Any voice matching 'hi-IN' / 'hi_IN'
          // 3. Name contains 'hindi'
          const hindiVoice = availableVoices.find(v => {
            const vName = (v.name || '').toLowerCase()
            const vLang = (v.lang || '').toLowerCase().replace('_', '-')
            return vName.includes('lekha') || vLang === 'hi-in' || vLang.startsWith('hi') || vName.includes('hindi')
          })

          if (hindiVoice) {
            utterance.voice = hindiVoice
          }
        } else {
          // English voice
          const enVoice = availableVoices.find(v => {
            const vLang = (v.lang || '').toLowerCase().replace('_', '-')
            return vLang === 'en-in' || vLang.startsWith('en-in')
          }) || availableVoices.find(v => {
            const vLang = (v.lang || '').toLowerCase()
            const vName = (v.name || '').toLowerCase()
            return vLang.startsWith('en') && (vName.includes('natural') || vName.includes('google') || vName.includes('samantha') || vName.includes('siri'))
          }) || availableVoices.find(v => (v.lang || '').toLowerCase().startsWith('en'))

          if (enVoice) {
            utterance.voice = enVoice
          }
        }

        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => {
          setIsSpeaking(false)
          resolve()
        }
        utterance.onerror = (event) => {
          setIsSpeaking(false)
          resolve()
        }

        setTimeout(() => {
          window.speechSynthesis.speak(utterance)
        }, 50)
      } catch (err) {
        setIsSpeaking(false)
        resolve()
      }
    })
  }, []) // Completely stable reference

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause()
    }
  }, [])

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume()
    }
  }, [])

  return { speak, cancel, pause, resume, isSpeaking, isSupported, voices }
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'hi-IN'
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
      }

      recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            interimTranscript += result[0].transcript
          }
        }
        
        const combined = finalTranscript || interimTranscript
        if (combined) {
          transcriptRef.current = combined.trim()
          setTranscript(combined.trim())
        }
      }

      recognition.onerror = (event) => {
        setError(event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const startListening = useCallback((lang = 'hi-IN') => {
    if (!recognitionRef.current) return
    
    transcriptRef.current = ''
    setTranscript('')
    const targetLang = (lang === 'hi' || lang.startsWith('hi')) ? 'hi-IN' : 'en-IN'
    recognitionRef.current.lang = targetLang
    try {
      recognitionRef.current.start()
    } catch (e) {
      setError('Could not start recognition')
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const abortListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      setIsListening(false)
    }
  }, [])

  const resetTranscript = useCallback(() => {
    transcriptRef.current = ''
    setTranscript('')
  }, [])

  const getLatestTranscript = useCallback(() => {
    return transcriptRef.current || transcript
  }, [transcript])

  return {
    startListening,
    stopListening,
    abortListening,
    resetTranscript,
    getLatestTranscript,
    isListening,
    isSupported,
    transcript,
    error,
  }
}

export function useSpeechInteraction() {
  const tts = useSpeechSynthesis()
  const stt = useSpeechRecognition()

  const speakQuestion = useCallback(async (text, lang = 'hi-IN') => {
    await tts.speak(text, { lang, rate: 0.85 })
  }, [tts])

  const listenForAnswer = useCallback((lang = 'hi-IN') => {
    return new Promise((resolve, reject) => {
      if (!stt.isSupported) {
        reject(new Error('Speech recognition not supported'))
        return
      }

      stt.resetTranscript()
      stt.startListening(lang)

      const checkResult = setInterval(() => {
        if (!stt.isListening) {
          clearInterval(checkResult)
          if (stt.transcript.trim()) {
            resolve(stt.transcript.trim())
          } else if (stt.error) {
            reject(new Error(stt.error))
          } else {
            resolve(null)
          }
        }
      }, 500)

      setTimeout(() => {
        if (stt.isListening) {
          stt.stopListening()
        }
      }, 15000)
    })
  }, [stt])

  return {
    ...tts,
    ...stt,
    speakQuestion,
    listenForAnswer,
  }
}
import { forwardRef } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

export const MicrophoneButton = forwardRef(({ 
  state,
  isListening = false,
  isProcessing = false,
  isSupported = true,
  onStart,
  onEnd,
  onPress, 
  onRelease, 
  className = '',
  disabled = false,
  size = 'xl',
  'aria-label': ariaLabel = 'Voice input',
  ...props 
}, ref) => {
  const currentState = state || (isListening ? 'listening' : isProcessing ? 'processing' : 'idle')
  const handleStartAction = onPress || onStart
  const handleEndAction = onRelease || onEnd

  const sizes = {
    lg: 'w-[120px] h-[120px]',
    xl: 'w-[160px] h-[160px]',
    xxl: 'w-[200px] h-[200px]',
  }

  const iconSizes = {
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
    xxl: 'w-12 h-12',
  }

  const handleClick = (e) => {
    if (disabled) return
    if (isListening) {
      handleEndAction?.(e)
    } else {
      handleStartAction?.(e)
    }
  }

  const getClasses = () => {
    switch (currentState) {
      case 'listening':
        return 'mic-button mic-button-listening shadow-lg shadow-red-500/30'
      case 'processing':
        return 'mic-button mic-button-processing shadow-lg shadow-amber-500/30'
      case 'idle':
      default:
        return 'mic-button mic-button-idle shadow-md hover:shadow-lg'
    }
  }

  const getIcon = () => {
    switch (currentState) {
      case 'listening':
        return <MicOff className={`${iconSizes[size]} text-white animate-pulse`} aria-hidden="true" />
      case 'processing':
        return <Loader2 className={`${iconSizes[size]} text-white animate-spin`} aria-hidden="true" />
      case 'idle':
      default:
        return <Mic className={`${iconSizes[size]} text-white`} aria-hidden="true" />
    }
  }

  const getStatusText = () => {
    switch (currentState) {
      case 'listening':
        return '🔴 Listening... Tap to submit answer (सुन रहा है... पूरा होने पर दबाएं)'
      case 'processing':
        return '⏳ Recognizing speech & analyzing (पहचान जारी है...)'
      case 'idle':
      default:
        return '🎙️ Tap to Speak (बोलने के लिए दबाएं - कुछ भी बताएं)'
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        ref={ref}
        type="button"
        className={`${getClasses()} ${sizes[size]} ${className} cursor-pointer transition-transform active:scale-95`}
        onClick={handleClick}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-pressed={currentState === 'listening'}
        {...props}
      >
        {getIcon()}
      </button>
      <p className={`
        text-kiosk-base font-semibold text-center transition-colors duration-200
        ${currentState === 'listening' ? 'text-red-600 font-bold' : currentState === 'processing' ? 'text-amber-600' : 'text-slate-700'}
      `} aria-live="polite">
        {getStatusText()}
      </p>
    </div>
  )
})

MicrophoneButton.displayName = 'MicrophoneButton'

export const VoiceStatusIndicator = ({ 
  isListening, 
  isSupported, 
  transcript, 
  error,
  className = '',
}) => {
  if (!isSupported) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 ${className}`} role="status">
        <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-kiosk-sm text-amber-800">Voice input not supported in this browser. Please use touch input.</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 ${className}`} role="alert">
        <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-kiosk-sm text-red-800">Voice error: {error}. Please try again or use touch input.</span>
      </div>
    )
  }

  if (isListening) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 animate-pulse ${className}`} role="status" aria-live="polite">
        <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce" aria-hidden="true" />
        <span className="text-kiosk-base font-semibold text-red-800">Listening... Speak now</span>
      </div>
    )
  }

  if (transcript) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 ${className}`} role="status">
        <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-kiosk-sm text-green-800">Heard: &ldquo;{transcript}&rdquo;</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 ${className}`} role="status">
      <svg className="w-6 h-6 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
      <span className="text-kiosk-sm text-slate-600">Press and hold the microphone to speak your answer</span>
    </div>
  )
}
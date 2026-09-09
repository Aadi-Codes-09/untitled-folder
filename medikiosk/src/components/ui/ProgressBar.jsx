import { ChevronRight } from 'lucide-react'

export function ProgressBar({ 
  currentStep, 
  totalSteps = 4, 
  stepLabels = ['Identify', 'Converse', 'Scan', 'Consult'],
  hideOnStep,
}) {
  if (hideOnStep && currentStep === hideOnStep) return null

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-6" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps} aria-label="Assessment progress">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-0">
          <div className="progress-line">
            <div 
              className="progress-line-filled" 
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>
        
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1
          const isActive = step === currentStep
          const isCompleted = step < currentStep
          const isPending = step > currentStep
          
          return (
            <div key={step} className="flex flex-col items-center relative z-10">
              <div className={`
                progress-step
                ${isActive ? 'progress-step-active' : ''}
                ${isCompleted ? 'progress-step-completed' : ''}
                ${isPending ? 'progress-step-pending' : ''}
              `} aria-current={isActive ? 'step' : undefined}>
                {isCompleted ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span className={`mt-2 text-center text-kiosk-xs font-medium ${isActive || isCompleted ? 'text-primary-600' : 'text-slate-500'}`}>
                {stepLabels[i]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StepIndicator({ currentStep, totalSteps, title, subtitle }) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-8 text-center">
      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary-50 border border-primary-200">
        <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-kiosk-base">
          {currentStep}
        </div>
        <div className="text-left">
          <p className="text-kiosk-lg font-bold text-primary-800">{title}</p>
          {subtitle && <p className="text-kiosk-sm text-primary-600">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`
              h-2 rounded-full transition-all duration-300
              ${i < currentStep ? 'bg-primary-600 w-12' : 'bg-slate-200 w-8'}
            `}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  )
}
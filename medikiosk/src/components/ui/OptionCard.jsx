import { forwardRef } from 'react'
import { CheckCircle2 } from 'lucide-react'

export const OptionCard = forwardRef(({ 
  children, 
  isSelected = false,
  isRedFlag = false,
  disabled = false,
  className = '',
  onClick,
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        option-card w-full ${isSelected ? 'option-card-selected' : ''} ${isRedFlag ? 'option-card-redflag' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}
      `}
      aria-pressed={isSelected}
      aria-disabled={disabled}
      {...props}
    >
      <div className="flex items-center justify-center gap-3">
        {isSelected && (
          <CheckCircle2 className="w-6 h-6 text-primary-600 flex-shrink-0" aria-hidden="true" />
        )}
        <span className="text-kiosk-base font-medium text-balance">{children}</span>
      </div>
    </button>
  )
})

OptionCard.displayName = 'OptionCard'

export const OptionGrid = ({ 
  options, 
  selectedValue, 
  onSelect, 
  multiSelect = false,
  selectedValues = [],
  disabled = false,
  columns = 2,
  className = '',
  lang = 'en',
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div 
      className={`grid gap-4 ${gridCols[columns]} ${className}`}
      role={multiSelect ? 'group' : 'radiogroup'}
      aria-label="Answer options"
    >
      {options.map((option) => {
        const isSelected = multiSelect 
          ? selectedValues.includes(option.value)
          : selectedValue === option.value
        
        // Resolve the label: support both {en, hi} objects and plain strings
        const label = typeof option.label === 'object'
          ? (option.label[lang] || option.label.en || '')
          : (option.label || '')

        return (
          <OptionCard
            key={option.id}
            isSelected={isSelected}
            isRedFlag={option.isRedFlag}
            disabled={disabled}
            onClick={() => onSelect(option)}
          >
            {label}
          </OptionCard>
        )
      })}
    </div>
  )
}

export const ScaleInput = ({ 
  min = 1, 
  max = 10, 
  value, 
  onChange, 
  labels = {},
  lang = 'en',
  className = '',
}) => {
  const currentLang = labels[lang] || labels.en || {}
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-6">
        {Array.from({ length: max - min + 1 }, (_, i) => {
          const num = min + i
          const isSelected = value === num
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`
                flex-1 aspect-square min-h-[72px] rounded-xl border-3 font-bold text-kiosk-xl transition-all duration-200
                ${isSelected 
                  ? 'bg-primary-600 border-primary-600 text-white shadow-lg' 
                  : 'bg-white border-slate-200 text-slate-700 hover:border-primary-300 hover:bg-primary-50'
                }
              `}
              aria-pressed={isSelected}
              aria-label={`${currentLang[num] || num} out of ${max}`}
            >
              {num}
            </button>
          )
        })}
      </div>
      <div className="flex justify-between text-kiosk-sm text-slate-500">
        <span>{currentLang[min] || 'Low'}</span>
        <span>{currentLang[Math.ceil((min + max) / 2)] || 'Medium'}</span>
        <span>{currentLang[max] || 'High'}</span>
      </div>
    </div>
  )
}
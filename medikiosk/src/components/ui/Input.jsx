import { forwardRef } from 'react'

export const Input = forwardRef(({ 
  label,
  error,
  helperText,
  className = '',
  leftIcon,
  rightIcon,
  fullWidth = true,
  ...props 
}, ref) => {
  const widthClass = fullWidth ? 'w-full' : ''
  const errorId = error ? `${props.id}-error` : undefined
  const helperId = helperText && !error ? `${props.id}-helper` : undefined
  
  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label htmlFor={props.id} className="block text-kiosk-sm font-semibold text-slate-900 mb-3">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full min-h-[64px] px-6 py-4 text-kiosk-lg border-2 rounded-xl
            placeholder:text-slate-400 bg-white transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500/20
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-14' : ''} ${rightIcon ? 'pr-14' : ''}
            ${error 
              ? 'border-medical-red focus:border-medical-red focus:ring-medical-red/20' 
              : 'border-slate-300 focus:border-primary-500'
            }
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={errorId || helperId}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-kiosk-sm text-medical-red flex items-center gap-2" role="alert">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-2 text-kiosk-sm text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export const Textarea = forwardRef(({ 
  label,
  error,
  helperText,
  className = '',
  fullWidth = true,
  rows = 4,
  ...props 
}, ref) => {
  const widthClass = fullWidth ? 'w-full' : ''
  const errorId = error ? `${props.id}-error` : undefined
  const helperId = helperText && !error ? `${props.id}-helper` : undefined
  
  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label htmlFor={props.id} className="block text-kiosk-sm font-semibold text-slate-900 mb-3">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full min-h-[120px] px-6 py-4 text-kiosk-lg border-2 rounded-xl
          placeholder:text-slate-400 bg-white transition-all duration-200 resize-none
          focus:outline-none focus:ring-2 focus:ring-primary-500/20
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${error 
            ? 'border-medical-red focus:border-medical-red focus:ring-medical-red/20' 
            : 'border-slate-300 focus:border-primary-500'
          }
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId || helperId}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-2 text-kiosk-sm text-medical-red flex items-center gap-2" role="alert">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-2 text-kiosk-sm text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'
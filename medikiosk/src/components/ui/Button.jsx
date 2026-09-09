import { forwardRef } from 'react'

export const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'default',
  className = '',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400 border-2 border-slate-200',
    success: 'bg-medical-green text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-medical-red text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
    outline: 'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
  }
  
  const sizes = {
    sm: 'px-4 py-3 text-kiosk-sm min-h-[48px] gap-2',
    default: 'px-8 py-4 text-kiosk-base min-h-[64px] gap-3',
    lg: 'px-10 py-5 text-kiosk-lg min-h-[72px] gap-3',
    xl: 'px-12 py-6 text-kiosk-xl min-h-[88px] gap-4',
    touch: 'px-8 py-6 text-kiosk-xl min-h-[80px] gap-3',
  }
  
  const widthClass = fullWidth ? 'w-full' : ''
  
  return (
    <button
      ref={ref}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon ? (
        <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!loading && rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
    </button>
  )
})

Button.displayName = 'Button'

export const IconButton = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'default',
  className = '',
  disabled = false,
  loading = false,
  'aria-label': ariaLabel,
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.95]'
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400 border-2 border-slate-200',
    success: 'bg-medical-green text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-medical-red text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
  }
  
  const sizes = {
    sm: 'p-3 min-h-[44px] min-w-[44px]',
    default: 'p-4 min-h-[56px] min-w-[56px]',
    lg: 'p-5 min-h-[64px] min-w-[64px]',
    xl: 'p-6 min-h-[72px] min-w-[72px]',
  }
  
  return (
    <button
      ref={ref}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        children
      )}
    </button>
  )
})

IconButton.displayName = 'IconButton'
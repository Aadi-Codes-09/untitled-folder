import { forwardRef } from 'react'

export const Card = forwardRef(({ 
  children, 
  className = '',
  variant = 'default',
  padding = 'default',
  ...props 
}, ref) => {
  const variants = {
    default: 'bg-white border-slate-200 shadow-lg',
    elevated: 'bg-white border-slate-200 shadow-xl',
    outlined: 'bg-white border-2 border-slate-300 shadow-md',
    subtle: 'bg-slate-50 border-slate-200 shadow-sm',
    alert: 'bg-red-50 border-medical-red/30 shadow-lg',
    success: 'bg-green-50 border-medical-green/30 shadow-lg',
  }
  
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  }
  
  return (
    <div
      ref={ref}
      className={`${variants[variant]} ${paddings[padding]} rounded-2xl border ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

export const CardHeader = forwardRef(({ 
  children, 
  className = '',
  ...props 
}, ref) => (
  <div ref={ref} className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
))

CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef(({ 
  children, 
  className = '',
  level = 2,
  ...props 
}, ref) => {
  const Tag = `h${level}`
  return (
    <Tag ref={ref} className={`font-bold text-slate-900 ${className}`} {...props}>
      {children}
    </Tag>
  )
})

CardTitle.displayName = 'CardTitle'

export const CardContent = forwardRef(({ 
  children, 
  className = '',
  ...props 
}, ref) => (
  <div ref={ref} className={className} {...props}>
    {children}
  </div>
))

CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef(({ 
  children, 
  className = '',
  ...props 
}, ref) => (
  <div ref={ref} className={`mt-6 pt-4 border-t border-slate-200 ${className}`} {...props}>
    {children}
  </div>
))

CardFooter.displayName = 'CardFooter'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        medical: {
          green: '#10b981',
          red: '#ef4444',
          amber: '#f59e0b',
        }
      },
      fontSize: {
        'kiosk-xs': ['1.125rem', { lineHeight: '1.5rem' }], // 18px
        'kiosk-sm': ['1.25rem', { lineHeight: '1.75rem' }], // 20px
        'kiosk-base': ['1.5rem', { lineHeight: '2rem' }], // 24px
        'kiosk-lg': ['1.875rem', { lineHeight: '2.5rem' }], // 30px
        'kiosk-xl': ['2.25rem', { lineHeight: '3rem' }], // 36px
        'kiosk-2xl': ['3rem', { lineHeight: '3.5rem' }], // 48px
        'kiosk-3xl': ['4rem', { lineHeight: '4.5rem' }], // 64px
      },
      minHeight: {
        'touch': '48px',
        'touch-lg': '64px',
        'touch-xl': '80px',
      },
    },
  },
  plugins: [],
}

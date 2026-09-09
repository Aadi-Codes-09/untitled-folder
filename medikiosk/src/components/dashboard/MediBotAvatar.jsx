import { useEffect, useState } from 'react'

export function MediBotAvatar({ speaking = false, listening = false, size = 'lg' }) {
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 180)
    }, 3200)
    return () => clearInterval(t)
  }, [])

  const dims = size === 'lg' ? 'w-44 h-56' : 'w-28 h-36'

  return (
    <div className={`relative flex flex-col items-center ${dims}`} aria-hidden="true">
      {/* glow ring when speaking/listening */}
      <div
        className={`absolute -inset-3 rounded-[2rem] transition-all duration-500 ${
          listening
            ? 'bg-red-100 animate-pulse'
            : speaking
              ? 'bg-sky-100 animate-pulse-slow'
              : 'bg-slate-100'
        }`}
      />
      {/* Robot body */}
      <div className="relative bg-white rounded-3xl shadow-lg border border-slate-200 px-5 pt-4 pb-3 flex flex-col items-center w-full">
        {/* antenna */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className={`w-2.5 h-2.5 rounded-full ${listening ? 'bg-red-500 animate-ping' : 'bg-sky-500'}`} />
          <div className="w-1 h-3 bg-slate-300" />
        </div>
        {/* head */}
        <div className="mt-1 w-28 h-20 bg-slate-900 rounded-2xl relative flex items-center justify-center overflow-hidden">
          {/* ears */}
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-8 bg-sky-200 rounded-full" />
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-8 bg-sky-200 rounded-full" />
          {/* eyes */}
          <div className="flex gap-4 items-center">
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`w-5 h-6 rounded-full bg-sky-300 transition-all duration-150 flex items-center justify-center ${
                    blink ? 'scale-y-[0.15]' : 'scale-y-100'
                  }`}
                >
                  <div className="w-2 h-3 bg-slate-900 rounded-full" />
                </div>
              </div>
            ))}
          </div>
          {/* smile */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <div
              className={`w-6 h-3 border-b-[3px] border-sky-300 rounded-b-full transition-all ${
                speaking ? 'animate-bounce-subtle scale-125' : ''
              }`}
            />
          </div>
          {/* speaking bars */}
          {speaking && (
            <div className="absolute bottom-1 right-2 flex gap-0.5 items-end h-4">
              {[0, 1, 2].map((b) => (
                <span
                  key={b}
                  className="w-1 bg-emerald-400 rounded-full animate-pulse"
                  style={{ height: `${8 + b * 4}px`, animationDelay: `${b * 150}ms` }}
                />
              ))}
            </div>
          )}
        </div>
        {/* body */}
        <div className="mt-2 relative w-24 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-sky-100 border-2 border-sky-300 flex items-center justify-center">
            <span className="text-sky-600 font-bold text-lg">+</span>
          </div>
          {/* stethoscope hint */}
          <div className="absolute -left-2 top-1 w-3 h-10 border-l-4 border-b-4 border-slate-700 rounded-bl-full" />
          <div className="absolute -right-2 top-1 w-3 h-10 border-r-4 border-b-4 border-slate-700 rounded-br-full" />
        </div>
        {/* arms */}
        <div className={`absolute top-24 -left-1 w-4 h-12 bg-white border border-slate-200 rounded-full ${speaking ? 'rotate-12' : ''} transition-transform`} />
        <div className={`absolute top-24 -right-1 w-4 h-12 bg-white border border-slate-200 rounded-full ${speaking ? '-rotate-12' : ''} transition-transform`} />

        {/* status dot */}
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${listening ? 'bg-red-500 animate-ping' : speaking ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'}`} />
          <span className="text-[11px] font-semibold text-slate-500 tracking-wide">
            {listening ? 'LISTENING...' : speaking ? 'SPEAKING...' : 'MEDIBOT READY'}
          </span>
        </div>
      </div>
    </div>
  )
}

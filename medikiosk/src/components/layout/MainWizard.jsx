import { useMemo } from 'react'
import { Home } from 'lucide-react'
import { useKiosk } from '../../context/KioskContext'
import { PatientDashboard } from '../dashboard/PatientDashboard'
import { Screen1Identify } from '../screens/Screen1Identify'
import { Screen2SymptomPicker } from '../screens/Screen2SymptomPicker'
import { Screen2Converse } from '../screens/Screen2Converse'
import { Screen3Scan } from '../screens/Screen3Scan'
import { Screen4Consult } from '../screens/Screen4Consult'

export function MainWizard() {
  const { state, actions } = useKiosk()

  // Step 1 = Login first, Step 0 = Patient Dashboard (after login), 2-5 = wizard flow
  const screens = useMemo(() => ({
    0: <PatientDashboard key="dashboard" />,
    1: <Screen1Identify key="screen1" />,
    2: <Screen2SymptomPicker key="screen2" />,
    3: <Screen2Converse key="screen3" />,
    4: <Screen3Scan key="screen4" />,
    5: <Screen4Consult key="screen5" />,
  }), [])

  const CurrentScreen = screens[state.currentStep] ?? screens[1]
  const showHome = state.currentStep !== 0 && state.currentStep !== 1

  return (
    <div className="min-h-screen transition-opacity duration-300 relative">
      <div className="animate-in fade-in duration-300">
        {CurrentScreen}
      </div>
      {showHome && (
        <button
          onClick={() => actions.setStep(0)}
          aria-label="Back to Dashboard"
          className="no-print fixed bottom-5 left-5 z-50 flex items-center gap-2 min-h-[56px] px-5 rounded-2xl bg-[#1e3a5f] text-white font-bold text-[16px] shadow-xl hover:bg-[#16283f] active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300"
        >
          <Home size={22} />
          {state.language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
        </button>
      )}
    </div>
  )
}
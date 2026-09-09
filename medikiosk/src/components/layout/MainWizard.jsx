import { useMemo } from 'react'
import { useKiosk } from '../../context/KioskContext'
import { Screen1Identify } from '../screens/Screen1Identify'
import { Screen2SymptomPicker } from '../screens/Screen2SymptomPicker'
import { Screen2Converse } from '../screens/Screen2Converse'
import { Screen3Scan } from '../screens/Screen3Scan'
import { Screen4Consult } from '../screens/Screen4Consult'

export function MainWizard() {
  const { state } = useKiosk()

  // 5-step comprehensive flow: Identify -> Symptoms -> Questions -> Documents -> AI Prescription & Advice
  const screens = useMemo(() => ({
    1: <Screen1Identify key="screen1" />,
    2: <Screen2SymptomPicker key="screen2" />,
    3: <Screen2Converse key="screen3" />,
    4: <Screen3Scan key="screen4" />,
    5: <Screen4Consult key="screen5" />,
  }), [])

  const CurrentScreen = screens[state.currentStep] || screens[1]

  return (
    <div className="min-h-screen transition-opacity duration-300">
      <div className="animate-in fade-in duration-300">
        {CurrentScreen}
      </div>
    </div>
  )
}
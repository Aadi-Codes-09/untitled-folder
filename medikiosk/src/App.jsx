import { KioskProvider } from './context/KioskContext'
import { MainWizard } from './components/layout/MainWizard'
import './index.css'

function App() {
  return (
    <KioskProvider>
      <div className="min-h-screen bg-slate-50">
        <MainWizard />
      </div>
    </KioskProvider>
  )
}

export default App
import { createContext, useContext, useReducer, useMemo } from 'react'

const KioskContext = createContext(null)

const initialState = {
  currentStep: 1,
  language: 'en',
  patientDetails: {
    abhaId: '',
    name: '',
    phone: '',
    consentGiven: false,
  },
  patientLocation: null,      // { lat, lon, area, city, state, postcode, displayName, source }
  activeAppointment: null,    // Booked appointment details
  selectedCondition: null,   // e.g. 'chest_pain', 'fever', etc.
  clinicalHistory: {
    responses: [],
    redFlagCount: 0,
    currentQuestionIndex: 0,
    isComplete: false,
  },
  scannedDocs: [],
  isProcessing: false,
}

function kioskReducer(state, action) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload }
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload }
    case 'SET_PATIENT_ID':
      return {
        ...state,
        patientDetails: { ...state.patientDetails, abhaId: action.payload }
      }
    case 'SET_CONSENT':
      return {
        ...state,
        patientDetails: { ...state.patientDetails, consentGiven: action.payload }
      }
    case 'SET_LOCATION':
      return {
        ...state,
        patientLocation: action.payload,
      }
    case 'SET_APPOINTMENT':
      return {
        ...state,
        activeAppointment: action.payload,
      }
    case 'CLEAR_APPOINTMENT':
      return {
        ...state,
        activeAppointment: null,
      }
    case 'SET_CONDITION':
      return {
        ...state,
        selectedCondition: action.payload,
        // Reset clinical history when condition changes
        clinicalHistory: {
          responses: [],
          redFlagCount: 0,
          currentQuestionIndex: 0,
          isComplete: false,
        },
      }
    case 'ADD_RESPONSE':
      return {
        ...state,
        clinicalHistory: {
          ...state.clinicalHistory,
          responses: [...state.clinicalHistory.responses, action.payload],
          currentQuestionIndex: state.clinicalHistory.currentQuestionIndex + 1,
        }
      }
    case 'INCREMENT_RED_FLAG':
      return {
        ...state,
        clinicalHistory: {
          ...state.clinicalHistory,
          redFlagCount: state.clinicalHistory.redFlagCount + 1,
        }
      }
    case 'SET_CLINICAL_COMPLETE':
      return {
        ...state,
        clinicalHistory: {
          ...state.clinicalHistory,
          isComplete: true,
        }
      }
    case 'ADD_SCANNED_DOC':
      return {
        ...state,
        scannedDocs: [...state.scannedDocs, action.payload]
      }
    case 'REMOVE_SCANNED_DOC':
      return {
        ...state,
        scannedDocs: state.scannedDocs.filter(d => d.id !== action.payload)
      }
    case 'CLEAR_SCANNED_DOCS':
      return {
        ...state,
        scannedDocs: []
      }
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload }
    case 'RESET_WIZARD':
      return initialState
    default:
      return state
  }
}

export function KioskProvider({ children }) {
  const [state, dispatch] = useReducer(kioskReducer, initialState)

  const actions = useMemo(() => ({
    setStep:            (step)       => dispatch({ type: 'SET_STEP',            payload: step }),
    setLanguage:        (lang)       => dispatch({ type: 'SET_LANGUAGE',        payload: lang }),
    setPatientId:       (id)         => dispatch({ type: 'SET_PATIENT_ID',      payload: id }),
    setConsent:         (consent)    => dispatch({ type: 'SET_CONSENT',         payload: consent }),
    setLocation:        (loc)        => dispatch({ type: 'SET_LOCATION',        payload: loc }),
    setAppointment:     (appt)       => dispatch({ type: 'SET_APPOINTMENT',     payload: appt }),
    clearAppointment:   ()           => dispatch({ type: 'CLEAR_APPOINTMENT' }),
    setCondition:       (condId)     => dispatch({ type: 'SET_CONDITION',       payload: condId }),
    addResponse:        (response)   => dispatch({ type: 'ADD_RESPONSE',        payload: response }),
    incrementRedFlag:   ()           => dispatch({ type: 'INCREMENT_RED_FLAG' }),
    setClinicalComplete:()           => dispatch({ type: 'SET_CLINICAL_COMPLETE' }),
    addScannedDoc:      (doc)        => dispatch({ type: 'ADD_SCANNED_DOC',     payload: doc }),
    removeScannedDoc:   (id)         => dispatch({ type: 'REMOVE_SCANNED_DOC',  payload: id }),
    clearScannedDocs:   ()           => dispatch({ type: 'CLEAR_SCANNED_DOCS' }),
    setProcessing:      (processing) => dispatch({ type: 'SET_PROCESSING',      payload: processing }),
    resetWizard:        ()           => dispatch({ type: 'RESET_WIZARD' }),
  }), [])

  const value = useMemo(() => ({ state, actions }), [state, actions])

  return (
    <KioskContext.Provider value={value}>
      {children}
    </KioskContext.Provider>
  )
}

export function useKiosk() {
  const context = useContext(KioskContext)
  if (!context) {
    throw new Error('useKiosk must be used within a KioskProvider')
  }
  return context
}
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { 
  FileText, Upload, CheckCircle2, Loader2, X, Camera, 
  ChevronRight, ArrowLeft, Plus, Stethoscope, TestTube2, 
  History, Activity, AlertCircle, Sparkles, Trash2, Eye
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ProgressBar } from '../ui/ProgressBar'
import { useKiosk } from '../../context/KioskContext'
import { useSpeechInteraction } from '../../hooks/useSpeechInteraction'
import { mockScannedDocuments, getPrescriptionForCondition, getMockScannedDocuments, t } from '../../data/mockData'
import { CONDITIONS } from '../../data/diseaseFlows'

function ArrowRight({ className, ...props }) {
  return <ChevronRight className={className} aria-hidden="true" {...props} />
}

export function Screen3Scan() {
  const { state, actions } = useKiosk()
  const { speak, cancel, isSpeaking, isSupported: ttsSupported } = useSpeechInteraction()
  
  const conditionMeta = useMemo(() => {
    return CONDITIONS.find(c => c.id === state.selectedCondition) || {
      en: 'General Consultation',
      hi: 'सामान्य परामर्श',
      emoji: '🩺'
    }
  }, [state.selectedCondition])

  const currentConditionPrescription = useMemo(() => {
    return getPrescriptionForCondition(state.selectedCondition)
  }, [state.selectedCondition])

  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [processingIndex, setProcessingIndex] = useState(-1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showResults, setShowResults] = useState(state.scannedDocs.length > 0)
  const [previewDoc, setPreviewDoc] = useState(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const lang = state.language

  const instructionsText = lang === 'hi'
    ? 'कृपया अपने डॉक्टर का पर्चा, लैब रिपोर्ट या पुराना मेडिकल इतिहास अपलोड करें। AI स्वचालित रूप से आपकी दवाएं, जांच रिपोर्ट और पुरानी बीमारियां पढ़ लेगा।'
    : 'Please upload your prescriptions, lab reports, or medical history records. AI will automatically extract medications, lab values, and past conditions.'

  useEffect(() => {
    let active = true
    const speakInstructions = async () => {
      if (ttsSupported && active) {
        await speak(instructionsText, { lang: lang === 'hi' ? 'hi-IN' : 'en-IN', rate: 0.85 })
      }
    }
    speakInstructions()
    return () => {
      active = false
      cancel()
    }
  }, [lang])

  // Sync state.scannedDocs into local view if available
  useEffect(() => {
    if (state.scannedDocs && state.scannedDocs.length > 0 && !showResults && uploadedFiles.length === 0) {
      setShowResults(true)
    }
  }, [state.scannedDocs])

  const detectCategoryFromName = (name) => {
    const lower = name.toLowerCase()
    if (lower.includes('rx') || lower.includes('prescript') || lower.includes('med') || lower.includes('dr')) {
      return 'Prescription'
    }
    if (lower.includes('lab') || lower.includes('blood') || lower.includes('cbc') || lower.includes('test') || lower.includes('lipid') || lower.includes('report')) {
      return 'Lab Report'
    }
    if (lower.includes('hist') || lower.includes('discharge') || lower.includes('summary') || lower.includes('past') || lower.includes('record')) {
      return 'Medical History'
    }
    if (lower.includes('ecg') || lower.includes('ekg') || lower.includes('cardiac') || lower.includes('heart')) {
      return 'ECG'
    }
    return 'Medical Document'
  }

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(f => 
      ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(f.type)
    )
    const newItems = validFiles.map(f => {
      const detected = detectCategoryFromName(f.name)
      return {
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        file: f,
        name: f.name,
        size: (f.size / 1024).toFixed(1) + ' KB',
        type: detected,
        status: 'pending'
      }
    })
    setUploadedFiles(prev => [...prev, ...newItems])
    e.target.value = ''
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.currentTarget.classList.add('border-primary-500', 'bg-primary-50')
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.currentTarget.classList.remove('border-primary-500', 'bg-primary-50')
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('border-primary-500', 'bg-primary-50')
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(f => 
      ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(f.type)
    )
    const newItems = validFiles.map(f => {
      const detected = detectCategoryFromName(f.name)
      return {
        id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        file: f,
        name: f.name,
        size: (f.size / 1024).toFixed(1) + ' KB',
        type: detected,
        status: 'pending'
      }
    })
    setUploadedFiles(prev => [...prev, ...newItems])
  }, [])

  const removeFile = useCallback((id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
    actions.removeScannedDoc(id)
  }, [actions])

  // Sample quick loader for testing/demo (dynamically selects prescription for patient's condition)
  const handleAddSample = (sampleType) => {
    let sample = null
    if (sampleType === 'Prescription') {
      sample = getPrescriptionForCondition(state.selectedCondition)
    } else if (sampleType === 'Lab Report') {
      sample = mockScannedDocuments.find(d => d.type === 'Lab Report')
    } else if (sampleType === 'Medical History') {
      sample = mockScannedDocuments.find(d => d.type === 'Medical History')
    } else if (sampleType === 'ECG') {
      sample = mockScannedDocuments.find(d => d.type === 'ECG')
    }

    if (sample) {
      const newDoc = {
        ...sample,
        id: 'sample_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        originalName: sample.name,
      }
      setUploadedFiles(prev => [
        ...prev,
        {
          id: newDoc.id,
          name: newDoc.name,
          size: '420 KB',
          type: newDoc.type,
          status: 'pending',
          presetData: newDoc,
        }
      ])
    }
  }

  const handleLoadAllSamples = () => {
    const conditionDocs = getMockScannedDocuments(state.selectedCondition)
    const samples = conditionDocs.map(sample => ({
      id: 'sample_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: sample.name,
      size: '350 KB',
      type: sample.type,
      status: 'pending',
      presetData: {
        ...sample,
        id: 'sample_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        originalName: sample.name,
      }
    }))
    setUploadedFiles(prev => [...prev, ...samples])
  }

  // Camera capture simulation (matches patient condition prescription)
  const handleCameraCapture = () => {
    const conditionDocs = getMockScannedDocuments(state.selectedCondition)
    const sample = conditionDocs[uploadedFiles.length % conditionDocs.length]
    const photoItem = {
      id: 'cam_' + Date.now(),
      name: `Photo_${sample.type.replace(/\s+/g, '')}_${new Date().toLocaleTimeString().replace(/:/g, '')}.jpg`,
      size: '1.8 MB',
      type: sample.type,
      status: 'pending',
      presetData: {
        ...sample,
        id: 'cam_' + Date.now(),
        originalName: `Camera_Capture_${sample.type}.jpg`,
      }
    }
    setUploadedFiles(prev => [...prev, photoItem])
  }

  const processFiles = useCallback(async () => {
    if (uploadedFiles.length === 0) return
    
    setIsProcessing(true)
    actions.setProcessing(true)
    
    for (let i = 0; i < uploadedFiles.length; i++) {
      setProcessingIndex(i)
      const fileItem = uploadedFiles[i]
      
      setUploadedFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'processing' } : f
      ))
      
      await new Promise(resolve => setTimeout(resolve, 1400))
      
      // Match condition-specific sample or fallback
      let resultData
      if (fileItem.presetData) {
        resultData = fileItem.presetData
      } else {
        let matchingDoc
        if (fileItem.type.toLowerCase() === 'prescription') {
          matchingDoc = getPrescriptionForCondition(state.selectedCondition)
        } else {
          matchingDoc = mockScannedDocuments.find(d => d.type.toLowerCase() === fileItem.type.toLowerCase()) 
            || mockScannedDocuments[i % mockScannedDocuments.length]
        }
        resultData = {
          ...matchingDoc,
          id: fileItem.id,
          name: fileItem.name,
          originalName: fileItem.name,
          type: fileItem.type || matchingDoc.type,
        }
      }
      
      actions.addScannedDoc(resultData)
      
      setUploadedFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'complete' } : f
      ))
    }
    
    setProcessingIndex(-1)
    setIsProcessing(false)
    actions.setProcessing(false)
    setShowResults(true)
  }, [uploadedFiles, actions, state.selectedCondition])

  const handleProceedToConsultation = () => {
    actions.setConsultEntry('full')
    actions.setStep(5)
  }

  const handleSkipToConsultation = () => {
    cancel()
    actions.setConsultEntry('full')
    actions.setStep(5)
  }

  const handleBack = () => {
    cancel()
    actions.setStep(3)
  }

  // Filtered documents in results
  const filteredResults = useMemo(() => {
    if (selectedCategory === 'ALL') return state.scannedDocs
    if (selectedCategory === 'PRESCRIPTION') return state.scannedDocs.filter(d => d.type === 'Prescription')
    if (selectedCategory === 'LAB_REPORT') return state.scannedDocs.filter(d => d.type === 'Lab Report')
    if (selectedCategory === 'MEDICAL_HISTORY') return state.scannedDocs.filter(d => d.type === 'Medical History')
    if (selectedCategory === 'ECG') return state.scannedDocs.filter(d => d.type === 'ECG')
    return state.scannedDocs
  }, [state.scannedDocs, selectedCategory])

  const renderDropZone = () => (
    <Card className="mb-6 border-slate-200 shadow-sm overflow-hidden">
      <div 
        className="border-3 border-dashed border-slate-300 rounded-2xl p-8 md:p-10 text-center transition-all duration-200 hover:border-primary-500 hover:bg-primary-50/40"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          aria-label="Upload medical documents"
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          id="camera-upload"
          aria-label="Camera Capture"
        />
        
        {/* Condition-Linked Prescription Stage Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border-2 border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-300/60 flex items-center justify-center text-xl flex-shrink-0">
              {conditionMeta.emoji}
            </div>
            <div className="text-left">
              <span className="font-bold text-blue-900 text-sm block">
                {lang === 'hi' ? 'रोग-आधारित पर्चा अवस्था:' : 'Disease-Linked Prescription Stage:'}{' '}
                <span className="text-primary-700">{lang === 'hi' ? conditionMeta.hi : conditionMeta.en}</span>
              </span>
              <span className="text-slate-600 text-xs">
                {lang === 'hi'
                  ? `आपके द्वारा चुने गए रोग के अनुसार संबंधित दवाएं और विशेषज्ञ डॉक्टर पर्चा लोड होगा।`
                  : `Uploaded/sample prescriptions will automatically load medicines and doctor records for "${conditionMeta.en}".`}
              </span>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 flex-shrink-0">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{currentConditionPrescription.extractedData.doctor.split(',')[0]}</span>
          </span>
        </div>

        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary-100 text-primary-700 mb-5 shadow-inner">
          <Upload className="w-10 h-10" aria-hidden="true" />
        </div>

        <h3 className="text-kiosk-xl font-bold text-slate-900 mb-2">
          {t('dropZoneText', lang)}
        </h3>
        <p className="text-kiosk-base text-slate-500 mb-6">
          {t('supportedFormats', lang)}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="w-6 h-6" aria-hidden="true" />}
            className="shadow-md"
          >
            {t('chooseFilesBtn', lang)}
          </Button>

          <Button 
            variant="secondary" 
            size="lg" 
            onClick={handleCameraCapture}
            leftIcon={<Camera className="w-6 h-6 text-primary-600" aria-hidden="true" />}
          >
            {t('cameraCaptureBtn', lang)}
          </Button>
        </div>

        {/* Sample Loaders for Quick Demo */}
        <div className="pt-6 border-t border-slate-200">
          <p className="text-kiosk-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
            {t('samplePresetsTitle', lang)}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => handleAddSample('Prescription')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-kiosk-sm font-bold bg-blue-50 text-blue-800 border-2 border-blue-300 hover:bg-blue-100 transition-colors shadow-sm cursor-pointer"
              title={`Load ${conditionMeta.en} Prescription`}
            >
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span>
                {t('samplePrescriptionBtn', lang)} ({conditionMeta.emoji} {lang === 'hi' ? conditionMeta.hi : conditionMeta.en})
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleAddSample('Lab Report')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-kiosk-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
            >
              <TestTube2 className="w-4 h-4 text-emerald-600" />
              {t('sampleLabBtn', lang)}
            </button>

            <button
              type="button"
              onClick={() => handleAddSample('Medical History')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-kiosk-sm font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors shadow-sm"
            >
              <History className="w-4 h-4 text-purple-600" />
              {t('sampleHistoryBtn', lang)}
            </button>

            <button
              type="button"
              onClick={() => handleAddSample('ECG')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-kiosk-sm font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors shadow-sm"
            >
              <Activity className="w-4 h-4 text-rose-600" />
              {t('sampleEcgBtn', lang)}
            </button>

            <button
              type="button"
              onClick={handleLoadAllSamples}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-kiosk-sm font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              {lang === 'hi' ? '⚡ सभी 4 नमूने लोड करें' : '⚡ Load All 4 Samples'}
            </button>
          </div>
        </div>
      </div>
    </Card>
  )

  const renderQueueList = () => {
    if (uploadedFiles.length === 0) return null

    return (
      <Card className="mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-kiosk-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" aria-hidden="true" />
            {lang === 'hi' ? 'अपलोड सूची' : 'Staged Documents'} ({uploadedFiles.length})
          </h3>

          {!isProcessing && (
            <button
              type="button"
              onClick={() => setUploadedFiles([])}
              className="text-kiosk-sm text-red-600 hover:text-red-700 font-medium"
            >
              {lang === 'hi' ? 'सूची साफ़ करें' : 'Clear All'}
            </button>
          )}
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {uploadedFiles.map((item, idx) => (
            <div 
              key={item.id} 
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                item.status === 'processing' 
                  ? 'bg-amber-50/70 border-amber-300 shadow-sm' 
                  : item.status === 'complete' 
                    ? 'bg-emerald-50/50 border-emerald-300' 
                    : 'bg-white border-slate-200'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                item.status === 'processing' 
                  ? 'bg-amber-100' 
                  : item.status === 'complete' 
                    ? 'bg-emerald-100' 
                    : 'bg-slate-100'
              }`}>
                {item.status === 'processing' ? (
                  <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                ) : item.status === 'complete' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <FileText className="w-6 h-6 text-slate-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    item.type === 'Prescription' ? 'bg-blue-100 text-blue-800' :
                    item.type === 'Lab Report' ? 'bg-emerald-100 text-emerald-800' :
                    item.type === 'Medical History' ? 'bg-purple-100 text-purple-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {item.type}
                  </span>
                  <p className="text-kiosk-base font-semibold text-slate-900 truncate">
                    {item.name}
                  </p>
                </div>
                <p className="text-kiosk-sm text-slate-500">
                  {item.size} • {item.status === 'processing' ? (lang === 'hi' ? 'AI विश्लेषण जारी...' : 'AI Analyzing...') : item.status === 'complete' ? (lang === 'hi' ? 'डिजिटल हो गया' : 'Digitized') : (lang === 'hi' ? 'स्कैन के लिए तैयार' : 'Ready to scan')}
                </p>
              </div>

              {!isProcessing && item.status !== 'complete' && (
                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label="Remove"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Processing State Bar */}
        {isProcessing && processingIndex >= 0 && (
          <div className="mt-6 p-4 rounded-xl bg-primary-50 border border-primary-200 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
              <p className="text-kiosk-base font-bold text-primary-900">
                {t('scanProcessing', lang)}
              </p>
            </div>
            <p className="text-kiosk-sm text-primary-700">
              {lang === 'hi' ? 'पढ़ रहा है:' : 'Processing:'} {uploadedFiles[processingIndex]?.name} ({processingIndex + 1}/{uploadedFiles.length})
            </p>
            <div className="mt-3 w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-primary-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${((processingIndex + 1) / uploadedFiles.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions for staged files */}
        {!isProcessing && uploadedFiles.some(f => f.status === 'pending') && (
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <Button 
              variant="success" 
              size="xl" 
              onClick={processFiles}
              className="min-h-[64px] px-8 shadow-md"
              rightIcon={<ArrowRight className="w-7 h-7" aria-hidden="true" />}
            >
              {t('startScanningBtn', lang)}
            </Button>
          </div>
        )}
      </Card>
    )
  }

  const renderCategoryFilterTabs = () => {
    const tabs = [
      { id: 'ALL', label: t('categoryAll', lang), icon: FileText, count: state.scannedDocs.length },
      { id: 'PRESCRIPTION', label: t('categoryPrescription', lang), icon: Stethoscope, count: state.scannedDocs.filter(d => d.type === 'Prescription').length },
      { id: 'LAB_REPORT', label: t('categoryLab', lang), icon: TestTube2, count: state.scannedDocs.filter(d => d.type === 'Lab Report').length },
      { id: 'MEDICAL_HISTORY', label: t('categoryHistory', lang), icon: History, count: state.scannedDocs.filter(d => d.type === 'Medical History').length },
      { id: 'ECG', label: t('categoryEcg', lang), icon: Activity, count: state.scannedDocs.filter(d => d.type === 'ECG').length },
    ]

    return (
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = selectedCategory === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-kiosk-sm font-bold transition-all ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-200 scale-[1.02]' 
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  const renderExtractedDocCard = (doc) => {
    const isPrescription = doc.type === 'Prescription'
    const isLab = doc.type === 'Lab Report'
    const isHistory = doc.type === 'Medical History'
    const isEcg = doc.type === 'ECG'

    return (
      <div 
        key={doc.id}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Card Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isPrescription ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                isLab ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                isHistory ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {doc.type}
              </span>
              <h4 className="text-kiosk-base font-bold text-slate-900">
                {doc.originalName || doc.name}
              </h4>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-kiosk-sm text-slate-500">
              {doc.extractedData.doctor && (
                <span><strong>{t('doctorBadge', lang)}:</strong> {doc.extractedData.doctor}</span>
              )}
              {doc.extractedData.hospital && (
                <span><strong>{t('hospitalBadge', lang)}:</strong> {doc.extractedData.hospital}</span>
              )}
              {doc.extractedData.lab && (
                <span><strong>{t('hospitalBadge', lang)}:</strong> {doc.extractedData.lab}</span>
              )}
              {doc.extractedData.date && (
                <span><strong>{t('dateBadge', lang)}:</strong> {doc.extractedData.date}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => actions.removeScannedDoc(doc.id)}
            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete document"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Prescription Content: Medications */}
        {isPrescription && doc.extractedData.medications && (
          <div className="mt-4">
            <h5 className="text-kiosk-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              {t('medications', lang)} ({doc.extractedData.medications.length})
            </h5>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-kiosk-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Medicine Name</th>
                    <th className="py-2.5 px-4 text-left">Dosage</th>
                    <th className="py-2.5 px-4 text-left">Frequency</th>
                    <th className="py-2.5 px-4 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doc.extractedData.medications.map((med, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{med.name}</td>
                      <td className="py-2.5 px-4 text-slate-700 font-medium">{med.dose}</td>
                      <td className="py-2.5 px-4 text-slate-600">{med.frequency}</td>
                      <td className="py-2.5 px-4 text-slate-500">{med.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {doc.extractedData.diagnosis && (
              <p className="mt-3 text-kiosk-sm text-slate-700">
                <strong>Diagnosis:</strong> <span className="text-primary-800 font-medium">{doc.extractedData.diagnosis}</span>
              </p>
            )}
          </div>
        )}

        {/* Lab Report Content: Tests Table */}
        {isLab && doc.extractedData.tests && (
          <div className="mt-4">
            <h5 className="text-kiosk-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <TestTube2 className="w-5 h-5 text-emerald-600" />
              {t('labValues', lang)} ({doc.extractedData.tests.length})
            </h5>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-kiosk-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 text-left">Test Parameter</th>
                    <th className="py-2.5 px-4 text-right">Measured Value</th>
                    <th className="py-2.5 px-4 text-right">Reference Range</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doc.extractedData.tests.map((test, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-medium text-slate-800">{test.name}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{test.value} {test.unit}</td>
                      <td className="py-2.5 px-4 text-right text-slate-500">{test.ref}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          test.status === 'high' ? 'bg-red-100 text-red-700 border border-red-200' :
                          test.status === 'low' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {test.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Medical History Content */}
        {isHistory && (
          <div className="mt-4 space-y-4">
            {/* Chronic Conditions */}
            {doc.extractedData.chronicConditions && (
              <div>
                <h5 className="text-kiosk-base font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-600" />
                  {t('chronicConditions', lang)}
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {doc.extractedData.chronicConditions.map((cond, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
                      <p className="font-bold text-purple-950 text-kiosk-sm">{cond.condition}</p>
                      <p className="text-xs text-purple-700">Since {cond.diagnosedYear} • {cond.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Surgeries & Allergies Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doc.extractedData.surgeries && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h6 className="text-kiosk-sm font-bold text-slate-900 mb-2">
                    {t('pastSurgeries', lang)}
                  </h6>
                  <ul className="space-y-1.5">
                    {doc.extractedData.surgeries.map((surg, idx) => (
                      <li key={idx} className="text-kiosk-sm text-slate-700 flex items-start gap-1.5">
                        <span className="text-primary-600 font-bold">•</span>
                        <div>
                          <span className="font-semibold">{surg.procedure}</span>
                          <span className="text-xs text-slate-500 block">({surg.year} - {surg.hospital})</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {doc.extractedData.allergies && (
                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                  <h6 className="text-kiosk-sm font-bold text-rose-900 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    {t('allergies', lang)}
                  </h6>
                  <ul className="space-y-1.5">
                    {doc.extractedData.allergies.map((allergy, idx) => (
                      <li key={idx} className="text-kiosk-sm text-rose-800">
                        <strong>{allergy.allergen}:</strong> {allergy.reaction}
                        <span className="ml-1.5 px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 text-xs font-bold">{allergy.severity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Family History */}
            {doc.extractedData.familyHistory && (
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                <h6 className="text-kiosk-sm font-bold text-amber-900 mb-1.5">
                  {t('familyHistory', lang)}
                </h6>
                <ul className="list-disc list-inside text-kiosk-sm text-amber-950 space-y-1">
                  {doc.extractedData.familyHistory.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {doc.extractedData.clinicalNotes && (
              <p className="text-kiosk-sm text-slate-600 italic bg-slate-100 p-3 rounded-xl">
                <strong>{t('doctorNotes', lang)}:</strong> {doc.extractedData.clinicalNotes}
              </p>
            )}
          </div>
        )}

        {/* ECG Findings */}
        {isEcg && doc.extractedData.findings && (
          <div className="mt-4 space-y-3">
            <h5 className="text-kiosk-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-600" />
              {t('clinicalFindings', lang)}
            </h5>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {doc.extractedData.findings.map((finding, idx) => (
                <li key={idx} className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 text-kiosk-sm text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  {finding}
                </li>
              ))}
            </ul>
            {doc.extractedData.interpretation && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-kiosk-sm font-medium">
                <strong>Interpretation:</strong> {doc.extractedData.interpretation}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderResults = () => (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="p-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-emerald-300">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-kiosk-xl font-bold text-slate-900">
                {t('scanComplete', lang)}
              </h3>
              <p className="text-kiosk-base text-slate-600">
                {state.scannedDocs.length} {lang === 'hi' ? 'चिकित्सा दस्तावेज़ सफलतापूर्वक डिजिटल किए गए' : 'medical documents digitized & structured'}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowResults(false)}
            leftIcon={<Plus className="w-5 h-5" />}
          >
            {t('reuploadOrAdd', lang)}
          </Button>
        </div>
      </Card>

      {/* Category Tabs */}
      {renderCategoryFilterTabs()}

      {/* Cards List */}
      <div className="space-y-6">
        {filteredResults.map(doc => renderExtractedDocCard(doc))}

        {filteredResults.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-kiosk-base text-slate-500">
              {lang === 'hi' ? 'इस श्रेणी में कोई दस्तावेज़ नहीं मिला' : 'No documents found in this category.'}
            </p>
          </div>
        )}
      </div>

      {/* Next Navigation Buttons */}
      <div className="flex flex-wrap gap-4 justify-between items-center pt-4">
        <Button 
          variant="secondary" 
          size="xl" 
          onClick={handleBack} 
          className="min-h-[64px]"
          leftIcon={<ArrowLeft className="w-6 h-6" />}
        >
          {t('backBtn', lang)}
        </Button>

        <Button 
          variant="primary" 
          size="xl" 
          onClick={handleProceedToConsultation} 
          className="min-h-[64px] px-8 shadow-lg shadow-primary-200"
          rightIcon={<ArrowRight className="w-7 h-7" aria-hidden="true" />}
        >
          {t('generateSummary', lang)}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="compact-screen min-h-screen bg-slate-50 flex flex-col">
      <ProgressBar 
        currentStep={4} 
        totalSteps={5} 
        stepLabels={lang === 'hi' 
          ? ['पहचान', 'लक्षण', 'प्रश्न', 'दस्तावेज़', 'दवाई व सलाह'] 
          : ['Identify', 'Symptom', 'Questions', 'Documents', 'Prescription']
        }
        hideOnStep={5} 
      />
      
      <main className="flex-1 flex items-start justify-center p-4 md:p-6 overflow-y-auto">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8 mt-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4 shadow-lg shadow-primary-200">
              <FileText className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-kiosk-3xl font-bold text-slate-900 mb-2">
              {t('scanTitle', lang)}
            </h1>
            <p className="text-kiosk-lg text-slate-600 max-w-2xl mx-auto">
              {t('scanSubtitle', lang)}
            </p>
          </div>

          {!showResults || state.scannedDocs.length === 0 ? (
            <>
              {renderDropZone()}
              {renderQueueList()}

              {/* Bottom Skip Bar for Patients with No Physical Papers */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  onClick={handleBack}
                  leftIcon={<ArrowLeft className="w-6 h-6" />}
                >
                  {t('backBtn', lang)}
                </Button>

                <div className="flex items-center gap-4">
                  <p className="text-kiosk-sm text-slate-500 hidden sm:block">
                    {t('skipUploadNotice', lang)}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="lg" 
                    onClick={handleSkipToConsultation}
                    className="text-primary-700 hover:text-primary-800 hover:bg-primary-50 font-bold"
                    rightIcon={<ChevronRight className="w-5 h-5" />}
                  >
                    {t('skipToConsultBtn', lang)}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            renderResults()
          )}
        </div>
      </main>
    </div>
  )
}
import { useState } from 'react'
import {
  Calendar,
  Clock,
  CheckCircle,
  Building2,
  Stethoscope,
  MapPin,
  Phone,
  Printer,
  ExternalLink,
  Navigation,
  X,
  User,
  ShieldCheck,
  AlertCircle,
  QrCode,
} from 'lucide-react'
import { getDirectionsUrl } from '../../services/locationService'

export function AppointmentBookingModal({
  isOpen,
  onClose,
  hospital,
  patientLocation,
  patientDetails,
  chiefComplaint,
  onBookingConfirmed,
  lang = 'en',
}) {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [patientPhone, setPatientPhone] = useState(patientDetails?.phone || '9876543210')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  if (!isOpen || !hospital) return null

  const handleConfirm = () => {
    if (!selectedSlot) return
    setIsSubmitting(true)

    const bookingId = `OPD-${Date.now().toString(36).toUpperCase()}`
    const bookingData = {
      bookingId,
      hospital,
      doctor: hospital.doctor[lang] || hospital.doctor.en,
      department: hospital.department[lang] || hospital.department.en,
      opdRoom: hospital.opdRoom,
      slot: selectedSlot,
      patientId: patientDetails?.abhaId || 'ABHA-9876543210',
      patientPhone,
      chiefComplaint,
      patientLocation,
      bookedAt: new Date().toLocaleString(),
      directionsUrl: getDirectionsUrl(
        patientLocation?.lat,
        patientLocation?.lon,
        hospital.lat,
        hospital.lon,
        hospital.name.en
      ),
    }

    setTimeout(() => {
      setConfirmedBooking(bookingData)
      setIsSubmitting(false)
      if (onBookingConfirmed) {
        onBookingConfirmed(bookingData)
      }
    }, 400)
  }

  const handlePrintSlip = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
              {confirmedBooking ? (
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              ) : (
                <Calendar className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <h3 className="text-kiosk-lg font-bold text-white">
                {confirmedBooking
                  ? (lang === 'hi' ? '✅ अपॉइंटमेंट कन्फर्म हो गई!' : '✅ Appointment Confirmed!')
                  : (lang === 'hi' ? 'डॉक्टर अपॉइंटमेंट बुक करें' : 'Book Doctor Appointment')}
              </h3>
              <p className="text-xs text-slate-400">
                {hospital.name[lang] || hospital.name.en} • {hospital.distance} away
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-red-500/40 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto space-y-5 py-4 pr-1 flex-1">
          {/* STATE 1: Booking Confirmed Slip */}
          {confirmedBooking ? (
            <div className="space-y-4">
              {/* Success Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-500/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                    {lang === 'hi' ? 'बुकिंग टोकन' : 'Confirmed OPD Token'}
                  </span>
                  <span className="text-kiosk-xl font-mono font-extrabold text-white">
                    {confirmedBooking.bookingId}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <QrCode className="w-7 h-7" />
                </div>
              </div>

              {/* Printable Appointment Pass Card */}
              <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3.5 text-sm">
                <div className="flex items-start justify-between pb-3 border-b border-slate-700">
                  <div>
                    <h4 className="font-bold text-white text-base">
                      {hospital.name[lang] || hospital.name.en}
                    </h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {hospital.address[lang] || hospital.address.en}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {hospital.opdRoom}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block font-semibold">{lang === 'hi' ? 'चिकित्सक' : 'Doctor'}</span>
                    <span className="text-slate-200 font-bold mt-0.5 block">{confirmedBooking.doctor}</span>
                    <span className="text-slate-400 text-[11px]">{confirmedBooking.department}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block font-semibold">{lang === 'hi' ? 'अपॉइंटमेंट समय' : 'Time Slot'}</span>
                    <span className="text-emerald-400 font-bold mt-0.5 block text-sm">{confirmedBooking.slot}</span>
                    <span className="text-slate-400 text-[11px]">Reporting: 10 mins prior</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block font-semibold">ABHA / Patient ID</span>
                    <span className="text-slate-200 font-mono font-medium mt-0.5 block">{confirmedBooking.patientId}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block font-semibold">{lang === 'hi' ? 'परामर्श शुल्क' : 'Consultation Fee'}</span>
                    <span className="text-white font-medium mt-0.5 block">{hospital.fees}</span>
                  </div>
                </div>

                {/* Patient Complaint Link */}
                <div className="p-2.5 rounded-lg bg-primary-950/40 border border-primary-800/40 text-xs flex items-center justify-between">
                  <span className="text-primary-300">
                    <strong>{lang === 'hi' ? 'संलग्न AI लक्षण:' : 'Linked Symptom Assessment:'}</strong> {chiefComplaint}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-primary-400 flex-shrink-0" />
                </div>
              </div>

              {/* Action Buttons: Directions & Print */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={confirmedBooking.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20"
                >
                  <Navigation className="w-4 h-4" />
                  <span>{lang === 'hi' ? '🗺️ गूगल मैप्स में रास्ता देखें' : '🗺️ Get Directions in Maps'}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-75" />
                </a>

                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'hi' ? '🖨️ अपॉइंटमेंट पर्ची प्रिंट करें' : '🖨️ Print Appointment Slip'}</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  {lang === 'hi' ? 'विंडो बंद करें' : 'Close and return to prescription'}
                </button>
              </div>
            </div>
          ) : (
            /* STATE 2: Booking Form (Select Slot & Confirm) */
            <div className="space-y-4">
              {/* Selected Hospital Summary Card */}
              <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-white">
                      {hospital.name[lang] || hospital.name.en}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      {hospital.address[lang] || hospital.address.en}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded-full border border-cyan-800 block">
                      {hospital.distance} • {hospital.travelTime}
                    </span>
                  </div>
                </div>

                {/* Doctor info banner */}
                <div className="mt-3 p-3 rounded-lg bg-slate-900/80 border border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{hospital.doctor[lang] || hospital.doctor.en}</p>
                      <p className="text-[11px] text-slate-400">{hospital.department[lang] || hospital.department.en}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-emerald-300 block">{hospital.opdRoom}</span>
                    <span className="text-[10px] text-slate-500">{hospital.doctorExp || '15+ yrs exp'}</span>
                  </div>
                </div>
              </div>

              {/* Slot Picker */}
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  {lang === 'hi' ? 'पसंदीदा समय स्लॉट चुनें:' : 'Select Available OPD Slot:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {hospital.slots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        selectedSlot === slot
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 scale-102'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-emerald-500/50 hover:text-white'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient Verification Details */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'hi' ? 'रोगी विवरण' : 'Patient Information'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">ABHA / Health ID</label>
                    <input
                      type="text"
                      disabled
                      value={patientDetails?.abhaId || 'ABHA-9876543210'}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">{lang === 'hi' ? 'एसएमएस के लिए फोन नंबर' : 'Phone for SMS confirmation'}</label>
                    <input
                      type="tel"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="Enter 10-digit mobile"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{lang === 'hi' ? 'परामर्श शुल्क:' : 'Consultation Fee:'} {hospital.fees}</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!selectedSlot || isSubmitting}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-kiosk-base transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedSlot && !isSubmitting
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>
                    {isSubmitting
                      ? (lang === 'hi' ? 'बुक हो रहा है...' : 'Confirming Appointment...')
                      : (lang === 'hi' ? '✅ अपॉइंटमेंट कन्फर्म करें' : '✅ Confirm Appointment Booking')}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

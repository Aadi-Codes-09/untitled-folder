# MediKiosk — Project Architecture, Features & Implementation Summary

## 📌 Overview
**MediKiosk** is an AI-powered, touch-and-voice-first smart healthcare kiosk application designed for outpatient departments (OPDs), primary healthcare centres (PHCs), and multi-speciality clinics. It streamlines patient registration with ABHA / ABDM health IDs, conducts structured clinical triage across 15 diseases, digitizes medical documents (prescriptions, lab tests, ECGs), and enables real-time geolocation-based doctor appointment booking with nearby hospitals.

---

## 🏗️ System Architecture

The project consists of two core components:

```
untitled folder/
├── backend/                  # FastAPI + SQLAlchemy + Celery + PostgreSQL
│   ├── alembic/              # Database migration scripts
│   ├── app/
│   │   ├── api/v1/           # REST endpoints (auth, conversation, documents)
│   │   ├── core/             # App configuration, security, ABDM gateway settings
│   │   ├── database/         # Async engine & session management
│   │   ├── models/domain.py  # SQLAlchemy ORM models (Patient, Session, Document, etc.)
│   │   ├── schemas/payload.py# Pydantic validation schemas
│   │   ├── services/         # LLM prompt engine & Celery OCR worker
│   │   └── main.py           # FastAPI application root & middleware
│   └── requirements.txt      # Python dependencies
│
└── medikiosk/                # React 19 + Vite + Tailwind CSS + Lucide Icons
    ├── src/
    │   ├── components/
    │   │   ├── layout/       # MainWizard, TopNavbar, LanguageSelector
    │   │   ├── kiosk/        # LocationPickerModal, AppointmentBookingModal
    │   │   ├── screens/      # Screen1Identify, Screen2SymptomPicker, Screen2Converse, Screen3Scan, Screen4Consult
    │   │   └── ui/           # Button, Card, OptionCard, ProgressBar
    │   ├── context/          # KioskContext (global state management)
    │   ├── data/             # diseaseFlows, adviceEngine, mockData (15-disease prescriptions & hospitals)
    │   ├── hooks/            # useSpeechInteraction (Web Speech API TTS/STT)
    │   └── services/         # locationService (GPS & Nominatim), hospitalService (OSM & Doctor Matching)
    ├── package.json          # Node dependencies & Vite config
    └── vite.config.js
```

---

## 📱 User Journey & Screen Workflows

### 1. Screen 1: Patient Identification & ABHA Verification (`Screen1Identify.jsx`)
- **ABHA ID & Mobile Login**: Enter 14-digit ABHA (Ayushman Bharat Health Account) or 10-digit phone number.
- **Biometric / OTP Simulation**: Fast-track demo auto-fill for quick testing.
- **Consent Gate**: DPDP / ABDM compliant consent checkbox before accessing clinical records.
- **Bilingual Interface**: Seamless 1-tap language switcher between **English** and **Hindi (हिन्दी)** with instant voice guidance.

---

### 2. Screen 2: Disease Selection & AI Clinical Interview (`Screen2SymptomPicker.jsx` & `Screen2Converse.jsx`)
- **15 Disease Categories**:
  1. 🫀 **Chest Pain** (सीने में दर्द)
  2. 🧠 **Headache** (सिरदर्द)
  3. 🌡️ **Fever** (बुखार)
  4. 🫁 **Abdominal Pain** (पेट दर्द)
  5. 💨 **Breathing Difficulty** (सांस की तकलीफ)
  6. 🦴 **Joint / Bone Pain** (जोड़ों / हड्डियों में दर्द)
  7. 🔩 **Back Pain** (पीठ / कमर दर्द)
  8. 🩸 **Diabetes Symptoms** (डायबिटीज़ के लक्षण)
  9. 💫 **Dizziness** (चक्कर आना)
  10. 🤧 **Cough** (खांसी)
  11. 🌸 **Skin Rash** (त्वचा के दाने)
  12. 👁️ **Eye Problems** (आँखों की समस्या)
  13. 💧 **Urinary Problems** (पेशाब की समस्या)
  14. 🧘 **Anxiety / Mental Health** (चिंता / मानसिक स्वास्थ्य)
  15. ⚡ **Weakness / Fatigue** (कमज़ोरी / थकान)
- **SOCRATES Structured Triage**:
  - Automatically assesses **Site, Onset, Character, Radiation, Associated Symptoms, Timing, Exacerbating Factors, and Severity (1–10 scale)**.
  - Automatic **Red Flag Detection** (e.g. nocturnal chest pain, sudden radiating pain, high fever with stiff neck, severe back pain with nerve deficit).
- **Voice-Enabled Interaction**: Questions read aloud via Text-to-Speech (TTS) and voice response capture via Speech-to-Text (STT).

---

### 3. Screen 3: Document Digitization & OCR (`Screen3Scan.jsx`)
- **Multi-Format Upload**: PDF, JPG, PNG drag-and-drop or camera capture.
- **Document Categorization**: Automatic tagging as **Prescription**, **Lab Report**, **Past Medical History**, or **ECG**.
- **Disease-Linked Prescription Stage**:
  - **Dynamic Prescription Matching**: Instead of a generic cardiology prescription, the uploaded or sample prescription is dynamically tailored to the disease selected on Screen 2 (e.g. *Zerodol-P & Myoril* for Back Pain; *Dolo 650 & Azithromycin* for Fever; *Augmentin & Ascoril-D* for Cough).
  - Condition status banner displaying the treating specialist doctor and condition emoji.

---

### 4. Screen 4: AI Digital Consultation & E-Prescription (`Screen4Consult.jsx`)
- **AI-Prescribed Medications**:
  - Medicine name, dosage, schedule (e.g. `1 tablet BD`), duration, purpose, and dietary instructions.
  - Prominent **When-to-Take Badges** (After food, Before food, Bedtime, SOS).
  - **🔊 Audio Read-Aloud**: Text-to-Speech playback for individual medications or the entire prescription in English or Hindi.
- **Clinical Triage Level Banner**:
  - **Emergency / Urgent / Routine / Self-Care** triage status with immediate action items and home-care recommendations.
- **High-Contrast Patient Summary & Clinical History**:
  - Deep-slate contrast panels for **Patient Information**, **Red Flags**, and **Interview Responses**.
  - High-visibility typography eliminating any white-on-white text issues.

---

### 5. Real-Time Patient Location & Doctor Appointment Booking

#### A. Live Location Fetch (`locationService.js` & `LocationPickerModal.jsx`)
- **Browser HTML5 Geolocation**: Detects real-time device coordinates (`latitude`, `longitude`) with high accuracy (±20m).
- **OpenStreetMap Reverse Geocoding**: Queries the Nominatim API to resolve coordinates into human-readable area, city, and PIN code.
- **Manual Location Override**: Search by 6-digit Indian PIN code or area/city (e.g. `110001`, `Saket`, `Noida`), or pick from 1-click popular healthcare hubs (AIIMS Delhi, Fortis Noida, Bandra Mumbai, Indiranagar Bangalore, etc.).
- **Live Location Status Bar**: Displays pulsating GPS beacon, current detected address, GPS refresh button, and radius filters (**3 km**, **5 km**, **10 km**, **20 km**).

#### B. Dynamic Nearby Hospital Discovery (`hospitalService.js`)
- Queries live hospitals from OpenStreetMap with a resilient offline fallback cluster.
- **Haversine Formula**: Calculates exact distances from the patient's coordinates (e.g. `1.2 km — 5 mins away`).
- **Condition-Specialized Doctor Matching**:
  - **Back Pain** $\rightarrow$ *Dr. Rajesh Kapoor, MS (Orthopaedics), Spine Specialist*
  - **Fever** $\rightarrow$ *Dr. Sunita Deshmukh, MD (Internal Medicine)*
  - **Chest Pain** $\rightarrow$ *Dr. R.K. Sharma, MD, DM (Cardiology)*
  - **Cough & Respiratory** $\rightarrow$ *Dr. Vivek Malhotra / Dr. Alok Srivastava (Pulmonology)*
  - **Headache** $\rightarrow$ *Dr. K.V. Ramanathan, MD, DM (Neurology)*
  - **Abdominal Pain** $\rightarrow$ *Dr. Pradeep Bansal, MD, DM (Gastroenterology)*
  - **Diabetes** $\rightarrow$ *Dr. Neha Aggarwal, MD, DM (Endocrinology)*
  - **Joint Pain** $\rightarrow$ *Dr. Ananya Sen, MD (Rheumatology)*
  - **Skin Rash** $\rightarrow$ *Dr. Pallavi Mukherjee, MD (Dermatology)*
  - **Eye Problems** $\rightarrow$ *Dr. Sanjay Bhardwaj, MS (Ophthalmology)*
  - **Urinary Problems** $\rightarrow$ *Dr. Tarun Mishra, MCh (Urology)*

#### C. Appointment Booking Modal & Token Pass (`AppointmentBookingModal.jsx`)
- **Doctor & OPD Room Profile**: Qualifications, experience, OPD department, room number, and consultation fee (with Ayushman PM-JAY / ABDM cashless badges).
- **Slot Picker**: Interactive time slots for Today & Tomorrow (Morning, Afternoon, Evening).
- **Confirmed OPD Pass**:
  - Unique Booking ID (e.g. `OPD-XXXXXXXX`).
  - **🗺️ Get Directions in Google Maps**: Direct routing button from patient's live coordinates to the hospital.
  - **🖨️ Print Appointment Slip**: Dedicated printable token pass.
  - **Voice Confirmation**: Bilingual audio announcement upon booking confirmation.

---

## 💊 Comprehensive 15-Disease Prescription Matrix

| Condition | Specialist Doctor | Diagnosis | Key Prescribed Medications |
|---|---|---|---|
| **Back Pain (🔩)** | Dr. Rajesh Kapoor (MS Ortho, Spine) | Acute Lumbo-sacral Strain & L4-L5 Spasm | Zerodol-P, Myoril (Thiocolchicoside), Pan-40, Pregabalin |
| **Fever (🌡️)** | Dr. Sunita Deshmukh (MD Medicine) | Acute Viral Pyrexia & Body Ache | Dolo 650, Azithral (Azithromycin 500mg), Electral ORS, Limcee |
| **Cough (🤧)** | Dr. Alok Srivastava (DNB Pulm) | Acute Bronchitis & Spasmodic Cough | Augmentin 625mg, Ascoril-D Syrup, Montair-LC, Karvol Inhalation |
| **Headache (🧠)** | Dr. K.V. Ramanathan (MD DM Neuro) | Migraine without Aura & Tension Cephalea | Napra-D (Naproxen + Domperidone), Ciplar-LA, Sibelium, Magnesium |
| **Abdominal Pain (🫁)** | Dr. Pradeep Bansal (MD DM Gastro) | Acid Peptic Disease & Dyspeptic Gastritis | Razo-L (Rabeprazole + Levosulpiride), Drotin-DS, Sucrafil, Econorm |
| **Breathing (💨)** | Dr. Vivek Malhotra (MD Chest) | Bronchial Asthma & Acute Wheeze | Foracort 200 Inhaler, Asthalin Inhaler, Monticope, Deriphyllin |
| **Chest Pain (🫀)** | Dr. R.K. Sharma (MD DM Cardio) | Hypertension Stage II & Anginal Equivalence | Amlodipine 5mg, Atorvastatin 10mg, Aspirin 75mg, Pan-40 |
| **Diabetes (🩸)** | Dr. Neha Aggarwal (MD DM Endo) | Type 2 Diabetes Mellitus (HbA1c 7.9%) | Glycomet-SR 500mg, Amaryl 1mg, Galvus 50mg, Neurobion Forte |
| **Joint Pain (🦴)** | Dr. Ananya Sen (MD Rheum) | Osteoarthritis Knees & Arthralgia | Nucoxia 90mg (Etoricoxib), Cartigen Forte, Calcirol, Volini Gel |
| **Dizziness (💫)** | Dr. Mohit Saxena (MS ENT) | BPPV & Vestibular Dysregulation | Vertin 16mg (Betahistine), Stugeron 25mg, Emeset 4mg, Ginkocer |
| **Skin Rash (🌸)** | Dr. Pallavi Mukherjee (MD Derm) | Allergic Contact Dermatitis & Urticaria | Allegra 180mg (Fexofenadine), Atarax 25mg, Momate Cream, Calamine |
| **Eye Problems (👁️)** | Dr. Sanjay Bhardwaj (MS Ophth) | Bacterial Conjunctivitis & Dry Eye | Moxicip Eye Drops, Refresh Tears, Nevanac Eye Drops, Warm Compress |
| **Urinary (💧)** | Dr. Tarun Mishra (MCh Urology) | Acute Lower UTI & Dysuria | Martifur-SR 100mg (Nitrofurantoin), Alkasol Syrup, Urispas, Cranfit |
| **Mental Health (🧘)**| Dr. Devika Nayar (MD Psych) | Acute Stress Anxiety & Insomnia | Nexito 10mg (Escitalopram), Clonafit 0.25mg, Ciplar 20mg, Melatonin |
| **Fatigue (⚡)** | Dr. R.C. Choudhury (MD Medicine) | Chronic Fatigue & Microcytic Anemia | Orofer-XT (Iron + Folic acid), Neurobion D, Calcirol 60k, CoQ10 |

---

## 🛠️ How to Run Locally

### 1. Frontend (MediKiosk React App)
```bash
cd medikiosk
npm install
npm run dev
```
- **Local URL**: `http://localhost:5173/`
- **Build & Validate**: `npm run build`

### 2. Backend (FastAPI Server)
```bash
cd backend
source venv/bin/activate  # or python3 -m venv venv
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **API URL**: `http://localhost:8000/`
- **Swagger Docs**: `http://localhost:8000/docs`

---

## 🔒 Standards & Compliance
- **ABDM / ABHA Standards**: Health ID validation, FHIR-compliant record structuring.
- **Data Privacy**: No medical documents are persisted without patient consent.
- **Accessibility**: Multi-lingual interface, voice prompts, high contrast dark theme, and touch-optimized buttons for kiosk hardware.

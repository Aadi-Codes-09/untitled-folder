# 🏥 MediKiosk — Comprehensive Project Documentation

> **AI-Powered Smart Healthcare Kiosk for Outpatient Departments (OPDs), Primary Health Centres (PHCs), & Multi-Speciality Clinics**  
> *Touch-First | Voice-Enabled (Bilingual: English & हिन्दी) | Real-Time Geolocation & Doctor Booking | Dynamic 15-Disease Prescriptions | ABDM & FHIR R4 Compliant*

---

## 📋 Table of Contents
1. [Project Overview & Purpose](#-project-overview--purpose)
2. [Key Milestones & What Was Done](#-key-milestones--what-was-done)
3. [System Architecture](#-system-architecture)
4. [Detailed Screen Workflows](#-detailed-screen-workflows)
   - [Screen 1: Patient Identification & ABHA Verification](#1-screen-1-patient-identification--abha-verification)
   - [Screen 2: 15-Disease Clinical Interview (SOCRATES)](#2-screen-2-15-disease-clinical-interview-socrates)
   - [Screen 3: Disease-Specific Document Digitization & Prescriptions](#3-screen-3-disease-specific-document-digitization--prescriptions)
   - [Screen 4: Clinical Consultation, Triage & High-Contrast Cards](#4-screen-4-clinical-consultation-triage--high-contrast-cards)
   - [Real-Time Location & Nearby Hospital Doctor Booking](#5-real-time-location--nearby-hospital-doctor-booking)
5. [Complete 15-Disease Clinical & Prescription Matrix](#-complete-15-disease-clinical--prescription-matrix)
6. [Backend Services & Healthcare Standards](#-backend-services--healthcare-standards)
7. [Directory Structure](#-directory-structure)
8. [How to Run Locally](#-how-to-run-locally)
9. [Standards, Security & Compliance](#-standards-security--compliance)

---

## 🌟 Project Overview & Purpose

**MediKiosk** is a next-generation smart healthcare kiosk designed to bridge the doctor-patient gap in busy Indian hospital OPDs and rural/semi-urban PHCs. 

Patients often wait hours in queues without pre-triage or organized medical records. MediKiosk empowers patients to:
1. **Self-register** using their Ayushman Bharat Health Account (**ABHA / ABDM**) or phone number.
2. Undergo a structured **AI-guided clinical interview** in **Hindi** or **English** using voice or touch across **15 primary medical conditions**.
3. **Digitize past medical records** (prescriptions, lab tests, ECGs) with automatic categorization and OCR.
4. View an instant **AI triage report and clinical summary** with text-to-speech voice playback.
5. **Automatically detect patient geolocation** and discover top nearby hospitals within their exact vicinity to **book a confirmed OPD appointment** with a specialist doctor matched to their specific illness.

---

## 🚀 Key Milestones & What Was Done

Here is a summary of the major engineering implementations completed across the entire project:

| Feature / Milestone | What Was Implemented |
|---|---|
| **1. Real-Time Geolocation Fetch** | Integrated HTML5 browser Geolocation (`navigator.geolocation`) with OpenStreetMap **Nominatim reverse geocoding** to fetch exact patient coordinates, area name, and PIN code. Includes manual 6-digit PIN/city search and 1-click popular healthcare hubs. |
| **2. Live Nearby Hospital Discovery & Booking** | Built `hospitalService.js` to query hospitals near patient coordinates, calculate real-time Haversine distance/travel times, match doctors by condition specialty, and enable 1-click slot booking with OPD room allocation, token IDs, Google Maps directions, and printable appointment slips. |
| **3. Condition-Specific Prescriptions** | Replaced the generic single cardiology prescription with a dynamic **15-disease prescription engine** in `mockData.js` and `Screen3Scan.jsx`. Selecting any disease (e.g. Back Pain, Fever, Cough, Diabetes) automatically loads treating specialist doctor details and condition-tailored medications. |
| **4. High-Contrast UI & Color Visibility Fix** | Fixed low-contrast white-on-white text issues in `Screen4Consult.jsx`. Replaced standard white containers with high-contrast `bg-slate-800/90` and `bg-rose-950/40` glassmorphic cards with crisp emerald and cyan accents. |
| **5. Bilingual Voice & Touch Interface** | Web Speech API integration (`useSpeechInteraction.js`) supporting natural bilingual Text-to-Speech (TTS) and Speech-to-Text (STT) for illiterate or elderly patients in both English and Hindi. |
| **6. SOCRATES Clinical Triage Protocol** | Automated clinical interview covering Site, Onset, Character, Radiation, Associated symptoms, Timing, Exacerbating factors, and Severity (1–10) with automatic **Red Flag Detection** (e.g. radiating chest pain, severe neuro deficits). |
| **7. Production FastAPI Backend** | Async SQLAlchemy 2.0 ORM, Alembic migrations, Celery + Redis background OCR workers, LangChain clinical prompt pipelines, and FHIR R4 Bundle generation. |

---

## 🏗️ System Architecture

```
                                    +-----------------------------------------+
                                    |        MediKiosk Frontend (React 19)    |
                                    |     Vite + Tailwind CSS + Lucide Icons  |
                                    +--------------------+--------------------+
                                                         |
                 +---------------------------------------+---------------------------------------+
                 |                                       |                                       |
                 v                                       v                                       v
   +---------------------------+           +---------------------------+           +---------------------------+
   |   KioskContext State      |           |     Web Speech Engine     |           | Location & Hospital Svcs  |
   | - ABHA Patient Session    |           | - Text-to-Speech (TTS)    |           | - HTML5 Geolocation       |
   | - Selected Condition      |           | - Speech-to-Text (STT)    |           | - OSM Nominatim Geocode   |
   | - Dynamic Prescriptions   |           | - Bilingual (EN / HI)     |           | - Haversine Distance Calc |
   | - Active Appointment      |           +---------------------------+           | - Doctor Specialty Match  |
   +-------------+-------------+                                                   +-------------+-------------+
                 |                                                                               |
                 +---------------------------------------+---------------------------------------+
                                                         |
                                                         v
                                    +--------------------+--------------------+
                                    |        FastAPI Backend (Python 3.11)    |
                                    |    REST API (ABHA, Clinical, Documents) |
                                    +--------------------+--------------------+
                                                         |
                         +-------------------------------+-------------------------------+
                         |                               |                               |
                         v                               v                               v
            +-------------------------+     +-------------------------+     +-------------------------+
            |  PostgreSQL Database    |     |  Celery + Redis Worker  |     |   LangChain & FHIR R4   |
            |  SQLAlchemy 2.0 Async   |     |  OCR & Image Processing |     |  ABDM Interoperability  |
            |  Alembic Migrations     |     |  Document Extraction    |     |  Clinical Summaries     |
            +-------------------------+     +-------------------------+     +-------------------------+
```

---

## 📱 Detailed Screen Workflows

### 1. Screen 1: Patient Identification & ABHA Verification
- **ABHA ID / Mobile Login**: 14-digit ABHA ID (`91-XXXX-XXXX-XXXX`) or 10-digit mobile number input with interactive touch keypad.
- **Biometric / OTP Simulation**: Instant 1-tap demo bypass for rapid kiosk evaluation.
- **DPDP & ABDM Consent Gate**: Mandatory explicit consent checkbox before accessing or digitizing medical records.
- **Bilingual Switcher**: Instant 1-tap toggling between **English** and **हिन्दी (Hindi)** with voice guidance.

### 2. Screen 2: 15-Disease Clinical Interview (SOCRATES)
- **15 Primary Disease Categories**:
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
- **Adaptive SOCRATES Questions**: Explores Site, Onset, Character, Radiation, Associations, Timing, Exacerbating factors, and Severity (1–10).
- **Red Flag Interception**: Flags high-risk symptoms immediately (e.g., chest pain with left arm radiation, high fever with stiff neck, severe back pain with urinary retention).
- **Voice Response (STT)**: Microphone button allowing patients to speak their symptoms naturally.

### 3. Screen 3: Disease-Specific Document Digitization & Prescriptions
- **Multi-Format Upload**: Drag-and-drop or camera capture for physical prescriptions, lab results, past medical summaries, and ECG strips.
- **Condition-Linked Dynamic Prescription**:
  - Automatically reads the disease selected on Screen 2.
  - Generates realistic, specialized clinical prescriptions matching that exact condition (e.g. *Zerodol-P & Myoril* for Back Pain; *Dolo 650 & Azithromycin* for Fever; *Augmentin 625 & Ascoril-D* for Cough).
  - Displays doctor details, registration numbers, clinic hospital, and full medication dosages.

### 4. Screen 4: Clinical Consultation, Triage & High-Contrast Cards
- **AI-Prescribed Medications Table**: Clear dosages, schedules (`1 tablet BD`), duration, and dietary directions (After Food, Bedtime, SOS).
- **🔊 Audio Read-Aloud**: Text-to-Speech playback of instructions in English or Hindi.
- **Triage Level**: Emergency (Red), Urgent (Amber), Routine (Green), Self-Care (Blue).
- **High-Contrast Dark Theme Panels**:
  - `bg-slate-800/90` patient details and interview answers.
  - `bg-rose-950/40` red flag alerts with glowing badges.
  - Eliminates all white-on-white text issues.

### 5. Real-Time Location & Nearby Hospital Doctor Booking
- **Live Location Status Bar**:
  - Real-time GPS coordinates via browser Geolocation.
  - OpenStreetMap Nominatim reverse geocoding to Indian area and PIN code.
  - Radius filter chips (**3 km**, **5 km**, **10 km**, **20 km**).
- **Location Picker Modal**:
  - Search by 6-digit Indian PIN code or area/city (e.g. *Saket*, *Noida*, *110001*).
  - 1-click popular healthcare hubs (AIIMS Delhi, Fortis Noida, Apollo Chennai, etc.).
- **Dynamic Nearby Hospital Discovery**:
  - Real-time Haversine distance calculation (e.g. `1.2 km — 5 mins away`).
  - Condition-specialist doctor matching (e.g. Back Pain $\rightarrow$ Spine Specialist; Fever $\rightarrow$ Internal Medicine).
- **Appointment Booking Modal & Pass**:
  - Slot selection for Today / Tomorrow (Morning, Afternoon, Evening).
  - OPD room number, doctor fee, Ayushman PM-JAY / ABDM cashless badges.
  - Confirmed OPD Pass with unique Token ID (`OPD-XXXXXXXX`).
  - **🗺️ Google Maps Live Directions**: One-click link calculating route from patient's live GPS coordinates to hospital.
  - **🖨️ Print Appointment Slip**: Kiosk thermal printer layout.

---

## 💊 Complete 15-Disease Clinical & Prescription Matrix

| Condition | Specialist Doctor & Department | Diagnosis | Prescribed Medications |
|---|---|---|---|
| **Back Pain (🔩)** | Dr. Rajesh Kapoor, MS Ortho (Spine) | Acute Lumbo-sacral Strain & L4-L5 Spasm | Zerodol-P, Myoril 4mg, Pan-40, Pregabalin 75mg |
| **Fever (🌡️)** | Dr. Sunita Deshmukh, MD (Internal Medicine) | Acute Viral Pyrexia & Body Ache | Dolo 650, Azithral 500mg, Electral ORS, Limcee 500mg |
| **Cough (🤧)** | Dr. Alok Srivastava, DNB (Pulmonology) | Acute Bronchitis & Spasmodic Cough | Augmentin 625mg, Ascoril-D, Montair-LC, Karvol Inhalation |
| **Headache (🧠)** | Dr. K.V. Ramanathan, MD, DM (Neurology) | Migraine without Aura & Tension Cephalea | Napra-D 500, Ciplar-LA 20, Sibelium 5mg, Magnesium 400mg |
| **Abdominal Pain (🫁)** | Dr. Pradeep Bansal, MD, DM (Gastro) | Acid Peptic Disease & Dyspeptic Gastritis | Razo-L, Drotin-DS, Sucrafil O Suspension, Econorm Sachet |
| **Breathing (💨)** | Dr. Vivek Malhotra, MD (Chest Specialist) | Bronchial Asthma & Acute Wheeze | Foracort 200 Inhaler, Asthalin Inhaler, Monticope, Deriphyllin |
| **Chest Pain (🫀)** | Dr. R.K. Sharma, MD, DM (Cardiology) | Hypertension Stage II & Anginal Equivalence | Amlodipine 5mg, Atorvastatin 10mg, Ecosprin 75mg, Pan-40 |
| **Diabetes (🩸)** | Dr. Neha Aggarwal, MD, DM (Endocrinology) | Type 2 Diabetes Mellitus (HbA1c 7.9%) | Glycomet-SR 500mg, Amaryl 1mg, Galvus 50mg, Neurobion Forte |
| **Joint Pain (🦴)** | Dr. Ananya Sen, MD (Rheumatology) | Osteoarthritis Bilateral Knees & Arthralgia | Nucoxia 90mg, Cartigen Forte, Calcirol 60k, Volini Gel |
| **Dizziness (💫)** | Dr. Mohit Saxena, MS (ENT / Vestibular) | BPPV & Vestibular Dysregulation | Vertin 16mg, Stugeron 25mg, Emeset 4mg, Ginkocer 40mg |
| **Skin Rash (🌸)** | Dr. Pallavi Mukherjee, MD (Dermatology) | Allergic Contact Dermatitis & Urticaria | Allegra 180mg, Atarax 25mg, Momate Cream, Calamine Lotion |
| **Eye Problems (👁️)** | Dr. Sanjay Bhardwaj, MS (Ophthalmology) | Bacterial Conjunctivitis & Dry Eye Syndrome | Moxicip Eye Drops, Refresh Tears, Nevanac Eye Drops |
| **Urinary (💧)** | Dr. Tarun Mishra, MCh (Urology) | Acute Lower UTI & Dysuria | Martifur-SR 100mg, Alkasol Syrup, Urispas 200mg, Cranfit |
| **Mental Health (🧘)**| Dr. Devika Nayar, MD (Psychiatry) | Acute Generalized Anxiety & Insomnia | Nexito 10mg, Clonafit 0.25mg, Ciplar 20mg, Melatonin 3mg |
| **Fatigue (⚡)** | Dr. R.C. Choudhury, MD (Internal Medicine) | Chronic Fatigue Syndrome & Anemia | Orofer-XT, Neurobion D, Calcirol 60k, CoQ10 100mg |

---

## ⚙️ Backend Services & Healthcare Standards

- **FastAPI Framework**: Async high-throughput REST API with Pydantic v2 data schemas.
- **SQLAlchemy 2.0 Async Engine**: Connected to PostgreSQL with connection pooling.
- **Alembic Database Migrations**: Version-controlled migrations in `backend/alembic/`.
- **Celery + Redis Task Queue**: Asynchronous processing pipeline for document OCR and text parsing.
- **LangChain AI Pipeline**: Structured medical extraction generating clinical intake summaries.
- **FHIR R4 Bundles**: Automatically constructs compliant `Bundle`, `Patient`, `Condition`, `Encounter`, and `Observation` resources ready for Ayushman Bharat Digital Mission (ABDM) gateways.

---

## 📂 Directory Structure

```
untitled folder/
├── README.md                      # Complete project documentation (this file)
├── PROJECT_OVERVIEW.md            # Architecture & clinical reference document
│
├── backend/                       # Python FastAPI backend
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt           # fastapi, sqlalchemy, celery, redis, pydantic, langchain
│   ├── alembic/                   # DB migrations
│   │   ├── env.py
│   │   └── versions/
│   └── app/
│       ├── main.py                # App entrypoint & CORS middleware
│       ├── core/config.py         # App & ABDM settings
│       ├── api/v1/                # Auth, conversation, and document endpoints
│       ├── models/domain.py       # Patient, Session, Document, Triage ORM models
│       ├── schemas/payload.py     # Request/response validation schemas
│       ├── services/              # LLM service, Celery OCR worker, FHIR builder
│       └── database/session.py    # Async DB session factory
│
└── medikiosk/                     # React 19 Touch Kiosk application
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx                # Root router & layout wrapper
        ├── context/
        │   └── KioskContext.jsx   # Global state: ABHA, condition, location, appointment
        ├── services/
        │   ├── locationService.js # HTML5 GPS, Nominatim geocoding & Haversine distance
        │   └── hospitalService.js # OSM hospital query & doctor specialty matching
        ├── components/
        │   ├── layout/            # MainWizard, TopNavbar, LanguageSelector
        │   ├── kiosk/
        │   │   ├── LocationPickerModal.jsx     # GPS/PIN location selector modal
        │   │   └── AppointmentBookingModal.jsx # Doctor slot picker & OPD token pass
        │   ├── screens/
        │   │   ├── Screen1Identify.jsx         # ABHA / mobile authentication
        │   │   ├── Screen2SymptomPicker.jsx    # 15 disease selection grid
        │   │   ├── Screen2Converse.jsx         # Voice/touch SOCRATES interview
        │   │   ├── Screen3Scan.jsx             # Disease-specific prescription & OCR
        │   │   └── Screen4Consult.jsx          # AI consultation & hospital booking
        │   └── ui/                             # Touch-optimized buttons, cards, progress bars
        ├── data/
        │   ├── mockData.js        # 15-disease prescription dictionary & hospital database
        │   ├── diseaseFlows.js    # SOCRATES clinical question decision trees
        │   └── adviceEngine.js    # Triage decision rules & home-care advice
        └── hooks/
            └── useSpeechInteraction.js # Web Speech API (TTS and STT)
```

---

## 💻 How to Run Locally

### 1. Run the Frontend Kiosk (React + Vite)
```bash
cd medikiosk
npm install
npm run dev
```
- Open browser at **`http://localhost:5173/`**
- To test a production build: `npm run build`

### 2. Run the Backend API (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive Swagger API docs: **`http://localhost:8000/docs`**

### 3. Run with Docker Compose (Full Stack)
```bash
cd backend
docker-compose up --build -d
```
This launches FastAPI, PostgreSQL database, Redis instance, and Celery OCR worker simultaneously.

---

## 🔒 Standards, Security & Compliance

- **ABDM & ABHA Compliant**: Supports 14-digit ABHA validation, M1/M2/M3 ABDM milestones, and DPDP-compliant consent capture.
- **FHIR R4 Standard**: Produces valid HL7 FHIR R4 clinical bundles.
- **Privacy First**: No patient medical files or biometric scans are persisted without cryptographically logged consent.
- **Hardware Agnostic**: Optimized for 1080p and 4K touch kiosks, standard tablets, and desktop workstations.

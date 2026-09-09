# MediKiosk — Frontend Stack (What I Used)

> Touch-first, bilingual (English / हिन्दी) kiosk UI for patient registration,
> AI clinical interviews, document digitization, prescriptions and hospital booking.

## Core Framework & Build

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2.8 | UI library — components, hooks (`useState`, `useMemo`, `useReducer`) |
| **React DOM** | 19.2.8 | Browser rendering |
| **Vite** | 8.2.2 | Dev server (HMR) + production bundler |
| **@vitejs/plugin-react** | 6.1.0 | React fast-refresh + JSX transform for Vite |

## Styling & Icons

| Technology | Version | Purpose |
|---|---|---|
| **Tailwind CSS** | 4.3.3 (+ `@tailwindcss/postcss`) | Utility-first styling (`@import "tailwindcss"` in `src/index.css`) |
| **PostCSS + Autoprefixer** | 8.5.28 / 10.5.5 | CSS processing under Vite |
| **lucide-react** | 1.41.0 | All icons (Home, Mic, MapPin, Calendar, Stethoscope…) |
| **Google Font: Inter** | 400–800 | Kiosk typeface (linked in `index.html`) |

Custom kiosk design system lives in `src/index.css`: large touch targets
(`min-h-touch` 48/64/80px), kiosk font scale (`text-kiosk-xs`…`text-kiosk-3xl`),
`.btn-kiosk`, `.card-kiosk`, `.option-card`, mic/progress animations,
and a `.compact-screen` mode that steps fonts down one size on the
Questions / Documents / Prescription screens.

## State, Data & Logic (no backend connected yet)

| Piece | Implementation |
|---|---|
| Global state | React Context + `useReducer` (`src/context/KioskContext.jsx`) — step, language, patient, location, appointment, condition, interview answers, scanned docs |
| Navigation | Step machine in `src/components/layout/MainWizard.jsx` — `0` Dashboard, `1` Login, `2–5` wizard; no router library |
| Clinical content | Plain JS modules — `src/data/diseaseFlows.js` (41 conditions, 14 categories, 30+ interview flows), `src/data/mockData.js` (41 tailored prescriptions), `src/data/adviceEngine.js` (triage + bilingual medication cards) |
| Lint | `oxlint` (`npm run lint`) |

## Browser & External Services (all client-side)

| API | Use |
|---|---|
| **Web Speech API** — SpeechSynthesis + SpeechRecognition (`src/hooks/useSpeechInteraction.js`) | Bilingual TTS greetings/instructions, STT symptom answers (English + हिन्दी) |
| **HTML5 Geolocation** (`navigator.geolocation`) | Live patient GPS coordinates |
| **OpenStreetMap Nominatim API** (`src/services/locationService.js`) | Reverse-geocode GPS → area/city/PIN; PIN & place search |
| **Haversine formula** (`locationService.js` + `hospitalService.js`) | Real hospital distance + travel-time calculation |
| **Google Maps directions URL** | One-tap route from patient GPS to hospital |

## Project Map (`medikiosk/`)

```
index.html                  # Title, Inter font, kiosk viewport meta
vite.config.js              # Dev/preview server: 0.0.0.0:5173
src/
├── App.jsx / main.jsx      # Root + KioskProvider wrapper
├── index.css               # Tailwind + kiosk design system
├── context/KioskContext.jsx
├── components/
│   ├── dashboard/          # PatientDashboard, MediBotAvatar
│   ├── screens/            # Screen1Identify (login) … Screen4Consult
│   ├── kiosk/              # LocationPickerModal, AppointmentBookingModal
│   ├── layout/             # MainWizard (step router + Home button)
│   └── ui/                 # Button, Card, Input, ProgressBar
├── data/                   # diseaseFlows, mockData, adviceEngine
├── hooks/                  # useSpeechInteraction
└── services/               # locationService, hospitalService
```

## Run

```bash
cd medikiosk
npm install
npm run host      # network kiosk mode → http://localhost:5173/
npm run build     # production build → dist/
npm run lint      # oxlint
```

## Key Points for Viva / Docs

- **No UI framework** (no MUI/Bootstrap) — hand-built Tailwind kiosk system.
- **No router / Redux / Axios** — step state-machine + Context; all data is local mock data; backend integration is a TODO.
- **Backend-dependent features are simulated**: ABHA login, OCR extraction and prescriptions run fully offline in the browser.

# MediKiosk Backend

Production-ready FastAPI backend for the MediKiosk AI-powered clinical history-taking and document digitization platform.

## Architecture

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy 2.0 (async) + Alembic migrations
- **Task Queue**: Celery + Redis for background OCR/LLM processing
- **AI Orchestration**: LangChain for structured LLM outputs
- **Healthcare Standards**: FHIR R4 bundle generation, ABDM integration ready
- **Containerization**: Docker & Docker Compose

## Project Structure

```
backend/
├── docker-compose.yml          # Full stack: API, PostgreSQL, Redis, Celery worker/beat
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Multi-stage build
├── .env.example               # Environment variables template
├── alembic/                   # Database migrations
│   ├── env.py
│   ├── alembic.ini
│   └── versions/
│       └── 001_initial_schema.py
└── app/
    ├── main.py                # FastAPI app entry point
    ├── core/
    │   ├── config.py          # Pydantic Settings (env-based config)
    │   └── celery_app.py      # Celery configuration
    ├── api/v1/
    │   ├── auth.py            # ABDM/ABHA auth, patient registration
    │   ├── conversation.py    # SOCRATES clinical intake flow
    │   └── documents.py       # Document upload, OCR, FHIR bundle
    ├── models/
    │   └── domain.py          # SQLAlchemy models
    ├── schemas/
    │   └── payload.py         # Pydantic V2 request/response models
    ├── services/
    │   ├── llm_service.py     # LangChain SOCRATES extraction & summary
    │   ├── ocr_worker.py      # Celery tasks for OCR & entity extraction
    │   └── fhir_service.py    # FHIR R4 Bundle generation
    └── database/
        └── session.py         # Async DB engine & session management
```

## Quick Start

### 1. Environment Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your values (especially OPENAI_API_KEY, ABDM credentials)
```

### 2. Using Docker Compose (Recommended)

```bash
docker-compose up -d --build
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **FastAPI** on port 8000 (http://localhost:8000)
- **Celery Worker** (OCR queue)
- **Celery Beat** (scheduled tasks)

### 3. Local Development (without Docker)

```bash
# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL & Redis locally
# Update .env with local connection strings

# Run migrations
alembic upgrade head

# Start API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start Celery worker (separate terminal)
celery -A app.core.celery_app worker --loglevel=info --concurrency=4
```

## API Endpoints

### Authentication & Patients
```
POST   /api/v1/auth/patients              # Create/get patient (ABHA/Aadhaar/Phone)
GET    /api/v1/auth/patients/{patient_id} # Get patient details
POST   /api/v1/auth/abdm/auth/initiate    # Initiate ABDM auth
POST   /api/v1/auth/abdm/auth/callback    # ABDM callback
POST   /api/v1/auth/patients/{id}/consent # Update consent
```

### Clinical Conversation (SOCRATES)
```
POST   /api/v1/conversation/sessions                    # Start new session
GET    /api/v1/conversation/sessions/{session_id}       # Get session status
GET    /api/v1/conversation/sessions/{id}/questions/{idx} # Get question by index
POST   /api/v1/conversation/sessions/{id}/answers       # Submit answer (touch/voice)
GET    /api/v1/conversation/sessions/{id}/responses     # Get all responses
GET    /api/v1/conversation/sessions/{id}/summary       # Get clinical summary
POST   /api/v1/conversation/sessions/{id}/complete      # Complete & trigger summary gen
```

### Document Management
```
POST   /api/v1/documents/initiate-upload        # Get presigned upload URL
POST   /api/v1/documents/{doc_id}/upload        # Upload file (multipart)
GET    /api/v1/documents/{doc_id}               # Get document status & OCR results
GET    /api/v1/patients/{patient_id}/documents  # List patient documents
GET    /api/v1/sessions/{session_id}/documents  # List session documents
POST   /api/v1/documents/{doc_id}/reprocess     # Re-trigger OCR
GET    /api/v1/sessions/{session_id}/fhir-bundle # Get ABDM-compliant FHIR bundle
```

## Key Features

### 1. SOCRATES Clinical Intake
- 10 structured questions covering Site, Onset, Character, Radiation, Associated, Timing, Exacerbating, Relieving, Severity, History
- Red-flag detection (auto-flags emergency conditions)
- Bilingual support (English/Hindi)
- Voice + Touch input methods

### 2. Async Document Processing
- Upload → OCR (Tesseract + PyMuPDF fallback) → LLM Entity Extraction
- Extracts: Medications, Lab values, Diagnoses, Vitals, Procedures, Allergies
- Celery background tasks prevent UI blocking
- Status polling via REST API

### 3. FHIR R4 Compliance
- Generates `Bundle` type `document` with `Composition` (LOINC 34133-9)
- Includes: Patient, Encounter, Conditions, MedicationStatements, Observations
- Validates against FHIR structure
- Ready for ABDM integration

### 4. ABDM Integration Ready
- ABHA ID verification flow
- Consent management (ABDM compliant)
- Token exchange callbacks
- Audit logging for all PHI access

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for LLM | Yes (for AI features) |
| `POSTGRES_*` | Database connection | Yes |
| `REDIS_*` | Redis/Celery connection | Yes |
| `ABDM_CLIENT_ID/SECRET` | ABDM gateway credentials | For production |
| `SECRET_KEY` | JWT signing key | Yes |
| `TESSERACT_CMD` | Path to tesseract binary | Auto in Docker |

## Testing

```bash
# Run tests
pytest tests/ -v

# Check API health
curl http://localhost:8000/health
```

## Production Deployment

1. Set `DEBUG=false` in `.env`
2. Use strong `SECRET_KEY` (32+ chars)
3. Configure proper ABDM credentials
4. Use managed PostgreSQL (RDS/Cloud SQL) and Redis (ElastiCache)
5. Run Celery workers on separate instances
6. Enable HTTPS with reverse proxy (nginx/Traefik)
7. Set up monitoring (Prometheus/Grafana) and logging (ELK/Datadog)

## TODO: Backend Integration Points

- `// TODO: BACKEND INTEGRATION` - FastAPI endpoints replace mock data
- `// TODO: ABDM INTEGRATION` - Real ABHA verification & token exchange
- `// TODO: FHIR SERVER` - Push bundles to ABDM FHIR repository
- `// TODO: NOTIFICATIONS` - Webhook/email/SMS for emergency alerts
- `// TODO: ANALYTICS` - Session metrics, red-flag rates, processing times

## License

MIT License - Built for Smart India Hackathon 2024
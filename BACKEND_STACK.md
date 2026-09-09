# MediKiosk — Backend Stack (What I Used)

> Async Python API for ABHA patient auth, SOCRATES clinical sessions,
> OCR document pipeline and FHIR R4 bundles for ABDM.
> Full endpoint/API reference lives in `backend/README.md` — this file is the stack summary.

## Core Framework

| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | 0.111.0 | Async REST API, auto Swagger docs at `/docs` |
| **Uvicorn** (standard) | 0.30.1 | ASGI server (`uvicorn app.main:app --port 8000`) |
| **Pydantic v2 + pydantic-settings** | 2.7.4 / 2.3.4 | Request/response schemas + env-based config |
| **python-multipart** | 0.0.9 | File-upload (document) endpoints |
| **Python** | 3.11+ | Runtime |

## Database & Migrations

| Technology | Version | Purpose |
|---|---|---|
| **PostgreSQL** (via `asyncpg` 0.29.0) | — | Primary store: patients, sessions, documents, triage |
| **SQLAlchemy** | 2.0.30 | Async ORM (`app/models/domain.py`, pooled engine in `app/database/session.py`) |
| **Alembic** | 1.13.1 | Versioned DB migrations (`backend/alembic/`) |

## Background Jobs

| Technology | Version | Purpose |
|---|---|---|
| **Celery** | 5.4.0 | OCR + LLM extraction off the request path (no UI blocking) |
| **Redis** | 5.0.1 | Broker + result backend for Celery |

## AI / LLM Pipeline

| Technology | Version | Purpose |
|---|---|---|
| **LangChain + langchain-core** | 0.2.16 / 0.2.38 | Structured SOCRATES extraction & clinical summaries (`app/services/llm_service.py`) |
| **langchain-openai + openai** | 0.1.25 / 1.30.0 | LLM provider SDK (needs `OPENAI_API_KEY`) |

## OCR / Document Processing

| Technology | Version | Purpose |
|---|---|---|
| **pytesseract** | 0.3.10 | OCR engine for scanned prescriptions/reports |
| **PyMuPDF (fitz)** | 1.24.7 | PDF text extraction (fast path before OCR) |
| **pdf2image + Pillow** | 1.17.0 / 10.3.0 | PDF→image conversion for the OCR worker |

Pipeline: upload → PyMuPDF text → Tesseract fallback → LangChain entity
extraction (medications, labs, diagnoses, vitals, allergies) → Celery task
(`app/services/ocr_worker.py`), status polled over REST.

## Healthcare Interoperability & Security

| Technology | Version | Purpose |
|---|---|---|
| **fhir.resources** | 7.1.0 | FHIR R4 `Bundle` generation (`app/services/fhir_service.py`) — Patient, Encounter, Condition, Observation, MedicationStatement; ABDM-ready |
| **python-jose + passlib[bcrypt]** | 3.3.0 / 1.7.4 | JWT signing + password hashing for auth endpoints |
| **httpx** | 0.27.0 | Async HTTP client for ABDM gateway calls |
| **email-validator, structlog, python-dotenv** | — | Input validation, structured logging, `.env` config |

## DevOps

| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** (`backend/Dockerfile`, `docker-compose.yml`) | One command full stack: API:8000 + PostgreSQL:5432 + Redis:6379 + Celery worker/beat |

## Project Map (`backend/`)

```
app/main.py                 # App entrypoint, CORS, routers, /health
app/core/                   # config.py (env settings), celery_app.py
app/api/v1/                 # auth.py (ABHA/patients/consent)
│                           # conversation.py (SOCRATES sessions)
│                           # documents.py (upload, OCR status, FHIR bundle)
app/models/domain.py        # Patient, Session, Document, Triage ORM models
app/schemas/payload.py      # Pydantic v2 schemas
app/services/               # llm_service, ocr_worker, fhir_service
app/database/session.py     # Async engine + session factory
```

## Run

```bash
cd backend
cp .env.example .env        # set OPENAI_API_KEY, POSTGRES_*, REDIS_*, SECRET_KEY
docker-compose up -d --build
# API → http://localhost:8000 | Docs → http://localhost:8000/docs
```

Local (no Docker): `pip install -r requirements.txt` → `alembic upgrade head` →
`uvicorn app.main:app --reload --port 8000` (+ `celery -A app.core.celery_app worker`).

## Status Note

Backend is **built but not yet connected** — the React frontend currently runs
fully on local mock data (`medikiosk/src/data/`). Wiring the frontend to these
endpoints (patients, sessions, documents, FHIR) is the pending integration step.

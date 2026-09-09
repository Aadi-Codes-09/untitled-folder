import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.core.config import get_settings
from app.database.session import get_db
from app.models.domain import Patient
from app.schemas.payload import (
    PatientCreate,
    PatientResponse,
    ABDMAuthRequest,
    ABDMAuthResponse,
    ABDMCallback,
)
from app.services.llm_service import Language

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


@router.post("/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreate,
    db: AsyncSession = Depends(get_db),
):
    if not any([patient_data.abha_id, patient_data.aadhaar, patient_data.phone]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one identifier (ABHA ID, Aadhaar, or Phone) is required",
        )

    existing = None
    if patient_data.abha_id:
        result = await db.execute(select(Patient).where(Patient.abha_id == patient_data.abha_id))
        existing = result.scalar_one_or_none()
    elif patient_data.aadhaar:
        import hashlib
        aadhaar_hash = hashlib.sha256(patient_data.aadhaar.encode()).hexdigest()
        result = await db.execute(select(Patient).where(Patient.aadhaar_hash == aadhaar_hash))
        existing = result.scalar_one_or_none()
    elif patient_data.phone:
        import hashlib
        phone_hash = hashlib.sha256(patient_data.phone.encode()).hexdigest()
        result = await db.execute(select(Patient).where(Patient.phone_hash == phone_hash))
        existing = result.scalar_one_or_none()

    if existing:
        existing.language = patient_data.language
        existing.consent_given = patient_data.consent_given
        if patient_data.consent_given and not existing.consent_timestamp:
            from datetime import datetime
            existing.consent_timestamp = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        return existing

    patient = Patient(
        abha_id=patient_data.abha_id,
        language=patient_data.language,
        consent_given=patient_data.consent_given,
    )

    if patient_data.consent_given:
        from datetime import datetime
        patient.consent_timestamp = datetime.utcnow()

    if patient_data.aadhaar:
        import hashlib
        patient.aadhaar_hash = hashlib.sha256(patient_data.aadhaar.encode()).hexdigest()
    if patient_data.phone:
        import hashlib
        patient.phone_hash = hashlib.sha256(patient_data.phone.encode()).hexdigest()

    db.add(patient)
    await db.commit()
    await db.refresh(patient)

    logger.info(f"Created patient: {patient.id}")
    return patient


@router.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/abdm/auth/initiate", response_model=ABDMAuthResponse)
async def initiate_abdm_auth(
    auth_request: ABDMAuthRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.abha_id == auth_request.abha_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    import uuid
    txn_id = str(uuid.uuid4())

    logger.info(f"ABDM auth initiated for ABHA: {auth_request.abha_id}, txn: {txn_id}")

    return ABDMAuthResponse(
        txn_id=txn_id,
        auth_method="OTP",
        status="INITIATED",
    )


@router.post("/abdm/auth/callback")
async def abdm_callback(
    callback: ABDMCallback,
    db: AsyncSession = Depends(get_db),
):
    logger.info(f"ABDM callback received: txn={callback.txn_id}, status={callback.status}")

    if callback.status == "SUCCESS" and callback.token:
        pass

    return {"status": "received", "txn_id": callback.txn_id}


@router.post("/patients/{patient_id}/consent")
async def update_consent(
    patient_id: UUID,
    consent: bool,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.consent_given = consent
    if consent and not patient.consent_timestamp:
        from datetime import datetime
        patient.consent_timestamp = datetime.utcnow()

    await db.commit()
    await db.refresh(patient)
    return {"status": "updated", "consent_given": patient.consent_given}
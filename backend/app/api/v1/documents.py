import logging
import os
import uuid as uuid_lib
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.core.config import get_settings
from app.database.session import get_db
from app.models.domain import Document, DocumentStatus, DocumentType, Session, Patient
from app.schemas.payload import (
    DocumentUploadInit,
    DocumentUploadResponse,
    DocumentStatusResponse,
    DocumentType as SchemaDocumentType,
)
from app.services.ocr_worker import process_document
from app.services.fhir_service import fhir_service

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {
    "application/pdf": DocumentType.OTHER,
    "image/jpeg": DocumentType.OTHER,
    "image/jpg": DocumentType.OTHER,
    "image/png": DocumentType.OTHER,
}


def guess_document_type(filename: str, mime_type: str) -> DocumentType:
    fname = filename.lower()
    if "prescript" in fname or "rx" in fname:
        return DocumentType.PRESCRIPTION
    elif "lab" in fname or "blood" in fname or "report" in fname or "cbc" in fname or "lipid" in fname:
        return DocumentType.LAB_REPORT
    elif "ecg" in fname or "ekg" in fname:
        return DocumentType.ECG
    elif "discharge" in fname:
        return DocumentType.DISCHARGE_SUMMARY
    elif "xray" in fname or "ct" in fname or "mri" in fname or "imaging" in fname:
        return DocumentType.IMAGING_REPORT
    elif "vaccin" in fname or "immuniz" in fname:
        return DocumentType.VACCINATION_RECORD
    elif any(k in fname for k in ["histor", "record", "ehr", "emr", "past", "summary", "case_sheet", "medical"]):
        return DocumentType.MEDICAL_HISTORY
    return DocumentType.OTHER


def _dispatch_processing(document_id: str):
    try:
        process_document.delay(document_id)
    except Exception as e:
        logger.warning(f"Celery dispatch failed: {e}. Task may require manual run or live worker.")


@router.post("/documents/initiate-upload", response_model=DocumentUploadResponse)
async def initiate_upload(
    upload_data: DocumentUploadInit,
    db: AsyncSession = Depends(get_db),
):
    patient_result = await db.execute(select(Patient).where(Patient.id == upload_data.patient_id))
    patient = patient_result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if upload_data.session_id:
        session_result = await db.execute(select(Session).where(Session.id == upload_data.session_id))
        session = session_result.scalar_one_or_none()
        if not session or session.patient_id != upload_data.patient_id:
            raise HTTPException(status_code=400, detail="Session does not belong to patient")

    if upload_data.mime_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {upload_data.mime_type} not allowed")

    if upload_data.file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit")

    if upload_data.document_type and upload_data.document_type != DocumentType.OTHER:
        doc_type = upload_data.document_type
    else:
        doc_type = guess_document_type(upload_data.filename, upload_data.mime_type)

    document = Document(
        patient_id=upload_data.patient_id,
        session_id=upload_data.session_id,
        filename=f"{uuid_lib.uuid4()}_{upload_data.filename}",
        original_filename=upload_data.filename,
        mime_type=upload_data.mime_type,
        file_size=upload_data.file_size,
        document_type=doc_type,
        status=DocumentStatus.UPLOADED,
        storage_path=os.path.join(settings.UPLOAD_DIR, f"{uuid_lib.uuid4()}_{upload_data.filename}"),
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    upload_url = f"/api/v1/documents/{document.id}/upload"

    return DocumentUploadResponse(
        upload_url=upload_url,
        document_id=document.id,
        expires_at=datetime.utcnow() + timedelta(minutes=30),
    )


@router.post("/documents/{document_id}/upload")
async def upload_file(
    document_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.status != DocumentStatus.UPLOADED:
        raise HTTPException(status_code=400, detail="Document already processed or processing")

    try:
        content = await file.read()
        with open(document.storage_path, "wb") as f:
            f.write(content)
    except Exception as e:
        logger.error(f"File save failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to save file")

    document.status = DocumentStatus.PROCESSING
    await db.commit()

    _dispatch_processing(str(document.id))

    return {"status": "uploaded", "document_id": str(document.id), "processing": True}


@router.post("/documents/upload", response_model=DocumentStatusResponse)
async def upload_document_direct(
    file: UploadFile = File(...),
    patient_id: UUID = Form(...),
    session_id: Optional[UUID] = Form(None),
    document_type: Optional[DocumentType] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Direct single-step multipart document upload endpoint."""
    patient_result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = patient_result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if session_id:
        session_result = await db.execute(select(Session).where(Session.id == session_id))
        session = session_result.scalar_one_or_none()
        if not session or session.patient_id != patient_id:
            raise HTTPException(status_code=400, detail="Session does not belong to patient")

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {content_type} not allowed. Supported: PDF, JPEG, PNG")

    content = await file.read()
    file_size = len(content)
    if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit")

    filename = file.filename or "uploaded_document"
    if document_type and document_type != DocumentType.OTHER:
        resolved_type = document_type
    else:
        resolved_type = guess_document_type(filename, content_type)

    storage_filename = f"{uuid_lib.uuid4()}_{filename}"
    storage_path = os.path.join(settings.UPLOAD_DIR, storage_filename)

    try:
        with open(storage_path, "wb") as f:
            f.write(content)
    except Exception as e:
        logger.error(f"Direct file save failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to save file")

    document = Document(
        patient_id=patient_id,
        session_id=session_id,
        filename=storage_filename,
        original_filename=filename,
        mime_type=content_type,
        file_size=file_size,
        document_type=resolved_type,
        status=DocumentStatus.PROCESSING,
        storage_path=storage_path,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    _dispatch_processing(str(document.id))

    return document


@router.get("/documents/{document_id}", response_model=DocumentStatusResponse)
async def get_document_status(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.get("/patients/{patient_id}/documents", response_model=List[DocumentStatusResponse])
async def list_patient_documents(
    patient_id: UUID,
    status: Optional[DocumentStatus] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Document).where(Document.patient_id == patient_id)
    if status:
        query = query.where(Document.status == status)
    query = query.order_by(Document.uploaded_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/sessions/{session_id}/documents", response_model=List[DocumentStatusResponse])
async def list_session_documents(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.session_id == session_id).order_by(Document.uploaded_at.desc())
    )
    return result.scalars().all()


@router.post("/documents/{document_id}/reprocess")
async def reprocess_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    document.status = DocumentStatus.UPLOADED
    document.processing_error = None
    await db.commit()

    process_document.delay(str(document.id))
    return {"status": "reprocessing", "document_id": str(document.id)}


@router.get("/sessions/{session_id}/fhir-bundle")
async def get_session_fhir_bundle(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    from app.models.domain import ClinicalSummary
    
    session_result = await db.execute(
        select(Session)
        .options(selectinload(Session.patient))
        .where(Session.id == session_id)
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    summary_result = await db.execute(
        select(ClinicalSummary).where(ClinicalSummary.session_id == session_id)
    )
    clinical_summary = summary_result.scalar_one_or_none()
    if not clinical_summary:
        raise HTTPException(status_code=404, detail="Clinical summary not yet generated")

    docs_result = await db.execute(
        select(Document).where(
            Document.session_id == session_id,
            Document.status == DocumentStatus.COMPLETED
        )
    )
    documents = docs_result.scalars().all()

    bundle = fhir_service.build_clinical_document_bundle(
        session=session,
        clinical_summary=clinical_summary,
        documents=documents,
        patient=session.patient,
    )

    errors = fhir_service.validate_bundle(bundle)
    if errors:
        logger.warning(f"FHIR bundle validation warnings: {errors}")

    return bundle.model_dump(exclude_none=True)
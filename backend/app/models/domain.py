from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, String, Text, Integer, DateTime, ForeignKey, Enum, Boolean, JSON, Index, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, declared_attr
import uuid

from app.database.session import Base


class SessionStatus(str, PyEnum):
    INITIATED = "INITIATED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"
    EMERGENCY_FLAGGED = "EMERGENCY_FLAGGED"


class DocumentStatus(str, PyEnum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class DocumentType(str, PyEnum):
    PRESCRIPTION = "PRESCRIPTION"
    LAB_REPORT = "LAB_REPORT"
    MEDICAL_HISTORY = "MEDICAL_HISTORY"
    ECG = "ECG"
    DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY"
    IMAGING_REPORT = "IMAGING_REPORT"
    VACCINATION_RECORD = "VACCINATION_RECORD"
    OTHER = "OTHER"


class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    abha_id = Column(String(50), unique=True, index=True, nullable=True)
    aadhaar_hash = Column(String(128), unique=True, index=True, nullable=True)
    phone_hash = Column(String(128), unique=True, index=True, nullable=True)
    name = Column(String(200), nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    language = Column(String(10), default="en")
    consent_given = Column(Boolean, default=False)
    consent_timestamp = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    sessions = relationship("Session", back_populates="patient", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="patient", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_patients_abha_id", "abha_id"),
        Index("ix_patients_phone_hash", "phone_hash"),
    )


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(SessionStatus), default=SessionStatus.INITIATED, nullable=False, index=True)
    chief_complaint = Column(String(500), nullable=True)
    current_question_index = Column(Integer, default=0)
    red_flag_count = Column(Integer, default=0)
    is_emergency = Column(Boolean, default=False)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="sessions")
    responses = relationship("ClinicalResponse", back_populates="session", cascade="all, delete-orphan", order_by="ClinicalResponse.question_index")
    clinical_summary = relationship("ClinicalSummary", back_populates="session", uselist=False, cascade="all, delete-orphan")


class ClinicalResponse(Base):
    __tablename__ = "clinical_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(50), nullable=False)
    question_key = Column(String(50), nullable=False)
    question_text = Column(Text, nullable=False)
    answer_value = Column(JSON, nullable=False)
    answer_text = Column(Text, nullable=True)
    is_red_flag = Column(Boolean, default=False)
    question_index = Column(Integer, nullable=False)
    input_method = Column(String(20), default="touch")
    response_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    session = relationship("Session", back_populates="responses")

    __table_args__ = (
        Index("ix_clinical_responses_session_question", "session_id", "question_id"),
    )


class ClinicalSummary(Base):
    __tablename__ = "clinical_summaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), unique=True, nullable=False)
    structured_history = Column(JSON, nullable=False)
    socarates_extracted = Column(JSON, nullable=True)
    red_flags_summary = Column(JSON, nullable=True)
    generated_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    fhir_bundle_json = Column(JSON, nullable=True)

    session = relationship("Session", back_populates="clinical_summary")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    document_type = Column(Enum(DocumentType), default=DocumentType.OTHER, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False, index=True)
    storage_path = Column(String(1000), nullable=False)
    ocr_text = Column(Text, nullable=True)
    extracted_entities = Column(JSON, nullable=True)
    confidence_score = Column(Integer, nullable=True)
    processing_error = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    patient = relationship("Patient", back_populates="documents")

    __table_args__ = (
        Index("ix_documents_patient_status", "patient_id", "status"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    action = Column(String(50), nullable=False)
    user_id = Column(String(100), nullable=True)
    changes = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("ix_audit_logs_entity", "entity_type", "entity_id"),
    )
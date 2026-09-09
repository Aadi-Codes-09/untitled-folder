from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import Enum


class Language(str, Enum):
    EN = "en"
    HI = "hi"


class SessionStatus(str, Enum):
    INITIATED = "INITIATED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"
    EMERGENCY_FLAGGED = "EMERGENCY_FLAGGED"


class DocumentStatus(str, Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class DocumentType(str, Enum):
    PRESCRIPTION = "PRESCRIPTION"
    LAB_REPORT = "LAB_REPORT"
    MEDICAL_HISTORY = "MEDICAL_HISTORY"
    ECG = "ECG"
    DISCHARGE_SUMMARY = "DISCHARGE_SUMMARY"
    IMAGING_REPORT = "IMAGING_REPORT"
    VACCINATION_RECORD = "VACCINATION_RECORD"
    OTHER = "OTHER"


class InputMethod(str, Enum):
    TOUCH = "touch"
    VOICE = "voice"


class SocratesCategory(str, Enum):
    SITE = "site"
    ONSET = "onset"
    CHARACTER = "character"
    RADIATION = "radiation"
    ASSOCIATED = "associated"
    TIMING = "timing"
    EXACERBATING = "exacerbating"
    RELIEVING = "relieving"
    SEVERITY = "severity"
    HISTORY = "history"


class PatientCreate(BaseModel):
    abha_id: Optional[str] = Field(None, pattern=r"^\d{2}-\d{4}-\d{4}-\d{4}$")
    aadhaar: Optional[str] = Field(None, min_length=12, max_length=12)
    phone: Optional[str] = Field(None, pattern=r"^\d{10}$")
    language: Language = Language.EN
    consent_given: bool = False

    @field_validator("abha_id", "aadhaar", "phone", mode="before")
    @classmethod
    def at_least_one_id(cls, v, info):
        return v


class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    abha_id: Optional[str]
    name: Optional[str]
    age: Optional[int]
    gender: Optional[str]
    language: Language
    consent_given: bool
    created_at: datetime


class SessionCreate(BaseModel):
    patient_id: UUID
    chief_complaint: Optional[str] = None


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    status: SessionStatus
    chief_complaint: Optional[str]
    current_question_index: int
    red_flag_count: int
    is_emergency: bool
    started_at: datetime
    completed_at: Optional[datetime]


class SocratesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_id: str
    question_key: str
    question_text: Dict[Language, str]
    question_type: Literal["single", "multi", "scale"]
    category: SocratesCategory
    options: List[Dict[str, Any]]
    labels: Optional[Dict[Language, List[str]]] = None
    min_value: Optional[int] = None
    max_value: Optional[int] = None


class ClinicalAnswerSubmit(BaseModel):
    question_id: str
    answer_value: Any
    answer_text: Optional[str] = None
    input_method: InputMethod = InputMethod.TOUCH
    response_time_ms: Optional[int] = None


class ClinicalResponseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    question_id: str
    question_key: str
    question_text: str
    answer_value: Any
    answer_text: Optional[str]
    is_red_flag: bool
    question_index: int
    input_method: InputMethod
    created_at: datetime


class DocumentUploadInit(BaseModel):
    patient_id: UUID
    session_id: Optional[UUID] = None
    filename: str
    mime_type: str
    file_size: int
    document_type: DocumentType = DocumentType.OTHER


class DocumentUploadResponse(BaseModel):
    upload_url: str
    document_id: UUID
    expires_at: datetime


class DocumentStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    session_id: Optional[UUID]
    filename: str
    original_filename: str
    mime_type: str
    file_size: int
    document_type: DocumentType
    status: DocumentStatus
    ocr_text: Optional[str]
    extracted_entities: Optional[Dict[str, Any]]
    confidence_score: Optional[int]
    processing_error: Optional[str]
    uploaded_at: datetime
    processed_at: Optional[datetime]


class OCRExtraction(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: UUID
    medications: List[Dict[str, Any]] = []
    diagnoses: List[Dict[str, Any]] = []
    lab_values: List[Dict[str, Any]] = []
    vital_signs: List[Dict[str, Any]] = []
    procedures: List[Dict[str, Any]] = []
    allergies: List[Dict[str, Any]] = []
    medical_history: List[str] = []
    chronic_conditions: List[str] = []
    raw_text: str
    confidence: float


class ClinicalHistoryStructured(BaseModel):
    chief_complaint: str
    hpi: Dict[str, Any]
    past_medical_history: List[str] = []
    medications: List[Dict[str, Any]] = []
    allergies: List[str] = []
    social_history: Dict[str, Any] = {}
    family_history: List[str] = []
    review_of_systems: Dict[str, Any] = {}


class RedFlagSummary(BaseModel):
    count: int
    flags: List[Dict[str, Any]]
    is_emergency: bool


class ClinicalSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: UUID
    structured_history: ClinicalHistoryStructured
    socarates_extracted: Dict[str, Any]
    red_flags: RedFlagSummary
    generated_at: datetime
    fhir_bundle: Optional[Dict[str, Any]] = None


class FHIRBundleResponse(BaseModel):
    resourceType: str = "Bundle"
    type: str = "document"
    timestamp: datetime
    entry: List[Dict[str, Any]]


class ABDMAuthRequest(BaseModel):
    abha_id: str
    txn_id: Optional[str] = None


class ABDMAuthResponse(BaseModel):
    txn_id: str
    auth_method: str = "OTP"
    status: str


class ABDMCallback(BaseModel):
    txn_id: str
    token: Optional[str] = None
    auth_code: Optional[str] = None
    status: str


class HealthCheck(BaseModel):
    status: str
    version: str
    database: str
    redis: str
    timestamp: datetime
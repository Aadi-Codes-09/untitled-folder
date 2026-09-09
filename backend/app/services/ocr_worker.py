import io
import json
import logging
import pytesseract
from pathlib import Path
from typing import Dict, Any, List, Optional
from PIL import Image
import fitz
from pdf2image import convert_from_path

from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.database.session import AsyncSessionLocal
from app.models.domain import Document, DocumentStatus, DocumentType
from app.services.llm_service import llm_service
from sqlalchemy import select
from sqlalchemy.orm import selectinload

settings = get_settings()
logger = logging.getLogger(__name__)

pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD


class OCRWorker:
    def __init__(self):
        self.languages = settings.OCR_LANGUAGES

    def _extract_text_from_image(self, image: Image.Image) -> str:
        try:
            text = pytesseract.image_to_string(image, lang=self.languages)
            return text.strip()
        except Exception as e:
            logger.error(f"OCR image extraction failed: {e}")
            return ""

    def _extract_text_from_pdf(self, pdf_path: Path) -> str:
        text_parts = []
        try:
            images = convert_from_path(pdf_path, dpi=300)
            for i, image in enumerate(images):
                page_text = self._extract_text_from_image(image)
                if page_text:
                    text_parts.append(f"--- Page {i+1} ---\n{page_text}")
        except Exception as e:
            logger.error(f"PDF to image conversion failed: {e}")
            try:
                doc = fitz.open(pdf_path)
                for page_num in range(len(doc)):
                    page = doc[page_num]
                    text = page.get_text()
                    if text.strip():
                        text_parts.append(f"--- Page {page_num+1} ---\n{text}")
                doc.close()
            except Exception as e2:
                logger.error(f"Fallback PyMuPDF extraction failed: {e2}")
        return "\n\n".join(text_parts)

    def _extract_entities_with_llm(self, text: str, doc_type: DocumentType) -> Dict[str, Any]:
        if not text.strip():
            return self._empty_entities()

        prompt = self._build_extraction_prompt(text, doc_type)
        
        try:
            if llm_service.llm:
                from langchain_core.messages import HumanMessage
                response = llm_service.llm.invoke([HumanMessage(content=prompt)])
                content = response.content
                return json.loads(content)
        except Exception as e:
            logger.error(f"LLM entity extraction failed: {e}")

        return self._regex_fallback_extraction(text, doc_type)

    def _build_extraction_prompt(self, text: str, doc_type: DocumentType) -> str:
        base_prompt = f"""Extract clinical entities from this {doc_type.value.lower()} document.
Return ONLY valid JSON with this exact structure:
{{
  "medications": [{{"name": "", "dose": "", "frequency": "", "duration": "", "route": ""}}],
  "diagnoses": [{{"code": "", "description": "", "system": "ICD-10"}}],
  "medical_history": ["list of past illnesses, surgeries, hospitalizations, or family history"],
  "chronic_conditions": ["hypertension, diabetes, asthma, CAD, etc."],
  "lab_values": [{{"test_name": "", "value": "", "unit": "", "reference_range": "", "status": "normal|high|low"}}],
  "vital_signs": [{{"name": "", "value": "", "unit": "", "timestamp": ""}}],
  "procedures": [{{"name": "", "date": "", "details": ""}}],
  "allergies": [{{"allergen": "", "reaction": "", "severity": ""}}]
}}

Document Text:
{text[:8000]}"""
        return base_prompt

    def _regex_fallback_extraction(self, text: str, doc_type: DocumentType) -> Dict[str, Any]:
        import re
        entities = self._empty_entities()
        
        med_pattern = r'(?i)(?:tab|cap|syrup|inj)\.?\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+(?:\.\d+)?\s*(?:mg|ml|g|mcg|units?))'
        for match in re.finditer(med_pattern, text):
            entities["medications"].append({
                "name": match.group(1).strip(),
                "dose": match.group(2).strip(),
                "frequency": "",
                "duration": "",
                "route": "oral",
            })

        lab_pattern = r'(?i)([A-Za-z\s]+)\s+(\d+(?:\.\d+)?)\s*([A-Za-z/%]+)\s*\(?([\d\.\-\s<>]+)?\)?'
        for match in re.finditer(lab_pattern, text):
            test_name = match.group(1).strip()
            if len(test_name) > 3 and any(kw in test_name.lower() for kw in ["hemoglobin", "cholesterol", "glucose", "creatinine", "hba1c", "ldl", "hdl", "triglyceride", "troponin", "ck-mb", "bnp", "pro-bnp", "d-dimer", "wbc", "rbc", "platelet", "alt", "ast", "bilirubin", "urea", "sodium", "potassium", "chloride"]):
                entities["lab_values"].append({
                    "test_name": test_name,
                    "value": match.group(2),
                    "unit": match.group(3),
                    "reference_range": match.group(4).strip() if match.group(4) else "",
                    "status": "normal",
                })

        # History and chronic condition keywords
        history_keywords = [
            "diabetes", "hypertension", "asthma", "hypothyroidism", "hyperthyroidism",
            "coronary artery disease", "myocardial infarction", "stroke", "cholecystectomy",
            "appendectomy", "tuberculosis", "chronic kidney disease", "copd", "arthritis"
        ]
        text_lower = text.lower()
        for kw in history_keywords:
            if kw in text_lower:
                title_kw = kw.title()
                entities["medical_history"].append(title_kw)
                if any(c in kw for c in ["diabetes", "hypertension", "asthma", "thyroid", "cad", "copd", "kidney"]):
                    entities["chronic_conditions"].append(title_kw)

        return entities

    def _empty_entities(self) -> Dict[str, Any]:
        return {
            "medications": [],
            "diagnoses": [],
            "medical_history": [],
            "chronic_conditions": [],
            "lab_values": [],
            "vital_signs": [],
            "procedures": [],
            "allergies": [],
        }


ocr_worker = OCRWorker()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_document(self, document_id: str) -> Dict[str, Any]:
    import asyncio
    return asyncio.run(_process_document_async(document_id))


async def _process_document_async(document_id: str) -> Dict[str, Any]:
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(Document).where(Document.id == document_id)
            )
            document = result.scalar_one_or_none()
            
            if not document:
                logger.error(f"Document {document_id} not found")
                return {"status": "error", "message": "Document not found"}

            document.status = DocumentStatus.PROCESSING
            await db.commit()

            file_path = Path(document.storage_path)
            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")

            if document.mime_type == "application/pdf":
                ocr_text = ocr_worker._extract_text_from_pdf(file_path)
            else:
                image = Image.open(file_path)
                ocr_text = ocr_worker._extract_text_from_image(image)

            extracted_entities = ocr_worker._extract_entities_with_llm(ocr_text, document.document_type)

            document.ocr_text = ocr_text
            document.extracted_entities = extracted_entities
            document.confidence_score = 85
            document.status = DocumentStatus.COMPLETED
            from datetime import datetime
            document.processed_at = datetime.utcnow()
            
            await db.commit()
            await db.refresh(document)

            logger.info(f"Document {document_id} processed successfully")
            return {
                "status": "success",
                "document_id": str(document.id),
                "entities_extracted": {
                    "medications": len(extracted_entities.get("medications", [])),
                    "lab_values": len(extracted_entities.get("lab_values", [])),
                    "diagnoses": len(extracted_entities.get("diagnoses", [])),
                }
            }

        except Exception as e:
            logger.error(f"Document processing failed: {e}")
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(Document).where(Document.id == document_id)
                )
                document = result.scalar_one_or_none()
                if document:
                    document.status = DocumentStatus.FAILED
                    document.processing_error = str(e)
                    await db.commit()
            raise


@celery_app.task(bind=True)
def extract_clinical_entities(self, text: str, doc_type: str) -> Dict[str, Any]:
    doc_type_enum = DocumentType(doc_type)
    return ocr_worker._extract_entities_with_llm(text, doc_type_enum)


@celery_app.task
def generate_clinical_summary_task(session_id: str) -> Dict[str, Any]:
    import asyncio
    return asyncio.run(_generate_clinical_summary_async(session_id))


async def _generate_clinical_summary_async(session_id: str) -> Dict[str, Any]:
    from app.models.domain import Session, ClinicalResponse, ClinicalSummary, Document
    from sqlalchemy import select
    from datetime import datetime

    async with AsyncSessionLocal() as db:
        try:
            session_result = await db.execute(
                select(Session)
                .options(selectinload(Session.responses), selectinload(Session.patient))
                .where(Session.id == session_id)
            )
            session = session_result.scalar_one_or_none()
            
            if not session:
                return {"status": "error", "message": "Session not found"}

            documents_result = await db.execute(
                select(Document).where(
                    Document.session_id == session_id,
                    Document.status == DocumentStatus.COMPLETED
                )
            )
            documents = documents_result.scalars().all()

            document_entities = {
                "medications": [],
                "lab_values": [],
                "diagnoses": [],
                "vital_signs": [],
            }
            for doc in documents:
                if doc.extracted_entities:
                    for key in document_entities:
                        if key in doc.extracted_entities:
                            document_entities[key].extend(doc.extracted_entities[key])

            conversation_history = [
                {
                    "question_id": r.question_id,
                    "question_key": r.question_key,
                    "question_text": r.question_text,
                    "answer_value": r.answer_value,
                    "answer_text": r.answer_text,
                    "is_red_flag": r.is_red_flag,
                }
                for r in session.responses
            ]

            socrates = await llm_service.extract_socrates(
                conversation_history=conversation_history,
                chief_complaint=session.chief_complaint or "Chest pain",
                language=session.patient.language if session.patient else "en",
            )

            demographics = {
                "age": session.patient.age if session.patient else None,
                "gender": session.patient.gender if session.patient else None,
            }

            summary = await llm_service.generate_clinical_summary(
                socrates=socrates,
                document_entities=document_entities,
                demographics=demographics,
            )

            fhir_bundle = await _generate_fhir_bundle(session, summary, document_entities)

            clinical_summary = ClinicalSummary(
                session_id=session.id,
                structured_history=summary.structured_history,
                socarates_extracted=socrates.model_dump(),
                red_flags_summary=summary.red_flags,
                fhir_bundle_json=fhir_bundle,
            )
            db.add(clinical_summary)

            session.status = "COMPLETED"
            session.completed_at = datetime.utcnow()
            session.red_flag_count = len(socrates.red_flags)
            session.is_emergency = len(socrates.red_flags) >= 2

            await db.commit()

            return {"status": "success", "summary_id": str(clinical_summary.id)}

        except Exception as e:
            logger.error(f"Clinical summary generation failed: {e}")
            return {"status": "error", "message": str(e)}


async def _generate_fhir_bundle(
    session: "Session",
    summary: "ClinicalSummaryOutput",
    document_entities: Dict[str, Any],
) -> Dict[str, Any]:
    from fhir.resources.bundle import Bundle
    from fhir.resources.composition import Composition
    from fhir.resources.patient import Patient
    from fhir.resources.condition import Condition
    from fhir.resources.medicationstatement import MedicationStatement
    from fhir.resources.observation import Observation
    from fhir.resources.allergyintolerance import AllergyIntolerance
    from fhir.resources.reference import Reference
    from fhir.resources.identifier import Identifier
    from fhir.resources.humanname import HumanName
    from fhir.resources.codeableconcept import CodeableConcept
    from fhir.resources.coding import Coding
    from fhir.resources.quantity import Quantity
    import uuid

    bundle = Bundle(
        type="document",
        timestamp=datetime.utcnow(),
        identifier=Identifier(system="urn:ietf:rfc:3986", value=f"urn:uuid:{uuid.uuid4()}"),
        entry=[],
    )

    patient_resource = Patient(
        id=str(session.patient_id),
        identifier=[
            Identifier(system="https://abdm.gov.in/abha", value=session.patient.abha_id) if session.patient and session.patient.abha_id else None
        ],
        name=[HumanName(text=session.patient.name)] if session.patient and session.patient.name else [],
        gender=session.patient.gender.lower() if session.patient and session.patient.gender else "unknown",
        birthDate=f"{datetime.utcnow().year - session.patient.age}-01-01" if session.patient and session.patient.age else None,
    )
    bundle.entry.append(Bundle.Entry(resource=patient_resource, fullUrl=f"Patient/{session.patient_id}"))

    for med in document_entities.get("medications", []):
        med_statement = MedicationStatement(
            id=str(uuid.uuid4()),
            status="active",
            medicationCodeableConcept=CodeableConcept(text=med.get("name", "Unknown")),
            subject=Reference(reference=f"Patient/{session.patient_id}"),
            dosage=[{
                "text": f"{med.get('dose', '')} {med.get('frequency', '')}",
                "timing": {"code": {"text": med.get("frequency", "")}},
            }] if med.get("dose") or med.get("frequency") else None,
        )
        bundle.entry.append(Bundle.Entry(resource=med_statement, fullUrl=f"MedicationStatement/{med_statement.id}"))

    for lab in document_entities.get("lab_values", []):
        obs = Observation(
            id=str(uuid.uuid4()),
            status="final",
            category=[CodeableConcept(coding=[Coding(system="http://terminology.hl7.org/CodeSystem/observation-category", code="laboratory")])],
            code=CodeableConcept(text=lab.get("test_name", "Unknown")),
            subject=Reference(reference=f"Patient/{session.patient_id}"),
            valueQuantity=Quantity(
                value=float(lab.get("value", 0)) if lab.get("value") else 0,
                unit=lab.get("unit", ""),
                system="http://unitsofmeasure.org",
            ) if lab.get("value") else None,
            referenceRange=[{"text": lab.get("reference_range", "")}] if lab.get("reference_range") else None,
        )
        bundle.entry.append(Bundle.Entry(resource=obs, fullUrl=f"Observation/{obs.id}"))

    for diag in summary.socarates_extracted.red_flags:
        condition = Condition(
            id=str(uuid.uuid4()),
            clinicalStatus=CodeableConcept(coding=[Coding(system="http://terminology.hl7.org/CodeSystem/condition-clinical", code="active")]),
            verificationStatus=CodeableConcept(coding=[Coding(system="http://terminology.hl7.org/CodeSystem/condition-ver-status", code="confirmed")]),
            code=CodeableConcept(text=diag),
            subject=Reference(reference=f"Patient/{session.patient_id}"),
        )
        bundle.entry.append(Bundle.Entry(resource=condition, fullUrl=f"Condition/{condition.id}"))

    composition = Composition(
        id=str(uuid.uuid4()),
        status="final",
        type=CodeableConcept(coding=[Coding(system="http://loinc.org", code="34133-9", display="Summary of episode note")]),
        subject=Reference(reference=f"Patient/{session.patient_id}"),
        date=datetime.utcnow(),
        title="MediKiosk Clinical Summary",
        section=[],
    )
    bundle.entry.insert(0, Bundle.Entry(resource=composition, fullUrl=f"Composition/{composition.id}"))

    return bundle.model_dump(exclude_none=True)
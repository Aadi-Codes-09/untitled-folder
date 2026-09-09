import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from uuid import UUID, uuid4

from fhir.resources.bundle import Bundle
from fhir.resources.composition import Composition
from fhir.resources.patient import Patient
from fhir.resources.condition import Condition
from fhir.resources.medicationstatement import MedicationStatement
from fhir.resources.observation import Observation
from fhir.resources.allergyintolerance import AllergyIntolerance
from fhir.resources.procedure import Procedure
from fhir.resources.encounter import Encounter
from fhir.resources.reference import Reference
from fhir.resources.identifier import Identifier
from fhir.resources.humanname import HumanName
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.coding import Coding
from fhir.resources.quantity import Quantity
from fhir.resources.period import Period
from fhir.resources.annotation import Annotation

from app.models.domain import Session, ClinicalSummary, Document
from app.schemas.payload import Language

logger = logging.getLogger(__name__)


class FHIRService:
    def __init__(self):
        self.loinc_codes = {
            "hemoglobin": "718-7",
            "total_cholesterol": "2093-3",
            "ldl": "18262-6",
            "hdl": "2085-9",
            "triglycerides": "2571-8",
            "hba1c": "4548-4",
            "creatinine": "2160-0",
            "troponin": "6598-7",
            "bnp": "33764-6",
            "pro_bnp": "42599-5",
            "d_dimer": "48065-1",
        }

    def build_clinical_document_bundle(
        self,
        session: Session,
        clinical_summary: ClinicalSummary,
        documents: List[Document],
        patient: Any,
    ) -> Bundle:
        bundle = Bundle(
            id=str(uuid4()),
            type="document",
            timestamp=datetime.utcnow(),
            identifier=Identifier(
                system="urn:ietf:rfc:3986",
                value=f"urn:uuid:{uuid4()}",
            ),
            entry=[],
        )

        patient_resource = self._build_patient_resource(patient, session)
        bundle.entry.append(Bundle.Entry(
            resource=patient_resource,
            fullUrl=f"Patient/{patient_resource.id}",
        ))

        encounter = self._build_encounter(session, patient_resource.id)
        bundle.entry.append(Bundle.Entry(
            resource=encounter,
            fullUrl=f"Encounter/{encounter.id}",
        ))

        for condition_data in clinical_summary.socarates_extracted.get("red_flags", []):
            condition = self._build_condition(condition_data, patient_resource.id, encounter.id)
            bundle.entry.append(Bundle.Entry(
                resource=condition,
                fullUrl=f"Condition/{condition.id}",
            ))

        for med in clinical_summary.structured_history.get("medications", []):
            med_statement = self._build_medication_statement(med, patient_resource.id, encounter.id)
            bundle.entry.append(Bundle.Entry(
                resource=med_statement,
                fullUrl=f"MedicationStatement/{med_statement.id}",
            ))

        for doc in documents:
            if doc.extracted_entities:
                for lab in doc.extracted_entities.get("lab_values", []):
                    obs = self._build_observation(lab, patient_resource.id, encounter.id)
                    bundle.entry.append(Bundle.Entry(
                        resource=obs,
                        fullUrl=f"Observation/{obs.id}",
                    ))

        composition = self._build_composition(
            session=session,
            clinical_summary=clinical_summary,
            patient_ref=patient_resource.id,
            encounter_ref=encounter.id,
        )
        bundle.entry.insert(0, Bundle.Entry(
            resource=composition,
            fullUrl=f"Composition/{composition.id}",
        ))

        return bundle

    def _build_patient_resource(self, patient: Any, session: Session) -> Patient:
        identifiers = []
        if patient.abha_id:
            identifiers.append(Identifier(
                system="https://abdm.gov.in/abha",
                value=patient.abha_id,
                type=CodeableConcept(coding=[Coding(
                    system="http://terminology.hl7.org/CodeSystem/v2-0203",
                    code="ABHA",
                    display="ABHA ID",
                )]),
            ))

        names = []
        if patient.name:
            names.append(HumanName(text=patient.name))

        return Patient(
            id=str(patient.id),
            identifier=identifiers,
            name=names,
            gender=patient.gender.lower() if patient.gender else "unknown",
            birthDate=self._estimate_birthdate(patient.age),
            communication=[{"language": CodeableConcept(coding=[Coding(
                system="urn:ietf:bcp:47",
                code=patient.language or "en",
            )])}],
        )

    def _estimate_birthdate(self, age: Optional[int]) -> Optional[str]:
        if not age:
            return None
        from datetime import datetime
        year = datetime.utcnow().year - age
        return f"{year}-01-01"

    def _build_encounter(self, session: Session, patient_ref: str) -> Encounter:
        return Encounter(
            id=str(uuid4()),
            status="finished" if session.status == "COMPLETED" else "in-progress",
            class_=Coding(
                system="http://terminology.hl7.org/CodeSystem/v3-ActCode",
                code="AMB",
                display="Ambulatory",
            ),
            type=[CodeableConcept(
                coding=[Coding(
                    system="http://snomed.info/sct",
                    code="185349003",
                    display="Emergency consultation",
                )] if session.is_emergency else [Coding(
                    system="http://snomed.info/sct",
                    code="308335008",
                    display="Patient encounter procedure",
                )],
            )],
            subject=Reference(reference=f"Patient/{patient_ref}"),
            period=Period(
                start=session.started_at,
                end=session.completed_at,
            ),
            reasonCode=[CodeableConcept(text=session.chief_complaint or "Chest pain assessment")],
        )

    def _build_condition(self, condition_data: Dict[str, Any], patient_ref: str, encounter_ref: str) -> Condition:
        return Condition(
            id=str(uuid4()),
            clinicalStatus=CodeableConcept(coding=[Coding(
                system="http://terminology.hl7.org/CodeSystem/condition-clinical",
                code="active",
            )]),
            verificationStatus=CodeableConcept(coding=[Coding(
                system="http://terminology.hl7.org/CodeSystem/condition-ver-status",
                code="confirmed",
            )]),
            category=[CodeableConcept(coding=[Coding(
                system="http://terminology.hl7.org/CodeSystem/condition-category",
                code="problem-list-item",
            )])],
            code=CodeableConcept(text=str(condition_data)),
            subject=Reference(reference=f"Patient/{patient_ref}"),
            encounter=Reference(reference=f"Encounter/{encounter_ref}"),
            onsetDateTime=datetime.utcnow(),
        )

    def _build_medication_statement(self, med: Dict[str, Any], patient_ref: str, encounter_ref: str) -> MedicationStatement:
        return MedicationStatement(
            id=str(uuid4()),
            status="active",
            medicationCodeableConcept=CodeableConcept(text=med.get("name", "Unknown")),
            subject=Reference(reference=f"Patient/{patient_ref}"),
            context=Reference(reference=f"Encounter/{encounter_ref}"),
            dosage=[{
                "text": f"{med.get('dose', '')} {med.get('frequency', '')}".strip(),
                "timing": {"code": {"text": med.get("frequency", "")}} if med.get("frequency") else None,
                "route": CodeableConcept(text=med.get("route", "oral")) if med.get("route") else None,
            }] if med.get("dose") or med.get("frequency") else None,
            note=[Annotation(text=f"Duration: {med.get('duration', 'Not specified')}")] if med.get("duration") else None,
        )

    def _build_observation(self, lab: Dict[str, Any], patient_ref: str, encounter_ref: str) -> Observation:
        test_name = lab.get("test_name", "").lower()
        loinc_code = self.loinc_codes.get(test_name.replace(" ", "_"), None)

        coding = []
        if loinc_code:
            coding.append(Coding(
                system="http://loinc.org",
                code=loinc_code,
                display=lab.get("test_name", ""),
            ))

        return Observation(
            id=str(uuid4()),
            status="final",
            category=[CodeableConcept(coding=[Coding(
                system="http://terminology.hl7.org/CodeSystem/observation-category",
                code="laboratory",
                display="Laboratory",
            )])],
            code=CodeableConcept(coding=coding, text=lab.get("test_name", "Unknown")),
            subject=Reference(reference=f"Patient/{patient_ref}"),
            encounter=Reference(reference=f"Encounter/{encounter_ref}"),
            effectiveDateTime=datetime.utcnow(),
            valueQuantity=Quantity(
                value=float(lab.get("value", 0)) if lab.get("value") else 0,
                unit=lab.get("unit", ""),
                system="http://unitsofmeasure.org",
                code=lab.get("unit", ""),
            ) if lab.get("value") else None,
            referenceRange=[{
                "text": lab.get("reference_range", ""),
            }] if lab.get("reference_range") else None,
            interpretation=[CodeableConcept(coding=[Coding(
                system="http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                code=lab.get("status", "N").upper() if lab.get("status") in ["high", "low", "normal"] else "N",
                display=lab.get("status", "Normal").capitalize(),
            )])] if lab.get("status") else None,
        )

    def _build_composition(
        self,
        session: Session,
        clinical_summary: ClinicalSummary,
        patient_ref: str,
        encounter_ref: str,
    ) -> Composition:
        sections = []

        sections.append({
            "title": "Chief Complaint",
            "code": CodeableConcept(coding=[Coding(
                system="http://loinc.org",
                code="8648-8",
                display="Chief complaint",
            )]),
            "text": {
                "status": "generated",
                "div": f"<div xmlns='http://www.w3.org/1999/xhtml'>{clinical_summary.structured_history.get('chief_complaint', '')}</div>",
            },
        })

        hpi = clinical_summary.structured_history.get("hpi", {})
        hpi_text = "\n".join([f"<b>{k}:</b> {v}" for k, v in hpi.items()])
        sections.append({
            "title": "History of Present Illness",
            "code": CodeableConcept(coding=[Coding(
                system="http://loinc.org",
                code="10164-2",
                display="History of present illness",
            )]),
            "text": {
                "status": "generated",
                "div": f"<div xmlns='http://www.w3.org/1999/xhtml'>{hpi_text}</div>",
            },
        })

        if clinical_summary.structured_history.get("past_medical_history"):
            pmh_text = "<ul>" + "".join([f"<li>{item}</li>" for item in clinical_summary.structured_history["past_medical_history"]]) + "</ul>"
            sections.append({
                "title": "Past Medical History",
                "code": CodeableConcept(coding=[Coding(
                    system="http://loinc.org",
                    code="11348-0",
                    display="History of past illness",
                )]),
                "text": {"status": "generated", "div": f"<div xmlns='http://www.w3.org/1999/xhtml'>{pmh_text}</div>"},
            })

        if clinical_summary.structured_history.get("medications"):
            med_text = "<ul>" + "".join([f"<li>{m.get('name', '')} {m.get('dose', '')} {m.get('frequency', '')}</li>" for m in clinical_summary.structured_history["medications"]]) + "</ul>"
            sections.append({
                "title": "Medications",
                "code": CodeableConcept(coding=[Coding(
                    system="http://loinc.org",
                    code="10160-0",
                    display="Medication list",
                )]),
                "text": {"status": "generated", "div": f"<div xmlns='http://www.w3.org/1999/xhtml'>{med_text}</div>"},
            })

        if clinical_summary.red_flags_summary:
            rf_text = "<ul style='color:red;'>" + "".join([f"<li><b>RED FLAG:</b> {flag.get('flag', flag)}</li>" for flag in clinical_summary.red_flags_summary]) + "</ul>"
            sections.append({
                "title": "Red Flags - Emergency Triage",
                "code": CodeableConcept(coding=[Coding(
                    system="http://loinc.org",
                    code="11283-9",
                    display="Emergency department triage note",
                )]),
                "text": {"status": "generated", "div": f"<div xmlns='http://www.w3.org/1999/xhtml'>{rf_text}</div>"},
            })

        return Composition(
            id=str(uuid4()),
            status="final",
            type=CodeableConcept(coding=[Coding(
                system="http://loinc.org",
                code="34133-9",
                display="Summary of episode note",
            )]),
            subject=Reference(reference=f"Patient/{patient_ref}"),
            encounter=Reference(reference=f"Encounter/{encounter_ref}"),
            date=datetime.utcnow(),
            title="MediKiosk AI-Generated Clinical Summary",
            author=[Reference(reference=f"Patient/{patient_ref}", display="MediKiosk AI System")],
            section=sections,
        )

    def validate_bundle(self, bundle: Bundle) -> List[str]:
        errors = []
        if not bundle.entry:
            errors.append("Bundle has no entries")
        
        composition_count = sum(1 for e in bundle.entry if e.resource and e.resource.resource_type == "Composition")
        if composition_count == 0:
            errors.append("Bundle must contain a Composition resource")
        
        patient_count = sum(1 for e in bundle.entry if e.resource and e.resource.resource_type == "Patient")
        if patient_count == 0:
            errors.append("Bundle must contain a Patient resource")

        return errors


fhir_service = FHIRService()
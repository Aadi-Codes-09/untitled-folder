import json
import logging
from typing import Dict, Any, List, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.schemas.payload import SocratesCategory, Language

settings = get_settings()
logger = logging.getLogger(__name__)


class SocratesExtraction(BaseModel):
    site: Optional[str] = None
    onset: Optional[str] = None
    character: Optional[str] = None
    radiation: Optional[List[str]] = None
    associated_symptoms: Optional[List[str]] = None
    timing: Optional[str] = None
    exacerbating: Optional[List[str]] = None
    relieving: Optional[List[str]] = None
    severity: Optional[int] = None
    history: Optional[List[str]] = None
    red_flags: List[str] = Field(default_factory=list)


class ClinicalSummaryOutput(BaseModel):
    structured_history: Dict[str, Any]
    socarates_extracted: SocratesExtraction
    red_flags: List[Dict[str, Any]]


SOCRATES_SYSTEM_PROMPT = """You are an expert clinical AI assistant for MediKiosk, an AI-powered clinical history-taking kiosk for Indian government hospitals.

Your task is to extract structured SOCRATES parameters from a patient's conversational responses to chest pain assessment questions.

SOCRATES Framework:
- S: Site (location of pain)
- O: Onset (when/how it started)
- C: Character (nature of pain)
- R: Radiation (where pain travels)
- A: Associated symptoms
- T: Timing (duration, frequency)
- E: Exacerbating factors
- S: Severity (1-10 scale)

RED FLAGS requiring emergency triage:
- Crushing/heavy/pressure chest pain
- Radiation to left arm, jaw, back
- Sudden onset or waking from sleep
- Shortness of breath, diaphoresis, syncope
- Pain >20 minutes or constant
- No relief with rest/nitrates
- Prior CAD/MI history

Output ONLY valid JSON matching the schema. No markdown, no explanations."""


SOCRATES_EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", SOCRATES_SYSTEM_PROMPT),
    ("human", """
Patient Language: {language}
Chief Complaint: {chief_complaint}

Conversational History (Question -> Answer):
{conversation_history}

Extract all SOCRATES parameters and identify red flags. Return JSON only.
"""),
])


SUMMARY_GENERATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a clinical AI that generates structured clinical summaries for physicians.

Given the SOCRATES extraction and scanned document data, create a comprehensive clinical summary in the specified JSON format.

Include:
1. Chief complaint
2. HPI (History of Present Illness) with all SOCRATES elements
3. Past medical history
4. Medications (from scanned docs + patient report)
5. Allergies
6. Social history
7. Family history
8. Review of systems

Output ONLY valid JSON matching the schema."""),
    ("human", """
SOCRATES Extraction:
{socrates_json}

Scanned Document Entities:
{document_entities}

Patient Demographics:
{demographics}

Generate the clinical summary JSON.
"""),
])


class LLMService:
    def __init__(self):
        self.llm = None
        self._init_llm()

    def _init_llm(self):
        if settings.OPENAI_API_KEY:
            self.llm = ChatOpenAI(
                model=settings.LLM_MODEL,
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS,
                api_key=settings.OPENAI_API_KEY,
            )
        else:
            logger.warning("OPENAI_API_KEY not set. LLM service will use mock responses.")

    async def extract_socrates(
        self,
        conversation_history: List[Dict[str, Any]],
        chief_complaint: str,
        language: Language = Language.EN,
    ) -> SocratesExtraction:
        if not self.llm:
            return self._mock_socrates_extraction(conversation_history)

        try:
            chain = SOCRATES_EXTRACTION_PROMPT | self.llm | JsonOutputParser(pydantic_object=SocratesExtraction)
            
            conv_text = "\n".join([
                f"Q: {item['question_text']}\nA: {item.get('answer_text', item.get('answer_value'))}"
                for item in conversation_history
            ])

            result = await chain.ainvoke({
                "language": language.value,
                "chief_complaint": chief_complaint,
                "conversation_history": conv_text,
            })
            
            return SocratesExtraction(**result)
        except Exception as e:
            logger.error(f"SOCRATES extraction failed: {e}")
            return self._mock_socrates_extraction(conversation_history)

    async def generate_clinical_summary(
        self,
        socrates: SocratesExtraction,
        document_entities: Dict[str, Any],
        demographics: Dict[str, Any],
    ) -> ClinicalSummaryOutput:
        if not self.llm:
            return self._mock_clinical_summary(socrates, document_entities, demographics)

        try:
            chain = SUMMARY_GENERATION_PROMPT | self.llm | JsonOutputParser(pydantic_object=ClinicalSummaryOutput)
            
            result = await chain.ainvoke({
                "socrates_json": socrates.model_dump_json(indent=2),
                "document_entities": json.dumps(document_entities, indent=2),
                "demographics": json.dumps(demographics, indent=2),
            })
            
            return ClinicalSummaryOutput(**result)
        except Exception as e:
            logger.error(f"Clinical summary generation failed: {e}")
            return self._mock_clinical_summary(socrates, document_entities, demographics)

    def _mock_socrates_extraction(self, conversation_history: List[Dict[str, Any]]) -> SocratesExtraction:
        red_flags = []
        for item in conversation_history:
            if item.get("is_red_flag"):
                red_flags.append(f"{item['question_key']}: {item.get('answer_text', item.get('answer_value'))}")

        return SocratesExtraction(
            site="Central chest",
            onset="Sudden onset",
            character="Crushing/Heavy",
            radiation=["Left arm", "Jaw"],
            associated_symptoms=["Shortness of breath", "Diaphoresis"],
            timing="Prolonged >20min",
            exacerbating=["Exertion"],
            relieving=["Rest", "Nitrates"],
            severity=8,
            history=["Hypertension", "Diabetes"],
            red_flags=red_flags,
        )

    def _mock_clinical_summary(
        self,
        socrates: SocratesExtraction,
        document_entities: Dict[str, Any],
        demographics: Dict[str, Any],
    ) -> ClinicalSummaryOutput:
        medications = document_entities.get("medications", [])
        lab_values = document_entities.get("lab_values", [])

        return ClinicalSummaryOutput(
            structured_history={
                "chief_complaint": "Chest pain",
                "hpi": socrates.model_dump(exclude={"red_flags"}),
                "past_medical_history": socrates.history or [],
                "medications": medications,
                "allergies": [],
                "social_history": {"smoking": "Current" if "Smoking" in (socrates.history or []) else "Never"},
                "family_history": ["CAD" if "Family history CAD" in (socrates.history or []) else "None"],
                "review_of_systems": {
                    "cardiovascular": "Positive for chest pain, palpitations",
                    "respiratory": "Positive for dyspnea",
                    "gi": "Negative",
                },
            },
            socarates_extracted=socrates,
            red_flags=[{"flag": flag, "severity": "HIGH"} for flag in socrates.red_flags],
        )


llm_service = LLMService()
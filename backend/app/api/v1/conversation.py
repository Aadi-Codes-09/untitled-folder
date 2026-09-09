import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.database.session import get_db
from app.models.domain import Session, ClinicalResponse, Patient
from app.schemas.payload import (
    SessionCreate,
    SessionResponse,
    SocratesResponse,
    ClinicalAnswerSubmit,
    ClinicalResponseResponse,
    ClinicalSummaryResponse,
    SessionStatus,
    SocratesCategory,
    Language,
)
from app.services.llm_service import llm_service
from app.services.ocr_worker import generate_clinical_summary_task

router = APIRouter()
logger = logging.getLogger(__name__)

SOCRATES_QUESTIONS = [
    {
        "question_id": "q1_site",
        "question_key": "site",
        "question_text": {"en": "Where exactly is the chest pain located?", "hi": "सीने में दर्द कहाँ पर है?"},
        "question_type": "single",
        "category": SocratesCategory.SITE,
        "options": [
            {"id": "center", "label": {"en": "Center of chest", "hi": "सीने के बीच में"}, "value": "Central/Retrosternal"},
            {"id": "left", "label": {"en": "Left side of chest", "hi": "सीने के बाईं ओर"}, "value": "Left lateral"},
            {"id": "right", "label": {"en": "Right side of chest", "hi": "सीने के दाईं ओर"}, "value": "Right lateral"},
            {"id": "epigastric", "label": {"en": "Upper abdomen/stomach area", "hi": "पेट के ऊपरी हिस्से में"}, "value": "Epigastric"},
            {"id": "radiating", "label": {"en": "Radiating to arm/jaw/back", "hi": "बांह, जबड़े या पीठ तक फैल रहा है"}, "value": "Radiating", "isRedFlag": True},
        ],
    },
    {
        "question_id": "q2_onset",
        "question_key": "onset",
        "question_text": {"en": "When did the pain start?", "hi": "दर्द कब शुरू हुआ?"},
        "question_type": "single",
        "category": SocratesCategory.ONSET,
        "options": [
            {"id": "sudden", "label": {"en": "Suddenly (within seconds/minutes)", "hi": "अचानक (सेकंड/मिनट में)"}, "value": "Sudden onset", "isRedFlag": True},
            {"id": "gradual", "label": {"en": "Gradually over hours/days", "hi": "धीरे-धीरे (घंटों/दिनों में)"}, "value": "Gradual onset"},
            {"id": "exertion", "label": {"en": "During physical activity", "hi": "शारीरिक गतिविधि के दौरान"}, "value": "Exertional onset"},
            {"id": "rest", "label": {"en": "While at rest", "hi": "आराम करते समय"}, "value": "At rest"},
            {"id": "waking", "label": {"en": "Woke me up from sleep", "hi": "नींद से जगा दिया"}, "value": "Nocturnal", "isRedFlag": True},
        ],
    },
    {
        "question_id": "q3_character",
        "question_key": "character",
        "question_text": {"en": "How would you describe the pain?", "hi": "दर्द कैसा महसूस हो रहा है?"},
        "question_type": "single",
        "category": SocratesCategory.CHARACTER,
        "options": [
            {"id": "crushing", "label": {"en": "Crushing / Heavy / Tight", "hi": "दबाने वाला / भारी / कसा हुआ"}, "value": "Crushing/Heavy", "isRedFlag": True},
            {"id": "sharp", "label": {"en": "Sharp / Stabbing", "hi": "चुभने वाला / तेज़"}, "value": "Sharp/Stabbing"},
            {"id": "burning", "label": {"en": "Burning", "hi": "जलने वाला"}, "value": "Burning"},
            {"id": "aching", "label": {"en": "Dull / Aching", "hi": "हल्का / सुस्त दर्द"}, "value": "Dull/Aching"},
            {"id": "pressure", "label": {"en": "Pressure / Squeezing", "hi": "दबाव / निचोड़ने जैसा"}, "value": "Pressure/Squeezing", "isRedFlag": True},
        ],
    },
    {
        "question_id": "q4_radiation",
        "question_key": "radiation",
        "question_text": {"en": "Does the pain travel anywhere else?", "hi": "क्या दर्द कहीं और भी जाता है?"},
        "question_type": "multi",
        "category": SocratesCategory.RADIATION,
        "options": [
            {"id": "left_arm", "label": {"en": "Left arm / shoulder", "hi": "बाएं कंधे/बांह में"}, "value": "Left arm radiation", "isRedFlag": True},
            {"id": "right_arm", "label": {"en": "Right arm / shoulder", "hi": "दाएं कंधे/बांह में"}, "value": "Right arm radiation"},
            {"id": "jaw", "label": {"en": "Jaw / teeth", "hi": "जबड़े/दांतों में"}, "value": "Jaw radiation", "isRedFlag": True},
            {"id": "back", "label": {"en": "Back / between shoulder blades", "hi": "पीठ में / कंधों के बीच"}, "value": "Back radiation", "isRedFlag": True},
            {"id": "neck", "label": {"en": "Neck", "hi": "गर्दन में"}, "value": "Neck radiation"},
            {"id": "none", "label": {"en": "Nowhere - stays in chest", "hi": "नहीं, सिर्फ सीने में है"}, "value": "No radiation", "exclusive": True},
        ],
    },
    {
        "question_id": "q5_associated",
        "question_key": "associated",
        "question_text": {"en": "Are you experiencing any of these other symptoms?", "hi": "क्या आपको ये अन्य लक्षण भी हैं?"},
        "question_type": "multi",
        "category": SocratesCategory.ASSOCIATED,
        "options": [
            {"id": "sob", "label": {"en": "Shortness of breath", "hi": "सांस फूलना / सांस लेने में तकलीफ"}, "value": "Dyspnea", "isRedFlag": True},
            {"id": "sweating", "label": {"en": "Cold sweats", "hi": "ठंडा पसीना आना"}, "value": "Diaphoresis", "isRedFlag": True},
            {"id": "nausea", "label": {"en": "Nausea / Vomiting", "hi": "मतली / उल्टी"}, "value": "Nausea/Vomiting"},
            {"id": "dizziness", "label": {"en": "Dizziness / Fainting", "hi": "चक्कर आना / बेहोशी"}, "value": "Dizziness/Syncope", "isRedFlag": True},
            {"id": "palpitations", "label": {"en": "Palpitations (racing heart)", "hi": "दिल तेज़ धड़कना"}, "value": "Palpitations"},
            {"id": "none", "label": {"en": "None of the above", "hi": "इनमें से कोई नहीं"}, "value": "None", "exclusive": True},
        ],
    },
    {
        "question_id": "q6_timing",
        "question_key": "timing",
        "question_text": {"en": "How long does each episode of pain last?", "hi": "दर्द का प्रत्येक दौर कितनी देर रहता है?"},
        "question_type": "single",
        "category": SocratesCategory.TIMING,
        "options": [
            {"id": "seconds", "label": {"en": "Few seconds", "hi": "कुछ सेकंड"}, "value": "Seconds"},
            {"id": "minutes", "label": {"en": "Minutes (5-20 min)", "hi": "मिनट (5-20 मिनट)"}, "value": "Minutes"},
            {"id": "prolonged", "label": {"en": "More than 20 minutes", "hi": "20 मिनट से ज्यादा"}, "value": "Prolonged >20min", "isRedFlag": True},
            {"id": "hours", "label": {"en": "Hours", "hi": "घंटों"}, "value": "Hours"},
            {"id": "constant", "label": {"en": "Constant / doesn't go away", "hi": "लगातार / जाता नहीं"}, "value": "Constant", "isRedFlag": True},
        ],
    },
    {
        "question_id": "q7_exacerbating",
        "question_key": "exacerbating",
        "question_text": {"en": "What makes the pain worse?", "hi": "क्या करने से दर्द बढ़ता है?"},
        "question_type": "multi",
        "category": SocratesCategory.EXACERBATING,
        "options": [
            {"id": "exertion", "label": {"en": "Physical activity / walking", "hi": "चलने/काम करने से"}, "value": "Exertion"},
            {"id": "breathing", "label": {"en": "Deep breathing / coughing", "hi": "गहरी सांस लेने/खांसने से"}, "value": "Respiratory movement"},
            {"id": "position", "label": {"en": "Lying flat", "hi": "सीधा लेटने से"}, "value": "Supine position"},
            {"id": "eating", "label": {"en": "After eating", "hi": "खाने के बाद"}, "value": "Post-prandial"},
            {"id": "stress", "label": {"en": "Emotional stress", "hi": "तनाव/चिंता से"}, "value": "Emotional stress"},
            {"id": "nothing", "label": {"en": "Nothing specific / occurs at rest", "hi": "कुछ खास नहीं / आराम में भी होता है"}, "value": "No specific trigger", "isRedFlag": True},
        ],
    },
    {
        "question_id": "q8_relieving",
        "question_key": "relieving",
        "question_text": {"en": "What makes the pain better?", "hi": "क्या करने से दर्द कम होता है?"},
        "question_type": "multi",
        "category": SocratesCategory.RELIEVING,
        "options": [
            {"id": "rest", "label": {"en": "Rest / stopping activity", "hi": "आराम करने से / रुकने से"}, "value": "Rest"},
            {"id": "nitroglycerin", "label": {"en": "Nitroglycerin / Sorbitrate tablet", "hi": "सोरबिट्रेट/नाइट्रोग्लिसरीन गोली से"}, "value": "Nitrates"},
            {"id": "position_change", "label": {"en": "Sitting up / leaning forward", "hi": "बैठने से / आगे झुकने से"}, "value": "Position change"},
            {"id": "antacid", "label": {"en": "Antacid / cold milk", "hi": "एंटासिड/ठंडा दूध से"}, "value": "Antacid"},
            {"id": "nothing", "label": {"en": "Nothing helps", "hi": "कुछ भी आराम नहीं देता"}, "value": "No relief", "isRedFlag": True},
        ],
    },
    {
        "question_id": "q9_severity",
        "question_key": "severity",
        "question_text": {"en": "On a scale of 1-10, how severe is the pain?", "hi": "1 से 10 के पैमाने पर दर्द कितना तेज़ है?"},
        "question_type": "scale",
        "category": SocratesCategory.SEVERITY,
        "min_value": 1,
        "max_value": 10,
        "labels": {
            "en": ["Mild", "", "", "Moderate", "", "", "Severe", "", "", "Worst imaginable"],
            "hi": ["हल्का", "", "", "मध्यम", "", "", "तेज़", "", "", "असहनीय"],
        },
    },
    {
        "question_id": "q10_history",
        "question_key": "history",
        "question_text": {"en": "Do you have any of these medical conditions?", "hi": "क्या आपको ये बीमारियाँ हैं?"},
        "question_type": "multi",
        "category": SocratesCategory.HISTORY,
        "options": [
            {"id": "htn", "label": {"en": "High Blood Pressure", "hi": "हाई ब्लड प्रेशर"}, "value": "Hypertension"},
            {"id": "dm", "label": {"en": "Diabetes", "hi": "डायबिटीज / मधुमेह"}, "value": "Diabetes Mellitus"},
            {"id": "cad", "label": {"en": "Previous Heart Attack / Angina", "hi": "पहले हार्ट अटैक / एंजाइना"}, "value": "Prior CAD", "isRedFlag": True},
            {"id": "cholesterol", "label": {"en": "High Cholesterol", "hi": "हाई कोलेस्ट्रॉल"}, "value": "Hyperlipidemia"},
            {"id": "smoking", "label": {"en": "Current / Past Smoker", "hi": "धूम्रपान करते हैं / पहले करते थे"}, "value": "Smoking"},
            {"id": "family", "label": {"en": "Family history of heart disease", "hi": "परिवार में दिल की बीमारी"}, "value": "Family history CAD"},
            {"id": "none", "label": {"en": "None of the above", "hi": "इनमें से कोई नहीं"}, "value": "No significant history", "exclusive": True},
        ],
    },
]


@router.post("/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Patient).where(Patient.id == session_data.patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    session = Session(
        patient_id=session_data.patient_id,
        chief_complaint=session_data.chief_complaint or "Chest pain",
        status=SessionStatus.IN_PROGRESS,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/sessions/{session_id}/questions/{question_index}", response_model=SocratesResponse)
async def get_question(
    session_id: UUID,
    question_index: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if question_index < 0 or question_index >= len(SOCRATES_QUESTIONS):
        raise HTTPException(status_code=404, detail="Question not found")

    question = SOCRATES_QUESTIONS[question_index]
    return SocratesResponse(
        question_id=question["question_id"],
        question_key=question["question_key"],
        question_text=question["question_text"],
        question_type=question["question_type"],
        category=question["category"],
        options=question.get("options", []),
        labels=question.get("labels"),
        min_value=question.get("min_value"),
        max_value=question.get("max_value"),
    )


@router.post("/sessions/{session_id}/answers", response_model=ClinicalResponseResponse)
async def submit_answer(
    session_id: UUID,
    answer: ClinicalAnswerSubmit,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.responses))
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if question_index := session.current_question_index >= len(SOCRATES_QUESTIONS):
        raise HTTPException(status_code=400, detail="Session already completed")

    current_question = SOCRATES_QUESTIONS[session.current_question_index]
    
    if current_question["question_id"] != answer.question_id:
        raise HTTPException(status_code=400, detail="Invalid question ID for current step")

    is_red_flag = False
    answer_text = answer.answer_text
    
    if current_question["question_type"] == "scale":
        is_red_flag = answer.answer_value >= 8
        answer_text = str(answer.answer_value)
    elif current_question["question_type"] == "multi":
        values = answer.answer_value if isinstance(answer.answer_value, list) else [answer.answer_value]
        for opt in current_question.get("options", []):
            if opt.get("value") in values and opt.get("isRedFlag"):
                is_red_flag = True
                break
        answer_text = ", ".join(str(v) for v in values)
    else:
        for opt in current_question.get("options", []):
            if opt.get("value") == answer.answer_value and opt.get("isRedFlag"):
                is_red_flag = True
                break
        answer_text = str(answer.answer_value)

    response = ClinicalResponse(
        session_id=session.id,
        question_id=answer.question_id,
        question_key=current_question["question_key"],
        question_text=current_question["question_text"].get(session.patient.language, current_question["question_text"]["en"]) if session.patient else current_question["question_text"]["en"],
        answer_value=answer.answer_value,
        answer_text=answer_text,
        is_red_flag=is_red_flag,
        question_index=session.current_question_index,
        input_method=answer.input_method,
        response_time_ms=answer.response_time_ms,
    )
    db.add(response)

    session.current_question_index += 1
    if is_red_flag:
        session.red_flag_count += 1
        if session.red_flag_count >= 2:
            session.is_emergency = True
            session.status = SessionStatus.EMERGENCY_FLAGGED

    if session.current_question_index >= len(SOCRATES_QUESTIONS):
        session.status = SessionStatus.COMPLETED
        generate_clinical_summary_task.delay(str(session.id))

    await db.commit()
    await db.refresh(response)
    return response


@router.get("/sessions/{session_id}/responses", response_model=List[ClinicalResponseResponse])
async def get_responses(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ClinicalResponse)
        .where(ClinicalResponse.session_id == session_id)
        .order_by(ClinicalResponse.question_index)
    )
    return result.scalars().all()


@router.get("/sessions/{session_id}/summary", response_model=ClinicalSummaryResponse)
async def get_summary(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    from app.models.domain import ClinicalSummary
    result = await db.execute(
        select(ClinicalSummary).where(ClinicalSummary.session_id == session_id)
    )
    summary = result.scalar_one_or_none()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not yet generated")
    
    from app.schemas.payload import RedFlagSummary, ClinicalHistoryStructured
    return ClinicalSummaryResponse(
        session_id=summary.session_id,
        structured_history=ClinicalHistoryStructured(**summary.structured_history),
        socarates_extracted=summary.socarates_extracted,
        red_flags=RedFlagSummary(**summary.red_flags_summary),
        generated_at=summary.generated_at,
        fhir_bundle=summary.fhir_bundle_json,
    )


@router.post("/sessions/{session_id}/complete")
async def complete_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = SessionStatus.COMPLETED
    from datetime import datetime
    session.completed_at = datetime.utcnow()
    await db.commit()

    generate_clinical_summary_task.delay(str(session_id))
    return {"status": "completed", "summary_generation": "started"}
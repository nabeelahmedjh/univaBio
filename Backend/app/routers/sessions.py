"""Session routes: create a consultation (transcript -> clinical report), read, regenerate.

Creating and regenerating a report require an authenticated doctor (or super
admin). Reading a session is also open to the patient, who is resolved through
the session's patient phone without authentication.

The audio-upload flow (POST /sessions) stores the recording, returns
immediately with status "processing", then enqueues a job on the async pipeline
queue which transcribes + generates the report without blocking the request;
the client polls GET /sessions/{id}/status.
"""
import os
import shutil
import uuid
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from .. import models, schemas
from ..config import settings
from ..database import get_db
from ..deps import resolve_patient, resolve_session
from ..llm import LLMError
from ..models import utcnow
from ..security import Principal, get_current_doctor, get_optional_principal, get_principal
from ..services import report_service
from ..services.pipeline import pipeline

router = APIRouter(tags=["sessions"])


def _public_status(report_status: str) -> str:
    """Map the internal report_status to the client's processing/ready/failed."""
    return report_service.public_status(report_status)


@router.post(
    "/patients/{phone}/sessions",
    response_model=schemas.SessionOut,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    phone: str,
    body: schemas.SessionCreate,
    principal: Principal = Depends(get_principal),
    db: DBSession = Depends(get_db),
):
    patient = resolve_patient(db, phone, principal)

    session = models.Session(
        patient_id=patient.id,
        title=body.title,
        transcript=body.transcript,
        occurred_at=body.occurred_at or utcnow(),
    )

    if report_service.provider_is_configured():
        try:
            markdown = report_service.generate_report(body.transcript)
            report_service.apply_report_to_session(session, markdown)
        except LLMError as exc:
            report_service.mark_session_error(session, str(exc))
    else:
        report_service.mark_session_pending_key(session)

    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}", response_model=schemas.SessionOut)
def read_session(
    session_id: int,
    principal: Optional[Principal] = Depends(get_optional_principal),
    db: DBSession = Depends(get_db),
):
    session = resolve_session(db, session_id, principal)
    return session


@router.post("/sessions/{session_id}/regenerate-report", response_model=schemas.SessionOut)
def regenerate_report(
    session_id: int,
    principal: Principal = Depends(get_principal),
    db: DBSession = Depends(get_db),
):
    session = resolve_session(db, session_id, principal)

    if not report_service.provider_is_configured():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "LLM API key is not configured")

    try:
        markdown = report_service.generate_report(session.transcript)
        report_service.apply_report_to_session(session, markdown)
    except LLMError as exc:
        report_service.mark_session_error(session, str(exc))
        db.commit()
        db.refresh(session)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Report generation failed: {exc}")

    db.commit()
    db.refresh(session)
    return session


@router.post(
    "/sessions",
    response_model=schemas.SessionCreatedOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_session_from_audio(
    patientId: str = Form(...),
    audio: UploadFile = File(...),
    durationSec: Optional[int] = Form(None),
    patientName: Optional[str] = Form(None),
    doctor: models.Doctor = Depends(get_current_doctor),
    db: DBSession = Depends(get_db),
):
    """Upload a consultation recording for a patient, identified by phone.

    If no patient exists with that phone yet, one is created on the spot under
    the signed-in doctor. The name is optional and can be filled in later via
    PATCH /patients/{phone}. The audio is stored and a Session is created with
    report_status='processing'; the job is enqueued on the async pipeline queue
    so this request returns immediately and is never blocked by transcription.
    """
    if not doctor.active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been deactivated")

    phone = (patientId or "").strip()
    if not phone:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A patient phone is required")

    patient = db.scalar(select(models.Patient).where(models.Patient.phone == phone))
    if patient is None:
        # Auto-create the patient so the doctor can start a session immediately.
        patient = models.Patient(
            phone=phone,
            name=(patientName or "").strip() or "New patient",
            doctor_id=doctor.id,
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
    elif patient.doctor_id != doctor.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your patient")

    # Persist the uploaded audio to disk.
    upload_dir = settings.audio_upload_dir
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(audio.filename or "")[1] or ".webm"
    dest = os.path.join(upload_dir, f"session_{uuid.uuid4().hex}{ext}")
    try:
        with open(dest, "wb") as out:
            shutil.copyfileobj(audio.file, out)
    finally:
        await audio.close()

    session = models.Session(
        patient_id=patient.id,
        title=None,
        transcript="",  # populated after transcription
        audio_path=dest,
        duration_sec=durationSec,
        report_status="processing",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    pipeline.enqueue(session.id, dest)
    return schemas.SessionCreatedOut(sessionId=str(session.id), status="processing")


@router.get("/sessions/{session_id}/status", response_model=schemas.SessionStatusOut)
def read_session_status(
    session_id: int,
    principal: Optional[Principal] = Depends(get_optional_principal),
    db: DBSession = Depends(get_db),
):
    session = resolve_session(db, session_id, principal)
    return schemas.SessionStatusOut(status=_public_status(session.report_status))

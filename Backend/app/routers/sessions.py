"""Session routes: create a consultation (transcript -> clinical report), read, regenerate."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from .. import models, schemas
from ..database import get_db
from ..deps import resolve_patient, resolve_session
from ..llm import LLMError
from ..models import utcnow
from ..security import Principal, get_principal
from ..services import report_service

router = APIRouter(tags=["sessions"])


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
            report = report_service.generate_report(body.transcript)
            report_service.apply_report_to_session(session, report)
        except LLMError as exc:
            report_service.mark_session_error(session, str(exc))
    else:
        report_service.mark_session_pending_key(session)

    db.add(session)
    db.commit()
    db.refresh(session)
    return schemas.serialize_session(session)


@router.get("/sessions/{session_id}", response_model=schemas.SessionOut)
def read_session(
    session_id: int,
    principal: Principal = Depends(get_principal),
    db: DBSession = Depends(get_db),
):
    session = resolve_session(db, session_id, principal)
    return schemas.serialize_session(session)


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
        report = report_service.generate_report(session.transcript)
        report_service.apply_report_to_session(session, report)
    except LLMError as exc:
        report_service.mark_session_error(session, str(exc))
        db.commit()
        db.refresh(session)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Report generation failed: {exc}")

    db.commit()
    db.refresh(session)
    return schemas.serialize_session(session)

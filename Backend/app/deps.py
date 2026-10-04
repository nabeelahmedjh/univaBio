"""Shared access-control helpers used by the routers."""
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from . import models
from .security import ROLE_DOCTOR, ROLE_PATIENT, Principal


def resolve_patient(db: DBSession, phone: str, principal: Principal) -> models.Patient:
    """Load a patient by phone and enforce that the caller may access it.

    - doctor: must own the patient
    - patient: must be themselves
    """
    patient = db.scalar(select(models.Patient).where(models.Patient.phone == phone))
    if patient is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")

    if principal.role == ROLE_DOCTOR:
        if patient.doctor_id != int(principal.subject):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your patient")
    elif principal.role == ROLE_PATIENT:
        if principal.subject != patient.phone:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Forbidden")
    else:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Forbidden")
    return patient


def resolve_session(db: DBSession, session_id: int, principal: Principal) -> models.Session:
    """Load a session and enforce access via its patient."""
    session = db.get(models.Session, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    # Reuse patient access rules.
    resolve_patient(db, session.patient.phone, principal)
    return session

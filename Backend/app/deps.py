"""Shared access-control helpers used by the routers."""
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from . import models
from .security import ROLE_DOCTOR, ROLE_SUPER_ADMIN, Principal


def resolve_patient(
    db: DBSession, phone: str, principal: Optional[Principal]
) -> models.Patient:
    """Load a patient by phone and enforce that the caller may access it.

    - anonymous (principal is None): a patient looking up their own record by
      phone (patient id); no authentication required.
    - doctor: must own the patient.
    - super_admin: full access.
    """
    patient = db.scalar(select(models.Patient).where(models.Patient.phone == phone))
    if patient is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")

    if principal is None or principal.role == ROLE_SUPER_ADMIN:
        return patient

    if principal.role == ROLE_DOCTOR:
        if patient.doctor_id != int(principal.subject):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your patient")
        return patient

    raise HTTPException(status.HTTP_403_FORBIDDEN, "Forbidden")


def resolve_session(
    db: DBSession, session_id: int, principal: Optional[Principal]
) -> models.Session:
    """Load a session and enforce access via its patient."""
    session = db.get(models.Session, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    # Reuse patient access rules.
    resolve_patient(db, session.patient.phone, principal)
    return session

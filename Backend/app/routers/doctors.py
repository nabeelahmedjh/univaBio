"""Doctor-facing routes: profile and patient roster (dashboard)."""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from .. import models, schemas
from ..database import get_db
from ..security import get_current_doctor

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("/me", response_model=schemas.DoctorOut)
def read_me(doctor: models.Doctor = Depends(get_current_doctor)):
    return doctor


@router.get("/me/patients", response_model=List[schemas.PatientSummary])
def read_my_patients(
    doctor: models.Doctor = Depends(get_current_doctor),
    db: DBSession = Depends(get_db),
):
    patients = db.scalars(
        select(models.Patient)
        .where(models.Patient.doctor_id == doctor.id)
        .order_by(models.Patient.name)
    ).all()

    roster: List[schemas.PatientSummary] = []
    for patient in patients:
        visits = [s.occurred_at for s in patient.sessions if s.occurred_at]
        roster.append(
            schemas.PatientSummary(
                phone=patient.phone,
                name=patient.name,
                session_count=len(patient.sessions),
                last_visit=max(visits) if visits else None,
            )
        )
    return roster

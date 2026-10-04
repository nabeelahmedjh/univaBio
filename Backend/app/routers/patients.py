"""Patient routes: creation (by doctor), lookup, update, and full history."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from .. import models, schemas
from ..database import get_db
from ..deps import resolve_patient
from ..security import (
    Principal,
    get_current_doctor,
    get_principal,
    hash_password,
)

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=schemas.PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(
    body: schemas.PatientCreate,
    doctor: models.Doctor = Depends(get_current_doctor),
    db: DBSession = Depends(get_db),
):
    exists = db.scalar(select(models.Patient).where(models.Patient.phone == body.phone))
    if exists is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "A patient with this phone already exists")

    patient = models.Patient(
        phone=body.phone,
        name=body.name,
        date_of_birth=body.date_of_birth,
        gender=body.gender,
        doctor_id=doctor.id,
        hashed_password=hash_password(body.password) if body.password else None,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/{phone}", response_model=schemas.PatientOut)
def read_patient(
    phone: str,
    principal: Principal = Depends(get_principal),
    db: DBSession = Depends(get_db),
):
    return resolve_patient(db, phone, principal)


@router.patch("/{phone}", response_model=schemas.PatientOut)
def update_patient(
    phone: str,
    body: schemas.PatientUpdate,
    principal: Principal = Depends(get_principal),
    db: DBSession = Depends(get_db),
):
    patient = resolve_patient(db, phone, principal)
    data = body.model_dump(exclude_unset=True)
    if "password" in data:
        password = data.pop("password")
        patient.hashed_password = hash_password(password) if password else None
    for field, value in data.items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/{phone}/history", response_model=schemas.HistoryOut)
def read_patient_history(
    phone: str,
    principal: Principal = Depends(get_principal),
    db: DBSession = Depends(get_db),
):
    patient = resolve_patient(db, phone, principal)
    sessions = db.scalars(
        select(models.Session)
        .where(models.Session.patient_id == patient.id)
        .order_by(models.Session.occurred_at.desc(), models.Session.id.desc())
    ).all()
    return schemas.HistoryOut(
        patient=schemas.PatientOut.model_validate(patient),
        sessions=[schemas.serialize_session(s) for s in sessions],
    )

"""Super admin routes: create, list, and manage doctor profiles."""
import secrets
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from .. import models, schemas
from ..database import get_db
from ..security import get_current_super_admin, hash_password

router = APIRouter(prefix="/admin", tags=["admin"])

_PASSWORD_WORDS = (
    "linen", "cedar", "harbor", "meadow", "amber",
    "willow", "sage", "ivory", "quill", "fern",
)


def _generate_password() -> str:
    w = lambda: secrets.choice(_PASSWORD_WORDS)  # noqa: E731
    return f"{w()}-{w()}-{secrets.randbelow(900) + 100}"


@router.post(
    "/doctors",
    response_model=schemas.DoctorOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_super_admin)],
)
def create_doctor(body: schemas.DoctorCreate, db: DBSession = Depends(get_db)):
    exists = db.scalar(select(models.Doctor).where(models.Doctor.username == body.username))
    if exists is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")

    doctor = models.Doctor(
        username=body.username,
        name=body.name,
        specialty=body.specialty,
        hashed_password=hash_password(body.password),
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.get(
    "/doctors",
    response_model=List[schemas.DoctorOut],
    dependencies=[Depends(get_current_super_admin)],
)
def list_doctors(db: DBSession = Depends(get_db)):
    return db.scalars(select(models.Doctor).order_by(models.Doctor.id)).all()


@router.patch(
    "/doctors/{doctor_id}",
    response_model=schemas.DoctorOut,
    dependencies=[Depends(get_current_super_admin)],
)
def set_doctor_active(
    doctor_id: int,
    body: schemas.DoctorActiveUpdate,
    db: DBSession = Depends(get_db),
):
    doctor = db.get(models.Doctor, doctor_id)
    if doctor is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Doctor not found")
    doctor.active = body.active
    db.commit()
    db.refresh(doctor)
    return doctor


@router.post(
    "/doctors/{doctor_id}/reset-password",
    response_model=schemas.ResetPasswordOut,
    dependencies=[Depends(get_current_super_admin)],
)
def reset_doctor_password(doctor_id: int, db: DBSession = Depends(get_db)):
    doctor = db.get(models.Doctor, doctor_id)
    if doctor is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Doctor not found")
    new_password = _generate_password()
    doctor.hashed_password = hash_password(new_password)
    db.commit()
    return schemas.ResetPasswordOut(password=new_password)

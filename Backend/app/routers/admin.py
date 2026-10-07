"""Super admin routes: create and list doctor profiles."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from .. import models, schemas
from ..database import get_db
from ..security import get_current_super_admin, hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


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

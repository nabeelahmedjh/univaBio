"""Authentication: single login endpoint for super_admin and doctor.

Patients do not authenticate. They look up their record by phone (patient id)
on the patient-facing routes, so there is no patient login here.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from .. import models, schemas
from ..config import settings
from ..database import get_db
from ..security import (
    ROLE_DOCTOR,
    ROLE_SUPER_ADMIN,
    constant_time_equals,
    create_access_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=schemas.Token)
def login(body: schemas.LoginRequest, db: DBSession = Depends(get_db)):
    role = body.role.lower()

    if role == ROLE_SUPER_ADMIN:
        if not (
            constant_time_equals(body.identifier, settings.super_admin_username)
            and constant_time_equals(body.password, settings.super_admin_pass)
        ):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid super admin credentials")
        token = create_access_token(subject=settings.super_admin_username, role=ROLE_SUPER_ADMIN)
        return schemas.Token(access_token=token, role=ROLE_SUPER_ADMIN)

    if role == ROLE_DOCTOR:
        doctor = db.scalar(select(models.Doctor).where(models.Doctor.username == body.identifier))
        if doctor is None or not verify_password(body.password, doctor.hashed_password):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username or password")
        if not doctor.active:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been deactivated")
        token = create_access_token(subject=str(doctor.id), role=ROLE_DOCTOR)
        return schemas.Token(access_token=token, role=ROLE_DOCTOR)

    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid role")

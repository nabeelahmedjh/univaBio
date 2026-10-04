"""Password hashing, JWT creation/verification, and role-based auth dependencies."""
import hmac
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from . import models
from .config import settings
from .database import get_db

bearer_scheme = HTTPBearer(auto_error=False)

ROLE_SUPER_ADMIN = "super_admin"
ROLE_DOCTOR = "doctor"
ROLE_PATIENT = "patient"


# ---------- Password hashing ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def constant_time_equals(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


# ---------- JWT ----------
def create_access_token(subject: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")


class Principal:
    """Authenticated caller identity."""

    def __init__(self, role: str, subject: str):
        self.role = role
        self.subject = subject


async def get_principal(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Principal:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    return Principal(role=payload.get("role"), subject=str(payload.get("sub")))


async def get_current_super_admin(
    principal: Principal = Depends(get_principal),
) -> Principal:
    if principal.role != ROLE_SUPER_ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Super admin privileges required")
    return principal


async def get_current_doctor(
    principal: Principal = Depends(get_principal),
    db: DBSession = Depends(get_db),
) -> models.Doctor:
    if principal.role != ROLE_DOCTOR:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Doctor privileges required")
    doctor = db.get(models.Doctor, int(principal.subject))
    if doctor is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Doctor no longer exists")
    return doctor


async def get_current_patient(
    principal: Principal = Depends(get_principal),
    db: DBSession = Depends(get_db),
) -> models.Patient:
    if principal.role != ROLE_PATIENT:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Patient privileges required")
    patient = db.scalar(select(models.Patient).where(models.Patient.phone == principal.subject))
    if patient is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Patient no longer exists")
    return patient

"""Pydantic request/response schemas."""
import json
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------- Auth ----------
class LoginRequest(BaseModel):
    role: str = Field(..., description="One of: super_admin, doctor, patient")
    identifier: str = Field(..., description="username (doctor/super_admin) or phone (patient)")
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


# ---------- Doctor ----------
class DoctorCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=150)
    name: str = Field(..., min_length=1, max_length=255)
    specialty: Optional[str] = None
    password: str = Field(..., min_length=6)


class DoctorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    name: str
    specialty: Optional[str] = None
    created_at: datetime


# ---------- Patient ----------
class PatientCreate(BaseModel):
    phone: str = Field(..., min_length=4, max_length=32)
    name: str = Field(..., min_length=1, max_length=255)
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6)


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6)


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    name: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    doctor_id: int
    created_at: datetime


class PatientSummary(BaseModel):
    """Patient card for the doctor dashboard roster."""

    model_config = ConfigDict(from_attributes=True)

    phone: str
    name: str
    session_count: int
    last_visit: Optional[datetime] = None


# ---------- Clinical report ----------
class ClinicalReportOut(BaseModel):
    status: str
    summary: Optional[str] = None
    symptoms: List[str] = []
    issues_discussed: List[str] = []
    diagnosis: Optional[str] = None
    action_steps: List[str] = []
    medications: List[str] = []
    follow_up: Optional[str] = None
    error: Optional[str] = None


# ---------- Session ----------
class SessionCreate(BaseModel):
    title: Optional[str] = None
    transcript: str = Field(..., min_length=1)
    occurred_at: Optional[datetime] = None


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    title: Optional[str] = None
    transcript: str
    occurred_at: datetime
    created_at: datetime
    report: ClinicalReportOut


class HistoryOut(BaseModel):
    patient: PatientOut
    sessions: List[SessionOut]


def _decode_list(raw: Optional[str]) -> List[str]:
    """Decode a JSON-encoded list column into a list of strings."""
    if not raw:
        return []
    try:
        value = json.loads(raw)
    except (ValueError, TypeError):
        return []
    if isinstance(value, list):
        return [str(v) for v in value]
    return [str(value)]


def serialize_session(session) -> "SessionOut":
    """Build a SessionOut from a Session ORM object, decoding embedded report fields."""
    report = ClinicalReportOut(
        status=session.report_status,
        summary=session.summary,
        symptoms=_decode_list(session.symptoms),
        issues_discussed=_decode_list(session.issues_discussed),
        diagnosis=session.diagnosis,
        action_steps=_decode_list(session.action_steps),
        medications=_decode_list(session.medications),
        follow_up=session.follow_up,
        error=session.report_error,
    )
    return SessionOut(
        id=session.id,
        patient_id=session.patient_id,
        title=session.title,
        transcript=session.transcript,
        occurred_at=session.occurred_at,
        created_at=session.created_at,
        report=report,
    )

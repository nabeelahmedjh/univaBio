"""Pydantic request/response schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------- Auth ----------
class LoginRequest(BaseModel):
    role: str = Field(..., description="One of: super_admin, doctor")
    identifier: str = Field(..., description="username (doctor/super_admin)")
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
    active: bool = True
    created_at: datetime


class DoctorActiveUpdate(BaseModel):
    active: bool


class ResetPasswordOut(BaseModel):
    password: str


class DoctorOverview(BaseModel):
    """Dashboard stats for the signed-in doctor."""

    totalPatients: int
    totalSessions: int
    weekSessions: int
    weekByDay: List[int]  # Monday -> Sunday, length 7
    todaySessions: int


class DoctorSessionActivity(BaseModel):
    """Recent session row for the doctor dashboard timeline."""

    id: int
    patientId: str
    patientName: str
    title: str
    date: datetime
    status: str  # processing | ready | failed
    durationSec: Optional[int] = None


# ---------- Public access request ----------
class AccessRequest(BaseModel):
    name: str
    email: str
    clinic: str
    message: Optional[str] = None


class AccessRequestOut(BaseModel):
    ok: bool = True


# ---------- Patient ----------
class PatientCreate(BaseModel):
    phone: str = Field(..., min_length=4, max_length=32)
    name: str = Field(..., min_length=1, max_length=255)
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    name: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    doctor_id: int
    doctor_name: Optional[str] = None
    created_at: datetime


class PatientSummary(BaseModel):
    """Patient card for the doctor dashboard roster."""

    model_config = ConfigDict(from_attributes=True)

    phone: str
    name: str
    session_count: int
    last_visit: Optional[datetime] = None


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
    duration_sec: Optional[int] = None
    occurred_at: datetime
    created_at: datetime
    # Clinical report as a single Markdown string (rendered in the UI).
    report_status: str
    report_markdown: Optional[str] = None
    report_error: Optional[str] = None


class SessionCreatedOut(BaseModel):
    """Response for the audio-upload flow: the client then polls for status."""

    sessionId: str
    status: str  # processing | ready | failed


class SessionStatusOut(BaseModel):
    status: str  # processing | ready | failed


class HistoryOut(BaseModel):
    patient: PatientOut
    sessions: List[SessionOut]

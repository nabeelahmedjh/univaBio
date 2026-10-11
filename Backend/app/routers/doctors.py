"""Doctor-facing routes: profile, dashboard overview, and patient roster."""
from datetime import timedelta, timezone
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from .. import models, schemas
from ..database import get_db
from ..models import utcnow
from ..security import get_current_doctor
from ..services import report_service

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("/me", response_model=schemas.DoctorOut)
def read_me(doctor: models.Doctor = Depends(get_current_doctor)):
    return doctor


@router.get("/me/overview", response_model=schemas.DoctorOverview)
def read_overview(
    doctor: models.Doctor = Depends(get_current_doctor),
    db: DBSession = Depends(get_db),
):
    """Aggregate dashboard stats: totals plus this week (Mon→Sun) and today."""
    patient_ids = list(
        db.scalars(
            select(models.Patient.id).where(models.Patient.doctor_id == doctor.id)
        ).all()
    )

    now = utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today - timedelta(days=today.weekday())  # Monday 00:00
    week_end = week_start + timedelta(days=7)

    week_by_day = [0, 0, 0, 0, 0, 0, 0]
    today_sessions = 0
    total_sessions = 0

    if patient_ids:
        sessions = db.scalars(
            select(models.Session.occurred_at).where(
                models.Session.patient_id.in_(patient_ids)
            )
        ).all()
        for occurred in sessions:
            if occurred is None:
                continue
            if occurred.tzinfo is None:
                occurred = occurred.replace(tzinfo=timezone.utc)
            total_sessions += 1
            if occurred >= today:
                today_sessions += 1
            if week_start <= occurred < week_end:
                week_by_day[occurred.weekday()] += 1

    return schemas.DoctorOverview(
        totalPatients=len(patient_ids),
        totalSessions=total_sessions,
        weekSessions=sum(week_by_day),
        weekByDay=week_by_day,
        todaySessions=today_sessions,
    )


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


@router.get("/me/sessions", response_model=List[schemas.DoctorSessionActivity])
def read_my_sessions(
    doctor: models.Doctor = Depends(get_current_doctor),
    db: DBSession = Depends(get_db),
    limit: int = 8,
):
    """Recent sessions across the doctor's patients, newest first.

    Powers the dashboard activity timeline, including in-flight sessions whose
    report is still being transcribed/generated (status 'processing').
    """
    rows = db.scalars(
        select(models.Session)
        .join(models.Patient, models.Session.patient_id == models.Patient.id)
        .where(models.Patient.doctor_id == doctor.id)
        .order_by(models.Session.occurred_at.desc(), models.Session.created_at.desc())
        .limit(max(1, min(limit, 50)))
    ).all()

    return [
        schemas.DoctorSessionActivity(
            id=s.id,
            patientId=s.patient.phone,
            patientName=s.patient.name,
            title=s.title or "Session",
            date=s.occurred_at,
            status=report_service.public_status(s.report_status),
            durationSec=s.duration_sec,
        )
        for s in rows
    ]

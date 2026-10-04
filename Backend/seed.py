"""Seed the database with a demo doctor, patient, and one sample session.

Usage:
    python seed.py
"""
from sqlalchemy import select

from app.database import SessionLocal, init_db
from app import models
from app.security import hash_password
from app.services import report_service

DEMO_DOCTOR = {
    "username": "drsmith",
    "name": "Dr. John Smith",
    "specialty": "General Physician",
    "password": "doctor123",
}

DEMO_PATIENT = {
    "phone": "+15550001111",
    "name": "Alice Patient",
    "date_of_birth": "1990-04-12",
    "gender": "female",
    "password": "patient123",
}

SAMPLE_TRANSCRIPT = (
    "Doctor: Hi Alice, what brings you in today?\n"
    "Patient: I've had a sore throat and a mild fever for the past three days. "
    "It hurts to swallow and I've felt very tired.\n"
    "Doctor: Any cough or body aches?\n"
    "Patient: A dry cough at night, and some body aches.\n"
    "Doctor: Let me take a look. Your throat is a bit red. I'll prescribe "
    "paracetamol 500mg twice a day for the fever and pain, and advise warm salt-water "
    "gargles. Please rest and drink plenty of fluids.\n"
    "Patient: Should I come back?\n"
    "Doctor: Yes, follow up in three days if the fever does not go down, or sooner if "
    "you have trouble breathing."
)


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        doctor = db.scalar(select(models.Doctor).where(models.Doctor.username == DEMO_DOCTOR["username"]))
        if doctor is None:
            doctor = models.Doctor(
                username=DEMO_DOCTOR["username"],
                name=DEMO_DOCTOR["name"],
                specialty=DEMO_DOCTOR["specialty"],
                hashed_password=hash_password(DEMO_DOCTOR["password"]),
            )
            db.add(doctor)
            db.commit()
            db.refresh(doctor)
            print(f"Created doctor '{doctor.username}' (id={doctor.id})")
        else:
            print(f"Doctor '{doctor.username}' already exists (id={doctor.id})")

        patient = db.scalar(select(models.Patient).where(models.Patient.phone == DEMO_PATIENT["phone"]))
        if patient is None:
            patient = models.Patient(
                phone=DEMO_PATIENT["phone"],
                name=DEMO_PATIENT["name"],
                date_of_birth=DEMO_PATIENT["date_of_birth"],
                gender=DEMO_PATIENT["gender"],
                doctor_id=doctor.id,
                hashed_password=hash_password(DEMO_PATIENT["password"]),
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)
            print(f"Created patient '{patient.name}' (phone={patient.phone})")
        else:
            print(f"Patient '{patient.name}' already exists (phone={patient.phone})")

        existing_sessions = db.scalars(
            select(models.Session).where(models.Session.patient_id == patient.id)
        ).all()
        if not existing_sessions:
            session = models.Session(
                patient_id=patient.id,
                title="Initial consultation - sore throat",
                transcript=SAMPLE_TRANSCRIPT,
            )
            if report_service.provider_is_configured():
                try:
                    report_service.apply_report_to_session(
                        session, report_service.generate_report(SAMPLE_TRANSCRIPT)
                    )
                    print("Generated clinical report from sample transcript.")
                except Exception as exc:  # noqa: BLE001
                    report_service.mark_session_error(session, str(exc))
                    print(f"Report generation failed: {exc}")
            else:
                report_service.mark_session_pending_key(session)
                print("LLM key not configured; stored transcript with status 'pending_key'.")

            db.add(session)
            db.commit()
            db.refresh(session)
            print(f"Created session id={session.id} (status={session.report_status})")
        else:
            print("Sample session already exists; skipping.")

        print("\nSeed complete. Login examples:")
        print(f"  doctor  -> username: {DEMO_DOCTOR['username']}, password: {DEMO_DOCTOR['password']}")
        print(f"  patient -> phone: {DEMO_PATIENT['phone']}, password: {DEMO_PATIENT['password']}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()

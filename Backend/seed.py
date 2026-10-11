"""Seed the database with a demo doctor, several patients, and sample sessions.

Each session is stored with a ready-made Markdown clinical report so the UI has
realistic content to show without waiting on the LLM. Session dates are spread
relative to "now" so the dashboard (today / this week) has data.

Usage:
    python seed.py
"""
from datetime import timedelta
from typing import Dict, List

from sqlalchemy import select

from app.database import SessionLocal, init_db
from app import models
from app.models import utcnow
from app.security import hash_password

DEMO_DOCTOR = {
    "username": "drsmith",
    "name": "John Smith",
    "specialty": "General Practice",
    "password": "doctor123",
}

# Markdown section order used by build_markdown().
_SECTIONS: List[tuple] = [
    ("summary", "Summary", "text"),
    ("symptoms", "Symptoms", "list"),
    ("issues", "Issues Discussed", "list"),
    ("diagnosis", "Diagnosis", "text"),
    ("action", "Action Steps", "list"),
    ("medications", "Medications", "list"),
    ("follow_up", "Follow-up", "text"),
]


def build_markdown(report: Dict) -> str:
    """Compose a Markdown clinical report from a section dict, omitting empties."""
    blocks: List[str] = []
    for key, heading, kind in _SECTIONS:
        value = report.get(key)
        if kind == "list":
            items = [str(v).strip() for v in (value or []) if str(v).strip()]
            if not items:
                continue
            body = "\n".join(f"- {item}" for item in items)
        else:
            text = str(value or "").strip()
            if not text:
                continue
            body = text
        blocks.append(f"## {heading}\n{body}")
    return "\n\n".join(blocks)


# Each patient: phone is the public patient id used across the app.
# Each session: days_ago + hour place occurred_at relative to now.
PATIENTS: List[Dict] = [
    {
        "phone": "+15550001111",
        "name": "Alice Patient",
        "date_of_birth": "1990-04-12",
        "gender": "female",
        "sessions": [
            {
                "title": "Sore throat and fever",
                "days_ago": 0,
                "hour": 9,
                "duration_sec": 754,
                "transcript": (
                    "Doctor: Hi Alice, what brings you in today?\n"
                    "Patient: I've had a sore throat and a mild fever for three days. It hurts to swallow.\n"
                    "Doctor: Any cough or body aches?\n"
                    "Patient: A dry cough at night and some body aches.\n"
                    "Doctor: Your throat is a bit red. I'll prescribe paracetamol and advise warm salt-water gargles."
                ),
                "report": {
                    "summary": (
                        "Alice presented with a three-day history of sore throat and mild fever, "
                        "with pain on swallowing, a dry night-time cough and general body aches."
                    ),
                    "symptoms": ["Sore throat", "Mild fever", "Painful swallowing", "Dry cough at night", "Body aches"],
                    "issues": ["Possible viral pharyngitis", "Symptom relief at home"],
                    "diagnosis": "Mildly reddened throat consistent with a viral upper-respiratory infection.",
                    "action": [
                        "Rest and drink plenty of fluids",
                        "Warm salt-water gargles several times a day",
                        "Return sooner if breathing becomes difficult",
                    ],
                    "medications": ["Paracetamol 500mg, twice a day for fever and pain"],
                    "follow_up": "Follow up in three days if the fever does not settle.",
                },
            },
            {
                "title": "Annual check-up",
                "days_ago": 3,
                "hour": 11,
                "duration_sec": 1320,
                "transcript": (
                    "Doctor: Let's go through your general health this year.\n"
                    "Patient: I've been well, just occasional headaches after long days at work.\n"
                    "Doctor: Blood pressure is slightly elevated today. We'll recheck and discuss lifestyle."
                ),
                "report": {
                    "summary": (
                        "Routine annual review. Alice reports good general health with occasional "
                        "tension-type headaches after long working days."
                    ),
                    "symptoms": ["Occasional headaches"],
                    "issues": ["Slightly elevated blood pressure", "Work-related stress"],
                    "diagnosis": "Otherwise well; borderline blood pressure reading to recheck.",
                    "action": ["Repeat blood pressure in two weeks", "Reduce salt intake", "Regular short breaks at work"],
                    "medications": [],
                    "follow_up": "Nurse blood-pressure check in two weeks.",
                },
            },
            {
                "title": "Persistent cough follow-up",
                "days_ago": 26,
                "hour": 15,
                "duration_sec": 640,
                "transcript": (
                    "Doctor: How is the cough now?\n"
                    "Patient: Much better, only occasionally in the morning.\n"
                    "Doctor: Good, no further treatment needed unless it worsens."
                ),
                "report": {
                    "summary": "Follow-up for a lingering cough which has now largely resolved.",
                    "symptoms": ["Occasional morning cough"],
                    "issues": ["Recovery from a previous chest cold"],
                    "diagnosis": "Resolving post-viral cough; no signs of infection.",
                    "action": ["No treatment required", "Return if the cough worsens or fever returns"],
                    "medications": [],
                    "follow_up": "As needed.",
                },
            },
        ],
    },
    {
        "phone": "+15550002222",
        "name": "Marcus Chen",
        "date_of_birth": "1985-11-02",
        "gender": "male",
        "sessions": [
            {
                "title": "Lower back strain",
                "days_ago": 1,
                "hour": 10,
                "duration_sec": 980,
                "transcript": (
                    "Patient: I strained my back lifting a box two days ago.\n"
                    "Doctor: Any numbness or tingling down the leg?\n"
                    "Patient: No, just soreness.\n"
                    "Doctor: Likely a muscular strain. We'll use anti-inflammatories and gentle movement."
                ),
                "report": {
                    "summary": (
                        "Marcus strained his lower back lifting a heavy box two days ago, with soreness "
                        "but no radiating leg symptoms."
                    ),
                    "symptoms": ["Lower back soreness", "Pain on lifting"],
                    "issues": ["Muscular strain", "Safe return to activity"],
                    "diagnosis": "Uncomplicated muscular lower-back strain; no neurological signs.",
                    "action": ["Stay gently active", "Apply heat", "Avoid heavy lifting for a week"],
                    "medications": ["Ibuprofen 400mg, up to three times a day with food"],
                    "follow_up": "Review in two weeks if not improving.",
                },
            },
            {
                "title": "Blood pressure review",
                "days_ago": 40,
                "hour": 14,
                "duration_sec": 720,
                "transcript": (
                    "Doctor: Your home readings look better this month.\n"
                    "Patient: Yes, I've been walking more and cutting back on salt.\n"
                    "Doctor: Great, we'll keep the current dose."
                ),
                "report": {
                    "summary": "Hypertension review with improved home blood-pressure readings.",
                    "symptoms": [],
                    "issues": ["Blood pressure control", "Lifestyle measures"],
                    "diagnosis": "Hypertension, better controlled on current treatment.",
                    "action": ["Continue daily walking", "Maintain reduced salt intake", "Keep a home BP diary"],
                    "medications": ["Amlodipine 5mg, once daily (unchanged)"],
                    "follow_up": "Routine review in three months.",
                },
            },
        ],
    },
    {
        "phone": "+15550003333",
        "name": "Priya Natarajan",
        "date_of_birth": "1998-06-21",
        "gender": "female",
        "sessions": [
            {
                "title": "Asthma review",
                "days_ago": 2,
                "hour": 16,
                "duration_sec": 1105,
                "transcript": (
                    "Patient: My inhaler is helping but I still wake at night sometimes.\n"
                    "Doctor: Let's check your spacer technique and adjust the preventer dose."
                ),
                "report": {
                    "summary": "Asthma review. Control has improved but night-time symptoms still occur occasionally.",
                    "symptoms": ["Occasional night-time wheeze"],
                    "issues": ["Inhaler technique", "Preventer dose"],
                    "diagnosis": "Partly controlled asthma.",
                    "action": ["Use a spacer with the reliever", "Review inhaler technique", "Keep a symptom diary"],
                    "medications": ["Salbutamol reliever as needed", "Beclometasone preventer, increased to twice daily"],
                    "follow_up": "Asthma nurse review in six weeks.",
                },
            },
            {
                "title": "Seasonal allergies",
                "days_ago": 5,
                "hour": 9,
                "duration_sec": 540,
                "transcript": (
                    "Patient: My eyes are itchy and I keep sneezing in the mornings.\n"
                    "Doctor: That sounds like hay fever; an antihistamine should help."
                ),
                "report": {
                    "summary": "Seasonal allergy symptoms with itchy eyes and morning sneezing.",
                    "symptoms": ["Itchy eyes", "Sneezing", "Runny nose"],
                    "issues": ["Hay fever management"],
                    "diagnosis": "Seasonal allergic rhinitis.",
                    "action": ["Start a non-drowsy antihistamine", "Keep windows closed on high-pollen days"],
                    "medications": ["Cetirizine 10mg, once daily as needed"],
                    "follow_up": "As needed during the pollen season.",
                },
            },
            {
                "title": "Fatigue and bloods",
                "days_ago": 12,
                "hour": 13,
                "duration_sec": 860,
                "transcript": (
                    "Patient: I've been feeling tired for weeks.\n"
                    "Doctor: We'll do a full blood count and check your iron and thyroid."
                ),
                "report": {
                    "summary": "Persistent tiredness over several weeks; blood tests arranged.",
                    "symptoms": ["Fatigue"],
                    "issues": ["Possible anaemia", "Thyroid function"],
                    "diagnosis": "Tiredness, cause under investigation.",
                    "action": ["Full blood count", "Iron studies", "Thyroid function test"],
                    "medications": [],
                    "follow_up": "Telephone review once results are back.",
                },
            },
            {
                "title": "Blood test results",
                "days_ago": 8,
                "hour": 10,
                "duration_sec": 480,
                "transcript": (
                    "Doctor: Your iron is a little low, which explains the tiredness.\n"
                    "Patient: That makes sense. What should I do?\n"
                    "Doctor: Start an iron supplement and recheck in six weeks."
                ),
                "report": {
                    "summary": "Blood results show low iron, consistent with the reported fatigue.",
                    "symptoms": ["Fatigue"],
                    "issues": ["Iron deficiency"],
                    "diagnosis": "Mild iron-deficiency anaemia.",
                    "action": ["Start iron supplementation", "Increase iron-rich foods", "Recheck in six weeks"],
                    "medications": ["Ferrous fumarate 210mg, once daily"],
                    "follow_up": "Repeat bloods in six weeks.",
                },
            },
        ],
    },
    {
        "phone": "+15550004444",
        "name": "Diego Ramirez",
        "date_of_birth": "1972-01-30",
        "gender": "male",
        "sessions": [
            {
                "title": "Diabetes follow-up",
                "days_ago": 4,
                "hour": 15,
                "duration_sec": 1410,
                "transcript": (
                    "Patient: My sugar levels have been steadier since the dose change.\n"
                    "Doctor: Excellent, your HbA1c has improved too. Let's keep the plan."
                ),
                "report": {
                    "summary": "Type 2 diabetes follow-up with improved and steadier glucose control.",
                    "symptoms": [],
                    "issues": ["Glycaemic control", "Medication adherence"],
                    "diagnosis": "Type 2 diabetes, improving control.",
                    "action": ["Continue current medication", "Maintain diet and activity plan", "Keep glucose log"],
                    "medications": ["Metformin 1000mg, twice daily"],
                    "follow_up": "HbA1c and review in three months.",
                },
            },
        ],
    },
    {
        "phone": "+15550005555",
        "name": "Hannah Weiss",
        "date_of_birth": "2001-09-08",
        "gender": "female",
        "sessions": [
            {
                "title": "Migraine assessment",
                "days_ago": 0,
                "hour": 12,
                "duration_sec": 900,
                "transcript": (
                    "Patient: I get bad headaches with light sensitivity about twice a month.\n"
                    "Doctor: These sound like migraines. We'll start a symptom diary and discuss treatment."
                ),
                "report": {
                    "summary": "Recurrent headaches with light sensitivity, around twice a month.",
                    "symptoms": ["Throbbing headache", "Light sensitivity", "Occasional nausea"],
                    "issues": ["Migraine diagnosis", "Trigger tracking"],
                    "diagnosis": "Episodic migraine without aura.",
                    "action": ["Keep a headache diary", "Identify triggers", "Rest in a dark room during attacks"],
                    "medications": ["Paracetamol or ibuprofen at onset of an attack"],
                    "follow_up": "Review in a month; consider preventers if frequent.",
                },
            },
            {
                "title": "Skin rash",
                "days_ago": 18,
                "hour": 11,
                "duration_sec": 610,
                "transcript": (
                    "Patient: I have an itchy patch on my arm.\n"
                    "Doctor: It looks like eczema; a topical cream should settle it."
                ),
                "report": {
                    "summary": "Itchy patch on the arm consistent with eczema.",
                    "symptoms": ["Itchy skin", "Dry patch"],
                    "issues": ["Eczema management"],
                    "diagnosis": "Mild localised eczema.",
                    "action": ["Apply moisturiser daily", "Avoid harsh soaps", "Use the cream as directed"],
                    "medications": ["Hydrocortisone 1% cream, twice daily for up to a week"],
                    "follow_up": "As needed if not improving.",
                },
            },
        ],
    },
]


def _occurred_at(days_ago: int, hour: int) -> "object":
    when = utcnow() - timedelta(days=days_ago)
    return when.replace(hour=hour, minute=(days_ago * 7) % 60, second=0, microsecond=0)


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        doctor = db.scalar(
            select(models.Doctor).where(models.Doctor.username == DEMO_DOCTOR["username"])
        )
        if doctor is None:
            doctor = models.Doctor(
                username=DEMO_DOCTOR["username"],
                name=DEMO_DOCTOR["name"],
                specialty=DEMO_DOCTOR["specialty"],
                hashed_password=hash_password(DEMO_DOCTOR["password"]),
                active=True,
            )
            db.add(doctor)
            db.commit()
            db.refresh(doctor)
            print(f"Created doctor '{doctor.username}' (id={doctor.id})")
        else:
            print(f"Doctor '{doctor.username}' already exists (id={doctor.id})")

        total_sessions = 0
        for pdata in PATIENTS:
            patient = db.scalar(
                select(models.Patient).where(models.Patient.phone == pdata["phone"])
            )
            if patient is None:
                patient = models.Patient(
                    phone=pdata["phone"],
                    name=pdata["name"],
                    date_of_birth=pdata["date_of_birth"],
                    gender=pdata["gender"],
                    doctor_id=doctor.id,
                )
                db.add(patient)
                db.commit()
                db.refresh(patient)
                print(f"Created patient '{patient.name}' (phone={patient.phone})")

            existing = db.scalars(
                select(models.Session).where(models.Session.patient_id == patient.id)
            ).all()
            if existing:
                print(f"  '{patient.name}' already has {len(existing)} session(s); skipping.")
                continue

            for s in pdata["sessions"]:
                session = models.Session(
                    patient_id=patient.id,
                    title=s["title"],
                    transcript=s["transcript"],
                    duration_sec=s.get("duration_sec"),
                    occurred_at=_occurred_at(s["days_ago"], s["hour"]),
                    report_status="generated",
                    report_markdown=build_markdown(s["report"]),
                )
                db.add(session)
                total_sessions += 1
            db.commit()

        print(f"\nSeed complete: 1 doctor, {len(PATIENTS)} patients, {total_sessions} new sessions.")
        print("Login / lookup:")
        print(f"  doctor       -> username: {DEMO_DOCTOR['username']}, password: {DEMO_DOCTOR['password']}")
        print(f"  patient ids  -> {', '.join(p['phone'] for p in PATIENTS)}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()

"""Turn a conversation transcript into a structured clinical report on a Session."""
import json
from typing import Any, Dict, List

from ..llm import ClinicalReport, LLMError, get_provider
from ..llm.prompts import SYSTEM_PROMPT, build_user_prompt
from ..models import Session


def provider_is_configured() -> bool:
    try:
        return get_provider().is_configured
    except LLMError:
        return False


def _as_str_list(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    text = str(value).strip()
    return [text] if text else []


def _normalize(data: Dict[str, Any]) -> ClinicalReport:
    def opt_str(key: str):
        val = data.get(key)
        if val is None:
            return None
        text = str(val).strip()
        return text or None

    return ClinicalReport(
        summary=opt_str("summary"),
        symptoms=_as_str_list(data.get("symptoms")),
        issues_discussed=_as_str_list(data.get("issues_discussed")),
        diagnosis=opt_str("diagnosis"),
        action_steps=_as_str_list(data.get("action_steps")),
        medications=_as_str_list(data.get("medications")),
        follow_up=opt_str("follow_up"),
        raw=data,
    )


def generate_report(transcript: str) -> ClinicalReport:
    """Call the LLM and return a normalized ClinicalReport. Raises LLMError on failure."""
    provider = get_provider()
    data = provider.complete_json(SYSTEM_PROMPT, build_user_prompt(transcript))
    return _normalize(data)


def apply_report_to_session(session: Session, report: ClinicalReport) -> None:
    """Write a ClinicalReport onto the Session's embedded report columns."""
    session.report_status = "generated"
    session.summary = report.summary
    session.symptoms = json.dumps(report.symptoms)
    session.issues_discussed = json.dumps(report.issues_discussed)
    session.diagnosis = report.diagnosis
    session.action_steps = json.dumps(report.action_steps)
    session.medications = json.dumps(report.medications)
    session.follow_up = report.follow_up
    session.report_raw = json.dumps(report.raw)
    session.report_error = None


def mark_session_error(session: Session, message: str) -> None:
    session.report_status = "error"
    session.report_error = message


def mark_session_pending_key(session: Session) -> None:
    session.report_status = "pending_key"
    session.report_error = "LLM API key not configured; transcript stored without a report."

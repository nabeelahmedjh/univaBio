"""Turn a conversation transcript into a Markdown clinical report on a Session."""
from ..llm import LLMError, get_provider
from ..llm.prompts import SYSTEM_PROMPT, build_user_prompt
from ..models import Session
from .transcription import TranscriptionError, transcribe


def provider_is_configured() -> bool:
    try:
        return get_provider().is_configured
    except LLMError:
        return False


def public_status(report_status: str) -> str:
    """Map the internal report_status to the client's processing/ready/failed."""
    if report_status == "processing":
        return "processing"
    if report_status == "error":
        return "failed"
    return "ready"  # generated or pending_key


def generate_report(transcript: str) -> str:
    """Call the LLM and return the clinical report as Markdown text.

    Raises LLMError on failure or if the model returns an empty report.
    """
    provider = get_provider()
    markdown = provider.complete_text(SYSTEM_PROMPT, build_user_prompt(transcript))
    if not markdown or not markdown.strip():
        raise LLMError("Model returned an empty report")
    return markdown.strip()


def apply_report_to_session(session: Session, markdown: str) -> None:
    """Write the Markdown report onto the Session."""
    session.report_status = "generated"
    session.report_markdown = markdown
    session.report_error = None


def mark_session_error(session: Session, message: str) -> None:
    session.report_status = "error"
    session.report_error = message


def mark_session_pending_key(session: Session) -> None:
    session.report_status = "pending_key"
    session.report_error = "LLM API key not configured; transcript stored without a report."


def list_stuck_sessions() -> list:
    """Return [(session_id, audio_path)] for sessions stranded in 'processing'.

    Used at startup to re-queue jobs lost to a crash or restart.
    """
    from ..database import SessionLocal

    db = SessionLocal()
    try:
        rows = (
            db.query(Session)
            .filter(Session.report_status == "processing")
            .all()
        )
        return [(s.id, s.audio_path) for s in rows if s.audio_path]
    finally:
        db.close()


def process_audio_session(session_id: int, audio_path: str) -> None:
    """Background task: transcribe the uploaded audio, then generate the report.

    Runs after the upload response is sent. Uses its own DB session and moves the
    Session through report_status: processing -> generated | pending_key | error.
    """
    from ..database import SessionLocal

    db = SessionLocal()
    try:
        session = db.get(Session, session_id)
        if session is None:
            return

        try:
            transcript = transcribe(audio_path)
        except TranscriptionError as exc:
            session.report_status = "error"
            session.report_error = str(exc)
            db.commit()
            return

        session.transcript = transcript
        if provider_is_configured():
            try:
                apply_report_to_session(session, generate_report(transcript))
            except LLMError as exc:
                mark_session_error(session, str(exc))
        else:
            mark_session_pending_key(session)
        db.commit()
    finally:
        db.close()

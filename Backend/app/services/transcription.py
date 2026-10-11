"""Local speech-to-text using OpenAI Whisper.

The model is loaded lazily and cached in-process (loading is expensive). The
package is imported inside the loader so importing this module stays cheap and
the heavy torch/whisper import only happens on first transcription.
"""
import threading
from typing import Optional

from ..config import settings

_model = None
_lock = threading.Lock()
# Whisper's model instance is not thread-safe: concurrent transcribe() calls on
# the shared model corrupt internal state. Serialize all transcription here so
# multiple pipeline workers can queue safely (LLM/DB still overlap).
_transcribe_lock = threading.Lock()


class TranscriptionError(Exception):
    """Raised when audio cannot be transcribed."""


def _get_model():
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                try:
                    import whisper  # heavy dependency, imported lazily
                except ImportError as exc:  # pragma: no cover
                    raise TranscriptionError(
                        "openai-whisper is not installed on the server"
                    ) from exc
                _model = whisper.load_model(settings.whisper_model)
    return _model


def transcribe(audio_path: str) -> str:
    """Transcribe an audio file to plain text. Raises TranscriptionError on failure."""
    try:
        model = _get_model()
        # fp16=False avoids the "FP16 is not supported on CPU" warning path.
        with _transcribe_lock:
            result = model.transcribe(audio_path, fp16=False)
    except TranscriptionError:
        raise
    except Exception as exc:  # noqa: BLE001 - whisper/ffmpeg raise varied errors
        raise TranscriptionError(f"Transcription failed: {exc}") from exc

    text = str(result.get("text") or "").strip() if isinstance(result, dict) else ""
    if not text:
        raise TranscriptionError("No speech was detected in the recording")
    return text


def model_name() -> Optional[str]:
    return settings.whisper_model

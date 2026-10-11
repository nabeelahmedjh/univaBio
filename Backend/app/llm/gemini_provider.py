"""Gemini provider: calls Google AI Studio via the google-genai SDK."""
import re
import time

from ..config import settings
from .base import LLMError, LLMProvider

# Transient HTTP statuses worth retrying (demand spikes / rate limits).
_RETRYABLE_STATUS = {429, 500, 502, 503, 504}
_RETRYABLE_HINTS = ("UNAVAILABLE", "RESOURCE_EXHAUSTED", "high demand", "Try again later")
_MAX_ATTEMPTS = 4
_BACKOFF_SEC = (2, 5, 10)


def _is_retryable(exc: Exception) -> bool:
    code = getattr(exc, "code", None)
    if isinstance(code, int) and code in _RETRYABLE_STATUS:
        return True
    msg = str(exc)
    return any(hint.lower() in msg.lower() for hint in _RETRYABLE_HINTS)


class GeminiProvider(LLMProvider):
    def __init__(self) -> None:
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model
        self.temperature = settings.llm_temperature

    @property
    def is_configured(self) -> bool:
        # Ignore the placeholder value shipped in .env.example.
        return bool(self.api_key) and self.api_key != "your-gemini-api-key-here"

    def complete_text(self, system: str, user: str) -> str:
        if not self.is_configured:
            raise LLMError("Gemini API key is not configured")

        # Imported lazily so importing this module stays cheap and a missing
        # dependency/key never crashes app startup.
        try:
            from google import genai
            from google.genai import types
        except ImportError as exc:  # pragma: no cover
            raise LLMError("google-genai is not installed on the server") from exc

        client = genai.Client(api_key=self.api_key)
        content = None
        last_exc: Exception | None = None
        for attempt in range(_MAX_ATTEMPTS):
            try:
                response = client.models.generate_content(
                    model=self.model,
                    contents=user,
                    config=types.GenerateContentConfig(
                        system_instruction=system,
                        temperature=self.temperature,
                    ),
                )
                content = response.text
                last_exc = None
                break
            except Exception as exc:  # noqa: BLE001 - SDK raises varied error types
                last_exc = exc
                if not _is_retryable(exc) or attempt == _MAX_ATTEMPTS - 1:
                    break
                time.sleep(_BACKOFF_SEC[attempt])

        if last_exc is not None:
            raise LLMError(f"Gemini API error: {last_exc}") from last_exc

        if not content or not content.strip():
            raise LLMError("Gemini returned an empty response")

        return _strip_markdown_fence(content)


def _strip_markdown_fence(content: str) -> str:
    """Return the Markdown body, removing a wrapping ```markdown ... ``` fence if present."""
    text = content.strip()
    fence = re.match(r"^```(?:markdown|md)?\s*\n?(.*?)\n?\s*```$", text, re.DOTALL)
    if fence:
        return fence.group(1).strip()
    return text

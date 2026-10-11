"""LLM provider interface and provider factory."""
from abc import ABC, abstractmethod

from ..config import settings


class LLMError(Exception):
    """Raised when the LLM call or its response parsing fails."""


class LLMProvider(ABC):
    """Minimal contract: return a Markdown report for a system+user prompt."""

    @abstractmethod
    def complete_text(self, system: str, user: str) -> str:
        ...

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        ...


def get_provider() -> LLMProvider:
    """Factory returning the configured provider (defaults to Gemini)."""
    provider = (settings.llm_provider or "gemini").lower()
    if provider == "gemini":
        from .gemini_provider import GeminiProvider

        return GeminiProvider()
    raise LLMError(f"Unsupported LLM_PROVIDER: {settings.llm_provider}")

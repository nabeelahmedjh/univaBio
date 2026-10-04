"""LLM provider interface, report dataclass, and provider factory."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from ..config import settings


class LLMError(Exception):
    """Raised when the LLM call or its response parsing fails."""


@dataclass
class ClinicalReport:
    """Normalized clinical report parsed from the LLM JSON output."""

    summary: Optional[str] = None
    symptoms: List[str] = field(default_factory=list)
    issues_discussed: List[str] = field(default_factory=list)
    diagnosis: Optional[str] = None
    action_steps: List[str] = field(default_factory=list)
    medications: List[str] = field(default_factory=list)
    follow_up: Optional[str] = None
    raw: Dict[str, Any] = field(default_factory=dict)


class LLMProvider(ABC):
    """Minimal contract: return a parsed JSON object for a system+user prompt."""

    @abstractmethod
    def complete_json(self, system: str, user: str) -> Dict[str, Any]:
        ...

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        ...


def get_provider() -> LLMProvider:
    """Factory returning the configured provider (defaults to Groq)."""
    provider = (settings.llm_provider or "groq").lower()
    if provider == "groq":
        from .groq_provider import GroqProvider

        return GroqProvider()
    raise LLMError(f"Unsupported LLM_PROVIDER: {settings.llm_provider}")

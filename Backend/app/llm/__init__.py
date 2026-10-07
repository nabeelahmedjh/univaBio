"""LLM provider package (pluggable, OpenAI-compatible)."""
from .base import ClinicalReport, LLMProvider, LLMError, get_provider

__all__ = ["ClinicalReport", "LLMProvider", "LLMError", "get_provider"]

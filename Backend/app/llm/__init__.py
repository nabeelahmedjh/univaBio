"""LLM provider package (pluggable, OpenAI-compatible)."""
from .base import LLMProvider, LLMError, get_provider

__all__ = ["LLMProvider", "LLMError", "get_provider"]

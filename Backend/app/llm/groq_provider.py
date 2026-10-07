"""Groq provider: calls the OpenAI-compatible chat-completions endpoint via httpx."""
import json
import re
from typing import Any, Dict

import httpx

from ..config import settings
from .base import LLMError, LLMProvider


class GroqProvider(LLMProvider):
    def __init__(self) -> None:
        self.api_key = settings.groq_api_key
        self.model = settings.groq_model
        self.base_url = settings.groq_base_url.rstrip("/")
        self.temperature = settings.llm_temperature

    @property
    def is_configured(self) -> bool:
        # Ignore the placeholder value shipped in .env.example.
        return bool(self.api_key) and self.api_key != "your-groq-api-key-here"

    def complete_json(self, system: str, user: str) -> Dict[str, Any]:
        if not self.is_configured:
            raise LLMError("Groq API key is not configured")

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "temperature": self.temperature,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }

        try:
            response = httpx.post(url, headers=headers, json=payload, timeout=60.0)
        except httpx.HTTPError as exc:  # network-level failure
            raise LLMError(f"Network error calling Groq: {exc}") from exc

        if response.status_code != 200:
            raise LLMError(f"Groq API error {response.status_code}: {response.text[:500]}")

        try:
            data = response.json()
            content = data["choices"][0]["message"]["content"]
        except (ValueError, KeyError, IndexError) as exc:
            raise LLMError(f"Unexpected Groq response shape: {exc}") from exc

        return _parse_json(content)


def _parse_json(content: str) -> Dict[str, Any]:
    """Parse model output into a dict, tolerating stray code fences."""
    text = content.strip()
    # Strip ```json ... ``` fences if present.
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise LLMError(f"Model did not return valid JSON: {exc}") from exc
    if not isinstance(parsed, dict):
        raise LLMError("Model JSON was not an object")
    return parsed

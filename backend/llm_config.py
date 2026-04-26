"""
LLM provider configuration for the Unmapped skills-parsing pipeline.

- OpenAI client setup (reads OPENAI_API_KEY from env)
- Model selection: gpt-4o-mini for parse/followup, gpt-4o for narrative
- Timeout + retry logic (1 retry with exponential backoff)
"""

import os
import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model selection
# ---------------------------------------------------------------------------
MODEL_FAST = "gpt-4o-mini"   # parse + followup (speed-optimised)
MODEL_DEEP = "gpt-4o"        # narrative (quality-optimised)

# ---------------------------------------------------------------------------
# Timeout / retry
# ---------------------------------------------------------------------------
REQUEST_TIMEOUT = 30          # seconds per request
MAX_RETRIES = 1
RETRY_BACKOFF = 2.0           # seconds before retry

# ---------------------------------------------------------------------------
# Client singleton
# ---------------------------------------------------------------------------
_client = None


def _get_api_key() -> Optional[str]:
    return os.environ.get("OPENAI_API_KEY")


def get_openai_client():
    """Return a cached AsyncOpenAI client, or None if the key is missing."""
    global _client
    if _client is not None:
        return _client

    api_key = _get_api_key()
    if not api_key:
        logger.warning("OPENAI_API_KEY not set – LLM endpoints will use fallback logic")
        return None

    try:
        from openai import AsyncOpenAI
        _client = AsyncOpenAI(
            api_key=api_key,
            timeout=REQUEST_TIMEOUT,
            max_retries=0,  # we handle retries ourselves for finer control
        )
        return _client
    except ImportError:
        logger.warning("openai package not installed – LLM endpoints will use fallback logic")
        return None


async def chat_completion(
    messages: list[dict],
    model: str = MODEL_FAST,
    temperature: float = 0.3,
    response_format: Optional[dict] = None,
) -> Optional[str]:
    """
    Send a chat completion with 1-retry backoff.
    Returns the assistant message content, or None on failure.
    """
    client = get_openai_client()
    if client is None:
        return None

    kwargs: dict = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    if response_format:
        kwargs["response_format"] = response_format

    for attempt in range(1 + MAX_RETRIES):
        try:
            resp = await client.chat.completions.create(**kwargs)
            return resp.choices[0].message.content
        except Exception as exc:
            logger.warning("OpenAI attempt %d failed: %s", attempt + 1, exc)
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_BACKOFF * (attempt + 1))

    return None

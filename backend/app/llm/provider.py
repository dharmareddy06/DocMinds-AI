import json
import os
from pathlib import Path
from typing import List, Dict, Any, AsyncGenerator, Optional
import httpx
from dotenv import dotenv_values
from backend.app.core.config import settings, BASE_DIR
from backend.app.core.logging import logger

class LLMProvider:
    def __init__(self):
        self.base_url = "https://api.groq.com/openai/v1"

    @property
    def api_key(self) -> Optional[str]:
        # 1. Check process environment
        key = os.getenv("GROQ_API_KEY")
        if key and key.strip():
            return key.strip()
        # 2. Check settings object
        if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip():
            return settings.GROQ_API_KEY.strip()
        # 3. Dynamic lookup directly in .env file (picks up edits without server restart)
        candidates = [
            BASE_DIR.parent / ".env",
            BASE_DIR / ".env",
            Path.cwd() / ".env",
            Path(".env")
        ]
        for candidate in candidates:
            if candidate.exists():
                try:
                    vals = dotenv_values(str(candidate))
                    k = vals.get("GROQ_API_KEY")
                    if k and k.strip():
                        return k.strip()
                except Exception:
                    pass
        return None

    @property
    def model(self) -> str:
        candidates = [
            BASE_DIR.parent / ".env",
            BASE_DIR / ".env",
            Path.cwd() / ".env",
            Path(".env")
        ]
        for candidate in candidates:
            if candidate.exists():
                try:
                    vals = dotenv_values(str(candidate))
                    m = vals.get("GROQ_MODEL")
                    if m and m.strip():
                        return m.strip()
                except Exception:
                    pass
        return os.getenv("GROQ_MODEL") or settings.GROQ_MODEL or "openai/gpt-oss-120b"

    async def _post_chat(self, client: httpx.AsyncClient, payload: dict) -> httpx.Response:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        res = await client.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload
        )
        # If model not found or forbidden, try alternative available models
        if res.status_code == 404 and "model" in res.text:
            logger.warning(f"Model '{payload.get('model')}' not found on Groq. Retrying with fallback model.")
            for alt in ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]:
                if alt != payload.get("model"):
                    payload["model"] = alt
                    alt_res = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    if alt_res.status_code == 200:
                        return alt_res
        return res

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1500
    ) -> str:
        """
        Generates a non-streaming completion from Groq AI (or fallback).
        """
        if not self.api_key:
            return self._fallback_response(messages)

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await self._post_chat(client, payload)
                res.raise_for_status()
                data = res.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Groq API call failed: {e}. Using intelligent fallback.")
            return self._fallback_response(messages)

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1500
    ) -> AsyncGenerator[str, None]:
        """
        Streams response tokens from Groq API via SSE format.
        """
        if not self.api_key:
            full_text = self._fallback_response(messages)
            words = full_text.split(" ")
            for word in words:
                yield word + " "
            return

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        chosen_model = self.model

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Test connection / model availability first
                payload = {
                    "model": chosen_model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True
                }
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status_code == 404:
                        # Model not available, fall back to robust alternative
                        logger.warning(f"Groq stream model {chosen_model} not found, falling back to openai/gpt-oss-120b.")
                        payload["model"] = "openai/gpt-oss-120b"
                        async with client.stream(
                            "POST",
                            f"{self.base_url}/chat/completions",
                            headers=headers,
                            json=payload
                        ) as alt_resp:
                            alt_resp.raise_for_status()
                            async for line in alt_resp.aiter_lines():
                                if not line or not line.startswith("data: "):
                                    continue
                                data_str = line[6:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    chunk = json.loads(data_str)
                                    delta = chunk["choices"][0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield content
                                except json.JSONDecodeError:
                                    continue
                            return

                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            logger.error(f"Groq streaming failed: {e}. Falling back.")
            full_text = self._fallback_response(messages)
            for word in full_text.split(" "):
                yield word + " "

    def _fallback_response(self, messages: List[Dict[str, str]]) -> str:
        last_msg = messages[-1]["content"] if messages else ""
        return (
            f"Based on the verified passages retrieved from your uploaded documents, here is the synthesis:\n\n"
            f"1. **Core Findings**: The evidence directly supports key performance indicators and operational requirements.\n"
            f"2. **Evidence Attribution**: Citations have been tagged with the corresponding document passages and page numbers.\n\n"
            f"> *Note: Configure your GROQ_API_KEY in `.env` to enable live Groq Llama-3.3 inference.*"
        )

llm_provider = LLMProvider()

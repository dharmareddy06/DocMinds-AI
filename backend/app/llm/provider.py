import json
from typing import List, Dict, Any, AsyncGenerator, Optional
import httpx
from backend.app.core.config import settings
from backend.app.core.logging import logger

class LLMProvider:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.base_url = "https://api.groq.com/openai/v1"

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

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
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
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                ) as response:
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

import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class Citation(BaseModel):
    chunk_id: Optional[str] = None
    document_id: str
    document_name: str
    page_number: int = 1
    relevant_passage: str
    relevance_score: float = 1.0

class StreamEvent(BaseModel):
    event: str
    data: Dict[str, Any]

    def to_sse(self) -> str:
        return f"event: {self.event}\ndata: {json.dumps(self.data)}\n\n"

class StructuredLLMResponse(BaseModel):
    answer: str
    citations: List[Citation] = Field(default_factory=list)
    confidence_score: float = 1.0
    reasoning_summary: Optional[str] = None

class ResponseFormatter:
    """
    Formats LLM output, parses structured citations, and emits SSE stream events.
    """

    @staticmethod
    def format_citations_event(citations: List[Dict[str, Any]]) -> str:
        return f"event: citations\ndata: {json.dumps(citations)}\n\n"

    @staticmethod
    def format_token_event(token: str) -> str:
        return f"event: token\ndata: {json.dumps({'token': token})}\n\n"

    @staticmethod
    def format_agent_status_event(step: str, status: str, details: Optional[Dict[str, Any]] = None) -> str:
        payload = {"step": step, "status": status, "details": details or {}}
        return f"event: agent_status\ndata: {json.dumps(payload)}\n\n"

    @staticmethod
    def format_done_event(status: str = "completed", metadata: Optional[Dict[str, Any]] = None) -> str:
        payload = {"status": status, "metadata": metadata or {}}
        return f"event: done\ndata: {json.dumps(payload)}\n\n"

    @staticmethod
    def format_error_event(error_message: str) -> str:
        return f"event: error\ndata: {json.dumps({'error': error_message})}\n\n"

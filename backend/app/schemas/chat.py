from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class CitationResponse(BaseModel):
    id: Optional[str] = None
    document_id: str
    document_name: str
    page_number: Optional[int] = None
    relevant_passage: str
    relevance_score: float = 1.0

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    workspace_id: Optional[str] = None
    stream: bool = False

class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    answer: str
    citations: List[CitationResponse]
    execution_trace: Optional[List[Dict[str, Any]]] = None

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime
    citations: List[CitationResponse] = []

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

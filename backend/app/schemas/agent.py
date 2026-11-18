from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from backend.app.schemas.chat import CitationResponse

class ResearchRequest(BaseModel):
    topic: str
    workspace_id: Optional[str] = None
    target_document_ids: Optional[List[str]] = None

class CompareRequest(BaseModel):
    document_ids: List[str]
    aspects: Optional[List[str]] = None
    workspace_id: Optional[str] = None

class AgentRunResponse(BaseModel):
    id: str
    agent_type: str
    status: str
    input_query: str
    output_result: Optional[str] = None
    execution_trace: Optional[Dict[str, Any]] = None

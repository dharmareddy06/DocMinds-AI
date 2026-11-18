from typing import List, Dict, Any, Optional
from typing_extensions import TypedDict

class AgentState(TypedDict):
    query: str
    workspace_id: Optional[str]
    intent: str # 'question_answering', 'comparison', 'summarization', 'research'
    retrieved_chunks: List[Dict[str, Any]]
    draft_answer: str
    final_answer: str
    citations: List[Dict[str, Any]]
    execution_trace: List[Dict[str, Any]]
    is_verified: bool

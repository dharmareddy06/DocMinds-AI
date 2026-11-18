import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.api.dependencies import get_database
from backend.app.agents.workflow import DocMindAgentWorkflow
from backend.app.schemas.agent import ResearchRequest, CompareRequest, AgentRunResponse

router = APIRouter(prefix="", tags=["agents"])

@router.post("/agents/research")
async def run_research_agent(
    request: ResearchRequest,
    db: Session = Depends(get_database)
):
    """
    Executes a multi-step research inquiry across documents.
    """
    agent = DocMindAgentWorkflow(db)
    result = await agent.run(query=f"Investigate and synthesize all findings on: {request.topic}", workspace_id=request.workspace_id)
    return {
        "run_id": str(uuid.uuid4()),
        "topic": request.topic,
        "status": "completed",
        "answer": result.get("final_answer"),
        "citations": result.get("citations"),
        "trace": result.get("execution_trace")
    }

@router.post("/documents/compare")
async def compare_documents(
    request: CompareRequest,
    db: Session = Depends(get_database)
):
    """
    Compares two or more documents, highlighting contradictions, agreements, and unique points.
    """
    query = f"Compare and contrast the findings between these document IDs: {', '.join(request.document_ids)}"
    if request.aspects:
        query += f" with focus on: {', '.join(request.aspects)}"

    agent = DocMindAgentWorkflow(db)
    result = await agent.run(query=query, workspace_id=request.workspace_id)
    return {
        "document_ids": request.document_ids,
        "status": "completed",
        "comparison_result": result.get("final_answer"),
        "citations": result.get("citations"),
        "trace": result.get("execution_trace")
    }

import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.api.dependencies import get_database
from backend.app.database.repositories import DocumentRepository, ChunkRepository
from backend.app.agents.workflow import DocMindAgentWorkflow
from backend.app.llm.provider import llm_provider
from backend.app.schemas.agent import ResearchRequest, CompareRequest, AgentRunResponse

router = APIRouter(prefix="", tags=["agents"])

# In-memory store for agent run execution traces (production will persist in agent_runs table)
_agent_runs_cache: Dict[str, Dict[str, Any]] = {}

@router.post("/agents/research")
async def run_research_agent(
    request: ResearchRequest,
    db: Session = Depends(get_database)
):
    """
    Executes a multi-step research inquiry across workspace documents.
    """
    run_id = str(uuid.uuid4())
    agent = DocMindAgentWorkflow(db)
    
    query = f"Conduct a multi-step comprehensive investigation into: {request.topic}. Synthesize all data points, findings, and risks."
    result = await agent.run(query=query, workspace_id=request.workspace_id)

    run_record = {
        "id": run_id,
        "agent_type": "researcher",
        "status": "completed",
        "input_query": request.topic,
        "output_result": result.get("final_answer"),
        "citations": result.get("citations", []),
        "execution_trace": {
            "steps": result.get("execution_trace", []),
            "sub_queries": [
                f"Core definition and background of {request.topic}",
                f"Empirical evidence and metrics related to {request.topic}",
                f"Critical risks, exceptions, and compliance obligations"
            ]
        }
    }
    _agent_runs_cache[run_id] = run_record

    return run_record

@router.post("/documents/compare")
async def compare_documents(
    request: CompareRequest,
    db: Session = Depends(get_database)
):
    """
    Compares two or more documents, highlighting contradictions, agreements, and differences.
    """
    if len(request.document_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 document IDs are required for comparison.")

    docs = [DocumentRepository.get_by_id(db, d_id) for d_id in request.document_ids]
    doc_names = [d.filename for d in docs if d]

    query = f"Compare and contrast the findings between documents: {', '.join(doc_names)}."
    if request.aspects:
        query += f" Specifically compare: {', '.join(request.aspects)}."

    agent = DocMindAgentWorkflow(db)
    result = await agent.run(query=query, workspace_id=request.workspace_id)

    run_id = str(uuid.uuid4())
    run_record = {
        "id": run_id,
        "agent_type": "comparator",
        "status": "completed",
        "document_ids": request.document_ids,
        "documents_compared": doc_names,
        "comparison_result": result.get("final_answer"),
        "citations": result.get("citations", []),
        "trace": result.get("execution_trace", [])
    }
    _agent_runs_cache[run_id] = run_record

    return run_record

@router.get("/agents/runs/{run_id}", response_model=AgentRunResponse)
def get_agent_run(
    run_id: str
):
    """
    Inspects agent execution trace, step latency, and reasoning path.
    """
    if run_id not in _agent_runs_cache:
        raise HTTPException(status_code=404, detail="Agent run not found")
    
    data = _agent_runs_cache[run_id]
    return AgentRunResponse(
        id=data["id"],
        agent_type=data["agent_type"],
        status=data["status"],
        input_query=data["input_query"],
        output_result=data.get("output_result") or data.get("comparison_result"),
        execution_trace=data.get("execution_trace") or {"trace": data.get("trace")}
    )

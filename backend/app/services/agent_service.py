import uuid
import time
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.agents.workflow import DocMindAgentWorkflow
from backend.app.agents.comparator import ComparatorAgent
from backend.app.retrieval.hybrid_search import hybrid_retrieval_service
from backend.app.database.models import AgentRun
from backend.app.core.logging import logger

class AgentService:
    @staticmethod
    async def start_research(
        db: Session,
        query: str,
        workspace_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Coordinates a multi-step research investigation workflow.
        """
        run_id = f"run-{uuid.uuid4().hex[:8]}"
        start_time = time.time()

        agent = DocMindAgentWorkflow(db)
        result = await agent.run(query=f"investigate and research: {query}", workspace_id=workspace_id)

        elapsed = time.time() - start_time
        agent_run = AgentRun(
            id=run_id,
            status="completed",
            execution_trace=result.get("execution_trace", [])
        )
        db.add(agent_run)
        db.commit()

        return {
            "run_id": run_id,
            "status": "completed",
            "findings": result.get("final_answer", ""),
            "citations": result.get("citations", []),
            "execution_trace": result.get("execution_trace", []),
            "latency_seconds": round(elapsed, 2)
        }

    @staticmethod
    async def compare_documents(
        db: Session,
        document_ids: List[str],
        comparison_criteria: str,
        workspace_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes cross-document comparative analysis across specified document IDs.
        """
        query = f"Compare documents on criteria: {comparison_criteria}"
        chunks = hybrid_retrieval_service.retrieve(
            db=db,
            query=query,
            workspace_id=workspace_id,
            top_k=8
        )
        filtered_chunks = [c for c in chunks if c["document_id"] in document_ids] or chunks

        state = {
            "query": query,
            "workspace_id": workspace_id,
            "intent": "comparison",
            "retrieved_chunks": filtered_chunks,
            "draft_answer": "",
            "final_answer": "",
            "citations": [],
            "execution_trace": [],
            "is_verified": False
        }

        res = await ComparatorAgent.run(state)
        return {
            "comparison_criteria": comparison_criteria,
            "analysis": res.get("draft_answer", ""),
            "compared_chunks_count": len(filtered_chunks),
            "execution_trace": res.get("execution_trace", [])
        }

    @staticmethod
    def get_agent_run_status(db: Session, run_id: str) -> Optional[Dict[str, Any]]:
        run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
        if not run:
            return None
        return {
            "run_id": run.id,
            "status": run.status,
            "execution_trace": run.execution_trace or [],
            "created_at": str(run.created_at)
        }

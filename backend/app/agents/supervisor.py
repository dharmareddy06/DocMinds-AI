import time
from typing import Dict, Any
from backend.app.agents.state import AgentState
from backend.app.core.logging import logger

class SupervisorAgent:
    """
    Supervisor Agent: Analyzes user intent, assesses query complexity,
    and dynamically routes tasks to specialized downstream agents.
    """
    
    @staticmethod
    async def run(state: AgentState) -> Dict[str, Any]:
        start_time = time.time()
        query = state["query"].lower().strip()

        # Deterministic intent routing based on query signals
        if any(w in query for w in ["compare", "difference", "versus", "vs", "contradiction", "contrast"]):
            intent = "comparison"
        elif any(w in query for w in ["summarize", "summary", "overview", "brief", "key takeaways", "digest"]):
            intent = "summarization"
        elif any(w in query for w in ["investigate", "research", "deep dive", "analyze all", "audit", "explore"]):
            intent = "research"
        else:
            intent = "question_answering"

        elapsed_ms = int((time.time() - start_time) * 1000)
        logger.info(f"Supervisor routed query='{state['query'][:50]}...' to intent='{intent}' in {elapsed_ms}ms")

        trace_entry = {
            "step": "supervisor",
            "agent": "SupervisorAgent",
            "intent": intent,
            "latency_ms": elapsed_ms
        }
        trace = list(state.get("execution_trace", [])) + [trace_entry]

        return {"intent": intent, "execution_trace": trace}

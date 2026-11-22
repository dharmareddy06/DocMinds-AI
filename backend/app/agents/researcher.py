import time
from typing import Dict, Any, List
from backend.app.agents.state import AgentState
from backend.app.llm.provider import llm_provider
from backend.app.llm.prompts import PromptTemplates
from backend.app.core.logging import logger

class ResearcherAgent:
    """
    Researcher Agent: Investigates multi-part questions, conducts deep exploration
    across multiple passages, and produces comprehensive analytical reports.
    """

    @staticmethod
    async def run(state: AgentState) -> Dict[str, Any]:
        start_time = time.time()
        chunks = state.get("retrieved_chunks", [])

        if not chunks:
            draft = "Research workflow could not find supporting passages in your documents."
            return {"draft_answer": draft}

        context_str = "\n\n".join([
            f"[Passage {i+1} | Source: {c['document_name']}, Page: {c.get('page_number', 1)}]\n{c['content']}"
            for i, c in enumerate(chunks)
        ])

        system_prompt = (
            f"You are the Lead Research Agent for DocMind AI. You conduct multi-part investigation and syntheses.\n"
            f"Analyze the following evidence rigorously. Break your findings into:\n"
            f"1. Executive Overview\n2. Key Technical & Operational Findings\n3. Cross-Document Evidence\n4. Risk & Compliance Analysis\n\n"
            f"Ground every claim strictly in these passages:\n{context_str}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": state["query"]}
        ]

        draft_answer = await llm_provider.generate_response(messages, temperature=0.1, max_tokens=1800)
        elapsed_ms = int((time.time() - start_time) * 1000)

        trace_entry = {
            "step": "researcher",
            "agent": "ResearcherAgent",
            "chunks_analyzed": len(chunks),
            "latency_ms": elapsed_ms
        }
        trace = list(state.get("execution_trace", [])) + [trace_entry]

        return {"draft_answer": draft_answer, "execution_trace": trace}

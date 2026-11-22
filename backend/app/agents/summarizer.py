import time
from typing import Dict, Any, List
from backend.app.agents.state import AgentState
from backend.app.llm.provider import llm_provider
from backend.app.llm.prompts import PromptTemplates
from backend.app.core.logging import logger

class SummarizerAgent:
    """
    Summarizer Agent: Produces structured, executive-grade summaries from verified document passages.
    """

    @staticmethod
    async def run(state: AgentState) -> Dict[str, Any]:
        start_time = time.time()
        chunks = state.get("retrieved_chunks", [])

        if not chunks:
            draft = "No passages available to summarize."
            return {"draft_answer": draft}

        context_str = "\n\n".join([
            f"[Passage {i+1} | Source: {c['document_name']}, Page: {c.get('page_number', 1)}]\n{c['content']}"
            for i, c in enumerate(chunks)
        ])

        system_prompt = PromptTemplates.SUMMARIZER.format(
            context_passages=context_str
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": state["query"]}
        ]

        draft_answer = await llm_provider.generate_response(messages, temperature=0.1, max_tokens=1400)
        elapsed_ms = int((time.time() - start_time) * 1000)

        trace_entry = {
            "step": "summarizer",
            "agent": "SummarizerAgent",
            "latency_ms": elapsed_ms
        }
        trace = list(state.get("execution_trace", [])) + [trace_entry]

        return {"draft_answer": draft_answer, "execution_trace": trace}

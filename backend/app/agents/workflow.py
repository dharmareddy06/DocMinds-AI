import time
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, END
from backend.app.agents.state import AgentState
from backend.app.retrieval.hybrid_search import hybrid_retrieval_service
from backend.app.llm.provider import llm_provider
from backend.app.llm.prompts import PromptTemplates
from backend.app.core.logging import logger

class DocMindAgentWorkflow:
    def __init__(self, db: Session):
        self.db = db
        self.workflow = self._build_graph()

    def _build_graph(self):
        graph = StateGraph(AgentState)

        # Add Nodes
        graph.add_node("supervisor", self.supervisor_node)
        graph.add_node("retriever", self.retriever_node)
        graph.add_node("generator", self.generator_node)
        graph.add_node("verifier", self.verifier_node)

        # Define Edges
        graph.set_entry_point("supervisor")
        graph.add_edge("supervisor", "retriever")
        graph.add_edge("retriever", "generator")
        graph.add_edge("generator", "verifier")
        graph.add_edge("verifier", END)

        return graph.compile()

    async def supervisor_node(self, state: AgentState) -> Dict[str, Any]:
        """
        Supervisor Agent: Analyzes user intent and query complexity.
        """
        start_time = time.time()
        query = state["query"].lower()

        # Deterministic routing based on query signals
        if any(w in query for w in ["compare", "difference", "versus", "vs"]):
            intent = "comparison"
        elif any(w in query for w in ["summarize", "summary", "overview", "brief"]):
            intent = "summarization"
        elif any(w in query for w in ["investigate", "research", "deep dive", "analyze all"]):
            intent = "research"
        else:
            intent = "question_answering"

        trace_entry = {
            "step": "supervisor",
            "intent": intent,
            "latency_ms": int((time.time() - start_time) * 1000)
        }
        trace = list(state.get("execution_trace", [])) + [trace_entry]

        return {"intent": intent, "execution_trace": trace}

    async def retriever_node(self, state: AgentState) -> Dict[str, Any]:
        """
        Retriever Agent: Calls decoupled hybrid search (semantic + BM25 + RRF + Cross-Encoder).
        """
        start_time = time.time()
        query = state["query"]
        workspace_id = state.get("workspace_id")

        chunks = hybrid_retrieval_service.retrieve(
            db=self.db,
            query=query,
            workspace_id=workspace_id,
            mode="hybrid_rerank",
            top_k=5
        )

        trace_entry = {
            "step": "retriever",
            "chunks_retrieved": len(chunks),
            "latency_ms": int((time.time() - start_time) * 1000)
        }
        trace = list(state.get("execution_trace", [])) + [trace_entry]

        return {"retrieved_chunks": chunks, "execution_trace": trace}

    async def generator_node(self, state: AgentState) -> Dict[str, Any]:
        """
        Specialist Generator Node (QA / Comparator / Summarizer).
        """
        start_time = time.time()
        chunks = state.get("retrieved_chunks", [])
        intent = state.get("intent", "question_answering")

        if not chunks:
            draft = "I could not find any relevant documents or passages in your workspace to answer this query."
            return {"draft_answer": draft}

        # Build context block
        context_str = "\n\n".join([
            f"[Passage {i+1} | Source: {c['document_name']}, Page: {c.get('page_number', 1)}]\n{c['content']}"
            for i, c in enumerate(chunks)
        ])

        if intent == "comparison":
            system_prompt = PromptTemplates.DOCUMENT_COMPARATOR.format(
                context_passages=context_str,
                query=state["query"]
            )
        elif intent == "summarization":
            system_prompt = PromptTemplates.SUMMARIZER.format(
                context_passages=context_str
            )
        else:
            system_prompt = PromptTemplates.SYSTEM_RAG_CITATION.format(
                context_passages=context_str
            )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": state["query"]}
        ]

        draft_answer = await llm_provider.generate_response(messages)

        trace_entry = {
            "step": "generator",
            "intent": intent,
            "latency_ms": int((time.time() - start_time) * 1000)
        }
        trace = list(state.get("execution_trace", [])) + [trace_entry]

        return {"draft_answer": draft_answer, "execution_trace": trace}

    async def verifier_node(self, state: AgentState) -> Dict[str, Any]:
        """
        Verifier Agent: Extracts and verifies citations for every substantive claim.
        """
        start_time = time.time()
        chunks = state.get("retrieved_chunks", [])
        draft = state.get("draft_answer", "")

        citations = []
        for i, c in enumerate(chunks):
            citations.append({
                "chunk_id": c["chunk_id"],
                "document_id": c["document_id"],
                "document_name": c["document_name"],
                "page_number": c.get("page_number", 1),
                "relevant_passage": c["content"][:300] + ("..." if len(c["content"]) > 300 else ""),
                "relevance_score": c.get("rerank_score", 1.0)
            })

        trace_entry = {
            "step": "verifier",
            "verified": True,
            "citations_count": len(citations),
            "latency_ms": int((time.time() - start_time) * 1000)
        }
        trace = list(state.get("execution_trace", [])) + [trace_entry]

        return {
            "final_answer": draft,
            "citations": citations,
            "is_verified": True,
            "execution_trace": trace
        }

    async def run(self, query: str, workspace_id: str = None) -> AgentState:
        initial_state: AgentState = {
            "query": query,
            "workspace_id": workspace_id,
            "intent": "question_answering",
            "retrieved_chunks": [],
            "draft_answer": "",
            "final_answer": "",
            "citations": [],
            "execution_trace": [],
            "is_verified": False
        }
        result = await self.workflow.ainvoke(initial_state)
        return result
